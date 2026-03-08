/**
 * Market Structure Engine — Core Logic
 *
 * Detects structural patterns in evidence, derives opportunity archetypes,
 * and converts them to strategic insights. Produces signal scores for
 * persistence to the market_signals table.
 */

import type { Evidence } from "@/lib/evidenceEngine";
import type { StrategicInsight } from "@/lib/strategicEngine";
import type {
  MarketStructureSignal,
  MarketOpportunityArchetype,
  MarketStructureReport,
  MarketSignalScores,
} from "./types";
import { PATTERN_RULES } from "./patternRules";
import { ARCHETYPE_RULES } from "./archetypeRules";

// ═══════════════════════════════════════════════════════════════
//  PATTERN DETECTION
// ═══════════════════════════════════════════════════════════════

function detectPatterns(evidence: Evidence[]): MarketStructureSignal[] {
  const signals: MarketStructureSignal[] = [];

  for (const rule of PATTERN_RULES) {
    const matching = evidence.filter((e) => {
      const text = `${e.label} ${e.description || ""} ${e.category || ""}`;
      return rule.keywords.test(text);
    });

    if (matching.length < rule.minEvidence) continue;

    const reinforced = matching.filter((e) =>
      rule.reinforcingTypes.includes(e.type)
    );
    const baseStrength = Math.min(1, matching.length / 5);
    const reinforcementBonus = reinforced.length > 0 ? 0.15 : 0;
    const strength = Math.min(1, baseStrength + reinforcementBonus);

    signals.push({
      pattern: rule.pattern,
      strength,
      evidenceIds: matching.map((e) => e.id),
      explanation: `${matching.length} evidence items indicate ${rule.pattern.replace(/_/g, " ")} pattern${
        reinforced.length > 0 ? ` (${reinforced.length} reinforcing)` : ""
      }`,
    });
  }

  return signals.sort((a, b) => b.strength - a.strength);
}

// ═══════════════════════════════════════════════════════════════
//  ARCHETYPE DERIVATION
// ═══════════════════════════════════════════════════════════════

function deriveArchetypes(
  patterns: MarketStructureSignal[]
): MarketOpportunityArchetype[] {
  const activePatterns = new Set(patterns.map((p) => p.pattern));
  const patternMap = new Map(patterns.map((p) => [p.pattern, p]));
  const archetypes: MarketOpportunityArchetype[] = [];

  for (const rule of ARCHETYPE_RULES) {
    const activeTriggers = rule.triggerPatterns.filter((p) =>
      activePatterns.has(p)
    );
    if (activeTriggers.length === 0) continue;

    const activeReinforcing = rule.reinforcingPatterns.filter((p) =>
      activePatterns.has(p)
    );
    const triggerStrength =
      activeTriggers.reduce(
        (s, p) => s + (patternMap.get(p)?.strength ?? 0),
        0
      ) / activeTriggers.length;
    const reinforcementBonus = activeReinforcing.length * 0.1;
    const confidence = Math.min(1, triggerStrength + reinforcementBonus);

    const allPatterns = [...activeTriggers, ...activeReinforcing];
    const evidenceIds = [
      ...new Set(
        allPatterns.flatMap((p) => patternMap.get(p)?.evidenceIds ?? [])
      ),
    ];

    archetypes.push({
      archetype: rule.archetype,
      name: rule.name,
      rationale: rule.rationale,
      triggerPatterns: activeTriggers,
      contraindications: rule.contraindications,
      complexity: rule.complexity,
      evidenceIds,
      confidence,
    });
  }

  return archetypes.sort((a, b) => b.confidence - a.confidence);
}

// ═══════════════════════════════════════════════════════════════
//  SIGNAL SCORES (for market_signals table)
// ═══════════════════════════════════════════════════════════════

function computeSignalScores(
  patterns: MarketStructureSignal[]
): MarketSignalScores {
  const patternMap = new Map(patterns.map((p) => [p.pattern, p]));
  const ruleMap = new Map(PATTERN_RULES.map((r) => [r.pattern, r]));

  const scores: MarketSignalScores = {
    fragmentation_index: null,
    margin_distribution: null,
    pricing_model_age: null,
    productizability_score: null,
    asset_intensity_score: null,
    ownership_demographics_score: null,
    distribution_control_score: null,
  };

  for (const [pattern, signal] of patternMap) {
    const rule = ruleMap.get(pattern);
    if (rule?.scoreColumn && rule.scoreColumn in scores) {
      // If multiple patterns map to the same column, take the max
      const current = scores[rule.scoreColumn];
      scores[rule.scoreColumn] =
        current === null ? signal.strength : Math.max(current, signal.strength);
    }
  }

  return scores;
}

// ═══════════════════════════════════════════════════════════════
//  CONVERT TO STRATEGIC INSIGHTS
// ═══════════════════════════════════════════════════════════════

function patternsToConstraints(
  patterns: MarketStructureSignal[],
  analysisId: string,
  idGenerator: (prefix: string) => string
): StrategicInsight[] {
  const now = Date.now();
  return patterns
    .filter((p) => p.strength >= 0.3)
    .map((p) => ({
      id: idGenerator("mkt-constraint"),
      analysisId,
      insightType: "constraint_cluster" as const,
      label: `Market: ${p.pattern
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())}`,
      description: `Market-level structural pattern: ${p.explanation}`,
      evidenceIds: p.evidenceIds,
      relatedInsightIds: [],
      impact: Math.round(p.strength * 8 + 2),
      confidence: Math.round(p.strength * 100) / 100,
      createdAt: now,
      tier: "structural" as const,
      mode: "product" as const,
      confidenceScore: Math.round(p.strength * 100) / 100,
      recommendedTools: [],
    }));
}

function archetypesToOpportunities(
  archetypes: MarketOpportunityArchetype[],
  marketConstraintIds: string[],
  analysisId: string,
  idGenerator: (prefix: string) => string
): StrategicInsight[] {
  const now = Date.now();
  return archetypes
    .filter((a) => a.confidence >= 0.25)
    .slice(0, 5)
    .map((a) => ({
      id: idGenerator("mkt-opportunity"),
      analysisId,
      insightType: "emerging_opportunity" as const,
      label: `Market Opportunity: ${a.name}`,
      description: `${a.rationale}. Contraindications: ${a.contraindications.join("; ")}.`,
      evidenceIds: a.evidenceIds,
      relatedInsightIds: marketConstraintIds,
      impact: Math.round(a.confidence * 7 + 3),
      confidence: Math.round(a.confidence * 100) / 100,
      createdAt: now,
      tier: "structural" as const,
      mode: "product" as const,
      confidenceScore: Math.round(a.confidence * 100) / 100,
      recommendedTools: [],
    }));
}

// ═══════════════════════════════════════════════════════════════
//  MAIN ENTRY POINT
// ═══════════════════════════════════════════════════════════════

export function analyzeMarketStructure(
  evidence: Evidence[],
  analysisId: string,
  idGenerator: (prefix: string) => string
): MarketStructureReport {
  const patterns = detectPatterns(evidence);
  const archetypes = deriveArchetypes(patterns);
  const signalScores = computeSignalScores(patterns);

  const constraints = patternsToConstraints(patterns, analysisId, idGenerator);
  const constraintIds = constraints.map((c) => c.id);

  const drivers: StrategicInsight[] = patterns
    .filter((p) => p.strength >= 0.4)
    .slice(0, 3)
    .map((p) => ({
      id: idGenerator("mkt-driver"),
      analysisId,
      insightType: "driver" as const,
      label: `Market Driver: ${p.pattern
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())}`,
      description: `Structural market condition driving constraints: ${p.explanation}`,
      evidenceIds: p.evidenceIds,
      relatedInsightIds: constraintIds,
      impact: Math.round(p.strength * 7 + 3),
      confidence: Math.round(p.strength * 100) / 100,
      createdAt: Date.now(),
      tier: "structural" as const,
      mode: "product" as const,
      confidenceScore: Math.round(p.strength * 100) / 100,
      recommendedTools: [],
    }));

  const opportunities = archetypesToOpportunities(
    archetypes,
    constraintIds,
    analysisId,
    idGenerator
  );

  return {
    patterns,
    archetypes,
    constraints,
    drivers,
    opportunities,
    signalScores,
  };
}
