-- Pitee Database Schema für PostgreSQL
-- Erstellt von Claude für Supabase Deployment

-- Nutzer & Profil
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL UNIQUE,
    "alter" INTEGER NOT NULL,
    "gewicht" DOUBLE PRECISION NOT NULL,
    "groesse" DOUBLE PRECISION NOT NULL,
    "bmi" DOUBLE PRECISION,
    "erfahrung" TEXT NOT NULL,
    "hauptziel" TEXT NOT NULL,
    "trainingstagePW" INTEGER NOT NULL,
    "onboardingDone" BOOLEAN NOT NULL DEFAULT false,
    "fitnessLevel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE "HealthProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL UNIQUE,
    "herzKreislauf" BOOLEAN NOT NULL DEFAULT false,
    "bluthochdruck" BOOLEAN NOT NULL DEFAULT false,
    "diabetes" BOOLEAN NOT NULL DEFAULT false,
    "medikamente" TEXT,
    "vorerkrankungen" TEXT,
    "aerztlicheFreigabe" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "HealthProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE "GelenkProblem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "gelenk" TEXT NOT NULL,
    "seite" TEXT NOT NULL,
    "schweregrad" INTEGER NOT NULL,
    "notiz" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GelenkProblem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Fitnesstest
CREATE TABLE "FitnessTest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "datum" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FitnessTest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE "FitnessTestErgebnis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fitnessTestId" TEXT NOT NULL,
    "uebungName" TEXT NOT NULL,
    "gewicht" DOUBLE PRECISION,
    "wiederholungen" INTEGER,
    "dauer" INTEGER,
    "rpe" INTEGER,
    "geschaetztes1RM" DOUBLE PRECISION,
    "fitnessLevel" TEXT,
    CONSTRAINT "FitnessTestErgebnis_fitnessTestId_fkey" FOREIGN KEY ("fitnessTestId") REFERENCES "FitnessTest"("id") ON DELETE CASCADE
);

-- Übungskatalog
CREATE TABLE "Uebung" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE,
    "kategorie" TEXT NOT NULL,
    "muskelgruppen" TEXT NOT NULL,
    "geraet" TEXT NOT NULL,
    "gelenkbelastung" TEXT NOT NULL,
    "schwierigkeitsgrad" TEXT NOT NULL,
    "alternativeIds" TEXT,
    "beschreibung" TEXT,
    "tempo" TEXT,
    "istMaschinenVariante" BOOLEAN NOT NULL DEFAULT false
);

-- Trainingsplan
CREATE TABLE "TrainingPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "woche" INTEGER NOT NULL,
    "istAktiv" BOOLEAN NOT NULL DEFAULT true,
    "istDeload" BOOLEAN NOT NULL DEFAULT false,
    "startDatum" TIMESTAMP(3) NOT NULL,
    "endDatum" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TrainingPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE "TrainingsEinheit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "trainingPlanId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "wochentag" INTEGER NOT NULL,
    "typ" TEXT NOT NULL,
    "aufwaermen" TEXT,
    "cooldown" TEXT,
    "sortierung" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "TrainingsEinheit_trainingPlanId_fkey" FOREIGN KEY ("trainingPlanId") REFERENCES "TrainingPlan"("id") ON DELETE CASCADE
);

CREATE TABLE "PlanUebung" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "trainingsEinheitId" TEXT NOT NULL,
    "uebungId" TEXT NOT NULL,
    "saetze" INTEGER NOT NULL,
    "wiederholungen" TEXT NOT NULL,
    "gewicht" DOUBLE PRECISION,
    "rir" INTEGER NOT NULL,
    "pauseSekunden" INTEGER NOT NULL DEFAULT 120,
    "tempo" TEXT,
    "notizen" TEXT,
    "sortierung" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "PlanUebung_trainingsEinheitId_fkey" FOREIGN KEY ("trainingsEinheitId") REFERENCES "TrainingsEinheit"("id") ON DELETE CASCADE,
    CONSTRAINT "PlanUebung_uebungId_fkey" FOREIGN KEY ("uebungId") REFERENCES "Uebung"("id")
);

-- Workout-Logging
CREATE TABLE "WorkoutLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "trainingsEinheitId" TEXT NOT NULL,
    "startZeit" TIMESTAMP(3) NOT NULL,
    "endZeit" TIMESTAMP(3),
    "gesamtRPE" INTEGER,
    "notizen" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkoutLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
    CONSTRAINT "WorkoutLog_trainingsEinheitId_fkey" FOREIGN KEY ("trainingsEinheitId") REFERENCES "TrainingsEinheit"("id")
);

CREATE TABLE "UebungLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workoutLogId" TEXT NOT NULL,
    "uebungName" TEXT NOT NULL,
    "sortierung" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "UebungLog_workoutLogId_fkey" FOREIGN KEY ("workoutLogId") REFERENCES "WorkoutLog"("id") ON DELETE CASCADE
);

CREATE TABLE "SatzLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uebungLogId" TEXT NOT NULL,
    "satzNummer" INTEGER NOT NULL,
    "gewicht" DOUBLE PRECISION,
    "wiederholungen" INTEGER,
    "rir" INTEGER,
    "rpe" INTEGER,
    "dauer" INTEGER,
    "notiz" TEXT,
    CONSTRAINT "SatzLog_uebungLogId_fkey" FOREIGN KEY ("uebungLogId") REFERENCES "UebungLog"("id") ON DELETE CASCADE
);

-- Ernährung
CREATE TABLE "NutritionPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "datum" TIMESTAMP(3) NOT NULL,
    "istTrainingstag" BOOLEAN NOT NULL,
    "kalorien" INTEGER NOT NULL,
    "proteinG" DOUBLE PRECISION NOT NULL,
    "kohlenhydrateG" DOUBLE PRECISION NOT NULL,
    "fettG" DOUBLE PRECISION NOT NULL,
    "leucinG" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NutritionPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE "Mahlzeit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nutritionPlanId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "uhrzeit" TEXT,
    "kalorien" INTEGER NOT NULL,
    "proteinG" DOUBLE PRECISION NOT NULL,
    "kohlenhydrateG" DOUBLE PRECISION NOT NULL,
    "fettG" DOUBLE PRECISION NOT NULL,
    "leucinG" DOUBLE PRECISION,
    "rezept" TEXT,
    "istPostWorkout" BOOLEAN NOT NULL DEFAULT false,
    "sortierung" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Mahlzeit_nutritionPlanId_fkey" FOREIGN KEY ("nutritionPlanId") REFERENCES "NutritionPlan"("id") ON DELETE CASCADE
);

CREATE TABLE "NutritionLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "datum" TIMESTAMP(3) NOT NULL,
    "mahlzeitName" TEXT NOT NULL,
    "kalorien" INTEGER,
    "proteinG" DOUBLE PRECISION,
    "kohlenhydrateG" DOUBLE PRECISION,
    "fettG" DOUBLE PRECISION,
    "leucinG" DOUBLE PRECISION,
    "notiz" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NutritionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Tracking
CREATE TABLE "BodyMetric" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "datum" TIMESTAMP(3) NOT NULL,
    "gewicht" DOUBLE PRECISION,
    "koerperfett" DOUBLE PRECISION,
    "brustumfang" DOUBLE PRECISION,
    "taillenumfang" DOUBLE PRECISION,
    "oberarmumfang" DOUBLE PRECISION,
    "oberschenkelumfang" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BodyMetric_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE "WellnessLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "datum" TIMESTAMP(3) NOT NULL,
    "schlafStunden" DOUBLE PRECISION,
    "schlafQualitaet" INTEGER,
    "energie" INTEGER,
    "stress" INTEGER,
    "muskelkater" INTEGER,
    "stimmung" INTEGER,
    "notiz" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WellnessLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- KI-Chat
CREATE TABLE "AIConversation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "titel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AIConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE "AINachricht" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "aiConversationId" TEXT NOT NULL,
    "rolle" TEXT NOT NULL,
    "inhalt" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AINachricht_aiConversationId_fkey" FOREIGN KEY ("aiConversationId") REFERENCES "AIConversation"("id") ON DELETE CASCADE
);

-- Einstellungen
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL UNIQUE,
    "darkMode" BOOLEAN NOT NULL DEFAULT false,
    "einheiten" TEXT NOT NULL DEFAULT 'metrisch',
    "benachrichtigungen" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Indexes für bessere Performance
CREATE INDEX "GelenkProblem_userId_idx" ON "GelenkProblem"("userId");
CREATE INDEX "FitnessTest_userId_idx" ON "FitnessTest"("userId");
CREATE INDEX "TrainingPlan_userId_idx" ON "TrainingPlan"("userId");
CREATE INDEX "WorkoutLog_userId_idx" ON "WorkoutLog"("userId");
CREATE INDEX "NutritionPlan_userId_idx" ON "NutritionPlan"("userId");
CREATE INDEX "NutritionLog_userId_idx" ON "NutritionLog"("userId");
CREATE INDEX "BodyMetric_userId_idx" ON "BodyMetric"("userId");
CREATE INDEX "WellnessLog_userId_idx" ON "WellnessLog"("userId");
CREATE INDEX "AIConversation_userId_idx" ON "AIConversation"("userId");
