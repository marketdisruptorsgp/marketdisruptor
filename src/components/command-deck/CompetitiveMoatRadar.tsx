/**
 * CompetitiveMoatRadar — Spider/radar chart showing competitive defensibility
 * across key moat dimensions derived from analysis data.
 */
import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { Shield } from "lucide-react";

interface CompetitiveMoatRadarProps {
  governedData: Record<string, any> | null;
  narrative?: {
    primaryConstraint?: string | null;
    breakthroughOpportunity?: string | null;
  } | null;
  modeAccent: string;
}

interface MoatDimension {
  label: string;
  value: number; // 0-10
  description: string;
}

function extractMoatDimensions(governed: Record<string, any> | null): MoatDimension[] {
  if (!governed) return [];

  const fp = governed?.first_principles;
  const cm = governed?.constraint_map;
  const decomp = governed?.decomposition || governed?.structuralDecomposition;

  // Control Points → Control/Access moat
  const controlPoints = decomp?.systemDynamics?.controlPoints || [];
  const lockedControls = controlPoints.filter((cp: any) => cp.switchability === "locked").length;
  const controlScore = Math.min(10, lockedControls * 3 + (controlPoints.length > 0 ? 3 : 0));

  // Switching Costs from distribution
  const distribution = decomp?.distribution || {};
  const switchingCostsRaw = distribution?.switchingCosts || "";
  const switchingScore = switchingCostsRaw.toLowerCase().includes("high") ? 8
    : switchingCostsRaw.toLowerCase().includes("moderate") || switchingCostsRaw.toLowerCase().includes("medium") ? 5
    : switchingCostsRaw ? 3 : 4;

  // Network Effects
  const networkRaw = distribution?.networkEffects || "";
  const networkScore = networkRaw.toLowerCase().includes("strong") ? 9
    : networkRaw.toLowerCase().includes("moderate") ? 6
    : networkRaw.toLowerCase().includes("weak") || networkRaw.toLowerCase().includes("none") ? 2
    : networkRaw ? 4 : 3;

  // IP / Defensibility from constraints
  const constraints = cm?.causal_chains || [];
  const regulatoryConstraints = constraints.filter((c: any) =>
    (c.type || c.structural_constraint || "").toLowerCase().includes("regulat") ||
    (c.type || "").includes("regulation")
  ).length;
  const ipScore = Math.min(10, regulatoryConstraints * 2 + (fp?.key_patents ? 4 : 2));

  // Cost Advantage from cost drivers
  const costDrivers = decomp?.costDrivers || [];
  const reducibleCount = costDrivers.filter((cd: any) => cd.reducible).length;
  const costScore = costDrivers.length > 0
    ? Math.min(10, Math.round((reducibleCount / Math.max(costDrivers.length, 1)) * 10))
    : 4;

  // Brand / Differentiation
  const brandScore = fp?.causal_model?.mechanism ? 6 : 4;

  return [
    { label: "Control Points", value: controlScore, description: `${lockedControls} locked control points` },
    { label: "Switching Costs", value: switchingScore, description: switchingCostsRaw || "Not assessed" },
    { label: "Network Effects", value: networkScore, description: networkRaw || "Not assessed" },
    { label: "IP & Regulation", value: ipScore, description: `${regulatoryConstraints} regulatory barriers` },
    { label: "Cost Advantage", value: costScore, description: `${reducibleCount}/${costDrivers.length} costs reducible` },
    { label: "Differentiation", value: brandScore, description: fp?.causal_model?.mechanism || "Core mechanism" },
  ];
}

export const CompetitiveMoatRadar = memo(function CompetitiveMoatRadar({
  governedData,
  narrative,
  modeAccent,
}: CompetitiveMoatRadarProps) {
  const dimensions = useMemo(() => extractMoatDimensions(governedData), [governedData]);

  if (dimensions.length === 0) return null;

  const avgScore = dimensions.reduce((s, d) => s + d.value, 0) / dimensions.length;
  const n = dimensions.length;
  const cx = 120, cy = 120, maxR = 90;
  const angleStep = (2 * Math.PI) / n;

  // Generate polygon points
  const dataPoints = dimensions.map((d, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const r = (d.value / 10) * maxR;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") + "Z";

  // Grid rings
  const rings = [2.5, 5, 7.5, 10];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl overflow-hidden"
      style={{
        background: "hsl(var(--card))",
        border: "1px solid hsl(var(--border))",
      }}
    >
      <div className="px-5 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield size={14} style={{ color: modeAccent }} />
            <span className="text-xs font-extrabold uppercase tracking-widest text-foreground">
              Competitive Moat
            </span>
          </div>
          <span className="text-xs font-bold tabular-nums" style={{ color: modeAccent }}>
            {Math.round(avgScore * 10) / 10}/10
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Radar chart */}
          <svg width="240" height="240" viewBox="0 0 240 240" className="flex-shrink-0">
            {/* Grid */}
            {rings.map(r => {
              const ringPoints = Array.from({ length: n }, (_, i) => {
                const angle = i * angleStep - Math.PI / 2;
                const radius = (r / 10) * maxR;
                return `${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`;
              }).join(" ");
              return (
                <polygon
                  key={r}
                  points={ringPoints}
                  fill="none"
                  stroke="hsl(var(--border))"
                  strokeWidth={r === 10 ? 1.5 : 0.5}
                />
              );
            })}

            {/* Axes */}
            {dimensions.map((_, i) => {
              const angle = i * angleStep - Math.PI / 2;
              return (
                <line
                  key={i}
                  x1={cx} y1={cy}
                  x2={cx + maxR * Math.cos(angle)}
                  y2={cy + maxR * Math.sin(angle)}
                  stroke="hsl(var(--border))"
                  strokeWidth={0.5}
                />
              );
            })}

            {/* Data polygon */}
            <motion.path
              d={dataPath}
              fill={`${modeAccent}15`}
              stroke={modeAccent}
              strokeWidth={2}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
            />

            {/* Data points */}
            {dataPoints.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={3} fill={modeAccent} />
            ))}

            {/* Labels */}
            {dimensions.map((d, i) => {
              const angle = i * angleStep - Math.PI / 2;
              const labelR = maxR + 18;
              const lx = cx + labelR * Math.cos(angle);
              const ly = cy + labelR * Math.sin(angle);
              return (
                <text
                  key={i}
                  x={lx} y={ly}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="text-[9px] font-bold fill-muted-foreground"
                >
                  {d.label}
                </text>
              );
            })}
          </svg>

          {/* Dimension details */}
          <div className="flex-1 min-w-0 space-y-2">
            {dimensions.map(d => (
              <div key={d.label} className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-muted-foreground w-24 flex-shrink-0 truncate">
                  {d.label}
                </span>
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(d.value / 10) * 100}%`,
                      background: d.value >= 7 ? "hsl(152 60% 38%)" : d.value >= 4 ? "hsl(38 92% 45%)" : "hsl(0 72% 48%)",
                    }}
                  />
                </div>
                <span className="text-[10px] font-bold tabular-nums text-foreground w-4 text-right">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
});
