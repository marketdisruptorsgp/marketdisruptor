/**
 * PLAYBOOK ENGINE — Constraint-Triggered Strategic Transformation Paths
 *
 * Analyzes upstream evidence and insights to detect structural patterns,
 * then matches them to relevant transformation playbooks adapted to the
 * specific business context.
 *
 * Each playbook is constraint-triggered, not generic.
 * The engine produces up to 3 competing paths with scoring.
 */

import type { Evidence, EvidenceMode } from "@/lib/evidenceEngine";
import type { StrategicInsight, StrategicNarrative } from "@/lib/strategicEngine";

// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════

export type PlaybookCategory =
  | "growth"
  | "margin_expansion"
  | "capital_efficiency"
  | "distribution"
  | "defensive";

export type DisruptionArchetype =
  | "cost_collapse"
  | "platformization"
  | "modularization"
  | "unbundling"
  | "experience_redesign"
  | "vertical_integration";

export interface PlaybookImpactScore {
  revenueExpansion: number;    // 0-10
  marginImprovement: number;   // 0-10
  capitalEfficiency: number;   // 0-10
  executionDifficulty: number; // 0-10 (lower = easier)
  /** Composite: weighted average */
  leverageScore: number;       // 0-10
}

export interface PlaybookPhase {
  phase: number;
  title: string;
  description: string;
  duration: string;
}

export interface StrategicMove {
  action: string;
  modeTags: EvidenceMode[];
  evidenceIds: string[];
}

export interface ComparableTransformation {
  from: string;
  to: string;
  example?: string;
}

export interface TransformationPlaybook {
  id: string;
  title: string;
  strategicThesis: string;
  currentIndustryLogic: string;
  strategicShift: string;
  moves: StrategicMove[];
  whyThisWorks: string[];
  phases: PlaybookPhase[];
  validationQuestion: string;
  killMetric: string;
  dayOneAction: string;
  impact: PlaybookImpactScore;
  category: PlaybookCategory;
  archetype: DisruptionArchetype | null;
  triggerConstraints: string[];
  triggerSignals: string[];
  confidence: number;
  isRecommended: boolean;
  /** Whether this playbook was triggered by a user challenge/hypothesis */
  triggeredByHypothesis: boolean;
  /** Comparable transformations for pattern recognition */
  comparables: ComparableTransformation[];
}

// ═══════════════════════════════════════════════════════════════
//  PLAYBOOK TEMPLATES
// ═══════════════════════════════════════════════════════════════

interface PlaybookTemplate {
  id: string;
  title: string;
  category: PlaybookCategory;
  archetype: DisruptionArchetype | null;
  triggerKeywords: string[];
  thesisTemplate: string;
  industryLogicTemplate: string;
  shiftTemplate: string;
  whyItWorks: string[];
  phases: PlaybookPhase[];
  baseImpact: Omit<PlaybookImpactScore, "leverageScore">;
}

const PLAYBOOK_TEMPLATES: PlaybookTemplate[] = [
  {
    id: "custom-to-productized",
    title: "Custom Work → Productized Systems",
    category: "margin_expansion",
    archetype: "modularization",
    triggerKeywords: [
      "custom", "bespoke", "project-based", "long lead", "low repeatability",
      "custom project", "one-off", "tailored", "made to order", "high variability",
      "unique specifications", "non-standard", "limited scaling",
    ],
    thesisTemplate: "Convert custom deliverables into configurable, repeatable product systems that scale without proportional labor increase.",
    industryLogicTemplate: "The industry assumes customers require fully custom solutions, leading to high labor costs, long timelines, and unpredictable margins.",
    shiftTemplate: "Standardize the 80% of work that's repetitive into configurable modules, reserving true customization for premium tiers only.",
    whyItWorks: [
      "Repeatable production reduces per-unit cost",
      "Shorter delivery cycles improve cash flow",
      "Scalable sales process (sell configurations, not projects)",
      "Higher margin consistency across contracts",
      "Expanded addressable market (smaller buyers can afford standard options)",
    ],
    phases: [
      { phase: 1, title: "Pattern Discovery", description: "Analyze past projects to identify repeatable components and common configurations.", duration: "2-4 weeks" },
      { phase: 2, title: "Product Prototype", description: "Develop the first configurable product offering from the most common pattern.", duration: "4-8 weeks" },
      { phase: 3, title: "Market Pilot", description: "Test with 3-5 anchor customers using simplified pricing and faster delivery.", duration: "6-12 weeks" },
      { phase: 4, title: "Operational Standardization", description: "Document processes, build production templates, and train the team on the new model.", duration: "8-16 weeks" },
    ],
    baseImpact: { revenueExpansion: 7, marginImprovement: 8, capitalEfficiency: 7, executionDifficulty: 5 },
  },
  {
    id: "labor-to-process",
    title: "Labor Heavy → Process Heavy",
    category: "margin_expansion",
    archetype: "cost_collapse",
    triggerKeywords: [
      "labor intensive", "manual", "headcount", "skilled labor", "workforce",
      "human capital", "training", "hiring", "staff", "personnel",
      "high labor cost", "labor shortage", "burnout", "turnover",
    ],
    thesisTemplate: "Replace labor-dependent value delivery with process-driven systems that reduce headcount sensitivity and improve consistency.",
    industryLogicTemplate: "The business relies on skilled labor as the primary value delivery mechanism, creating scaling bottlenecks and margin compression as wages rise.",
    shiftTemplate: "Systematize expertise into documented processes, templates, and automation — making output quality independent of individual skill levels.",
    whyItWorks: [
      "Reduced dependency on hard-to-find skilled workers",
      "Consistent quality regardless of team composition",
      "Lower marginal cost per unit of output",
      "Faster onboarding of new team members",
      "Scalable without proportional headcount growth",
    ],
    phases: [
      { phase: 1, title: "Knowledge Capture", description: "Document the tacit expertise of top performers into process playbooks.", duration: "3-6 weeks" },
      { phase: 2, title: "Process Design", description: "Build standardized workflows, checklists, and quality gates.", duration: "4-8 weeks" },
      { phase: 3, title: "Tool Integration", description: "Introduce automation tools for the highest-friction manual steps.", duration: "6-12 weeks" },
      { phase: 4, title: "Scale & Measure", description: "Deploy across the organization and measure output consistency vs. labor input.", duration: "8-16 weeks" },
    ],
    baseImpact: { revenueExpansion: 5, marginImprovement: 8, capitalEfficiency: 6, executionDifficulty: 6 },
  },
  {
    id: "direct-to-channel",
    title: "Direct Sales → Channel Distribution",
    category: "distribution",
    archetype: "platformization",
    triggerKeywords: [
      "direct sales", "sales team", "relationship-driven", "founder sales",
      "sales bottleneck", "pipeline", "cold outreach", "limited reach",
      "geographic constraint", "single channel", "referral dependent",
    ],
    thesisTemplate: "Shift from founder/team-dependent direct sales to a scalable channel distribution model that multiplies reach without multiplying headcount.",
    industryLogicTemplate: "Revenue growth is bottlenecked by the sales team's capacity. Each new customer requires direct engagement, limiting throughput.",
    shiftTemplate: "Build a partner/channel ecosystem where third parties sell, deliver, or recommend the product — turning sales from a cost center into a platform.",
    whyItWorks: [
      "Revenue scales with partner count, not headcount",
      "Geographic expansion without physical presence",
      "Lower customer acquisition cost through warm channels",
      "Partners provide market intelligence and feedback loops",
      "Defensive moat through partner lock-in",
    ],
    phases: [
      { phase: 1, title: "Channel Mapping", description: "Identify 10+ potential channel partners who serve your target customers.", duration: "2-4 weeks" },
      { phase: 2, title: "Partner Proposition", description: "Design the economics, enablement kit, and co-marketing framework.", duration: "4-6 weeks" },
      { phase: 3, title: "Pilot Partners", description: "Onboard 2-3 pilot partners and measure conversion, retention, and economics.", duration: "8-12 weeks" },
      { phase: 4, title: "Channel Scaling", description: "Systematize partner onboarding and build self-serve enablement infrastructure.", duration: "12-24 weeks" },
    ],
    baseImpact: { revenueExpansion: 9, marginImprovement: 5, capitalEfficiency: 7, executionDifficulty: 6 },
  },
  {
    id: "capex-to-asset-light",
    title: "CapEx Heavy → Asset-Light Model",
    category: "capital_efficiency",
    archetype: "unbundling",
    triggerKeywords: [
      "capital intensive", "asset heavy", "equipment", "inventory",
      "working capital", "cash cycle", "cash conversion", "capex",
      "fixed costs", "overhead", "depreciation", "financing",
      "cash tied up", "delayed payment", "payment cycle",
    ],
    thesisTemplate: "Restructure the business model to reduce capital intensity — shifting from owning assets to orchestrating access, reducing cash tied in operations.",
    industryLogicTemplate: "The current model requires significant upfront capital for equipment, inventory, or working capital before revenue is realized, limiting growth velocity.",
    shiftTemplate: "Unbundle ownership from access: lease instead of buy, pre-sell before building, or partner with asset holders rather than competing on capital.",
    whyItWorks: [
      "Dramatically shorter cash conversion cycle",
      "Lower barrier to scaling (less capital per unit of growth)",
      "Reduced balance sheet risk",
      "Higher return on invested capital",
      "More attractive to investors and acquirers",
    ],
    phases: [
      { phase: 1, title: "Capital Audit", description: "Map every dollar of working capital and identify the slowest-returning assets.", duration: "1-2 weeks" },
      { phase: 2, title: "Model Redesign", description: "Design alternative structures: pre-payment, leasing, partner-funded, or subscription.", duration: "3-6 weeks" },
      { phase: 3, title: "Pilot Transition", description: "Test the new capital model with a subset of operations or customers.", duration: "6-12 weeks" },
      { phase: 4, title: "Full Migration", description: "Roll out the asset-light model across the business and measure capital efficiency gains.", duration: "12-24 weeks" },
    ],
    baseImpact: { revenueExpansion: 4, marginImprovement: 6, capitalEfficiency: 10, executionDifficulty: 7 },
  },
  {
    id: "broad-to-vertical",
    title: "Broad Market → Vertical Specialization",
    category: "growth",
    archetype: "vertical_integration",
    triggerKeywords: [
      "broad market", "generalist", "undifferentiated", "commodity",
      "price competition", "no moat", "low switching cost", "fragmented",
      "many competitors", "race to bottom", "margin pressure",
      "no specialization", "jack of all trades",
    ],
    thesisTemplate: "Dominate a specific vertical by becoming the go-to solution for a well-defined segment, commanding premium pricing and building a defensible position.",
    industryLogicTemplate: "The business serves a broad market with a generalist approach, competing on price with many similar providers and struggling to differentiate.",
    shiftTemplate: "Pick the highest-value vertical segment, go deep on their specific needs, and build domain expertise that generalists can't replicate.",
    whyItWorks: [
      "Premium pricing justified by specialized expertise",
      "Stronger word-of-mouth within tight communities",
      "Higher switching costs (domain-specific integrations)",
      "Efficient marketing (targeted channels, specific language)",
      "Defensible market position against generalist competitors",
    ],
    phases: [
      { phase: 1, title: "Segment Analysis", description: "Evaluate current customers by vertical: revenue, margin, retention, and referral rates.", duration: "1-3 weeks" },
      { phase: 2, title: "Vertical Selection", description: "Choose one vertical based on highest LTV, lowest CAC, and strongest product fit.", duration: "1-2 weeks" },
      { phase: 3, title: "Deep Customization", description: "Adapt product/service, messaging, and onboarding specifically for the chosen vertical.", duration: "4-8 weeks" },
      { phase: 4, title: "Vertical Domination", description: "Build case studies, partnerships, and content that establish authority in the vertical.", duration: "8-16 weeks" },
    ],
    baseImpact: { revenueExpansion: 7, marginImprovement: 7, capitalEfficiency: 5, executionDifficulty: 4 },
  },
  {
    id: "one-time-to-recurring",
    title: "One-Time Revenue → Recurring Revenue",
    category: "growth",
    archetype: "experience_redesign",
    triggerKeywords: [
      "one-time", "project revenue", "transactional", "unpredictable revenue",
      "feast or famine", "lumpy", "no recurring", "contract-based",
      "new customer dependent", "churn", "retention",
    ],
    thesisTemplate: "Transform transactional revenue into predictable recurring income through subscription, retainer, or usage-based pricing models.",
    industryLogicTemplate: "Revenue depends on continuously winning new projects or customers, creating unpredictable cash flow and high acquisition costs.",
    shiftTemplate: "Identify the ongoing value the business delivers and package it as a continuous service — turning one-time buyers into long-term subscribers.",
    whyItWorks: [
      "Predictable, compounding revenue stream",
      "Higher customer lifetime value",
      "Lower customer acquisition cost (retention > acquisition)",
      "Higher valuation multiples from investors",
      "Operational stability and better planning",
    ],
    phases: [
      { phase: 1, title: "Value Mapping", description: "Identify ongoing value you deliver that customers currently pay for one-off.", duration: "2-3 weeks" },
      { phase: 2, title: "Model Design", description: "Create pricing tiers and packaging for recurring delivery.", duration: "3-6 weeks" },
      { phase: 3, title: "Conversion Pilot", description: "Offer existing clients the option to convert to recurring terms with an incentive.", duration: "6-12 weeks" },
      { phase: 4, title: "Retention Engine", description: "Build onboarding, success metrics, and expansion triggers to maximize LTV.", duration: "12-24 weeks" },
    ],
    baseImpact: { revenueExpansion: 9, marginImprovement: 6, capitalEfficiency: 8, executionDifficulty: 5 },
  },
];

// ═══════════════════════════════════════════════════════════════
//  TRIGGER DETECTION
// ═══════════════════════════════════════════════════════════════

function computeTemplateMatch(
  template: PlaybookTemplate,
  evidence: Evidence[],
  insights: StrategicInsight[],
  narrative: StrategicNarrative | null,
): { score: number; matchedSignals: string[]; matchedEvidenceIds: string[] } {
  const corpus = [
    ...evidence.map(e => `${e.label} ${e.description || ""}`),
    ...insights.map(i => `${i.label} ${i.description}`),
    narrative?.primaryConstraint || "",
    narrative?.keyDriver || "",
    narrative?.leveragePoint || "",
    narrative?.breakthroughOpportunity || "",
    narrative?.strategicVerdict || "",
    narrative?.narrativeSummary || "",
  ].join(" ").toLowerCase();

  let matchCount = 0;
  const matchedSignals: string[] = [];
  const matchedEvidenceIds: string[] = [];

  for (const keyword of template.triggerKeywords) {
    if (corpus.includes(keyword.toLowerCase())) {
      matchCount++;
      matchedSignals.push(keyword);
    }
  }

  // Also match evidence directly
  for (const ev of evidence) {
    const evText = `${ev.label} ${ev.description || ""}`.toLowerCase();
    if (template.triggerKeywords.some(k => evText.includes(k.toLowerCase()))) {
      matchedEvidenceIds.push(ev.id);
    }
  }

  const score = template.triggerKeywords.length > 0
    ? matchCount / template.triggerKeywords.length
    : 0;

  return { score, matchedSignals, matchedEvidenceIds: [...new Set(matchedEvidenceIds)] };
}

// ═══════════════════════════════════════════════════════════════
//  PLAYBOOK GENERATION
// ═══════════════════════════════════════════════════════════════

// ── Comparable Transformations Map ──
const COMPARABLE_MAP: Record<string, ComparableTransformation[]> = {
  "custom-to-productized": [
    { from: "Custom Consulting", to: "Productized Services", example: "Accenture → pre-packaged digital transformation modules" },
    { from: "Custom Manufacturing", to: "Modular Products", example: "Dell → build-to-order configurable systems" },
    { from: "Agency Work", to: "SaaS Platform", example: "HubSpot started as a consulting firm → self-serve marketing platform" },
  ],
  "labor-to-process": [
    { from: "Manual Underwriting", to: "Automated Scoring", example: "Lemonade → AI-driven insurance in seconds" },
    { from: "Handcrafted Reports", to: "Automated Dashboards", example: "Tableau → self-serve analytics replacing analyst teams" },
    { from: "Manual QA", to: "Automated Testing", example: "Tesla → software-defined quality checks" },
  ],
  "direct-to-channel": [
    { from: "Direct Enterprise Sales", to: "Partner Ecosystem", example: "Salesforce → AppExchange partner network" },
    { from: "Founder-Led Sales", to: "Marketplace Distribution", example: "Shopify → app store + partner program" },
    { from: "Field Sales", to: "Inside Sales + Partners", example: "Zoom → channel-first GTM at scale" },
  ],
  "capex-to-asset-light": [
    { from: "Hotel Ownership", to: "Platform Model", example: "Airbnb → zero-asset hospitality" },
    { from: "Fleet Ownership", to: "Driver Network", example: "Uber → asset-light transportation" },
    { from: "Server Farms", to: "Cloud Infrastructure", example: "Netflix → AWS migration from own data centers" },
  ],
  "broad-to-vertical": [
    { from: "Generic CRM", to: "Vertical CRM", example: "Veeva → pharma-specific Salesforce vertical" },
    { from: "General Contractor", to: "Healthcare Construction", example: "Skanska → hospital-specialized building" },
    { from: "Horizontal SaaS", to: "Industry Platform", example: "Toast → restaurant-specific POS + operations" },
  ],
  "one-time-to-recurring": [
    { from: "Software Licenses", to: "SaaS Subscription", example: "Adobe → Creative Cloud transformation" },
    { from: "One-Time Projects", to: "Managed Services", example: "IBM → consulting to managed cloud services" },
    { from: "Product Sales", to: "Subscription Box", example: "Dollar Shave Club → razors as a subscription" },
  ],
};

function adaptTemplate(
  template: PlaybookTemplate,
  matchedSignals: string[],
  matchedEvidenceIds: string[],
  narrative: StrategicNarrative | null,
  mode: EvidenceMode,
  confidence: number,
  isTop: boolean,
  evidence: Evidence[] = [],
): TransformationPlaybook {
  const constraint = narrative?.primaryConstraint || "structural bottleneck";
  const opportunity = narrative?.breakthroughOpportunity || "strategic transformation";

  // Detect if triggered by user hypothesis
  const triggeredByHypothesis = evidence.some(e =>
    e.id?.startsWith("challenge-") &&
    template.triggerKeywords.some(k =>
      `${e.label} ${e.description || ""}`.toLowerCase().includes(k.toLowerCase())
    )
  );

  const moves: StrategicMove[] = [];
  const modeTag: EvidenceMode = mode;

  if (template.id === "custom-to-productized") {
    moves.push(
      { action: `Audit past deliverables to identify the most repeated 80% of work`, modeTags: [modeTag], evidenceIds: matchedEvidenceIds.slice(0, 2) },
      { action: `Design a configurable system from the most common project pattern`, modeTags: ["product", modeTag], evidenceIds: matchedEvidenceIds.slice(0, 3) },
      { action: `Create tiered pricing: standard (configurable) vs. premium (custom)`, modeTags: ["business_model"], evidenceIds: [] },
      { action: `Pilot with existing clients who have done repeat orders`, modeTags: [modeTag], evidenceIds: matchedEvidenceIds.slice(0, 2) },
    );
  } else if (template.id === "labor-to-process") {
    moves.push(
      { action: `Document the top 5 workflows that consume the most skilled labor hours`, modeTags: [modeTag], evidenceIds: matchedEvidenceIds.slice(0, 2) },
      { action: `Build process templates and checklists for the highest-volume tasks`, modeTags: ["service", modeTag], evidenceIds: [] },
      { action: `Introduce automation or tooling for the single highest-friction step`, modeTags: ["product"], evidenceIds: matchedEvidenceIds.slice(0, 1) },
    );
  } else if (template.id === "direct-to-channel") {
    moves.push(
      { action: `Identify 10 potential channel partners who already serve your customers`, modeTags: [modeTag], evidenceIds: matchedEvidenceIds.slice(0, 2) },
      { action: `Design a partner economics model (margin split, enablement, co-marketing)`, modeTags: ["business_model"], evidenceIds: [] },
      { action: `Create a self-serve partner onboarding kit`, modeTags: ["product", "service"], evidenceIds: [] },
    );
  } else if (template.id === "capex-to-asset-light") {
    moves.push(
      { action: `Map every dollar of working capital to its return timeline`, modeTags: ["business_model"], evidenceIds: matchedEvidenceIds.slice(0, 3) },
      { action: `Redesign payment terms: require deposits or milestone payments`, modeTags: ["business_model", modeTag], evidenceIds: matchedEvidenceIds.slice(0, 2) },
      { action: `Evaluate lease/partner alternatives for the most capital-intensive assets`, modeTags: [modeTag], evidenceIds: [] },
    );
  } else if (template.id === "broad-to-vertical") {
    moves.push(
      { action: `Rank current customers by vertical: revenue, margin, retention, referral`, modeTags: ["business_model"], evidenceIds: matchedEvidenceIds.slice(0, 2) },
      { action: `Select the single highest-value vertical and rebrand messaging for it`, modeTags: [modeTag], evidenceIds: [] },
      { action: `Build vertical-specific case studies and integrations`, modeTags: ["product", "service"], evidenceIds: [] },
    );
  } else {
    moves.push(
      { action: `Analyze current revenue model for recurring value delivery opportunities`, modeTags: ["business_model"], evidenceIds: matchedEvidenceIds.slice(0, 2) },
      { action: `Design tiered subscription/retainer packages from ongoing services`, modeTags: [modeTag], evidenceIds: [] },
      { action: `Offer conversion incentives to existing one-time customers`, modeTags: ["business_model", modeTag], evidenceIds: [] },
    );
  }

  const validationQ = narrative?.killQuestion
    || `Will target customers accept the ${template.title.split("→")[1]?.trim() || "new"} model over the current approach?`;

  const killMetric = `Abandon this path if fewer than 2 of 10 pilot customers show interest in the ${template.title.split("→")[1]?.trim() || "new model"} within 30 days.`;

  const dayOne = narrative?.validationExperiment
    || `Reach out to your 3 best customers and ask: "Would you buy a ${template.title.split("→")[1]?.trim()?.toLowerCase() || "standardized version"} if it meant faster delivery and lower cost?"`;

  const leverageScore = (
    template.baseImpact.revenueExpansion * 0.3 +
    template.baseImpact.marginImprovement * 0.3 +
    template.baseImpact.capitalEfficiency * 0.25 -
    template.baseImpact.executionDifficulty * 0.15
  );

  return {
    id: template.id,
    title: template.title,
    strategicThesis: template.thesisTemplate,
    currentIndustryLogic: template.industryLogicTemplate,
    strategicShift: template.shiftTemplate,
    moves: moves.filter((m, i, arr) => arr.findIndex(x => x.action === m.action) === i),
    whyThisWorks: template.whyItWorks,
    phases: template.phases,
    validationQuestion: validationQ,
    killMetric,
    dayOneAction: dayOne,
    impact: { ...template.baseImpact, leverageScore: Math.round(leverageScore * 10) / 10 },
    category: template.category,
    archetype: template.archetype,
    triggerConstraints: matchedSignals,
    triggerSignals: matchedSignals,
    confidence,
    isRecommended: isTop,
    triggeredByHypothesis,
    comparables: COMPARABLE_MAP[template.id] || [],
  };
}

export function generatePlaybooks(
  evidence: Evidence[],
  insights: StrategicInsight[],
  narrative: StrategicNarrative | null,
  mode: EvidenceMode,
): TransformationPlaybook[] {
  if (evidence.length < 3 && insights.length < 2) return [];

  // Score each template against the current analysis
  const scored = PLAYBOOK_TEMPLATES.map(template => {
    const match = computeTemplateMatch(template, evidence, insights, narrative);
    return { template, ...match };
  })
    .filter(s => s.score > 0.05) // Must match at least something
    .sort((a, b) => b.score - a.score)
    .slice(0, 3); // Top 3

  if (scored.length === 0) {
    // Fallback: generate from top 2 templates if we have enough evidence
    if (evidence.length >= 5) {
      const fallback = PLAYBOOK_TEMPLATES.slice(0, 2).map((t, idx) => ({
        template: t,
        score: 0.15 - idx * 0.05,
        matchedSignals: [],
        matchedEvidenceIds: evidence.slice(0, 3).map(e => e.id),
      }));
      return fallback.map((s, idx) =>
        adaptTemplate(s.template, s.matchedSignals, s.matchedEvidenceIds, narrative, mode, s.score * 0.5, idx === 0)
      );
    }
    return [];
  }

  return scored.map((s, idx) =>
    adaptTemplate(s.template, s.matchedSignals, s.matchedEvidenceIds, narrative, mode, Math.min(s.score, 0.95), idx === 0)
  );
}

export function getCategoryLabel(cat: PlaybookCategory): string {
  const map: Record<PlaybookCategory, string> = {
    growth: "Growth",
    margin_expansion: "Margin Expansion",
    capital_efficiency: "Capital Efficiency",
    distribution: "Distribution",
    defensive: "Defensive Strategy",
  };
  return map[cat] || cat;
}

export function getArchetypeLabel(arch: DisruptionArchetype | null): string | null {
  if (!arch) return null;
  const map: Record<DisruptionArchetype, string> = {
    cost_collapse: "Cost Collapse",
    platformization: "Platformization",
    modularization: "Modularization",
    unbundling: "Unbundling",
    experience_redesign: "Experience Redesign",
    vertical_integration: "Vertical Integration",
  };
  return map[arch] || null;
}
