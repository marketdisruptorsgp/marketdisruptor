/**
 * Command Deck — Strategic Advisor Interface
 *
 * Clean 3-section layout:
 *   1. Diagnosis — What we found (constraint + why it matters)
 *   2. Opportunities — Strategic directions (3–5 expandable cards)
 *   3. Recommended Move — What to pursue first + second-order effects
 *
 * All developer diagnostics, node counts, and pipeline internals
 * are removed from this view. Advanced tools live in Deep Dive.
 */

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { StepLoadingTracker, type StepTask } from "@/components/StepLoadingTracker";
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
import { StrategicDiagnosisBanner } from "@/components/command-deck/StrategicDiagnosisBanner";
import { OpportunityDirectionsGrid } from "@/components/command-deck/OpportunityDirectionsGrid";
import { RecommendedMoveCard } from "@/components/command-deck/RecommendedMoveCard";
import { WhyThisMattersSection } from "@/components/command-deck/WhyThisMattersSection";
import { SecondOrderEffectsSection } from "@/components/command-deck/SecondOrderEffectsSection";
import { SoWhatHeader } from "@/components/command-deck/SoWhatHeader";
import { WhatsNextPanel } from "@/components/command-deck/WhatsNextPanel";
import { PowerToolsPanel } from "@/components/command-deck/PowerToolsPanel";
import { StrategicXRay } from "@/components/command-deck/StrategicXRay";
import { StrategicOutcomeSimulator } from "@/components/command-deck/StrategicOutcomeSimulator";
import { StrategicScenarioSimulator } from "@/components/command-deck/StrategicScenarioSimulator";
import { CurrentStateIntelligence } from "@/components/command-deck/CurrentStateIntelligence";
import { ProblemStatementCard } from "@/components/command-deck/ProblemStatementCard";
import { IndustrySystemMapView } from "@/components/industry-map/IndustrySystemMapView";
import { ScenarioLab } from "@/components/command-deck/ScenarioLab";
import { ScenarioBanner, type ActiveChallenge } from "@/components/command-deck/ScenarioBanner";
import { DeltaChanges, type DeltaItem } from "@/components/command-deck/DeltaChanges";
import { LensIntelligencePanel } from "@/components/LensIntelligencePanel";
import { detectStructuralPattern } from "@/lib/strategicPatternEngine";
import { FinancialTrendCharts } from "@/components/command-deck/FinancialTrendCharts";
import { IndustryBenchmarkPanel } from "@/components/command-deck/IndustryBenchmarkPanel";
import { computeBenchmarks } from "@/lib/benchmarkEngine";
import { DueDiligenceQuestions } from "@/components/command-deck/DueDiligenceQuestions";
import { DealScorecard } from "@/components/command-deck/DealScorecard";
import { LOIBuilder } from "@/components/command-deck/LOIBuilder";
import { PostClosePlaybook } from "@/components/command-deck/PostClosePlaybook";
import { CIMComparisonMode } from "@/components/command-deck/CIMComparisonMode";
import { DocumentIntelligenceBanner } from "@/components/command-deck/DocumentIntelligenceBanner";
import { PipelineDataHealth } from "@/components/command-deck/PipelineDataHealth";
import { CIMKeyFindings } from "@/components/command-deck/CIMKeyFindings";
import { ContrarianInsightCard } from "@/components/command-deck/ContrarianInsightCard";
import { DealMetricsStrip } from "@/components/command-deck/DealMetricsStrip";

import {
  saveScenarioSnapshot, getSavedScenarios, deleteScenarioSnapshot,
  type ScenarioSnapshot,
} from "@/lib/scenarioLabEngine";
import { generatePlaybooks } from "@/lib/playbookEngine";
import {
  Play, RefreshCw, FileDown,
} from "lucide-react";
import { toast } from "sonner";
import {
  computeCommandDeckMetrics, aggregateOpportunities,
  type CommandDeckMetrics as DeckMetrics,
} from "@/lib/commandDeckMetrics";
import { extractAllEvidence } from "@/lib/evidenceEngine";
import { getScenarios, scenarioToEvidence, type ToolScenario } from "@/lib/scenarioEngine";
import { recomputeIntelligence, recomputeIntelligenceAsync } from "@/lib/recomputeIntelligence";
import { humanizeLabel } from "@/lib/humanize";
import { downloadReportAsPDF } from "@/lib/downloadReportPDF";
import { gatherAllAnalysisData } from "@/lib/gatherAnalysisData";

const PIPELINE_STEPS = [
  { key: "report", label: "Report", route: "report" },
  { key: "disrupt", label: "Disrupt", route: "disrupt" },
  { key: "redesign", label: "Redesign", route: "redesign" },
  { key: "stress-test", label: "Stress Test", route: "stress-test" },
  { key: "pitch", label: "Pitch", route: "pitch" },
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
    geoMarketData: analysis.geoData,
    regulatoryData: analysis.regulatoryData,
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

  // ── Strategic Potential Score ──
  const scenarioCountRef = useRef(0);
  const strategicPotential = useMemo(() => {
    const simBoost = Math.min(scenarioCountRef.current * 0.15, 0.8);
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

  // ── Intelligence events ──
  const [intelligenceEvents, setIntelligenceEvents] = useState<string[]>([]);
  const addEvent = useCallback((msg: string) => {
    setIntelligenceEvents(prev => [msg, ...prev].slice(0, 10));
  }, []);

  // ── Recompute ──
  const [isRecomputing, setIsRecomputing] = useState(false);

  // ── Scenario state (Challenge Mode) ──
  const [activeChallenges, setActiveChallenges] = useState<ActiveChallenge[]>([]);
  const [baselineNarrative, setBaselineNarrative] = useState<typeof narrative>(null);

  const deltaChanges = useMemo<DeltaItem[]>(() => {
    if (activeChallenges.length === 0 || !baselineNarrative || !narrative) return [];
    const deltas: DeltaItem[] = [];
    if (baselineNarrative.primaryConstraint !== narrative.primaryConstraint && narrative.primaryConstraint) {
      deltas.push({ label: "Constraint", before: baselineNarrative.primaryConstraint || "None", after: narrative.primaryConstraint, direction: "changed" });
    }
    if (baselineNarrative.strategicVerdict !== narrative.strategicVerdict && narrative.strategicVerdict) {
      deltas.push({ label: "Verdict", before: baselineNarrative.strategicVerdict || "None", after: narrative.strategicVerdict, direction: "changed" });
    }
    if (baselineNarrative.breakthroughOpportunity !== narrative.breakthroughOpportunity && narrative.breakthroughOpportunity) {
      deltas.push({ label: "Opportunity", before: baselineNarrative.breakthroughOpportunity || "None", after: narrative.breakthroughOpportunity, direction: "up" });
    }
    return deltas;
  }, [activeChallenges, baselineNarrative, narrative]);

  const handleScenarioSaved = useCallback((scenario: ToolScenario) => {
    setIsRecomputing(true);
    const newEvidence = scenarioToEvidence(scenario,
      analysis.activeMode === "service" ? "service" : analysis.activeMode === "business" ? "business_model" : "product"
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
        geoMarketData: analysis.geoData, regulatoryData: analysis.regulatoryData,
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

  const handleChallenge = useCallback((nodeStage: string, newValue: string) => {
    if (activeChallenges.length === 0 && narrative) setBaselineNarrative(narrative);
    const newChallenge: ActiveChallenge = { stage: nodeStage, value: newValue, timestamp: Date.now() };
    setActiveChallenges(prev => [...prev, newChallenge]);
    setIsRecomputing(true);
    addEvent(`Challenge: overriding ${nodeStage} → "${newValue.slice(0, 60)}…"`);
    const currentGoverned = (analysis.governedData as Record<string, unknown>) || {};
    const challenges = ((currentGoverned.challenges as any[]) || []);
    challenges.push({ stage: nodeStage, value: newValue, timestamp: Date.now() });
    const updatedGoverned = { ...currentGoverned, challenges };
    try {
      recomputeIntelligence({
        products: analysis.products, selectedProduct,
        disruptData: analysis.disruptData, redesignData: analysis.redesignData,
        stressTestData: analysis.stressTestData, pitchDeckData: analysis.pitchDeckData,
        governedData: updatedGoverned,
        businessAnalysisData: analysis.businessAnalysisData, intelligence,
        analysisType: analysis.activeMode === "service" ? "service" : analysis.activeMode === "business" ? "business_model" : "product",
        analysisId: analysisId || "", completedSteps,
        geoMarketData: analysis.geoData, regulatoryData: analysis.regulatoryData,
      });
    } catch { /* silent */ }
    try { runAnalysis(); } catch { /* silent */ }
    setTimeout(() => { setIsRecomputing(false); toast.success(`Strategic scenario updated`); }, 1000);
  }, [analysis, selectedProduct, intelligence, analysisId, completedSteps, addEvent, runAnalysis, activeChallenges, narrative]);

  const handleResetScenario = useCallback(() => {
    setActiveChallenges([]);
    setBaselineNarrative(null);
    const currentGoverned = (analysis.governedData as Record<string, unknown>) || {};
    const { challenges: _, ...cleanGoverned } = currentGoverned;
    setIsRecomputing(true);
    try {
      recomputeIntelligence({
        products: analysis.products, selectedProduct,
        disruptData: analysis.disruptData, redesignData: analysis.redesignData,
        stressTestData: analysis.stressTestData, pitchDeckData: analysis.pitchDeckData,
        governedData: cleanGoverned,
        businessAnalysisData: analysis.businessAnalysisData, intelligence,
        analysisType: analysis.activeMode === "service" ? "service" : analysis.activeMode === "business" ? "business_model" : "product",
        analysisId: analysisId || "", completedSteps,
        geoMarketData: analysis.geoData, regulatoryData: analysis.regulatoryData,
      });
    } catch { /* silent */ }
    try { runAnalysis(); } catch { /* silent */ }
    setTimeout(() => { setIsRecomputing(false); toast.success("Reset to baseline"); }, 800);
  }, [analysis, selectedProduct, intelligence, analysisId, completedSteps, runAnalysis]);

  // ── Save Scenario ──
  const [savedLabScenarios, setSavedLabScenarios] = useState<ScenarioSnapshot[]>(() =>
    getSavedScenarios(analysisId || "")
  );
  const [activeLabScenarioId, setActiveLabScenarioId] = useState<string | null>(null);

  const handleSaveScenario = useCallback(() => {
    if (activeChallenges.length === 0) return;
    const modeEvidence: import("@/lib/evidenceEngine").EvidenceMode =
      analysis.activeMode === "service" ? "service" : analysis.activeMode === "business" ? "business_model" : "product";
    const playbooks = generatePlaybooks(autoAnalysis.flatEvidence, autoAnalysis.insights, narrative, modeEvidence);
    const snapshot: ScenarioSnapshot = {
      id: `scenario-${Date.now()}`,
      name: activeChallenges.map(c => `${c.stage}: ${c.value.slice(0, 40)}`).join(" + "),
      challenges: [...activeChallenges],
      verdict: narrative?.strategicVerdict ?? null,
      verdictConfidence: narrative?.verdictConfidence ?? 0,
      primaryConstraint: narrative?.primaryConstraint ?? null,
      breakthroughOpportunity: narrative?.breakthroughOpportunity ?? null,
      trappedValue: narrative?.trappedValue ?? null,
      trappedValueEstimate: narrative?.trappedValueEstimate ?? null,
      topPlaybookTitle: playbooks[0]?.title ?? null,
      leverageScore: playbooks[0]?.impact.leverageScore ?? 0,
      strategicPotential,
      timestamp: Date.now(),
    };
    saveScenarioSnapshot(analysisId || "", snapshot);
    setSavedLabScenarios(getSavedScenarios(analysisId || ""));
    setActiveLabScenarioId(snapshot.id);
    toast.success("Scenario saved");
  }, [activeChallenges, analysis, autoAnalysis, narrative, strategicPotential, analysisId]);

  const handleDeleteLabScenario = useCallback((id: string) => {
    deleteScenarioSnapshot(analysisId || "", id);
    setSavedLabScenarios(getSavedScenarios(analysisId || ""));
    if (activeLabScenarioId === id) setActiveLabScenarioId(null);
  }, [analysisId, activeLabScenarioId]);

  const handleLoadLabScenario = useCallback((scenario: ScenarioSnapshot) => {
    setActiveChallenges(scenario.challenges);
    setActiveLabScenarioId(scenario.id);
    const governed = (analysis.governedData as Record<string, unknown>) || {};
    const updatedGoverned = { ...governed, challenges: scenario.challenges };
    setIsRecomputing(true);
    try {
      recomputeIntelligence({
        products: analysis.products, selectedProduct,
        disruptData: analysis.disruptData, redesignData: analysis.redesignData,
        stressTestData: analysis.stressTestData, pitchDeckData: analysis.pitchDeckData,
        governedData: updatedGoverned,
        businessAnalysisData: analysis.businessAnalysisData, intelligence,
        analysisType: analysis.activeMode === "service" ? "service" : analysis.activeMode === "business" ? "business_model" : "product",
        analysisId: analysisId || "", completedSteps,
        geoMarketData: analysis.geoData, regulatoryData: analysis.regulatoryData,
      });
    } catch { /* silent */ }
    try { runAnalysis(); } catch { /* silent */ }
    setTimeout(() => { setIsRecomputing(false); toast.success(`Loaded scenario`); }, 800);
  }, [analysis, selectedProduct, intelligence, analysisId, completedSteps, runAnalysis]);

  // ── Derived data ──
  const detectedPatterns = useMemo(() =>
    detectStructuralPattern(autoAnalysis.flatEvidence, autoAnalysis.insights, narrative),
    [autoAnalysis.flatEvidence, autoAnalysis.insights, narrative],
  );

  const topPlaybook = useMemo(() => {
    const modeEvidence: import("@/lib/evidenceEngine").EvidenceMode =
      analysis.activeMode === "service" ? "service" : analysis.activeMode === "business" ? "business_model" : "product";
    const pbs = generatePlaybooks(autoAnalysis.flatEvidence, autoAnalysis.insights, narrative, modeEvidence);
    return pbs.length > 0 ? pbs[0] : null;
  }, [autoAnalysis.flatEvidence, autoAnalysis.insights, narrative, analysis.activeMode]);

  const benchmark = useMemo(() =>
    computeBenchmarks(autoAnalysis.flatEvidence, narrative, topPlaybook),
    [autoAnalysis.flatEvidence, narrative, topPlaybook],
  );

  const lastRecomputeHash = useRef<string>("");
  const savedScenarios = useMemo(() => {
    const s = getScenarios(analysisId || "");
    scenarioCountRef.current = s.length;
    return s;
  }, [analysisId, intelligenceEvents.length]);

  const asyncRecomputeRunning = useRef(false);
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
    if (asyncRecomputeRunning.current) return;

    const timer = setTimeout(async () => {
      if (asyncRecomputeRunning.current) return;
      asyncRecomputeRunning.current = true;
      try {
        const input = {
          products: analysis.products, selectedProduct,
          disruptData: analysis.disruptData, redesignData: analysis.redesignData,
          stressTestData: analysis.stressTestData, pitchDeckData: analysis.pitchDeckData,
          governedData: analysis.governedData as Record<string, unknown> | null,
          businessAnalysisData: analysis.businessAnalysisData, intelligence,
          analysisType: (analysis.activeMode === "service" ? "service" : analysis.activeMode === "business" ? "business_model" : "product") as "product" | "service" | "business_model",
          analysisId: analysisId || "", completedSteps,
          geoMarketData: analysis.geoData, regulatoryData: analysis.regulatoryData,
        };
        await recomputeIntelligenceAsync(input);
      } catch { /* Silent */ } finally {
        asyncRecomputeRunning.current = false;
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [completedSteps, totalSignals, metrics.totalEvidenceCount, savedScenarios]);

  const modeKey: "product" | "service" | "business" = analysis.activeMode === "service" ? "service"
    : analysis.activeMode === "business" ? "business" : "product";

  const industryLabel = useMemo(() => {
    if (businessModelInput?.type) return businessModelInput.type;
    if (selectedProduct?.category) return selectedProduct.category;
    return modeKey === "service" ? "Service Industry" : modeKey === "business" ? "Business Model" : "Product Market";
  }, [businessModelInput, selectedProduct, modeKey]);

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
            <StepLoadingTracker title={`Building ${ml} Intelligence`} tasks={activeTasks} estimatedSeconds={90} />
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

  // ── Primary thesis & all opportunities ──
  const primaryThesis = autoAnalysis.deepenedOpportunities[0] ?? null;
  const allOpportunities = autoAnalysis.deepenedOpportunities;
  const alternativeOpportunities = allOpportunities.slice(1);

  // ── Centralized biExtraction access ──
  const biExtraction = (analysis as any)?.biExtraction ?? analysis.adaptiveContext?.biExtraction ?? null;
  const governedDataTyped = analysis.governedData as Record<string, any> | null;

  return (
    <div className="flex-1 bg-background overflow-y-auto">
      <main className="max-w-[900px] mx-auto px-3 sm:px-6 py-3 sm:py-5 space-y-5">

        {/* ══════════════════════════════════════════════════════════
            HEADER — Clean, minimal
           ══════════════════════════════════════════════════════════ */}
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
          biExtraction={(analysis as any)?.biExtraction ?? analysis.adaptiveContext?.biExtraction ?? null}
          governedData={analysis.governedData as Record<string, any> | null}
        />

        {/* ═══ PIPELINE PROGRESS (auto-run) ═══ */}
        {(pipelineProgress.isRunning || pipelineProgress.steps.some(s => s.status === "error")) && (
          <div
            className="rounded-xl px-5 py-4 space-y-3"
            style={{ background: "hsl(var(--card))", border: `1.5px solid ${pipelineProgress.steps.some(s => s.status === "error") ? "hsl(var(--destructive) / 0.3)" : "hsl(var(--primary) / 0.3)"}` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {pipelineProgress.isRunning && <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                <span className="text-xs font-extrabold uppercase tracking-widest text-foreground">
                  {pipelineProgress.isRunning ? "Building Full Intelligence" : "Pipeline Status"}
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
                      background: s.status === "done" ? "hsl(var(--success))"
                        : s.status === "running" ? "hsl(var(--primary))"
                        : s.status === "error" ? "hsl(var(--destructive))"
                        : "hsl(var(--muted))",
                    }}
                  />
                  <div className="flex items-center justify-center gap-1">
                    <p className={`text-[9px] font-bold text-center ${
                      s.status === "running" ? "text-primary"
                        : s.status === "error" ? "text-destructive"
                        : "text-muted-foreground"
                    }`}>
                      {s.label}
                    </p>
                    {s.status === "error" && (
                      <button
                        onClick={() => pipelineProgress.retryStep(s.key)}
                        className="text-[8px] font-bold text-destructive hover:underline"
                        title={s.error || "Retry this step"}
                      >
                        ↻
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {pipelineProgress.steps.some(s => s.status === "error") && !pipelineProgress.isRunning && (
              <p className="text-[10px] text-muted-foreground">
                Some steps encountered errors. Click ↻ to retry, or continue — partial results are still usable.
              </p>
            )}
          </div>
        )}

        {/* ═══ DOCUMENT INTELLIGENCE HEALTH ═══ */}
        <DocumentIntelligenceBanner
          biExtraction={(analysis as any)?.biExtraction ?? analysis.adaptiveContext?.biExtraction ?? null}
          governedData={analysis.governedData as Record<string, any> | null}
          adaptiveContextLoaded={!!analysis.adaptiveContext}
        />

        {/* ═══ PIPELINE DATA HEALTH ═══ */}
        <PipelineDataHealth
          product={selectedProduct as Record<string, any> | null}
          decompositionData={analysis.decompositionData}
          disruptData={analysis.disruptData}
          redesignData={analysis.redesignData}
          stressTestData={analysis.stressTestData}
          pitchDeckData={analysis.pitchDeckData}
          biExtraction={(analysis as any)?.biExtraction ?? analysis.adaptiveContext?.biExtraction ?? null}
          governedData={analysis.governedData as Record<string, any> | null}
          businessAnalysisData={analysis.businessAnalysisData as Record<string, any> | null}
        />

        {/* ═══ SCENARIO BANNER (only when active) ═══ */}
        <ScenarioBanner challenges={activeChallenges} onReset={handleResetScenario} onSave={handleSaveScenario} />
        <DeltaChanges deltas={deltaChanges} />

        {/* ══════════════════════════════════════════════════════════
            SECTION 1 — DIAGNOSIS
            What we found: the core constraint and why it matters
           ══════════════════════════════════════════════════════════ */}
        <SoWhatHeader
          narrative={narrative}
          thesis={primaryThesis}
          modeAccent={modeAccent}
        />

        <StrategicDiagnosisBanner
          constraintLabel={narrative?.primaryConstraint ?? null}
          rationale={narrative?.narrativeSummary ?? null}
          verdict={narrative?.strategicVerdict ?? null}
          opportunityLabel={narrative?.breakthroughOpportunity ?? null}
          verdictRationale={narrative?.verdictRationale ?? null}
          whyThisMatters={narrative?.whyThisMatters ?? null}
          confidence={narrative?.verdictConfidence ?? 0}
          completedSteps={completedSteps.size}
        />

        {/* Contrarian Insight — The "aha moment" */}
        <ContrarianInsightCard
          thesis={primaryThesis}
          modeAccent={modeAccent}
        />

        {/* Why This Matters — attached to diagnosis */}
        {primaryThesis?.whyThisMatters && (
          <div
            className="rounded-xl px-5 py-4"
            style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
          >
            <WhyThisMattersSection data={primaryThesis.whyThisMatters} />
          </div>
        )}

        {/* CIM Key Findings — extracted constraints with evidence */}
        <CIMKeyFindings
          biExtraction={(analysis as any)?.biExtraction ?? analysis.adaptiveContext?.biExtraction ?? null}
          modeAccent={modeAccent}
        />

        {/* ══════════════════════════════════════════════════════════
            SECTION 2 — OPPORTUNITIES
            3–5 distinct strategic directions
           ══════════════════════════════════════════════════════════ */}
        <OpportunityDirectionsGrid
          opportunities={allOpportunities}
          modeAccent={modeAccent}
        />

        {/* ══════════════════════════════════════════════════════════
            SECTION 3 — RECOMMENDED MOVE
            What to pursue first + second-order effects
           ══════════════════════════════════════════════════════════ */}
        <RecommendedMoveCard
          playbook={topPlaybook}
          modeAccent={modeAccent}
        />

        {/* Second-Order Effects — attached to recommended move */}
        {primaryThesis?.secondOrderEffects && primaryThesis.secondOrderEffects.length > 0 && (
          <div
            className="rounded-xl px-5 py-4"
            style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
          >
            <SecondOrderEffectsSection effects={primaryThesis.secondOrderEffects} />
          </div>
        )}

        {/* What's Next — kill question + first move */}
        <WhatsNextPanel
          narrative={narrative}
          thesis={primaryThesis}
          modeAccent={modeAccent}
          onChallenge={handleChallenge}
        />

        {/* ══════════════════════════════════════════════════════════
            FINANCIAL TRAJECTORY — Trend charts from multi-year P&L
           ══════════════════════════════════════════════════════════ */}
        <FinancialTrendCharts
          biExtraction={(analysis as any)?.biExtraction ?? (analysis as any)?.adaptiveContext?.biExtraction ?? null}
          governedData={analysis.governedData as Record<string, any> | null}
        />

        {/* ══════════════════════════════════════════════════════════
            INDUSTRY BENCHMARK — Archetype-based comparison
           ══════════════════════════════════════════════════════════ */}
        <IndustryBenchmarkPanel benchmark={benchmark} />

        {/* ══════════════════════════════════════════════════════════
            DEAL SCORECARD — Go/No-Go verdict with deal structure
           ══════════════════════════════════════════════════════════ */}
        <DealScorecard
          biExtraction={(analysis as any)?.biExtraction ?? (analysis as any)?.adaptiveContext?.biExtraction ?? null}
          governedData={analysis.governedData as Record<string, any> | null}
        />

        {/* ══════════════════════════════════════════════════════════
            LOI / OFFER BUILDER — Draft letter of intent
           ══════════════════════════════════════════════════════════ */}
        <LOIBuilder
          biExtraction={(analysis as any)?.biExtraction ?? (analysis as any)?.adaptiveContext?.biExtraction ?? null}
          governedData={analysis.governedData as Record<string, any> | null}
        />

        {/* ══════════════════════════════════════════════════════════
            90-DAY PLAYBOOK — Post-close action plan
           ══════════════════════════════════════════════════════════ */}
        <PostClosePlaybook
          biExtraction={(analysis as any)?.biExtraction ?? (analysis as any)?.adaptiveContext?.biExtraction ?? null}
          governedData={analysis.governedData as Record<string, any> | null}
        />

        {/* ══════════════════════════════════════════════════════════
            CIM COMPARISON — Side-by-side deal comparison
           ══════════════════════════════════════════════════════════ */}
        <CIMComparisonMode
          currentAnalysisId={analysisId || ""}
          currentBiExtraction={(analysis as any)?.biExtraction ?? (analysis as any)?.adaptiveContext?.biExtraction ?? null}
          currentGovernedData={analysis.governedData as Record<string, any> | null}
        />

        {/* ══════════════════════════════════════════════════════════
            DUE DILIGENCE — Hard-hitting questions for sellers
           ══════════════════════════════════════════════════════════ */}
        <DueDiligenceQuestions
          biExtraction={(analysis as any)?.biExtraction ?? (analysis as any)?.adaptiveContext?.biExtraction ?? null}
          governedData={analysis.governedData as Record<string, any> | null}
        />

        {/* ══════════════════════════════════════════════════════════
            DEEP DIVE — Collapsed advanced analysis tools
           ══════════════════════════════════════════════════════════ */}
        <PowerToolsPanel toolCount={6}>
          {/* Strategic X-Ray */}
          <StrategicXRay
            narrative={narrative}
            insights={autoAnalysis.insights}
            flatEvidence={autoAnalysis.flatEvidence}
            thesis={primaryThesis}
            onRecompute={handleRecomputeAll}
            onChallenge={handleChallenge}
          />

          {/* Industry Map */}
          {(() => {
            const biz = analysis.businessAnalysisData as Record<string, any> || {};
            const governed = biz?.governed || analysis.governedData || {};
            const sp = autoAnalysis.structuralProfile;
            const product = selectedProduct as any || {};
            return (
              <IndustrySystemMapView
                businessName={analysisDisplayName}
                businessDescription={businessModelInput?.description || product?.description}
                structuralProfile={sp}
                opportunities={autoAnalysis.deepenedOpportunities}
                narrative={narrative}
                firstPrinciples={governed?.first_principles}
                constraintMap={governed?.constraint_map}
                supplyChain={product?.supplyChain}
                mode={modeKey}
                modeAccent={modeAccent}
              />
            );
          })()}

          {/* Problem Statement */}
          {(() => {
            const p = selectedProduct as any || {};
            const biz = analysis.businessAnalysisData as Record<string, any> || {};
            const governed = (biz as any)?.governed || {};
            const trend = p.trendAnalysis || (biz as any)?.trend || null;
            const marketSize = p.marketSizeEstimate || null;
            return (
              <ProblemStatementCard
                product={selectedProduct as Record<string, any> | null}
                businessData={analysis.businessAnalysisData as Record<string, any> | null}
                narrative={narrative}
                governed={governed}
                modeAccent={modeAccent}
                evidenceCount={totalSignals}
                completedSteps={completedSteps.size}
                totalSteps={PIPELINE_STEPS.length}
                marketSize={marketSize}
                trend={trend}
                mode={modeKey}
                onProblemLocked={() => toast.success("Problem statement locked")}
              />
            );
          })()}

          {/* Current State Intelligence */}
          <CurrentStateIntelligence
            product={selectedProduct as any}
            businessData={analysis.businessAnalysisData as Record<string, any> | null}
            narrative={narrative}
            governedData={analysis.governedData as Record<string, any> | null}
            flatEvidence={autoAnalysis.flatEvidence}
            detectedPatterns={detectedPatterns}
          />

          {/* Scenario Simulator */}
          <StrategicScenarioSimulator
            evidence={autoAnalysis.flatEvidence}
            narrative={narrative}
          />

          {/* Scenario Lab */}
          <ScenarioLab
            scenarios={savedLabScenarios}
            activeScenarioId={activeLabScenarioId}
            onLoadScenario={handleLoadLabScenario}
            onDeleteScenario={handleDeleteLabScenario}
          />

          {/* Outcome Simulator */}
          <StrategicOutcomeSimulator
            playbook={topPlaybook}
            evidence={autoAnalysis.flatEvidence}
            narrative={narrative}
          />

          {/* Lens Intelligence */}
          <LensIntelligencePanel
            analysisMode={analysis.activeMode || "product"}
            signalKeywords={lensSignalKeywords}
            analysisId={analysisId || ""}
            recommendedToolIds={[]}
            onScenarioSaved={handleScenarioSaved}
          />
        </PowerToolsPanel>

      </main>
    </div>
  );
}
