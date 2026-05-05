#!/bin/bash
set -euo pipefail

echo "=== Innerscape Deploy ==="

# Check for .env
if [ ! -f .env ]; then
  echo "ERROR: No .env file found."
  echo "Copy .env.production to .env and fill in the values:"
  echo "  cp .env.production .env"
  echo "  nano .env"
  exit 1
fi

# Source env
source .env

# Check required vars
for var in POSTGRES_PASSWORD JWT_SECRET DOMAIN; do
  if [ -z "${!var:-}" ]; then
    echo "ERROR: $var is not set in .env"
    exit 1
  fi
done

echo "[1/4] Building web app..."
cd apps/mobile
npx expo export --platform web 2>&1 || { echo "ERROR: Web build failed"; exit 1; }
cd ../..

echo "[2/4] Building API Docker image..."
docker compose -f docker-compose.prod.yml build api 2>&1 || { echo "ERROR: Docker build failed"; exit 1; }

echo "[3/4] Running database migrations..."
docker compose -f docker-compose.prod.yml run --rm api npx prisma migrate deploy 2>&1 || { echo "ERROR: Migration failed"; exit 1; }

echo "[4/4] Starting services..."
docker compose -f docker-compose.prod.yml up -d 2>&1 || { echo "ERROR: Start failed"; exit 1; }

echo ""
echo "=== Deployed ==="
echo "App: https://${DOMAIN}"
echo "API: https://${DOMAIN}/api/v1"
echo "Health: https://${DOMAIN}/health"
echo ""
echo "Logs: docker compose -f docker-compose.prod.yml logs -f"
