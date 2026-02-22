/**
 * WHOOP API Client
 * Dokumentation: https://developer.whoop.com/api
 */

const WHOOP_API_BASE = "https://api.prod.whoop.com/developer";
const WHOOP_AUTH_URL = "https://api.prod.whoop.com/oauth/oauth2/auth";
const WHOOP_TOKEN_URL = "https://api.prod.whoop.com/oauth/oauth2/token";

export interface WhoopTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface WhoopCycle {
  id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string;
  end: string;
  timezone_offset: string;
  score_state: string;
  score: {
    strain: number;
    kilojoule: number;
    average_heart_rate: number;
    max_heart_rate: number;
  };
}

export interface WhoopRecovery {
  cycle_id: number;
  sleep_id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  score_state: string;
  score: {
    user_calibrating: boolean;
    recovery_score: number;
    resting_heart_rate: number;
    hrv_rmssd_milli: number;
    spo2_percentage: number;
    skin_temp_celsius: number;
  };
}

export interface WhoopSleep {
  id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string;
  end: string;
  timezone_offset: string;
  nap: boolean;
  score_state: string;
  score: {
    stage_summary: {
      total_in_bed_time_milli: number;
      total_awake_time_milli: number;
      total_no_data_time_milli: number;
      total_light_sleep_time_milli: number;
      total_slow_wave_sleep_time_milli: number;
      total_rem_sleep_time_milli: number;
      sleep_cycle_count: number;
      disturbance_count: number;
    };
    sleep_needed: {
      baseline_milli: number;
      need_from_sleep_debt_milli: number;
      need_from_recent_strain_milli: number;
      need_from_recent_nap_milli: number;
    };
    respiratory_rate: number;
    sleep_performance_percentage: number;
    sleep_consistency_percentage: number;
    sleep_efficiency_percentage: number;
  };
}

export class WhoopClient {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.WHOOP_CLIENT_ID || "";
    this.clientSecret = process.env.WHOOP_CLIENT_SECRET || "";
    this.redirectUri = process.env.WHOOP_REDIRECT_URI || "";
  }

  /**
   * Generiert die OAuth Authorization URL
   */
  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: "code",
      scope: "offline read:recovery read:cycles read:sleep read:profile",
      state,
    });
    return `${WHOOP_AUTH_URL}?${params.toString()}`;
  }

  /**
   * Tauscht Authorization Code gegen Access Token
   */
  async exchangeCodeForToken(code: string): Promise<WhoopTokenResponse> {
    const response = await fetch(WHOOP_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: this.redirectUri,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`WHOOP token exchange failed: ${error}`);
    }

    return response.json();
  }

  /**
   * Erneuert Access Token mit Refresh Token
   */
  async refreshAccessToken(refreshToken: string): Promise<WhoopTokenResponse> {
    const response = await fetch(WHOOP_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`WHOOP token refresh failed: ${error}`);
    }

    return response.json();
  }

  /**
   * Holt WHOOP Cycle-Daten (Strain)
   */
  async getCycles(
    accessToken: string,
    start: string,
    end: string
  ): Promise<WhoopCycle[]> {
    const params = new URLSearchParams({ start, end });
    const response = await fetch(
      `${WHOOP_API_BASE}/v1/cycle?${params.toString()}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    // 404 means no data available - this is ok, return empty array
    if (response.status === 404) {
      return [];
    }

    if (!response.ok) {
      throw new Error(`WHOOP cycles fetch failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.records || [];
  }

  /**
   * Holt WHOOP Recovery-Daten
   */
  async getRecovery(
    accessToken: string,
    start: string,
    end: string
  ): Promise<WhoopRecovery[]> {
    const params = new URLSearchParams({ start, end });
    const response = await fetch(
      `${WHOOP_API_BASE}/v1/recovery?${params.toString()}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    // 404 means no data available - this is ok, return empty array
    if (response.status === 404) {
      return [];
    }

    if (!response.ok) {
      throw new Error(`WHOOP recovery fetch failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.records || [];
  }

  /**
   * Holt WHOOP Sleep-Daten
   */
  async getSleep(
    accessToken: string,
    start: string,
    end: string
  ): Promise<WhoopSleep[]> {
    const params = new URLSearchParams({ start, end });
    const response = await fetch(
      `${WHOOP_API_BASE}/v1/activity/sleep?${params.toString()}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    // 404 means no data available - this is ok, return empty array
    if (response.status === 404) {
      return [];
    }

    if (!response.ok) {
      throw new Error(`WHOOP sleep fetch failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.records || [];
  }

  /**
   * Holt Nutzer-Profil
   */
  async getUserProfile(accessToken: string) {
    const response = await fetch(`${WHOOP_API_BASE}/v1/user/profile/basic`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error(`WHOOP profile fetch failed: ${response.statusText}`);
    }

    return response.json();
  }
}
