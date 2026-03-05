/**
 * Insight Trace Panel
 *
 * Shows the full reasoning chain for a selected insight:
 * Observation → Assumption → Friction → Constraint → Leverage → Opportunity
 */

import { memo, useState } from "react";
import { X, ChevronDown, Eye, Brain, Activity, Shield, Crosshair, Lightbulb } from "lucide-react";
import {
  traceInsight,
  type ProvenanceRegistry,
  type ProvenanceRecord,
  type ReasoningLayer,
} from "@/lib/insightProvenance";

interface InsightTracePanelProps {
  insightId: string;
  registry: ProvenanceRegistry;
  onClose: () => void;
}

const LAYER_META: Record<ReasoningLayer, { label: string; icon: React.ElementType; color: string }> = {
  raw_observation: { label: "Observation", icon: Eye, color: "hsl(220 10% 55%)" },
  assumption_extraction: { label: "Assumption Extraction", icon: Brain, color: "hsl(271 81% 55%)" },
  friction_detection: { label: "Friction Detection", icon: Activity, color: "hsl(38 92% 50%)" },
  constraint_mapping: { label: "Constraint Mapping", icon: Shield, color: "hsl(0 72% 50%)" },
  leverage_identification: { label: "Leverage Identification", icon: Crosshair, color: "hsl(229 89% 63%)" },
  strategic_opportunity: { label: "Strategic Opportunity", icon: Lightbulb, color: "hsl(152 60% 44%)" },
};

function TraceStep({ record, isLast }: { record: ProvenanceRecord; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const meta = LAYER_META[record.reasoningLayer];
  const Icon = meta.icon;

  return (
    <div className="flex gap-3">
      {/* Vertical line + dot */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `${meta.color}18` }}
        >
          <Icon size={14} style={{ color: meta.color }} />
        </div>
        {!isLast && (
          <div className="w-0.5 flex-1 min-h-[24px]" style={{ background: "hsl(var(--border))" }} />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-4 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-extrabold uppercase tracking-widest" style={{ color: meta.color }}>
            {meta.label}
          </span>
          {record.lens !== "cross-lens" ? (
            <span
              className="px-1.5 py-0.5 rounded text-xs font-bold uppercase"
              style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))" }}
            >
              {record.lens}
            </span>
          ) : (
            <span
              className="px-1.5 py-0.5 rounded text-xs font-bold uppercase"
              style={{ background: "hsl(38 92% 50% / 0.12)", color: "hsl(38 92% 50%)" }}
            >
              Cross-Lens
            </span>
          )}
        </div>

        <p className="text-sm font-semibold text-foreground leading-snug">{record.label}</p>

        {record.evidence.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 mt-1.5 text-xs font-bold text-foreground/60 hover:text-foreground transition-colors cursor-pointer"
          >
            <ChevronDown
              size={10}
              className="transition-transform"
              style={{ transform: expanded ? "rotate(180deg)" : "none" }}
            />
            {record.evidence.length} evidence source{record.evidence.length !== 1 ? "s" : ""}
          </button>
        )}

        {expanded && (
          <div className="mt-2 space-y-1">
            {record.evidence.map((e, i) => (
              <p
                key={i}
                className="text-xs text-muted-foreground leading-relaxed pl-3"
                style={{ borderLeft: `2px solid ${meta.color}33` }}
              >
                {e}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export const InsightTracePanel = memo(function InsightTracePanel({
  insightId,
  registry,
  onClose,
}: InsightTracePanelProps) {
  const chain = traceInsight(insightId, registry);

  // If no chain found, show the direct record
  const directRecord = registry.records.find(r => r.insightId === insightId);
  const displayChain = chain.length > 0 ? chain : directRecord ? [directRecord] : [];

  return (
    <div
      className="rounded-xl overflow-hidden animate-in slide-in-from-right-4 duration-300"
      style={{
        background: "hsl(var(--card))",
        border: "1.5px solid hsl(var(--border))",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Eye size={14} className="text-muted-foreground" />
          <p className="text-xs font-extrabold uppercase tracking-widest text-foreground/60">
            Insight Trace
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-muted transition-colors cursor-pointer"
        >
          <X size={14} className="text-muted-foreground" />
        </button>
      </div>

      {/* Chain */}
      <div className="p-4">
        {displayChain.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            No provenance data available for this insight.
          </p>
        ) : (
          <div>
            {displayChain.map((record, i) => (
              <TraceStep
                key={record.insightId + i}
                record={record}
                isLast={i === displayChain.length - 1}
              />
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      {displayChain.length > 0 && (
        <div className="px-4 py-3 border-t border-border" style={{ background: "hsl(var(--muted))" }}>
          <p className="text-xs font-semibold text-foreground/60">
            {displayChain.length} reasoning step{displayChain.length !== 1 ? "s" : ""} · 
            {" "}{new Set(displayChain.map(r => r.lens)).size} lens{new Set(displayChain.map(r => r.lens)).size !== 1 ? "es" : ""} involved
          </p>
        </div>
      )}
    </div>
  );
});
