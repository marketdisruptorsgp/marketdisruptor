/**
 * Pipeline — Public API
 * 
 * Orchestration utilities for the full discovery pipeline:
 * Market Structure → Opportunity Zones → Concept Generation → Evaluation → Search
 */

export {
  runAnalogValidation,
  ANALOG_USAGE_NOTE,
  type ValidationReport,
} from "./validateAnalogMatching";
