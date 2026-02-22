/**
 * WHOOP Daten-Synchronisation
 * Holt tägliche Wellness-Daten von WHOOP und speichert sie in WellnessLog
 */

import { prisma } from "@/lib/db";
import { WhoopClient } from "./client";

export async function syncWhoopData(userId: string): Promise<{
  success: boolean;
  daysSync: number;
  error?: string;
}> {
  try {
    // WHOOP-Verbindung abrufen
    const connection = await prisma.wearableConnection.findUnique({
      where: { userId },
    });

    if (!connection || !connection.isActive || connection.provider !== "whoop") {
      return { success: false, daysSync: 0, error: "Keine aktive WHOOP-Verbindung" };
    }

    const whoopClient = new WhoopClient();
    let accessToken = connection.accessToken;

    // Token erneuern wenn abgelaufen
    if (connection.expiresAt && connection.expiresAt < new Date()) {
      if (!connection.refreshToken) {
        return { success: false, daysSync: 0, error: "Refresh Token fehlt" };
      }

      const tokenResponse = await whoopClient.refreshAccessToken(
        connection.refreshToken
      );

      accessToken = tokenResponse.access_token;

      // Token in DB aktualisieren
      await prisma.wearableConnection.update({
        where: { userId },
        data: {
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token || connection.refreshToken,
          expiresAt: new Date(Date.now() + tokenResponse.expires_in * 1000),
        },
      });
    }

    // Letzte 7 Tage synchronisieren
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);

    const startISO = start.toISOString();
    const endISO = end.toISOString();

    // WHOOP-Daten parallel abrufen
    console.log(`Fetching WHOOP data from ${startISO} to ${endISO}`);
    const [cycles, recoveries, sleeps] = await Promise.all([
      whoopClient.getCycles(accessToken, startISO, endISO),
      whoopClient.getRecovery(accessToken, startISO, endISO),
      whoopClient.getSleep(accessToken, startISO, endISO),
    ]);

    console.log(`WHOOP data received: ${cycles.length} cycles, ${recoveries.length} recoveries, ${sleeps.length} sleeps`);

    let syncedDays = 0;

    // Daten pro Tag verarbeiten
    for (const recovery of recoveries) {
      const cycleDate = new Date(recovery.created_at);
      cycleDate.setHours(0, 0, 0, 0);

      // Passenden Cycle finden
      const cycle = cycles.find((c) => c.id === recovery.cycle_id);

      // Passenden Sleep finden
      const sleep = sleeps.find((s) => s.id === recovery.sleep_id);

      // Schlafstunden berechnen (ms in Stunden)
      const schlafStunden = sleep
        ? (sleep.score.stage_summary.total_in_bed_time_milli -
          sleep.score.stage_summary.total_awake_time_milli) /
        (1000 * 60 * 60)
        : null;

      // Schlafqualität berechnen (aus Sleep Performance)
      const schlafQualitaet = sleep
        ? Math.round(sleep.score.sleep_performance_percentage / 10)
        : null;

      // Energie aus Recovery Score ableiten (0-100% → 1-10)
      const energie = recovery.score.recovery_score
        ? Math.round(recovery.score.recovery_score / 10)
        : null;

      // WellnessLog erstellen oder aktualisieren
      await prisma.wellnessLog.upsert({
        where: {
          userId_datum: {
            userId,
            datum: cycleDate,
          },
        },
        create: {
          userId,
          datum: cycleDate,
          schlafStunden: schlafStunden ? Math.round(schlafStunden * 10) / 10 : null,
          schlafQualitaet,
          energie,
          whoopRecovery: recovery.score.recovery_score,
          whoopStrain: cycle?.score.strain || null,
          whoopHRV: recovery.score.hrv_rmssd_milli,
          whoopRestingHR: recovery.score.resting_heart_rate,
          whoopSyncedAt: new Date(),
        },
        update: {
          schlafStunden: schlafStunden ? Math.round(schlafStunden * 10) / 10 : null,
          schlafQualitaet,
          energie,
          whoopRecovery: recovery.score.recovery_score,
          whoopStrain: cycle?.score.strain || null,
          whoopHRV: recovery.score.hrv_rmssd_milli,
          whoopRestingHR: recovery.score.resting_heart_rate,
          whoopSyncedAt: new Date(),
        },
      });

      syncedDays++;
    }

    // lastSync aktualisieren
    await prisma.wearableConnection.update({
      where: { userId },
      data: { lastSync: new Date() },
    });

    return { success: true, daysSync: syncedDays };
  } catch (error) {
    console.error("WHOOP sync error:", error);
    return {
      success: false,
      daysSync: 0,
      error: error instanceof Error ? error.message : "Unbekannter Fehler",
    };
  }
}
