import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildNutritionContext } from "@/lib/ai/context-builder";
import { generateCompletion } from "@/lib/ai/claude-client";
import { NUTRITION_PLAN_SYSTEM_PROMPT } from "@/lib/ai/system-prompts";
import { parseNutritionPlanResponse } from "@/lib/ai/response-parser";
import { berechneKalorien, berechneMakros } from "@/lib/calculations";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Nicht authentifiziert." },
        { status: 401 }
      );
    }

    if (!user.profile) {
      return NextResponse.json(
        { error: "Bitte erstelle zuerst dein Profil." },
        { status: 400 }
      );
    }

    const profile = user.profile;

    // Determine if today is a training day
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon...
    // Map JS day (0=Sun) to our wochentag (1=Mon...7=Sun)
    const wochentag = dayOfWeek === 0 ? 7 : dayOfWeek;

    const activePlan = await prisma.trainingPlan.findFirst({
      where: { userId: user.id, istAktiv: true },
      include: {
        einheiten: {
          select: { wochentag: true },
        },
      },
    });

    const trainingsWochentage = activePlan
      ? activePlan.einheiten.map((e) => e.wochentag)
      : [];
    const istTrainingstag = trainingsWochentage.includes(wochentag);

    // Calculate base macros
    const kalorienZiel = berechneKalorien(
      profile.gewicht,
      profile.groesse,
      profile.alter,
      profile.trainingstagePW,
      profile.hauptziel
    );

    // Adjust for training/rest day
    const tagesKalorien = istTrainingstag
      ? kalorienZiel + 200
      : kalorienZiel - 100;

    const makros = berechneMakros(profile.gewicht, tagesKalorien, profile.hauptziel);

    // Build context for AI
    const nutritionContext = await buildNutritionContext(user.id);

    const userMessage = `${nutritionContext}

## Berechnete Zielwerte für heute (${istTrainingstag ? "Trainingstag" : "Ruhetag"})
- Kalorien: ${tagesKalorien} kcal
- Protein: ${makros.proteinG}g (${(makros.proteinG / profile.gewicht).toFixed(1)}g/kg)
- Kohlenhydrate: ${makros.kohlenhydrateG}g
- Fett: ${makros.fettG}g

Erstelle einen Ernährungsplan für heute (${istTrainingstag ? "Trainingstag" : "Ruhetag"}).
${istTrainingstag ? "Bitte inkludiere eine Post-Workout-Mahlzeit mit mind. 40g Protein und 3g+ Leucin." : ""}
Achte auf mind. 25-30g Protein und 2.5g+ Leucin pro Mahlzeit.
Halte die Rezepte einfach und alltagstauglich.`;

    // Generate plan via AI
    const rawResponse = await generateCompletion(
      NUTRITION_PLAN_SYSTEM_PROMPT,
      userMessage,
      4096
    );

    const generated = parseNutritionPlanResponse(rawResponse);

    // Check if a plan already exists for today and delete it
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    await prisma.nutritionPlan.deleteMany({
      where: {
        userId: user.id,
        datum: {
          gte: todayStart,
          lt: todayEnd,
        },
      },
    });

    // Save to database
    const savedPlan = await prisma.nutritionPlan.create({
      data: {
        userId: user.id,
        datum: todayStart,
        istTrainingstag,
        kalorien: generated.kalorien,
        proteinG: generated.proteinG,
        kohlenhydrateG: generated.kohlenhydrateG,
        fettG: generated.fettG,
        leucinG: generated.leucinG,
        mahlzeiten: {
          create: generated.mahlzeiten.map((m, index) => ({
            name: m.name,
            uhrzeit: m.uhrzeit,
            kalorien: m.kalorien,
            proteinG: m.proteinG,
            kohlenhydrateG: m.kohlenhydrateG,
            fettG: m.fettG,
            leucinG: m.leucinG,
            rezept: m.rezept,
            istPostWorkout: m.istPostWorkout,
            sortierung: index,
          })),
        },
      },
      include: {
        mahlzeiten: {
          orderBy: { sortierung: "asc" },
        },
      },
    });

    return NextResponse.json({
      plan: {
        id: savedPlan.id,
        datum: savedPlan.datum,
        istTrainingstag: savedPlan.istTrainingstag,
        kalorien: savedPlan.kalorien,
        proteinG: savedPlan.proteinG,
        kohlenhydrateG: savedPlan.kohlenhydrateG,
        fettG: savedPlan.fettG,
        leucinG: savedPlan.leucinG,
        mahlzeiten: savedPlan.mahlzeiten.map((m) => ({
          id: m.id,
          name: m.name,
          uhrzeit: m.uhrzeit,
          kalorien: m.kalorien,
          proteinG: m.proteinG,
          kohlenhydrateG: m.kohlenhydrateG,
          fettG: m.fettG,
          leucinG: m.leucinG,
          rezept: m.rezept,
          istPostWorkout: m.istPostWorkout,
          sortierung: m.sortierung,
        })),
      },
    });
  } catch (error) {
    console.error("Ernährungsplan generieren error:", error);
    const message =
      error instanceof Error ? error.message : "Unbekannter Fehler";
    return NextResponse.json(
      { error: `Fehler bei der Plangenerierung: ${message}` },
      { status: 500 }
    );
  }
}
