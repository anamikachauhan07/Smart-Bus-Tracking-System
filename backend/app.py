from flask import Flask, request, jsonify, session
from flask_cors import CORS
from flask_session import Session
import random
import hashlib
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os

from db import get_db, get_next_id, format_doc, format_datetime, format_time

load_dotenv()

app = Flask(__name__)

app.config["SECRET_KEY"] = os.getenv("FLASK_SECRET_KEY", "smartbus_default_secret_key")
app.config["SESSION_TYPE"] = os.getenv("SESSION_TYPE", "filesystem")
app.config["SESSION_PERMANENT"] = os.getenv("SESSION_PERMANENT", "True") == "True"
app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(days=int(os.getenv("SESSION_LIFETIME_DAYS", "7")))
app.config["SESSION_COOKIE_HTTPONLY"] = os.getenv("SESSION_COOKIE_HTTPONLY", "True") == "True"
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_SECURE"] = False

CORS(
    app,
    supports_credentials=True,
    origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_headers=["Content-Type", "Authorization"],
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
)


@app.after_request
def after_request(response):
    origin = request.headers.get("Origin")
    allowed_origins = ["http://localhost:5173", "http://127.0.0.1:5173"]

    if origin in allowed_origins:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"

    return response


Session(app)

DAY_ORDER = {
    "Monday": 0,
    "Tuesday": 1,
    "Wednesday": 2,
    "Thursday": 3,
    "Friday": 4,
    "Saturday": 5,
    "Sunday": 6,
}


def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()


def is_logged_in():
    return "user_id" in session and "user_type" in session


def get_bus_by_id(bus_id):
    return get_db().buses.find_one({"B_ID": bus_id}, {"_id": 0})


@app.route("/")
def home():
    return {"message": "Smart Bus Tracking API Running", "version": "1.0", "database": "mongodb"}


@app.route("/auth/register", methods=["POST"])
def register():
    try:
        data = request.json
        username = data.get("username")
        email = data.get("email")
        password = data.get("password")
        user_type = data.get("user_type")

        if not all([username, email, password, user_type]):
            return jsonify({"success": False, "error": "All fields are required"}), 400

        if user_type not in ["student", "driver"]:
            return jsonify({"success": False, "error": "Invalid user type"}), 400

        db = get_db()

        if db.user_accounts.find_one({"$or": [{"USERNAME": username}, {"EMAIL": email}]}):
            return jsonify({"success": False, "error": "Username or email already exists"}), 400

        user_id = get_next_id("USER_ID")
        db.user_accounts.insert_one(
            {
                "USER_ID": user_id,
                "USERNAME": username,
                "EMAIL": email,
                "PASSWORD_HASH": hash_password(password),
                "USER_TYPE": user_type,
                "IS_ACTIVE": True,
                "CREATED_AT": datetime.utcnow(),
            }
        )

        if user_type == "driver":
            db.drivers.insert_one(
                {
                    "DRIVER_ID": get_next_id("DRIVER_ID"),
                    "USER_ID": user_id,
                    "B_ID": None,
                    "LICENSE_NUMBER": data.get("license_number", ""),
                    "EXPERIENCE_YEARS": data.get("experience_years", 0),
                }
            )

        return jsonify({"success": True, "message": f"{user_type.title()} registered successfully!"})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/auth/login", methods=["POST"])
def login():
    try:
        data = request.json
        username = data.get("username")
        password = data.get("password")

        if not username or not password:
            return jsonify({"success": False, "error": "Username and password are required"}), 400

        db = get_db()
        user = db.user_accounts.find_one(
            {
                "USERNAME": username,
                "PASSWORD_HASH": hash_password(password),
                "IS_ACTIVE": True,
            },
            {"_id": 0},
        )

        if not user:
            return jsonify({"success": False, "error": "Invalid credentials"}), 401

        session["user_id"] = user["USER_ID"]
        session["username"] = user["USERNAME"]
        session["email"] = user["EMAIL"]
        session["user_type"] = user["USER_TYPE"]
        session.permanent = True

        user_info = {
            "user_id": user["USER_ID"],
            "username": user["USERNAME"],
            "email": user["EMAIL"],
            "user_type": user["USER_TYPE"],
        }

        if user["USER_TYPE"] == "driver":
            driver_info = db.drivers.find_one({"USER_ID": user["USER_ID"]}, {"_id": 0})
            if driver_info:
                user_info["driver_info"] = driver_info

        return jsonify({"success": True, "message": "Login successful!", "user": user_info})

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/auth/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"success": True, "message": "Logged out successfully"})


@app.route("/auth/status", methods=["GET"])
def auth_status():
    if is_logged_in():
        return jsonify(
            {
                "success": True,
                "logged_in": True,
                "user": {
                    "user_id": session.get("user_id"),
                    "username": session.get("username"),
                    "email": session.get("email"),
                    "user_type": session.get("user_type"),
                },
            }
        )
    return jsonify({"success": True, "logged_in": False})


@app.route("/routes", methods=["GET"])
def get_routes():
    try:
        routes = list(get_db().routes.find({}, {"_id": 0}))
        return jsonify({"success": True, "data": routes})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/stops/<int:route_id>", methods=["GET"])
def get_stops(route_id):
    try:
        stops = list(
            get_db().stops.find({"R_ID": route_id}, {"_id": 0}).sort("STOP_ID", 1)
        )
        return jsonify({"success": True, "data": stops})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/buses", methods=["GET"])
def get_buses():
    try:
        buses = list(get_db().buses.find({}, {"_id": 0}))
        return jsonify({"success": True, "data": buses})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/buses/route/<int:route_id>", methods=["GET"])
def get_buses_by_route(route_id):
    try:
        db = get_db()
        buses = list(db.buses.find({"R_ID": route_id}, {"_id": 0}))
        if not buses:
            buses = list(db.buses.find({}, {"_id": 0}))
        return jsonify({"success": True, "data": buses})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/student-register", methods=["POST"])
def register_student():
    try:
        data = request.json
        db = get_db()

        db.students.insert_one(
            {
                "S_ID": get_next_id("S_ID"),
                "S_NAME": data["name"],
                "S_EMAIL": data["email"],
                "S_PHONE": data.get("phone", ""),
                "R_ID": data["route_id"],
                "STOP_ID": data["stop_id"],
                "NOTIFY_EMAIL": True,
                "NOTIFY_SMS": False,
                "NOTIFY_PUSH": True,
                "REGISTRATION_DATE": datetime.utcnow(),
            }
        )

        return jsonify({"success": True, "message": "Student registered successfully!"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/student/details/<email>", methods=["GET"])
def get_student_details(email):
    try:
        db = get_db()
        student = db.students.find_one({"S_EMAIL": email}, {"_id": 0})

        if not student:
            return jsonify(
                {"success": False, "message": "Student not found or not registered for bus service"}
            )

        route = db.routes.find_one({"R_ID": student.get("R_ID")}, {"_id": 0}) or {}
        stop = db.stops.find_one({"STOP_ID": student.get("STOP_ID")}, {"_id": 0}) or {}

        result = {
            "S_ID": student.get("S_ID"),
            "S_NAME": student.get("S_NAME"),
            "S_EMAIL": student.get("S_EMAIL"),
            "S_PHONE": student.get("S_PHONE"),
            "R_ID": route.get("R_ID"),
            "R_NAME": route.get("R_NAME"),
            "START_POINT": route.get("START_POINT"),
            "END_POINT": route.get("END_POINT"),
            "DISTANCE": route.get("DISTANCE"),
            "STOP_ID": stop.get("STOP_ID"),
            "STOP_NAME": stop.get("STOP_NAME"),
            "LOCATION": stop.get("LOCATION"),
            "STOP_ORDER": stop.get("STOP_ORDER"),
        }

        if student.get("REGISTRATION_DATE"):
            result["REGISTRATION_DATE"] = format_datetime(student["REGISTRATION_DATE"])

        return jsonify({"success": True, "data": result})
    except Exception as e:
        print(f"Error in get_student_details: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/schedule/<int:route_id>", methods=["GET"])
def get_schedule(route_id):
    try:
        db = get_db()
        schedules = list(db.schedules.find({"R_ID": route_id}, {"_id": 0}))

        enriched = []
        for schedule in schedules:
            bus = get_bus_by_id(schedule.get("B_ID")) or {}
            enriched.append(
                {
                    "SCH_ID": schedule.get("SCH_ID"),
                    "B_ID": schedule.get("B_ID"),
                    "B_NO": bus.get("B_NO"),
                    "D_NAME": bus.get("D_NAME"),
                    "D_TIME": format_time(schedule.get("D_TIME")),
                    "A_TIME": format_time(schedule.get("A_TIME")),
                    "DAY": schedule.get("DAY"),
                }
            )

        enriched.sort(
            key=lambda item: (
                DAY_ORDER.get(item.get("DAY"), 99),
                item.get("D_TIME") or "",
            )
        )

        return jsonify({"success": True, "data": enriched})
    except Exception as e:
        print(e)
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/bus-location/<int:bus_id>", methods=["GET"])
def get_bus_location(bus_id):
    try:
        db = get_db()
        location = db.tracking.find_one({"B_ID": bus_id}, sort=[("TIMESTAMP", -1)])

        if not location:
            return jsonify({"success": False, "message": "No tracking data available"})

        bus = get_bus_by_id(bus_id) or {}
        data = format_doc(location)
        data["B_NO"] = bus.get("B_NO")
        data["D_NAME"] = bus.get("D_NAME")

        return jsonify({"success": True, "data": data})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/track/<int:bus_id>", methods=["POST"])
def track_bus(bus_id):
    try:
        lat = 28.60 + random.uniform(-0.01, 0.01)
        lon = 77.20 + random.uniform(-0.01, 0.01)
        now = datetime.utcnow()

        get_db().tracking.insert_one(
            {
                "T_ID": get_next_id("T_ID"),
                "B_ID": bus_id,
                "TIMESTAMP": now,
                "LATITUDE": lat,
                "LONGITUDE": lon,
            }
        )

        return jsonify(
            {
                "success": True,
                "message": f"Bus {bus_id} location updated",
                "data": {"lat": lat, "lon": lon, "timestamp": now.isoformat()},
            }
        )
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/tracking-history/<int:bus_id>", methods=["GET"])
def get_tracking_history(bus_id):
    try:
        history = list(
            get_db()
            .tracking.find({"B_ID": bus_id}, {"_id": 0})
            .sort("TIMESTAMP", -1)
            .limit(10)
        )
        history = [format_doc(item) for item in history]
        return jsonify({"success": True, "data": history})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/update-location", methods=["POST"])
def update_location():
    try:
        if not is_logged_in():
            return jsonify({"success": False, "error": "Authentication required"}), 401

        if session.get("user_type") != "driver":
            return jsonify({"success": False, "error": "Driver access required"}), 403

        data = request.json
        bus_id = data.get("bus_id")
        latitude = data.get("latitude")
        longitude = data.get("longitude")

        if not all([bus_id, latitude, longitude]):
            return jsonify({"success": False, "error": "Missing required fields"}), 400

        get_db().tracking.insert_one(
            {
                "T_ID": get_next_id("T_ID"),
                "B_ID": int(bus_id),
                "TIMESTAMP": datetime.utcnow(),
                "LATITUDE": float(latitude),
                "LONGITUDE": float(longitude),
                "CURRENT_STOP_ID": data.get("current_stop_id"),
            }
        )

        return jsonify({"success": True, "message": "Location updated successfully"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/all-bus-locations", methods=["GET"])
def get_all_bus_locations():
    try:
        db = get_db()
        locations = []

        for bus in db.buses.find({}, {"_id": 0}):
            latest = db.tracking.find_one({"B_ID": bus["B_ID"]}, sort=[("TIMESTAMP", -1)])
            if not latest or latest.get("LATITUDE") is None:
                continue

            locations.append(
                {
                    "B_ID": bus["B_ID"],
                    "B_NO": bus["B_NO"],
                    "D_NAME": bus["D_NAME"],
                    "LATITUDE": latest["LATITUDE"],
                    "LONGITUDE": latest["LONGITUDE"],
                    "TIMESTAMP": format_datetime(latest.get("TIMESTAMP")),
                }
            )

        return jsonify({"success": True, "data": locations})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/notifications/<int:student_id>", methods=["GET"])
def get_notifications(student_id):
    try:
        unread_only = request.args.get("unread_only", "false").lower() == "true"
        limit = int(request.args.get("limit", 20))

        db = get_db()
        query = {"S_ID": student_id}
        if unread_only:
            query["IS_READ"] = False

        notifications = list(
            db.notifications.find(query, {"_id": 0}).sort("CREATED_AT", -1).limit(limit)
        )

        enriched = []
        for notification in notifications:
            bus = get_bus_by_id(notification.get("B_ID")) or {}
            item = format_doc(notification)
            item["B_NO"] = bus.get("B_NO")
            item["DRIVER_NAME"] = bus.get("D_NAME")
            enriched.append(item)

        unread_count = db.notifications.count_documents({"S_ID": student_id, "IS_READ": False})

        return jsonify({"success": True, "data": enriched, "unread_count": unread_count})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/notifications/<int:notification_id>/read", methods=["PUT"])
def mark_notification_read(notification_id):
    try:
        get_db().notifications.update_one({"N_ID": notification_id}, {"$set": {"IS_READ": True}})
        return jsonify({"success": True, "message": "Notification marked as read"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/notifications/student/<int:student_id>/read-all", methods=["PUT"])
def mark_all_notifications_read(student_id):
    try:
        get_db().notifications.update_many({"S_ID": student_id}, {"$set": {"IS_READ": True}})
        return jsonify({"success": True, "message": "All notifications marked as read"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/notifications/<int:notification_id>", methods=["DELETE"])
def delete_notification(notification_id):
    try:
        get_db().notifications.delete_one({"N_ID": notification_id})
        return jsonify({"success": True, "message": "Notification deleted"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/notifications/create", methods=["POST"])
def create_notification():
    try:
        data = request.json
        notification_id = get_next_id("N_ID")

        get_db().notifications.insert_one(
            {
                "N_ID": notification_id,
                "S_ID": data["student_id"],
                "B_ID": data["bus_id"],
                "MESSAGE": data["message"],
                "TYPE": data.get("type", "general"),
                "IS_READ": False,
                "CREATED_AT": datetime.utcnow(),
            }
        )

        return jsonify(
            {
                "success": True,
                "message": "Notification created",
                "notification_id": notification_id,
            }
        )
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


if __name__ == "__main__":
    debug_mode = os.getenv("FLASK_DEBUG", "True") == "True"
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", "5000"))

    app.run(debug=debug_mode, host=host, port=port)
