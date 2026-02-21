import { prisma } from "@/lib/db";

export async function buildUserContext(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      healthProfile: true,
      gelenkProbleme: true,
      fitnessTests: {
        orderBy: { datum: "desc" },
        take: 1,
        include: { ergebnisse: true },
      },
      workoutLogs: {
        orderBy: { startZeit: "desc" },
        take: 20,
        include: {
          uebungLogs: {
            include: { satzLogs: true },
          },
          trainingsEinheit: true,
        },
      },
      wellnessLogs: {
        orderBy: { datum: "desc" },
        take: 7,
      },
    },
  });

  if (!user) throw new Error("Nutzer nicht gefunden");

  // Übungskatalog laden
  const uebungen = await prisma.uebung.findMany({
    select: { name: true, kategorie: true, geraet: true, gelenkbelastung: true, istMaschinenVariante: true },
  });

  const sections: string[] = [];

  // ── Persönliche Daten ──
  if (user.profile) {
    const p = user.profile;
    sections.push(`## Persönliche Daten
- Name: ${user.name}
- Alter: ${p.alter} Jahre
- Gewicht: ${p.gewicht} kg
- Größe: ${p.groesse} cm
- BMI: ${p.bmi ?? "nicht berechnet"}
- Erfahrung: ${p.erfahrung}
- Hauptziel: ${p.hauptziel}
- Trainingstage pro Woche: ${p.trainingstagePW}
- Fitnesslevel: ${p.fitnessLevel ?? "nicht getestet"}`);
  }

  // ── Gesundheitsprofil ──
  if (user.healthProfile) {
    const h = user.healthProfile;
    const conditions: string[] = [];
    if (h.herzKreislauf) conditions.push("Herz-Kreislauf-Erkrankung");
    if (h.bluthochdruck) conditions.push("Bluthochdruck");
    if (h.diabetes) conditions.push("Diabetes");

    sections.push(`## Gesundheitsprofil
- Vorerkrankungen: ${conditions.length > 0 ? conditions.join(", ") : "keine"}
- Medikamente: ${h.medikamente || "keine"}
- Sonstige Vorerkrankungen: ${h.vorerkrankungen || "keine"}
- Ärztliche Freigabe: ${h.aerztlicheFreigabe ? "Ja" : "Nein"}`);
  }

  // ── Gelenkprobleme ──
  if (user.gelenkProbleme.length > 0) {
    const gelenkLines = user.gelenkProbleme.map((gp) => {
      const schwere = gp.schweregrad === 1 ? "leicht" : gp.schweregrad === 2 ? "mittel" : "stark";
      return `- ${gp.gelenk} (${gp.seite}): ${schwere}${gp.notiz ? ` – ${gp.notiz}` : ""}`;
    });
    sections.push(`## Gelenkprobleme
${gelenkLines.join("\n")}`);
  } else {
    sections.push(`## Gelenkprobleme
Keine Gelenkprobleme angegeben.`);
  }

  // ── Fitnesstest-Ergebnisse ──
  const latestTest = user.fitnessTests[0];
  if (latestTest && latestTest.ergebnisse.length > 0) {
    const ergebnisLines = latestTest.ergebnisse.map((e) => {
      const parts: string[] = [`- ${e.uebungName}`];
      if (e.gewicht) parts.push(`Gewicht: ${e.gewicht} kg`);
      if (e.wiederholungen) parts.push(`Wdh: ${e.wiederholungen}`);
      if (e.dauer) parts.push(`Dauer: ${e.dauer}s`);
      if (e.geschaetztes1RM) parts.push(`geschätztes 1RM: ${e.geschaetztes1RM} kg`);
      if (e.fitnessLevel) parts.push(`Level: ${e.fitnessLevel}`);
      return parts.join(" | ");
    });
    sections.push(`## Fitnesstest-Ergebnisse (${latestTest.datum.toISOString().split("T")[0]})
${ergebnisLines.join("\n")}`);
  } else {
    sections.push(`## Fitnesstest-Ergebnisse
Kein Fitnesstest durchgeführt.`);
  }

  // ── Trainingshistorie (letzte 4 Wochen) ──
  if (user.workoutLogs.length > 0) {
    const logLines = user.workoutLogs.map((log) => {
      const datum = log.startZeit.toISOString().split("T")[0];
      const einheit = log.trainingsEinheit.name;
      const uebungsSummary = log.uebungLogs
        .map((ul) => {
          const bestSatz = ul.satzLogs.reduce(
            (best, s) => (s.gewicht && (!best.gewicht || s.gewicht > best.gewicht) ? s : best),
            ul.satzLogs[0]
          );
          if (bestSatz) {
            return `${ul.uebungName}: ${bestSatz.gewicht ?? 0}kg x ${bestSatz.wiederholungen ?? 0}`;
          }
          return ul.uebungName;
        })
        .join(", ");
      return `- ${datum} ${einheit}: ${uebungsSummary}${log.gesamtRPE ? ` (RPE ${log.gesamtRPE})` : ""}`;
    });
    sections.push(`## Trainingshistorie (letzte Einheiten)
${logLines.join("\n")}`);
  } else {
    sections.push(`## Trainingshistorie
Keine bisherigen Trainingseinheiten dokumentiert.`);
  }

  // ── Wellness-Daten (letzte 7 Tage) ──
  if (user.wellnessLogs.length > 0) {
    const wellnessLines = user.wellnessLogs.map((w) => {
      const datum = w.datum.toISOString().split("T")[0];
      const parts: string[] = [`- ${datum}`];
      if (w.schlafStunden) parts.push(`Schlaf: ${w.schlafStunden}h (Qualität: ${w.schlafQualitaet ?? "?"})`);
      if (w.energie) parts.push(`Energie: ${w.energie}/5`);
      if (w.stress) parts.push(`Stress: ${w.stress}/5`);
      if (w.muskelkater) parts.push(`Muskelkater: ${w.muskelkater}/5`);
      return parts.join(" | ");
    });
    sections.push(`## Wellness-Daten (letzte 7 Tage)
${wellnessLines.join("\n")}`);
  }

  // ── Verfügbarer Übungskatalog ──
  const uebungLines = uebungen.map(
    (u) => `- ${u.name} [${u.kategorie}] (${u.geraet})${u.istMaschinenVariante ? " [Maschine]" : ""} – Gelenkbelastung: ${u.gelenkbelastung}`
  );
  sections.push(`## Verfügbarer Übungskatalog
Verwende NUR diese Übungsnamen:
${uebungLines.join("\n")}`);

  return sections.join("\n\n");
}

export async function buildNutritionContext(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      healthProfile: true,
      nutritionLogs: {
        orderBy: { datum: "desc" },
        take: 14,
      },
      bodyMetrics: {
        orderBy: { datum: "desc" },
        take: 4,
      },
      wellnessLogs: {
        orderBy: { datum: "desc" },
        take: 7,
      },
      workoutLogs: {
        orderBy: { startZeit: "desc" },
        take: 7,
      },
    },
  });

  if (!user) throw new Error("Nutzer nicht gefunden");

  const sections: string[] = [];

  // ── Persönliche Daten ──
  if (user.profile) {
    const p = user.profile;
    sections.push(`## Persönliche Daten
- Name: ${user.name}
- Alter: ${p.alter} Jahre
- Gewicht: ${p.gewicht} kg
- Größe: ${p.groesse} cm
- BMI: ${p.bmi ?? "nicht berechnet"}
- Hauptziel: ${p.hauptziel}
- Trainingstage pro Woche: ${p.trainingstagePW}`);
  }

  // ── Gesundheitsprofil ──
  if (user.healthProfile) {
    const h = user.healthProfile;
    const conditions: string[] = [];
    if (h.herzKreislauf) conditions.push("Herz-Kreislauf-Erkrankung");
    if (h.bluthochdruck) conditions.push("Bluthochdruck");
    if (h.diabetes) conditions.push("Diabetes");

    sections.push(`## Gesundheit (ernährungsrelevant)
- Vorerkrankungen: ${conditions.length > 0 ? conditions.join(", ") : "keine"}
- Medikamente: ${h.medikamente || "keine"}
- Diabetes: ${h.diabetes ? "Ja – Kohlenhydrate beachten!" : "Nein"}`);
  }

  // ── Körpermetriken ──
  if (user.bodyMetrics.length > 0) {
    const metrikLines = user.bodyMetrics.map((m) => {
      const datum = m.datum.toISOString().split("T")[0];
      const parts: string[] = [`- ${datum}`];
      if (m.gewicht) parts.push(`${m.gewicht} kg`);
      if (m.koerperfett) parts.push(`KFA: ${m.koerperfett}%`);
      if (m.taillenumfang) parts.push(`Taille: ${m.taillenumfang} cm`);
      return parts.join(" | ");
    });
    sections.push(`## Körpermetriken (letzte Messungen)
${metrikLines.join("\n")}`);
  }

  // ── Ernährungslogs ──
  if (user.nutritionLogs.length > 0) {
    const logLines = user.nutritionLogs.slice(0, 7).map((nl) => {
      const datum = nl.datum.toISOString().split("T")[0];
      return `- ${datum} ${nl.mahlzeitName}: ${nl.kalorien ?? "?"} kcal, ${nl.proteinG ?? "?"}g Protein`;
    });
    sections.push(`## Letzte Ernährungslogs
${logLines.join("\n")}`);
  }

  // ── Trainingstage diese Woche ──
  if (user.workoutLogs.length > 0) {
    const recentDates = user.workoutLogs
      .map((l) => l.startZeit.toISOString().split("T")[0]);
    sections.push(`## Letzte Trainingstage
${recentDates.map((d) => `- ${d}`).join("\n")}`);
  }

  return sections.join("\n\n");
}

export async function buildChatContext(userId: string): Promise<string> {
  // Combines training + nutrition context for the coaching chat
  const trainingContext = await buildUserContext(userId);
  // Remove the exercise catalog from the chat context (too long)
  const withoutCatalog = trainingContext.split("## Verfügbarer Übungskatalog")[0].trim();
  return withoutCatalog;
}
