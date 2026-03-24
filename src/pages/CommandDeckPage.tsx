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

import { useMemo, useEffect, useState } from "react";
import { ThinDataBanner } from "@/components/SyntheticBadge";
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
import { ReinventionIdeas, type FlippedIdeaItem } from "@/components/strategic/ReinventionIdeas";
import { ActionPath } from "@/components/command-deck/ActionPath";
import { WowCardGrid } from "@/components/creative/WowCardGrid";
import { BlockedPathsPanel } from "@/components/creative/BlockedPathsPanel";
import { AllIdeasDrawer } from "@/components/creative/AllIdeasDrawer";
import { ArrowRight, Search, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadTrace, getTrace, getLatestTrace, restoreTraceForAnalysis } from "@/lib/pipelineTrace";
import PipelineTraceViewer from "@/components/PipelineTraceViewer";
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

    // Use the best vector's rationale — prefer constraint-mode vectors
    const bestVector = zone.vectors.find(v => v.explorationMode === "constraint") ?? zone.vectors[0];
    const rationale = bestVector?.rationale ?? "";

    // Build a plain-English contrarian belief from the primary dimension shift
    const primaryShift = bestVector?.changedDimensions[0];
    const contrarianBelief = primaryShift
      ? `Instead of "${primaryShift.from}", shift to "${primaryShift.to}"`
      : "";

    // Use real vector count as a confidence proxy — more vectors = more evidence
    const BASE_CONFIDENCE = 0.4;
    const CONFIDENCE_INCREMENT_PER_VECTOR = 0.07;
    const MAX_CONFIDENCE = 0.75;
    const vectorConfidence = Math.min(MAX_CONFIDENCE, BASE_CONFIDENCE + zone.vectors.length * CONFIDENCE_INCREMENT_PER_VECTOR);

    result.push({
      id: zone.id,
      title,
      rationale,
      contrarianBelief,
      category: "optimization",
      confidence: vectorConfidence,
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
  return result.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function CommandDeckPage() {
  const analysis = useAnalysis();
  const theme = useModeTheme();
  const navigate = useNavigate();
  const { shouldRedirectHome } = useHydrationGuard();
  const autoAnalysis = useAutoAnalysis();
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [trace, setTrace] = useState(() => getTrace());

  // Auto-execute pipeline in the background — no visible Run button
  const pipelineProgress = usePipelineOrchestrator(
    autoAnalysis.runAnalysis,
    autoAnalysis.runAnalysis,
  );

  const { selectedProduct, analysisId: ctxAnalysisId, businessAnalysisData, businessModelInput, instantInsights, disruptData } =
    analysis;

  const urlAnalysisId = useMemo(() => {
    const match = window.location.pathname.match(/\/analysis\/([0-9a-f-]{36})/);
    return match?.[1] || null;
  }, []);

  const analysisId = ctxAnalysisId || urlAnalysisId;
  const modeAccent = theme.primary;

  // Restore persisted trace for this analysis + live-refresh while panel is open
  useEffect(() => {
    if (analysisId && (!trace || trace.analysisId !== analysisId)) {
      // Prefer latest in-memory trace (may be more up-to-date than sessionStorage)
      const latest = getLatestTrace(analysisId) ?? restoreTraceForAnalysis(analysisId);
      setTrace(latest);
    }
  }, [analysisId]);

  // Live-refresh trace from in-memory store every 2s while diagnostics are shown
  useEffect(() => {
    if (!showDiagnostics) return;
    const id = setInterval(() => {
      const latest = analysisId ? (getLatestTrace(analysisId) ?? getTrace()) : getTrace();
      if (latest) setTrace({ ...latest });
    }, 2000);
    return () => clearInterval(id);
  }, [showDiagnostics, analysisId]);

  const {
    narrative,
    hasRun,
    deepenedOpportunities,
    morphologicalZones,
    constraintInversions,
    secondOrderUnlocks,
    completedSteps,
    wowCards,
    blockedPaths,
    allCreativeIdeas,
  } = autoAnalysis;

  // ── Extract flipped ideas from disruptData (persisted in saved_analyses) ──
  const flippedIdeas: FlippedIdeaItem[] = useMemo(() => {
    if (!disruptData) return [];
    const dd = disruptData as Record<string, unknown>;
    const raw = dd.flippedLogic || dd.flippedIdeas;
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((f: any) => f && (f.boldAlternative || f.alternative || f.idea || f.name))
      .map((f: any) => ({
        originalAssumption: f.originalAssumption || f.assumption || "",
        boldAlternative: f.boldAlternative || f.alternative || f.idea || f.name || "",
        rationale: f.rationale || f.reason || f.whyItWorks || "",
        physicalMechanism: f.physicalMechanism || f.mechanism || "",
      }));
  }, [disruptData]);

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
    // Show instant insights during loading instead of a blank spinner
    if (instantInsights?.contrarianPair || instantInsights?.bindingConstraint) {
      return (
        <div className="flex-1 bg-background overflow-y-auto">
          <main className="max-w-[720px] mx-auto px-4 py-6 space-y-4">
            {/* Loading header */}
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin flex-shrink-0"
                style={{ borderColor: modeAccent }}
              />
              <p className="text-sm font-semibold text-muted-foreground">
                Deep analysis running — first insights ready now
              </p>
            </div>

            {/* Contrarian pair — the "aha moment" */}
            {instantInsights.contrarianPair && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="rounded-xl overflow-hidden"
                style={{
                  background: "hsl(var(--card))",
                  border: `1.5px solid ${modeAccent}30`,
                }}
              >
                <div className="px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: modeAccent }} />
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                        Early Signal
                      </span>
                    </div>
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary animate-pulse">
                      Refining…
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div
                      className="flex-1 rounded-lg px-3 py-2"
                      style={{ background: "hsl(var(--destructive) / 0.06)", border: "1px solid hsl(var(--destructive) / 0.12)" }}
                    >
                      <p className="text-[9px] font-extrabold uppercase tracking-widest mb-1" style={{ color: "hsl(var(--destructive))" }}>
                        Everyone Assumes
                      </p>
                      <p className="text-xs text-foreground/80 leading-snug">
                        "{instantInsights.contrarianPair.everyoneAssumes}"
                      </p>
                    </div>
                    <div className="flex items-center justify-center">
                      <ArrowRight size={16} className="text-muted-foreground rotate-90 sm:rotate-0" />
                    </div>
                    <div
                      className="flex-1 rounded-lg px-3 py-2"
                      style={{ background: `${modeAccent}08`, border: `1px solid ${modeAccent}18` }}
                    >
                      <p className="text-[9px] font-extrabold uppercase tracking-widest mb-1" style={{ color: modeAccent }}>
                        The Evidence Suggests
                      </p>
                      <p className="text-xs text-foreground font-semibold leading-snug">
                        "{instantInsights.contrarianPair.evidenceSuggests}"
                      </p>
                    </div>
                  </div>
                  {instantInsights.contrarianPair.soWhat && (
                    <p className="text-xs text-foreground/70 leading-snug pt-1 border-t border-border/50">
                      <span className="font-semibold">{instantInsights.contrarianPair.soWhat}</span>
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Binding constraint hypothesis */}
            {instantInsights.bindingConstraint && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1 }}
                className="rounded-xl px-4 py-3"
                style={{
                  background: "hsl(var(--card))",
                  border: "1.5px solid hsl(var(--border))",
                }}
              >
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-1.5">
                  The #1 Thing Holding This Business Back
                </p>
                <p className="text-sm font-bold text-foreground leading-snug">
                  {instantInsights.bindingConstraint.label}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                  {instantInsights.bindingConstraint.reasoning}
                </p>
              </motion.div>
            )}

            {/* Assumptions being tested */}
            {instantInsights.assumptions.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="space-y-1.5"
              >
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                  Assumptions We're Testing
                </p>
                {instantInsights.assumptions.slice(0, 3).map((a, i) => (
                  <div
                    key={i}
                    className="rounded-lg px-3 py-2 text-xs"
                    style={{ background: "hsl(var(--muted) / 0.4)", border: "1px solid hsl(var(--border) / 0.5)" }}
                  >
                    <span className="font-semibold text-foreground/80">{a.assumption}</span>
                    <span className="text-muted-foreground"> — {a.challengeHint}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </main>
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

  const mode: "product" | "service" | "business" = businessAnalysisData && !selectedProduct
    ? "business"
    : (selectedProduct?.category ?? "").toLowerCase().includes("service")
      ? "service"
      : "product";




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

        {/* Thin data / early synthesis warning */}
        {!!(disruptData as any)?._thinDataFallback && (
          <ThinDataBanner />
        )}

        {/* ═══ Zone 1: What we found ═══ */}
        <SituationReport
          narrative={narrative}
          thesis={primaryThesis}
          modeAccent={modeAccent}
        />

        {/* ═══ Zone 1.5: Reinvention Ideas — the core differentiator ═══ */}
        <ReinventionIdeas
          ideas={flippedIdeas}
          modeAccent={modeAccent}
        />

        {/* ═══ Zone 2: What you could do ═══ */}
        <BreakthroughGrid
          opportunities={opportunityGrid}
          modeAccent={modeAccent}
        />

        {/* ═══ Zone 2.5: Radical Opportunities ═══ */}
        {wowCards.length > 0 && (
          <>
            <WowCardGrid cards={wowCards} modeAccent={modeAccent} />
            <BlockedPathsPanel paths={blockedPaths} modeAccent={modeAccent} />
            <AllIdeasDrawer ideas={allCreativeIdeas} modeAccent={modeAccent} />
          </>
        )}

        {/* ═══ Zone 3: What to do first ═══ */}
        <ActionDirective
          thesis={primaryThesis}
          modeAccent={modeAccent}
        />

        {/* ═══ Zone 4: What to explore next (pipeline journey) ═══ */}
        {analysisId && (
          <ActionPath
            analysisId={analysisId}
            completedSteps={completedSteps}
            mode={mode}
          />
        )}

        {/* ═══ Pipeline Diagnostic panel ═══ */}
        {analysisId && (
            <div className="rounded-xl border border-dashed border-border/60 bg-muted/30 px-3 py-2.5 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-semibold text-foreground">Pipeline Diagnostic</span>
                  <span className="text-[10px] text-muted-foreground truncate">
                    {trace
                      ? `${trace.analysisId || "unsaved"} · run=${trace.runId ?? "?"} · status=${trace.status ?? (trace.completedAt ? "completed" : "running")} · ${trace.edgeFunctions.length} edge call${trace.edgeFunctions.length !== 1 ? "s" : ""} · ${trace.evidenceExtraction?.dedupedTotal ?? 0} evidence items`
                      : "No trace for this session — run a fresh analysis to populate diagnostics"}
                  </span>
                  {trace && !trace.completedAt && (
                    <span className="text-[10px] text-amber-500 font-medium">⚠ Trace still running — data may be incomplete</span>
                  )}
                </div>
                {trace && (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => downloadTrace(analysisId, analysisDisplayName)} title="Download JSON trace">
                      <Download size={12} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-[10px] px-2 py-0.5 h-6"
                      onClick={() => setShowDiagnostics(v => !v)}
                    >
                      {showDiagnostics ? "Hide details" : "Show details"}
                    </Button>
                  </div>
                )}
              </div>
              {trace && showDiagnostics && <PipelineTraceViewer trace={trace} />}
            </div>
        )}

        {/* ═══ Secondary navigation ═══ */}
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
          {trace && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => downloadTrace(analysisId, analysisDisplayName)}
              className="gap-1.5 text-xs border-dashed"
              title="Download full pipeline diagnostic trace as JSON"
            >
              <Download size={13} />
              Pipeline Diagnostic
            </Button>
          )}
        </motion.div>

      </main>
    </div>
  );
}

