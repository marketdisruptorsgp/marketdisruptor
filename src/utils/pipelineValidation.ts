/**
 * Pipeline Validation — Step contracts, dependency checks, and data integrity.
 *
 * Enforces execution order and validates step data before persistence.
 */

export interface StepContract {
  requires: readonly string[];
  produces: readonly string[];
}

/** Canonical step dependency map — product/service pipeline */
export const STEP_CONTRACTS: Record<string, StepContract> = {
  intelData: {
    requires: [],
    produces: ["overview", "pricing", "supply", "community", "patents"],
  },
  geoOpportunity: {
    requires: [],
    produces: ["usMarkets", "globalMarkets", "businessDensity"],
  },
  disrupt: {
    requires: ["intelData"],
    produces: ["assumptions", "flippedIdeas", "challengeMap"],
  },
  // New split pipeline steps
  transformationEngine: {
    requires: ["intelData"],
    produces: ["assumptions", "flippedIdeas", "challengeMap", "transformations", "clusters", "viability"],
  },
  conceptArchitecture: {
    requires: ["intelData", "transformationEngine"],
    produces: ["concepts", "illustrations"],
  },
  redesign: {
    requires: ["intelData", "disrupt"],
    produces: ["concepts", "illustrations"],
  },
  stressTest: {
    requires: ["intelData", "disrupt"],
    produces: ["redTeam", "greenTeam", "verdict"],
  },
  pitchDeck: {
    requires: ["intelData", "disrupt"],
    produces: ["slides", "elevatorPitch", "metrics"],
  },
  // Business mode variants
  businessAnalysis: {
    requires: [],
    produces: ["modelAnalysis", "unitEconomics", "valueChain"],
  },
  businessStressTest: {
    requires: ["businessAnalysis"],
    produces: ["redTeam", "greenTeam", "verdict"],
  },
  businessPitchDeck: {
    requires: ["businessAnalysis"],
    produces: ["slides", "metrics"],
  },
} as const;

/** Valid step keys for logging */
const VALID_STEP_KEYS = new Set(Object.keys(STEP_CONTRACTS));
// Also allow system keys
const SYSTEM_KEYS = new Set(["userScores", "outdatedSteps", "previousSnapshot", "projectNotes", "insightPreferences", "steeringText", "pitchDeckImages", "pitchDeckExclusions", "activeLensId", "geoOpportunity", "regulatoryContext", "governed", "governedHashes", "domain_confirmation", "objective_definition", "first_principles", "friction_map", "friction_tiers", "constraint_map", "structural_analysis", "leverage_map", "constraint_driven_solution", "falsification", "decision_synthesis", "adaptiveContext", "strategicEngine", "insightGraph", "_lensAdaptation", "_evidenceRegistry", "products", "biExtraction", "competitiveIntel", "decomposition"]);

/**
 * Fail-loud guard: Validates that a section's computation owner matches its UI location.
 * Call this at save time to catch misrouted data.
 */
const STEP_UI_LOCATION: Record<string, number> = {
  intelData: 2,
  disrupt: 3,
  transformationEngine: 3,
  conceptArchitecture: 4,
  redesign: 4,
  stressTest: 5,
  pitchDeck: 6,
  businessAnalysis: 2,
  businessStressTest: 4,
  businessPitchDeck: 5,
};

export function assertStepOwnership(
  stepKey: string,
  callerStep: number | undefined
): void {
  if (!callerStep) return; // Skip if caller doesn't declare step
  const expectedStep = STEP_UI_LOCATION[stepKey];
  if (expectedStep && expectedStep !== callerStep) {
    const msg = `[Pipeline] OWNERSHIP VIOLATION: Step key "${stepKey}" belongs to UI step ${expectedStep} but was saved from step ${callerStep}. Data must be saved by the owning step.`;
    console.error(msg);
    throw new Error(msg);
  }
}

/**
 * Validate step data before persistence.
 * Returns errors if data is invalid.
 */
export function validateStepData(
  stepKey: string,
  data: unknown
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Allow system keys through
  if (SYSTEM_KEYS.has(stepKey)) {
    return { valid: true, errors: [] };
  }

  if (!VALID_STEP_KEYS.has(stepKey)) {
    errors.push(`Unknown step key: "${stepKey}". Valid keys: ${[...VALID_STEP_KEYS].join(", ")}`);
  }

  if (data === null || data === undefined) {
    errors.push(`Step "${stepKey}" received null/undefined data`);
  }

  if (data !== null && data !== undefined && typeof data !== "object" && !Array.isArray(data)) {
    errors.push(`Step "${stepKey}" data must be an object or array, got ${typeof data}`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Check if required dependencies are satisfied before running a step.
 */
export function checkDependencies(
  stepKey: string,
  existingData: Record<string, unknown> | null | undefined
): { satisfied: boolean; missing: string[] } {
  const contract = STEP_CONTRACTS[stepKey];
  if (!contract) {
    return { satisfied: false, missing: [`Unknown step: ${stepKey}`] };
  }

  if (contract.requires.length === 0) {
    return { satisfied: true, missing: [] };
  }

  const data = existingData || {};
  const missing = contract.requires.filter((dep) => !data[dep]);

  return { satisfied: missing.length === 0, missing };
}

/**
 * Get the contract for a step key.
 */
export function getStepContract(stepKey: string): StepContract | null {
  return STEP_CONTRACTS[stepKey] || null;
}

/**
 * Log step execution for debugging.
 */
export function logStepExecution(
  stepKey: string,
  action: "save" | "load" | "validate",
  details?: Record<string, unknown>
): void {
  const timestamp = new Date().toISOString();
  console.log(
    `[Pipeline] ${timestamp} | ${action.toUpperCase()} | step="${stepKey}"`,
    details ? JSON.stringify(details) : ""
  );
}
