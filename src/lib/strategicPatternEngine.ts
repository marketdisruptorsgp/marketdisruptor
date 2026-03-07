/**
 * STRATEGIC PATTERN ENGINE — Structural Business Archetype Detection
 *
 * Analyzes evidence and insights to detect which structural business
 * archetype the analyzed entity most closely resembles.
 */

import type { Evidence } from "@/lib/evidenceEngine";
import type { StrategicInsight, StrategicNarrative } from "@/lib/strategicEngine";

export interface StructuralPattern {
  id: string;
  name: string;
  matchScore: number; // 0-1
  characteristics: string[];
  commonTransformations: string[];
  riskFactors: string[];
  /** How many evidence signals matched this pattern */
  matchedSignalCount?: number;
  /** Evidence categories where matches were found */
  matchedCategories?: string[];
}

interface PatternTemplate {
  id: string;
  name: string;
  keywords: string[];
  characteristics: string[];
  commonTransformations: string[];
  riskFactors: string[];
}

const PATTERN_TEMPLATES: PatternTemplate[] = [
  {
    id: "custom-work",
    name: "Custom Work Model",
    keywords: ["custom", "bespoke", "tailored", "project-based", "consulting", "agency", "labor", "billable", "hourly", "scope"],
    characteristics: [
      "Revenue directly tied to labor hours or project scope",
      "High customization per client — limited repeatability",
      "Scaling requires proportional headcount growth",
      "Deep client relationships but low leverage",
    ],
    commonTransformations: ["Productized Systems", "Platform Enablement", "Vertical Specialization"],
    riskFactors: ["Key-person dependency", "Revenue volatility between projects", "Margin compression at scale"],
  },
  {
    id: "productized-systems",
    name: "Productized Systems Model",
    keywords: ["product", "productized", "standardized", "configurable", "modular", "repeatable", "template", "package"],
    characteristics: [
      "Standardized offerings with configurable options",
      "Decoupled revenue from direct labor hours",
      "Higher margins through repeatability",
      "Scalable without proportional headcount",
    ],
    commonTransformations: ["Platform Aggregation", "Marketplace Integration", "Subscription Conversion"],
    riskFactors: ["Commoditization risk", "Feature creep", "Loss of premium positioning"],
  },
  {
    id: "marketplace",
    name: "Marketplace Model",
    keywords: ["marketplace", "platform", "two-sided", "network", "matching", "transaction", "commission", "listing"],
    characteristics: [
      "Multi-sided platform connecting buyers and sellers",
      "Revenue from transaction fees or listing commissions",
      "Network effects drive value — more users = more value",
      "Cold start problem is the primary constraint",
    ],
    commonTransformations: ["Vertical Expansion", "Managed Marketplace", "SaaS Conversion"],
    riskFactors: ["Chicken-and-egg supply/demand", "Disintermediation", "Winner-take-all dynamics"],
  },
  {
    id: "subscription-recurring",
    name: "Subscription / Recurring Model",
    keywords: ["subscription", "recurring", "saas", "mrr", "arr", "retention", "churn", "renewal", "monthly", "annual"],
    characteristics: [
      "Predictable recurring revenue streams",
      "Value delivered continuously over time",
      "Growth driven by retention + expansion revenue",
      "Unit economics improve with customer lifetime",
    ],
    commonTransformations: ["Usage-Based Pricing", "Platform Expansion", "Vertical Specialization"],
    riskFactors: ["Churn concentration", "Feature parity with competitors", "Pricing pressure"],
  },
  {
    id: "asset-light",
    name: "Asset-Light Model",
    keywords: ["asset-light", "outsource", "partner", "franchise", "license", "lease", "virtual", "cloud"],
    characteristics: [
      "Minimal ownership of physical assets or infrastructure",
      "Leverage partner networks for fulfillment",
      "High capital efficiency and ROIC",
      "Speed to market through external resources",
    ],
    commonTransformations: ["Vertical Integration", "Owned Infrastructure", "Premium Tier"],
    riskFactors: ["Dependency on partners", "Quality control challenges", "Limited differentiation"],
  },
  {
    id: "vertical-specialist",
    name: "Vertical Specialist Model",
    keywords: ["vertical", "niche", "specialized", "industry-specific", "domain", "segment", "focused"],
    characteristics: [
      "Deep expertise in a single industry or segment",
      "Premium pricing through specialized knowledge",
      "Strong referral networks within the vertical",
      "High switching costs for customers",
    ],
    commonTransformations: ["Horizontal Expansion", "Platform Aggregation", "Productized Systems"],
    riskFactors: ["Market size ceiling", "Industry cyclicality", "Over-concentration risk"],
  },
  {
    id: "channel-distribution",
    name: "Channel Distribution Model",
    keywords: ["channel", "distribution", "partner", "reseller", "wholesale", "dealer", "indirect", "affiliate"],
    characteristics: [
      "Revenue generated through partner/channel networks",
      "Indirect customer relationships",
      "Scalable without proportional sales hiring",
      "Partner enablement is a core competency",
    ],
    commonTransformations: ["Direct-to-Consumer", "Platform Marketplace", "Owned Distribution"],
    riskFactors: ["Channel conflict", "Margin erosion", "Loss of customer data"],
  },
  {
    id: "platform-aggregator",
    name: "Platform Aggregator Model",
    keywords: ["platform", "aggregator", "ecosystem", "api", "integration", "app store", "developer", "embed"],
    characteristics: [
      "Central platform with third-party extensions",
      "Value increases with ecosystem participants",
      "Lock-in through integration depth",
      "Revenue from platform fees, premium tiers, or data",
    ],
    commonTransformations: ["Vertical SaaS", "Managed Services Layer", "Data Monetization"],
    riskFactors: ["Platform dependency for partners", "Governance complexity", "Competition from own ecosystem"],
  },
];

/**
 * Detect the structural business pattern from evidence and insights.
 * Returns up to 3 matching patterns sorted by match score.
 */
export function detectStructuralPattern(
  evidence: Evidence[],
  insights: StrategicInsight[],
  narrative: StrategicNarrative | null,
): StructuralPattern[] {
  const corpus = buildCorpus(evidence, insights, narrative);

  // Build per-category corpus for attribution
  const categoryCorpus = new Map<string, string>();
  for (const e of evidence) {
    const cat = (e.category || "general").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    categoryCorpus.set(cat, (categoryCorpus.get(cat) || "") + ` ${e.label} ${e.description || ""}`);
  }

  const scored = PATTERN_TEMPLATES.map(template => {
    let score = 0;
    let matchCount = 0;
    const matchedCats = new Set<string>();

    for (const keyword of template.keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, "gi");
      const matches = corpus.match(regex);
      if (matches) {
        matchCount += matches.length;
        score += Math.min(matches.length * 0.1, 0.3);
      }
      // Track which evidence categories matched
      for (const [cat, text] of categoryCorpus) {
        if (new RegExp(`\\b${keyword}\\b`, "gi").test(text)) {
          matchedCats.add(cat);
        }
      }
    }

    if (matchCount >= 5) score += 0.15;
    if (matchCount >= 10) score += 0.1;

    if (narrative) {
      const narrativeText = `${narrative.primaryConstraint} ${narrative.strategicVerdict} ${narrative.breakthroughOpportunity}`.toLowerCase();
      for (const kw of template.keywords) {
        if (narrativeText.includes(kw)) score += 0.08;
      }
    }

    return {
      id: template.id,
      name: template.name,
      matchScore: Math.min(score, 1),
      characteristics: template.characteristics,
      commonTransformations: template.commonTransformations,
      riskFactors: template.riskFactors,
      matchedSignalCount: matchCount,
      matchedCategories: [...matchedCats],
    };
  });

  return scored
    .filter(s => s.matchScore >= 0.15)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 3);
}

function buildCorpus(
  evidence: Evidence[],
  insights: StrategicInsight[],
  narrative: StrategicNarrative | null,
): string {
  const parts: string[] = [];

  for (const e of evidence) {
    parts.push(`${e.label} ${e.description || ""}`);
  }
  for (const i of insights) {
    parts.push(`${i.label} ${i.description}`);
  }
  if (narrative) {
    parts.push(narrative.narrativeSummary);
    if (narrative.strategicVerdict) parts.push(narrative.strategicVerdict);
    if (narrative.primaryConstraint) parts.push(narrative.primaryConstraint);
    if (narrative.breakthroughOpportunity) parts.push(narrative.breakthroughOpportunity);
    if (narrative.trappedValue) parts.push(narrative.trappedValue);
  }

  return parts.join(" ").toLowerCase();
}
