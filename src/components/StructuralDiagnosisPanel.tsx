import { useState } from "react";
import { ChevronDown, AlertTriangle, Zap } from "lucide-react";

interface CausalChain {
  friction_id: string;
  structural_constraint: string;
  system_impact: string;
  impact_dimension: string;
}

interface ConstraintMap {
  causal_chains?: CausalChain[];
  binding_constraint_id?: string;
  dominance_proof?: string;
  counterfactual_removal_result?: string;
}

const IMPACT_COLORS: Record<string, { bg: string; text: string }> = {
  cost: { bg: "hsl(0 70% 50% / 0.08)", text: "hsl(0 70% 45%)" },
  time: { bg: "hsl(38 92% 50% / 0.08)", text: "hsl(38 92% 38%)" },
  adoption: { bg: "hsl(271 70% 50% / 0.08)", text: "hsl(271 70% 40%)" },
  scale: { bg: "hsl(217 91% 50% / 0.08)", text: "hsl(217 91% 40%)" },
  reliability: { bg: "hsl(200 80% 45% / 0.08)", text: "hsl(200 80% 38%)" },
  risk: { bg: "hsl(330 80% 50% / 0.08)", text: "hsl(330 80% 40%)" },
};

function getConfidence(chain: CausalChain, isBinding: boolean): string {
  if (isBinding) return "High";
  if (chain.system_impact?.length > 30) return "Medium";
  return "Low";
}

const CONFIDENCE_STYLE: Record<string, { bg: string; text: string }> = {
  High: { bg: "hsl(142 70% 40% / 0.1)", text: "hsl(142 70% 32%)" },
  Medium: { bg: "hsl(38 92% 50% / 0.1)", text: "hsl(38 92% 35%)" },
  Low: { bg: "hsl(var(--muted))", text: "hsl(var(--muted-foreground))" },
};

export function StructuralDiagnosisPanel({ constraintMap }: { constraintMap?: ConstraintMap }) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const chains = constraintMap?.causal_chains || [];

  if (!chains.length) return null;

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "hsl(0 70% 50%)" }}>
          <AlertTriangle size={14} style={{ color: "white" }} />
        </div>
        <div>
          <p className="text-sm font-extrabold text-foreground uppercase tracking-widest">Structural Diagnosis</p>
          <p className="text-xs font-medium text-foreground/70">Systemic root causes driving observed signals</p>
        </div>
      </div>

      {/* Binding constraint callout */}
      {constraintMap?.dominance_proof && (
        <div className="rounded-xl p-4" style={{ background: "hsl(var(--foreground))", border: "none" }}>
          <div className="flex items-center gap-2 mb-2">
            <Zap size={13} style={{ color: "hsl(var(--background))" }} />
            <p className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: "hsl(var(--background) / 0.6)" }}>
              Binding Constraint
            </p>
          </div>
          <p className="text-sm font-bold leading-snug" style={{ color: "hsl(var(--background))" }}>
            {constraintMap.dominance_proof}
          </p>
          {constraintMap.counterfactual_removal_result && (
            <p className="text-xs mt-2 leading-relaxed" style={{ color: "hsl(var(--background) / 0.65)" }}>
              If removed: {constraintMap.counterfactual_removal_result}
            </p>
          )}
        </div>
      )}

      {/* Structural problem cards */}
      <div className="space-y-2">
        {chains.map((chain, i) => {
          const isBinding = chain.friction_id === constraintMap?.binding_constraint_id;
          const confidence = getConfidence(chain, isBinding);
          const confStyle = CONFIDENCE_STYLE[confidence];
          const impactDim = (chain.impact_dimension || "").split("|")[0].trim().toLowerCase();
          const impactColor = IMPACT_COLORS[impactDim] || IMPACT_COLORS.risk;
          const isExpanded = expandedIdx === i;

          return (
            <button
              key={i}
              onClick={() => setExpandedIdx(isExpanded ? null : i)}
              className="w-full text-left rounded-xl overflow-hidden transition-all"
              style={{
                background: "hsl(var(--card))",
                border: isBinding
                  ? "2px solid hsl(0 70% 50% / 0.3)"
                  : "1.5px solid hsl(var(--border))",
              }}
            >
              {/* Header row */}
              <div className="px-4 py-3.5 flex items-start gap-3">
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
                  style={{
                    background: isBinding ? "hsl(0 70% 50%)" : "hsl(var(--foreground))",
                    color: "hsl(var(--background))",
                  }}
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground leading-snug">
                    {chain.structural_constraint}
                  </p>
                  {isBinding && (
                    <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[9px] font-bold" style={{ background: "hsl(0 70% 50% / 0.1)", color: "hsl(0 70% 45%)" }}>
                      System-Limiting
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ background: impactColor.bg, color: impactColor.text }}>
                    {impactDim || "impact"}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ background: confStyle.bg, color: confStyle.text }}>
                    {confidence}
                  </span>
                  <ChevronDown
                    size={14}
                    className="text-foreground/50 transition-transform"
                    style={{ transform: isExpanded ? "rotate(180deg)" : "none" }}
                  />
                </div>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-0 space-y-3" style={{ borderTop: "1px solid hsl(var(--border))" }}>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/60 mb-1">Market Impact</p>
                    <p className="text-sm text-foreground leading-relaxed">{chain.system_impact}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/60 mb-1">Impact Dimension</p>
                    <p className="text-sm text-foreground">{chain.impact_dimension}</p>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Summary */}
      <p className="text-sm font-semibold text-foreground">
        {chains.length} structural problem{chains.length !== 1 ? "s" : ""} identified
        {constraintMap?.binding_constraint_id ? " · 1 system-limiting constraint" : ""}
      </p>
    </div>
  );
}
