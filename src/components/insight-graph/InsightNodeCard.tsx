/**
 * Insight Node Detail Card
 *
 * Shown when a user clicks a node in the Insight Graph.
 * Displays: headline, impact, confidence, evidence, reasoning, and chain navigation.
 */

import { memo, useMemo } from "react";
import { X, ArrowRight, ArrowDown } from "lucide-react";
import type { InsightGraphNode, InsightGraph } from "@/lib/insightGraph";
import { getInsightChain, NODE_TYPE_CONFIG } from "@/lib/insightGraph";

interface InsightNodeCardProps {
  node: InsightGraphNode;
  graph: InsightGraph;
  onClose: () => void;
  onSelectNode: (nodeId: string) => void;
}

export const InsightNodeCard = memo(function InsightNodeCard({
  node, graph, onClose, onSelectNode,
}: InsightNodeCardProps) {
  const config = NODE_TYPE_CONFIG[node.type];
  const chain = useMemo(() => getInsightChain(graph, node.id), [graph, node.id]);

  return (
    <div
      className="absolute right-4 top-4 w-80 max-h-[calc(100%-32px)] overflow-y-auto rounded-2xl shadow-2xl z-30"
      style={{
        background: "hsl(var(--card))",
        border: `1.5px solid ${config.borderColor}`,
        backdropFilter: "blur(16px)",
      }}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: config.bgColor, border: `1px solid ${config.borderColor}` }}
          >
            <div className="w-3.5 h-3.5 rounded-full" style={{ background: config.color }} />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-extrabold uppercase tracking-widest" style={{ color: config.color }}>
              {config.label}
            </p>
            <p className="text-sm font-bold text-foreground leading-snug truncate">{node.label}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1 rounded-md hover:bg-muted transition-colors flex-shrink-0">
          <X size={14} className="text-muted-foreground" />
        </button>
      </div>

      {/* Metrics Row */}
      <div className="px-4 pb-3 grid grid-cols-3 gap-2">
        <MetricPill label="Impact" value={`${node.impact}/10`} color={config.color} />
        <MetricPill label="Confidence" value={node.confidence} color={config.color} />
        <MetricPill label="Influence" value={`${node.influence}`} color={config.color} />
      </div>

      {/* Evidence */}
      {node.evidence.length > 0 && (
        <div className="px-4 pb-3">
          <p className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground mb-1.5">
            Evidence ({node.evidenceCount})
          </p>
          <div className="space-y-1">
            {node.evidence.slice(0, 3).map((e, i) => (
              <p key={i} className="text-[11px] text-foreground/70 leading-snug pl-2"
                style={{ borderLeft: `2px solid ${config.borderColor}` }}>
                {e.slice(0, 120)}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Insight Chain — threading */}
      {chain.length > 1 && (
        <div className="px-4 pb-4">
          <p className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground mb-2">
            Insight Chain
          </p>
          <div className="space-y-1">
            {chain.map((cn, i) => {
              const cnConfig = NODE_TYPE_CONFIG[cn.type];
              const isActive = cn.id === node.id;
              return (
                <div key={cn.id}>
                  <button
                    onClick={() => cn.id !== node.id && onSelectNode(cn.id)}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all text-left"
                    style={{
                      background: isActive ? cnConfig.bgColor : "transparent",
                      border: isActive ? `1px solid ${cnConfig.borderColor}` : "1px solid transparent",
                      cursor: isActive ? "default" : "pointer",
                    }}
                  >
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cnConfig.color }} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] font-bold uppercase" style={{ color: cnConfig.color }}>{cnConfig.label}</p>
                      <p className="text-[11px] font-semibold text-foreground truncate">{cn.label}</p>
                    </div>
                  </button>
                  {i < chain.length - 1 && (
                    <div className="flex justify-center py-0.5">
                      <ArrowDown size={10} className="text-muted-foreground/40" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pipeline step badge */}
      <div className="px-4 pb-3">
        <span
          className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full"
          style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}
        >
          {node.pipelineStep.replace("_", " ")}
        </span>
      </div>
    </div>
  );
});

function MetricPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="text-center px-2 py-1.5 rounded-lg" style={{ background: "hsl(var(--muted))" }}>
      <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-xs font-extrabold" style={{ color }}>{value}</p>
    </div>
  );
}
