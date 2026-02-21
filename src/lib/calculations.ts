/**
 * Fitness-Berechnungen: 1RM, BMI, Kalorien, Makros
 */

// Epley-Formel: 1RM = Gewicht × (1 + Wiederholungen / 30)
export function berechne1RM(gewicht: number, wiederholungen: number): number {
  if (wiederholungen <= 0 || gewicht <= 0) return 0;
  if (wiederholungen === 1) return gewicht;
  return Math.round(gewicht * (1 + wiederholungen / 30) * 10) / 10;
}

// BMI = Gewicht (kg) / (Größe (m))²
export function berechneBMI(gewichtKg: number, groesseCm: number): number {
  const groesseM = groesseCm / 100;
  return Math.round((gewichtKg / (groesseM * groesseM)) * 10) / 10;
}

// Mifflin-St Jeor: BMR-Berechnung geschlechtsspezifisch
// Männer: BMR = 10 × Gewicht + 6.25 × Größe − 5 × Alter + 5
// Frauen: BMR = 10 × Gewicht + 6.25 × Größe − 5 × Alter − 161
export function berechneBMR(
  gewichtKg: number,
  groesseCm: number,
  alter: number,
  geschlecht: string = "maennlich"
): number {
  const baseBMR = 10 * gewichtKg + 6.25 * groesseCm - 5 * alter;
  const geschlechtsFaktor = geschlecht === "weiblich" ? -161 : 5;
  return Math.round(baseBMR + geschlechtsFaktor);
}

// PAL-Faktoren
export function getPALFaktor(trainingstagePW: number): number {
  if (trainingstagePW <= 1) return 1.4;
  if (trainingstagePW <= 2) return 1.5;
  if (trainingstagePW <= 3) return 1.6;
  if (trainingstagePW <= 4) return 1.7;
  return 1.8;
}

// Kalorienbedarf (angepasst für 50+: geschlechtsspezifische Stoffwechsel-Reduktion)
// Männer 50+: -10% (Testosteron-Rückgang)
// Frauen 50+: -17% (Menopause, Östrogen-Abfall - stärker!)
export function berechneKalorien(
  gewichtKg: number,
  groesseCm: number,
  alter: number,
  trainingstagePW: number,
  ziel: string,
  geschlecht: string = "maennlich"
): number {
  const bmr = berechneBMR(gewichtKg, groesseCm, alter, geschlecht);
  const pal = getPALFaktor(trainingstagePW);

  // Geschlechtsspezifische Stoffwechsel-Reduktion für 50+
  const stoffwechselFaktor = geschlecht === "weiblich" ? 0.83 : 0.9;
  const tdee = Math.round(bmr * pal * stoffwechselFaktor);

  // Angepasste Überschüsse/Defizite für 50+ (vorsichtiger)
  switch (ziel) {
    case "muskelaufbau":
      return tdee + (geschlecht === "weiblich" ? 200 : 250);
    case "fettabbau":
      return tdee - (geschlecht === "weiblich" ? 300 : 350);
    case "kraft":
      return tdee + (geschlecht === "weiblich" ? 100 : 150);
    default: // gesundheit
      return tdee;
  }
}

// Makro-Berechnung (optimiert für Männer 50+)
export function berechneMakros(
  gewichtKg: number,
  kalorienZiel: number,
  ziel: string
): { proteinG: number; kohlenhydrateG: number; fettG: number } {
  // Protein: 1.6-2.0g/kg für Muskelaufbau, 1.2-1.6g/kg Erhalt (anabole Resistenz berücksichtigt)
  let proteinProKg: number;
  switch (ziel) {
    case "muskelaufbau":
    case "kraft":
      proteinProKg = 1.8;
      break;
    case "fettabbau":
      proteinProKg = 2.0; // Höher im Defizit
      break;
    default:
      proteinProKg = 1.4;
  }

  const proteinG = Math.round(gewichtKg * proteinProKg);
  const proteinKcal = proteinG * 4;

  // Fett: 25-30% der Kalorien (wichtig für Hormonproduktion)
  const fettKcal = Math.round(kalorienZiel * 0.28);
  const fettG = Math.round(fettKcal / 9);

  // Rest = Kohlenhydrate
  const kohlenhydrateKcal = kalorienZiel - proteinKcal - fettKcal;
  const kohlenhydrateG = Math.round(Math.max(kohlenhydrateKcal / 4, 100));

  return { proteinG, kohlenhydrateG, fettG };
}

// Fitnesslevel basierend auf 1RM und Körpergewicht (geschlechtsspezifisch)
export function bestimmeFitnessLevel(
  geschaetztes1RM: number,
  koerpergewicht: number,
  uebung: string,
  geschlecht: string = "maennlich"
): string {
  const verhaeltnis = geschaetztes1RM / koerpergewicht;

  // Schwellenwerte für 50+ (angepasst, geschlechtsspezifisch)
  const schwellenwerteM: Record<string, [number, number, number]> = {
    bankdruecken: [0.5, 0.75, 1.0],
    kniebeuge: [0.6, 0.9, 1.25],
    rudern: [0.4, 0.65, 0.85],
  };

  const schwellenwerteW: Record<string, [number, number, number]> = {
    bankdruecken: [0.3, 0.5, 0.7],     // Frauen ~60% der Männer-Werte
    kniebeuge: [0.4, 0.6, 0.9],
    rudern: [0.25, 0.4, 0.6],
  };

  const schwellenwerte = geschlecht === "weiblich" ? schwellenwerteW : schwellenwerteM;
  const schwellen = schwellenwerte[uebung] || (geschlecht === "weiblich" ? [0.25, 0.4, 0.6] : [0.4, 0.65, 0.85]);

  if (verhaeltnis < schwellen[0]) return "einsteiger";
  if (verhaeltnis < schwellen[1]) return "grundlagen";
  if (verhaeltnis < schwellen[2]) return "mittel";
  return "fortgeschritten";
}

// Leucin-Gehalt schätzen basierend auf Protein-Menge und Quelle
export function schaetzeLeucin(proteinG: number, quelle: string): number {
  // Leucin-Anteil am Gesamtprotein (%)
  const leucinAnteile: Record<string, number> = {
    whey: 0.11,      // 11% Leucin
    huhn: 0.075,     // 7.5%
    rind: 0.08,      // 8%
    fisch: 0.08,     // 8%
    eier: 0.085,     // 8.5%
    milch: 0.1,      // 10%
    soja: 0.065,     // 6.5%
    huelse: 0.065,   // 6.5%
    default: 0.075,  // 7.5% Durchschnitt
  };

  const anteil = leucinAnteile[quelle] || leucinAnteile.default;
  return Math.round(proteinG * anteil * 10) / 10;
}

// Progressive Overload: Nächstes Gewicht berechnen
export function berechneProgressiveOverload(
  letztesSatzGewicht: number,
  letzteSatzReps: number,
  zielRepsMax: number
): { neuesGewicht: number; empfehlung: string } {
  if (letzteSatzReps >= zielRepsMax) {
    // Ziel-Reps erreicht → Gewicht erhöhen
    const neuesGewicht = letztesSatzGewicht + 2.5;
    return {
      neuesGewicht,
      empfehlung: `Gewicht um 2.5 kg erhöhen auf ${neuesGewicht} kg`,
    };
  }
  return {
    neuesGewicht: letztesSatzGewicht,
    empfehlung: `Bei ${letztesSatzGewicht} kg bleiben, Reps steigern`,
  };
}
