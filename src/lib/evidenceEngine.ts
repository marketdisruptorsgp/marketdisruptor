/**
 * EVIDENCE ENGINE — Canonical Intelligence Model
 *
 * ALL discovery signals across the platform originate as Evidence objects.
 * Evidence is the single source of truth for:
 *   • Command Deck metrics
 *   • Insight Graph nodes
 *   • Evidence Explorer
 *   • Tier Discovery
 *   • Opportunity generation
 *   • Confidence scoring
 *
 * Extended canonical fields:
 *   - mode (product | service | business_model)
 *   - lens (market | product | economics | operations | distribution)
 *   - archetype (operator | venture | bootstrap | enterprise | eta)
 *   - sourceEngine (pipeline | innovation | signal_detection | financial_model | competitor_scout | system_intelligence)
 *   - parentId / relatedEvidence for causal chains
 */

import { classifyTier } from "@/lib/tierDiscoveryEngine";

// ═══════════════════════════════════════════════════════════════
//  CANONICAL TYPES
// ═══════════════════════════════════════════════════════════════

export type EvidenceTier = "structural" | "system" | "optimization";

export type EvidenceType =
  | "signal"
  | "assumption"
  | "constraint"
  | "friction"
  | "opportunity"
  | "leverage"
  | "risk"
  | "competitor"
  | "simulation";

export type EvidenceMode = "product" | "service" | "business_model";

export type EvidenceLens = "market" | "product" | "economics" | "operations" | "distribution";

export type EvidenceArchetype = "operator" | "venture" | "bootstrap" | "enterprise" | "eta";

export type EvidencePipelineStep = "report" | "disrupt" | "redesign" | "stress_test" | "pitch" | "simulation";

export type EvidenceSourceEngine =
  | "pipeline"
  | "innovation"
  | "signal_detection"
  | "financial_model"
  | "competitor_scout"
  | "system_intelligence"
  | "scenario_engine";

export interface Evidence {
  id: string;
  type: EvidenceType;
  label: string;
  description?: string;
  pipelineStep: EvidencePipelineStep;
  tier: EvidenceTier;
  impact?: number;
  /** 0-1 confidence based on evidence density, cross-engine corroboration, pipeline diversity */
  confidenceScore?: number;
  /** IDs of related evidence items */
  relatedSignals?: string[];
  /** Semantic category (ownership, logistics, ux, etc.) */
  category?: string;
  /** Competitor analogs that validate this evidence */
  competitorReferences?: { name: string; modelType?: string }[];
  /** Analysis mode this evidence belongs to */
  mode?: EvidenceMode;
  /** Strategic lens this evidence was discovered through */
  lens?: EvidenceLens;
  /** Strategic archetype alignment */
  archetype?: EvidenceArchetype;
  /** Engine that produced this evidence */
  sourceEngine?: EvidenceSourceEngine;
  /** Parent evidence ID for causal chains */
  parentId?: string;
  /** Related evidence IDs for cross-referencing */
  relatedEvidence?: string[];
  /** How many engines independently produced this signal */
  sourceCount?: number;
  /** Lens-specific relevance scores */
  lensScores?: { operator?: number; investor?: number; innovator?: number; customer?: number };
  /** Archetype relevance scores */
  archetypeScores?: { operator?: number; eta?: number; rollup?: number; venture?: number; bootstrapped?: number };
}

export type MetricDomain = "opportunity" | "friction" | "constraint" | "leverage" | "risk";

export interface MetricEvidence {
  domain: MetricDomain;
  evidenceCount: number;
  items: Evidence[];
  tierBreakdown?: Record<EvidenceTier, number>;
  modeBreakdown?: Record<EvidenceMode, number>;
}

// ═══════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════

function safeArr(v: unknown): any[] {
  return Array.isArray(v) ? v : [];
}

let eid = 0;
function makeId(prefix: string): string {
  return `${prefix}-${++eid}`;
}

function autoTier(label: string, description?: string, fallback: EvidenceTier = "optimization"): EvidenceTier {
  const text = `${label} ${description || ""}`;
  const classified = classifyTier(text);
  return text.length > 5 ? classified : fallback;
}

/** Infer mode from analysis context */
function inferMode(analysisType?: string): EvidenceMode {
  if (!analysisType) return "product";
  const lower = analysisType.toLowerCase();
  if (lower.includes("service")) return "service";
  if (lower.includes("business")) return "business_model";
  return "product";
}

// ═══════════════════════════════════════════════════════════════
//  EXTRACTION FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function extractOpportunityEvidence(input: EvidenceInput): Evidence[] {
  const items: Evidence[] = [];
  const mode = inferMode(input.analysisType);

  const redesign = input.redesignData;
  if (redesign) {
    const concepts = safeArr(redesign.redesignedConcepts || redesign.concepts || redesign.opportunities);
    concepts.forEach((c: any, i: number) => {
      const label = c.name || c.label || c.title || `Redesign Concept ${i + 1}`;
      const desc = c.description || c.rationale;
      items.push({
        id: c.id || makeId("opp-redesign"),
        type: "opportunity",
        label,
        description: desc,
        pipelineStep: "redesign",
        tier: autoTier(label, desc, "structural"),
        impact: c.impact || c.score,
        category: c.category,
        mode,
        sourceEngine: "pipeline",
      });
    });
    safeArr(redesign.leveragePoints).forEach((lp: any, i: number) => {
      const label = typeof lp === "string" ? lp : (lp.label || lp.name || `Leverage Point ${i + 1}`);
      items.push({
        id: makeId("opp-lev"),
        type: "leverage",
        label,
        pipelineStep: "redesign",
        tier: autoTier(label, undefined, "system"),
        impact: lp.impact,
        mode,
        sourceEngine: "pipeline",
      });
    });
  }

  const disrupt = input.disruptData;
  if (disrupt) {
    safeArr(disrupt.flippedIdeas || disrupt.ideas).forEach((idea: any, i: number) => {
      const label = idea.name || idea.title || idea.label || `Flipped Idea ${i + 1}`;
      const desc = idea.description;
      const competitors = safeArr(idea.competitorReferences || idea.competitors || idea.analogs)
        .map((c: any) => ({ name: typeof c === "string" ? c : (c.name || c.company), modelType: c.modelType }))
        .filter((c: any) => c.name);
      items.push({
        id: idea.id || makeId("opp-flip"),
        type: "opportunity",
        label,
        description: desc,
        pipelineStep: "disrupt",
        tier: autoTier(label, desc, "structural"),
        impact: idea.impact || idea.score,
        category: idea.category || idea.structuralChangeType,
        competitorReferences: competitors.length > 0 ? competitors : undefined,
        mode,
        sourceEngine: "pipeline",
      });
    });
  }

  const product = input.selectedProduct;
  if (product) {
    const ci = product.communityInsights || product.customerSentiment || {};
    safeArr(ci.improvementRequests || ci.marketGaps).slice(0, 5).forEach((gap: any, i: number) => {
      const label = typeof gap === "string" ? gap : (gap.text || gap.label || `Market Gap ${i + 1}`);
      items.push({
        id: makeId("opp-gap"),
        type: "signal",
        label,
        pipelineStep: "report",
        tier: autoTier(label, undefined, "optimization"),
        mode,
        sourceEngine: "pipeline",
      });
    });
  }

  const si = input.intelligence;
  if (si) {
    safeArr(si.opportunities).forEach((o: any) => {
      if (!items.some(e => e.id === o.id)) {
        items.push({
          id: o.id,
          type: "opportunity",
          label: o.label,
          pipelineStep: "disrupt",
          tier: autoTier(o.label, undefined, "system"),
          impact: o.impact,
          mode,
          sourceEngine: "system_intelligence",
        });
      }
    });
  }

  return items;
}

function extractFrictionEvidence(input: EvidenceInput): Evidence[] {
  const items: Evidence[] = [];
  const mode = inferMode(input.analysisType);

  const product = input.selectedProduct;
  if (product) {
    const ci = product.communityInsights || product.customerSentiment || {};
    safeArr(ci.topComplaints).forEach((c: any, i: number) => {
      const label = typeof c === "string" ? c : (c.text || c.label || `Complaint ${i + 1}`);
      items.push({ id: makeId("fric-comp"), type: "friction", label, pipelineStep: "report", tier: autoTier(label, undefined, "optimization"), mode, sourceEngine: "pipeline" });
    });
    safeArr(ci.frictionPoints).forEach((f: any, i: number) => {
      const label = typeof f === "string" ? f : (f.text || f.label || `Friction ${i + 1}`);
      items.push({ id: makeId("fric-fp"), type: "friction", label, pipelineStep: "report", tier: autoTier(label, undefined, "system"), mode, sourceEngine: "pipeline" });
    });
  }

  const disrupt = input.disruptData;
  if (disrupt) {
    safeArr(disrupt.constraints || disrupt.structuralConstraints).forEach((c: any, i: number) => {
      const label = typeof c === "string" ? c : (c.name || c.label || `Constraint ${i + 1}`);
      items.push({
        id: makeId("fric-con"), type: "constraint", label, pipelineStep: "disrupt",
        tier: autoTier(label, undefined, "structural"), impact: c.impact || c.severity,
        mode, sourceEngine: "pipeline",
      });
    });
  }

  // ── Business Model: governed friction tiers ──
  const bizGov = input.businessAnalysisData?.governed;
  if (bizGov?.friction_tiers) {
    const ft = bizGov.friction_tiers;
    safeArr(ft.tier_1).forEach((f: any, i: number) => {
      const label = f.description || f.label || `Tier 1 Friction ${i + 1}`;
      const desc = f.system_impact || f.description;
      items.push({
        id: makeId("fric-bm-t1"), type: "friction", label, description: desc,
        pipelineStep: "report", tier: "structural", impact: 9, mode, sourceEngine: "pipeline",
        category: "operational_dependency",
      });
    });
    safeArr(ft.tier_2).forEach((f: any, i: number) => {
      const label = f.description || f.label || `Tier 2 Friction ${i + 1}`;
      const desc = f.optimization_target || f.description;
      items.push({
        id: makeId("fric-bm-t2"), type: "friction", label, description: desc,
        pipelineStep: "report", tier: "system", impact: 6, mode, sourceEngine: "pipeline",
        category: "operational_dependency",
      });
    });
    safeArr(ft.tier_3).forEach((f: any, i: number) => {
      const label = f.description || f.label || `Tier 3 Friction ${i + 1}`;
      items.push({
        id: makeId("fric-bm-t3"), type: "friction", label,
        pipelineStep: "report", tier: "optimization", impact: 3, mode, sourceEngine: "pipeline",
      });
    });
  }

  return items;
}

function extractConstraintEvidence(input: EvidenceInput): Evidence[] {
  const items: Evidence[] = [];
  const mode = inferMode(input.analysisType);

  const disrupt = input.disruptData;
  if (disrupt) {
    safeArr(disrupt.assumptions || disrupt.hiddenAssumptions).forEach((a: any, i: number) => {
      const label = typeof a === "string" ? a : (a.text || a.label || a.assumption || `Assumption ${i + 1}`);
      items.push({
        id: makeId("con-asm"), type: "assumption", label, pipelineStep: "disrupt",
        tier: autoTier(label, undefined, "structural"), category: a.category,
        mode, sourceEngine: "pipeline",
      });
    });
    safeArr(disrupt.structuralBlockers).forEach((b: any, i: number) => {
      const label = typeof b === "string" ? b : (b.name || b.label || `Blocker ${i + 1}`);
      items.push({ id: makeId("con-blk"), type: "constraint", label, pipelineStep: "disrupt", tier: "structural", mode, sourceEngine: "pipeline" });
    });
  }

  const governed = input.governedData;
  if (governed) {
    const synopsis = governed.reasoning_synopsis as any;
    if (synopsis?.key_assumptions) {
      safeArr(synopsis.key_assumptions).forEach((a: any, i: number) => {
        const label = typeof a === "string" ? a : (a.text || a.label || `Governed Assumption ${i + 1}`);
        if (!items.some(e => e.label === label)) {
          items.push({ id: makeId("con-gov"), type: "assumption", label, pipelineStep: "disrupt", tier: autoTier(label, undefined, "system"), mode, sourceEngine: "pipeline" });
        }
      });
    }
  }

  // Business model specific constraints
  const biz = input.businessAnalysisData;
  if (biz && mode === "business_model") {
    safeArr(biz.revenueRisks || biz.revenueModelAssumptions).forEach((r: any, i: number) => {
      const label = typeof r === "string" ? r : (r.label || r.name || `Revenue Assumption ${i + 1}`);
      items.push({
        id: makeId("con-rev"), type: "assumption", label, pipelineStep: "report",
        tier: "structural", mode, sourceEngine: "pipeline", category: "revenue_model",
      });
    });
    safeArr(biz.distributionConstraints || biz.channelBottlenecks).forEach((d: any, i: number) => {
      const label = typeof d === "string" ? d : (d.label || d.name || `Distribution Constraint ${i + 1}`);
      items.push({
        id: makeId("con-dist"), type: "constraint", label, pipelineStep: "report",
        tier: "structural", mode, sourceEngine: "pipeline", category: "distribution",
      });
    });
    safeArr(biz.costStructureRisks || biz.costInefficiencies).forEach((c: any, i: number) => {
      const label = typeof c === "string" ? c : (c.label || c.name || `Cost Structure Issue ${i + 1}`);
      items.push({
        id: makeId("con-cost"), type: "constraint", label, pipelineStep: "report",
        tier: "system", mode, sourceEngine: "pipeline", category: "cost_structure",
      });
    });
  }

  return items;
}

function extractLeverageEvidence(input: EvidenceInput): Evidence[] {
  const items: Evidence[] = [];
  const mode = inferMode(input.analysisType);

  const redesign = input.redesignData;
  if (redesign) {
    safeArr(redesign.leveragePoints).forEach((lp: any, i: number) => {
      const label = typeof lp === "string" ? lp : (lp.label || lp.name || `Leverage ${i + 1}`);
      items.push({ id: makeId("lev-pt"), type: "leverage", label, pipelineStep: "redesign", tier: autoTier(label, undefined, "system"), impact: lp.impact, mode, sourceEngine: "pipeline" });
    });
    safeArr(redesign.convergenceZones).forEach((z: any, i: number) => {
      const label = typeof z === "string" ? z : (z.label || z.name || `Convergence Zone ${i + 1}`);
      items.push({ id: makeId("lev-conv"), type: "leverage", label, pipelineStep: "redesign", tier: "structural", mode, sourceEngine: "pipeline" });
    });
    safeArr(redesign.hiddenValues || redesign.underservedSegments).forEach((v: any, i: number) => {
      const label = typeof v === "string" ? v : (v.label || v.name || `Hidden Value ${i + 1}`);
      items.push({ id: makeId("lev-hv"), type: "signal", label, pipelineStep: "redesign", tier: autoTier(label, undefined, "optimization"), mode, sourceEngine: "pipeline" });
    });
  }

  const si = input.intelligence;
  if (si) {
    safeArr(si.leveragePoints).forEach((lp: any) => {
      if (!items.some(e => e.id === lp.id)) {
        items.push({ id: lp.id || makeId("lev-si"), type: "leverage", label: lp.label || lp.name, pipelineStep: "redesign", tier: autoTier(lp.label || "", undefined, "system"), impact: lp.impact, mode, sourceEngine: "system_intelligence" });
      }
    });
  }

  return items;
}

function extractRiskEvidence(input: EvidenceInput): Evidence[] {
  const items: Evidence[] = [];
  const mode = inferMode(input.analysisType);

  const st = input.stressTestData;
  if (st) {
    safeArr(st.redTeam || st.redTeamArguments).forEach((r: any, i: number) => {
      const label = typeof r === "string" ? r : (r.argument || r.label || r.title || `Red Team ${i + 1}`);
      items.push({ id: makeId("risk-rt"), type: "risk", label, pipelineStep: "stress_test", tier: "structural", mode, sourceEngine: "pipeline" });
    });
    const feasibility = st.feasibility || st.feasibilityChecklist || {};
    safeArr(feasibility.items).filter((f: any) => !f.passed && !f.met).forEach((f: any, i: number) => {
      items.push({ id: makeId("risk-feas"), type: "risk", label: f.label || f.name || `Feasibility Risk ${i + 1}`, pipelineStep: "stress_test", tier: "system", mode, sourceEngine: "pipeline" });
    });
  }

  const biz = input.businessAnalysisData;
  if (biz) {
    safeArr(biz.risks || biz.vulnerabilities).forEach((r: any, i: number) => {
      const label = typeof r === "string" ? r : (r.label || r.name || `Model Risk ${i + 1}`);
      items.push({ id: makeId("risk-biz"), type: "risk", label, pipelineStep: "report", tier: "system", mode, sourceEngine: "pipeline" });
    });
  }

  return items;
}

// ═══════════════════════════════════════════════════════════════
//  CONFIDENCE COMPUTATION — Evidence-first formula
// ═══════════════════════════════════════════════════════════════

function computeConfidenceScores(allItems: Evidence[]): void {
  // Build aggregation maps
  const stepSet = new Set(allItems.map(i => i.pipelineStep));
  const engineSet = new Set(allItems.map(i => i.sourceEngine).filter(Boolean));

  allItems.forEach(item => {
    const sourceCount = item.sourceCount ?? 1;

    // Pipeline diversity: how many different steps produced evidence in this tier
    const sameT = allItems.filter(e => e.tier === item.tier);
    const stepDiversity = new Set(sameT.map(e => e.pipelineStep)).size / 5;

    // Cross-engine support: how many engines contributed to same-tier evidence
    const engineDiversity = new Set(sameT.map(e => e.sourceEngine).filter(Boolean)).size / 6;

    // Competitor support
    const hasCompetitor = (item.competitorReferences?.length ?? 0) > 0 ? 1 : 0;

    // Canonical formula
    let confidence =
      (Math.min(sourceCount, 3) / 3) * 0.35 +
      stepDiversity * 0.25 +
      engineDiversity * 0.25 +
      hasCompetitor * 0.15;

    // Impact boost
    if (item.impact != null && item.impact >= 7) {
      confidence = Math.min(1, confidence + 0.1);
    }

    item.confidenceScore = Math.round(Math.max(0, Math.min(1, confidence)) * 100) / 100;

    // Build related signals (same tier, different step)
    item.relatedSignals = allItems
      .filter(other => other.id !== item.id && other.tier === item.tier && other.pipelineStep !== item.pipelineStep)
      .slice(0, 5)
      .map(other => other.id);
  });
}

// ═══════════════════════════════════════════════════════════════
//  DEDUPLICATION — Jaccard similarity on labels
// ═══════════════════════════════════════════════════════════════

function tokenize(text: string): Set<string> {
  return new Set(text.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(t => t.length > 2));
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export function deduplicateEvidence(items: Evidence[], threshold = 0.85): Evidence[] {
  const result: Evidence[] = [];
  const tokenCache = new Map<string, Set<string>>();

  for (const item of items) {
    const tokens = tokenize(item.label + " " + (item.description || ""));
    tokenCache.set(item.id, tokens);

    let isDuplicate = false;
    for (const existing of result) {
      const existingTokens = tokenCache.get(existing.id)!;
      if (jaccardSimilarity(tokens, existingTokens) >= threshold) {
        // Merge: increase source count, combine engines
        existing.sourceCount = (existing.sourceCount ?? 1) + 1;
        if (item.sourceEngine && item.sourceEngine !== existing.sourceEngine) {
          existing.relatedEvidence = [
            ...(existing.relatedEvidence || []),
            item.id,
          ];
        }
        // Keep higher impact
        if ((item.impact ?? 0) > (existing.impact ?? 0)) {
          existing.impact = item.impact;
        }
        // Merge competitor references
        if (item.competitorReferences?.length) {
          existing.competitorReferences = [
            ...(existing.competitorReferences || []),
            ...item.competitorReferences,
          ];
        }
        isDuplicate = true;
        break;
      }
    }
    if (!isDuplicate) {
      result.push({ ...item, sourceCount: item.sourceCount ?? 1 });
    }
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════
//  METRIC EVIDENCE BUILDER — with breakdowns
// ═══════════════════════════════════════════════════════════════

function buildMetricEvidence(domain: MetricDomain, items: Evidence[]): MetricEvidence {
  const tierBreakdown: Record<EvidenceTier, number> = { structural: 0, system: 0, optimization: 0 };
  const modeBreakdown: Record<EvidenceMode, number> = { product: 0, service: 0, business_model: 0 };

  items.forEach(item => {
    tierBreakdown[item.tier]++;
    if (item.mode) modeBreakdown[item.mode]++;
  });

  return {
    domain,
    evidenceCount: items.length,
    items,
    tierBreakdown,
    modeBreakdown,
  };
}

// ═══════════════════════════════════════════════════════════════
//  INPUT SPEC
// ═══════════════════════════════════════════════════════════════

export interface EvidenceInput {
  products: any[];
  selectedProduct: any | null;
  disruptData: any | null;
  redesignData: any | null;
  stressTestData: any | null;
  pitchDeckData: any | null;
  governedData: Record<string, unknown> | null;
  businessAnalysisData: any | null;
  intelligence: any | null;
  /** Analysis type for mode inference */
  analysisType?: string;
}

// ═══════════════════════════════════════════════════════════════
//  MAIN — Unified Evidence Pipeline
// ═══════════════════════════════════════════════════════════════

export function extractAllEvidence(input: EvidenceInput): Record<MetricDomain, MetricEvidence> {
  eid = 0; // reset counter per call

  const opportunity = extractOpportunityEvidence(input);
  const friction = extractFrictionEvidence(input);
  const constraint = extractConstraintEvidence(input);
  const leverage = extractLeverageEvidence(input);
  const risk = extractRiskEvidence(input);

  // Combine ALL items for cross-domain processing
  const allRaw = [...opportunity, ...friction, ...constraint, ...leverage, ...risk];

  // Deduplication pass
  const allDeduped = deduplicateEvidence(allRaw);

  // Confidence scoring across ALL items
  computeConfidenceScores(allDeduped);

  // Re-split by domain
  const dedupedByDomain = {
    opportunity: allDeduped.filter(e => e.type === "opportunity" || e.type === "simulation" || (e.type === "signal" && e.pipelineStep === "report")),
    friction: allDeduped.filter(e => e.type === "friction" || (e.type === "constraint" && e.pipelineStep === "disrupt")),
    constraint: allDeduped.filter(e => e.type === "assumption" || (e.type === "constraint" && e.pipelineStep !== "disrupt")),
    leverage: allDeduped.filter(e => e.type === "leverage" || (e.type === "signal" && e.pipelineStep === "redesign")),
    risk: allDeduped.filter(e => e.type === "risk"),
  };

  return {
    opportunity: buildMetricEvidence("opportunity", dedupedByDomain.opportunity),
    friction: buildMetricEvidence("friction", dedupedByDomain.friction),
    constraint: buildMetricEvidence("constraint", dedupedByDomain.constraint),
    leverage: buildMetricEvidence("leverage", dedupedByDomain.leverage),
    risk: buildMetricEvidence("risk", dedupedByDomain.risk),
  };
}

/**
 * Flatten all evidence from all domains into a single array.
 * Used by Insight Graph and other consumers.
 */
export function flattenEvidence(evidence: Record<MetricDomain, MetricEvidence>): Evidence[] {
  return Object.values(evidence).flatMap(e => e.items);
}
