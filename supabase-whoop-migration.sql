-- WHOOP Integration Migration für Supabase
-- Füge WHOOP-spezifische Felder zu WellnessLog hinzu und erstelle WearableConnection Tabelle

-- 1. Füge WHOOP-Felder zu WellnessLog hinzu
ALTER TABLE "WellnessLog" ADD COLUMN IF NOT EXISTS "whoopRecovery" DOUBLE PRECISION;
ALTER TABLE "WellnessLog" ADD COLUMN IF NOT EXISTS "whoopStrain" DOUBLE PRECISION;
ALTER TABLE "WellnessLog" ADD COLUMN IF NOT EXISTS "whoopHRV" DOUBLE PRECISION;
ALTER TABLE "WellnessLog" ADD COLUMN IF NOT EXISTS "whoopRestingHR" INTEGER;
ALTER TABLE "WellnessLog" ADD COLUMN IF NOT EXISTS "whoopSyncedAt" TIMESTAMP(3);

-- 2. Erstelle unique constraint für userId + datum (für upsert)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'WellnessLog_userId_datum_key'
    ) THEN
        ALTER TABLE "WellnessLog"
        ADD CONSTRAINT "WellnessLog_userId_datum_key" UNIQUE ("userId", "datum");
    END IF;
END $$;

-- 3. Erstelle WearableConnection Tabelle
CREATE TABLE IF NOT EXISTS "WearableConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "whoopUserId" TEXT,
    "lastSync" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WearableConnection_pkey" PRIMARY KEY ("id")
);

-- 4. Erstelle unique index auf userId
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'WearableConnection_userId_key'
    ) THEN
        CREATE UNIQUE INDEX "WearableConnection_userId_key" ON "WearableConnection"("userId");
    END IF;
END $$;

-- 5. Erstelle Foreign Key Constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'WearableConnection_userId_fkey'
    ) THEN
        ALTER TABLE "WearableConnection"
        ADD CONSTRAINT "WearableConnection_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Erfolgsmeldung
SELECT 'WHOOP Integration erfolgreich installiert!' as status;
