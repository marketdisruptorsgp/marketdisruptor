/**
 * Auto-recompute trigger — watches the evidence dataset hash and
 * fires recompute when it changes. Also drains queued recomputes.
 */

import { useEffect, useRef, type MutableRefObject } from "react";

export function useEvidenceRecompute(
  analysisId: string | null,
  selectedProduct: any,
  businessAnalysisData: any,
  disruptData: unknown,
  redesignData: unknown,
  stressTestData: unknown,
  pitchDeckData: unknown,
  completedSteps: Set<string>,
  isComputing: boolean,
  isComputingRef: MutableRefObject<boolean>,
  isHydrating: boolean,
  runAnalysis: () => void,
) {
  const evidenceHashRef = useRef<string>("");
  const pendingRecomputeRef = useRef(false);

  useEffect(() => {
    const hasComputableData = !!selectedProduct || !!businessAnalysisData || !!disruptData || !!redesignData || !!stressTestData;
    if (!analysisId || !hasComputableData) return;

    // H4 fix: suppress recompute while hydration is in progress
    if (isHydrating) return;

    const hash = [
      completedSteps.size,
      !!disruptData ? "d" : "",
      !!redesignData ? "r" : "",
      !!stressTestData ? "s" : "",
      !!pitchDeckData ? "p" : "",
      !!businessAnalysisData ? "b" : "",
    ].join("|");

    if (hash === evidenceHashRef.current) return;
    evidenceHashRef.current = hash;

    // If currently computing, queue a recompute for when it finishes
    if (isComputingRef.current) {
      pendingRecomputeRef.current = true;
      return;
    }

    const timer = setTimeout(() => {
      console.log("[StrategicEngine] Auto-recompute triggered — evidence changed:", hash);
      runAnalysis();
    }, 400);
    return () => clearTimeout(timer);
    // NOTE: isComputing intentionally excluded to prevent infinite recompute loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysisId, selectedProduct, businessAnalysisData, disruptData, redesignData, stressTestData, pitchDeckData, completedSteps, runAnalysis, isHydrating]);

  // Drain queued recompute when computing finishes
  useEffect(() => {
    if (!isComputing && pendingRecomputeRef.current) {
      pendingRecomputeRef.current = false;
      const timer = setTimeout(() => {
        console.log("[StrategicEngine] Draining queued recompute");
        runAnalysis();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isComputing, runAnalysis]);
}
