/**
 * MULTI-LENS ANALYSIS ENGINE
 * 
 * Architecture:
 *   SHARED STRUCTURAL MODEL (constraint_map, causal_chains)
 *     ↓
 *   SYSTEM CONSTRAINT MAP (binding constraints, frictions)
 *     ↓
 *   LENS INTERPRETATION LAYER (product/service/business scoring)
 *     ↓
 *   LEVERAGE MAP (per-lens weighted leverage points)
 *     ↓
 *   OPPORTUNITY ENGINE (flip ideas, innovation, convergence)
 *
 * The structural model is shared across all lenses.
 * Lenses do NOT re-run analysis — they reinterpret the same structural data
 * through domain-specific scoring derived from real analysis artifacts.
 */

export type LensType = "product" | "service" | "business";

export interface LensLeverageScore {
  lens: LensType;
  score: number; // 0-10
  rationale: string;
  derivedFrom: "artifact" | "heuristic"; // provenance tag
}

export interface LeverageNode {
  id: string;
  label: string;
  type: "constraint" | "leverage" | "opportunity";
  layer: 1 | 2 | 3;
  impact: number; // 1-10
  confidence: "high" | "medium" | "low";
  lensScores: LensLeverageScore[];
  convergenceCount: number;
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
  convergenceZones: string[];
  dominantLens: LensType;
  structuralSummary: string;
  provenanceReport: { artifactScored: number; heuristicScored: number };
}

export interface LensArtifacts {
  product?: ProductLensArtifacts;
  service?: ServiceLensArtifacts;
  business?: BusinessLensArtifacts;
}

export interface ProductLensArtifacts {
  coreReality?: { trueProblem?: string; normalizedFrustrations?: string[] };
  frictionDimensions?: Record<string, unknown>;
  userWorkflow?: { frictionPoints?: { friction: string; severity: string }[] };
  hiddenAssumptions?: { assumption: string; leverageScore?: number; reason?: string }[];
  smartTechAnalysis?: Record<string, unknown>;
}

export interface ServiceLensArtifacts {
  operationalAudit?: {
    customerJourney?: string[];
    frictionPoints?: { point: string; impact: string }[];
    costStructure?: Record<string, unknown>;
  };
  workflowBottlenecks?: unknown[];
  communityIntel?: Record<string, unknown>;
}

export interface BusinessLensArtifacts {
  revenueReinvention?: {
    currentRevenueMix?: string;
    untappedStreams?: { stream: string; potential: string }[];
  };
  pricingIntel?: Record<string, unknown>;
  dealEconomics?: { sde?: number; purchasePrice?: number; dscr?: number };
  stagnationDiagnostic?: { causes?: { cause: string; reversibility: number }[] };
}

const LENS_COLORS: Record<LensType, string> = {
  product: "229 89% 63%",
  service: "271 82% 55%",
  business: "152 60% 44%",
};

export function getLensColor(lens: LensType): string {
  return LENS_COLORS[lens];
}

// ═══════════════════════════════════════════════════════════════
//  LENS INTERPRETATION LAYER
//  Scores each node per-lens using real analysis artifacts.
//  Falls back to heuristic only when artifacts are absent.
// ═══════════════════════════════════════════════════════════════

interface LensInterpreter {
  score(nodeLabel: string, nodeType: "constraint" | "leverage" | "opportunity", evidence: string[]): LensLeverageScore;
}

function buildProductInterpreter(artifacts?: ProductLensArtifacts): LensInterpreter {
  const frustrations = new Set(
    (artifacts?.coreReality?.normalizedFrustrations || []).map(f => f.toLowerCase())
  );
  const frictionKeywords = (artifacts?.userWorkflow?.frictionPoints || [])
    .map(fp => fp.friction.toLowerCase());
  const assumptions = (artifacts?.hiddenAssumptions || [])
    .filter(a => (a.leverageScore || 0) >= 5)
    .map(a => a.assumption.toLowerCase());
  const hasArtifacts = frustrations.size > 0 || frictionKeywords.length > 0 || assumptions.length > 0;

  return {
    score(nodeLabel, nodeType, evidence) {
      if (!hasArtifacts) {
        return heuristicScore("product", nodeType);
      }
      const text = [nodeLabel, ...evidence].join(" ").toLowerCase();
      let score = 4;
      let rationale = "";

      // Does this node relate to known product frustrations?
      for (const f of frustrations) {
        if (text.includes(f.slice(0, 15)) || f.includes(text.slice(0, 15))) {
          score += 2;
          rationale = `Matches product frustration: "${f.slice(0, 40)}"`;
          break;
        }
      }

      // Friction match
      for (const fk of frictionKeywords) {
        if (text.includes(fk.slice(0, 15)) || fk.includes(text.slice(0, 15))) {
          score += 2;
          rationale = rationale || `Matches workflow friction`;
          break;
        }
      }

      // Assumption match (high leverage assumptions are product-critical)
      for (const a of assumptions) {
        if (text.includes(a.slice(0, 20)) || a.includes(text.slice(0, 20))) {
          score += 1;
          rationale = rationale || `Aligns with challengeable assumption`;
          break;
        }
      }

      // Constraints are inherently product-relevant
      if (nodeType === "constraint") score += 1;

      return {
        lens: "product",
        score: clamp(score, 1, 10),
        rationale: rationale || "Product relevance assessed from decomposition artifacts",
        derivedFrom: "artifact",
      };
    },
  };
}

function buildServiceInterpreter(artifacts?: ServiceLensArtifacts): LensInterpreter {
  const journeySteps = (artifacts?.operationalAudit?.customerJourney || []).map(s => s.toLowerCase());
  const frictionPoints = (artifacts?.operationalAudit?.frictionPoints || [])
    .map(fp => (typeof fp === "object" ? (fp as any).point || (fp as any).friction || "" : String(fp)).toLowerCase());
  const hasArtifacts = journeySteps.length > 0 || frictionPoints.length > 0;

  const serviceKeywords = [
    "delivery", "onboarding", "support", "workflow", "service", "experience",
    "touchpoint", "wait", "queue", "response", "satisfaction", "retention",
    "churn", "handoff", "process", "scheduling", "booking", "fulfillment",
  ];

  return {
    score(nodeLabel, nodeType, evidence) {
      if (!hasArtifacts) {
        return heuristicScore("service", nodeType);
      }
      const text = [nodeLabel, ...evidence].join(" ").toLowerCase();
      let score = 3;
      let rationale = "";

      // Service keyword resonance
      const keywordHits = serviceKeywords.filter(kw => text.includes(kw)).length;
      if (keywordHits > 0) {
        score += Math.min(keywordHits, 3);
        rationale = `Service-relevant keywords detected`;
      }

      // Journey step match
      for (const step of journeySteps) {
        if (text.includes(step.slice(0, 12))) {
          score += 2;
          rationale = `Matches customer journey step`;
          break;
        }
      }

      // Friction match
      for (const fp of frictionPoints) {
        if (text.includes(fp.slice(0, 12)) || fp.includes(text.slice(0, 12))) {
          score += 2;
          rationale = rationale || `Matches operational friction point`;
          break;
        }
      }

      return {
        lens: "service",
        score: clamp(score, 1, 10),
        rationale: rationale || "Service relevance assessed from operational artifacts",
        derivedFrom: "artifact",
      };
    },
  };
}

function buildBusinessInterpreter(artifacts?: BusinessLensArtifacts): LensInterpreter {
  const hasRevenue = !!(artifacts?.revenueReinvention?.untappedStreams?.length);
  const hasPricing = !!artifacts?.pricingIntel;
  const hasDeal = !!artifacts?.dealEconomics;
  const stagnation = artifacts?.stagnationDiagnostic?.causes || [];
  const hasArtifacts = hasRevenue || hasPricing || hasDeal || stagnation.length > 0;

  const businessKeywords = [
    "revenue", "pricing", "margin", "cost", "profit", "monetiz", "subscription",
    "acquisition", "valuation", "market share", "competitive", "unit economics",
    "cac", "ltv", "arpu", "churn", "scale", "growth", "roi", "capital",
  ];

  return {
    score(nodeLabel, nodeType, evidence) {
      if (!hasArtifacts) {
        return heuristicScore("business", nodeType);
      }
      const text = [nodeLabel, ...evidence].join(" ").toLowerCase();
      let score = 3;
      let rationale = "";

      // Business keyword resonance
      const keywordHits = businessKeywords.filter(kw => text.includes(kw)).length;
      if (keywordHits > 0) {
        score += Math.min(keywordHits * 1.5, 4);
        rationale = `Business-model keywords detected`;
      }

      // Revenue opportunity match
      if (hasRevenue) {
        const streams = artifacts!.revenueReinvention!.untappedStreams || [];
        for (const s of streams) {
          if (text.includes((s.stream || "").toLowerCase().slice(0, 12))) {
            score += 2;
            rationale = `Aligns with untapped revenue stream`;
            break;
          }
        }
      }

      // Stagnation cause match
      for (const cause of stagnation) {
        if (text.includes((cause.cause || "").toLowerCase().slice(0, 12))) {
          score += 1;
          rationale = rationale || `Relates to stagnation cause (reversibility: ${cause.reversibility})`;
          break;
        }
      }

      // Opportunities inherently more business-relevant
      if (nodeType === "opportunity") score += 1;

      return {
        lens: "business",
        score: clamp(score, 1, 10),
        rationale: rationale || "Business relevance assessed from economic artifacts",
        derivedFrom: "artifact",
      };
    },
  };
}

function heuristicScore(lens: LensType, nodeType: "constraint" | "leverage" | "opportunity"): LensLeverageScore {
  const base: Record<LensType, Record<string, number>> = {
    product:  { constraint: 6, leverage: 6, opportunity: 5 },
    service:  { constraint: 5, leverage: 5, opportunity: 5 },
    business: { constraint: 4, leverage: 5, opportunity: 7 },
  };
  return {
    lens,
    score: base[lens][nodeType] || 5,
    rationale: `Heuristic: no ${lens} artifacts available`,
    derivedFrom: "heuristic",
  };
}

// ═══════════════════════════════════════════════════════════════
//  SHARED STRUCTURAL MODEL EXTRACTION
//  Builds the constraint graph from governed data — lens-agnostic
// ═══════════════════════════════════════════════════════════════

interface StructuralNode {
  id: string;
  label: string;
  type: "constraint" | "leverage" | "opportunity";
  layer: 1 | 2 | 3;
  impact: number;
  confidence: "high" | "medium" | "low";
  evidence: string[];
  attributes?: string;
}

interface StructuralModel {
  nodes: StructuralNode[];
  edges: LeverageEdge[];
}

function extractStructuralModel(
  governedData: Record<string, unknown>,
  analysisData: Record<string, unknown> | null,
  flipIdeas: unknown[] | null,
): StructuralModel {
  const nodes: StructuralNode[] = [];
  const edges: LeverageEdge[] = [];
  const seenIds = new Set<string>();

  // ── Layer 1: Constraints from constraint_map.causal_chains ──
  const constraintMap = governedData.constraint_map as Record<string, unknown> | undefined;
  const causalChains = (constraintMap?.causal_chains || governedData.causal_chains) as any[] | undefined;
  const bindingId = constraintMap?.binding_constraint_id as string | undefined;

  if (causalChains && Array.isArray(causalChains)) {
    for (const chain of causalChains) {
      const fromLabel = humanize(chain.from || chain.structural_constraint || "");
      const toLabel = humanize(chain.to || chain.system_impact || "");
      const fromId = `c_${sanitizeId(fromLabel)}`;
      const toId = `c_${sanitizeId(toLabel)}`;

      if (fromLabel && !seenIds.has(fromId)) {
        seenIds.add(fromId);
        const isBinding = bindingId && (chain.from === bindingId || chain.structural_constraint === bindingId);
        nodes.push({
          id: fromId, label: truncate(fromLabel, 8), type: "constraint", layer: 1,
          impact: isBinding ? 10 : chain.strength || 7,
          confidence: isBinding ? "high" : "medium",
          evidence: [fromLabel],
          attributes: chain.impact_dimension || undefined,
        });
      }

      if (toLabel && !seenIds.has(toId)) {
        seenIds.add(toId);
        nodes.push({
          id: toId, label: truncate(toLabel, 8), type: "constraint", layer: 1,
          impact: chain.strength || 5, confidence: "medium",
          evidence: [toLabel],
        });
      }

      if (fromLabel && toLabel) {
        edges.push({ from: fromId, to: toId, relationship: chain.relationship || "causes", strength: (chain.strength || 5) / 10 });
      }
    }
  }

  // Fallback: binding constraint directly
  if (nodes.length === 0 && constraintMap) {
    const binding = constraintMap.binding_constraint || constraintMap.binding_constraint_id;
    if (binding) {
      const id = "c_binding";
      seenIds.add(id);
      nodes.push({
        id, label: truncate(humanize(binding), 8), type: "constraint", layer: 1,
        impact: 10, confidence: "high", evidence: [humanize(binding)],
      });
    }
  }

  // Also extract from friction_tiers
  const frictionTiers = governedData.friction_tiers as Record<string, unknown> | undefined;
  if (frictionTiers) {
    const tier1 = frictionTiers.tier_1 as any[] | any | undefined;
    const items = Array.isArray(tier1) ? tier1 : tier1 ? [tier1] : [];
    for (const item of items.slice(0, 3)) {
      const label = humanize(item.description || item.root_cause || item.friction_id || "");
      if (!label) continue;
      const id = `c_fr_${sanitizeId(label)}`;
      if (seenIds.has(id)) continue;
      seenIds.add(id);
      nodes.push({
        id, label: truncate(label, 8), type: "constraint", layer: 1,
        impact: 6, confidence: "medium", evidence: [label],
      });
      // Connect to binding if exists
      const bindingNode = nodes.find(n => n.id === "c_binding" || n.impact === 10);
      if (bindingNode) {
        edges.push({ from: bindingNode.id, to: id, relationship: "drives", strength: 0.5 });
      }
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

    nodes.push({
      id, label: truncate(label, 8), type: "leverage", layer: 2,
      impact: lev.impact_multiplier || lev.impact || 8,
      confidence: "medium",
      evidence: [lev.mechanism || lev.description || label],
      attributes: lev.mechanism || undefined,
    });

    // Connect to target constraint
    const target = lev.target_constraint_id || lev.target_constraint;
    if (target) {
      const targetId = `c_${sanitizeId(target)}`;
      if (seenIds.has(targetId)) {
        edges.push({ from: id, to: targetId, relationship: "intervenes at", strength: 0.8 });
      }
    } else {
      const firstConstraint = nodes.find(n => n.type === "constraint");
      if (firstConstraint) {
        edges.push({ from: id, to: firstConstraint.id, relationship: "addresses", strength: 0.6 });
      }
    }
  }

  // ── Layer 3: Opportunities (flip ideas + innovation engine) ──
  const ideas = Array.isArray(flipIdeas) ? flipIdeas : [];
  for (const idea of ideas.slice(0, 5)) {
    const obj = idea as Record<string, unknown>;
    const label = humanize(obj.name || obj.title || obj.conceptName || "");
    if (!label) continue;
    const id = `o_${sanitizeId(label)}`;
    if (seenIds.has(id)) continue;
    seenIds.add(id);
    nodes.push({
      id, label: truncate(label, 8), type: "opportunity", layer: 3,
      impact: (obj.viabilityScore as number) || 7, confidence: "medium",
      evidence: [obj.description as string || obj.tagline as string || label],
      attributes: obj.tagline as string || undefined,
    });
    const nearestLev = nodes.find(n => n.type === "leverage");
    if (nearestLev) {
      edges.push({ from: nearestLev.id, to: id, relationship: "enables", strength: 0.7 });
    }
  }

  // Innovation engine
  const innovationData = analysisData?.innovationOpportunities as Record<string, unknown[]> | undefined;
  if (innovationData) {
    for (const opp of Object.values(innovationData).flat().slice(0, 3)) {
      const obj = opp as Record<string, unknown>;
      const label = humanize(obj.title || "");
      if (!label) continue;
      const id = `o_inn_${sanitizeId(label)}`;
      if (seenIds.has(id)) continue;
      seenIds.add(id);
      nodes.push({
        id, label: truncate(label, 8), type: "opportunity", layer: 3,
        impact: obj.impactPotential === "high" ? 9 : obj.impactPotential === "medium" ? 6 : 4,
        confidence: (obj.confidence as number) > 0.7 ? "high" : "medium",
        evidence: (obj.supportingEvidence as string[]) || [label],
      });
    }
  }

  return { nodes, edges };
}

// ═══════════════════════════════════════════════════════════════
//  MAIN ENTRY — Build System Leverage Map
// ═══════════════════════════════════════════════════════════════

export function buildSystemLeverageMap(
  governedData: Record<string, unknown> | null,
  analysisData: Record<string, unknown> | null,
  flipIdeas: unknown[] | null,
  activeLenses: LensType[] = ["product"],
  lensArtifacts?: LensArtifacts,
): SystemLeverageMap | null {
  if (!governedData) return null;

  // Step 1: Extract shared structural model (lens-agnostic)
  const structural = extractStructuralModel(governedData, analysisData, flipIdeas);
  if (structural.nodes.length < 2) return null;

  // Step 2: Build lens interpreters from real artifacts
  const interpreters: Record<LensType, LensInterpreter> = {
    product: buildProductInterpreter(lensArtifacts?.product),
    service: buildServiceInterpreter(lensArtifacts?.service),
    business: buildBusinessInterpreter(lensArtifacts?.business),
  };

  // Step 3: Apply lens interpretation to each structural node
  let artifactScored = 0;
  let heuristicScored = 0;

  const nodes: LeverageNode[] = structural.nodes.map(sn => {
    const lensScores: LensLeverageScore[] = activeLenses.map(lens => {
      const result = interpreters[lens].score(sn.label, sn.type, sn.evidence);
      if (result.derivedFrom === "artifact") artifactScored++;
      else heuristicScored++;
      return result;
    });

    // Check for server-provided lens_scores (from edge functions)
    if (sn.type === "leverage") {
      const leverageMap = governedData!.leverage_map as Record<string, unknown> | any[] | undefined;
      const items = Array.isArray(leverageMap) ? leverageMap : leverageMap ? [leverageMap] : [];
      const match = items.find((l: any) => sanitizeId(humanize(l.lever_id || l.highest_leverage_point || l.lever || l.label || "")) === sn.id.replace("l_", ""));
      if (match?.lens_scores) {
        const parsed = parseLensScores(match.lens_scores, activeLenses);
        // Override with server-provided scores
        for (const ps of parsed) {
          const existing = lensScores.find(ls => ls.lens === ps.lens);
          if (existing) {
            existing.score = ps.score;
            existing.rationale = ps.rationale;
            existing.derivedFrom = "artifact";
          }
        }
      }
    }

    const convergenceCount = lensScores.filter(ls => ls.score >= 6).length;

    return {
      ...sn,
      lensScores,
      convergenceCount,
      isConvergenceZone: convergenceCount >= 2,
    };
  });

  // Step 4: Compute convergence zones
  const convergenceZones = nodes.filter(n => n.isConvergenceZone).map(n => n.id);

  // Step 5: Determine dominant lens
  const lensImpact: Record<LensType, number> = { product: 0, service: 0, business: 0 };
  for (const node of nodes) {
    for (const ls of node.lensScores) {
      lensImpact[ls.lens] += ls.score * node.impact;
    }
  }
  const dominantLens = (Object.entries(lensImpact).sort(([, a], [, b]) => b - a)[0]?.[0] || "product") as LensType;

  const constraintCount = nodes.filter(n => n.type === "constraint").length;
  const leverageCount = nodes.filter(n => n.type === "leverage").length;
  const oppCount = nodes.filter(n => n.type === "opportunity").length;

  return {
    nodes,
    edges: structural.edges,
    convergenceZones,
    dominantLens,
    structuralSummary: `${constraintCount} constraint${constraintCount !== 1 ? "s" : ""} → ${leverageCount} leverage point${leverageCount !== 1 ? "s" : ""} → ${oppCount} opportunit${oppCount !== 1 ? "ies" : "y"}`,
    provenanceReport: { artifactScored, heuristicScored },
  };
}

// ═══════════════════════════════════════════════════════════════
//  ARTIFACT EXTRACTION — Build LensArtifacts from analysis data
// ═══════════════════════════════════════════════════════════════

/**
 * Extract lens artifacts from available analysis data.
 * This bridges the gap between raw analysis outputs and the lens scoring engine.
 */
export function extractLensArtifacts(
  disruptData: Record<string, unknown> | null,
  businessData: Record<string, unknown> | null,
  intelData: Record<string, unknown> | null,
): LensArtifacts {
  const artifacts: LensArtifacts = {};

  // Product lens artifacts from disrupt/intel data
  if (disruptData || intelData) {
    const source = disruptData || intelData || {};
    artifacts.product = {
      coreReality: source.coreReality as ProductLensArtifacts["coreReality"],
      frictionDimensions: (source.frictionDimensions || source.physicalDimensions) as Record<string, unknown>,
      userWorkflow: source.userWorkflow as ProductLensArtifacts["userWorkflow"],
      hiddenAssumptions: source.hiddenAssumptions as ProductLensArtifacts["hiddenAssumptions"],
      smartTechAnalysis: source.smartTechAnalysis as Record<string, unknown>,
    };
  }

  // Service lens artifacts
  if (businessData || intelData) {
    const source = businessData || intelData || {};
    artifacts.service = {
      operationalAudit: (source as any).operationalAudit,
      workflowBottlenecks: (source as any).workflowBottlenecks,
      communityIntel: (source as any).communityIntel || (intelData as any)?.communitySentiment,
    };
  }

  // Business lens artifacts
  if (businessData) {
    artifacts.business = {
      revenueReinvention: (businessData as any).revenueReinvention,
      pricingIntel: (businessData as any).pricingIntel,
      dealEconomics: (businessData as any).dealEconomics,
      stagnationDiagnostic: (businessData as any).stagnationDiagnostic,
    };
  }

  return artifacts;
}

// ═══════════════════════════════════════════════════════════════
//  UTILITIES
// ═══════════════════════════════════════════════════════════════

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

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function parseLensScores(raw: unknown, activeLenses: LensType[]): LensLeverageScore[] {
  if (!raw || typeof raw !== "object") return [];
  const obj = raw as Record<string, unknown>;
  return activeLenses
    .filter(lens => obj[lens] !== undefined)
    .map(lens => ({
      lens,
      score: Number(obj[lens] || 5),
      rationale: `Server-provided ${lens} lens score`,
      derivedFrom: "artifact" as const,
    }));
}
