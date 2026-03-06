/**
 * Insight Graph Page
 *
 * Interactive force-directed graph of the entire analysis pipeline.
 * Accessible as a tab within any analysis.
 */

import React, { useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { useModeTheme } from "@/hooks/useModeTheme";
import { useSubscription } from "@/hooks/useSubscription";
import { useHydrationGuard } from "@/hooks/useHydrationGuard";
import { useAutoAnalysis } from "@/hooks/useAutoAnalysis";
import { getStepConfigs } from "@/lib/stepConfigs";
import { scrollToTop } from "@/utils/scrollToTop";
import { buildInsightGraph } from "@/lib/insightGraph";
import { extractAllEvidence } from "@/lib/evidenceEngine";
import { buildSystemIntelligence, type SystemIntelligenceInput } from "@/lib/systemIntelligence";
import { InsightGraphView } from "@/components/insight-graph/InsightGraphView";
import { GitBranch, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import {
  AnalysisPageShell,
  AnalysisStepHeader,
  AnalysisActionToolbar,
  AnalysisLoadingSpinner,
  AnalysisContextBanner,
} from "@/components/analysis/AnalysisPageShell";

export default function InsightGraphPage() {
  const analysis = useAnalysis();
  const navigate = useNavigate();
  const theme = useModeTheme();
  const { tier } = useSubscription();
  const { shouldRedirectHome } = useHydrationGuard();
  const autoAnalysis = useAutoAnalysis();

  const {
    selectedProduct,
    analysisId: ctxAnalysisId,
    products,
    disruptData,
    redesignData,
    stressTestData,
    businessAnalysisData,
    businessModelInput,
  } = analysis;
  const modeAccent = theme.primary;

  const urlAnalysisId = useMemo(() => {
    const match = window.location.pathname.match(/\/analysis\/([0-9a-f-]{36})/);
    return match?.[1] || null;
  }, []);
  const analysisId = ctxAnalysisId || urlAnalysisId;
  const hasBusinessContext = !!businessAnalysisData;
  const displayProduct = selectedProduct || {
    name: businessModelInput?.type || "Business Model Analysis",
    category: "Business Model",
  };

  // Build system intelligence
  const intelligence = useMemo(() => {
    if (!analysisId) return null;
    try {
      const input: SystemIntelligenceInput = {
        analysisId,
        governedData: analysis.governedData,
        disruptData: disruptData as Record<string, unknown> | null,
        businessAnalysisData: analysis.businessAnalysisData as Record<string, unknown> | null,
        intelData: null,
        flipIdeas: null,
        activeLenses: [],
      };
      return buildSystemIntelligence(input);
    } catch {
      return null;
    }
  }, [analysisId, disruptData, analysis.governedData, analysis.businessAnalysisData]);

  // Build insight graph
  const graph = useMemo(() => {
    return buildInsightGraph(
      products,
      intelligence,
      disruptData,
      redesignData,
      stressTestData,
    );
  }, [products, intelligence, disruptData, redesignData, stressTestData]);

  const { completedSteps } = autoAnalysis;

  const handleRecomputeAll = useCallback(() => {
    if (!analysisId) return;
    const stepsToRun = ["report", "disrupt", "redesign", "stress-test", "pitch"];
    const firstOutdated = stepsToRun.find(s => analysis.outdatedSteps.has(s));
    const firstIncomplete = stepsToRun.find(s => !completedSteps.has(s));
    const target = firstOutdated || firstIncomplete || "report";
    toast.info("Navigating to recompute pipeline…");
    navigate(`/analysis/${analysisId}/${target}`);
  }, [analysisId, completedSteps, analysis.outdatedSteps, navigate]);

  if (!analysisId || analysis.step !== "done" || (!selectedProduct && !hasBusinessContext)) {
    if (shouldRedirectHome) return null;
    return <AnalysisLoadingSpinner message="Loading analysis..." />;
  }

  const baseUrl = `/analysis/${analysisId}`;

  return (
    <AnalysisPageShell tier={tier}>
      <AnalysisStepHeader
        steps={getStepConfigs(modeAccent)}
        activeStep={-1}
        visitedSteps={new Set([2])}
        onStepChange={(s) => {
          if (s === 2) navigate(`${baseUrl}/report`);
          else if (s === 3) navigate(`${baseUrl}/disrupt`);
          else if (s === 4) navigate(`${baseUrl}/redesign`);
          else if (s === 5) navigate(`${baseUrl}/stress-test`);
          else if (s === 6) navigate(`${baseUrl}/pitch`);
        }}
        accentColor={modeAccent}
        backLabel="Report"
        backPath={`${baseUrl}/report`}
        analysisId={analysisId}
      />

      <AnalysisActionToolbar
        analysisTitle={displayProduct.name}
        stepTitle="Insight Graph"
        analysis={analysis}
        selectedProduct={displayProduct}
        analysisId={analysisId}
        accentColor={modeAccent}
        hideRun
        hideShare
      />

      {/* Recompute + Context Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-3 sm:px-0">
        <AnalysisContextBanner
          icon={GitBranch}
          title="Insight Graph"
          description="Interactive network of signals, constraints, assumptions, and opportunities — connected by reasoning relationships. Click any node to explore its chain."
          iconColor={modeAccent}
        />
        <button
          onClick={handleRecomputeAll}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[44px] flex-shrink-0"
          style={{
            background: `${modeAccent}15`,
            color: modeAccent,
            border: `1.5px solid ${modeAccent}30`,
          }}
        >
          <RefreshCw size={15} />
          Recompute
        </button>
      </div>

      <InsightGraphView graph={graph} />
    </AnalysisPageShell>
  );
}
