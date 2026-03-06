/**
 * Command Deck — Strategic Decision Interface
 *
 * 5 Visual Zones:
 *   Zone 1 — Strategic Snapshot (4 mission-control scorecards)
 *   Zone 2 — Opportunity Map (Impact × Feasibility matrix)
 *   Zone 3 — Constraint Radar (radial severity chart)
 *   Zone 4 — Strategic Leverage Signals (top insight cards)
 *   Zone 5 — Action Path (recommended next steps)
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
import { HeroSection } from "@/components/HeroSection";
import { ModeBadge } from "@/components/ModeBadge";
import { LensIntelligencePanel } from "@/components/LensIntelligencePanel";
import { RecomputeOverlay } from "@/components/RecomputeOverlay";
import { StrategicSignalBanner } from "@/components/command-deck/StrategicSignalBanner";
import { StrategicSnapshot } from "@/components/command-deck/StrategicSnapshot";
import { OpportunityMap } from "@/components/command-deck/OpportunityMap";
import { ConstraintRadar } from "@/components/command-deck/ConstraintRadar";
import { StrategicLeverageSignals } from "@/components/command-deck/StrategicLeverageSignals";
import { ActionPath } from "@/components/command-deck/ActionPath";
import { StrategicNarrativePanel } from "@/components/StrategicNarrativePanel";
import { motion } from "framer-motion";
import {
  LayoutDashboard, GitBranch, Target, Crosshair, Lightbulb,
  AlertTriangle, Rocket, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  computeCommandDeckMetrics, aggregateOpportunities,
  type CommandDeckMetrics as DeckMetrics,
} from "@/lib/commandDeckMetrics";
import { extractAllEvidence, type EvidenceTier } from "@/lib/evidenceEngine";
import { computeTierState, filterEvidenceByTier, type TierNumber, type TierState } from "@/lib/tierDiscoveryEngine";
import { allScenariosToEvidence, scenarioToEvidence, getScenarios, type ToolScenario } from "@/lib/scenarioEngine";
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

  const { selectedProduct, analysisId: ctxAnalysisId, businessAnalysisData, businessModelInput } = analysis;

  const urlAnalysisId = useMemo(() => {
    const match = window.location.pathname.match(/\/analysis\/([0-9a-f-]{36})/);
    return match?.[1] || null;
  }, []);
  const analysisId = ctxAnalysisId || urlAnalysisId;
  const modeAccent = theme.primary;
  const { intelligence, graph, completedSteps, narrative } = autoAnalysis;

  // ── Aggregated Metrics ──
  const allEvidence = useMemo(() => extractAllEvidence({
    products: analysis.products,
    selectedProduct,
    disruptData: analysis.disruptData,
    redesignData: analysis.redesignData,
    stressTestData: analysis.stressTestData,
    pitchDeckData: analysis.pitchDeckData,
    governedData: analysis.governedData as Record<string, unknown> | null,
    businessAnalysisData: analysis.businessAnalysisData,
    intelligence,
    analysisType: analysis.activeMode === "service" ? "service" : analysis.activeMode === "business" ? "business_model" : "product",
  }), [
    analysis.products, selectedProduct, analysis.disruptData, analysis.redesignData,
    analysis.stressTestData, analysis.pitchDeckData, analysis.governedData,
    analysis.businessAnalysisData, intelligence, analysis.activeMode,
  ]);

  const metricsInput = useMemo(() => ({
    products: analysis.products,
    selectedProduct,
    disruptData: analysis.disruptData,
    redesignData: analysis.redesignData,
    stressTestData: analysis.stressTestData,
    pitchDeckData: analysis.pitchDeckData,
    governedData: analysis.governedData as Record<string, unknown> | null,
    businessAnalysisData: analysis.businessAnalysisData,
    intelligence,
    completedSteps,
    evidence: allEvidence,
  }), [
    analysis.products, selectedProduct, analysis.disruptData, analysis.redesignData,
    analysis.stressTestData, analysis.pitchDeckData, analysis.governedData,
    analysis.businessAnalysisData, intelligence, completedSteps, allEvidence,
  ]);

  const metrics: DeckMetrics = useMemo(() => computeCommandDeckMetrics(metricsInput), [metricsInput]);
  const topOpps = useMemo(() => aggregateOpportunities(metricsInput), [metricsInput]);

  // ── Tier Discovery State ──
  const [tierFilter, setTierFilter] = useState<EvidenceTier | null>(null);
  const [manualUnlocks, setManualUnlocks] = useState<Set<TierNumber>>(new Set());
  const filteredOpps = useMemo(() => {
    if (!tierFilter) return topOpps;
    return topOpps.filter((o: any) => !o.tier || o.tier === tierFilter);
  }, [topOpps, tierFilter]);

  // ── Strategic Potential Score ──
  const scenarioCountRef = useRef(0);
  const strategicPotential = useMemo(() => {
    const simBoost = Math.min(scenarioCountRef.current * 0.3, 1.5);
    const raw = (metrics.opportunityScore + metrics.leverageScore + simBoost)
      - (metrics.frictionIndex * 0.5)
      - (metrics.riskScore * 0.3);
    return Math.max(0, Math.min(10, Math.round(raw * 10) / 10));
  }, [metrics]);

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

  const reasoningToolRecs = useMemo(() => narrative?.recommendedTools ?? [], [narrative]);

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
      const result = recomputeIntelligence({
        products: analysis.products, selectedProduct,
        disruptData: analysis.disruptData, redesignData: analysis.redesignData,
        stressTestData: analysis.stressTestData, pitchDeckData: analysis.pitchDeckData,
        governedData: analysis.governedData as Record<string, unknown> | null,
        businessAnalysisData: analysis.businessAnalysisData, intelligence,
        analysisType: analysis.activeMode === "service" ? "service" : analysis.activeMode === "business" ? "business_model" : "product",
        analysisId: analysisId || "", completedSteps,
      });
      result.events.forEach(evt => addEvent(evt));
    } catch { addEvent("Intelligence recompute completed"); }
    setTimeout(() => { setIsRecomputing(false); toast.success("Strategic intelligence updated"); }, 800);
  }, [analysis, selectedProduct, intelligence, analysisId, completedSteps, addEvent]);

  const handleRecomputeAll = useCallback(() => {
    if (completedSteps.size === 0) { navigate(`${baseUrl}/report`); return; }
    setIsRecomputing(true);
    addEvent("Recomputing strategic intelligence…");
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
      result.events.forEach(evt => addEvent(evt));
    } catch { addEvent("Strategic intelligence updated"); }
    setTimeout(() => { setIsRecomputing(false); toast.success("Strategic intelligence updated"); }, 1000);
  }, [analysis, selectedProduct, intelligence, analysisId, completedSteps, navigate, baseUrl, addEvent]);

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
  const modeLabel = modeKey === "service" ? "Service" : modeKey === "business" ? "Business Model" : "Product";

  return (
    <div className="min-h-screen bg-background">
      <HeroSection tier={tier} remainingAnalyses={null} />

      <main className="max-w-[1400px] mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-5">
        <RecomputeOverlay isActive={isRecomputing || autoAnalysis.isComputing} />

        {/* ═══ HEADER — Compact ═══ */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl px-4 py-3 bg-card border border-border">
          <div className="flex items-center gap-3 min-w-0">
            <ModeBadge />
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-extrabold text-foreground truncate">{analysisDisplayName}</h1>
              <p className="text-[10px] text-muted-foreground">
                {modeLabel} · {completedSteps.size}/{PIPELINE_STEPS.length} steps · {totalSignals} signals
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {(isRecomputing || autoAnalysis.isComputing) && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-primary animate-pulse">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" /> Computing…
              </span>
            )}
            <button onClick={handleRecomputeAll}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[36px]"
              style={{ background: `${modeAccent}10`, color: modeAccent, border: `1px solid ${modeAccent}20` }}>
              <RefreshCw size={13} className={isRecomputing ? "animate-spin" : ""} /> Recompute
            </button>
            <WorkspaceThemeToggle theme={workspaceTheme} onToggle={toggleTheme} />
          </div>
        </div>

        {/* ═══ NAV STRIP ═══ */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
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

        {/* ═══ STRATEGIC SIGNAL BANNER ═══ */}
        <StrategicSignalBanner
          opportunities={filteredOpps}
          insights={autoAnalysis.insights}
          metrics={metrics}
          mode={modeKey}
        />

        {/* ═══════════════════════════════════════════════════
            5-ZONE STRATEGIC COMMAND CENTER LAYOUT
            ═══════════════════════════════════════════════════ */}

        {/* ROW 1 — Strategic Snapshot (full width) */}
        <StrategicSnapshot
          metrics={metrics}
          opportunities={filteredOpps}
          strategicPotential={strategicPotential}
        />

        {/* ROW 2 — Opportunity Map (65%) + Constraint Radar (35%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8 transition-all duration-200 hover:scale-[1.003]">
            <OpportunityMap
              opportunities={filteredOpps}
              onViewInGraph={(id) => navigate(`${baseUrl}/insight-graph?node=${id}`)}
            />
          </div>
          <div className="lg:col-span-4 transition-all duration-200 hover:scale-[1.003]">
            <ConstraintRadar
              metrics={metrics}
              insights={autoAnalysis.insights}
            />
          </div>
        </div>

        {/* ROW 3 — Strategic Leverage Signals (60%) + Action Path (40%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7">
            <StrategicLeverageSignals
              insights={autoAnalysis.insights}
              onViewGraph={() => navigate(`${baseUrl}/insight-graph`)}
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

        {/* ═══ LENS INTELLIGENCE PANEL (below zones) ═══ */}
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
