import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAnalysis } from "@/contexts/AnalysisContext";

/**
 * Shared hydration guard for analysis step pages.
 * Waits for auto-hydration to complete before deciding to redirect.
 * Returns { shouldRedirectHome, isReady } so pages can render spinners or content.
 */
export function useHydrationGuard(graceMs = 1200) {
  const analysis = useAnalysis();
  const navigate = useNavigate();
  const location = useLocation();
  const [ready, setReady] = useState(false);

  // When a valid analysisId is present in the URL (direct link / page refresh),
  // give the auto-hydration pipeline enough time to authenticate and fetch data
  // before considering a redirect. Without this, the 1200ms default grace period
  // fires before auth resolves, causing a redirect to home even though the data
  // exists in Supabase.
  const urlHasAnalysisId = /\/analysis\/[0-9a-f-]{36}/.test(location.pathname);
  const effectiveGraceMs = urlHasAnalysisId ? Math.max(graceMs, 5000) : graceMs;

  useEffect(() => {
    const t = setTimeout(() => setReady(true), effectiveGraceMs);
    return () => clearTimeout(t);
  }, [effectiveGraceMs]);

  const shouldRedirectHome = ready && !analysis.isHydrating && analysis.step === "idle";

  useEffect(() => {
    if (shouldRedirectHome) {
      navigate("/", { replace: true });
    }
  }, [shouldRedirectHome, navigate]);

  return { shouldRedirectHome, isReady: ready };
}
