import React, { ReactNode } from "react";
import { StructuralVisualList, type VisualSpec, type VisualNode, type VisualEdge } from "./StructuralVisual";
import { ActionPlanList, type ActionPlan } from "./ActionPlanCard";

/**
 * Client-side fallback: guarantees every analysis has at least one structural visual
 * and one action plan — even for legacy data saved before the visual directive.
 */
export function ensureVisuals<T extends Record<string, unknown>>(data: T): T & { visualSpecs: VisualSpec[]; actionPlans: ActionPlan[] } {
  const existingVisuals = data.visualSpecs as VisualSpec[] | undefined;
  const existingPlans = (data.v3ActionPlans || data.actionPlans) as ActionPlan[] | undefined;

  const hasVisuals = Array.isArray(existingVisuals) && existingVisuals.length > 0;
  const hasPlans = Array.isArray(existingPlans) && existingPlans.length > 0;

  if (hasVisuals && hasPlans) {
    return { ...data, visualSpecs: existingVisuals!, actionPlans: existingPlans! };
  }

  const visualSpecs = hasVisuals ? existingVisuals! : generateFallbackVisual(data);
  const actionPlans = hasPlans ? existingPlans! : generateFallbackAction(data);

  return { ...data, visualSpecs, actionPlans };
}

function extractField(data: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = data[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

function extractArray(data: Record<string, unknown>, ...keys: string[]): string[] {
  for (const k of keys) {
    const v = data[k];
    if (Array.isArray(v) && v.length > 0) {
      return v.filter((x): x is string => typeof x === "string" && x.trim().length > 0).slice(0, 4);
    }
  }
  return [];
}

function generateFallbackVisual(data: Record<string, unknown>): VisualSpec[] {
  // Try to derive meaningful nodes from common analysis fields
  const problem = extractField(data, "coreProblem", "problemStatement", "keyInsight", "description");
  const factors = extractArray(data, "factors", "marketForces", "vulnerabilities", "blindSpots", "hiddenStrengths");
  const outcome = extractField(data, "recommendation", "verdict", "tagline", "completionMessage");

  const nodes: VisualNode[] = [];
  const edges: VisualEdge[] = [];

  // Node A: Constraint / Problem
  const nodeA: VisualNode = {
    id: "a",
    label: problem ? truncate(problem, 60) : "Primary Constraint",
    type: "constraint",
    priority: 1,
  };
  nodes.push(nodeA);

  // Nodes B..E: Drivers / Factors
  if (factors.length > 0) {
    factors.slice(0, 3).forEach((f, i) => {
      const id = `f${i}`;
      nodes.push({ id, label: truncate(f, 50), type: "effect", priority: 2 });
      edges.push({ from: id, to: "a", relationship: "causes", label: "drives" });
    });
  } else {
    nodes.push({ id: "f0", label: "Underlying Driver", type: "effect", priority: 2 });
    edges.push({ from: "f0", to: "a", relationship: "causes", label: "drives" });
  }

  // Node Z: Outcome
  const nodeZ: VisualNode = {
    id: "z",
    label: outcome ? truncate(outcome, 60) : "Expected Impact",
    type: "outcome",
    priority: 3,
  };
  nodes.push(nodeZ);
  edges.push({ from: "a", to: "z", relationship: "produces", label: "results in" });

  return [{
    visual_type: "constraint_map",
    title: "System Constraint Map",
    purpose: "Identifies the primary constraint and its causal drivers",
    nodes,
    edges,
    layout: "vertical",
    interpretation: "Address the driving factors to relax the primary constraint and improve the outcome.",
  }];
}

function generateFallbackAction(data: Record<string, unknown>): ActionPlan[] {
  const recs = extractArray(data, "recommendations", "strategicRecommendations", "keyChanges");

  if (recs.length > 0) {
    return recs.slice(0, 2).map((r) => ({
      initiative: truncate(r, 80),
      objective: "Improve system performance by addressing identified constraint",
      leverage_type: "structural_improvement" as const,
      mechanism: r,
      complexity: "medium" as const,
      time_horizon: "near_term" as const,
      confidence: "medium" as const,
    }));
  }

  return [{
    initiative: "Address primary constraint",
    objective: "Stabilize and improve the dominant system bottleneck",
    leverage_type: "structural_improvement",
    mechanism: "Identify the binding constraint, apply a targeted intervention, then measure results",
    complexity: "medium",
    time_horizon: "near_term",
    confidence: "exploratory",
  }];
}

function truncate(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max - 1) + "…";
}

/**
 * Universal wrapper: renders L1 visuals above content and collapses
 * narrative text when visuals are present (progressive disclosure).
 */
export function AnalysisVisualLayer({
  analysis,
  children,
  suppressText = true,
}: {
  analysis: Record<string, unknown>;
  children: ReactNode;
  suppressText?: boolean;
}) {
  const enriched = ensureVisuals(analysis);
  const hasVisuals = enriched.visualSpecs.length > 0 || enriched.actionPlans.length > 0;

  return (
    <>
      {/* L1 Executive Signal — always visible */}
      <StructuralVisualList specs={enriched.visualSpecs} />
      <ActionPlanList plans={enriched.actionPlans} />

      {/* L2/L3 Detail — strictly hidden when visuals present; on-demand only */}
      {suppressText && hasVisuals ? (
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
