import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Nicht authentifiziert." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { anzahlMahlzeiten, ernaehrungsweise } = body;

    // Validation
    if (
      anzahlMahlzeiten !== undefined &&
      (typeof anzahlMahlzeiten !== "number" ||
        anzahlMahlzeiten < 3 ||
        anzahlMahlzeiten > 6)
    ) {
      return NextResponse.json(
        { error: "Anzahl Mahlzeiten muss zwischen 3 und 6 liegen." },
        { status: 400 }
      );
    }

    if (
      ernaehrungsweise !== undefined &&
      !["omnivor", "vegetarisch", "vegan"].includes(ernaehrungsweise)
    ) {
      return NextResponse.json(
        {
          error:
            "Ernährungsweise muss omnivor, vegetarisch oder vegan sein.",
        },
        { status: 400 }
      );
    }

    // Update profile
    const updateData: {
      anzahlMahlzeiten?: number;
      ernaehrungsweise?: string;
    } = {};

    if (anzahlMahlzeiten !== undefined)
      updateData.anzahlMahlzeiten = anzahlMahlzeiten;
    if (ernaehrungsweise !== undefined)
      updateData.ernaehrungsweise = ernaehrungsweise;

    const updatedProfile = await prisma.userProfile.update({
      where: { userId: user.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      anzahlMahlzeiten: updatedProfile.anzahlMahlzeiten,
      ernaehrungsweise: updatedProfile.ernaehrungsweise,
    });
  } catch (error) {
    console.error("Ernährungseinstellungen Update error:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler." },
      { status: 500 }
    );
  }
}
