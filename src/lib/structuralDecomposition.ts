/**
 * STRUCTURAL DECOMPOSITION TYPES
 *
 * Mode-specific primitive decomposition — the true first-principles layer.
 * Each mode decomposes into its irreducible structural primitives BEFORE
 * any pattern recognition, friction analysis, or opportunity identification.
 *
 * Product  → Job, Components, Tech Primitives, Cost Drivers, Physical Constraints
 * Service  → Outcome, Tasks, Labor, Tools, Coordination, Time Constraints
 * Business → Value Creation, Value Capture, Cost Structure, Distribution, Scaling Constraints
 *
 * SYSTEM DYNAMICS (shared across all modes):
 * → Failure Modes, Feedback Loops, Bottlenecks, Control Points, Substitution Paths
 *
 * LEVERAGE ANALYSIS (shared across all modes):
 * → Dependency Graph, Leverage Primitives (ranked by disruption potential)
 */

// ═══════════════════════════════════════════════════════════════
//  SHARED PRIMITIVES
// ═══════════════════════════════════════════════════════════════

export interface StructuralPrimitive {
  id: string;
  label: string;
  description: string;
  isIrreducible: boolean; // true = cannot be decomposed further
  dependencies: string[]; // ids of primitives this depends on
}

export interface ConstraintPrimitive {
  id: string;
  constraint: string;
  type: "physics" | "economics" | "regulation" | "behavior" | "technology" | "time" | "coordination";
  bindingStrength: number; // 1-10, how hard this is to remove
  challengeable: boolean;
}

// ═══════════════════════════════════════════════════════════════
//  SYSTEM DYNAMICS — How the system behaves, fails, and evolves
// ═══════════════════════════════════════════════════════════════

export interface FailureMode {
  id: string;
  component: string;        // which primitive fails
  mode: string;              // how it fails
  cascadeEffect: string;     // what breaks downstream
  frequency: "rare" | "occasional" | "frequent";
  detectability: "obvious" | "hidden" | "delayed";
}

export interface FeedbackLoop {
  id: string;
  name: string;
  type: "reinforcing" | "balancing";
  components: string[];      // primitive ids involved
  mechanism: string;
  strength: "weak" | "moderate" | "strong";
}

export interface Bottleneck {
  id: string;
  location: string;          // which primitive
  throughputLimit: string;
  cause: string;
  workaround: string;
}

export interface ControlPoint {
  id: string;
  point: string;
  leverageType: "gatekeeping" | "pricing" | "quality" | "access" | "information";
  controller: string;
  switchability: "locked" | "negotiable" | "open";
}

export interface SubstitutionPath {
  id: string;
  target: string;            // primitive being replaced
  substitute: string;
  feasibility: "ready" | "emerging" | "theoretical";
  tradeoff: string;
}

export interface SystemDynamics {
  failureModes: FailureMode[];
  feedbackLoops: FeedbackLoop[];
  bottlenecks: Bottleneck[];
  controlPoints: ControlPoint[];
  substitutionPaths: SubstitutionPath[];
}

// ═══════════════════════════════════════════════════════════════
//  LEVERAGE ANALYSIS — Which primitives have highest disruption potential
// ═══════════════════════════════════════════════════════════════

export interface DependencyEdge {
  from: string; // primitive id
  to: string;   // primitive id
  relationship: "depends_on" | "enables" | "constrains" | "feeds";
}

export interface LeveragePrimitive {
  primitiveId: string;
  primitiveLabel: string;
  bindingStrength: number;      // 1-10, how tightly it locks the system
  cascadeReach: number;         // 1-10, how many downstream components break
  challengeability: number;     // 1-10, how feasible to change now
  leverageScore: number;        // computed: (binding*0.4 + cascade*0.4 + challenge*0.2)
  bestTransformation: "elimination" | "substitution" | "reordering" | "aggregation";
  reasoning: string;
}

export interface LeverageAnalysis {
  dependencyGraph: DependencyEdge[];
  leveragePrimitives: LeveragePrimitive[];
}

// ═══════════════════════════════════════════════════════════════
//  STRUCTURAL TRANSFORMATIONS — Systematic inversion types
// ═══════════════════════════════════════════════════════════════

export interface StructuralTransformation {
  id: string;
  targetPrimitiveId: string;
  targetPrimitiveLabel: string;
  transformationType: "elimination" | "substitution" | "reordering" | "aggregation";
  currentState: string;
  proposedState: string;
  mechanism: string;
  valueCreated: string;
  valueLost: string;
  viabilityGate: ViabilityGate;
  filtered: boolean;  // true = failed viability, excluded from redesign
}

export interface ViabilityGate {
  technical: ViabilityDimension;
  economic: ViabilityDimension;
  regulatory: ViabilityDimension;
  behavioral: ViabilityDimension;
  compositeScore: number; // 1-5 weighted average
  verdict: "pass" | "conditional" | "fail";
}

export interface ViabilityDimension {
  score: number; // 1-5
  reasoning: string;
}

// ═══════════════════════════════════════════════════════════════
//  TRANSFORMATION CLUSTERING — Group compatible transformations
// ═══════════════════════════════════════════════════════════════

export interface TransformationCluster {
  id: string;
  name: string;
  description: string;
  transformationIds: string[];
  compatibilityNote: string;
  strategicPowerScore: number; // leverageScore × viabilityScore
}

// ═══════════════════════════════════════════════════════════════
//  PRODUCT DECOMPOSITION
// ═══════════════════════════════════════════════════════════════

export interface ProductDecomposition {
  mode: "product";
  jobToBeDone: {
    coreJob: string;
    functionalNeeds: string[];
    emotionalNeeds: string[];
    socialNeeds: string[];
  };
  functionalComponents: StructuralPrimitive[];
  technologyPrimitives: {
    id: string;
    technology: string;
    role: string;
    maturityLevel: "mature" | "emerging" | "frontier";
    alternatives: string[];
  }[];
  costDrivers: {
    id: string;
    driver: string;
    category: "materials" | "manufacturing" | "labor" | "logistics" | "IP" | "compliance" | "overhead";
    proportionEstimate: string;
    reducible: boolean;
  }[];
  physicalConstraints: ConstraintPrimitive[];
  systemDynamics: SystemDynamics;
  leverageAnalysis?: LeverageAnalysis;
}

// ═══════════════════════════════════════════════════════════════
//  SERVICE DECOMPOSITION
// ═══════════════════════════════════════════════════════════════

export interface ServiceDecomposition {
  mode: "service";
  outcome: {
    promisedOutcome: string;
    actualOutcome: string;
    outcomeMeasurability: "quantifiable" | "qualitative" | "mixed";
    timeToValue: string;
  };
  taskGraph: {
    id: string;
    task: string;
    performer: "provider" | "customer" | "system" | "third_party";
    sequencePosition: number;
    parallelizable: boolean;
    eliminable: boolean;
    dependsOn: string[];
  }[];
  laborInputs: {
    id: string;
    role: string;
    skillLevel: "commodity" | "skilled" | "expert" | "specialist";
    scarcity: "abundant" | "moderate" | "scarce";
    automatable: boolean;
    costWeight: string;
  }[];
  tools: {
    id: string;
    tool: string;
    purpose: string;
    ownershipModel: "provider_owned" | "customer_owned" | "shared" | "platform";
    substitutable: boolean;
  }[];
  coordinationRequirements: {
    id: string;
    requirement: string;
    parties: string[];
    complexity: "simple" | "moderate" | "complex";
    failureMode: string;
  }[];
  timeConstraints: ConstraintPrimitive[];
  systemDynamics: SystemDynamics;
  leverageAnalysis?: LeverageAnalysis;
}

// ═══════════════════════════════════════════════════════════════
//  BUSINESS MODEL DECOMPOSITION
// ═══════════════════════════════════════════════════════════════

export interface BusinessModelDecomposition {
  mode: "business";
  valueCreation: {
    mechanism: string;
    coreActivity: string;
    keyResources: string[];
    valueChainPosition: string;
    defensibility: string;
  };
  valueCapture: {
    mechanism: string;
    pricingModel: string;
    willingness_to_pay_driver: string;
    captureEfficiency: string;
    leakagePoints: string[];
  };
  costStructure: {
    fixedCosts: { item: string; proportion: string; reducible: boolean }[];
    variableCosts: { item: string; scalingBehavior: string; unitEconomics: string }[];
    costAdvantage: string;
    breakEvenDynamics: string;
  };
  distribution: {
    channels: { channel: string; reachEfficiency: string; cost: string; control: "owned" | "rented" | "shared" }[];
    customerAcquisition: string;
    networkEffects: string;
    switchingCosts: string;
  };
  scalingConstraints: ConstraintPrimitive[];
  systemDynamics: SystemDynamics;
  leverageAnalysis?: LeverageAnalysis;
}

// ═══════════════════════════════════════════════════════════════
//  UNION TYPE
// ═══════════════════════════════════════════════════════════════

export type StructuralDecompositionData =
  | ProductDecomposition
  | ServiceDecomposition
  | BusinessModelDecomposition;
