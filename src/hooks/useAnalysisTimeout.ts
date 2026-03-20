/**
 * Shared hook for analysis page loading timeout + orphan protection.
 *
 * TWO safety nets:
 * 1. Soft timeout (90s) — shows escape UI (retry + back buttons).
 * 2. Hard timeout (180s / 3 min) — force-clears loading to prevent permanent orphan spinners.
 *    Pages should check `forceCleared` and treat it as "loading is done".
 */
import { useState, useEffect, useCallback, useRef } from "react";

const LOADING_TIMEOUT_MS = 90_000;  // 90s — show escape hatch
const HARD_TIMEOUT_MS = 180_000;    // 3 min — force-clear loading

export function useAnalysisTimeout(
  isLoading: boolean,
  hasData: boolean,
) {
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);
  const [forceCleared, setForceCleared] = useState(false);

  // Reset everything when data arrives or loading stops
  useEffect(() => {
    if (!isLoading || hasData) {
      setLoadingTimedOut(false);
      setForceCleared(false);
      return;
    }

    // Soft timeout — show escape UI
    const softTimer = setTimeout(() => setLoadingTimedOut(true), LOADING_TIMEOUT_MS);

    // Hard timeout — force-clear to prevent permanent orphan
    const hardTimer = setTimeout(() => {
      console.warn("[AnalysisTimeout] Hard timeout (3min) — force-clearing orphaned loading state");
      setForceCleared(true);
      setLoadingTimedOut(true);
    }, HARD_TIMEOUT_MS);

    return () => {
      clearTimeout(softTimer);
      clearTimeout(hardTimer);
    };
  }, [isLoading, hasData]);

  const clearTimeout_ = useCallback(() => {
    setLoadingTimedOut(false);
    setForceCleared(false);
  }, []);

  return {
    loadingTimedOut,
    /** True when the hard 3-min timeout fired — page should treat loading as done */
    forceCleared,
    clearTimeout: clearTimeout_,
  };
}
