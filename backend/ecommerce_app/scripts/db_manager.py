#!/usr/bin/env python3
"""
Database management utility script for the ecommerce application.
This script provides utilities for database initialization, migrations, and management.
"""

import os
import sys
from pathlib import Path

# Add the app directory to Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.config import get_settings
from app.database import engine, Base
import app.models  # Import all models

def check_database_connection():
    """Check if database connection is working."""
    try:
        # Test connection
        connection = engine.connect()
        connection.close()
        print("✓ Database connection successful")
        return True
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        return False

def check_tables_exist():
    """Check if all required tables exist."""
    try:
        from sqlalchemy import inspect
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        
        expected_tables = [
            'users', 'categories', 'products', 'orders', 'order_items',
            'appointments', 'refresh_tokens', 'analytics_events',
            'product_analytics', 'product_images', 'product_seo'
        ]
        
        missing_tables = [table for table in expected_tables if table not in tables]
        
        if not missing_tables:
            print("✓ All required tables exist")
            print(f"  Found tables: {', '.join(sorted(tables))}")
            return True
        else:
            print(f"✗ Missing tables: {', '.join(missing_tables)}")
            print(f"  Existing tables: {', '.join(sorted(tables))}")
            return False
            
    except Exception as e:
        print(f"✗ Error checking tables: {e}")
        return False

def run_migrations():
    """Run Alembic migrations."""
    try:
        import subprocess
        import sys
        
        # Use Python module invocation for better cross-platform compatibility
        result = subprocess.run([sys.executable, '-m', 'alembic', 'upgrade', 'head'], 
                              capture_output=True, text=True)
        if result.returncode == 0:
            print("✓ Migrations completed successfully")
            if result.stdout:
                print(result.stdout)
            return True
        else:
            print(f"✗ Migration failed: {result.stderr}")
            return False
    except Exception as e:
        print(f"✗ Error running migrations: {e}")
        return False

def create_migration(message):
    """Create a new migration file."""
    try:
        import subprocess
        import sys
        
        result = subprocess.run([sys.executable, '-m', 'alembic', 'revision', '--autogenerate', '-m', message], 
                              capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✓ Migration created: {message}")
            if result.stdout:
                print(result.stdout)
            return True
        else:
            print(f"✗ Failed to create migration: {result.stderr}")
            return False
    except Exception as e:
        print(f"✗ Error creating migration: {e}")
        return False

def show_migration_history():
    """Show migration history."""
    try:
        import subprocess
        import sys
        
        result = subprocess.run([sys.executable, '-m', 'alembic', 'history'], 
                              capture_output=True, text=True)
        if result.returncode == 0:
            print("Migration History:")
            if result.stdout:
                print(result.stdout)
            return True
        else:
            print(f"✗ Failed to get migration history: {result.stderr}")
            return False
    except Exception as e:
        print(f"✗ Error getting migration history: {e}")
        return False

def main():
    """Main function for database management."""
    settings = get_settings()
    
    print(f"Database Management Utility")
    print(f"Database URL: {settings.DATABASE_URL}")
    print("-" * 50)
    
    if len(sys.argv) < 2:
        print("Available commands:")
        print("  check      - Check database connection and tables")
        print("  migrate    - Run migrations")
        print("  create     - Create new migration (requires message)")
        print("  history    - Show migration history")
        print("  init       - Initialize database (check + migrate)")
        return
    
    command = sys.argv[1]
    
    if command == "check":
        print("Checking database status...")
        conn_ok = check_database_connection()
        tables_ok = check_tables_exist()
        
        if conn_ok and tables_ok:
            print("\n✓ Database is ready!")
        else:
            print("\n✗ Database needs setup!")
            
    elif command == "migrate":
        print("Running migrations...")
        run_migrations()
        
    elif command == "create":
        if len(sys.argv) < 3:
            print("Please provide a migration message: python db_manager.py create 'migration message'")
            return
        message = sys.argv[2]
        create_migration(message)
        
    elif command == "history":
        show_migration_history()
        
    elif command == "init":
        print("Initializing database...")
        print("1. Checking connection...")
        if not check_database_connection():
            return
        
        print("2. Running migrations...")
        if not run_migrations():
            return
            
        print("3. Verifying tables...")
        if check_tables_exist():
            print("\n✓ Database initialization completed successfully!")
        else:
            print("\n✗ Database initialization failed!")
    else:
        print(f"Unknown command: {command}")

if __name__ == "__main__":
    main()