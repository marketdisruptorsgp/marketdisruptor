/**
 * Command Deck — Strategic Intelligence Briefing
 *
 * Executive-level strategic interface — 3-zone layout:
 *   Zone 1 — Situation Report    (What We Found)
 *   Zone 2 — Breakthrough Grid   (What You Could Do)
 *   Zone 3 — Action Directive    (What To Do First)
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
import { SituationReport } from "@/components/strategic/SituationReport";
import { BreakthroughGrid, type OpportunityGridItem } from "@/components/strategic/BreakthroughGrid";
import { ActionDirective } from "@/components/strategic/ActionDirective";
import { ArrowRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import type { DeepenedOpportunity } from "@/lib/reconfiguration";
import type { OpportunityZone } from "@/lib/opportunityDesignEngine";
import type { ConstraintInversion } from "@/lib/constraintInverter";
import type { SecondOrderUnlock } from "@/lib/secondOrderEngine";
import { humanizeLabel } from "@/lib/humanize";

// ── Map analysis outputs → OpportunityGridItem shape ─────────────────────────
function buildOpportunityGrid(
  deepened: DeepenedOpportunity[],
  morphZones: OpportunityZone[],
  inversions: ConstraintInversion[],
  unlocks: SecondOrderUnlock[],
): OpportunityGridItem[] {
  const result: OpportunityGridItem[] = [];

  // Paradigm-level: deepened opportunities (highest fidelity)
  for (const d of deepened.slice(0, 3)) {
    result.push({
      id: d.id,
      title: humanizeLabel(d.reconfigurationLabel),
      rationale: d.summary || d.causalChain?.reasoning || "",
      contrarianBelief: d.strategicBet?.contrarianBelief || "",
      category: "paradigm",
      confidence: d.signalDensity ?? 0.7,
    });
  }

  // Optimisation plays from morphological zones
  for (const zone of morphZones.slice(0, Math.max(0, 4 - result.length))) {
    const title = humanizeLabel(zone.theme ?? "");
    if (!title) continue;
    result.push({
      id: zone.id,
      title,
      rationale: "",
      contrarianBelief: "",
      category: "optimization",
      confidence: 0.5,
    });
  }

  // Flanking moves from constraint inversions
  for (const inv of inversions.slice(0, Math.max(0, 4 - result.length))) {
    if (!inv.invertedFrame) continue;
    result.push({
      id: inv.id,
      title: humanizeLabel(inv.invertedFrame),
      rationale: inv.mechanism || "",
      contrarianBelief: inv.precedent || "",
      category: "flanking",
      confidence: 0.45,
    });
  }

  // Value unlocks from second-order engine
  for (const u of unlocks.slice(0, Math.max(0, 4 - result.length))) {
    if (!u.unlockedBusinessModel) continue;
    result.push({
      id: u.id,
      title: humanizeLabel(u.unlockedBusinessModel),
      rationale: u.valueMechanism || "",
      contrarianBelief: u.unlockPath || "",
      category: "unlock",
      confidence: 0.4,
    });
  }

  // Rank by confidence, cap at 4 cards
  return result.sort((a, b) => b.confidence - a.confidence).slice(0, 4);
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
  const analysisDisplayName =
    selectedProduct?.name || businessModelInput?.type || "Business Model Analysis";

  // ── Guards ─────────────────────────────────────────────────────────────────
  if (analysis.step !== "done" || (!selectedProduct && !businessAnalysisData)) {
    if (shouldRedirectHome) return null;
    if (analysis.step === "done" && !analysis.isHydrating) {
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

  const opportunityGrid = useMemo(
    () =>
      buildOpportunityGrid(
        deepenedOpportunities,
        morphologicalZones,
        constraintInversions,
        secondOrderUnlocks,
      ),
    [deepenedOpportunities, morphologicalZones, constraintInversions, secondOrderUnlocks],
  );

  return (
    <div className="flex-1 bg-background overflow-y-auto">
      <main className="max-w-[720px] mx-auto px-4 py-6 space-y-6">

        {/* ═══ HEADER ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-3"
        >
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-black text-foreground truncate">
              {analysisDisplayName}
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <ModeBadge />
            </div>
          </div>
        </motion.div>

        {/* ═══ Zone 1: What we found ═══ */}
        <SituationReport
          narrative={narrative}
          thesis={primaryThesis}
          modeAccent={modeAccent}
        />

        {/* ═══ Zone 2: What you could do ═══ */}
        <BreakthroughGrid
          opportunities={opportunityGrid}
          modeAccent={modeAccent}
        />

        {/* ═══ Zone 3: What to do first ═══ */}
        <ActionDirective
          thesis={primaryThesis}
          modeAccent={modeAccent}
        />

        {/* ═══ Navigation to deeper analysis ═══ */}
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

