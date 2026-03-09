/**
 * TEMPORAL ARBITRAGE ENGINE
 *
 * Identifies ideas that exploit timing — things that were impossible
 * 1-3 years ago but recent changes have made viable NOW.
 *
 * Categories of temporal unlocks:
 *   - AI capability jumps (GPT-4, vision models, voice synthesis)
 *   - Regulatory changes (crypto clarity, telehealth expansion)
 *   - Platform/infrastructure maturity (Stripe, AWS, social commerce)
 *   - Cultural/behavioral shifts (remote work, creator economy)
 *   - Economic environment changes (interest rates, venture funding)
 */

import type { ConstraintShape } from "@/lib/analogEngine";
import type { BusinessDimension } from "@/lib/opportunityDesignEngine";

// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════

export interface TemporalUnlock {
  id: string;
  /** What changed recently that enables this idea */
  recentChange: string;
  /** When this change happened */
  changeTimeframe: "last_6_months" | "last_year" | "last_2_years";
  /** Category of change */
  changeCategory: ChangeCategory;
  /** What was impossible before */
  previouslyImpossible: string;
  /** What's now possible */
  nowPossible: string;
  /** The business dimension this unlocks */
  unlockedDimension: string;
  /** Evidence that this timing is right */
  timingEvidence: string[];
  /** How urgent is this timing window? */
  timingWindow: "narrow" | "moderate" | "wide";
}

export type ChangeCategory =
  | "ai_capability"          // New AI models/capabilities
  | "regulatory_shift"       // Policy/regulation changes
  | "platform_maturity"     // Infrastructure/platforms reaching critical mass
  | "cultural_behavioral"    // Social/behavioral shifts
  | "economic_environment"   // Market/funding environment changes
  | "technology_unlock"      // New technical capabilities (5G, AR/VR, etc.)
  | "supply_chain"          // Manufacturing/logistics innovations
  | "generational";         // Gen Z/Alpha coming of age with different expectations

// ═══════════════════════════════════════════════════════════════
//  TEMPORAL UNLOCK CATALOG
// ═══════════════════════════════════════════════════════════════

interface TemporalTemplate {
  recentChange: string;
  changeTimeframe: TemporalUnlock["changeTimeframe"];
  changeCategory: ChangeCategory;
  previouslyImpossible: string;
  nowPossible: string;
  timingEvidence: string[];
  timingWindow: TemporalUnlock["timingWindow"];
  /** Which constraint shapes benefit from this unlock */
  relevantConstraints: string[];
  /** Business dimension patterns this typically unlocks */
  unlockedDimensions: string[];
  /** Keywords that suggest this unlock is relevant */
  triggerPatterns: RegExp;
}

const TEMPORAL_TEMPLATES: TemporalTemplate[] = [
  // ── AI Capability Unlocks ──
  {
    recentChange: "GPT-4 and advanced language models can now handle complex reasoning and domain expertise",
    changeTimeframe: "last_year",
    changeCategory: "ai_capability",
    previouslyImpossible: "AI couldn't provide professional-grade expertise or handle nuanced industry knowledge",
    nowPossible: "Expert consultation services can be partially automated while maintaining quality",
    timingEvidence: ["ChatGPT 100M users in 2 months", "Legal/medical AI tools gaining enterprise adoption", "$1.3B in AI productivity tool funding in 2023"],
    timingWindow: "wide",
    relevantConstraints: ["human_capacity", "knowledge_lock"],
    unlockedDimensions: ["operational_dependency", "pricing_model", "distribution_channel"],
    triggerPatterns: /consult|expert|advisor|knowledge|analysis|review|professional.?service/i,
  },
  {
    recentChange: "AI image/video generation reached production quality (Midjourney, DALL-E 3, Runway)",
    changeTimeframe: "last_year",
    changeCategory: "ai_capability", 
    previouslyImpossible: "Creating professional visual content required human designers/photographers",
    nowPossible: "Visual content businesses can operate with minimal human creative involvement",
    timingEvidence: ["Midjourney 15M+ users", "Adobe integrating AI into Creative Suite", "Getty Images AI partnership"],
    timingWindow: "moderate",
    relevantConstraints: ["human_capacity", "knowledge_lock"],
    unlockedDimensions: ["operational_dependency", "cost_structure"],
    triggerPatterns: /design|visual|creative|content|marketing|photo|video|graphic/i,
  },

  // ── Regulatory Shifts ──
  {
    recentChange: "Telehealth permanently expanded beyond pandemic restrictions (DEA, state licensing changes)",
    changeTimeframe: "last_2_years",
    changeCategory: "regulatory_shift",
    previouslyImpossible: "Healthcare services required in-person visits for most conditions",
    nowPossible: "Remote-first healthcare delivery models across state lines",
    timingEvidence: ["$57B telehealth market by 2025", "DEA extending controlled substance prescribing rules", "Interstate medical licensing compacts expanding"],
    timingWindow: "wide",
    relevantConstraints: ["geographic_tether", "regulatory_cage"],
    unlockedDimensions: ["distribution_channel", "operational_dependency"],
    triggerPatterns: /health|medical|care|clinic|therapy|consultation|wellness/i,
  },
  {
    recentChange: "Cannabis legalization wave creating regulated markets in 20+ states",
    changeTimeframe: "last_2_years",
    changeCategory: "regulatory_shift",
    previouslyImpossible: "Cannabis businesses couldn't access banking, advertising, or interstate commerce",
    nowPossible: "Professional cannabis services with normal business operations",
    timingEvidence: ["$28B legal cannabis market", "SAFE Banking Act progress", "Amazon removing THC testing for most jobs"],
    timingWindow: "wide",
    relevantConstraints: ["regulatory_cage", "trust_deficit"],
    unlockedDimensions: ["distribution_channel", "pricing_model", "customer_behavior"],
    triggerPatterns: /cannabis|hemp|CBD|THC|dispensary|wellness|alternative/i,
  },

  // ── Platform Maturity ──
  {
    recentChange: "Social commerce infrastructure matured (TikTok Shop, Instagram Shopping, live streaming commerce)",
    changeTimeframe: "last_2_years",
    changeCategory: "platform_maturity",
    previouslyImpossible: "Direct social selling required complex e-commerce setup and separate payment processing",
    nowPossible: "One-person businesses can sell directly through social content without technical setup",
    timingEvidence: ["TikTok Shop $16B GMV in 2023", "Instagram Shopping 130M+ monthly users", "Live commerce growing 280% annually"],
    timingWindow: "wide",
    relevantConstraints: ["distribution_channel", "technology_dependency"],
    unlockedDimensions: ["distribution_channel", "customer_behavior"],
    triggerPatterns: /social|content|creator|influencer|community|direct.?to/i,
  },
  {
    recentChange: "No-code platforms reached enterprise-grade capability (Webflow, Bubble, Zapier)",
    changeTimeframe: "last_2_years",
    changeCategory: "platform_maturity",
    previouslyImpossible: "Custom software required developers and months of development time",
    nowPossible: "Non-technical entrepreneurs can build and launch software businesses in weeks",
    timingEvidence: ["Webflow $4B valuation", "Bubble 3M+ users", "Zapier $5B valuation", "No-code market $21B by 2025"],
    timingWindow: "wide",
    relevantConstraints: ["technology_dependency", "knowledge_lock"],
    unlockedDimensions: ["operational_dependency", "cost_structure", "distribution_channel"],
    triggerPatterns: /software|app|automation|digital|platform|tool|system/i,
  },

  // ── Cultural/Behavioral Shifts ──
  {
    recentChange: "Remote work became permanently normalized across industries (post-COVID normalization)",
    changeTimeframe: "last_2_years",
    changeCategory: "cultural_behavioral",
    previouslyImpossible: "Professional services required physical presence and office infrastructure",
    nowPossible: "Location-independent service businesses with global talent access",
    timingEvidence: ["35% of US workforce has remote work option", "Remote job postings up 360%", "$4.7T remote work economic impact"],
    timingWindow: "wide",
    relevantConstraints: ["geographic_tether", "operational_dependency"],
    unlockedDimensions: ["operational_dependency", "cost_structure", "distribution_channel"],
    triggerPatterns: /remote|virtual|distributed|location.?independent|global|anywhere/i,
  },
  {
    recentChange: "Creator economy matured with reliable monetization infrastructure",
    changeTimeframe: "last_2_years", 
    changeCategory: "cultural_behavioral",
    previouslyImpossible: "Individual expertise monetization required traditional media or publishing gatekeepers",
    nowPossible: "Direct expert-to-audience monetization through multiple channels (courses, newsletters, communities)",
    timingEvidence: ["Creator economy $104B market", "Substack 1M+ paid subscriptions", "Discord 150M+ monthly users", "OnlyFans $5B creator payouts"],
    timingWindow: "wide",
    relevantConstraints: ["distribution_channel", "information_asymmetry"],
    unlockedDimensions: ["distribution_channel", "pricing_model", "customer_behavior"],
    triggerPatterns: /expert|teach|course|newsletter|community|subscription|audience|content/i,
  },

  // ── Economic Environment ──
  {
    recentChange: "High interest rates making asset-heavy businesses less attractive, capital efficiency premium",
    changeTimeframe: "last_year",
    changeCategory: "economic_environment",
    previouslyImpossible: "Asset-light models couldn't compete with capital-intensive ventures on returns",
    nowPossible: "Capital-efficient businesses becoming investor preference over growth-at-all-costs models",
    timingEvidence: ["Fed funds rate 5%+", "VC funding down 35%", "Profitability focus replacing growth focus", "Asset-light SaaS multiples outperforming"],
    timingWindow: "moderate",
    relevantConstraints: ["asset_utilization", "margin_squeeze"],
    unlockedDimensions: ["cost_structure", "operational_dependency", "pricing_model"],
    triggerPatterns: /asset.?light|efficient|lean|profitable|sustainable|bootstrap|organic/i,
  },

  // ── Technology Unlocks ──
  {
    recentChange: "Voice AI reached human-like quality (ElevenLabs, Rime, OpenAI Voice)",
    changeTimeframe: "last_6_months",
    changeCategory: "technology_unlock",
    previouslyImpossible: "Synthetic voice content sounded obviously artificial and couldn't handle nuance",
    nowPossible: "Voice-first businesses that scale personal communication without human involvement",
    timingEvidence: ["ElevenLabs 1M+ users", "Podcast advertising $2B market", "Voice commerce growing 25% annually"],
    timingWindow: "narrow",
    relevantConstraints: ["human_capacity", "geographic_tether"],
    unlockedDimensions: ["distribution_channel", "operational_dependency"],
    triggerPatterns: /voice|audio|podcast|speak|call|phone|conversation|communication/i,
  },

  // ── Supply Chain Innovation ──
  {
    recentChange: "On-demand manufacturing reached viability (Printful, Gelato, local 3D printing networks)",
    changeTimeframe: "last_2_years",
    changeCategory: "supply_chain",
    previouslyImpossible: "Physical product businesses required inventory investment and MOQ risks",
    nowPossible: "Zero-inventory physical product businesses with global fulfillment",
    timingEvidence: ["Print-on-demand market $4.9B", "Printful 1M+ sellers", "3D printing services market $6B"],
    timingWindow: "wide",
    relevantConstraints: ["asset_utilization", "margin_squeeze"],
    unlockedDimensions: ["cost_structure", "operational_dependency", "distribution_channel"],
    triggerPatterns: /physical|product|manufacturing|inventory|fulfillment|shipping/i,
  },

  // ── Generational Shift ──
  {
    recentChange: "Gen Z reaching prime consumer age with different service expectations (authenticity over polish)",
    changeTimeframe: "last_2_years",
    changeCategory: "generational",
    previouslyImpossible: "Professional services required polished corporate positioning and formal credentials",
    nowPossible: "Authentic, informal expertise delivery that connects directly with younger demographics",
    timingEvidence: ["Gen Z $143B spending power", "TikTok 1B+ monthly users", "Authenticity over perfection trend", "Personal brand beats corporate brand"],
    timingWindow: "wide",
    relevantConstraints: ["trust_deficit", "information_asymmetry"],
    unlockedDimensions: ["customer_behavior", "distribution_channel", "pricing_model"],
    triggerPatterns: /authentic|personal|informal|transparent|direct|genuine|real|honest/i,
  },
];

// ═══════════════════════════════════════════════════════════════
//  TEMPORAL ARBITRAGE ENGINE
// ═══════════════════════════════════════════════════════════════

/**
 * Generate temporal arbitrage opportunities based on recent changes.
 */
export function generateTemporalUnlocks(
  constraintShapes: ConstraintShape[],
  businessDimensions: BusinessDimension[],
  maxTotal: number = 5
): TemporalUnlock[] {
  const unlocks: TemporalUnlock[] = [];
  const constraintTypes = new Set(constraintShapes.map(c => c.bottleneckType));
  const dimensionCategories = businessDimensions.map(d => d.category);

  // Combine constraint text and dimension text for pattern matching
  const contextText = [
    ...constraintShapes.map(c => `${c.sourceConstraintLabel} ${c.scarceResource}`),
    ...businessDimensions.map(d => `${d.name} ${d.currentValue}`)
  ].join(" ").toLowerCase();

  for (const template of TEMPORAL_TEMPLATES) {
    let relevance = 0;

    // Check constraint relevance
    const constraintMatches = template.relevantConstraints.filter(c => constraintTypes.has(c as any));
    relevance += constraintMatches.length * 0.4;

    // Check dimension relevance  
    const dimensionMatches = template.unlockedDimensions.filter(d => dimensionCategories.includes(d as any));
    relevance += dimensionMatches.length * 0.3;

    // Check trigger pattern match
    if (template.triggerPatterns.test(contextText)) {
      relevance += 0.3;
    }

    // Only include relevant unlocks
    if (relevance < 0.5) continue;

    // Find the most relevant dimension this unlocks
    const primaryDimension = businessDimensions.find(d => 
      template.unlockedDimensions.includes(d.category)
    );

    unlocks.push({
      id: `temporal-${template.changeCategory}-${Date.now()}`,
      recentChange: template.recentChange,
      changeTimeframe: template.changeTimeframe,
      changeCategory: template.changeCategory,
      previouslyImpossible: template.previouslyImpossible,
      nowPossible: template.nowPossible,
      unlockedDimension: primaryDimension?.name || "Business Model",
      timingEvidence: template.timingEvidence,
      timingWindow: template.timingWindow,
    });
  }

  // Sort by timing urgency (narrow windows first) and recency
  return unlocks
    .sort((a, b) => {
      const urgencyScore = { narrow: 3, moderate: 2, wide: 1 };
      const timeScore = { last_6_months: 3, last_year: 2, last_2_years: 1 };
      
      const aScore = urgencyScore[a.timingWindow] + timeScore[a.changeTimeframe];
      const bScore = urgencyScore[b.timingWindow] + timeScore[b.changeTimeframe];
      
      return bScore - aScore;
    })
    .slice(0, maxTotal);
}

/**
 * Format temporal unlocks for injection into AI prompts.
 */
export function formatTemporalUnlocksForPrompt(unlocks: TemporalUnlock[]): string {
  if (unlocks.length === 0) return "";

  const lines = unlocks.map((unlock, i) => {
    return (
      `${i + 1}. RECENT CHANGE (${unlock.changeTimeframe.replace(/_/g, " ")}): ${unlock.recentChange}\n` +
      `   PREVIOUSLY IMPOSSIBLE: ${unlock.previouslyImpossible}\n` +
      `   NOW POSSIBLE: ${unlock.nowPossible}\n` +
      `   UNLOCKED DIMENSION: ${unlock.unlockedDimension}\n` +
      `   TIMING EVIDENCE: ${unlock.timingEvidence.join("; ")}\n` +
      `   TIMING WINDOW: ${unlock.timingWindow}`
    );
  });

  return `TEMPORAL ARBITRAGE (ideas that exploit recent changes — were impossible 1-2 years ago, viable NOW):\n${lines.join("\n\n")}`;
}