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
import { StepLoadingTracker, type StepTask } from "@/components/StepLoadingTracker";
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
import { StrategicXRay } from "@/components/command-deck/StrategicXRay";
import { StrategicOutcomeSimulator } from "@/components/command-deck/StrategicOutcomeSimulator";
import { SoWhatHeader } from "@/components/command-deck/SoWhatHeader";
import { WhatsNextPanel } from "@/components/command-deck/WhatsNextPanel";
import { OneThesisCard } from "@/components/command-deck/OneThesisCard";
import { ScenarioBanner, type ActiveChallenge } from "@/components/command-deck/ScenarioBanner";
import { DeltaChanges, type DeltaItem } from "@/components/command-deck/DeltaChanges";
import { ScenarioLab } from "@/components/command-deck/ScenarioLab";
import { StrategicScenarioSimulator } from "@/components/command-deck/StrategicScenarioSimulator";
import { CurrentStateIntelligence } from "@/components/command-deck/CurrentStateIntelligence";
import { ProblemStatementCard } from "@/components/command-deck/ProblemStatementCard";
import { PowerToolsPanel } from "@/components/command-deck/PowerToolsPanel";
import { detectStructuralPattern } from "@/lib/strategicPatternEngine";
import { computeBenchmarks, computeOpportunityMap, generateStrategicStory, computeConfidenceExplanation } from "@/lib/benchmarkEngine"; // TODO: remove unused
import {
  saveScenarioSnapshot, getSavedScenarios, deleteScenarioSnapshot,
  type ScenarioSnapshot,
} from "@/lib/scenarioLabEngine";
import { generatePlaybooks } from "@/lib/playbookEngine";
import {
  LayoutDashboard, GitBranch, Target, Crosshair, Lightbulb,
  AlertTriangle, Rocket, RefreshCw, ChevronDown, ChevronUp, Play,
  BookOpen, Beaker, BarChart3, Map, Wrench, Brain, FileDown,
} from "lucide-react";
import { toast } from "sonner";
import {
  computeCommandDeckMetrics, aggregateOpportunities,
  type CommandDeckMetrics as DeckMetrics,
} from "@/lib/commandDeckMetrics";
import { extractAllEvidence, type EvidenceTier } from "@/lib/evidenceEngine";
import { getScenarios, scenarioToEvidence, type ToolScenario } from "@/lib/scenarioEngine";
import { recomputeIntelligence, recomputeIntelligenceAsync } from "@/lib/recomputeIntelligence";
import { humanizeLabel } from "@/lib/humanize";
import { downloadReportAsPDF } from "@/lib/downloadReportPDF";
import { gatherAllAnalysisData } from "@/lib/gatherAnalysisData";

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

  // ── Scenario state (Challenge Mode) ──
  const [activeChallenges, setActiveChallenges] = useState<ActiveChallenge[]>([]);
  const [baselineNarrative, setBaselineNarrative] = useState<typeof narrative>(null);

  // Compute delta changes when scenario is active
  const deltaChanges = useMemo<DeltaItem[]>(() => {
    if (activeChallenges.length === 0 || !baselineNarrative || !narrative) return [];
    const deltas: DeltaItem[] = [];

    if (baselineNarrative.primaryConstraint !== narrative.primaryConstraint && narrative.primaryConstraint) {
      deltas.push({
        label: "Constraint",
        before: baselineNarrative.primaryConstraint || "None",
        after: narrative.primaryConstraint,
        direction: "changed",
      });
    }
    if (baselineNarrative.strategicVerdict !== narrative.strategicVerdict && narrative.strategicVerdict) {
      deltas.push({
        label: "Verdict",
        before: baselineNarrative.strategicVerdict || "None",
        after: narrative.strategicVerdict,
        direction: "changed",
      });
    }
    if (baselineNarrative.verdictConfidence !== narrative.verdictConfidence) {
      const prevLevel = (baselineNarrative.verdictConfidence ?? 0) >= 0.7 ? "Strong" : (baselineNarrative.verdictConfidence ?? 0) >= 0.4 ? "Moderate" : "Early";
      const newLevel = (narrative.verdictConfidence ?? 0) >= 0.7 ? "Strong" : (narrative.verdictConfidence ?? 0) >= 0.4 ? "Moderate" : "Early";
      if (prevLevel !== newLevel) {
        deltas.push({
          label: "Evidence Quality",
          before: `${prevLevel} evidence`,
          after: `${newLevel} evidence`,
          direction: (narrative.verdictConfidence ?? 0) > (baselineNarrative.verdictConfidence ?? 0) ? "up" : "down",
        });
      }
    }
    if (baselineNarrative.breakthroughOpportunity !== narrative.breakthroughOpportunity && narrative.breakthroughOpportunity) {
      deltas.push({
        label: "Opportunity",
        before: baselineNarrative.breakthroughOpportunity || "None",
        after: narrative.breakthroughOpportunity,
        direction: "up",
      });
    }
    return deltas;
  }, [activeChallenges, baselineNarrative, narrative]);

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

  // ── Challenge Mode: inject user override as evidence + recompute ──
  const handleChallenge = useCallback((nodeStage: string, newValue: string) => {
    // Snapshot baseline before first challenge
    if (activeChallenges.length === 0 && narrative) {
      setBaselineNarrative(narrative);
    }

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

    setTimeout(() => {
      setIsRecomputing(false);
      toast.success(`Strategic scenario updated with your "${nodeStage}" hypothesis`);
    }, 1000);
  }, [analysis, selectedProduct, intelligence, analysisId, completedSteps, addEvent, runAnalysis, activeChallenges, narrative]);

  // ── Reset to Baseline ──
  const handleResetScenario = useCallback(() => {
    setActiveChallenges([]);
    setBaselineNarrative(null);
    // Clear challenges from governed data
    const currentGoverned = (analysis.governedData as Record<string, unknown>) || {};
    const { challenges: _, ...cleanGoverned } = currentGoverned;
    // Recompute without challenges
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
    setTimeout(() => {
      setIsRecomputing(false);
      toast.success("Reset to baseline — all scenario overrides removed");
    }, 800);
  }, [analysis, selectedProduct, intelligence, analysisId, completedSteps, runAnalysis]);

  // ── Save Scenario (full snapshot) ──
  const [savedLabScenarios, setSavedLabScenarios] = useState<ScenarioSnapshot[]>(() =>
    getSavedScenarios(analysisId || "")
  );
  const [activeLabScenarioId, setActiveLabScenarioId] = useState<string | null>(null);

  const handleSaveScenario = useCallback(() => {
    if (activeChallenges.length === 0) return;

    const modeEvidence: import("@/lib/evidenceEngine").EvidenceMode =
      analysis.activeMode === "service" ? "service"
      : analysis.activeMode === "business" ? "business_model" : "product";

    const playbooks = generatePlaybooks(
      autoAnalysis.flatEvidence, autoAnalysis.insights, narrative, modeEvidence,
    );

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
    addEvent(`Scenario saved: "${snapshot.name}"`);
    toast.success("Scenario saved to Scenario Lab");
  }, [activeChallenges, addEvent, analysis, autoAnalysis, narrative, strategicPotential, analysisId]);

  const handleDeleteLabScenario = useCallback((id: string) => {
    deleteScenarioSnapshot(analysisId || "", id);
    setSavedLabScenarios(getSavedScenarios(analysisId || ""));
    if (activeLabScenarioId === id) setActiveLabScenarioId(null);
  }, [analysisId, activeLabScenarioId]);

  const handleLoadLabScenario = useCallback((scenario: ScenarioSnapshot) => {
    // Reload the challenges from the scenario
    setActiveChallenges(scenario.challenges);
    setActiveLabScenarioId(scenario.id);
    // Re-apply the challenges as governed data
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
    setTimeout(() => {
      setIsRecomputing(false);
      toast.success(`Loaded scenario: "${scenario.name}"`);
    }, 800);
  }, [analysis, selectedProduct, intelligence, analysisId, completedSteps, runAnalysis]);

  // ── Strategic Pattern Detection ──
  const detectedPatterns = useMemo(() =>
    detectStructuralPattern(autoAnalysis.flatEvidence, autoAnalysis.insights, narrative),
    [autoAnalysis.flatEvidence, autoAnalysis.insights, narrative],
  );

  // ── Top playbook for Outcome Simulator ──
  const topPlaybook = useMemo(() => {
    const modeEvidence: import("@/lib/evidenceEngine").EvidenceMode =
      analysis.activeMode === "service" ? "service"
      : analysis.activeMode === "business" ? "business_model" : "product";
    const pbs = generatePlaybooks(autoAnalysis.flatEvidence, autoAnalysis.insights, narrative, modeEvidence);
    return pbs.length > 0 ? pbs[0] : null;
  }, [autoAnalysis.flatEvidence, autoAnalysis.insights, narrative, analysis.activeMode]);




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
        // Use async path for full morphological pipeline with AI alternatives
        const result = await recomputeIntelligenceAsync(input);
        if (result.flatEvidence.length > 0 && result.insights.length > 0) {
          addEvent(`Intelligence: ${result.insights.length} insights from ${result.flatEvidence.length} evidence`);
        }
      } catch { /* Silent */ } finally {
        asyncRecomputeRunning.current = false;
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [completedSteps, totalSignals, metrics.totalEvidenceCount, savedScenarios]);

  // (diagnostics removed from default view)

  const modeKey: "product" | "service" | "business" = analysis.activeMode === "service" ? "service"
    : analysis.activeMode === "business" ? "business" : "product";

  // ── Step findings for journey cards ──
  const stepFindings = useMemo(() => {
    const f: Record<string, { headline: string } | null> = {};
    // Report
    if (selectedProduct?.pricingIntel || selectedProduct?.supplyChain) {
      const parts: string[] = [];
      if (selectedProduct?.pricingIntel?.priceRange) parts.push(`Price range: ${selectedProduct.pricingIntel.priceRange}`);
      if (selectedProduct?.supplyChain?.manufacturers?.[0]) parts.push(`Key manufacturer: ${selectedProduct.supplyChain.manufacturers[0]}`);
      f.report = parts.length ? { headline: parts.join(" · ") } : null;
    }
    // Disrupt
    if (narrative?.primaryConstraint) {
      f.disrupt = { headline: `Core constraint: ${humanizeLabel(narrative.primaryConstraint)}` };
    }
    // Redesign
    if (analysis.redesignData) {
      const ideas = (analysis.redesignData as any)?.flippedIdeas;
      f.redesign = ideas?.length ? { headline: `${ideas.length} reimagined concepts generated` } : null;
    }
    // Stress Test
    if (analysis.stressTestData) {
      const verdict = (analysis.stressTestData as any)?.verdict;
      f.stressTest = verdict ? { headline: verdict } : null;
    }
    // Pitch
    if (analysis.pitchDeckData) {
      f.pitch = { headline: "Pitch deck ready for review" };
    }
    return f;
  }, [selectedProduct, narrative, analysis.redesignData, analysis.stressTestData, analysis.pitchDeckData]);

  // Derive industry / date for header context (must be before guard — hooks)
  const industryLabel = useMemo(() => {
    if (businessModelInput?.type) return businessModelInput.type;
    if (selectedProduct?.category) return selectedProduct.category;
    return modeKey === "service" ? "Service Industry" : modeKey === "business" ? "Business Model" : "Product Market";
  }, [businessModelInput, selectedProduct, modeKey]);

  const modeLabel = modeKey === "service" ? "Service Analysis" : modeKey === "business" ? "Business Model Analysis" : "Product Analysis";

  // ── Guards ──
  const isHydrating = analysis.isHydrating;
  if (analysis.step !== "done" || (!selectedProduct && !hasBusinessContext)) {
    if (shouldRedirectHome) return null;
    // If hydration is done but data is still missing, show error state
    if (analysis.step === "done" && !isHydrating) {
      return (
        <div className="flex-1 bg-background flex items-center justify-center px-4">
          <div className="text-center space-y-3 max-w-md">
            <p className="text-sm font-bold text-foreground">Analysis data incomplete</p>
            <p className="text-xs text-muted-foreground">This analysis may need to be re-run to populate missing data.</p>
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
    // Analysis is actively running (scraping/analyzing) — show loading tracker
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
      const modeLabel = analysis.activeMode === "business" ? "Business Model"
        : analysis.activeMode === "service" ? "Service" : "Product";
      return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
          <div className="w-full max-w-lg">
            <StepLoadingTracker
              title={`Building ${modeLabel} Intelligence`}
              tasks={activeTasks}
              estimatedSeconds={90}
            />
          </div>
        </div>
      );
    }
    // Hydrating from DB — show simple spinner
    return (
      <div className="flex-1 bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "hsl(var(--primary))" }} />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-background overflow-y-auto">
      <main className="max-w-[1100px] mx-auto px-3 sm:px-6 py-3 sm:py-4 space-y-3">

        {/* ══════════════════════════════════════════════════════════
            COMPACT HEADER — Name, Mode, Actions
           ══════════════════════════════════════════════════════════ */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-black text-foreground truncate">
              {analysisDisplayName}
            </h1>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <ModeBadge />
              <span className="text-[11px] text-muted-foreground">{industryLabel}</span>
              <span className="text-muted-foreground text-[10px]">·</span>
              <span className="text-[11px] text-muted-foreground">{completedSteps.size}/{PIPELINE_STEPS.length} steps</span>
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[36px]"
              style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))" }}
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

        {/* ═══ SCENARIO BANNER ═══ */}
        <ScenarioBanner challenges={activeChallenges} onReset={handleResetScenario} onSave={handleSaveScenario} />
        <DeltaChanges deltas={deltaChanges} />
        <ReasoningStagesOverlay isComputing={engineComputing || isRecomputing} />

        {/* ══════════════════════════════════════════════════════════
            SECTION 0 — "SO WHAT?" DECISION HEADER
            Binary consequence of inaction vs action.
           ══════════════════════════════════════════════════════════ */}
        <SoWhatHeader
          narrative={narrative}
          thesis={autoAnalysis.deepenedOpportunities[0] ?? null}
          modeAccent={modeAccent}
        />

        {/* ══════════════════════════════════════════════════════════
            SECTION 1 — THE THESIS
            Core product: constraint → belief → move → economics → first move
           ══════════════════════════════════════════════════════════ */}
        <OneThesisCard
          thesis={autoAnalysis.deepenedOpportunities[0] ?? null}
          alternative={autoAnalysis.deepenedOpportunities[1] ?? null}
          modeAccent={modeAccent}
        />

        {/* ══════════════════════════════════════════════════════════
            SECTION 2 — THE EVIDENCE (Strategic X-Ray)
            Interactive reasoning chain with challenge mode.
           ══════════════════════════════════════════════════════════ */}
        <StrategicXRay
          narrative={narrative}
          insights={autoAnalysis.insights}
          flatEvidence={autoAnalysis.flatEvidence}
          onRecompute={handleRecomputeAll}
          onChallenge={handleChallenge}
        />

        {/* ══════════════════════════════════════════════════════════
            SECTION 3 — WHAT'S NEXT
            Kill question + first move + scenario trigger
           ══════════════════════════════════════════════════════════ */}
        <WhatsNextPanel
          narrative={narrative}
          thesis={autoAnalysis.deepenedOpportunities[0] ?? null}
          modeAccent={modeAccent}
          onChallenge={handleChallenge}
        />

        {/* ══════════════════════════════════════════════════════════
            POWER TOOLS — Collapsed advanced tools
           ══════════════════════════════════════════════════════════ */}
        <PowerToolsPanel toolCount={6}>
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
                onProblemLocked={(statement) => {
                  toast.success("Problem statement locked — downstream analysis will adapt");
                }}
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
            recommendedToolIds={reasoningToolRecs}
            onScenarioSaved={handleScenarioSaved}
          />
        </PowerToolsPanel>

      </main>
    </div>
  );
}
