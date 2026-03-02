import React, { ReactNode } from "react";
import { StructuralVisualList, type VisualSpec, type VisualNode, type VisualEdge, type NodeRole } from "./StructuralVisual";
import { ActionPlanList, type ActionPlan } from "./ActionPlanCard";

/* ═══════════════════════════════════════════════════════════
   STRUCTURAL DERIVATION ENGINE
   Converts ANY analysis into a canonical VisualSystemModel.
   No output may render without structural model.
   ═══════════════════════════════════════════════════════════ */

/**
 * Ensures every analysis has at least one visual spec and one action plan.
 * Derives structure from text when AI output lacks explicit visual model.
 */
export function ensureVisuals<T extends Record<string, unknown>>(data: T): T & { visualSpecs: VisualSpec[]; actionPlans: ActionPlan[] } {
  const existingVisuals = data.visualSpecs as VisualSpec[] | undefined;
  const existingPlans = (data.v3ActionPlans || data.actionPlans) as ActionPlan[] | undefined;

  const hasVisuals = Array.isArray(existingVisuals) && existingVisuals.length > 0;
  const hasPlans = Array.isArray(existingPlans) && existingPlans.length > 0;

  if (hasVisuals && hasPlans) {
    // Validate structural density — must contain system + mechanism + outcome
    const valid = existingVisuals!.every(validateVisualSpec);
    if (valid) return { ...data, visualSpecs: existingVisuals!, actionPlans: existingPlans! };
  }

  const visualSpecs = hasVisuals ? existingVisuals! : deriveVisualSystemModel(data);
  const actionPlans = hasPlans ? existingPlans! : generateFallbackAction(data);

  return { ...data, visualSpecs, actionPlans };
}

/* ── Structural Validation ── */
function validateVisualSpec(spec: VisualSpec): boolean {
  if (!spec.nodes || spec.nodes.length < 3) return false;
  // Accept both new `role` and legacy `type` fields
  const roles = new Set(spec.nodes.map(n => n.role || legacyToRole(n.type)));
  // Must contain at minimum: system (or constraint) + some mechanism/force + outcome
  const hasSystem = roles.has("system") || roles.has("force");
  const hasOutcome = roles.has("outcome") || roles.has("leverage");
  return hasSystem && hasOutcome;
}

function legacyToRole(type?: string): NodeRole {
  const map: Record<string, NodeRole> = {
    constraint: "system", effect: "force", leverage: "leverage", intervention: "mechanism", outcome: "outcome",
  };
  return map[type || ""] || "force";
}

/* ── Text extraction helpers ── */
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

/* ── Structural Derivation Engine ── */
function deriveVisualSystemModel(data: Record<string, unknown>): VisualSpec[] {
  const system = extractField(data, "coreProblem", "problemStatement", "keyInsight", "description") || "Primary System";
  const forces = extractArray(data, "factors", "marketForces", "vulnerabilities", "blindSpots", "hiddenStrengths");
  const mechanism = extractField(data, "mechanism", "coreStrategy", "approach", "primaryFriction");
  const leverage = extractField(data, "leveragePoint", "recommendation", "strategicRecommendation");
  const outcome = extractField(data, "recommendation", "verdict", "tagline", "completionMessage", "impact");

  const nodes: VisualNode[] = [];
  const edges: VisualEdge[] = [];

  // System node (always P1, always present)
  nodes.push({
    id: "system",
    label: truncate(system, 60),
    role: "system",
    priority: 1,
    certainty: "verified",
  });

  // Force nodes
  if (forces.length > 0) {
    forces.slice(0, 3).forEach((f, i) => {
      const id = `force_${i}`;
      nodes.push({ id, label: truncate(f, 50), role: "force", priority: 2, certainty: "modeled" });
      edges.push({ from: id, to: "system", relationship: "acts on" });
    });
  } else {
    nodes.push({ id: "force_0", label: "Underlying Driver", role: "force", priority: 2, certainty: "assumption" });
    edges.push({ from: "force_0", to: "system", relationship: "acts on" });
  }

  // Mechanism node
  if (mechanism) {
    nodes.push({ id: "mechanism", label: truncate(mechanism, 55), role: "mechanism", priority: 2, certainty: "modeled" });
    edges.push({ from: "system", to: "mechanism", relationship: "operates through" });
    edges.push({ from: "mechanism", to: "outcome", relationship: "produces" });
  } else {
    edges.push({ from: "system", to: "outcome", relationship: "produces" });
  }

  // Leverage node
  if (leverage) {
    nodes.push({ id: "leverage", label: truncate(leverage, 55), role: "leverage", priority: 1, certainty: "modeled" });
    edges.push({ from: "leverage", to: mechanism ? "mechanism" : "system", relationship: "intervenes at" });
  }

  // Outcome node (always present)
  nodes.push({
    id: "outcome",
    label: outcome ? truncate(outcome, 60) : "Expected Impact",
    role: "outcome",
    priority: 3,
    certainty: "assumption",
  });

  return [{
    visual_type: "system_model",
    system: truncate(system, 40),
    title: "System Structure",
    nodes,
    edges,
    layout: "vertical",
    interpretation: leverage
      ? `Target "${truncate(leverage, 40)}" to shift the system outcome.`
      : "Address the primary system constraint to improve the outcome.",
    version: 1,
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
  const enriched = ensureVisuals(analysis);
  const hasVisuals = enriched.visualSpecs.length > 0 || enriched.actionPlans.length > 0;

  return (
    <>
      {/* L1 Executive Signal — always visible, visual-first */}
      <StructuralVisualList specs={enriched.visualSpecs} />
      <ActionPlanList plans={enriched.actionPlans} />

      {/* L2/L3 Detail — strictly hidden when visuals present */}
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
