/**
 * Loading timer state + log management — extracted from AnalysisContext.
 */

import { useState, useCallback, useRef, useEffect } from "react";

export function useLoadingTimer() {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [loadingLog, setLoadingLog] = useState<{ text: string; ts: number }[]>([]);
  const loadingStartRef = useRef<number>(0);
  const logTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pushLog = useCallback((text: string) => {
    setLoadingLog(prev => [...prev.slice(-12), { text, ts: Date.now() }]);
  }, []);

  const startLoadingTimer = useCallback(() => {
    loadingStartRef.current = Date.now();
    setElapsedSeconds(0);
    setLoadingLog([]);
    if (logTimerRef.current) clearInterval(logTimerRef.current);
    logTimerRef.current = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - loadingStartRef.current) / 1000));
    }, 1000);
  }, []);

  const stopLoadingTimer = useCallback(() => {
    if (logTimerRef.current) {
      clearInterval(logTimerRef.current);
      logTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopLoadingTimer();
  }, [stopLoadingTimer]);

  return { elapsedSeconds, loadingLog, pushLog, startLoadingTimer, stopLoadingTimer };
}
