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
}

// ═══════════════════════════════════════════════════════════════
//  UNION TYPE
// ═══════════════════════════════════════════════════════════════

export type StructuralDecompositionData =
  | ProductDecomposition
  | ServiceDecomposition
  | BusinessModelDecomposition;
