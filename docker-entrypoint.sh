#!/bin/sh

# Exit on error
set -e

# Run migrations if database is ready
echo "Running database migrations..."

# Run migrate deploy, capture its output and exit code
# We avoid "set -e" exiting the script by using standard error handling.
set +e
MIGRATE_OUTPUT=$(
    if command -v prisma > /dev/null 2>&1; then
        prisma migrate deploy 2>&1
    elif [ -f "./node_modules/.bin/prisma" ]; then
        ./node_modules/.bin/prisma migrate deploy 2>&1
    else
        npx prisma migrate deploy 2>&1
    fi
)
MIGRATE_STATUS=$?
set -e

echo "$MIGRATE_OUTPUT"

if [ $MIGRATE_STATUS -ne 0 ]; then
    # Check if the output indicates P3009 or a failed migration
    if echo "$MIGRATE_OUTPUT" | grep -q "P3009" || echo "$MIGRATE_OUTPUT" | grep -q "failed migrations"; then
        echo "Detected failed migration in database. Resolving 0_init as applied..."
        if command -v prisma > /dev/null 2>&1; then
            prisma migrate resolve --applied "0_init"
        elif [ -f "./node_modules/.bin/prisma" ]; then
            ./node_modules/.bin/prisma migrate resolve --applied "0_init"
        else
            npx prisma migrate resolve --applied "0_init"
        fi

        echo "Retrying database migrations..."
        if command -v prisma > /dev/null 2>&1; then
            prisma migrate deploy
        elif [ -f "./node_modules/.bin/prisma" ]; then
            ./node_modules/.bin/prisma migrate deploy
        else
            npx prisma migrate deploy
        fi
    else
        echo "Database migration failed with exit code $MIGRATE_STATUS"
        exit $MIGRATE_STATUS
    fi
fi

# Start the application
echo "Starting application..."
exec "$@"
