/* =========================================================
   VISUAL STORY COMPILER
   Governed-artifact-driven story selection.
   Uses causal structure from governed data when available,
   falls back to heuristic signal ranking otherwise.
   Step biases preference; structure determines outcome.
   ========================================================= */

import type { RankedSignal, SignalRole, SignalRelationship } from "./signalRanking";
import { inferRelationships } from "./signalRanking";
import { extractFromGoverned } from "./governedSignalExtraction";
import type { AnalysisStep } from "./stepVisualTypes";

export type VisualStoryType =
  | "SURVIVAL_JUDGMENT"
  | "SYSTEM_TENSION"
  | "VALUE_FLOW"
  | "FRAGILITY_STRUCTURE"
  | "CLUSTERED_INTELLIGENCE"
  | "PRIORITIZED_SIGNAL_FIELD";

export type VerdictLevel = "strong" | "conditional" | "weak" | "unknown";

export interface VisualStory {
  type: VisualStoryType;
  label: string;
  description: string;
  strategicQuestion: string;
  verdict: { level: VerdictLevel; summary: string };
  relationships: SignalRelationship[];
  /** Signals grouped by role */
  drivers: RankedSignal[];
  constraints: RankedSignal[];
  mechanisms: RankedSignal[];
  assumptions: RankedSignal[];
  leverages: RankedSignal[];
  outcomes: RankedSignal[];
  /** Top signals used for rendering (3–8) */
  topSignals: RankedSignal[];
}

const STORY_META: Record<VisualStoryType, { label: string; description: string }> = {
  SURVIVAL_JUDGMENT: {
    label: "Survival Judgment",
    description: "Opposing arguments weighed — does the idea survive?",
  },
  SYSTEM_TENSION: {
    label: "System Tension Map",
    description: "Drivers and constraints in structural opposition.",
  },
  VALUE_FLOW: {
    label: "Value Flow Architecture",
    description: "How value moves through interconnected mechanisms.",
  },
  FRAGILITY_STRUCTURE: {
    label: "Fragility Structure",
    description: "Untested assumptions forming dependency chains.",
  },
  CLUSTERED_INTELLIGENCE: {
    label: "Intelligence Landscape",
    description: "Multiple insight themes organized by role and impact.",
  },
  PRIORITIZED_SIGNAL_FIELD: {
    label: "Priority Signal Field",
    description: "Top signals ranked by impact × confidence.",
  },
};

/* ── Step bias weights — preference, not override ── */
const STEP_BIAS: Partial<Record<AnalysisStep, VisualStoryType[]>> = {
  report:             ["SYSTEM_TENSION", "CLUSTERED_INTELLIGENCE"],
  disrupt:            ["FRAGILITY_STRUCTURE", "SYSTEM_TENSION"],
  redesign:           ["VALUE_FLOW", "SYSTEM_TENSION"],
  stressTest:         ["SURVIVAL_JUDGMENT", "SYSTEM_TENSION"],
  criticalValidation: ["SURVIVAL_JUDGMENT", "FRAGILITY_STRUCTURE"],
  businessModel:      ["VALUE_FLOW", "SYSTEM_TENSION"],
  firstPrinciples:    ["SYSTEM_TENSION", "FRAGILITY_STRUCTURE"],
  pitchDeck:          ["VALUE_FLOW", "SURVIVAL_JUDGMENT"],
};

function countByRole(signals: RankedSignal[], role: SignalRole): RankedSignal[] {
  return signals.filter(s => s.role === role);
}

/* ── Structure scoring — each story type gets a structural fit score ── */
function scoreStructuralFit(
  drivers: RankedSignal[],
  constraints: RankedSignal[],
  mechanisms: RankedSignal[],
  assumptions: RankedSignal[],
  leverages: RankedSignal[],
  total: number
): Record<VisualStoryType, number> {
  const hasOpposition = drivers.length > 0 && constraints.length > 0;
  const hasAdversarial = hasOpposition && (constraints.length >= 2 || drivers.length >= 2);

  return {
    SURVIVAL_JUDGMENT:        hasAdversarial ? (drivers.length + constraints.length) * 3 : 0,
    SYSTEM_TENSION:           hasOpposition ? (drivers.length + constraints.length) * 2 + (leverages.length > 0 ? 3 : 0) : 0,
    VALUE_FLOW:               mechanisms.length >= 2 ? mechanisms.length * 3 + (drivers.length > 0 ? 2 : 0) : 0,
    FRAGILITY_STRUCTURE:      assumptions.length >= 2 ? assumptions.length * 3 + constraints.length : 0,
    CLUSTERED_INTELLIGENCE:   total >= 5 ? Math.min(total, 10) * 1.5 : 0,
    PRIORITIZED_SIGNAL_FIELD: total >= 1 ? total : 0, // always available as fallback
  };
}

/* ── Verdict synthesis ── */
function synthesizeVerdict(
  drivers: RankedSignal[],
  constraints: RankedSignal[],
  assumptions: RankedSignal[],
  outcomes: RankedSignal[],
): { level: VerdictLevel; summary: string } {
  const driverScore = drivers.reduce((s, d) => s + d.score, 0);
  const constraintScore = constraints.reduce((s, c) => s + c.score, 0);
  const assumptionRisk = assumptions.length;

  if (driverScore === 0 && constraintScore === 0) {
    return { level: "unknown", summary: "Insufficient signal to determine verdict." };
  }

  const ratio = driverScore / (driverScore + constraintScore || 1);

  if (ratio > 0.65 && assumptionRisk <= 1) {
    return { level: "strong", summary: `Strong structural support (${drivers.length} drivers vs ${constraints.length} constraints).` };
  }
  if (ratio > 0.4) {
    const qualifier = assumptionRisk >= 2 ? ` ${assumptionRisk} untested assumptions add risk.` : "";
    return { level: "conditional", summary: `Conditional viability — opposing forces are balanced.${qualifier}` };
  }
  return { level: "weak", summary: `Constraints dominate (${constraints.length} blocking forces). ${assumptionRisk} assumptions untested.` };
}

/* ── Strategic question by story type ── */
const STORY_QUESTIONS: Record<VisualStoryType, string> = {
  SURVIVAL_JUDGMENT:        "Does this idea survive intelligent opposition?",
  SYSTEM_TENSION:           "What structural forces govern this system?",
  VALUE_FLOW:               "How does value flow through this system?",
  FRAGILITY_STRUCTURE:      "Which assumptions could break this system?",
  CLUSTERED_INTELLIGENCE:   "What are the dominant intelligence themes?",
  PRIORITIZED_SIGNAL_FIELD: "What matters most in this analysis?",
};

/** Core compiler: governed causal structure first, heuristic fallback second */
export function compileVisualStory(
  rankedSignals: RankedSignal[],
  stepType?: AnalysisStep,
  governedData?: Record<string, unknown> | null
): VisualStory {
  // ── GOVERNED PATH: Extract signals from governed artifacts if available ──
  let activeSignals = rankedSignals;
  let activeRelationships: SignalRelationship[] | null = null;

  if (governedData && Object.keys(governedData).length > 0) {
    const governedResult = extractFromGoverned(governedData);
    if (governedResult && governedResult.signals.length >= 3) {
      activeSignals = governedResult.signals;
      activeRelationships = governedResult.relationships;
      console.log(`[VisualStoryCompiler] Using GOVERNED signals (${governedResult.signals.length} signals, ${governedResult.relationships.length} relationships)`);
    } else {
      console.log(`[VisualStoryCompiler] Governed data insufficient (${governedResult?.signals.length || 0} signals), falling back to heuristic`);
    }
  }

  const drivers = countByRole(activeSignals, "driver");
  const constraints = countByRole(activeSignals, "constraint");
  const mechanisms = countByRole(activeSignals, "mechanism");
  const assumptions = countByRole(activeSignals, "assumption");
  const leverages = countByRole(activeSignals, "leverage");
  const outcomes = countByRole(activeSignals, "outcome");

  // 1. Score each story type by structural fit
  const structuralScores = scoreStructuralFit(
    drivers, constraints, mechanisms, assumptions, leverages, activeSignals.length
  );

  // 2. Apply step bias — add bonus to preferred types (bias, not override)
  const BIAS_BONUS = 4;
  const biased = { ...structuralScores };
  const stepPrefs = stepType ? STEP_BIAS[stepType] : undefined;
  if (stepPrefs) {
    stepPrefs.forEach((pref, i) => {
      biased[pref] = (biased[pref] || 0) + BIAS_BONUS * (stepPrefs.length - i);
    });
  }

  // 3. Select highest-scoring story type
  let bestType: VisualStoryType = "PRIORITIZED_SIGNAL_FIELD";
  let bestScore = 0;
  for (const [type, score] of Object.entries(biased) as [VisualStoryType, number][]) {
    if (score > bestScore) {
      bestScore = score;
      bestType = type;
    }
  }

  // 4. Validate: a visual must have relationships to render
  const relationships = activeRelationships ?? inferRelationships(activeSignals);
  if (relationships.length === 0 && bestType !== "PRIORITIZED_SIGNAL_FIELD") {
    // If no relationships, only allow signal field or clustered (which is a field variant)
    if (bestType !== "CLUSTERED_INTELLIGENCE") {
      bestType = activeSignals.length >= 5 ? "CLUSTERED_INTELLIGENCE" : "PRIORITIZED_SIGNAL_FIELD";
    }
  }

  const meta = STORY_META[bestType];
  const verdict = synthesizeVerdict(drivers, constraints, assumptions, outcomes);
  const topSignals = activeSignals.slice(0, 8);

  return {
    type: bestType,
    label: meta.label,
    description: meta.description,
    strategicQuestion: STORY_QUESTIONS[bestType],
    verdict,
    relationships,
    drivers,
    constraints,
    mechanisms,
    assumptions,
    leverages,
    outcomes,
    topSignals,
  };
}
