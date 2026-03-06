/**
 * DSCR CALCULATOR — Debt Service Coverage Ratio across financing structures
 */
import { useState, useMemo, useCallback } from "react";
import { Save, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
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

export function DSCRCalculator({ analysisId, onScenarioSaved }: Props) {
  const [netOperatingIncome, setNetOperatingIncome] = useState(500000);
  const [sbaDebt, setSbaDebt] = useState(150000);
  const [sellerNote, setSellerNote] = useState(50000);
  const [otherDebt, setOtherDebt] = useState(0);
  const [scenarioName, setScenarioName] = useState("DSCR Scenario 1");

  const results = useMemo(() => {
    const totalDebtService = sbaDebt + sellerNote + otherDebt;
    const dscr = totalDebtService > 0 ? netOperatingIncome / totalDebtService : 99;
    const status = dscr >= 1.5 ? "healthy" : dscr >= 1.25 ? "viable" : dscr >= 1.0 ? "tight" : "not_viable";
    const cashAfterDebt = netOperatingIncome - totalDebtService;

    return { dscr, status, totalDebtService, cashAfterDebt };
  }, [netOperatingIncome, sbaDebt, sellerNote, otherDebt]);

  const handleSave = useCallback(() => {
    const scenario: ToolScenario = {
      scenarioId: generateScenarioId(), analysisId, toolId: "dscr-calculator",
      scenarioName, timestamp: Date.now(),
      inputVariables: { netOperatingIncome, sbaDebt, sellerNote, otherDebt },
      outputResults: results,
      strategicImpact: results.dscr >= 1.5 ? "high" : results.dscr >= 1.25 ? "medium" : "low",
    };
    saveScenario(scenario);
    onScenarioSaved?.(scenario);
    toast.success("DSCR scenario saved");
  }, [analysisId, scenarioName, netOperatingIncome, sbaDebt, sellerNote, otherDebt, results, onScenarioSaved]);

  const dscrColor = results.status === "healthy" ? "hsl(152 60% 44%)"
    : results.status === "viable" ? "hsl(38 92% 50%)"
    : "hsl(0 72% 52%)";

  const StatusIcon = results.status === "healthy" ? CheckCircle2
    : results.status === "viable" ? AlertTriangle : XCircle;

  return (
    <div className="space-y-5">
      <div>
        <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Scenario Name</label>
        <input type="text" value={scenarioName} onChange={e => setScenarioName(e.target.value)}
          className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>

      <Slider label="Net Operating Income (NOI)" value={netOperatingIncome} onChange={setNetOperatingIncome} min={50000} max={5000000} step={10000} format={fmtCurrency} />
      <Slider label="SBA Annual Debt Service" value={sbaDebt} onChange={setSbaDebt} min={0} max={1000000} step={5000} format={fmtCurrency} />
      <Slider label="Seller Note Annual Payment" value={sellerNote} onChange={setSellerNote} min={0} max={500000} step={5000} format={fmtCurrency} />
      <Slider label="Other Annual Debt" value={otherDebt} onChange={setOtherDebt} min={0} max={500000} step={5000} format={fmtCurrency} />

      <div className="rounded-xl border border-border p-4 text-center">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Debt Service Coverage Ratio</p>
        <div className="flex items-center justify-center gap-2 mt-2">
          <StatusIcon size={24} style={{ color: dscrColor }} />
          <p className="text-4xl font-black" style={{ color: dscrColor }}>{results.dscr.toFixed(2)}x</p>
        </div>
        <p className="text-sm font-bold mt-1" style={{ color: dscrColor }}>
          {results.status === "healthy" ? "Healthy" : results.status === "viable" ? "Viable" : results.status === "tight" ? "Tight" : "Not Viable"}
        </p>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-[9px] font-bold text-muted-foreground uppercase">Total Debt Service</p>
            <p className="text-lg font-black text-foreground">{fmtCurrency(results.totalDebtService)}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-[9px] font-bold text-muted-foreground uppercase">Cash After Debt</p>
            <p className="text-lg font-black" style={{ color: results.cashAfterDebt > 0 ? "hsl(152 60% 44%)" : "hsl(0 72% 52%)" }}>
              {fmtCurrency(results.cashAfterDebt)}
            </p>
          </div>
        </div>
      </div>

      <button onClick={handleSave}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
        <Save size={14} /> Save Scenario
      </button>
    </div>
  );
}
