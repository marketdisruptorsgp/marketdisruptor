/**
 * Market Structure Engine — Public API
 *
 * Re-exports everything from the modular engine for backward compatibility.
 */

export { analyzeMarketStructure } from "./engine";
export type {
  MarketStructurePattern,
  OpportunityArchetype,
  MarketStructureSignal,
  MarketOpportunityArchetype,
  MarketStructureReport,
  MarketSignalScores,
  PatternRule,
  ArchetypeRule,
} from "./types";
