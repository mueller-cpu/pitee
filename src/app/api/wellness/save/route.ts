import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

interface WellnessSaveBody {
  schlafStunden: number | null;
  schlafQualitaet: number | null;
  energie: number | null;
  stress: number | null;
  muskelkater: number | null;
  stimmung: number | null;
  notiz: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Nicht authentifiziert." }, { status: 401 });
    }

    const body: WellnessSaveBody = await request.json();

    // Today's date at midnight for upsert matching
    const heute = new Date();
    heute.setHours(0, 0, 0, 0);

    const morgen = new Date(heute);
    morgen.setDate(morgen.getDate() + 1);

    // Check if there's already a log for today
    const existing = await prisma.wellnessLog.findFirst({
      where: {
        userId: user.id,
        datum: {
          gte: heute,
          lt: morgen,
        },
      },
    });

    let wellnessLog;

    if (existing) {
      wellnessLog = await prisma.wellnessLog.update({
        where: { id: existing.id },
        data: {
          schlafStunden: body.schlafStunden,
          schlafQualitaet: body.schlafQualitaet,
          energie: body.energie,
          stress: body.stress,
          muskelkater: body.muskelkater,
          stimmung: body.stimmung,
          notiz: body.notiz,
        },
      });
    } else {
      wellnessLog = await prisma.wellnessLog.create({
        data: {
          userId: user.id,
          datum: heute,
          schlafStunden: body.schlafStunden,
          schlafQualitaet: body.schlafQualitaet,
          energie: body.energie,
          stress: body.stress,
          muskelkater: body.muskelkater,
          stimmung: body.stimmung,
          notiz: body.notiz,
        },
      });
    }

    return NextResponse.json({ success: true, wellnessLog });
  } catch (error) {
    console.error("Wellness save error:", error);
    return NextResponse.json(
      { error: "Fehler beim Speichern des Wellness-Check-ins." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Nicht authentifiziert." }, { status: 401 });
    }

    // Return last 7 days of wellness data
    const siebenTageZurueck = new Date();
    siebenTageZurueck.setDate(siebenTageZurueck.getDate() - 7);
    siebenTageZurueck.setHours(0, 0, 0, 0);

    const logs = await prisma.wellnessLog.findMany({
      where: {
        userId: user.id,
        datum: { gte: siebenTageZurueck },
      },
      orderBy: { datum: "asc" },
    });

    // Also return today's log if exists
    const heute = new Date();
    heute.setHours(0, 0, 0, 0);
    const morgen = new Date(heute);
    morgen.setDate(morgen.getDate() + 1);

    const todayLog = await prisma.wellnessLog.findFirst({
      where: {
        userId: user.id,
        datum: { gte: heute, lt: morgen },
      },
    });

    return NextResponse.json({
      logs: logs.map((l) => ({
        ...l,
        datum: l.datum.toISOString().split("T")[0],
      })),
      todayLog: todayLog
        ? { ...todayLog, datum: todayLog.datum.toISOString().split("T")[0] }
        : null,
    });
  } catch (error) {
    console.error("Wellness GET error:", error);
    return NextResponse.json(
      { error: "Fehler beim Laden der Wellness-Daten." },
      { status: 500 }
    );
  }
}
