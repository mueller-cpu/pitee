import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Nicht authentifiziert." },
        { status: 401 }
      );
    }

    // Today's date boundaries
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const plan = await prisma.nutritionPlan.findFirst({
      where: {
        userId: user.id,
        datum: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        mahlzeiten: {
          orderBy: { sortierung: "asc" },
        },
      },
    });

    if (!plan) {
      return NextResponse.json({ plan: null });
    }

    return NextResponse.json({
      plan: {
        id: plan.id,
        datum: plan.datum,
        istTrainingstag: plan.istTrainingstag,
        kalorien: plan.kalorien,
        proteinG: plan.proteinG,
        kohlenhydrateG: plan.kohlenhydrateG,
        fettG: plan.fettG,
        leucinG: plan.leucinG,
        mahlzeiten: plan.mahlzeiten.map((m) => ({
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
    console.error("Tagesplan GET error:", error);
    return NextResponse.json(
      { error: "Fehler beim Laden des Ernährungsplans." },
      { status: 500 }
    );
  }
}
