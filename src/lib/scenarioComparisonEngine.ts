/**
 * SCENARIO COMPARISON ENGINE
 *
 * Evaluates multiple simulations simultaneously to identify:
 * - Best return scenario
 * - Lowest risk scenario
 * - Highest feasibility scenario
 *
 * Produces a comparison visualization dataset.
 */

import type { ToolScenario } from "@/lib/scenarioEngine";

// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════

export interface ScenarioComparison {
  bestReturnScenario: RankedScenario | null;
  lowestRiskScenario: RankedScenario | null;
  highestFeasibilityScenario: RankedScenario | null;
  scenarios: RankedScenario[];
  comparisonMatrix: ComparisonRow[];
}

export interface RankedScenario {
  scenarioId: string;
  scenarioName: string;
  toolId: string;
  projectedReturn: number;
  riskScore: number;
  capitalRequired: number;
  feasibilityScore: number;
  strategicImpact: "high" | "medium" | "low";
  overallScore: number;
}

export interface ComparisonRow {
  metric: string;
  values: { scenarioId: string; scenarioName: string; value: number | string; isBest: boolean }[];
}

// ═══════════════════════════════════════════════════════════════
//  SCORING HELPERS
// ═══════════════════════════════════════════════════════════════

function extractNumeric(outputs: Record<string, number | string>, keys: string[]): number {
  for (const key of keys) {
    const val = outputs[key];
    if (typeof val === "number") return val;
    if (typeof val === "string") {
      const n = parseFloat(val.replace(/[^0-9.-]/g, ""));
      if (!isNaN(n)) return n;
    }
  }
  return 0;
}

function computeProjectedReturn(scenario: ToolScenario): number {
  return extractNumeric(scenario.outputResults, [
    "equityReturn", "roi", "irr", "annualReturn", "totalReturn",
    "returnOnEquity", "netReturn", "cashOnCash",
  ]);
}

function computeRiskScore(scenario: ToolScenario): number {
  const dscr = extractNumeric(scenario.outputResults, ["dscr", "debtServiceCoverageRatio"]);
  const leverage = extractNumeric(scenario.inputVariables, ["loanAmount", "debtAmount", "totalDebt"]);
  const equity = extractNumeric(scenario.inputVariables, ["equityInjection", "downPayment", "equity"]);

  // Lower DSCR = higher risk
  let risk = 5; // baseline
  if (dscr > 0) risk = Math.max(1, 10 - dscr * 4);
  // High leverage ratio = higher risk
  if (equity > 0 && leverage > 0) {
    const leverageRatio = leverage / (leverage + equity);
    risk = Math.min(10, risk + leverageRatio * 3);
  }
  return Math.round(Math.min(10, Math.max(1, risk)) * 10) / 10;
}

function computeCapitalRequired(scenario: ToolScenario): number {
  return extractNumeric(scenario.inputVariables, [
    "totalCapital", "purchasePrice", "totalInvestment", "capitalRequired",
    "equityInjection", "downPayment",
  ]) || extractNumeric(scenario.outputResults, [
    "totalCapital", "capitalRequired",
  ]);
}

function computeFeasibilityScore(scenario: ToolScenario): number {
  const impact = scenario.strategicImpact === "high" ? 8 : scenario.strategicImpact === "medium" ? 6 : 4;
  const dscr = extractNumeric(scenario.outputResults, ["dscr"]);
  const dscrBonus = dscr >= 1.25 ? 2 : dscr >= 1.0 ? 1 : 0;
  return Math.min(10, Math.round((impact + dscrBonus) * 10) / 10);
}

// ═══════════════════════════════════════════════════════════════
//  MAIN COMPARISON
// ═══════════════════════════════════════════════════════════════

export function compareScenarios(scenarios: ToolScenario[]): ScenarioComparison {
  if (scenarios.length === 0) {
    return { bestReturnScenario: null, lowestRiskScenario: null, highestFeasibilityScenario: null, scenarios: [], comparisonMatrix: [] };
  }

  const ranked: RankedScenario[] = scenarios.map(s => {
    const projectedReturn = computeProjectedReturn(s);
    const riskScore = computeRiskScore(s);
    const capitalRequired = computeCapitalRequired(s);
    const feasibilityScore = computeFeasibilityScore(s);

    const overallScore = Math.round(
      (projectedReturn * 0.3 + (10 - riskScore) * 0.25 + feasibilityScore * 0.25 + (10 - capitalRequired / 1000000) * 0.2) * 10
    ) / 10;

    return {
      scenarioId: s.scenarioId,
      scenarioName: s.scenarioName,
      toolId: s.toolId,
      projectedReturn,
      riskScore,
      capitalRequired,
      feasibilityScore,
      strategicImpact: s.strategicImpact,
      overallScore: Math.max(0, overallScore),
    };
  });

  const bestReturn = [...ranked].sort((a, b) => b.projectedReturn - a.projectedReturn)[0] ?? null;
  const lowestRisk = [...ranked].sort((a, b) => a.riskScore - b.riskScore)[0] ?? null;
  const highestFeasibility = [...ranked].sort((a, b) => b.feasibilityScore - a.feasibilityScore)[0] ?? null;

  // Build comparison matrix
  const metrics = ["Projected Return", "Risk Score", "Capital Required", "Feasibility", "Overall Score"];
  const getters: ((r: RankedScenario) => number)[] = [
    r => r.projectedReturn, r => r.riskScore, r => r.capitalRequired, r => r.feasibilityScore, r => r.overallScore,
  ];
  const bestIsHigher = [true, false, false, true, true];

  const comparisonMatrix: ComparisonRow[] = metrics.map((metric, i) => {
    const values = ranked.map(r => ({
      scenarioId: r.scenarioId,
      scenarioName: r.scenarioName,
      value: getters[i](r),
      isBest: false,
    }));

    if (values.length > 0) {
      const sorted = [...values].sort((a, b) =>
        bestIsHigher[i] ? (b.value as number) - (a.value as number) : (a.value as number) - (b.value as number)
      );
      const bestVal = sorted[0];
      const found = values.find(v => v.scenarioId === bestVal.scenarioId);
      if (found) found.isBest = true;
    }

    return { metric, values };
  });

  return {
    bestReturnScenario: bestReturn,
    lowestRiskScenario: lowestRisk,
    highestFeasibilityScenario: highestFeasibility,
    scenarios: ranked,
    comparisonMatrix,
  };
}
