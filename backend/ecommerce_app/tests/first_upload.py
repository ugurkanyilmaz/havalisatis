"""
Upload the initial Excel file (api_first.xlsx) to the backend import API.

Usage (Windows PowerShell):
    "C:/Program Files/Python313/python.exe" c:/Users/uur/OneDrive/Masaüstü/keten_work/havalisatis/backend/ecommerce_app/tests/first_upload.py

Optional: pass a custom file path or server URL
    "C:/Program Files/Python313/python.exe" c:/Users/uur/OneDrive/Masaüstü/keten_work/havalisatis/backend/ecommerce_app/tests/first_upload.py --file "c:/path/to/file.xlsx" --url http://localhost:8000
"""

from __future__ import annotations
from pathlib import Path
import argparse
import sys
import json
from typing import Optional


def _health_ok(base_url: str, timeout: float = 5.0) -> bool:
    try:
        import requests  # type: ignore
        resp = requests.get(base_url.rstrip('/') + '/api/health', timeout=timeout)
        return resp.ok
    except Exception:
        return False


def main() -> int:
    try:
        import requests  # type: ignore
    except Exception:
        print("Missing dependency: requests. Install with:\n  python -m pip install requests", file=sys.stderr)
        return 2

    parser = argparse.ArgumentParser(description="Upload products Excel to the backend import API")
    parser.add_argument("--file", dest="file_path", default=None, help="Path to .xlsx file (defaults to tests/api_first.xlsx next to this script)")
    parser.add_argument("--url", dest="base_url", default="http://localhost:8000", help="Backend base URL")
    parser.add_argument("--no-health-check", action="store_true", help="Skip preflight /api/health check")
    args = parser.parse_args()

    # Default XLSX path resolves to tests/api_first.xlsx next to this script
    if args.file_path:
        xlsx_path = Path(args.file_path)
    else:
        # this file is at backend/ecommerce_app/tests/first_upload.py
        # use backend/ecommerce_app/tests/api_first.xlsx by default
        try:
            xlsx_path = Path(__file__).resolve().parent / "api_first.xlsx"
        except Exception:
            # Fallback: try CWD/tests/api_first.xlsx
            cwd = Path.cwd()
            xlsx_path = cwd / "tests" / "api_first.xlsx"

    if not xlsx_path.exists():
        print(f"XLSX not found: {xlsx_path}", file=sys.stderr)
        # Provide a couple of hints
        print("Hint: Ensure the file exists at 'backend/ecommerce_app/tests/api_first.xlsx' or pass --file <path>", file=sys.stderr)
        return 1

    base_url: str = str(args.base_url).rstrip("/")
    url = base_url + "/api/products/import-excel"

    print(f"Using file: {xlsx_path}")
    print(f"POST  -> {url}")

    if not args.no_health_check:
        if not _health_ok(base_url):
            print(f"Warning: {base_url}/api/health is not responding (server may be down).", file=sys.stderr)
            print("Proceeding anyway... (use --no-health-check to skip this warning)", file=sys.stderr)

    try:
        with open(xlsx_path, "rb") as f:
            files = {
                "file": (
                    xlsx_path.name,
                    f,
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                )
            }
            resp = requests.post(url, files=files, timeout=120)
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}", file=sys.stderr)
        print("Tip: Ensure the backend is running and accessible at the provided --url.", file=sys.stderr)
        return 1

    print(f"Status: {resp.status_code}")
    ctype = resp.headers.get("content-type", "")
    if "application/json" in ctype:
        try:
            data = resp.json()
        except Exception:
            print(resp.text)
            return 0 if resp.ok else 1
        print(json.dumps(data, ensure_ascii=False, indent=2))
        # Try to summarize
        if isinstance(data, dict) and {"created", "updated", "errors"}.issubset(data.keys()):
            print(f"\nSummary -> created: {data['created']}, updated: {data['updated']}, errors: {len(data.get('errors', []))}")
        elif isinstance(data, dict) and data.get("detail"):
            print(f"Detail: {data['detail']}")
    else:
        print(resp.text)

    return 0 if resp.ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
