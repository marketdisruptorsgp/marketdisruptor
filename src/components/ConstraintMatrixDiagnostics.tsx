/**
 * ConstraintMatrixDiagnostics — Evidence-backed constraint interaction matrix
 *
 * Renders a full N×N heatmap of pairwise constraint interactions.
 * Each cell shows:
 *   - Colour intensity ∝ interaction strength / evidence overlap
 *   - Interaction type badge (reinforcing / causal / limiting)
 *   - Evidence badge count
 *
 * The binding constraint row/column is highlighted with a gold border.
 * Users can click any cell for a detail popover showing:
 *   - Exact interaction type and strength
 *   - Human explanation
 *   - Candidate resolution patterns
 */

import { memo, useState, useMemo } from "react";
import { Lock, AlertTriangle, Info, X, Zap, ArrowRight } from "lucide-react";
import type { StrategicInsight } from "@/lib/strategicEngine";
import type { ConstraintHypothesisSet } from "@/lib/constraintDetectionEngine";
import { identifyBindingConstraintDataDriven } from "@/lib/constraintDetectionEngine";
import {
  buildEvidenceBackedConstraintMatrix,
  type ConstraintMatrixCell,
} from "@/lib/constraintInteractionEngine";

// ── Colour helpers ────────────────────────────────────────────────────────────

const INTERACTION_COLOURS: Record<string, string> = {
  reinforcing: "hsl(0 72% 50%)",
  causal: "hsl(229 89% 63%)",
  limiting: "hsl(38 92% 50%)",
};

const INTERACTION_BG: Record<string, string> = {
  reinforcing: "hsl(0 72% 50% / 0.12)",
  causal: "hsl(229 89% 63% / 0.12)",
  limiting: "hsl(38 92% 50% / 0.12)",
};

function cellBackground(cell: ConstraintMatrixCell): string {
  if (cell.isDiagonal) return "hsl(var(--muted) / 0.4)";
  if (cell.interaction) return INTERACTION_BG[cell.interaction.interactionType] ?? "transparent";
  if (cell.evidenceOverlap > 0) return `hsl(229 89% 63% / ${(cell.evidenceOverlap * 0.18).toFixed(3)})`;
  return "transparent";
}

function cellStrength(cell: ConstraintMatrixCell): number {
  if (cell.interaction) return cell.interaction.strength;
  return cell.evidenceOverlap;
}

// ── Popover ───────────────────────────────────────────────────────────────────

interface CellDetailProps {
  cell: ConstraintMatrixCell;
  onClose: () => void;
}

function CellDetail({ cell, onClose }: CellDetailProps) {
  const { interaction } = cell;
  return (
    <div
      className="absolute z-50 w-72 rounded-xl p-4 shadow-xl"
      style={{
        background: "hsl(var(--card))",
        border: "1px solid hsl(var(--border))",
        top: "100%",
        left: "50%",
        transform: "translateX(-50%)",
        marginTop: 6,
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Lock size={12} style={{ color: "hsl(var(--destructive))" }} />
          <span className="text-xs font-bold text-foreground">
            {cell.rowLabel} × {cell.colLabel}
          </span>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <X size={13} />
        </button>
      </div>

      {interaction ? (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase"
              style={{
                background: INTERACTION_BG[interaction.interactionType],
                color: INTERACTION_COLOURS[interaction.interactionType],
              }}
            >
              {interaction.interactionType}
            </span>
            <span className="text-[10px] text-muted-foreground">
              strength {(interaction.strength * 100).toFixed(0)}%
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">{interaction.explanation}</p>
          {interaction.candidatePatterns.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-foreground mb-1">Resolution patterns</p>
              <div className="flex flex-wrap gap-1">
                {interaction.candidatePatterns.map(p => (
                  <span
                    key={p}
                    className="text-[9px] px-1.5 py-0.5 rounded"
                    style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))" }}
                  >
                    {p.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : cell.evidenceOverlap > 0 ? (
        <div className="space-y-1">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            No structural interaction rule matched, but these constraints share{" "}
            <strong>{(cell.evidenceOverlap * 100).toFixed(0)}%</strong> evidence overlap — they may be
            co-occurring effects of the same root cause.
          </p>
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground">No interaction or evidence overlap detected.</p>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface ConstraintMatrixDiagnosticsProps {
  activeConstraints: StrategicInsight[];
  hypothesisSet: ConstraintHypothesisSet | null;
}

export const ConstraintMatrixDiagnostics = memo(function ConstraintMatrixDiagnostics({
  activeConstraints,
  hypothesisSet,
}: ConstraintMatrixDiagnosticsProps) {
  const [selectedCell, setSelectedCell] = useState<string | null>(null);

  const matrix = useMemo(
    () => buildEvidenceBackedConstraintMatrix(activeConstraints, hypothesisSet),
    [activeConstraints, hypothesisSet],
  );

  const bindingId = useMemo(() => {
    if (!hypothesisSet) return null;
    const result = identifyBindingConstraintDataDriven(hypothesisSet);
    return result.bindingConstraint?.constraintId ?? null;
  }, [hypothesisSet]);

  const bindingSelectionRationale = useMemo(() => {
    if (!hypothesisSet) return null;
    return identifyBindingConstraintDataDriven(hypothesisSet).selectionRationale;
  }, [hypothesisSet]);

  if (activeConstraints.length === 0) return null;

  const n = activeConstraints.length;
  const CELL_SIZE = 44;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Lock size={13} style={{ color: "hsl(var(--destructive))" }} />
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
          Constraint Interaction Matrix
        </p>
        <span className="ml-auto text-[10px] text-muted-foreground">
          {matrix.evidenceBackedCount} evidence-backed interactions
        </span>
      </div>

      {/* Binding constraint call-out */}
      {bindingSelectionRationale && (
        <div
          className="flex items-start gap-2 rounded-lg px-3 py-2.5"
          style={{ background: "hsl(38 92% 50% / 0.08)", border: "1px solid hsl(38 92% 50% / 0.3)" }}
        >
          <AlertTriangle size={13} className="shrink-0 mt-0.5" style={{ color: "hsl(38 92% 50%)" }} />
          <p className="text-[11px] text-foreground leading-relaxed">{bindingSelectionRationale}</p>
        </div>
      )}

      {/* Interaction type legend */}
      <div className="flex flex-wrap items-center gap-3">
        {Object.entries(INTERACTION_COLOURS).map(([type, colour]) => (
          <div key={type} className="flex items-center gap-1">
            <span
              className="inline-block w-2.5 h-2.5 rounded-sm"
              style={{ background: colour }}
            />
            <span className="text-[10px] text-muted-foreground capitalize">{type}</span>
          </div>
        ))}
        <div className="flex items-center gap-1">
          <span
            className="inline-block w-2.5 h-2.5 rounded-sm"
            style={{ background: "hsl(229 89% 63% / 0.2)" }}
          />
          <span className="text-[10px] text-muted-foreground">Evidence overlap only</span>
        </div>
      </div>

      {/* Matrix grid */}
      <div className="overflow-x-auto">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `80px repeat(${n}, ${CELL_SIZE}px)`,
            gap: 2,
          }}
        >
          {/* Top-left spacer */}
          <div />

          {/* Column labels */}
          {activeConstraints.map(c => (
            <div
              key={c.id}
              className="flex items-end justify-center pb-1"
              style={{
                height: 56,
                borderBottom: c.id === bindingId ? "2px solid hsl(38 92% 50%)" : "2px solid transparent",
              }}
            >
              <span
                className="text-[9px] font-semibold text-muted-foreground"
                style={{
                  writingMode: "vertical-rl",
                  transform: "rotate(180deg)",
                  maxHeight: 52,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  color: c.id === bindingId ? "hsl(38 92% 50%)" : undefined,
                }}
                title={c.label}
              >
                {c.label.length > 18 ? c.label.slice(0, 17) + "…" : c.label}
              </span>
            </div>
          ))}

          {/* Rows */}
          {activeConstraints.map((rowConstraint, rIdx) => (
            <>
              {/* Row label */}
              <div
                key={`row-label-${rowConstraint.id}`}
                className="flex items-center justify-end pr-2"
                style={{
                  height: CELL_SIZE,
                  borderRight: rowConstraint.id === bindingId
                    ? "2px solid hsl(38 92% 50%)"
                    : "2px solid transparent",
                }}
              >
                <span
                  className="text-[9px] font-semibold text-muted-foreground text-right"
                  style={{
                    maxWidth: 76,
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    color: rowConstraint.id === bindingId ? "hsl(38 92% 50%)" : undefined,
                  }}
                  title={rowConstraint.label}
                >
                  {rowConstraint.label.length > 22 ? rowConstraint.label.slice(0, 21) + "…" : rowConstraint.label}
                </span>
              </div>

              {/* Cells for this row */}
              {activeConstraints.map((colConstraint) => {
                const cell = matrix.cells.find(
                  cl => cl.rowId === rowConstraint.id && cl.colId === colConstraint.id,
                );
                if (!cell) return <div key={colConstraint.id} />;

                const cellKey = `${cell.rowId}|${cell.colId}`;
                const strength = cellStrength(cell);
                const isSelected = selectedCell === cellKey;

                return (
                  <div
                    key={cellKey}
                    className="relative rounded cursor-pointer transition-all"
                    style={{
                      width: CELL_SIZE,
                      height: CELL_SIZE,
                      background: cell.isDiagonal ? "hsl(var(--muted) / 0.5)" : cellBackground(cell),
                      border: isSelected
                        ? "2px solid hsl(var(--primary))"
                        : "1px solid hsl(var(--border) / 0.5)",
                      opacity: cell.isDiagonal ? 0.4 : 1,
                    }}
                    onClick={() => {
                      if (cell.isDiagonal) return;
                      setSelectedCell(isSelected ? null : cellKey);
                    }}
                    title={cell.isDiagonal ? rowConstraint.label : undefined}
                  >
                    {!cell.isDiagonal && strength > 0 && (
                      <div className="flex items-center justify-center h-full">
                        <span
                          className="text-[9px] font-bold"
                          style={{
                            color: cell.interaction
                              ? INTERACTION_COLOURS[cell.interaction.interactionType]
                              : "hsl(229 89% 63%)",
                          }}
                        >
                          {(strength * 100).toFixed(0)}
                        </span>
                      </div>
                    )}
                    {cell.isDiagonal && (
                      <div className="flex items-center justify-center h-full">
                        <span className="text-[9px] text-muted-foreground">—</span>
                      </div>
                    )}
                    {isSelected && (
                      <CellDetail cell={cell} onClose={() => setSelectedCell(null)} />
                    )}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </div>

      {/* Most-connected constraint call-out */}
      {matrix.mostConnectedConstraintId && matrix.mostConnectedConstraintId !== bindingId && (
        <div
          className="flex items-start gap-2 rounded-lg px-3 py-2"
          style={{ background: "hsl(229 89% 63% / 0.06)", border: "1px solid hsl(229 89% 63% / 0.2)" }}
        >
          <Info size={12} className="shrink-0 mt-0.5" style={{ color: "hsl(229 89% 63%)" }} />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            <strong style={{ color: "hsl(229 89% 63%)" }}>
              {activeConstraints.find(c => c.id === matrix.mostConnectedConstraintId)?.label ?? matrix.mostConnectedConstraintId}
            </strong>{" "}
            has the highest total interaction strength across all pairs — resolving it may unlock cascading improvements.
          </p>
        </div>
      )}

      {/* Interaction detail list */}
      {matrix.interactionSet.interactions.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Zap size={11} />
            Top Interactions
          </p>
          {matrix.interactionSet.interactions.slice(0, 4).map(ix => (
            <div
              key={`${ix.constraintIds[0]}|${ix.constraintIds[1]}`}
              className="rounded-lg px-3 py-2 flex items-start gap-2"
              style={{
                background: INTERACTION_BG[ix.interactionType],
                border: `1px solid ${INTERACTION_COLOURS[ix.interactionType]}33`,
              }}
            >
              <ArrowRight size={12} className="shrink-0 mt-0.5" style={{ color: INTERACTION_COLOURS[ix.interactionType] }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                  <span className="text-[10px] font-bold text-foreground">{ix.constraintLabels[0]}</span>
                  <span
                    className="text-[9px] font-bold px-1 py-0.5 rounded uppercase"
                    style={{
                      background: `${INTERACTION_COLOURS[ix.interactionType]}22`,
                      color: INTERACTION_COLOURS[ix.interactionType],
                    }}
                  >
                    {ix.interactionType}
                  </span>
                  <span className="text-[10px] font-bold text-foreground">{ix.constraintLabels[1]}</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-relaxed">{ix.explanation}</p>
              </div>
              <span className="text-[9px] font-bold text-muted-foreground shrink-0">
                {(ix.strength * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
