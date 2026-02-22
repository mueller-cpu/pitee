-- Migration: Ernährungseinstellungen zu UserProfile hinzufügen
-- Datum: 2026-02-22

-- Füge anzahlMahlzeiten Spalte hinzu (Standard: 4 Mahlzeiten)
ALTER TABLE "UserProfile"
ADD COLUMN IF NOT EXISTS "anzahlMahlzeiten" INTEGER NOT NULL DEFAULT 4;

-- Füge ernaehrungsweise Spalte hinzu (Standard: "omnivor")
ALTER TABLE "UserProfile"
ADD COLUMN IF NOT EXISTS "ernaehrungsweise" TEXT NOT NULL DEFAULT 'omnivor';

-- Kommentar für Dokumentation
COMMENT ON COLUMN "UserProfile"."anzahlMahlzeiten" IS 'Anzahl Mahlzeiten pro Tag (3-6)';
COMMENT ON COLUMN "UserProfile"."ernaehrungsweise" IS 'Ernährungsweise: omnivor, vegetarisch, vegan';
