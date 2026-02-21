import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * POST /api/whoop/disconnect
 * Trennt WHOOP-Verbindung
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Ungültiges Token" }, { status: 401 });
    }

    await prisma.wearableConnection.deleteMany({
      where: {
        userId: payload.userId,
        provider: "whoop",
      },
    });

    return NextResponse.json({
      success: true,
      message: "WHOOP-Verbindung getrennt",
    });
  } catch (error) {
    console.error("WHOOP disconnect error:", error);
    return NextResponse.json(
      { error: "Trennung fehlgeschlagen" },
      { status: 500 }
    );
  }
}
