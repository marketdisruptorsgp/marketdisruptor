import React, { ReactNode } from "react";
import { StructuralVisualList, StructuralVisual } from "./StructuralVisual";
import { ActionPlanList } from "./ActionPlanCard";
import { enforceVisualContract } from "@/lib/visualContract";
import type { VisualSpec, ActionPlan } from "@/lib/visualContract";

// Re-export for backward compatibility
export { enforceVisualContract } from "@/lib/visualContract";
export type { VisualSpec, ActionPlan } from "@/lib/visualContract";

/* ═══════════════════════════════════════════════════════════
   UNIVERSAL RENDERING CONTRACT
   Visual always leads. Text always collapses.
   Multi-panel ontology specs render as a visual dashboard.
   ═══════════════════════════════════════════════════════════ */

function OntologyPanel({ spec }: { spec: VisualSpec }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/50 p-3 space-y-2">
      {spec.title && (
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-primary/10 text-primary">
            {spec.title}
          </span>
        </div>
      )}
      <StructuralVisual spec={spec} />
    </div>
  );
}

function MultiPanelDashboard({ specs }: { specs: VisualSpec[] }) {
  if (specs.length === 0) return null;

  // Single panel → no grid
  if (specs.length === 1) return <OntologyPanel spec={specs[0]} />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {specs.map((spec, i) => (
        <OntologyPanel key={`ontology-${i}`} spec={spec} />
      ))}
    </div>
  );
}

export function AnalysisVisualLayer({
  analysis,
  children,
  suppressText = true,
}: {
  analysis: Record<string, unknown>;
  children: ReactNode;
  suppressText?: boolean;
}) {
  const enriched = enforceVisualContract(analysis);
  const hasStructuralVisuals = enriched.visualSpecs.length > 0 && enriched.visualSpecs.some((s: VisualSpec) => s.structurally_grounded);
  const hasOntologyPanels = enriched.ontologySpecs.length > 0;
  const hasVisuals = hasStructuralVisuals || hasOntologyPanels;

  return (
    <>
      {/* L1 Executive Signal — primary structural model */}
      {hasStructuralVisuals && <StructuralVisualList specs={enriched.visualSpecs} />}

      {/* L1.5 Domain Panels — ontology-specific multi-panel dashboard */}
      {hasOntologyPanels && (
        <div className="mt-3">
          <MultiPanelDashboard specs={enriched.ontologySpecs} />
        </div>
      )}

      {enriched.actionPlans.length > 0 && <ActionPlanList plans={enriched.actionPlans} />}

      {/* L2/L3 Detail — strictly hidden when structural visuals present */}
      {suppressText && hasVisuals ? (
        <details className="group mt-1">
          <summary className="cursor-pointer select-none inline-flex items-center gap-2 px-2 py-1 rounded text-[11px] font-bold text-muted-foreground/70 transition-colors hover:text-foreground hover:bg-muted/50">
            <span className="transition-transform group-open:rotate-90 text-[9px]">▶</span>
            Deep Insight
          </summary>
          <div className="mt-3 space-y-4 border-l-2 border-border/50 pl-3">
            {children}
          </div>
        </details>
      ) : (
        children
      )}
    </>
  );
}
