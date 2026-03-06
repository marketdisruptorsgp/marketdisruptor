/**
 * INSIGHT LAYER — Evidence → Insight → Opportunity Pipeline
 *
 * Insights aggregate evidence into meaningful clusters.
 * Opportunities must reference Insight IDs, not raw evidence.
 *
 * Clustering uses tier similarity, keyword overlap, and pipeline adjacency.
 *
 * Extended Insight Types:
 *   - pattern, constraint_cluster, assumption_cluster, emerging_opportunity (original)
 *   - structural_insight, strategic_pathway, reasoning_chain, tool_recommendation (new)
 *
 * REASONING CHAIN GUARANTEE:
 *   Signal → Assumption → Constraint → Leverage → Opportunity → Pathway → Scenario
 *   Minimum counts enforced with fallback inference.
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
  | "emerging_opportunity"
  | "structural_insight"
  | "strategic_pathway"
  | "reasoning_chain"
  | "tool_recommendation";

export interface Insight {
  id: string;
  label: string;
  description?: string;
  insightType: InsightType;
  evidenceIds: string[];
  relatedInsightIds?: string[];
  recommendedTools?: string[];
  tier: EvidenceTier;
  mode: EvidenceMode;
  confidenceScore?: number;
  impact?: number;
  lens?: EvidenceLens;
  archetype?: EvidenceArchetype;
  lensScores?: LensScores;
  archetypeScores?: ArchetypeScores;
  timestamp?: number;
  /** Whether this node was inferred rather than directly derived */
  isInferred?: boolean;
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
  recommendedTools?: string[];
}

export interface StrategicNarrative {
  primaryConstraint: string;
  keyAssumption: string;
  leveragePoint: string;
  breakthroughOpportunity: string;
  strategicPathway?: string;
  narrativeSummary: string;
  recommendedTools?: string[];
}

// ═══════════════════════════════════════════════════════════════
//  MINIMUM NODE COUNTS (Reasoning Chain Guarantee)
// ═══════════════════════════════════════════════════════════════

const MIN_COUNTS: Record<string, number> = {
  assumption_cluster: 4,
  constraint_cluster: 2,
  structural_insight: 2, // leverage points
  emerging_opportunity: 2,
  strategic_pathway: 1,
  reasoning_chain: 1,
};

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
//  TOOL RECOMMENDATION RULES (Reasoning-Driven)
// ═══════════════════════════════════════════════════════════════

interface ToolRecommendationRule {
  toolId: string;
  evidencePatterns: string[];
  insightTypes: InsightType[];
  minConfidence: number;
}

const TOOL_RECOMMENDATION_RULES: ToolRecommendationRule[] = [
  { toolId: "sba-loan-calculator", evidencePatterns: ["acquisition", "leverage", "financing", "debt", "loan", "sba"], insightTypes: ["emerging_opportunity", "structural_insight"], minConfidence: 0.4 },
  { toolId: "deal-structure-simulator", evidencePatterns: ["equity", "ownership", "deal", "seller note", "structure"], insightTypes: ["emerging_opportunity", "strategic_pathway"], minConfidence: 0.4 },
  { toolId: "industry-fragmentation-detector", evidencePatterns: ["fragmented", "consolidation", "rollup", "independent", "local"], insightTypes: ["constraint_cluster", "emerging_opportunity"], minConfidence: 0.3 },
  { toolId: "seller-motivation-signals", evidencePatterns: ["retiring", "succession", "seller", "owner", "aging", "exit"], insightTypes: ["pattern", "emerging_opportunity"], minConfidence: 0.3 },
  { toolId: "deal-risk-scanner", evidencePatterns: ["risk", "concentration", "dependency", "key person", "customer"], insightTypes: ["constraint_cluster", "structural_insight"], minConfidence: 0.4 },
  { toolId: "cash-flow-quality", evidencePatterns: ["cash flow", "revenue", "addback", "sde", "ebitda", "recurring"], insightTypes: ["structural_insight", "pattern"], minConfidence: 0.4 },
  { toolId: "dscr-calculator", evidencePatterns: ["dscr", "debt service", "coverage", "financing"], insightTypes: ["structural_insight", "emerging_opportunity"], minConfidence: 0.4 },
  { toolId: "acquisition-roi-model", evidencePatterns: ["roi", "return", "exit", "multiple", "hold period"], insightTypes: ["emerging_opportunity", "strategic_pathway"], minConfidence: 0.4 },
  { toolId: "tam-calculator", evidencePatterns: ["market size", "tam", "addressable", "opportunity", "total market"], insightTypes: ["emerging_opportunity", "strategic_pathway"], minConfidence: 0.3 },
  { toolId: "unit-economics-model", evidencePatterns: ["unit economics", "cac", "ltv", "payback", "margin", "contribution"], insightTypes: ["structural_insight", "constraint_cluster"], minConfidence: 0.4 },
  { toolId: "competitive-moat-analyzer", evidencePatterns: ["moat", "defensibility", "switching cost", "network effect", "barrier"], insightTypes: ["constraint_cluster", "structural_insight"], minConfidence: 0.4 },
  { toolId: "assumption-stress-tester", evidencePatterns: ["assumption", "challenge", "convention", "belief", "norm"], insightTypes: ["assumption_cluster", "structural_insight"], minConfidence: 0.3 },
  { toolId: "innovation-pathway-mapper", evidencePatterns: ["innovation", "breakthrough", "novel", "redesign", "path"], insightTypes: ["emerging_opportunity", "strategic_pathway"], minConfidence: 0.4 },
  { toolId: "revenue-model-simulator", evidencePatterns: ["revenue model", "subscription", "marketplace", "pricing", "monetization"], insightTypes: ["structural_insight", "emerging_opportunity"], minConfidence: 0.4 },
  { toolId: "value-chain-analyzer", evidencePatterns: ["value chain", "middleman", "disintermediation", "margin", "supply"], insightTypes: ["constraint_cluster", "structural_insight"], minConfidence: 0.4 },
];

function deriveToolRecommendations(
  insight: { label: string; description?: string; insightType: InsightType; confidenceScore?: number },
  evidence: Evidence[],
): string[] {
  const text = `${insight.label} ${insight.description || ""} ${evidence.map(e => `${e.label} ${e.description || ""}`).join(" ")}`.toLowerCase();
  const tools: string[] = [];

  for (const rule of TOOL_RECOMMENDATION_RULES) {
    if (!rule.insightTypes.includes(insight.insightType)) continue;
    const matchCount = rule.evidencePatterns.filter(p => text.includes(p)).length;
    if (matchCount === 0) continue;
    const confidence = insight.confidenceScore ?? 0.5;
    if (confidence < rule.minConfidence) continue;
    if (matchCount >= 1) tools.push(rule.toolId);
  }

  return [...new Set(tools)].slice(0, 3);
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
  if (types.has("friction") || types.has("risk")) return "constraint_cluster";
  return "pattern";
}

let insightCounter = 0;

/**
 * Cluster evidence into Insights using tier similarity,
 * keyword overlap (Jaccard > 0.7), and pipeline adjacency.
 *
 * ENFORCES the full reasoning chain with minimum node counts.
 */
export function clusterEvidenceIntoInsights(evidence: Evidence[]): Insight[] {
  if (evidence.length === 0) return [];
  insightCounter = 0;

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
      if (candidate.tier !== ev.tier) continue;
      if (!pipelineAdjacent(ev.pipelineStep, candidate.pipelineStep)) continue;
      const candTokens = tokenMap.get(candidate.id)!;
      if (jaccardSimilarity(evTokens, candTokens) >= SIMILARITY_THRESHOLD) {
        cluster.push(candidate);
        assigned.add(candidate.id);
      }
    }

    clusters.push(cluster);
  }

  const now = Date.now();

  // Convert clusters to Insights
  const baseInsights: Insight[] = clusters.map(cluster => {
    const primary = cluster[0];
    const label = cluster.length === 1
      ? primary.label
      : `${primary.label} (+${cluster.length - 1} related)`;

    const avgConfidence = cluster.reduce((s, e) => s + (e.confidenceScore ?? 0.5), 0) / cluster.length;
    const maxImpact = Math.max(...cluster.map(e => e.impact ?? 5));
    const lensScores = computeLensScores(label, primary.description);
    const archetypeScores = computeArchetypeScores(label, primary.description);
    const insightType = inferInsightType(cluster);

    const insight: Insight = {
      id: `insight-${++insightCounter}`,
      label,
      description: primary.description,
      insightType,
      evidenceIds: cluster.map(e => e.id),
      relatedInsightIds: [],
      recommendedTools: [],
      tier: primary.tier,
      mode: primary.mode || "product",
      confidenceScore: Math.round(avgConfidence * 100) / 100,
      impact: maxImpact,
      lens: primary.lens,
      archetype: primary.archetype,
      lensScores,
      archetypeScores,
      timestamp: now,
    };

    insight.recommendedTools = deriveToolRecommendations(insight, cluster);
    return insight;
  });

  // ── Generate higher-order insight types ──
  const structuralInsights = generateStructuralInsights(baseInsights, evidence);
  const syntheticConstraints = inferConstraintsFromBottlenecks(baseInsights, evidence);
  const insightsWithConstraints = [...baseInsights, ...structuralInsights, ...syntheticConstraints];

  const constraintResolutionOpps = generateConstraintResolutionOpportunities(insightsWithConstraints, evidence);
  const insightsWithOpps = [...insightsWithConstraints, ...constraintResolutionOpps];

  const strategicPathways = generateStrategicPathways(insightsWithOpps, evidence);
  const reasoningChains = generateReasoningChains(insightsWithOpps, evidence);
  const toolRecommendations = generateToolRecommendationInsights(insightsWithOpps, evidence);

  const allInsights = [
    ...insightsWithOpps, ...strategicPathways,
    ...reasoningChains, ...toolRecommendations,
  ];

  // ═══════════════════════════════════════════════════════════
  //  REASONING CHAIN GUARANTEE — Enforce minimum node counts
  // ═══════════════════════════════════════════════════════════
  enforceReasoningChain(allInsights, evidence, now);

  // Wire relatedInsightIds
  wireRelatedInsights(allInsights);

  return allInsights;
}

/**
 * Enforce the full reasoning chain with fallback inference.
 * Mutates `allInsights` in place to add missing nodes.
 */
function enforceReasoningChain(allInsights: Insight[], evidence: Evidence[], now: number): void {
  const countByType = (t: InsightType) => allInsights.filter(i => i.insightType === t).length;
  const sortedByImpact = [...allInsights].sort((a, b) => (b.impact ?? 0) - (a.impact ?? 0));
  const defaultMode: EvidenceMode = allInsights[0]?.mode || "product";

  // Helper: pick a source insight for fallback generation
  const pickSource = (preferType?: InsightType) => {
    if (preferType) {
      const candidates = allInsights.filter(i => i.insightType === preferType);
      if (candidates.length > 0) return candidates.sort((a, b) => (b.impact ?? 0) - (a.impact ?? 0))[0];
    }
    return sortedByImpact[0] || null;
  };

  // --- Assumptions (need ≥ 4) ---
  const assumptionCount = countByType("assumption_cluster");
  if (assumptionCount < MIN_COUNTS.assumption_cluster) {
    const needed = MIN_COUNTS.assumption_cluster - assumptionCount;
    const patterns = allInsights.filter(i => i.insightType === "pattern");
    for (let i = 0; i < needed; i++) {
      const src = patterns[i] || sortedByImpact[i] || sortedByImpact[0];
      if (!src) break;
      allInsights.push({
        id: `insight-fb-asm-${++insightCounter}`,
        label: `Assumption: ${src.label.replace(/^(Pattern|Signal): /i, "").slice(0, 80)}`,
        description: `Inferred assumption from evidence pattern. ${src.description || ""}`.trim(),
        insightType: "assumption_cluster",
        evidenceIds: src.evidenceIds,
        relatedInsightIds: [src.id],
        recommendedTools: [],
        tier: src.tier || "structural",
        mode: src.mode || defaultMode,
        confidenceScore: 0.45,
        impact: src.impact ?? 5,
        timestamp: now,
        isInferred: true,
      });
    }
  }

  // --- Constraints (need ≥ 2) ---
  const constraintCount = countByType("constraint_cluster");
  if (constraintCount < MIN_COUNTS.constraint_cluster) {
    const needed = MIN_COUNTS.constraint_cluster - constraintCount;
    for (let i = 0; i < needed; i++) {
      const src = pickSource("assumption_cluster");
      if (!src) break;
      const relEvidence = evidence.filter(e => src.evidenceIds.includes(e.id));
      allInsights.push({
        id: `insight-fb-con-${++insightCounter}`,
        label: `Constraint: ${src.label.replace(/^(Assumption|Pattern|Structural bottleneck): /i, "").slice(0, 80)}`,
        description: `Structural limitation inferred from ${src.evidenceIds.length} evidence signals. ${src.description || ""}`.trim(),
        insightType: "constraint_cluster",
        evidenceIds: src.evidenceIds,
        relatedInsightIds: [src.id],
        recommendedTools: deriveToolRecommendations(
          { label: src.label, insightType: "constraint_cluster", confidenceScore: 0.5 }, relEvidence
        ),
        tier: "structural",
        mode: src.mode || defaultMode,
        confidenceScore: 0.45,
        impact: src.impact ?? 5,
        timestamp: now,
        isInferred: true,
      });
    }
  }

  // --- Leverage Points (need ≥ 2) ---
  const leverageCount = countByType("structural_insight");
  if (leverageCount < MIN_COUNTS.structural_insight) {
    const needed = MIN_COUNTS.structural_insight - leverageCount;
    const constraintInsights = allInsights.filter(i => i.insightType === "constraint_cluster");
    for (let i = 0; i < needed; i++) {
      const con = constraintInsights[i] || pickSource("constraint_cluster");
      if (!con) break;
      const relEvidence = evidence.filter(e => con.evidenceIds.includes(e.id));
      allInsights.push({
        id: `insight-fb-lev-${++insightCounter}`,
        label: `Leverage: Resolve ${con.label.replace(/^(Constraint|Structural bottleneck|Operational friction|Risk concentration|Inferred constraint): /i, "").slice(0, 70)}`,
        description: `Resolving this constraint creates a high-leverage intervention point. ${con.description || ""}`.trim(),
        insightType: "structural_insight",
        evidenceIds: con.evidenceIds,
        relatedInsightIds: [con.id],
        recommendedTools: deriveToolRecommendations(
          { label: con.label, insightType: "structural_insight", confidenceScore: 0.55 }, relEvidence
        ),
        tier: "structural",
        mode: con.mode || defaultMode,
        confidenceScore: 0.55,
        impact: con.impact ?? 5,
        timestamp: now,
        isInferred: true,
      });
    }
  }

  // --- Opportunities (need ≥ 2) ---
  const oppCount = countByType("emerging_opportunity");
  if (oppCount < MIN_COUNTS.emerging_opportunity) {
    const needed = MIN_COUNTS.emerging_opportunity - oppCount;
    const constraintInsights = allInsights.filter(i => i.insightType === "constraint_cluster");
    const leverageInsights = allInsights.filter(i => i.insightType === "structural_insight");
    for (let i = 0; i < needed; i++) {
      const source = leverageInsights[i] || constraintInsights[i] || pickSource();
      if (!source) break;
      allInsights.push({
        id: `insight-fb-opp-${++insightCounter}`,
        label: `Opportunity: ${source.label.replace(/^(Leverage|Constraint|Resolve): /i, "").slice(0, 80)}`,
        description: `Resolving "${source.label}" opens strategic value. Derived from constraint resolution logic.`,
        insightType: "emerging_opportunity",
        evidenceIds: source.evidenceIds,
        relatedInsightIds: [source.id],
        recommendedTools: source.recommendedTools,
        tier: source.tier || "structural",
        mode: source.mode || defaultMode,
        confidenceScore: 0.4,
        impact: Math.max(5, (source.impact ?? 5) - 1),
        timestamp: now,
        isInferred: true,
      });
    }
  }

  // --- Pathways (need ≥ 1) ---
  const pathwayCount = countByType("strategic_pathway");
  if (pathwayCount < MIN_COUNTS.strategic_pathway) {
    const constraint = allInsights.find(i => i.insightType === "constraint_cluster");
    const opportunity = allInsights.find(i => i.insightType === "emerging_opportunity");
    if (constraint && opportunity) {
      allInsights.push({
        id: `insight-fb-path-${++insightCounter}`,
        label: `Pathway: ${constraint.label.replace(/^(Constraint|Structural bottleneck): /i, "").slice(0, 30)} → ${opportunity.label.replace(/^Opportunity: (Resolve )?/i, "").slice(0, 40)}`,
        description: `Strategic pathway connecting "${constraint.label}" to "${opportunity.label}".`,
        insightType: "strategic_pathway",
        evidenceIds: [...new Set([...constraint.evidenceIds, ...opportunity.evidenceIds])],
        relatedInsightIds: [constraint.id, opportunity.id],
        recommendedTools: [...new Set([...(constraint.recommendedTools ?? []), ...(opportunity.recommendedTools ?? [])])],
        tier: "structural",
        mode: constraint.mode || defaultMode,
        confidenceScore: 0.4,
        impact: Math.max(constraint.impact ?? 5, opportunity.impact ?? 5),
        timestamp: now,
        isInferred: true,
      });
    }
  }

  // --- Reasoning chains (need ≥ 1) ---
  const chainCount = countByType("reasoning_chain");
  if (chainCount < MIN_COUNTS.reasoning_chain) {
    const assumption = allInsights.find(i => i.insightType === "assumption_cluster");
    const constraint = allInsights.find(i => i.insightType === "constraint_cluster");
    const opportunity = allInsights.find(i => i.insightType === "emerging_opportunity");
    if (assumption && constraint && opportunity) {
      allInsights.push({
        id: `insight-fb-chain-${++insightCounter}`,
        label: `Chain: ${assumption.label.slice(0, 30)} → ${opportunity.label.slice(0, 40)}`,
        description: `Reasoning: "${assumption.label}" reveals "${constraint.label}" which unlocks "${opportunity.label}".`,
        insightType: "reasoning_chain",
        evidenceIds: [...new Set([...assumption.evidenceIds, ...constraint.evidenceIds, ...opportunity.evidenceIds])].slice(0, 8),
        relatedInsightIds: [assumption.id, constraint.id, opportunity.id],
        recommendedTools: [],
        tier: "structural",
        mode: assumption.mode || defaultMode,
        confidenceScore: 0.5,
        impact: Math.max(assumption.impact ?? 5, opportunity.impact ?? 5),
        timestamp: now,
        isInferred: true,
      });
    }
  }

  // Log chain health
  const chainHealth: Record<string, string> = {};
  for (const [type, min] of Object.entries(MIN_COUNTS)) {
    const count = countByType(type as InsightType);
    chainHealth[type] = `${count}/${min} ${count >= min ? "✅" : "⚠️"}`;
  }
  console.log("[InsightLayer] Reasoning chain health:", chainHealth);
}

// ═══════════════════════════════════════════════════════════════
//  HIGHER-ORDER INSIGHT GENERATORS
// ═══════════════════════════════════════════════════════════════

function generateStructuralInsights(insights: Insight[], evidence: Evidence[]): Insight[] {
  const now = Date.now();
  const result: Insight[] = [];

  const constraintClusters = insights.filter(i => i.insightType === "constraint_cluster" && (i.impact ?? 0) >= 3);
  for (const cc of constraintClusters.slice(0, 3)) {
    const relatedEvidence = evidence.filter(e => cc.evidenceIds.includes(e.id));
    const toolRecs = deriveToolRecommendations(
      { label: cc.label, description: cc.description, insightType: "structural_insight", confidenceScore: cc.confidenceScore },
      relatedEvidence,
    );

    result.push({
      id: `insight-struct-${++insightCounter}`,
      label: `Structural: ${cc.label}`,
      description: `This constraint shapes the fundamental structure of the system. ${cc.description || ""}`.trim(),
      insightType: "structural_insight",
      evidenceIds: cc.evidenceIds,
      relatedInsightIds: [cc.id],
      recommendedTools: toolRecs,
      tier: "structural",
      mode: cc.mode,
      confidenceScore: Math.min(1, (cc.confidenceScore ?? 0.5) + 0.1),
      impact: cc.impact,
      lensScores: cc.lensScores,
      archetypeScores: cc.archetypeScores,
      timestamp: now,
    });
  }

  const assumptionClusters = insights.filter(i => i.insightType === "assumption_cluster" && (i.impact ?? 0) >= 5);
  for (const ac of assumptionClusters.slice(0, 2)) {
    result.push({
      id: `insight-struct-${++insightCounter}`,
      label: `Assumption: ${ac.label}`,
      description: `Foundational assumption that, if challenged, could unlock new strategic directions. ${ac.description || ""}`.trim(),
      insightType: "structural_insight",
      evidenceIds: ac.evidenceIds,
      relatedInsightIds: [ac.id],
      recommendedTools: deriveToolRecommendations(
        { label: ac.label, description: ac.description, insightType: "structural_insight", confidenceScore: ac.confidenceScore },
        evidence.filter(e => ac.evidenceIds.includes(e.id)),
      ),
      tier: "structural",
      mode: ac.mode,
      confidenceScore: ac.confidenceScore,
      impact: ac.impact,
      timestamp: now,
    });
  }

  return result;
}

function generateStrategicPathways(insights: Insight[], evidence: Evidence[]): Insight[] {
  const now = Date.now();
  const result: Insight[] = [];

  const opportunities = insights.filter(i => i.insightType === "emerging_opportunity" && (i.impact ?? 0) >= 3);
  const constraints = insights.filter(i => i.insightType === "constraint_cluster");

  for (const opp of opportunities.slice(0, 3)) {
    let relatedConstraints = constraints.filter(c =>
      c.tier === opp.tier || c.evidenceIds.some(eid => opp.evidenceIds.includes(eid))
    );
    if (relatedConstraints.length === 0 && constraints.length > 0) {
      relatedConstraints = [constraints[0]];
    }

    const allEvidenceIds = [...new Set([...opp.evidenceIds, ...relatedConstraints.flatMap(c => c.evidenceIds)])];
    const relatedInsightIds = [opp.id, ...relatedConstraints.map(c => c.id)];
    const relatedEvidence = evidence.filter(e => allEvidenceIds.includes(e.id));

    result.push({
      id: `insight-path-${++insightCounter}`,
      label: `Pathway: ${opp.label}`,
      description: `Strategic pathway connecting constraint "${relatedConstraints[0]?.label}" to opportunity "${opp.label}".`,
      insightType: "strategic_pathway",
      evidenceIds: allEvidenceIds,
      relatedInsightIds,
      recommendedTools: deriveToolRecommendations(
        { label: opp.label, description: opp.description, insightType: "strategic_pathway", confidenceScore: opp.confidenceScore },
        relatedEvidence,
      ),
      tier: opp.tier,
      mode: opp.mode,
      confidenceScore: Math.round(((opp.confidenceScore ?? 0.5) * 0.7 + (relatedConstraints[0]?.confidenceScore ?? 0.5) * 0.3) * 100) / 100,
      impact: opp.impact,
      lensScores: opp.lensScores,
      archetypeScores: opp.archetypeScores,
      timestamp: now,
    });
  }

  return result;
}

function generateReasoningChains(insights: Insight[], evidence: Evidence[]): Insight[] {
  const now = Date.now();
  const result: Insight[] = [];

  const signals = evidence.filter(e => e.type === "signal");
  const constraints = evidence.filter(e => e.type === "constraint" || e.type === "assumption");
  const opportunities = evidence.filter(e => e.type === "opportunity" || e.type === "leverage");

  if (signals.length > 0 && constraints.length > 0 && opportunities.length > 0) {
    const chainEvidence = [signals[0], constraints[0], opportunities[0]];
    result.push({
      id: `insight-chain-${++insightCounter}`,
      label: `Chain: ${signals[0].label} → ${opportunities[0].label}`,
      description: `Reasoning chain: Signal "${signals[0].label}" reveals constraint "${constraints[0].label}" which unlocks "${opportunities[0].label}".`,
      insightType: "reasoning_chain",
      evidenceIds: chainEvidence.map(e => e.id),
      relatedInsightIds: insights
        .filter(i => chainEvidence.some(ce => i.evidenceIds.includes(ce.id)))
        .map(i => i.id)
        .slice(0, 5),
      recommendedTools: [],
      tier: "structural",
      mode: chainEvidence[0].mode || "product",
      confidenceScore: Math.round(chainEvidence.reduce((s, e) => s + (e.confidenceScore ?? 0.5), 0) / chainEvidence.length * 100) / 100,
      impact: Math.max(...chainEvidence.map(e => e.impact ?? 5)),
      timestamp: now,
    });
  }

  return result;
}

function generateToolRecommendationInsights(insights: Insight[], evidence: Evidence[]): Insight[] {
  const now = Date.now();
  const result: Insight[] = [];

  const toolCounts = new Map<string, { count: number; sourceInsights: Insight[]; evidenceIds: string[] }>();
  for (const insight of insights) {
    for (const toolId of insight.recommendedTools ?? []) {
      const existing = toolCounts.get(toolId) || { count: 0, sourceInsights: [], evidenceIds: [] };
      existing.count++;
      existing.sourceInsights.push(insight);
      existing.evidenceIds.push(...insight.evidenceIds);
      toolCounts.set(toolId, existing);
    }
  }

  for (const [toolId, data] of toolCounts) {
    if (data.count < 2) continue;
    const topInsight = data.sourceInsights.sort((a, b) => (b.impact ?? 0) - (a.impact ?? 0))[0];
    const uniqueEvidenceIds = [...new Set(data.evidenceIds)];

    result.push({
      id: `insight-tool-${++insightCounter}`,
      label: `Recommended: ${toolId.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())}`,
      description: `${data.count} insights suggest this tool. Primary signal: "${topInsight.label}".`,
      insightType: "tool_recommendation",
      evidenceIds: uniqueEvidenceIds.slice(0, 10),
      relatedInsightIds: data.sourceInsights.map(i => i.id),
      recommendedTools: [toolId],
      tier: topInsight.tier,
      mode: topInsight.mode,
      confidenceScore: Math.min(1, data.count * 0.25),
      impact: topInsight.impact,
      timestamp: now,
    });
  }

  return result;
}

function inferConstraintsFromBottlenecks(insights: Insight[], evidence: Evidence[]): Insight[] {
  const now = Date.now();
  const result: Insight[] = [];

  // 1. Repeated assumptions → constraint
  const assumptionClusters = insights.filter(i => i.insightType === "assumption_cluster");
  if (assumptionClusters.length >= 1) {
    const topCluster = assumptionClusters[0];
    result.push({
      id: `insight-inferred-con-${++insightCounter}`,
      label: `Structural bottleneck: ${topCluster.label}`,
      description: `${assumptionClusters.length > 1 ? `Repeated assumption patterns across ${assumptionClusters.length} clusters` : "Assumption pattern"} indicates a structural constraint limiting strategic options.`,
      insightType: "constraint_cluster",
      evidenceIds: [...new Set(assumptionClusters.flatMap(a => a.evidenceIds))].slice(0, 8),
      relatedInsightIds: assumptionClusters.map(a => a.id),
      recommendedTools: deriveToolRecommendations(
        { label: topCluster.label, insightType: "constraint_cluster", confidenceScore: 0.6 },
        evidence.filter(e => topCluster.evidenceIds.includes(e.id)),
      ),
      tier: "structural",
      mode: topCluster.mode,
      confidenceScore: assumptionClusters.length >= 2 ? 0.65 : 0.5,
      impact: Math.max(...assumptionClusters.map(a => a.impact ?? 5)),
      timestamp: now,
    });
  }

  // 2. High-friction signals → constraint
  const frictionEvidence = evidence.filter(e => e.type === "friction" && (e.impact ?? 0) >= 4);
  if (frictionEvidence.length >= 1) {
    result.push({
      id: `insight-inferred-con-${++insightCounter}`,
      label: `Operational friction: ${frictionEvidence[0].label}`,
      description: `${frictionEvidence.length} high-impact friction points indicate systematic operational constraints.`,
      insightType: "constraint_cluster",
      evidenceIds: frictionEvidence.map(e => e.id).slice(0, 6),
      recommendedTools: [],
      tier: "system",
      mode: frictionEvidence[0].mode || "product",
      confidenceScore: 0.6,
      impact: Math.max(...frictionEvidence.map(e => e.impact ?? 5)),
      timestamp: now,
    });
  }

  // 3. Risk clusters → constraint
  const riskEvidence = evidence.filter(e => e.type === "risk" && (e.impact ?? 0) >= 4);
  if (riskEvidence.length >= 1) {
    result.push({
      id: `insight-inferred-con-${++insightCounter}`,
      label: `Risk concentration: ${riskEvidence[0].label}`,
      description: `${riskEvidence.length} compounding risk signals suggest a structural vulnerability.`,
      insightType: "constraint_cluster",
      evidenceIds: riskEvidence.map(e => e.id).slice(0, 6),
      recommendedTools: [],
      tier: "structural",
      mode: riskEvidence[0].mode || "product",
      confidenceScore: 0.55,
      impact: Math.max(...riskEvidence.map(e => e.impact ?? 5)),
      timestamp: now,
    });
  }

  return result;
}

function generateConstraintResolutionOpportunities(insights: Insight[], evidence: Evidence[]): Insight[] {
  const now = Date.now();
  const result: Insight[] = [];
  const constraintInsights = insights.filter(i => i.insightType === "constraint_cluster" && (i.impact ?? 0) >= 3);
  const existingOpps = insights.filter(i => i.insightType === "emerging_opportunity");
  if (existingOpps.length >= 4) return result;

  for (const con of constraintInsights.slice(0, 3)) {
    if (existingOpps.some(o => o.relatedInsightIds?.includes(con.id))) continue;
    const relatedEvidence = evidence.filter(e => con.evidenceIds.includes(e.id));
    const toolRecs = deriveToolRecommendations(
      { label: con.label, description: con.description, insightType: "emerging_opportunity", confidenceScore: con.confidenceScore },
      relatedEvidence,
    );

    result.push({
      id: `insight-resolve-${++insightCounter}`,
      label: `Opportunity: Resolve ${con.label.replace(/^(Structural bottleneck|Operational friction|Risk concentration): /i, "")}`,
      description: `Resolving the constraint "${con.label}" could unlock strategic value. ${con.description || ""}`.trim(),
      insightType: "emerging_opportunity",
      evidenceIds: con.evidenceIds,
      relatedInsightIds: [con.id],
      recommendedTools: toolRecs,
      tier: con.tier,
      mode: con.mode,
      confidenceScore: Math.max(0.4, (con.confidenceScore ?? 0.5) - 0.1),
      impact: Math.max(5, (con.impact ?? 5) - 1),
      lensScores: con.lensScores,
      archetypeScores: con.archetypeScores,
      timestamp: now,
    });
  }

  return result;
}

function wireRelatedInsights(insights: Insight[]): void {
  for (const insight of insights) {
    const related = insights
      .filter(other => other.id !== insight.id && other.evidenceIds.some(eid => insight.evidenceIds.includes(eid)))
      .map(other => other.id)
      .slice(0, 5);
    insight.relatedInsightIds = [...new Set([...(insight.relatedInsightIds ?? []), ...related])];
  }
}

// ═══════════════════════════════════════════════════════════════
//  OPPORTUNITY GENERATION
// ═══════════════════════════════════════════════════════════════

let oppCounter = 0;

export function generateOpportunities(insights: Insight[], allEvidence: Evidence[]): Opportunity[] {
  oppCounter = 0;
  const qualifying = insights.filter(i =>
    i.insightType === "emerging_opportunity" ||
    i.insightType === "constraint_cluster" ||
    i.insightType === "strategic_pathway" ||
    (i.impact && i.impact >= 5) ||
    (i.confidenceScore && i.confidenceScore >= 0.6)
  );

  return qualifying.map(insight => {
    const evidenceIds = insight.evidenceIds;
    const relatedEvidence = allEvidence.filter(e => evidenceIds.includes(e.id));
    const avgConf = relatedEvidence.reduce((s, e) => s + (e.confidenceScore ?? 0.5), 0) / Math.max(relatedEvidence.length, 1);

    // Structural opportunity scoring
    const constraintSeverity = insight.insightType === "constraint_cluster" ? (insight.impact ?? 5) / 10 : 0.5;
    const leverageStrength = insight.insightType === "structural_insight" ? (insight.impact ?? 5) / 10 : 0.4;
    const marketPotential = (insight.impact ?? 5) / 10;
    const evidenceStrength = Math.min(1, relatedEvidence.length / 10);
    const simFeasibility = relatedEvidence.some(e => e.type === "simulation") ? 0.8 : 0.5;

    const opportunityScore = Math.round((
      constraintSeverity * 0.3 +
      leverageStrength * 0.25 +
      marketPotential * 0.2 +
      simFeasibility * 0.15 +
      evidenceStrength * 0.1
    ) * 100) / 10;

    return {
      id: `opp-${++oppCounter}`,
      label: insight.label,
      description: insight.description,
      insightIds: [insight.id],
      evidenceIds,
      tier: insight.tier,
      mode: insight.mode,
      confidenceScore: Math.round(avgConf * 100) / 100,
      impact: Math.max(insight.impact ?? 5, Math.round(opportunityScore)),
      lensScores: insight.lensScores,
      archetypeScores: insight.archetypeScores,
      recommendedTools: insight.recommendedTools,
    };
  });
}

// ═══════════════════════════════════════════════════════════════
//  STRATEGIC NARRATIVE
// ═══════════════════════════════════════════════════════════════

export function generateStrategicNarrative(
  insights: Insight[],
  evidence: Evidence[],
): StrategicNarrative | null {
  const constraint = insights.find(i => i.insightType === "constraint_cluster");
  const assumption = insights.find(i => i.insightType === "assumption_cluster");
  const leverage = insights.find(i => i.insightType === "structural_insight");
  const opportunity = insights.find(i => i.insightType === "emerging_opportunity");
  const pathway = insights.find(i => i.insightType === "strategic_pathway");

  if (!constraint && !opportunity) return null;

  const primaryConstraint = constraint?.label || "No primary constraint identified";
  const keyAssumption = assumption?.label || "No key assumption identified";
  const leveragePoint = leverage?.label || "No leverage point identified";
  const breakthroughOpportunity = opportunity?.label || "No breakthrough opportunity identified";
  const strategicPathway = pathway?.label;

  const constraintClean = primaryConstraint.replace(/^(Constraint|Structural bottleneck|Operational friction|Risk concentration|Inferred constraint): /i, "");
  const assumptionClean = keyAssumption.replace(/^(Assumption): /i, "");
  const leverageClean = leveragePoint.replace(/^(Leverage|Structural|Resolve): /i, "");
  const oppClean = breakthroughOpportunity.replace(/^(Opportunity|Resolve): /i, "");

  const narrativeSummary = `The market is constrained by ${constraintClean.toLowerCase()}. This constraint exists because ${assumptionClean.toLowerCase()}. Resolving this creates leverage at ${leverageClean.toLowerCase()}. That unlocks the opportunity to ${oppClean.toLowerCase()}.${strategicPathway ? ` The recommended strategic pathway is ${strategicPathway.replace(/^Pathway: /i, "").toLowerCase()}.` : ""}`;

  const allTools = [
    ...(constraint?.recommendedTools ?? []),
    ...(leverage?.recommendedTools ?? []),
    ...(opportunity?.recommendedTools ?? []),
  ];

  return {
    primaryConstraint,
    keyAssumption,
    leveragePoint,
    breakthroughOpportunity,
    strategicPathway,
    narrativeSummary,
    recommendedTools: [...new Set(allTools)],
  };
}
