/**
 * PATTERN QUALIFICATION ENGINE — Stage 3
 *
 * Runs the 6 structural patterns against a StructuralProfile.
 * Returns only qualified patterns (binary gate), ranked by
 * signal density. Typically produces 1-2 qualified patterns.
 *
 * When ETA dimensions are active, applies additional acquisition-aware
 * gates that filter patterns based on owner-dependency, acquisition
 * complexity, and improvement runway.
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
  /** ETA-specific boost/penalty applied to ranking */
  etaAdjustment: number;
}

// ═══════════════════════════════════════════════════════════════
//  ETA GATES — Acquisition-Aware Pattern Filtering
// ═══════════════════════════════════════════════════════════════

/**
 * Additional ETA gates that run AFTER the base pattern qualification.
 * These filter out patterns that are structurally valid but impractical
 * for an owner-operator acquirer.
 */
function applyEtaGates(
  pattern: StructuralPattern,
  profile: StructuralProfile,
): { blocked: boolean; reason: string; boost: number } {
  if (!profile.etaActive) return { blocked: false, reason: "", boost: 0 };

  const ownerDep = profile.ownerDependency;
  const acqComplexity = profile.acquisitionComplexity;
  const runway = profile.improvementRunway;

  // Block patterns that require platform-scale execution for owner-critical businesses
  if (ownerDep === "owner_critical" && pattern.id === "aggregation") {
    return { blocked: true, reason: "Owner-critical business — aggregation requires platform-scale operations incompatible with owner-operator model.", boost: 0 };
  }

  // Block aggregation/rebundling if acquisition is already prohibitively complex
  if (acqComplexity === "prohibitive" && (pattern.id === "aggregation" || pattern.id === "rebundling")) {
    return { blocked: true, reason: `Prohibitive acquisition complexity — ${pattern.name.toLowerCase()} adds operational complexity an acquirer cannot absorb.`, boost: 0 };
  }

  // Boost infrastructure abstraction when improvement runway is high — this is the ETA sweet spot
  let boost = 0;
  if (pattern.id === "infrastructure_abstraction" && (runway === "transformative" || runway === "significant")) {
    boost += 2; // Strong ETA signal: codify expertise into scalable infrastructure
  }

  // Boost supply chain relocation when owner-dependency is high — direct path to reducing key-person risk
  if (pattern.id === "supply_chain_relocation" && (ownerDep === "owner_critical" || ownerDep === "owner_reliant")) {
    boost += 1; // Relocation can reduce owner dependency by changing the value delivery model
  }

  // Penalize patterns that increase operational complexity for turnkey businesses
  if (acqComplexity === "turnkey" && (pattern.id === "rebundling" || pattern.id === "aggregation")) {
    boost -= 1; // Don't add complexity to a simple acquisition
  }

  // Boost stakeholder monetization when runway is limited — extract value without restructuring
  if (pattern.id === "stakeholder_monetization" && runway === "incremental") {
    boost += 1;
  }

  return { blocked: false, reason: "", boost };
}

// ═══════════════════════════════════════════════════════════════
//  QUALIFICATION — Run all patterns through binary gates
// ═══════════════════════════════════════════════════════════════

/**
 * Qualify structural patterns against the profile.
 * Returns only patterns that pass the binary gate, sorted by signal density.
 * When ETA is active, applies acquisition-aware gates on top.
 * Typically 1-2 results; never more than 4.
 */
export function qualifyPatterns(profile: StructuralProfile): QualifiedPattern[] {
  const results: QualifiedPattern[] = [];

  for (const pattern of STRUCTURAL_PATTERNS) {
    const qualification = pattern.qualifies(profile);

    if (!qualification.qualifies) continue;

    // Apply ETA gates if active
    const etaResult = applyEtaGates(pattern, profile);
    if (etaResult.blocked) continue;

    results.push({
      pattern,
      qualification,
      signalDensity: qualification.strengthSignals.length + etaResult.boost,
      strategicBet: pattern.strategicBet,
      etaAdjustment: etaResult.boost,
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

    if (!qualification.qualifies) {
      disqualified.push({
        patternId: pattern.id,
        patternName: pattern.name,
        reason: qualification.reason,
      });
      continue;
    }

    // Apply ETA gates
    const etaResult = applyEtaGates(pattern, profile);
    if (etaResult.blocked) {
      disqualified.push({
        patternId: pattern.id,
        patternName: pattern.name,
        reason: `[ETA Gate] ${etaResult.reason}`,
      });
      continue;
    }

    qualified.push({
      pattern,
      qualification,
      signalDensity: qualification.strengthSignals.length + etaResult.boost,
      strategicBet: pattern.strategicBet,
      etaAdjustment: etaResult.boost,
    });
  }

  return {
    qualified: qualified.sort((a, b) => b.signalDensity - a.signalDensity).slice(0, 4),
    disqualified,
  };
}
