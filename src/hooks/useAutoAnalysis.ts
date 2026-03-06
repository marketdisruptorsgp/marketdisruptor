/**
 * AUTO-ANALYSIS ENGINE
 *
 * Replaces manual "Run Analysis" triggers with automatic debounced computation.
 * Watches for step completion, input changes, and navigation events.
 * Produces canonical Evidence, SystemIntelligence, and InsightGraph.
 */

import { useEffect, useRef, useCallback, useMemo, useState } from "react";
import { useAnalysis } from "@/contexts/AnalysisContext";
import {
  clusterEvidenceIntoInsights,
  generateOpportunities,
  generateStrategicNarrative,
  type Insight,
  type Opportunity,
  type StrategicNarrative,
} from "@/lib/insightLayer";
import {
  buildSystemIntelligence,
  invalidateIntelligence,
  type SystemIntelligenceInput,
  type SystemIntelligence,
} from "@/lib/systemIntelligence";
import { buildInsightGraph, type InsightGraph } from "@/lib/insightGraph";
import {
  extractAllEvidence,
  flattenEvidence,
  type MetricDomain,
  type MetricEvidence,
} from "@/lib/evidenceEngine";

const DEBOUNCE_MS = 600;

export interface AutoAnalysisResult {
  intelligence: SystemIntelligence | null;
  graph: InsightGraph | null;
  evidence: Record<MetricDomain, MetricEvidence> | null;
  insights: Insight[];
  opportunities: Opportunity[];
  narrative: StrategicNarrative | null;
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
  const [evidence, setEvidence] = useState<Record<MetricDomain, MetricEvidence> | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [narrative, setNarrative] = useState<StrategicNarrative | null>(null);
  const [isComputing, setIsComputing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track completed steps
  const completedSteps = useMemo(() => {
    const set = new Set<string>();
    if (products.length > 0 || businessAnalysisData) set.add("report");
    if (disruptData) set.add("disrupt");
    if (redesignData) set.add("redesign");
    if (stressTestData) set.add("stress-test");
    if (pitchDeckData) set.add("pitch");
    return set;
  }, [products, businessAnalysisData, disruptData, redesignData, stressTestData, pitchDeckData]);

  const pipelineCompletion = Math.round((completedSteps.size / 5) * 100);

  // Infer analysis mode
  const analysisMode = useMemo(() => {
    const mode = (analysis as any).activeMode;
    if (mode === "service") return "service";
    if (mode === "business") return "business_model";
    return "product";
  }, [(analysis as any).activeMode]);

  // Core computation function
  const compute = useCallback(() => {
    const hasComputableData = !!selectedProduct || !!businessAnalysisData || !!disruptData || !!redesignData || !!stressTestData;
    if (!analysisId || !hasComputableData) {
      setIntelligence(null);
      setGraph(null);
      setEvidence(null);
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

      // ── Evidence Pipeline ──
      // Step 1: Extract canonical evidence from all pipeline data
      const newEvidence = extractAllEvidence({
        products,
        selectedProduct,
        disruptData,
        redesignData,
        stressTestData,
        pitchDeckData,
        governedData,
        businessAnalysisData,
        intelligence: newIntelligence,
        analysisType: analysisMode,
      });

      // Step 2: Build insight graph from evidence (evidence-first path)
      const newGraph = buildInsightGraph(newEvidence);

      setIntelligence(newIntelligence);
      setGraph(newGraph);
      setEvidence(newEvidence);
    } catch (err) {
      console.warn("[AutoAnalysis] Computation error:", err);
    } finally {
      setIsComputing(false);
    }
  }, [analysisId, selectedProduct, governedData, disruptData, businessAnalysisData, products, redesignData, stressTestData, pitchDeckData, analysisMode]);

  // Debounced recompute on data changes
  useEffect(() => {
    const hasComputableData = !!selectedProduct || !!businessAnalysisData || !!disruptData || !!redesignData || !!stressTestData;
    if (!analysisId || !hasComputableData) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      compute();
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [
    analysisId, selectedProduct, businessAnalysisData,
    governedData, disruptData, redesignData,
    stressTestData, pitchDeckData,
    compute,
  ]);

  // Initial compute
  useEffect(() => {
    const hasComputableData = !!selectedProduct || !!businessAnalysisData || !!disruptData || !!redesignData || !!stressTestData;
    if (analysisId && hasComputableData && !intelligence) {
      compute();
    }
  }, [analysisId, selectedProduct, businessAnalysisData, disruptData, redesignData, stressTestData, compute, intelligence]);

  return {
    intelligence,
    graph,
    evidence,
    isComputing,
    completedSteps,
    pipelineCompletion,
  };
}
