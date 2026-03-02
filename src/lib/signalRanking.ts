/* =========================================================
   SIGNAL RANKING ENGINE
   Extracts, classifies, and ranks signals from analysis data
   by impact × confidence × recurrence.
   ========================================================= */

export type SignalRole = "driver" | "constraint" | "mechanism" | "assumption" | "leverage" | "outcome";

export interface RankedSignal {
  label: string;
  role: SignalRole;
  impact: number;      // 1–5
  confidence: number;   // 1–5
  recurrence: number;   // how many sections reference it
  score: number;        // impact × confidence × recurrence
  sourceKeys: string[];
  polarity: "positive" | "negative" | "neutral";
}

export interface SignalRelationship {
  from: number;   // index into ranked signals
  to: number;
  type: "opposes" | "enables" | "depends_on" | "compounds";
}

/* ── Role classification by field origin ── */
const ROLE_MAP: Record<string, SignalRole> = {
  // Drivers
  marketForces: "driver", valueDrivers: "driver", hiddenStrengths: "driver",
  emotionalDrivers: "driver", positiveSignals: "driver", opportunities: "driver",
  unmetDemand: "driver", behavioralPull: "driver", efficiencyGain: "driver",
  // Constraints
  frictionPoints: "constraint", barriers: "constraint", painPoints: "constraint",
  bottlenecks: "constraint", constraints: "constraint", vulnerabilities: "constraint",
  blockingConstraints: "constraint", primaryFriction: "constraint",
  adoptionFriction: "constraint", costPressure: "constraint",
  competitiveThreats: "constraint", dependencyRisks: "constraint",
  // Assumptions
  assumptions: "assumption", blindSpots: "assumption", criticalAssumptions: "assumption",
  untested: "assumption", validationNeeds: "assumption", evidenceGaps: "assumption",
  // Mechanisms
  mechanism: "mechanism", coreStrategy: "mechanism", approach: "mechanism",
  workflowStages: "mechanism", processSteps: "mechanism", stages: "mechanism",
  businessModel: "mechanism", revenueEngine: "mechanism",
  // Leverage
  leveragePoint: "leverage", recommendation: "leverage", strategicRecommendation: "leverage",
  recommendations: "leverage", strategicRecommendations: "leverage",
  defensibility: "leverage", moat: "leverage", lockInPotential: "leverage",
  // Outcomes
  impact: "outcome", verdict: "outcome", tagline: "outcome",
  completionMessage: "outcome",
};

/* ── Polarity by role ── */
const ROLE_POLARITY: Record<SignalRole, "positive" | "negative" | "neutral"> = {
  driver: "positive",
  constraint: "negative",
  mechanism: "neutral",
  assumption: "negative",
  leverage: "positive",
  outcome: "neutral",
};

/* ── Confidence heuristic by field ── */
const CONFIDENCE_MAP: Record<string, number> = {
  patentFilings: 5, patentAnalysis: 5, sentimentAnalysis: 4,
  marketForces: 3, competitiveAnalysis: 3, frictionPoints: 3,
  valueDrivers: 3, mechanism: 3, businessModel: 3,
  assumptions: 2, blindSpots: 2, recommendations: 2,
  flippedIdeas: 2, opportunities: 2, criticalAssumptions: 1,
  untested: 1, evidenceGaps: 1,
};

function classifyRole(key: string): SignalRole {
  return ROLE_MAP[key] || "driver";
}

function getConfidence(key: string): number {
  return CONFIDENCE_MAP[key] || 3;
}

/** Extract all signals from analysis data, rank by impact × confidence × recurrence */
export function extractAndRankSignals(data: Record<string, unknown>): RankedSignal[] {
  const signalMap = new Map<string, { roles: Set<SignalRole>; sources: string[]; confidence: number; originalLabel: string }>();

  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) continue;

    const items: string[] = [];
    if (typeof value === "string" && value.trim().length > 5) {
      items.push(value.trim());
    } else if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string" && item.trim().length > 5) {
          items.push(item.trim());
        } else if (item && typeof item === "object") {
          // Extract signals from nested objects (e.g., competitorAnalysis, pricingIntel)
          const nested = item as Record<string, unknown>;
          for (const nVal of Object.values(nested)) {
            if (typeof nVal === "string" && nVal.trim().length > 5) {
              items.push(nVal.trim());
            }
          }
        }
      }
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      // Extract from nested objects like competitorAnalysis, pricingIntel, governed
      const obj = value as Record<string, unknown>;
      for (const [nKey, nVal] of Object.entries(obj)) {
        if (typeof nVal === "string" && nVal.trim().length > 5) {
          items.push(nVal.trim());
        } else if (Array.isArray(nVal)) {
          for (const arrItem of nVal) {
            if (typeof arrItem === "string" && arrItem.trim().length > 5) {
              items.push(arrItem.trim());
            }
          }
        }
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
        signalMap.set(normalized, { roles: new Set([role]), sources: [key], confidence: conf, originalLabel: label });
      }
    }
  }

  const ranked: RankedSignal[] = [];
  for (const [normalizedLabel, entry] of signalMap) {
    const role = [...entry.roles][0];
    const recurrence = entry.sources.length;
    const impact = Math.min(5, recurrence + 1);
    const score = impact * entry.confidence * recurrence;
    ranked.push({
      label: entry.originalLabel || normalizedLabel,
      role,
      impact,
      confidence: entry.confidence,
      recurrence,
      score,
      sourceKeys: entry.sources,
      polarity: ROLE_POLARITY[role],
    });
  }

  return ranked.sort((a, b) => b.score - a.score);
}

/** Infer relationships between top signals based on role polarity */
export function inferRelationships(signals: RankedSignal[]): SignalRelationship[] {
  const relationships: SignalRelationship[] = [];
  const top = signals.slice(0, 8);

  for (let i = 0; i < top.length; i++) {
    for (let j = i + 1; j < top.length; j++) {
      const a = top[i], b = top[j];
      // Opposing polarity → opposes
      if (a.polarity === "positive" && b.polarity === "negative") {
        relationships.push({ from: i, to: j, type: "opposes" });
      } else if (a.polarity === "negative" && b.polarity === "positive") {
        relationships.push({ from: i, to: j, type: "opposes" });
      }
      // Same negative → compounds
      else if (a.polarity === "negative" && b.polarity === "negative" && a.role === b.role) {
        relationships.push({ from: i, to: j, type: "compounds" });
      }
      // Mechanism → outcome
      else if (a.role === "mechanism" && b.role === "outcome") {
        relationships.push({ from: i, to: j, type: "enables" });
      }
      // Assumption → anything
      else if (a.role === "assumption") {
        relationships.push({ from: i, to: j, type: "depends_on" });
      }
    }
  }

  return relationships.slice(0, 12);
}

/** Get top N signals filtered by role */
export function getTopSignals(data: Record<string, unknown>, n = 6, roleFilter?: SignalRole): RankedSignal[] {
  const all = extractAndRankSignals(data);
  const filtered = roleFilter ? all.filter(s => s.role === roleFilter) : all;
  return filtered.slice(0, n);
}
