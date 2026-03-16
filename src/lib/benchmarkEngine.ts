/**
 * INDUSTRY BENCHMARK ENGINE
 *
 * 1. Classifies the business into a Model Archetype
 * 2. Benchmarks against archetype-specific structural patterns
 * 3. Computes 2-axis opportunity map (Impact × Difficulty)
 * 4. Generates evidence-referenced strategic narrative
 */

import type { Evidence } from "@/lib/evidenceEngine";
import type { StrategicNarrative } from "@/lib/strategicEngine";
import type { TransformationPlaybook } from "@/lib/playbookEngine";
import { translateConstraintToBusinessLanguage } from "@/lib/businessLanguage";

/* ══════════════════════════════════════════════════════════════
   MODEL ARCHETYPES
   ══════════════════════════════════════════════════════════════ */

export type ModelArchetype =
  | "service_project"
  | "productized_service"
  | "saas_platform"
  | "marketplace"
  | "manufacturing"
  | "agency"
  | "consulting"
  | "ecommerce"
  | "hybrid";

interface ArchetypeProfile {
  id: ModelArchetype;
  label: string;
  keywords: string[];
  /** Typical benchmark ranges for this archetype (0-10) */
  typicalMargin: number;
  typicalScalability: number;
  typicalDifficulty: number;
  typicalDemand: number;
  typicalCompetition: number;
}

const ARCHETYPE_PROFILES: ArchetypeProfile[] = [
  {
    id: "service_project", label: "Service Project Model",
    keywords: ["custom", "bespoke", "project-based", "labor", "one-off", "tailored", "handmade", "crafted", "made to order", "artisan"],
    typicalMargin: 4, typicalScalability: 3, typicalDifficulty: 5, typicalDemand: 6, typicalCompetition: 5,
  },
  {
    id: "productized_service", label: "Productized Service Model",
    keywords: ["productized", "package", "tier", "subscription", "repeatable", "standardized", "recurring"],
    typicalMargin: 6, typicalScalability: 7, typicalDifficulty: 4, typicalDemand: 7, typicalCompetition: 6,
  },
  {
    id: "saas_platform", label: "SaaS Platform Model",
    keywords: ["saas", "platform", "software", "cloud", "api", "digital", "automated"],
    typicalMargin: 8, typicalScalability: 9, typicalDifficulty: 7, typicalDemand: 7, typicalCompetition: 8,
  },
  {
    id: "marketplace", label: "Marketplace Model",
    keywords: ["marketplace", "two-sided", "network effect", "matching", "aggregator"],
    typicalMargin: 5, typicalScalability: 8, typicalDifficulty: 8, typicalDemand: 8, typicalCompetition: 7,
  },
  {
    id: "manufacturing", label: "Manufacturing Model",
    keywords: ["manufacturing", "production", "factory", "assembly", "fabrication", "inventory", "supply chain"],
    typicalMargin: 5, typicalScalability: 5, typicalDifficulty: 6, typicalDemand: 5, typicalCompetition: 5,
  },
  {
    id: "agency", label: "Agency Model",
    keywords: ["agency", "creative", "marketing", "design", "branding", "campaign"],
    typicalMargin: 5, typicalScalability: 3, typicalDifficulty: 4, typicalDemand: 6, typicalCompetition: 7,
  },
  {
    id: "consulting", label: "Consulting Model",
    keywords: ["consulting", "advisory", "strategy", "expertise", "professional services"],
    typicalMargin: 6, typicalScalability: 2, typicalDifficulty: 3, typicalDemand: 5, typicalCompetition: 6,
  },
  {
    id: "ecommerce", label: "E-Commerce Model",
    keywords: ["ecommerce", "online store", "retail", "direct to consumer", "d2c", "shop"],
    typicalMargin: 4, typicalScalability: 7, typicalDifficulty: 5, typicalDemand: 7, typicalCompetition: 8,
  },
];

/* ── Archetype Classifier ── */

export function classifyArchetype(evidence: Evidence[], narrative: StrategicNarrative | null, biExtraction?: Record<string, any> | null): ArchetypeProfile {
  const allText = [
    ...evidence.map(e => `${e.label || ""} ${e.description || ""} ${e.category || ""}`),
    narrative?.primaryConstraint || "",
    narrative?.strategicVerdict || "",
    narrative?.breakthroughOpportunity || "",
    // Include biExtraction signals for better classification
    biExtraction?.business_overview?.company_name || "",
    biExtraction?.business_overview?.description || "",
    biExtraction?.business_overview?.industry || "",
    biExtraction?.business_overview?.business_model || "",
    biExtraction?.business_overview?.services_offered || "",
    biExtraction?.business_overview?.products_offered || "",
    ...(Array.isArray(biExtraction?.revenue_sources) ? biExtraction.revenue_sources.map((r: any) => r?.source || r?.name || "") : []),
    ...(Array.isArray(biExtraction?.cost_drivers) ? biExtraction.cost_drivers.map((c: any) => c?.driver || c?.name || "") : []),
  ].join(" ").toLowerCase();

  let bestMatch: ArchetypeProfile = ARCHETYPE_PROFILES[0];
  let bestScore = 0;

  for (const arch of ARCHETYPE_PROFILES) {
    const score = arch.keywords.reduce((sum, kw) => {
      const regex = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      const matches = allText.match(regex);
      return sum + (matches?.length || 0);
    }, 0);
    if (score > bestScore) { bestScore = score; bestMatch = arch; }
  }

  // Default to hybrid if very weak match
  if (bestScore < 2) {
    return {
      id: "hybrid", label: "Hybrid Business Model",
      keywords: [], typicalMargin: 5, typicalScalability: 5,
      typicalDifficulty: 5, typicalDemand: 5, typicalCompetition: 5,
    };
  }

  return bestMatch;
}

/* ══════════════════════════════════════════════════════════════
   BENCHMARK TYPES & COMPUTATION
   ══════════════════════════════════════════════════════════════ */

export interface BenchmarkMetric {
  label: string;
  rating: "above_average" | "average" | "below_average";
  rationale: string;
  score: number;
}

export interface BenchmarkResult {
  metrics: BenchmarkMetric[];
  summary: string;
  modelType: string;
  archetype: ModelArchetype;
}

function ratingVsArchetype(actual: number, typical: number): "above_average" | "average" | "below_average" {
  if (actual >= typical + 2) return "above_average";
  if (actual <= typical - 2) return "below_average";
  return "average";
}

export function computeBenchmarks(
  evidence: Evidence[],
  narrative: StrategicNarrative | null,
  playbook: TransformationPlaybook | null,
  biExtraction?: Record<string, any> | null,
): BenchmarkResult {
  const arch = classifyArchetype(evidence, narrative, biExtraction);

  // Derive actual scores from evidence + playbook
  const catCounts = new Map<string, number>();
  for (const e of evidence) {
    const cat = e.category || "general";
    catCounts.set(cat, (catCounts.get(cat) || 0) + 1);
  }

  const demandScore = Math.min(10, (catCounts.get("demand_signal") || 0) * 1.5 + 2);
  const costScore = Math.min(10, 10 - (catCounts.get("cost_structure") || 0) * 0.8);
  const marginScore = playbook ? playbook.impact.marginImprovement : Math.round((costScore + (10 - (catCounts.get("operational_dependency") || 0))) / 2);
  const scalabilityScore = playbook ? playbook.impact.revenueExpansion : Math.round(demandScore * 0.7);
  const difficultyScore = playbook ? playbook.impact.executionDifficulty : 5;

  const metrics: BenchmarkMetric[] = [
    {
      label: "Margin Potential",
      rating: ratingVsArchetype(marginScore, arch.typicalMargin),
      score: marginScore,
      rationale: ratingVsArchetype(marginScore, arch.typicalMargin) === "above_average"
        ? `Margin signals are stronger than typical ${arch.label.toLowerCase()} businesses`
        : ratingVsArchetype(marginScore, arch.typicalMargin) === "below_average"
          ? `Margin is below typical ${arch.label.toLowerCase()} benchmarks — structural cost issues likely`
          : `Margin is in line with typical ${arch.label.toLowerCase()} economics`,
    },
    {
      label: "Scalability",
      rating: ratingVsArchetype(scalabilityScore, arch.typicalScalability),
      score: scalabilityScore,
      rationale: ratingVsArchetype(scalabilityScore, arch.typicalScalability) === "above_average"
        ? `Growth potential exceeds typical ${arch.label.toLowerCase()} scaling patterns`
        : ratingVsArchetype(scalabilityScore, arch.typicalScalability) === "below_average"
          ? `Scaling is more constrained than similar ${arch.label.toLowerCase()} businesses`
          : `Scalability is consistent with ${arch.label.toLowerCase()} norms`,
    },
    {
      label: "Execution Difficulty",
      rating: ratingVsArchetype(10 - difficultyScore, 10 - arch.typicalDifficulty),
      score: difficultyScore,
      rationale: difficultyScore <= 3
        ? "Low execution barriers compared to archetype peers"
        : difficultyScore <= 6
          ? `Moderate change required — typical for ${arch.label.toLowerCase()} transformations`
          : `Significant restructuring needed — above-average difficulty for this model type`,
    },
    {
      label: "Demand Strength",
      rating: ratingVsArchetype(demandScore, arch.typicalDemand),
      score: demandScore,
      rationale: ratingVsArchetype(demandScore, arch.typicalDemand) === "above_average"
        ? `Demand indicators are stronger than typical ${arch.label.toLowerCase()} businesses`
        : ratingVsArchetype(demandScore, arch.typicalDemand) === "below_average"
          ? `Demand signals are weaker than ${arch.label.toLowerCase()} benchmarks`
          : `Demand levels are consistent with ${arch.label.toLowerCase()} patterns`,
    },
  ];

  const aboveCount = metrics.filter(m => m.rating === "above_average").length;
  const belowCount = metrics.filter(m => m.rating === "below_average").length;

  const summary = aboveCount >= 3
    ? `Compared to similar ${arch.label.toLowerCase()} businesses, this model shows above-average potential across most dimensions.`
    : belowCount >= 3
      ? `Compared to similar ${arch.label.toLowerCase()} businesses, this model faces structural challenges — but targeted moves can address them.`
      : `Compared to similar ${arch.label.toLowerCase()} businesses, this model shows mixed signals with clear areas for strategic improvement.`;

  return { metrics, summary, modelType: arch.label, archetype: arch.id };
}

/* ══════════════════════════════════════════════════════════════
   OPPORTUNITY MAP — 2-Axis (Impact × Difficulty)
   ══════════════════════════════════════════════════════════════ */

export type OpportunityQuadrant =
  | "immediate_priority"   // High Impact, Low Difficulty
  | "transformation"       // High Impact, High Difficulty
  | "quick_win"           // Low Impact, Low Difficulty
  | "avoid";              // Low Impact, High Difficulty

export interface OpportunityMapItem {
  label: string;
  quadrant: OpportunityQuadrant;
  impact: number;        // 0-10
  difficulty: number;    // 0-10
  description: string;
  leverageScore: number;
}

export function computeOpportunityMap(
  playbooks: TransformationPlaybook[],
  evidence: Evidence[],
  narrative: StrategicNarrative | null,
): OpportunityMapItem[] {
  const items: OpportunityMapItem[] = [];

  for (const pb of playbooks) {
    const impact = (pb.impact.revenueExpansion + pb.impact.marginImprovement) / 2;
    const difficulty = pb.impact.executionDifficulty;

    const quadrant: OpportunityQuadrant =
      impact >= 5 && difficulty < 5 ? "immediate_priority"
        : impact >= 5 && difficulty >= 5 ? "transformation"
          : impact < 5 && difficulty < 5 ? "quick_win"
            : "avoid";

    items.push({
      label: pb.title,
      quadrant,
      impact,
      difficulty,
      description: pb.strategicThesis.length > 80 ? pb.strategicThesis.slice(0, 77) + "…" : pb.strategicThesis,
      leverageScore: pb.impact.leverageScore,
    });
  }

  // Add narrative opportunity if not duplicate
  if (narrative?.breakthroughOpportunity && !items.some(i => i.label.includes(narrative.breakthroughOpportunity!.slice(0, 20)))) {
    items.push({
      label: narrative.breakthroughOpportunity,
      quadrant: "immediate_priority",
      impact: 8, difficulty: 4,
      description: "Breakthrough opportunity from structural analysis",
      leverageScore: 8,
    });
  }

  items.sort((a, b) => b.leverageScore - a.leverageScore);
  return items.slice(0, 6);
}

/* ══════════════════════════════════════════════════════════════
   STRATEGIC NARRATIVE STORY (evidence-referenced)
   ══════════════════════════════════════════════════════════════ */

export interface StrategicNarrativeStory {
  paragraphs: string[];
  impactLine: string;
}

export function generateStrategicStory(
  narrative: StrategicNarrative | null,
  playbook: TransformationPlaybook | null,
  evidence: Evidence[],
): StrategicNarrativeStory {
  if (!narrative) {
    return {
      paragraphs: [],
      impactLine: "",
    };
  }

  const paragraphs: string[] = [];

  // Evidence counts by category
  const catCounts = new Map<string, number>();
  for (const e of evidence) {
    const cat = e.category || "general";
    catCounts.set(cat, (catCounts.get(cat) || 0) + 1);
  }
  const demandCount = catCounts.get("demand_signal") || 0;
  const costCount = catCounts.get("cost_structure") || 0;
  const opCount = catCounts.get("operational_dependency") || 0;
  const compCount = catCounts.get("competitive_pressure") || 0;
  const custCount = catCounts.get("customer_behavior") || 0;

  // P1 — The constraint (with evidence reference)
  if (narrative.primaryConstraint) {
    const constraintEvidence = opCount + costCount;
    const evidenceRef = constraintEvidence > 0
      ? `, supported by ${constraintEvidence} structural indicator${constraintEvidence !== 1 ? "s" : ""} across cost and operational data`
      : "";
    // Translate the constraint to business language before using it in prose.
    // primaryConstraint may be a raw technical name (e.g. "labor_intensity") when
    // coming from older data or a deterministic fallback path, so we always apply
    // the business-language layer first, then fall back to humanized text.
    const constraintPhrase = translateConstraintToBusinessLanguage(narrative.primaryConstraint);
    paragraphs.push(
      `The current model shows strong fundamentals, but a structural constraint is limiting growth: ${constraintPhrase}${evidenceRef}.`
    );
  }

  // P2 — The scaling problem (with evidence counts)
  if (demandCount > 0 && (opCount > 0 || costCount > 0)) {
    const demandRef = demandCount >= 3
      ? `${demandCount} customer demand indicators identified across pricing, usage, and market signals`
      : `${demandCount} demand signal${demandCount !== 1 ? "s" : ""} detected`;

    const constraintRef = opCount > 0
      ? "delivery depends on operational capacity, creating a structural scaling limit"
      : "the cost structure limits scaling efficiency";

    paragraphs.push(
      `Demand signals are strong, with ${demandRef}. However, ${constraintRef}.`
    );
  }

  // P3 — The consequence (with trapped value)
  if (narrative.trappedValue) {
    const tvRef = narrative.trappedValueEstimate
      ? `an estimated ${narrative.trappedValueEstimate} in`
      : "";
    paragraphs.push(
      `As a result, ${tvRef} value remains trapped in the current delivery model, limiting growth and margin expansion.`
    );
  } else if (narrative.primaryConstraint) {
    paragraphs.push(
      "Revenue growth requires proportional increases in capacity, creating a structural ceiling that limits both growth and margins."
    );
  }

  // P4 — The strategic direction
  if (narrative.strategicVerdict) {
    paragraphs.push(
      `The most promising strategic move is to ${narrative.strategicVerdict.toLowerCase()}.`
    );
  } else if (playbook) {
    paragraphs.push(
      `The most promising move is to ${playbook.strategicShift.toLowerCase()}.`
    );
  }

  // P5 — The mechanism (with evidence reference)
  if (playbook) {
    const supportSignals = compCount + custCount;
    const supportRef = supportSignals > 0
      ? `, supported by ${supportSignals} competitive and customer behavior signal${supportSignals !== 1 ? "s" : ""}`
      : "";
    paragraphs.push(
      `This would standardize delivery, reduce operational complexity, and enable scalable revenue generation${supportRef}.`
    );
  }

  // Impact line
  let impactLine = "Impact assessment pending additional evidence.";
  if (playbook) {
    const rev = playbook.impact.revenueExpansion;
    const margin = playbook.impact.marginImprovement;
    if (rev >= 7 && margin >= 7) {
      impactLine = `${Math.round(1 + rev / 3)}–${Math.round(2 + rev / 2)}× revenue potential with significantly improved margins and repeatable delivery.`;
    } else if (rev >= 5) {
      impactLine = `${Math.round(1 + rev / 3)}–${Math.round(2 + rev / 2)}× revenue potential with improved operational leverage and unit economics.`;
    } else {
      impactLine = "Meaningful improvement in operational efficiency and margin structure expected.";
    }
  }

  return { paragraphs, impactLine };
}

/* ══════════════════════════════════════════════════════════════
   CONFIDENCE EXPLANATION
   ══════════════════════════════════════════════════════════════ */

export interface ConfidenceDriver {
  category: string;
  count: number;
  strength: "strong" | "moderate" | "limited";
}

export interface ConfidenceExplanation {
  drivers: ConfidenceDriver[];
  improvementSuggestions: string[];
}

export function computeConfidenceExplanation(evidence: Evidence[]): ConfidenceExplanation {
  const catCounts = new Map<string, number>();
  for (const e of evidence) {
    const cat = (e.category || "general").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    catCounts.set(cat, (catCounts.get(cat) || 0) + 1);
  }

  const ALL_DOMAINS = [
    "Demand Signal", "Cost Structure", "Competitive Pressure",
    "Customer Behavior", "Distribution Channel", "Operational Dependency",
    "Pricing Model", "Technology Dependency",
  ];

  const drivers: ConfidenceDriver[] = ALL_DOMAINS.map(cat => {
    const count = catCounts.get(cat) || 0;
    const strength: "strong" | "moderate" | "limited" =
      count >= 4 ? "strong" : count >= 2 ? "moderate" : "limited";
    return { category: cat, count, strength };
  }).filter(d => d.count > 0 || d.strength === "limited");

  // Sort: strong first, then moderate, then limited
  drivers.sort((a, b) => {
    const order = { strong: 0, moderate: 1, limited: 2 };
    return order[a.strength] - order[b.strength];
  });

  // Build suggestions from limited/missing categories
  const limited = drivers.filter(d => d.strength === "limited");
  const missing = ALL_DOMAINS.filter(d => !catCounts.has(d));

  const suggestions: string[] = [];
  if (limited.length > 0) {
    suggestions.push(`Add more data about ${limited.slice(0, 2).map(d => d.category.toLowerCase()).join(" and ")}.`);
  }
  if (missing.length > 0 && missing.length <= 4) {
    suggestions.push(`No evidence yet for ${missing.slice(0, 2).map(m => m.toLowerCase()).join(" or ")} — adding this would significantly improve confidence.`);
  }

  return { drivers, improvementSuggestions: suggestions };
}
