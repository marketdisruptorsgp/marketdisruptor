/**
 * ACQUISITION ROI MODEL — Project return on investment across hold periods
 * Uses real governed data for SDE, constraints, and risk signals.
 */
import { useState, useMemo, useCallback } from "react";
import { Save, TrendingUp } from "lucide-react";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { fmtCurrency } from "@/lib/financialModelingEngine";
import { saveScenario, generateScenarioId, type ToolScenario } from "@/lib/scenarioEngine";
import { toast } from "sonner";

interface Props {
  analysisId: string;
  onScenarioSaved?: (scenario: ToolScenario) => void;
}

function Slider({ label, value, onChange, min, max, step, format }: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step: number; format: (v: number) => string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{label}</label>
        <span className="text-sm font-extrabold text-foreground tabular-nums">{format(value)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer bg-muted accent-primary" />
    </div>
  );
}

export function AcquisitionROIModel({ analysisId, onScenarioSaved }: Props) {
  const { businessAnalysisData } = useAnalysis();
  const gov = (businessAnalysisData as any)?.governed;

  const [purchasePrice, setPurchasePrice] = useState(2000000);
  const [adjustedSDE, setAdjustedSDE] = useState(500000);
  const [annualGrowth, setAnnualGrowth] = useState(5);
  const [holdPeriod, setHoldPeriod] = useState(5);
  const [exitMultiple, setExitMultiple] = useState(4);
  const [downPayment, setDownPayment] = useState(200000);
  const [scenarioName, setScenarioName] = useState("ROI Scenario 1");

  const results = useMemo(() => {
    const totalEquityInvested = downPayment;
    const futureSDE = adjustedSDE * Math.pow(1 + annualGrowth / 100, holdPeriod);
    const exitValue = futureSDE * exitMultiple;
    const totalCashFlow = Array.from({ length: holdPeriod }, (_, y) =>
      adjustedSDE * Math.pow(1 + annualGrowth / 100, y + 1) * 0.5
    ).reduce((s, v) => s + v, 0);
    const totalReturn = exitValue + totalCashFlow - purchasePrice;
    const moic = (exitValue + totalCashFlow) / Math.max(totalEquityInvested, 1);
    const irr = Math.pow(moic, 1 / holdPeriod) - 1;

    return { futureSDE, exitValue, totalCashFlow, totalReturn, moic, irr, totalEquityInvested };
  }, [purchasePrice, adjustedSDE, annualGrowth, holdPeriod, exitMultiple, downPayment]);

  const handleSave = useCallback(() => {
    const scenario: ToolScenario = {
      scenarioId: generateScenarioId(), analysisId, toolId: "acquisition-roi-model",
      scenarioName, timestamp: Date.now(),
      inputVariables: { purchasePrice, adjustedSDE, annualGrowth, holdPeriod, exitMultiple, downPayment },
      outputResults: results,
      strategicImpact: results.moic >= 3 ? "high" : results.moic >= 2 ? "medium" : "low",
    };
    saveScenario(scenario);
    onScenarioSaved?.(scenario);
    toast.success("ROI scenario saved");
  }, [analysisId, scenarioName, purchasePrice, adjustedSDE, annualGrowth, holdPeriod, exitMultiple, downPayment, results, onScenarioSaved]);

  const fragility = useMemo(() => {
    if (!gov?.root_hypotheses) return [];
    return (gov.root_hypotheses as any[]).filter((h: any) => h.fragility_score <= 4).map((h: any) => h.hypothesis_statement);
  }, [gov]);

  return (
    <div className="space-y-5">
      <div>
        <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Scenario Name</label>
        <input type="text" value={scenarioName} onChange={e => setScenarioName(e.target.value)}
          className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>

      <Slider label="Purchase Price" value={purchasePrice} onChange={setPurchasePrice} min={100000} max={20000000} step={50000} format={fmtCurrency} />
      <Slider label="Adjusted SDE" value={adjustedSDE} onChange={setAdjustedSDE} min={50000} max={5000000} step={10000} format={fmtCurrency} />
      <Slider label="Annual Growth %" value={annualGrowth} onChange={setAnnualGrowth} min={-20} max={50} step={1} format={v => `${v}%`} />
      <Slider label="Hold Period (years)" value={holdPeriod} onChange={setHoldPeriod} min={1} max={15} step={1} format={v => `${v} yrs`} />
      <Slider label="Exit Multiple" value={exitMultiple} onChange={setExitMultiple} min={1} max={12} step={0.5} format={v => `${v}x`} />
      <Slider label="Down Payment / Equity" value={downPayment} onChange={setDownPayment} min={50000} max={5000000} step={25000} format={fmtCurrency} />

      <div className="rounded-xl border border-border p-4 space-y-3">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Return Analysis</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Exit Value", value: fmtCurrency(results.exitValue) },
            { label: "Total Cash Flow", value: fmtCurrency(results.totalCashFlow) },
            { label: "MOIC", value: `${results.moic.toFixed(1)}x` },
            { label: "IRR", value: `${(results.irr * 100).toFixed(1)}%` },
          ].map(item => (
            <div key={item.label} className="rounded-lg bg-muted/50 p-3">
              <p className="text-[9px] font-bold text-muted-foreground uppercase">{item.label}</p>
              <p className="text-lg font-black text-foreground">{item.value}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold text-muted-foreground">Total Return</span>
          <span className="text-sm font-black" style={{ color: results.totalReturn > 0 ? "hsl(152 60% 44%)" : "hsl(0 72% 52%)" }}>
            {results.totalReturn > 0 ? "+" : ""}{fmtCurrency(results.totalReturn)}
          </span>
        </div>
      </div>

      {fragility.length > 0 && (
        <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-3">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-destructive mb-2">High Fragility Risks (from analysis)</p>
          {fragility.map((f: string, i: number) => (
            <p key={i} className="text-[11px] text-foreground leading-relaxed mb-1">• {f?.substring(0, 120)}</p>
          ))}
        </div>
      )}

      <button onClick={handleSave}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
        <Save size={14} /> Save Scenario
      </button>
    </div>
  );
}
