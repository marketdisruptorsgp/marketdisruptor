/**
 * PRODUCT MODE CONSTRAINT TEMPLATES — §6.1
 *
 * 10+ product-specific constraint templates that map detected structural
 * signals to product-market relevant constraints.
 *
 * These use product-market language — unit economics, durability, supply
 * chain, channel margin — rather than service-mode language (billable hours,
 * owner bottleneck, founder dependency).
 *
 * Usage:
 *   const constraints = selectProductConstraints(profile, evidence);
 *   // Returns up to 4 relevant ProductConstraint objects sorted by impact
 */

import type { Evidence } from "@/lib/evidenceEngine";
import type { ProductFacetProfile } from "./productStructuralInference";
import type { ProductConstraint } from "./types";

// ═══════════════════════════════════════════════════════════════
//  CONSTRAINT TEMPLATES
// ═══════════════════════════════════════════════════════════════

const PRODUCT_CONSTRAINT_TEMPLATES: ProductConstraint[] = [
  // ── 1. Durability failure / premature product failure ─────────────────────
  {
    id: "durability_risk",
    label: "Durability gap erodes brand trust",
    description:
      "Physical failure (earcup flaking, plastic cracking, hinge snap) is the #1 driver of negative reviews " +
      "and repeat-return behaviour. At scale, durability failure generates warranty cost, " +
      "return logistics cost, and brand damage that compounds with each product generation. " +
      "Competitors with superior materials or modular designs win on longevity.",
    impact: "high",
    dimension: "product",
  },

  // ── 2. Repairability friction ─────────────────────────────────────────────
  {
    id: "repairability_friction",
    label: "Non-repairable design limits lifecycle value",
    description:
      "Products with glued enclosures, proprietary fasteners, or unavailable spare parts force customers " +
      "into a replacement cycle rather than repair. This drives dissatisfaction (right-to-repair backlash), " +
      "limits lifetime value, and misses the parts/accessories revenue opportunity. " +
      "A repairable design turns a durability constraint into a revenue stream.",
    impact: "high",
    dimension: "product",
  },

  // ── 3. Unit economics pressure / thin margin ─────────────────────────────
  {
    id: "unit_economics_pressure",
    label: "Unit economics compress at retail price point",
    description:
      "Retail channels typically take 30–40% margin. At the current COGS structure, " +
      "gross margin per unit leaves insufficient room for customer acquisition, warranty reserves, " +
      "and reinvestment in R&D. Without DTC recovery or a recurring revenue layer, " +
      "every retail unit sold erodes the ability to fund the next product iteration.",
    impact: "high",
    dimension: "economics",
  },

  // ── 4. Supply chain concentration ────────────────────────────────────────
  {
    id: "supply_chain_risk",
    label: "Supply chain concentration creates production vulnerability",
    description:
      "Reliance on a small number of component suppliers or a single contract manufacturer " +
      "creates both cost and continuity risk. A single supplier disruption can halt production. " +
      "Single-source components also limit negotiating leverage on input cost, " +
      "compressing margins further at volume.",
    impact: "high",
    dimension: "supply_chain",
  },

  // ── 5. Feature commoditization ────────────────────────────────────────────
  {
    id: "feature_commoditization",
    label: "Feature parity with mass-market competitors",
    description:
      "At the current price point, the product competes on specification parity with established players " +
      "(Sony, Bose, Sennheiser) who have lower manufacturing cost and larger marketing budgets. " +
      "Feature improvements cost more to implement than buyers perceive as incremental value. " +
      "Non-feature differentiation — durability, repairability, community, sustainability — is required to escape the commodity trap.",
    impact: "medium",
    dimension: "market",
  },

  // ── 6. Channel dependency ─────────────────────────────────────────────────
  {
    id: "channel_dependency",
    label: "Channel intermediation limits margin and customer relationship",
    description:
      "Retail and wholesale channels take 30–40% margin and own the direct customer relationship. " +
      "Without DTC capability, the brand cannot capture customer data for retargeting, " +
      "cannot test pricing elasticity, and cannot build a direct repair/parts business. " +
      "Every sale through an intermediary is a sale of margin, data, and lifetime value.",
    impact: "medium",
    dimension: "channel",
  },

  // ── 7. Manufacturing moat weakness ───────────────────────────────────────
  {
    id: "manufacturing_moat_weakness",
    label: "Design innovations are replicable within 6–12 months",
    description:
      "Any hardware differentiation — modular connectors, novel form factor, custom materials — " +
      "can be copied by incumbents at scale within one product cycle. " +
      "Hardware novelty alone is not a durable moat. Defensibility must come from " +
      "brand loyalty, community, software/service lock-in, or patent protection.",
    impact: "medium",
    dimension: "market",
  },

  // ── 8. Customer acquisition efficiency ───────────────────────────────────
  {
    id: "customer_acquisition_efficiency",
    label: "Customer acquisition cost extends payback period",
    description:
      "Paid advertising for consumer hardware typically costs $40–60 per acquired customer. " +
      "At current unit gross margin, payback period is extended beyond one purchase. " +
      "Sustainable unit economics require either: (a) repeat purchase rate, " +
      "(b) word-of-mouth multiplier above 1.5×, or (c) recurring revenue beyond the initial hardware sale.",
    impact: "medium",
    dimension: "economics",
  },

  // ── 9. Capital intensity of hardware launch ───────────────────────────────
  {
    id: "capital_intensity",
    label: "Hardware launch requires capital commitment before revenue",
    description:
      "Initial production tooling and inventory require capital commitment before a single unit is sold. " +
      "Unit breakeven depends on total cumulative volume, which requires marketing spend to achieve. " +
      "This creates a cash flow cliff: capital out before revenue in, " +
      "with significant execution risk if early demand is softer than projected.",
    impact: "medium",
    dimension: "economics",
  },

  // ── 10. Low switching costs ───────────────────────────────────────────────
  {
    id: "low_switching_costs",
    label: "Low switching costs enable easy defection to competitors",
    description:
      "Buyers can replace the product in a single purchase decision with minimal friction. " +
      "Without ecosystem lock-in (software, parts, community), repeat purchase is driven " +
      "entirely by brand preference — which is expensive to build and maintain. " +
      "Every product generation must re-earn the customer rather than retain them.",
    impact: "low",
    dimension: "market",
  },

  // ── 11. Regulatory / certification barriers ───────────────────────────────
  {
    id: "regulatory_certification_cost",
    label: "Certification and compliance cost erodes launch margin",
    description:
      "Consumer electronics require FCC, CE, RoHS, and regional compliance certifications " +
      "before market entry. Testing and certification cycles add 2–4 months to launch timelines " +
      "and $15,000–50,000 in upfront cost that must be amortized over the first production run. " +
      "Design changes that invalidate certifications restart the cycle.",
    impact: "low",
    dimension: "economics",
  },

  // ── 12. Single product line risk ─────────────────────────────────────────
  {
    id: "single_product_line_risk",
    label: "Single product dependency concentrates revenue risk",
    description:
      "A single product SKU concentrates all revenue risk on one design, one BOM, and one " +
      "manufacturing relationship. A product defect, supply disruption, or market shift can " +
      "eliminate all revenue simultaneously. Portfolio diversification and product line extensions " +
      "provide resilience and cross-sell revenue opportunities.",
    impact: "low",
    dimension: "economics",
  },
];

// ═══════════════════════════════════════════════════════════════
//  SELECTION LOGIC
// ═══════════════════════════════════════════════════════════════

const IMPACT_ORDER: Record<ProductConstraint["impact"], number> = {
  high: 3,
  medium: 2,
  low: 1,
};

/**
 * Select the most relevant product constraints for the given facet profile
 * and evidence corpus. Returns 2–4 constraints sorted by impact.
 *
 * Never returns service-mode constraints (labor_intensity, owner_dependency, etc.).
 *
 * @param profile  - Product facet profile from inferProductStructuralProfile()
 * @param evidence - Raw evidence array for tie-breaking (optional)
 * @param maxCount - Maximum number of constraints to return (default 4)
 */
export function selectProductConstraints(
  profile: ProductFacetProfile,
  evidence: Evidence[] = [],
  maxCount: number = 4,
): ProductConstraint[] {
  // Determine which constraints are active based on profile signals
  const activeIds = new Set<string>();

  if (profile.durability_risk !== "none") activeIds.add("durability_risk");
  if (profile.repairability_friction !== "none") activeIds.add("repairability_friction");
  if (profile.unit_economics_pressure !== "none") activeIds.add("unit_economics_pressure");
  if (profile.supply_chain_risk !== "none") activeIds.add("supply_chain_risk");
  if (profile.feature_commoditization !== "none") activeIds.add("feature_commoditization");

  // Add channel dependency if evidence mentions retail/channel terms
  const evidenceCorpus = evidence.map(e => `${e.label ?? ""} ${e.description ?? ""}`).join(" ").toLowerCase();
  if (/retail|channel|distribut|wholesale|intermediar/.test(evidenceCorpus)) {
    activeIds.add("channel_dependency");
  }
  if (/copy|knockoff|replicate|clone|competitor|imit/.test(evidenceCorpus)) {
    activeIds.add("manufacturing_moat_weakness");
  }
  if (/cac|acqui|advertising|paid.*channel/.test(evidenceCorpus)) {
    activeIds.add("customer_acquisition_efficiency");
  }

  // Filter templates to active ones
  let active = PRODUCT_CONSTRAINT_TEMPLATES.filter(t => activeIds.has(t.id));

  // If less than 2 active, promote top templates by priority order
  if (active.length < 2) {
    const promoted = PRODUCT_CONSTRAINT_TEMPLATES
      .filter(t => !activeIds.has(t.id))
      .slice(0, Math.max(0, 2 - active.length));
    active = [...active, ...promoted];
  }

  // Sort by impact (high → medium → low) then by template order
  return active
    .sort((a, b) => IMPACT_ORDER[b.impact] - IMPACT_ORDER[a.impact])
    .slice(0, maxCount);
}

// ═══════════════════════════════════════════════════════════════
//  EXPORTS
// ═══════════════════════════════════════════════════════════════

export { PRODUCT_CONSTRAINT_TEMPLATES };
