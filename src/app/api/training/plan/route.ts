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

    // Fetch active training plan with all nested data
    const plan = await prisma.trainingPlan.findFirst({
      where: {
        userId: user.id,
        istAktiv: true,
      },
      include: {
        einheiten: {
          orderBy: { wochentag: "asc" },
          include: {
            uebungen: {
              orderBy: { sortierung: "asc" },
              include: {
                uebung: true,
              },
            },
          },
        },
      },
    });

    if (!plan) {
      return NextResponse.json({ plan: null });
    }

    // Determine current week boundaries (Monday to Sunday)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(monday.getDate() + mondayOffset);

    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    // Check which einheiten have been completed this week
    const completedLogs = await prisma.workoutLog.findMany({
      where: {
        userId: user.id,
        trainingsEinheitId: {
          in: plan.einheiten.map((e) => e.id),
        },
        startZeit: {
          gte: monday,
          lte: sunday,
        },
        endZeit: {
          not: null,
        },
      },
      select: {
        trainingsEinheitId: true,
      },
    });

    const completedEinheitIds = new Set(
      completedLogs.map((log) => log.trainingsEinheitId)
    );

    // Format response
    const formattedPlan = {
      id: plan.id,
      name: plan.name,
      woche: plan.woche,
      istAktiv: plan.istAktiv,
      istDeload: plan.istDeload,
      startDatum: plan.startDatum,
      endDatum: plan.endDatum,
      einheiten: plan.einheiten.map((einheit) => ({
        id: einheit.id,
        name: einheit.name,
        wochentag: einheit.wochentag,
        typ: einheit.typ,
        aufwaermen: einheit.aufwaermen,
        cooldown: einheit.cooldown,
        sortierung: einheit.sortierung,
        anzahlUebungen: einheit.uebungen.length,
        istAbgeschlossen: completedEinheitIds.has(einheit.id),
      })),
    };

    return NextResponse.json({ plan: formattedPlan });
  } catch (error) {
    console.error("Training plan GET error:", error);
    return NextResponse.json(
      { error: "Fehler beim Laden des Trainingsplans." },
      { status: 500 }
    );
  }
}
