-- Create migration to add displayUsername column to users table if it does not exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'displayUsername'
    ) THEN
        ALTER TABLE "users" ADD COLUMN "displayUsername" TEXT;
    END IF;
END $$;
