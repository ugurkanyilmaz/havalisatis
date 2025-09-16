"""
Wipe all data from the application's database.
Priority:
1) If SQLAlchemy engine import works, delete rows from all tables (schema preserved)
2) Else, if SQLite file is detected, delete the file (full reset)

Usage (Windows PowerShell):
  "C:/Program Files/Python313/python.exe" c:/Users/uur/OneDrive/Masaüstü/keten_work/havalisatis/backend/ecommerce_app/tests/wipe_db.py
"""
from __future__ import annotations
from pathlib import Path
import os
import sys

def try_engine_wipe() -> bool:
    try:
        from sqlalchemy import text, MetaData
        from ecommerce_app.app.database import engine
    except Exception as e:
        print(f"Engine wipe unavailable: {e}")
        return False

    try:
        md = MetaData()
        md.reflect(bind=engine)
        with engine.begin() as conn:
            try:
                conn.execute(text("PRAGMA foreign_keys=OFF"))
            except Exception:
                pass
            for tbl in md.sorted_tables:
                conn.execute(tbl.delete())
            try:
                conn.execute(text("PRAGMA foreign_keys=ON"))
            except Exception:
                pass
        try:
            with engine.begin() as conn:
                conn.execute(text("VACUUM"))
        except Exception:
            pass
        print("Database wipe completed via engine (rows deleted; schema preserved).")
        return True
    except Exception as e:
        print(f"Engine wipe failed: {e}")
        return False


def try_delete_sqlite_file() -> bool:
    # Common locations: two levels up from this script -> backend/ecommerce.db
    candidates: list[Path] = []
    here = Path(__file__).resolve()
    # backend/ecommerce.db
    candidates.append(here.parents[2] / "ecommerce.db")
    # CWD/ecommerce.db
    candidates.append(Path.cwd() / "ecommerce.db")
    # Search upwards for a file named ecommerce.db
    for parent in list(here.parents)[:5]:
        candidates.append(parent / "ecommerce.db")

    for p in candidates:
        try:
            if p.exists():
                p.unlink()
                print(f"Deleted SQLite file: {p}")
                return True
        except Exception as e:
            print(f"Failed to delete {p}: {e}")
            continue
    return False


def main() -> int:
    if try_engine_wipe():
        return 0
    if try_delete_sqlite_file():
        print("Database file removed. Restart the backend to recreate schema if needed.")
        return 0
    print("No action taken: could not access engine or locate SQLite file.", file=sys.stderr)
    return 2


if __name__ == "__main__":
    raise SystemExit(main())