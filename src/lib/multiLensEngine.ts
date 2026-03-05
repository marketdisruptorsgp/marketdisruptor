/**
 * MULTI-LENS ANALYSIS ENGINE
 * 
 * Each lens (Product, Service, Business Model) runs its own pipeline.
 * Outputs are stored separately per lens but mapped to a shared structural schema.
 * A merge layer aggregates outputs into a unified insight layer.
 */

export type LensType = "product" | "service" | "business";

export interface LensLeverageScore {
  lens: LensType;
  score: number; // 0-10
  rationale: string;
}

export interface LeverageNode {
  id: string;
  label: string;
  type: "constraint" | "leverage" | "opportunity";
  layer: 1 | 2 | 3; // 1=structural constraints, 2=leverage points, 3=opportunities
  impact: number; // 1-10
  confidence: "high" | "medium" | "low";
  lensScores: LensLeverageScore[];
  convergenceCount: number; // how many lenses score this ≥ 6
  isConvergenceZone: boolean;
  evidence: string[];
  attributes?: string;
}

export interface LeverageEdge {
  from: string;
  to: string;
  relationship: string;
  strength: number; // 0-1
}

export interface SystemLeverageMap {
  nodes: LeverageNode[];
  edges: LeverageEdge[];
  convergenceZones: string[]; // node IDs where multiple lenses converge
  dominantLens: LensType;
  structuralSummary: string;
}

export interface LensOutput {
  lens: LensType;
  constraints: { id: string; label: string; impact: number; evidence: string[] }[];
  leveragePoints: { id: string; label: string; mechanism: string; impactMultiplier: number }[];
  opportunities: { id: string; label: string; description: string; confidence: number }[];
}

const LENS_COLORS: Record<LensType, string> = {
  product: "229 89% 63%",   // blue
  service: "271 82% 55%",   // purple  
  business: "152 60% 44%",  // green
};

export function getLensColor(lens: LensType): string {
  return LENS_COLORS[lens];
}

/**
 * Build a System Leverage Map from governed data artifacts.
 * Extracts constraints (Layer 1), leverage points (Layer 2), and opportunities (Layer 3).
 */
export function buildSystemLeverageMap(
  governedData: Record<string, unknown> | null,
  analysisData: Record<string, unknown> | null,
  flipIdeas: unknown[] | null,
  activeLenses: LensType[] = ["product"],
): SystemLeverageMap | null {
  if (!governedData) return null;

  const nodes: LeverageNode[] = [];
  const edges: LeverageEdge[] = [];

  // ── Layer 1: Structural Constraints from constraint_map.causal_chains ──
  const constraintMap = governedData.constraint_map as Record<string, unknown> | undefined;
  const causalChains = (constraintMap?.causal_chains || governedData.causal_chains) as any[] | undefined;
  const bindingId = constraintMap?.binding_constraint_id as string | undefined;

  // Extract unique constraint nodes from causal chains
  const seenIds = new Set<string>();
  
  if (causalChains && Array.isArray(causalChains)) {
    for (const chain of causalChains) {
      const fromId = `c_${sanitizeId(chain.from || chain.structural_constraint || "")}`;
      const toId = `c_${sanitizeId(chain.to || chain.system_impact || "")}`;
      const fromLabel = humanize(chain.from || chain.structural_constraint || "");
      const toLabel = humanize(chain.to || chain.system_impact || "");

      if (fromLabel && !seenIds.has(fromId)) {
        seenIds.add(fromId);
        const isBinding = bindingId && (chain.from === bindingId || chain.structural_constraint === bindingId);
        nodes.push({
          id: fromId,
          label: truncate(fromLabel, 8),
          type: "constraint",
          layer: 1,
          impact: isBinding ? 10 : chain.strength || 7,
          confidence: isBinding ? "high" : "medium",
          lensScores: generateLensScores(activeLenses, chain, "constraint"),
          convergenceCount: 0,
          isConvergenceZone: false,
          evidence: [fromLabel],
          attributes: chain.impact_dimension || undefined,
        });
      }

      if (toLabel && !seenIds.has(toId)) {
        seenIds.add(toId);
        nodes.push({
          id: toId,
          label: truncate(toLabel, 8),
          type: "constraint",
          layer: 1,
          impact: chain.strength || 5,
          confidence: "medium",
          lensScores: generateLensScores(activeLenses, chain, "constraint"),
          convergenceCount: 0,
          isConvergenceZone: false,
          evidence: [toLabel],
        });
      }

      if (fromLabel && toLabel) {
        edges.push({
          from: fromId,
          to: toId,
          relationship: chain.relationship || "causes",
          strength: (chain.strength || 5) / 10,
        });
      }
    }
  }

  // Fallback: extract binding constraint directly
  if (nodes.length === 0 && constraintMap) {
    const binding = constraintMap.binding_constraint || constraintMap.binding_constraint_id;
    if (binding) {
      const id = `c_binding`;
      nodes.push({
        id,
        label: truncate(humanize(binding), 8),
        type: "constraint",
        layer: 1,
        impact: 10,
        confidence: "high",
        lensScores: generateLensScores(activeLenses, {}, "constraint"),
        convergenceCount: 0,
        isConvergenceZone: false,
        evidence: [humanize(binding)],
      });
      seenIds.add(id);
    }
  }

  // ── Layer 2: Leverage Points from leverage_map ──
  const leverageMap = governedData.leverage_map as Record<string, unknown> | any[] | undefined;
  const leverageItems = Array.isArray(leverageMap) ? leverageMap : leverageMap ? [leverageMap] : [];

  for (const lev of leverageItems) {
    const label = humanize(lev.lever_id || lev.highest_leverage_point || lev.lever || lev.label || "");
    if (!label) continue;
    const id = `l_${sanitizeId(label)}`;
    if (seenIds.has(id)) continue;
    seenIds.add(id);

    const lensScores = lev.lens_scores
      ? parseLensScores(lev.lens_scores, activeLenses)
      : generateLensScores(activeLenses, lev, "leverage");

    const convergenceCount = lensScores.filter(ls => ls.score >= 6).length;

    nodes.push({
      id,
      label: truncate(label, 8),
      type: "leverage",
      layer: 2,
      impact: lev.impact_multiplier || lev.impact || 8,
      confidence: convergenceCount >= 2 ? "high" : "medium",
      lensScores,
      convergenceCount,
      isConvergenceZone: convergenceCount >= 2,
      evidence: [lev.mechanism || lev.description || label],
      attributes: lev.mechanism || undefined,
    });

    // Connect leverage to its target constraint
    const targetConstraint = lev.target_constraint_id || lev.target_constraint;
    if (targetConstraint) {
      const targetId = `c_${sanitizeId(targetConstraint)}`;
      if (seenIds.has(targetId)) {
        edges.push({ from: id, to: targetId, relationship: "intervenes at", strength: 0.8 });
      }
    } else {
      // Connect to first constraint as default
      const firstConstraint = nodes.find(n => n.type === "constraint");
      if (firstConstraint) {
        edges.push({ from: id, to: firstConstraint.id, relationship: "addresses", strength: 0.6 });
      }
    }
  }

  // ── Layer 3: Strategic Opportunities from flip ideas / innovation engine ──
  const flipData = flipIdeas || [];
  const ideas = Array.isArray(flipData) ? flipData : [];
  
  for (const idea of ideas.slice(0, 5)) {
    const ideaObj = idea as Record<string, unknown>;
    const label = humanize(ideaObj.name || ideaObj.title || ideaObj.conceptName || "");
    if (!label) continue;
    const id = `o_${sanitizeId(label)}`;
    if (seenIds.has(id)) continue;
    seenIds.add(id);

    nodes.push({
      id,
      label: truncate(label, 8),
      type: "opportunity",
      layer: 3,
      impact: (ideaObj.viabilityScore as number) || 7,
      confidence: "medium",
      lensScores: generateLensScores(activeLenses, ideaObj, "opportunity"),
      convergenceCount: 0,
      isConvergenceZone: false,
      evidence: [ideaObj.description as string || ideaObj.tagline as string || label],
      attributes: ideaObj.tagline as string || undefined,
    });

    // Connect opportunity to nearest leverage point
    const nearestLeverage = nodes.find(n => n.type === "leverage");
    if (nearestLeverage) {
      edges.push({ from: nearestLeverage.id, to: id, relationship: "enables", strength: 0.7 });
    }
  }

  // ── Innovation engine opportunities ──
  const innovationData = analysisData?.innovationOpportunities as Record<string, unknown[]> | undefined;
  if (innovationData) {
    const allOpps = Object.values(innovationData).flat().slice(0, 3);
    for (const opp of allOpps) {
      const oppObj = opp as Record<string, unknown>;
      const label = humanize(oppObj.title || "");
      if (!label) continue;
      const id = `o_inn_${sanitizeId(label)}`;
      if (seenIds.has(id)) continue;
      seenIds.add(id);

      nodes.push({
        id,
        label: truncate(label, 8),
        type: "opportunity",
        layer: 3,
        impact: oppObj.impactPotential === "high" ? 9 : oppObj.impactPotential === "medium" ? 6 : 4,
        confidence: (oppObj.confidence as number) > 0.7 ? "high" : "medium",
        lensScores: generateLensScores(activeLenses, oppObj, "opportunity"),
        convergenceCount: 0,
        isConvergenceZone: false,
        evidence: oppObj.supportingEvidence as string[] || [label],
      });
    }
  }

  // ── Compute convergence ──
  const convergenceZones: string[] = [];
  for (const node of nodes) {
    node.convergenceCount = node.lensScores.filter(ls => ls.score >= 6).length;
    node.isConvergenceZone = node.convergenceCount >= 2;
    if (node.isConvergenceZone) convergenceZones.push(node.id);
  }

  if (nodes.length < 2) return null;

  // Determine dominant lens
  const lensImpact: Record<LensType, number> = { product: 0, service: 0, business: 0 };
  for (const node of nodes) {
    for (const ls of node.lensScores) {
      lensImpact[ls.lens] += ls.score * node.impact;
    }
  }
  const dominantLens = (Object.entries(lensImpact).sort(([,a],[,b]) => b - a)[0]?.[0] || "product") as LensType;

  return {
    nodes,
    edges,
    convergenceZones,
    dominantLens,
    structuralSummary: `${nodes.filter(n => n.type === "constraint").length} constraints → ${nodes.filter(n => n.type === "leverage").length} leverage points → ${nodes.filter(n => n.type === "opportunity").length} opportunities`,
  };
}

// ── Helpers ──

function sanitizeId(s: unknown): string {
  return String(s || "unknown").replace(/[^a-zA-Z0-9]/g, "_").slice(0, 30).toLowerCase();
}

function humanize(raw: unknown): string {
  if (!raw) return "";
  if (typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    return String(obj.description || obj.label || obj.text || obj.name || "");
  }
  const s = String(raw);
  if (/^[A-Z]_[A-Z_]+$/.test(s)) {
    return s.replace(/^[A-Z]_/, "").split("_").map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(" ");
  }
  return s;
}

function truncate(s: string, maxWords: number): string {
  const words = s.split(/\s+/);
  return words.length <= maxWords ? s : words.slice(0, maxWords).join(" ");
}

function generateLensScores(
  activeLenses: LensType[],
  data: Record<string, unknown>,
  nodeType: "constraint" | "leverage" | "opportunity",
): LensLeverageScore[] {
  return activeLenses.map(lens => {
    // Heuristic scoring based on lens relevance
    let base = 5;
    if (nodeType === "constraint") base = lens === "product" ? 7 : lens === "service" ? 6 : 5;
    if (nodeType === "leverage") base = 7;
    if (nodeType === "opportunity") base = lens === "business" ? 8 : 6;
    
    // Add variance based on data presence
    const variance = (data && Object.keys(data).length > 3) ? 1 : -1;
    
    return {
      lens,
      score: Math.min(10, Math.max(1, base + variance)),
      rationale: `${lens} lens: ${nodeType} relevance`,
    };
  });
}

function parseLensScores(raw: unknown, activeLenses: LensType[]): LensLeverageScore[] {
  if (!raw || typeof raw !== "object") return generateLensScores(activeLenses, {}, "leverage");
  const obj = raw as Record<string, unknown>;
  return activeLenses.map(lens => ({
    lens,
    score: Number(obj[lens] || 5),
    rationale: `${lens} lens score`,
  }));
}
