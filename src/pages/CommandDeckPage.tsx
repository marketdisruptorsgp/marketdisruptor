/**
 * Command Deck — Strategic Brief
 *
 * Three-section strategic interface:
 *   1. Strategic Summary  — What we found (constraint + verdict)
 *   2. Opportunity Grid   — What you could do (3-5 action directions)
 *   3. Recommended Move   — What we'd do first (highest-leverage play)
 *   4. "Deep Dive" button — Links to detailed analysis
 *
 * Engineering chrome (pipeline progress, diagnostics, etc.) lives on DeepDivePage.
 */

import { useMemo, useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { useModeTheme } from "@/hooks/useModeTheme";
import { useHydrationGuard } from "@/hooks/useHydrationGuard";
import { useAutoAnalysis } from "@/hooks/useAutoAnalysis";
import { usePipelineOrchestrator } from "@/hooks/usePipelineOrchestrator";
import { ModeBadge } from "@/components/ModeBadge";
import { StepLoadingTracker, type StepTask } from "@/components/StepLoadingTracker";
import {
  Play, RefreshCw, ArrowRight, Zap,
  Target, ChevronDown, ChevronUp, Clock,
  Lightbulb, TrendingUp, Unlock, Calendar, Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import type { DeepenedOpportunity } from "@/lib/reconfiguration";
import type { StrategicNarrative } from "@/lib/strategicEngine";
import type { OpportunityZone } from "@/lib/opportunityDesignEngine";
import type { ConstraintInversion } from "@/lib/constraintInverter";
import type { SecondOrderUnlock } from "@/lib/secondOrderEngine";
import { humanizeLabel } from "@/lib/humanize";

const fadeIn = { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 } };

// ── Opportunity sources merged for the grid ──
interface GridOpportunity {
  id: string;
  title: string;
  explanation: string;
  whyThisWorks: string;
  source: "deepened" | "morphological" | "inversion" | "unlock" | "temporal" | "gap";
}

function buildOpportunityGrid(
  deepened: DeepenedOpportunity[],
  morphZones: OpportunityZone[],
  inversions: ConstraintInversion[],
  unlocks: SecondOrderUnlock[],
): GridOpportunity[] {
  const result: GridOpportunity[] = [];

  // Primary: deepened opportunities (highest fidelity)
  for (const d of deepened.slice(0, 4)) {
    result.push({
      id: d.id,
      title: humanizeLabel(d.reconfigurationLabel),
      explanation: d.summary || d.causalChain?.reasoning || "",
      whyThisWorks: d.economicMechanism?.valueCreation || d.causalChain?.outcome || "",
      source: "deepened",
    });
  }

  // Fill remaining slots from morphological zones
  for (const z of morphZones.slice(0, Math.max(0, 5 - result.length))) {
    const title = humanizeLabel(z.theme ?? "");
    if (!title) continue;
    result.push({
      id: z.id,
      title,
      explanation: "",
      whyThisWorks: "",
      source: "morphological",
    });
  }

  // Fill from constraint inversions
  for (const inv of inversions.slice(0, Math.max(0, 6 - result.length))) {
    if (!inv.invertedFrame) continue;
    result.push({
      id: inv.id,
      title: humanizeLabel(inv.invertedFrame),
      explanation: inv.mechanism || "",
      whyThisWorks: inv.precedent || "",
      source: "inversion",
    });
  }

  // Fill from second-order unlocks
  for (const u of unlocks.slice(0, Math.max(0, 6 - result.length))) {
    if (!u.unlockedBusinessModel) continue;
    result.push({
      id: u.id,
      title: humanizeLabel(u.unlockedBusinessModel),
      explanation: u.valueMechanism || "",
      whyThisWorks: u.unlockPath || "",
      source: "unlock",
    });
  }

  return result.slice(0, 6);
}

const SOURCE_META: Record<GridOpportunity["source"], { label: string; icon: React.ElementType; color: string }> = {
  deepened:     { label: "Strategic", icon: Target,    color: "hsl(var(--primary))" },
  morphological:{ label: "Design",    icon: Lightbulb, color: "hsl(var(--success))" },
  inversion:    { label: "Flip",      icon: TrendingUp, color: "hsl(var(--warning))" },
  unlock:       { label: "Unlock",    icon: Unlock,    color: "hsl(var(--success))" },
  temporal:     { label: "Timing",    icon: Calendar,  color: "hsl(143 70% 45%)" },
  gap:          { label: "Gap",       icon: Search,    color: "hsl(263 70% 60%)" },
};

export default function CommandDeckPage() {
  const analysis = useAnalysis();
  const theme = useModeTheme();
  const navigate = useNavigate();
  const { shouldRedirectHome } = useHydrationGuard();
  const autoAnalysis = useAutoAnalysis();
  const pipelineProgress = usePipelineOrchestrator(autoAnalysis.runAnalysis, autoAnalysis.runAnalysis);

  const { selectedProduct, analysisId: ctxAnalysisId, businessAnalysisData, businessModelInput } = analysis;

  const urlAnalysisId = useMemo(() => {
    const match = window.location.pathname.match(/\/analysis\/([0-9a-f-]{36})/);
    return match?.[1] || null;
  }, []);
  const analysisId = ctxAnalysisId || urlAnalysisId;
  const modeAccent = theme.primary;
  const {
    completedSteps, narrative, runAnalysis, hasRun,
    isComputing: engineComputing,
    deepenedOpportunities, morphologicalZones,
    constraintInversions, secondOrderUnlocks,
  } = autoAnalysis;

  const baseUrl = `/analysis/${analysisId}`;
  const hasBusinessContext = !!businessAnalysisData;
  const analysisDisplayName = selectedProduct?.name || businessModelInput?.type || "Business Model Analysis";

  const modeKey: "product" | "service" | "business" = analysis.activeMode === "service" ? "service"
    : analysis.activeMode === "business" ? "business" : "product";

  const industryLabel = useMemo(() => {
    if (businessModelInput?.type) return businessModelInput.type;
    if (selectedProduct?.category) return selectedProduct.category;
    return modeKey === "service" ? "Service Industry" : modeKey === "business" ? "Business Model" : "Product Market";
  }, [businessModelInput, selectedProduct, modeKey]);

  // ── Recompute ──
  const [isRecomputing, setIsRecomputing] = useState(false);
  useEffect(() => {
    if (!engineComputing && isRecomputing) setIsRecomputing(false);
  }, [engineComputing, isRecomputing]);

  const handleRunAnalysis = useCallback(() => {
    if (completedSteps.size === 0) { pipelineProgress.runAllSteps(); return; }
    setIsRecomputing(true);
    try { pipelineProgress.runAllSteps(); } catch { /* silent */ }
  }, [completedSteps, pipelineProgress]);

  // ── Strategic data ──
  const primaryThesis = deepenedOpportunities[0] ?? null;
  const opportunityGrid = useMemo(
    () => buildOpportunityGrid(
      deepenedOpportunities,
      morphologicalZones,
      constraintInversions,
      secondOrderUnlocks,
    ),
    [deepenedOpportunities, morphologicalZones, constraintInversions, secondOrderUnlocks],
  );

  // ── Guards ──
  const isHydrating = analysis.isHydrating;
  if (analysis.step !== "done" || (!selectedProduct && !hasBusinessContext)) {
    if (shouldRedirectHome) return null;
    if (analysis.step === "done" && !isHydrating) {
      return (
        <div className="flex-1 bg-background flex items-center justify-center px-4">
          <div className="text-center space-y-3 max-w-md">
            <p className="text-sm font-bold text-foreground">Analysis data incomplete</p>
            <p className="text-xs text-muted-foreground">This analysis may need to be re-run.</p>
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
    const isActivelyRunning = analysis.step === "scraping" || analysis.step === "analyzing";
    const activeTasks: StepTask[] = analysis.activeMode === "business"
      ? [
          { label: "Revenue Decomposition", detail: "Breaking down revenue streams" },
          { label: "Cost Structure Audit", detail: "Analyzing cost layers & margins" },
          { label: "Value Chain Mapping", detail: "Tracing value creation flow" },
          { label: "Disruption Scanning", detail: "Identifying vulnerability vectors" },
          { label: "Reinvention Engine", detail: "Generating alternative models" },
        ]
      : [
          { label: "Market Intelligence", detail: "Scraping pricing, reviews & competitors" },
          { label: "Supply Chain Mapping", detail: "Identifying manufacturers & distributors" },
          { label: "Community Signals", detail: "Mining sentiment & demand patterns" },
          { label: "Competitive Analysis", detail: "Cross-referencing market positioning" },
          { label: "Deep Analysis", detail: "Synthesizing strategic insights" },
        ];
    if (isActivelyRunning) {
      const ml = analysis.activeMode === "business" ? "Business Model" : analysis.activeMode === "service" ? "Service" : "Product";
      const instantPair = analysis.instantInsights?.contrarianPair;
      const computeTime = analysis.instantInsights?.computeTimeMs;
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 gap-6">
          <div className="w-full max-w-lg">
            <StepLoadingTracker title={`Building ${ml} Intelligence`} tasks={activeTasks} estimatedSeconds={180} />
          </div>
          {instantPair && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="w-full max-w-lg"
            >
              <div className="rounded-xl overflow-hidden" style={{ background: "hsl(var(--card))", border: "1.5px solid hsl(var(--primary) / 0.3)" }}>
                <div className="px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap size={13} className="text-primary" />
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                        First Structural Insight
                      </span>
                    </div>
                    {computeTime != null && (
                      <span className="text-[9px] font-bold text-primary/60">
                        ⚡ {computeTime < 1000 ? `${computeTime}ms` : `${(computeTime / 1000).toFixed(1)}s`}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="rounded-lg px-3 py-2" style={{ background: "hsl(var(--destructive) / 0.06)", border: "1px solid hsl(var(--destructive) / 0.12)" }}>
                      <p className="text-[9px] font-extrabold uppercase tracking-widest mb-0.5" style={{ color: "hsl(var(--destructive))" }}>Everyone Assumes</p>
                      <p className="text-xs text-foreground/80 leading-snug">"{instantPair.everyoneAssumes}"</p>
                    </div>
                    <div className="rounded-lg px-3 py-2" style={{ background: "hsl(var(--primary) / 0.06)", border: "1px solid hsl(var(--primary) / 0.12)" }}>
                      <p className="text-[9px] font-extrabold uppercase tracking-widest mb-0.5 text-primary">The Evidence Suggests</p>
                      <p className="text-xs text-foreground font-semibold leading-snug">"{instantPair.evidenceSuggests}"</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-foreground/60 leading-snug">{instantPair.soWhat}</p>
                  <p className="text-[10px] text-muted-foreground/50 text-center italic">Deep analysis refining this insight…</p>
                </div>
              </div>
            </motion.div>
          )}
          {analysis.instantInsights && !instantPair && (
            <div className="w-full max-w-lg space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Zap size={12} className="text-primary" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Early Structural Insights</span>
              </div>
              {analysis.instantInsights.bindingConstraint && (
                <div className="rounded-lg px-3 py-2.5 border" style={{ background: "hsl(var(--destructive) / 0.05)", borderColor: "hsl(var(--destructive) / 0.2)" }}>
                  <p className="text-[9px] font-extrabold uppercase tracking-wider" style={{ color: "hsl(var(--destructive))" }}>Binding Constraint Hypothesis</p>
                  <p className="text-xs font-bold text-foreground mt-1">{analysis.instantInsights.bindingConstraint.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{analysis.instantInsights.bindingConstraint.reasoning}</p>
                </div>
              )}
              {analysis.instantInsights.assumptions.slice(0, 3).map((a, i) => (
                <div key={i} className="rounded-lg px-3 py-2 border border-border bg-card">
                  <p className="text-xs font-bold text-foreground">{a.assumption}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{a.challengeHint}</p>
                </div>
              ))}
              <p className="text-[10px] text-muted-foreground/60 text-center italic">Refining with AI analysis…</p>
            </div>
          )}
        </div>
      );
    }
    return (
      <div className="flex-1 bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "hsl(var(--primary))" }} />
      </div>
    );
  }

  const needsAnalysis = !hasRun && completedSteps.size === 0;

  return (
    <div className="flex-1 bg-background overflow-y-auto">
      <main className="max-w-[860px] mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-5">

        {/* ═══ HEADER — analysis name + mode badge only ═══ */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-black text-foreground truncate">
              {analysisDisplayName}
            </h1>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <ModeBadge />
              <span className="text-[11px] text-muted-foreground">{industryLabel}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {needsAnalysis ? (
              <button
                onClick={handleRunAnalysis}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[36px]"
                style={{ background: modeAccent, color: "white" }}
              >
                <Play size={12} /> Run Analysis
              </button>
            ) : (
              <button
                onClick={handleRunAnalysis}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[36px]"
                style={{ background: `${modeAccent}15`, color: modeAccent, border: `1px solid ${modeAccent}30` }}
              >
                <RefreshCw size={13} className={(isRecomputing || engineComputing) ? "animate-spin" : ""} /> Refresh
              </button>
            )}
          </div>
        </div>

        {/* ═══ SECTION 1 — STRATEGIC SUMMARY (What we found) ═══ */}
        <StrategicSummarySection
          narrative={narrative}
          primaryThesis={primaryThesis}
          modeAccent={modeAccent}
          hasRun={hasRun}
          isComputing={engineComputing || isRecomputing}
        />

        {/* ═══ SECTION 2 — OPPORTUNITY GRID (What you could do) ═══ */}
        {opportunityGrid.length > 0 && (
          <OpportunityGridSection
            opportunities={opportunityGrid}
            modeAccent={modeAccent}
          />
        )}

        {/* ═══ SECTION 3 — RECOMMENDED MOVE (What we'd do first) ═══ */}
        {primaryThesis && (
          <NextMoveSection thesis={primaryThesis} modeAccent={modeAccent} />
        )}

        {/* ═══ DEEP DIVE LINK ═══ */}
        <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.35 }} className="flex justify-center pb-2 gap-3">
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

// ─────────────────────────────────────────────────────────────────────────────
//  Section 1 — Strategic Summary
// ─────────────────────────────────────────────────────────────────────────────
function StrategicSummarySection({
  narrative,
  primaryThesis,
  modeAccent,
  hasRun,
  isComputing,
}: {
  narrative: StrategicNarrative | null;
  primaryThesis: DeepenedOpportunity | null;
  modeAccent: string;
  hasRun: boolean;
  isComputing: boolean;
}) {
  const constraint = narrative?.primaryConstraint
    || primaryThesis?.causalChain?.constraint
    || null;
  const verdict = narrative?.strategicVerdict
    || primaryThesis?.reconfigurationLabel
    || null;
  const verdictRationale = narrative?.verdictRationale
    || primaryThesis?.causalChain?.reasoning
    || null;

  const isReady = hasRun && (!!constraint || !!verdict);

  return (
    <motion.div {...fadeIn} transition={{ duration: 0.35, delay: 0.05 }}>
      <div
        className="rounded-xl px-5 py-4 space-y-3"
        style={{
          background: "hsl(var(--card))",
          border: `1.5px solid ${modeAccent}30`,
        }}
      >
        {/* Section label */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Zap size={13} style={{ color: modeAccent }} />
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
              What we found
            </span>
          </div>
          {isComputing && (
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: modeAccent }} />
              <span className="text-[10px] font-bold" style={{ color: modeAccent }}>Refining…</span>
            </div>
          )}
        </div>

        {!isReady ? (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {isComputing
              ? "Analysing your business model — strategic insights will appear shortly."
              : "Run the analysis to generate your strategic brief."}
          </p>
        ) : (
          <>
            {/* Constraint */}
            {constraint && (
              <div
                className="rounded-lg px-3 py-2.5"
                style={{ background: "hsl(var(--destructive) / 0.05)", border: "1px solid hsl(var(--destructive) / 0.15)" }}
              >
                <p className="text-[9px] font-extrabold uppercase tracking-widest mb-1" style={{ color: "hsl(var(--destructive))" }}>
                  Structural Constraint
                </p>
                <p className="text-sm font-bold text-foreground leading-snug">
                  {humanizeLabel(constraint)}
                </p>
              </div>
            )}

            {/* Strategic verdict */}
            {verdict && (
              <div>
                <p className="text-base sm:text-lg font-black text-foreground leading-snug">
                  {humanizeLabel(verdict)}
                </p>
                {verdictRationale && (
                  <p className="text-sm text-muted-foreground leading-relaxed mt-1">
                    {verdictRationale}
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Section 2 — Opportunity Grid
// ─────────────────────────────────────────────────────────────────────────────
function OpportunityGridSection({
  opportunities,
  modeAccent,
}: {
  opportunities: GridOpportunity[];
  modeAccent: string;
}) {
  return (
    <motion.div {...fadeIn} transition={{ duration: 0.35, delay: 0.12 }}>
      <div className="space-y-2">
        {/* Section label */}
        <div className="flex items-center gap-2 px-1">
          <Lightbulb size={13} style={{ color: modeAccent }} />
          <h2 className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
            What you could do
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {opportunities.map((opp, i) => (
            <OpportunityCard key={opp.id} opp={opp} index={i} modeAccent={modeAccent} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function OpportunityCard({
  opp,
  index,
  modeAccent,
}: {
  opp: GridOpportunity;
  index: number;
  modeAccent: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const meta = SOURCE_META[opp.source];
  const Icon = meta.icon;
  const hasExtra = !!opp.whyThisWorks;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 + index * 0.04, duration: 0.3 }}
      className="rounded-xl overflow-hidden"
      style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
    >
      <div className="px-4 py-3 space-y-2">
        {/* Header */}
        <div className="flex items-start gap-2.5">
          <span
            className="text-xs font-extrabold tabular-nums w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background: `${modeAccent}15`, color: modeAccent }}
          >
            {index + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-foreground leading-snug">{opp.title}</p>
            <span
              className="inline-flex items-center gap-1 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full mt-1"
              style={{ background: `${meta.color}15`, color: meta.color }}
            >
              <Icon size={8} />
              {meta.label}
            </span>
          </div>
        </div>

        {/* Explanation */}
        {opp.explanation && (
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            {opp.explanation}
          </p>
        )}

        {/* Why this works — expandable */}
        {hasExtra && (
          <>
            <button
              onClick={() => setExpanded(v => !v)}
              className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              Why this works
              {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>
            {expanded && (
              <p className="text-[11px] text-muted-foreground leading-relaxed border-t border-border/50 pt-2">
                {opp.whyThisWorks}
              </p>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  Section 3 — Recommended Move
// ─────────────────────────────────────────────────────────────────────────────
function NextMoveSection({
  thesis,
  modeAccent,
}: {
  thesis: DeepenedOpportunity;
  modeAccent: string;
}) {
  const firstMove = thesis.firstMove;
  const timelineLabel = firstMove?.timeframe || "2–4 weeks";

  return (
    <motion.div {...fadeIn} transition={{ duration: 0.35, delay: 0.22 }}>
      <div
        className="rounded-xl px-5 py-4 space-y-3"
        style={{
          background: `${modeAccent}08`,
          border: `1.5px solid ${modeAccent}30`,
        }}
      >
        {/* Section label */}
        <div className="flex items-center gap-2">
          <Target size={13} style={{ color: modeAccent }} />
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
            What we'd do first
          </span>
        </div>

        {/* The move */}
        <div>
          <h3 className="text-base sm:text-lg font-black text-foreground leading-snug">
            {firstMove?.action ? humanizeLabel(firstMove.action) : humanizeLabel(thesis.reconfigurationLabel)}
          </h3>
        </div>

        {/* Why */}
        {(firstMove?.learningObjective || thesis.economicMechanism?.valueCreation) && (
          <div className="space-y-1">
            <p className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground">Why</p>
            <p className="text-sm text-foreground/80 leading-relaxed">
              {firstMove?.learningObjective || thesis.economicMechanism?.valueCreation}
            </p>
          </div>
        )}

        {/* How to start */}
        {firstMove?.successCriteria && (
          <div className="space-y-1">
            <p className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground">How to start</p>
            <p className="text-sm text-foreground/80 leading-relaxed">{firstMove.successCriteria}</p>
          </div>
        )}

        {/* Timeline */}
        <div className="flex items-center gap-1.5 pt-1 border-t border-border/30">
          <Clock size={11} className="text-muted-foreground" />
          <span className="text-[11px] font-semibold text-muted-foreground">
            Timeline: {timelineLabel}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
