import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

interface SatzLogInput {
  satzNummer: number;
  gewicht: number | null;
  wiederholungen: number | null;
  rir: number | null;
  rpe: number | null;
  notiz: string | null;
  dauer: number | null;
}

interface UebungLogInput {
  uebungName: string;
  sortierung: number;
  rpe: number | null;
  notiz: string | null;
  satzLogs: SatzLogInput[];
}

interface WorkoutSaveBody {
  trainingsEinheitId: string;
  startZeit: string;
  endZeit: string;
  gesamtRPE: number | null;
  notizen: string | null;
  uebungLogs: UebungLogInput[];
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Nicht authentifiziert." },
        { status: 401 }
      );
    }

    const body: WorkoutSaveBody = await request.json();

    if (!body.trainingsEinheitId || !body.startZeit || !body.endZeit) {
      return NextResponse.json(
        { error: "Pflichtfelder fehlen." },
        { status: 400 }
      );
    }

    if (!body.uebungLogs || body.uebungLogs.length === 0) {
      return NextResponse.json(
        { error: "Keine Übungsdaten vorhanden." },
        { status: 400 }
      );
    }

    // Verify the einheit belongs to this user
    const einheit = await prisma.trainingsEinheit.findUnique({
      where: { id: body.trainingsEinheitId },
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

    // Create the workout log with nested uebung and satz logs
    const workoutLog = await prisma.workoutLog.create({
      data: {
        userId: user.id,
        trainingsEinheitId: body.trainingsEinheitId,
        startZeit: new Date(body.startZeit),
        endZeit: new Date(body.endZeit),
        gesamtRPE: body.gesamtRPE,
        notizen: body.notizen,
        uebungLogs: {
          create: body.uebungLogs.map((ul) => ({
            uebungName: ul.uebungName,
            sortierung: ul.sortierung,
            satzLogs: {
              create: ul.satzLogs.map((sl) => ({
                satzNummer: sl.satzNummer,
                gewicht: sl.gewicht,
                wiederholungen: sl.wiederholungen,
                rir: sl.rir,
                rpe: sl.rpe,
                notiz: sl.notiz,
                dauer: sl.dauer,
              })),
            },
          })),
        },
      },
      include: {
        uebungLogs: {
          include: { satzLogs: true },
        },
      },
    });

    return NextResponse.json({ success: true, workoutLogId: workoutLog.id });
  } catch (error) {
    console.error("Workout save error:", error);
    return NextResponse.json(
      { error: "Fehler beim Speichern des Workouts." },
      { status: 500 }
    );
  }
}
