/**
 * PRODUCT MODE FIRST-MOVE PLANNER — §5.3
 *
 * Generates concrete, product-market–specific validation steps for each
 * product opportunity pattern. Each first move is a real experiment with a
 * clear success gate — not a generic "interview 20 suppliers."
 *
 * The goal is to give a product entrepreneur the smallest action that proves
 * (or disproves) the core assumption behind the opportunity before committing
 * capital to manufacturing or distribution.
 */

import type { StructuralProfile } from "@/lib/reconfiguration/structuralProfile";
import type { FirstMove } from "@/lib/reconfiguration/opportunityDeepening";

// ─────────────────────────────────────────────────────────────────────────────
//  PRODUCT FIRST-MOVE RESULT
// ─────────────────────────────────────────────────────────────────────────────

export interface ProductFirstMove extends Omit<FirstMove, "successCriteria"> {
  /** Suggested timeline for the first move (more detailed than generic FirstMove) */
  timeline: string;
  /** Ordered list of success criteria (each must be measurable) */
  successCriteria: string[];
  /** Specific risks to monitor during the validation */
  risks: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
//  PATTERN → FIRST MOVE MAPPING
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a concrete product-market first move for a given opportunity pattern.
 *
 * @param patternId  - The opportunity pattern ID (from productOpportunities.ts)
 * @param profile    - The structural profile for context-sensitive detail
 * @returns          - A ProductFirstMove with concrete action, timeline, and success gates
 */
export function generateProductFirstMove(
  patternId: string,
  profile: StructuralProfile,
): ProductFirstMove {
  switch (patternId) {
    // ── Durability-as-Moat ──────────────────────────────────────────────────
    case "durability_as_moat":
      return {
        action:
          "Prototype the modular/repairable component (e.g., snap-fit earcup, replaceable battery door). " +
          "Recruit 30 current product users and test willingness-to-pay for repairability at a 20% price premium.",
        learningObjective:
          "Whether customers value repairability enough to pay a meaningful price premium, " +
          "and whether the modular design meets acceptable quality and reliability standards.",
        timeframe: "4 weeks",
        timeline: "Week 1–2: build functional prototype; Week 3–4: user testing and willingness-to-pay survey",
        successCriteria: [
          "Prototype tested with ≥30 current product users",
          "≥70% report they would pay a 20% premium for repairability",
          "Prototype manufacturing cost estimate within 15% of target BOM",
          "No critical reliability/audio-quality regression vs. non-modular baseline",
        ],
        risks: [
          "Modular connectors may introduce reliability or audio-quality tradeoffs vs. hardwired design",
          "First-unit costs may be 30–40% higher than mass production estimate — verify at scale",
        ],
      };

    // ── Vertical Integration of Product Experience ─────────────────────────
    case "vertical_integration_experience":
      return {
        action:
          "Build or license a hearing-profile calibration MVP. " +
          "Recruit 50 users of your existing product (or a competitor's) and test willingness-to-pay for a " +
          "$5/month audio personalisation subscription before bundling with hardware.",
        learningObjective:
          "Whether customers perceive meaningful value in software personalisation vs. standard firmware, " +
          "and whether willingness-to-pay is sufficient to justify backend infrastructure investment.",
        timeframe: "6 weeks",
        timeline: "Week 1–3: MVP calibration app (licensed or built); Week 4–6: beta with 50 users, measure retention",
        successCriteria: [
          "50 beta users enrolled at $5/month",
          "≥40% report meaningful perceived improvement vs. stock EQ after 2 weeks",
          "Retention ≥60% after 2 months",
          "Net Promoter Score ≥30 among active subscribers",
        ],
        risks: [
          "Hearing-profile accuracy varies significantly across user populations — requires audio engineering rigour",
          "Backend infrastructure (cloud storage, firmware OTA) adds ongoing cost not reflected in initial BOM",
        ],
      };

    // ── Subscription + Hardware Model ──────────────────────────────────────
    case "subscription_hardware_model":
      return {
        action:
          "Launch a DTC pre-order campaign for 500 units at premium price ($249–299). " +
          "Simultaneously launch a parts/upgrades marketplace. " +
          "Track both pre-order conversion and parts purchase rate among delivered units.",
        learningObjective:
          "Whether DTC demand exists at the premium price point, and whether customers actually engage " +
          "with the recurring revenue model (parts, accessories, upgrades) after receiving the product.",
        timeframe: "8 weeks",
        timeline: "Week 1–2: pre-order page live; Week 3–8: fulfilment; Weeks 6–12: track parts purchase behaviour",
        successCriteria: [
          "≥60% pre-order to delivery conversion rate",
          "≥30% of delivered units have at least one parts/upgrade purchase within 6 months",
          "Net Promoter Score ≥40 on durability and repairability",
          "Return rate ≤8% (below consumer electronics category average of ~10–12%)",
        ],
        risks: [
          "Pre-order fulfilment delays damage brand trust — manufacturing timeline must be confirmed before launch",
          "Parts logistics complexity: high return rate on parts if tolerances are not precise",
        ],
      };

    // ── Premium Positioning + Community Brand Moat ─────────────────────────
    case "premium_community_moat":
      return {
        action:
          "Conduct a blind listening test with 50 audio enthusiasts: compare your product vs. " +
          "a $250 mass-market competitor. Measure: (a) audible preference rate, " +
          "(b) willingness-to-pay at $350+ if preference is confirmed.",
        learningObjective:
          "Whether demonstrable audio quality advantage exists at premium price, " +
          "and whether a credible subset of the market will pay $350+ based on that advantage.",
        timeframe: "3 weeks",
        timeline: "Week 1: recruit 50 participants (audio enthusiast forums, local audiophile groups); " +
          "Week 2: blind test sessions; Week 3: data analysis and positioning decision",
        successCriteria: [
          "≥60% of blind-test participants prefer your product's audio over $250 competitor",
          "≥40% express willingness-to-pay at $350+ given confirmed quality preference",
          "3+ premium retail or community partners express interest in stocking or featuring the product",
        ],
        risks: [
          "Blind test results may not confirm a meaningful audio quality advantage — be willing to pivot",
          "Audiophile community is vocal about authenticity — marketing must match product reality precisely",
        ],
      };

    // ── DTC-First + Premium Retail Channel ─────────────────────────────────
    case "dtc_premium_channel":
      return {
        action:
          "Launch a DTC pre-order landing page for the first production run. " +
          "Success gate before approaching any retail partners.",
        learningObjective:
          "Whether organic/paid DTC demand exists at your target price point with acceptable " +
          "acquisition cost, and whether you can deliver a product experience that earns NPS ≥40.",
        timeframe: "6–8 weeks",
        timeline: "Week 1: landing page + pre-order live; Week 2–6: paid/organic acquisition; " +
          "Week 6–8: fulfilment + NPS survey",
        successCriteria: [
          "≥60% pre-order to delivery conversion",
          "Net Promoter Score ≥40 from delivered-unit survey",
          "Customer acquisition cost ≤40% of gross margin per unit",
          "At least 3 premium retail partners approached after DTC metrics are proven",
        ],
        risks: [
          "DTC acquisition cost may exceed margin — validate CAC at small scale before scaling spend",
          "Retail approach requires proven metrics — launching retail before DTC validation increases risk",
        ],
      };

    // ── Generic product first move (fallback) ──────────────────────────────
    default: {
      const hasDurability = profile.bindingConstraints.some(c =>
        /durabil|fail|break|crack|repair|lifespan/i.test(c.constraintName + " " + c.explanation),
      );
      const hasChannelConstraint = profile.distributionControl === "intermediated";

      if (hasDurability) {
        return {
          action:
            "Prototype the specific design change that addresses the primary durability failure. " +
            "Test with 20–30 users at a 15–20% price premium.",
          learningObjective: "Validate that the durability improvement is perceivable and worth a price premium",
          timeframe: "4 weeks",
          timeline: "Week 1–2: prototype; Week 3–4: user test",
          successCriteria: [
            "≥20 users tested",
            "≥60% would pay premium for improvement",
            "Manufacturing cost delta confirmed within 20% of target",
          ],
          risks: [
            "Durability improvement may add more cost than buyers will pay for",
            "Prototype may not reflect production-quality reliability",
          ],
        };
      }

      if (hasChannelConstraint) {
        return {
          action:
            "Launch a DTC pre-order for the next production batch. " +
            "Measure conversion rate and NPS before committing to additional retail channel.",
          learningObjective: "Validate DTC demand and unit economics before expanding retail presence",
          timeframe: "6 weeks",
          timeline: "Week 1–2: pre-order page; Week 3–6: acquisition and fulfilment",
          successCriteria: [
            "≥60% pre-order to delivery conversion",
            "NPS ≥35",
            "DTC CAC ≤35% of gross margin",
          ],
          risks: [
            "DTC acquisition cost may be high without established brand recognition",
            "Fulfilment delays reduce NPS and future conversion rates",
          ],
        };
      }

      return {
        action:
          "Identify the 5–10 customers most affected by the primary product constraint. " +
          "Present the proposed design change and measure willingness-to-pay at a 15–20% premium.",
        learningObjective:
          "Whether customers value the improvement enough to justify the additional manufacturing cost",
        timeframe: "2 weeks",
        timeline: "Week 1: recruit and interview; Week 2: synthesise and decide",
        successCriteria: [
          "≥8 customers interviewed",
          "≥50% express willingness-to-pay at premium",
          "Clear articulation of which design dimension drives the willingness-to-pay",
        ],
        risks: [
          "Customer interview bias may overstate willingness-to-pay vs. actual purchase behaviour",
          "Small sample may not be representative of target market",
        ],
      };
    }
  }
}
