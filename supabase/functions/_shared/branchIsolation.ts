/**
 * BRANCH ISOLATION ENGINE
 * 
 * Extracts the active root hypothesis from governed data
 * and builds an isolated constraint context for downstream reasoning.
 * 
 * Rule: When a branch is active, ALL downstream reasoning
 * references ONLY that branch's constraint data. No blending.
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

/**
 * Extract the active branch hypothesis from governed constraint_map.
 * Returns null if no branch is selected or data is missing.
 */
export function extractActiveBranch(
  governed: Record<string, unknown> | null | undefined,
  activeBranchId: string | null | undefined
): ActiveBranchContext | null {
  if (!governed || !activeBranchId) return null;

  // root_hypotheses can be at governed.root_hypotheses (promoted) or governed.constraint_map.root_hypotheses
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
 * Build a prompt injection section that isolates downstream reasoning
 * to the selected branch's constraint universe.
 */
export function buildBranchIsolationPrompt(branch: ActiveBranchContext | null): string {
  if (!branch) return "";

  const evidenceStr = `Verified: ${Math.round(branch.evidence_mix.verified * 100)}%, Modeled: ${Math.round(branch.evidence_mix.modeled * 100)}%, Assumed: ${Math.round(branch.evidence_mix.assumption * 100)}%`;

  const causalStr = branch.causal_chain.map((c, i) =>
    `  ${i + 1}. [${c.friction_id}] ${c.structural_constraint} → ${c.system_impact} (${c.impact_dimension})`
  ).join("\n");

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
