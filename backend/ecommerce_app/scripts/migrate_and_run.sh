#!/bin/sh
set -e

cd /app

# Ensure alembic dirs exist
mkdir -p alembic/versions

# If no migration files, stamp current DB state as head (baseline) to avoid autogenerate mismatch
if [ -z "$(ls -A alembic/versions 2>/dev/null || true)" ]; then
  echo "[startup] No Alembic versions found; stamping head as baseline..."
  alembic -c alembic.ini stamp head || true
fi

echo "[startup] Applying migrations..."
alembic -c alembic.ini upgrade head || true

echo "[startup] Starting Uvicorn..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
