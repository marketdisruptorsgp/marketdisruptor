/**
 * GOVERNED REASONING SCHEMA
 * Structured output types + validation for the checkpoint-gated pipeline.
 * Every edge function must produce a validation_object alongside its artifact.
 */

/* ── Validation Object (required on every step output) ── */
export interface ValidationObject {
  step_id: string;
  required_fields_present: boolean;
  validation_passed: boolean;
  blocking_reason_if_any: string | null;
}

/* ── Step 1: Domain Confirmation ── */
export interface DomainConfirmation {
  system_type: "product" | "service" | "business_model";
  outcome_mechanism: string;
  success_condition: string;
  domain_lock: boolean;
}

/* ── Step 3: First-Principles Decomposition ── */
export interface FirstPrinciplesArtifact {
  minimum_viable_system: string;
  causal_model: {
    inputs: string[];
    mechanism: string;
    outputs: string[];
  };
  fundamental_constraints: string[];
  resource_limits: string[];
  behavioral_realities: string[];
  dependency_structure: string[];
  viability_assumptions: Array<{
    assumption: string;
    evidence_status: "verified" | "modeled" | "speculative";
    leverage_if_wrong: number; // 1-10
  }>;
}

/* ── Step 5: Friction Tier Qualification ── */
export interface FrictionTierClassification {
  tier_1: Array<{ friction_id: string; description: string; system_impact: string }>;
  tier_2: Array<{ friction_id: string; description: string; optimization_target: string }>;
  tier_3: Array<{ friction_id: string; description: string }>;
}

/* ── Step 6: Constraint Mapping ── */
export interface ConstraintMap {
  causal_chains: Array<{
    friction_id: string;
    structural_constraint: string;
    system_impact: string;
    impact_dimension: "cost" | "time" | "adoption" | "scale" | "reliability" | "risk";
  }>;
  binding_constraint_id: string;
  dominance_proof: string;
  counterfactual_removal_result: string;
  next_binding_constraint: string;
}

/* ── Step 10: Stress Test + Falsification ── */
export interface FalsificationProtocol {
  falsification_conditions: string[];
  redesign_invalidation_evidence: string[];
  adoption_failure_conditions: string[];
  economic_collapse_scenario: string;
  model_fragility_score: number; // 0-100
}

/* ── Step 11: Decision Synthesis ── */
export interface DecisionSynthesisArtifact {
  decision_grade: "decision_grade" | "conditional" | "blocked";
  confidence_score: number; // 0-100
  blocking_uncertainties: string[];
  fastest_validation_experiment: string;
  next_required_evidence: string;
}

/* ── Constraint-Driven Flip ── */
export interface ConstraintDrivenFlip {
  original_assumption: string;
  structural_inversion: string;
  causal_mechanism: string;
  constraint_relief_path: string;
  constraint_linkage_id: string;
}

/* ── Governed Output Wrapper ── */
export interface GovernedOutput<T> {
  artifact: T;
  validation: ValidationObject;
  domain_confirmation?: DomainConfirmation;
  first_principles?: FirstPrinciplesArtifact;
  friction_tiers?: FrictionTierClassification;
  constraint_map?: ConstraintMap;
  falsification?: FalsificationProtocol;
  decision_synthesis?: DecisionSynthesisArtifact;
}

/* ── Validation Helpers ── */

export function buildValidationObject(
  stepId: string,
  artifact: Record<string, unknown>,
  requiredFields: string[]
): ValidationObject {
  const missing = requiredFields.filter(f => !artifact[f] && artifact[f] !== 0 && artifact[f] !== false);
  return {
    step_id: stepId,
    required_fields_present: missing.length === 0,
    validation_passed: missing.length === 0,
    blocking_reason_if_any: missing.length > 0
      ? `Missing required fields: ${missing.join(", ")}`
      : null,
  };
}

/** Prompt injection: adds governed output schema requirements to system prompts */
export function getGovernedSchemaPrompt(stepId: string): string {
  const schemas: Record<string, string> = {
    "first-principles": `
GOVERNED OUTPUT REQUIREMENT — In addition to your primary output, include these structured fields:
"governed": {
  "domain_confirmation": {
    "system_type": "product | service | business_model",
    "outcome_mechanism": "causal transformation description",
    "success_condition": "solution-independent success definition",
    "domain_lock": true
  },
  "first_principles": {
    "minimum_viable_system": "irreducible system description",
    "causal_model": {
      "inputs": ["input1", "input2"],
      "mechanism": "transformation mechanism",
      "outputs": ["output1", "output2"]
    },
    "fundamental_constraints": ["constraint1", "constraint2"],
    "resource_limits": ["limit1"],
    "behavioral_realities": ["reality1"],
    "dependency_structure": ["dependency1"],
    "viability_assumptions": [
      {"assumption": "text", "evidence_status": "verified|modeled|speculative", "leverage_if_wrong": 7}
    ]
  },
  "friction_tiers": {
    "tier_1": [{"friction_id": "f1", "description": "system-limiting friction", "system_impact": "impact"}],
    "tier_2": [{"friction_id": "f2", "description": "optimization target", "optimization_target": "target"}],
    "tier_3": [{"friction_id": "f3", "description": "observational only"}]
  },
  "constraint_map": {
    "causal_chains": [
      {"friction_id": "f1", "structural_constraint": "constraint", "system_impact": "impact", "impact_dimension": "cost|time|adoption|scale|reliability|risk"}
    ],
    "binding_constraint_id": "f1",
    "dominance_proof": "why this constraint dominates over alternatives",
    "counterfactual_removal_result": "what changes if this constraint is removed",
    "next_binding_constraint": "what becomes limiting next"
  },
  "decision_synthesis": {
    "decision_grade": "decision_grade|conditional|blocked",
    "confidence_score": 55,
    "blocking_uncertainties": ["uncertainty1"],
    "fastest_validation_experiment": "description",
    "next_required_evidence": "what evidence is needed next"
  }
}`,
    "critical-validation": `
GOVERNED OUTPUT REQUIREMENT — In addition to your primary output, include these structured fields:
"governed": {
  "falsification": {
    "falsification_conditions": ["condition that would prove this model wrong"],
    "redesign_invalidation_evidence": ["evidence that would invalidate the redesign"],
    "adoption_failure_conditions": ["conditions under which adoption fails"],
    "economic_collapse_scenario": "scenario description",
    "model_fragility_score": 45
  },
  "decision_synthesis": {
    "decision_grade": "decision_grade|conditional|blocked",
    "confidence_score": 55,
    "blocking_uncertainties": ["uncertainty1"],
    "fastest_validation_experiment": "cheapest way to test viability",
    "next_required_evidence": "what evidence is needed"
  }
}`,
    "generate-flip-ideas": `
GOVERNED OUTPUT REQUIREMENT — For EACH flipped idea, include:
"constraint_linkage": {
  "original_assumption": "the assumption being challenged",
  "structural_inversion": "what structural change this creates",
  "causal_mechanism": "how the flip creates value",
  "constraint_relief_path": "which constraint this relaxes",
  "constraint_linkage_id": "ID linking to a Tier 1 or Tier 2 friction"
}`,
    "generate-pitch-deck": `
GOVERNED OUTPUT REQUIREMENT — Include decision synthesis:
"governed": {
  "decision_synthesis": {
    "decision_grade": "decision_grade|conditional|blocked",
    "confidence_score": 55,
    "blocking_uncertainties": ["uncertainty1"],
    "fastest_validation_experiment": "cheapest validation method",
    "next_required_evidence": "what evidence is needed"
  }
}`,
  };

  return schemas[stepId] || "";
}
