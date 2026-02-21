import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * GET /api/whoop/status
 * Prüft WHOOP-Verbindungsstatus
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value;
    if (!token) {
      return NextResponse.json({ connected: false });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ connected: false });
    }

    const connection = await prisma.wearableConnection.findUnique({
      where: {
        userId: payload.userId,
      },
      select: {
        provider: true,
        isActive: true,
        lastSync: true,
      },
    });

    const connected =
      connection?.provider === "whoop" && connection.isActive === true;

    return NextResponse.json({
      connected,
      lastSync: connection?.lastSync || null,
    });
  } catch (error) {
    console.error("WHOOP status error:", error);
    return NextResponse.json({ connected: false });
  }
}
