import { prisma } from "@/lib/db";

// ─── Types ──────────────────────────────────────────────────────────

export interface GeneratedUebung {
  uebungName: string;
  saetze: number;
  wiederholungen: string;
  gewicht: number | null;
  rir: number;
  pauseSekunden: number;
  tempo: string;
  notizen: string | null;
}

export interface GeneratedEinheit {
  name: string;
  wochentag: number;
  typ: string;
  aufwaermen: string;
  cooldown: string;
  uebungen: GeneratedUebung[];
}

export interface GeneratedTrainingPlan {
  name: string;
  einheiten: GeneratedEinheit[];
}

export interface GeneratedNutritionPlan {
  kalorien: number;
  proteinG: number;
  kohlenhydrateG: number;
  fettG: number;
  leucinG: number;
  mahlzeiten: Array<{
    name: string;
    uhrzeit: string | null;
    kalorien: number;
    proteinG: number;
    kohlenhydrateG: number;
    fettG: number;
    leucinG: number | null;
    rezept: string | null;
    istPostWorkout: boolean;
  }>;
}

// ─── JSON Extraction ────────────────────────────────────────────────

/**
 * Extracts JSON from a response that may contain markdown code blocks
 */
export function extractJSON(rawResponse: string): string {
  // Try to extract from markdown code block
  const codeBlockMatch = rawResponse.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  // Try to find raw JSON (starts with { and ends with })
  const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0].trim();
  }

  throw new Error("Kein JSON in der KI-Antwort gefunden. Rohantwort: " + rawResponse.slice(0, 200));
}

// ─── Training Plan Parser ───────────────────────────────────────────

export function parseTrainingPlanResponse(rawResponse: string): GeneratedTrainingPlan {
  const jsonString = extractJSON(rawResponse);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch (e) {
    throw new Error(`Ungültiges JSON in der KI-Antwort: ${(e as Error).message}`);
  }

  const plan = parsed as Record<string, unknown>;

  // Validate top-level fields
  if (!plan.name || typeof plan.name !== "string") {
    throw new Error("Trainingsplan: Feld 'name' fehlt oder ist kein String");
  }

  if (!Array.isArray(plan.einheiten) || plan.einheiten.length === 0) {
    throw new Error("Trainingsplan: Feld 'einheiten' fehlt oder ist leer");
  }

  // Validate each einheit
  const einheiten: GeneratedEinheit[] = plan.einheiten.map(
    (einheit: Record<string, unknown>, idx: number) => {
      if (!einheit.name || typeof einheit.name !== "string") {
        throw new Error(`Einheit ${idx + 1}: Feld 'name' fehlt`);
      }
      if (typeof einheit.wochentag !== "number" || einheit.wochentag < 0 || einheit.wochentag > 6) {
        throw new Error(`Einheit ${idx + 1}: 'wochentag' muss eine Zahl zwischen 0 und 6 sein`);
      }
      if (!einheit.typ || typeof einheit.typ !== "string") {
        throw new Error(`Einheit ${idx + 1}: Feld 'typ' fehlt`);
      }
      if (!Array.isArray(einheit.uebungen) || einheit.uebungen.length === 0) {
        throw new Error(`Einheit ${idx + 1} (${einheit.name}): Keine Übungen vorhanden`);
      }

      // Validate each uebung
      const uebungen: GeneratedUebung[] = einheit.uebungen.map(
        (uebung: Record<string, unknown>, uIdx: number) => {
          if (!uebung.uebungName || typeof uebung.uebungName !== "string") {
            throw new Error(`Einheit ${idx + 1}, Übung ${uIdx + 1}: 'uebungName' fehlt`);
          }
          if (typeof uebung.saetze !== "number" || uebung.saetze < 1) {
            throw new Error(
              `Einheit ${idx + 1}, Übung '${uebung.uebungName}': 'saetze' muss mindestens 1 sein`
            );
          }
          if (!uebung.wiederholungen || typeof uebung.wiederholungen !== "string") {
            throw new Error(
              `Einheit ${idx + 1}, Übung '${uebung.uebungName}': 'wiederholungen' fehlt`
            );
          }

          return {
            uebungName: uebung.uebungName as string,
            saetze: uebung.saetze as number,
            wiederholungen: uebung.wiederholungen as string,
            gewicht: typeof uebung.gewicht === "number" ? uebung.gewicht : null,
            rir: typeof uebung.rir === "number" ? uebung.rir : 2,
            pauseSekunden: typeof uebung.pauseSekunden === "number" ? uebung.pauseSekunden : 120,
            tempo: typeof uebung.tempo === "string" ? uebung.tempo : "3-1-2-0",
            notizen: typeof uebung.notizen === "string" ? uebung.notizen : null,
          };
        }
      );

      return {
        name: einheit.name as string,
        wochentag: einheit.wochentag as number,
        typ: einheit.typ as string,
        aufwaermen: typeof einheit.aufwaermen === "string" ? einheit.aufwaermen : "",
        cooldown: typeof einheit.cooldown === "string" ? einheit.cooldown : "",
        uebungen,
      };
    }
  );

  return {
    name: plan.name as string,
    einheiten,
  };
}

// ─── Nutrition Plan Parser ──────────────────────────────────────────

export function parseNutritionPlanResponse(rawResponse: string): GeneratedNutritionPlan {
  const jsonString = extractJSON(rawResponse);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch (e) {
    throw new Error(`Ungültiges JSON in der Ernährungsplan-Antwort: ${(e as Error).message}`);
  }

  const plan = parsed as Record<string, unknown>;

  if (typeof plan.kalorien !== "number") {
    throw new Error("Ernährungsplan: 'kalorien' fehlt oder ist keine Zahl");
  }
  if (typeof plan.proteinG !== "number") {
    throw new Error("Ernährungsplan: 'proteinG' fehlt oder ist keine Zahl");
  }
  if (!Array.isArray(plan.mahlzeiten) || plan.mahlzeiten.length === 0) {
    throw new Error("Ernährungsplan: 'mahlzeiten' fehlt oder ist leer");
  }

  return {
    kalorien: plan.kalorien as number,
    proteinG: plan.proteinG as number,
    kohlenhydrateG: typeof plan.kohlenhydrateG === "number" ? plan.kohlenhydrateG : 0,
    fettG: typeof plan.fettG === "number" ? plan.fettG : 0,
    leucinG: typeof plan.leucinG === "number" ? plan.leucinG : 0,
    mahlzeiten: (plan.mahlzeiten as Array<Record<string, unknown>>).map((m) => ({
      name: (m.name as string) || "Mahlzeit",
      uhrzeit: typeof m.uhrzeit === "string" ? m.uhrzeit : null,
      kalorien: typeof m.kalorien === "number" ? m.kalorien : 0,
      proteinG: typeof m.proteinG === "number" ? m.proteinG : 0,
      kohlenhydrateG: typeof m.kohlenhydrateG === "number" ? m.kohlenhydrateG : 0,
      fettG: typeof m.fettG === "number" ? m.fettG : 0,
      leucinG: typeof m.leucinG === "number" ? m.leucinG : null,
      rezept: typeof m.rezept === "string" ? m.rezept : null,
      istPostWorkout: m.istPostWorkout === true,
    })),
  };
}

// ─── Exercise Name Matching ─────────────────────────────────────────

/**
 * Maps exercise names from the AI response to database Uebung IDs.
 * Uses exact matching first, then fuzzy matching as fallback.
 */
export async function mapExerciseNamesToIds(
  exerciseNames: string[]
): Promise<Map<string, string>> {
  const allUebungen = await prisma.uebung.findMany({
    select: { id: true, name: true },
  });

  const nameToId = new Map<string, string>();
  const unmatchedNames: string[] = [];

  for (const name of exerciseNames) {
    // Exact match
    const exactMatch = allUebungen.find((u) => u.name === name);
    if (exactMatch) {
      nameToId.set(name, exactMatch.id);
      continue;
    }

    // Case-insensitive match
    const caseMatch = allUebungen.find(
      (u) => u.name.toLowerCase() === name.toLowerCase()
    );
    if (caseMatch) {
      nameToId.set(name, caseMatch.id);
      continue;
    }

    // Fuzzy match: check if one contains the other
    const fuzzyMatch = allUebungen.find(
      (u) =>
        u.name.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(u.name.toLowerCase())
    );
    if (fuzzyMatch) {
      nameToId.set(name, fuzzyMatch.id);
      continue;
    }

    // Levenshtein-based fuzzy match
    const bestMatch = findClosestMatch(name, allUebungen.map((u) => u.name));
    if (bestMatch) {
      const matchedUebung = allUebungen.find((u) => u.name === bestMatch);
      if (matchedUebung) {
        nameToId.set(name, matchedUebung.id);
        continue;
      }
    }

    unmatchedNames.push(name);
  }

  if (unmatchedNames.length > 0) {
    throw new Error(
      `Folgende Übungen konnten nicht zugeordnet werden: ${unmatchedNames.join(", ")}. ` +
      `Verfügbare Übungen: ${allUebungen.map((u) => u.name).join(", ")}`
    );
  }

  return nameToId;
}

/**
 * Simple Levenshtein distance for fuzzy matching
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

function findClosestMatch(name: string, candidates: string[]): string | null {
  const normalizedName = name.toLowerCase();
  let bestMatch: string | null = null;
  let bestDistance = Infinity;

  for (const candidate of candidates) {
    const distance = levenshteinDistance(normalizedName, candidate.toLowerCase());
    // Only accept matches with distance <= 30% of the longer string
    const maxLen = Math.max(normalizedName.length, candidate.length);
    if (distance < bestDistance && distance <= maxLen * 0.3) {
      bestDistance = distance;
      bestMatch = candidate;
    }
  }

  return bestMatch;
}
