"""
Notification Service for Smart Bus Tracking System
Monitors bus positions and sends notifications to students
when their bus is 2 stops away from their pickup/dropoff point
"""

import math
import time
from datetime import datetime, timedelta

from dotenv import load_dotenv

from db import get_db, get_next_id, format_doc

load_dotenv()


def calculate_distance(lat1, lon1, lat2, lon2):
    radius = 6371

    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_lat / 2) ** 2
        + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return radius * c


def find_closest_stop(db, route_id):
    stops = list(db.stops.find({"R_ID": route_id}, {"_id": 0}).sort("STOP_ORDER", 1))
    if not stops:
        return None, None

    middle_index = len(stops) // 2
    stop = stops[middle_index]
    return stop.get("STOP_ID"), stop.get("STOP_ORDER")


def get_students_on_route(db, route_id):
    return list(
        db.students.find(
            {"R_ID": route_id},
            {"_id": 0, "S_ID": 1, "S_NAME": 1, "S_EMAIL": 1, "STOP_ID": 1, "NOTIFY_PUSH": 1, "NOTIFY_EMAIL": 1},
        )
    )


def get_stop_order(db, stop_id):
    stop = db.stops.find_one({"STOP_ID": stop_id}, {"_id": 0, "STOP_ORDER": 1, "STOP_NAME": 1})
    if not stop:
        return None, None
    return stop.get("STOP_ORDER"), stop.get("STOP_NAME")


def create_notification(db, student_id, bus_id, message, notification_type="pickup"):
    recent_cutoff = datetime.utcnow() - timedelta(minutes=30)
    existing = db.notifications.find_one(
        {
            "S_ID": student_id,
            "B_ID": bus_id,
            "TYPE": notification_type,
            "CREATED_AT": {"$gte": recent_cutoff},
        }
    )
    if existing:
        return False

    db.notifications.insert_one(
        {
            "N_ID": get_next_id("N_ID"),
            "S_ID": student_id,
            "B_ID": bus_id,
            "MESSAGE": message,
            "TYPE": notification_type,
            "IS_READ": False,
            "CREATED_AT": datetime.utcnow(),
        }
    )
    return True


def check_and_notify_students():
    db = get_db()
    notifications_sent = 0
    recent_cutoff = datetime.utcnow() - timedelta(minutes=10)

    latest_by_bus = {}
    for record in db.tracking.find({"TIMESTAMP": {"$gte": recent_cutoff}}).sort("TIMESTAMP", -1):
        bus_id = record.get("B_ID")
        if bus_id not in latest_by_bus:
            latest_by_bus[bus_id] = record

    for bus_id, tracking in latest_by_bus.items():
        bus = db.buses.find_one({"B_ID": bus_id}, {"_id": 0})
        if not bus or not bus.get("R_ID"):
            continue

        route_id = bus["R_ID"]
        current_stop_id = tracking.get("CURRENT_STOP_ID")

        if not current_stop_id:
            current_stop_id, current_stop_order = find_closest_stop(db, route_id)
            if current_stop_id:
                db.tracking.update_one(
                    {"_id": tracking["_id"]},
                    {"$set": {"CURRENT_STOP_ID": current_stop_id}},
                )
        else:
            current_stop_order, _ = get_stop_order(db, current_stop_id)

        if not current_stop_order:
            continue

        target_stop_order = current_stop_order + 2
        students = get_students_on_route(db, route_id)

        for student in students:
            student_stop_order, student_stop_name = get_stop_order(db, student["STOP_ID"])
            if not student_stop_order:
                continue

            if student_stop_order == target_stop_order and student.get("NOTIFY_PUSH", True):
                message = (
                    f"Your bus {bus['B_NO']} is approaching! "
                    f"It will reach {student_stop_name} in 2 stops. Get ready!"
                )
                if create_notification(db, student["S_ID"], bus_id, message, "pickup"):
                    notifications_sent += 1
                    print(f"Notification sent to {student['S_NAME']} for bus {bus['B_NO']}")

    if notifications_sent > 0:
        print(f"\nSent {notifications_sent} notifications")


def run_notification_service(interval=10):
    print("=" * 60)
    print("SMART BUS NOTIFICATION SERVICE")
    print("=" * 60)
    print(f"Checking for notifications every {interval} seconds...")
    print("Press Ctrl+C to stop\n")

    try:
        while True:
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            print(f"[{timestamp}] Checking for notifications...")
            check_and_notify_students()
            time.sleep(interval)
    except KeyboardInterrupt:
        print("\n\nNotification service stopped")
    except Exception as e:
        print(f"\nError: {e}")


def get_student_notifications(student_id, limit=20, unread_only=False):
    db = get_db()
    query = {"S_ID": student_id}
    if unread_only:
        query["IS_READ"] = False

    notifications = list(
        db.notifications.find(query, {"_id": 0}).sort("CREATED_AT", -1).limit(limit)
    )

    enriched = []
    for notification in notifications:
        bus = db.buses.find_one({"B_ID": notification.get("B_ID")}, {"_id": 0}) or {}
        item = format_doc(notification)
        item["B_NO"] = bus.get("B_NO")
        item["DRIVER_NAME"] = bus.get("D_NAME")
        enriched.append(item)

    return enriched


def mark_notification_read(notification_id):
    result = get_db().notifications.update_one({"N_ID": notification_id}, {"$set": {"IS_READ": True}})
    return result.modified_count > 0


def mark_all_read(student_id):
    result = get_db().notifications.update_many({"S_ID": student_id}, {"$set": {"IS_READ": True}})
    return result.modified_count >= 0


if __name__ == "__main__":
    run_notification_service(interval=10)
