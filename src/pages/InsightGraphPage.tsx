/**
 * Insight Graph Page
 *
 * Interactive force-directed graph of the entire analysis pipeline.
 * Accessible as a tab within any analysis.
 */

import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { useModeTheme } from "@/hooks/useModeTheme";
import { useSubscription } from "@/hooks/useSubscription";
import { useHydrationGuard } from "@/hooks/useHydrationGuard";
import { getStepConfigs } from "@/lib/stepConfigs";
import { scrollToTop } from "@/utils/scrollToTop";
import { buildInsightGraph } from "@/lib/insightGraph";
import { buildSystemIntelligence, type SystemIntelligenceInput } from "@/lib/systemIntelligence";
import { InsightGraphView } from "@/components/insight-graph/InsightGraphView";
import { GitBranch } from "lucide-react";

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

  const { selectedProduct, analysisId, products, disruptData, redesignData, stressTestData } = analysis;
  const modeAccent = theme.primary;

  // Build system intelligence
  const intelligence = useMemo(() => {
    if (!selectedProduct || !analysisId) return null;
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
  }, [selectedProduct, analysisId, disruptData, analysis.governedData, analysis.businessAnalysisData]);

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

  if (analysis.step !== "done" || products.length === 0 || !selectedProduct) {
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
        analysisTitle={selectedProduct.name}
        stepTitle="Insight Graph"
        analysis={analysis}
        selectedProduct={selectedProduct}
        analysisId={analysisId}
        accentColor={modeAccent}
        hideRun
        hideShare
      />

      <AnalysisContextBanner
        icon={GitBranch}
        title="Insight Graph"
        description="Interactive network of signals, constraints, assumptions, and opportunities — connected by reasoning relationships. Click any node to explore its chain."
        iconColor={modeAccent}
      />

      <InsightGraphView graph={graph} />
    </AnalysisPageShell>
  );
}
