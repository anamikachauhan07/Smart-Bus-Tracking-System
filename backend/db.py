import os
from datetime import datetime

import certifi
from dotenv import load_dotenv
from pymongo import MongoClient, ReturnDocument
from pymongo.errors import ServerSelectionTimeoutError

load_dotenv()

_client = None


def _env_bool(name: str, default: bool = False) -> bool:
    return os.getenv(name, str(default)).strip().lower() in {"1", "true", "yes", "on"}


def _build_client_options() -> dict:
    options = {
        "serverSelectionTimeoutMS": int(os.getenv("MONGODB_TIMEOUT_MS", "30000")),
        "connectTimeoutMS": int(os.getenv("MONGODB_CONNECT_TIMEOUT_MS", "30000")),
    }

    uri = os.getenv("MONGODB_URI", "")
    if uri.startswith("mongodb+srv://") or _env_bool("MONGODB_TLS", uri.startswith("mongodb+srv://")):
        if _env_bool("MONGODB_TLS_INSECURE"):
            options["tlsAllowInvalidCertificates"] = True
        else:
            options["tlsCAFile"] = certifi.where()

    return options


def get_client():
    global _client
    if _client is None:
        uri = os.getenv("MONGODB_URI")
        if not uri:
            raise ValueError("MONGODB_URI is not set in backend/.env")

        _client = MongoClient(uri, **_build_client_options())
    return _client


def get_db():
    db_name = os.getenv("MONGODB_DB_NAME", "smartbus")
    return get_client()[db_name]


def verify_connection():
    """Ping MongoDB and raise a readable error when connection fails."""
    try:
        get_client().admin.command("ping")
    except ServerSelectionTimeoutError as exc:
        message = str(exc)
        hints = [
            "Could not connect to MongoDB.",
            f"URI host: {os.getenv('MONGODB_URI', '').split('@')[-1].split('/')[0]}",
        ]

        if "CERTIFICATE_VERIFY_FAILED" in message or "certificate is not yet valid" in message:
            hints.extend(
                [
                    "",
                    "SSL certificate error detected. Try these fixes:",
                    "1. Sync your Windows date/time (Settings -> Time & language -> Sync now).",
                    "   'certificate is not yet valid' usually means your PC clock is wrong.",
                    "2. Ensure backend/.env uses the full Atlas connection string:",
                    "   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority",
                    "3. In Atlas: Network Access -> Add IP Address -> Allow Access from Anywhere (0.0.0.0/0) for testing.",
                    "4. Dev-only fallback (not for production): add MONGODB_TLS_INSECURE=true to backend/.env",
                ]
            )
        else:
            hints.extend(
                [
                    "",
                    "Check:",
                    "1. MongoDB Atlas cluster is running.",
                    "2. MONGODB_URI username/password are correct.",
                    "3. Your IP is allowed in Atlas Network Access.",
                ]
            )

        raise ConnectionError("\n".join(hints)) from exc


def get_next_id(counter_name):
    result = get_db().counters.find_one_and_update(
        {"_id": counter_name},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    return result["seq"]


def init_counter(counter_name, value):
    get_db().counters.update_one(
        {"_id": counter_name},
        {"$max": {"seq": value}},
        upsert=True,
    )


def format_datetime(value):
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.isoformat()
    return value


def format_time(value):
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.strftime("%H:%M:%S")
    return str(value)


def format_doc(doc):
    if not doc:
        return None

    result = {key: value for key, value in doc.items() if key != "_id"}
    for key, value in result.items():
        if isinstance(value, datetime):
            result[key] = value.isoformat()
        elif isinstance(value, float) and key in {"LATITUDE", "LONGITUDE"}:
            result[key] = value
    return result
