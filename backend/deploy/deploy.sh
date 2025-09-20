#!/usr/bin/env bash
set -euo pipefail

# Variables
APP_DIR="/var/www/havalielaletlerisatis"
BACKEND_DIR="$APP_DIR/backend/ecommerce_app"
VENV_DIR="$APP_DIR/venv"
SERVICE_NAME="havalielaletlerisatis"

# Ensure directories
sudo mkdir -p "$APP_DIR"
sudo chown -R "$USER":"$USER" "$APP_DIR"

# Copy project files (rsync recommended)
rsync -av --delete ./ "$APP_DIR/"

# Python environment
python3 -m venv "$VENV_DIR"
source "$VENV_DIR/bin/activate"
pip install --upgrade pip
pip install -r "$BACKEND_DIR/requirements.txt"

# Migrations
cd "$BACKEND_DIR"
# Ensure .env exists and configured
alembic upgrade head

# systemd service
sudo cp "$APP_DIR/backend/deploy/havalielaletlerisatis.service" /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable "$SERVICE_NAME"
sudo systemctl restart "$SERVICE_NAME"

# Nginx (optional): copy and reload
if [ -f "$APP_DIR/backend/deploy/natro-nginx.conf" ]; then
  sudo cp "$APP_DIR/backend/deploy/natro-nginx.conf" /etc/nginx/sites-available/havalielaletlerisatis
  sudo ln -sf /etc/nginx/sites-available/havalielaletlerisatis /etc/nginx/sites-enabled/havalielaletlerisatis
  sudo nginx -t && sudo systemctl reload nginx
fi

echo "Deployment completed."
