/**
 * EVIDENCE ADAPTERS — Unified bridge for all local engines → Evidence
 *
 * Re-exports from evidenceBridge.ts for backward compatibility,
 * plus additional converters for remaining engine types.
 */

export {
  bridgeInnovationToEvidence as convertInnovationOpportunityToEvidence,
  bridgeSignalsToEvidence as convertDetectedSignalToEvidence,
  bridgeFinancialToEvidence as convertFinancialSignalToEvidence,
  bridgeCompetitorsToEvidence as convertCompetitorFindingToEvidence,
} from "@/lib/evidenceBridge";

export {
  bridgeInnovationToEvidence,
  bridgeSignalsToEvidence,
  bridgeFinancialToEvidence,
  bridgeCompetitorsToEvidence,
} from "@/lib/evidenceBridge";
