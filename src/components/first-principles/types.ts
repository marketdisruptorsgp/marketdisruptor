import type { LucideIcon } from "lucide-react";

export interface CoreReality {
  trueProblem: string;
  actualUsage: string;
  normalizedFrustrations: string[];
  userHacks: string[];
}

export interface FrictionDimensions {
  primaryFriction?: string;
  physicalForm?: string;
  skillBarrier?: string;
  costStructure?: string;
  ecosystemLockIn?: string;
  maintenanceBurden?: string;
  sizeAnalysis?: string;
  weightAnalysis?: string;
  formFactorAnalysis?: string;
  staticVsDynamic?: string;
  ergonomicGaps?: string[];
  dimensionOpportunities?: string[];
  gaps?: string[];
  opportunities?: string[];
  deliveryModel?: string;
}

export interface WorkflowFriction {
  step?: string;
  stepIndex?: number;
  friction: string;
  severity: "high" | "medium" | "low";
  rootCause: string;
}

export interface UserWorkflow {
  stepByStep: string[];
  frictionPoints: WorkflowFriction[];
  cognitiveLoad: string;
  contextOfUse: string;
  workflowOptimizations: string[];
}

export interface MissedTechOpportunity {
  tech: string;
  application: string;
  valueCreated: string;
}

export interface SmartTechAnalysis {
  currentTechLevel: string;
  missedOpportunities: MissedTechOpportunity[];
  whyNotAlreadyDone: string;
  recommendedIntegration: string;
}

export interface HiddenAssumption {
  assumption: string;
  currentAnswer: string;
  reason: "tradition" | "manufacturing" | "cost" | "physics" | "habit";
  isChallengeable: boolean;
  challengeIdea?: string;
  leverageScore?: number;
  dataLabel?: string;
  impactScenario?: string;
  competitiveBlindSpot?: string;
  urgencySignal?: "eroding" | "stable" | "emerging";
  urgencyReason?: string;
}

export interface FlippedLogicItem {
  originalAssumption: string;
  boldAlternative: string;
  rationale: string;
  physicalMechanism: string;
  physicalPrinciple?: string;
  manufacturingMethod?: string;
  certifications?: string[];
  bomEstimate?: string;
  productPrecedent?: string;
}

export interface BomLineItem {
  component: string;
  material: string;
  process: string;
  unitCost: string;
  notes?: string;
}

export interface ProductPrecedent {
  product: string;
  company: string;
  relevance: string;
}

export interface RedesignedConcept {
  conceptName: string;
  tagline: string;
  coreInsight: string;
  radicalDifferences: string[];
  physicalDescription: string;
  sizeAndWeight: string;
  materials: string[];
  smartFeatures: string[];
  userExperienceTransformation: string;
  frictionEliminated: string[];
  whyItHasntBeenDone: string;
  biggestRisk: string;
  manufacturingPath: string;
  pricePoint: string;
  targetUser: string;
  riskLevel?: string;
  capitalRequired?: string;
  bomBreakdown?: BomLineItem[];
  totalBomEstimate?: string;
  certifications?: string[];
  certificationPath?: string;
  prototypeApproach?: string;
  productPrecedents?: ProductPrecedent[];
  dfmNotes?: string;
}

export interface CurrentStrengths {
  whatWorks: string[];
  competitiveAdvantages: string[];
  keepVsAdapt: string;
}

export interface FirstPrinciplesData {
  currentStrengths?: CurrentStrengths;
  coreReality: CoreReality;
  physicalDimensions?: FrictionDimensions;
  frictionDimensions?: FrictionDimensions;
  userWorkflow: UserWorkflow;
  smartTechAnalysis: SmartTechAnalysis;
  hiddenAssumptions: HiddenAssumption[];
  flippedLogic: FlippedLogicItem[];
  redesignedConcept: RedesignedConcept;
  visualSpecs?: import("@/lib/visualContract").VisualSpec[];
  actionPlans?: import("@/lib/visualContract").ActionPlan[];
}

export const REASON_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  tradition: { bg: "hsl(38 92% 50% / 0.1)", text: "hsl(38 92% 35%)", label: "Tradition" },
  manufacturing: { bg: "hsl(217 91% 60% / 0.1)", text: "hsl(217 91% 40%)", label: "Mfg Limits" },
  cost: { bg: "hsl(142 70% 45% / 0.1)", text: "hsl(142 70% 30%)", label: "Cost" },
  physics: { bg: "hsl(271 81% 56% / 0.1)", text: "hsl(271 81% 40%)", label: "Physics" },
  habit: { bg: "hsl(330 80% 55% / 0.1)", text: "hsl(330 80% 40%)", label: "Habit" },
};

export const REASON_BORDER: Record<string, string> = {
  tradition: "hsl(38 92% 50%)",
  manufacturing: "hsl(217 91% 55%)",
  cost: "hsl(142 70% 40%)",
  physics: "hsl(271 81% 50%)",
  habit: "hsl(330 80% 50%)",
};

// ═══════════════════════════════════════════════════════════════
//  INVENTION ENGINE TYPES (Product Mode)
// ═══════════════════════════════════════════════════════════════

export interface ConceptOrigin {
  structural_driver: string;
  assumption_flipped: string;
  enabling_mechanism: string;
}

export interface ConceptBeforeAfter {
  the_old_way: string;
  the_new_way: string;
}

export interface PersonaFitScore {
  fit_score: number;
  rationale: string;
  key_adaptation: string;
}

export interface ConceptPersonaFit {
  garage_inventor?: PersonaFitScore;
  product_company?: PersonaFitScore;
  deep_tech_startup?: PersonaFitScore;
  [key: string]: PersonaFitScore | undefined;
}

export interface ConceptBomItem {
  component: string;
  material: string;
  process: string;
  unitCost: string;
  notes?: string;
}

export interface ConceptPrecedent {
  product: string;
  company: string;
  relevance: string;
}

export interface PerformerMapping {
  category: "university" | "startup" | "national_lab" | "contract_manufacturer" | "component_supplier";
  role: string;
  example_organizations: string[];
  why: string;
}

export interface BreakthroughMetric {
  classification: "step_change" | "incremental";
  magnitude: string;
  current_benchmark: string;
  target_performance: string;
  confidence: "high" | "medium" | "low";
}

export interface SystemArchitectureNode {
  id: string;
  label: string;
  type: "input" | "process" | "output" | "feedback";
}

export interface SystemArchitectureEdge {
  from: string;
  to: string;
  label?: string;
}

export interface SystemArchitecture {
  nodes: SystemArchitectureNode[];
  edges: SystemArchitectureEdge[];
  description: string;
}

export interface InventionConcept {
  name: string;
  tagline: string;
  origin: ConceptOrigin;
  before_after?: ConceptBeforeAfter;
  persona_fit?: ConceptPersonaFit;
  description: string;
  mechanism_description: string;
  materials: string[];
  estimated_bom: ConceptBomItem[];
  manufacturing_path: string;
  certification_considerations: string[];
  precedent_products: ConceptPrecedent[];
  prototype_approach: string;
  dfm_notes: string;
  breakthrough_metric?: BreakthroughMetric;
  performer_network?: PerformerMapping[];
  system_architecture?: SystemArchitecture;
}

export interface ContrarianNarrative {
  industry_blind_spot: string;
  why_blind: string;
  evidence: string;
  unlock_statement: string;
}

export interface ConceptSynthesisResult {
  concepts: InventionConcept[];
  innovation_paths: InnovationPath[];
  contrarian_narrative?: ContrarianNarrative;
}

export interface InnovationPath {
  theme: string;
  description: string;
  structural_pressures: string[];
  concept_indices: number[];
}

export const PERSONA_LENS_META: Record<string, { label: string; emoji: string; description: string }> = {
  garage_inventor: { label: "Garage Inventor", emoji: "🔧", description: "Solo maker, limited budget, basic shop tools" },
  product_company: { label: "Product Company", emoji: "🏭", description: "Established manufacturer with engineering team" },
  deep_tech_startup: { label: "Deep Tech Startup", emoji: "🚀", description: "VC-backed team pushing frontiers" },
};

export interface EngineeringDeepDiveData {
  concept: InventionConcept;
  detailed_bom: ConceptBomItem[];
  materials_deep: { material: string; supplier_types: string[]; cost_range: string; notes: string }[];
  prototype_plan: { phase: string; duration: string; deliverable: string; cost_estimate: string }[];
  manufacturing_process: { step: string; equipment: string; cycle_time: string; notes: string }[];
  supplier_categories: { category: string; examples: string[]; lead_time: string }[];
  regulatory_requirements: { requirement: string; body: string; timeline: string; cost: string }[];
  test_plan: { test: string; method: string; pass_criteria: string; equipment: string }[];
}
