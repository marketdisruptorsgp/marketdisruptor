/**
 * Deep Dive — Detailed Analysis
 *
 * Contains all the analysis detail removed from the Strategic Brief (CommandDeckPage):
 *   - Deal metrics strip
 *   - Contrarian insight (reasoning chain)
 *   - Reinvention ideas
 *   - SWOT reality cards
 *   - Critical question
 *   - Top opportunities with badges
 *   - Pipeline progress & analysis controls
 *   - "See Full Analysis" links to pipeline pages
 */

import { useMemo, useState, useCallback, useEffect } from "react";
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
import { DealScorecard } from "@/components/command-deck/DealScorecard";
import { PostClosePlaybook } from "@/components/command-deck/PostClosePlaybook";
import { StepLoadingTracker, type StepTask } from "@/components/StepLoadingTracker";
import {
  extractCriticalQuestion,
  extractSwotProse,
  extractOpportunitiesWithBadges,
} from "@/lib/swotExtractor";
import {
  Play, RefreshCw, FileDown, ArrowLeft, ArrowRight,
  TrendingUp, AlertTriangle, Target, ShieldAlert, HelpCircle, Zap,
  Lightbulb, Star,
} from "lucide-react";
import { toast } from "sonner";
import {
  computeCommandDeckMetrics, aggregateOpportunities,
  type CommandDeckMetrics as DeckMetrics,
} from "@/lib/commandDeckMetrics";
import { extractAllEvidence } from "@/lib/evidenceEngine";
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

export default function DeepDivePage() {
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
  const { intelligence, completedSteps, narrative, hasRun, isComputing: engineComputing } = autoAnalysis;

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
  const biExtraction = ((analysis as { biExtraction?: unknown })?.biExtraction ?? analysis.adaptiveContext?.biExtraction ?? null) as Record<string, unknown> | null;
  const governedDataTyped = (analysis.governedData ?? null) as Record<string, unknown> | null;
  const entityName = analysis.adaptiveContext?.entity?.name || selectedProduct?.name || "This business";

  const deepOpps = useMemo(() => autoAnalysis.deepenedOpportunities, [autoAnalysis.deepenedOpportunities]);
  const swotProse = useMemo(() => extractSwotProse(narrative, deepOpps), [narrative, deepOpps]);
  const criticalQuestion = useMemo(() => extractCriticalQuestion(narrative, deepOpps), [narrative, deepOpps]);
  const opportunities = useMemo(() => extractOpportunitiesWithBadges(topOpps, deepOpps), [topOpps, deepOpps]);

  // Flipped ideas — available immediately after scraping (no pipeline needed)
  interface FlippedIdea { name: string; description: string; reasoning?: string; scores?: { feasibility?: number; profitability?: number; novelty?: number } }
  const flippedIdeas = useMemo(() => {
    const ideas: FlippedIdea[] = (selectedProduct?.flippedIdeas as FlippedIdea[] | undefined) || [];
    return ideas
      .filter((idea) => idea.name && idea.description)
      .sort((a, b) => {
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
      return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 gap-6">
          <div className="w-full max-w-lg">
            <StepLoadingTracker title={`Building ${ml} Intelligence`} tasks={activeTasks} estimatedSeconds={180} />
          </div>
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
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(`${baseUrl}/command-deck`)}
                className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft size={12} /> Strategic Brief
              </button>
            </div>
            <h1 className="text-base sm:text-lg font-black text-foreground truncate mt-0.5">
              {analysisDisplayName} — Deep Dive
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

        {/* ═══ ETA DEAL SCORECARD ═══ */}
        {modeKey === "business" && (
          <DealScorecard
            biExtraction={biExtraction}
            governedData={governedDataTyped}
          />
        )}

        {/* ═══ ETA POST-CLOSE PLAYBOOK ═══ */}
        {modeKey === "business" && (
          <PostClosePlaybook
            biExtraction={biExtraction}
            governedData={governedDataTyped}
          />
        )}

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

        {/* ═══ CONTRARIAN INSIGHT ═══ */}
        <ContrarianInsightCard
          thesis={primaryThesis}
          modeAccent={modeAccent}
          entityName={entityName}
          instantPair={analysis.instantInsights?.contrarianPair}
          computeTimeMs={analysis.instantInsights?.computeTimeMs}
        />

        {/* ═══ REINVENTION IDEAS ═══ */}
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
              {flippedIdeas.map((idea, i) => {
                const topScore = Math.max(
                  idea.scores?.feasibility || 0,
                  idea.scores?.profitability || 0,
                  idea.scores?.novelty || 0
                );
                const starLabel = topScore >= 8 ? "High potential" : topScore >= 6 ? "Promising" : null;
                return (
                  <div key={i} className="rounded-lg border border-border/60 bg-card px-3 py-2.5">
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

        {/* ═══ REALITY CHECK (SWOT) ═══ */}
        {Object.values(swotProse).some(Boolean) && (
          <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.1 }}>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 px-1">
                <Zap size={12} className="text-primary" />
                <h2 className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  Reality Check
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {swotProse.working && (
                  <RealityCard icon={TrendingUp} label="What's Working" text={swotProse.working} colorVar="--success" />
                )}
                {swotProse.blocking && (
                  <RealityCard icon={AlertTriangle} label="What's Blocking Growth" text={swotProse.blocking} colorVar="--warning" />
                )}
                {swotProse.opening && (
                  <RealityCard icon={Target} label="The Opening" text={swotProse.opening} colorVar="--primary" />
                )}
                {swotProse.risk && (
                  <RealityCard icon={ShieldAlert} label="The Risk" text={swotProse.risk} colorVar="--destructive" />
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══ CRITICAL QUESTION ═══ */}
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

        {/* ═══ ALL OPPORTUNITIES ═══ */}
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
                          {opp.badges.map((badge: string) => (
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

        {/* ═══ PIPELINE NAVIGATION ═══ */}
        <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.25 }}>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 px-1">
              <Zap size={12} className="text-primary" />
              <h2 className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                Full Analysis Pipeline
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {PIPELINE_STEPS.map(step => (
                <button
                  key={step.key}
                  onClick={() => navigate(`${baseUrl}/${step.route}`)}
                  className="rounded-lg border border-border bg-card px-3 py-2 text-left flex items-center justify-between gap-1 hover:bg-muted/50 transition-colors"
                >
                  <span className="text-xs font-bold text-foreground">{step.label}</span>
                  <ArrowRight size={11} className="text-muted-foreground flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ═══ BACK TO STRATEGIC BRIEF ═══ */}
        <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.3 }} className="flex justify-center pb-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`${baseUrl}/command-deck`)}
            className="gap-1.5 text-xs"
          >
            <ArrowLeft size={13} />
            Back to Strategic Brief
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
