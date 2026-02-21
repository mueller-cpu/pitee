import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { berechne1RM, bestimmeFitnessLevel } from "@/lib/calculations";

const UEBUNG_KEY_MAP: Record<string, string> = {
  "Bankdrücken": "bankdruecken",
  "Kniebeuge": "kniebeuge",
  "Rudern / Latzug": "rudern",
};

const LEVEL_ORDER = ["einsteiger", "grundlagen", "mittel", "fortgeschritten"];

function getMedianLevel(levels: string[]): string {
  if (levels.length === 0) return "einsteiger";
  const indices = levels
    .map((l) => LEVEL_ORDER.indexOf(l))
    .sort((a, b) => a - b);
  const mid = Math.floor(indices.length / 2);
  return LEVEL_ORDER[indices[mid]] || "einsteiger";
}

interface TestErgebnisInput {
  testNr: number;
  name: string;
  typ: "kraft" | "dauer";
  gewicht?: number;
  wiederholungen?: number;
  dauer?: number;
  rpe?: number;
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

    const body = await request.json();
    const { ergebnisse } = body as { ergebnisse: TestErgebnisInput[] };

    if (!ergebnisse || !Array.isArray(ergebnisse)) {
      return NextResponse.json(
        { error: "Keine Ergebnisse übermittelt." },
        { status: 400 }
      );
    }

    const koerpergewicht = user.profile?.gewicht || 80;

    // Create FitnessTest record
    const fitnessTest = await prisma.fitnessTest.create({
      data: {
        userId: user.id,
      },
    });

    const kraftLevels: string[] = [];

    // Create FitnessTestErgebnis for each result
    for (const e of ergebnisse) {
      let geschaetztes1RM: number | null = null;
      let fitnessLevel: string | null = null;

      if (e.typ === "kraft" && e.gewicht && e.wiederholungen) {
        geschaetztes1RM = berechne1RM(e.gewicht, e.wiederholungen);
        const uebungKey = UEBUNG_KEY_MAP[e.name] || "rudern";
        fitnessLevel = bestimmeFitnessLevel(
          geschaetztes1RM,
          koerpergewicht,
          uebungKey
        );
        kraftLevels.push(fitnessLevel);
      }

      await prisma.fitnessTestErgebnis.create({
        data: {
          fitnessTestId: fitnessTest.id,
          uebungName: e.name,
          gewicht: e.gewicht || null,
          wiederholungen: e.wiederholungen || null,
          dauer: e.dauer || null,
          rpe: e.rpe || null,
          geschaetztes1RM,
          fitnessLevel,
        },
      });
    }

    // Update UserProfile.fitnessLevel with overall level
    const gesamtLevel = getMedianLevel(kraftLevels);

    if (user.profile) {
      await prisma.userProfile.update({
        where: { id: user.profile.id },
        data: { fitnessLevel: gesamtLevel },
      });
    }

    return NextResponse.json({
      success: true,
      fitnessTestId: fitnessTest.id,
      gesamtLevel,
    });
  } catch (error) {
    console.error("Fitnesstest API error:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler." },
      { status: 500 }
    );
  }
}
