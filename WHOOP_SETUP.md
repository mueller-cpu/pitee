# WHOOP Integration Setup

Die pitee-App unterstützt jetzt die automatische Synchronisation von Wellness-Daten über die WHOOP API.

## Features

- **Automatisches Wellness-Logging**: Schlaf, Recovery, Strain und HRV werden täglich von WHOOP abgerufen
- **OAuth 2.0 Integration**: Sichere Verbindung über WHOOP Developer API
- **Profil-Verwaltung**: Connect/Disconnect WHOOP direkt im Profil
- **Manuelle Sync**: On-Demand Synchronisation der letzten 7 Tage

## Daten die synchronisiert werden

### Aus WHOOP Recovery:
- **Recovery Score** (0-100%) → energie (1-10)
- **Resting Heart Rate** → whoopRestingHR
- **HRV (RMSSD)** → whoopHRV

### Aus WHOOP Sleep:
- **Schlafstunden** → schlafStunden
- **Sleep Performance** (%) → schlafQualitaet (1-10)

### Aus WHOOP Cycles:
- **Strain Score** (0-21) → whoopStrain

## Setup

### 1. WHOOP Developer Account erstellen

1. Gehe zu https://developer.whoop.com/
2. Erstelle einen Developer Account
3. Erstelle eine neue App

### 2. OAuth Credentials konfigurieren

In deiner WHOOP App:

- **Redirect URI**: `http://localhost:3000/api/whoop/callback` (lokal) oder `https://deine-domain.vercel.app/api/whoop/callback` (Produktion)
- **Scopes**:
  - `read:recovery`
  - `read:cycles`
  - `read:sleep`
  - `read:profile`

### 3. Environment Variables setzen

In `.env`:

```env
WHOOP_CLIENT_ID="deine_whoop_client_id"
WHOOP_CLIENT_SECRET="dein_whoop_client_secret"
WHOOP_REDIRECT_URI="http://localhost:3000/api/whoop/callback"
```

Für Produktion (Vercel):
```env
WHOOP_REDIRECT_URI="https://deine-app.vercel.app/api/whoop/callback"
```

### 4. Datenbank-Migration

Das Schema wurde bereits erweitert. Um die Migration auf Supabase anzuwenden:

```sql
-- Füge WHOOP-Felder zu WellnessLog hinzu
ALTER TABLE "WellnessLog" ADD COLUMN "whoopRecovery" DOUBLE PRECISION;
ALTER TABLE "WellnessLog" ADD COLUMN "whoopStrain" DOUBLE PRECISION;
ALTER TABLE "WellnessLog" ADD COLUMN "whoopHRV" DOUBLE PRECISION;
ALTER TABLE "WellnessLog" ADD COLUMN "whoopRestingHR" INTEGER;
ALTER TABLE "WellnessLog" ADD COLUMN "whoopSyncedAt" TIMESTAMP(3);

-- Erstelle unique constraint für userId + datum
ALTER TABLE "WellnessLog" ADD CONSTRAINT "WellnessLog_userId_datum_key" UNIQUE ("userId", "datum");

-- Erstelle WearableConnection Tabelle
CREATE TABLE "WearableConnection" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WearableConnection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WearableConnection_userId_key" ON "WearableConnection"("userId");

ALTER TABLE "WearableConnection" ADD CONSTRAINT "WearableConnection_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

## Nutzung

### Im Profil verbinden

1. Öffne **Profil** in der App
2. Unter **WHOOP Wearable** klicke auf **"Mit WHOOP verbinden"**
3. Autorisiere die App in WHOOP
4. Du wirst zurück zur App geleitet

### Synchronisation

- **Automatisch**: Beim Connect werden die letzten 7 Tage synchronisiert
- **Manuell**: Klicke auf **"Jetzt synchronisieren"** im Profil
- **Token-Refresh**: Läuft automatisch bei abgelaufenen Tokens

### API Endpoints

- `GET /api/whoop/auth` - Startet OAuth Flow
- `GET /api/whoop/callback` - OAuth Callback
- `POST /api/whoop/sync` - Manuelle Synchronisation
- `POST /api/whoop/disconnect` - WHOOP trennen
- `GET /api/whoop/status` - Verbindungsstatus prüfen

## Datenmodell

### WellnessLog Schema

```typescript
{
  id: string
  userId: string
  datum: DateTime

  // Manuelle Eingaben
  schlafStunden?: number
  schlafQualitaet?: number (1-10)
  energie?: number (1-10)
  stress?: number (1-10)
  muskelkater?: number (1-10)
  stimmung?: number (1-10)
  notiz?: string

  // WHOOP-Daten (automatisch)
  whoopRecovery?: number (0-100)
  whoopStrain?: number (0-21)
  whoopHRV?: number (ms)
  whoopRestingHR?: number (bpm)
  whoopSyncedAt?: DateTime
}
```

### WearableConnection Schema

```typescript
{
  id: string
  userId: string
  provider: "whoop" | "oura" | "garmin" | ...
  accessToken: string
  refreshToken?: string
  expiresAt?: DateTime
  whoopUserId?: string
  lastSync?: DateTime
  isActive: boolean
}
```

## Wichtige Hinweise

1. **Rate Limits**: WHOOP API hat Rate Limits - die App synchronisiert max. 7 Tage
2. **Token Sicherheit**: Access Tokens werden verschlüsselt in der DB gespeichert
3. **Daten-Merge**: WHOOP-Daten überschreiben manuelle Eingaben für schlafStunden, schlafQualitaet und energie
4. **Privacy**: Nutzer können WHOOP jederzeit trennen - alle Tokens werden gelöscht

## Troubleshooting

### "WHOOP-Verbindung fehlgeschlagen"
- Prüfe `WHOOP_CLIENT_ID` und `WHOOP_CLIENT_SECRET`
- Stelle sicher, dass `WHOOP_REDIRECT_URI` exakt mit der konfigurierten URI übereinstimmt

### "Synchronisation fehlgeschlagen"
- Token könnte abgelaufen sein - trenne und verbinde WHOOP neu
- Prüfe WHOOP API Status: https://status.whoop.com/

### Keine Daten in WellnessLog
- WHOOP benötigt mindestens einen vollständigen Sleep-Zyklus
- Recovery-Daten sind nur verfügbar nach dem Aufwachen
- Prüfe `whoopSyncedAt` um zu sehen, wann zuletzt synchronisiert wurde

## Weitere Wearables

Die Architektur unterstützt mehrere Wearables:
- **Oura Ring**: Ähnliche API-Struktur
- **Garmin**: Connect API
- **Fitbit**: Web API
- **Apple Health**: Nur native iOS Apps

Neue Provider können mit derselben `WearableConnection` Tabelle hinzugefügt werden.
