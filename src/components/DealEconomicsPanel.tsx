import { useState, useMemo } from "react";
import { DollarSign, Calculator, TrendingDown, AlertTriangle, Shield } from "lucide-react";
import { InfoExplainer } from "./InfoExplainer";
import { computeSBALoan, computeValuation, runScenarios, fmtCurrency, type SBALoanInputs } from "@/lib/financialModelingEngine";
import type { ProvenancedValue } from "@/lib/dataProvenance";

interface DealEconomicsPanelProps {
  sde?: number;
  askingPrice?: number;
  revenue?: number;
  analysisData?: any;
}

function ProvenanceBadge({ pv }: { pv: ProvenancedValue }) {
  const [show, setShow] = useState(false);
  const p = pv.provenance;
  const typeColor = p.dataType === "USER_INPUT" ? "hsl(220 70% 50%)" : p.dataType === "MODELED" ? "hsl(var(--primary))" : "hsl(142 70% 35%)";
  return (
    <span className="relative inline-block">
      <button onClick={() => setShow(!show)} className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wider px-1 py-0.5 rounded opacity-60 hover:opacity-100 transition-opacity" style={{ color: typeColor, background: `${typeColor}10` }}>
        <Shield className="w-2.5 h-2.5" /> {p.dataType}
      </button>
      {show && (
        <div className="absolute z-50 top-full left-0 mt-1 p-2.5 rounded-lg shadow-lg text-xs space-y-1 w-64" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <p className="font-bold text-foreground">{p.method}</p>
          <p className="text-muted-foreground">Source: {p.source}</p>
          <p className="text-muted-foreground">Confidence: {Math.round(p.confidence * 100)}%</p>
          <button onClick={() => setShow(false)} className="text-primary text-[10px] font-bold">Close</button>
        </div>
      )}
    </span>
  );
}

const DSCR_COLORS = {
  healthy: { bg: "hsl(142 70% 45% / 0.08)", border: "hsl(142 70% 45% / 0.3)", text: "hsl(142 70% 30%)" },
  viable: { bg: "hsl(142 70% 45% / 0.08)", border: "hsl(142 70% 45% / 0.3)", text: "hsl(142 70% 30%)" },
  high_risk: { bg: "hsl(38 92% 50% / 0.08)", border: "hsl(38 92% 50% / 0.3)", text: "hsl(38 92% 35%)" },
  not_viable: { bg: "hsl(var(--destructive) / 0.08)", border: "hsl(var(--destructive) / 0.3)", text: "hsl(var(--destructive))" },
};

const DSCR_LABELS = {
  healthy: "✓ Healthy coverage (≥1.5x)",
  viable: "✓ Meets SBA minimum (≥1.25x)",
  high_risk: "⚠ High risk (1.0–1.24x)",
  not_viable: "✗ Deal not viable (<1.0x)",
};

export function DealEconomicsPanel({ sde: initialSde, askingPrice: initialPrice, revenue: initialRevenue }: DealEconomicsPanelProps) {
  const [sde, setSde] = useState(initialSde || 0);
  const [askingPrice, setAskingPrice] = useState(initialPrice || 0);
  const [revenue, setRevenue] = useState(initialRevenue || 0);
  const [downPct, setDownPct] = useState(0.1);
  const [rate, setRate] = useState(0.105);
  const [termYears, setTermYears] = useState(10);

  const loanInputs: SBALoanInputs = useMemo(() => ({
    purchasePrice: askingPrice,
    adjustedSDE: sde,
    downPaymentPct: downPct,
    interestRate: rate,
    loanTermYears: termYears,
  }), [askingPrice, sde, downPct, rate, termYears]);

  const loan = useMemo(() => {
    if (askingPrice <= 0 || sde <= 0) return null;
    return computeSBALoan(loanInputs);
  }, [loanInputs, askingPrice, sde]);

  const valuation = useMemo(() => {
    if (askingPrice <= 0 || sde <= 0) return null;
    return computeValuation(askingPrice, sde, revenue);
  }, [askingPrice, sde, revenue]);

  const scenarios = useMemo(() => {
    if (!loan || sde <= 0 || revenue <= 0) return [];
    return runScenarios(loanInputs, revenue);
  }, [loan, loanInputs, sde, revenue]);

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
          <InfoExplainer text="Enter the financials from the CIM or listing. SDE = Seller's Discretionary Earnings. All calculations use deterministic formulas with full provenance tracking." />
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
      {valuation && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl" style={{
            background: valuation.multipleStatus === "strong_value" ? "hsl(142 70% 45% / 0.06)" : valuation.multipleStatus === "fair" ? "hsl(38 92% 50% / 0.06)" : "hsl(var(--destructive) / 0.06)",
            border: `1px solid ${valuation.multipleStatus === "strong_value" ? "hsl(142 70% 45% / 0.25)" : valuation.multipleStatus === "fair" ? "hsl(38 92% 50% / 0.25)" : "hsl(var(--destructive) / 0.25)"}`,
          }}>
            <p className="typo-status-label text-muted-foreground mb-1">SDE Multiple</p>
            <div className="flex items-center gap-1.5">
              <p className="text-2xl font-black tabular-nums" style={{
                color: valuation.multipleStatus === "strong_value" ? "hsl(142 70% 30%)" : valuation.multipleStatus === "fair" ? "hsl(38 92% 35%)" : "hsl(var(--destructive))",
              }}>{valuation.sdeMultiple.value.toFixed(1)}x</p>
              <ProvenanceBadge pv={valuation.sdeMultiple} />
            </div>
            <p className="typo-card-meta text-muted-foreground mt-1">
              {valuation.multipleStatus === "strong_value" ? "Below 3x — strong value" : valuation.multipleStatus === "fair" ? "3-4.5x — typical range" : "Above 4.5x — premium pricing"}
            </p>
          </div>
          <div className="p-3 rounded-xl" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
            <p className="typo-status-label text-muted-foreground mb-1">SDE Margin</p>
            <div className="flex items-center gap-1.5">
              <p className="text-2xl font-black tabular-nums text-foreground">
                {revenue > 0 ? `${(valuation.sdeMargin.value * 100).toFixed(0)}%` : "—"}
              </p>
              {revenue > 0 && <ProvenanceBadge pv={valuation.sdeMargin} />}
            </div>
            <p className="typo-card-meta text-muted-foreground mt-1">
              {revenue > 0 && valuation.sdeMargin.value >= 0.25 ? "Healthy margin" : revenue > 0 ? "Thin margin — investigate" : "Enter revenue"}
            </p>
          </div>
          <div className="p-3 rounded-xl" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
            <p className="typo-status-label text-muted-foreground mb-1">Your Cash Needed</p>
            <div className="flex items-center gap-1.5">
              <p className="text-2xl font-black tabular-nums text-foreground">{loan ? fmtCurrency(loan.downPayment.value) : "—"}</p>
              {loan && <ProvenanceBadge pv={loan.downPayment} />}
            </div>
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
            <p className="typo-card-eyebrow" style={{ color: DSCR_COLORS[loan.dscrStatus].text }}>SBA 7(a) Debt Service</p>
            <InfoExplainer text="DSCR = Adjusted SDE ÷ Annual Debt Service. SBA lenders require ≥1.25x. All values computed deterministically with full provenance." />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <p className="typo-status-label text-muted-foreground">Loan Amount</p>
              <p className="text-sm font-bold tabular-nums">{fmtCurrency(loan.loanAmount.value)}</p>
              <ProvenanceBadge pv={loan.loanAmount} />
            </div>
            <div>
              <p className="typo-status-label text-muted-foreground">Monthly Payment</p>
              <p className="text-sm font-bold tabular-nums">{fmtCurrency(loan.monthlyPayment.value)}</p>
              <ProvenanceBadge pv={loan.monthlyPayment} />
            </div>
            <div>
              <p className="typo-status-label text-muted-foreground">Annual Debt Service</p>
              <p className="text-sm font-bold tabular-nums">{fmtCurrency(loan.annualDebtService.value)}</p>
              <ProvenanceBadge pv={loan.annualDebtService} />
            </div>
            <div>
              <p className="typo-status-label text-muted-foreground">DSCR</p>
              <div className="flex items-center gap-1.5">
                <p className="text-lg font-black tabular-nums" style={{ color: DSCR_COLORS[loan.dscrStatus].text }}>
                  {loan.dscr.value.toFixed(2)}x
                </p>
                <ProvenanceBadge pv={loan.dscr} />
              </div>
              <p className="typo-card-meta" style={{ color: DSCR_COLORS[loan.dscrStatus].text }}>
                {DSCR_LABELS[loan.dscrStatus]}
              </p>
            </div>
          </div>
          {/* Owner take-home */}
          <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${DSCR_COLORS[loan.dscrStatus].border}` }}>
            <p className="typo-status-label text-muted-foreground mb-1">Your Take-Home After Debt Service</p>
            <div className="flex items-center gap-1.5">
              <p className="text-lg font-black tabular-nums" style={{ color: loan.ownerCashFlowAfterDebt.value > 0 ? "hsl(142 70% 30%)" : "hsl(var(--destructive))" }}>
                {fmtCurrency(loan.ownerCashFlowAfterDebt.value)}/yr
              </p>
              <ProvenanceBadge pv={loan.ownerCashFlowAfterDebt} />
            </div>
            <p className="typo-card-meta text-muted-foreground">
              {fmtCurrency(loan.ownerCashFlowAfterDebt.value / 12)}/mo before taxes
            </p>
          </div>
        </div>
      )}

      {/* Scenario Modeling */}
      {scenarios.length > 0 && (
        <div className="p-4 rounded-xl" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown size={14} style={{ color: "hsl(var(--primary))" }} />
            <p className="typo-card-eyebrow" style={{ color: "hsl(var(--primary))" }}>Scenario Modeling</p>
            <InfoExplainer text="Deterministic scenarios showing DSCR sensitivity to revenue changes. All outputs tagged as MODELED with full provenance." />
          </div>
          <div className="grid grid-cols-6 gap-1">
            {scenarios.map(s => {
              const colors = DSCR_COLORS[s.dscrStatus];
              return (
                <div key={s.revenueChangePct} className="text-center p-2 rounded-lg" style={{ background: colors.bg, border: `1px solid ${colors.border}` }}>
                  <p className="typo-status-label font-bold" style={{ color: s.revenueChangePct === 0 ? "hsl(var(--foreground))" : s.revenueChangePct > 0 ? "hsl(142 70% 30%)" : "hsl(var(--destructive))" }}>
                    {s.revenueChangePct > 0 ? "+" : ""}{s.revenueChangePct}%
                  </p>
                  <p className="text-sm font-black tabular-nums mt-0.5" style={{ color: colors.text }}>
                    {s.dscr.value.toFixed(2)}x
                  </p>
                  <p className="typo-card-meta text-muted-foreground">{fmtCurrency(s.adjustedSDE.value)}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
