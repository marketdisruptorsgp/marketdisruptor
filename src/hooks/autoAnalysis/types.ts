/**
 * Shared types for the auto-analysis engine modules.
 */

import type { Evidence, MetricDomain, MetricEvidence } from "@/lib/evidenceEngine";
import type { DeepenedOpportunity, StructuralProfile } from "@/lib/reconfiguration";
import type { StrategicInsight, StrategicNarrative, StrategicDiagnostic } from "@/lib/strategicEngine";
import type { InsightGraph } from "@/lib/insightGraph";
import type { SystemIntelligence } from "@/lib/systemIntelligence";
import type { ScenarioComparison } from "@/lib/scenarioComparisonEngine";
import type { SensitivityReport } from "@/lib/sensitivityEngine";
import type { OpportunityZone, OpportunityVector } from "@/lib/opportunityDesignEngine";
import type { ConstraintInversion } from "@/lib/constraintInverter";
import type { SecondOrderUnlock } from "@/lib/secondOrderEngine";
import type { TemporalUnlock } from "@/lib/temporalArbitrageEngine";
import type { CompetitiveGap } from "@/lib/negativeSpaceEngine";
import type { WowCard, BlockedPath, IdeaCandidate } from "@/lib/creativeOpportunityEngine";
import type { ConstraintSelectionResult } from "@/lib/productMode/productConstraints";
import type { ProductOpportunity } from "@/lib/productMode/productOpportunities";
import type { ProductAction } from "@/lib/productMode/types";

export interface AutoAnalysisResult {
  intelligence: SystemIntelligence | null;
  structuralProfile: StructuralProfile | null;
  graph: InsightGraph | null;
  evidence: Record<MetricDomain, MetricEvidence> | null;
  flatEvidence: Evidence[];
  insights: StrategicInsight[];
  opportunities: any[];
  narrative: StrategicNarrative | null;
  diagnostic: StrategicDiagnostic | null;
  scenarioComparison: ScenarioComparison | null;
  sensitivityReports: SensitivityReport[];
  deepenedOpportunities: DeepenedOpportunity[];
  morphologicalZones: OpportunityZone[];
  morphologicalVectors: OpportunityVector[];
  constraintInversions: ConstraintInversion[];
  secondOrderUnlocks: SecondOrderUnlock[];
  temporalUnlocks: TemporalUnlock[];
  competitiveGaps: CompetitiveGap[];
  isComputing: boolean;
  completedSteps: Set<string>;
  pipelineCompletion: number;
  runAnalysis: () => void;
  hasRun: boolean;
  wowCards: WowCard[];
  blockedPaths: BlockedPath[];
  allCreativeIdeas: IdeaCandidate[];
  /** Product-mode only: selected structural constraints */
  productConstraints: ConstraintSelectionResult[];
  /** Product-mode only: selected strategic opportunities */
  productOpportunities: ProductOpportunity[];
  /** Product-mode only: 5-phase validation and launch action plan */
  productActionPlan: ProductAction[];
}

/** All mutable state managed by the auto-analysis engine */
export interface EngineState {
  intelligence: SystemIntelligence | null;
  structuralProfile: StructuralProfile | null;
  graph: InsightGraph | null;
  evidence: Record<MetricDomain, MetricEvidence> | null;
  flatEvidence: Evidence[];
  insights: StrategicInsight[];
  opportunities: any[];
  narrative: StrategicNarrative | null;
  diagnostic: StrategicDiagnostic | null;
  scenarioComparison: ScenarioComparison | null;
  sensitivityReports: SensitivityReport[];
  deepenedOpportunities: DeepenedOpportunity[];
  morphologicalZones: OpportunityZone[];
  morphologicalVectors: OpportunityVector[];
  constraintInversions: ConstraintInversion[];
  secondOrderUnlocks: SecondOrderUnlock[];
  temporalUnlocks: TemporalUnlock[];
  competitiveGaps: CompetitiveGap[];
  isComputing: boolean;
  hasRun: boolean;
  productConstraints: ConstraintSelectionResult[];
  productOpportunities: ProductOpportunity[];
  productActionPlan: ProductAction[];
}

export interface EngineSetters {
  setIntelligence: (v: SystemIntelligence | null) => void;
  setStructuralProfile: (v: StructuralProfile | null) => void;
  setGraph: (v: InsightGraph | null) => void;
  setEvidence: (v: Record<MetricDomain, MetricEvidence> | null) => void;
  setFlatEvidenceState: (v: Evidence[]) => void;
  setInsights: (v: StrategicInsight[]) => void;
  setOpportunities: (v: any[]) => void;
  setNarrative: (v: StrategicNarrative | null) => void;
  setDiagnostic: (v: StrategicDiagnostic | null) => void;
  setScenarioComparison: (v: ScenarioComparison | null) => void;
  setSensitivityReports: (v: SensitivityReport[]) => void;
  setDeepenedOpportunities: (v: DeepenedOpportunity[]) => void;
  setMorphologicalZones: (v: OpportunityZone[]) => void;
  setMorphologicalVectors: (v: OpportunityVector[]) => void;
  setConstraintInversions: (v: ConstraintInversion[]) => void;
  setSecondOrderUnlocks: (v: SecondOrderUnlock[]) => void;
  setTemporalUnlocks: (v: TemporalUnlock[]) => void;
  setCompetitiveGaps: (v: CompetitiveGap[]) => void;
  setIsComputing: (v: boolean) => void;
  setHasRun: (v: boolean) => void;
  setProductConstraints: (v: ConstraintSelectionResult[]) => void;
  setProductOpportunities: (v: ProductOpportunity[]) => void;
  setProductActionPlan: (v: ProductAction[]) => void;
}
