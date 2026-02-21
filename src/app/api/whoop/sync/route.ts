import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { syncWhoopData } from "@/lib/whoop/sync";

/**
 * POST /api/whoop/sync
 * Synchronisiert WHOOP-Daten manuell
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

    const result = await syncWhoopData(payload.userId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Synchronisation fehlgeschlagen" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      daysSync: result.daysSync,
      message: `${result.daysSync} Tage synchronisiert`,
    });
  } catch (error) {
    console.error("WHOOP sync error:", error);
    return NextResponse.json(
      { error: "Synchronisation fehlgeschlagen" },
      { status: 500 }
    );
  }
}
