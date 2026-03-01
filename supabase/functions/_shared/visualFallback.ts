/**
 * Visual Fallback Generator
 * 
 * Ensures every pipeline response includes at least one visualSpec and one actionPlan.
 * Called post-parse on all edge function outputs.
 */

interface VisualNode {
  id: string;
  label: string;
  type: "constraint" | "effect" | "leverage" | "intervention" | "outcome";
  priority?: 1 | 2 | 3;
}

interface VisualEdge {
  from: string;
  to: string;
  relationship: "causes" | "relaxed_by" | "implemented_by" | "produces";
  label?: string;
}

interface VisualSpec {
  visual_type: "constraint_map" | "causal_chain" | "leverage_hierarchy";
  title: string;
  nodes: VisualNode[];
  edges: VisualEdge[];
  layout: "linear" | "vertical" | "hierarchical";
  interpretation: string;
}

interface ActionPlan {
  initiative: string;
  objective: string;
  leverage_type: "optimization" | "structural_improvement" | "redesign";
  mechanism: string;
  complexity: "low" | "medium" | "high";
  time_horizon: "near_term" | "mid_term" | "long_term";
  risk: { execution: string; adoption: string; market: string };
  validation: string;
  decision_readiness: number;
  confidence: "high" | "medium" | "exploratory";
}

/**
 * Extract a dominant constraint description from analysis output.
 * Searches common fields across all pipeline step schemas.
 */
function extractDominantConstraint(data: Record<string, unknown>): { constraint: string; cause: string; impact: string } {
  // Try business model fields
  const opAudit = data.operationalAudit as Record<string, unknown> | undefined;
  if (opAudit?.revenueLeaks) {
    const leaks = opAudit.revenueLeaks as string[];
    if (leaks.length > 0) {
      return {
        constraint: leaks[0].slice(0, 60),
        cause: "Structural revenue inefficiency",
        impact: "Margin compression and growth limitation",
      };
    }
  }

  // Try first-principles fields
  const friction = data.frictionDimensions as Record<string, unknown> | undefined;
  if (friction?.primaryFriction) {
    return {
      constraint: String(friction.primaryFriction).slice(0, 60),
      cause: "Dominant system friction",
      impact: "Limits adoption and scalability",
    };
  }

  // Try critical validation fields
  const redTeam = data.redTeam as Record<string, unknown> | undefined;
  if (redTeam?.killShot) {
    return {
      constraint: String(redTeam.killShot).slice(0, 60),
      cause: "Critical market risk",
      impact: "Threatens viability",
    };
  }

  // Try pitch deck fields
  if (data.problemStatement) {
    return {
      constraint: String(data.problemStatement).slice(0, 60),
      cause: "Market problem",
      impact: "Unmet demand creates opportunity",
    };
  }

  // Generic fallback
  return {
    constraint: "Primary system constraint",
    cause: "Structural limitation",
    impact: "Performance ceiling",
  };
}

function buildFallbackVisual(data: Record<string, unknown>): VisualSpec {
  const { constraint, cause, impact } = extractDominantConstraint(data);
  return {
    visual_type: "constraint_map",
    title: "Dominant Constraint Structure",
    nodes: [
      { id: "cause", label: cause, type: "effect", priority: 2 },
      { id: "constraint", label: constraint, type: "constraint", priority: 1 },
      { id: "impact", label: impact, type: "outcome", priority: 3 },
    ],
    edges: [
      { from: "cause", to: "constraint", relationship: "causes" },
      { from: "constraint", to: "impact", relationship: "produces" },
    ],
    layout: "linear",
    interpretation: `Address "${cause}" to relax "${constraint}" and improve "${impact}".`,
  };
}

function buildFallbackActionPlan(data: Record<string, unknown>): ActionPlan {
  const { constraint } = extractDominantConstraint(data);
  return {
    initiative: `Address: ${constraint.slice(0, 40)}`,
    objective: `Remove or relax the dominant constraint`,
    leverage_type: "structural_improvement",
    mechanism: "Target the root cause of the primary system limitation",
    complexity: "medium",
    time_horizon: "near_term",
    risk: {
      execution: "Requires focused resource allocation",
      adoption: "Stakeholder alignment needed",
      market: "Market response uncertain",
    },
    validation: "Run a minimum viable test targeting the constraint within 30 days",
    decision_readiness: 2,
    confidence: "exploratory",
  };
}

/**
 * Ensures the parsed analysis object contains valid visualSpecs and actionPlans.
 * Mutates the object in place and returns it.
 */
export function enforceVisualContract<T extends Record<string, unknown>>(data: T): T {
  const specs = data.visualSpecs as unknown[] | undefined;
  if (!Array.isArray(specs) || specs.length === 0) {
    data.visualSpecs = [buildFallbackVisual(data)] as unknown as T[keyof T];
  }

  const plans = data.actionPlans as unknown[] | undefined;
  if (!Array.isArray(plans) || plans.length === 0) {
    data.actionPlans = [buildFallbackActionPlan(data)] as unknown as T[keyof T];
  }

  return data;
}
