/**
 * Mode Enforcement Guards — Prevent cross-mode analytical drift.
 *
 * Each analysis mode has a strict scope. These guards ensure
 * that outputs stay within their designated analytical lens.
 */

export type StrictAnalysisMode = "product" | "service" | "business";

/** Dimensions that each mode MUST analyze */
export const REQUIRED_DIMENSIONS: Record<StrictAnalysisMode, readonly string[]> = {
  product: [
    "materials & construction",
    "feature set & capability",
    "usability & ergonomics",
    "manufacturing feasibility",
    "patent relevance to structure/function",
  ],
  service: [
    "experience design",
    "friction & inefficiency",
    "throughput & wait time",
    "staff coordination",
    "process optimization",
  ],
  business: [
    "revenue model",
    "unit economics",
    "scalability",
    "competitive moat",
    "expansion strategy",
  ],
};

/** Dimensions that each mode MUST NOT produce */
export const PROHIBITED_OUTPUTS: Record<StrictAnalysisMode, readonly string[]> = {
  product: [
    "service workflow optimization",
    "business model restructuring",
    "staffing model analysis",
    "franchise structure",
    "subscription mechanics",
  ],
  service: [
    "materials engineering",
    "manufacturing redesign",
    "physical form factor analysis",
    "industrial design engineering",
    "COGS calculation from materials",
  ],
  business: [
    "UI design suggestions",
    "service journey optimization",
    "ergonomic analysis",
    "physical dimension analysis",
    "moment-level customer experience",
  ],
};

/**
 * Generate the mode enforcement prompt section for AI system prompts.
 * Include this in every edge function that generates analytical content.
 */
export function getModeGuardPrompt(mode: StrictAnalysisMode): string {
  const required = REQUIRED_DIMENSIONS[mode];
  const prohibited = PROHIBITED_OUTPUTS[mode];

  return `
═══ MODE ENFORCEMENT: ${mode.toUpperCase()} ANALYSIS ═══

REQUIRED DIMENSIONS (must address all):
${required.map((d, i) => `  ${i + 1}. ${d}`).join("\n")}

PROHIBITED OUTPUTS (must NOT produce):
${prohibited.map((d) => `  ✗ ${d}`).join("\n")}

ANTI-DRIFT GUARDRAILS:
• Do NOT default to AI-enabled solutions without evidence of necessity
• Apply patents ONLY when structurally relevant to ${mode} analysis
• Each insight must be unique to the ${mode} lens
• Cross-mode logic is prohibited

OUTPUT VALIDATION (include in response):
1. Why ${mode} mode was selected
2. What dimensions were intentionally ignored
3. Evidence supporting each conclusion
4. Alternative modes rejected and why
`;
}

/**
 * Validate that analysis output doesn't contain cross-mode drift.
 * Returns any detected violations.
 */
export function validateModeOutput(
  mode: StrictAnalysisMode,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  output: Record<string, any>
): { violations: string[]; warnings: string[] } {
  const violations: string[] = [];
  const warnings: string[] = [];

  // Product mode guards
  if (mode === "product") {
    if (output.operationalWorkflow || output.serviceOptimization) {
      violations.push("Product mode produced service workflow analysis");
    }
    if (output.revenueModelRestructuring || output.franchiseAnalysis) {
      violations.push("Product mode produced business model restructuring");
    }
    if (output.staffingModel) {
      violations.push("Product mode produced staffing model analysis");
    }
  }

  // Service mode guards
  if (mode === "service") {
    if (output.materialsAnalysis || output.materialsEngineering) {
      violations.push("Service mode produced materials engineering analysis");
    }
    if (output.manufacturingRedesign || output.physicalFormFactor) {
      violations.push("Service mode produced manufacturing/physical analysis");
    }
    if (output.cogsFromMaterials) {
      violations.push("Service mode produced COGS from materials calculation");
    }
  }

  // Business mode guards
  if (mode === "business") {
    if (output.uiRecommendations || output.uiDesign) {
      violations.push("Business mode produced UI design suggestions");
    }
    if (output.serviceJourneyOptimization) {
      violations.push("Business mode produced service journey optimization");
    }
    if (output.ergonomicAnalysis || output.physicalDimensions) {
      violations.push("Business mode produced physical/ergonomic analysis");
    }
  }

  // Check for validation section presence
  if (!output.modeJustification && !output.validationSection) {
    warnings.push("Output missing mode justification/validation section");
  }

  return { violations, warnings };
}

/**
 * Map frontend mode identifiers to strict analysis modes.
 */
export function resolveStrictMode(
  frontendMode: "custom" | "service" | "business" | string
): StrictAnalysisMode {
  if (frontendMode === "custom" || frontendMode === "product") return "product";
  if (frontendMode === "service") return "service";
  if (frontendMode === "business") return "business";
  return "product"; // default fallback
}
