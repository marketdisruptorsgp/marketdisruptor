/**
 * SBA LOAN CALCULATOR — Interactive tool for ETA lens
 *
 * Real financial modeling using the deterministic engine.
 * Supports scenario saving that feeds back into the intelligence engine.
 */

import { useState, useMemo, useCallback } from "react";
import { Calculator, Save, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";
import { computeSBALoan, fmtCurrency, type SBALoanInputs } from "@/lib/financialModelingEngine";
import { saveScenario, generateScenarioId, type ToolScenario } from "@/lib/scenarioEngine";
import { toast } from "sonner";

interface SBALoanCalculatorProps {
  analysisId: string;
  onScenarioSaved?: (scenario: ToolScenario) => void;
}

function SliderInput({ label, value, onChange, min, max, step, format }: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step: number; format: (v: number) => string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{label}</label>
        <span className="text-sm font-extrabold text-foreground tabular-nums">{format(value)}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer bg-muted accent-primary"
      />
      <div className="flex justify-between text-[9px] text-muted-foreground">
        <span>{format(min)}</span><span>{format(max)}</span>
      </div>
    </div>
  );
}

export function SBALoanCalculator({ analysisId, onScenarioSaved }: SBALoanCalculatorProps) {
  const [inputs, setInputs] = useState<SBALoanInputs>({
    purchasePrice: 2000000,
    adjustedSDE: 500000,
    downPaymentPct: 0.1,
    interestRate: 0.065,
    loanTermYears: 10,
    workingCapital: 50000,
  });

  const [scenarioName, setScenarioName] = useState("SBA Scenario 1");

  const result = useMemo(() => computeSBALoan(inputs), [inputs]);

  const dscrColor = result.dscrStatus === "healthy" ? "hsl(152 60% 44%)"
    : result.dscrStatus === "viable" ? "hsl(38 92% 50%)"
    : "hsl(0 72% 52%)";

  const DscrIcon = result.dscrStatus === "healthy" ? CheckCircle2
    : result.dscrStatus === "viable" ? TrendingUp : AlertTriangle;

  const handleSave = useCallback(() => {
    const scenario: ToolScenario = {
      scenarioId: generateScenarioId(),
      analysisId,
      toolId: "sba-loan-calculator",
      scenarioName,
      inputVariables: {
        purchasePrice: inputs.purchasePrice,
        adjustedSDE: inputs.adjustedSDE,
        downPaymentPct: inputs.downPaymentPct,
        interestRate: inputs.interestRate,
        loanTermYears: inputs.loanTermYears,
        workingCapital: inputs.workingCapital || 0,
      },
      outputResults: {
        loanAmount: result.loanAmount.value,
        monthlyPayment: result.monthlyPayment.value,
        annualDebtService: result.annualDebtService.value,
        ownerCashFlow: result.ownerCashFlowAfterDebt.value,
        dscr: Math.round(result.dscr.value * 100) / 100,
        dscrStatus: result.dscrStatus,
        totalInterest: result.totalInterestPaid.value,
      },
      strategicImpact: result.dscrStatus === "healthy" ? "high" : result.dscrStatus === "viable" ? "medium" : "low",
      timestamp: Date.now(),
    };

    saveScenario(scenario);
    onScenarioSaved?.(scenario);
    toast.success("Scenario saved — intelligence updating");
  }, [analysisId, scenarioName, inputs, result, onScenarioSaved]);

  return (
    <div className="space-y-5">
      {/* Scenario Name */}
      <div>
        <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Scenario Name</label>
        <input
          type="text"
          value={scenarioName}
          onChange={e => setScenarioName(e.target.value)}
          className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Inputs */}
      <div className="space-y-4">
        <SliderInput
          label="Purchase Price"
          value={inputs.purchasePrice}
          onChange={v => setInputs(p => ({ ...p, purchasePrice: v }))}
          min={250000} max={10000000} step={50000}
          format={fmtCurrency}
        />
        <SliderInput
          label="Adjusted SDE"
          value={inputs.adjustedSDE}
          onChange={v => setInputs(p => ({ ...p, adjustedSDE: v }))}
          min={50000} max={3000000} step={25000}
          format={fmtCurrency}
        />
        <SliderInput
          label="Down Payment"
          value={inputs.downPaymentPct}
          onChange={v => setInputs(p => ({ ...p, downPaymentPct: v }))}
          min={0.05} max={0.5} step={0.01}
          format={v => `${(v * 100).toFixed(0)}%`}
        />
        <SliderInput
          label="Interest Rate"
          value={inputs.interestRate}
          onChange={v => setInputs(p => ({ ...p, interestRate: v }))}
          min={0.03} max={0.12} step={0.0025}
          format={v => `${(v * 100).toFixed(2)}%`}
        />
        <SliderInput
          label="Loan Term"
          value={inputs.loanTermYears}
          onChange={v => setInputs(p => ({ ...p, loanTermYears: v }))}
          min={5} max={25} step={1}
          format={v => `${v} years`}
        />
        <SliderInput
          label="Working Capital"
          value={inputs.workingCapital || 0}
          onChange={v => setInputs(p => ({ ...p, workingCapital: v }))}
          min={0} max={500000} step={10000}
          format={fmtCurrency}
        />
      </div>

      {/* Results */}
      <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Results</p>

        <div className="grid grid-cols-2 gap-3">
          <ResultCell label="Loan Amount" value={fmtCurrency(result.loanAmount.value)} />
          <ResultCell label="Down Payment" value={fmtCurrency(result.downPayment.value)} />
          <ResultCell label="Monthly Payment" value={fmtCurrency(result.monthlyPayment.value)} />
          <ResultCell label="Annual Debt Service" value={fmtCurrency(result.annualDebtService.value)} />
          <ResultCell label="Owner Cash Flow" value={fmtCurrency(result.ownerCashFlowAfterDebt.value)}
            color={result.ownerCashFlowAfterDebt.value >= 0 ? "hsl(152 60% 44%)" : "hsl(0 72% 52%)"} />
          <ResultCell label="Total Interest" value={fmtCurrency(result.totalInterestPaid.value)} />
        </div>

        {/* DSCR highlight */}
        <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: `${dscrColor}10`, border: `1px solid ${dscrColor}25` }}>
          <DscrIcon size={18} style={{ color: dscrColor }} />
          <div>
            <p className="text-lg font-extrabold tabular-nums" style={{ color: dscrColor }}>
              {result.dscr.value.toFixed(2)}x DSCR
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: dscrColor }}>
              {result.dscrStatus.replace("_", " ")}
            </p>
          </div>
        </div>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all hover:scale-[1.01] active:scale-[0.99] bg-primary text-primary-foreground"
      >
        <Save size={15} />
        Save Scenario → Feed Intelligence
      </button>
    </div>
  );
}

function ResultCell({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="text-center p-2 rounded-lg bg-background">
      <p className="text-xs font-extrabold tabular-nums" style={{ color: color || "hsl(var(--foreground))" }}>{value}</p>
      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  );
}
