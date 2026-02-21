import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      hasProfile: !!user.profile?.onboardingDone,
      hasFitnessTest: false, // wird in Phase 3 erweitert
      profile: user.profile
        ? {
            gewicht: user.profile.gewicht,
            groesse: user.profile.groesse,
            alter: user.profile.alter,
            erfahrung: user.profile.erfahrung,
            hauptziel: user.profile.hauptziel,
            trainingstagePW: user.profile.trainingstagePW,
          }
        : null,
    });
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json({ error: "Fehler" }, { status: 500 });
  }
}
