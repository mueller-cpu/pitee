-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "alter" INTEGER NOT NULL,
    "gewicht" REAL NOT NULL,
    "groesse" REAL NOT NULL,
    "bmi" REAL,
    "erfahrung" TEXT NOT NULL,
    "hauptziel" TEXT NOT NULL,
    "trainingstagePW" INTEGER NOT NULL,
    "onboardingDone" BOOLEAN NOT NULL DEFAULT false,
    "fitnessLevel" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HealthProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "herzKreislauf" BOOLEAN NOT NULL DEFAULT false,
    "bluthochdruck" BOOLEAN NOT NULL DEFAULT false,
    "diabetes" BOOLEAN NOT NULL DEFAULT false,
    "medikamente" TEXT,
    "vorerkrankungen" TEXT,
    "aerztlicheFreigabe" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "HealthProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GelenkProblem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "gelenk" TEXT NOT NULL,
    "seite" TEXT NOT NULL,
    "schweregrad" INTEGER NOT NULL,
    "notiz" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GelenkProblem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FitnessTest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "datum" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FitnessTest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FitnessTestErgebnis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fitnessTestId" TEXT NOT NULL,
    "uebungName" TEXT NOT NULL,
    "gewicht" REAL,
    "wiederholungen" INTEGER,
    "dauer" INTEGER,
    "rpe" INTEGER,
    "geschaetztes1RM" REAL,
    "fitnessLevel" TEXT,
    CONSTRAINT "FitnessTestErgebnis_fitnessTestId_fkey" FOREIGN KEY ("fitnessTestId") REFERENCES "FitnessTest" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Uebung" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
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

-- CreateTable
CREATE TABLE "TrainingPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "woche" INTEGER NOT NULL,
    "istAktiv" BOOLEAN NOT NULL DEFAULT true,
    "istDeload" BOOLEAN NOT NULL DEFAULT false,
    "startDatum" DATETIME NOT NULL,
    "endDatum" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TrainingPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TrainingsEinheit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "trainingPlanId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "wochentag" INTEGER NOT NULL,
    "typ" TEXT NOT NULL,
    "aufwaermen" TEXT,
    "cooldown" TEXT,
    "sortierung" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "TrainingsEinheit_trainingPlanId_fkey" FOREIGN KEY ("trainingPlanId") REFERENCES "TrainingPlan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlanUebung" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "trainingsEinheitId" TEXT NOT NULL,
    "uebungId" TEXT NOT NULL,
    "saetze" INTEGER NOT NULL,
    "wiederholungen" TEXT NOT NULL,
    "gewicht" REAL,
    "rir" INTEGER NOT NULL,
    "pauseSekunden" INTEGER NOT NULL DEFAULT 120,
    "tempo" TEXT,
    "notizen" TEXT,
    "sortierung" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "PlanUebung_trainingsEinheitId_fkey" FOREIGN KEY ("trainingsEinheitId") REFERENCES "TrainingsEinheit" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PlanUebung_uebungId_fkey" FOREIGN KEY ("uebungId") REFERENCES "Uebung" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkoutLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "trainingsEinheitId" TEXT NOT NULL,
    "startZeit" DATETIME NOT NULL,
    "endZeit" DATETIME,
    "gesamtRPE" INTEGER,
    "notizen" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkoutLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkoutLog_trainingsEinheitId_fkey" FOREIGN KEY ("trainingsEinheitId") REFERENCES "TrainingsEinheit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UebungLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workoutLogId" TEXT NOT NULL,
    "uebungName" TEXT NOT NULL,
    "sortierung" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "UebungLog_workoutLogId_fkey" FOREIGN KEY ("workoutLogId") REFERENCES "WorkoutLog" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SatzLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "uebungLogId" TEXT NOT NULL,
    "satzNummer" INTEGER NOT NULL,
    "gewicht" REAL,
    "wiederholungen" INTEGER,
    "rir" INTEGER,
    "rpe" INTEGER,
    "dauer" INTEGER,
    "notiz" TEXT,
    CONSTRAINT "SatzLog_uebungLogId_fkey" FOREIGN KEY ("uebungLogId") REFERENCES "UebungLog" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NutritionPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "datum" DATETIME NOT NULL,
    "istTrainingstag" BOOLEAN NOT NULL,
    "kalorien" INTEGER NOT NULL,
    "proteinG" REAL NOT NULL,
    "kohlenhydrateG" REAL NOT NULL,
    "fettG" REAL NOT NULL,
    "leucinG" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NutritionPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Mahlzeit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nutritionPlanId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "uhrzeit" TEXT,
    "kalorien" INTEGER NOT NULL,
    "proteinG" REAL NOT NULL,
    "kohlenhydrateG" REAL NOT NULL,
    "fettG" REAL NOT NULL,
    "leucinG" REAL,
    "rezept" TEXT,
    "istPostWorkout" BOOLEAN NOT NULL DEFAULT false,
    "sortierung" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Mahlzeit_nutritionPlanId_fkey" FOREIGN KEY ("nutritionPlanId") REFERENCES "NutritionPlan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "NutritionLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "datum" DATETIME NOT NULL,
    "mahlzeitName" TEXT NOT NULL,
    "kalorien" INTEGER,
    "proteinG" REAL,
    "kohlenhydrateG" REAL,
    "fettG" REAL,
    "leucinG" REAL,
    "notiz" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "NutritionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BodyMetric" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "datum" DATETIME NOT NULL,
    "gewicht" REAL,
    "koerperfett" REAL,
    "brustumfang" REAL,
    "taillenumfang" REAL,
    "oberarmumfang" REAL,
    "oberschenkelumfang" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BodyMetric_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WellnessLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "datum" DATETIME NOT NULL,
    "schlafStunden" REAL,
    "schlafQualitaet" INTEGER,
    "energie" INTEGER,
    "stress" INTEGER,
    "muskelkater" INTEGER,
    "stimmung" INTEGER,
    "notiz" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WellnessLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AIConversation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "titel" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AIConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AINachricht" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "aiConversationId" TEXT NOT NULL,
    "rolle" TEXT NOT NULL,
    "inhalt" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AINachricht_aiConversationId_fkey" FOREIGN KEY ("aiConversationId") REFERENCES "AIConversation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "darkMode" BOOLEAN NOT NULL DEFAULT false,
    "einheiten" TEXT NOT NULL DEFAULT 'metrisch',
    "benachrichtigungen" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "HealthProfile_userId_key" ON "HealthProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Uebung_name_key" ON "Uebung"("name");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");
