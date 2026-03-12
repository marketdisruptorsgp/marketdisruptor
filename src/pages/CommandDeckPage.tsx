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
    if (completedSteps.size === 0) { navigate(`${baseUrl}/report`); return; }
    setIsRecomputing(true);
    try { runAnalysis(); } catch { /* silent */ }
  }, [completedSteps, navigate, baseUrl, runAnalysis]);

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
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
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
      <main className="max-w-[900px] mx-auto px-3 sm:px-6 py-3 sm:py-5 space-y-5">

        {/* ═══ HEADER ═══ */}
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
          <div
            className="rounded-xl px-5 py-4 space-y-3"
            style={{ background: "hsl(var(--card))", border: "1.5px solid hsl(var(--primary) / 0.3)" }}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-extrabold uppercase tracking-widest text-foreground">
                Building Your Analysis
              </span>
            </div>
            <div className="flex gap-2">
              {pipelineProgress.steps.filter(s => s.key !== "stressTest" && s.key !== "pitch").map(s => (
                <div key={s.key} className="flex-1">
                  <div
                    className="h-1.5 rounded-full transition-all duration-500"
                    style={{
                      background: s.status === "done" ? "hsl(var(--success, 142 76% 36%))"
                        : s.status === "running" ? "hsl(var(--primary))"
                        : "hsl(var(--muted))",
                    }}
                  />
                  <p className="text-[9px] text-muted-foreground mt-1 text-center">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ DEEPENING INDICATOR ═══ */}
        {isDeepening && hasRun && !pipelineProgress.isRunning && (
          <div
            className="rounded-xl px-4 py-3 flex items-center gap-2"
            style={{ background: `${modeAccent}08`, border: `1px solid ${modeAccent}20` }}
          >
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: modeAccent }} />
            <span className="text-xs font-bold" style={{ color: modeAccent }}>
              Refining insights…
            </span>
          </div>
        )}

        {/* ═══ SECTION 1 — CONTRARIAN INSIGHT ═══ */}
        <ContrarianInsightCard
          thesis={primaryThesis}
          modeAccent={modeAccent}
          entityName={analysisDisplayName}
        />

        {/* ═══ SECTION 2 — BUSINESS REALITY (SWOT) ═══ */}
        {Object.values(swotProse).some(Boolean) && (
          <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.1 }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            <div className="rounded-xl px-5 py-4 bg-muted/50 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <HelpCircle size={14} className="text-primary flex-shrink-0" />
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                  The Question to Answer First
                </span>
              </div>
              <p className="text-base font-bold text-foreground leading-snug">
                {criticalQuestion}
              </p>
            </div>
          </motion.div>
        )}

        {/* ═══ SECTION 4 — TOP 3 OPPORTUNITIES ═══ */}
        {opportunities.length > 0 && (
          <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.2 }}>
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Zap size={15} className="text-primary" />
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                  Top Moves
                </h2>
              </div>
              <div className="space-y-3">
                {opportunities.map((opp, i) => (
                  <Card key={i} className="border-border/60">
                    <CardContent className="pt-5 pb-4">
                      <div className="flex gap-3 items-start">
                        <span className="mt-0.5 flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/15 text-primary text-[10px] font-bold">
                          {i + 1}
                        </span>
                        <div className="min-w-0 space-y-2">
                          <p className="text-sm font-bold text-foreground leading-snug">{opp.title}</p>
                          <p className="text-sm text-muted-foreground leading-relaxed">{opp.description}</p>
                          <div className="flex gap-1.5 flex-wrap">
                            {opp.badges.map((badge) => (
                              <span
                                key={badge}
                                className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary"
                              >
                                {badge}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══ SEE FULL ANALYSIS ═══ */}
        <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.3 }} className="flex justify-center pt-2 pb-4">
          <Button
            size="lg"
            onClick={() => navigate(`${baseUrl}/report`)}
            className="gap-2"
          >
            See Full Analysis
            <ArrowRight size={16} />
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
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-1.5 mb-2">
          <Icon size={13} style={{ color: `hsl(var(${colorVar}))` }} />
          <span
            className="text-[10px] font-extrabold uppercase tracking-wider"
            style={{ color: `hsl(var(${colorVar}))` }}
          >
            {label}
          </span>
        </div>
        <p className="text-sm text-foreground/80 leading-relaxed">{text}</p>
      </CardContent>
    </Card>
  );
}
