#!/bin/sh

# Exit on error
set -e

# Run migrations if database is ready
echo "Running database migrations..."
if command -v prisma > /dev/null 2>&1; then
    prisma migrate deploy
elif [ -f "./node_modules/.bin/prisma" ]; then
    ./node_modules/.bin/prisma migrate deploy
else
    npx prisma migrate deploy
fi

# Start the application
echo "Starting application..."
exec "$@"
