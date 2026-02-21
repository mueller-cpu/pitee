import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { WhoopClient } from "@/lib/whoop/client";

/**
 * GET /api/whoop/auth
 * Startet WHOOP OAuth-Flow
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Ungültiges Token" }, { status: 401 });
    }

    // State enthält userId für Callback
    const state = Buffer.from(
      JSON.stringify({ userId: payload.userId })
    ).toString("base64");

    const whoopClient = new WhoopClient();
    const authUrl = whoopClient.getAuthorizationUrl(state);

    return NextResponse.json({ authUrl });
  } catch (error) {
    console.error("WHOOP auth error:", error);
    return NextResponse.json(
      { error: "OAuth-Initialisierung fehlgeschlagen" },
      { status: 500 }
    );
  }
}
