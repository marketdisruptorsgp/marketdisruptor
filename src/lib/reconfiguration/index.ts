/**
 * Reconfiguration Pipeline — Public API
 *
 * Stages 2-3 of the 5-stage architecture:
 *   Stage 2: Structural Diagnosis → StructuralProfile
 *   Stage 3: Pattern Qualification → QualifiedPattern[]
 */

export { diagnoseStructuralProfile } from "./structuralProfile";
export type {
  StructuralProfile,
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
} from "./structuralProfile";

export { STRUCTURAL_PATTERNS } from "./patternLibrary";
export type {
  StructuralPattern,
  StrategicBetTemplate,
  QualificationResult,
} from "./patternLibrary";

export { qualifyPatterns, qualifyPatternsWithDiagnostics } from "./patternQualification";
export type { QualifiedPattern } from "./patternQualification";
