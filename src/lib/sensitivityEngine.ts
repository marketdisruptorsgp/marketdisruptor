/**
 * SENSITIVITY ANALYSIS ENGINE
 *
 * Auto-computes sensitivity analysis for key variables in simulation scenarios.
 * Produces impact ranges for revenue, labor, interest rate, and CAC changes.
 */

import type { ToolScenario } from "@/lib/scenarioEngine";

// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════

export interface SensitivityVariable {
  variableName: string;
  baseValue: number;
  unit: string;
  impacts: SensitivityImpact[];
}

export interface SensitivityImpact {
  changeLabel: string;
  changePercent: number;
  adjustedValue: number;
  resultMetric: string;
  resultValue: number;
  severity: "positive" | "neutral" | "warning" | "critical";
}

export interface SensitivityReport {
  scenarioId: string;
  scenarioName: string;
  variables: SensitivityVariable[];
  riskFactors: RiskFactor[];
}

export interface RiskFactor {
  label: string;
  description: string;
  severity: "low" | "moderate" | "high" | "critical";
  breakpoint: string;
}

// ═══════════════════════════════════════════════════════════════
//  VARIABLE DETECTION
// ═══════════════════════════════════════════════════════════════

interface VariableConfig {
  keys: string[];
  label: string;
  unit: string;
  resultKeys: string[];
  resultLabel: string;
  isInput: boolean;
}

const VARIABLE_CONFIGS: VariableConfig[] = [
  { keys: ["revenue", "annualRevenue", "grossRevenue"], label: "Revenue", unit: "$", resultKeys: ["dscr", "cashFlow", "netIncome", "irr"], resultLabel: "DSCR", isInput: true },
  { keys: ["laborCost", "laborExpense", "wages", "payroll"], label: "Labor Cost", unit: "$", resultKeys: ["dscr", "cashFlow", "netIncome", "margin"], resultLabel: "Cash Flow", isInput: true },
  { keys: ["interestRate", "rate", "loanRate"], label: "Interest Rate", unit: "%", resultKeys: ["dscr", "monthlyPayment", "totalInterest"], resultLabel: "DSCR", isInput: true },
  { keys: ["cac", "customerAcquisitionCost", "acquisitionCost"], label: "Customer Acquisition Cost", unit: "$", resultKeys: ["irr", "roi", "netReturn", "paybackPeriod"], resultLabel: "ROI", isInput: true },
  { keys: ["purchasePrice", "acquisitionPrice"], label: "Purchase Price", unit: "$", resultKeys: ["dscr", "equityReturn", "roi", "cashOnCash"], resultLabel: "Equity Return", isInput: true },
  { keys: ["sde", "ebitda", "sellerDisEarnings"], label: "Seller Earnings (SDE)", unit: "$", resultKeys: ["dscr", "equityReturn", "multiple"], resultLabel: "DSCR", isInput: true },
];

const CHANGE_SCENARIOS = [
  { label: "-20%", pct: -0.20 },
  { label: "-10%", pct: -0.10 },
  { label: "+10%", pct: 0.10 },
  { label: "+20%", pct: 0.20 },
];

function findValue(obj: Record<string, number | string>, keys: string[]): number | null {
  for (const key of keys) {
    const val = obj[key];
    if (typeof val === "number" && val !== 0) return val;
    if (typeof val === "string") {
      const n = parseFloat(val.replace(/[^0-9.-]/g, ""));
      if (!isNaN(n) && n !== 0) return n;
    }
  }
  return null;
}

function findResultValue(outputs: Record<string, number | string>, keys: string[]): { key: string; value: number } | null {
  for (const key of keys) {
    const val = outputs[key];
    if (typeof val === "number") return { key, value: val };
    if (typeof val === "string") {
      const n = parseFloat(val.replace(/[^0-9.-]/g, ""));
      if (!isNaN(n)) return { key, value: n };
    }
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════
//  SENSITIVITY COMPUTATION
// ═══════════════════════════════════════════════════════════════

function computeSeverity(baseResult: number, newResult: number, isPositiveGood: boolean): SensitivityImpact["severity"] {
  const changePct = baseResult !== 0 ? Math.abs((newResult - baseResult) / baseResult) : 0;
  const improved = isPositiveGood ? newResult > baseResult : newResult < baseResult;

  if (improved) return "positive";
  if (changePct < 0.05) return "neutral";
  if (changePct < 0.15) return "warning";
  return "critical";
}

/**
 * Simple linear sensitivity approximation.
 * For each variable, applies ±10%/±20% changes and estimates result impact.
 */
function computeVariableSensitivity(
  config: VariableConfig,
  scenario: ToolScenario,
): SensitivityVariable | null {
  const source = config.isInput ? scenario.inputVariables : scenario.outputResults;
  const baseValue = findValue(source, config.keys);
  if (baseValue === null) return null;

  const result = findResultValue(scenario.outputResults, config.resultKeys);
  if (!result) return null;

  // Estimate elasticity: how much does a 1% change in input affect the result
  // Use a simple linear model based on the ratio
  const elasticity = config.keys.some(k => k.includes("Cost") || k.includes("labor") || k.includes("interest"))
    ? -0.8 // Costs inversely affect results
    : 0.6; // Revenue positively affects results

  const impacts: SensitivityImpact[] = CHANGE_SCENARIOS.map(cs => {
    const adjustedValue = Math.round(baseValue * (1 + cs.pct) * 100) / 100;
    const resultChange = cs.pct * elasticity;
    const newResultValue = Math.round(result.value * (1 + resultChange) * 100) / 100;
    const isPositiveGood = !config.resultKeys.some(k => k.includes("risk") || k.includes("cost"));

    return {
      changeLabel: cs.label,
      changePercent: cs.pct,
      adjustedValue,
      resultMetric: config.resultLabel,
      resultValue: newResultValue,
      severity: computeSeverity(result.value, newResultValue, isPositiveGood),
    };
  });

  return {
    variableName: config.label,
    baseValue,
    unit: config.unit,
    impacts,
  };
}

// ═══════════════════════════════════════════════════════════════
//  RISK FACTOR DETECTION
// ═══════════════════════════════════════════════════════════════

function detectRiskFactors(variables: SensitivityVariable[]): RiskFactor[] {
  const factors: RiskFactor[] = [];

  for (const v of variables) {
    const criticalImpacts = v.impacts.filter(i => i.severity === "critical");
    const warningImpacts = v.impacts.filter(i => i.severity === "warning");

    if (criticalImpacts.length > 0) {
      const worst = criticalImpacts[0];
      factors.push({
        label: `${v.variableName} Sensitivity`,
        description: `${v.variableName} ${worst.changeLabel} → ${worst.resultMetric} drops to ${typeof worst.resultValue === "number" ? worst.resultValue.toFixed(2) : worst.resultValue}`,
        severity: "critical",
        breakpoint: `${worst.changeLabel} change`,
      });
    } else if (warningImpacts.length > 0) {
      const worst = warningImpacts[0];
      factors.push({
        label: `${v.variableName} Risk`,
        description: `${v.variableName} ${worst.changeLabel} → ${worst.resultMetric} changes to ${typeof worst.resultValue === "number" ? worst.resultValue.toFixed(2) : worst.resultValue}`,
        severity: "moderate",
        breakpoint: `${worst.changeLabel} change`,
      });
    }
  }

  return factors.sort((a, b) => {
    const order = { critical: 0, high: 1, moderate: 2, low: 3 };
    return order[a.severity] - order[b.severity];
  });
}

// ═══════════════════════════════════════════════════════════════
//  MAIN EXPORT
// ═══════════════════════════════════════════════════════════════

export function computeSensitivityReport(scenario: ToolScenario): SensitivityReport {
  const variables: SensitivityVariable[] = [];

  for (const config of VARIABLE_CONFIGS) {
    const result = computeVariableSensitivity(config, scenario);
    if (result) variables.push(result);
  }

  return {
    scenarioId: scenario.scenarioId,
    scenarioName: scenario.scenarioName,
    variables,
    riskFactors: detectRiskFactors(variables),
  };
}

/**
 * Compute sensitivity reports for all scenarios in a set.
 */
export function computeAllSensitivityReports(scenarios: ToolScenario[]): SensitivityReport[] {
  return scenarios.map(computeSensitivityReport).filter(r => r.variables.length > 0);
}
