#!/usr/bin/env python3
"""Seed MongoDB by importing database/schema.sql."""

from import_sql_to_mongo import DEFAULT_MIGRATION, DEFAULT_SCHEMA, import_sql_files


def seed():
    summary = import_sql_files(DEFAULT_SCHEMA, DEFAULT_MIGRATION, reset=True)
    print("\nSeeded via SQL import:")
    for collection_name, count in sorted(summary.items()):
        print(f"  {collection_name}: {count}")


if __name__ == "__main__":
    seed()
