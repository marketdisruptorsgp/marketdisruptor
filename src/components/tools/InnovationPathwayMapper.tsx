/**
 * INNOVATION PATHWAY MAPPER — Map feasible innovation paths
 * Uses governed constraint_map and first_principles.
 */
import { useMemo } from "react";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { Compass, ArrowRight, Zap, Target } from "lucide-react";

interface Props {
  analysisId: string;
}

interface Pathway {
  constraint: string;
  driver: string;
  leverage: string;
  opportunity: string;
}

export function InnovationPathwayMapper({ analysisId }: Props) {
  const { businessAnalysisData } = useAnalysis();
  const gov = (businessAnalysisData as any)?.governed;

  const pathways = useMemo<Pathway[]>(() => {
    const results: Pathway[] = [];

    const chains = gov?.constraint_map?.causal_chains || [];
    const assumptions = gov?.first_principles?.viability_assumptions || [];
    const counterfactual = gov?.constraint_map?.counterfactual_removal_result;

    (chains as any[]).forEach((chain: any, i: number) => {
      const constraint = chain.structural_constraint || `Constraint ${i + 1}`;
      const driver = chain.impact_dimension ? `${chain.impact_dimension} bottleneck` : "Structural driver";
      const assumption = (assumptions as any[])[i];
      const leverage = assumption?.assumption
        ? `Challenge: "${assumption.assumption.substring(0, 60)}"`
        : counterfactual ? counterfactual.substring(0, 80) : "Structural redesign";
      const opportunity = chain.system_impact
        ? `Resolve: ${chain.system_impact.substring(0, 80)}`
        : "Innovation pathway identified";

      results.push({ constraint, driver, leverage, opportunity });
    });

    if (results.length === 0 && counterfactual) {
      results.push({
        constraint: gov?.constraint_map?.binding_constraint_id || "Primary constraint",
        driver: "Binding constraint analysis",
        leverage: counterfactual.substring(0, 80),
        opportunity: "Structural transformation opportunity",
      });
    }

    return results;
  }, [gov]);

  const mvs = gov?.first_principles?.minimum_viable_system;

  return (
    <div className="space-y-5">
      {mvs && (
        <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-primary mb-1">Minimum Viable System</p>
          <p className="text-xs text-foreground leading-relaxed">{mvs}</p>
        </div>
      )}

      {pathways.length === 0 ? (
        <div className="rounded-lg bg-muted/30 p-6 text-center">
          <Compass size={24} className="text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-bold text-foreground">No pathways available</p>
          <p className="text-xs text-muted-foreground mt-1">Run a full analysis to generate innovation pathways</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pathways.map((path, i) => (
            <div key={i} className="rounded-xl border border-border p-4">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-3">Pathway {i + 1}</p>
              <div className="space-y-2">
                {[
                  { icon: Target, label: "Constraint", value: path.constraint, color: "hsl(0 72% 52%)" },
                  { icon: Zap, label: "Driver", value: path.driver, color: "hsl(38 92% 50%)" },
                  { icon: Compass, label: "Leverage", value: path.leverage, color: "hsl(229 89% 63%)" },
                  { icon: Target, label: "Opportunity", value: path.opportunity, color: "hsl(152 60% 44%)" },
                ].map((step, si) => (
                  <div key={si}>
                    <div className="flex items-start gap-2.5 rounded-lg p-2.5" style={{ background: `${step.color}08` }}>
                      <step.icon size={13} style={{ color: step.color }} className="flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-bold uppercase" style={{ color: step.color }}>{step.label}</p>
                        <p className="text-xs text-foreground mt-0.5 leading-relaxed">{step.value}</p>
                      </div>
                    </div>
                    {si < 3 && <div className="flex justify-center py-0.5"><ArrowRight size={10} className="text-muted-foreground rotate-90" /></div>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
