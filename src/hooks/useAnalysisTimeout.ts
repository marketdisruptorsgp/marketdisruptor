/**
 * Shared hook for analysis page loading timeout + error escape.
 * Ensures every analysis page has consistent timeout protection.
 */
import { useState, useEffect } from "react";

const LOADING_TIMEOUT_MS = 90_000; // 90s max loading before showing error escape

export function useAnalysisTimeout(
  isLoading: boolean,
  hasData: boolean,
) {
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);
  const [pipelineError, setPipelineError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && hasData) {
      setLoadingTimedOut(false);
      setPipelineError(null);
      return;
    }
    const timer = setTimeout(() => setLoadingTimedOut(true), LOADING_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [isLoading, hasData]);

  const clearTimeout_ = () => {
    setLoadingTimedOut(false);
    setPipelineError(null);
  };

  return { loadingTimedOut, pipelineError, setPipelineError, clearTimeout: clearTimeout_ };
}
