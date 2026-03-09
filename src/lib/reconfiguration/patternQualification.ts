/**
 * PATTERN QUALIFICATION ENGINE — Stage 3
 *
 * Runs the 6 structural patterns against a StructuralProfile.
 * Returns only qualified patterns (binary gate), ranked by
 * signal density. Typically produces 2-3 qualified patterns.
 */

import type { StructuralProfile } from "./structuralProfile";
import {
  STRUCTURAL_PATTERNS,
  type StructuralPattern,
  type QualificationResult,
  type StrategicBetTemplate,
} from "./patternLibrary";

// ═══════════════════════════════════════════════════════════════
//  QUALIFIED PATTERN — Stage 3 Output
// ═══════════════════════════════════════════════════════════════

export interface QualifiedPattern {
  /** Pattern definition */
  pattern: StructuralPattern;
  /** Qualification details */
  qualification: QualificationResult;
  /** Signal density — number of strength signals (used for ranking) */
  signalDensity: number;
  /** The strategic bet for this pattern, contextualized to the profile */
  strategicBet: StrategicBetTemplate;
}

// ═══════════════════════════════════════════════════════════════
//  QUALIFICATION — Run all patterns through binary gates
// ═══════════════════════════════════════════════════════════════

/**
 * Qualify structural patterns against the profile.
 * Returns only patterns that pass the binary gate, sorted by signal density.
 * Typically 2-3 results; never more than 4.
 */
export function qualifyPatterns(profile: StructuralProfile): QualifiedPattern[] {
  const results: QualifiedPattern[] = [];

  for (const pattern of STRUCTURAL_PATTERNS) {
    const qualification = pattern.qualifies(profile);

    if (!qualification.qualifies) continue;

    results.push({
      pattern,
      qualification,
      signalDensity: qualification.strengthSignals.length,
      strategicBet: pattern.strategicBet,
    });
  }

  // Sort by signal density (most evidence-backed first), cap at 4
  return results
    .sort((a, b) => b.signalDensity - a.signalDensity)
    .slice(0, 4);
}

/**
 * Diagnostic: run all patterns and return full results including disqualified.
 * Useful for debugging and understanding why patterns were rejected.
 */
export function qualifyPatternsWithDiagnostics(
  profile: StructuralProfile,
): { qualified: QualifiedPattern[]; disqualified: { patternId: string; patternName: string; reason: string }[] } {
  const qualified: QualifiedPattern[] = [];
  const disqualified: { patternId: string; patternName: string; reason: string }[] = [];

  for (const pattern of STRUCTURAL_PATTERNS) {
    const qualification = pattern.qualifies(profile);

    if (qualification.qualifies) {
      qualified.push({
        pattern,
        qualification,
        signalDensity: qualification.strengthSignals.length,
        strategicBet: pattern.strategicBet,
      });
    } else {
      disqualified.push({
        patternId: pattern.id,
        patternName: pattern.name,
        reason: qualification.reason,
      });
    }
  }

  return {
    qualified: qualified.sort((a, b) => b.signalDensity - a.signalDensity).slice(0, 4),
    disqualified,
  };
}
