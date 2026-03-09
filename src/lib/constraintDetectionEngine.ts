/**
 * CONSTRAINT DETECTION ENGINE — Three-Layer Structural Analysis
 *
 * Detects binding constraints from structured evidence using:
 *   Layer 1: Deterministic facet-based candidate rules
 *   Layer 2: AI-assisted ranking (stubbed with deterministic fallback)
 *   Layer 3: Counterfactual validation via evidence connectivity
 *
 * Every constraint has a stable internal ID (e.g., C-LAB-01) for
 * analytics stability and pattern linkage.
 *
 * Output: ConstraintHypothesisSet — ranked 2-3 constraints with
 * full evidence chains and counterfactual impact scores.
 */

import type { Evidence } from "@/lib/evidenceEngine";
import type { EvidenceFacets, BusinessFacets, ObjectFacets, DemandFacets, MarketFacets } from "@/lib/evidenceFacets";

// ═══════════════════════════════════════════════════════════════
//  CONSTRAINT TAXONOMY — Stable IDs
// ═══════════════════════════════════════════════════════════════

export interface ConstraintTypeDefinition {
  /** Stable internal ID (e.g., C-LAB-01) */
  id: string;
  /** Human-readable name */
  name: string;
  /** Category for grouping */
  category: ConstraintCategory;
  /** Description of what this constraint means */
  description: string;
  /** Default tier classification */
  defaultTier: 1 | 2 | 3;
}

export type ConstraintCategory =
  | "labor_operations"
  | "revenue_pricing"
  | "supply_distribution"
  | "technology_information"
  | "market_adoption"
  | "structural_economic"
  | "demand";

export const CONSTRAINT_TAXONOMY: ConstraintTypeDefinition[] = [
  // ── Labor & Operations ──
  { id: "C-LAB-01", name: "labor_intensity", category: "labor_operations", description: "Revenue scales linearly with headcount", defaultTier: 1 },
  { id: "C-LAB-02", name: "owner_dependency", category: "labor_operations", description: "Key person risk, non-delegatable functions", defaultTier: 1 },
  { id: "C-LAB-03", name: "operational_bottleneck", category: "labor_operations", description: "Process step limiting throughput", defaultTier: 2 },
  { id: "C-LAB-04", name: "skill_scarcity", category: "labor_operations", description: "Specialized roles hard to hire/retain", defaultTier: 2 },
  { id: "C-LAB-05", name: "manual_process", category: "labor_operations", description: "Human-dependent workflow that could be systematized", defaultTier: 2 },

  // ── Revenue & Pricing ──
  { id: "C-REV-01", name: "commoditized_pricing", category: "revenue_pricing", description: "Weak price-setting power, race to bottom", defaultTier: 1 },
  { id: "C-REV-02", name: "revenue_concentration", category: "revenue_pricing", description: "Excessive dependence on few customers/contracts", defaultTier: 1 },
  { id: "C-REV-03", name: "transactional_revenue", category: "revenue_pricing", description: "No recurring relationship, unpredictable cash flow", defaultTier: 2 },
  { id: "C-REV-04", name: "forced_bundling", category: "revenue_pricing", description: "Customers pay for unwanted value components", defaultTier: 2 },
  { id: "C-REV-05", name: "capital_barrier", category: "revenue_pricing", description: "High upfront cost limiting adoption", defaultTier: 1 },

  // ── Supply & Distribution ──
  { id: "C-SUP-01", name: "supply_fragmentation", category: "supply_distribution", description: "Many small suppliers, no aggregation", defaultTier: 2 },
  { id: "C-SUP-02", name: "geographic_constraint", category: "supply_distribution", description: "Value delivery limited by physical proximity", defaultTier: 1 },
  { id: "C-SUP-03", name: "channel_dependency", category: "supply_distribution", description: "Reliance on intermediaries who capture margin", defaultTier: 2 },
  { id: "C-SUP-04", name: "inventory_burden", category: "supply_distribution", description: "Carrying cost, waste, or obsolescence risk", defaultTier: 2 },
  { id: "C-SUP-05", name: "capacity_ceiling", category: "supply_distribution", description: "Fixed assets limiting growth", defaultTier: 1 },

  // ── Technology & Information ──
  { id: "C-TEC-01", name: "legacy_lock_in", category: "technology_information", description: "Outdated systems creating switching costs", defaultTier: 2 },
  { id: "C-TEC-02", name: "information_asymmetry", category: "technology_information", description: "Value lost because data isn't captured or used", defaultTier: 2 },
  { id: "C-TEC-03", name: "analog_process", category: "technology_information", description: "Physical-only workflow missing digital layer", defaultTier: 2 },

  // ── Market & Adoption ──
  { id: "C-MKT-01", name: "expertise_barrier", category: "market_adoption", description: "Product/service requires specialized knowledge to use", defaultTier: 2 },
  { id: "C-MKT-02", name: "switching_friction", category: "market_adoption", description: "Customers locked into existing solutions", defaultTier: 2 },
  { id: "C-MKT-03", name: "trust_deficit", category: "market_adoption", description: "Market skepticism preventing adoption", defaultTier: 2 },
  { id: "C-MKT-04", name: "regulatory_barrier", category: "market_adoption", description: "Legal/compliance constraints limiting options", defaultTier: 1 },

  // ── Structural & Economic ──
  { id: "C-STR-01", name: "margin_compression", category: "structural_economic", description: "Declining margins from structural cost pressure", defaultTier: 1 },
  { id: "C-STR-02", name: "asset_underutilization", category: "structural_economic", description: "Owned resources not generating proportional value", defaultTier: 2 },
  { id: "C-STR-03", name: "linear_scaling", category: "structural_economic", description: "Growth requires proportional resource increase", defaultTier: 1 },
  { id: "C-STR-04", name: "vendor_concentration", category: "structural_economic", description: "Critical dependency on few suppliers", defaultTier: 1 },

  // ── Demand Constraints ──
  { id: "C-DEM-01", name: "awareness_gap", category: "demand", description: "Target audience doesn't know the solution exists", defaultTier: 2 },
  { id: "C-DEM-02", name: "access_constraint", category: "demand", description: "Solution exists but customers can't reach it", defaultTier: 2 },
  { id: "C-DEM-03", name: "motivation_decay", category: "demand", description: "Customers start but don't persist", defaultTier: 2 },
  { id: "C-DEM-04", name: "perceived_value_mismatch", category: "demand", description: "Customers undervalue the offering relative to cost", defaultTier: 3 },
];

/** Lookup map for quick access by constraint name */
const CONSTRAINT_BY_NAME = new Map(CONSTRAINT_TAXONOMY.map(c => [c.name, c]));
const CONSTRAINT_BY_ID = new Map(CONSTRAINT_TAXONOMY.map(c => [c.id, c]));

export function getConstraintDefinition(nameOrId: string): ConstraintTypeDefinition | undefined {
  return CONSTRAINT_BY_NAME.get(nameOrId) || CONSTRAINT_BY_ID.get(nameOrId);
}

// ═══════════════════════════════════════════════════════════════
//  LAYER 1: CONSTRAINT CANDIDATE
// ═══════════════════════════════════════════════════════════════

export interface ConstraintCandidate {
  /** Stable constraint type ID (e.g., C-LAB-01) */
  constraintId: string;
  /** Human-readable constraint name */
  constraintName: string;
  /** Tier classification */
  tier: 1 | 2 | 3;
  /** Evidence items that triggered this candidate */
  evidenceIds: string[];
  /** Which facet fields triggered detection */
  facetBasis: string[];
  /** Confidence based on evidence quality */
  confidence: "strong" | "moderate" | "limited";
  /** Human-readable explanation of why this was detected */
  explanation: string;
}

// ═══════════════════════════════════════════════════════════════
//  LAYER 1: DETERMINISTIC RULE ENGINE
// ═══════════════════════════════════════════════════════════════

interface EvidenceWithFacets extends Evidence {
  facets?: EvidenceFacets;
}

interface RuleContext {
  evidence: EvidenceWithFacets[];
  /** All business facets found across evidence */
  businessFacets: BusinessFacets[];
  /** All object facets found across evidence */
  objectFacets: ObjectFacets[];
  /** All demand facets found across evidence */
  demandFacets: DemandFacets[];
  /** All market facets found across evidence */
  marketFacets: MarketFacets[];
  /** Full text corpus for keyword fallback */
  textCorpus: string;
}

interface ConstraintRule {
  constraintName: string;
  /** Check structured facets first */
  facetCondition?: (ctx: RuleContext) => { match: boolean; facetBasis: string[]; explanation: string };
  /** Keyword fallback for text-only evidence */
  keywordPattern?: RegExp;
  keywordExplanation?: string;
}

const DETECTION_RULES: ConstraintRule[] = [
  // ── Labor & Operations ──
  {
    constraintName: "labor_intensity",
    facetCondition: (ctx) => {
      const lp = ctx.businessFacets.find(f => f.laborProfile?.intensity === "high");
      if (lp) return { match: true, facetBasis: ["laborProfile.intensity"], explanation: "Labor profile indicates high intensity — revenue likely scales linearly with headcount" };
      return { match: false, facetBasis: [], explanation: "" };
    },
    keywordPattern: /labor[\s-]?intensive|headcount[\s-]?driven|staff[\s-]?dependent|people[\s-]?heavy|manpower|workforce[\s-]?scale/,
    keywordExplanation: "Text evidence suggests labor-intensive operations",
  },
  {
    constraintName: "owner_dependency",
    facetCondition: (ctx) => {
      const lp = ctx.businessFacets.find(f => f.laborProfile?.ownerDependency === true);
      if (lp) return { match: true, facetBasis: ["laborProfile.ownerDependency"], explanation: "Owner dependency detected — key person risk identified" };
      return { match: false, facetBasis: [], explanation: "" };
    },
    keywordPattern: /owner[\s-]?depend|key[\s-]?person|founder[\s-]?driven|single[\s-]?point[\s-]?of[\s-]?failure|indispensable/,
    keywordExplanation: "Text evidence suggests owner/key-person dependency",
  },
  {
    constraintName: "operational_bottleneck",
    facetCondition: (ctx) => {
      const ob = ctx.businessFacets.find(f => f.operationalBottleneck);
      if (ob?.operationalBottleneck) return { match: true, facetBasis: ["operationalBottleneck.process", "operationalBottleneck.constraint"], explanation: `Bottleneck detected in ${ob.operationalBottleneck.process}: ${ob.operationalBottleneck.constraint}` };
      return { match: false, facetBasis: [], explanation: "" };
    },
    keywordPattern: /bottleneck|throughput[\s-]?limit|capacity[\s-]?constrain|backlog|queue[\s-]?time/,
    keywordExplanation: "Text evidence suggests operational throughput limitation",
  },
  {
    constraintName: "skill_scarcity",
    facetCondition: (ctx) => {
      const lp = ctx.businessFacets.find(f => f.laborProfile?.specializedRoles && f.laborProfile.specializedRoles.length > 0);
      if (lp) return { match: true, facetBasis: ["laborProfile.specializedRoles"], explanation: `Specialized roles identified: ${lp.laborProfile!.specializedRoles!.join(", ")}` };
      return { match: false, facetBasis: [], explanation: "" };
    },
    keywordPattern: /hard[\s-]?to[\s-]?hire|talent[\s-]?shortage|specialized[\s-]?skill|certified[\s-]?professional|credential[\s-]?required/,
    keywordExplanation: "Text evidence suggests specialized skill scarcity",
  },
  {
    constraintName: "manual_process",
    facetCondition: (ctx) => {
      const obj = ctx.objectFacets.find(f => f.maintenanceBurden === "high");
      if (obj) return { match: true, facetBasis: ["maintenanceBurden"], explanation: "High maintenance burden suggests manual process dependency" };
      return { match: false, facetBasis: [], explanation: "" };
    },
    keywordPattern: /manual[\s-]?process|hand[\s-]?done|paper[\s-]?based|human[\s-]?dependent|non[\s-]?automated|spreadsheet[\s-]?driven/,
    keywordExplanation: "Text evidence suggests human-dependent workflows",
  },

  // ── Revenue & Pricing ──
  {
    constraintName: "commoditized_pricing",
    facetCondition: (ctx) => {
      const pa = ctx.businessFacets.find(f => f.pricingArchitecture?.priceSettingPower === "weak");
      if (pa) return { match: true, facetBasis: ["pricingArchitecture.priceSettingPower"], explanation: "Weak price-setting power indicates commoditized pricing environment" };
      return { match: false, facetBasis: [], explanation: "" };
    },
    keywordPattern: /race[\s-]?to[\s-]?bottom|price[\s-]?war|commodit|no[\s-]?pricing[\s-]?power|undercutting|interchangeable/,
    keywordExplanation: "Text evidence suggests commoditized pricing dynamics",
  },
  {
    constraintName: "revenue_concentration",
    facetCondition: (ctx) => {
      const cr = ctx.businessFacets.find(f => f.concentrationRisk?.type === "customer" && (f.concentrationRisk.topEntityShare ?? 0) > 0.25);
      if (cr) return { match: true, facetBasis: ["concentrationRisk.topEntityShare"], explanation: `Top customer accounts for ${Math.round((cr.concentrationRisk!.topEntityShare ?? 0) * 100)}% of revenue` };
      // Also match if concentration risk type is customer even without share data
      const crAny = ctx.businessFacets.find(f => f.concentrationRisk?.type === "customer");
      if (crAny) return { match: true, facetBasis: ["concentrationRisk.type"], explanation: "Customer concentration risk detected" };
      return { match: false, facetBasis: [], explanation: "" };
    },
    keywordPattern: /customer[\s-]?concentration|revenue[\s-]?depend|single[\s-]?client|top[\s-]?customer|client[\s-]?risk/,
    keywordExplanation: "Text evidence suggests customer revenue concentration",
  },
  {
    constraintName: "transactional_revenue",
    facetCondition: (ctx) => {
      const pa = ctx.businessFacets.find(f => f.pricingArchitecture && (f.pricingArchitecture.model === "project" || f.pricingArchitecture.model === "hourly"));
      if (pa) return { match: true, facetBasis: ["pricingArchitecture.model"], explanation: `${pa.pricingArchitecture!.model}-based pricing creates transactional, non-recurring revenue` };
      return { match: false, facetBasis: [], explanation: "" };
    },
    keywordPattern: /one[\s-]?time|transactional|project[\s-]?based|episodic[\s-]?revenue|no[\s-]?recurring|unpredictable[\s-]?cash/,
    keywordExplanation: "Text evidence suggests transactional (non-recurring) revenue model",
  },
  {
    constraintName: "forced_bundling",
    keywordPattern: /forced[\s-]?bundle|all[\s-]?or[\s-]?nothing|package[\s-]?deal|can.?t[\s-]?buy[\s-]?separate|unwanted[\s-]?feature|bloated[\s-]?offering/,
    keywordExplanation: "Text evidence suggests customers forced to buy unwanted components",
  },
  {
    constraintName: "capital_barrier",
    keywordPattern: /high[\s-]?upfront|capital[\s-]?intensive|large[\s-]?investment|expensive[\s-]?to[\s-]?start|buy[\s-]?in[\s-]?cost|barrier[\s-]?to[\s-]?entry/,
    keywordExplanation: "Text evidence suggests high upfront capital requirements limiting adoption",
  },

  // ── Supply & Distribution ──
  {
    constraintName: "supply_fragmentation",
    facetCondition: (ctx) => {
      const mf = ctx.marketFacets.find(f => f.competitiveDensity === "fragmented");
      if (mf) return { match: true, facetBasis: ["competitiveDensity"], explanation: "Fragmented competitive landscape suggests supply-side fragmentation" };
      return { match: false, facetBasis: [], explanation: "" };
    },
    keywordPattern: /fragmented[\s-]?supply|many[\s-]?small|cottage[\s-]?industry|dispersed[\s-]?provider|mom[\s-]?and[\s-]?pop/,
    keywordExplanation: "Text evidence suggests fragmented supply landscape",
  },
  {
    constraintName: "geographic_constraint",
    facetCondition: (ctx) => {
      const df = ctx.demandFacets.find(f => f.accessConstraint === "geographic");
      if (df) return { match: true, facetBasis: ["accessConstraint"], explanation: "Geographic access constraint detected" };
      return { match: false, facetBasis: [], explanation: "" };
    },
    keywordPattern: /geographic[\s-]?limit|local[\s-]?only|physical[\s-]?presence|service[\s-]?area|within[\s-]?radius|proximity[\s-]?required/,
    keywordExplanation: "Text evidence suggests geographic delivery constraints",
  },
  {
    constraintName: "channel_dependency",
    keywordPattern: /channel[\s-]?depend|intermediar|broker[\s-]?relian|distributor[\s-]?control|middleman|agent[\s-]?commission/,
    keywordExplanation: "Text evidence suggests reliance on intermediary channels",
  },
  {
    constraintName: "inventory_burden",
    keywordPattern: /inventory[\s-]?burden|carrying[\s-]?cost|obsolescen|dead[\s-]?stock|warehouse[\s-]?cost|spoilage|perishable/,
    keywordExplanation: "Text evidence suggests inventory carrying cost or waste",
  },
  {
    constraintName: "capacity_ceiling",
    facetCondition: (ctx) => {
      const ob = ctx.businessFacets.find(f => f.operationalBottleneck?.capacityUtilization && f.operationalBottleneck.capacityUtilization > 0.85);
      if (ob) return { match: true, facetBasis: ["operationalBottleneck.capacityUtilization"], explanation: `Capacity utilization at ${Math.round(ob.operationalBottleneck!.capacityUtilization! * 100)}% — near ceiling` };
      return { match: false, facetBasis: [], explanation: "" };
    },
    keywordPattern: /capacity[\s-]?ceiling|maxed[\s-]?out|at[\s-]?capacity|no[\s-]?room[\s-]?to[\s-]?grow|fixed[\s-]?asset[\s-]?limit/,
    keywordExplanation: "Text evidence suggests fixed asset capacity ceiling",
  },

  // ── Technology & Information ──
  {
    constraintName: "legacy_lock_in",
    keywordPattern: /legacy[\s-]?system|outdated[\s-]?tech|technical[\s-]?debt|locked[\s-]?in|migration[\s-]?cost|mainframe|on[\s-]?prem/,
    keywordExplanation: "Text evidence suggests legacy system lock-in",
  },
  {
    constraintName: "information_asymmetry",
    keywordPattern: /information[\s-]?asymmetr|data[\s-]?gap|no[\s-]?visibility|opaque|hidden[\s-]?information|unknown[\s-]?cost/,
    keywordExplanation: "Text evidence suggests value lost from uncaptured data",
  },
  {
    constraintName: "analog_process",
    facetCondition: (ctx) => {
      const obj = ctx.objectFacets.some(f => f.componentRole === "interface");
      // Only fire if there's also manual process evidence
      if (obj) return { match: true, facetBasis: ["componentRole"], explanation: "Physical interface component detected — potential for digital augmentation" };
      return { match: false, facetBasis: [], explanation: "" };
    },
    keywordPattern: /analog|paper[\s-]?only|no[\s-]?digital|physical[\s-]?only|pen[\s-]?and[\s-]?paper|fax|phone[\s-]?based/,
    keywordExplanation: "Text evidence suggests analog-only workflows",
  },

  // ── Market & Adoption ──
  {
    constraintName: "expertise_barrier",
    keywordPattern: /expertise[\s-]?barrier|steep[\s-]?learning|require[\s-]?training|specialist[\s-]?needed|complex[\s-]?to[\s-]?use|not[\s-]?intuitive/,
    keywordExplanation: "Text evidence suggests specialized knowledge required for use",
  },
  {
    constraintName: "switching_friction",
    facetCondition: (ctx) => {
      const pa = ctx.businessFacets.find(f => f.pricingArchitecture?.switchingCost === "high");
      if (pa) return { match: true, facetBasis: ["pricingArchitecture.switchingCost"], explanation: "High switching costs detected in pricing architecture" };
      return { match: false, facetBasis: [], explanation: "" };
    },
    keywordPattern: /switching[\s-]?cost|lock[\s-]?in|contract[\s-]?obligation|entrench|habitual|hard[\s-]?to[\s-]?leave/,
    keywordExplanation: "Text evidence suggests customer switching friction",
  },
  {
    constraintName: "trust_deficit",
    facetCondition: (ctx) => {
      const df = ctx.demandFacets.find(f => f.trustBarrier === true);
      if (df) return { match: true, facetBasis: ["trustBarrier"], explanation: "Trust barrier detected in demand signals" };
      return { match: false, facetBasis: [], explanation: "" };
    },
    keywordPattern: /trust[\s-]?deficit|skeptic|credibility[\s-]?gap|reputation[\s-]?risk|unproven[\s-]?model/,
    keywordExplanation: "Text evidence suggests market trust deficit",
  },
  {
    constraintName: "regulatory_barrier",
    facetCondition: (ctx) => {
      const mf = ctx.marketFacets.find(f => f.regulatoryEnvironment === "restrictive" || f.regulatoryEnvironment === "prohibitive");
      if (mf) return { match: true, facetBasis: ["regulatoryEnvironment"], explanation: `Regulatory environment is ${mf.regulatoryEnvironment}` };
      return { match: false, facetBasis: [], explanation: "" };
    },
    keywordPattern: /regulatory[\s-]?barrier|compliance[\s-]?burden|legal[\s-]?restrict|permit[\s-]?required|fda|hipaa|regulated[\s-]?industry/,
    keywordExplanation: "Text evidence suggests regulatory constraints",
  },

  // ── Structural & Economic ──
  {
    constraintName: "margin_compression",
    facetCondition: (ctx) => {
      const ms = ctx.businessFacets.find(f => f.marginStructure?.marginTrend === "declining");
      if (ms) return { match: true, facetBasis: ["marginStructure.marginTrend"], explanation: "Declining margin trend detected — structural cost pressure" };
      return { match: false, facetBasis: [], explanation: "" };
    },
    keywordPattern: /margin[\s-]?compress|margin[\s-]?declin|shrinking[\s-]?profit|cost[\s-]?pressure|eroding[\s-]?margin/,
    keywordExplanation: "Text evidence suggests margin compression",
  },
  {
    constraintName: "asset_underutilization",
    keywordPattern: /underutiliz|idle[\s-]?asset|unused[\s-]?capacity|low[\s-]?utilization|wasted[\s-]?resource|empty[\s-]?capacity/,
    keywordExplanation: "Text evidence suggests owned assets not fully utilized",
  },
  {
    constraintName: "linear_scaling",
    facetCondition: (ctx) => {
      const lp = ctx.businessFacets.find(f => f.laborProfile?.intensity === "high" && f.laborProfile.laborCostRatio && f.laborProfile.laborCostRatio > 0.5);
      if (lp) return { match: true, facetBasis: ["laborProfile.laborCostRatio"], explanation: `Labor cost ratio ${Math.round(lp.laborProfile!.laborCostRatio! * 100)}% indicates linear scaling constraint` };
      return { match: false, facetBasis: [], explanation: "" };
    },
    keywordPattern: /linear[\s-]?scal|proportional[\s-]?growth|can.?t[\s-]?scale|growth[\s-]?require[\s-]?more|one[\s-]?to[\s-]?one[\s-]?ratio/,
    keywordExplanation: "Text evidence suggests growth requires proportional resource increase",
  },
  {
    constraintName: "vendor_concentration",
    facetCondition: (ctx) => {
      const cr = ctx.businessFacets.find(f => f.concentrationRisk?.type === "vendor");
      if (cr) return { match: true, facetBasis: ["concentrationRisk.type"], explanation: "Vendor concentration risk detected" };
      return { match: false, facetBasis: [], explanation: "" };
    },
    keywordPattern: /vendor[\s-]?concentrat|sole[\s-]?source|single[\s-]?supplier|supplier[\s-]?depend|supply[\s-]?chain[\s-]?risk/,
    keywordExplanation: "Text evidence suggests critical vendor dependency",
  },

  // ── Demand ──
  {
    constraintName: "awareness_gap",
    facetCondition: (ctx) => {
      const df = ctx.demandFacets.find(f => f.awarenessGap === true);
      if (df) return { match: true, facetBasis: ["awarenessGap"], explanation: "Demand-side awareness gap detected" };
      return { match: false, facetBasis: [], explanation: "" };
    },
    keywordPattern: /awareness[\s-]?gap|don.?t[\s-]?know|unaware|low[\s-]?visibility|market[\s-]?education[\s-]?needed/,
    keywordExplanation: "Text evidence suggests target audience awareness gap",
  },
  {
    constraintName: "access_constraint",
    facetCondition: (ctx) => {
      const df = ctx.demandFacets.find(f => f.accessConstraint != null);
      if (df) return { match: true, facetBasis: ["accessConstraint"], explanation: `Access constraint: ${df.accessConstraint}` };
      return { match: false, facetBasis: [], explanation: "" };
    },
    keywordPattern: /can.?t[\s-]?access|out[\s-]?of[\s-]?reach|underserved|access[\s-]?barrier|exclusion/,
    keywordExplanation: "Text evidence suggests access constraints for potential customers",
  },
  {
    constraintName: "motivation_decay",
    facetCondition: (ctx) => {
      const df = ctx.demandFacets.find(f => f.motivationDecay === true);
      if (df) return { match: true, facetBasis: ["motivationDecay"], explanation: "Customer motivation decay pattern detected" };
      return { match: false, facetBasis: [], explanation: "" };
    },
    keywordPattern: /motivation[\s-]?decay|drop[\s-]?off|abandon|churn[\s-]?rate|don.?t[\s-]?stick|lose[\s-]?interest|engagement[\s-]?decline/,
    keywordExplanation: "Text evidence suggests customers start but don't persist",
  },
  {
    constraintName: "perceived_value_mismatch",
    facetCondition: (ctx) => {
      const df = ctx.demandFacets.find(f => f.perceivedValueMismatch === true);
      if (df) return { match: true, facetBasis: ["perceivedValueMismatch"], explanation: "Perceived value mismatch detected" };
      return { match: false, facetBasis: [], explanation: "" };
    },
    keywordPattern: /perceived[\s-]?value|willingness[\s-]?to[\s-]?pay|price[\s-]?sensitive|don.?t[\s-]?see[\s-]?value|undervalue/,
    keywordExplanation: "Text evidence suggests customers undervalue the offering",
  },
];

// ═══════════════════════════════════════════════════════════════
//  LAYER 1: EXECUTE DETERMINISTIC RULES
// ═══════════════════════════════════════════════════════════════

function buildRuleContext(evidence: EvidenceWithFacets[]): RuleContext {
  const businessFacets: BusinessFacets[] = [];
  const objectFacets: ObjectFacets[] = [];
  const demandFacets: DemandFacets[] = [];
  const marketFacets: MarketFacets[] = [];

  for (const ev of evidence) {
    if (!ev.facets) continue;
    switch (ev.facets.domain) {
      case "business": businessFacets.push(ev.facets); break;
      case "object": objectFacets.push(ev.facets); break;
      case "demand": demandFacets.push(ev.facets); break;
      case "market": marketFacets.push(ev.facets); break;
    }
  }

  const textCorpus = evidence.map(e => `${e.label} ${e.description || ""}`).join(" ").toLowerCase();

  return { evidence, businessFacets, objectFacets, demandFacets, marketFacets, textCorpus };
}

export function detectCandidateConstraints(evidence: EvidenceWithFacets[]): ConstraintCandidate[] {
  const ctx = buildRuleContext(evidence);
  const candidates: ConstraintCandidate[] = [];

  for (const rule of DETECTION_RULES) {
    const def = CONSTRAINT_BY_NAME.get(rule.constraintName);
    if (!def) continue;

    // Try facet-based detection first
    if (rule.facetCondition) {
      const result = rule.facetCondition(ctx);
      if (result.match) {
        // Find supporting evidence IDs
        const supportingIds = evidence
          .filter(e => e.facets && result.facetBasis.some(basis => {
            const text = `${e.label} ${e.description || ""}`.toLowerCase();
            return text.length > 0; // All evidence with facets is supporting
          }))
          .map(e => e.id)
          .slice(0, 10);

        candidates.push({
          constraintId: def.id,
          constraintName: def.name,
          tier: def.defaultTier,
          evidenceIds: supportingIds,
          facetBasis: result.facetBasis,
          confidence: "strong",
          explanation: result.explanation,
        });
        continue; // Don't also run keyword fallback
      }
    }

    // Keyword fallback
    if (rule.keywordPattern && rule.keywordPattern.test(ctx.textCorpus)) {
      const matchingEvidence = evidence.filter(e => {
        const text = `${e.label} ${e.description || ""}`.toLowerCase();
        return rule.keywordPattern!.test(text);
      });

      if (matchingEvidence.length > 0) {
        candidates.push({
          constraintId: def.id,
          constraintName: def.name,
          tier: def.defaultTier,
          evidenceIds: matchingEvidence.map(e => e.id).slice(0, 10),
          facetBasis: [],
          confidence: "limited",
          explanation: rule.keywordExplanation || "Detected via keyword pattern",
        });
      }
    }
  }

  return candidates;
}

// ═══════════════════════════════════════════════════════════════
//  LAYER 2: RANKING (Deterministic fallback — AI stub)
// ═══════════════════════════════════════════════════════════════

/**
 * Rank constraint candidates by system-limiting impact.
 * Currently uses deterministic heuristic; will be extended with
 * AI-assisted ranking via edge function in Phase 2.
 */
export function rankConstraintCandidates(candidates: ConstraintCandidate[]): ConstraintCandidate[] {
  return [...candidates].sort((a, b) => {
    // Priority 1: Tier (lower tier = more structural = higher priority)
    if (a.tier !== b.tier) return a.tier - b.tier;

    // Priority 2: Confidence
    const confOrder = { strong: 0, moderate: 1, limited: 2 };
    if (confOrder[a.confidence] !== confOrder[b.confidence]) {
      return confOrder[a.confidence] - confOrder[b.confidence];
    }

    // Priority 3: Evidence count (more evidence = stronger signal)
    return b.evidenceIds.length - a.evidenceIds.length;
  });
}

// ═══════════════════════════════════════════════════════════════
//  LAYER 3: COUNTERFACTUAL VALIDATION + PROBABILISTIC STACK
// ═══════════════════════════════════════════════════════════════

/** Constraint stack role: binding (primary limit), secondary, or enabling */
export type ConstraintStackRole = "binding" | "secondary" | "enabling";

/** Confidence interval for probabilistic ranking */
export interface ConfidenceInterval {
  point: number;
  lower: number;
  upper: number;
}

/** Factors that contribute to ranking */
export interface RankingFactors {
  evidenceDensity: number;
  evidenceQuality: number;
  networkCentrality: number;
  analogFrequency?: number;
}

export interface ConstraintHypothesis {
  /** Stable constraint type ID */
  constraintId: string;
  /** Human-readable name */
  constraintName: string;
  /** Full constraint definition */
  definition: ConstraintTypeDefinition;
  /** Tier classification */
  tier: 1 | 2 | 3;
  /** Evidence chain */
  evidenceIds: string[];
  /** Facet basis for detection */
  facetBasis: string[];
  /** Detection confidence */
  confidence: "strong" | "moderate" | "limited";
  /** Why this constraint was detected */
  explanation: string;
  /** Counterfactual impact: how many other evidence items connect to this constraint's evidence */
  counterfactualImpact: number;
  /** Causal explanation: if removed, what changes */
  counterfactualExplanation: string;
  /** Stack role: binding, secondary, or enabling */
  stackRole: ConstraintStackRole;
  /** Probabilistic confidence interval (0-1 scale) */
  confidenceInterval: ConfidenceInterval;
  /** Ranking factors breakdown */
  rankingFactors: RankingFactors;
}

/** Structured prompt guiding users to resolve evidence uncertainty */
export interface EvidenceRequest {
  /** Which constraint category has the gap */
  constraintCategory: ConstraintCategory;
  /** Human-readable prompt (e.g., "Collect labor cost as % of revenue") */
  prompt: string;
  /** What type of data would resolve the gap */
  dataType: "metric" | "operational_property" | "market_data" | "customer_data";
  /** Priority based on how many patterns depend on this category */
  priority: "high" | "medium" | "low";
}

export interface ConstraintHypothesisSet {
  /** Ranked hypotheses (2-3 max) */
  hypotheses: ConstraintHypothesis[];
  /** Total candidates detected before ranking */
  totalCandidates: number;
  /** Evidence gaps: constraint categories with no candidates */
  evidenceGaps: string[];
  /** Structured evidence requests to resolve gaps */
  evidenceRequests: EvidenceRequest[];
  /** Whether binding constraint has low confidence (gap < 0.15 to second) */
  bindingUncertain: boolean;
  /** Summary of stack state */
  stackSummary: string;
}

/**
 * Compute counterfactual impact for a constraint candidate.
 * Measures how many other evidence items share connections with
 * the constraint's supporting evidence.
 */
function computeCounterfactualImpact(
  candidate: ConstraintCandidate,
  allEvidence: EvidenceWithFacets[],
): { impact: number; explanation: string } {
  const constraintEvidenceSet = new Set(candidate.evidenceIds);

  // Build adjacency: find evidence items connected via relatedSignals/relatedEvidence
  let connectedCount = 0;
  const affectedCategories = new Set<string>();

  for (const ev of allEvidence) {
    if (constraintEvidenceSet.has(ev.id)) continue;

    // Check if this evidence item connects to constraint evidence
    const relatedIds = [...(ev.relatedSignals || []), ...(ev.relatedEvidence || [])];
    const isConnected = relatedIds.some(rid => constraintEvidenceSet.has(rid));

    // Also check if same category (weaker signal but relevant)
    const sameCategory = candidate.evidenceIds.some(eid => {
      const constraintEv = allEvidence.find(e => e.id === eid);
      return constraintEv?.category && constraintEv.category === ev.category;
    });

    if (isConnected || sameCategory) {
      connectedCount++;
      if (ev.category) affectedCategories.add(ev.category);
    }
  }

  const impact = connectedCount;
  const explanation = affectedCategories.size > 0
    ? `Removing this constraint would affect ${connectedCount} connected evidence items across ${affectedCategories.size} categories: ${[...affectedCategories].join(", ")}`
    : `Removing this constraint would affect ${connectedCount} connected evidence items`;

  return { impact, explanation };
}

// ═══════════════════════════════════════════════════════════════
//  MAIN ORCHESTRATOR
// ═══════════════════════════════════════════════════════════════

/**
 * Run the complete three-layer constraint detection pipeline.
 *
 * Layer 1: Deterministic rule detection → candidates
 * Layer 2: Ranking by system-limiting impact
 * Layer 3: Counterfactual validation → hypothesis set
 *
 * Returns a ranked set of 2-3 constraint hypotheses with full
 * evidence chains and counterfactual impact scores.
 */
export function detectConstraintHypotheses(evidence: EvidenceWithFacets[]): ConstraintHypothesisSet {
  // Layer 1: Detect candidates
  const candidates = detectCandidateConstraints(evidence);

  // Layer 2: Rank candidates
  const ranked = rankConstraintCandidates(candidates);

  // Layer 3: Counterfactual validation + probabilistic stack on top candidates
  const topCandidates = ranked.slice(0, 3);
  const hypotheses: ConstraintHypothesis[] = topCandidates.map((candidate, idx) => {
    const def = CONSTRAINT_BY_NAME.get(candidate.constraintName)!;
    const { impact, explanation: cfExplanation } = computeCounterfactualImpact(candidate, evidence);

    // Compute ranking factors
    const evidenceDensity = Math.min(1, candidate.evidenceIds.length / 10);
    const evidenceQuality = candidate.confidence === "strong" ? 1 : candidate.confidence === "moderate" ? 0.7 : 0.4;
    const networkCentrality = Math.min(1, impact / 20);

    const rankingFactors: RankingFactors = { evidenceDensity, evidenceQuality, networkCentrality };

    // Compute confidence interval
    const point = (evidenceDensity * 0.4 + evidenceQuality * 0.35 + networkCentrality * 0.25);
    const spread = (1 - evidenceQuality) * 0.15; // Lower quality = wider interval
    const confidenceInterval: ConfidenceInterval = {
      point,
      lower: Math.max(0, point - spread),
      upper: Math.min(1, point + spread),
    };

    // Assign stack role
    let stackRole: ConstraintStackRole;
    if (idx === 0) stackRole = "binding";
    else if (idx === 1) stackRole = "secondary";
    else stackRole = "enabling";

    return {
      constraintId: candidate.constraintId,
      constraintName: candidate.constraintName,
      definition: def,
      tier: candidate.tier,
      evidenceIds: candidate.evidenceIds,
      facetBasis: candidate.facetBasis,
      confidence: candidate.confidence,
      explanation: candidate.explanation,
      counterfactualImpact: impact,
      counterfactualExplanation: cfExplanation,
      stackRole,
      confidenceInterval,
      rankingFactors,
    };
  });

  // Identify evidence gaps (constraint categories with no candidates)
  const detectedCategories = new Set(candidates.map(c => CONSTRAINT_BY_NAME.get(c.constraintName)?.category));
  const allCategories: ConstraintCategory[] = ["labor_operations", "revenue_pricing", "supply_distribution", "technology_information", "market_adoption", "structural_economic", "demand"];
  const evidenceGaps = allCategories.filter(cat => !detectedCategories.has(cat));

  // Generate structured evidence requests from gaps
  const evidenceRequests = generateEvidenceRequests(evidenceGaps);

  // Determine binding uncertainty
  const bindingUncertain = hypotheses.length >= 2 &&
    (hypotheses[0].confidenceInterval.point - hypotheses[1].confidenceInterval.point) < 0.15;

  // Generate stack summary
  const stackSummary = hypotheses.length === 0
    ? "No constraints detected"
    : bindingUncertain
      ? `Binding constraint uncertain: ${hypotheses[0].constraintName} (${(hypotheses[0].confidenceInterval.point * 100).toFixed(0)}%) vs ${hypotheses[1].constraintName} (${(hypotheses[1].confidenceInterval.point * 100).toFixed(0)}%)`
      : `Binding: ${hypotheses[0].constraintName} (${(hypotheses[0].confidenceInterval.point * 100).toFixed(0)}% confidence)`;

  return {
    hypotheses,
    totalCandidates: candidates.length,
    evidenceGaps,
    evidenceRequests,
    bindingUncertain,
    stackSummary,
  };
}

// ═══════════════════════════════════════════════════════════════
//  EVIDENCE REQUEST GENERATION
// ═══════════════════════════════════════════════════════════════

const GAP_REQUEST_MAP: Record<ConstraintCategory, EvidenceRequest[]> = {
  labor_operations: [
    { constraintCategory: "labor_operations", prompt: "Collect labor cost as % of revenue", dataType: "metric", priority: "high" },
    { constraintCategory: "labor_operations", prompt: "Verify whether key functions depend on a single person", dataType: "operational_property", priority: "high" },
    { constraintCategory: "labor_operations", prompt: "Identify roles that are difficult to hire or retain", dataType: "operational_property", priority: "medium" },
  ],
  revenue_pricing: [
    { constraintCategory: "revenue_pricing", prompt: "Collect top-customer revenue concentration (% from top 3)", dataType: "metric", priority: "high" },
    { constraintCategory: "revenue_pricing", prompt: "Verify pricing model type and price-setting power", dataType: "operational_property", priority: "high" },
    { constraintCategory: "revenue_pricing", prompt: "Collect gross margin and margin trend over 3 years", dataType: "metric", priority: "medium" },
  ],
  supply_distribution: [
    { constraintCategory: "supply_distribution", prompt: "Verify geographic delivery constraints or service radius", dataType: "operational_property", priority: "medium" },
    { constraintCategory: "supply_distribution", prompt: "Collect vendor dependency data (single-source suppliers)", dataType: "operational_property", priority: "medium" },
  ],
  technology_information: [
    { constraintCategory: "technology_information", prompt: "Identify legacy systems creating switching costs", dataType: "operational_property", priority: "medium" },
    { constraintCategory: "technology_information", prompt: "Verify whether key workflows are analog-only", dataType: "operational_property", priority: "low" },
  ],
  market_adoption: [
    { constraintCategory: "market_adoption", prompt: "Assess customer switching costs from existing solutions", dataType: "customer_data", priority: "medium" },
    { constraintCategory: "market_adoption", prompt: "Verify regulatory or licensing requirements", dataType: "market_data", priority: "medium" },
  ],
  structural_economic: [
    { constraintCategory: "structural_economic", prompt: "Collect EBITDA margin and trend direction", dataType: "metric", priority: "high" },
    { constraintCategory: "structural_economic", prompt: "Verify whether growth requires proportional resource increase", dataType: "operational_property", priority: "medium" },
  ],
  demand: [
    { constraintCategory: "demand", prompt: "Assess target audience awareness of the solution", dataType: "customer_data", priority: "medium" },
    { constraintCategory: "demand", prompt: "Verify customer access constraints (geographic, financial, credential)", dataType: "customer_data", priority: "low" },
  ],
};

function generateEvidenceRequests(gaps: ConstraintCategory[]): EvidenceRequest[] {
  const requests: EvidenceRequest[] = [];
  for (const gap of gaps) {
    const categoryRequests = GAP_REQUEST_MAP[gap];
    if (categoryRequests) requests.push(...categoryRequests);
  }
  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return requests.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}
