import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { WhoopClient } from "@/lib/whoop/client";

/**
 * GET /api/whoop/callback
 * WHOOP OAuth Callback
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(
        new URL(
          `/profil?whoop_error=${encodeURIComponent(error)}`,
          request.url
        )
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/profil?whoop_error=missing_params", request.url)
      );
    }

    // State dekodieren um userId zu erhalten
    const stateData = JSON.parse(Buffer.from(state, "base64").toString());
    const userId = stateData.userId;

    if (!userId) {
      return NextResponse.redirect(
        new URL("/profil?whoop_error=invalid_state", request.url)
      );
    }

    // Code gegen Access Token tauschen
    const whoopClient = new WhoopClient();
    const tokenResponse = await whoopClient.exchangeCodeForToken(code);

    // User-Profil von WHOOP abrufen
    const whoopProfile = await whoopClient.getUserProfile(
      tokenResponse.access_token
    );

    // Token in DB speichern
    await prisma.wearableConnection.upsert({
      where: { userId },
      create: {
        userId,
        provider: "whoop",
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expiresAt: new Date(Date.now() + tokenResponse.expires_in * 1000),
        whoopUserId: whoopProfile.user_id?.toString(),
        isActive: true,
      },
      update: {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expiresAt: new Date(Date.now() + tokenResponse.expires_in * 1000),
        whoopUserId: whoopProfile.user_id?.toString(),
        isActive: true,
      },
    });

    // Zurück zum Profil mit Erfolg
    return NextResponse.redirect(
      new URL("/profil?whoop_connected=true", request.url)
    );
  } catch (error) {
    console.error("WHOOP callback error:", error);
    return NextResponse.redirect(
      new URL("/profil?whoop_error=connection_failed", request.url)
    );
  }
}
