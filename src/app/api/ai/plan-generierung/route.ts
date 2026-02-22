import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateCompletion } from "@/lib/ai/claude-client";
import { getTrainingPlanSystemPrompt } from "@/lib/ai/system-prompts";
import { buildUserContext } from "@/lib/ai/context-builder";
import {
  parseTrainingPlanResponse,
  mapExerciseNamesToIds,
} from "@/lib/ai/response-parser";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Nicht authentifiziert." },
        { status: 401 }
      );
    }

    // Check that onboarding is complete
    if (!user.profile?.onboardingDone) {
      return NextResponse.json(
        { error: "Bitte schließe zuerst das Onboarding ab." },
        { status: 400 }
      );
    }

    // Get gender-specific system prompt
    const geschlecht = user.profile.geschlecht === "weiblich" ? "weiblich" : "maennlich";
    const systemPrompt = getTrainingPlanSystemPrompt(geschlecht);

    // Build user context
    const userContext = await buildUserContext(user.id);

    // Generate prompt message
    const userMessage = `Erstelle einen individuellen Trainingsplan basierend auf folgendem Nutzerprofil:

${userContext}

Erstelle einen ${user.profile.trainingstagePW}-Tage-Trainingsplan (pro Woche) für das Ziel "${user.profile.hauptziel}".
Berücksichtige alle Gelenkprobleme und das Fitnesslevel bei der Übungsauswahl.${geschlecht === "weiblich" ? "\nWICHTIG: Berücksichtige die Menopause-spezifischen Anforderungen für Frauen 50+ (Osteoporose-Prävention, Beckenboden-Training, Gelenkschutz)." : ""}`;

    // Call Claude
    const rawResponse = await generateCompletion(
      systemPrompt,
      userMessage,
      4096
    );

    // Parse the response
    const generatedPlan = parseTrainingPlanResponse(rawResponse);

    // Collect all exercise names for ID mapping
    const allExerciseNames = generatedPlan.einheiten.flatMap((e) =>
      e.uebungen.map((u) => u.uebungName)
    );
    const uniqueNames = [...new Set(allExerciseNames)];
    const nameToIdMap = await mapExerciseNamesToIds(uniqueNames);

    // Deactivate existing active plans
    await prisma.trainingPlan.updateMany({
      where: { userId: user.id, istAktiv: true },
      data: { istAktiv: false },
    });

    // Save to database using a transaction
    const now = new Date();
    const endDatum = new Date(now);
    endDatum.setDate(endDatum.getDate() + 28); // 4 weeks

    const createdPlan = await prisma.$transaction(async (tx) => {
      // Create TrainingPlan
      const plan = await tx.trainingPlan.create({
        data: {
          userId: user.id,
          name: generatedPlan.name,
          woche: 1,
          istAktiv: true,
          istDeload: false,
          startDatum: now,
          endDatum: endDatum,
        },
      });

      // Create TrainingsEinheiten with PlanUebungen
      for (let eIdx = 0; eIdx < generatedPlan.einheiten.length; eIdx++) {
        const einheit = generatedPlan.einheiten[eIdx];

        const createdEinheit = await tx.trainingsEinheit.create({
          data: {
            trainingPlanId: plan.id,
            name: einheit.name,
            wochentag: einheit.wochentag,
            typ: einheit.typ,
            aufwaermen: einheit.aufwaermen || null,
            cooldown: einheit.cooldown || null,
            sortierung: eIdx,
          },
        });

        // Create PlanUebungen
        for (let uIdx = 0; uIdx < einheit.uebungen.length; uIdx++) {
          const uebung = einheit.uebungen[uIdx];
          const uebungId = nameToIdMap.get(uebung.uebungName);

          if (!uebungId) {
            throw new Error(
              `Übung '${uebung.uebungName}' konnte nicht zugeordnet werden.`
            );
          }

          await tx.planUebung.create({
            data: {
              trainingsEinheitId: createdEinheit.id,
              uebungId: uebungId,
              saetze: uebung.saetze,
              wiederholungen: uebung.wiederholungen,
              gewicht: uebung.gewicht,
              rir: uebung.rir,
              pauseSekunden: uebung.pauseSekunden,
              tempo: uebung.tempo,
              notizen: uebung.notizen,
              sortierung: uIdx,
            },
          });
        }
      }

      return plan;
    });

    return NextResponse.json({
      success: true,
      planId: createdPlan.id,
      planName: createdPlan.name,
    });
  } catch (error) {
    console.error("Plan-Generierung API error:", error);

    const message =
      error instanceof Error ? error.message : "Interner Serverfehler.";

    return NextResponse.json(
      { error: `Fehler bei der Plangenerierung: ${message}` },
      { status: 500 }
    );
  }
}
