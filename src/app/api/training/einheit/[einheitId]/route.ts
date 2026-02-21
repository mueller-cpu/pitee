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

    // Fetch the einheit with all exercises and their base data
    const einheit = await prisma.trainingsEinheit.findUnique({
      where: { id: einheitId },
      include: {
        uebungen: {
          orderBy: { sortierung: "asc" },
          include: {
            uebung: true,
          },
        },
        trainingPlan: {
          select: {
            userId: true,
            name: true,
          },
        },
      },
    });

    if (!einheit) {
      return NextResponse.json(
        { error: "Trainingseinheit nicht gefunden." },
        { status: 404 }
      );
    }

    // Authorization: ensure the plan belongs to the current user
    if (einheit.trainingPlan.userId !== user.id) {
      return NextResponse.json(
        { error: "Keine Berechtigung." },
        { status: 403 }
      );
    }

    // Format response
    const formattedEinheit = {
      id: einheit.id,
      name: einheit.name,
      wochentag: einheit.wochentag,
      typ: einheit.typ,
      aufwaermen: einheit.aufwaermen,
      cooldown: einheit.cooldown,
      sortierung: einheit.sortierung,
      planName: einheit.trainingPlan.name,
      uebungen: einheit.uebungen.map((pu) => ({
        id: pu.id,
        uebungId: pu.uebungId,
        name: pu.uebung.name,
        kategorie: pu.uebung.kategorie,
        muskelgruppen: pu.uebung.muskelgruppen,
        geraet: pu.uebung.geraet,
        beschreibung: pu.uebung.beschreibung,
        saetze: pu.saetze,
        wiederholungen: pu.wiederholungen,
        gewicht: pu.gewicht,
        rir: pu.rir,
        pauseSekunden: pu.pauseSekunden,
        tempo: pu.tempo,
        notizen: pu.notizen,
        sortierung: pu.sortierung,
      })),
    };

    return NextResponse.json({ einheit: formattedEinheit });
  } catch (error) {
    console.error("Einheit GET error:", error);
    return NextResponse.json(
      { error: "Fehler beim Laden der Trainingseinheit." },
      { status: 500 }
    );
  }
}
