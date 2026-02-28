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
    const { hauptziel } = body;

    // Validation
    if (
      !hauptziel ||
      !["muskelaufbau", "fettabbau", "gesundheit", "kraft"].includes(hauptziel)
    ) {
      return NextResponse.json(
        {
          error:
            "Hauptziel muss muskelaufbau, fettabbau, gesundheit oder kraft sein.",
        },
        { status: 400 }
      );
    }

    // Update profile
    const updatedProfile = await prisma.userProfile.update({
      where: { userId: user.id },
      data: { hauptziel },
    });

    return NextResponse.json({
      success: true,
      hauptziel: updatedProfile.hauptziel,
    });
  } catch (error) {
    console.error("Hauptziel Update error:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler." },
      { status: 500 }
    );
  }
}
