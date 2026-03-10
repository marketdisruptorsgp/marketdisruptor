/**
 * ETA Scoring Engine
 * 
 * Deterministic acquisition scoring from extracted financial data.
 * Produces two composite scores:
 *   1. Valuation Risk Score (0-100, lower = less risk)
 *   2. Acquisition Readiness Rating (0-100, higher = more ready)
 *
 * All sub-scores include provenance for auditability.
 */

import { modeledValue, type ProvenancedValue } from "./dataProvenance";

/* ── Input: extracted financial signals ── */
export interface ETAFinancialInputs {
  revenue?: number;
  sde?: number;
  askingPrice?: number;
  grossMargin?: number;       // 0-1
  sdeMargin?: number;         // 0-1
  revenueGrowthPct?: number;  // e.g. 5 for 5%
  customerConcentration?: number; // 0-1, pct of revenue from top customer
  top5CustomerPct?: number;   // 0-1
  ownerDependency?: "autonomous" | "delegated" | "involved" | "dependent" | "owner_critical";
  employeeCount?: number;
  yearsInBusiness?: number;
  backlog?: number;
  recurringRevenuePct?: number; // 0-1
  debtLevel?: number;
}

/* ── Sub-score detail ── */
export interface ScoringDimension {
  label: string;
  score: number;        // 0-100
  weight: number;       // 0-1
  weightedScore: number;
  riskLevel: "low" | "moderate" | "elevated" | "high";
  detail: string;
}

/* ── Output ── */
export interface ETAScoreResult {
  valuationRiskScore: ProvenancedValue;    // 0-100
  valuationRiskLabel: string;
  acquisitionReadiness: ProvenancedValue;  // 0-100
  readinessLabel: string;
  dimensions: ScoringDimension[];
  dealGrade: "A" | "B" | "C" | "D" | "F";
  keyFlags: string[];
}

/* ── Helpers ── */
function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, v));
}

function riskLevel(score: number): "low" | "moderate" | "elevated" | "high" {
  if (score <= 25) return "low";
  if (score <= 50) return "moderate";
  if (score <= 75) return "elevated";
  return "high";
}

/* ── Dimension Scorers ── */

/** SDE Multiple risk: <2.5x low, 3-4x moderate, >4.5x high */
function scoreValuationMultiple(askingPrice: number, sde: number): { score: number; detail: string } {
  if (sde <= 0) return { score: 90, detail: "No SDE data — cannot assess multiple" };
  const multiple = askingPrice / sde;
  if (multiple <= 2.5) return { score: 15, detail: `${multiple.toFixed(1)}x SDE — strong value` };
  if (multiple <= 3.5) return { score: 35, detail: `${multiple.toFixed(1)}x SDE — fair market` };
  if (multiple <= 4.5) return { score: 60, detail: `${multiple.toFixed(1)}x SDE — premium pricing` };
  return { score: 85, detail: `${multiple.toFixed(1)}x SDE — expensive` };
}

/** Margin quality: >40% excellent, 20-40% good, <20% thin */
function scoreMarginHealth(grossMargin?: number, sdeMargin?: number): { score: number; detail: string } {
  const margin = sdeMargin ?? grossMargin;
  if (margin == null) return { score: 50, detail: "No margin data available" };
  const pct = margin * 100;
  if (pct >= 40) return { score: 10, detail: `${pct.toFixed(0)}% margin — excellent` };
  if (pct >= 30) return { score: 25, detail: `${pct.toFixed(0)}% margin — healthy` };
  if (pct >= 20) return { score: 50, detail: `${pct.toFixed(0)}% margin — adequate` };
  return { score: 80, detail: `${pct.toFixed(0)}% margin — thin, limited room for error` };
}

/** Customer concentration: <10% top customer = low risk */
function scoreCustomerConcentration(topCustomerPct?: number, top5Pct?: number): { score: number; detail: string } {
  if (topCustomerPct == null && top5Pct == null) return { score: 50, detail: "No concentration data" };
  const top1 = topCustomerPct ?? 0;
  const top5 = top5Pct ?? 0;
  // Use whichever signals higher risk
  if (top1 >= 0.30) return { score: 90, detail: `Top customer = ${(top1 * 100).toFixed(0)}% — critical concentration` };
  if (top1 >= 0.20) return { score: 70, detail: `Top customer = ${(top1 * 100).toFixed(0)}% — elevated risk` };
  if (top5 >= 0.60) return { score: 60, detail: `Top 5 = ${(top5 * 100).toFixed(0)}% — moderate concentration` };
  if (top1 >= 0.10) return { score: 40, detail: `Top customer = ${(top1 * 100).toFixed(0)}% — manageable` };
  return { score: 15, detail: `Well-diversified customer base` };
}

/** Owner dependency: autonomous = ready, owner_critical = high risk */
function scoreOwnerDependency(level?: string): { score: number; detail: string } {
  const map: Record<string, { score: number; detail: string }> = {
    autonomous:    { score: 10, detail: "Business runs independently — minimal transition risk" },
    delegated:     { score: 25, detail: "Key functions delegated — manageable transition" },
    involved:      { score: 45, detail: "Owner involved in operations — moderate transition effort" },
    dependent:     { score: 70, detail: "Operations depend on owner — significant transition work" },
    owner_critical: { score: 90, detail: "Owner IS the business — high acquisition risk" },
  };
  return map[level || "involved"] || { score: 50, detail: "Owner dependency unknown" };
}

/** Revenue stability: recurring + growth + backlog */
function scoreRevenueStability(inputs: ETAFinancialInputs): { score: number; detail: string } {
  let riskScore = 50; // start neutral
  const parts: string[] = [];

  if (inputs.recurringRevenuePct != null) {
    const recPct = inputs.recurringRevenuePct * 100;
    riskScore += recPct >= 50 ? -20 : recPct >= 20 ? -10 : 10;
    parts.push(`${recPct.toFixed(0)}% recurring`);
  }

  if (inputs.revenueGrowthPct != null) {
    riskScore += inputs.revenueGrowthPct >= 10 ? -15 : inputs.revenueGrowthPct >= 0 ? -5 : 15;
    parts.push(`${inputs.revenueGrowthPct > 0 ? "+" : ""}${inputs.revenueGrowthPct.toFixed(0)}% growth`);
  }

  if (inputs.backlog != null && inputs.revenue) {
    const backlogMonths = (inputs.backlog / inputs.revenue) * 12;
    riskScore += backlogMonths >= 6 ? -15 : backlogMonths >= 3 ? -8 : 5;
    parts.push(`${backlogMonths.toFixed(1)}mo backlog`);
  }

  if (inputs.yearsInBusiness != null) {
    riskScore += inputs.yearsInBusiness >= 20 ? -10 : inputs.yearsInBusiness >= 10 ? -5 : 5;
    parts.push(`${inputs.yearsInBusiness}yr track record`);
  }

  return {
    score: clamp(riskScore),
    detail: parts.length > 0 ? parts.join(", ") : "Limited revenue stability data",
  };
}

/** DSCR viability from price and SDE */
function scoreDSCRViability(askingPrice: number, sde: number): { score: number; detail: string } {
  if (sde <= 0 || askingPrice <= 0) return { score: 70, detail: "Insufficient data for DSCR estimate" };
  // Assume SBA 7(a): 10% down, 10.5% rate, 10yr
  const loanAmount = askingPrice * 0.9;
  const monthlyRate = 0.105 / 12;
  const months = 120;
  const monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
  const annualDebt = monthlyPayment * 12;
  const dscr = sde / annualDebt;

  if (dscr >= 1.5) return { score: 10, detail: `Est. DSCR ${dscr.toFixed(2)} — comfortable` };
  if (dscr >= 1.25) return { score: 30, detail: `Est. DSCR ${dscr.toFixed(2)} — viable` };
  if (dscr >= 1.0) return { score: 60, detail: `Est. DSCR ${dscr.toFixed(2)} — tight` };
  return { score: 85, detail: `Est. DSCR ${dscr.toFixed(2)} — cash flow negative after debt` };
}

/* ── Main Scoring Function ── */
export function computeETAScores(inputs: ETAFinancialInputs): ETAScoreResult {
  const flags: string[] = [];

  // Define dimensions with weights
  const dimDefs: { key: string; label: string; weight: number; scorer: () => { score: number; detail: string } }[] = [
    {
      key: "valuation_multiple",
      label: "Valuation Multiple",
      weight: 0.20,
      scorer: () => inputs.askingPrice && inputs.sde
        ? scoreValuationMultiple(inputs.askingPrice, inputs.sde)
        : { score: 50, detail: "No asking price or SDE" },
    },
    {
      key: "margin_health",
      label: "Margin Health",
      weight: 0.15,
      scorer: () => scoreMarginHealth(inputs.grossMargin, inputs.sdeMargin),
    },
    {
      key: "customer_concentration",
      label: "Customer Concentration",
      weight: 0.15,
      scorer: () => scoreCustomerConcentration(inputs.customerConcentration, inputs.top5CustomerPct),
    },
    {
      key: "owner_dependency",
      label: "Owner Dependency",
      weight: 0.15,
      scorer: () => scoreOwnerDependency(inputs.ownerDependency),
    },
    {
      key: "revenue_stability",
      label: "Revenue Stability",
      weight: 0.15,
      scorer: () => scoreRevenueStability(inputs),
    },
    {
      key: "dscr_viability",
      label: "Debt Service Coverage",
      weight: 0.20,
      scorer: () => inputs.askingPrice && inputs.sde
        ? scoreDSCRViability(inputs.askingPrice, inputs.sde)
        : { score: 50, detail: "Insufficient data for DSCR" },
    },
  ];

  const dimensions: ScoringDimension[] = dimDefs.map(d => {
    const result = d.scorer();
    const score = clamp(result.score);
    const weightedScore = score * d.weight;
    return {
      label: d.label,
      score,
      weight: d.weight,
      weightedScore,
      riskLevel: riskLevel(score),
      detail: result.detail,
    };
  });

  // Composite valuation risk = weighted average of dimension risk scores
  const totalWeight = dimensions.reduce((s, d) => s + d.weight, 0);
  const valuationRisk = dimensions.reduce((s, d) => s + d.weightedScore, 0) / totalWeight;

  // Acquisition readiness = inverse of risk with quality bonuses
  const readiness = clamp(100 - valuationRisk);

  // Generate flags
  dimensions.forEach(d => {
    if (d.riskLevel === "high") flags.push(`⚠ ${d.label}: ${d.detail}`);
    else if (d.riskLevel === "elevated") flags.push(`⚡ ${d.label}: ${d.detail}`);
  });

  // Deal grade
  const dealGrade: "A" | "B" | "C" | "D" | "F" =
    readiness >= 80 ? "A" :
    readiness >= 65 ? "B" :
    readiness >= 50 ? "C" :
    readiness >= 35 ? "D" : "F";

  const riskLabel =
    valuationRisk <= 25 ? "Low Risk" :
    valuationRisk <= 50 ? "Moderate Risk" :
    valuationRisk <= 75 ? "Elevated Risk" : "High Risk";

  const readinessLabel =
    readiness >= 80 ? "Strong Buy Candidate" :
    readiness >= 65 ? "Viable with Mitigation" :
    readiness >= 50 ? "Proceed with Caution" :
    readiness >= 35 ? "Significant Concerns" : "Not Recommended";

  return {
    valuationRiskScore: modeledValue(
      Math.round(valuationRisk * 10) / 10,
      "Weighted composite of 6 acquisition risk dimensions",
      inputs as unknown as Record<string, unknown>,
      0.80,
    ),
    valuationRiskLabel: riskLabel,
    acquisitionReadiness: modeledValue(
      Math.round(readiness * 10) / 10,
      "100 - Valuation Risk (inverse composite)",
      inputs as unknown as Record<string, unknown>,
      0.80,
    ),
    readinessLabel,
    dimensions,
    dealGrade,
    keyFlags: flags,
  };
}

/**
 * Extract ETAFinancialInputs from governed/BI extraction data.
 * This bridges the raw analysis data into the scoring engine.
 */
export function extractFinancialInputs(
  governedData: Record<string, unknown> | null,
  biExtraction: Record<string, unknown> | null,
): ETAFinancialInputs {
  const inputs: ETAFinancialInputs = {};

  // Try BI extraction first (more structured), then governed fallback
  const bi = biExtraction as Record<string, any> | null;
  const gov = governedData as Record<string, any> | null;

  // Revenue
  inputs.revenue = bi?.revenue ?? bi?.annual_revenue ?? gov?.revenue ?? gov?.estimated_revenue;

  // SDE / earnings
  inputs.sde = bi?.sde ?? bi?.adjusted_sde ?? bi?.sellers_discretionary_earnings ?? gov?.sde;

  // Asking price
  inputs.askingPrice = bi?.asking_price ?? bi?.purchase_price ?? bi?.listing_price ?? gov?.asking_price;

  // Margins
  if (bi?.gross_margin != null) inputs.grossMargin = bi.gross_margin > 1 ? bi.gross_margin / 100 : bi.gross_margin;
  if (bi?.sde_margin != null) inputs.sdeMargin = bi.sde_margin > 1 ? bi.sde_margin / 100 : bi.sde_margin;
  else if (inputs.sde && inputs.revenue) inputs.sdeMargin = inputs.sde / inputs.revenue;

  // Growth
  inputs.revenueGrowthPct = bi?.revenue_growth_pct ?? bi?.yoy_growth;

  // Customer concentration
  if (bi?.top_customer_pct != null) {
    inputs.customerConcentration = bi.top_customer_pct > 1 ? bi.top_customer_pct / 100 : bi.top_customer_pct;
  }
  if (bi?.top_5_customer_pct != null) {
    inputs.top5CustomerPct = bi.top_5_customer_pct > 1 ? bi.top_5_customer_pct / 100 : bi.top_5_customer_pct;
  }

  // Owner dependency
  const ownerDep = bi?.owner_dependency ?? gov?.owner_dependency;
  if (ownerDep && typeof ownerDep === "string") {
    inputs.ownerDependency = ownerDep as ETAFinancialInputs["ownerDependency"];
  }

  // Other signals
  inputs.employeeCount = bi?.employee_count ?? bi?.employees;
  inputs.yearsInBusiness = bi?.years_in_business ?? bi?.established_years;
  inputs.backlog = bi?.backlog ?? bi?.order_backlog;
  inputs.recurringRevenuePct = bi?.recurring_revenue_pct;
  inputs.debtLevel = bi?.debt ?? bi?.total_debt;

  return inputs;
}
