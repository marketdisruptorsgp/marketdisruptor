/**
 * ETA Acquisition Scorecard
 * 
 * Displays valuation risk score, acquisition readiness,
 * deal grade, dimension breakdown, and key flags.
 */

import { memo, useMemo } from "react";
import { Shield, TrendingUp, AlertTriangle, CheckCircle2, Target } from "lucide-react";
import {
  computeETAScores,
  extractFinancialInputs,
  type ETAScoreResult,
  type ScoringDimension,
} from "@/lib/etaScoringEngine";

interface ETAAcquisitionScorecardProps {
  governedData: Record<string, unknown> | null;
  biExtraction: Record<string, unknown> | null;
}

const GRADE_STYLES: Record<string, { bg: string; text: string }> = {
  A: { bg: "hsl(var(--success) / 0.15)", text: "hsl(var(--success))" },
  B: { bg: "hsl(var(--primary) / 0.15)", text: "hsl(var(--primary))" },
  C: { bg: "hsl(var(--warning) / 0.15)", text: "hsl(var(--warning))" },
  D: { bg: "hsl(var(--destructive) / 0.15)", text: "hsl(var(--destructive))" },
  F: { bg: "hsl(var(--destructive) / 0.15)", text: "hsl(var(--destructive))" },
};

function DimensionRow({ dim }: { dim: ScoringDimension }) {
  const riskColor =
    dim.riskLevel === "low" ? "hsl(var(--success))" :
    dim.riskLevel === "moderate" ? "hsl(var(--primary))" :
    dim.riskLevel === "elevated" ? "hsl(var(--warning))" :
    "hsl(var(--destructive))";

  // Invert: low risk score = long green bar, high risk = long red bar
  const barPct = Math.min(100, Math.max(4, dim.score));

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold text-foreground truncate">{dim.label}</span>
        <span
          className="text-[10px] font-bold uppercase shrink-0"
          style={{ color: riskColor }}
        >
          {dim.riskLevel}
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden bg-muted">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${barPct}%`, background: riskColor }}
        />
      </div>
      <p className="text-[10px] text-muted-foreground leading-tight">{dim.detail}</p>
    </div>
  );
}

function ScoreRing({ value, label, color, sublabel }: { value: number; label: string; color: string; sublabel: string }) {
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
          <circle
            cx="50" cy="50" r="40" fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-black text-foreground">{Math.round(value)}</span>
          <span className="text-[9px] text-muted-foreground">/100</span>
        </div>
      </div>
      <p className="text-[11px] font-bold text-foreground text-center">{label}</p>
      <p className="text-[9px] text-muted-foreground text-center">{sublabel}</p>
    </div>
  );
}

export const ETAAcquisitionScorecard = memo(function ETAAcquisitionScorecard({
  governedData,
  biExtraction,
}: ETAAcquisitionScorecardProps) {
  const result = useMemo<ETAScoreResult | null>(() => {
    const inputs = extractFinancialInputs(governedData, biExtraction);
    // Only score if we have at least some meaningful financial data
    const hasData = inputs.revenue || inputs.sde || inputs.askingPrice || inputs.grossMargin;
    if (!hasData) return null;
    return computeETAScores(inputs);
  }, [governedData, biExtraction]);

  if (!result) return null;

  const riskVal = typeof result.valuationRiskScore.value === "number" ? result.valuationRiskScore.value : 50;
  const readinessVal = typeof result.acquisitionReadiness.value === "number" ? result.acquisitionReadiness.value : 50;

  const riskColor =
    riskVal <= 30 ? "hsl(var(--success))" :
    riskVal <= 55 ? "hsl(var(--warning))" :
    "hsl(var(--destructive))";

  const readinessColor =
    readinessVal >= 70 ? "hsl(var(--success))" :
    readinessVal >= 45 ? "hsl(var(--warning))" :
    "hsl(var(--destructive))";

  const gradeStyle = GRADE_STYLES[result.dealGrade] || GRADE_STYLES.C;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Target size={13} className="text-muted-foreground" />
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
          Acquisition Scorecard
        </p>
      </div>

      {/* Top: Score Rings + Deal Grade */}
      <div
        className="rounded-xl p-5 flex items-center justify-around gap-4 flex-wrap"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
      >
        <ScoreRing
          value={riskVal}
          label="Valuation Risk"
          color={riskColor}
          sublabel={result.valuationRiskLabel}
        />

        {/* Deal Grade */}
        <div className="flex flex-col items-center gap-1">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{ background: gradeStyle.bg }}
          >
            <span className="text-4xl font-black" style={{ color: gradeStyle.text }}>
              {result.dealGrade}
            </span>
          </div>
          <p className="text-[11px] font-bold text-foreground">Deal Grade</p>
          <p className="text-[9px] text-muted-foreground">{result.readinessLabel}</p>
        </div>

        <ScoreRing
          value={readinessVal}
          label="Acq. Readiness"
          color={readinessColor}
          sublabel={`${result.dimensions.filter(d => d.riskLevel === "low").length}/${result.dimensions.length} low-risk`}
        />
      </div>

      {/* Dimension Breakdown */}
      <div
        className="rounded-xl p-4 space-y-3"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
      >
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
          Risk Dimensions
        </p>
        <div className="space-y-3">
          {result.dimensions.map(d => (
            <DimensionRow key={d.label} dim={d} />
          ))}
        </div>
      </div>

      {/* Key Flags */}
      {result.keyFlags.length > 0 && (
        <div
          className="rounded-xl p-4 space-y-2"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
        >
          <div className="flex items-center gap-1.5">
            <AlertTriangle size={12} className="text-warning" />
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
              Key Flags
            </p>
          </div>
          <div className="space-y-1">
            {result.keyFlags.map((flag, i) => (
              <p key={i} className="text-[11px] text-muted-foreground leading-snug">{flag}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
