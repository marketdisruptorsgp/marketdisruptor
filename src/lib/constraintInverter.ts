/**
 * CONSTRAINT INVERSION ENGINE
 *
 * Instead of solving constraints, this engine explores whether they can be
 * FLIPPED into competitive advantages, barriers to entry, or premium signals.
 *
 * Examples:
 *   - "High labor cost" → "Premium artisan positioning — your cost IS your moat"
 *   - "Small market" → "Exclusivity signal — scarcity drives premium pricing"
 *   - "Regulatory burden" → "Compliance as barrier to entry — regulation protects you"
 *   - "Manual process" → "Human touch as premium differentiator"
 *
 * Not every constraint can be inverted. The engine evaluates inversion
 * viability and only surfaces those with genuine strategic potential.
 */

import type { ConstraintShape, BottleneckType } from "@/lib/analogEngine";

// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════

export interface ConstraintInversion {
  id: string;
  /** The original constraint being inverted */
  sourceConstraint: ConstraintShape;
  /** The inversion type — how is the constraint being reframed? */
  inversionType: InversionType;
  /** The reframed perspective */
  invertedFrame: string;
  /** Why this inversion works — the structural mechanism */
  mechanism: string;
  /** Real-world precedent where this inversion worked */
  precedent: string;
  /** What must be true for this inversion to hold */
  requiredConditions: string[];
  /** How strong is this inversion? */
  viability: "strong" | "moderate" | "speculative";
}

export type InversionType =
  | "barrier_to_entry"     // Your cost/difficulty keeps competitors out
  | "premium_signal"       // Your constraint signals quality/exclusivity
  | "scarcity_advantage"   // Limited supply becomes luxury positioning
  | "trust_moat"           // Your complexity becomes credibility
  | "network_lock"         // Your switching costs protect your base
  | "regulatory_shield"    // Compliance protects you from disruptors
  | "knowledge_fortress"   // Your expertise gap IS your defensibility
  | "anti_scale_premium";  // Your inability to scale IS exclusivity

// ═══════════════════════════════════════════════════════════════
//  INVERSION TEMPLATES
// ═══════════════════════════════════════════════════════════════

interface InversionTemplate {
  bottleneckTypes: BottleneckType[];
  inversionType: InversionType;
  invertedFrame: string;
  mechanism: string;
  precedent: string;
  requiredConditions: string[];
  viabilityFactors: {
    /** If these words appear in the constraint, boost viability */
    boostSignals: RegExp;
    /** If these words appear, reduce viability */
    weakenSignals: RegExp;
  };
}

const INVERSION_TEMPLATES: InversionTemplate[] = [
  // ── High labor cost → Premium positioning ──
  {
    bottleneckTypes: ["human_capacity", "knowledge_lock"],
    inversionType: "premium_signal",
    invertedFrame: "Your reliance on skilled humans isn't a cost problem — it's a PREMIUM SIGNAL. In a world of automation, human expertise becomes the luxury differentiator.",
    mechanism: "As competitors automate and commoditize, the human touch becomes scarce and therefore premium-priced. Your 'inefficiency' becomes your brand.",
    precedent: "Hermès refuses to automate handbag production. Each bag takes 18+ hours of hand-stitching. This 'constraint' justifies $10K+ prices and 2-year waitlists.",
    requiredConditions: [
      "Customers must value quality/craft over price",
      "The human element must be visible and appreciable",
      "Market must have a segment willing to pay premium",
    ],
    viabilityFactors: {
      boostSignals: /craft|quality|premium|bespoke|custom|artisan|luxury|expert|specialist/i,
      weakenSignals: /commodity|price.?sensitive|budget|mass.?market|volume|race.?to/i,
    },
  },

  // ── Regulatory burden → Regulatory shield ──
  {
    bottleneckTypes: ["regulatory_cage"],
    inversionType: "regulatory_shield",
    invertedFrame: "Regulation isn't blocking you — it's PROTECTING you. Every compliance requirement is a barrier your competitors must also clear.",
    mechanism: "Regulatory compliance creates a moat: new entrants face the same costly, time-consuming requirements. Your existing compliance becomes a sunk-cost advantage.",
    precedent: "Established banks use regulatory compliance costs ($100M+/year) as competitive defense against fintech disruptors. Only well-funded challengers can enter.",
    requiredConditions: [
      "Compliance costs must be high enough to deter new entrants",
      "You must be already compliant or nearly so",
      "The regulation must be stable (not being deregulated)",
    ],
    viabilityFactors: {
      boostSignals: /licens|certified|accredit|established|incumbent|years.?of.?compliance/i,
      weakenSignals: /deregulat|simplif|exempt|waiver|startup.?friendly/i,
    },
  },

  // ── Geographic tether → Local fortress ──
  {
    bottleneckTypes: ["geographic_tether"],
    inversionType: "barrier_to_entry",
    invertedFrame: "Your geographic constraint is a LOCAL MONOPOLY. No remote competitor can match your physical presence advantage.",
    mechanism: "Services requiring physical presence create natural geographic moats. Instead of fighting the constraint, deepen it — become so embedded locally that entry costs for outsiders are prohibitive.",
    precedent: "Waste Management built regional monopolies because landfills require local permits and physical proximity. Geographic constraint = defensible territory.",
    requiredConditions: [
      "Physical presence must be genuinely required (can't be digitized)",
      "You can dominate the local geography before others",
      "The local market must be large enough to sustain the business",
    ],
    viabilityFactors: {
      boostSignals: /local|community|physical|on.?site|relationships|trust|embedded|established/i,
      weakenSignals: /remote|digital|virtual|telehealth|online|anywhere/i,
    },
  },

  // ── Small market → Scarcity premium ──
  {
    bottleneckTypes: ["demand_mismatch", "fragmented_supply"],
    inversionType: "scarcity_advantage",
    invertedFrame: "Your small market isn't a limitation — it's an EXCLUSIVITY SIGNAL. Being niche means you can charge premium prices and build deep expertise.",
    mechanism: "In a small market, becoming the dominant player is achievable. Scarcity of alternatives lets you set premium pricing. Your depth of specialization becomes unmatched.",
    precedent: "Rolls-Royce produces ~6,000 cars/year vs Toyota's 10M. The small scale enables extreme customization, personal service, and $300K+ pricing.",
    requiredConditions: [
      "The niche market must have customers willing to pay premium",
      "Being the dominant niche player must be achievable",
      "The niche must be defensible (hard for generalists to serve well)",
    ],
    viabilityFactors: {
      boostSignals: /niche|special|exclusive|premium|high.?end|boutique|select|curated/i,
      weakenSignals: /commodity|standard|generic|mass|undifferent/i,
    },
  },

  // ── Switching costs → Customer lock-in ──
  {
    bottleneckTypes: ["switching_moat"],
    inversionType: "network_lock",
    invertedFrame: "Your customers' switching costs aren't trapping them — they're PROTECTING your revenue. Lean into lock-in by adding more value that deepens integration.",
    mechanism: "Instead of fighting switching friction, increase it by becoming more essential. Every integration, customization, and data point makes switching more costly for the customer.",
    precedent: "Salesforce's extensive customization ecosystem means switching CRMs costs $100K-$1M+. This 'friction' drives 95%+ retention rates.",
    requiredConditions: [
      "Customers must derive genuine value (not just be trapped)",
      "You must continuously add features that justify the lock-in",
      "There must be a reasonable initial onboarding period",
    ],
    viabilityFactors: {
      boostSignals: /data|integration|custom|workflow|ecosystem|platform|embed/i,
      weakenSignals: /commod|standard|interoperab|open.?source|portable/i,
    },
  },

  // ── Knowledge dependency → Knowledge fortress ──
  {
    bottleneckTypes: ["knowledge_lock", "information_asymmetry"],
    inversionType: "knowledge_fortress",
    invertedFrame: "Your specialized knowledge isn't a scaling problem — it's an UNASSAILABLE MOAT. Competitors can't copy what took years to learn.",
    mechanism: "Deep domain expertise creates a learning-curve moat. While others try to replicate your knowledge, you're already years ahead. The constraint IS the defensibility.",
    precedent: "McKinsey's value comes from accumulated institutional knowledge that takes decades to build. No startup can replicate it overnight, despite many trying.",
    requiredConditions: [
      "The knowledge must be genuinely deep and hard to replicate",
      "The knowledge must translate to measurably better outcomes",
      "AI/automation must not be able to replicate the expertise (yet)",
    ],
    viabilityFactors: {
      boostSignals: /deep|years.?of|institutional|proprietary|unique|irreplaceable|domain/i,
      weakenSignals: /AI|automat|standardiz|templat|commodit|democratiz/i,
    },
  },

  // ── Can't scale → Anti-scale premium ──
  {
    bottleneckTypes: ["human_capacity", "asset_utilization", "geographic_tether"],
    inversionType: "anti_scale_premium",
    invertedFrame: "Your inability to scale isn't a weakness — it's ENGINEERED SCARCITY. Limited availability drives premium pricing and waitlists.",
    mechanism: "When you can't serve everyone, you can choose who you serve. Scarcity creates urgency, waitlists create social proof, and limited capacity justifies premium pricing.",
    precedent: "Michelin-starred restaurants have 20 tables and 6-month waitlists. The constraint (limited capacity) IS the product (exclusivity).",
    requiredConditions: [
      "Your output must be perceived as high-quality",
      "Demand must exceed supply (or can be cultivated to)",
      "You must be willing to turn away customers",
    ],
    viabilityFactors: {
      boostSignals: /quality|craft|personal|limited|exclusive|waitlist|demand|premium/i,
      weakenSignals: /grow|scale|volume|expand|mass|cheap|discount/i,
    },
  },
];

// ═══════════════════════════════════════════════════════════════
//  INVERSION ENGINE
// ═══════════════════════════════════════════════════════════════

/**
 * Generate constraint inversions — reframe constraints as potential advantages.
 * Only returns inversions with genuine viability.
 *
 * @param constraintShapes  Constraints to evaluate for inversion
 * @param maxPerConstraint  Maximum inversions per individual constraint
 * @param maxTotal          Maximum total inversions to return
 * @param analysisType      Engine analysis type — "product" mode suppresses
 *                          service-business inversions (Hermès handbag analogy,
 *                          premium-signal narratives) that are not applicable
 *                          to mass-market physical-product entrepreneurs.
 */
export function generateInversions(
  constraintShapes: ConstraintShape[],
  maxPerConstraint: number = 2,
  maxTotal: number = 4,
  analysisType: string = "service",
): ConstraintInversion[] {
  const allInversions: ConstraintInversion[] = [];

  // In product mode, suppress "premium_signal" inversion type (Hermès handbag analogy)
  // unless there is clear evidence of luxury/artisan positioning (ASP > $1000+).
  // Mass-market electronics entrepreneurs should not be told their labor cost is a
  // "PREMIUM SIGNAL" — this is a service-business narrative that does not apply.
  const suppressedInversionTypes = new Set<string>(
    analysisType === "product" ? ["premium_signal"] : [],
  );

  for (const shape of constraintShapes) {
    const candidates: { inversion: ConstraintInversion; score: number }[] = [];

    for (const template of INVERSION_TEMPLATES) {
      // Suppress wrong-mode inversion types in product mode
      if (suppressedInversionTypes.has(template.inversionType)) continue;

      // Must match bottleneck type
      if (!template.bottleneckTypes.includes(shape.bottleneckType)) continue;

      // Evaluate viability
      const constraintText = shape.sourceConstraintLabel + " " + shape.scarceResource;
      const boostMatch = constraintText.match(template.viabilityFactors.boostSignals);
      const weakenMatch = constraintText.match(template.viabilityFactors.weakenSignals);

      const boostScore = boostMatch ? boostMatch.length * 0.2 : 0;
      const weakenScore = weakenMatch ? weakenMatch.length * 0.3 : 0;
      const netScore = 0.5 + boostScore - weakenScore;

      let viability: ConstraintInversion["viability"];
      if (netScore >= 0.7) viability = "strong";
      else if (netScore >= 0.4) viability = "moderate";
      else viability = "speculative";

      // Skip weak inversions
      if (netScore < 0.3) continue;

      candidates.push({
        score: netScore,
        inversion: {
          id: `inv-${shape.id}-${template.inversionType}`,
          sourceConstraint: shape,
          inversionType: template.inversionType,
          invertedFrame: template.invertedFrame,
          mechanism: template.mechanism,
          precedent: template.precedent,
          requiredConditions: template.requiredConditions,
          viability,
        },
      });
    }

    // Take top N per constraint
    candidates.sort((a, b) => b.score - a.score);
    allInversions.push(...candidates.slice(0, maxPerConstraint).map(c => c.inversion));
  }

  // Return top N total
  return allInversions.slice(0, maxTotal);
}

/**
 * Format inversions for injection into AI prompts.
 */
export function formatInversionsForPrompt(inversions: ConstraintInversion[]): string {
  if (inversions.length === 0) return "";

  const lines = inversions.map((inv, i) => {
    return (
      `${i + 1}. CONSTRAINT: "${inv.sourceConstraint.sourceConstraintLabel}"\n` +
      `   INVERSION: ${inv.invertedFrame}\n` +
      `   MECHANISM: ${inv.mechanism}\n` +
      `   PRECEDENT: ${inv.precedent}\n` +
      `   VIABILITY: ${inv.viability}\n` +
      `   REQUIRED CONDITIONS: ${inv.requiredConditions.join("; ")}`
    );
  });

  return `CONSTRAINT INVERSIONS (consider flipping these constraints into advantages instead of solving them):\n${lines.join("\n\n")}`;
}
