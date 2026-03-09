/**
 * SECOND-ORDER EFFECT ENGINE
 *
 * Explores "what becomes possible if this constraint didn't exist?"
 * Instead of solving constraints directly, this engine imagines the world
 * where they're removed and works backwards to find the unlock path.
 *
 * Examples:
 *   - If geographic tether was gone → global remote consulting becomes viable
 *   - If labor cost wasn't an issue → ultra-premium hand-crafted positioning
 *   - If regulatory barriers disappeared → direct consumer models unlock
 *   - If trust wasn't a problem → peer-to-peer marketplaces flourish
 */

import type { ConstraintShape } from "@/lib/analogEngine";
import type { StrategicInsight } from "@/lib/strategicEngine";

// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════

export interface SecondOrderUnlock {
  id: string;
  /** The constraint being removed */
  sourceConstraint: ConstraintShape;
  /** What business model becomes possible without this constraint */
  unlockedBusinessModel: string;
  /** The mechanism that creates value in the unlocked state */
  valueMechanism: string;
  /** How to work backwards to achieve this unlock */
  unlockPath: string;
  /** Real examples where this unlock happened */
  precedents: string[];
  /** What needs to be true for this unlock to work */
  enablers: string[];
  /** How strong is this unlock opportunity? */
  viability: "transformational" | "significant" | "incremental";
}

// ═══════════════════════════════════════════════════════════════
//  SECOND-ORDER TEMPLATES
// ═══════════════════════════════════════════════════════════════

interface UnlockTemplate {
  constraintTypes: string[]; // bottleneck types this applies to
  unlockedBusinessModel: string;
  valueMechanism: string;
  unlockPath: string;
  precedents: string[];
  enablers: string[];
  viabilityFactors: {
    /** Signals that boost this unlock's viability */
    strongWhen: RegExp;
    /** Signals that weaken this unlock's viability */
    weakWhen: RegExp;
  };
}

const UNLOCK_TEMPLATES: UnlockTemplate[] = [
  // ── Geographic constraint removal ──
  {
    constraintTypes: ["geographic_tether"],
    unlockedBusinessModel: "Global remote-first service delivery with local execution partners",
    valueMechanism: "Your expertise becomes globally scalable while execution stays local through partner network",
    unlockPath: "1) Document your process as playbooks, 2) Train and certify local partners globally, 3) Become the brand/quality control layer over distributed execution",
    precedents: ["Shopify (global commerce platform, local payment partners)", "Uber (global dispatch, local drivers)", "McDonald's (global brand, local franchisees)"],
    enablers: ["Digital communication infrastructure", "Partner certification system", "Quality control mechanisms", "Brand reputation transfer"],
    viabilityFactors: {
      strongWhen: /expertise|process|knowledge|quality|brand|standard/i,
      weakWhen: /physical|asset|inventory|manual|local.?only/i,
    },
  },

  // ── Trust barrier removal ──
  {
    constraintTypes: ["trust_deficit"],
    unlockedBusinessModel: "Pure peer-to-peer marketplace with algorithmic trust scoring",
    valueMechanism: "Eliminate intermediary costs by enabling direct peer transactions with transparent reputation systems",
    unlockPath: "1) Create verifiable track record system, 2) Build algorithmic trust scores, 3) Implement transparent dispute resolution, 4) Remove yourself as middleman",
    precedents: ["eBay (seller reputation system)", "Airbnb (host/guest reviews)", "Bitcoin (trustless peer transactions)"],
    enablers: ["Transparent review systems", "Verifiable transaction history", "Automated dispute resolution", "Identity verification"],
    viabilityFactors: {
      strongWhen: /reputation|track.?record|transparent|verif|history|peer/i,
      weakWhen: /complex|high.?risk|regulatory|financial|medical/i,
    },
  },

  // ── Regulatory constraint removal ──
  {
    constraintTypes: ["regulatory_cage"],
    unlockedBusinessModel: "Direct-to-consumer model bypassing traditional intermediaries",
    valueMechanism: "Capture the margin currently absorbed by regulated intermediaries by going direct",
    unlockPath: "1) Identify regulatory arbitrage opportunities, 2) Structure as different entity type, 3) Build direct customer relationships, 4) Handle compliance internally",
    precedents: ["Tesla (direct car sales bypassing dealers)", "Casper (direct mattress sales bypassing retail)", "Dollar Shave Club (direct razor sales bypassing retail)"],
    enablers: ["Digital marketing channels", "Direct fulfillment capability", "Customer service infrastructure", "Regulatory compliance team"],
    viabilityFactors: {
      strongWhen: /direct|intermediar|markup|dealer|agent|distributor/i,
      weakWhen: /complex.?regulat|medical|financial|legal|safety/i,
    },
  },

  // ── Labor cost constraint removal ──
  {
    constraintTypes: ["human_capacity", "knowledge_lock"],
    unlockedBusinessModel: "Ultra-premium artisan positioning with engineered scarcity",
    valueMechanism: "Instead of scaling labor, position the constraint as exclusivity — high labor cost becomes luxury signal",
    unlockPath: "1) Rebrand labor intensity as craftsmanship, 2) Create waitlists and limited availability, 3) Raise prices to match premium positioning, 4) Tell the artisan story",
    precedents: ["Hermès (18+ hour handbags, 2-year waitlists)", "Patek Philippe (6-month watchmaking, $100K+ prices)", "Michelin restaurants (limited seats, extreme personalization)"],
    enablers: ["Verifiable quality differentiation", "Strong brand narrative", "Affluent target market", "Scarce capacity positioning"],
    viabilityFactors: {
      strongWhen: /craft|quality|artisan|premium|luxury|exclusive|bespoke/i,
      weakWhen: /commodity|price.?sensitive|mass.?market|volume|scale/i,
    },
  },

  // ── Capital constraint removal ──
  {
    constraintTypes: ["asset_utilization", "margin_squeeze"],
    unlockedBusinessModel: "Asset-light platform model coordinating others' assets",
    valueMechanism: "Instead of owning expensive assets, become the intelligence layer that optimizes others' asset utilization",
    unlockPath: "1) Build software that makes others' assets more efficient, 2) Take percentage of efficiency gains, 3) Scale through network effects, 4) Never own the underlying assets",
    precedents: ["Flexport (logistics optimization without owning ships)", "OpenTable (restaurant optimization without owning restaurants)", "AWS (compute optimization for others)"],
    enablers: ["Software development capability", "Network effect dynamics", "Clear value proposition for asset owners", "Scalable technology platform"],
    viabilityFactors: {
      strongWhen: /optimi|efficien|intelligen|platform|network|coordinat/i,
      weakWhen: /own|asset.?heavy|capital.?intensiv|inventory/i,
    },
  },

  // ── Information asymmetry removal ──
  {
    constraintTypes: ["information_asymmetry"],
    unlockedBusinessModel: "Transparent marketplace with full information disclosure",
    valueMechanism: "Create value by eliminating information gaps — transparency becomes the product",
    unlockPath: "1) Aggregate hidden information from multiple sources, 2) Make it freely accessible and searchable, 3) Monetize through premium features or lead generation, 4) Build trust through radical transparency",
    precedents: ["Glassdoor (salary transparency)", "Carfax (vehicle history transparency)", "PriceGrabber (price comparison transparency)"],
    enablers: ["Access to hidden data sources", "Data aggregation infrastructure", "User-friendly presentation layer", "Trust in your neutrality"],
    viabilityFactors: {
      strongWhen: /transparen|information|data|comparison|hidden|opaque/i,
      weakWhen: /proprietary|confidential|trade.?secret|competitive/i,
    },
  },

  // ── Coordination failure removal ──
  {
    constraintTypes: ["coordination_failure", "fragmented_supply"],
    unlockedBusinessModel: "Orchestration platform managing complex multi-party workflows",
    valueMechanism: "Become the single coordination layer that enables previously impossible multi-party value creation",
    unlockPath: "1) Map all stakeholder touchpoints, 2) Build workflow orchestration system, 3) Handle incentive alignment, 4) Take percentage of increased efficiency",
    precedents: ["Stripe (coordinating payments across merchants, banks, processors)", "Shopify (coordinating merchants, customers, fulfillment, payments)", "BuildZoom (coordinating contractors, permits, inspections)"],
    enablers: ["Workflow management technology", "Stakeholder incentive alignment", "Trust from all parties", "Clear value creation measurement"],
    viabilityFactors: {
      strongWhen: /workflow|orchestrat|coordinat|multi.?party|stakeholder|complex/i,
      weakWhen: /simple|bilateral|direct|straightforward/i,
    },
  },

  // ── Scale constraint removal ──
  {
    constraintTypes: ["human_capacity", "asset_utilization"],
    unlockedBusinessModel: "Network model where users create value for each other",
    valueMechanism: "Users become both consumers and producers — the network scales itself without your direct involvement",
    unlockPath: "1) Design system where user participation creates value for others, 2) Build tools that enable user-to-user value creation, 3) Focus on platform governance, not content creation, 4) Revenue from network effects",
    precedents: ["YouTube (creators make content, viewers consume)", "Airbnb (hosts provide inventory, guests consume)", "Uber (drivers provide service, riders consume)"],
    enablers: ["Network effect dynamics", "User incentive alignment", "Platform governance capabilities", "Technology that enables peer creation"],
    viabilityFactors: {
      strongWhen: /network|peer|user.?generat|community|platform|viral/i,
      weakWhen: /expert|professional|regulated|high.?risk|complex/i,
    },
  },
];

// ═══════════════════════════════════════════════════════════════
//  SECOND-ORDER ENGINE
// ═══════════════════════════════════════════════════════════════

/**
 * Generate second-order unlocks — what becomes possible if constraints disappear?
 */
export function generateSecondOrderUnlocks(
  constraintShapes: ConstraintShape[],
  maxPerConstraint: number = 2,
  maxTotal: number = 4
): SecondOrderUnlock[] {
  const allUnlocks: SecondOrderUnlock[] = [];

  for (const shape of constraintShapes) {
    const candidates: { unlock: SecondOrderUnlock; score: number }[] = [];

    for (const template of UNLOCK_TEMPLATES) {
      // Must match constraint type
      if (!template.constraintTypes.includes(shape.bottleneckType)) continue;

      // Evaluate viability based on constraint context
      const constraintText = `${shape.sourceConstraintLabel} ${shape.scarceResource}`.toLowerCase();
      const strongMatch = constraintText.match(template.viabilityFactors.strongWhen);
      const weakMatch = constraintText.match(template.viabilityFactors.weakWhen);

      const strongScore = strongMatch ? strongMatch.length * 0.3 : 0;
      const weakScore = weakMatch ? weakMatch.length * 0.4 : 0;
      const netScore = 0.5 + strongScore - weakScore;

      let viability: SecondOrderUnlock["viability"];
      if (netScore >= 0.8) viability = "transformational";
      else if (netScore >= 0.5) viability = "significant";
      else viability = "incremental";

      // Skip weak unlocks
      if (netScore < 0.3) continue;

      candidates.push({
        score: netScore,
        unlock: {
          id: `unlock-${shape.id}-${template.constraintTypes[0]}`,
          sourceConstraint: shape,
          unlockedBusinessModel: template.unlockedBusinessModel,
          valueMechanism: template.valueMechanism,
          unlockPath: template.unlockPath,
          precedents: template.precedents,
          enablers: template.enablers,
          viability,
        },
      });
    }

    // Take top N per constraint
    candidates.sort((a, b) => b.score - a.score);
    allUnlocks.push(...candidates.slice(0, maxPerConstraint).map(c => c.unlock));
  }

  // Return top N total
  return allUnlocks.slice(0, maxTotal);
}

/**
 * Format second-order unlocks for injection into AI prompts.
 */
export function formatUnlocksForPrompt(unlocks: SecondOrderUnlock[]): string {
  if (unlocks.length === 0) return "";

  const lines = unlocks.map((unlock, i) => {
    return (
      `${i + 1}. IF CONSTRAINT REMOVED: "${unlock.sourceConstraint.sourceConstraintLabel}"\n` +
      `   UNLOCKED BUSINESS MODEL: ${unlock.unlockedBusinessModel}\n` +
      `   VALUE MECHANISM: ${unlock.valueMechanism}\n` +
      `   UNLOCK PATH: ${unlock.unlockPath}\n` +
      `   PRECEDENTS: ${unlock.precedents.join("; ")}\n` +
      `   VIABILITY: ${unlock.viability}`
    );
  });

  return `SECOND-ORDER UNLOCKS (explore business models that become possible if constraints were removed):\n${lines.join("\n\n")}`;
}