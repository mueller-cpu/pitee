import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ einheitId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Nicht authentifiziert." },
        { status: 401 }
      );
    }

    const { einheitId } = await params;

    // Verify the einheit belongs to this user
    const einheit = await prisma.trainingsEinheit.findUnique({
      where: { id: einheitId },
      include: {
        trainingPlan: { select: { userId: true } },
      },
    });

    if (!einheit || einheit.trainingPlan.userId !== user.id) {
      return NextResponse.json(
        { error: "Keine Berechtigung." },
        { status: 403 }
      );
    }

    // Find the most recent workout log for this einheit
    const letztesWorkout = await prisma.workoutLog.findFirst({
      where: {
        trainingsEinheitId: einheitId,
        userId: user.id,
      },
      orderBy: { createdAt: "desc" },
      include: {
        uebungLogs: {
          orderBy: { sortierung: "asc" },
          include: {
            satzLogs: {
              orderBy: { satzNummer: "asc" },
            },
          },
        },
      },
    });

    if (!letztesWorkout) {
      return NextResponse.json({ letzteDaten: null });
    }

    // Format the response
    const letzteDaten = {
      id: letztesWorkout.id,
      datum: letztesWorkout.startZeit.toISOString(),
      gesamtRPE: letztesWorkout.gesamtRPE,
      uebungLogs: letztesWorkout.uebungLogs.map((ul) => ({
        uebungName: ul.uebungName,
        sortierung: ul.sortierung,
        satzLogs: ul.satzLogs.map((sl) => ({
          satzNummer: sl.satzNummer,
          gewicht: sl.gewicht,
          wiederholungen: sl.wiederholungen,
          rir: sl.rir,
          rpe: sl.rpe,
          dauer: sl.dauer,
        })),
      })),
    };

    return NextResponse.json({ letzteDaten });
  } catch (error) {
    console.error("Letzte Daten GET error:", error);
    return NextResponse.json(
      { error: "Fehler beim Laden der letzten Trainingsdaten." },
      { status: 500 }
    );
  }
}
