#!/bin/sh

# Exit on error
set -e

# Run migrations if database is ready
echo "Running database migrations..."
if [ -f "./node_modules/.bin/prisma" ]; then
    ./node_modules/.bin/prisma migrate deploy
else
    npx prisma migrate deploy
fi

# Start the application
echo "Starting application..."
exec "$@"
