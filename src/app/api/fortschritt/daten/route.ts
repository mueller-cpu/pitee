import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { berechne1RM } from "@/lib/calculations";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Nicht authentifiziert." }, { status: 401 });
    }

    // ── Kraft-Daten: 1RM pro Uebung pro Workout ──
    const workoutLogs = await prisma.workoutLog.findMany({
      where: { userId: user.id },
      orderBy: { startZeit: "asc" },
      include: {
        uebungLogs: {
          include: { satzLogs: true },
        },
      },
    });

    // Build kraft data: per exercise, the best estimated 1RM per workout date
    const kraftMap: Record<string, { datum: string; geschaetztes1RM: number }[]> = {};

    for (const wl of workoutLogs) {
      const datum = wl.startZeit.toISOString().split("T")[0];

      for (const ul of wl.uebungLogs) {
        let best1RM = 0;

        for (const sl of ul.satzLogs) {
          if (sl.gewicht && sl.wiederholungen && sl.gewicht > 0 && sl.wiederholungen > 0) {
            const est = berechne1RM(sl.gewicht, sl.wiederholungen);
            if (est > best1RM) best1RM = est;
          }
        }

        if (best1RM > 0) {
          if (!kraftMap[ul.uebungName]) {
            kraftMap[ul.uebungName] = [];
          }
          kraftMap[ul.uebungName].push({ datum, geschaetztes1RM: best1RM });
        }
      }
    }

    const kraftDaten = Object.entries(kraftMap).map(([uebungName, daten]) => ({
      uebungName,
      daten,
    }));

    // ── Koerper-Daten ──
    const koerperDaten = await prisma.bodyMetric.findMany({
      where: { userId: user.id },
      orderBy: { datum: "asc" },
      select: {
        datum: true,
        gewicht: true,
        koerperfett: true,
        brustumfang: true,
        taillenumfang: true,
        oberarmumfang: true,
        oberschenkelumfang: true,
      },
    });

    // ── Volumen-Daten: weekly aggregates ──
    const volumenMap: Record<string, number> = {};

    for (const wl of workoutLogs) {
      // Calculate ISO week start (Monday)
      const d = new Date(wl.startZeit);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const weekStart = new Date(d.setDate(diff));
      const weekKey = weekStart.toISOString().split("T")[0];

      let totalVolume = 0;
      for (const ul of wl.uebungLogs) {
        for (const sl of ul.satzLogs) {
          if (sl.gewicht && sl.wiederholungen) {
            totalVolume += sl.gewicht * sl.wiederholungen;
          }
        }
      }

      volumenMap[weekKey] = (volumenMap[weekKey] || 0) + totalVolume;
    }

    const volumenDaten = Object.entries(volumenMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([woche, volumen]) => ({ woche, volumen: Math.round(volumen) }));

    return NextResponse.json({
      kraftDaten,
      koerperDaten: koerperDaten.map((k) => ({
        ...k,
        datum: k.datum.toISOString().split("T")[0],
      })),
      volumenDaten,
    });
  } catch (error) {
    console.error("Fortschritt data error:", error);
    return NextResponse.json(
      { error: "Fehler beim Laden der Fortschrittsdaten." },
      { status: 500 }
    );
  }
}
