/* =========================================================
   STEP-SPECIFIC VISUAL TYPE DEFINITIONS
   Each analysis step has a distinct visual grammar.
   ========================================================= */

export type AnalysisStep =
  | "report"        // Step 2: Intelligence Report
  | "disrupt"       // Step 3: Disrupt / Flip
  | "redesign"      // Step 4: Redesign
  | "stressTest"    // Step 5: Stress Test
  | "pitchDeck"     // Step 6: Pitch Deck
  | "firstPrinciples"
  | "businessModel"
  | "criticalValidation"
  | "generic";

export type StepVisualType =
  | "structural_system_model"
  | "assumption_lever_map"
  | "solution_architecture"
  | "adversarial_arena"
  | "pitch_summary"
  | "generic_model";

export interface StepVisualConfig {
  type: StepVisualType;
  question: string;
  label: string;
}

export const STEP_VISUAL_CONFIG: Record<AnalysisStep, StepVisualConfig> = {
  report: {
    type: "structural_system_model",
    question: "What structure actually governs this system?",
    label: "Structural System Model",
  },
  disrupt: {
    type: "assumption_lever_map",
    question: "Which assumptions hold the system in place?",
    label: "Assumption Lever Map",
  },
  redesign: {
    type: "solution_architecture",
    question: "What configuration produces superior outcomes?",
    label: "Solution Architecture",
  },
  stressTest: {
    type: "adversarial_arena",
    question: "Does the idea survive intelligent opposition?",
    label: "Adversarial Arena",
  },
  pitchDeck: {
    type: "pitch_summary",
    question: "Is this investment-grade?",
    label: "Investment Summary",
  },
  firstPrinciples: {
    type: "structural_system_model",
    question: "What are the fundamental structural forces?",
    label: "First Principles Model",
  },
  businessModel: {
    type: "solution_architecture",
    question: "How does value flow through this system?",
    label: "Business System Architecture",
  },
  criticalValidation: {
    type: "adversarial_arena",
    question: "What survives critical scrutiny?",
    label: "Validation Arena",
  },
  generic: {
    type: "generic_model",
    question: "What matters most?",
    label: "Intelligence Model",
  },
};

export function getStepVisualConfig(step?: AnalysisStep): StepVisualConfig {
  return STEP_VISUAL_CONFIG[step || "generic"];
}
