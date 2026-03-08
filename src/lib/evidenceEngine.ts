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

export type EvidenceMode = "product" | "service" | "business_model" | "object_reinvention";

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
  /** Domain-specific structured metadata (Phase 1: constraint-first reasoning) */
  facets?: import("@/lib/evidenceFacets").EvidenceFacets;
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
    // Also extract from userJourney.frictionPoints (product analyses)
    const uj = product.userJourney;
    if (uj?.frictionPoints) {
      safeArr(uj.frictionPoints).forEach((fp: any, i: number) => {
        const label = typeof fp === "string" ? fp : (fp.friction || fp.text || fp.label || `Journey Friction ${i + 1}`);
        if (!items.some(e => e.label === label)) {
          items.push({ id: makeId("fric-uj"), type: "friction", label, pipelineStep: "report", tier: autoTier(label, undefined, "system"), mode, sourceEngine: "pipeline" });
        }
      });
    }
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

  // ── Governed friction tiers (from business model OR product disrupt) ──
  const bizGov = input.businessAnalysisData?.governed || (input.disruptData as any)?.governed;
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
      const label = typeof b === "string" ? b : (b.name || b.label || "Structural scaling limitation");
      items.push({ id: makeId("con-blk"), type: "constraint", label, pipelineStep: "disrupt", tier: "structural", mode, sourceEngine: "pipeline" });
    });
  }

  const governed = input.governedData;
  if (governed) {
    const synopsis = governed.reasoning_synopsis as any;
    if (synopsis?.key_assumptions) {
      safeArr(synopsis.key_assumptions).forEach((a: any, i: number) => {
        const raw = typeof a === "string" ? a : (a.text || a.label || "");
        const label = raw || `Key assumption from structural analysis`;
        if (!items.some(e => e.label === label)) {
          items.push({ id: makeId("con-gov"), type: "assumption", label, pipelineStep: "disrupt", tier: autoTier(label, undefined, "system"), mode, sourceEngine: "pipeline" });
        }
      });
    }

    // ── Challenge Mode overrides ──
    const challenges = governed.challenges as any[];
    if (Array.isArray(challenges)) {
      challenges.forEach((ch: any, i: number) => {
        const label = ch.value || "User-defined strategic assumption";
        const stage = ch.stage || "constraint";
        items.push({
          id: makeId("challenge"),
          type: stage === "opportunity" ? "opportunity" : stage === "driver" ? "friction" : "constraint",
          label,
          description: `User-challenged ${stage} assumption: ${label}`,
          pipelineStep: "disrupt",
          tier: "structural" as const,
          impact: 9,
          mode,
          sourceEngine: "pipeline",
        });
      });
    }
  }

  // ── Governed constraint_map + first_principles (from business model OR product disrupt) ──
  const bizGov = input.businessAnalysisData?.governed || (input.disruptData as any)?.governed;
  if (bizGov) {
    // Causal chains from constraint_map
    const cm = bizGov.constraint_map;
    if (cm) {
      safeArr(cm.causal_chains).forEach((chain: any, i: number) => {
        const label = chain.structural_constraint || chain.label || `Structural Constraint ${i + 1}`;
        const desc = chain.system_impact || chain.description;
        items.push({
          id: makeId("con-bm-cc"), type: "constraint", label, description: desc,
          pipelineStep: "report", tier: "structural", impact: 9,
          mode, sourceEngine: "pipeline", category: chain.impact_dimension || "operational_dependency",
        });
      });
      // Binding constraint — resolve ID to human-readable label from causal_chains
      if (cm.binding_constraint_id && cm.dominance_proof) {
        const bindingId = String(cm.binding_constraint_id);
        // Look up the actual constraint text from causal chains
        const matchingChain = safeArr(cm.causal_chains).find((c: any) =>
          String(c.id || c.constraint_id || "").toUpperCase() === bindingId.toUpperCase() ||
          String(c.structural_constraint || "").toLowerCase().includes(bindingId.toLowerCase())
        );
        const humanLabel = matchingChain?.structural_constraint
          || cm.binding_constraint // fallback to a text field if it exists
          || cm.dominance_proof?.slice(0, 80)
          || `Primary system bottleneck`;
        items.push({
          id: makeId("con-bm-bind"), type: "constraint",
          label: humanLabel,
          description: cm.dominance_proof,
          pipelineStep: "report", tier: "structural", impact: 10,
          mode, sourceEngine: "pipeline", category: "cost_structure",
        });
      }
    }

    // First principles: viability assumptions
    const fp = bizGov.first_principles;
    if (fp) {
      safeArr(fp.viability_assumptions).forEach((a: any, i: number) => {
        const label = a.assumption || a.label || `Viability Assumption ${i + 1}`;
        const desc = `Evidence: ${a.evidence_status || "unknown"}. Leverage if wrong: ${a.leverage_if_wrong ?? "N/A"}/10`;
        items.push({
          id: makeId("con-bm-va"), type: "assumption", label, description: desc,
          pipelineStep: "report", tier: "structural",
          impact: a.leverage_if_wrong || 7,
          confidenceScore: a.evidence_status === "verified" ? 0.9 : a.evidence_status === "modeled" ? 0.5 : 0.2,
          mode, sourceEngine: "pipeline", category: "demand_signal",
        });
      });
      // Fundamental constraints
      safeArr(fp.fundamental_constraints).forEach((c: any, i: number) => {
        const label = typeof c === "string" ? c : (c.label || `Fundamental Constraint ${i + 1}`);
        items.push({
          id: makeId("con-bm-fc"), type: "constraint", label,
          pipelineStep: "report", tier: "structural", impact: 8,
          mode, sourceEngine: "pipeline",
        });
      });
      // Dependency structure
      safeArr(fp.dependency_structure).forEach((d: any, i: number) => {
        const label = typeof d === "string" ? d : (d.label || `Dependency ${i + 1}`);
        items.push({
          id: makeId("con-bm-dep"), type: "constraint", label,
          pipelineStep: "report", tier: "system", impact: 6,
          mode, sourceEngine: "pipeline", category: "operational_dependency",
        });
      });
      // Resource limits
      safeArr(fp.resource_limits).forEach((r: any, i: number) => {
        const label = typeof r === "string" ? r : (r.label || `Resource Limit ${i + 1}`);
        items.push({
          id: makeId("con-bm-rl"), type: "constraint", label,
          pipelineStep: "report", tier: "system", impact: 7,
          mode, sourceEngine: "pipeline", category: "cost_structure",
        });
      });
      // Behavioral realities
      safeArr(fp.behavioral_realities).forEach((b: any, i: number) => {
        const label = typeof b === "string" ? b : (b.label || `Behavioral Reality ${i + 1}`);
        items.push({
          id: makeId("con-bm-br"), type: "signal", label,
          pipelineStep: "report", tier: "system", impact: 5,
          mode, sourceEngine: "pipeline", category: "customer_behavior",
        });
      });
    }

    // Root hypotheses from governed data
    safeArr(bizGov.root_hypotheses).forEach((h: any, i: number) => {
      const label = h.hypothesis_statement || h.label || `Root Hypothesis ${i + 1}`;
      const desc = h.downstream_implications || h.description;
      items.push({
        id: makeId("con-bm-rh"), type: "assumption", label, description: desc,
        pipelineStep: "report", tier: "structural",
        impact: h.impact_score || 8,
        confidenceScore: (h.confidence || 80) / 100,
        mode, sourceEngine: "pipeline", category: h.constraint_type || "demand_signal",
      });
      // Extract friction sources from hypotheses
      safeArr(h.friction_sources).forEach((fs: any, fi: number) => {
        const fsLabel = typeof fs === "string" ? fs : (fs.label || `Friction Source ${fi + 1}`);
        items.push({
          id: makeId("con-bm-fs"), type: "friction", label: fsLabel,
          pipelineStep: "report", tier: "structural", impact: h.impact_score || 7,
          mode, sourceEngine: "pipeline",
        });
      });
    });
  }

  // Legacy flat business model fields
  const biz = input.businessAnalysisData;
  if (biz && mode === "business_model") {
    safeArr(biz.revenueRisks || biz.revenueModelAssumptions).forEach((r: any, i: number) => {
      const label = typeof r === "string" ? r : (r.label || r.name || `Revenue Assumption ${i + 1}`);
      if (!items.some(e => e.label === label)) {
        items.push({
          id: makeId("con-rev"), type: "assumption", label, pipelineStep: "report",
          tier: "structural", mode, sourceEngine: "pipeline", category: "revenue_model",
        });
      }
    });
    safeArr(biz.distributionConstraints || biz.channelBottlenecks).forEach((d: any, i: number) => {
      const label = typeof d === "string" ? d : (d.label || d.name || `Distribution Constraint ${i + 1}`);
      if (!items.some(e => e.label === label)) {
        items.push({
          id: makeId("con-dist"), type: "constraint", label, pipelineStep: "report",
          tier: "structural", mode, sourceEngine: "pipeline", category: "distribution",
        });
      }
    });
    safeArr(biz.costStructureRisks || biz.costInefficiencies).forEach((c: any, i: number) => {
      const label = typeof c === "string" ? c : (c.label || c.name || `Cost Structure Issue ${i + 1}`);
      if (!items.some(e => e.label === label)) {
        items.push({
          id: makeId("con-cost"), type: "constraint", label, pipelineStep: "report",
          tier: "system", mode, sourceEngine: "pipeline", category: "cost_structure",
        });
      }
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

  // ── Governed: counterfactual removal as leverage signal (business model OR product disrupt) ──
  const bizGov = input.businessAnalysisData?.governed || (input.disruptData as any)?.governed;
  if (bizGov?.constraint_map?.counterfactual_removal_result) {
    const cfText = String(bizGov.constraint_map.counterfactual_removal_result);
    // Use the actual counterfactual text as the label (trimmed to readable length)
    const cfLabel = cfText.length > 80 ? cfText.slice(0, 77) + "..." : cfText;
    items.push({
      id: makeId("lev-bm-cf"), type: "leverage",
      label: cfLabel || "Remove primary bottleneck to unlock growth",
      description: cfText,
      pipelineStep: "report", tier: "structural", impact: 9,
      mode, sourceEngine: "pipeline", category: "operational_dependency",
    });
  }
  // First principles: minimum viable system as leverage insight
  if (bizGov?.first_principles?.minimum_viable_system) {
    items.push({
      id: makeId("lev-bm-mvs"), type: "leverage",
      label: "Minimum Viable System",
      description: bizGov.first_principles.minimum_viable_system,
      pipelineStep: "report", tier: "structural", impact: 7,
      mode, sourceEngine: "pipeline",
    });
  }

  return items;
}

// ═══════════════════════════════════════════════════════════════
//  REAL-WORLD DATA EXTRACTION — Patent, Supply Chain, Geo, Regulatory
// ═══════════════════════════════════════════════════════════════

function extractPatentEvidence(input: EvidenceInput): Evidence[] {
  const items: Evidence[] = [];
  const mode = inferMode(input.analysisType);
  const patent = input.selectedProduct?.patentData;
  if (!patent) return items;

  // Patent thicket risk → constraint
  if (patent.thicketRisk === "high" || patent.thicketRisk === "medium") {
    items.push({
      id: makeId("pat-thicket"), type: "constraint",
      label: `Patent thicket risk: ${patent.thicketRisk}`,
      description: patent.thicketRiskExplanation || `Dense IP landscape restricts freedom to operate`,
      pipelineStep: "report", tier: "structural", impact: patent.thicketRisk === "high" ? 9 : 6,
      mode, sourceEngine: "pipeline", category: "regulatory_constraint",
    });
  }

  // Key holders → competitive pressure constraints
  safeArr(patent.keyHolders).slice(0, 5).forEach((holder: any, i: number) => {
    if (holder.dominance === "high" || holder.dominance === "medium") {
      items.push({
        id: makeId("pat-holder"), type: "constraint",
        label: `IP controlled by ${holder.name || "major holder"} (${holder.dominance} dominance)`,
        description: `${holder.focus || "Core technology patents"}. Threat: ${holder.threat || "market entry barrier"}`,
        pipelineStep: "report", tier: "structural", impact: holder.dominance === "high" ? 8 : 5,
        mode, sourceEngine: "pipeline", category: "competitive_pressure",
        competitorReferences: [{ name: holder.name }],
      });
    }
  });

  // Expired goldmines → leverage/opportunity
  safeArr(patent.expiredGoldmines).slice(0, 5).forEach((gold: any, i: number) => {
    items.push({
      id: makeId("pat-expired"), type: "leverage",
      label: `Expired IP: ${gold.title || "public domain technology"}`,
      description: `${gold.whatItCovers || ""}. Commercial opportunity: ${gold.commercialOpportunity || "free to use"}`,
      pipelineStep: "report", tier: "structural", impact: 7,
      mode, sourceEngine: "pipeline", category: "technology_dependency",
    });
  });

  // Patent gaps → opportunity signals
  safeArr(patent.patentGaps).slice(0, 5).forEach((gap: any, i: number) => {
    items.push({
      id: makeId("pat-gap"), type: "opportunity",
      label: `Patent white space: ${gap.gap || "unprotected area"}`,
      description: `${gap.why || ""}. Opportunity: ${gap.opportunity || "defensible market entry"}`,
      pipelineStep: "report", tier: "structural", impact: 7,
      mode, sourceEngine: "pipeline", category: "demand_signal",
    });
  });

  // Innovation angles → opportunity
  safeArr(patent.innovationAngles).slice(0, 3).forEach((angle: any) => {
    items.push({
      id: makeId("pat-innov"), type: "opportunity",
      label: `Patent-informed innovation: ${angle.angle || "novel approach"}`,
      description: `Based on: ${angle.basedOn || "prior art analysis"}. ${angle.competitiveAdvantage || ""}`,
      pipelineStep: "report", tier: "structural", impact: 6,
      mode, sourceEngine: "pipeline", category: "demand_signal",
    });
  });

  return items;
}

function extractSupplyChainEvidence(input: EvidenceInput): Evidence[] {
  const items: Evidence[] = [];
  const mode = inferMode(input.analysisType);
  const sc = input.selectedProduct?.supplyChain;
  if (!sc) return items;

  // Supplier concentration → constraint
  const suppliers = safeArr(sc.suppliers || []);
  if (suppliers.length > 0 && suppliers.length <= 2) {
    items.push({
      id: makeId("sc-conc"), type: "constraint",
      label: `Supplier concentration risk: only ${suppliers.length} known supplier(s)`,
      description: `Key suppliers: ${suppliers.map((s: any) => `${s.name} (${s.region})`).join(", ")}`,
      pipelineStep: "report", tier: "system", impact: 7,
      mode, sourceEngine: "pipeline", category: "operational_dependency",
    });
  }

  // Supplier info → operational signals
  suppliers.slice(0, 5).forEach((s: any) => {
    items.push({
      id: makeId("sc-sup"), type: "signal",
      label: `Supplier: ${s.name} (${s.region}, ${s.role || "general"})`,
      description: s.moq ? `MOQ: ${s.moq}` : `Supply chain participant`,
      pipelineStep: "report", tier: "system", impact: 4,
      mode, sourceEngine: "pipeline", category: "operational_dependency",
    });
  });

  // Manufacturer info → feasibility signals
  safeArr(sc.manufacturers || []).slice(0, 5).forEach((m: any) => {
    items.push({
      id: makeId("sc-mfg"), type: "signal",
      label: `Manufacturer: ${m.name} (${m.region})`,
      description: m.moq ? `MOQ: ${m.moq}` : `Manufacturing capability`,
      pipelineStep: "report", tier: "system", impact: 4,
      mode, sourceEngine: "pipeline", category: "operational_dependency",
    });
  });

  // Distributor channels → distribution signals
  safeArr(sc.distributors || []).slice(0, 3).forEach((d: any) => {
    items.push({
      id: makeId("sc-dist"), type: "signal",
      label: `Distributor: ${d.name} (${d.region})`,
      pipelineStep: "report", tier: "system", impact: 4,
      mode, sourceEngine: "pipeline", category: "distribution_channel",
    });
  });

  return items;
}

function extractGeoMarketEvidence(input: EvidenceInput): Evidence[] {
  const items: Evidence[] = [];
  const mode = inferMode(input.analysisType);
  const geo = input.geoMarketData;
  if (!geo) return items;

  // Top opportunity markets → demand signals
  safeArr(geo.topMarkets || geo.opportunities).slice(0, 5).forEach((mkt: any, i: number) => {
    const label = mkt.state || mkt.name || mkt.market || `Market ${i + 1}`;
    items.push({
      id: makeId("geo-mkt"), type: "signal",
      label: `High-opportunity market: ${label}`,
      description: mkt.score ? `Opportunity score: ${mkt.score}` : `${mkt.population ? `Pop: ${mkt.population.toLocaleString()}` : ""} ${mkt.medianIncome ? `Income: $${mkt.medianIncome.toLocaleString()}` : ""}`.trim(),
      pipelineStep: "report", tier: "optimization", impact: 5,
      mode, sourceEngine: "pipeline", category: "demand_signal",
    });
  });

  // Business density data → competitive pressure
  if (geo.businessPatterns) {
    const totalEstablishments = safeArr(geo.businessPatterns).reduce((s: number, b: any) => s + (b.establishments || 0), 0);
    if (totalEstablishments > 0) {
      items.push({
        id: makeId("geo-biz"), type: "signal",
        label: `Industry has ${totalEstablishments.toLocaleString()} establishments (Census CBP)`,
        description: `NAICS ${geo.naicsCode || "sector"}: real business density data from US Census County Business Patterns`,
        pipelineStep: "report", tier: "system", impact: 5,
        mode, sourceEngine: "pipeline", category: "competitive_pressure",
      });
    }
  }

  return items;
}

function extractRegulatoryEvidence(input: EvidenceInput): Evidence[] {
  const items: Evidence[] = [];
  const mode = inferMode(input.analysisType);
  const reg = input.regulatoryData;
  if (!reg || reg.regulatoryRelevance === "none") return items;

  // Regulatory relevance → constraint
  const impactMap = { high: 9, medium: 6, low: 3 };
  items.push({
    id: makeId("reg-rel"), type: "constraint",
    label: `Regulatory complexity: ${reg.regulatoryRelevance} (${reg.matchedCategory || "general"})`,
    description: `Oversight by: ${(reg.agencies || []).join(", ")}`,
    pipelineStep: "report", tier: "structural",
    impact: impactMap[reg.regulatoryRelevance as keyof typeof impactMap] || 5,
    mode, sourceEngine: "pipeline", category: "regulatory_constraint",
  });

  // Active rulemaking → risk
  safeArr(reg.activeRulemaking).slice(0, 3).forEach((rule: any) => {
    items.push({
      id: makeId("reg-rule"), type: "risk",
      label: `Active rulemaking: ${(rule.title || "").slice(0, 80)}`,
      description: `${rule.type || "RULE"} — ${rule.agencyNames?.join(", ") || "federal agency"}. ${(rule.abstractSnippet || "").slice(0, 200)}`,
      pipelineStep: "report", tier: "structural", impact: rule.type === "PROPOSED_RULE" ? 8 : 6,
      mode, sourceEngine: "pipeline", category: "regulatory_constraint",
    });
  });

  // Risk signals
  safeArr(reg.risks).slice(0, 3).forEach((risk: any) => {
    const label = typeof risk === "string" ? risk : (risk.label || "Regulatory risk");
    items.push({
      id: makeId("reg-risk"), type: "risk", label,
      pipelineStep: "report", tier: "structural", impact: 7,
      mode, sourceEngine: "pipeline", category: "regulatory_constraint",
    });
  });

  // State variance → constraint
  if (safeArr(reg.stateVariance).length > 0) {
    items.push({
      id: makeId("reg-var"), type: "constraint",
      label: `State-by-state regulatory variance for ${reg.matchedCategory || "this category"}`,
      description: reg.stateVariance.slice(0, 2).join("; "),
      pipelineStep: "report", tier: "system", impact: 6,
      mode, sourceEngine: "pipeline", category: "regulatory_constraint",
    });
  }

  return items;
}

function extractPricingEvidence(input: EvidenceInput): Evidence[] {
  const items: Evidence[] = [];
  const mode = inferMode(input.analysisType);
  const pricing = input.selectedProduct?.pricingIntel;
  if (!pricing) return items;

  // Price range → cost structure signal
  if (pricing.priceRange || pricing.averagePrice) {
    items.push({
      id: makeId("price-range"), type: "signal",
      label: `Market pricing: ${pricing.priceRange || `avg $${pricing.averagePrice}`}`,
      description: pricing.pricingStrategy || "Real market pricing data from competitive analysis",
      pipelineStep: "report", tier: "system", impact: 6,
      mode, sourceEngine: "pipeline", category: "pricing_model",
    });
  }

  // Margin data → cost structure
  if (pricing.estimatedMargin || pricing.marginRange) {
    items.push({
      id: makeId("price-margin"), type: "signal",
      label: `Estimated margin: ${pricing.estimatedMargin || pricing.marginRange}`,
      pipelineStep: "report", tier: "system", impact: 6,
      mode, sourceEngine: "pipeline", category: "cost_structure",
    });
  }

  // Competitor pricing
  safeArr(pricing.competitors || pricing.competitorPricing).slice(0, 5).forEach((comp: any) => {
    const name = typeof comp === "string" ? comp : (comp.name || comp.competitor);
    const price = comp.price || comp.pricePoint;
    if (name) {
      items.push({
        id: makeId("price-comp"), type: "signal",
        label: `Competitor pricing: ${name}${price ? ` at ${price}` : ""}`,
        pipelineStep: "report", tier: "optimization", impact: 4,
        mode, sourceEngine: "pipeline", category: "competitive_pressure",
        competitorReferences: [{ name }],
      });
    }
  });

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

  // ── Governed decision_synthesis blocking uncertainties (business model OR product disrupt) ──
  const bizGov = input.businessAnalysisData?.governed || (input.disruptData as any)?.governed;
  if (bizGov?.decision_synthesis) {
    const ds = bizGov.decision_synthesis;
    safeArr(ds.blocking_uncertainties).forEach((u: any, i: number) => {
      const label = typeof u === "string" ? u : (u.label || `Blocking Uncertainty ${i + 1}`);
      items.push({
        id: makeId("risk-bm-bu"), type: "risk", label,
        pipelineStep: "report", tier: "structural", impact: 8,
        mode, sourceEngine: "pipeline", category: "demand_signal",
      });
    });
    if (ds.decision_grade === "blocked" || ds.confidence_score < 40) {
      items.push({
        id: makeId("risk-bm-dg"), type: "risk",
        label: `Decision Grade: ${ds.decision_grade || "low confidence"} (${ds.confidence_score || 0}%)`,
        description: ds.next_required_evidence || "Insufficient evidence for confident decision",
        pipelineStep: "report", tier: "structural", impact: 9,
        mode, sourceEngine: "pipeline",
      });
    }
  }

  // Fragility scores from root hypotheses
  if (bizGov?.root_hypotheses) {
    safeArr(bizGov.root_hypotheses).forEach((h: any) => {
      if (h.fragility_score && h.fragility_score <= 3) {
        items.push({
          id: makeId("risk-bm-frag"), type: "risk",
          label: `High Fragility: ${h.hypothesis_statement?.substring(0, 80) || "hypothesis"}`,
          description: `Fragility score: ${h.fragility_score}/10 — highly vulnerable to disruption`,
          pipelineStep: "report", tier: "structural", impact: 8,
          mode, sourceEngine: "pipeline",
        });
      }
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

export interface DeduplicationResult {
  evidence: Evidence[];
  /** Map of removed ID → canonical surviving ID for downstream remapping */
  idRemapping: Map<string, string>;
}

export function deduplicateEvidence(items: Evidence[], threshold = 0.85): Evidence[] {
  return deduplicateEvidenceWithRemap(items, threshold).evidence;
}

export function deduplicateEvidenceWithRemap(items: Evidence[], threshold = 0.85): DeduplicationResult {
  const result: Evidence[] = [];
  const tokenCache = new Map<string, Set<string>>();
  const idRemapping = new Map<string, string>();

  for (const item of items) {
    const tokens = tokenize(item.label + " " + (item.description || ""));
    tokenCache.set(item.id, tokens);

    let isDuplicate = false;
    for (const existing of result) {
      const existingTokens = tokenCache.get(existing.id)!;
      if (jaccardSimilarity(tokens, existingTokens) >= threshold) {
        // Record the remapping: this item's ID → the surviving canonical ID
        idRemapping.set(item.id, existing.id);
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

  return { evidence: result, idRemapping };
}

// ═══════════════════════════════════════════════════════════════
//  METRIC EVIDENCE BUILDER — with breakdowns
// ═══════════════════════════════════════════════════════════════

function buildMetricEvidence(domain: MetricDomain, items: Evidence[]): MetricEvidence {
  const tierBreakdown: Record<EvidenceTier, number> = { structural: 0, system: 0, optimization: 0 };
  const modeBreakdown: Record<EvidenceMode, number> = { product: 0, service: 0, business_model: 0, object_reinvention: 0 };

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
  /** Geo market data (Census, CBP, World Bank) */
  geoMarketData?: any | null;
  /** Regulatory intelligence profile */
  regulatoryData?: any | null;
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
  const patent = extractPatentEvidence(input);
  const supplyChain = extractSupplyChainEvidence(input);
  const geo = extractGeoMarketEvidence(input);
  const regulatory = extractRegulatoryEvidence(input);
  const pricing = extractPricingEvidence(input);

  // Combine ALL items for cross-domain processing
  const allRaw = [...opportunity, ...friction, ...constraint, ...leverage, ...risk,
    ...patent, ...supplyChain, ...geo, ...regulatory, ...pricing];

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
