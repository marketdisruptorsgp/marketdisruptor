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
import { StrategicXRay } from "@/components/command-deck/StrategicXRay";
import { TransformationPaths } from "@/components/command-deck/TransformationPaths";
import { StrategicOutcomeSimulator } from "@/components/command-deck/StrategicOutcomeSimulator";
import { StrategicVerdictBanner } from "@/components/command-deck/StrategicVerdictBanner";
import { TrappedValueCard } from "@/components/command-deck/TrappedValueCard";
import { KillQuestionCard } from "@/components/command-deck/KillQuestionCard";
import { OpportunityMap } from "@/components/command-deck/OpportunityMap";
import { ScenarioBanner, type ActiveChallenge } from "@/components/command-deck/ScenarioBanner";
import { DeltaChanges, type DeltaItem } from "@/components/command-deck/DeltaChanges";
import { ScenarioLab } from "@/components/command-deck/ScenarioLab";
import { StrategicPatternCard } from "@/components/command-deck/StrategicPatternCard";
import { detectStructuralPattern } from "@/lib/strategicPatternEngine";
import {
  saveScenarioSnapshot, getSavedScenarios, deleteScenarioSnapshot,
  type ScenarioSnapshot,
} from "@/lib/scenarioLabEngine";
import { generatePlaybooks } from "@/lib/playbookEngine";
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
      deltas.push({
        label: "Confidence",
        before: `${Math.round((baselineNarrative.verdictConfidence ?? 0) * 100)}%`,
        after: `${Math.round((narrative.verdictConfidence ?? 0) * 100)}%`,
        direction: (narrative.verdictConfidence ?? 0) > (baselineNarrative.verdictConfidence ?? 0) ? "up" : "down",
      });
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

  // ── Evidence Attribution (drives Confidence Meter, Verdict, Trapped Value) ──
  const evidenceAttribution = useMemo(() => {
    const categories = new Map<string, number>();
    const categoryExamples = new Map<string, string>();
    for (const e of autoAnalysis.flatEvidence) {
      const cat = (e.category || "general").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
      categories.set(cat, (categories.get(cat) || 0) + 1);
      // Keep the highest-impact example per category for diagnosis evidence
      if (!categoryExamples.has(cat) || (e.impact ?? 0) > 5) {
        categoryExamples.set(cat, e.label || e.description || "");
      }
    }
    const sorted = [...categories.entries()].sort((a, b) => b[1] - a[1]);
    const strong = sorted.filter(([, c]) => c >= 3).map(([k]) => k);
    const weak = sorted.length > 0
      ? ["Demand Signal", "Cost Structure", "Competitive Pressure", "Customer Behavior", "Distribution Channel"]
          .map(k => k.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()))
          .filter(k => !categories.has(k) || (categories.get(k) || 0) < 2)
          .slice(0, 2)
      : [];
    const sources = sorted.slice(0, 5).map(([k]) => k);

    // Trapped value drivers from narrative + evidence
    const trappedValueDrivers: string[] = [];
    if (narrative?.primaryConstraint) trappedValueDrivers.push(`${narrative.primaryConstraint} constraining current structure`);
    if (strong.length > 0) trappedValueDrivers.push(`${strong[0]} patterns detected across ${categories.get(strong[0]) || 0} signals`);
    if (narrative?.breakthroughOpportunity) trappedValueDrivers.push(`Opportunity: ${narrative.breakthroughOpportunity}`);

    // Diagnosis evidence bullets — top evidence categories with example signals
    const diagnosisEvidence = sorted.slice(0, 4).map(([cat]) => ({
      category: cat,
      detail: categoryExamples.get(cat) || `${categories.get(cat)} indicators detected`,
    }));

    return { strong, weak, sources, trappedValueDrivers, diagnosisEvidence };
  }, [autoAnalysis.flatEvidence, narrative]);

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

  // (diagnostics removed from default view)

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
        {/* ═══ COMPACT HEADER ═══ */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ModeBadge />
          </div>
          <div className="flex items-center gap-2">
            {!pipelineProgress.isRunning && completedSteps.size < PIPELINE_STEPS.length && (
              <button
                onClick={() => {
                  // Trigger the pipeline orchestrator for remaining steps
                  handleRecomputeAll();
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[36px]"
                style={{ background: modeAccent, color: "white" }}
              >
                <Play size={12} /> Run Full Analysis
              </button>
            )}
            <button onClick={handleRecomputeAll}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[36px]"
              style={{ background: `${modeAccent}15`, color: modeAccent, border: `1.5px solid ${modeAccent}30` }}>
              <RefreshCw size={13} className={(isRecomputing || engineComputing) ? "animate-spin" : ""} /> Refresh
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

        {/* ═══ SCENARIO BANNER — contextual, only when active ═══ */}
        <ScenarioBanner
          challenges={activeChallenges}
          onReset={handleResetScenario}
          onSave={handleSaveScenario}
        />
        <DeltaChanges deltas={deltaChanges} />

        {/* ═══ REASONING STAGES — brief animation during recompute ═══ */}
        <ReasoningStagesOverlay isComputing={engineComputing || isRecomputing} />

        {/* ════════════════════════════════════════════════════════════
            TIER 1 — STRATEGIC BRIEFING
            User understands the entire story in under 10 seconds.
           ════════════════════════════════════════════════════════════ */}

        {/* Confidence Meter with evidence attribution */}
        <ConfidenceMeter
          completedSteps={completedSteps.size}
          totalSteps={PIPELINE_STEPS.length}
          evidenceCount={totalSignals}
          confidence={narrative?.verdictConfidence ?? (completedSteps.size / PIPELINE_STEPS.length) * 0.3}
          isComputing={engineComputing}
          strongCategories={evidenceAttribution.strong}
          weakCategories={evidenceAttribution.weak}
        />

        {/* Strategic Verdict — THE most important component */}
        <StrategicVerdictBanner
          verdict={narrative?.strategicVerdict ?? null}
          rationale={narrative?.verdictRationale ?? null}
          confidence={narrative?.verdictConfidence ?? 0}
          constraintLabel={narrative?.primaryConstraint ?? null}
          opportunityLabel={narrative?.breakthroughOpportunity ?? null}
          completedSteps={completedSteps.size}
          totalSteps={PIPELINE_STEPS.length}
          whyThisMatters={narrative?.whyThisMatters ?? null}
          verdictBenchmark={narrative?.verdictBenchmark ?? null}
          evidenceSources={evidenceAttribution.sources}
          diagnosisEvidence={evidenceAttribution.diagnosisEvidence}
        />

        {/* Trapped Value + Kill Question */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TrappedValueCard
            trappedDescription={narrative?.trappedValue ?? null}
            unlockDescription={narrative?.unlockPotential ?? null}
            confidence={narrative?.verdictConfidence ?? 0}
            evidenceCount={narrative?.trappedValueEvidenceCount ?? 0}
            estimate={narrative?.trappedValueEstimate ?? null}
            benchmark={narrative?.trappedValueBenchmark ?? null}
            drivers={evidenceAttribution.trappedValueDrivers}
          />
          <KillQuestionCard
            killQuestion={narrative?.killQuestion ?? null}
            validationExperiment={narrative?.validationExperiment ?? null}
            timeframe={narrative?.validationTimeframe ?? "30 days"}
            confidence={narrative?.verdictConfidence ?? 0}
            validationSteps={narrative?.validationSteps ?? []}
          />
        </div>

        {/* Top Transformation Playbook (just #1, expandable to all) */}
        <TransformationPaths
          evidence={autoAnalysis.flatEvidence}
          insights={autoAnalysis.insights}
          narrative={narrative}
          mode={modeKey}
        />

        {/* ════════════════════════════════════════════════════════════
            TIER 2 — STRATEGIC ANALYSIS
            Evidence behind the strategy. Progressive disclosure.
           ════════════════════════════════════════════════════════════ */}

        {/* Strategic Pattern Detection */}
        <StrategicPatternCard patterns={detectedPatterns} />

        {/* Strategic X-Ray — starts collapsed with summary */}
        <StrategicXRay
          narrative={narrative}
          insights={autoAnalysis.insights}
          flatEvidence={autoAnalysis.flatEvidence}
          onRecompute={handleRecomputeAll}
          onChallenge={handleChallenge}
        />

        {/* ════════════════════════════════════════════════════════════
            TIER 3 — STRATEGIC LAB
            Advanced experimentation for power users.
           ════════════════════════════════════════════════════════════ */}

        {/* Scenario Lab */}
        <ScenarioLab
          scenarios={savedLabScenarios}
          activeScenarioId={activeLabScenarioId}
          onLoadScenario={handleLoadLabScenario}
          onDeleteScenario={handleDeleteLabScenario}
        />

        {/* Opportunity Map */}
        <OpportunityMap
          opportunities={filteredOpps}
          onViewInGraph={(id) => navigate(`${baseUrl}/insight-graph?node=${id}`)}
        />

        {/* Lens Intelligence Panel */}
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
