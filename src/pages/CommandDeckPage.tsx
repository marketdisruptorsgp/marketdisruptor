/**
 * Command Deck — Strategic Intelligence Briefing
 *
 * Executive-level strategic interface — 3-zone layout:
 *   Zone 1 — Situation Assessment  (What Is)
 *   Zone 2 — Breakthrough Vectors  (What Could Be)
 *   Zone 3 — Action Directive      (What To Do)
 *
 * Engineering complexity (pipeline progress, diagnostics, etc.) is hidden
 * from this view. Deep-dive and report pages surface the technical detail.
 */

import { useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { useModeTheme } from "@/hooks/useModeTheme";
import { useHydrationGuard } from "@/hooks/useHydrationGuard";
import { useAutoAnalysis } from "@/hooks/useAutoAnalysis";
import { usePipelineOrchestrator } from "@/hooks/usePipelineOrchestrator";
import { ModeBadge } from "@/components/ModeBadge";
import { StrategicBriefing } from "@/components/strategic/StrategicBriefing";
import type { BreakthroughVector } from "@/components/strategic/BreakthroughVectors";
import { ArrowRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import type { DeepenedOpportunity } from "@/lib/reconfiguration";
import type { OpportunityZone } from "@/lib/opportunityDesignEngine";
import type { ConstraintInversion } from "@/lib/constraintInverter";
import type { SecondOrderUnlock } from "@/lib/secondOrderEngine";
import { humanizeLabel } from "@/lib/humanize";

// ── Map analysis outputs → BreakthroughVector shape ───────────────────────────
function buildBreakthroughVectors(
  deepened: DeepenedOpportunity[],
  morphZones: OpportunityZone[],
  inversions: ConstraintInversion[],
  unlocks: SecondOrderUnlock[],
): BreakthroughVector[] {
  const result: BreakthroughVector[] = [];

  // Paradigm-level: deepened opportunities (highest fidelity)
  for (const d of deepened.slice(0, 3)) {
    result.push({
      id: d.id,
      title: humanizeLabel(d.reconfigurationLabel),
      explanation: d.summary || d.causalChain?.reasoning || "",
      mechanism: d.economicMechanism?.valueCreation || d.causalChain?.outcome || "",
      category: "paradigm",
    });
  }

  // Optimisation plays from morphological zones
  for (const zone of morphZones.slice(0, Math.max(0, 4 - result.length))) {
    const title = humanizeLabel(zone.theme ?? "");
    if (!title) continue;
    result.push({ id: zone.id, title, explanation: "", mechanism: "", category: "optimization" });
  }

  // Flanking moves from constraint inversions
  for (const inv of inversions.slice(0, Math.max(0, 5 - result.length))) {
    if (!inv.invertedFrame) continue;
    result.push({
      id: inv.id,
      title: humanizeLabel(inv.invertedFrame),
      explanation: inv.mechanism || "",
      mechanism: inv.precedent || "",
      category: "flanking",
    });
  }

  // Value unlocks from second-order engine
  for (const u of unlocks.slice(0, Math.max(0, 6 - result.length))) {
    if (!u.unlockedBusinessModel) continue;
    result.push({
      id: u.id,
      title: humanizeLabel(u.unlockedBusinessModel),
      explanation: u.valueMechanism || "",
      mechanism: u.unlockPath || "",
      category: "unlock",
    });
  }

  return result.slice(0, 6);
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function CommandDeckPage() {
  const analysis = useAnalysis();
  const theme = useModeTheme();
  const navigate = useNavigate();
  const { shouldRedirectHome } = useHydrationGuard();
  const autoAnalysis = useAutoAnalysis();

  // Auto-execute pipeline in the background — no visible Run button
  const pipelineProgress = usePipelineOrchestrator(
    autoAnalysis.runAnalysis,
    autoAnalysis.runAnalysis,
  );

  const { selectedProduct, analysisId: ctxAnalysisId, businessAnalysisData, businessModelInput } =
    analysis;

  const urlAnalysisId = useMemo(() => {
    const match = window.location.pathname.match(/\/analysis\/([0-9a-f-]{36})/);
    return match?.[1] || null;
  }, []);

  const analysisId = ctxAnalysisId || urlAnalysisId;
  const modeAccent = theme.primary;

  const {
    narrative,
    hasRun,
    isComputing: engineComputing,
    deepenedOpportunities,
    morphologicalZones,
    constraintInversions,
    secondOrderUnlocks,
    completedSteps,
  } = autoAnalysis;

  // Auto-trigger analysis when the page mounts with data but no run yet
  useEffect(() => {
    if (!hasRun && completedSteps.size === 0 && (selectedProduct || businessAnalysisData)) {
      pipelineProgress.runAllSteps();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const baseUrl = `/analysis/${analysisId}`;
  const hasBusinessContext = !!businessAnalysisData;
  const analysisDisplayName =
    selectedProduct?.name || businessModelInput?.type || "Business Model Analysis";

  const modeKey: "product" | "service" | "business" =
    analysis.activeMode === "service"
      ? "service"
      : analysis.activeMode === "business"
      ? "business"
      : "product";

  const industryLabel = useMemo(() => {
    if (businessModelInput?.type) return businessModelInput.type;
    if (selectedProduct?.category) return selectedProduct.category;
    return modeKey === "service"
      ? "Service Industry"
      : modeKey === "business"
      ? "Business Model"
      : "Product Market";
  }, [businessModelInput, selectedProduct, modeKey]);

  // ── Guards ─────────────────────────────────────────────────────────────────
  const isHydrating = analysis.isHydrating;
  if (analysis.step !== "done" || (!selectedProduct && !hasBusinessContext)) {
    if (shouldRedirectHome) return null;
    if (analysis.step === "done" && !isHydrating) {
      return (
        <div className="flex-1 bg-background flex items-center justify-center px-4">
          <div className="text-center space-y-3 max-w-md">
            <p className="text-sm font-bold text-foreground">Analysis data incomplete</p>
            <p className="text-xs text-muted-foreground">
              This analysis may need to be re-run.
            </p>
            <button
              onClick={() => navigate(`/analysis/${analysisId}/report`)}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Go to Report
            </button>
          </div>
        </div>
      );
    }
    // Background preparation — subtle indicator, no engineering chrome
    return (
      <div className="flex-1 bg-background flex items-center justify-center">
        <div
          className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin opacity-30"
          style={{ borderColor: "hsl(var(--primary))" }}
        />
      </div>
    );
  }

  // ── Strategic data ─────────────────────────────────────────────────────────
  const primaryThesis = deepenedOpportunities[0] ?? null;

  const breakthroughVectors = useMemo(
    () =>
      buildBreakthroughVectors(
        deepenedOpportunities,
        morphologicalZones,
        constraintInversions,
        secondOrderUnlocks,
      ),
    [deepenedOpportunities, morphologicalZones, constraintInversions, secondOrderUnlocks],
  );

  const constraint =
    narrative?.primaryConstraint || primaryThesis?.causalChain?.constraint || null;
  const verdict =
    narrative?.strategicVerdict || primaryThesis?.reconfigurationLabel || null;
  const verdictRationale =
    narrative?.verdictRationale || primaryThesis?.causalChain?.reasoning || null;

  // Market position — use breakthrough opportunity or narrative summary as
  // a one-sentence competitive context statement
  const marketPosition =
    narrative?.breakthroughOpportunity ||
    (narrative?.narrativeSummary !== verdict ? (narrative?.narrativeSummary ?? null) : null);

  const actionDirective = primaryThesis?.firstMove?.action
    ? humanizeLabel(primaryThesis.firstMove.action)
    : verdict
    ? humanizeLabel(verdict)
    : null;

  const mechanism =
    primaryThesis?.firstMove?.learningObjective ||
    primaryThesis?.economicMechanism?.valueCreation ||
    null;

  const timingRationale =
    narrative?.whyThisMatters ||
    primaryThesis?.whyThisMatters?.ifSolved?.[0] ||
    primaryThesis?.firstMove?.successCriteria ||
    null;

  const riskMitigation =
    narrative?.validationExperiment ||
    primaryThesis?.feasibility?.executionRisks?.[0] ||
    primaryThesis?.causalChain?.outcome ||
    null;

  const timeline = primaryThesis?.firstMove?.timeframe ?? "2–4 weeks";

  return (
    <div className="flex-1 bg-background overflow-y-auto">
      <main className="max-w-[860px] mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-5">

        {/* ═══ HEADER — company name + strategic assessment badge ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between gap-3"
        >
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-black text-foreground truncate">
              {analysisDisplayName}
            </h1>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <ModeBadge />
              <span className="text-[11px] text-muted-foreground">{industryLabel}</span>
              {engineComputing && (
                <span
                  className="text-[10px] font-bold"
                  style={{ color: `${modeAccent}99` }}
                >
                  · updating
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* ═══ 3-ZONE STRATEGIC BRIEFING ═══ */}
        <StrategicBriefing
          constraint={constraint}
          verdict={verdict}
          verdictRationale={verdictRationale}
          marketPosition={marketPosition}
          vectors={breakthroughVectors}
          action={actionDirective}
          mechanism={mechanism}
          timingRationale={timingRationale}
          riskMitigation={riskMitigation}
          timeline={timeline}
          modeAccent={modeAccent}
          isComputing={engineComputing}
        />

        {/* ═══ NAVIGATION ═══ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="flex justify-center pb-2 gap-3"
        >
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`${baseUrl}/deep-dive`)}
            className="gap-1.5 text-xs"
          >
            <Search size={13} />
            Show me why
            <ArrowRight size={13} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate(`${baseUrl}/report`)}
            className="gap-1.5 text-xs text-muted-foreground"
          >
            Full Report
            <ArrowRight size={13} />
          </Button>
        </motion.div>

      </main>
    </div>
  );
}
