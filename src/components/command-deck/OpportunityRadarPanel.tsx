/**
 * OpportunityMapPanel — 2-Axis Strategic Opportunity Map
 * No numeric scores. Uses qualitative quadrant labels only.
 */

import { memo } from "react";
import { Radar, Zap, TrendingUp, ArrowRight, XCircle } from "lucide-react";
import type { OpportunityMapItem, OpportunityQuadrant } from "@/lib/benchmarkEngine";

interface OpportunityMapPanelProps {
  items: OpportunityMapItem[];
}

const QUADRANT_CONFIG: Record<OpportunityQuadrant, {
  label: string; sublabel: string;
  color: string; bg: string; border: string;
  Icon: typeof Zap;
}> = {
  immediate_priority: {
    label: "Immediate Priorities",
    sublabel: "High Impact · Low Difficulty",
    color: "hsl(var(--success))", bg: "hsl(var(--success) / 0.08)", border: "hsl(var(--success) / 0.15)",
    Icon: Zap,
  },
  transformation: {
    label: "Transformation Paths",
    sublabel: "High Impact · High Difficulty",
    color: "hsl(var(--primary))", bg: "hsl(var(--primary) / 0.08)", border: "hsl(var(--primary) / 0.15)",
    Icon: TrendingUp,
  },
  quick_win: {
    label: "Quick Wins",
    sublabel: "Lower Impact · Low Difficulty",
    color: "hsl(var(--warning))", bg: "hsl(var(--warning) / 0.08)", border: "hsl(var(--warning) / 0.15)",
    Icon: ArrowRight,
  },
  avoid: {
    label: "Low Priority",
    sublabel: "Lower Impact · High Difficulty",
    color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted) / 0.3)", border: "hsl(var(--border))",
    Icon: XCircle,
  },
};

const QUADRANT_ORDER: OpportunityQuadrant[] = ["immediate_priority", "transformation", "quick_win", "avoid"];

export const OpportunityMapPanel = memo(function OpportunityMapPanel({ items }: OpportunityMapPanelProps) {
  if (items.length === 0) return null;

  const grouped = new Map<OpportunityQuadrant, OpportunityMapItem[]>();
  for (const item of items) {
    const list = grouped.get(item.quadrant) || [];
    list.push(item);
    grouped.set(item.quadrant, list);
  }

  const filledQuadrants = QUADRANT_ORDER.filter(q => grouped.has(q));

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "hsl(var(--card))", border: "1.5px solid hsl(var(--border))" }}>
      <div className="px-5 pt-4 pb-2 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--primary) / 0.1)" }}>
          <Radar size={14} className="text-primary" />
        </div>
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
          Strategic Opportunity Map
        </span>
      </div>

      <div className="px-5 pb-4 space-y-3">
        {filledQuadrants.map(qKey => {
          const cfg = QUADRANT_CONFIG[qKey];
          const qItems = grouped.get(qKey) || [];
          return (
            <div key={qKey}>
              <div className="flex items-center gap-1.5 mb-1">
                <cfg.Icon size={11} style={{ color: cfg.color }} />
                <span className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: cfg.color }}>
                  {cfg.label}
                </span>
                <span className="text-[9px] text-muted-foreground ml-1">
                  {cfg.sublabel}
                </span>
              </div>
              <div className="space-y-1.5">
                {qItems.map((item, i) => (
                  <div
                    key={i}
                    className="rounded-lg px-3 py-2.5 flex items-start gap-2"
                    style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                  >
                    <span className="text-xs mt-0.5" style={{ color: cfg.color }}>•</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground">{item.label}</p>
                      <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
