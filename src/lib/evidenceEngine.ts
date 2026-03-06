/**
 * EVIDENCE ENGINE
 *
 * Extracts structured evidence from pipeline data.
 * Every metric on the Command Deck traces back to concrete evidence items.
 *
 * Extended with:
 *   - confidenceScore (0-1)
 *   - relatedSignals
 *   - category
 *   - tier classification
 */

import { classifyTier } from "@/lib/tierDiscoveryEngine";

export type EvidenceTier = "structural" | "system" | "optimization";

export type EvidenceType = "assumption" | "signal" | "competitor" | "constraint" | "opportunity" | "risk" | "leverage";

export interface Evidence {
  id: string;
  type: EvidenceType;
  label: string;
  description?: string;
  pipelineStep: "report" | "disrupt" | "redesign" | "stress_test" | "pitch";
  tier: EvidenceTier;
  impact?: number;
  /** 0-1 confidence based on evidence density and corroboration */
  confidenceScore?: number;
  /** IDs of related evidence items */
  relatedSignals?: string[];
  /** Semantic category (ownership, logistics, ux, etc.) */
  category?: string;
}

export type MetricDomain = "opportunity" | "friction" | "constraint" | "leverage" | "risk";

export interface MetricEvidence {
  domain: MetricDomain;
  evidenceCount: number;
  items: Evidence[];
}

/* ── Helpers ── */
function safeArr(v: unknown): any[] {
  return Array.isArray(v) ? v : [];
}

let eid = 0;
function makeId(prefix: string): string {
  return `${prefix}-${++eid}`;
}

/* ── Auto-classify tier from label+description ── */
function autoTier(label: string, description?: string, fallback: EvidenceTier = "optimization"): EvidenceTier {
  const text = `${label} ${description || ""}`;
  const classified = classifyTier(text);
  // Only override fallback if classification found strong signal
  const lower = text.toLowerCase();
  const hasKeywords = lower.length > 5;
  return hasKeywords ? classified : fallback;
}

/* ── Extract opportunity evidence ── */
function extractOpportunityEvidence(input: EvidenceInput): Evidence[] {
  const items: Evidence[] = [];

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
      });
    });
  }

  const disrupt = input.disruptData;
  if (disrupt) {
    safeArr(disrupt.flippedIdeas || disrupt.ideas).forEach((idea: any, i: number) => {
      const label = idea.name || idea.title || idea.label || `Flipped Idea ${i + 1}`;
      const desc = idea.description;
      items.push({
        id: idea.id || makeId("opp-flip"),
        type: "opportunity",
        label,
        description: desc,
        pipelineStep: "disrupt",
        tier: autoTier(label, desc, "structural"),
        impact: idea.impact || idea.score,
        category: idea.category || idea.structuralChangeType,
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
        });
      }
    });
  }

  return items;
}

/* ── Extract friction evidence ── */
function extractFrictionEvidence(input: EvidenceInput): Evidence[] {
  const items: Evidence[] = [];

  const product = input.selectedProduct;
  if (product) {
    const ci = product.communityInsights || product.customerSentiment || {};
    safeArr(ci.topComplaints).forEach((c: any, i: number) => {
      const label = typeof c === "string" ? c : (c.text || c.label || `Complaint ${i + 1}`);
      items.push({ id: makeId("fric-comp"), type: "signal", label, pipelineStep: "report", tier: autoTier(label, undefined, "optimization") });
    });
    safeArr(ci.frictionPoints).forEach((f: any, i: number) => {
      const label = typeof f === "string" ? f : (f.text || f.label || `Friction ${i + 1}`);
      items.push({ id: makeId("fric-fp"), type: "signal", label, pipelineStep: "report", tier: autoTier(label, undefined, "system") });
    });
  }

  const disrupt = input.disruptData;
  if (disrupt) {
    safeArr(disrupt.constraints || disrupt.structuralConstraints).forEach((c: any, i: number) => {
      const label = typeof c === "string" ? c : (c.name || c.label || `Constraint ${i + 1}`);
      items.push({
        id: makeId("fric-con"), type: "constraint", label, pipelineStep: "disrupt",
        tier: autoTier(label, undefined, "structural"), impact: c.impact || c.severity,
      });
    });
  }

  return items;
}

/* ── Extract constraint evidence ── */
function extractConstraintEvidence(input: EvidenceInput): Evidence[] {
  const items: Evidence[] = [];

  const disrupt = input.disruptData;
  if (disrupt) {
    safeArr(disrupt.assumptions || disrupt.hiddenAssumptions).forEach((a: any, i: number) => {
      const label = typeof a === "string" ? a : (a.text || a.label || a.assumption || `Assumption ${i + 1}`);
      items.push({
        id: makeId("con-asm"), type: "assumption", label, pipelineStep: "disrupt",
        tier: autoTier(label, undefined, "structural"), category: a.category,
      });
    });
    safeArr(disrupt.structuralBlockers).forEach((b: any, i: number) => {
      const label = typeof b === "string" ? b : (b.name || b.label || `Blocker ${i + 1}`);
      items.push({ id: makeId("con-blk"), type: "constraint", label, pipelineStep: "disrupt", tier: "structural" });
    });
  }

  const governed = input.governedData;
  if (governed) {
    const synopsis = governed.reasoning_synopsis as any;
    if (synopsis?.key_assumptions) {
      safeArr(synopsis.key_assumptions).forEach((a: any, i: number) => {
        const label = typeof a === "string" ? a : (a.text || a.label || `Governed Assumption ${i + 1}`);
        if (!items.some(e => e.label === label)) {
          items.push({ id: makeId("con-gov"), type: "assumption", label, pipelineStep: "disrupt", tier: autoTier(label, undefined, "system") });
        }
      });
    }
  }

  return items;
}

/* ── Extract leverage evidence ── */
function extractLeverageEvidence(input: EvidenceInput): Evidence[] {
  const items: Evidence[] = [];

  const redesign = input.redesignData;
  if (redesign) {
    safeArr(redesign.leveragePoints).forEach((lp: any, i: number) => {
      const label = typeof lp === "string" ? lp : (lp.label || lp.name || `Leverage ${i + 1}`);
      items.push({ id: makeId("lev-pt"), type: "leverage", label, pipelineStep: "redesign", tier: autoTier(label, undefined, "system"), impact: lp.impact });
    });
    safeArr(redesign.convergenceZones).forEach((z: any, i: number) => {
      const label = typeof z === "string" ? z : (z.label || z.name || `Convergence Zone ${i + 1}`);
      items.push({ id: makeId("lev-conv"), type: "leverage", label, pipelineStep: "redesign", tier: "structural" });
    });
    safeArr(redesign.hiddenValues || redesign.underservedSegments).forEach((v: any, i: number) => {
      const label = typeof v === "string" ? v : (v.label || v.name || `Hidden Value ${i + 1}`);
      items.push({ id: makeId("lev-hv"), type: "signal", label, pipelineStep: "redesign", tier: autoTier(label, undefined, "optimization") });
    });
  }

  const si = input.intelligence;
  if (si) {
    safeArr(si.leveragePoints).forEach((lp: any) => {
      if (!items.some(e => e.id === lp.id)) {
        items.push({ id: lp.id || makeId("lev-si"), type: "leverage", label: lp.label || lp.name, pipelineStep: "redesign", tier: autoTier(lp.label || "", undefined, "system"), impact: lp.impact });
      }
    });
  }

  return items;
}

/* ── Extract risk evidence ── */
function extractRiskEvidence(input: EvidenceInput): Evidence[] {
  const items: Evidence[] = [];

  const st = input.stressTestData;
  if (st) {
    safeArr(st.redTeam || st.redTeamArguments).forEach((r: any, i: number) => {
      const label = typeof r === "string" ? r : (r.argument || r.label || r.title || `Red Team ${i + 1}`);
      items.push({ id: makeId("risk-rt"), type: "risk", label, pipelineStep: "stress_test", tier: "structural" });
    });
    const feasibility = st.feasibility || st.feasibilityChecklist || {};
    safeArr(feasibility.items).filter((f: any) => !f.passed && !f.met).forEach((f: any, i: number) => {
      items.push({ id: makeId("risk-feas"), type: "risk", label: f.label || f.name || `Feasibility Risk ${i + 1}`, pipelineStep: "stress_test", tier: "system" });
    });
  }

  const biz = input.businessAnalysisData;
  if (biz) {
    safeArr(biz.risks || biz.vulnerabilities).forEach((r: any, i: number) => {
      const label = typeof r === "string" ? r : (r.label || r.name || `Model Risk ${i + 1}`);
      items.push({ id: makeId("risk-biz"), type: "risk", label, pipelineStep: "report", tier: "system" });
    });
  }

  return items;
}

/* ── Confidence scoring pass ── */
function computeConfidenceScores(allItems: Evidence[]): void {
  // Build domain co-occurrence map
  const tierCounts: Record<EvidenceTier, number> = { structural: 0, system: 0, optimization: 0 };
  const stepCounts: Record<string, number> = {};
  allItems.forEach(item => {
    tierCounts[item.tier]++;
    stepCounts[item.pipelineStep] = (stepCounts[item.pipelineStep] || 0) + 1;
  });

  allItems.forEach(item => {
    const corroboration = tierCounts[item.tier];
    const stepDensity = stepCounts[item.pipelineStep] || 0;

    let confidence: number;
    if (item.impact != null && item.impact >= 7 && corroboration >= 5) {
      confidence = 0.8 + Math.min(corroboration / 50, 0.2); // 0.8-1.0
    } else if ((item.impact ?? 5) >= 5 || corroboration >= 3) {
      confidence = 0.5 + Math.min(stepDensity / 20, 0.2); // 0.5-0.7
    } else {
      confidence = 0.3 + Math.min(corroboration / 20, 0.2); // 0.3-0.5
    }

    item.confidenceScore = Math.round(confidence * 100) / 100;
  });

  // Build related signals (same tier, different step)
  allItems.forEach(item => {
    item.relatedSignals = allItems
      .filter(other => other.id !== item.id && other.tier === item.tier && other.pipelineStep !== item.pipelineStep)
      .slice(0, 5)
      .map(other => other.id);
  });
}

/* ── Input shape ── */
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
}

/* ══════════════════════════════════════════════════════════
 * MAIN — Extract all evidence by domain
 * ══════════════════════════════════════════════════════════ */
export function extractAllEvidence(input: EvidenceInput): Record<MetricDomain, MetricEvidence> {
  eid = 0; // reset counter per call

  const opportunity = extractOpportunityEvidence(input);
  const friction = extractFrictionEvidence(input);
  const constraint = extractConstraintEvidence(input);
  const leverage = extractLeverageEvidence(input);
  const risk = extractRiskEvidence(input);

  // Run confidence scoring across ALL items
  const allItems = [...opportunity, ...friction, ...constraint, ...leverage, ...risk];
  computeConfidenceScores(allItems);

  return {
    opportunity: { domain: "opportunity", evidenceCount: opportunity.length, items: opportunity },
    friction: { domain: "friction", evidenceCount: friction.length, items: friction },
    constraint: { domain: "constraint", evidenceCount: constraint.length, items: constraint },
    leverage: { domain: "leverage", evidenceCount: leverage.length, items: leverage },
    risk: { domain: "risk", evidenceCount: risk.length, items: risk },
  };
}
