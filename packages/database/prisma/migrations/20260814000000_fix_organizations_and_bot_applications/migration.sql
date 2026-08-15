-- Create migration to align organization and bot_applications fields with schema
DO $$
BEGIN
    -- Drop constraint bot_applications_organizationId_fkey if exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'bot_applications_organizationId_fkey'
    ) THEN
        ALTER TABLE "bot_applications" DROP CONSTRAINT "bot_applications_organizationId_fkey";
    END IF;

    -- Drop columns from bot_applications if they exist
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bot_applications' AND column_name = 'allowedIps') THEN
        ALTER TABLE "bot_applications" DROP COLUMN "allowedIps";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bot_applications' AND column_name = 'metadata') THEN
        ALTER TABLE "bot_applications" DROP COLUMN "metadata";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bot_applications' AND column_name = 'organizationId') THEN
        ALTER TABLE "bot_applications" DROP COLUMN "organizationId";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bot_applications' AND column_name = 'scopes') THEN
        ALTER TABLE "bot_applications" DROP COLUMN "scopes";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bot_applications' AND column_name = 'webhookSecret') THEN
        ALTER TABLE "bot_applications" DROP COLUMN "webhookSecret";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bot_applications' AND column_name = 'webhookUrl') THEN
        ALTER TABLE "bot_applications" DROP COLUMN "webhookUrl";
    END IF;

    -- Add columns to organizations if they do not exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'allowedIps') THEN
        ALTER TABLE "organizations" ADD COLUMN "allowedIps" TEXT[];
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'clientId') THEN
        ALTER TABLE "organizations" ADD COLUMN "clientId" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'clientSecret') THEN
        ALTER TABLE "organizations" ADD COLUMN "clientSecret" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'scopes') THEN
        ALTER TABLE "organizations" ADD COLUMN "scopes" TEXT[];
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'webhookSecret') THEN
        ALTER TABLE "organizations" ADD COLUMN "webhookSecret" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'webhookUrl') THEN
        ALTER TABLE "organizations" ADD COLUMN "webhookUrl" TEXT;
    END IF;

    -- Create unique index organizations_clientId_key if it does not exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'organizations_clientId_key' AND n.nspname = 'public'
    ) THEN
        CREATE UNIQUE INDEX "organizations_clientId_key" ON "organizations"("clientId");
    END IF;
END $$;
