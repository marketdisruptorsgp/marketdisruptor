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
  first_principles: ["minimum_viable_system", "causal_model", "fundamental_constraints", "viability_assumptions"],
  friction_tiers: ["tier_1", "tier_2", "tier_3"],
  constraint_map: ["binding_constraint_id", "dominance_proof", "counterfactual_removal_result"],
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

  const present = required.filter(f => {
    const val = artifact[f];
    if (val === null || val === undefined) return false;
    if (Array.isArray(val) && val.length === 0) return false;
    return true;
  });
  const missing = required.filter(f => !present.includes(f));
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
