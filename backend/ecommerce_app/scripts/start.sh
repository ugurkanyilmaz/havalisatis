#!/bin/bash

# Migration and startup script for the ecommerce application
echo "Starting ecommerce application..."

# Wait for database to be ready (if using external database)
echo "Waiting for database to be ready..."

# Run database migrations
echo "Running database migrations..."
alembic upgrade head

if [ $? -eq 0 ]; then
    echo "Database migrations completed successfully."
else
    echo "Database migrations failed!"
    exit 1
fi

# Start the FastAPI application
echo "Starting FastAPI server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000