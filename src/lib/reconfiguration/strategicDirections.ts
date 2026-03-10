/**
 * STRATEGIC DIRECTION CATEGORIES — Hybrid Scaffolding Layer
 *
 * Defines 8 user-facing strategic direction archetypes that any
 * constraint can fan into. These serve as scaffolding for the AI
 * to generate business-specific opportunities.
 *
 * Each direction has:
 *   - A relevance scorer based on the structural profile
 *   - A user-facing label and description
 *   - A prompt hint for the AI to generate concrete versions
 *
 * The system picks the top 3-5 most relevant directions per analysis,
 * then the AI generates specific, contextual opportunities for each.
 */

import type { StructuralProfile } from "./structuralProfile";

// ═══════════════════════════════════════════════════════════════
//  STRATEGIC DIRECTION ARCHETYPE
// ═══════════════════════════════════════════════════════════════

export interface StrategicDirection {
  id: string;
  /** User-facing category name */
  label: string;
  /** One-sentence description of the strategic move */
  description: string;
  /** Prompt hint — tells the AI what kind of opportunity to generate */
  aiPromptHint: string;
  /** Returns a relevance score 0-10 based on the structural profile */
  relevance: (profile: StructuralProfile) => number;
}

// ═══════════════════════════════════════════════════════════════
//  THE 8 DIRECTION ARCHETYPES
// ═══════════════════════════════════════════════════════════════

export const STRATEGIC_DIRECTIONS: StrategicDirection[] = [
  {
    id: "automate",
    label: "Automate",
    description: "Replace manual, labor-intensive processes with systems that scale without proportional headcount.",
    aiPromptHint: "Identify the specific manual processes that constrain scaling and describe a concrete automation approach. What exact workflow becomes a system? What labor cost is eliminated?",
    relevance: (p) => {
      let score = 0;
      if (p.laborIntensity === "artisan") score += 4;
      if (p.laborIntensity === "labor_heavy") score += 3;
      if (p.laborIntensity === "mixed") score += 1;
      if (p.marginStructure === "thin_margin") score += 2;
      if (p.revenueModel === "project_based") score += 2;
      if (p.ownerDependency === "owner_critical") score += 2;
      if (p.ownerDependency === "owner_reliant") score += 1;
      const hasLaborConstraint = p.bindingConstraints.some(c =>
        /labor|manual|capacity|headcount|staff|scale/i.test(c.constraintName + " " + c.explanation)
      );
      if (hasLaborConstraint) score += 3;
      return Math.min(10, score);
    },
  },
  {
    id: "platformize",
    label: "Platformize",
    description: "Turn an internal capability into a product that others pay to use.",
    aiPromptHint: "Identify the specific internal capability, process, or tool that could be extracted and sold as a standalone product. Who would pay for it? What's the pricing model?",
    relevance: (p) => {
      let score = 0;
      if (p.assetUtilization === "underutilized" || p.assetUtilization === "idle") score += 4;
      if (p.valueChainPosition === "infrastructure" || p.valueChainPosition === "platform") score += 2;
      if (p.marginStructure === "high_margin") score += 1;
      if (p.revenueModel === "transactional" || p.revenueModel === "project_based") score += 2;
      const hasAssetConstraint = p.bindingConstraints.some(c =>
        /utiliz|idle|asset|capacity|underuse/i.test(c.constraintName + " " + c.explanation)
      );
      if (hasAssetConstraint) score += 3;
      return Math.min(10, score);
    },
  },
  {
    id: "aggregate",
    label: "Aggregate",
    description: "Consolidate fragmented supply or demand into a unified interface that reduces friction.",
    aiPromptHint: "Identify the specific fragmented supply or demand. What are buyers currently doing to find/compare providers? What unified interface would eliminate that friction? What's the take rate or monetization model?",
    relevance: (p) => {
      let score = 0;
      if (p.supplyFragmentation === "atomized") score += 5;
      if (p.supplyFragmentation === "fragmented") score += 3;
      if (p.distributionControl === "no_control" || p.distributionControl === "intermediated") score += 2;
      if (p.switchingCosts === "low" || p.switchingCosts === "none") score += 2;
      const hasFragConstraint = p.bindingConstraints.some(c =>
        /fragment|scatter|search|discovery|find|match/i.test(c.constraintName + " " + c.explanation)
      );
      if (hasFragConstraint) score += 3;
      return Math.min(10, score);
    },
  },
  {
    id: "go_direct",
    label: "Go direct",
    description: "Remove intermediaries and own the customer relationship to capture more margin and data.",
    aiPromptHint: "Identify the specific intermediaries in the value chain. What margin do they capture? What customer data/relationship do they control? How would going direct change the economics?",
    relevance: (p) => {
      let score = 0;
      if (p.distributionControl === "intermediated") score += 5;
      if (p.distributionControl === "no_control") score += 3;
      if (p.marginStructure === "thin_margin") score += 2;
      if (p.customerConcentration === "concentrated") score += 1;
      const hasDistConstraint = p.bindingConstraints.some(c =>
        /intermediar|channel|distribut|margin|middl/i.test(c.constraintName + " " + c.explanation)
      );
      if (hasDistConstraint) score += 3;
      return Math.min(10, score);
    },
  },
  {
    id: "productize",
    label: "Productize",
    description: "Package expertise, services, or custom work into repeatable, scalable deliverables.",
    aiPromptHint: "Identify the specific expertise or custom service being delivered. What parts are actually repeatable? What would the productized version look like — a tool, a template, a subscription, a course? How does pricing change?",
    relevance: (p) => {
      let score = 0;
      if (p.laborIntensity === "artisan" || p.laborIntensity === "labor_heavy") score += 3;
      if (p.revenueModel === "project_based") score += 4;
      if (p.revenueModel === "transactional") score += 2;
      if (p.switchingCosts === "low" || p.switchingCosts === "none") score += 1;
      if (p.valueChainPosition === "end_service" || p.valueChainPosition === "application") score += 2;
      const hasServiceConstraint = p.bindingConstraints.some(c =>
        /custom|bespoke|project|scope|repeat|time/i.test(c.constraintName + " " + c.explanation)
      );
      if (hasServiceConstraint) score += 3;
      return Math.min(10, score);
    },
  },
  {
    id: "data_advantage",
    label: "Create a data advantage",
    description: "Monetize information asymmetry by collecting, structuring, or analyzing data others don't have.",
    aiPromptHint: "What data does this business naturally generate or have access to? Who would pay for structured access to that data? What decisions does it inform? What's the data moat?",
    relevance: (p) => {
      let score = 0;
      if (p.supplyFragmentation === "fragmented" || p.supplyFragmentation === "atomized") score += 2;
      if (p.valueChainPosition === "infrastructure" || p.valueChainPosition === "platform") score += 3;
      if (p.customerConcentration === "diversified") score += 2;
      if (p.distributionControl === "owned" || p.distributionControl === "shared") score += 1;
      // Data advantage is always somewhat relevant if there's scale
      const hasInfoConstraint = p.bindingConstraints.some(c =>
        /data|inform|visib|transparen|insight|intel|pricing|benchmark/i.test(c.constraintName + " " + c.explanation)
      );
      if (hasInfoConstraint) score += 4;
      return Math.min(10, score);
    },
  },
  {
    id: "shared_infrastructure",
    label: "Build shared infrastructure",
    description: "Extract common operational needs across competitors into shared services they all use.",
    aiPromptHint: "What operational burden do ALL competitors in this space share? What if one company built that as shared infrastructure and charged for access? What's the specific service — scheduling, logistics, compliance, procurement?",
    relevance: (p) => {
      let score = 0;
      if (p.supplyFragmentation === "atomized" || p.supplyFragmentation === "fragmented") score += 3;
      if (p.valueChainPosition === "infrastructure") score += 3;
      if (p.regulatorySensitivity === "heavy" || p.regulatorySensitivity === "moderate") score += 2;
      if (p.assetUtilization === "underutilized") score += 2;
      const hasInfraConstraint = p.bindingConstraints.some(c =>
        /infra|operation|compliance|overhead|admin|back.?office|regulat/i.test(c.constraintName + " " + c.explanation)
      );
      if (hasInfraConstraint) score += 3;
      return Math.min(10, score);
    },
  },
  {
    id: "marketplace",
    label: "Marketplace",
    description: "Create a two-sided marketplace connecting supply and demand, capturing a transaction fee.",
    aiPromptHint: "Who are the specific supply-side and demand-side participants? Why don't they connect efficiently today? What's the matching mechanism? How do you solve the chicken-and-egg problem to bootstrap liquidity?",
    relevance: (p) => {
      let score = 0;
      if (p.supplyFragmentation === "atomized") score += 4;
      if (p.supplyFragmentation === "fragmented") score += 2;
      if (p.distributionControl === "no_control") score += 3;
      if (p.switchingCosts === "none" || p.switchingCosts === "low") score += 2;
      if (p.customerConcentration === "diversified") score += 1;
      const hasMatchConstraint = p.bindingConstraints.some(c =>
        /match|connect|discover|find|search|fragment|scatter/i.test(c.constraintName + " " + c.explanation)
      );
      if (hasMatchConstraint) score += 3;
      return Math.min(10, score);
    },
  },
];

// ═══════════════════════════════════════════════════════════════
//  DIRECTION SELECTION
// ═══════════════════════════════════════════════════════════════

export interface ScoredDirection {
  direction: StrategicDirection;
  relevanceScore: number;
}

/**
 * Score all directions against a structural profile and return
 * the top N most relevant (default 5, min 3).
 */
export function selectRelevantDirections(
  profile: StructuralProfile,
  count: number = 5,
): ScoredDirection[] {
  const scored = STRATEGIC_DIRECTIONS.map(d => ({
    direction: d,
    relevanceScore: d.relevance(profile),
  }));

  // Sort by relevance descending
  scored.sort((a, b) => b.relevanceScore - a.relevanceScore);

  // Take top N, but ensure at least 3 with score > 0
  const minCount = Math.min(3, scored.filter(s => s.relevanceScore > 0).length);
  const targetCount = Math.max(minCount, Math.min(count, scored.filter(s => s.relevanceScore >= 2).length));

  return scored.slice(0, Math.max(3, targetCount));
}

/**
 * Build a prompt block describing the selected directions for AI consumption.
 */
export function buildDirectionsPromptBlock(
  directions: ScoredDirection[],
): string {
  const lines = [
    "STRATEGIC DIRECTION CATEGORIES — Generate one opportunity per direction below.",
    "Each direction represents a structurally distinct strategic path. Your job is to make each one SPECIFIC to this business.",
    "",
  ];

  for (const { direction, relevanceScore } of directions) {
    const strength = relevanceScore >= 6 ? "HIGH relevance" : relevanceScore >= 3 ? "MODERATE relevance" : "EXPLORATORY";
    lines.push(`### ${direction.label.toUpperCase()} [${strength}]`);
    lines.push(direction.description);
    lines.push(`AI TASK: ${direction.aiPromptHint}`);
    lines.push("");
  }

  lines.push("IMPORTANT: Generate one thesis per direction. Each must be structurally distinct — NOT variations of the same idea.");
  lines.push("If a direction truly doesn't apply to this business, explain WHY in one sentence and skip it.");

  return lines.join("\n");
}
