import { useState, useEffect, useCallback } from "react";

const TOKEN_KEY = "md_ax_admin_token";

interface OverviewData {
  totalSessions: number;
  totalConversions: number;
  conversionRate: number;
  avgDuration: number;
  returningPct: number;
  avgPages: number;
  eventBreakdown: Record<string, number>;
  sessionsByDay: { day: string; count: number }[];
  deviceBreakdown: Record<string, number>;
}

function getApiUrl(action: string, days: number, extra = ""): string {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const base = projectId
    ? `https://${projectId}.supabase.co/functions/v1/analytics-admin`
    : `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analytics-admin`;
  return `${base}?action=${action}&days=${days}${extra}`;
}

function getToken(): string {
  return sessionStorage.getItem(TOKEN_KEY) || "";
}

async function apiFetch(action: string, days = 7, extra = "") {
  const token = getToken();
  if (!token) throw new Error("No token");

  const res = await fetch(getApiUrl(action, days, extra), {
    headers: {
      "Content-Type": "application/json",
      "x-analytics-token": token,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "",
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export function useAnalyticsAdmin() {
  const [authenticated, setAuthenticated] = useState(!!getToken());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(7);

  const login = useCallback((token: string) => {
    sessionStorage.setItem(TOKEN_KEY, token);
    setAuthenticated(true);
    setError(null);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    setAuthenticated(false);
  }, []);

  const fetchData = useCallback(async (action: string, extra = "") => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch(action, days, extra);
      return data;
    } catch (e: any) {
      const msg: string = e.message ?? "Unknown error";
      setError(msg);
      // Automatically deauthenticate on any token-level rejection
      if (
        msg === "Invalid token" ||
        msg === "Token expired" ||
        msg === "Unauthorized" ||
        msg.startsWith("HTTP 401") ||
        msg.startsWith("HTTP 403")
      ) {
        console.warn("[AnalyticsAdmin] Token rejected — clearing session:", msg);
        setAuthenticated(false);
        sessionStorage.removeItem(TOKEN_KEY);
      } else {
        console.error("[AnalyticsAdmin] fetchData error for action '%s':", action, msg);
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [days]);

  const computeInsights = useCallback(async () => {
    // compute-analytics-insights was removed in the architecture cleanup.
    // Analytics insights are now handled by analytics-admin.
    console.warn("[AnalyticsAdmin] computeInsights is deprecated — use fetchData instead");
    return null;
  }, []);

  return { authenticated, login, logout, fetchData, computeInsights, loading, error, days, setDays };
}
