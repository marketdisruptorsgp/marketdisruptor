import React from "react";
import { AnalysisVisualLayer } from "@/components/AnalysisVisualLayer";
import type { VisualSpec } from "@/lib/visualContract";

export interface RedTeamArg {
  title: string;
  argument: string;
  severity: "critical" | "major" | "minor";
  biasExposed: string;
  specificEvidence?: string;
  dataLabel?: string;
}

export interface BlueTeamArg {
  title: string;
  argument: string;
  strength: "strong" | "moderate" | "conditional";
  enabler: string;
  proofPoint?: string;
  dataLabel?: string;
}

export interface CounterExample {
  name: string;
  outcome: "succeeded" | "failed" | "pivoted";
  similarity: string;
  lesson: string;
  year: string;
  revenue?: string;
}

export interface FeasibilityItem {
  category: string;
  item: string;
  status: "critical" | "important" | "nice-to-have";
  detail: string;
  estimatedCost: string;
  dataLabel?: string;
}

export interface ConfidenceScore {
  score: number;
  reasoning: string;
}

export interface CurrentApproachAssessment {
  keepAsIs: string[];
  adaptNotReplace: string[];
  fullyReinvent: string[];
  verdict: string;
}

export interface CompetitorComparison {
  competitor: string;
  url?: string;
  originalAdvantage: string;
  originalVulnerability: string;
  redesignAdvantage: string;
  redesignGap: string;
}

export interface CompetitiveLandscape {
  originalVsCompetitors: CompetitorComparison[];
  positioningRecommendation: string;
  pricingInsight?: string;
  biggestCompetitiveThreat: string;
  categoryDynamics?: string;
}

export interface ValidationData {
  redTeam: { verdict: string; arguments: RedTeamArg[]; killShot: string };
  blueTeam: { verdict: string; arguments: BlueTeamArg[]; moonshot: string };
  counterExamples: CounterExample[];
  feasibilityChecklist: FeasibilityItem[];
  confidenceScores: Record<string, ConfidenceScore>;
  strategicRecommendations?: string[];
  currentApproachAssessment?: CurrentApproachAssessment;
  blindSpots: string[];
  visualSpecs?: VisualSpec[];
  actionPlans?: import("@/lib/visualContract").ActionPlan[];
  competitiveLandscape?: CompetitiveLandscape;
}

export const SEVERITY_MAP: Record<string, "threat" | "weakness" | "neutral"> = {
  critical: "threat", major: "weakness", minor: "neutral",
};

export const STRENGTH_MAP: Record<string, "strength" | "opportunity" | "neutral"> = {
  strong: "strength", moderate: "opportunity", conditional: "neutral",
};

export const OUTCOME_MAP: Record<string, "strength" | "threat" | "opportunity"> = {
  succeeded: "strength", failed: "threat", pivoted: "opportunity",
};

export const STATUS_MAP: Record<string, "threat" | "weakness" | "neutral"> = {
  critical: "threat", important: "weakness", "nice-to-have": "neutral",
};

import { Brain, Zap, TrendingUp, Shield, Target, BarChart3 } from "lucide-react";

export const SCORE_LABELS: Record<string, { label: string; icon: typeof Brain }> = {
  technicalFeasibility: { label: "Technical Feasibility", icon: Zap },
  marketDemand: { label: "Market Demand", icon: TrendingUp },
  competitiveAdvantage: { label: "Competitive Advantage", icon: Shield },
  executionComplexity: { label: "Execution Ease", icon: Target },
  overallViability: { label: "Overall Viability", icon: BarChart3 },
};

/**
 * Error-safe wrapper for AnalysisVisualLayer in stress test context.
 */
export class StressTestVisualWrapper extends React.Component<
  { analysis: Record<string, unknown>; governedData: Record<string, unknown> | null; children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error) { console.warn("[StressTest] Visual layer error (non-fatal):", error.message); }
  render() {
    if (this.state.hasError) return <div className="space-y-4">{this.props.children}</div>;
    return (
      <AnalysisVisualLayer analysis={this.props.analysis} step="stressTest" governedOverride={this.props.governedData}>
        {this.props.children}
      </AnalysisVisualLayer>
    );
  }
}
