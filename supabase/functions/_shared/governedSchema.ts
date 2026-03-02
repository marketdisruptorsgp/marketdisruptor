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
  missing_fields?: string[];
}

/* ── Step 1: Domain Confirmation ── */
export interface DomainConfirmation {
  system_type: "product" | "service" | "business_model";
  outcome_mechanism: string;
  success_condition: string;
  domain_lock: boolean;
}

/* ── Step 2: Objective Definition ── */
export interface ObjectiveDefinition {
  measurable_outcome_targets: string[];
  success_independent_of_current_solution: string;
  decision_criteria: string[];
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

/* ── Step 4: Friction Map (standalone artifact) ── */
export interface FrictionMapItem {
  friction_id: string;
  dimension_classification: string;
  root_cause: string;
  impacted_outcome: string;
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

/* ── Step 7: Structural Analysis ── */
export interface StructuralAnalysis {
  system_structure_model: string;
  constraint_interaction_map: string[];
  structural_failure_modes: string[];
}

/* ── Step 8: Leverage Map ── */
export interface LeverageMapItem {
  lever_id: string;
  target_constraint_id: string;
  mechanism_of_relief: string;
  confidence_level: string;
  evidence_that_would_change_assessment: string;
}

/* ── Step 9: Constraint-Driven Solution ── */
export interface ConstraintDrivenSolution {
  solution_id: string;
  constraint_linkage_id: string;
  transformation_mechanism: string;
  minimum_viable_intervention: string;
  expected_constraint_relief: string;
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

/* ── Reasoning Synopsis ── */
export interface CausalRelationship {
  cause: string;
  effect: string;
  mechanism: string;
}

export interface DecisionDriver {
  factor: string;
  weight: "high" | "medium";
  rationale: string;
}

export interface ReasoningSynopsis {
  problem_framing: {
    objective_interpretation: string;
    success_criteria: string[];
  };
  lens_influence: {
    lens_name: string;
    prioritized_factors: string[];
    deprioritized_factors: string[];
    alternative_lens_impact: string;
  };
  evaluation_path: {
    dimensions_examined: string[];
    evaluation_logic: string;
  };
  core_causal_logic: {
    primary_relationships: CausalRelationship[];
    dominant_mechanism: string;
  };
  decision_drivers: DecisionDriver[];
  confidence_sensitivity: {
    overall_confidence: "high" | "medium" | "low";
    confidence_score: number;
    most_sensitive_variable: string;
    sensitivity_explanation?: string;
  };
}

/* ── Governed Output Wrapper ── */
export interface GovernedOutput<T> {
  artifact: T;
  validation: ValidationObject;
  domain_confirmation?: DomainConfirmation;
  objective_definition?: ObjectiveDefinition;
  first_principles?: FirstPrinciplesArtifact;
  friction_map?: FrictionMapItem[];
  friction_tiers?: FrictionTierClassification;
  constraint_map?: ConstraintMap;
  structural_analysis?: StructuralAnalysis;
  leverage_map?: LeverageMapItem[];
  constraint_driven_solution?: ConstraintDrivenSolution;
  falsification?: FalsificationProtocol;
  decision_synthesis?: DecisionSynthesisArtifact;
  reasoning_synopsis?: ReasoningSynopsis;
}

/* ── Deep Field Validity Check ── */
function isFieldValid(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string" && value.trim() === "") return false;
  if (Array.isArray(value) && value.length === 0) return false;
  if (typeof value === "object" && !Array.isArray(value) && Object.keys(value as object).length === 0) return false;
  return true;
}

/* ── Validation Helpers ── */

export function buildValidationObject(
  stepId: string,
  artifact: Record<string, unknown>,
  requiredFields: string[]
): ValidationObject {
  const missing = requiredFields.filter(f => !isFieldValid(artifact[f]));
  return {
    step_id: stepId,
    required_fields_present: missing.length === 0,
    validation_passed: missing.length === 0,
    blocking_reason_if_any: missing.length > 0
      ? `Missing required fields: ${missing.join(", ")}`
      : null,
    missing_fields: missing.length > 0 ? missing : undefined,
  };
}

/**
 * Deep validate nested governed sub-objects.
 * E.g. constraint_map must have non-empty binding_constraint_id, non-empty dominance_proof, etc.
 */
export function deepValidateGoverned(governed: Record<string, unknown>): ValidationObject {
  const errors: string[] = [];

  // constraint_map deep checks
  const cm = governed.constraint_map as Record<string, unknown> | undefined;
  if (cm) {
    if (!isFieldValid(cm.binding_constraint_id)) errors.push("constraint_map.binding_constraint_id is empty");
    if (!isFieldValid(cm.dominance_proof)) errors.push("constraint_map.dominance_proof is empty");
    if (!isFieldValid(cm.counterfactual_removal_result)) errors.push("constraint_map.counterfactual_removal_result is empty");
  }

  // decision_synthesis deep checks
  const ds = governed.decision_synthesis as Record<string, unknown> | undefined;
  if (ds) {
    if (!isFieldValid(ds.decision_grade)) errors.push("decision_synthesis.decision_grade is empty");
    if (ds.confidence_score === null || ds.confidence_score === undefined) errors.push("decision_synthesis.confidence_score is missing");
    // Evidence governance: confidence > 80 requires verified evidence
    const confidence = ds.confidence_score as number;
    if (confidence > 80) {
      // Check if viability_assumptions exist with verified status
      const fp = governed.first_principles as Record<string, unknown> | undefined;
      const assumptions = (fp?.viability_assumptions as Array<{ evidence_status: string }>) || [];
      const hasVerified = assumptions.some(a => a.evidence_status === "verified");
      if (!hasVerified) errors.push("confidence_score > 80 requires at least one verified evidence source");
    }
  }

  // falsification deep checks
  const f = governed.falsification as Record<string, unknown> | undefined;
  if (f) {
    if (!isFieldValid(f.falsification_conditions)) errors.push("falsification.falsification_conditions is empty");
    if (f.model_fragility_score === null || f.model_fragility_score === undefined) errors.push("falsification.model_fragility_score is missing");
  }

  // friction_tiers deep checks
  const ft = governed.friction_tiers as Record<string, unknown> | undefined;
  if (ft) {
    if (!isFieldValid(ft.tier_1)) errors.push("friction_tiers.tier_1 is empty");
  }

  return {
    step_id: "deep_validation",
    required_fields_present: errors.length === 0,
    validation_passed: errors.length === 0,
    blocking_reason_if_any: errors.length > 0 ? errors.join("; ") : null,
    missing_fields: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Cross-step linkage validation.
 * Verifies constraint_linkage_id references exist in upstream friction tiers.
 */
export function validateCrossStepLinkage(
  linkageId: string,
  upstreamFrictionTiers: Record<string, unknown> | undefined
): { valid: boolean; error: string | null } {
  if (!linkageId || linkageId.trim() === "") {
    return { valid: false, error: "constraint_linkage_id is empty" };
  }
  if (!upstreamFrictionTiers) {
    return { valid: false, error: "No upstream friction_tiers available for cross-referencing" };
  }

  const tiers = upstreamFrictionTiers as {
    tier_1?: Array<{ friction_id: string }>;
    tier_2?: Array<{ friction_id: string }>;
    tier_3?: Array<{ friction_id: string }>;
  };

  const allFrictionIds = [
    ...(tiers.tier_1 || []).map(t => t.friction_id),
    ...(tiers.tier_2 || []).map(t => t.friction_id),
    ...(tiers.tier_3 || []).map(t => t.friction_id),
  ];

  if (!allFrictionIds.includes(linkageId)) {
    return { valid: false, error: `constraint_linkage_id "${linkageId}" not found in upstream friction tiers (available: ${allFrictionIds.join(", ")})` };
  }

  return { valid: true, error: null };
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
  "objective_definition": {
    "measurable_outcome_targets": ["target1", "target2"],
    "success_independent_of_current_solution": "success criteria that don't depend on any specific solution",
    "decision_criteria": ["criterion1", "criterion2"]
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
  "friction_map": [
    {"friction_id": "f1", "dimension_classification": "cost|time|adoption|scale|reliability|risk", "root_cause": "why this friction exists", "impacted_outcome": "what outcome this blocks"}
  ],
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
    "dominance_proof": "why this constraint dominates over alternatives — MUST compare against at least 2 other constraints",
    "counterfactual_removal_result": "what changes if this constraint is removed — be specific",
    "next_binding_constraint": "what becomes limiting next"
  },
  "structural_analysis": {
    "system_structure_model": "description of the system's structural architecture",
    "constraint_interaction_map": ["interaction1", "interaction2"],
    "structural_failure_modes": ["failure_mode1", "failure_mode2"]
  },
  "leverage_map": [
    {"lever_id": "l1", "target_constraint_id": "f1", "mechanism_of_relief": "how this lever relieves the constraint", "confidence_level": "high|medium|exploratory", "evidence_that_would_change_assessment": "what evidence would invalidate this lever"}
  ],
  "decision_synthesis": {
    "decision_grade": "decision_grade|conditional|blocked",
    "confidence_score": 55,
    "blocking_uncertainties": ["uncertainty1"],
    "fastest_validation_experiment": "description",
    "next_required_evidence": "what evidence is needed next"
  },
  "reasoning_synopsis": {
    "problem_framing": {"objective_interpretation": "how you interpreted the objective", "success_criteria": ["criterion1"]},
    "lens_influence": {"lens_name": "Default or lens name", "prioritized_factors": ["factor1"], "deprioritized_factors": ["factor2"], "alternative_lens_impact": "how conclusion might differ"},
    "evaluation_path": {"dimensions_examined": ["dim1", "dim2"], "evaluation_logic": "why this order"},
    "core_causal_logic": {"primary_relationships": [{"cause": "X", "effect": "Y", "mechanism": "how"}], "dominant_mechanism": "primary pathway"},
    "decision_drivers": [{"factor": "key observation", "weight": "high|medium", "rationale": "why it matters"}],
    "confidence_sensitivity": {"overall_confidence": "high|medium|low", "confidence_score": 65, "most_sensitive_variable": "variable", "sensitivity_explanation": "what changes"}
  }
}

EVIDENCE GOVERNANCE RULES:
- Every viability_assumption MUST have evidence_status: "verified" (real data), "modeled" (inferred), or "speculative" (assumption)
- confidence_score > 80 REQUIRES at least one "verified" evidence source
- assumption-only chains CANNOT produce decision_grade "decision_grade" — use "conditional" or "blocked"
- dominance_proof MUST compare the binding constraint against at least 2 alternatives`,

    "critical-validation": `
GOVERNED OUTPUT REQUIREMENT — In addition to your primary output, include these structured fields:
"governed": {
  "falsification": {
    "falsification_conditions": ["specific condition that would prove this model wrong"],
    "redesign_invalidation_evidence": ["evidence that would invalidate the proposed redesign"],
    "adoption_failure_conditions": ["conditions under which adoption fails"],
    "economic_collapse_scenario": "specific scenario where unit economics collapse",
    "model_fragility_score": 45
  },
  "constraint_driven_solution": {
    "solution_id": "s1",
    "constraint_linkage_id": "f1",
    "transformation_mechanism": "how this solution transforms the constraint",
    "minimum_viable_intervention": "smallest possible intervention that tests this",
    "expected_constraint_relief": "what relief is expected from this solution"
  },
  "decision_synthesis": {
    "decision_grade": "decision_grade|conditional|blocked",
    "confidence_score": 55,
    "blocking_uncertainties": ["uncertainty1"],
    "fastest_validation_experiment": "cheapest way to test viability — under $500, specific method",
    "next_required_evidence": "what evidence is needed"
  },
  "reasoning_synopsis": {
    "problem_framing": {"objective_interpretation": "how you interpreted the objective", "success_criteria": ["criterion1"]},
    "lens_influence": {"lens_name": "Default or lens name", "prioritized_factors": ["factor1"], "deprioritized_factors": ["factor2"], "alternative_lens_impact": "how conclusion might differ"},
    "evaluation_path": {"dimensions_examined": ["dim1", "dim2"], "evaluation_logic": "why this order"},
    "core_causal_logic": {"primary_relationships": [{"cause": "X", "effect": "Y", "mechanism": "how"}], "dominant_mechanism": "primary pathway"},
    "decision_drivers": [{"factor": "key observation", "weight": "high|medium", "rationale": "why it matters"}],
    "confidence_sensitivity": {"overall_confidence": "high|medium|low", "confidence_score": 65, "most_sensitive_variable": "variable", "sensitivity_explanation": "what changes"}
  }
}

EVIDENCE GOVERNANCE RULES:
- confidence_score > 80 requires verified evidence — not modeled or assumed
- If all supporting evidence is "speculative", decision_grade MUST be "blocked"
- model_fragility_score > 70 should trigger decision_grade "conditional" or "blocked"`,

    "generate-flip-ideas": `
GOVERNED OUTPUT REQUIREMENT — For EACH flipped idea, include:
"constraint_linkage": {
  "original_assumption": "the assumption being challenged",
  "structural_inversion": "what structural change this creates",
  "causal_mechanism": "how the flip creates value",
  "constraint_relief_path": "which constraint this relaxes",
  "constraint_linkage_id": "ID linking to a Tier 1 or Tier 2 friction — MUST match an upstream friction_id"
}

EVIDENCE GOVERNANCE:
- Each flip must trace to a specific constraint or friction
- constraint_linkage_id MUST NOT be empty — it must reference an actual friction_id`,

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

    "business-model-analysis": `
GOVERNED OUTPUT REQUIREMENT — In addition to your primary output, include a "governed" object with ALL of the following:
"governed": {
  "domain_confirmation": {
    "system_type": "business_model",
    "outcome_mechanism": "causal transformation this business performs",
    "success_condition": "solution-independent success definition",
    "domain_lock": true
  },
  "objective_definition": {
    "measurable_outcome_targets": ["target1", "target2"],
    "success_independent_of_current_solution": "success criteria independent of any solution",
    "decision_criteria": ["criterion1", "criterion2"]
  },
  "first_principles": {
    "minimum_viable_system": "irreducible system description",
    "causal_model": { "inputs": ["input1"], "mechanism": "core mechanism", "outputs": ["output1"] },
    "fundamental_constraints": ["constraint1", "constraint2"],
    "resource_limits": ["limit1"],
    "behavioral_realities": ["reality1"],
    "dependency_structure": ["dep1"],
    "viability_assumptions": [
      {"assumption": "text", "evidence_status": "verified|modeled|speculative", "leverage_if_wrong": 7}
    ]
  },
  "friction_map": [
    {"friction_id": "f1", "dimension_classification": "cost|time|adoption|scale|reliability|risk", "root_cause": "why", "impacted_outcome": "what"}
  ],
  "friction_tiers": {
    "tier_1": [{"friction_id": "f1", "description": "system-limiting", "system_impact": "impact"}],
    "tier_2": [{"friction_id": "f2", "description": "optimization", "optimization_target": "target"}],
    "tier_3": [{"friction_id": "f3", "description": "observational"}]
  },
  "constraint_map": {
    "causal_chains": [{"friction_id": "f1", "structural_constraint": "root", "system_impact": "effect", "impact_dimension": "cost|time|adoption|scale|reliability|risk"}],
    "binding_constraint_id": "f1",
    "dominance_proof": "comparative evidence",
    "counterfactual_removal_result": "what changes",
    "next_binding_constraint": "what becomes limiting"
  },
  "leverage_map": [
    {"lever_id": "l1", "target_constraint_id": "f1", "mechanism_of_relief": "how", "confidence_level": "high|medium|exploratory", "evidence_that_would_change_assessment": "what"}
  ],
  "decision_synthesis": {
    "decision_grade": "decision_grade|conditional|blocked",
    "confidence_score": 55,
    "blocking_uncertainties": ["uncertainty1"],
    "fastest_validation_experiment": "description",
    "next_required_evidence": "what evidence"
  },
  "reasoning_synopsis": {
    "problem_framing": {"objective_interpretation": "how you interpreted the objective", "success_criteria": ["criterion1"]},
    "lens_influence": {"lens_name": "Default or lens name", "prioritized_factors": ["factor1"], "deprioritized_factors": ["factor2"], "alternative_lens_impact": "how conclusion might differ"},
    "evaluation_path": {"dimensions_examined": ["dim1", "dim2"], "evaluation_logic": "why this order"},
    "core_causal_logic": {"primary_relationships": [{"cause": "X", "effect": "Y", "mechanism": "how"}], "dominant_mechanism": "primary pathway"},
    "decision_drivers": [{"factor": "key observation", "weight": "high|medium", "rationale": "why it matters"}],
    "confidence_sensitivity": {"overall_confidence": "high|medium|low", "confidence_score": 65, "most_sensitive_variable": "variable", "sensitivity_explanation": "what changes"}
  }
}

EVIDENCE GOVERNANCE RULES:
- Every viability_assumption MUST have evidence_status: "verified", "modeled", or "speculative"
- confidence_score > 80 REQUIRES verified evidence
- assumption-only chains CANNOT produce decision_grade "decision_grade"`,
  };

  return schemas[stepId] || "";
}
