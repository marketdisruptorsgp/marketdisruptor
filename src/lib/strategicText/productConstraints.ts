/**
 * PRODUCT MODE CONSTRAINT LIBRARY — §5.1
 *
 * Maps structural patterns detected in a product-mode analysis to
 * product-market–specific constraint labels and narratives.
 *
 * These replace the generic "founder coaching" language that assumes
 * a service-business worldview (billable hours, owner bottleneck, etc.)
 * with language that reflects the actual challenges a product entrepreneur
 * faces: unit economics, retail margins, differentiation, manufacturing moats.
 *
 * Usage:
 *   const result = mapStructureToProductConstraint(profile, bindingConstraintName);
 *   if (result) { /* use result.label and result.narrative *\/ }
 */

import type { StructuralProfile } from "@/lib/reconfiguration/structuralProfile";

// ─────────────────────────────────────────────────────────────────────────────
//  PRODUCT CONSTRAINT RESULT
// ─────────────────────────────────────────────────────────────────────────────

export interface ProductConstraintResult {
  /** Short label for the constraint (e.g. "Differentiation ceiling in mass market") */
  label: string;
  /** One-paragraph narrative explaining the constraint in product-market terms */
  narrative: string;
}

// ─────────────────────────────────────────────────────────────────────────────
//  STRUCTURAL PATTERN → PRODUCT CONSTRAINT MAP
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Map a detected structural pattern / binding-constraint name to a
 * product-market–specific label + narrative.
 *
 * Returns null when no product-specific mapping exists (callers can fall back
 * to the generic business-language translation).
 */
export function mapStructureToProductConstraint(
  profile: StructuralProfile,
  bindingConstraintName: string,
): ProductConstraintResult | null {
  const name = bindingConstraintName.toLowerCase();

  // ── Feature commoditization / intense competition ──────────────────────────
  if (/commodit|spec.?parity|feature.?war|differentiat|parity|price.?war|undifferentiat/.test(name)) {
    const asp = profile.dimensionConfidence?.["pricing"] ? "$150–250" : "your target price point";
    return {
      label: "Differentiation ceiling in mass market",
      narrative:
        `At ${asp}, you compete on spec parity with established players (Sony, Bose, Sennheiser). ` +
        `Feature improvements cost more to implement than buyers perceive as incremental value. ` +
        `Non-feature differentiation — durability, customization, community, sustainability — is your leverage.`,
    };
  }

  // ── Retail margin squeeze / channel dependency ──────────────────────────────
  if (/retail.*margin|channel.*margin|margin.*squeeze|intermediar|channel.*depend|distributor|wholesale/.test(name)) {
    const cogsNote = profile.marginStructure === "thin_margin"
      ? "With thin gross margins"
      : "With your current COGS";
    return {
      label: "Unit economics pressure",
      narrative:
        `Retail channels take 30–40% margin. ${cogsNote}, gross margin per unit leaves limited room for ` +
        `customer acquisition spend or reinvestment. Paths forward: (a) DTC to recover retail margin, ` +
        `(b) premium positioning to justify a higher average selling price, ` +
        `(c) recurring revenue beyond the initial hardware sale.`,
    };
  }

  // ── Design imitation risk / manufacturing moat weakness ────────────────────
  if (/imit|copy|knock.*off|copycat|manufactur.*moat|weak.*moat|defensib|imitation|replicate|clone/.test(name)) {
    return {
      label: "Manufacturing moat is weak",
      narrative:
        `Any differentiated hardware design — modular connectors, custom materials, novel form factor — ` +
        `can be copied by incumbents within 6–12 months at scale. ` +
        `Hardware novelty alone is not a durable moat. ` +
        `Defensibility must come from brand loyalty, community ecosystem, software/service lock-in, or patent protection.`,
    };
  }

  // ── Customer acquisition cost / channel economics ──────────────────────────
  if (/acqui.*cost|cac\b|customer.*acqui|paid.*channel|advertising.*cost|channel.*cost/.test(name)) {
    const marginNote = profile.marginStructure === "thin_margin"
      ? "At thin gross margins"
      : "At current gross margins";
    return {
      label: "Customer acquisition efficiency",
      narrative:
        `Paid advertising for consumer hardware typically costs $40–60 per acquired customer. ` +
        `${marginNote}, payback period is extended. ` +
        `To scale profitably: (a) increase repeat purchase rate and lifetime value, ` +
        `(b) achieve a word-of-mouth / referral multiplier above 1.5×, ` +
        `or (c) build recurring revenue (software, subscriptions, replacement parts).`,
    };
  }

  // ── Hardware capital intensity / tooling / inventory risk ──────────────────
  if (/capital.*intensi|tooling|inventor.*risk|upfront.*cost|production.*run|minimum.*order|moq\b/.test(name)) {
    return {
      label: "Capital intensity of hardware launch",
      narrative:
        `Initial production runs require significant tooling investment and inventory commitment before ` +
        `a single unit is sold. Unit-level breakeven depends on total cumulative volume. ` +
        `De-risk via: (a) pre-orders to validate demand before committing capital, ` +
        `(b) manufacturing partnerships or shared tooling to reduce upfront cost, ` +
        `or (c) phased rollout starting with a small DTC batch.`,
    };
  }

  // ── Margin compression / thin margin ───────────────────────────────────────
  if (/margin.*compress|thin.*margin|negative.*margin|low.*margin|squeeze.*margin/.test(name)) {
    return {
      label: "Unit economics pressure",
      narrative:
        `Margin compression means every channel cost, return, or quality issue immediately threatens ` +
        `profitability. At sub-20% gross margin, hardware businesses historically fail to generate ` +
        `sufficient cash flow for marketing, R&D, and working capital. ` +
        `Path forward requires one of: (a) ASP increase via premium positioning, ` +
        `(b) COGS reduction via manufacturing optimisation at volume, ` +
        `or (c) recurring revenue to supplement per-unit economics.`,
    };
  }

  // ── Supply fragmentation / supply chain complexity ─────────────────────────
  if (/supply.*fragment|vendor.*concentrat|single.*supplier|supply.*chain|component.*risk|bom.*risk/.test(name)) {
    return {
      label: "Supply chain concentration risk",
      narrative:
        `Reliance on a small number of component suppliers or contract manufacturers creates both ` +
        `cost and continuity risk. A single supplier disruption can halt production entirely. ` +
        `Mitigation: (a) qualify a secondary supplier for critical components, ` +
        `(b) redesign to use commodity components where quality allows, ` +
        `or (c) maintain safety stock for highest-risk parts.`,
    };
  }

  // ── Switching costs / platform lock-in ─────────────────────────────────────
  if (/switch.*cost|lock.?in|ecosystem.*depend|platform.*depend/.test(name)) {
    return {
      label: "Low switching cost exposure",
      narrative:
        `Buyers can replace your product with a competitor's in one purchase decision. ` +
        `Without ecosystem lock-in (software, parts ecosystem, community membership), ` +
        `repeat purchase is driven entirely by brand preference — which is expensive to build. ` +
        `Build stickiness through: software/app integration, consumables or parts subscriptions, ` +
        `or community membership that rewards loyalty.`,
    };
  }

  // No product-specific mapping found
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
//  CONVENIENCE: scan binding constraints and return best match
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Scan all binding constraints in the profile and return the first
 * product-specific constraint mapping found, or null.
 */
export function findProductConstraintFromProfile(
  profile: StructuralProfile,
): ProductConstraintResult | null {
  for (const bc of profile.bindingConstraints) {
    const result = mapStructureToProductConstraint(profile, bc.constraintName + " " + bc.explanation);
    if (result) return result;
  }
  return null;
}
