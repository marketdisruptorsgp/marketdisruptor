/**
 * NEGATIVE SPACE EXPLORER
 *
 * Analyzes competitive gaps to find what NO major player is doing
 * and explores why these gaps exist — are they oversight opportunities
 * or gaps for good reasons?
 *
 * Categories of gaps:
 *   - Market blind spots (everyone focused on X, ignoring Y)
 *   - Structural assumptions (industry believes Z is impossible/unprofitable)
 *   - Customer segment neglect (serving A well, B poorly, ignoring C entirely)
 *   - Value chain gaps (strong at production, weak at distribution)
 *   - Business model orthodoxy (everyone uses same model, alternatives unexplored)
 */

import type { Evidence } from "@/lib/evidenceEngine";
import type { BusinessDimension } from "@/lib/opportunityDesignEngine";

// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════

export interface CompetitiveGap {
  id: string;
  /** What competitors are NOT doing */
  gapDescription: string;
  /** Category of gap */
  gapType: GapType;
  /** Why this gap might exist */
  gapReason: GapReason;
  /** What opportunity this gap represents */
  opportunityHypothesis: string;
  /** Evidence supporting this gap */
  supportingEvidence: string[];
  /** How to validate if this gap is real vs. avoided for good reason */
  validationApproach: string;
  /** Confidence this is a real opportunity vs. a gap for good reason */
  opportunityConfidence: "high" | "medium" | "low";
}

export type GapType =
  | "market_blind_spot"        // Competitors focused elsewhere
  | "structural_assumption"    // Industry believes it's impossible/unprofitable
  | "customer_neglect"        // Segment ignored despite having needs
  | "value_chain_gap"         // Strong somewhere, weak elsewhere in the chain
  | "business_model_orthodoxy" // Everyone uses same model
  | "price_point_gap"         // Missing price tier (too high-end or low-end)
  | "channel_gap"             // Distribution channel unexplored
  | "feature_orthodoxy";      // Feature set assumptions unchallenged

export type GapReason =
  | "oversight"               // Simply haven't thought of it
  | "assumed_unprofitable"    // Think it won't make money
  | "assumed_impossible"      // Think it can't be done
  | "regulatory_fear"         // Avoiding perceived regulatory risk
  | "customer_prejudice"      // Believe customers won't want it
  | "capabilities_lack"       // Don't have skills/assets to execute
  | "attention_elsewhere"     // Focused on other opportunities
  | "legacy_constraints";     // Locked into current approach

// ═══════════════════════════════════════════════════════════════
//  GAP DETECTION PATTERNS
// ═══════════════════════════════════════════════════════════════

interface GapPattern {
  gapType: GapType;
  gapDescription: string;
  gapReason: GapReason;
  opportunityHypothesis: string;
  validationApproach: string;
  /** Competitive evidence patterns that suggest this gap */
  competitiveTriggers: RegExp;
  /** Customer/market evidence that suggests opportunity */
  demandTriggers: RegExp;
  /** Evidence that weakens the opportunity (gap for good reason) */
  cautionSignals: RegExp;
}

const GAP_PATTERNS: GapPattern[] = [
  // ── Price Point Gaps ──
  {
    gapType: "price_point_gap",
    gapDescription: "No competitors serving the ultra-premium segment",
    gapReason: "assumed_unprofitable",
    opportunityHypothesis: "Premium segment exists but underserved — opportunity for 3-5x pricing with luxury positioning",
    validationApproach: "Survey target segment for willingness to pay premium; analyze luxury category growth in adjacent markets",
    competitiveTriggers: /all.?compet.*price|race.?to.?bottom|discount|low.?cost|cheap|budget|commod/i,
    demandTriggers: /premium|luxury|high.?end|exclusive|quality|craft|bespoke|custom/i,
    cautionSignals: /price.?sensit|commodity|undifferent|volume|scale.?econom/i,
  },
  {
    gapType: "price_point_gap", 
    gapDescription: "No competitors serving the ultra-budget segment",
    gapReason: "assumed_unprofitable",
    opportunityHypothesis: "Budget segment exists but ignored — opportunity for volume-based profitability",
    validationApproach: "Analyze cost structure to find minimum viable price point; test demand at ultra-low price tier",
    competitiveTriggers: /premium|high.?end|expensive|luxury|quality|artisan/i,
    demandTriggers: /budget|cheap|afford|price.?sensit|cost.?conscious|value/i,
    cautionSignals: /margin|complex|custom|high.?touch|service.?intensive/i,
  },

  // ── Customer Segment Neglect ──
  {
    gapType: "customer_neglect",
    gapDescription: "All competitors focus on B2B, ignoring consumer opportunity",
    gapReason: "assumed_unprofitable",
    opportunityHypothesis: "Consumer market underserved — opportunity for B2B solution adapted for consumer use",
    validationApproach: "Research consumer willingness to pay for B2B-grade solution; test simplified consumer version",
    competitiveTriggers: /B2B|enterprise|business|corporate|professional|commercial/i,
    demandTriggers: /consumer|personal|individual|home|family|DIY/i,
    cautionSignals: /complex|regulated|high.?risk|professional.?liability/i,
  },
  {
    gapType: "customer_neglect",
    gapDescription: "All competitors focus on large enterprises, SMB segment neglected",
    gapReason: "attention_elsewhere",
    opportunityHypothesis: "SMB has similar needs but requires different approach — opportunity for SMB-specific solution",
    validationApproach: "Survey SMB segment for specific pain points; develop simplified, affordable version",
    competitiveTriggers: /enterprise|large|fortune|corporate|big.?company/i,
    demandTriggers: /SMB|small.*business|startup|entrepreneur|independent/i,
    cautionSignals: /complex|expensive|enterprise.?grade|scale.?requirement/i,
  },

  // ── Channel Gaps ──
  {
    gapType: "channel_gap",
    gapDescription: "All competitors use traditional sales, social commerce unexplored",
    gapReason: "capabilities_lack",
    opportunityHypothesis: "Social commerce could reach new customer segments with lower acquisition cost",
    validationApproach: "Test social commerce channels; measure CAC vs. traditional channels; analyze audience overlap",
    competitiveTriggers: /traditional.*sales|sales.*team|field.*sales|B2B.*sales|enterprise.*sales/i,
    demandTriggers: /social|community|creator|influencer|viral|organic/i,
    cautionSignals: /complex.*sale|high.*ticket|enterprise.*decision|professional.*buyer/i,
  },
  {
    gapType: "channel_gap",
    gapDescription: "All competitors sell direct, no one using channel partners",
    gapReason: "legacy_constraints",
    opportunityHypothesis: "Channel partners could scale distribution faster than direct sales",
    validationApproach: "Identify potential channel partners; analyze their customer overlap; test partnership model",
    competitiveTriggers: /direct.*sales|own.*sales|in-house.*sales/i,
    demandTriggers: /partner|channel|reseller|affiliate|distributor/i,
    cautionSignals: /margin.*pressure|brand.*control|customer.*relationship/i,
  },

  // ── Business Model Orthodoxy ──
  {
    gapType: "business_model_orthodoxy",
    gapDescription: "Entire industry uses project-based pricing, no subscription models",
    gapReason: "structural_assumption",
    opportunityHypothesis: "Subscription model could provide predictable revenue and better customer relationships",
    validationApproach: "Survey customers about subscription willingness; design recurring value proposition; test hybrid model",
    competitiveTriggers: /project.*based|per.*project|hourly|one.*time|consulting|custom/i,
    demandTriggers: /recurring|ongoing|relationship|partnership|continuous/i,
    cautionSignals: /variable.*demand|seasonal|project.*nature|custom.*requirement/i,
  },
  {
    gapType: "business_model_orthodoxy",
    gapDescription: "Everyone owns assets, no one using asset-light platform model",
    gapReason: "assumed_impossible",
    opportunityHypothesis: "Platform model could achieve scale without asset ownership",
    validationApproach: "Identify asset owners willing to join platform; design revenue sharing model; test marketplace dynamics",
    competitiveTriggers: /own.*asset|own.*inventory|own.*equipment|vertical.*integrated/i,
    demandTriggers: /platform|marketplace|network|coordination|aggregation/i,
    cautionSignals: /quality.*control|asset.*specific|regulatory.*requirement/i,
  },

  // ── Feature Orthodoxy ──
  {
    gapType: "feature_orthodoxy",
    gapDescription: "Everyone adds features, no one offers intentionally minimal version",
    gapReason: "customer_prejudice",
    opportunityHypothesis: "Simplified version could serve segment that values simplicity over features",
    validationApproach: "Survey customers about feature usage; identify most-used features; test minimal version pricing",
    competitiveTriggers: /feature.*rich|comprehensive|all.*in.*one|complete|full.*featured/i,
    demandTriggers: /simple|easy|minimal|basic|streamlined|focused/i,
    cautionSignals: /power.*user|advanced.*feature|customization|integration/i,
  },

  // ── Value Chain Gaps ──
  {
    gapType: "value_chain_gap",
    gapDescription: "Strong product companies, weak at services — service gap opportunity",
    gapReason: "capabilities_lack",
    opportunityHypothesis: "Service layer could capture additional value from existing product ecosystem",
    validationApproach: "Survey product customers about service needs; analyze willingness to pay for services; test service offerings",
    competitiveTriggers: /product.*focus|manufacturing|hardware|software.*only/i,
    demandTriggers: /service|support|implementation|training|consulting|maintenance/i,
    cautionSignals: /margin.*pressure|service.*complexity|scaling.*challenge/i,
  },
  {
    gapType: "value_chain_gap",
    gapDescription: "Great at delivery, terrible at customer acquisition — marketing gap",
    gapReason: "attention_elsewhere",
    opportunityHypothesis: "Marketing/customer acquisition specialization could serve multiple delivery specialists",
    validationApproach: "Analyze competitors' customer acquisition costs; identify common acquisition challenges; test lead generation service",
    competitiveTriggers: /delivery.*focus|operations.*focus|product.*focus|technical.*focus/i,
    demandTriggers: /marketing|customer.*acquisition|lead.*generation|growth|sales/i,
    cautionSignals: /direct.*relationship|brand.*control|customer.*data/i,
  },

  // ── Market Blind Spots ──
  {
    gapType: "market_blind_spot",
    gapDescription: "All competitors focused on growth, none serving maintenance/existing base",
    gapReason: "attention_elsewhere",
    opportunityHypothesis: "Maintenance market underserved — opportunity for specialized maintenance/support services",
    validationApproach: "Survey existing customers about maintenance needs; analyze maintenance revenue potential; test maintenance-focused offering",
    competitiveTriggers: /growth|new.*customer|acquisition|expansion|scale/i,
    demandTriggers: /maintenance|support|existing|retention|lifecycle|ongoing/i,
    cautionSignals: /low.*margin|commodity|replacement.*threat/i,
  },
];

// ═══════════════════════════════════════════════════════════════
//  NEGATIVE SPACE ENGINE
// ═══════════════════════════════════════════════════════════════

/**
 * Analyze competitive evidence to identify gaps in what competitors are doing.
 */
export function exploreNegativeSpace(
  evidence: Evidence[],
  businessDimensions: BusinessDimension[],
  maxTotal: number = 4
): CompetitiveGap[] {
  const gaps: CompetitiveGap[] = [];

  // Extract competitive and demand context
  const competitiveEvidence = evidence.filter(e => 
    e.type.includes("competitive") || e.description.toLowerCase().includes("competitor")
  );
  const demandEvidence = evidence.filter(e =>
    e.type.includes("demand") || e.type.includes("customer")
  );

  const competitiveText = competitiveEvidence.map(e => e.description).join(" ").toLowerCase();
  const demandText = demandEvidence.map(e => e.description).join(" ").toLowerCase();
  const dimensionText = businessDimensions.map(d => `${d.name} ${d.currentValue}`).join(" ").toLowerCase();

  const combinedContext = `${competitiveText} ${demandText} ${dimensionText}`;

  for (const pattern of GAP_PATTERNS) {
    let relevance = 0;

    // Check if competitive patterns match
    if (pattern.competitiveTriggers.test(competitiveText)) {
      relevance += 0.4;
    }

    // Check if demand signals support the opportunity
    if (pattern.demandTriggers.test(demandText)) {
      relevance += 0.4;
    }

    // Check dimension relevance
    if (pattern.competitiveTriggers.test(dimensionText)) {
      relevance += 0.2;
    }

    // Reduce confidence if caution signals present
    let opportunityConfidence: CompetitiveGap["opportunityConfidence"] = "medium";
    if (pattern.cautionSignals.test(combinedContext)) {
      relevance *= 0.6; // Reduce overall relevance
      opportunityConfidence = "low";
    } else if (relevance >= 0.7) {
      opportunityConfidence = "high";
    }

    // Only include relevant gaps
    if (relevance < 0.4) continue;

    // Find supporting evidence
    const supportingEvidence: string[] = [];
    if (pattern.competitiveTriggers.test(competitiveText)) {
      const matchingEvidence = competitiveEvidence.filter(e => 
        pattern.competitiveTriggers.test(e.description.toLowerCase())
      );
      supportingEvidence.push(...matchingEvidence.map(e => e.description));
    }
    if (pattern.demandTriggers.test(demandText)) {
      const matchingDemand = demandEvidence.filter(e =>
        pattern.demandTriggers.test(e.description.toLowerCase())
      );
      supportingEvidence.push(...matchingDemand.map(e => e.description));
    }

    gaps.push({
      id: `gap-${pattern.gapType}-${Date.now()}`,
      gapDescription: pattern.gapDescription,
      gapType: pattern.gapType,
      gapReason: pattern.gapReason,
      opportunityHypothesis: pattern.opportunityHypothesis,
      supportingEvidence: supportingEvidence.slice(0, 3), // Limit to top 3
      validationApproach: pattern.validationApproach,
      opportunityConfidence,
    });
  }

  // Sort by confidence and relevance
  return gaps
    .sort((a, b) => {
      const confidenceScore = { high: 3, medium: 2, low: 1 };
      return confidenceScore[b.opportunityConfidence] - confidenceScore[a.opportunityConfidence];
    })
    .slice(0, maxTotal);
}

/**
 * Format competitive gaps for injection into AI prompts.
 */
export function formatGapsForPrompt(gaps: CompetitiveGap[]): string {
  if (gaps.length === 0) return "";

  const lines = gaps.map((gap, i) => {
    return (
      `${i + 1}. COMPETITIVE GAP: ${gap.gapDescription}\n` +
      `   WHY GAP EXISTS: ${gap.gapReason.replace(/_/g, " ")}\n` +
      `   OPPORTUNITY HYPOTHESIS: ${gap.opportunityHypothesis}\n` +
      `   SUPPORTING EVIDENCE: ${gap.supportingEvidence.join("; ")}\n` +
      `   VALIDATION APPROACH: ${gap.validationApproach}\n` +
      `   CONFIDENCE: ${gap.opportunityConfidence}`
    );
  });

  return `COMPETITIVE GAPS (what NO major player is doing — explore these negative spaces):\n${lines.join("\n\n")}`;
}