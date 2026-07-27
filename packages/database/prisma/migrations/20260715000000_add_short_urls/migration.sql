-- CreateTable
CREATE TABLE IF NOT EXISTS "short_urls" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "original" TEXT NOT NULL,
    "key" TEXT,
    "mimeType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "short_urls_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "short_urls_code_key" ON "short_urls"("code");
