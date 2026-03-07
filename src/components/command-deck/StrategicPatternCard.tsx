/**
 * Strategic Pattern Card — Shows detected structural business archetype
 * with credibility scoring (Strong / Moderate / Weak) and signal attribution.
 */

import { memo } from "react";
import { Fingerprint, AlertTriangle, TrendingUp, Shield } from "lucide-react";
import { motion } from "framer-motion";
import type { StructuralPattern } from "@/lib/strategicPatternEngine";

interface StrategicPatternCardProps {
  patterns: StructuralPattern[];
}

function patternStrength(score: number): { label: string; color: string; desc: string } {
  if (score >= 0.6) return {
    label: "Strong",
    color: "hsl(var(--success))",
    desc: "Multiple converging signals confirm this pattern",
  };
  if (score >= 0.35) return {
    label: "Moderate",
    color: "hsl(var(--warning))",
    desc: "Several indicators suggest this pattern — more data would increase certainty",
  };
  return {
    label: "Weak",
    color: "hsl(var(--muted-foreground))",
    desc: "Early indicators only — treat as a hypothesis to validate",
  };
}

export const StrategicPatternCard = memo(function StrategicPatternCard({ patterns }: StrategicPatternCardProps) {
  if (patterns.length === 0) return null;

  const primary = patterns[0];
  const secondary = patterns.slice(1);
  const strength = patternStrength(primary.matchScore);
  const signalCount = primary.matchedSignalCount ?? Math.round(primary.matchScore * 15);
  const matchedCategories = primary.matchedCategories ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl overflow-hidden"
      style={{ background: "hsl(var(--card))", border: "1.5px solid hsl(var(--border))" }}
    >
      <div className="px-5 pt-4 pb-3">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "hsl(var(--primary) / 0.1)" }}>
            <Fingerprint size={15} style={{ color: "hsl(var(--primary))" }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                Structural Pattern
              </span>
              {/* Credibility badge */}
              <span className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{ background: `${strength.color}12`, color: strength.color }}>
                <Shield size={9} />
                {strength.label}
              </span>
            </div>
            <h3 className="text-lg font-black text-foreground">{primary.name}</h3>
          </div>
        </div>

        {/* Pattern Strength explanation */}
        <div className="mb-3 px-3 py-2 rounded-lg" style={{ background: `${strength.color}06`, border: `1px solid ${strength.color}12` }}>
          <p className="text-[11px] font-medium leading-snug" style={{ color: strength.color }}>
            {strength.desc}
          </p>
          {matchedCategories.length > 0 && (
            <p className="text-[10px] text-muted-foreground mt-1">
              Detected across {signalCount} signals in {matchedCategories.slice(0, 3).join(", ").toLowerCase()}.
            </p>
          )}
          {matchedCategories.length === 0 && signalCount > 0 && (
            <p className="text-[10px] text-muted-foreground mt-1">
              Based on {signalCount} matching indicators across the analysis.
            </p>
          )}
        </div>

        {/* Characteristics */}
        <div className="mb-3">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground mb-1.5 block">
            Typical Characteristics
          </span>
          <div className="space-y-1">
            {primary.characteristics.map((c, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-muted-foreground flex-shrink-0 mt-1.5" />
                <span className="text-[12px] text-foreground leading-snug">{c}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Common Transformations */}
        <div className="mb-3">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground mb-1.5 block">
            <TrendingUp size={10} className="inline mr-1" style={{ color: "hsl(var(--success))" }} />
            Common Strategic Transformations
          </span>
          <div className="flex flex-wrap gap-1.5">
            {primary.commonTransformations.map((t, idx) => (
              <span key={idx} className="text-[11px] font-bold px-2 py-1 rounded-md"
                style={{ background: "hsl(var(--success) / 0.08)", color: "hsl(var(--success))" }}>
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Risk Factors */}
        <div className="mb-2">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground mb-1.5 block">
            <AlertTriangle size={10} className="inline mr-1 text-destructive" />
            Structural Risks
          </span>
          <div className="flex flex-wrap gap-1.5">
            {primary.riskFactors.map((r, idx) => (
              <span key={idx} className="text-[11px] font-semibold px-2 py-1 rounded-md"
                style={{ background: "hsl(var(--destructive) / 0.06)", color: "hsl(var(--destructive))" }}>
                {r}
              </span>
            ))}
          </div>
        </div>

        {/* Secondary patterns */}
        {secondary.length > 0 && (
          <div className="pt-2 border-t border-border mt-3">
            <span className="text-[10px] font-bold text-muted-foreground">
              Also resembles:{" "}
              {secondary.map((s, idx) => {
                const str = patternStrength(s.matchScore);
                return (
                  <span key={s.id}>
                    {s.name} <span style={{ color: str.color }}>({str.label})</span>
                    {idx < secondary.length - 1 ? ", " : ""}
                  </span>
                );
              })}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
});
