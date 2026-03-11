/**
 * VALUE CHAIN ANALYZER — Identify inefficiencies and disintermediation opportunities
 * Pre-populated from governed first_principles and friction_tiers.
 * Now uses a D3 Sankey diagram for the value chain flow visualization.
 */
import { useMemo } from "react";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { ValueChainSankey } from "./ValueChainSankey";

interface Props {
  analysisId: string;
}

interface ChainStep {
  label: string;
  friction: "high" | "medium" | "low";
  description?: string;
}

export function ValueChainAnalyzer({ analysisId }: Props) {
  const { businessAnalysisData } = useAnalysis();
  const gov = (businessAnalysisData as any)?.governed;

  const chain = useMemo<ChainStep[]>(() => {
    const steps: ChainStep[] = [];

    // Build from first_principles.dependency_structure
    const fp = gov?.first_principles;
    if (fp?.dependency_structure) {
      (fp.dependency_structure as string[]).forEach((dep: string) => {
        steps.push({ label: dep, friction: "medium", description: dep });
      });
    }

    // Overlay friction tiers
    const ft = gov?.friction_tiers;
    if (ft?.tier_1) {
      (ft.tier_1 as any[]).forEach((f: any) => {
        steps.push({ label: f.description || f.label || "Tier 1 Friction", friction: "high", description: f.system_impact });
      });
    }
    if (ft?.tier_2) {
      (ft.tier_2 as any[]).forEach((f: any) => {
        steps.push({ label: f.description || f.label || "Tier 2 Friction", friction: "medium", description: f.optimization_target });
      });
    }

    // From causal model
    if (fp?.causal_model) {
      const cm = fp.causal_model;
      if (cm.inputs) {
        (cm.inputs as string[]).forEach((input: string) => {
          if (!steps.some(s => s.label.toLowerCase().includes(input.toLowerCase()))) {
            steps.unshift({ label: `Input: ${input}`, friction: "low" });
          }
        });
      }
      if (cm.outputs) {
        (cm.outputs as string[]).forEach((output: string) => {
          if (!steps.some(s => s.label.toLowerCase().includes(output.toLowerCase()))) {
            steps.push({ label: `Output: ${output}`, friction: "low" });
          }
        });
      }
    }

    if (steps.length === 0) {
      return [
        { label: "Inputs / Resources", friction: "low" },
        { label: "Production / Service Delivery", friction: "medium" },
        { label: "Distribution / Channel", friction: "high" },
        { label: "Customer Delivery", friction: "medium" },
        { label: "Revenue Collection", friction: "high" },
      ];
    }

    return steps;
  }, [gov]);

  const constraints = useMemo(() => {
    if (!gov?.constraint_map?.causal_chains) return [];
    return (gov.constraint_map.causal_chains as any[]).map((c: any) => ({
      label: c.structural_constraint || c.label,
      impact: c.impact_dimension,
      systemImpact: c.system_impact,
    }));
  }, [gov]);

  const counterfactual = gov?.constraint_map?.counterfactual_removal_result;
  const mechanism = gov?.first_principles?.causal_model?.mechanism;

  const frictionColor = (f: string) =>
    f === "high" ? "hsl(0 72% 52%)" : f === "medium" ? "hsl(38 92% 50%)" : "hsl(152 60% 44%)";

  return (
    <div className="space-y-5">
      {mechanism && (
        <div className="rounded-lg bg-muted/30 p-3">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-1">Core Mechanism</p>
          <p className="text-xs text-foreground leading-relaxed">{mechanism}</p>
        </div>
      )}

      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-3">Value Chain Flow</p>
        <ValueChainSankey chain={chain} />
      </div>

      {constraints.length > 0 && (
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-2">Structural Constraints</p>
          <div className="space-y-2">
            {constraints.map((c: any, i: number) => (
              <div key={i} className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                <p className="text-xs font-bold text-foreground">{c.label}</p>
                {c.systemImpact && <p className="text-[10px] text-muted-foreground mt-1">{c.systemImpact}</p>}
                {c.impact && <span className="text-[9px] font-bold text-destructive uppercase mt-1 inline-block">{c.impact}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {counterfactual && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-primary mb-1">Counterfactual: If Binding Constraint Removed</p>
          <p className="text-xs text-foreground leading-relaxed">{counterfactual}</p>
        </div>
      )}
    </div>
  );
}
