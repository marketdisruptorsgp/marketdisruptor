/**
 * Pipeline Diagnostics Panel — Developer debugging overlay
 *
 * Shows pipeline stage counts, graph node type distribution,
 * and any warnings from the intelligence pipeline.
 */

import { memo, useState } from "react";
import { getLastDiagnostic, type PipelineDiagnostic } from "@/lib/pipelineDiagnostics";
import { Bug, ChevronDown, ChevronUp, X } from "lucide-react";

const NODE_TYPE_COLORS: Record<string, string> = {
  signal: "hsl(199 89% 48%)",
  assumption: "hsl(38 92% 50%)",
  constraint: "hsl(0 72% 52%)",
  insight: "hsl(229 89% 63%)",
  outcome: "hsl(152 60% 44%)",
  concept: "hsl(172 66% 50%)",
  flipped_idea: "hsl(326 78% 55%)",
  scenario: "hsl(271 81% 55%)",
  pathway: "hsl(45 93% 47%)",
  simulation: "hsl(172 66% 50%)",
  risk: "hsl(14 90% 55%)",
  friction: "hsl(0 72% 52%)",
  leverage_point: "hsl(229 89% 63%)",
  driver: "hsl(262 83% 58%)",
  evidence: "hsl(210 14% 53%)",
  competitor: "hsl(262 83% 58%)",
};

export const PipelineDiagnosticsPanel = memo(function PipelineDiagnosticsPanel() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const diag = getLastDiagnostic();

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-50 p-2 rounded-full bg-muted/80 backdrop-blur border border-border hover:bg-muted transition-colors"
        title="Pipeline Diagnostics"
      >
        <Bug className="w-4 h-4 text-muted-foreground" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 max-h-[500px] overflow-y-auto rounded-xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-bold text-foreground">Pipeline Diagnostics</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setExpanded(!expanded)} className="p-1 hover:bg-muted rounded">
            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
          </button>
          <button onClick={() => setOpen(false)} className="p-1 hover:bg-muted rounded">
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {!diag ? (
        <div className="p-3 text-xs text-muted-foreground">
          No pipeline data yet. Run an analysis first.
        </div>
      ) : (
        <div className="p-3 space-y-3">
          {/* Summary counts */}
          <div className="grid grid-cols-3 gap-2">
            <CountBox label="Evidence" count={diag.totalEvidence} />
            <CountBox label="Insights" count={diag.totalInsights} />
            <CountBox label="Constraints" count={diag.totalConstraints} warn={diag.totalConstraints === 0} />
            <CountBox label="Opportunities" count={diag.totalOpportunities} warn={diag.totalOpportunities === 0} />
            <CountBox label="Scenarios" count={diag.totalScenarios} />
            <CountBox label="Pathways" count={diag.totalPathways} warn={diag.totalPathways === 0} />
          </div>

          {/* Graph node breakdown */}
          <div>
            <p className="text-xs font-bold text-muted-foreground mb-1">Graph Nodes by Type</p>
            <div className="space-y-1">
              {Object.entries(diag.graphNodeCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => (
                  <div key={type} className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: NODE_TYPE_COLORS[type] || "hsl(var(--muted-foreground))" }}
                    />
                    <span className="text-xs text-muted-foreground flex-1">{type}</span>
                    <span className="text-xs font-bold tabular-nums">{count}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Warnings */}
          {diag.warnings.length > 0 && (
            <div>
              <p className="text-xs font-bold text-destructive mb-1">⚠ Warnings ({diag.warnings.length})</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {diag.warnings.map((w, i) => (
                  <p key={i} className="text-xs text-destructive/80 leading-tight">{w}</p>
                ))}
              </div>
            </div>
          )}

          {/* Stage details */}
          {expanded && diag.stages.length > 0 && (
            <div>
              <p className="text-xs font-bold text-muted-foreground mb-1">Pipeline Stages</p>
              <div className="space-y-1">
                {diag.stages.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className={`font-mono ${s.warnings.length > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                      {s.stage}
                    </span>
                    <span className="text-muted-foreground ml-auto">{s.inputCount}→{s.outputCount}</span>
                    <span className="text-muted-foreground tabular-nums">{s.durationMs}ms</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground/50">
            Hash: {diag.lastHash} · {new Date(diag.timestamp).toLocaleTimeString()}
          </p>
        </div>
      )}
    </div>
  );
});

function CountBox({ label, count, warn }: { label: string; count: number; warn?: boolean }) {
  return (
    <div className={`rounded-lg px-2 py-1.5 text-center ${warn ? "bg-destructive/10 border border-destructive/20" : "bg-muted/50"}`}>
      <p className={`text-sm font-bold tabular-nums ${warn ? "text-destructive" : "text-foreground"}`}>{count}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
