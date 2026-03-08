/**
 * MARKET STRUCTURE ENGINE — Industry-Level Structural Analysis
 *
 * Analyzes the market environment surrounding a product or business
 * to identify structural patterns that create opportunity archetypes.
 *
 * Detects:
 *   - Market fragmentation
 *   - Distribution bottlenecks
 *   - Data concentration / information asymmetry
 *   - Manual workflow prevalence
 *   - Switching costs
 *   - Coordination failures
 *
 * Produces:
 *   - Structural constraints (market-level)
 *   - Structural drivers (market-level root causes)
 *   - Structural opportunities (market-level archetypes)
 *
 * Output feeds into the broader strategic engine alongside
 * product-level constraints and opportunities.
 */

import type { Evidence } from "@/lib/evidenceEngine";
import type { StrategicInsight } from "@/lib/strategicEngine";
import { humanizeLabel as humanize } from "@/lib/humanize";

// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════

export type MarketStructurePattern =
  | "fragmentation"
  | "distribution_bottleneck"
  | "data_concentration"
  | "manual_workflow_prevalence"
  | "high_switching_costs"
  | "coordination_failure"
  | "regulatory_moat"
  | "information_asymmetry";

export type OpportunityArchetype =
  | "aggregation_platform"
  | "vertical_saas"
  | "embedded_fintech"
  | "workflow_automation"
  | "data_network_effect"
  | "marketplace"
  | "rollup_strategy"
  | "disintermediation";

export interface MarketStructureSignal {
  pattern: MarketStructurePattern;
  strength: number; // 0-1
  evidenceIds: string[];
  explanation: string;
}

export interface MarketOpportunityArchetype {
  archetype: OpportunityArchetype;
  /** Human-readable name */
  name: string;
  /** Why this archetype fits */
  rationale: string;
  /** Which market patterns triggered this */
  triggerPatterns: MarketStructurePattern[];
  /** Contraindications — when this archetype fails */
  contraindications: string[];
  /** Implementation complexity */
  complexity: "low" | "moderate" | "high";
  /** Evidence IDs supporting this archetype */
  evidenceIds: string[];
  /** Confidence (0-1) */
  confidence: number;
}

export interface MarketStructureReport {
  /** Detected market patterns */
  patterns: MarketStructureSignal[];
  /** Opportunity archetypes derived from patterns */
  archetypes: MarketOpportunityArchetype[];
  /** Market-level constraints for the strategic engine */
  constraints: StrategicInsight[];
  /** Market-level drivers */
  drivers: StrategicInsight[];
  /** Market-level opportunities */
  opportunities: StrategicInsight[];
}

// ═══════════════════════════════════════════════════════════════
//  PATTERN DETECTION RULES
// ═══════════════════════════════════════════════════════════════

interface PatternRule {
  pattern: MarketStructurePattern;
  /** Keywords in evidence text */
  keywords: RegExp;
  /** Evidence types that strengthen this pattern */
  reinforcingTypes: string[];
  /** Minimum evidence items to trigger */
  minEvidence: number;
}

const PATTERN_RULES: PatternRule[] = [
  {
    pattern: "fragmentation",
    keywords: /fragment|dispersed|cottage|mom[\s-]?and[\s-]?pop|many[\s-]?small|independent|local[\s-]?only|no[\s-]?dominant|highly[\s-]?competitive/i,
    reinforcingTypes: ["competitor", "signal", "constraint"],
    minEvidence: 2,
  },
  {
    pattern: "distribution_bottleneck",
    keywords: /distribut|channel[\s-]?limit|reach|access[\s-]?constrain|geographic|delivery[\s-]?challenge|logistics|shipping[\s-]?cost|last[\s-]?mile/i,
    reinforcingTypes: ["constraint", "friction", "risk"],
    minEvidence: 2,
  },
  {
    pattern: "data_concentration",
    keywords: /data[\s-]?silo|information[\s-]?lock|proprietary[\s-]?data|data[\s-]?advantage|analytics|intelligence|insights[\s-]?from[\s-]?data/i,
    reinforcingTypes: ["leverage", "opportunity", "signal"],
    minEvidence: 1,
  },
  {
    pattern: "manual_workflow_prevalence",
    keywords: /manual|paper[\s-]?based|spreadsheet|hand[\s-]?done|labor[\s-]?intensive|human[\s-]?dependent|non[\s-]?automated|phone[\s-]?call|email[\s-]?based/i,
    reinforcingTypes: ["friction", "constraint", "signal"],
    minEvidence: 2,
  },
  {
    pattern: "high_switching_costs",
    keywords: /switch|lock[\s-]?in|migration|entrenched|embedded|sticky|high[\s-]?cost[\s-]?to[\s-]?change|integration[\s-]?cost/i,
    reinforcingTypes: ["constraint", "risk", "friction"],
    minEvidence: 2,
  },
  {
    pattern: "coordination_failure",
    keywords: /coordinat|misalign|buyer[\s-]?seller|marketplace|matching|two[\s-]?sided|inefficien|friction[\s-]?between|trust[\s-]?gap/i,
    reinforcingTypes: ["friction", "constraint", "signal"],
    minEvidence: 2,
  },
  {
    pattern: "regulatory_moat",
    keywords: /regulat|licens|compliance|certification|barrier[\s-]?to[\s-]?entry|government|policy|legal[\s-]?requirement/i,
    reinforcingTypes: ["constraint", "risk"],
    minEvidence: 1,
  },
  {
    pattern: "information_asymmetry",
    keywords: /information[\s-]?asymmetr|opaque|hidden[\s-]?information|price[\s-]?discover|transpar|buyer[\s-]?doesn.?t[\s-]?know|complex[\s-]?to[\s-]?evaluate/i,
    reinforcingTypes: ["friction", "signal", "constraint"],
    minEvidence: 1,
  },
];

// ═══════════════════════════════════════════════════════════════
//  ARCHETYPE MAPPING
// ═══════════════════════════════════════════════════════════════

interface ArchetypeRule {
  archetype: OpportunityArchetype;
  name: string;
  /** Required trigger patterns (need at least one) */
  triggerPatterns: MarketStructurePattern[];
  /** Optional reinforcing patterns */
  reinforcingPatterns: MarketStructurePattern[];
  /** Contraindications */
  contraindications: string[];
  complexity: "low" | "moderate" | "high";
  rationale: string;
}

const ARCHETYPE_RULES: ArchetypeRule[] = [
  {
    archetype: "aggregation_platform",
    name: "Aggregation Platform",
    triggerPatterns: ["fragmentation"],
    reinforcingPatterns: ["coordination_failure", "distribution_bottleneck"],
    contraindications: ["Requires high volume to reach network effects", "Chicken-and-egg supply/demand problem"],
    complexity: "high",
    rationale: "Fragmented supply creates opportunity for aggregation with standardized quality and unified access",
  },
  {
    archetype: "vertical_saas",
    name: "Vertical SaaS",
    triggerPatterns: ["manual_workflow_prevalence"],
    reinforcingPatterns: ["fragmentation", "information_asymmetry"],
    contraindications: ["Small addressable market may limit growth", "Industry resistance to technology adoption"],
    complexity: "moderate",
    rationale: "Industries dominated by manual processes or spreadsheets are prime targets for purpose-built software",
  },
  {
    archetype: "embedded_fintech",
    name: "Embedded Finance",
    triggerPatterns: ["coordination_failure"],
    reinforcingPatterns: ["manual_workflow_prevalence", "high_switching_costs"],
    contraindications: ["Regulatory complexity", "Requires financial licenses in many jurisdictions"],
    complexity: "high",
    rationale: "Inefficient payment flows or financing gaps create opportunity for embedded financial services",
  },
  {
    archetype: "workflow_automation",
    name: "Workflow Automation",
    triggerPatterns: ["manual_workflow_prevalence"],
    reinforcingPatterns: ["distribution_bottleneck", "data_concentration"],
    contraindications: ["Processes may be too variable for automation", "Organizational change resistance"],
    complexity: "moderate",
    rationale: "Labor-intensive processes with repetitive patterns can be systematized for dramatic efficiency gains",
  },
  {
    archetype: "data_network_effect",
    name: "Data Network Effect",
    triggerPatterns: ["data_concentration"],
    reinforcingPatterns: ["information_asymmetry", "manual_workflow_prevalence"],
    contraindications: ["Data privacy regulations", "Incumbents may already own critical data sets"],
    complexity: "high",
    rationale: "Operational data captured through workflows creates a defensible moat that improves with scale",
  },
  {
    archetype: "marketplace",
    name: "Marketplace Platform",
    triggerPatterns: ["coordination_failure"],
    reinforcingPatterns: ["fragmentation", "information_asymmetry"],
    contraindications: ["Requires critical mass on both sides", "Disintermediation risk after initial match"],
    complexity: "high",
    rationale: "Buyer-seller coordination failures indicate opportunity for a matching or transaction platform",
  },
  {
    archetype: "rollup_strategy",
    name: "Consolidation / Rollup",
    triggerPatterns: ["fragmentation"],
    reinforcingPatterns: ["manual_workflow_prevalence", "regulatory_moat"],
    contraindications: ["Integration complexity across acquisitions", "Capital intensive"],
    complexity: "high",
    rationale: "Fragmented markets with stable cash flows support buy-and-build strategies with operational improvement",
  },
  {
    archetype: "disintermediation",
    name: "Disintermediation",
    triggerPatterns: ["distribution_bottleneck"],
    reinforcingPatterns: ["information_asymmetry", "high_switching_costs"],
    contraindications: ["Intermediaries may provide irreplaceable services", "Channel conflict risk"],
    complexity: "moderate",
    rationale: "Distribution bottlenecks caused by intermediaries create opportunity for direct relationships",
  },
];

// ═══════════════════════════════════════════════════════════════
//  PATTERN DETECTION
// ═══════════════════════════════════════════════════════════════

function detectPatterns(evidence: Evidence[]): MarketStructureSignal[] {
  const signals: MarketStructureSignal[] = [];

  for (const rule of PATTERN_RULES) {
    const matching = evidence.filter(e => {
      const text = `${e.label} ${e.description || ""} ${e.category || ""}`;
      return rule.keywords.test(text);
    });

    if (matching.length < rule.minEvidence) continue;

    // Reinforcement bonus from evidence types
    const reinforced = matching.filter(e => rule.reinforcingTypes.includes(e.type));
    const baseStrength = Math.min(1, matching.length / 5);
    const reinforcementBonus = reinforced.length > 0 ? 0.15 : 0;
    const strength = Math.min(1, baseStrength + reinforcementBonus);

    signals.push({
      pattern: rule.pattern,
      strength,
      evidenceIds: matching.map(e => e.id),
      explanation: `${matching.length} evidence items indicate ${rule.pattern.replace(/_/g, " ")} pattern${reinforced.length > 0 ? ` (${reinforced.length} reinforcing)` : ""}`,
    });
  }

  return signals.sort((a, b) => b.strength - a.strength);
}

// ═══════════════════════════════════════════════════════════════
//  ARCHETYPE DERIVATION
// ═══════════════════════════════════════════════════════════════

function deriveArchetypes(
  patterns: MarketStructureSignal[],
): MarketOpportunityArchetype[] {
  const activePatterns = new Set(patterns.map(p => p.pattern));
  const patternMap = new Map(patterns.map(p => [p.pattern, p]));
  const archetypes: MarketOpportunityArchetype[] = [];

  for (const rule of ARCHETYPE_RULES) {
    // Check if at least one trigger pattern is active
    const activeTriggers = rule.triggerPatterns.filter(p => activePatterns.has(p));
    if (activeTriggers.length === 0) continue;

    // Score based on trigger + reinforcing pattern coverage
    const activeReinforcing = rule.reinforcingPatterns.filter(p => activePatterns.has(p));
    const triggerStrength = activeTriggers.reduce((s, p) => s + (patternMap.get(p)?.strength ?? 0), 0) / activeTriggers.length;
    const reinforcementBonus = activeReinforcing.length * 0.1;
    const confidence = Math.min(1, triggerStrength + reinforcementBonus);

    // Collect all evidence IDs from trigger + reinforcing patterns
    const allPatterns = [...activeTriggers, ...activeReinforcing];
    const evidenceIds = [...new Set(allPatterns.flatMap(p => patternMap.get(p)?.evidenceIds ?? []))];

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
//  CONVERT TO STRATEGIC INSIGHTS
// ═══════════════════════════════════════════════════════════════

function patternsToConstraints(
  patterns: MarketStructureSignal[],
  analysisId: string,
  idGenerator: (prefix: string) => string,
): StrategicInsight[] {
  const now = Date.now();
  return patterns
    .filter(p => p.strength >= 0.3)
    .map(p => ({
      id: idGenerator("mkt-constraint"),
      analysisId,
      insightType: "constraint_cluster" as const,
      label: `Market: ${p.pattern.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}`,
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
  idGenerator: (prefix: string) => string,
): StrategicInsight[] {
  const now = Date.now();
  return archetypes
    .filter(a => a.confidence >= 0.25)
    .slice(0, 5) // Cap at 5 market-level opportunities
    .map(a => ({
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
  idGenerator: (prefix: string) => string,
): MarketStructureReport {
  // Detect market-level structural patterns
  const patterns = detectPatterns(evidence);

  // Derive opportunity archetypes from patterns
  const archetypes = deriveArchetypes(patterns);

  // Convert to strategic insights
  const constraints = patternsToConstraints(patterns, analysisId, idGenerator);
  const constraintIds = constraints.map(c => c.id);

  // Drivers: the strongest patterns become drivers
  const drivers: StrategicInsight[] = patterns
    .filter(p => p.strength >= 0.4)
    .slice(0, 3)
    .map(p => ({
      id: idGenerator("mkt-driver"),
      analysisId,
      insightType: "driver" as const,
      label: `Market Driver: ${p.pattern.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}`,
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

  const opportunities = archetypesToOpportunities(archetypes, constraintIds, analysisId, idGenerator);

  return {
    patterns,
    archetypes,
    constraints,
    drivers,
    opportunities,
  };
}
