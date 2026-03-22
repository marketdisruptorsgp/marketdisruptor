/**
 * EvidenceGapsPanel — Surfaces structured evidence requests from the constraint detection engine.
 *
 * The constraint detection engine produces `evidenceRequests` with `prompt`, `dataType`,
 * and `priority` fields whenever it detects evidence gaps. This panel renders those
 * requests as user-actionable questions grouped by priority.
 *
 * Shows: "Which threshold would be crossed if this data were provided?"
 */

import { useState } from "react";
import { ChevronDown, ChevronUp, AlertCircle, HelpCircle, TrendingUp } from "lucide-react";
import type { ConstraintHypothesisSet, EvidenceRequest } from "@/lib/constraintDetectionEngine";

// Progressive thresholds documented in ResourcesPage.tsx and used as targets for evidence collection.
// These mirror the engine progression: 4→signals, 8→constraints, 11→drivers,
// 15→leverage, 18→opportunities (full morphological), 22→pathways.
const EVIDENCE_THRESHOLDS: { count: number; label: string }[] = [
  { count: 4, label: "signals" },
  { count: 8, label: "constraints" },
  { count: 11, label: "drivers" },
  { count: 15, label: "leverage" },
  { count: 18, label: "opportunities (full morphological)" },
  { count: 22, label: "pathways" },
];

function getNextThreshold(currentCount: number): { count: number; label: string } | null {
  return EVIDENCE_THRESHOLDS.find(t => t.count > currentCount) ?? null;
}

const PRIORITY_ORDER: EvidenceRequest["priority"][] = ["high", "medium", "low"];

const PRIORITY_STYLES: Record<EvidenceRequest["priority"], { bg: string; border: string; color: string; label: string }> = {
  high: {
    bg: "hsl(0 72% 50% / 0.08)",
    border: "hsl(0 72% 50% / 0.3)",
    color: "hsl(0 72% 50%)",
    label: "High Priority",
  },
  medium: {
    bg: "hsl(38 92% 50% / 0.08)",
    border: "hsl(38 92% 50% / 0.3)",
    color: "hsl(38 92% 40%)",
    label: "Medium Priority",
  },
  low: {
    bg: "hsl(var(--muted) / 0.5)",
    border: "hsl(var(--border))",
    color: "hsl(var(--muted-foreground))",
    label: "Low Priority",
  },
};

const DATA_TYPE_LABELS: Record<EvidenceRequest["dataType"], string> = {
  metric: "Quantitative metric",
  operational_property: "Operational detail",
  market_data: "Market data",
  customer_data: "Customer insight",
};

interface EvidenceGapsPanelProps {
  /** Constraint hypothesis set containing evidence requests */
  constraintSet: ConstraintHypothesisSet;
  /** Current evidence count (for threshold calculations) */
  evidenceCount?: number;
}

interface GroupedRequests {
  priority: EvidenceRequest["priority"];
  requests: EvidenceRequest[];
}

export function EvidenceGapsPanel({ constraintSet, evidenceCount = 0 }: EvidenceGapsPanelProps) {
  const [expandedPriorities, setExpandedPriorities] = useState<Set<EvidenceRequest["priority"]>>(
    new Set(["high"]),
  );

  const { evidenceRequests, evidenceGaps } = constraintSet;
  const nextThreshold = getNextThreshold(evidenceCount);

  if (evidenceRequests.length === 0 && evidenceGaps.length === 0) {
    return null;
  }

  const togglePriority = (priority: EvidenceRequest["priority"]) => {
    setExpandedPriorities(prev => {
      const next = new Set(prev);
      if (next.has(priority)) next.delete(priority);
      else next.add(priority);
      return next;
    });
  };

  // Group requests by priority
  const groups: GroupedRequests[] = PRIORITY_ORDER
    .map(priority => ({
      priority,
      requests: evidenceRequests.filter(r => r.priority === priority),
    }))
    .filter(g => g.requests.length > 0);

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center gap-1.5">
        <HelpCircle size={12} style={{ color: "hsl(var(--primary))" }} />
        <p className="text-[11px] font-semibold text-foreground">Evidence Gaps</p>
        {evidenceRequests.length > 0 && (
          <span
            className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
            style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}
          >
            {evidenceRequests.length} question{evidenceRequests.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Threshold progress callout */}
      {nextThreshold && evidenceCount > 0 && (
        <div
          className="rounded-lg px-3 py-2 flex items-center gap-2"
          style={{
            background: "hsl(var(--primary) / 0.06)",
            border: "1px solid hsl(var(--primary) / 0.15)",
          }}
        >
          <TrendingUp size={11} style={{ color: "hsl(var(--primary))" }} />
          <p className="text-[10px] text-muted-foreground">
            <span className="text-foreground font-semibold">{evidenceCount}</span> evidence items · add{" "}
            <span className="text-foreground font-semibold">{nextThreshold.count - evidenceCount} more</span>{" "}
            to unlock <span className="text-foreground font-semibold">{nextThreshold.label}</span>
          </p>
        </div>
      )}

      {/* Evidence gap categories with no candidates */}
      {evidenceGaps.length > 0 && (
        <div
          className="rounded-lg px-3 py-2"
          style={{
            background: "hsl(var(--muted) / 0.4)",
            border: "1px solid hsl(var(--border))",
          }}
        >
          <p className="text-[10px] text-muted-foreground">
            <span className="font-semibold text-foreground">Missing categories: </span>
            {evidenceGaps.join(", ")}
          </p>
        </div>
      )}

      {/* Grouped evidence requests */}
      {groups.map(({ priority, requests }) => {
        const styles = PRIORITY_STYLES[priority];
        const isExpanded = expandedPriorities.has(priority);

        return (
          <div
            key={priority}
            className="rounded-lg overflow-hidden"
            style={{ border: `1px solid ${styles.border}` }}
          >
            {/* Group header */}
            <button
              onClick={() => togglePriority(priority)}
              className="w-full flex items-center justify-between px-3 py-2 text-left"
              style={{ background: styles.bg }}
            >
              <div className="flex items-center gap-1.5">
                <AlertCircle size={11} style={{ color: styles.color }} />
                <span className="text-[11px] font-semibold" style={{ color: styles.color }}>
                  {styles.label}
                </span>
                <span
                  className="text-[9px] px-1 py-0.5 rounded-full"
                  style={{ background: `${styles.color}22`, color: styles.color }}
                >
                  {requests.length}
                </span>
              </div>
              {isExpanded
                ? <ChevronUp size={11} style={{ color: styles.color }} />
                : <ChevronDown size={11} style={{ color: styles.color }} />
              }
            </button>

            {/* Request list */}
            {isExpanded && (
              <div className="divide-y" style={{ borderColor: styles.border }}>
                {requests.map((req, i) => (
                  <div key={i} className="px-3 py-2.5 space-y-1">
                    <p className="text-[11px] text-foreground font-medium leading-snug">{req.prompt}</p>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded font-medium"
                        style={{
                          background: "hsl(var(--muted))",
                          color: "hsl(var(--muted-foreground))",
                        }}
                      >
                        {DATA_TYPE_LABELS[req.dataType]}
                      </span>
                      <span className="text-[9px] text-muted-foreground capitalize">
                        {req.constraintCategory.replace(/_/g, " ")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
