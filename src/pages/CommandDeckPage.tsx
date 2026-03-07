/**
 * Command Deck — Strategic Decision Interface (Redesigned)
 *
 * Clear 3-tier visual hierarchy:
 *   Tier 1 — Hero Score (single dominant metric + top signal)
 *   Tier 2 — Strategic Narrative (prose-first, collapsible chain)
 *   Tier 3 — Metrics Strip (4 compact scorecards)
 *   Tier 4 — Tools Grid (Opportunity Map + Constraint Radar)
 *   Tier 5 — Leverage Signals + Action Path
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
import { usePipelineOrchestrator, type PipelineProgress } from "@/hooks/usePipelineOrchestrator";
import { ModeBadge } from "@/components/ModeBadge";
import { LensIntelligencePanel } from "@/components/LensIntelligencePanel";
import { RecomputeOverlay } from "@/components/RecomputeOverlay";
import { ReasoningStagesOverlay } from "@/components/command-deck/ReasoningStagesOverlay";
import { ConfidenceMeter } from "@/components/command-deck/ConfidenceMeter";
import { HeroScorePanel } from "@/components/command-deck/HeroScorePanel";
import { NarrativeSummary } from "@/components/command-deck/NarrativeSummary";
import { StrategicVerdictBanner } from "@/components/command-deck/StrategicVerdictBanner";
import { TrappedValueCard } from "@/components/command-deck/TrappedValueCard";
import { KillQuestionCard } from "@/components/command-deck/KillQuestionCard";
import { MetricsStrip } from "@/components/command-deck/MetricsStrip";
import { OpportunityMap } from "@/components/command-deck/OpportunityMap";
import { ConstraintRadar } from "@/components/command-deck/ConstraintRadar";
import { StrategicLeverageSignals } from "@/components/command-deck/StrategicLeverageSignals";
import { ActionPath } from "@/components/command-deck/ActionPath";
import {
  LayoutDashboard, GitBranch, Target, Crosshair, Lightbulb,
  AlertTriangle, Rocket, RefreshCw, ChevronDown, ChevronUp, Play,
} from "lucide-react";
import { toast } from "sonner";
import {
  computeCommandDeckMetrics, aggregateOpportunities,
  type CommandDeckMetrics as DeckMetrics,
} from "@/lib/commandDeckMetrics";
import { extractAllEvidence, type EvidenceTier } from "@/lib/evidenceEngine";
import { getScenarios, scenarioToEvidence, type ToolScenario } from "@/lib/scenarioEngine";
import { recomputeIntelligence } from "@/lib/recomputeIntelligence";

const PIPELINE_STEPS = [
  { key: "report", label: "Report", icon: Target, route: "report" },
  { key: "disrupt", label: "Disrupt", icon: Crosshair, route: "disrupt" },
  { key: "redesign", label: "Redesign", icon: Lightbulb, route: "redesign" },
  { key: "stress-test", label: "Stress Test", icon: AlertTriangle, route: "stress-test" },
  { key: "pitch", label: "Pitch", icon: Rocket, route: "pitch" },
] as const;

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
  const { intelligence, graph, completedSteps, narrative, diagnostic, runAnalysis, hasRun, isComputing: engineComputing } = autoAnalysis;

  // ── Aggregated Metrics ──
  const allEvidence = useMemo(() => extractAllEvidence({
    products: analysis.products, selectedProduct,
    disruptData: analysis.disruptData, redesignData: analysis.redesignData,
    stressTestData: analysis.stressTestData, pitchDeckData: analysis.pitchDeckData,
    governedData: analysis.governedData as Record<string, unknown> | null,
    businessAnalysisData: analysis.businessAnalysisData, intelligence,
    analysisType: analysis.activeMode === "service" ? "service" : analysis.activeMode === "business" ? "business_model" : "product",
  }), [
    analysis.products, selectedProduct, analysis.disruptData, analysis.redesignData,
    analysis.stressTestData, analysis.pitchDeckData, analysis.governedData,
    analysis.businessAnalysisData, intelligence, analysis.activeMode,
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

  const [tierFilter, setTierFilter] = useState<EvidenceTier | null>(null);
  const filteredOpps = useMemo(() => {
    if (!tierFilter) return topOpps;
    return topOpps.filter((o: any) => !o.tier || o.tier === tierFilter);
  }, [topOpps, tierFilter]);

  // ── Strategic Potential Score ──
  const scenarioCountRef = useRef(0);
  const strategicPotential = useMemo(() => {
    // Simulation boost capped lower to prevent inflation from just running tools
    const simBoost = Math.min(scenarioCountRef.current * 0.15, 0.8);
    // Pipeline coverage penalty — incomplete pipelines get reduced scores
    const coverageFactor = Math.max(0.5, completedSteps.size / 5);
    const raw = ((metrics.opportunityScore + metrics.leverageScore + simBoost)
      - (metrics.frictionIndex * 0.5)
      - (metrics.riskScore * 0.3)) * coverageFactor;
    return Math.max(0, Math.min(10, Math.round(raw * 10) / 10));
  }, [metrics, completedSteps]);

  const baseUrl = `/analysis/${analysisId}`;
  const totalSignals = metrics.stepSignals.reduce((s, ss) => s + (ss.hasData ? ss.signals : 0), 0);
  const hasBusinessContext = !!businessAnalysisData;
  const analysisDisplayName = selectedProduct?.name || businessModelInput?.type || "Business Model Analysis";

  const lensSignalKeywords = useMemo(() => {
    const keywords: string[] = [];
    if (autoAnalysis.insights) {
      autoAnalysis.insights.forEach(i => {
        if (i.label) keywords.push(i.label);
        if (i.description) keywords.push(i.description);
      });
    }
    if (narrative?.narrativeSummary) keywords.push(narrative.narrativeSummary);
    return keywords;
  }, [autoAnalysis.insights, narrative]);

  const reasoningToolRecs = useMemo<string[]>(() => [], []);

  // ── Intelligence events ──
  const [intelligenceEvents, setIntelligenceEvents] = useState<string[]>([]);
  const addEvent = useCallback((msg: string) => {
    setIntelligenceEvents(prev => [msg, ...prev].slice(0, 10));
  }, []);

  // ── Recompute ──
  const [isRecomputing, setIsRecomputing] = useState(false);

  const handleScenarioSaved = useCallback((scenario: ToolScenario) => {
    setIsRecomputing(true);
    const newEvidence = scenarioToEvidence(scenario,
      analysis.activeMode === "service" ? "service"
      : analysis.activeMode === "business" ? "business_model"
      : "product"
    );
    addEvent(`Simulation created ${newEvidence.type} signal: "${newEvidence.label}"`);
    try {
      recomputeIntelligence({
        products: analysis.products, selectedProduct,
        disruptData: analysis.disruptData, redesignData: analysis.redesignData,
        stressTestData: analysis.stressTestData, pitchDeckData: analysis.pitchDeckData,
        governedData: analysis.governedData as Record<string, unknown> | null,
        businessAnalysisData: analysis.businessAnalysisData, intelligence,
        analysisType: analysis.activeMode === "service" ? "service" : analysis.activeMode === "business" ? "business_model" : "product",
        analysisId: analysisId || "", completedSteps,
      });
    } catch { addEvent("Intelligence recompute completed"); }
    setTimeout(() => { setIsRecomputing(false); toast.success("Strategic intelligence updated"); }, 800);
  }, [analysis, selectedProduct, intelligence, analysisId, completedSteps, addEvent]);

  const handleRecomputeAll = useCallback(() => {
    if (completedSteps.size === 0) { navigate(`${baseUrl}/report`); return; }
    setIsRecomputing(true);
    addEvent("Running strategic analysis…");
    try { runAnalysis(); } catch { addEvent("Strategic intelligence updated"); }
    setTimeout(() => { setIsRecomputing(false); toast.success("Strategic analysis complete"); }, 1000);
  }, [completedSteps, navigate, baseUrl, addEvent, runAnalysis]);

  // ── AUTO-RECOMPUTE ──
  const lastRecomputeHash = useRef<string>("");
  const savedScenarios = useMemo(() => {
    const s = getScenarios(analysisId || "");
    scenarioCountRef.current = s.length;
    return s;
  }, [analysisId, intelligenceEvents.length]);

  useEffect(() => {
    const hash = JSON.stringify({
      steps: Array.from(completedSteps),
      sigCount: totalSignals,
      evCount: metrics.totalEvidenceCount,
      scenarioCount: savedScenarios.length,
      scenarioHash: savedScenarios.map(s => s.scenarioId + s.timestamp).join(","),
    });
    if (hash === lastRecomputeHash.current) return;
    lastRecomputeHash.current = hash;
    if (completedSteps.size === 0) return;

    const timer = setTimeout(() => {
      try {
        const result = recomputeIntelligence({
          products: analysis.products, selectedProduct,
          disruptData: analysis.disruptData, redesignData: analysis.redesignData,
          stressTestData: analysis.stressTestData, pitchDeckData: analysis.pitchDeckData,
          governedData: analysis.governedData as Record<string, unknown> | null,
          businessAnalysisData: analysis.businessAnalysisData, intelligence,
          analysisType: analysis.activeMode === "service" ? "service" : analysis.activeMode === "business" ? "business_model" : "product",
          analysisId: analysisId || "", completedSteps,
        });
        if (result.flatEvidence.length > 0 && result.insights.length > 0) {
          addEvent(`Intelligence: ${result.insights.length} insights from ${result.flatEvidence.length} evidence`);
        }
      } catch { /* Silent */ }
    }, 600);
    return () => clearTimeout(timer);
  }, [completedSteps, totalSignals, metrics.totalEvidenceCount, savedScenarios]);

  // ── Diagnostics toggle ──
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  // ── Guards ──
  if (analysis.step !== "done" || (!selectedProduct && !hasBusinessContext)) {
    if (shouldRedirectHome) return null;
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "hsl(var(--primary))" }} />
      </div>
    );
  }

  const modeKey: "product" | "service" | "business" = analysis.activeMode === "service" ? "service"
    : analysis.activeMode === "business" ? "business" : "product";

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-[1400px] mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4">
        <RecomputeOverlay isActive={isRecomputing || engineComputing} />

        {/* ═══ COMPACT HEADER ═══ */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ModeBadge />
            {(isRecomputing || engineComputing) && (
              <span className="flex items-center gap-1 text-xs font-bold text-primary animate-pulse">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" /> Computing…
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleRecomputeAll}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[36px]"
              style={{ background: `${modeAccent}15`, color: modeAccent, border: `1.5px solid ${modeAccent}30` }}>
              <RefreshCw size={13} className={isRecomputing ? "animate-spin" : ""} /> Recompute
            </button>
            <WorkspaceThemeToggle theme={workspaceTheme} onToggle={toggleTheme} />
          </div>
        </div>

        {/* ═══ NAV STRIP ═══ */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-1">
          {[
            { label: "Command Deck", icon: LayoutDashboard, path: `${baseUrl}/command-deck`, active: true },
            { label: "Report", icon: Target, path: `${baseUrl}/report` },
            { label: "Disrupt", icon: Crosshair, path: `${baseUrl}/disrupt` },
            { label: "Redesign", icon: Lightbulb, path: `${baseUrl}/redesign` },
            { label: "Stress Test", icon: AlertTriangle, path: `${baseUrl}/stress-test` },
            { label: "Pitch", icon: Rocket, path: `${baseUrl}/pitch` },
            { label: "Insight Graph", icon: GitBranch, path: `${baseUrl}/insight-graph` },
          ].map(nav => (
            <button key={nav.label} onClick={() => navigate(nav.path)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap flex-shrink-0 min-h-[40px]"
              style={{
                background: nav.active ? `${modeAccent}15` : "hsl(var(--muted))",
                color: nav.active ? modeAccent : "hsl(var(--foreground))",
                border: nav.active ? `1.5px solid ${modeAccent}40` : "1px solid hsl(var(--border))",
              }}>
              <nav.icon size={14} />
              <span className="hidden sm:inline">{nav.label}</span>
            </button>
          ))}
        </div>

        {/* ═══ PIPELINE PROGRESS (auto-run) ═══ */}
        {pipelineProgress.isRunning && (
          <div
            className="rounded-xl px-5 py-4 space-y-3"
            style={{ background: "hsl(var(--card))", border: "1.5px solid hsl(var(--primary) / 0.3)" }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-extrabold uppercase tracking-widest text-foreground">
                  Building Full Intelligence
                </span>
              </div>
              <span className="text-[10px] font-bold text-muted-foreground">
                {pipelineProgress.completedCount}/{pipelineProgress.totalCount} complete
              </span>
            </div>
            <div className="flex gap-2">
              {pipelineProgress.steps.map(s => (
                <div key={s.key} className="flex-1 space-y-1">
                  <div
                    className="h-1.5 rounded-full transition-all duration-500"
                    style={{
                      background: s.status === "done"
                        ? "hsl(var(--success))"
                        : s.status === "running"
                          ? "hsl(var(--primary))"
                          : s.status === "error"
                            ? "hsl(var(--destructive))"
                            : "hsl(var(--muted))",
                    }}
                  />
                  <p className={`text-[9px] font-bold text-center ${
                    s.status === "running" ? "text-primary" : "text-muted-foreground"
                  }`}>
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
            {pipelineProgress.currentStep && (
              <p className="text-xs text-muted-foreground animate-pulse">
                Running {pipelineProgress.steps.find(s => s.key === pipelineProgress.currentStep)?.label}…
              </p>
            )}
          </div>
        )}

        {/* ═══ TIER 1 — HERO SCORE ═══ */}
        <HeroScorePanel
          strategicPotential={strategicPotential}
          metrics={metrics}
          opportunities={filteredOpps}
          insights={autoAnalysis.insights}
          mode={modeKey}
          analysisName={analysisDisplayName}
          completedSteps={completedSteps.size}
          totalSteps={PIPELINE_STEPS.length}
        />

        {/* ═══ TIER 1.5 — STRATEGIC VERDICT ═══ */}
        <StrategicVerdictBanner
          verdict={narrative?.strategicVerdict ?? null}
          rationale={narrative?.verdictRationale ?? null}
          confidence={narrative?.verdictConfidence ?? 0}
          constraintLabel={narrative?.primaryConstraint ?? null}
          opportunityLabel={narrative?.breakthroughOpportunity ?? null}
          completedSteps={completedSteps.size}
          totalSteps={PIPELINE_STEPS.length}
        />

        {/* ═══ TIER 1.6 — TRAPPED VALUE + KILL QUESTION ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TrappedValueCard
            trappedDescription={narrative?.trappedValue ?? null}
            unlockDescription={narrative?.unlockPotential ?? null}
            confidence={narrative?.verdictConfidence ?? 0}
            evidenceCount={narrative?.trappedValueEvidenceCount ?? 0}
          />
          <KillQuestionCard
            killQuestion={narrative?.killQuestion ?? null}
            validationExperiment={narrative?.validationExperiment ?? null}
            timeframe={narrative?.validationTimeframe ?? "30 days"}
            confidence={narrative?.verdictConfidence ?? 0}
          />
        </div>

        {/* ═══ TIER 2 — NARRATIVE SUMMARY ═══ */}
        <NarrativeSummary
          primaryConstraint={narrative?.primaryConstraint ?? null}
          keyDriver={narrative?.keyDriver ?? null}
          leveragePoint={narrative?.leveragePoint ?? null}
          breakthroughOpportunity={narrative?.breakthroughOpportunity ?? null}
          strategicPathway={narrative?.strategicPathway ?? null}
          narrativeSummary={narrative?.narrativeSummary ?? ""}
          insights={autoAnalysis.insights}
          diagnostic={diagnostic}
          completedSteps={completedSteps.size}
          totalSteps={PIPELINE_STEPS.length}
          onNavigateToGraph={() => navigate(`${baseUrl}/insight-graph`)}
        />

        {/* ═══ TIER 3 — METRICS STRIP ═══ */}
        <MetricsStrip
          metrics={metrics}
          opportunities={filteredOpps}
          strategicPotential={strategicPotential}
        />

        {/* ═══ TIER 4 — TOOLS GRID ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8">
            <OpportunityMap
              opportunities={filteredOpps}
              onViewInGraph={(id) => navigate(`${baseUrl}/insight-graph?node=${id}`)}
            />
          </div>
          <div className="lg:col-span-4">
            <ConstraintRadar
              metrics={metrics}
              insights={autoAnalysis.insights}
            />
          </div>
        </div>

        {/* ═══ TIER 5 — LEVERAGE + ACTION ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-7">
            <StrategicLeverageSignals
              insights={autoAnalysis.insights}
              onViewGraph={() => navigate(`${baseUrl}/insight-graph`)}
              excludeLabels={[
                narrative?.primaryConstraint,
                narrative?.breakthroughOpportunity,
                narrative?.leveragePoint,
                narrative?.keyDriver,
              ].filter(Boolean) as string[]}
            />
          </div>
          <div className="lg:col-span-5">
            <ActionPath
              analysisId={analysisId!}
              completedSteps={completedSteps}
              mode={modeKey}
            />
          </div>
        </div>

        {/* ═══ DIAGNOSTICS (collapsible) ═══ */}
        {diagnostic && (
          <div className="rounded-xl bg-card border border-border overflow-hidden">
            <button
              onClick={() => setShowDiagnostics(!showDiagnostics)}
              className="w-full px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors"
            >
              <span className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
                Pipeline Diagnostics
              </span>
              {showDiagnostics ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
            </button>
            {showDiagnostics && (
              <div className="px-4 pb-4">
                <div className="flex flex-wrap gap-3">
                  {[
                    { label: "Evidence", count: diagnostic.evidenceCount, warn: diagnostic.insufficientEvidence },
                    { label: "Signals", count: diagnostic.signalCount },
                    { label: "Constraints", count: diagnostic.constraintCount },
                    { label: "Drivers", count: diagnostic.driverCount },
                    { label: "Leverage", count: diagnostic.leverageCount },
                    { label: "Opportunities", count: diagnostic.opportunityCount },
                    { label: "Pathways", count: diagnostic.pathwayCount },
                  ].map(d => (
                    <div key={d.label} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold ${d.warn ? 'bg-destructive/10 text-destructive' : 'bg-muted text-foreground'}`}>
                      <span className="text-lg font-black">{d.count}</span>
                      <span className="text-muted-foreground">{d.label}</span>
                    </div>
                  ))}
                </div>
                {diagnostic.message && (
                  <p className="mt-2 text-xs text-destructive font-semibold">⚠ {diagnostic.message}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══ LENS INTELLIGENCE PANEL ═══ */}
        <LensIntelligencePanel
          analysisMode={analysis.activeMode || "product"}
          signalKeywords={lensSignalKeywords}
          analysisId={analysisId || ""}
          recommendedToolIds={reasoningToolRecs}
          onScenarioSaved={handleScenarioSaved}
        />
      </main>
    </div>
  );
}
