/**
 * WhatIfScenarioPanel — Interactive "what-if" constraint explorer
 *
 * Lets the user toggle individual constraints on/off to project
 * how the design space would change.  For each "removed" constraint:
 *
 *   1. Dimensions that were "hot" because of that constraint become "warm"
 *      (or possibly inactive) — we count the delta.
 *   2. Blocked opportunity vectors that were filtered by that constraint
 *      become viable — we surface their dimension shifts.
 *   3. A system-impact summary is computed using the counterfactual data
 *      already stored on each ConstraintHypothesis.
 *
 * This is entirely deterministic (< 1 ms) — no AI calls needed.
 */

import { memo, useState, useMemo, useCallback } from "react";
import { FlaskConical, ToggleLeft, ToggleRight, ArrowRight, ChevronDown, ChevronUp, Info } from "lucide-react";
import type { StrategicInsight } from "@/lib/strategicEngine";
import type { ConstraintHypothesisSet, ConstraintHypothesis } from "@/lib/constraintDetectionEngine";
import type { BusinessBaseline } from "@/lib/opportunityDesignEngine";
import { identifyActiveDimensions, getDimensionsByStatus } from "@/lib/opportunityDesignEngine";

// ── Types ─────────────────────────────────────────────────────────────────────

interface WhatIfProjection {
  /** The constraint that was toggled off */
  constraintId: string;
  constraintName: string;
  /** Number of dimensions that gain "hot" or "warm" status when this constraint is removed */
  dimensionsUnlocked: number;
  /** Number of evidence items that become "free" (no longer blocked) */
  evidenceFreed: number;
  /** Human-readable counterfactual from the hypothesis */
  counterfactualExplanation: string;
  /** Confidence interval midpoint of the hypothesis */
  confidencePoint: number;
  /** Whether this constraint is the binding constraint */
  isBinding: boolean;
  /** Dimension names that unlock when this constraint is removed */
  unlockedDimensionNames: string[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Project what happens to the baseline when a constraint is removed.
 * We re-run `identifyActiveDimensions` with the constraint's evidence IDs
 * removed from the consideration set.
 */
function projectConstraintRemoval(
  baseline: BusinessBaseline,
  allConstraints: StrategicInsight[],
  leveragePoints: StrategicInsight[],
  removedConstraintId: string,
  hypothesis: ConstraintHypothesis,
): WhatIfProjection {
  const remainingConstraints = allConstraints.filter(c => c.id !== removedConstraintId);

  // Re-compute baseline with remaining constraints only
  const updatedBaseline = identifyActiveDimensions(baseline, remainingConstraints, leveragePoints);
  const originalActive = identifyActiveDimensions(baseline, allConstraints, leveragePoints);
  const originalHot = getDimensionsByStatus(originalActive, "hot");
  const originalWarm = getDimensionsByStatus(originalActive, "warm");

  const newHot = getDimensionsByStatus(updatedBaseline, "hot");
  const newWarm = getDimensionsByStatus(updatedBaseline, "warm");

  // How many dimensions are unlocked (were inactive, now warm or hot)
  const originalActiveIds = new Set([
    ...originalHot.map(d => d.id),
    ...originalWarm.map(d => d.id),
  ]);

  const newActiveIds = new Set([...newHot.map(d => d.id), ...newWarm.map(d => d.id)]);
  const unlocked = [...newActiveIds].filter(id => !originalActiveIds.has(id));
  const unlockedNames = unlocked
    .map(id => updatedBaseline[id.replace("dim-", "")]?.name ?? id)
    .filter(Boolean);

  return {
    constraintId: removedConstraintId,
    constraintName: hypothesis.constraintName,
    dimensionsUnlocked: unlocked.length,
    evidenceFreed: hypothesis.evidenceIds.length,
    counterfactualExplanation: hypothesis.counterfactualExplanation,
    confidencePoint: hypothesis.confidenceInterval.point,
    isBinding: hypothesis.stackRole === "binding",
    unlockedDimensionNames: unlockedNames,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

interface WhatIfScenarioPanelProps {
  activeConstraints: StrategicInsight[];
  hypothesisSet: ConstraintHypothesisSet | null;
  baseline: BusinessBaseline;
  leveragePoints: StrategicInsight[];
}

export const WhatIfScenarioPanel = memo(function WhatIfScenarioPanel({
  activeConstraints,
  hypothesisSet,
  baseline,
  leveragePoints,
}: WhatIfScenarioPanelProps) {
  const [toggledOff, setToggledOff] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Build projections for every hypothesis
  const projections = useMemo<WhatIfProjection[]>(() => {
    if (!hypothesisSet || activeConstraints.length === 0) return [];
    return hypothesisSet.hypotheses.map(h => {
      const constraint = activeConstraints.find(c => c.id === h.constraintId) ?? null;
      if (!constraint) {
        return {
          constraintId: h.constraintId,
          constraintName: h.constraintName,
          dimensionsUnlocked: 0,
          evidenceFreed: h.evidenceIds.length,
          counterfactualExplanation: h.counterfactualExplanation,
          confidencePoint: h.confidenceInterval.point,
          isBinding: h.stackRole === "binding",
          unlockedDimensionNames: [],
        };
      }
      return projectConstraintRemoval(
        baseline,
        activeConstraints,
        leveragePoints,
        constraint.id,
        h,
      );
    });
  }, [hypothesisSet, activeConstraints, baseline, leveragePoints]);

  // Scenario summary: how many constraints toggled off, total dimensions unlocked
  const scenarioSummary = useMemo(() => {
    const removed = projections.filter(p => toggledOff.has(p.constraintId));
    const totalDimsUnlocked = removed.reduce((sum, p) => sum + p.dimensionsUnlocked, 0);
    const totalEvidenceFreed = removed.reduce((sum, p) => sum + p.evidenceFreed, 0);
    return { removedCount: removed.length, totalDimsUnlocked, totalEvidenceFreed };
  }, [projections, toggledOff]);

  const toggleConstraint = useCallback((id: string) => {
    setToggledOff(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  if (projections.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <FlaskConical size={13} style={{ color: "hsl(var(--primary))" }} />
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
          What-If Scenario Explorer
        </p>
      </div>

      {/* Scenario summary bar */}
      {scenarioSummary.removedCount > 0 && (
        <div
          className="rounded-lg px-3 py-2 flex items-center gap-3 flex-wrap"
          style={{ background: "hsl(var(--primary) / 0.06)", border: "1px solid hsl(var(--primary) / 0.2)" }}
        >
          <span className="text-[11px] font-semibold text-foreground">
            Scenario: {scenarioSummary.removedCount} constraint{scenarioSummary.removedCount > 1 ? "s" : ""} removed
          </span>
          {scenarioSummary.totalDimsUnlocked > 0 && (
            <span className="text-[10px] text-muted-foreground">
              → <strong className="text-foreground">{scenarioSummary.totalDimsUnlocked}</strong> dimensions unlocked
            </span>
          )}
          {scenarioSummary.totalEvidenceFreed > 0 && (
            <span className="text-[10px] text-muted-foreground">
              · {scenarioSummary.totalEvidenceFreed} evidence items freed
            </span>
          )}
        </div>
      )}

      {/* Instruction */}
      <div
        className="flex items-start gap-2 rounded-lg px-3 py-2"
        style={{ background: "hsl(var(--accent) / 0.3)" }}
      >
        <Info size={11} className="shrink-0 mt-0.5 text-muted-foreground" />
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Toggle a constraint off to project how the design space changes if it were resolved.
          This is a hypothetical projection — not a validated plan.
        </p>
      </div>

      {/* Projection cards */}
      {projections.map(projection => {
        const isOff = toggledOff.has(projection.constraintId);
        const isExpanded = expandedId === projection.constraintId;

        return (
          <div
            key={projection.constraintId}
            className="rounded-xl overflow-hidden transition-all"
            style={{
              border: isOff
                ? "1.5px solid hsl(var(--primary) / 0.5)"
                : "1px solid hsl(var(--border))",
              background: isOff ? "hsl(var(--primary) / 0.04)" : "hsl(var(--card))",
            }}
          >
            {/* Card header */}
            <div className="flex items-center gap-2 px-3 py-2.5">
              {/* Toggle */}
              <button
                onClick={() => toggleConstraint(projection.constraintId)}
                className="shrink-0 transition-colors"
                aria-label={isOff ? "Re-enable constraint" : "Remove constraint"}
                title={isOff ? "Click to re-enable constraint" : "Click to project removal"}
              >
                {isOff ? (
                  <ToggleRight size={20} style={{ color: "hsl(var(--primary))" }} />
                ) : (
                  <ToggleLeft size={20} className="text-muted-foreground" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-semibold text-foreground">
                    {projection.constraintName.replace(/_/g, " ")}
                  </span>
                  {projection.isBinding && (
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase"
                      style={{ background: "hsl(38 92% 50% / 0.15)", color: "hsl(38 92% 50%)" }}
                    >
                      Binding
                    </span>
                  )}
                  {isOff && projection.dimensionsUnlocked > 0 && (
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                      style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}
                    >
                      +{projection.dimensionsUnlocked} dims unlocked
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Confidence {(projection.confidencePoint * 100).toFixed(0)}%
                  · {projection.evidenceFreed} evidence item{projection.evidenceFreed !== 1 ? "s" : ""}
                </p>
              </div>

              <button
                onClick={() => setExpandedId(isExpanded ? null : projection.constraintId)}
                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              >
                {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
            </div>

            {/* Expanded detail */}
            {isExpanded && (
              <div
                className="px-3 pb-3 space-y-2 border-t"
                style={{ borderColor: "hsl(var(--border))" }}
              >
                <p className="text-[11px] text-muted-foreground leading-relaxed pt-2">
                  {projection.counterfactualExplanation}
                </p>

                {isOff && projection.unlockedDimensionNames.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-foreground mb-1">Unlocked dimensions</p>
                    <div className="flex flex-wrap gap-1">
                      {projection.unlockedDimensionNames.map(name => (
                        <span
                          key={name}
                          className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
                          style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}
                        >
                          <ArrowRight size={8} />
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {!isOff && (
                  <p className="text-[10px] text-muted-foreground italic">
                    Toggle this constraint off to see projected impact.
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});
