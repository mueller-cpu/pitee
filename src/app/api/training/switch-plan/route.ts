import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

// POST: Switch active training plan
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
    const { planId } = body;

    if (!planId || typeof planId !== "string") {
      return NextResponse.json(
        { error: "Plan-ID fehlt." },
        { status: 400 }
      );
    }

    // Verify the plan belongs to the user
    const plan = await prisma.trainingPlan.findFirst({
      where: {
        id: planId,
        userId: user.id,
      },
    });

    if (!plan) {
      return NextResponse.json(
        { error: "Plan nicht gefunden." },
        { status: 404 }
      );
    }

    // Deactivate all plans for this user
    await prisma.trainingPlan.updateMany({
      where: { userId: user.id },
      data: { istAktiv: false },
    });

    // Activate the selected plan
    await prisma.trainingPlan.update({
      where: { id: planId },
      data: { istAktiv: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Switch plan error:", error);
    return NextResponse.json(
      { error: "Fehler beim Wechseln des Plans." },
      { status: 500 }
    );
  }
}
