DO $$
BEGIN
    -- Create table if not exists
    CREATE TABLE IF NOT EXISTS "scheduled_notifications" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "scheduleType" TEXT NOT NULL,
        "scheduledFor" TIMESTAMP(3) NOT NULL,
        "timezone" TEXT NOT NULL DEFAULT 'UTC',
        "recurrence" JSONB,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "isSent" BOOLEAN NOT NULL DEFAULT false,
        "sentAt" TIMESTAMP(3),
        "entityType" TEXT,
        "entityId" TEXT,
        "linkUrl" TEXT,
        "metadata" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "scheduled_notifications_pkey" PRIMARY KEY ("id")
    );

    CREATE TABLE IF NOT EXISTS "scheduled_notification_history" (
        "id" TEXT NOT NULL,
        "scheduledNotificationId" TEXT NOT NULL,
        "sentAt" TIMESTAMP(3) NOT NULL,
        "success" BOOLEAN NOT NULL,
        "errorMessage" TEXT,
        "metadata" JSONB,

        CONSTRAINT "scheduled_notification_history_pkey" PRIMARY KEY ("id")
    );

    -- Create index if not exists
    CREATE INDEX IF NOT EXISTS "scheduled_notifications_userId_idx" ON "scheduled_notifications"("userId");
    CREATE INDEX IF NOT EXISTS "scheduled_notifications_scheduledFor_idx" ON "scheduled_notifications"("scheduledFor");
    CREATE INDEX IF NOT EXISTS "scheduled_notifications_isActive_isSent_idx" ON "scheduled_notifications"("isActive", "isSent");
    CREATE INDEX IF NOT EXISTS "scheduled_notification_history_scheduledNotificationId_idx" ON "scheduled_notification_history"("scheduledNotificationId");

    -- Add foreign keys if they do not exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'scheduled_notifications_userId_fkey'
    ) THEN
        ALTER TABLE "scheduled_notifications"
        ADD CONSTRAINT "scheduled_notifications_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'scheduled_notification_history_scheduledNotificationId_fkey'
    ) THEN
        ALTER TABLE "scheduled_notification_history"
        ADD CONSTRAINT "scheduled_notification_history_scheduledNotificationId_fkey"
        FOREIGN KEY ("scheduledNotificationId") REFERENCES "scheduled_notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
