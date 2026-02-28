/**
 * Mode Data-Layer Enforcement — Structural rules, not prompt-only.
 *
 * This module is the SINGLE SOURCE OF TRUTH for what each analysis mode
 * is allowed to send to the AI model, and what outputs are valid.
 *
 * Import in every edge function that processes analysis data.
 */

export type AnalysisMode = "product" | "service" | "business";

// ── 1. Capability Matrix ──

export interface ModeCapability {
  allow: readonly string[];
  block: readonly string[];
}

export const MODE_CAPABILITIES: Record<AnalysisMode, ModeCapability> = {
  product: {
    allow: [
      "materials", "components", "patents", "manufacturing",
      "physical_design", "supplyChain", "specs", "BOM",
      "form_factor", "ergonomics", "industrial_design",
    ],
    block: [
      "service_workflow_optimization", "org_structure",
      "pricing_strategy_restructuring", "staffing_model",
      "franchise_structure", "subscription_mechanics",
    ],
  },
  service: {
    allow: [
      "workflow", "experience", "delivery_process", "customer_journey",
      "operational_bottlenecks", "staff_coordination", "process_optimization",
      "throughput", "wait_time", "friction_analysis",
    ],
    block: [
      "materials", "components", "patents", "manufacturing",
      "supplyChain", "BOM", "physical_design", "form_factor",
      "industrial_design", "COGS_from_materials",
    ],
  },
  business: {
    allow: [
      "monetization", "incentives", "scale_structure", "economics",
      "revenue_model", "unit_economics", "network_effects",
      "competitive_moat", "expansion_strategy", "cost_structure",
    ],
    block: [
      "UI_design", "materials_engineering", "service_flow_optimization",
      "ergonomic_analysis", "physical_dimensions", "moment_level_experience",
      "manufacturing_redesign", "supplyChain",
    ],
  },
};

// ── 2. Data Filtering ──

/** Keys on the product/context object that get stripped per mode */
const BLOCKED_DATA_KEYS: Record<AnalysisMode, readonly string[]> = {
  product: [],  // Product mode has no blocked input data
  service: [
    "supplyChain", "patents", "patentData", "patentAnalysis",
    "materials", "materialsAnalysis", "BOM", "bomAnalysis",
    "manufacturingPath", "physicalDimensions", "specs",
  ],
  business: [
    "supplyChain", "materials", "materialsAnalysis", "BOM",
    "physicalDimensions", "ergonomicAnalysis", "specs",
  ],
};

export interface FilterResult {
  filtered: Record<string, unknown>;
  removedKeys: string[];
  mode: AnalysisMode;
}

/**
 * Filter input data BEFORE sending to the AI model.
 * Removes blocked keys and logs what was removed.
 */
export function filterInputData(
  mode: AnalysisMode,
  data: Record<string, unknown>,
): FilterResult {
  const blocked = BLOCKED_DATA_KEYS[mode];
  const removedKeys: string[] = [];
  const filtered: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (blocked.includes(key)) {
      removedKeys.push(key);
      continue;
    }
    // Deep filter: if value is an object, recursively strip blocked keys
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const nested = filterInputData(mode, value as Record<string, unknown>);
      filtered[key] = nested.filtered;
      removedKeys.push(...nested.removedKeys.map((k) => `${key}.${k}`));
    } else {
      filtered[key] = value;
    }
  }

  if (removedKeys.length > 0) {
    console.log(
      `[ModeEnforcement] ${mode.toUpperCase()} mode: removed ${removedKeys.length} blocked key(s):`,
      removedKeys.join(", "),
    );
  }

  return { filtered, removedKeys, mode };
}

// ── 3. Output Validation ──

/** Patterns that indicate cross-mode drift in AI output text */
const VIOLATION_PATTERNS: Record<AnalysisMode, readonly RegExp[]> = {
  product: [
    /service\s+workflow\s+optimization/i,
    /franchise\s+structure/i,
    /staffing\s+model\s+analysis/i,
    /org(anization(al)?)?\s+restructuring/i,
  ],
  service: [
    /materials?\s+engineering/i,
    /manufacturing\s+redesign/i,
    /physical\s+form\s+factor/i,
    /industrial\s+design\s+engineering/i,
    /COGS\s+(calculation\s+)?from\s+materials/i,
    /bill\s+of\s+materials/i,
    /BOM\s+cost/i,
    /patent\s+(landscape|filing|analysis|intel)/i,
  ],
  business: [
    /UI\s+design\s+suggest/i,
    /service\s+journey\s+optimization/i,
    /ergonomic\s+analysis/i,
    /physical\s+dimension/i,
    /moment[- ]level\s+(customer\s+)?experience/i,
  ],
};

export interface ValidationResult {
  valid: boolean;
  violations: string[];
  mode: AnalysisMode;
}

/**
 * Validate AI output for cross-mode drift.
 * Scans the stringified output for forbidden domain patterns.
 */
export function validateOutput(
  mode: AnalysisMode,
  // deno-lint-ignore no-explicit-any
  output: any,
): ValidationResult {
  const violations: string[] = [];
  const text = typeof output === "string" ? output : JSON.stringify(output);
  const patterns = VIOLATION_PATTERNS[mode];

  for (const pattern of patterns) {
    if (pattern.test(text)) {
      violations.push(`Output contains blocked pattern for ${mode} mode: ${pattern.source}`);
    }
  }

  return { valid: violations.length === 0, violations, mode };
}

// ── 4. Traceability ──

export interface ModeTrace {
  activeMode: AnalysisMode;
  allowedDomains: readonly string[];
  blockedDomainsRemoved: string[];
  validationStatus: "passed" | "violations_detected";
  violations: string[];
  timestamp: string;
}

/**
 * Build a traceability record for the analysis.
 */
export function buildTrace(
  mode: AnalysisMode,
  filterResult: FilterResult,
  validationResult: ValidationResult,
): ModeTrace {
  return {
    activeMode: mode,
    allowedDomains: MODE_CAPABILITIES[mode].allow,
    blockedDomainsRemoved: filterResult.removedKeys,
    validationStatus: validationResult.valid ? "passed" : "violations_detected",
    violations: validationResult.violations,
    timestamp: new Date().toISOString(),
  };
}

// ── 5. Failure Behavior ──

/**
 * Generate a structured warning when required data is missing after filtering.
 */
export function missingDataWarning(mode: AnalysisMode): string {
  const warnings: Record<AnalysisMode, string> = {
    product: "Product mode executed with full data access.",
    service: "Service mode executed without patent/material/supply-chain data by design. These domains are structurally excluded from service analysis.",
    business: "Business mode executed without materials/supply-chain/UI data by design. Focus is on value-capture and scale mechanics.",
  };
  return warnings[mode];
}

// ── 6. Mode Resolution ──

/**
 * Resolve frontend mode identifier to strict analysis mode.
 */
export function resolveMode(
  frontendMode: string | undefined,
  category?: string,
): AnalysisMode {
  if (frontendMode === "business" || category === "Business Model" || category === "Business") return "business";
  if (frontendMode === "service" || category === "Service") return "service";
  return "product";
}

/**
 * Generate the mode enforcement prompt section for AI system prompts.
 */
export function getModeGuardPrompt(mode: AnalysisMode): string {
  const cap = MODE_CAPABILITIES[mode];

  const STRUCTURAL_DIMENSIONS: Record<AnalysisMode, string> = {
    product: `
STRUCTURAL ANALYSIS DIMENSIONS (Step 7):
  • Physical limits — material properties, form factor constraints, physics boundaries
  • Manufacturability — production complexity, tooling, supply chain feasibility
  • Cost drivers — BOM, labor, logistics, margin structure
  • Usability burden — learning curve, cognitive load, ergonomic friction
  • Dependency structure — ecosystem lock-in, accessory requirements, platform dependencies

LEVERAGE DOMAIN: Valid leverage = artifact change or architecture change.
Do NOT propose flow changes or value engine changes unless a constraint explicitly crosses layers.`,
    service: `
STRUCTURAL ANALYSIS DIMENSIONS (Step 7):
  • Process flow — sequence of delivery steps, handoffs, wait states
  • Bottlenecks — capacity constraints, throughput limits, queuing effects
  • Capacity limits — staff utilization, scheduling density, peak load handling
  • Coordination cost — multi-party synchronization, communication overhead
  • Behavioral barriers — customer adoption friction, habit change requirements

LEVERAGE DOMAIN: Valid leverage = delivery flow change.
Do NOT propose artifact changes or value engine changes unless a constraint explicitly crosses layers.`,
    business: `
STRUCTURAL ANALYSIS DIMENSIONS (Step 7):
  • Revenue mechanics — pricing model, transaction structure, value capture method
  • Cost structure — fixed vs variable, cost drivers, margin architecture
  • Growth constraints — what limits scale, customer acquisition economics
  • Competitive dynamics — moat depth, substitution risk, network effects
  • Risk exposure — concentration risk, regulatory risk, market timing risk

LEVERAGE DOMAIN: Valid leverage = value engine change.
Do NOT propose artifact changes or flow changes unless a constraint explicitly crosses layers.`,
  };

  return `
═══ MODE ENFORCEMENT: ${mode.toUpperCase()} ANALYSIS ═══

ALLOWED DOMAINS (analyze these):
${cap.allow.map((d) => `  ✓ ${d}`).join("\n")}

BLOCKED DOMAINS (must NOT produce):
${cap.block.map((d) => `  ✗ ${d}`).join("\n")}
${STRUCTURAL_DIMENSIONS[mode]}

ANTI-DRIFT GUARDRAILS:
• Do NOT default to AI-enabled solutions without evidence of necessity
• Apply patents ONLY when structurally relevant to ${mode} analysis
• Each insight must be unique to the ${mode} lens
• Cross-mode logic is prohibited
• Every constraint must connect to: cost, time, adoption, scale, reliability, or risk
`;
}
