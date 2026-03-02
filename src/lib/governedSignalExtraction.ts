/**
 * GOVERNED SIGNAL EXTRACTION
 * 
 * Replaces heuristic field-name-based signal ranking with
 * governed-artifact-driven causal structure extraction.
 * 
 * Falls back to heuristic extraction ONLY when governed data is absent.
 */

import type { RankedSignal, SignalRole, SignalRelationship } from "./signalRanking";

export interface GovernedCausalChain {
  from: string;
  to: string;
  relationship: string;
  strength?: number;
}

/**
 * Extract signals directly from governed artifacts.
 * This is the PRIMARY extraction path — no heuristics.
 */
export function extractFromGoverned(
  governed: Record<string, unknown>
): { signals: RankedSignal[]; relationships: SignalRelationship[]; source: "governed" } | null {
  if (!governed || typeof governed !== "object") return null;

  const signals: RankedSignal[] = [];
  const relationships: SignalRelationship[] = [];
  const signalIndex = new Map<string, number>();

  // 1. Extract constraints from constraint_map
  const constraintMap = governed.constraint_map as Record<string, unknown> | undefined;
  if (constraintMap) {
    const bindingId = String(constraintMap.binding_constraint_id || "");
    if (bindingId) {
      const idx = signals.length;
      signalIndex.set(bindingId, idx);
      signals.push({
        label: bindingId,
        role: "constraint",
        impact: 5,
        confidence: constraintMap.dominance_proof ? 5 : 3,
        recurrence: 1,
        score: 25,
        sourceKeys: ["constraint_map"],
        polarity: "negative",
      });
    }

    // Next binding constraint
    const nextBinding = String(constraintMap.next_binding_constraint || "");
    if (nextBinding) {
      const idx = signals.length;
      signalIndex.set(nextBinding, idx);
      signals.push({
        label: nextBinding,
        role: "constraint",
        impact: 4,
        confidence: 3,
        recurrence: 1,
        score: 12,
        sourceKeys: ["constraint_map"],
        polarity: "negative",
      });
    }

    // Counterfactual
    const counterfactual = String(constraintMap.counterfactual_removal_result || "");
    if (counterfactual && counterfactual.length > 10) {
      const idx = signals.length;
      signalIndex.set("counterfactual", idx);
      signals.push({
        label: counterfactual.slice(0, 80),
        role: "outcome",
        impact: 4,
        confidence: 4,
        recurrence: 1,
        score: 16,
        sourceKeys: ["constraint_map"],
        polarity: "positive",
      });

      // Constraint → Counterfactual relationship
      if (bindingId && signalIndex.has(bindingId)) {
        relationships.push({
          from: signalIndex.get(bindingId)!,
          to: idx,
          type: "opposes",
        });
      }
    }
  }

  // 2. Extract from first_principles
  const fp = governed.first_principles as Record<string, unknown> | undefined;
  if (fp) {
    const causalModel = String(fp.causal_model || "");
    if (causalModel && causalModel.length > 10) {
      signals.push({
        label: causalModel.slice(0, 80),
        role: "mechanism",
        impact: 5,
        confidence: 4,
        recurrence: 1,
        score: 20,
        sourceKeys: ["first_principles"],
        polarity: "neutral",
      });
    }

    const mvs = String(fp.minimum_viable_system || "");
    if (mvs && mvs.length > 10) {
      signals.push({
        label: mvs.slice(0, 80),
        role: "mechanism",
        impact: 4,
        confidence: 4,
        recurrence: 1,
        score: 16,
        sourceKeys: ["first_principles"],
        polarity: "neutral",
      });
    }

    // Viability assumptions → assumption signals
    const assumptions = fp.viability_assumptions as Array<Record<string, unknown>> | undefined;
    if (assumptions && Array.isArray(assumptions)) {
      for (const a of assumptions.slice(0, 4)) {
        const label = String(a.assumption || "");
        if (label.length > 5) {
          const status = String(a.evidence_status || "speculative");
          const confidence = status === "verified" ? 5 : status === "modeled" ? 3 : 1;
          const idx = signals.length;
          signalIndex.set(label.slice(0, 30), idx);
          signals.push({
            label: label.slice(0, 80),
            role: "assumption",
            impact: Number(a.leverage_if_wrong || 3),
            confidence,
            recurrence: 1,
            score: Number(a.leverage_if_wrong || 3) * confidence,
            sourceKeys: ["first_principles"],
            polarity: "negative",
          });
        }
      }
    }
  }

  // 3. Extract from leverage_map
  const leverageMap = governed.leverage_map as Record<string, unknown> | undefined;
  if (leverageMap) {
    const leverId = String(leverageMap.lever_id || leverageMap.highest_leverage_point || "");
    if (leverId && leverId.length > 5) {
      const idx = signals.length;
      signalIndex.set("leverage", idx);
      signals.push({
        label: leverId.slice(0, 80),
        role: "leverage",
        impact: 5,
        confidence: 4,
        recurrence: 1,
        score: 20,
        sourceKeys: ["leverage_map"],
        polarity: "positive",
      });

      // Leverage → Constraint relationship (enables removal)
      const targetConstraint = String(leverageMap.target_constraint_id || "");
      if (targetConstraint && signalIndex.has(targetConstraint)) {
        relationships.push({
          from: idx,
          to: signalIndex.get(targetConstraint)!,
          type: "enables",
        });
      }
    }
  }

  // 4. Extract from friction_tiers
  const frictionTiers = governed.friction_tiers as Record<string, unknown> | undefined;
  if (frictionTiers) {
    const tier1 = frictionTiers.tier_1 as Array<Record<string, unknown>> | Record<string, unknown> | undefined;
    if (tier1) {
      const items = Array.isArray(tier1) ? tier1 : [tier1];
      for (const item of items.slice(0, 2)) {
        const label = String(item.friction_id || item.description || item.root_cause || "");
        if (label.length > 5) {
          signals.push({
            label: label.slice(0, 80),
            role: "constraint",
            impact: 4,
            confidence: 3,
            recurrence: 1,
            score: 12,
            sourceKeys: ["friction_tiers"],
            polarity: "negative",
          });
        }
      }
    }
  }

  // 5. Extract from decision_synthesis
  const ds = governed.decision_synthesis as Record<string, unknown> | undefined;
  if (ds) {
    const grade = String(ds.decision_grade || "");
    const confidence = Number(ds.confidence_score || 0);
    if (grade) {
      signals.push({
        label: `Decision: ${grade} (${confidence}% confidence)`,
        role: "outcome",
        impact: 5,
        confidence: 5,
        recurrence: 1,
        score: 25,
        sourceKeys: ["decision_synthesis"],
        polarity: grade === "proceed" ? "positive" : grade === "blocked" ? "negative" : "neutral",
      });
    }
  }

  // 6. Extract causal chains if present
  const causalChains = (governed.causal_chains || constraintMap?.causal_chains) as GovernedCausalChain[] | undefined;
  if (causalChains && Array.isArray(causalChains)) {
    for (const chain of causalChains.slice(0, 8)) {
      const fromIdx = signalIndex.get(chain.from);
      const toIdx = signalIndex.get(chain.to);
      if (fromIdx !== undefined && toIdx !== undefined) {
        const relType = chain.relationship === "blocks" || chain.relationship === "opposes"
          ? "opposes" as const
          : chain.relationship === "enables" || chain.relationship === "drives"
          ? "enables" as const
          : chain.relationship === "depends_on"
          ? "depends_on" as const
          : "compounds" as const;
        relationships.push({ from: fromIdx, to: toIdx, type: relType });
      }
    }
  }

  // 7. Extract from falsification
  const falsification = governed.falsification as Record<string, unknown> | undefined;
  if (falsification) {
    const conditions = falsification.falsification_conditions as string[] | string | undefined;
    if (conditions) {
      const items = Array.isArray(conditions) ? conditions : [String(conditions)];
      for (const cond of items.slice(0, 2)) {
        if (cond.length > 5) {
          signals.push({
            label: cond.slice(0, 80),
            role: "assumption",
            impact: 4,
            confidence: 2,
            recurrence: 1,
            score: 8,
            sourceKeys: ["falsification"],
            polarity: "negative",
          });
        }
      }
    }
  }

  if (signals.length === 0) return null;

  // Sort by score
  signals.sort((a, b) => b.score - a.score);

  return { signals, relationships: relationships.slice(0, 12), source: "governed" };
}
