/**
 * OpportunityRadarPanel — Prioritized opportunity landscape
 * Shows High / Moderate / Low leverage moves.
 */

import { memo } from "react";
import { Radar, Zap, TrendingUp, ArrowRight } from "lucide-react";
import type { OpportunityRadarItem } from "@/lib/benchmarkEngine";

interface OpportunityRadarPanelProps {
  items: OpportunityRadarItem[];
}

function leverageConfig(level: "high" | "moderate" | "low") {
  const map = {
    high: { color: "hsl(var(--success))", bg: "hsl(var(--success) / 0.08)", border: "hsl(var(--success) / 0.15)", label: "High Leverage", Icon: Zap },
    moderate: { color: "hsl(var(--warning))", bg: "hsl(var(--warning) / 0.08)", border: "hsl(var(--warning) / 0.15)", label: "Moderate Leverage", Icon: TrendingUp },
    low: { color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted) / 0.3)", border: "hsl(var(--border))", label: "Low Leverage", Icon: ArrowRight },
  };
  return map[level];
}

export const OpportunityRadarPanel = memo(function OpportunityRadarPanel({ items }: OpportunityRadarPanelProps) {
  if (items.length === 0) return null;

  const grouped = {
    high: items.filter(i => i.leverage === "high"),
    moderate: items.filter(i => i.leverage === "moderate"),
    low: items.filter(i => i.leverage === "low"),
  };

  const tiers: { key: "high" | "moderate" | "low"; items: OpportunityRadarItem[] }[] = [
    { key: "high", items: grouped.high },
    { key: "moderate", items: grouped.moderate },
    { key: "low", items: grouped.low },
  ].filter(t => t.items.length > 0);

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "hsl(var(--card))", border: "1.5px solid hsl(var(--border))" }}>
      {/* Header */}
      <div className="px-5 pt-4 pb-2 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--primary) / 0.1)" }}>
          <Radar size={14} className="text-primary" />
        </div>
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
          Opportunity Landscape
        </span>
      </div>

      {/* Tiers */}
      <div className="px-5 pb-4 space-y-3">
        {tiers.map(tier => {
          const cfg = leverageConfig(tier.key);
          return (
            <div key={tier.key}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <cfg.Icon size={11} style={{ color: cfg.color }} />
                <span className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: cfg.color }}>
                  {cfg.label} Moves
                </span>
              </div>
              <div className="space-y-1.5">
                {tier.items.map((item, i) => (
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
                    <span className="text-[10px] font-black flex-shrink-0 mt-0.5" style={{ color: cfg.color }}>
                      {item.score.toFixed(1)}
                    </span>
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
