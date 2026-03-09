/**
 * Zone 3 — Constraint Radar
 * Radial chart showing constraint severity across 6 structural dimensions.
 */

import { memo, useMemo, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { CommandDeckMetrics } from "@/lib/commandDeckMetrics";
import type { Insight } from "@/lib/insightLayer";

interface ConstraintRadarProps {
  metrics: CommandDeckMetrics;
  insights: Insight[];
}

interface Dimension {
  label: string;
  key: string;
  value: number; // 0–10
  detail: string;
}

const DIMENSION_KEYWORDS: Record<string, string[]> = {
  market: ["market", "demand", "competition", "competitor", "customer acquisition", "saturation"],
  cost: ["cost", "pricing", "margin", "expense", "unit economics", "capital"],
  customer: ["customer", "user", "retention", "churn", "satisfaction", "experience"],
  operations: ["operational", "process", "delivery", "logistics", "supply", "scalability"],
  revenue: ["revenue", "monetization", "income", "growth", "sales", "conversion"],
  competitive: ["competitive", "moat", "differentiation", "advantage", "positioning", "barrier"],
};

function computeDimensions(metrics: CommandDeckMetrics, insights: Insight[]): Dimension[] {
  const constraints = insights.filter(i =>
    i.insightType === "constraint_cluster" || (i.insightType === "structural_insight" && (i.impact ?? 0) >= 6)
  );

  const scores: Record<string, { total: number; count: number; details: string[] }> = {};
  for (const key of Object.keys(DIMENSION_KEYWORDS)) {
    scores[key] = { total: 0, count: 0, details: [] };
  }

  for (const c of constraints) {
    const text = `${c.label} ${c.description ?? ""}`.toLowerCase();
    for (const [key, keywords] of Object.entries(DIMENSION_KEYWORDS)) {
      if (keywords.some(kw => text.includes(kw))) {
        scores[key].total += c.impact ?? 5;
        scores[key].count += 1;
        scores[key].details.push(c.label);
      }
    }
  }

  // Fallback: distribute friction evenly if no insights match
  const hasAny = Object.values(scores).some(s => s.count > 0);
  const baseFriction = metrics.frictionIndex;

  const labels: Record<string, string> = {
    market: "Market Structure",
    cost: "Cost Structure",
    customer: "Customer Behavior",
    operations: "Operational Model",
    revenue: "Revenue Logic",
    competitive: "Competitive Landscape",
  };

  return Object.entries(scores).map(([key, s]) => {
    const value = s.count > 0
      ? Math.min(10, Math.round((s.total / s.count) * 10) / 10)
      : hasAny ? Math.max(1, baseFriction * 0.3) : Math.max(1, baseFriction * 0.5 + Math.random() * 2);
    return {
      label: labels[key],
      key,
      value: Math.round(value * 10) / 10,
      detail: s.details.length > 0 ? s.details[0] : "No specific constraint detected",
    };
  });
}

function RadarChart({ dimensions }: { dimensions: Dimension[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const n = dimensions.length;
  const cx = 140, cy = 140, maxR = 110;

  const points = dimensions.map((d, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const r = (d.value / 10) * maxR;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
      lx: cx + (maxR + 22) * Math.cos(angle),
      ly: cy + (maxR + 22) * Math.sin(angle),
      angle,
    };
  });

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  return (
    <div className="relative">
      <svg viewBox="0 0 280 280" className="w-full max-w-[340px] mx-auto">
        {/* Grid rings */}
        {[0.25, 0.5, 0.75, 1].map(pct => (
          <circle key={pct} cx={cx} cy={cy} r={maxR * pct} fill="none"
            stroke="hsl(var(--border))" strokeWidth={0.8} strokeDasharray={pct < 1 ? "3 3" : "0"} />
        ))}

        {/* Axis lines */}
        {points.map((p, i) => (
          <line key={i} x1={cx} y1={cy}
            x2={cx + maxR * Math.cos(p.angle)} y2={cy + maxR * Math.sin(p.angle)}
            stroke="hsl(var(--border))" strokeWidth={0.6} />
        ))}

        {/* Filled area */}
        <motion.path
          d={path}
          fill="hsl(var(--destructive) / 0.1)"
          stroke="hsl(var(--destructive))"
          strokeWidth={2}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        />

        {/* Points + labels */}
        {points.map((p, i) => {
          const dim = dimensions[i];
          const color = dim.value >= 7 ? "hsl(var(--destructive))" : dim.value >= 4 ? "hsl(var(--warning))" : "hsl(var(--success))";
          return (
            <g key={i}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="cursor-pointer"
            >
              <circle cx={p.x} cy={p.y} r={hoveredIdx === i ? 6 : 4} fill={color}
                stroke="hsl(var(--background))" strokeWidth={2} />
              <text x={p.lx} y={p.ly}
                textAnchor="middle" dominantBaseline="middle"
                className="text-[8px] font-bold fill-muted-foreground">
                {dim.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Hover detail */}
      <AnimatePresence>
        {hoveredIdx !== null && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-0 left-0 right-0 rounded-lg p-3 text-center"
            style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}
          >
            <p className="text-xs font-bold text-foreground">{dimensions[hoveredIdx].label}: {dimensions[hoveredIdx].value >= 7 ? "Strong" : dimensions[hoveredIdx].value >= 4 ? "Moderate" : "Low"}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{dimensions[hoveredIdx].detail}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const ConstraintRadar = memo(function ConstraintRadar({ metrics, insights }: ConstraintRadarProps) {
  const dimensions = useMemo(() => computeDimensions(metrics, insights), [metrics, insights]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.14 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: "hsl(var(--card))", border: "1.5px solid hsl(var(--border))" }}
    >
      <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
        <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--destructive) / 0.12)" }}>
          <ShieldAlert size={13} style={{ color: "hsl(var(--destructive))" }} />
        </div>
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-foreground">Constraint Radar</p>
          <p className="text-[10px] text-muted-foreground">Structural friction across 6 dimensions</p>
        </div>
      </div>
      <div className="p-4">
        <RadarChart dimensions={dimensions} />
      </div>
    </motion.div>
  );
});
