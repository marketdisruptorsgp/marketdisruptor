import React, { useState } from "react";
import { invokeWithTimeout } from "@/lib/invokeWithTimeout";
import { toast } from "sonner";
import { Swords, Eye, RefreshCw, ArrowRight, Shield, CheckCircle2, RefreshCw as Refresh } from "lucide-react";
import { StepLoadingTracker, STRESS_TEST_TASKS } from "@/components/StepLoadingTracker";
import { useAnalysis } from "@/contexts/AnalysisContext";
import {
  StepCanvas, InsightCard, SignalCard, FrameworkPanel, VisualGrid, ExpandableDetail,
} from "@/components/analysis/AnalysisComponents";

import type { ValidationData } from "./critical-validation/types";
import { RedTeamPanel } from "./critical-validation/RedTeamPanel";
import { GreenTeamPanel } from "./critical-validation/GreenTeamPanel";
import { CounterExamplePanel } from "./critical-validation/CounterExamplePanel";
import { CompetitiveLandscapePanel } from "./critical-validation/CompetitiveLandscapePanel";
import { FeasibilityChecklistPanel } from "./critical-validation/FeasibilityChecklistPanel";
import { ConfidenceScorePanel } from "./critical-validation/ConfidenceScorePanel";

interface CriticalValidationProps {
  product: { name: string; category: string };
  analysisData: unknown;
  activeTab: "debate" | "validate";
  externalData?: unknown;
  onDataLoaded?: (data: unknown) => void;
  runTrigger?: number;
  onLoadingChange?: (loading: boolean) => void;
  competitorIntel?: unknown[];
  conceptVariants?: { name: string; description: string; formula: string; dimensionValues: Record<string, string> }[];
}

export const CriticalValidation = ({ product, analysisData, activeTab, externalData, onDataLoaded, runTrigger, onLoadingChange, competitorIntel, conceptVariants }: CriticalValidationProps) => {
  const [data, setData] = useState<ValidationData | null>((externalData as ValidationData) || null);
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [userSuggestions, setUserSuggestions] = useState("");

  React.useEffect(() => { onLoadingChange?.(loading); }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps

  const runTriggerRef = React.useRef(runTrigger ?? 0);
  React.useEffect(() => {
    if (runTrigger !== undefined && runTrigger > runTriggerRef.current && !loading) {
      runTriggerRef.current = runTrigger;
      runValidation();
    }
  }, [runTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  let geoData: unknown = undefined;
  let regulatoryData: unknown = undefined;
  let governedData: Record<string, unknown> | null = null;
  let activeBranchId: string | null = null;
  let strategicProfileRef: any = undefined;
  let adaptiveContextRef: any = undefined;
  try {
    const ctx = useAnalysis();
    geoData = ctx.geoData;
    regulatoryData = ctx.regulatoryData;
    governedData = ctx.governedData;
    activeBranchId = ctx.activeBranchId;
    strategicProfileRef = ctx.strategicProfile;
    adaptiveContextRef = ctx.adaptiveContext;
  } catch { /* context may not be available in shared view */ }

  const runValidation = async () => {
    setLoading(true);
    try {
      let activeBranch: unknown = undefined;
      if (governedData && activeBranchId) {
        const { getBranchPayload } = await import("@/lib/branchContext");
        activeBranch = getBranchPayload(governedData, activeBranchId, strategicProfileRef);
      }
      const { data: result, error } = await invokeWithTimeout("critical-validation", {
        body: { product, analysisData, userSuggestions: userSuggestions || undefined, geoData: geoData || undefined, regulatoryData: regulatoryData || undefined, activeBranch, adaptiveContext: adaptiveContextRef || undefined, competitorIntel: competitorIntel?.length ? competitorIntel : undefined, conceptVariants: conceptVariants?.length ? conceptVariants : undefined },
      }, 180_000);
      if (error || !result?.success) {
        toast.error(result?.error || error?.message || "Validation failed");
      } else {
        setData(result.validation);
        onDataLoaded?.(result.validation);
        toast.success("Critical validation complete!");
      }
    } catch (err) {
      toast.error("Unexpected error: " + String(err));
    } finally {
      setLoading(false);
    }
  };

  // Loading
  if (!data && loading) {
    return <StepLoadingTracker title="Running Stress Test" tasks={STRESS_TEST_TASKS} estimatedSeconds={30} accentColor="hsl(350 80% 55%)" />;
  }

  // Empty
  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-5 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "hsl(var(--muted))" }}>
          <Swords size={30} style={{ color: "hsl(350 80% 55%)" }} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground mb-1">Critical Validation</h3>
          <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
            Red Team vs Green Team debate, precedents, feasibility checklist, and confidence scoring.
          </p>
        </div>
        <ExpandableDetail label="Steer the Stress Test (optional)" icon={Eye} defaultExpanded>
          <textarea
            value={userSuggestions}
            onChange={(e) => setUserSuggestions(e.target.value)}
            placeholder="e.g. Focus on pricing pressure, test subscription model, consider regulatory risks…"
            className="w-full rounded-lg px-3 py-2.5 text-sm leading-relaxed resize-none transition-colors focus:outline-none mb-2"
            rows={2}
            style={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))" }}
          />
        </ExpandableDetail>
        <button onClick={runValidation} disabled={loading}
          className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-colors"
          style={{ background: "hsl(350 80% 55%)", color: "white", opacity: loading ? 0.7 : 1 }}>
          <Swords size={15} /> Run Critical Validation
        </button>
        <p className="text-[11px] font-bold text-muted-foreground">Requires completed Deconstruct analysis · ~20-30s</p>
      </div>
    );
  }

  // ═══ DEBATE TAB ═══
  if (activeTab === "debate") {
    return (
      <StepCanvas>
        {/* Re-run */}
        <ExpandableDetail label="Refine your analysis — add direction, then Re-run" icon={Eye} defaultExpanded>
          <div className="flex items-center justify-between gap-2 mb-2">
            <textarea
              value={userSuggestions}
              onChange={(e) => setUserSuggestions(e.target.value)}
              placeholder="e.g. Focus more on regulatory risks, test pricing at $X…"
              className="flex-1 rounded-lg px-3 py-2 text-sm leading-relaxed resize-none transition-colors focus:outline-none"
              rows={2}
              style={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))" }}
            />
            <button onClick={runValidation} disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex-shrink-0"
              style={{ background: "hsl(350 80% 55%)", color: "white", opacity: loading ? 0.7 : 1 }}>
              {loading ? <RefreshCw size={11} className="animate-spin" /> : <RefreshCw size={11} />}
              Re-run
            </button>
          </div>
        </ExpandableDetail>

        {/* Split Arena */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 rounded-2xl overflow-hidden" style={{ border: "1px solid hsl(var(--border))" }}>
          <RedTeamPanel verdict={data.redTeam.verdict} arguments={data.redTeam.arguments} killShot={data.redTeam.killShot} />
          <GreenTeamPanel verdict={data.blueTeam.verdict} arguments={data.blueTeam.arguments} moonshot={data.blueTeam.moonshot} />
        </div>

        {/* Shared sections below the arena */}
        <CompetitiveLandscapePanel landscape={data.competitiveLandscape} hasCompetitorIntel={!!competitorIntel?.length} />
        <CounterExamplePanel counterExamples={data.counterExamples} />

        {/* Strategic Recommendations */}
        {data.strategicRecommendations?.length ? (
          <ExpandableDetail label={`Strategic Recommendations (${data.strategicRecommendations.length})`} icon={ArrowRight}>
            <VisualGrid columns={1}>
              {data.strategicRecommendations.map((rec, i) => (
                <SignalCard key={i} label={rec} type="strength" />
              ))}
            </VisualGrid>
          </ExpandableDetail>
        ) : null}

        {/* Current Approach Assessment */}
        {data.currentApproachAssessment && (
          <ExpandableDetail label="Current Approach Assessment" icon={Shield}>
            <div className="space-y-3">
              {data.currentApproachAssessment.keepAsIs?.length > 0 && (
                <FrameworkPanel title="Keep As-Is" icon={CheckCircle2} subtitle={`${data.currentApproachAssessment.keepAsIs.length} items`}>
                  <VisualGrid columns={1}>
                    {data.currentApproachAssessment.keepAsIs.map((item, i) => (
                      <SignalCard key={i} label={item} type="strength" />
                    ))}
                  </VisualGrid>
                </FrameworkPanel>
              )}
              {data.currentApproachAssessment.fullyReinvent?.length > 0 && (
                <FrameworkPanel title="Fully Reinvent" icon={RefreshCw} subtitle={`${data.currentApproachAssessment.fullyReinvent.length} items`}>
                  <VisualGrid columns={1}>
                    {data.currentApproachAssessment.fullyReinvent.map((item, i) => (
                      <SignalCard key={i} label={item} type="threat" />
                    ))}
                  </VisualGrid>
                </FrameworkPanel>
              )}
              <InsightCard
                headline={data.currentApproachAssessment.verdict}
                badge="Verdict"
                badgeColor="hsl(var(--primary))"
                accentColor="hsl(var(--primary))"
              />
            </div>
          </ExpandableDetail>
        )}

        {/* Blind Spots */}
        {data.blindSpots?.length > 0 && (
          <ExpandableDetail label={`Blind Spots (${data.blindSpots.length})`} icon={Eye}>
            <VisualGrid columns={1}>
              {data.blindSpots.map((bs, i) => (
                <SignalCard key={i} label={bs} type="weakness" />
              ))}
            </VisualGrid>
          </ExpandableDetail>
        )}
      </StepCanvas>
    );
  }

  // ═══ VALIDATE TAB ═══
  return (
    <StepCanvas>
      <ConfidenceScorePanel scores={data.confidenceScores} />
      <FeasibilityChecklistPanel items={data.feasibilityChecklist} />
    </StepCanvas>
  );
};
