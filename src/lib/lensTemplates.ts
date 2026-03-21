/**
 * LENS ARCHETYPE TEMPLATES
 * Pre-built custom lens configurations that give users a head-start
 * instead of facing a blank form.
 */

import type { UserLens } from "@/components/LensToggle";

export interface LensTemplate {
  id: string;
  name: string;
  emoji: string;
  description: string;
  lens: Omit<UserLens, "id" | "is_default">;
}

export const LENS_TEMPLATES: LensTemplate[] = [
  {
    id: "pe-rollup",
    name: "PE Roll-Up",
    emoji: "🏗️",
    description: "Multi-location acquisition & consolidation strategy",
    lens: {
      name: "PE Roll-Up",
      lensType: "custom",
      primary_objective: "Evaluate roll-up acquisition targets for platform consolidation",
      target_outcome: "Identify businesses suitable for bolt-on acquisition with EBITDA accretion",
      risk_tolerance: "medium",
      time_horizon: "5+ years",
      available_resources: "Platform capital, operational playbook, centralized back-office",
      constraints: "Must show path to EBITDA margin expansion through operational consolidation. Avoid businesses requiring heavy CapEx transformation.",
      evaluation_priorities: { profitability: 0.35, feasibility: 0.30, desirability: 0.15, novelty: 0.20 },
    },
  },
  {
    id: "solo-operator",
    name: "Solo Operator",
    emoji: "🎯",
    description: "Owner-operator running a business with limited team",
    lens: {
      name: "Solo Operator",
      lensType: "custom",
      primary_objective: "Find actionable improvements a single operator can implement",
      target_outcome: "Quick wins that increase profitability without hiring or major capital",
      risk_tolerance: "low",
      time_horizon: "6 months",
      available_resources: "Limited budget ($5K-$50K), owner's time and expertise, existing customer relationships",
      constraints: "Must be implementable without additional full-time hires. Prefer revenue optimization over new market entry. No solutions requiring enterprise-grade technology.",
      evaluation_priorities: { feasibility: 0.40, profitability: 0.30, desirability: 0.20, novelty: 0.10 },
    },
  },
  {
    id: "franchise-evaluator",
    name: "Franchise Evaluator",
    emoji: "🔁",
    description: "Assess franchise or replicable business model potential",
    lens: {
      name: "Franchise Evaluator",
      lensType: "custom",
      primary_objective: "Evaluate whether this business model can be systematized and replicated",
      target_outcome: "Determine franchise viability, unit economics, and scalability bottlenecks",
      risk_tolerance: "low",
      time_horizon: "3 years",
      available_resources: "Franchise development capital, operations manual creation capability",
      constraints: "Model must be documentable into standard operating procedures. Owner dependency must be reducible to < 3/10. Unit economics must work at 70% of current owner performance.",
      evaluation_priorities: { feasibility: 0.30, profitability: 0.30, desirability: 0.15, novelty: 0.25 },
    },
  },
  {
    id: "search-fund",
    name: "Search Fund",
    emoji: "🔍",
    description: "Traditional search fund acquisition criteria",
    lens: {
      name: "Search Fund",
      lensType: "custom",
      primary_objective: "Evaluate acquisition targets through traditional search fund criteria",
      target_outcome: "Assess whether this business meets search fund investor return thresholds (3-5x in 5-7 years)",
      risk_tolerance: "medium",
      time_horizon: "5+ years",
      available_resources: "Search fund capital ($5M-$30M enterprise value range), investor board support, MBA-trained operator",
      constraints: "Revenue $2M-$20M. Recurring or repeatable revenue preferred. Fragmented industry. Low customer concentration. Owner willing to transition. SBA or conventional financing available.",
      evaluation_priorities: { profitability: 0.30, feasibility: 0.25, desirability: 0.25, novelty: 0.20 },
    },
  },
  {
    id: "growth-investor",
    name: "Growth Investor",
    emoji: "📈",
    description: "Growth equity or venture-style evaluation",
    lens: {
      name: "Growth Investor",
      lensType: "custom",
      primary_objective: "Identify and evaluate high-growth potential in existing business models",
      target_outcome: "Find scalable growth levers that could 3-10x revenue within investment horizon",
      risk_tolerance: "high",
      time_horizon: "3 years",
      available_resources: "Growth capital ($500K-$5M), go-to-market expertise, hiring capability",
      constraints: "Must have demonstrable product-market fit. Prefer businesses with gross margins >50%. Technology-enabled growth paths preferred over linear scaling.",
      evaluation_priorities: { novelty: 0.30, desirability: 0.25, profitability: 0.25, feasibility: 0.20 },
    },
  },
];
