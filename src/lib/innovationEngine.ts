/**
 * Innovation Engine
 * Derives structured innovation opportunities from analysis artifacts.
 * Operates deterministically on constraint_map, friction_map, stress test, and ETA outputs.
 */

export interface InnovationOpportunity {
  category: string;
  title: string;
  description: string;
  impactPotential: "high" | "medium" | "low";
  confidence: number;
  supportingEvidence: string[];
}

export interface InnovationOutput {
  structural_leverage: InnovationOpportunity[];
  pricing_model_shifts: InnovationOpportunity[];
  automation_opportunities: InnovationOpportunity[];
  cost_breakthroughs: InnovationOpportunity[];
  acquisition_rollup_opportunities: InnovationOpportunity[];
  platform_expansion_paths: InnovationOpportunity[];
}

function extractFromFriction(frictionMap: any[]): InnovationOpportunity[] {
  if (!frictionMap?.length) return [];
  return frictionMap.slice(0, 3).map(f => ({
    category: "structural_leverage",
    title: truncate(f.friction || f.label || "Friction Point", 8),
    description: `Removing "${f.friction || f.label}" creates a structural advantage. ${f.removal_value || f.impact || ""}`.trim(),
    impactPotential: (f.severity === "critical" || f.tier === 1) ? "high" : "medium",
    confidence: 0.75,
    supportingEvidence: [f.friction || f.label, f.removal_value || f.impact || "Identified via friction analysis"].filter(Boolean),
  }));
}

function extractFromConstraints(constraintMap: any): InnovationOpportunity[] {
  if (!constraintMap) return [];
  const ops: InnovationOpportunity[] = [];

  if (constraintMap.binding_constraint) {
    ops.push({
      category: "structural_leverage",
      title: truncate(`Unlock ${constraintMap.binding_constraint}`, 8),
      description: `The binding constraint "${constraintMap.binding_constraint}" limits system throughput. Relaxing it unlocks disproportionate value.`,
      impactPotential: "high",
      confidence: 0.80,
      supportingEvidence: [constraintMap.binding_constraint, constraintMap.constraint_type || "structural"].filter(Boolean),
    });
  }

  return ops;
}

function extractFromLeverage(leverageMap: any[]): InnovationOpportunity[] {
  if (!leverageMap?.length) return [];
  return leverageMap.slice(0, 3).map(l => ({
    category: "structural_leverage",
    title: truncate(l.lever || l.label || "Leverage Point", 8),
    description: l.mechanism || l.description || "High-impact intervention point identified.",
    impactPotential: (l.impact_multiplier && l.impact_multiplier > 3) ? "high" : "medium",
    confidence: 0.72,
    supportingEvidence: [l.lever || l.label, l.mechanism || ""].filter(Boolean),
  }));
}

function extractPricingShifts(analysisData: any): InnovationOpportunity[] {
  const pricing = analysisData?.pricingIntel || analysisData?.revenueReinvention;
  if (!pricing) return [];

  const ops: InnovationOpportunity[] = [];
  if (pricing.pricingOpportunities || pricing.alternativeModels) {
    const items = pricing.pricingOpportunities || pricing.alternativeModels || [];
    const arr = Array.isArray(items) ? items : [items];
    arr.slice(0, 2).forEach((item: any) => {
      ops.push({
        category: "pricing_model_shifts",
        title: truncate(typeof item === "string" ? item : item.model || item.name || "Pricing Shift", 8),
        description: typeof item === "string" ? item : item.description || item.rationale || "Alternative pricing model identified.",
        impactPotential: "medium",
        confidence: 0.65,
        supportingEvidence: [typeof item === "string" ? item : item.model || item.name].filter(Boolean),
      });
    });
  }
  return ops;
}

function extractAutomation(analysisData: any): InnovationOpportunity[] {
  const tech = analysisData?.technologyLeverage || analysisData?.techLeverage;
  if (!tech) return [];

  const ops: InnovationOpportunity[] = [];
  const autoOps = tech.automationOpportunities || tech.techOpportunities || [];
  const arr = Array.isArray(autoOps) ? autoOps : [];
  arr.slice(0, 2).forEach((item: any) => {
    ops.push({
      category: "automation_opportunities",
      title: truncate(typeof item === "string" ? item : item.area || item.name || "Automation", 8),
      description: typeof item === "string" ? item : item.description || item.impact || "Automation opportunity identified.",
      impactPotential: "medium",
      confidence: 0.60,
      supportingEvidence: [typeof item === "string" ? item : item.area || item.name].filter(Boolean),
    });
  });
  return ops;
}

function truncate(s: string, maxWords: number): string {
  const words = s.split(/\s+/);
  return words.length <= maxWords ? s : words.slice(0, maxWords).join(" ");
}

/** Main entry: derive innovation opportunities from all available analysis data */
export function deriveInnovationOpportunities(
  governedData: Record<string, any> | null,
  analysisData: Record<string, any> | null,
  stressTestData: Record<string, any> | null,
): InnovationOutput {
  const frictionMap = governedData?.friction_map || [];
  const constraintMap = governedData?.constraint_map || null;
  const leverageMap = governedData?.leverage_map || [];

  const structural = [
    ...extractFromFriction(frictionMap),
    ...extractFromConstraints(constraintMap),
    ...extractFromLeverage(leverageMap),
  ];

  const pricing = extractPricingShifts(analysisData);
  const automation = extractAutomation(analysisData);

  // Cost breakthroughs from stress test
  const costBreakthroughs: InnovationOpportunity[] = [];
  const stressArgs = stressTestData?.redTeam || stressTestData?.counterExamples || [];
  if (Array.isArray(stressArgs)) {
    stressArgs.slice(0, 2).forEach((arg: any) => {
      if (arg?.argument?.toLowerCase?.().includes("cost") || arg?.challenge?.toLowerCase?.().includes("cost")) {
        costBreakthroughs.push({
          category: "cost_breakthroughs",
          title: truncate(arg.argument || arg.challenge || "Cost Reduction", 8),
          description: arg.rebuttal || arg.response || "Cost structure vulnerability identified — potential for breakthrough.",
          impactPotential: "high",
          confidence: 0.55,
          supportingEvidence: [arg.argument || arg.challenge].filter(Boolean),
        });
      }
    });
  }

  return {
    structural_leverage: structural,
    pricing_model_shifts: pricing,
    automation_opportunities: automation,
    cost_breakthroughs: costBreakthroughs,
    acquisition_rollup_opportunities: [],
    platform_expansion_paths: [],
  };
}

/** Count total opportunities */
export function countOpportunities(output: InnovationOutput): number {
  return Object.values(output).reduce((sum, arr) => sum + arr.length, 0);
}
