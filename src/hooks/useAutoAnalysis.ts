/**
 * AUTO-ANALYSIS ENGINE
 *
 * Replaces manual "Run Analysis" triggers with automatic debounced computation.
 * Watches for step completion, input changes, and navigation events.
 * Invalidates the intelligence cache and recomputes systemIntelligence.
 */

import { useEffect, useRef, useCallback, useMemo, useState } from "react";
import { useAnalysis } from "@/contexts/AnalysisContext";
import {
  buildSystemIntelligence,
  invalidateIntelligence,
  type SystemIntelligenceInput,
  type SystemIntelligence,
} from "@/lib/systemIntelligence";
import { buildInsightGraph, type InsightGraph } from "@/lib/insightGraph";

const DEBOUNCE_MS = 600;

export interface AutoAnalysisResult {
  intelligence: SystemIntelligence | null;
  graph: InsightGraph | null;
  isComputing: boolean;
  completedSteps: Set<string>;
  pipelineCompletion: number;
}

export function useAutoAnalysis(): AutoAnalysisResult {
  const analysis = useAnalysis();
  const {
    analysisId, products, selectedProduct,
    governedData, disruptData, redesignData,
    stressTestData, pitchDeckData, businessAnalysisData,
  } = analysis;

  const [intelligence, setIntelligence] = useState<SystemIntelligence | null>(null);
  const [graph, setGraph] = useState<InsightGraph | null>(null);
  const [isComputing, setIsComputing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track completed steps
  const completedSteps = useMemo(() => {
    const set = new Set<string>();
    if (products.length > 0) set.add("report");
    if (disruptData) set.add("disrupt");
    if (redesignData) set.add("redesign");
    if (stressTestData) set.add("stress-test");
    if (pitchDeckData) set.add("pitch");
    return set;
  }, [products, disruptData, redesignData, stressTestData, pitchDeckData]);

  const pipelineCompletion = Math.round((completedSteps.size / 5) * 100);

  // Core computation function
  const compute = useCallback(() => {
    if (!selectedProduct || !analysisId) {
      setIntelligence(null);
      setGraph(null);
      return;
    }

    setIsComputing(true);

    try {
      invalidateIntelligence(analysisId);

      const input: SystemIntelligenceInput = {
        analysisId,
        governedData,
        disruptData: disruptData as Record<string, unknown> | null,
        businessAnalysisData: businessAnalysisData as Record<string, unknown> | null,
        intelData: null,
        flipIdeas: null,
        activeLenses: [],
      };

      const newIntelligence = buildSystemIntelligence(input);
      const newGraph = buildInsightGraph(
        products, newIntelligence,
        disruptData, redesignData, stressTestData,
      );

      setIntelligence(newIntelligence);
      setGraph(newGraph);
    } catch (err) {
      console.warn("[AutoAnalysis] Computation error:", err);
    } finally {
      setIsComputing(false);
    }
  }, [analysisId, selectedProduct, governedData, disruptData, businessAnalysisData, products, redesignData, stressTestData]);

  // Debounced recompute on data changes
  useEffect(() => {
    if (!analysisId || !selectedProduct) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      compute();
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [
    analysisId, selectedProduct,
    governedData, disruptData, redesignData,
    stressTestData, pitchDeckData, businessAnalysisData,
    compute,
  ]);

  // Initial compute
  useEffect(() => {
    if (analysisId && selectedProduct && !intelligence) {
      compute();
    }
  }, [analysisId, selectedProduct, compute, intelligence]);

  return {
    intelligence,
    graph,
    isComputing,
    completedSteps,
    pipelineCompletion,
  };
}