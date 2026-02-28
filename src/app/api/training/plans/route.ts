import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET: Fetch all training plans for the user
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Nicht authentifiziert." },
        { status: 401 }
      );
    }

    const plans = await prisma.trainingPlan.findMany({
      where: { userId: user.id },
      include: {
        einheiten: {
          orderBy: { wochentag: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedPlans = plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      woche: plan.woche,
      istAktiv: plan.istAktiv,
      istDeload: plan.istDeload,
      startDatum: plan.startDatum.toISOString().split("T")[0],
      endDatum: plan.endDatum.toISOString().split("T")[0],
      anzahlEinheiten: plan.einheiten.length,
    }));

    return NextResponse.json({ plans: formattedPlans });
  } catch (error) {
    console.error("Training plans GET error:", error);
    return NextResponse.json(
      { error: "Fehler beim Laden der Trainingspläne." },
      { status: 500 }
    );
  }
}
