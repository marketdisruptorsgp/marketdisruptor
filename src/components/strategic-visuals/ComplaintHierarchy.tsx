/**
 * ComplaintHierarchy — Product Mode Visual
 *
 * Sankey diagram showing the flow from all reviews → positive / neutral /
 * negative, then negative → complaint categories. Color-codes categories
 * by whether you fix them, partially fix them, or don't own them.
 * Displays TAM calculation based on addressable complaint percentage.
 */

import { Sankey, Tooltip, ResponsiveContainer } from "recharts";
import type { Evidence } from "@/lib/evidenceEngine";
import type { Product } from "@/data/mockProducts";
import { useComplaintSankeyData } from "./hooks/useComplaintSankeyData";

// ═══════════════════════════════════════════════════════════════
//  PROPS
// ═══════════════════════════════════════════════════════════════

interface Props {
  product?: Product | null;
  evidence: Evidence[];
  opportunities?: string[];
}

// ═══════════════════════════════════════════════════════════════
//  COLOR HELPERS
// ═══════════════════════════════════════════════════════════════

const NODE_COLORS: Record<string, string> = {
  "All Reviews": "#6366f1",
  "Positive": "#10b981",
  "Neutral": "#6b7280",
  "Negative": "#ef4444",
  "Durability Issues": "#10b981",
  "Repairability Issues": "#10b981",
  "Sound / Audio Issues": "#eab308",
  "Microphone Issues": "#ef4444",
  "Other Issues": "#ef4444",
};

function nodeColor(name: string): string {
  return NODE_COLORS[name] ?? "#6366f1";
}

// ═══════════════════════════════════════════════════════════════
//  CUSTOM NODE RENDERER
// ═══════════════════════════════════════════════════════════════

interface NodeProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
  payload?: { name?: string };
}

function CustomNode(props: NodeProps) {
  const { x = 0, y = 0, width = 0, height = 0, payload } = props;
  const name = payload?.name ?? "";
  const color = nodeColor(name);
  const isLeft = name === "All Reviews";
  const labelX = isLeft ? x + width + 6 : x - 6;
  const anchor = isLeft ? "start" : "end";
  const maxLabelWidth = 110;

  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={color} opacity={0.85} rx={3} />
      <foreignObject
        x={isLeft ? labelX : labelX - maxLabelWidth}
        y={y + height / 2 - 16}
        width={maxLabelWidth}
        height={32}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: "#9ca3af",
            textAlign: anchor === "start" ? "left" : "right",
            lineHeight: "1.2",
            overflow: "hidden",
            whiteSpace: "normal",
            wordBreak: "break-word",
          }}
        >
          {name}
        </div>
      </foreignObject>
    </g>
  );
}

// ═══════════════════════════════════════════════════════════════
//  CUSTOM LINK RENDERER
// ═══════════════════════════════════════════════════════════════

interface LinkProps {
  sourceX?: number;
  targetX?: number;
  sourceY?: number;
  targetY?: number;
  sourceControlX?: number;
  targetControlX?: number;
  linkWidth?: number;
  payload?: { target?: { name?: string } };
}

function CustomLink(props: LinkProps) {
  const {
    sourceX = 0, targetX = 0,
    sourceY = 0, targetY = 0,
    sourceControlX = 0, targetControlX = 0,
    linkWidth = 0,
    payload,
  } = props;

  const targetName = payload?.target?.name ?? "";
  let color = "#6366f1";
  if (targetName === "Positive") color = "#10b981";
  else if (targetName === "Neutral") color = "#6b7280";
  else if (targetName === "Negative") color = "#ef4444";
  else if (targetName === "Durability Issues" || targetName === "Repairability Issues") color = "#10b981";
  else if (targetName === "Sound / Audio Issues") color = "#eab308";
  else if (targetName === "Microphone Issues" || targetName === "Other Issues") color = "#ef4444";

  return (
    <path
      d={`M${sourceX},${sourceY + linkWidth / 2}
          C${sourceControlX},${sourceY + linkWidth / 2}
           ${targetControlX},${targetY + linkWidth / 2}
           ${targetX},${targetY + linkWidth / 2}
          L${targetX},${targetY - linkWidth / 2}
          C${targetControlX},${targetY - linkWidth / 2}
           ${sourceControlX},${sourceY - linkWidth / 2}
           ${sourceX},${sourceY - linkWidth / 2}
          Z`}
      fill={color}
      opacity={0.25}
    />
  );
}

// ═══════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function ComplaintHierarchy({ product, evidence }: Props) {
  const { nodes, links, stats } = useComplaintSankeyData(evidence, product);

  // Recharts Sankey needs numeric value in the link for layout
  const sankeyData = {
    nodes: nodes.map(n => ({ name: n.name })),
    links,
  };

  const tamFormatted = stats.tamEstimate >= 1
    ? `$${stats.tamEstimate.toFixed(1)}B`
    : `$${(stats.tamEstimate * 1000).toFixed(0)}M`;

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 bg-primary/5 border-b border-border">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary">
          Complaint Hierarchy
        </span>
        <p className="text-xs text-muted-foreground mt-0.5">
          Where reviews flow — and which complaints you own.
        </p>
      </div>

      {/* Sankey diagram */}
      <div className="p-4">
        <ResponsiveContainer width="100%" height={400}>
          <Sankey
            data={sankeyData}
            node={<CustomNode />}
            link={<CustomLink />}
            nodePadding={16}
            nodeWidth={12}
            margin={{ top: 10, right: 140, bottom: 10, left: 140 }}
          >
            <Tooltip
              formatter={(value: number) => [`${value} reviews`, ""]}
            />
          </Sankey>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="px-5 py-3 border-t border-border bg-muted/30">
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              You Fix This ({Math.round(stats.youFixPct * 100)}%)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full bg-yellow-400" />
            <span className="text-[10px] font-bold text-yellow-600 dark:text-yellow-400">
              Partially ({Math.round(stats.partialPct * 100)}%)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full bg-red-500" />
            <span className="text-[10px] font-bold text-red-600 dark:text-red-400">
              Not Your Problem ({Math.round(stats.noFixPct * 100)}%)
            </span>
          </div>
        </div>
      </div>

      {/* TAM calculation */}
      <div className="px-5 py-4 border-t border-border bg-primary/5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary">
              Addressable Market (TAM)
            </span>
            <p className="text-xs text-muted-foreground mt-0.5">
              $71B headphones market × {Math.round(stats.negative / stats.total * 100)}% negative sentiment × {Math.round(stats.youFixPct * 100)}% you fix
            </p>
          </div>
          <span className="text-xl font-black text-primary">{tamFormatted}</span>
        </div>
      </div>
    </div>
  );
}
