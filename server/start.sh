#!/bin/sh
# Production startup script — runs migrations then starts the server
set -e

echo "Running database migrations..."
npx prisma migrate deploy

echo "Starting server..."
node dist/index.js
