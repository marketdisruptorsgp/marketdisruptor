import React, { ReactNode } from "react";
import { StructuralVisualList } from "./StructuralVisual";
import { ActionPlanList } from "./ActionPlanCard";
import { enforceVisualContract } from "@/lib/visualContract";
import type { VisualSpec, ActionPlan } from "@/lib/visualContract";

// Re-export for backward compatibility
export { enforceVisualContract } from "@/lib/visualContract";
export type { VisualSpec, ActionPlan } from "@/lib/visualContract";

/* ═══════════════════════════════════════════════════════════
   UNIVERSAL RENDERING CONTRACT
   Visual always leads. Text always collapses.
   ═══════════════════════════════════════════════════════════ */

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
  const hasContent = hasStructuralVisuals || enriched.actionPlans.length > 0;

  return (
    <>
      {/* L1 Executive Signal — only if structurally grounded */}
      {hasStructuralVisuals && <StructuralVisualList specs={enriched.visualSpecs} />}
      {enriched.actionPlans.length > 0 && <ActionPlanList plans={enriched.actionPlans} />}

      {/* L2/L3 Detail — strictly hidden when structural visuals present */}
      {suppressText && hasStructuralVisuals ? (
        <details className="group mt-1">
          <summary className="cursor-pointer select-none inline-flex items-center gap-2 px-2 py-1 rounded text-[11px] font-bold text-muted-foreground/70 transition-colors hover:text-foreground hover:bg-muted/50">
            <span className="transition-transform group-open:rotate-90 text-[9px]">▶</span>
            Deep Dive
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
