-- CreateTable
CREATE TABLE IF NOT EXISTS "device_codes" (
    "id" TEXT NOT NULL,
    "deviceCode" TEXT NOT NULL,
    "userCode" TEXT NOT NULL,
    "userId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "lastPolledAt" TIMESTAMP(3),
    "pollingInterval" INTEGER,
    "clientId" TEXT,
    "scope" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "device_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "device_codes_deviceCode_key" ON "device_codes"("deviceCode");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "device_codes_userCode_key" ON "device_codes"("userCode");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'device_codes_userId_fkey'
    ) THEN
        ALTER TABLE "device_codes" ADD CONSTRAINT "device_codes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
