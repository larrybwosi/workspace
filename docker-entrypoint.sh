#!/bin/sh

# Exit on error
set -e

# Run migrations if database is ready
echo "Running database migrations..."

if [ -f "dist/main.js" ] || [ -f "dist/main" ]; then
  echo "Detected NestJS API environment..."

  SCHEMA_PATH="./prisma/schema"

  wait_for_db() {
    echo "Waiting for database to be ready..."
    MAX_RETRIES=60
    COUNT=0

    # Determine which prisma binary to use
    PRISMA_BIN="./node_modules/.bin/prisma"
    if [ ! -f "$PRISMA_BIN" ]; then
      if command -v prisma > /dev/null 2>&1; then
        PRISMA_BIN="prisma"
      else
        echo "Error: Prisma binary not found."
        exit 1
      fi
    fi

    # Check if database is ready by executing a simple SELECT 1
    until echo "SELECT 1;" | $PRISMA_BIN db execute --stdin > /dev/null 2>&1 || [ $COUNT -eq $MAX_RETRIES ]; do
      sleep 2
      COUNT=$((COUNT + 1))
      echo "Retry $COUNT/$MAX_RETRIES: Database not yet available..."
    done

    if [ $COUNT -eq $MAX_RETRIES ]; then
      echo "❌ Database is not ready after $MAX_RETRIES retries. Exiting."
      exit 1
    fi
    echo "✅ Database is ready!"
  }

  if [ -n "$DATABASE_URL" ]; then
    wait_for_db
    echo "Deploying database migrations..."

    PRISMA_BIN="./node_modules/.bin/prisma"
    if [ ! -f "$PRISMA_BIN" ]; then
      PRISMA_BIN="prisma"
    fi

    $PRISMA_BIN migrate deploy
  else
    echo "⚠️ DATABASE_URL not set, skipping migrations."
  fi
fi

# Start the application
echo "Starting application..."
exec "$@"
