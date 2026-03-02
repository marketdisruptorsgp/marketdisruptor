import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Shield, AlertTriangle, CheckCircle2, XCircle, Beaker, ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

/* ═══════════════════════════════════════════════════════════════
   DECISION SYNTHESIS PANEL
   Renders governed decision_synthesis + falsification data
   from the checkpoint-gated pipeline.
   ═══════════════════════════════════════════════════════════════ */

interface DecisionSynthesis {
  decision_grade: "decision_grade" | "conditional" | "blocked";
  confidence_score: number;
  blocking_uncertainties: string[];
  fastest_validation_experiment: string;
  next_required_evidence: string;
}

interface Falsification {
  falsification_conditions: string[];
  redesign_invalidation_evidence: string[];
  adoption_failure_conditions: string[];
  economic_collapse_scenario: string;
  model_fragility_score: number;
}

interface DecisionSynthesisPanelProps {
  decisionSynthesis?: DecisionSynthesis | null;
  falsification?: Falsification | null;
}

const GRADE_CONFIG: Record<string, { icon: typeof Shield; color: string; label: string; bg: string }> = {
  decision_grade: {
    icon: CheckCircle2,
    color: "hsl(var(--cin-green))",
    label: "Decision-Grade",
    bg: "hsl(var(--cin-green) / 0.08)",
  },
  conditional: {
    icon: AlertTriangle,
    color: "hsl(38 92% 50%)",
    label: "Conditional",
    bg: "hsl(38 92% 50% / 0.08)",
  },
  blocked: {
    icon: XCircle,
    color: "hsl(var(--cin-red))",
    label: "Blocked",
    bg: "hsl(var(--cin-red) / 0.08)",
  },
};

export function DecisionSynthesisPanel({ decisionSynthesis, falsification }: DecisionSynthesisPanelProps) {
  if (!decisionSynthesis && !falsification) return null;

  const grade = decisionSynthesis?.decision_grade || "conditional";
  const config = GRADE_CONFIG[grade] || GRADE_CONFIG.conditional;
  const GradeIcon = config.icon;
  const confidence = decisionSynthesis?.confidence_score ?? 0;

  const fragilityScore = falsification?.model_fragility_score ?? 0;
  const fragilityColor = fragilityScore > 65 ? "hsl(var(--cin-red))" : fragilityScore > 35 ? "hsl(38 92% 50%)" : "hsl(var(--cin-green))";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="rounded-xl overflow-hidden"
      style={{
        background: "hsl(var(--cin-depth-mid))",
        border: `1px solid ${config.color}20`,
      }}
    >
      {/* Header */}
      <div className="p-4 flex items-center gap-3" style={{ borderBottom: `1px solid hsl(var(--cin-depth-fg))` }}>
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: config.bg }}
        >
          <GradeIcon className="w-5 h-5" style={{ color: config.color }} />
        </div>
        <div className="flex-1">
          <p className="text-xs font-extrabold uppercase tracking-widest" style={{ color: config.color }}>
            {config.label}
          </p>
          <p className="text-[10px] font-medium mt-0.5" style={{ color: "hsl(var(--cin-label) / 0.5)" }}>
            Decision Readiness Assessment
          </p>
        </div>
        {/* Confidence meter */}
        <div className="text-right">
          <span className="text-lg font-extrabold" style={{ color: config.color }}>{confidence}</span>
          <span className="text-[10px] font-bold" style={{ color: "hsl(var(--cin-label) / 0.4)" }}>/100</span>
        </div>
      </div>

      {/* Confidence bar */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "hsl(var(--cin-label) / 0.4)" }}>
            Confidence
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--cin-depth-fg))" }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, confidence)}%` }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${config.color}80, ${config.color})` }}
          />
        </div>
      </div>

      {/* Blocking uncertainties */}
      {decisionSynthesis?.blocking_uncertainties && decisionSynthesis.blocking_uncertainties.length > 0 && (
        <div className="px-4 pb-3">
          <p className="text-[9px] font-bold uppercase tracking-widest mb-2" style={{ color: "hsl(var(--cin-label) / 0.4)" }}>
            Blocking Uncertainties
          </p>
          <div className="space-y-1.5">
            {decisionSynthesis.blocking_uncertainties.map((u, i) => (
              <div key={i} className="flex items-start gap-2">
                <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: "hsl(38 92% 50%)" }} />
                <span className="text-[11px] leading-snug" style={{ color: "hsl(0 0% 85%)" }}>{u}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Validation experiment */}
      {decisionSynthesis?.fastest_validation_experiment && (
        <div className="px-4 pb-3">
          <div className="flex items-start gap-2 p-2.5 rounded-lg" style={{ background: "hsl(var(--cin-depth-bg) / 0.5)" }}>
            <Beaker className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: "hsl(229 89% 63%)" }} />
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: "hsl(229 89% 63%)" }}>
                Fastest Validation
              </p>
              <p className="text-[11px] leading-snug" style={{ color: "hsl(0 0% 85%)" }}>
                {decisionSynthesis.fastest_validation_experiment}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Falsification Protocol (expandable) */}
      {falsification && (
        <Collapsible>
          <CollapsibleTrigger className="w-full px-4 py-2.5 flex items-center justify-between hover:opacity-80 transition-opacity"
            style={{ borderTop: `1px solid hsl(var(--cin-depth-fg))` }}
          >
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5" style={{ color: fragilityColor }} />
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "hsl(var(--cin-label) / 0.5)" }}>
                Falsification Protocol
              </span>
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded" style={{ color: fragilityColor, background: `${fragilityColor}15` }}>
                Fragility: {fragilityScore}/100
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5" style={{ color: "hsl(var(--cin-label) / 0.3)" }} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-4 space-y-3">
              {/* Fragility bar */}
              <div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--cin-depth-fg))" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, fragilityScore)}%` }}
                    transition={{ duration: 0.6 }}
                    className="h-full rounded-full"
                    style={{ background: fragilityColor }}
                  />
                </div>
              </div>

              {falsification.falsification_conditions.length > 0 && (
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "hsl(var(--cin-red) / 0.7)" }}>
                    What Would Prove This Wrong
                  </p>
                  {falsification.falsification_conditions.map((c, i) => (
                    <div key={i} className="flex items-start gap-2 mb-1">
                      <XCircle className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: "hsl(var(--cin-red) / 0.6)" }} />
                      <span className="text-[11px] leading-snug" style={{ color: "hsl(0 0% 80%)" }}>{c}</span>
                    </div>
                  ))}
                </div>
              )}

              {falsification.economic_collapse_scenario && (
                <div className="p-2.5 rounded-lg" style={{ background: "hsl(var(--cin-red) / 0.05)", border: "1px solid hsl(var(--cin-red) / 0.1)" }}>
                  <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: "hsl(var(--cin-red) / 0.6)" }}>
                    Economic Collapse Scenario
                  </p>
                  <p className="text-[11px] leading-snug" style={{ color: "hsl(0 0% 80%)" }}>
                    {falsification.economic_collapse_scenario}
                  </p>
                </div>
              )}

              {falsification.adoption_failure_conditions.length > 0 && (
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "hsl(38 92% 50% / 0.7)" }}>
                    Adoption Failure Conditions
                  </p>
                  {falsification.adoption_failure_conditions.map((c, i) => (
                    <div key={i} className="flex items-start gap-2 mb-1">
                      <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: "hsl(38 92% 50% / 0.6)" }} />
                      <span className="text-[11px] leading-snug" style={{ color: "hsl(0 0% 80%)" }}>{c}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </motion.div>
  );
}
