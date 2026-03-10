/**
 * Financial Trend Extractor
 * Pulls multi-year P&L data from biExtraction for trend visualization.
 */

export interface YearlyFinancials {
  year: string;
  revenue?: number;
  cogs?: number;
  grossProfit?: number;
  grossMarginPct?: number;
  sde?: number;
  sdeMarginPct?: number;
  netIncome?: number;
  operatingExpenses?: number;
}

export interface FinancialTrends {
  years: YearlyFinancials[];
  hasMultiYear: boolean;
  revenueCAGR: number | null;
  sdeCAGR: number | null;
  marginTrend: "improving" | "stable" | "declining" | "unknown";
  sdeTrend: "growing" | "stable" | "shrinking" | "unknown";
}

function calcCAGR(start: number, end: number, periods: number): number | null {
  if (start <= 0 || end <= 0 || periods <= 0) return null;
  return (Math.pow(end / start, 1 / periods) - 1) * 100;
}

function determineTrend(values: number[]): "improving" | "stable" | "declining" | "unknown" {
  if (values.length < 2) return "unknown";
  const diffs = values.slice(1).map((v, i) => v - values[i]);
  const avgDiff = diffs.reduce((s, d) => s + d, 0) / diffs.length;
  const avgVal = values.reduce((s, v) => s + v, 0) / values.length;
  const relChange = avgVal > 0 ? avgDiff / avgVal : 0;
  if (relChange > 0.02) return "improving";
  if (relChange < -0.02) return "declining";
  return "stable";
}

/**
 * Extract yearly financial data from biExtraction or governedData.
 * Looks for multi-year P&L tables, historical financials, etc.
 */
export function extractFinancialTrends(
  biExtraction: Record<string, any> | null,
  governedData: Record<string, any> | null,
): FinancialTrends {
  const years: YearlyFinancials[] = [];
  const bi = biExtraction || {};
  const gov = governedData || {};

  // Strategy 1: Look for structured yearly data in biExtraction
  const historicalData = bi?.historical_financials
    ?? bi?.multi_year_financials
    ?? bi?.yearly_financials
    ?? bi?.financial_history
    ?? bi?.eta_assessment?.historical_financials
    ?? gov?.historical_financials
    ?? null;

  if (Array.isArray(historicalData)) {
    for (const row of historicalData) {
      const year = String(row.year || row.period || row.label || "");
      if (!year) continue;
      years.push({
        year,
        revenue: parseNum(row.revenue ?? row.total_revenue ?? row.sales),
        cogs: parseNum(row.cogs ?? row.cost_of_goods_sold ?? row.cost_of_revenue),
        grossProfit: parseNum(row.gross_profit),
        grossMarginPct: parseNum(row.gross_margin_pct ?? row.gross_margin),
        sde: parseNum(row.sde ?? row.sellers_discretionary_earnings ?? row.adjusted_sde),
        sdeMarginPct: parseNum(row.sde_margin_pct ?? row.sde_margin),
        netIncome: parseNum(row.net_income ?? row.net_profit),
        operatingExpenses: parseNum(row.operating_expenses ?? row.opex),
      });
    }
  }

  // Strategy 2: Look for P&L line items with year columns
  const plData = bi?.profit_and_loss ?? bi?.income_statement ?? bi?.pnl ?? null;
  if (plData && typeof plData === "object" && !Array.isArray(plData) && years.length === 0) {
    const yearKeys = Object.keys(plData).filter(k => /^\d{4}$/.test(k) || /^\d{4}[-\/]/.test(k));
    for (const yk of yearKeys) {
      const col = plData[yk];
      if (typeof col !== "object") continue;
      years.push({
        year: yk.slice(0, 4),
        revenue: parseNum(col.revenue ?? col.total_revenue ?? col.sales),
        cogs: parseNum(col.cogs ?? col.cost_of_goods_sold),
        grossProfit: parseNum(col.gross_profit),
        sde: parseNum(col.sde ?? col.adjusted_sde),
        netIncome: parseNum(col.net_income),
      });
    }
  }

  // Strategy 3: Single-year snapshot → create at least one data point
  if (years.length === 0) {
    const snap = bi?.eta_assessment?.financial_snapshot ?? bi?.financial_snapshot ?? null;
    const rev = parseNum(bi?.revenue ?? bi?.annual_revenue ?? snap?.revenue ?? gov?.revenue);
    const sde = parseNum(bi?.sde ?? bi?.adjusted_sde ?? snap?.sde ?? gov?.sde);
    const grossMargin = parseNum(snap?.gross_margin_pct ?? bi?.gross_margin);

    if (rev || sde) {
      years.push({
        year: "Current",
        revenue: rev ?? undefined,
        sde: sde ?? undefined,
        grossMarginPct: grossMargin ?? undefined,
        sdeMarginPct: rev && sde ? (sde / rev) * 100 : undefined,
      });
    }
  }

  // Compute derived fields
  for (const y of years) {
    if (y.revenue && y.cogs && !y.grossProfit) y.grossProfit = y.revenue - y.cogs;
    if (y.revenue && y.grossProfit && !y.grossMarginPct) y.grossMarginPct = (y.grossProfit / y.revenue) * 100;
    if (y.revenue && y.sde && !y.sdeMarginPct) y.sdeMarginPct = (y.sde / y.revenue) * 100;
  }

  // Sort by year
  years.sort((a, b) => a.year.localeCompare(b.year));

  const hasMultiYear = years.length >= 2;

  // CAGR
  const revValues = years.filter(y => y.revenue).map(y => y.revenue!);
  const sdeValues = years.filter(y => y.sde).map(y => y.sde!);
  const revenueCAGR = revValues.length >= 2 ? calcCAGR(revValues[0], revValues[revValues.length - 1], revValues.length - 1) : null;
  const sdeCAGR = sdeValues.length >= 2 ? calcCAGR(sdeValues[0], sdeValues[sdeValues.length - 1], sdeValues.length - 1) : null;

  // Trends
  const marginValues = years.filter(y => y.grossMarginPct).map(y => y.grossMarginPct!);
  const marginTrend = determineTrend(marginValues) as FinancialTrends["marginTrend"];
  const sdeTrendDir = sdeValues.length >= 2
    ? (sdeValues[sdeValues.length - 1] > sdeValues[0] * 1.02 ? "growing"
      : sdeValues[sdeValues.length - 1] < sdeValues[0] * 0.98 ? "shrinking" : "stable")
    : "unknown";

  return { years, hasMultiYear, revenueCAGR, sdeCAGR, marginTrend, sdeTrend: sdeTrendDir as FinancialTrends["sdeTrend"] };
}

function parseNum(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const cleaned = v.replace(/[$,\s%]/g, "");
    const n = Number(cleaned);
    return isNaN(n) ? null : n;
  }
  return null;
}
