/**
 * INSIGHT LAYER — Evidence → Insight → Opportunity Pipeline
 *
 * Insights aggregate evidence into meaningful clusters.
 * Opportunities must reference Insight IDs, not raw evidence.
 *
 * Clustering uses tier similarity, keyword overlap, and pipeline adjacency.
 */

import type {
  Evidence,
  EvidenceTier,
  EvidenceMode,
  EvidenceLens,
  EvidenceArchetype,
} from "@/lib/evidenceEngine";

// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════

export type InsightType =
  | "pattern"
  | "constraint_cluster"
  | "assumption_cluster"
  | "emerging_opportunity";

export interface Insight {
  id: string;
  label: string;
  description?: string;
  insightType: InsightType;
  evidenceIds: string[];
  tier: EvidenceTier;
  mode: EvidenceMode;
  confidenceScore?: number;
  impact?: number;
  lens?: EvidenceLens;
  archetype?: EvidenceArchetype;
  /** Lens-specific relevance scores */
  lensScores?: LensScores;
  /** Archetype relevance scores */
  archetypeScores?: ArchetypeScores;
}

export interface LensScores {
  operator?: number;
  investor?: number;
  innovator?: number;
  customer?: number;
}

export interface ArchetypeScores {
  operator?: number;
  eta?: number;
  rollup?: number;
  venture?: number;
  bootstrapped?: number;
}

export interface Opportunity {
  id: string;
  label: string;
  description?: string;
  insightIds: string[];
  evidenceIds: string[];
  tier: EvidenceTier;
  mode: EvidenceMode;
  confidenceScore: number;
  impact: number;
  lensScores?: LensScores;
  archetypeScores?: ArchetypeScores;
}

// ═══════════════════════════════════════════════════════════════
//  LENS SCORING
// ═══════════════════════════════════════════════════════════════

const LENS_KEYWORDS: Record<keyof LensScores, string[]> = {
  operator: ["operational", "delivery", "cost", "automation", "logistics", "efficiency", "process", "supply chain", "workflow"],
  investor: ["revenue", "scalability", "valuation", "acquisition", "margin", "growth", "roi", "multiple", "exit"],
  innovator: ["innovation", "disruption", "novel", "patent", "breakthrough", "redesign", "emerging", "paradigm"],
  customer: ["experience", "friction", "satisfaction", "journey", "retention", "churn", "onboarding", "usability"],
};

export function computeLensScores(label: string, description?: string): LensScores {
  const text = `${label} ${description || ""}`.toLowerCase();
  const scores: LensScores = {};
  for (const [lens, keywords] of Object.entries(LENS_KEYWORDS) as [keyof LensScores, string[]][]) {
    const hits = keywords.filter(kw => text.includes(kw)).length;
    if (hits > 0) {
      scores[lens] = Math.min(1, hits / 3);
    }
  }
  return scores;
}

// ═══════════════════════════════════════════════════════════════
//  ARCHETYPE SCORING
// ═══════════════════════════════════════════════════════════════

const ARCHETYPE_KEYWORDS: Record<keyof ArchetypeScores, string[]> = {
  operator: ["operations", "efficiency", "process", "management", "systems", "delivery"],
  eta: ["acquisition", "ownership", "transfer", "existing", "buy", "takeover"],
  rollup: ["consolidation", "multiple", "platform", "aggregate", "scale", "roll-up"],
  venture: ["growth", "scale", "market", "disruption", "venture", "rapid"],
  bootstrapped: ["lean", "bootstrap", "profitable", "organic", "self-funded", "minimal"],
};

export function computeArchetypeScores(label: string, description?: string): ArchetypeScores {
  const text = `${label} ${description || ""}`.toLowerCase();
  const scores: ArchetypeScores = {};
  for (const [arch, keywords] of Object.entries(ARCHETYPE_KEYWORDS) as [keyof ArchetypeScores, string[]][]) {
    const hits = keywords.filter(kw => text.includes(kw)).length;
    if (hits > 0) {
      scores[arch] = Math.min(1, hits / 3);
    }
  }
  return scores;
}

// ═══════════════════════════════════════════════════════════════
//  CLUSTERING ENGINE
// ═══════════════════════════════════════════════════════════════

const MAX_CLUSTER_SIZE = 6;
const SIMILARITY_THRESHOLD = 0.7;

function tokenize(text: string): Set<string> {
  return new Set(text.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(t => t.length > 2));
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection++;
  }
  return intersection / (a.size + b.size - intersection);
}

const PIPELINE_ORDER: Record<string, number> = {
  report: 0, disrupt: 1, redesign: 2, stress_test: 3, pitch: 4,
};

function pipelineAdjacent(a: string, b: string): boolean {
  const da = PIPELINE_ORDER[a] ?? 0;
  const db = PIPELINE_ORDER[b] ?? 0;
  return Math.abs(da - db) <= 1;
}

function inferInsightType(evidence: Evidence[]): InsightType {
  const types = new Set(evidence.map(e => e.type));
  if (types.has("constraint")) return "constraint_cluster";
  if (types.has("assumption")) return "assumption_cluster";
  if (types.has("opportunity") || types.has("leverage")) return "emerging_opportunity";
  return "pattern";
}

let insightCounter = 0;

/**
 * Cluster evidence into Insights using tier similarity,
 * keyword overlap (Jaccard > 0.7), and pipeline adjacency.
 */
export function clusterEvidenceIntoInsights(evidence: Evidence[]): Insight[] {
  if (evidence.length === 0) return [];

  const tokenMap = new Map<string, Set<string>>();
  for (const ev of evidence) {
    tokenMap.set(ev.id, tokenize(`${ev.label} ${ev.description || ""}`));
  }

  const assigned = new Set<string>();
  const clusters: Evidence[][] = [];

  // Greedy clustering
  for (const ev of evidence) {
    if (assigned.has(ev.id)) continue;
    const cluster: Evidence[] = [ev];
    assigned.add(ev.id);
    const evTokens = tokenMap.get(ev.id)!;

    for (const candidate of evidence) {
      if (assigned.has(candidate.id)) continue;
      if (cluster.length >= MAX_CLUSTER_SIZE) break;

      // Tier must match
      if (candidate.tier !== ev.tier) continue;

      // Pipeline adjacency
      if (!pipelineAdjacent(ev.pipelineStep, candidate.pipelineStep)) continue;

      // Keyword similarity
      const candTokens = tokenMap.get(candidate.id)!;
      if (jaccardSimilarity(evTokens, candTokens) >= SIMILARITY_THRESHOLD) {
        cluster.push(candidate);
        assigned.add(candidate.id);
      }
    }

    clusters.push(cluster);
  }

  // Convert clusters to Insights
  return clusters.map(cluster => {
    const primary = cluster[0];
    const label = cluster.length === 1
      ? primary.label
      : `${primary.label} (+${cluster.length - 1} related)`;

    const avgConfidence = cluster.reduce((s, e) => s + (e.confidenceScore ?? 0.5), 0) / cluster.length;
    const maxImpact = Math.max(...cluster.map(e => e.impact ?? 5));
    const lensScores = computeLensScores(label, primary.description);
    const archetypeScores = computeArchetypeScores(label, primary.description);

    return {
      id: `insight-${++insightCounter}`,
      label,
      description: primary.description,
      insightType: inferInsightType(cluster),
      evidenceIds: cluster.map(e => e.id),
      tier: primary.tier,
      mode: primary.mode || "product",
      confidenceScore: Math.round(avgConfidence * 100) / 100,
      impact: maxImpact,
      lens: primary.lens,
      archetype: primary.archetype,
      lensScores,
      archetypeScores,
    };
  });
}

// ═══════════════════════════════════════════════════════════════
//  OPPORTUNITY GENERATION
// ═══════════════════════════════════════════════════════════════

let oppCounter = 0;

/**
 * Generate opportunities from insights.
 * Only insights with impact ≥ 5 or confidence ≥ 0.6 qualify.
 */
export function generateOpportunities(insights: Insight[], allEvidence: Evidence[]): Opportunity[] {
  const qualifying = insights.filter(i =>
    i.insightType === "emerging_opportunity" ||
    i.insightType === "constraint_cluster" ||
    (i.impact && i.impact >= 5) ||
    (i.confidenceScore && i.confidenceScore >= 0.6)
  );

  return qualifying.map(insight => {
    const evidenceIds = insight.evidenceIds;
    const relatedEvidence = allEvidence.filter(e => evidenceIds.includes(e.id));
    const avgConf = relatedEvidence.reduce((s, e) => s + (e.confidenceScore ?? 0.5), 0) / Math.max(relatedEvidence.length, 1);

    return {
      id: `opp-${++oppCounter}`,
      label: insight.label,
      description: insight.description,
      insightIds: [insight.id],
      evidenceIds,
      tier: insight.tier,
      mode: insight.mode,
      confidenceScore: Math.round(avgConf * 100) / 100,
      impact: insight.impact ?? 5,
      lensScores: insight.lensScores,
      archetypeScores: insight.archetypeScores,
    };
  });
}

// ═══════════════════════════════════════════════════════════════
//  STRATEGIC NARRATIVE
// ═══════════════════════════════════════════════════════════════

export interface StrategicNarrative {
  primaryConstraint: string | null;
  keyAssumption: string | null;
  leveragePoint: string | null;
  breakthroughOpportunity: string | null;
  narrativeSummary: string;
}

export function generateStrategicNarrative(
  insights: Insight[],
  evidence: Evidence[],
): StrategicNarrative {
  const constraintCluster = insights.find(i => i.insightType === "constraint_cluster");
  const assumptionCluster = insights.find(i => i.insightType === "assumption_cluster");
  const opportunityCluster = insights
    .filter(i => i.insightType === "emerging_opportunity")
    .sort((a, b) => (b.impact ?? 0) - (a.impact ?? 0))[0];

  const leverageEvidence = evidence
    .filter(e => e.type === "leverage")
    .sort((a, b) => (b.impact ?? 0) - (a.impact ?? 0))[0];

  const primaryConstraint = constraintCluster?.label ?? null;
  const keyAssumption = assumptionCluster?.label ?? null;
  const leveragePoint = leverageEvidence?.label ?? null;
  const breakthroughOpportunity = opportunityCluster?.label ?? null;

  const parts: string[] = [];
  if (primaryConstraint) parts.push(`The primary structural constraint is "${primaryConstraint}".`);
  if (keyAssumption) parts.push(`A key assumption under examination: "${keyAssumption}".`);
  if (leveragePoint) parts.push(`The highest-impact leverage point: "${leveragePoint}".`);
  if (breakthroughOpportunity) parts.push(`Breakthrough opportunity identified: "${breakthroughOpportunity}".`);

  return {
    primaryConstraint,
    keyAssumption,
    leveragePoint,
    breakthroughOpportunity,
    narrativeSummary: parts.length > 0 ? parts.join(" ") : "Insufficient evidence to generate strategic narrative.",
  };
}
