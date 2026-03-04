import { useState, useMemo } from "react";
import { DollarSign, Calculator, TrendingDown, TrendingUp, AlertTriangle, CheckCircle2, ChevronRight } from "lucide-react";
import { InfoExplainer } from "./InfoExplainer";

interface DealEconomicsPanelProps {
  sde?: number;
  askingPrice?: number;
  revenue?: number;
  analysisData?: any;
}

interface LoanCalc {
  downPayment: number;
  loanAmount: number;
  monthlyPayment: number;
  annualDebtService: number;
  dscr: number;
  dscrStatus: "pass" | "warning" | "fail";
}

function calcSBALoan(askingPrice: number, downPct: number, rate: number, termYears: number, annualCashFlow: number): LoanCalc {
  const downPayment = askingPrice * downPct;
  const loanAmount = askingPrice - downPayment;
  const monthlyRate = rate / 12;
  const nPayments = termYears * 12;
  const monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, nPayments)) / (Math.pow(1 + monthlyRate, nPayments) - 1);
  const annualDebtService = monthlyPayment * 12;
  const dscr = annualCashFlow / annualDebtService;
  return {
    downPayment,
    loanAmount,
    monthlyPayment,
    annualDebtService,
    dscr,
    dscrStatus: dscr >= 1.25 ? "pass" : dscr >= 1.0 ? "warning" : "fail",
  };
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

const DSCR_COLORS = {
  pass: { bg: "hsl(142 70% 45% / 0.08)", border: "hsl(142 70% 45% / 0.3)", text: "hsl(142 70% 30%)" },
  warning: { bg: "hsl(38 92% 50% / 0.08)", border: "hsl(38 92% 50% / 0.3)", text: "hsl(38 92% 35%)" },
  fail: { bg: "hsl(var(--destructive) / 0.08)", border: "hsl(var(--destructive) / 0.3)", text: "hsl(var(--destructive))" },
};

export function DealEconomicsPanel({ sde: initialSde, askingPrice: initialPrice, revenue: initialRevenue, analysisData }: DealEconomicsPanelProps) {
  const [sde, setSde] = useState(initialSde || 0);
  const [askingPrice, setAskingPrice] = useState(initialPrice || 0);
  const [revenue, setRevenue] = useState(initialRevenue || 0);
  const [downPct, setDownPct] = useState(0.1);
  const [rate, setRate] = useState(0.105); // SBA prime + 2.75
  const [termYears, setTermYears] = useState(10);

  const multiple = sde > 0 ? askingPrice / sde : 0;
  const multipleStatus = multiple === 0 ? "neutral" : multiple <= 3 ? "good" : multiple <= 4.5 ? "fair" : "high";

  const loan = useMemo(() => {
    if (askingPrice <= 0 || sde <= 0) return null;
    return calcSBALoan(askingPrice, downPct, rate, termYears, sde);
  }, [askingPrice, sde, downPct, rate, termYears]);

  // Sensitivity analysis
  const sensitivity = useMemo(() => {
    if (!loan || sde <= 0) return [];
    return [-30, -20, -10, 0, 10, 20].map(pctChange => {
      const adjusted = sde * (1 + pctChange / 100);
      const dscr = adjusted / loan.annualDebtService;
      return { pctChange, adjustedSde: adjusted, dscr, status: dscr >= 1.25 ? "pass" : dscr >= 1.0 ? "warning" : "fail" as const };
    });
  }, [loan, sde]);

  const inputStyle = {
    border: "1.5px solid hsl(var(--border))",
    background: "hsl(var(--background))",
    color: "hsl(var(--foreground))",
  } as React.CSSProperties;

  return (
    <div className="space-y-4">
      {/* Input row */}
      <div className="p-4 rounded-xl" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
        <div className="flex items-center gap-2 mb-3">
          <Calculator size={14} style={{ color: "hsl(var(--primary))" }} />
          <p className="typo-card-eyebrow" style={{ color: "hsl(var(--primary))" }}>Deal Inputs</p>
          <InfoExplainer text="Enter the financials from the CIM or listing. SDE = Seller's Discretionary Earnings (owner's total compensation from the business). The calculator uses standard SBA 7(a) loan terms." />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="typo-status-label text-muted-foreground">Asking Price</label>
            <input type="number" value={askingPrice || ""} onChange={e => setAskingPrice(Number(e.target.value))}
              placeholder="e.g. 1500000" className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none" style={inputStyle} />
          </div>
          <div className="space-y-1">
            <label className="typo-status-label text-muted-foreground">SDE (Annual)</label>
            <input type="number" value={sde || ""} onChange={e => setSde(Number(e.target.value))}
              placeholder="e.g. 400000" className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none" style={inputStyle} />
          </div>
          <div className="space-y-1">
            <label className="typo-status-label text-muted-foreground">Revenue (Annual)</label>
            <input type="number" value={revenue || ""} onChange={e => setRevenue(Number(e.target.value))}
              placeholder="e.g. 2000000" className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none" style={inputStyle} />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-3">
          <div className="space-y-1">
            <label className="typo-status-label text-muted-foreground">Down Payment %</label>
            <select value={downPct} onChange={e => setDownPct(Number(e.target.value))}
              className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none" style={inputStyle}>
              <option value={0.1}>10%</option>
              <option value={0.15}>15%</option>
              <option value={0.2}>20%</option>
              <option value={0.25}>25%</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="typo-status-label text-muted-foreground">Interest Rate</label>
            <select value={rate} onChange={e => setRate(Number(e.target.value))}
              className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none" style={inputStyle}>
              <option value={0.095}>9.5%</option>
              <option value={0.10}>10.0%</option>
              <option value={0.105}>10.5%</option>
              <option value={0.11}>11.0%</option>
              <option value={0.115}>11.5%</option>
              <option value={0.12}>12.0%</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="typo-status-label text-muted-foreground">Loan Term</label>
            <select value={termYears} onChange={e => setTermYears(Number(e.target.value))}
              className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none" style={inputStyle}>
              <option value={7}>7 years</option>
              <option value={10}>10 years</option>
              <option value={15}>15 years</option>
              <option value={25}>25 years (RE)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Valuation Sanity */}
      {askingPrice > 0 && sde > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl" style={{
            background: multipleStatus === "good" ? "hsl(142 70% 45% / 0.06)" : multipleStatus === "fair" ? "hsl(38 92% 50% / 0.06)" : "hsl(var(--destructive) / 0.06)",
            border: `1px solid ${multipleStatus === "good" ? "hsl(142 70% 45% / 0.25)" : multipleStatus === "fair" ? "hsl(38 92% 50% / 0.25)" : "hsl(var(--destructive) / 0.25)"}`,
          }}>
            <p className="typo-status-label text-muted-foreground mb-1">SDE Multiple</p>
            <p className="text-2xl font-black tabular-nums" style={{
              color: multipleStatus === "good" ? "hsl(142 70% 30%)" : multipleStatus === "fair" ? "hsl(38 92% 35%)" : "hsl(var(--destructive))",
            }}>{multiple.toFixed(1)}x</p>
            <p className="typo-card-meta text-muted-foreground mt-1">
              {multipleStatus === "good" ? "Below 3x — strong value" : multipleStatus === "fair" ? "3-4.5x — typical range" : "Above 4.5x — premium pricing"}
            </p>
          </div>
          <div className="p-3 rounded-xl" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
            <p className="typo-status-label text-muted-foreground mb-1">SDE Margin</p>
            <p className="text-2xl font-black tabular-nums" style={{ color: "hsl(var(--foreground))" }}>
              {revenue > 0 ? `${((sde / revenue) * 100).toFixed(0)}%` : "—"}
            </p>
            <p className="typo-card-meta text-muted-foreground mt-1">
              {revenue > 0 && (sde / revenue) >= 0.25 ? "Healthy margin" : revenue > 0 ? "Thin margin — investigate" : "Enter revenue"}
            </p>
          </div>
          <div className="p-3 rounded-xl" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
            <p className="typo-status-label text-muted-foreground mb-1">Your Cash Needed</p>
            <p className="text-2xl font-black tabular-nums" style={{ color: "hsl(var(--foreground))" }}>
              {fmt(askingPrice * downPct)}
            </p>
            <p className="typo-card-meta text-muted-foreground mt-1">{(downPct * 100).toFixed(0)}% equity injection</p>
          </div>
        </div>
      )}

      {/* SBA Loan Breakdown */}
      {loan && (
        <div className="p-4 rounded-xl" style={{
          background: DSCR_COLORS[loan.dscrStatus].bg,
          border: `1.5px solid ${DSCR_COLORS[loan.dscrStatus].border}`,
        }}>
          <div className="flex items-center gap-2 mb-3">
            <DollarSign size={14} style={{ color: DSCR_COLORS[loan.dscrStatus].text }} />
            <p className="typo-card-eyebrow" style={{ color: DSCR_COLORS[loan.dscrStatus].text }}>
              SBA 7(a) Debt Service
            </p>
            <InfoExplainer text="Debt Service Coverage Ratio (DSCR) = SDE ÷ Annual Debt Service. SBA lenders typically require ≥1.25x. Below 1.0x means the business can't cover its loan payments." />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <p className="typo-status-label text-muted-foreground">Loan Amount</p>
              <p className="text-sm font-bold tabular-nums">{fmt(loan.loanAmount)}</p>
            </div>
            <div>
              <p className="typo-status-label text-muted-foreground">Monthly Payment</p>
              <p className="text-sm font-bold tabular-nums">{fmt(loan.monthlyPayment)}</p>
            </div>
            <div>
              <p className="typo-status-label text-muted-foreground">Annual Debt Service</p>
              <p className="text-sm font-bold tabular-nums">{fmt(loan.annualDebtService)}</p>
            </div>
            <div>
              <p className="typo-status-label text-muted-foreground">DSCR</p>
              <p className="text-lg font-black tabular-nums" style={{ color: DSCR_COLORS[loan.dscrStatus].text }}>
                {loan.dscr.toFixed(2)}x
              </p>
              <p className="typo-card-meta" style={{ color: DSCR_COLORS[loan.dscrStatus].text }}>
                {loan.dscrStatus === "pass" ? "✓ Meets SBA minimum" : loan.dscrStatus === "warning" ? "⚠ Tight — limited margin" : "✗ Below SBA threshold"}
              </p>
            </div>
          </div>
          {/* Owner take-home */}
          <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${DSCR_COLORS[loan.dscrStatus].border}` }}>
            <p className="typo-status-label text-muted-foreground mb-1">Your Take-Home After Debt Service</p>
            <p className="text-lg font-black tabular-nums" style={{ color: (sde - loan.annualDebtService) > 0 ? "hsl(142 70% 30%)" : "hsl(var(--destructive))" }}>
              {fmt(sde - loan.annualDebtService)}/yr
            </p>
            <p className="typo-card-meta text-muted-foreground">
              {fmt((sde - loan.annualDebtService) / 12)}/mo before taxes
            </p>
          </div>
        </div>
      )}

      {/* Sensitivity Table */}
      {sensitivity.length > 0 && (
        <div className="p-4 rounded-xl" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown size={14} style={{ color: "hsl(var(--primary))" }} />
            <p className="typo-card-eyebrow" style={{ color: "hsl(var(--primary))" }}>Sensitivity Analysis</p>
            <InfoExplainer text="What happens to your DSCR if revenue changes? This shows how resilient the deal is to downside scenarios." />
          </div>
          <div className="grid grid-cols-6 gap-1">
            {sensitivity.map(s => (
              <div key={s.pctChange} className="text-center p-2 rounded-lg" style={{
                background: DSCR_COLORS[s.status].bg,
                border: `1px solid ${DSCR_COLORS[s.status].border}`,
              }}>
                <p className="typo-status-label font-bold" style={{ color: s.pctChange === 0 ? "hsl(var(--foreground))" : s.pctChange > 0 ? "hsl(142 70% 30%)" : "hsl(var(--destructive))" }}>
                  {s.pctChange > 0 ? "+" : ""}{s.pctChange}%
                </p>
                <p className="text-sm font-black tabular-nums mt-0.5" style={{ color: DSCR_COLORS[s.status].text }}>
                  {s.dscr.toFixed(2)}x
                </p>
                <p className="typo-card-meta text-muted-foreground">{fmt(s.adjustedSde)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
