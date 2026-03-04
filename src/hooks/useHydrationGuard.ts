import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAnalysis } from "@/contexts/AnalysisContext";

/**
 * Shared hydration guard for analysis step pages.
 * Waits for auto-hydration to complete before deciding to redirect.
 * Returns { shouldRedirectHome, isReady } so pages can render spinners or content.
 */
export function useHydrationGuard(graceMs = 1200) {
  const analysis = useAnalysis();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), graceMs);
    return () => clearTimeout(t);
  }, [graceMs]);

  const shouldRedirectHome = ready && !analysis.isHydrating && analysis.step === "idle";

  useEffect(() => {
    if (shouldRedirectHome) {
      navigate("/", { replace: true });
    }
  }, [shouldRedirectHome, navigate]);

  return { shouldRedirectHome, isReady: ready };
}
