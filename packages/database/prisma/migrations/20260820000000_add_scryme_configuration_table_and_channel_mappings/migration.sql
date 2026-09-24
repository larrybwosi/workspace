-- Create scryme_configuration table if it does not exist
CREATE TABLE IF NOT EXISTS "scryme_configuration" (
    "id" TEXT NOT NULL,
    "channelMappings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scryme_configuration_pkey" PRIMARY KEY ("id")
);

-- Ensure channelMappings column exists in scryme_configuration table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'scryme_configuration' AND column_name = 'channelMappings'
    ) THEN
        ALTER TABLE "scryme_configuration" ADD COLUMN "channelMappings" JSONB;
    END IF;
END $$;
