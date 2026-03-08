/**
 * MARKET STRUCTURE ENGINE — Re-export shim
 *
 * This file now re-exports from the modular src/lib/marketStructure/ package.
 * Kept for backward compatibility with existing imports.
 */

export {
  analyzeMarketStructure,
  type MarketStructurePattern,
  type OpportunityArchetype,
  type MarketStructureSignal,
  type MarketOpportunityArchetype,
  type MarketStructureReport,
  type MarketSignalScores,
  type PatternRule,
  type ArchetypeRule,
} from "@/lib/marketStructure";
