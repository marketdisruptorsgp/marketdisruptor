/* =========================================================
   VISUAL STORY COMPILER
   Selects the optimal visual grammar based on signal
   composition from ranked signals.
   ========================================================= */

import type { RankedSignal, SignalRole } from "./signalRanking";
import type { AnalysisStep } from "./stepVisualTypes";

export type VisualStoryType =
  | "ADVERSARIAL_ARENA"
  | "SYSTEM_TENSION"
  | "VALUE_FLOW"
  | "FRAGILITY_MAP"
  | "CLUSTER_LANDSCAPE"
  | "PRIORITIZED_SIGNAL_FIELD";

export interface VisualStory {
  type: VisualStoryType;
  label: string;
  description: string;
  /** Signals grouped by the story's rendering needs */
  drivers: RankedSignal[];
  constraints: RankedSignal[];
  mechanisms: RankedSignal[];
  leverages: RankedSignal[];
  outcomes: RankedSignal[];
}

const STORY_META: Record<VisualStoryType, { label: string; description: string }> = {
  ADVERSARIAL_ARENA: {
    label: "Adversarial Arena",
    description: "Attack forces vs. support forces — does the idea survive?",
  },
  SYSTEM_TENSION: {
    label: "System Tension Map",
    description: "Drivers and constraints pulling the system in opposing directions.",
  },
  VALUE_FLOW: {
    label: "Value Flow Architecture",
    description: "How value moves through interconnected mechanisms.",
  },
  FRAGILITY_MAP: {
    label: "Fragility Map",
    description: "Untested assumptions that could break the system.",
  },
  CLUSTER_LANDSCAPE: {
    label: "Signal Landscape",
    description: "Dense signal field organized by role and impact.",
  },
  PRIORITIZED_SIGNAL_FIELD: {
    label: "Priority Signal Field",
    description: "Top signals ranked by impact × confidence.",
  },
};

function countByRole(signals: RankedSignal[], role: SignalRole): RankedSignal[] {
  return signals.filter(s => s.role === role);
}

/** Core compiler: determines which visual grammar best fits the signal composition */
export function compileVisualStory(
  rankedSignals: RankedSignal[],
  stepType?: AnalysisStep
): VisualStory {
  const drivers = countByRole(rankedSignals, "driver");
  const constraints = countByRole(rankedSignals, "constraint");
  const mechanisms = countByRole(rankedSignals, "mechanism");
  const leverages = countByRole(rankedSignals, "leverage");
  const outcomes = countByRole(rankedSignals, "outcome");

  let type: VisualStoryType;

  // Step override: stress test always renders adversarial arena
  if (stepType === "stressTest" || stepType === "criticalValidation") {
    type = "ADVERSARIAL_ARENA";
  }
  // Tension: both positive and negative forces exist
  else if (drivers.length > 0 && constraints.length > 0) {
    type = "SYSTEM_TENSION";
  }
  // Flow: rich mechanism chain
  else if (mechanisms.length >= 3) {
    type = "VALUE_FLOW";
  }
  // Fragility: many untested assumptions / constraints
  else if (constraints.length >= 3) {
    type = "FRAGILITY_MAP";
  }
  // Dense: lots of signals
  else if (rankedSignals.length >= 5) {
    type = "CLUSTER_LANDSCAPE";
  }
  // Default: ranked priority field
  else {
    type = "PRIORITIZED_SIGNAL_FIELD";
  }

  const meta = STORY_META[type];

  return {
    type,
    label: meta.label,
    description: meta.description,
    drivers,
    constraints,
    mechanisms,
    leverages,
    outcomes,
  };
}
