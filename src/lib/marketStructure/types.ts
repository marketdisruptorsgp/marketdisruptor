/**
 * Market Structure Engine — Type Definitions
 */

import type { Evidence } from "@/lib/evidenceEngine";
import type { StrategicInsight } from "@/lib/strategicEngine";

// ═══════════════════════════════════════════════════════════════
//  STRUCTURAL SIGNAL TYPES
// ═══════════════════════════════════════════════════════════════

export type MarketStructurePattern =
  | "fragmentation"
  | "distribution_bottleneck"
  | "data_concentration"
  | "manual_workflow_prevalence"
  | "high_switching_costs"
  | "coordination_failure"
  | "regulatory_moat"
  | "information_asymmetry"
  // New operator-focused signals
  | "margin_concentration"
  | "outdated_pricing_model"
  | "productizable_service"
  | "asset_heavy_incumbents"
  | "aging_ownership"
  | "distribution_control_point";

export type OpportunityArchetype =
  | "aggregation_platform"
  | "vertical_saas"
  | "embedded_fintech"
  | "workflow_automation"
  | "data_network_effect"
  | "marketplace"
  | "rollup_strategy"
  | "disintermediation"
  // New operator-focused archetypes
  | "vertical_integration"
  | "distribution_capture"
  | "productization"
  | "asset_light_restructuring"
  | "pricing_model_redesign"
  | "succession_acquisition";

export interface MarketStructureSignal {
  pattern: MarketStructurePattern;
  strength: number; // 0-1
  evidenceIds: string[];
  explanation: string;
}

export interface MarketOpportunityArchetype {
  archetype: OpportunityArchetype;
  name: string;
  rationale: string;
  triggerPatterns: MarketStructurePattern[];
  contraindications: string[];
  complexity: "low" | "moderate" | "high";
  evidenceIds: string[];
  confidence: number;
}

export interface MarketStructureReport {
  patterns: MarketStructureSignal[];
  archetypes: MarketOpportunityArchetype[];
  constraints: StrategicInsight[];
  drivers: StrategicInsight[];
  opportunities: StrategicInsight[];
  /** Numeric signal scores for persisting to market_signals table */
  signalScores: MarketSignalScores;
}

/** Matches market_signals table columns */
export interface MarketSignalScores {
  fragmentation_index: number | null;
  margin_distribution: number | null;
  pricing_model_age: number | null;
  productizability_score: number | null;
  asset_intensity_score: number | null;
  ownership_demographics_score: number | null;
  distribution_control_score: number | null;
}

// ═══════════════════════════════════════════════════════════════
//  PATTERN RULE DEFINITION
// ═══════════════════════════════════════════════════════════════

export interface PatternRule {
  pattern: MarketStructurePattern;
  keywords: RegExp;
  reinforcingTypes: string[];
  minEvidence: number;
  /** Which signal score column this maps to (if any) */
  scoreColumn?: keyof MarketSignalScores;
}

export interface ArchetypeRule {
  archetype: OpportunityArchetype;
  name: string;
  triggerPatterns: MarketStructurePattern[];
  reinforcingPatterns: MarketStructurePattern[];
  contraindications: string[];
  complexity: "low" | "moderate" | "high";
  rationale: string;
}
