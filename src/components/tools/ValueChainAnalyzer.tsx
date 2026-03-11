/**
 * VALUE CHAIN ANALYZER — Renders governed value chain stages via Sankey diagram.
 * Pulls from decomposition.valueChain (governed artifact) with fallback to legacy data.
 */
import { useMemo } from "react";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { ValueChainSankey, type ValueChainStage } from "./ValueChainSankey";

interface Props {
  analysisId: string;
}

export function ValueChainAnalyzer({ analysisId }: Props) {
  const { businessAnalysisData } = useAnalysis();
  const decomposition = (businessAnalysisData as any)?.decomposition;
  const gov = (businessAnalysisData as any)?.governed;

  const { stages, highestFrictionStage, primaryValueLeakage } = useMemo(() => {
    // Primary source: governed valueChain from structural-decomposition
    const vc = decomposition?.valueChain;
    if (vc?.stages && vc.stages.length >= 2) {
      return {
        stages: vc.stages.map((s: any) => ({
          id: s.id || `vc_${Math.random().toString(36).slice(2, 6)}`,
          label: s.label,
          description: s.description || "",
          friction: s.friction || "medium",
          frictionDetail: s.frictionDetail,
          costShare: s.costShare,
          actors: s.actors,
          disintermediationPotential: s.disintermediationPotential,
        })) as ValueChainStage[],
        highestFrictionStage: vc.highestFrictionStage || "",
        primaryValueLeakage: vc.primaryValueLeakage || "",
      };
    }

    // Fallback: build from legacy governed data
    const steps: ValueChainStage[] = [];
    const fp = gov?.first_principles;
    if (fp?.dependency_structure) {
      (fp.dependency_structure as string[]).forEach((dep: string, i: number) => {
        steps.push({ id: `legacy_${i}`, label: dep, friction: "medium", description: dep });
      });
    }
    const ft = gov?.friction_tiers;
    if (ft?.tier_1) {
      (ft.tier_1 as any[]).forEach((f: any, i: number) => {
        steps.push({ id: `t1_${i}`, label: f.description || "Tier 1 Friction", friction: "high", description: f.system_impact || "" });
      });
    }
    if (ft?.tier_2) {
      (ft.tier_2 as any[]).forEach((f: any, i: number) => {
        steps.push({ id: `t2_${i}`, label: f.description || "Tier 2 Friction", friction: "medium", description: f.optimization_target || "" });
      });
    }

    if (steps.length < 2) {
      return {
        stages: [
          { id: "fb_1", label: "Inputs / Resources", friction: "low" as const, description: "Raw materials and resource acquisition" },
          { id: "fb_2", label: "Production / Service Delivery", friction: "medium" as const, description: "Core transformation process" },
          { id: "fb_3", label: "Distribution / Channel", friction: "high" as const, description: "Getting the product to market" },
          { id: "fb_4", label: "Customer Delivery", friction: "medium" as const, description: "Final mile to customer" },
          { id: "fb_5", label: "Revenue Collection", friction: "high" as const, description: "Payment and revenue capture" },
        ] as ValueChainStage[],
        highestFrictionStage: "fb_3",
        primaryValueLeakage: "",
      };
    }

    return { stages: steps, highestFrictionStage: "", primaryValueLeakage: "" };
  }, [decomposition, gov]);

  const mechanism = gov?.first_principles?.causal_model?.mechanism;

  const constraints = useMemo(() => {
    if (!gov?.constraint_map?.causal_chains) return [];
    return (gov.constraint_map.causal_chains as any[]).map((c: any) => ({
      label: c.structural_constraint || c.label,
      impact: c.impact_dimension,
      systemImpact: c.system_impact,
    }));
  }, [gov]);

  const counterfactual = gov?.constraint_map?.counterfactual_removal_result;

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
        <ValueChainSankey
          stages={stages}
          highestFrictionStage={highestFrictionStage}
          primaryValueLeakage={primaryValueLeakage}
        />
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
