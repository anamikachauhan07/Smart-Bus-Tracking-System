#!/usr/bin/env python3
"""
Import MySQL schema SQL files into MongoDB.

Reads INSERT data from database/schema.sql (and optional migration SQL),
maps SQL tables to MongoDB collections, assigns auto-increment IDs, and
applies MongoDB-specific enrichments (STOP_ORDER, drivers, indexes, etc.).

Usage:
    cd backend
    python import_sql_to_mongo.py
    python import_sql_to_mongo.py --schema ../database/schema.sql --migration ../database/add_notifications_system.sql
"""

from __future__ import annotations

import argparse
import re
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv

from db import get_db, init_counter, verify_connection

load_dotenv()

DEFAULT_SCHEMA = Path(__file__).resolve().parent.parent / "database" / "schema.sql"
DEFAULT_MIGRATION = Path(__file__).resolve().parent.parent / "database" / "add_notifications_system.sql"

PASSWORD_HASH = "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f"
ADMIN_PASSWORD_HASH = "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9"

TABLE_TO_COLLECTION = {
    "BUS": "buses",
    "ROUTE": "routes",
    "STOP": "stops",
    "STUDENT": "students",
    "SCHEDULE": "schedules",
    "TRACKING": "tracking",
    "USER_ACCOUNTS": "user_accounts",
    "DRIVER": "drivers",
    "NOTIFICATION": "notifications",
}

TABLE_PRIMARY_KEYS = {
    "BUS": "B_ID",
    "ROUTE": "R_ID",
    "STOP": "STOP_ID",
    "STUDENT": "S_ID",
    "SCHEDULE": "SCH_ID",
    "TRACKING": "T_ID",
    "USER_ACCOUNTS": "USER_ID",
    "DRIVER": "DRIVER_ID",
    "NOTIFICATION": "N_ID",
}

COLLECTIONS = list(set(TABLE_TO_COLLECTION.values())) + ["counters"]

CREATE_TABLE_RE = re.compile(
    r"CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?(\w+)`?\s*\((.*?)\);",
    re.IGNORECASE | re.DOTALL,
)

INSERT_RE = re.compile(
    r"INSERT\s+(?:IGNORE\s+)?INTO\s+`?(\w+)`?\s*(?:\(([^)]+)\))?\s*VALUES\s*(.+?);",
    re.IGNORECASE | re.DOTALL,
)


def strip_sql_comments(sql_text: str) -> str:
    lines = []
    for line in sql_text.splitlines():
        if line.strip().startswith("--"):
            continue
        if "--" in line:
            line = line.split("--", 1)[0]
        lines.append(line)
    return "\n".join(lines)


def parse_create_tables(sql_text: str) -> dict[str, list[str]]:
    tables: dict[str, list[str]] = {}
    for match in CREATE_TABLE_RE.finditer(sql_text):
        table_name = match.group(1).upper()
        body = match.group(2)
        columns = []
        for raw_line in body.split(","):
            line = raw_line.strip()
            if not line or line.upper().startswith(("PRIMARY KEY", "FOREIGN KEY", "UNIQUE", "INDEX", "KEY", "CONSTRAINT")):
                continue
            column_name = line.split()[0].strip("`")
            columns.append(column_name.upper())
        tables[table_name] = columns
    return tables


def parse_sql_value(raw: str):
    value = raw.strip()
    if not value or value.upper() == "NULL":
        return None
    if value.startswith("'") and value.endswith("'"):
        return value[1:-1].replace("''", "'").replace("\\'", "'")
    if re.fullmatch(r"-?\d+", value):
        return int(value)
    if re.fullmatch(r"-?\d+\.\d+", value):
        return float(value)
    if value.upper() in ("TRUE", "FALSE"):
        return value.upper() == "TRUE"
    return value


def split_value_tuples(values_block: str) -> list[str]:
    tuples = []
    depth = 0
    start = None

    for index, char in enumerate(values_block):
        if char == "(":
            if depth == 0:
                start = index + 1
            depth += 1
        elif char == ")":
            depth -= 1
            if depth == 0 and start is not None:
                tuples.append(values_block[start:index])
                start = None

    return tuples


def parse_tuple_values(tuple_body: str) -> list:
    values = []
    token = []
    in_string = False
    index = 0

    while index < len(tuple_body):
        char = tuple_body[index]

        if in_string:
            if char == "'" and index + 1 < len(tuple_body) and tuple_body[index + 1] == "'":
                token.append("'")
                index += 2
                continue
            if char == "'":
                in_string = False
                index += 1
                continue
            token.append(char)
            index += 1
            continue

        if char == "'":
            in_string = True
            index += 1
            continue

        if char == ",":
            values.append(parse_sql_value("".join(token)))
            token = []
            index += 1
            continue

        token.append(char)
        index += 1

    if token:
        values.append(parse_sql_value("".join(token)))

    return values


def parse_inserts(sql_text: str) -> list[tuple[str, list[str] | None, list[list]]]:
    inserts = []

    for match in INSERT_RE.finditer(sql_text):
        table_name = match.group(1).upper()
        columns = None
        if match.group(2):
            columns = [col.strip().strip("`").upper() for col in match.group(2).split(",")]

        rows = []
        for tuple_body in split_value_tuples(match.group(3)):
            rows.append(parse_tuple_values(tuple_body))

        inserts.append((table_name, columns, rows))

    return inserts


def rows_to_documents(table_name: str, columns: list[str] | None, rows: list[list], table_columns: dict[str, list[str]]) -> list[dict]:
    if columns is None:
        columns = table_columns.get(table_name, [])

    documents = []
    for row in rows:
        doc = {}
        for column, value in zip(columns, row):
            doc[column] = normalize_field_value(column, value)
        documents.append(doc)
    return documents


def normalize_field_value(column: str, value):
    if value is None:
        return None

    if column == "PASSWORD_HASH" and isinstance(value, str) and value.endswith("..."):
        return PASSWORD_HASH

    if column in {"A_TIME", "D_TIME"} and isinstance(value, str) and re.fullmatch(r"\d{2}:\d{2}:\d{2}", value):
        return value

    if column in {"LATITUDE", "LONGITUDE"} and value is not None:
        return float(value)

    if column in {"CAPACITY", "EXPERIENCE_YEARS", "STOP_ORDER", "B_ID", "R_ID", "STOP_ID", "S_ID", "SCH_ID", "T_ID", "USER_ID", "DRIVER_ID", "N_ID", "CURRENT_STOP_ID"}:
        if isinstance(value, str) and value.isdigit():
            return int(value)
        if isinstance(value, (int, float)):
            return int(value)

    return value


def assign_primary_keys(table_name: str, documents: list[dict], counters: dict[str, int]) -> None:
    pk = TABLE_PRIMARY_KEYS.get(table_name)
    if not pk:
        return

    counter_name = pk
    current = counters.get(counter_name, 0)

    for doc in documents:
        if doc.get(pk) is None:
            current += 1
            doc[pk] = current
        else:
            current = max(current, int(doc[pk]))

    counters[counter_name] = current


def merge_user_accounts(all_users: list[dict]) -> list[dict]:
    merged: dict[str, dict] = {}

    for user in all_users:
        username = user["USERNAME"]
        existing = merged.get(username)

        if existing is None:
            merged[username] = user
            continue

        if "@acc.edu.in" in user.get("EMAIL", ""):
            merged[username] = user
        elif "@acc.edu.in" in existing.get("EMAIL", ""):
            continue
        else:
            merged[username] = user

    users = list(merged.values())
    for index, user in enumerate(users, start=1):
        user.setdefault("USER_ID", index)
        user.setdefault("IS_ACTIVE", True)
        user.setdefault("CREATED_AT", datetime.utcnow())
        if "PASSWORD_HASH" not in user or str(user["PASSWORD_HASH"]).endswith("..."):
            user["PASSWORD_HASH"] = PASSWORD_HASH

    return users


def enrich_documents(parsed_data: dict[str, list[dict]]) -> dict[str, list[dict]]:
    buses = parsed_data.get("buses", [])
    routes = parsed_data.get("routes", [])
    stops = parsed_data.get("stops", [])
    students = parsed_data.get("students", [])
    schedules = parsed_data.get("schedules", [])
    tracking = parsed_data.get("tracking", [])
    users = parsed_data.get("user_accounts", [])

    for index, bus in enumerate(buses, start=1):
        bus.setdefault("B_ID", index)
        bus.setdefault("R_ID", index)

    for index, route in enumerate(routes, start=1):
        route.setdefault("R_ID", index)

    stop_order_by_route: dict[int, int] = {}
    for index, stop in enumerate(stops, start=1):
        stop.setdefault("STOP_ID", index)
        route_id = int(stop["R_ID"])
        stop_order_by_route[route_id] = stop_order_by_route.get(route_id, 0) + 1
        stop.setdefault("STOP_ORDER", stop_order_by_route[route_id])

    for index, student in enumerate(students, start=1):
        student.setdefault("S_ID", index)
        student.setdefault("NOTIFY_EMAIL", True)
        student.setdefault("NOTIFY_SMS", False)
        student.setdefault("NOTIFY_PUSH", True)
        student.setdefault("REGISTRATION_DATE", datetime.utcnow())

    for index, schedule in enumerate(schedules, start=1):
        schedule.setdefault("SCH_ID", index)
        schedule.setdefault("R_ID", schedule.get("B_ID"))

    now = datetime.utcnow()
    for index, record in enumerate(tracking, start=1):
        record.setdefault("T_ID", index)
        record.setdefault("TIMESTAMP", now)

    users = merge_user_accounts(users)
    parsed_data["user_accounts"] = users

    if not parsed_data.get("drivers"):
        drivers = []
        driver_users = [user for user in users if user.get("USER_TYPE") == "driver"]
        for index, user in enumerate(driver_users, start=1):
            drivers.append(
                {
                    "DRIVER_ID": index,
                    "USER_ID": user["USER_ID"],
                    "B_ID": index,
                    "LICENSE_NUMBER": f"DL-{index:03d}",
                    "EXPERIENCE_YEARS": 3 + index,
                }
            )
        parsed_data["drivers"] = drivers

    return parsed_data


def extract_admin_user(migration_sql: str) -> dict | None:
    match = re.search(
        r"INSERT\s+IGNORE\s+INTO\s+USER_ACCOUNTS\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)",
        migration_sql,
        re.IGNORECASE | re.DOTALL,
    )
    if not match:
        return None

    columns = [col.strip().strip("`").upper() for col in match.group(1).split(",")]
    values = parse_tuple_values(match.group(2))
    admin = dict(zip(columns, values))
    admin["IS_ACTIVE"] = True
    admin["CREATED_AT"] = datetime.utcnow()
    return admin


def build_indexes(db) -> None:
    db.user_accounts.create_index("USERNAME", unique=True)
    db.user_accounts.create_index("EMAIL", unique=True)
    db.buses.create_index("B_ID", unique=True)
    db.routes.create_index("R_ID", unique=True)
    db.stops.create_index("STOP_ID", unique=True)
    db.students.create_index("S_EMAIL")
    db.tracking.create_index([("B_ID", 1), ("TIMESTAMP", -1)])
    db.notifications.create_index([("S_ID", 1), ("CREATED_AT", -1)])


def init_all_counters(db, parsed_data: dict[str, list[dict]]) -> None:
    counter_map = {
        "USER_ID": "user_accounts",
        "DRIVER_ID": "drivers",
        "B_ID": "buses",
        "R_ID": "routes",
        "STOP_ID": "stops",
        "S_ID": "students",
        "SCH_ID": "schedules",
        "T_ID": "tracking",
        "N_ID": "notifications",
    }

    for counter_name, collection_name in counter_map.items():
        pk = counter_name
        docs = parsed_data.get(collection_name, [])
        max_id = max((doc.get(pk, 0) for doc in docs), default=0)
        init_counter(counter_name, max_id)


def sanitize_for_mongo(document: dict) -> dict:
    """Convert values that BSON cannot encode."""
    sanitized = {}
    for key, value in document.items():
        if isinstance(value, datetime):
            sanitized[key] = value
        elif hasattr(value, "hour") and hasattr(value, "minute") and not hasattr(value, "day"):
            sanitized[key] = value.strftime("%H:%M:%S")
        else:
            sanitized[key] = value
    return sanitized


def reset_collections(db) -> None:
    for collection_name in COLLECTIONS:
        db[collection_name].drop()


def import_sql_files(schema_path: Path, migration_path: Path | None = None, reset: bool = True) -> dict[str, int]:
    schema_sql = strip_sql_comments(schema_path.read_text(encoding="utf-8"))
    table_columns = parse_create_tables(schema_sql)
    inserts = parse_inserts(schema_sql)

    parsed_data: dict[str, list[dict]] = {}
    counters: dict[str, int] = {}

    import_order = ["ROUTE", "BUS", "STOP", "USER_ACCOUNTS", "DRIVER", "STUDENT", "SCHEDULE", "TRACKING", "NOTIFICATION"]
    inserts_by_table: dict[str, list] = {}
    for table_name, columns, rows in inserts:
        inserts_by_table.setdefault(table_name, []).append((columns, rows))

    for table_name in import_order:
        collection_name = TABLE_TO_COLLECTION.get(table_name)
        if not collection_name or table_name not in inserts_by_table:
            continue

        documents = []
        for columns, rows in inserts_by_table[table_name]:
            documents.extend(rows_to_documents(table_name, columns, rows, table_columns))

        assign_primary_keys(table_name, documents, counters)
        parsed_data[collection_name] = parsed_data.get(collection_name, []) + documents

    if migration_path and migration_path.exists():
        migration_sql = strip_sql_comments(migration_path.read_text(encoding="utf-8"))
        admin_user = extract_admin_user(migration_sql)
        if admin_user:
            parsed_data.setdefault("user_accounts", []).append(admin_user)

    parsed_data = enrich_documents(parsed_data)

    db = get_db()
    if reset:
        reset_collections(db)

    summary: dict[str, int] = {}
    for collection_name, documents in parsed_data.items():
        if not documents:
            continue
        db[collection_name].insert_many([sanitize_for_mongo(doc) for doc in documents])
        summary[collection_name] = len(documents)

    init_all_counters(db, parsed_data)
    build_indexes(db)

    return summary


def main():
    parser = argparse.ArgumentParser(description="Import SQL schema data into MongoDB")
    parser.add_argument("--schema", type=Path, default=DEFAULT_SCHEMA, help="Path to schema.sql")
    parser.add_argument("--migration", type=Path, default=DEFAULT_MIGRATION, help="Path to migration SQL")
    parser.add_argument("--no-reset", action="store_true", help="Do not drop existing collections")
    args = parser.parse_args()

    if not args.schema.exists():
        raise FileNotFoundError(f"Schema file not found: {args.schema}")

    print(f"Importing SQL data from: {args.schema}")
    if args.migration.exists():
        print(f"Applying migration extras from: {args.migration}")

    verify_connection()
    print("MongoDB connection OK")

    summary = import_sql_files(args.schema, args.migration, reset=not args.no_reset)

    print("\nMongoDB import complete:")
    for collection_name, count in sorted(summary.items()):
        print(f"  {collection_name}: {count} documents")

    print("\nTest login:")
    print("  student1 / password123")
    print("  driver1  / password123")
    print("  admin    / admin123")


if __name__ == "__main__":
    main()
