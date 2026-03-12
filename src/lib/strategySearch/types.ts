/**
 * STRATEGY SEARCH ENGINE — Type Definitions
 *
 * Evolutionary search over strategy candidates.
 * Operates at the strategic level (constraints × patterns × mechanisms)
 * rather than the concept level (features like pricing, distribution).
 */

import type { StructuralProfile } from "@/lib/reconfiguration/structuralProfile";
import type { StructuralPattern } from "@/lib/reconfiguration/patternLibrary";
import type { ConstraintCandidate } from "@/lib/constraintDetectionEngine";

// ═══════════════════════════════════════════════════════════════
//  STRATEGY CANDIDATE — What the search generates and evaluates
// ═══════════════════════════════════════════════════════════════

export interface StrategyCandidate {
  id: string;
  /** The binding constraint this strategy addresses */
  constraintId: string;
  constraintName: string;
  /** The structural pattern applied */
  patternId: string;
  patternName: string;
  /** The strategic mechanism — HOW the pattern resolves the constraint */
  mechanism: string;
  /** Which operator profile this suits (default, eta, growth, etc.) */
  operatorFit: "any" | "eta" | "growth" | "turnaround";
  /** Composite features for diversity measurement */
  features: StrategyFeatures;
  /** Cross-domain analogy provenance (if this candidate originated from the analogy library) */
  sourceAnalogy?: {
    company: string;
    industry: string;
    primitive: string;
    similarityScore: number;
  };
}

export interface StrategyFeatures {
  /** Which constraint category is targeted */
  constraintCategory: string;
  /** Pattern family */
  patternFamily: "supply_side" | "demand_side" | "pricing" | "network" | "timing" | "integration";
  /** Revenue model shift implied */
  revenueShift: "none" | "recurring" | "outcome" | "freemium" | "marketplace" | "ecosystem";
  /** Distribution change implied */
  distributionChange: "none" | "direct" | "platform" | "network" | "vertical";
  /** Primary moat created */
  moatType: "none" | "data" | "network_effect" | "switching_cost" | "regulatory" | "scale" | "brand";
  /** Time horizon */
  timeHorizon: "immediate" | "short" | "medium" | "long";
}

// ═══════════════════════════════════════════════════════════════
//  STRATEGY EVALUATION — Fast deterministic scoring
// ═══════════════════════════════════════════════════════════════

export interface StrategyEvaluation {
  candidateId: string;
  /** How well the strategy fits the structural profile (0-1) */
  structuralFit: number;
  /** How novel is this strategy relative to the current business model (0-1) */
  novelty: number;
  /** How feasible given the profile constraints (0-1) */
  feasibility: number;
  /** Composite score */
  composite: number;
}

// ═══════════════════════════════════════════════════════════════
//  SEARCH CONFIG
// ═══════════════════════════════════════════════════════════════

export interface StrategySearchConfig {
  /** Initial candidate pool size (default 40) */
  populationSize: number;
  /** Max search iterations (default 5) */
  maxIterations: number;
  /** Fraction kept as survivors (default 0.25) */
  survivorRate: number;
  /** Mutation rate (default 0.5) */
  mutationRate: number;
  /** Fresh generation rate (default 0.3) */
  freshRate: number;
  /** Convergence threshold (default 0.01) */
  convergenceThreshold: number;
  /** Final output count (default 8) */
  outputCount: number;
}

export const DEFAULT_STRATEGY_SEARCH_CONFIG: StrategySearchConfig = {
  populationSize: 40,
  maxIterations: 5,
  survivorRate: 0.25,
  mutationRate: 0.5,
  freshRate: 0.3,
  convergenceThreshold: 0.01,
  outputCount: 8,
};

// ═══════════════════════════════════════════════════════════════
//  SEARCH RESULT
// ═══════════════════════════════════════════════════════════════

export interface StrategySearchResult {
  /** Top diverse strategies for AI deepening */
  strategies: (StrategyCandidate & { evaluation: StrategyEvaluation })[];
  /** Total candidates evaluated */
  totalEvaluated: number;
  /** Iterations run */
  iterationsRun: number;
  /** Why the search stopped */
  stopReason: "converged" | "max_iterations";
}
