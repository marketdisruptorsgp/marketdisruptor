/**
 * Market Structure Engine — Pattern Detection Rules
 *
 * Includes original patterns + new operator-focused signals:
 * margin concentration, outdated pricing, productizable services,
 * asset-heavy incumbents, aging ownership, distribution control.
 */

import type { PatternRule } from "./types";

export const PATTERN_RULES: PatternRule[] = [
  // ── Original patterns ──────────────────────────────────────
  {
    pattern: "fragmentation",
    keywords: /fragment|dispersed|cottage|mom[\s-]?and[\s-]?pop|many[\s-]?small|independent|local[\s-]?only|no[\s-]?dominant|highly[\s-]?competitive/i,
    reinforcingTypes: ["competitor", "signal", "constraint"],
    minEvidence: 2,
    scoreColumn: "fragmentation_index",
  },
  {
    pattern: "distribution_bottleneck",
    keywords: /distribut|channel[\s-]?limit|reach|access[\s-]?constrain|geographic|delivery[\s-]?challenge|logistics|shipping[\s-]?cost|last[\s-]?mile/i,
    reinforcingTypes: ["constraint", "friction", "risk"],
    minEvidence: 2,
    scoreColumn: "distribution_control_score",
  },
  {
    pattern: "data_concentration",
    keywords: /data[\s-]?silo|information[\s-]?lock|proprietary[\s-]?data|data[\s-]?advantage|analytics|intelligence|insights[\s-]?from[\s-]?data/i,
    reinforcingTypes: ["leverage", "opportunity", "signal"],
    minEvidence: 1,
  },
  {
    pattern: "manual_workflow_prevalence",
    keywords: /manual|paper[\s-]?based|spreadsheet|hand[\s-]?done|labor[\s-]?intensive|human[\s-]?dependent|non[\s-]?automated|phone[\s-]?call|email[\s-]?based/i,
    reinforcingTypes: ["friction", "constraint", "signal"],
    minEvidence: 2,
    scoreColumn: "productizability_score",
  },
  {
    pattern: "high_switching_costs",
    keywords: /switch|lock[\s-]?in|migration|entrenched|embedded|sticky|high[\s-]?cost[\s-]?to[\s-]?change|integration[\s-]?cost/i,
    reinforcingTypes: ["constraint", "risk", "friction"],
    minEvidence: 2,
  },
  {
    pattern: "coordination_failure",
    keywords: /coordinat|misalign|buyer[\s-]?seller|marketplace|matching|two[\s-]?sided|inefficien|friction[\s-]?between|trust[\s-]?gap/i,
    reinforcingTypes: ["friction", "constraint", "signal"],
    minEvidence: 2,
  },
  {
    pattern: "regulatory_moat",
    keywords: /regulat|licens|compliance|certification|barrier[\s-]?to[\s-]?entry|government|policy|legal[\s-]?requirement/i,
    reinforcingTypes: ["constraint", "risk"],
    minEvidence: 1,
  },
  {
    pattern: "information_asymmetry",
    keywords: /information[\s-]?asymmetr|opaque|hidden[\s-]?information|price[\s-]?discover|transpar|buyer[\s-]?doesn.?t[\s-]?know|complex[\s-]?to[\s-]?evaluate/i,
    reinforcingTypes: ["friction", "signal", "constraint"],
    minEvidence: 1,
  },

  // ── New operator-focused signals ───────────────────────────
  {
    pattern: "margin_concentration",
    keywords: /margin[\s-]?captur|margin[\s-]?compress|value[\s-]?chain|middlem|intermedia|markup|profit[\s-]?pool|margin[\s-]?stack|take[\s-]?rate|gross[\s-]?margin|distributor[\s-]?margin|wholesal/i,
    reinforcingTypes: ["constraint", "friction", "signal", "leverage"],
    minEvidence: 1,
    scoreColumn: "margin_distribution",
  },
  {
    pattern: "outdated_pricing_model",
    keywords: /flat[\s-]?fee|hourly[\s-]?rate|cost[\s-]?plus|per[\s-]?unit|time[\s-]?and[\s-]?material|legacy[\s-]?pric|fixed[\s-]?price|price[\s-]?list|rate[\s-]?card|outdated[\s-]?pric|pricing[\s-]?hasn.?t|no[\s-]?subscription|no[\s-]?recurring/i,
    reinforcingTypes: ["friction", "signal", "constraint"],
    minEvidence: 1,
    scoreColumn: "pricing_model_age",
  },
  {
    pattern: "productizable_service",
    keywords: /productiz|service[\s-]?to[\s-]?product|repeatable|standardiz|templat|package[\s-]?service|systemat|scalable[\s-]?service|consult[\s-]?to[\s-]?saas|done[\s-]?for[\s-]?you|managed[\s-]?service/i,
    reinforcingTypes: ["leverage", "opportunity", "signal"],
    minEvidence: 1,
    scoreColumn: "productizability_score",
  },
  {
    pattern: "asset_heavy_incumbents",
    keywords: /capital[\s-]?intensive|asset[\s-]?heavy|fixed[\s-]?asset|equipment|fleet|real[\s-]?estate|physical[\s-]?infrastructure|warehouse|inventory[\s-]?heavy|capex|depreciat/i,
    reinforcingTypes: ["constraint", "signal", "risk"],
    minEvidence: 1,
    scoreColumn: "asset_intensity_score",
  },
  {
    pattern: "aging_ownership",
    keywords: /succession|retir|aging[\s-]?own|baby[\s-]?boom|generational|family[\s-]?owned|founder[\s-]?age|no[\s-]?successor|exit[\s-]?plan|owner[\s-]?operator|sell[\s-]?business|acquir/i,
    reinforcingTypes: ["signal", "opportunity"],
    minEvidence: 1,
    scoreColumn: "ownership_demographics_score",
  },
  {
    pattern: "distribution_control_point",
    keywords: /gatekeeper|platform[\s-]?depend|channel[\s-]?control|single[\s-]?channel|amazon[\s-]?depend|app[\s-]?store|aggregator[\s-]?power|supplier[\s-]?concentrat|vendor[\s-]?lock|sole[\s-]?source/i,
    reinforcingTypes: ["constraint", "risk", "friction"],
    minEvidence: 1,
    scoreColumn: "distribution_control_score",
  },
];
