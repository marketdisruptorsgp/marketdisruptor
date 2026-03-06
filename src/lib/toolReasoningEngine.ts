/**
 * TOOL REASONING ENGINE — Insight-Driven Tool Recommendations
 *
 * Recommends tools based on insight context and evidence patterns,
 * not keyword matching. Uses insight type + evidence density to
 * rank tool relevance.
 */

import type { Insight } from "@/lib/insightLayer";
import type { Evidence } from "@/lib/evidenceEngine";
import { getToolById, type LensTool } from "@/lib/lensToolkitRegistry";

// ═══════════════════════════════════════════════════════════════
//  RECOMMENDATION RULES
// ═══════════════════════════════════════════════════════════════

interface ReasoningRule {
  toolId: string;
  /** Insight types that trigger this recommendation */
  insightTypes: string[];
  /** Evidence text patterns that boost relevance */
  evidencePatterns: string[];
  /** Base relevance score (0-1) */
  baseScore: number;
}

const REASONING_RULES: ReasoningRule[] = [
  // ETA / Acquisition
  { toolId: "sba-loan-calculator", insightTypes: ["emerging_opportunity", "structural_insight", "strategic_pathway"], evidencePatterns: ["acquisition", "leverage", "financing", "debt", "loan", "sba", "purchase"], baseScore: 0.8 },
  { toolId: "deal-structure-simulator", insightTypes: ["emerging_opportunity", "strategic_pathway", "constraint_cluster"], evidencePatterns: ["equity", "ownership", "deal", "seller note", "structure", "capital"], baseScore: 0.75 },
  { toolId: "dscr-calculator", insightTypes: ["structural_insight", "emerging_opportunity"], evidencePatterns: ["dscr", "debt service", "coverage", "cash flow"], baseScore: 0.7 },
  { toolId: "acquisition-roi-model", insightTypes: ["emerging_opportunity", "strategic_pathway"], evidencePatterns: ["roi", "return", "exit", "multiple", "hold period"], baseScore: 0.7 },
  { toolId: "industry-fragmentation-detector", insightTypes: ["constraint_cluster", "emerging_opportunity", "pattern"], evidencePatterns: ["fragmented", "consolidation", "rollup", "independent", "local", "scattered"], baseScore: 0.75 },
  { toolId: "seller-motivation-signals", insightTypes: ["pattern", "emerging_opportunity"], evidencePatterns: ["retiring", "succession", "seller", "owner", "aging", "exit", "transition"], baseScore: 0.65 },
  { toolId: "deal-risk-scanner", insightTypes: ["constraint_cluster", "structural_insight"], evidencePatterns: ["risk", "concentration", "dependency", "key person", "customer"], baseScore: 0.7 },
  { toolId: "cash-flow-quality", insightTypes: ["structural_insight", "pattern"], evidencePatterns: ["cash flow", "revenue quality", "addback", "sde", "ebitda"], baseScore: 0.7 },
  // Venture
  { toolId: "tam-calculator", insightTypes: ["emerging_opportunity", "strategic_pathway", "pattern"], evidencePatterns: ["market size", "tam", "addressable", "opportunity", "total market", "growth"], baseScore: 0.8 },
  { toolId: "unit-economics-model", insightTypes: ["structural_insight", "constraint_cluster"], evidencePatterns: ["unit economics", "cac", "ltv", "payback", "margin", "contribution"], baseScore: 0.75 },
  { toolId: "competitive-moat-analyzer", insightTypes: ["constraint_cluster", "structural_insight"], evidencePatterns: ["moat", "defensibility", "switching cost", "network effect", "barrier"], baseScore: 0.7 },
  // Product
  { toolId: "assumption-stress-tester", insightTypes: ["assumption_cluster", "structural_insight"], evidencePatterns: ["assumption", "challenge", "convention", "belief", "norm", "untested"], baseScore: 0.75 },
  { toolId: "innovation-pathway-mapper", insightTypes: ["emerging_opportunity", "strategic_pathway"], evidencePatterns: ["innovation", "breakthrough", "novel", "redesign", "path", "disrupt"], baseScore: 0.7 },
  // Business Model
  { toolId: "revenue-model-simulator", insightTypes: ["structural_insight", "emerging_opportunity"], evidencePatterns: ["revenue model", "subscription", "marketplace", "pricing", "monetization"], baseScore: 0.75 },
  { toolId: "value-chain-analyzer", insightTypes: ["constraint_cluster", "structural_insight"], evidencePatterns: ["value chain", "middleman", "disintermediation", "margin", "supply"], baseScore: 0.7 },
];

// ═══════════════════════════════════════════════════════════════
//  PUBLIC API
// ═══════════════════════════════════════════════════════════════

export interface ToolRecommendation {
  tool: LensTool;
  score: number;
  reason: string;
}

/**
 * Recommend tools for a specific insight node based on its type,
 * label, and related evidence.
 */
export function recommendToolsForInsight(
  node: { label: string; detail?: string; type: string; reasoning?: string },
  relatedEvidence: string[] = [],
): ToolRecommendation[] {
  const text = `${node.label} ${node.detail || ""} ${node.reasoning || ""} ${relatedEvidence.join(" ")}`.toLowerCase();
  const results: ToolRecommendation[] = [];

  for (const rule of REASONING_RULES) {
    // Check insight type match (map node types to insight types)
    const insightTypeMap: Record<string, string[]> = {
      signal: ["pattern", "emerging_opportunity"],
      constraint: ["constraint_cluster", "structural_insight"],
      assumption: ["assumption_cluster", "structural_insight"],
      driver: ["pattern", "strategic_pathway"],
      leverage_point: ["structural_insight", "strategic_pathway", "emerging_opportunity"],
      outcome: ["emerging_opportunity", "strategic_pathway"],
      flipped_idea: ["emerging_opportunity", "strategic_pathway"],
      concept: ["emerging_opportunity", "strategic_pathway"],
      risk: ["constraint_cluster", "structural_insight"],
      evidence: ["pattern"],
      friction: ["constraint_cluster"],
      competitor: ["pattern"],
    };

    const nodeInsightTypes = insightTypeMap[node.type] || ["pattern"];
    const typeMatch = rule.insightTypes.some(t => nodeInsightTypes.includes(t));
    if (!typeMatch) continue;

    // Check evidence pattern match
    const matchCount = rule.evidencePatterns.filter(p => text.includes(p)).length;
    if (matchCount === 0) continue;

    // Compute relevance score
    const patternBoost = Math.min(matchCount / 3, 1) * 0.3;
    const score = rule.baseScore + patternBoost;

    const tool = getToolById(rule.toolId);
    if (!tool) continue;

    // Generate reason
    const matchedPatterns = rule.evidencePatterns.filter(p => text.includes(p)).slice(0, 2);
    const reason = `Detected ${matchedPatterns.join(", ")} signals`;

    results.push({ tool, score, reason });
  }

  // Sort by score descending, take top 4
  return results.sort((a, b) => b.score - a.score).slice(0, 4);
}

/**
 * Get top tool recommendations across all insights.
 * Returns unique tools ranked by aggregate relevance.
 */
export function recommendToolsFromInsights(
  insights: Insight[],
  evidence: Evidence[] = [],
): ToolRecommendation[] {
  const toolScores = new Map<string, { tool: LensTool; score: number; reasons: string[] }>();

  for (const insight of insights) {
    const relatedEv = evidence
      .filter(e => insight.evidenceIds.includes(e.id))
      .map(e => `${e.label} ${e.description || ""}`);

    const recs = recommendToolsForInsight(
      { label: insight.label, detail: insight.description, type: insight.insightType, reasoning: undefined },
      relatedEv,
    );

    for (const rec of recs) {
      const existing = toolScores.get(rec.tool.id);
      if (existing) {
        existing.score = Math.max(existing.score, rec.score);
        if (!existing.reasons.includes(rec.reason)) {
          existing.reasons.push(rec.reason);
        }
      } else {
        toolScores.set(rec.tool.id, { tool: rec.tool, score: rec.score, reasons: [rec.reason] });
      }
    }
  }

  return Array.from(toolScores.values())
    .map(({ tool, score, reasons }) => ({ tool, score, reason: reasons[0] }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
}
