import { useMemo, useState } from "react";
import { Lightbulb, TrendingUp, Cpu, DollarSign, Building2, Globe, ChevronDown, ChevronUp, Shield } from "lucide-react";
import { deriveInnovationOpportunities, countOpportunities, type InnovationOutput, type InnovationOpportunity } from "@/lib/innovationEngine";
import { InfoExplainer } from "./InfoExplainer";

interface Props {
  governedData: Record<string, unknown> | null;
  analysisData: Record<string, unknown> | null;
  stressTestData: Record<string, unknown> | null;
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: typeof Lightbulb; color: string }> = {
  structural_leverage: { label: "Structural Leverage", icon: TrendingUp, color: "hsl(var(--primary))" },
  pricing_model_shifts: { label: "Pricing Model Shifts", icon: DollarSign, color: "hsl(142 70% 35%)" },
  automation_opportunities: { label: "Automation Opportunities", icon: Cpu, color: "hsl(220 70% 50%)" },
  cost_breakthroughs: { label: "Cost Breakthroughs", icon: DollarSign, color: "hsl(38 92% 42%)" },
  acquisition_rollup_opportunities: { label: "Acquisition Roll-Up", icon: Building2, color: "hsl(280 60% 50%)" },
  platform_expansion_paths: { label: "Platform Expansion", icon: Globe, color: "hsl(190 70% 40%)" },
};

const IMPACT_COLORS = {
  high: { bg: "hsl(var(--primary) / 0.08)", border: "hsl(var(--primary) / 0.25)", text: "hsl(var(--primary))" },
  medium: { bg: "hsl(38 92% 50% / 0.08)", border: "hsl(38 92% 50% / 0.25)", text: "hsl(38 92% 35%)" },
  low: { bg: "hsl(var(--muted))", border: "hsl(var(--border))", text: "hsl(var(--muted-foreground))" },
};

function OpportunityCard({ opp }: { opp: InnovationOpportunity }) {
  const [expanded, setExpanded] = useState(false);
  const colors = IMPACT_COLORS[opp.impactPotential];

  return (
    <div className="rounded-lg p-3" style={{ background: colors.bg, border: `1px solid ${colors.border}` }}>
      <button onClick={() => setExpanded(!expanded)} className="w-full text-left flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground leading-tight">{opp.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{opp.description}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ color: colors.text, background: `${colors.text}15` }}>
            {opp.impactPotential}
          </span>
          {expanded ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
        </div>
      </button>
      {expanded && (
        <div className="mt-2 pt-2 space-y-1.5" style={{ borderTop: `1px solid ${colors.border}` }}>
          <div className="flex items-center gap-1.5">
            <Shield className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Confidence: {Math.round(opp.confidence * 100)}%</span>
          </div>
          {opp.supportingEvidence.length > 0 && (
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Evidence</p>
              {opp.supportingEvidence.map((e, i) => (
                <p key={i} className="text-xs text-foreground">• {e}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function InnovationOpportunitiesPanel({ governedData, analysisData, stressTestData }: Props) {
  const output = useMemo(() => deriveInnovationOpportunities(
    governedData as any, analysisData as any, stressTestData as any
  ), [governedData, analysisData, stressTestData]);

  const total = countOpportunities(output);
  if (total === 0) return null;

  const categories = Object.entries(output).filter(([, arr]) => arr.length > 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Lightbulb size={16} style={{ color: "hsl(var(--primary))" }} />
        <h3 className="text-base font-extrabold text-foreground">Innovation Opportunities</h3>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}>
          {total} found
        </span>
        <InfoExplainer text="Structured innovation opportunities derived from constraint analysis, friction mapping, and stress test outputs. All opportunities are traceable to specific analysis artifacts." />
      </div>

      {categories.map(([key, opps]) => {
        const config = CATEGORY_CONFIG[key];
        if (!config) return null;
        const Icon = config.icon;
        return (
          <div key={key} className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Icon size={12} style={{ color: config.color }} />
              <p className="text-xs font-extrabold uppercase tracking-wider" style={{ color: config.color }}>{config.label}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {opps.map((opp, i) => <OpportunityCard key={i} opp={opp} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
