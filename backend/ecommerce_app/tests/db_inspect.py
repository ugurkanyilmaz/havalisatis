import sqlite3
import sys
import json

DB_PATH = "/app/ecommerce.db" if __name__ == "__main__" else "ecommerce.db"


def list_tables(conn):
    cur = conn.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
    return [r[0] for r in cur.fetchall()]


def table_schema(conn, table):
    cur = conn.cursor()
    cur.execute(f"PRAGMA table_info({table})")
    cols = cur.fetchall()
    return [dict(cid=r[0], name=r[1], type=r[2], notnull=r[3], dflt_value=r[4], pk=r[5]) for r in cols]


def main():
    db_path = DB_PATH
    if len(sys.argv) > 1:
        db_path = sys.argv[1]
    conn = sqlite3.connect(db_path)
    try:
        tables = list_tables(conn)
        print("Tables:\n" + "\n".join(tables))
        print("\nSchemas:")
        for t in tables:
            print(f"\n-- {t} --")
            for col in table_schema(conn, t):
                print(f"{col['name']:20} {col['type']:12} notnull={col['notnull']} pk={col['pk']} default={col['dflt_value']}")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
