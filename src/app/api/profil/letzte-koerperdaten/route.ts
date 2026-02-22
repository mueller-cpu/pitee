import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * GET /api/profil/letzte-koerperdaten
 * Holt den letzten BodyMetric-Eintrag des Users
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Nicht authentifiziert." }, { status: 401 });
    }

    const letzterEintrag = await prisma.bodyMetric.findFirst({
      where: { userId: user.id },
      orderBy: { datum: "desc" },
      select: {
        gewicht: true,
        koerperfett: true,
        brustumfang: true,
        taillenumfang: true,
        oberarmumfang: true,
        oberschenkelumfang: true,
        datum: true,
      },
    });

    return NextResponse.json({ data: letzterEintrag });
  } catch (error) {
    console.error("Letzte Koerperdaten error:", error);
    return NextResponse.json(
      { error: "Fehler beim Laden der Koerperdaten." },
      { status: 500 }
    );
  }
}
