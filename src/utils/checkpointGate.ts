/**
 * CHECKPOINT-GATED PIPELINE VALIDATION
 * Configurable block/warn behavior for governed reasoning.
 */

export type GateBehavior = "hard_block" | "soft_warning" | "configurable";
export type GateResult = "pass" | "warn" | "block";

export interface CheckpointValidation {
  step_id: string;
  result: GateResult;
  required_fields: string[];
  present_fields: string[];
  missing_fields: string[];
  blocking_reason: string | null;
  /** Whether the user explicitly acknowledged and overrode */
  user_override: boolean;
}

/** Fields required by each governed step */
const STEP_REQUIREMENTS: Record<string, string[]> = {
  domain_confirmation: ["system_type", "outcome_mechanism", "success_condition", "domain_lock"],
  objective_definition: ["measurable_outcome_targets", "success_independent_of_current_solution", "decision_criteria"],
  first_principles: ["minimum_viable_system", "causal_model", "fundamental_constraints", "viability_assumptions"],
  friction_map: ["friction_id", "dimension_classification", "root_cause", "impacted_outcome"],
  friction_tiers: ["tier_1", "tier_2", "tier_3"],
  constraint_map: ["binding_constraint_id", "dominance_proof", "counterfactual_removal_result"],
  structural_analysis: ["system_structure_model", "constraint_interaction_map", "structural_failure_modes"],
  leverage_map: ["lever_id", "target_constraint_id", "mechanism_of_relief"],
  constraint_driven_solution: ["solution_id", "constraint_linkage_id", "transformation_mechanism", "minimum_viable_intervention"],
  falsification: ["falsification_conditions", "model_fragility_score"],
  decision_synthesis: ["decision_grade", "confidence_score", "blocking_uncertainties", "fastest_validation_experiment"],
};

/** Current global gate behavior — default configurable */
let currentGateBehavior: GateBehavior = "configurable";
const userOverrides = new Set<string>();

export function setGateBehavior(behavior: GateBehavior): void {
  currentGateBehavior = behavior;
}

export function getGateBehavior(): GateBehavior {
  return currentGateBehavior;
}

/** Mark a step as user-overridden */
export function acknowledgeGateOverride(stepId: string): void {
  userOverrides.add(stepId);
}

/** Deep validity check — rejects empty strings, empty arrays, null, undefined, empty objects */
function isFieldValid(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string" && value.trim() === "") return false;
  if (Array.isArray(value) && value.length === 0) return false;
  if (typeof value === "object" && !Array.isArray(value) && Object.keys(value as object).length === 0) return false;
  return true;
}

/** Validate a governed artifact against its checkpoint requirements */
export function validateCheckpoint(
  stepId: string,
  artifact: Record<string, unknown> | null | undefined
): CheckpointValidation {
  const required = STEP_REQUIREMENTS[stepId] || [];
  
  if (!artifact) {
    const result = resolveGateResult(stepId, true);
    return {
      step_id: stepId,
      result,
      required_fields: required,
      present_fields: [],
      missing_fields: required,
      blocking_reason: `Step "${stepId}" has no artifact data`,
      user_override: userOverrides.has(stepId),
    };
  }

  const present = required.filter(f => isFieldValid(artifact[f]));
  const missing = required.filter(f => !isFieldValid(artifact[f]));
  const hasMissing = missing.length > 0;
  const result = resolveGateResult(stepId, hasMissing);

  return {
    step_id: stepId,
    result,
    required_fields: required,
    present_fields: present,
    missing_fields: missing,
    blocking_reason: hasMissing ? `Missing: ${missing.join(", ")}` : null,
    user_override: userOverrides.has(stepId),
  };
}

function resolveGateResult(stepId: string, hasMissing: boolean): GateResult {
  if (!hasMissing) return "pass";
  
  switch (currentGateBehavior) {
    case "hard_block":
      return "block";
    case "soft_warning":
      return "warn";
    case "configurable":
      // Configurable: block by default, but allow override
      return userOverrides.has(stepId) ? "warn" : "block";
    default:
      return "block";
  }
}

/** Validate multiple checkpoints for the full pipeline */
export function validatePipelineCheckpoints(
  governedData: Record<string, Record<string, unknown> | null | undefined>
): CheckpointValidation[] {
  const steps = Object.keys(STEP_REQUIREMENTS);
  return steps.map(stepId => validateCheckpoint(stepId, governedData[stepId] || null));
}

/** Check if downstream execution is allowed after a step */
export function isDownstreamAllowed(stepId: string, governedData: Record<string, unknown> | null | undefined): boolean {
  const validation = validateCheckpoint(stepId, governedData as Record<string, unknown>);
  return validation.result !== "block";
}

/** 
 * DEPENDENCY GRAPH: Maps each step to its required upstream governed artifacts.
 * If an upstream artifact changes, dependent steps must be invalidated.
 */
export const GOVERNED_DEPENDENCY_GRAPH: Record<string, string[]> = {
  objective_definition: ["domain_confirmation"],
  first_principles: ["domain_confirmation", "objective_definition"],
  friction_map: ["first_principles"],
  friction_tiers: ["friction_map"],
  constraint_map: ["friction_tiers"],
  structural_analysis: ["constraint_map"],
  leverage_map: ["constraint_map", "structural_analysis"],
  constraint_driven_solution: ["constraint_map", "leverage_map"],
  falsification: ["constraint_driven_solution"],
  decision_synthesis: ["constraint_map", "falsification"],
};

/**
 * Given a changed step, return all downstream steps that must be invalidated.
 */
export function getInvalidatedSteps(changedStep: string): string[] {
  const invalidated: string[] = [];
  const queue = [changedStep];
  const visited = new Set<string>();
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);
    
    // Find all steps that depend on `current`
    for (const [step, deps] of Object.entries(GOVERNED_DEPENDENCY_GRAPH)) {
      if (deps.includes(current) && !visited.has(step)) {
        invalidated.push(step);
        queue.push(step);
      }
    }
  }
  
  return invalidated;
}

/**
 * Validate governed checkpoint before persistence.
 * Returns whether the data should be persisted.
 */
export function validateBeforePersistence(
  stepKey: string,
  data: unknown,
  governedData?: Record<string, unknown>
): { allowed: boolean; reason: string | null; invalidatedSteps: string[] } {
  // Only validate governed step keys
  if (!STEP_REQUIREMENTS[stepKey] && !isGovernedStepData(stepKey, data)) {
    return { allowed: true, reason: null, invalidatedSteps: [] };
  }

  // If this is a governed step, validate the checkpoint
  if (STEP_REQUIREMENTS[stepKey]) {
    const validation = validateCheckpoint(stepKey, data as Record<string, unknown>);
    if (validation.result === "block") {
      return { 
        allowed: false, 
        reason: validation.blocking_reason, 
        invalidatedSteps: [] 
      };
    }
  }

  // Calculate what downstream steps need invalidation
  const invalidatedSteps = getInvalidatedSteps(stepKey);

  return { allowed: true, reason: null, invalidatedSteps };
}

/** Check if data contains governed sub-structure */
function isGovernedStepData(stepKey: string, data: unknown): boolean {
  if (typeof data !== "object" || data === null) return false;
  const d = data as Record<string, unknown>;
  return !!d.governed || !!d._governedValidation;
}
