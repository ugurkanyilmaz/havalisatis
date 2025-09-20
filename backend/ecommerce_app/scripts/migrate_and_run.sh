#!/bin/bash

# Migration and startup script for the ecommerce application
echo "=== Ecommerce Application Startup ==="

# Wait for database to be ready (useful for external databases)
echo "Waiting for database to be ready..."
sleep 2

# Run database migrations
echo "Running database migrations..."
alembic upgrade head

# Check if migrations were successful
if [ $? -eq 0 ]; then
    echo "✓ Database migrations completed successfully."
else
    echo "✗ Database migrations failed!"
    exit 1
fi

# Verify database tables exist
echo "Verifying database setup..."
python scripts/db_manager.py check

# Start the FastAPI application
echo "Starting FastAPI server on 0.0.0.0:8000..."

# Enable auto-reload only in DEBUG mode
RELOAD_FLAG=""
if [ "$DEBUG" = "true" ] || [ "$DEBUG" = "1" ]; then
    RELOAD_FLAG="--reload"
fi

echo "=== Application Ready ==="
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 $RELOAD_FLAG