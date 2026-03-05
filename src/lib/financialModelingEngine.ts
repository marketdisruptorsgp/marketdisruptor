/**
 * Financial Modeling Engine
 * Deterministic calculations — no AI inference.
 * All outputs include provenance metadata.
 */

import { modeledValue, userInputValue, type ProvenancedValue } from "./dataProvenance";

/* ── Types ── */
export interface SBALoanInputs {
  purchasePrice: number;
  adjustedSDE: number;
  downPaymentPct: number;
  interestRate: number;
  loanTermYears: number;
  workingCapital?: number;
}

export interface SBALoanResult {
  loanAmount: ProvenancedValue;
  downPayment: ProvenancedValue;
  monthlyPayment: ProvenancedValue;
  annualDebtService: ProvenancedValue;
  ownerCashFlowAfterDebt: ProvenancedValue;
  dscr: ProvenancedValue;
  dscrStatus: "viable" | "healthy" | "high_risk" | "not_viable";
  totalInterestPaid: ProvenancedValue;
}

export interface ValuationResult {
  sdeMultiple: ProvenancedValue;
  multipleStatus: "strong_value" | "fair" | "premium";
  sdeMargin: ProvenancedValue;
}

export interface ScenarioCase {
  label: string;
  revenueChangePct: number;
  adjustedSDE: ProvenancedValue;
  dscr: ProvenancedValue;
  ownerCashFlow: ProvenancedValue;
  dscrStatus: "viable" | "healthy" | "high_risk" | "not_viable";
}

/* ── Core Formulas ── */

/** Monthly payment: P * r / (1 - (1+r)^-n) */
function calcMonthlyPayment(principal: number, monthlyRate: number, totalMonths: number): number {
  if (monthlyRate === 0) return principal / totalMonths;
  return principal * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
}

function getDSCRStatus(dscr: number): "viable" | "healthy" | "high_risk" | "not_viable" {
  if (dscr >= 1.5) return "healthy";
  if (dscr >= 1.25) return "viable";
  if (dscr >= 1.0) return "high_risk";
  return "not_viable";
}

/* ── SBA Loan Model ── */
export function computeSBALoan(inputs: SBALoanInputs): SBALoanResult {
  const { purchasePrice, adjustedSDE, downPaymentPct, interestRate, loanTermYears, workingCapital = 0 } = inputs;

  const downPayment = purchasePrice * downPaymentPct;
  const loanPrincipal = purchasePrice - downPayment + workingCapital;
  const monthlyRate = interestRate / 12;
  const totalMonths = loanTermYears * 12;
  const monthly = calcMonthlyPayment(loanPrincipal, monthlyRate, totalMonths);
  const annualDebt = monthly * 12;
  const ownerCashFlow = adjustedSDE - annualDebt;
  const dscr = annualDebt > 0 ? adjustedSDE / annualDebt : 0;
  const totalInterest = (monthly * totalMonths) - loanPrincipal;

  const inputRecord = { purchasePrice, adjustedSDE, downPaymentPct, interestRate, loanTermYears, workingCapital };

  return {
    loanAmount: modeledValue(loanPrincipal, "Loan Principal = Purchase Price × (1 - Down%) + Working Capital", inputRecord, 0.95),
    downPayment: modeledValue(downPayment, "Down Payment = Purchase Price × Down%", inputRecord, 0.95),
    monthlyPayment: modeledValue(monthly, "P × r / (1 - (1+r)^-n)", inputRecord, 0.95),
    annualDebtService: modeledValue(annualDebt, "Monthly Payment × 12", inputRecord, 0.95),
    ownerCashFlowAfterDebt: modeledValue(ownerCashFlow, "Adjusted SDE - Annual Debt Service", inputRecord, 0.85),
    dscr: modeledValue(dscr, "DSCR = Adjusted SDE / Annual Debt Service", inputRecord, 0.90),
    dscrStatus: getDSCRStatus(dscr),
    totalInterestPaid: modeledValue(totalInterest, "Total Payments - Principal", inputRecord, 0.95),
  };
}

/* ── Valuation ── */
export function computeValuation(purchasePrice: number, sde: number, revenue: number): ValuationResult {
  const multiple = sde > 0 ? purchasePrice / sde : 0;
  const margin = revenue > 0 ? sde / revenue : 0;

  return {
    sdeMultiple: modeledValue(multiple, "SDE Multiple = Purchase Price / SDE", { purchasePrice, sde }, 0.90),
    multipleStatus: multiple <= 3 ? "strong_value" : multiple <= 4.5 ? "fair" : "premium",
    sdeMargin: modeledValue(margin, "SDE Margin = SDE / Revenue", { sde, revenue }, 0.85),
  };
}

/* ── Scenario Engine ── */
export function runScenarios(inputs: SBALoanInputs, revenue: number): ScenarioCase[] {
  const scenarios = [
    { label: "Base Case", pct: 0 },
    { label: "Revenue -10%", pct: -10 },
    { label: "Revenue -20%", pct: -20 },
    { label: "Revenue -30%", pct: -30 },
    { label: "Revenue +10%", pct: 10 },
    { label: "Revenue +20%", pct: 20 },
  ];

  const baseMargin = revenue > 0 ? inputs.adjustedSDE / revenue : 1;

  return scenarios.map(s => {
    const adjustedRevenue = revenue * (1 + s.pct / 100);
    const adjustedSDE = adjustedRevenue * baseMargin;
    const loan = computeSBALoan({ ...inputs, adjustedSDE });

    return {
      label: s.label,
      revenueChangePct: s.pct,
      adjustedSDE: modeledValue(adjustedSDE, `SDE at ${s.pct}% revenue change`, { baseMargin, adjustedRevenue, pctChange: s.pct }, 0.70),
      dscr: loan.dscr,
      ownerCashFlow: loan.ownerCashFlowAfterDebt,
      dscrStatus: loan.dscrStatus,
    };
  });
}

/* ── Format helpers ── */
export function fmtCurrency(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}
