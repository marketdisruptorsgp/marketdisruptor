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
  /** Related insight IDs for cross-referencing */
  relatedInsightIds?: string[];
  /** Recommended tool IDs derived from reasoning */
  recommendedTools?: string[];
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
  timestamp?: number;
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
  /** Tool IDs recommended for this opportunity */
  recommendedTools?: string[];
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
//  TOOL RECOMMENDATION RULES (Reasoning-Driven)
// ═══════════════════════════════════════════════════════════════

interface ToolRecommendationRule {
  toolId: string;
  evidencePatterns: string[];
  insightTypes: InsightType[];
  minConfidence: number;
}

const TOOL_RECOMMENDATION_RULES: ToolRecommendationRule[] = [
  // ETA / Acquisition tools
  { toolId: "sba-loan-calculator", evidencePatterns: ["acquisition", "leverage", "financing", "debt", "loan", "sba"], insightTypes: ["emerging_opportunity", "structural_insight"], minConfidence: 0.4 },
  { toolId: "deal-structure-simulator", evidencePatterns: ["equity", "ownership", "deal", "seller note", "structure"], insightTypes: ["emerging_opportunity", "strategic_pathway"], minConfidence: 0.4 },
  { toolId: "industry-fragmentation-detector", evidencePatterns: ["fragmented", "consolidation", "rollup", "independent", "local"], insightTypes: ["constraint_cluster", "emerging_opportunity"], minConfidence: 0.3 },
  { toolId: "seller-motivation-signals", evidencePatterns: ["retiring", "succession", "seller", "owner", "aging", "exit"], insightTypes: ["pattern", "emerging_opportunity"], minConfidence: 0.3 },
  { toolId: "deal-risk-scanner", evidencePatterns: ["risk", "concentration", "dependency", "key person", "customer"], insightTypes: ["constraint_cluster", "structural_insight"], minConfidence: 0.4 },
  { toolId: "cash-flow-quality", evidencePatterns: ["cash flow", "revenue", "addback", "sde", "ebitda", "recurring"], insightTypes: ["structural_insight", "pattern"], minConfidence: 0.4 },
  { toolId: "dscr-calculator", evidencePatterns: ["dscr", "debt service", "coverage", "financing"], insightTypes: ["structural_insight", "emerging_opportunity"], minConfidence: 0.4 },
  { toolId: "acquisition-roi-model", evidencePatterns: ["roi", "return", "exit", "multiple", "hold period"], insightTypes: ["emerging_opportunity", "strategic_pathway"], minConfidence: 0.4 },
  // Venture tools
  { toolId: "tam-calculator", evidencePatterns: ["market size", "tam", "addressable", "opportunity", "total market"], insightTypes: ["emerging_opportunity", "strategic_pathway"], minConfidence: 0.3 },
  { toolId: "unit-economics-model", evidencePatterns: ["unit economics", "cac", "ltv", "payback", "margin", "contribution"], insightTypes: ["structural_insight", "constraint_cluster"], minConfidence: 0.4 },
  { toolId: "competitive-moat-analyzer", evidencePatterns: ["moat", "defensibility", "switching cost", "network effect", "barrier"], insightTypes: ["constraint_cluster", "structural_insight"], minConfidence: 0.4 },
  // Product tools
  { toolId: "assumption-stress-tester", evidencePatterns: ["assumption", "challenge", "convention", "belief", "norm"], insightTypes: ["assumption_cluster", "structural_insight"], minConfidence: 0.3 },
  { toolId: "innovation-pathway-mapper", evidencePatterns: ["innovation", "breakthrough", "novel", "redesign", "path"], insightTypes: ["emerging_opportunity", "strategic_pathway"], minConfidence: 0.4 },
  // Business Model tools
  { toolId: "revenue-model-simulator", evidencePatterns: ["revenue model", "subscription", "marketplace", "pricing", "monetization"], insightTypes: ["structural_insight", "emerging_opportunity"], minConfidence: 0.4 },
  { toolId: "value-chain-analyzer", evidencePatterns: ["value chain", "middleman", "disintermediation", "margin", "supply"], insightTypes: ["constraint_cluster", "structural_insight"], minConfidence: 0.4 },
];

/**
 * Reasoning-driven tool recommendation engine.
 * Analyzes evidence patterns within insights to recommend tools.
 */
function deriveToolRecommendations(
  insight: { label: string; description?: string; insightType: InsightType; confidenceScore?: number },
  evidence: Evidence[],
): string[] {
  const text = `${insight.label} ${insight.description || ""} ${evidence.map(e => `${e.label} ${e.description || ""}`).join(" ")}`.toLowerCase();
  const tools: string[] = [];

  for (const rule of TOOL_RECOMMENDATION_RULES) {
    // Check insight type match
    if (!rule.insightTypes.includes(insight.insightType)) continue;

    // Check evidence pattern match
    const matchCount = rule.evidencePatterns.filter(p => text.includes(p)).length;
    if (matchCount === 0) continue;

    // Check confidence threshold
    const confidence = insight.confidenceScore ?? 0.5;
    if (confidence < rule.minConfidence) continue;

    // Weighted score: more pattern matches = higher priority
    if (matchCount >= 1) {
      tools.push(rule.toolId);
    }
  }

  return [...new Set(tools)].slice(0, 3); // Max 3 tools per insight
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
  // Infer constraints from friction/risk clusters (structural bottlenecks)
  if (types.has("friction") || types.has("risk")) return "constraint_cluster";
  return "pattern";
}

let insightCounter = 0;

/**
 * Cluster evidence into Insights using tier similarity,
 * keyword overlap (Jaccard > 0.7), and pipeline adjacency.
 * Now also generates structural_insight, strategic_pathway,
 * reasoning_chain, and tool_recommendation insight types.
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

  // Convert clusters to Insights (with tool recommendations)
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

    // Derive tool recommendations from reasoning
    insight.recommendedTools = deriveToolRecommendations(insight, cluster);

    return insight;
  });

  // ── Generate higher-order insight types ──

  const structuralInsights = generateStructuralInsights(baseInsights, evidence);
  const strategicPathways = generateStrategicPathways(baseInsights, evidence);
  const reasoningChains = generateReasoningChains(baseInsights, evidence);
  const toolRecommendations = generateToolRecommendationInsights(baseInsights, evidence);

  // ── Infer synthetic constraints from repeated assumptions & bottlenecks ──
  const syntheticConstraints = inferConstraintsFromBottlenecks(baseInsights, evidence);

  // ── Generate opportunities from constraint resolution ──
  const constraintResolutionOpps = generateConstraintResolutionOpportunities(
    [...baseInsights, ...syntheticConstraints], evidence
  );

  const allInsights = [
    ...baseInsights, ...structuralInsights, ...strategicPathways,
    ...reasoningChains, ...toolRecommendations,
    ...syntheticConstraints, ...constraintResolutionOpps,
  ];

  // Wire relatedInsightIds
  wireRelatedInsights(allInsights);

  return allInsights;
}

// ═══════════════════════════════════════════════════════════════
//  HIGHER-ORDER INSIGHT GENERATORS
// ═══════════════════════════════════════════════════════════════

function generateStructuralInsights(insights: Insight[], evidence: Evidence[]): Insight[] {
  const now = Date.now();
  const result: Insight[] = [];

  // Find high-impact constraint clusters → structural insights
  const constraintClusters = insights.filter(i => i.insightType === "constraint_cluster" && (i.impact ?? 0) >= 6);
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

  // High-impact assumption clusters → structural insights
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

  // Combine high-impact opportunities with constraint clusters to form pathways
  const opportunities = insights.filter(i => i.insightType === "emerging_opportunity" && (i.impact ?? 0) >= 5);
  const constraints = insights.filter(i => i.insightType === "constraint_cluster");

  for (const opp of opportunities.slice(0, 3)) {
    // Find related constraints (shared evidence or same tier)
    const relatedConstraints = constraints.filter(c =>
      c.tier === opp.tier || c.evidenceIds.some(eid => opp.evidenceIds.includes(eid))
    );

    if (relatedConstraints.length === 0) continue;

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

  // Build chains: signal → constraint → opportunity
  const signals = evidence.filter(e => e.type === "signal");
  const constraints = evidence.filter(e => e.type === "constraint" || e.type === "assumption");
  const opportunities = evidence.filter(e => e.type === "opportunity" || e.type === "leverage");

  if (signals.length > 0 && constraints.length > 0 && opportunities.length > 0) {
    // Find connected chains via same tier and pipeline adjacency
    const chainEvidence = [
      signals[0],
      constraints[0],
      opportunities[0],
    ];

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

  // Aggregate all tool recommendations across insights
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

  // Create tool_recommendation insights for tools recommended by 2+ insights
  for (const [toolId, data] of toolCounts) {
    if (data.count < 2) continue; // Only surface strongly recommended tools

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

/**
 * Infer synthetic constraint insights from repeated assumptions,
 * structural bottlenecks (friction/risk clusters), and economic inefficiencies.
 */
function inferConstraintsFromBottlenecks(insights: Insight[], evidence: Evidence[]): Insight[] {
  const now = Date.now();
  const result: Insight[] = [];

  // 1. Repeated assumptions → constraint (even 1 cluster qualifies if evidence is rich)
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

/**
 * Generate opportunity insights from constraint resolution logic.
 * For each constraint, infer what strategic opportunity opens when the constraint is resolved.
 */
function generateConstraintResolutionOpportunities(insights: Insight[], evidence: Evidence[]): Insight[] {
  const now = Date.now();
  const result: Insight[] = [];
  const constraintInsights = insights.filter(i => i.insightType === "constraint_cluster" && (i.impact ?? 0) >= 3);

  // Check if we already have enough opportunities
  const existingOpps = insights.filter(i => i.insightType === "emerging_opportunity");
  if (existingOpps.length >= 4) return result;

  for (const con of constraintInsights.slice(0, 3)) {
    // Skip if we already have an opportunity derived from this constraint
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
  // Cross-reference insights that share evidence IDs
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

/**
 * Generate opportunities from insights.
 * Only insights with impact ≥ 5 or confidence ≥ 0.6 qualify.
 */
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
      recommendedTools: insight.recommendedTools,
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
  /** Tool recommendations surfaced by reasoning */
  recommendedTools: string[];
}

export function generateStrategicNarrative(
  insights: Insight[],
  evidence: Evidence[],
): StrategicNarrative {
  const constraintCluster = insights.find(i => i.insightType === "constraint_cluster");
  const assumptionCluster = insights.find(i => i.insightType === "assumption_cluster");
  const opportunityCluster = insights
    .filter(i => i.insightType === "emerging_opportunity" || i.insightType === "strategic_pathway")
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

  // Collect all tool recommendations from reasoning
  const allToolRecs = insights
    .filter(i => i.insightType === "tool_recommendation")
    .flatMap(i => i.recommendedTools ?? []);
  const uniqueToolRecs = [...new Set(allToolRecs)];

  return {
    primaryConstraint,
    keyAssumption,
    leveragePoint,
    breakthroughOpportunity,
    narrativeSummary: parts.length > 0 ? parts.join(" ") : "Insufficient evidence to generate strategic narrative.",
    recommendedTools: uniqueToolRecs,
  };
}
