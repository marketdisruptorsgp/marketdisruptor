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
//  PRODUCT DECOMPOSITION
// ═══════════════════════════════════════════════════════════════

export interface ProductDecomposition {
  mode: "product";
  jobToBeDone: {
    coreJob: string; // "When I [situation], I want to [motivation], so I can [outcome]"
    functionalNeeds: string[];
    emotionalNeeds: string[];
    socialNeeds: string[];
  };
  functionalComponents: StructuralPrimitive[];
  technologyPrimitives: {
    id: string;
    technology: string;
    role: string; // what it enables
    maturityLevel: "mature" | "emerging" | "frontier";
    alternatives: string[]; // what could replace it
  }[];
  costDrivers: {
    id: string;
    driver: string;
    category: "materials" | "manufacturing" | "labor" | "logistics" | "IP" | "compliance" | "overhead";
    proportionEstimate: string; // e.g., "~30% of unit cost"
    reducible: boolean;
  }[];
  physicalConstraints: ConstraintPrimitive[];
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
}

// ═══════════════════════════════════════════════════════════════
//  BUSINESS MODEL DECOMPOSITION
// ═══════════════════════════════════════════════════════════════

export interface BusinessModelDecomposition {
  mode: "business";
  valueCreation: {
    mechanism: string; // how value is actually created
    coreActivity: string;
    keyResources: string[];
    valueChainPosition: string; // where in the industry value chain
    defensibility: string;
  };
  valueCapture: {
    mechanism: string; // how value is captured as revenue
    pricingModel: string;
    willingness_to_pay_driver: string;
    captureEfficiency: string; // what % of value created is captured
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
}

// ═══════════════════════════════════════════════════════════════
//  UNION TYPE
// ═══════════════════════════════════════════════════════════════

export type StructuralDecompositionData =
  | ProductDecomposition
  | ServiceDecomposition
  | BusinessModelDecomposition;
