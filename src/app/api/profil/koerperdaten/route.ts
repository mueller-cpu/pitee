import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

interface KoerperdatenBody {
  gewicht: number | null;
  koerperfett: number | null;
  brustumfang: number | null;
  taillenumfang: number | null;
  oberarmumfang: number | null;
  oberschenkelumfang: number | null;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Nicht authentifiziert." }, { status: 401 });
    }

    const body: KoerperdatenBody = await request.json();

    // Create BodyMetric record with today's date
    const heute = new Date();
    heute.setHours(0, 0, 0, 0);

    const bodyMetric = await prisma.bodyMetric.create({
      data: {
        userId: user.id,
        datum: heute,
        gewicht: body.gewicht,
        koerperfett: body.koerperfett,
        brustumfang: body.brustumfang,
        taillenumfang: body.taillenumfang,
        oberarmumfang: body.oberarmumfang,
        oberschenkelumfang: body.oberschenkelumfang,
      },
    });

    // Update UserProfile.gewicht if provided
    if (body.gewicht && user.profile) {
      await prisma.userProfile.update({
        where: { id: user.profile.id },
        data: { gewicht: body.gewicht },
      });
    }

    return NextResponse.json({ success: true, bodyMetric });
  } catch (error) {
    console.error("Koerperdaten save error:", error);
    return NextResponse.json(
      { error: "Fehler beim Speichern der Koerperdaten." },
      { status: 500 }
    );
  }
}
