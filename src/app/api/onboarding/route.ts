import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { berechneBMI } from "@/lib/calculations";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Nicht authentifiziert." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      alter,
      gewicht,
      groesse,
      geschlecht,
      erfahrung,
      hauptziel,
      trainingstagePW,
      herzKreislauf,
      bluthochdruck,
      diabetes,
      medikamente,
      vorerkrankungen,
      aerztlicheFreigabe,
      gelenkProbleme,
    } = body;

    // Validate required fields
    if (
      !alter ||
      !gewicht ||
      !groesse ||
      !erfahrung ||
      !hauptziel ||
      !trainingstagePW
    ) {
      return NextResponse.json(
        { error: "Pflichtfelder fehlen." },
        { status: 400 }
      );
    }

    const bmi = berechneBMI(gewicht, groesse);

    await prisma.$transaction(async (tx) => {
      // Create or update UserProfile
      await tx.userProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          geschlecht: geschlecht || "maennlich", // Default für Männer 50+
          alter,
          gewicht,
          groesse,
          bmi,
          erfahrung,
          hauptziel,
          trainingstagePW,
          onboardingDone: true,
        },
        update: {
          geschlecht: geschlecht || "maennlich",
          alter,
          gewicht,
          groesse,
          bmi,
          erfahrung,
          hauptziel,
          trainingstagePW,
          onboardingDone: true,
        },
      });

      // Create or update HealthProfile
      await tx.healthProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          herzKreislauf: herzKreislauf ?? false,
          bluthochdruck: bluthochdruck ?? false,
          diabetes: diabetes ?? false,
          medikamente: medikamente || null,
          vorerkrankungen: vorerkrankungen || null,
          aerztlicheFreigabe: aerztlicheFreigabe ?? false,
        },
        update: {
          herzKreislauf: herzKreislauf ?? false,
          bluthochdruck: bluthochdruck ?? false,
          diabetes: diabetes ?? false,
          medikamente: medikamente || null,
          vorerkrankungen: vorerkrankungen || null,
          aerztlicheFreigabe: aerztlicheFreigabe ?? false,
        },
      });

      // Delete existing GelenkProblem records and recreate
      await tx.gelenkProblem.deleteMany({
        where: { userId: user.id },
      });

      if (Array.isArray(gelenkProbleme) && gelenkProbleme.length > 0) {
        await tx.gelenkProblem.createMany({
          data: gelenkProbleme.map(
            (gp: { gelenk: string; seite: string; schwere: number }) => ({
              userId: user.id,
              gelenk: gp.gelenk,
              seite: gp.seite,
              schweregrad: gp.schwere,
            })
          ),
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Onboarding error:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler." },
      { status: 500 }
    );
  }
}
