-- Füge geschlecht-Spalte zu UserProfile hinzu
ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "geschlecht" TEXT NOT NULL DEFAULT 'maennlich';

-- Erfolgsmeldung
SELECT 'Geschlecht-Spalte erfolgreich hinzugefügt!' as status;
