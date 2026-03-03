/**
 * BRANCH ISOLATION ENGINE (with Strategic Profile + Combined Mode support)
 * 
 * Extracts the active root hypothesis (or all hypotheses in combined mode)
 * and builds an isolated constraint context for downstream reasoning,
 * including archetype-specific weights and thresholds.
 */

export interface ActiveBranchContext {
  branch_id: string;
  constraint_type: string;
  hypothesis_statement: string;
  causal_chain: Array<{
    friction_id: string;
    structural_constraint: string;
    system_impact: string;
    impact_dimension: string;
  }>;
  friction_sources: string[];
  leverage_score: number;
  impact_score: number;
  evidence_mix: { verified: number; modeled: number; assumption: number };
  fragility_score: number;
  confidence: number;
  downstream_implications: string;
  dominance_score?: number;
}

export interface CombinedBranchContext {
  mode: "combined";
  hypotheses: ActiveBranchContext[];
  tensions: string[];
}

export interface StrategicProfilePayload {
  archetype: string;
  risk_tolerance: string;
  capital_intensity_tolerance: number;
  time_horizon_months: number;
  evidence_threshold: number;
  macro_posture: {
    capital_discipline_bias: number;
    speed_bias: number;
    reliability_bias: number;
    defensibility_bias: number;
  };
}

const ARCHETYPE_WEIGHTS: Record<string, Record<string, number>> = {
  operator: { cost: 1.2, reliability: 1.3, scale: 1.1, speed: 0.9 },
  eta_acquirer: { cost: 1.3, reliability: 1.4, risk: 1.3, scale: 1.2, speed: 0.8 },
  venture_growth: { scale: 1.4, speed: 1.3, adoption: 1.2, cost: 0.9, reliability: 0.9 },
  bootstrapped_founder: { cost: 1.4, speed: 1.1 },
  enterprise_strategist: { defensibility: 1.4, reliability: 1.3 },
};

function parseHypothesis(match: any): ActiveBranchContext {
  return {
    branch_id: match.id,
    constraint_type: match.constraint_type || "unknown",
    hypothesis_statement: match.hypothesis_statement || "",
    causal_chain: match.causal_chain || [],
    friction_sources: match.friction_sources || [],
    leverage_score: match.leverage_score ?? 5,
    impact_score: match.impact_score ?? 5,
    evidence_mix: match.evidence_mix || { verified: 0.2, modeled: 0.5, assumption: 0.3 },
    fragility_score: match.fragility_score ?? 5,
    confidence: match.confidence ?? 50,
    downstream_implications: match.downstream_implications || "",
    dominance_score: match.dominance_score,
  };
}

/**
 * Extract the active branch hypothesis from governed constraint_map.
 * Returns null for combined mode (use extractCombinedBranches instead).
 */
export function extractActiveBranch(
  governed: Record<string, unknown> | null | undefined,
  activeBranchId: string | null | undefined
): ActiveBranchContext | null {
  if (!governed || !activeBranchId || activeBranchId === "combined") return null;

  let hypotheses: unknown[] | undefined;
  
  if (Array.isArray((governed as any).root_hypotheses)) {
    hypotheses = (governed as any).root_hypotheses;
  } else {
    const cm = governed.constraint_map as Record<string, unknown> | undefined;
    if (cm && Array.isArray(cm.root_hypotheses)) {
      hypotheses = cm.root_hypotheses as unknown[];
    }
  }

  if (!hypotheses || hypotheses.length === 0) return null;

  const match = hypotheses.find((h: any) => h.id === activeBranchId) as any;
  if (!match) return null;

  return parseHypothesis(match);
}

/**
 * Extract ALL hypotheses for combined mode reasoning.
 */
export function extractCombinedBranches(
  governed: Record<string, unknown> | null | undefined
): CombinedBranchContext | null {
  if (!governed) return null;

  let hypotheses: unknown[] | undefined;
  if (Array.isArray((governed as any).root_hypotheses)) {
    hypotheses = (governed as any).root_hypotheses;
  } else {
    const cm = governed.constraint_map as Record<string, unknown> | undefined;
    if (cm && Array.isArray(cm.root_hypotheses)) {
      hypotheses = cm.root_hypotheses as unknown[];
    }
  }

  if (!hypotheses || hypotheses.length === 0) return null;

  const branches = hypotheses.map((h: any) => parseHypothesis(h));
  
  // Detect tensions
  const tensions: string[] = [];
  for (let i = 0; i < branches.length; i++) {
    for (let j = i + 1; j < branches.length; j++) {
      const a = branches[i];
      const b = branches[j];
      if (Math.abs((a.dominance_score ?? 0) - (b.dominance_score ?? 0)) < 2) {
        tensions.push(`"${a.constraint_type}" and "${b.constraint_type}" are nearly equal in weight — a genuine tradeoff.`);
      }
    }
  }

  return { mode: "combined", hypotheses: branches, tensions };
}

/**
 * Build a prompt injection section for combined or isolated mode.
 */
export function buildBranchIsolationPrompt(
  branch: ActiveBranchContext | null,
  profile?: StrategicProfilePayload | null,
  combined?: CombinedBranchContext | null
): string {
  // Combined mode: all hypotheses
  if (combined && combined.hypotheses.length > 0) {
    const hypothesesStr = combined.hypotheses.map((h, i) => {
      const evidenceStr = `Verified: ${Math.round(h.evidence_mix.verified * 100)}%, Modeled: ${Math.round(h.evidence_mix.modeled * 100)}%, Assumed: ${Math.round(h.evidence_mix.assumption * 100)}%`;
      const causalStr = h.causal_chain.map((c, j) =>
        `    ${j + 1}. [${c.friction_id}] ${c.structural_constraint} → ${c.system_impact} (${c.impact_dimension})`
      ).join("\n");
      return `
  HYPOTHESIS #${i + 1}: ${h.hypothesis_statement}
    Constraint Type: ${h.constraint_type}
    Leverage: ${h.leverage_score}/10 | Impact: ${h.impact_score}/10 | Fragility: ${h.fragility_score}/10
    Confidence: ${h.confidence}% | Evidence: ${evidenceStr}
    Dominance Score: ${h.dominance_score?.toFixed(2) ?? "N/A"}
    Causal Chain:
${causalStr || "      None"}
    Downstream: ${h.downstream_implications}`;
    }).join("\n");

    const tensionStr = combined.tensions.length > 0
      ? `\nTENSIONS TO ADDRESS:\n${combined.tensions.map((t, i) => `  ${i + 1}. ${t}`).join("\n")}`
      : "";

    let profileSection = "";
    if (profile) {
      profileSection = `
STRATEGIC PROFILE:
  Archetype: ${profile.archetype}
  Risk Tolerance: ${profile.risk_tolerance}
  Time Horizon: ${profile.time_horizon_months} months
`;
    }

    return `

══════════════════════════════════════════════
COMBINED STRUCTURAL ANALYSIS (ALL HYPOTHESES)
══════════════════════════════════════════════

CRITICAL: You are reasoning across ALL structural hypotheses simultaneously.
Weight each hypothesis by its dominance score. Where hypotheses conflict,
EXPLICITLY call out the tension and present it as a decision point.

${hypothesesStr}
${tensionStr}
${profileSection}
RULES FOR COMBINED REASONING:
1. Weight recommendations by each hypothesis's dominance score
2. Where hypotheses CONFLICT, surface the tension explicitly as a tradeoff
3. Solutions should address the highest-leverage constraints first
4. Confidence scores reflect the WEAKEST evidence across relevant hypotheses
5. Flag areas where focusing on one constraint worsens another
══════════════════════════════════════════════
`;
  }

  // Isolated mode (existing behavior)
  if (!branch) return "";

  const evidenceStr = `Verified: ${Math.round(branch.evidence_mix.verified * 100)}%, Modeled: ${Math.round(branch.evidence_mix.modeled * 100)}%, Assumed: ${Math.round(branch.evidence_mix.assumption * 100)}%`;

  const causalStr = branch.causal_chain.map((c, i) =>
    `  ${i + 1}. [${c.friction_id}] ${c.structural_constraint} → ${c.system_impact} (${c.impact_dimension})`
  ).join("\n");

  let profileSection = "";
  if (profile) {
    const weights = ARCHETYPE_WEIGHTS[profile.archetype] || {};
    const constraintWeight = weights[branch.constraint_type] || 1;
    profileSection = `
STRATEGIC PROFILE:
  Archetype: ${profile.archetype}
  Risk Tolerance: ${profile.risk_tolerance}
  Evidence Threshold: ${Math.round(profile.evidence_threshold * 100)}% verified required
  Time Horizon: ${profile.time_horizon_months} months
  Capital Tolerance: ${profile.capital_intensity_tolerance}/10
  Constraint Weight for "${branch.constraint_type}": ${constraintWeight}x

PROFILE-SPECIFIC RULES:
- Solutions exceeding ${profile.time_horizon_months}-month horizon receive reduced confidence
- Capital requirements must respect ${profile.capital_intensity_tolerance}/10 tolerance
- Evidence below ${Math.round(profile.evidence_threshold * 100)}% verified degrades confidence scores
- ${profile.risk_tolerance === "low" ? "Conservative recommendations preferred — minimize downside" : profile.risk_tolerance === "high" ? "Aggressive recommendations acceptable — prioritize upside" : "Balanced risk recommendations"}
`;
  }

  return `

══════════════════════════════════════════════
ACTIVE STRUCTURAL BRANCH (ISOLATED REASONING)
══════════════════════════════════════════════

CRITICAL: You are reasoning within a SPECIFIC structural hypothesis branch.
ALL analysis, recommendations, stress tests, and solutions MUST reference
ONLY this branch's constraint data. NO blended reasoning. NO cross-contamination.
This branch represents a COMPLETE strategic universe.

ACTIVE HYPOTHESIS: ${branch.hypothesis_statement}
CONSTRAINT TYPE: ${branch.constraint_type}
LEVERAGE SCORE: ${branch.leverage_score}/10
IMPACT SCORE: ${branch.impact_score}/10
FRAGILITY: ${branch.fragility_score}/10
CONFIDENCE: ${branch.confidence}%
EVIDENCE: ${evidenceStr}

CAUSAL CHAIN (this branch's structural pathway):
${causalStr || "  No causal chain provided."}

FRICTION SOURCES: ${branch.friction_sources.join(", ") || "None specified"}

DOWNSTREAM IMPLICATIONS: ${branch.downstream_implications}
${profileSection}
RULES FOR BRANCH-ISOLATED REASONING:
1. Every constraint reference MUST trace to this branch's causal chain
2. Solutions MUST target this branch's friction sources
3. Stress tests MUST challenge this branch's specific hypothesis
4. Confidence scores MUST be bounded by this branch's evidence mix
5. Do NOT reference alternative hypotheses or blend constraint data
6. If this branch's evidence is weak (>50% assumed), flag lower confidence
══════════════════════════════════════════════
`;
}
