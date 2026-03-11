/**
 * RevivalScoreCard — Radial gauge showing overall revival/disruption potential
 * with breakdown of contributing factors.
 */
import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { Gauge, TrendingUp, Target, Zap, Clock } from "lucide-react";

interface RevivalScoreCardProps {
  score: number | null;
  modeAccent: string;
  narrative?: {
    strategicVerdict?: string | null;
    verdictConfidence?: number;
  } | null;
  metrics?: {
    opportunityScore?: number;
    leverageScore?: number;
    frictionIndex?: number;
    riskScore?: number;
  };
}

function scoreColor(score: number): string {
  if (score >= 8) return "hsl(152 60% 38%)";
  if (score >= 6) return "hsl(38 92% 45%)";
  if (score >= 4) return "hsl(25 95% 50%)";
  return "hsl(0 72% 48%)";
}

function scoreLabel(score: number): string {
  if (score >= 9) return "Exceptional";
  if (score >= 7) return "Strong";
  if (score >= 5) return "Moderate";
  if (score >= 3) return "Limited";
  return "Low";
}

const FACTORS = [
  { key: "opportunity", label: "Market Opportunity", icon: TrendingUp },
  { key: "leverage", label: "Leverage Potential", icon: Zap },
  { key: "feasibility", label: "Execution Feasibility", icon: Target },
  { key: "timing", label: "Timing & Urgency", icon: Clock },
] as const;

export const RevivalScoreCard = memo(function RevivalScoreCard({
  score,
  modeAccent,
  narrative,
  metrics,
}: RevivalScoreCardProps) {
  const factors = useMemo(() => {
    if (score === null || score === undefined || score <= 0) return [];
    const opp = metrics?.opportunityScore ?? score * 0.8;
    const lev = metrics?.leverageScore ?? score * 0.7;
    const feas = Math.max(1, 10 - (metrics?.frictionIndex ?? 3));
    const timing = Math.max(1, 10 - (metrics?.riskScore ?? 2));
    return [
      { ...FACTORS[0], value: Math.min(10, Math.round(opp * 10) / 10) },
      { ...FACTORS[1], value: Math.min(10, Math.round(lev * 10) / 10) },
      { ...FACTORS[2], value: Math.min(10, Math.round(feas * 10) / 10) },
      { ...FACTORS[3], value: Math.min(10, Math.round(timing * 10) / 10) },
    ];
  }, [score, metrics]);

  if (score === null || score === undefined || score <= 0) return null;

  const color = scoreColor(score);
  const circumference = 2 * Math.PI * 40;
  const progress = (score / 10) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl overflow-hidden"
      style={{
        background: "hsl(var(--card))",
        border: "1px solid hsl(var(--border))",
      }}
      data-pdf-section="revival-score"
    >
      <div className="px-5 py-4">
        <div className="flex items-center gap-2 mb-4">
          <Gauge size={14} style={{ color: modeAccent }} />
          <span className="text-xs font-extrabold uppercase tracking-widest text-foreground">
            Revival Potential
          </span>
        </div>

        <div className="flex items-center gap-6">
          {/* Radial gauge */}
          <div className="relative flex-shrink-0">
            <svg width="100" height="100" viewBox="0 0 100 100">
              <circle
                cx="50" cy="50" r="40"
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="6"
              />
              <motion.circle
                cx="50" cy="50" r="40"
                fill="none"
                stroke={color}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - progress}
                transform="rotate(-90 50 50)"
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: circumference - progress }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black" style={{ color }}>{score}</span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                / 10
              </span>
            </div>
          </div>

          {/* Factor breakdown */}
          <div className="flex-1 min-w-0 space-y-2">
            <p className="text-sm font-bold" style={{ color }}>
              {scoreLabel(score)}
            </p>
            {factors.map(f => {
              const Icon = f.icon;
              const pct = (f.value / 10) * 100;
              return (
                <div key={f.key} className="flex items-center gap-2">
                  <Icon size={10} className="text-muted-foreground flex-shrink-0" />
                  <span className="text-[10px] font-bold text-muted-foreground w-28 flex-shrink-0 truncate">
                    {f.label}
                  </span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: scoreColor(f.value) }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                    />
                  </div>
                  <span className="text-[10px] font-bold tabular-nums text-foreground w-6 text-right">
                    {f.value}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {narrative?.strategicVerdict && (
          <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
            {narrative.strategicVerdict}
          </p>
        )}
      </div>
    </motion.div>
  );
});
