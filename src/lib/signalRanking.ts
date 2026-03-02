/* =========================================================
   SIGNAL RANKING ENGINE
   Extracts, classifies, and ranks signals from analysis data
   by impact × confidence × recurrence.
   ========================================================= */

export type SignalRole = "driver" | "constraint" | "mechanism" | "leverage" | "outcome";

export interface RankedSignal {
  label: string;
  role: SignalRole;
  impact: number;      // 1–5
  confidence: number;   // 1–5
  recurrence: number;   // how many sections reference it
  score: number;        // impact × confidence × recurrence
  sourceKeys: string[];
}

/* ── Role classification by field origin ── */
const ROLE_MAP: Record<string, SignalRole> = {
  // Drivers
  marketForces: "driver", valueDrivers: "driver", hiddenStrengths: "driver",
  emotionalDrivers: "driver", positiveSignals: "driver", opportunities: "driver",
  // Constraints
  frictionPoints: "constraint", barriers: "constraint", painPoints: "constraint",
  bottlenecks: "constraint", constraints: "constraint", vulnerabilities: "constraint",
  blockingConstraints: "constraint", blindSpots: "constraint", primaryFriction: "constraint",
  // Mechanisms
  mechanism: "mechanism", coreStrategy: "mechanism", approach: "mechanism",
  workflowStages: "mechanism", processSteps: "mechanism", stages: "mechanism",
  // Leverage
  leveragePoint: "leverage", recommendation: "leverage", strategicRecommendation: "leverage",
  recommendations: "leverage", strategicRecommendations: "leverage",
  // Outcomes
  impact: "outcome", verdict: "outcome", tagline: "outcome",
  completionMessage: "outcome",
};

/* ── Confidence heuristic by field ── */
const CONFIDENCE_MAP: Record<string, number> = {
  // Verified sources
  patentFilings: 5, patentAnalysis: 5, sentimentAnalysis: 4,
  // Modeled
  marketForces: 3, competitiveAnalysis: 3, frictionPoints: 3,
  valueDrivers: 3, mechanism: 3,
  // Assumptions
  assumptions: 2, blindSpots: 2, recommendations: 2,
  flippedIdeas: 2, opportunities: 2,
};

function classifyRole(key: string): SignalRole {
  return ROLE_MAP[key] || "driver";
}

function getConfidence(key: string): number {
  return CONFIDENCE_MAP[key] || 3;
}

/** Extract all signals from analysis data, rank by impact × confidence × recurrence */
export function extractAndRankSignals(data: Record<string, unknown>): RankedSignal[] {
  const signalMap = new Map<string, { roles: Set<SignalRole>; sources: string[]; confidence: number }>();

  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) continue;

    const items: string[] = [];
    if (typeof value === "string" && value.trim().length > 5) {
      items.push(value.trim());
    } else if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string" && item.trim().length > 5) items.push(item.trim());
      }
    }

    const role = classifyRole(key);
    const conf = getConfidence(key);

    for (const label of items.slice(0, 6)) {
      const normalized = label.toLowerCase().slice(0, 60);
      const existing = signalMap.get(normalized);
      if (existing) {
        existing.roles.add(role);
        existing.sources.push(key);
        existing.confidence = Math.max(existing.confidence, conf);
      } else {
        signalMap.set(normalized, { roles: new Set([role]), sources: [key], confidence: conf });
      }
    }
  }

  const ranked: RankedSignal[] = [];
  for (const [, entry] of signalMap) {
    const role = [...entry.roles][0]; // primary role
    const recurrence = entry.sources.length;
    const impact = Math.min(5, recurrence + 1); // more sources = higher impact
    const score = impact * entry.confidence * recurrence;
    const label = entry.sources[0]; // use first source key as rough label
    ranked.push({
      label: [...signalMap.entries()].find(([, v]) => v === entry)?.[0] || "",
      role,
      impact,
      confidence: entry.confidence,
      recurrence,
      score,
      sourceKeys: entry.sources,
    });
  }

  return ranked.sort((a, b) => b.score - a.score);
}

/** Get top N signals filtered by role */
export function getTopSignals(data: Record<string, unknown>, n = 6, roleFilter?: SignalRole): RankedSignal[] {
  const all = extractAndRankSignals(data);
  const filtered = roleFilter ? all.filter(s => s.role === roleFilter) : all;
  return filtered.slice(0, n);
}
