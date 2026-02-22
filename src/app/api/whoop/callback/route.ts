import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { WhoopClient } from "@/lib/whoop/client";
import { syncWhoopData } from "@/lib/whoop/sync";

/**
 * GET /api/whoop/callback
 * WHOOP OAuth Callback
 */
export async function GET(request: NextRequest) {
  try {
    console.log("WHOOP callback received");
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    console.log("WHOOP callback params:", { code: !!code, state: !!state, error });

    if (error) {
      console.error("WHOOP OAuth error:", error);
      return NextResponse.redirect(
        new URL(
          `/profil?whoop_error=${encodeURIComponent(error)}`,
          request.url
        )
      );
    }

    if (!code || !state) {
      console.error("WHOOP callback missing params:", { code: !!code, state: !!state });
      return NextResponse.redirect(
        new URL("/profil?whoop_error=missing_params", request.url)
      );
    }

    // State dekodieren um userId zu erhalten
    console.log("Decoding state...");
    const stateData = JSON.parse(Buffer.from(state, "base64").toString());
    const userId = stateData.userId;
    console.log("UserId from state:", userId);

    if (!userId) {
      return NextResponse.redirect(
        new URL("/profil?whoop_error=invalid_state", request.url)
      );
    }

    // Code gegen Access Token tauschen
    console.log("Exchanging code for token...");
    const whoopClient = new WhoopClient();
    const tokenResponse = await whoopClient.exchangeCodeForToken(code);
    console.log("Token received:", { hasAccessToken: !!tokenResponse.access_token });

    // User-Profil von WHOOP abrufen
    console.log("Fetching WHOOP user profile...");
    const whoopProfile = await whoopClient.getUserProfile(
      tokenResponse.access_token
    );
    console.log("WHOOP profile:", { userId: whoopProfile.user_id });

    // Token in DB speichern
    console.log("Saving to database...");
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
    console.log("Database save successful");

    // Automatisch erste Synchronisation durchführen
    console.log("Starting initial sync...");
    try {
      const syncResult = await syncWhoopData(userId);
      console.log("Initial sync result:", syncResult);
    } catch (syncError) {
      console.error("Initial WHOOP sync failed:", syncError);
      // Fehler wird nicht geworfen, damit die Verbindung trotzdem als erfolgreich gilt
    }

    // Zurück zum Profil mit Erfolg
    console.log("Redirecting to profile with success");
    return NextResponse.redirect(
      new URL("/profil?whoop_connected=true", request.url)
    );
  } catch (error) {
    console.error("WHOOP callback error:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message, error.stack);
    }
    return NextResponse.redirect(
      new URL("/profil?whoop_error=connection_failed", request.url)
    );
  }
}
