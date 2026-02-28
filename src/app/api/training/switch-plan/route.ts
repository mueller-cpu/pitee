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

    // Log the switch attempt
    console.log(`User ${user.id} switching to plan ${planId}`);

    // Deactivate all plans for this user
    const deactivated = await prisma.trainingPlan.updateMany({
      where: { userId: user.id },
      data: { istAktiv: false },
    });
    console.log(`Deactivated ${deactivated.count} plans`);

    // Activate the selected plan
    const activated = await prisma.trainingPlan.update({
      where: { id: planId },
      data: { istAktiv: true },
    });
    console.log(`Activated plan: ${activated.id} (${activated.name})`);

    return NextResponse.json({
      success: true,
      planId: activated.id,
      planName: activated.name
    });
  } catch (error) {
    console.error("Switch plan error:", error);
    return NextResponse.json(
      { error: "Fehler beim Wechseln des Plans." },
      { status: 500 }
    );
  }
}
