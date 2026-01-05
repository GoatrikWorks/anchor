#!/bin/bash
set -e

echo "Starting Anchor..."
echo ""

echo "1. Starting Docker containers..."
docker compose up -d postgres redis anvil

echo ""
echo "2. Waiting for services to be healthy..."
sleep 5

echo ""
echo "3. Deploying contracts..."
docker compose up contracts

echo ""
echo "4. Running database migrations..."
docker compose up -d indexer backend

echo ""
echo "5. Seeding database..."
sleep 3
docker compose exec backend npm run db:seed

echo ""
echo "6. Starting client..."
docker compose up -d client

echo ""
echo "==================================="
echo "Anchor is now running!"
echo ""
echo "  Client:  http://localhost:3000"
echo "  API:     http://localhost:3001"
echo "  Anvil:   http://localhost:8545"
echo ""
echo "Test accounts (Anvil):"
echo "  Account 0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
echo "  Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
echo ""
echo "==================================="
