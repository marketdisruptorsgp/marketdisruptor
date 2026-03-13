/**
 * Command Deck — Founder Briefing (fits one screen)
 *
 * Shows ONLY:
 *   - Header + action buttons
 *   - Deal metrics strip
 *   - Contrarian insight card
 *   - 4-card SWOT grid
 *   - Critical question
 *   - Top 3 opportunities with badges
 *   - "See Full Analysis" button
 *
 * Everything else lives on ReportPage, DisruptPage, StressTestPage, or InsightGraphPage.
 */

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useModeTheme } from "@/hooks/useModeTheme";
import { useHydrationGuard } from "@/hooks/useHydrationGuard";
import { useWorkspaceTheme } from "@/hooks/useWorkspaceTheme";
import { WorkspaceThemeToggle } from "@/components/WorkspaceThemeToggle";
import { useAutoAnalysis } from "@/hooks/useAutoAnalysis";
import { usePipelineOrchestrator } from "@/hooks/usePipelineOrchestrator";
import { ModeBadge } from "@/components/ModeBadge";
import { ContrarianInsightCard } from "@/components/command-deck/ContrarianInsightCard";
import { DealMetricsStrip } from "@/components/command-deck/DealMetricsStrip";
import { StepLoadingTracker, type StepTask } from "@/components/StepLoadingTracker";
import {
  extractSingleInsight,
  extractAssumptionBanner,
  extractCriticalQuestion,
  extractSwotProse,
  extractOpportunitiesWithBadges,
} from "@/lib/swotExtractor";
import {
  Play, RefreshCw, FileDown, ArrowRight,
  TrendingUp, AlertTriangle, Target, ShieldAlert, HelpCircle, Zap,
  Lightbulb, Star,
} from "lucide-react";
import { toast } from "sonner";
import {
  computeCommandDeckMetrics, aggregateOpportunities,
  type CommandDeckMetrics as DeckMetrics,
} from "@/lib/commandDeckMetrics";
import { extractAllEvidence } from "@/lib/evidenceEngine";
import { humanizeLabel } from "@/lib/humanize";
import { downloadReportAsPDF } from "@/lib/downloadReportPDF";
import { gatherAllAnalysisData } from "@/lib/gatherAnalysisData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { PipelineTimerStrip } from "@/components/analysis/PipelineTimerStrip";

const PIPELINE_STEPS = [
  { key: "report", label: "Report", route: "report" },
  { key: "disrupt", label: "Disrupt", route: "disrupt" },
  { key: "redesign", label: "Redesign", route: "redesign" },
  { key: "stress-test", label: "Stress Test", route: "stress-test" },
  { key: "pitch", label: "Pitch", route: "pitch" },
] as const;

const fadeIn = { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 } };

export default function CommandDeckPage() {
  const analysis = useAnalysis();
  const { tier } = useSubscription();
  const theme = useModeTheme();
  const navigate = useNavigate();
  const { shouldRedirectHome } = useHydrationGuard();
  const { theme: workspaceTheme, toggle: toggleTheme } = useWorkspaceTheme();
  const autoAnalysis = useAutoAnalysis();
  const pipelineProgress = usePipelineOrchestrator(autoAnalysis.runAnalysis, autoAnalysis.runAnalysis);

  const { selectedProduct, analysisId: ctxAnalysisId, businessAnalysisData, businessModelInput } = analysis;

  const urlAnalysisId = useMemo(() => {
    const match = window.location.pathname.match(/\/analysis\/([0-9a-f-]{36})/);
    return match?.[1] || null;
  }, []);
  const analysisId = ctxAnalysisId || urlAnalysisId;
  const modeAccent = theme.primary;
  const { intelligence, completedSteps, narrative, runAnalysis, hasRun, isComputing: engineComputing } = autoAnalysis;

  // ── Aggregated Metrics ──
  const allEvidence = useMemo(() => extractAllEvidence({
    products: analysis.products, selectedProduct,
    disruptData: analysis.disruptData, redesignData: analysis.redesignData,
    stressTestData: analysis.stressTestData, pitchDeckData: analysis.pitchDeckData,
    governedData: analysis.governedData as Record<string, unknown> | null,
    businessAnalysisData: analysis.businessAnalysisData, intelligence,
    analysisType: analysis.activeMode === "service" ? "service" : analysis.activeMode === "business" ? "business_model" : "product",
    geoMarketData: analysis.geoData, regulatoryData: analysis.regulatoryData,
  }), [
    analysis.products, selectedProduct, analysis.disruptData, analysis.redesignData,
    analysis.stressTestData, analysis.pitchDeckData, analysis.governedData,
    analysis.businessAnalysisData, intelligence, analysis.activeMode,
    analysis.geoData, analysis.regulatoryData,
  ]);

  const metricsInput = useMemo(() => ({
    products: analysis.products, selectedProduct,
    disruptData: analysis.disruptData, redesignData: analysis.redesignData,
    stressTestData: analysis.stressTestData, pitchDeckData: analysis.pitchDeckData,
    governedData: analysis.governedData as Record<string, unknown> | null,
    businessAnalysisData: analysis.businessAnalysisData, intelligence, completedSteps,
    evidence: allEvidence,
  }), [
    analysis.products, selectedProduct, analysis.disruptData, analysis.redesignData,
    analysis.stressTestData, analysis.pitchDeckData, analysis.governedData,
    analysis.businessAnalysisData, intelligence, completedSteps, allEvidence,
  ]);

  const metrics: DeckMetrics = useMemo(() => computeCommandDeckMetrics(metricsInput), [metricsInput]);
  const topOpps = useMemo(() => aggregateOpportunities(metricsInput), [metricsInput]);

  const baseUrl = `/analysis/${analysisId}`;
  const totalSignals = metrics.stepSignals.reduce((s, ss) => s + (ss.hasData ? ss.signals : 0), 0);
  const hasBusinessContext = !!businessAnalysisData;
  const analysisDisplayName = selectedProduct?.name || businessModelInput?.type || "Business Model Analysis";

  // ── Recompute ──
  const [isRecomputing, setIsRecomputing] = useState(false);
  const isDeepening = engineComputing || isRecomputing;

  useEffect(() => {
    if (!engineComputing && isRecomputing) setIsRecomputing(false);
  }, [engineComputing, isRecomputing]);

  const handleRecomputeAll = useCallback(() => {
    if (completedSteps.size === 0) { pipelineProgress.runAllSteps(); return; }
    setIsRecomputing(true);
    try { pipelineProgress.runAllSteps(); } catch { /* silent */ }
  }, [completedSteps, pipelineProgress]);

  const modeKey: "product" | "service" | "business" = analysis.activeMode === "service" ? "service"
    : analysis.activeMode === "business" ? "business" : "product";

  const industryLabel = useMemo(() => {
    if (businessModelInput?.type) return businessModelInput.type;
    if (selectedProduct?.category) return selectedProduct.category;
    return modeKey === "service" ? "Service Industry" : modeKey === "business" ? "Business Model" : "Product Market";
  }, [businessModelInput, selectedProduct, modeKey]);

  // ── Extracted data (must be before guards — hooks can't be after early returns) ──
  const primaryThesis = autoAnalysis.deepenedOpportunities[0] ?? null;
  const allOpportunities = autoAnalysis.deepenedOpportunities;
  const biExtraction = (analysis as any)?.biExtraction ?? analysis.adaptiveContext?.biExtraction ?? null;
  const governedDataTyped = analysis.governedData as Record<string, any> | null;
  const entityName = analysis.adaptiveContext?.entity?.name || selectedProduct?.name || "This business";

  const deepOpps = autoAnalysis.deepenedOpportunities || [];
  const swotProse = useMemo(() => extractSwotProse(narrative, deepOpps), [narrative, deepOpps]);
  const criticalQuestion = useMemo(() => extractCriticalQuestion(narrative, deepOpps), [narrative, deepOpps]);
  const opportunities = useMemo(() => extractOpportunitiesWithBadges(topOpps, deepOpps), [topOpps, deepOpps]);

  // Flipped ideas — available immediately after scraping (no pipeline needed)
  const flippedIdeas = useMemo(() => {
    const ideas = selectedProduct?.flippedIdeas || [];
    return ideas
      .filter((idea: any) => idea.name && idea.description)
      .sort((a: any, b: any) => {
        const scoreA = (a.scores?.feasibility || 0) + (a.scores?.profitability || 0) + (a.scores?.novelty || 0);
        const scoreB = (b.scores?.feasibility || 0) + (b.scores?.profitability || 0) + (b.scores?.novelty || 0);
        return scoreB - scoreA;
      })
      .slice(0, 3);
  }, [selectedProduct]);

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

          {/* Instant contrarian card — the "holy shit" moment at 5 seconds */}
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

          {/* Additional instant insights */}
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

  return (
    <div className="flex-1 bg-background overflow-y-auto">
      <main className="max-w-[900px] mx-auto px-3 sm:px-6 py-1.5 sm:py-2 space-y-2">

        {/* ═══ HEADER ═══ */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-black text-foreground truncate">
              {analysisDisplayName}
            </h1>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <ModeBadge />
              <span className="text-[11px] text-muted-foreground">{industryLabel}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {!pipelineProgress.isRunning && completedSteps.size < PIPELINE_STEPS.length && (
              <button
                onClick={handleRecomputeAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[36px]"
                style={{ background: modeAccent, color: "white" }}
              >
                <Play size={12} /> Run Analysis
              </button>
            )}
            <button
              onClick={() => {
                if (!selectedProduct) return;
                const data = gatherAllAnalysisData(analysis);
                toast.loading("Generating PDF…", { id: "pdf-progress" });
                downloadReportAsPDF(selectedProduct, data, {
                  title: selectedProduct.name || analysisDisplayName,
                  mode: analysis.activeMode,
                  onProgress: (msg: string) => toast.loading(msg, { id: "pdf-progress" }),
                }).then(() => { toast.dismiss("pdf-progress"); toast.success("PDF downloaded!"); })
                  .catch(() => { toast.dismiss("pdf-progress"); toast.error("Failed to download PDF"); });
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[36px] bg-muted text-foreground border border-border"
            >
              <FileDown size={13} /> PDF
            </button>
            <button onClick={handleRecomputeAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[36px]"
              style={{ background: `${modeAccent}15`, color: modeAccent, border: `1px solid ${modeAccent}30` }}>
              <RefreshCw size={13} className={(isRecomputing || engineComputing) ? "animate-spin" : ""} /> Refresh
            </button>
            <WorkspaceThemeToggle theme={workspaceTheme} onToggle={toggleTheme} />
          </div>
        </div>

        {/* ═══ DEAL METRICS STRIP ═══ */}
        <DealMetricsStrip
          biExtraction={biExtraction}
          governedData={governedDataTyped}
        />

        {/* ═══ ANALYSIS PROGRESS ═══ */}
        {pipelineProgress.isRunning && (
          <PipelineTimerStrip pipelineProgress={pipelineProgress} />
        )}

        {/* ═══ DEEPENING INDICATOR ═══ */}
        {isDeepening && hasRun && !pipelineProgress.isRunning && (
          <div className="flex items-center gap-1.5 px-1">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: modeAccent }} />
            <span className="text-[10px] font-bold" style={{ color: modeAccent }}>Refining insights…</span>
          </div>
        )}

        {/* ═══ SECTION 1 — CONTRARIAN INSIGHT ═══ */}
        <ContrarianInsightCard
          thesis={primaryThesis}
          modeAccent={modeAccent}
          entityName={analysisDisplayName}
          instantPair={analysis.instantInsights?.contrarianPair}
          computeTimeMs={analysis.instantInsights?.computeTimeMs}
        />

        {/* ═══ SECTION 1.5 — FLIPPED IDEAS (available instantly after scraping) ═══ */}
        {flippedIdeas.length > 0 && (
          <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.12 }}>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 px-1">
                <Lightbulb size={12} className="text-primary" />
                <h2 className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  Reinvention Ideas
                </h2>
                {!hasRun && (
                  <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary ml-auto">
                    Instant
                  </span>
                )}
              </div>
              {flippedIdeas.map((idea: any, i: number) => {
                const topScore = Math.max(
                  idea.scores?.feasibility || 0,
                  idea.scores?.profitability || 0,
                  idea.scores?.novelty || 0
                );
                const starLabel = topScore >= 8 ? "High potential" : topScore >= 6 ? "Promising" : null;
                return (
                  <div
                    key={i}
                    className="rounded-lg border border-border/60 bg-card px-3 py-2.5"
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: `${modeAccent}12`, border: `1px solid ${modeAccent}25` }}
                      >
                        <Lightbulb size={10} style={{ color: modeAccent }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-bold text-foreground leading-snug">{idea.name}</p>
                          {starLabel && (
                            <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0 rounded-full bg-accent text-accent-foreground">
                              <Star size={8} /> {starLabel}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2 mt-0.5">
                          {idea.description}
                        </p>
                        {idea.reasoning && (
                          <p className="text-[10px] text-muted-foreground/70 leading-snug line-clamp-1 mt-1 italic">
                            Why: {idea.reasoning}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {Object.values(swotProse).some(Boolean) && (
          <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.1 }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {swotProse.working && (
                <RealityCard
                  icon={TrendingUp}
                  label="What's Working"
                  text={swotProse.working}
                  colorVar="--success"
                />
              )}
              {swotProse.blocking && (
                <RealityCard
                  icon={AlertTriangle}
                  label="What's Blocking Growth"
                  text={swotProse.blocking}
                  colorVar="--warning"
                />
              )}
              {swotProse.opening && (
                <RealityCard
                  icon={Target}
                  label="The Opening"
                  text={swotProse.opening}
                  colorVar="--primary"
                />
              )}
              {swotProse.risk && (
                <RealityCard
                  icon={ShieldAlert}
                  label="The Risk"
                  text={swotProse.risk}
                  colorVar="--destructive"
                />
              )}
            </div>
          </motion.div>
        )}

        {/* ═══ SECTION 3 — CRITICAL QUESTION ═══ */}
        {criticalQuestion && (
          <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.15 }}>
            <div className="rounded-lg px-3 py-2 bg-muted/50 border border-border flex items-start gap-2">
              <HelpCircle size={13} className="text-primary flex-shrink-0 mt-0.5" />
              <p className="text-xs font-bold text-foreground leading-snug line-clamp-2">
                {criticalQuestion}
              </p>
            </div>
          </motion.div>
        )}

        {/* ═══ SECTION 4 — TOP 3 OPPORTUNITIES ═══ */}
        {opportunities.length > 0 && (
          <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.2 }}>
            <div className="space-y-1">
              <div className="flex items-center gap-2 px-1">
                <Zap size={12} className="text-primary" />
                <h2 className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  Top Moves
                </h2>
              </div>
              {opportunities.map((opp, i) => {
                // Find matching deepened opportunity for analogy badge
                const matchedDeep = deepOpps.find(d =>
                  d.label === opp.title || d.reconfigurationLabel === opp.title
                );
                const precedent = matchedDeep?.strategicPrecedents?.[0];

                return (
                  <div key={i} className="rounded-lg border border-border/60 bg-card px-3 py-2">
                    <div className="flex gap-2 items-start">
                      <span className="flex-shrink-0 inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary/15 text-primary text-[9px] font-bold mt-0.5">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs font-bold text-foreground leading-snug">{opp.title}</p>
                          {opp.badges.map((badge) => (
                            <span key={badge} className="text-[9px] font-bold px-1.5 py-0 rounded-full bg-primary/10 text-primary">
                              {badge}
                            </span>
                          ))}
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-snug line-clamp-1 mt-0.5">{opp.description}</p>
                        {precedent && (
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-accent text-accent-foreground">
                              Inspired by: {precedent.company} → {precedent.pattern}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ═══ SEE FULL ANALYSIS ═══ */}
        <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.3 }} className="flex justify-center pb-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`${baseUrl}/report`)}
            className="gap-1.5 text-xs"
          >
            See Full Analysis
            <ArrowRight size={14} />
          </Button>
        </motion.div>

      </main>
    </div>
  );
}

/* ── Reality Card (SWOT) ── */
function RealityCard({
  icon: Icon, label, text, colorVar,
}: {
  icon: React.ElementType; label: string; text: string; colorVar: string;
}) {
  return (
    <Card
      className="border"
      style={{
        background: `hsl(var(${colorVar}) / 0.04)`,
        borderColor: `hsl(var(${colorVar}) / 0.15)`,
      }}
    >
      <CardContent className="pt-2.5 pb-2.5 px-3">
        <div className="flex items-center gap-1.5 mb-0.5">
          <Icon size={12} style={{ color: `hsl(var(${colorVar}))` }} />
          <span
            className="text-[9px] font-extrabold uppercase tracking-wider"
            style={{ color: `hsl(var(${colorVar}))` }}
          >
            {label}
          </span>
        </div>
        <p className="text-[11px] text-foreground/80 leading-snug line-clamp-2">{text}</p>
      </CardContent>
    </Card>
  );
}
