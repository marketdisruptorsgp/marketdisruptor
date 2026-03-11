/**
 * Reconfiguration Pipeline — Public API
 *
 * Stages 2-4 of the 5-stage architecture:
 *   Stage 2: Structural Diagnosis → StructuralProfile
 *   Stage 3: Pattern Qualification → QualifiedPattern[]
 *   Stage 4: Opportunity Deepening → DeepenedOpportunity[]
 */

export { diagnoseStructuralProfile } from "./structuralProfile";
export type {
  StructuralProfile,
  DiagnosisLensConfig,
  FragmentationLevel,
  MarginStructure,
  SwitchingCostLevel,
  DistributionControl,
  LaborIntensity,
  RevenueModel,
  CustomerConcentration,
  AssetUtilization,
  RegulatorySensitivity,
  ValueChainPosition,
  OwnerDependencyLevel,
  AcquisitionComplexityLevel,
  ImprovementRunwayLevel,
} from "./structuralProfile";

export { STRUCTURAL_PATTERNS } from "./patternLibrary";
export type {
  StructuralPattern,
  StrategicBetTemplate,
  QualificationResult,
} from "./patternLibrary";

export { qualifyPatterns, qualifyPatternsWithDiagnostics } from "./patternQualification";
export type { QualifiedPattern } from "./patternQualification";

export { deepenOpportunities, deepenOpportunitiesAsync } from "./opportunityDeepening";
export type {
  DeepenedOpportunity,
  CausalChain,
  EconomicMechanism,
  FeasibilityAssessment,
  FeasibilityLevel,
  FirstMove,
  WhyThisMatters,
  StrategicPrecedent,
} from "./opportunityDeepening";

export { STRATEGIC_DIRECTIONS, PRODUCT_DIRECTIONS, selectRelevantDirections, buildDirectionsPromptBlock } from "./strategicDirections";
export type { StrategicDirection, ScoredDirection } from "./strategicDirections";

export { PRECEDENT_LIBRARY, getFallbackPrecedents } from "./precedentLibrary";
export type { PrecedentEntry } from "./precedentLibrary";
