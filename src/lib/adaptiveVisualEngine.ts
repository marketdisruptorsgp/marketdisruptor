/* =========================================================
   ADAPTIVE VISUAL ENGINE
   Tiered visual resolution: structural → insight → surface
   Ensures every analysis produces appropriate visual output.
   ========================================================= */

import type { VisualSpec, VisualNode, VisualEdge } from "./visualContract";
import { resolveCanonicalVisualModel, resolveRole, isStructurallyMeaningful } from "./visualContract";
import { detectSignals } from "./signalDetection";
import { deriveAllOntologySpecs } from "./ontologyDerivation";

export type VisualTier =
  | "STRUCTURAL_MODEL"
  | "INSIGHT_MAP"
  | "INTELLIGENCE_SURFACE";

export interface AdaptiveVisualResult {
  tier: VisualTier;
  canonicalSpec: VisualSpec | null;
  ontologySpecs: VisualSpec[];
  surfaceSpecs: VisualSpec[];
  actionPlans: import("./visualContract").ActionPlan[];
}

/* ── Signal Strength Scoring ── */

function countMeaningfulNodes(nodes: VisualNode[]): number {
  return nodes.filter(n =>
    n.label &&
    n.label.length > 3 &&
    !n.label.toLowerCase().includes("unknown")
  ).length;
}

function scoreStructuralStrength(nodes: VisualNode[], edges: VisualEdge[]): number {
  let score = 0;
  if (countMeaningfulNodes(nodes) >= 3) score += 1;
  if (edges && edges.length > 0) score += 2;
  if (nodes.some(n => resolveRole(n) === "system")) score += 1;
  if (nodes.some(n => resolveRole(n) === "leverage")) score += 1;
  return score; // max 5
}

/* ── Tier Decision ── */

function determineVisualTier(
  canonical: VisualSpec | null,
  ontologySpecs: VisualSpec[]
): VisualTier {
  if (canonical) {
    const strength = scoreStructuralStrength(canonical.nodes, canonical.edges);
    if (strength >= 3) return "STRUCTURAL_MODEL";
  }
  if (ontologySpecs.length > 0) return "INSIGHT_MAP";
  return "INTELLIGENCE_SURFACE";
}

/* ── Fallback: extract top insights from any analysis ── */

function extractTopInsights(data: Record<string, unknown>): string[] {
  const candidates: string[] = [];
  const insightKeys = [
    "keyInsight", "tagline", "verdict", "coreProblem", "problemStatement",
    "recommendation", "coreStrategy", "impact", "completionMessage",
    "primaryFriction", "mechanism", "leveragePoint",
  ];
  for (const k of insightKeys) {
    const v = data[k];
    if (typeof v === "string" && v.trim().length > 5) candidates.push(v.trim());
  }
  const arrayKeys = [
    "factors", "marketForces", "vulnerabilities", "blindSpots",
    "hiddenStrengths", "recommendations", "strategicRecommendations",
  ];
  for (const k of arrayKeys) {
    const v = data[k];
    if (Array.isArray(v)) {
      for (const item of v) {
        if (typeof item === "string" && item.trim().length > 5) candidates.push(item.trim());
      }
    }
  }
  return candidates.slice(0, 6);
}

/* ── Fallback Builders ── */

function buildInsightMap(data: Record<string, unknown>): VisualSpec | null {
  const insights = extractTopInsights(data);
  if (insights.length < 2) return null;

  const nodes: VisualNode[] = insights.map((text, i) => ({
    id: `insight_${i}`,
    label: text,
    role: i === 0 ? "system" as const : "force" as const,
    priority: (i === 0 ? 1 : 2) as 1 | 2,
    certainty: "modeled" as const,
  }));

  const edges: VisualEdge[] = insights.slice(1).map((_, i) => ({
    from: `insight_${i + 1}`,
    to: "insight_0",
    relationship: "relates to",
    relationship_type: "causal" as const,
  }));

  return {
    visual_type: "system_model",
    title: "Insight Landscape",
    nodes,
    edges,
    structurally_grounded: false,
    version: 1,
    interpretation: "Key intelligence signals detected from analysis.",
  };
}

/**
 * §9 VISUAL TRUTHFULNESS: buildIntelligenceSurface is SUPPRESSED when governed data exists.
 * This function only runs as a last-resort for legacy analyses without governed artifacts.
 * It is explicitly blocked from producing visuals from object key names.
 */
function buildIntelligenceSurface(_data: Record<string, unknown>): VisualSpec | null {
  // §9: Suppress key-name-based visual generation entirely.
  // Visuals must derive from governed causal structure.
  // If we reach this point, it means no governed data and no insights — return null.
  return null;
}

/* ── Action Plan Extraction (from visualContract) ── */

function extractActionPlans(data: Record<string, unknown>): import("./visualContract").ActionPlan[] {
  const existing = (data.v3ActionPlans || data.actionPlans) as import("./visualContract").ActionPlan[] | undefined;
  if (Array.isArray(existing) && existing.length > 0) return existing;

  const recs: string[] = [];
  for (const k of ["recommendations", "strategicRecommendations", "keyChanges"]) {
    const v = data[k];
    if (Array.isArray(v)) {
      for (const item of v) {
        if (typeof item === "string" && item.trim()) recs.push(item.trim());
      }
    }
  }

  if (recs.length > 0) {
    return recs.slice(0, 2).map(r => ({
      initiative: r,
      objective: "Improve system performance by addressing identified constraint",
      leverage_type: "structural_improvement" as const,
      mechanism: r,
      complexity: "medium" as const,
      time_horizon: "near_term" as const,
      confidence: "medium" as const,
    }));
  }

  return [];
}

/* ── Public Engine ── */

export function resolveAdaptiveVisuals(data: Record<string, unknown>): AdaptiveVisualResult {
  const canonical = resolveCanonicalVisualModel(data);
  const signals = detectSignals(data);
  const rawOntology = signals.length > 0 ? deriveAllOntologySpecs(data, signals) : [];
  const ontologySpecs = rawOntology.filter(s => isStructurallyMeaningful(s.nodes, s.edges));

  const tier = determineVisualTier(canonical, ontologySpecs);
  const actionPlans = extractActionPlans(data);

  // Tier 1: full structural model + ontology panels
  if (tier === "STRUCTURAL_MODEL" && canonical) {
    return {
      tier,
      canonicalSpec: canonical,
      ontologySpecs,
      surfaceSpecs: [],
      actionPlans,
    };
  }

  // Tier 2: ontology panels (or insight map fallback)
  if (tier === "INSIGHT_MAP") {
    const specs = ontologySpecs.length > 0 ? ontologySpecs : [];
    const fallback = specs.length === 0 ? buildInsightMap(data) : null;
    return {
      tier,
      canonicalSpec: canonical && isStructurallyMeaningful(canonical.nodes, canonical.edges) ? canonical : null,
      ontologySpecs: specs,
      surfaceSpecs: fallback ? [fallback] : [],
      actionPlans,
    };
  }

  // Tier 3: intelligence surface
  const surface = buildIntelligenceSurface(data);
  const insightFallback = !surface ? buildInsightMap(data) : null;
  return {
    tier,
    canonicalSpec: null,
    ontologySpecs: [],
    surfaceSpecs: surface ? [surface] : insightFallback ? [insightFallback] : [],
    actionPlans,
  };
}
