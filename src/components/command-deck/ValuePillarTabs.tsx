/**
 * ValuePillarTabs — Three core value pillars:
 *   1. New Ideas (Disrupt + Reimagine)
 *   2. Execution Path (Playbooks + Stress Test + Pitch)
 *   3. Iterate (Scenario Lab + Challenge + Tools)
 */

import { memo, type ReactNode } from "react";
import { Lightbulb, Rocket, RefreshCw, Map, Brain, Beaker, Wrench, BarChart3, BookOpen } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { TransformationPaths } from "@/components/command-deck/TransformationPaths";
import { StrategicOutcomeSimulator } from "@/components/command-deck/StrategicOutcomeSimulator";
import { StrategicNarrativeStory } from "@/components/command-deck/StrategicNarrativeStory";
import { StrategicVerdictBanner } from "@/components/command-deck/StrategicVerdictBanner";
import { TrappedValueCard } from "@/components/command-deck/TrappedValueCard";
import { KillQuestionCard } from "@/components/command-deck/KillQuestionCard";
import { ConfidenceExplanationPanel } from "@/components/command-deck/ConfidenceExplanationPanel";
import { ConfidenceMeter } from "@/components/command-deck/ConfidenceMeter";
import { IndustryBenchmarkPanel } from "@/components/command-deck/IndustryBenchmarkPanel";
import { OpportunityMapPanel } from "@/components/command-deck/OpportunityRadarPanel";
import { StrategicPatternCard } from "@/components/command-deck/StrategicPatternCard";
import { StrategicXRay } from "@/components/command-deck/StrategicXRay";
import { StrategicScenarioSimulator } from "@/components/command-deck/StrategicScenarioSimulator";
import { ScenarioLab } from "@/components/command-deck/ScenarioLab";
import { OpportunityMap } from "@/components/command-deck/OpportunityMap";
import { LensIntelligencePanel } from "@/components/LensIntelligencePanel";
import type { StrategicNarrative } from "@/lib/strategicEngine";
import type { ScenarioSnapshot } from "@/lib/scenarioLabEngine";
import { humanizeLabel } from "@/lib/humanize";

interface ValuePillarTabsProps {
  // Common
  narrative: StrategicNarrative | null;
  flatEvidence: Array<any>;
  insights: Array<any>;
  mode: "product" | "service" | "business";
  modeAccent: string;
  completedSteps: number;
  totalSteps: number;
  totalSignals: number;

  // New Ideas
  // (TransformationPaths renders internally)

  // Execution Path
  topPlaybook: any;
  strategicStory: any;
  evidenceAttribution: {
    strong: string[];
    weak: string[];
    sources: string[];
    trappedValueDrivers: string[];
    diagnosisEvidence: Array<{ category: string; detail: string }>;
  };
  confidenceExplanation: any;
  benchmark: any;
  opportunityRadar: any;
  detectedPatterns: Array<any>;
  engineComputing: boolean;

  // Iterate
  savedLabScenarios: ScenarioSnapshot[];
  activeLabScenarioId: string | null;
  filteredOpps: Array<any>;
  analysisMode: string;
  signalKeywords: string[];
  analysisId: string;
  reasoningToolRecs: string[];
  baseUrl: string;

  // Callbacks
  onRecomputeAll: () => void;
  onChallenge: (stage: string, value: string) => void;
  onLoadScenario: (s: ScenarioSnapshot) => void;
  onDeleteScenario: (id: string) => void;
  onScenarioSaved: (s: any) => void;
  onNavigate: (path: string) => void;
}

export const ValuePillarTabs = memo(function ValuePillarTabs(props: ValuePillarTabsProps) {
  const {
    narrative, flatEvidence, insights, mode, modeAccent,
    completedSteps, totalSteps, totalSignals,
    topPlaybook, strategicStory, evidenceAttribution, confidenceExplanation,
    benchmark, opportunityRadar, detectedPatterns, engineComputing,
    savedLabScenarios, activeLabScenarioId, filteredOpps,
    analysisMode, signalKeywords, analysisId, reasoningToolRecs, baseUrl,
    onRecomputeAll, onChallenge, onLoadScenario, onDeleteScenario, onScenarioSaved, onNavigate,
  } = props;

  return (
    <Tabs defaultValue="ideas" className="w-full">
      <TabsList className="w-full grid grid-cols-3 h-11">
        <TabsTrigger value="ideas" className="text-xs font-extrabold uppercase tracking-wider gap-1.5">
          <Lightbulb size={13} /> New Ideas
        </TabsTrigger>
        <TabsTrigger value="execution" className="text-xs font-extrabold uppercase tracking-wider gap-1.5">
          <Rocket size={13} /> Execution Path
        </TabsTrigger>
        <TabsTrigger value="iterate" className="text-xs font-extrabold uppercase tracking-wider gap-1.5">
          <RefreshCw size={13} /> Iterate
        </TabsTrigger>
      </TabsList>

      {/* ═══ TAB 1: NEW IDEAS ═══ */}
      <TabsContent value="ideas" className="space-y-3 mt-3">
        <TransformationPaths
          evidence={flatEvidence}
          insights={insights}
          narrative={narrative}
          mode={mode}
        />
        <StrategicNarrativeStory story={strategicStory} />

        {/* CTA to deeper steps */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => onNavigate(`${baseUrl}/disrupt`)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[36px]"
            style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))" }}
          >
            <Lightbulb size={12} /> Disrupt Analysis
          </button>
          <button
            onClick={() => onNavigate(`${baseUrl}/redesign`)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[36px]"
            style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))" }}
          >
            <Rocket size={12} /> Reimagine
          </button>
        </div>
      </TabsContent>

      {/* ═══ TAB 2: EXECUTION PATH ═══ */}
      <TabsContent value="execution" className="space-y-3 mt-3">
        {/* Playbooks + Outcome Simulator */}
        <StrategicOutcomeSimulator
          playbook={topPlaybook}
          evidence={flatEvidence}
          narrative={narrative}
        />

        {/* Verdict + Kill Question */}
        <StrategicVerdictBanner
          verdict={narrative?.strategicVerdict ?? null}
          rationale={narrative?.verdictRationale ?? null}
          confidence={narrative?.verdictConfidence ?? 0}
          constraintLabel={narrative?.primaryConstraint ?? null}
          opportunityLabel={narrative?.breakthroughOpportunity ?? null}
          completedSteps={completedSteps}
          totalSteps={totalSteps}
          whyThisMatters={narrative?.whyThisMatters ?? null}
          verdictBenchmark={narrative?.verdictBenchmark ?? null}
          evidenceSources={evidenceAttribution.sources}
          diagnosisEvidence={evidenceAttribution.diagnosisEvidence}
        />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
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

        {/* Confidence + Market */}
        <ConfidenceMeter
          completedSteps={completedSteps}
          totalSteps={totalSteps}
          evidenceCount={totalSignals}
          confidence={narrative?.verdictConfidence ?? (completedSteps / totalSteps) * 0.3}
          isComputing={engineComputing}
          strongCategories={evidenceAttribution.strong}
          weakCategories={evidenceAttribution.weak}
        />
        <ConfidenceExplanationPanel explanation={confidenceExplanation} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <IndustryBenchmarkPanel benchmark={benchmark} />
          <OpportunityMapPanel items={opportunityRadar} />
        </div>

        {/* CTAs */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => onNavigate(`${baseUrl}/stress-test`)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[36px]"
            style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))" }}
          >
            <BookOpen size={12} /> Stress Test
          </button>
          <button
            onClick={() => onNavigate(`${baseUrl}/pitch`)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[36px]"
            style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))" }}
          >
            <Rocket size={12} /> Pitch Deck
          </button>
        </div>
      </TabsContent>

      {/* ═══ TAB 3: ITERATE ═══ */}
      <TabsContent value="iterate" className="space-y-3 mt-3">
        {/* Challenge Mode / Reasoning */}
        <StrategicXRay
          narrative={narrative}
          insights={insights}
          flatEvidence={flatEvidence}
          onRecompute={onRecomputeAll}
          onChallenge={onChallenge}
        />

        {/* Scenario Simulations */}
        <StrategicScenarioSimulator
          evidence={flatEvidence}
          narrative={narrative}
        />
        <ScenarioLab
          scenarios={savedLabScenarios}
          activeScenarioId={activeLabScenarioId}
          onLoadScenario={onLoadScenario}
          onDeleteScenario={onDeleteScenario}
        />
        <StrategicPatternCard patterns={detectedPatterns} />
        <OpportunityMap
          opportunities={filteredOpps}
          onViewInGraph={(id) => onNavigate(`${baseUrl}/insight-graph?node=${id}`)}
        />

        {/* Lens Tools */}
        <LensIntelligencePanel
          analysisMode={analysisMode}
          signalKeywords={signalKeywords}
          analysisId={analysisId}
          recommendedToolIds={reasoningToolRecs}
          onScenarioSaved={onScenarioSaved}
        />
      </TabsContent>
    </Tabs>
  );
});
