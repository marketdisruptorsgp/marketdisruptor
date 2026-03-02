import React, { ReactNode } from "react";
import { StructuralVisualList, StructuralVisual } from "./StructuralVisual";
import { ActionPlanList } from "./ActionPlanCard";
import { resolveAdaptiveVisuals } from "@/lib/adaptiveVisualEngine";
import type { AdaptiveVisualResult } from "@/lib/adaptiveVisualEngine";
import type { VisualSpec, ActionPlan } from "@/lib/visualContract";
import { enforceVisualContract } from "@/lib/visualContract";

// Re-export for backward compatibility
export { enforceVisualContract } from "@/lib/visualContract";
export type { VisualSpec, ActionPlan } from "@/lib/visualContract";

/* ═══════════════════════════════════════════════════════════
   ADAPTIVE VISUAL RENDERING LAYER
   Tiered: STRUCTURAL_MODEL → INSIGHT_MAP → INTELLIGENCE_SURFACE
   Visual always leads. Text always collapses.
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
  if (specs.length === 1) return <OntologyPanel spec={specs[0]} />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {specs.map((spec, i) => (
        <OntologyPanel key={`ontology-${i}`} spec={spec} />
      ))}
    </div>
  );
}

function TierBadge({ tier }: { tier: AdaptiveVisualResult["tier"] }) {
  const config = {
    STRUCTURAL_MODEL: { label: "Structural", color: "bg-primary/10 text-primary" },
    INSIGHT_MAP: { label: "Insight", color: "bg-accent/60 text-accent-foreground" },
    INTELLIGENCE_SURFACE: { label: "Surface", color: "bg-muted text-muted-foreground" },
  };
  const c = config[tier];
  return (
    <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest ${c.color}`}>
      {c.label}
    </span>
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
  const result = resolveAdaptiveVisuals(analysis);

  const hasOntologyPanels = result.ontologySpecs.length > 0;
  const hasCanonical = !!result.canonicalSpec;
  const hasSurface = result.surfaceSpecs.length > 0;
  const hasVisuals = hasOntologyPanels || hasCanonical || hasSurface;

  return (
    <>
      {/* 1️⃣ DOMAIN INTELLIGENCE PANELS — always first */}
      {hasOntologyPanels && (
        <MultiPanelDashboard specs={result.ontologySpecs} />
      )}

      {/* 2️⃣ CORE SYSTEM MODEL */}
      {hasCanonical && (
        <div className={hasOntologyPanels ? "mt-3" : undefined}>
          <StructuralVisualList specs={[result.canonicalSpec!]} />
        </div>
      )}

      {/* 2b️⃣ SURFACE / INSIGHT FALLBACK SPECS */}
      {hasSurface && !hasCanonical && (
        <div className={hasOntologyPanels ? "mt-3" : undefined}>
          <MultiPanelDashboard specs={result.surfaceSpecs} />
        </div>
      )}

      {/* 3️⃣ ACTION PLANS */}
      {result.actionPlans.length > 0 && <ActionPlanList plans={result.actionPlans} />}

      {/* 4️⃣ TEXT DEPTH — collapsed when visuals exist */}
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
