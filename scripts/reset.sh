#!/bin/bash
set -e

echo "Resetting Anchor..."

echo "1. Stopping containers..."
docker compose down -v

echo "2. Removing volumes..."
docker volume rm anchor_postgres_data anchor_redis_data 2>/dev/null || true

echo "3. Done. Run ./scripts/start.sh to start fresh."
