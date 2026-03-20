/**
 * Resets all strategic engine state when the analysis ID changes.
 * Prevents cross-analysis contamination.
 */

import { useEffect, useRef, type MutableRefObject } from "react";
import type { EngineSetters } from "./types";

export function useEngineReset(
  analysisId: string | null,
  setters: EngineSetters,
  isComputingRef: MutableRefObject<boolean>,
  hydratedRef: MutableRefObject<boolean>,
  runIdRef: MutableRefObject<number>,
) {
  const prevAnalysisIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!analysisId) return;
    if (prevAnalysisIdRef.current && prevAnalysisIdRef.current !== analysisId) {
      setters.setNarrative(null);
      setters.setDeepenedOpportunities([]);
      setters.setMorphologicalZones([]);
      setters.setMorphologicalVectors([]);
      setters.setConstraintInversions([]);
      setters.setSecondOrderUnlocks([]);
      setters.setTemporalUnlocks([]);
      setters.setCompetitiveGaps([]);
      setters.setHasRun(false);
      setters.setIsComputing(false);
      setters.setIntelligence(null);
      setters.setStructuralProfile(null);
      setters.setGraph(null);
      setters.setEvidence(null);
      setters.setFlatEvidenceState([]);
      setters.setInsights([]);
      setters.setOpportunities([]);
      setters.setDiagnostic(null);
      isComputingRef.current = false;
      hydratedRef.current = false;
      runIdRef.current = 0;
      console.log("[useAutoAnalysis] Analysis changed — strategic state reset");
    }
    prevAnalysisIdRef.current = analysisId;
  }, [analysisId]);

  // Secondary reset effect — clears on any analysisId change (including first load)
  useEffect(() => {
    if (!analysisId) return;
    hydratedRef.current = false;
    runIdRef.current = 0;
    setters.setHasRun(false);
    setters.setNarrative(null);
    setters.setDeepenedOpportunities([]);
    setters.setGraph(null);
    setters.setStructuralProfile(null);
    setters.setInsights([]);
    setters.setOpportunities([]);
    setters.setEvidence(null);
    setters.setFlatEvidenceState([]);
    setters.setDiagnostic(null);
    setters.setIntelligence(null);
    setters.setMorphologicalZones([]);
    setters.setMorphologicalVectors([]);
    setters.setConstraintInversions([]);
    setters.setSecondOrderUnlocks([]);
    setters.setTemporalUnlocks([]);
    setters.setCompetitiveGaps([]);
  }, [analysisId]);
}
