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
  disrupt: {
    requires: ["intelData"],
    produces: ["assumptions", "flippedIdeas", "challengeMap"],
  },
  redesign: {
    requires: ["disrupt"],
    produces: ["concepts", "illustrations"],
  },
  stressTest: {
    requires: ["disrupt"],
    produces: ["redTeam", "greenTeam", "verdict"],
  },
  pitchDeck: {
    requires: ["intelData"],
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
const SYSTEM_KEYS = new Set(["userScores", "outdatedSteps", "previousSnapshot", "projectNotes"]);

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
