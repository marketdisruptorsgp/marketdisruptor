/**
 * Pipeline Data Health — At-a-glance indicator of upstream data quality.
 *
 * Shows which data fields (scrape intel, pipeline stages, document extraction)
 * are populated vs empty so users understand what's driving the analysis.
 */

import { useState } from "react";
import { Activity, ChevronDown, ChevronUp, CheckCircle2, XCircle, MinusCircle } from "lucide-react";

interface DataField {
  label: string;
  group: "scrape" | "pipeline" | "document";
  status: "populated" | "partial" | "empty";
  detail?: string;
}

interface PipelineDataHealthProps {
  product: Record<string, any> | null;
  decompositionData: unknown;
  disruptData: unknown;
  redesignData: unknown;
  stressTestData: unknown;
  pitchDeckData: unknown;
  biExtraction: Record<string, any> | null;
  governedData: Record<string, any> | null;
  businessAnalysisData: Record<string, any> | null;
}

function fieldStatus(value: unknown): "populated" | "partial" | "empty" {
  if (value == null) return "empty";
  if (typeof value === "object") {
    if (Array.isArray(value)) return value.length > 0 ? "populated" : "empty";
    const keys = Object.keys(value as object);
    if (keys.length === 0) return "empty";
    // check if at least half the keys have truthy values
    const populatedKeys = keys.filter(k => {
      const v = (value as any)[k];
      return v != null && v !== "" && !(Array.isArray(v) && v.length === 0);
    });
    if (populatedKeys.length === 0) return "empty";
    if (populatedKeys.length < keys.length * 0.5) return "partial";
    return "populated";
  }
  if (typeof value === "string") return value.trim() ? "populated" : "empty";
  return "populated";
}

function countItems(value: unknown): string {
  if (value == null) return "—";
  if (Array.isArray(value)) return `${value.length} items`;
  if (typeof value === "object") {
    const keys = Object.keys(value as object);
    return `${keys.length} fields`;
  }
  return "✓";
}

function buildFields(props: PipelineDataHealthProps): DataField[] {
  const p = props.product as any;
  const fields: DataField[] = [];

  // Scrape intel fields
  const scrapeFields: [string, string][] = [
    ["pricingIntel", "Pricing Intel"],
    ["supplyChain", "Supply Chain"],
    ["communityInsights", "Community Signals"],
    ["competitorAnalysis", "Competitor Analysis"],
    ["userWorkflow", "Workflow Intel"],
    ["operationalIntel", "Operations Intel"],
    ["trendAnalysis", "Trend Analysis"],
  ];

  for (const [key, label] of scrapeFields) {
    const val = p?.[key];
    fields.push({
      label,
      group: "scrape",
      status: fieldStatus(val),
      detail: val != null ? countItems(val) : undefined,
    });
  }

  // Pipeline stages
  const pipelineStages: [unknown, string][] = [
    [props.decompositionData, "Structural Decomposition"],
    [props.disruptData, "Disrupt (First Principles)"],
    [props.redesignData, "Redesign (Flipped Ideas)"],
    [props.stressTestData, "Stress Test"],
    [props.pitchDeckData, "Pitch Synthesis"],
  ];

  for (const [val, label] of pipelineStages) {
    fields.push({
      label,
      group: "pipeline",
      status: fieldStatus(val),
      detail: val != null ? countItems(val) : undefined,
    });
  }

  // System Dynamics sub-field (from decomposition)
  const decomp = props.decompositionData as any;
  const dynamics = decomp?.systemDynamics;
  fields.push({
    label: "System Dynamics",
    group: "pipeline",
    status: fieldStatus(dynamics),
    detail: dynamics ? `${(dynamics.failureModes?.length || 0) + (dynamics.feedbackLoops?.length || 0) + (dynamics.bottlenecks?.length || 0) + (dynamics.controlPoints?.length || 0) + (dynamics.substitutionPaths?.length || 0)} items` : undefined,
  });

  // Document / BI extraction
  fields.push({
    label: "Document Extraction (BI)",
    group: "document",
    status: fieldStatus(props.biExtraction),
    detail: props.biExtraction ? countItems(props.biExtraction) : undefined,
  });

  fields.push({
    label: "Governed Data",
    group: "document",
    status: fieldStatus(props.governedData),
    detail: props.governedData ? countItems(props.governedData) : undefined,
  });

  fields.push({
    label: "Business Analysis",
    group: "document",
    status: fieldStatus(props.businessAnalysisData),
    detail: props.businessAnalysisData ? countItems(props.businessAnalysisData) : undefined,
  });

  return fields;
}

const STATUS_ICON = {
  populated: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
  partial: <MinusCircle className="w-3.5 h-3.5 text-amber-500" />,
  empty: <XCircle className="w-3.5 h-3.5 text-destructive/60" />,
};

const GROUP_LABELS: Record<string, string> = {
  scrape: "Market Scrape",
  pipeline: "Pipeline Stages",
  document: "Document & Context",
};

export function PipelineDataHealth(props: PipelineDataHealthProps) {
  const [expanded, setExpanded] = useState(false);
  const fields = buildFields(props);

  const populated = fields.filter(f => f.status === "populated").length;
  const partial = fields.filter(f => f.status === "partial").length;
  const empty = fields.filter(f => f.status === "empty").length;
  const total = fields.length;
  const healthPct = Math.round(((populated + partial * 0.5) / total) * 100);

  const barColor =
    healthPct >= 75 ? "hsl(152 60% 44%)" :
    healthPct >= 40 ? "hsl(38 92% 50%)" :
    "hsl(var(--destructive))";

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
    >
      {/* Collapsed bar */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/40 transition-colors"
      >
        <Activity className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <span className="text-xs font-bold text-foreground">Data Health</span>

        {/* Mini bar */}
        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${healthPct}%`, background: barColor }}
          />
        </div>

        <span className="text-xs font-bold tabular-nums" style={{ color: barColor }}>
          {healthPct}%
        </span>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="text-emerald-500 font-bold">{populated}</span>
          {partial > 0 && <span className="text-amber-500 font-bold">{partial}</span>}
          <span className="text-destructive/60 font-bold">{empty}</span>
        </div>

        {expanded ? (
          <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        )}
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t px-4 py-3 space-y-3" style={{ borderColor: "hsl(var(--border))" }}>
          {(["scrape", "pipeline", "document"] as const).map(group => {
            const groupFields = fields.filter(f => f.group === group);
            return (
              <div key={group}>
                <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground mb-1.5">
                  {GROUP_LABELS[group]}
                </p>
                <div className="space-y-1">
                  {groupFields.map(f => (
                    <div key={f.label} className="flex items-center gap-2 py-1">
                      {STATUS_ICON[f.status]}
                      <span className="text-xs text-foreground flex-1">{f.label}</span>
                      {f.detail && (
                        <span className="text-xs text-muted-foreground tabular-nums">{f.detail}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
