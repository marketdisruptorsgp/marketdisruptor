/**
 * Market Structure Engine — Archetype Mapping Rules
 *
 * Maps structural patterns → operator-focused opportunity archetypes.
 * Includes original archetypes + new ones for business buyers/operators.
 */

import type { ArchetypeRule } from "./types";

export const ARCHETYPE_RULES: ArchetypeRule[] = [
  // ── Original archetypes ────────────────────────────────────
  {
    archetype: "aggregation_platform",
    name: "Aggregation Platform",
    triggerPatterns: ["fragmentation"],
    reinforcingPatterns: ["coordination_failure", "distribution_bottleneck"],
    contraindications: ["Requires high volume to reach network effects", "Chicken-and-egg supply/demand problem"],
    complexity: "high",
    rationale: "Fragmented supply creates opportunity for aggregation with standardized quality and unified access",
  },
  {
    archetype: "vertical_saas",
    name: "Vertical SaaS",
    triggerPatterns: ["manual_workflow_prevalence"],
    reinforcingPatterns: ["fragmentation", "information_asymmetry"],
    contraindications: ["Small addressable market may limit growth", "Industry resistance to technology adoption"],
    complexity: "moderate",
    rationale: "Industries dominated by manual processes or spreadsheets are prime targets for purpose-built software",
  },
  {
    archetype: "embedded_fintech",
    name: "Embedded Finance",
    triggerPatterns: ["coordination_failure"],
    reinforcingPatterns: ["manual_workflow_prevalence", "high_switching_costs"],
    contraindications: ["Regulatory complexity", "Requires financial licenses in many jurisdictions"],
    complexity: "high",
    rationale: "Inefficient payment flows or financing gaps create opportunity for embedded financial services",
  },
  {
    archetype: "workflow_automation",
    name: "Workflow Automation",
    triggerPatterns: ["manual_workflow_prevalence"],
    reinforcingPatterns: ["distribution_bottleneck", "data_concentration"],
    contraindications: ["Processes may be too variable for automation", "Organizational change resistance"],
    complexity: "moderate",
    rationale: "Labor-intensive processes with repetitive patterns can be systematized for dramatic efficiency gains",
  },
  {
    archetype: "data_network_effect",
    name: "Data Network Effect",
    triggerPatterns: ["data_concentration"],
    reinforcingPatterns: ["information_asymmetry", "manual_workflow_prevalence"],
    contraindications: ["Data privacy regulations", "Incumbents may already own critical data sets"],
    complexity: "high",
    rationale: "Operational data captured through workflows creates a defensible moat that improves with scale",
  },
  {
    archetype: "marketplace",
    name: "Marketplace Platform",
    triggerPatterns: ["coordination_failure"],
    reinforcingPatterns: ["fragmentation", "information_asymmetry"],
    contraindications: ["Requires critical mass on both sides", "Disintermediation risk after initial match"],
    complexity: "high",
    rationale: "Buyer-seller coordination failures indicate opportunity for a matching or transaction platform",
  },
  {
    archetype: "rollup_strategy",
    name: "Consolidation / Roll-Up",
    triggerPatterns: ["fragmentation", "aging_ownership"],
    reinforcingPatterns: ["manual_workflow_prevalence", "regulatory_moat"],
    contraindications: ["Integration complexity across acquisitions", "Capital intensive"],
    complexity: "high",
    rationale: "Fragmented markets with stable cash flows and aging owners support buy-and-build strategies with operational improvement",
  },
  {
    archetype: "disintermediation",
    name: "Disintermediation",
    triggerPatterns: ["distribution_bottleneck"],
    reinforcingPatterns: ["information_asymmetry", "high_switching_costs"],
    contraindications: ["Intermediaries may provide irreplaceable services", "Channel conflict risk"],
    complexity: "moderate",
    rationale: "Distribution bottlenecks caused by intermediaries create opportunity for direct relationships",
  },

  // ── New operator-focused archetypes ────────────────────────
  {
    archetype: "vertical_integration",
    name: "Vertical Integration",
    triggerPatterns: ["margin_concentration"],
    reinforcingPatterns: ["distribution_bottleneck", "distribution_control_point"],
    contraindications: ["Capital requirements increase significantly", "Operational complexity across value chain stages"],
    complexity: "high",
    rationale: "When margins are captured by intermediaries or upstream suppliers, owning more of the value chain unlocks trapped profit",
  },
  {
    archetype: "distribution_capture",
    name: "Distribution Capture",
    triggerPatterns: ["distribution_control_point"],
    reinforcingPatterns: ["fragmentation", "information_asymmetry"],
    contraindications: ["Incumbent gatekeepers may retaliate", "Requires scale to justify direct channel economics"],
    complexity: "moderate",
    rationale: "Concentrated distribution control creates opportunity to build alternative channels or acquire the control point",
  },
  {
    archetype: "productization",
    name: "Service Productization",
    triggerPatterns: ["productizable_service"],
    reinforcingPatterns: ["manual_workflow_prevalence", "fragmentation"],
    contraindications: ["Service quality may degrade when standardized", "Customer expectation of bespoke delivery"],
    complexity: "moderate",
    rationale: "Repeatable services delivered manually can be packaged into scalable products with higher margins and lower delivery costs",
  },
  {
    archetype: "asset_light_restructuring",
    name: "Asset-Light Restructuring",
    triggerPatterns: ["asset_heavy_incumbents"],
    reinforcingPatterns: ["outdated_pricing_model", "manual_workflow_prevalence"],
    contraindications: ["Physical assets may be core to value delivery", "Customer trust tied to tangible presence"],
    complexity: "moderate",
    rationale: "Asset-heavy incumbents create opportunity for entrants who deliver similar value with dramatically lower capital intensity",
  },
  {
    archetype: "pricing_model_redesign",
    name: "Pricing Model Redesign",
    triggerPatterns: ["outdated_pricing_model"],
    reinforcingPatterns: ["information_asymmetry", "manual_workflow_prevalence"],
    contraindications: ["Customers may resist new pricing models", "Incumbents can match pricing changes quickly"],
    complexity: "low",
    rationale: "Industries stuck on legacy pricing (hourly, cost-plus) are vulnerable to subscription, usage-based, or outcome-based models",
  },
  {
    archetype: "succession_acquisition",
    name: "Succession Acquisition",
    triggerPatterns: ["aging_ownership"],
    reinforcingPatterns: ["fragmentation", "manual_workflow_prevalence"],
    contraindications: ["Valuation expectations may exceed economic reality", "Key-person risk in founder-dependent businesses"],
    complexity: "moderate",
    rationale: "Aging owner-operators without succession plans create acquisition opportunities at reasonable multiples with operational upside",
  },
];
