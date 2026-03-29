import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { useModeTheme } from "@/hooks/useModeTheme";
import { useSubscription } from "@/hooks/useSubscription";
import { useHydrationGuard } from "@/hooks/useHydrationGuard";
import { getStepConfigs } from "@/lib/stepConfigs";
import { NextStepButton } from "@/components/SectionNav";
import { scrollToTop } from "@/utils/scrollToTop";
import { ScamperView } from "@/components/scamper/ScamperView";
import { Shuffle } from "lucide-react";

import {
  AnalysisPageShell,
  AnalysisStepHeader,
  AnalysisActionToolbar,
  AnalysisContentCard,
  AnalysisLoadingSpinner,
  AnalysisPipelineErrorCard,
} from "@/components/analysis/AnalysisPageShell";

export default function ScamperPage() {
  const analysis = useAnalysis();
  const navigate = useNavigate();
  const theme = useModeTheme();
  const { tier } = useSubscription();
  const { shouldRedirectHome } = useHydrationGuard();

  const { selectedProduct: rawSelectedProduct, analysisId } = analysis;

  // Synthetic product for business-model analyses
  const selectedProduct =
    rawSelectedProduct ||
    (analysis.businessAnalysisData
      ? {
          id: analysisId || "business-model",
          name: (analysis.businessModelInput as any)?.type || "Business Model",
          category: "Business",
          image: "",
          revivalScore: 0,
          flippedIdeas: [],
        }
      : null);

  if (
    analysis.step !== "done" ||
    (!selectedProduct && !analysis.businessAnalysisData)
  ) {
    if (shouldRedirectHome) return null;
    if (analysis.step === "error")
      return <AnalysisPipelineErrorCard onRetry={analysis.retryAnalysis} />;
    return <AnalysisLoadingSpinner />;
  }

  const baseUrl = `/analysis/${analysisId}`;

  return (
    <AnalysisPageShell tier={tier}>
      <AnalysisStepHeader
        steps={getStepConfigs(theme.primary)}
        activeStep={4}
        visitedSteps={new Set([2, 3, 4])}
        onStepChange={(s) => {
          if (s === 2) navigate(`${baseUrl}/report`);
          else if (s === 3) navigate(`${baseUrl}/disrupt`);
          else if (s === 5) navigate(`${baseUrl}/stress-test`);
          else if (s === 6) navigate(`${baseUrl}/pitch`);
        }}
        outdatedSteps={analysis.outdatedSteps}
        accentColor={theme.primary}
        backLabel="Structural Analysis"
        backPath={`${baseUrl}/disrupt`}
        analysisId={analysisId}
      />

      <AnalysisActionToolbar
        analysisTitle={
          selectedProduct?.name ||
          (analysis.businessModelInput as any)?.type ||
          "Business Analysis"
        }
        stepTitle="SCAMPER Innovation Lab"
        analysis={analysis}
        selectedProduct={selectedProduct}
        analysisId={analysisId}
        accentColor={theme.primary}
        isLoading={false}
        hasData={true}
        onRun={() => {}}
        strategicProfile={analysis.strategicProfile}
        onChangeProfile={analysis.setStrategicProfile}
      />

      <AnalysisContentCard>
        {/* Section heading */}
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${theme.primary}1A` }}
          >
            <Shuffle size={18} style={{ color: theme.primary }} />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-foreground">
              SCAMPER Innovation Lab
            </h3>
            <p className="text-xs text-muted-foreground">
              Systematic mutation of every business element — 7 operators,
              actionable verdicts, disruption scores
            </p>
          </div>
        </div>

        <ScamperView product={selectedProduct} accentColor={theme.primary} />
      </AnalysisContentCard>

      <NextStepButton
        stepNumber={5}
        label="Strategy Development"
        color={theme.primary}
        onClick={() => {
          scrollToTop();
          navigate(`${baseUrl}/stress-test`);
        }}
      />
    </AnalysisPageShell>
  );
}
