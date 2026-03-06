/**
 * TAM / SAM / SOM CALCULATOR — Market sizing tool
 */

import { useState, useMemo, useCallback } from "react";
import { Save, BarChart3 } from "lucide-react";
import { fmtCurrency } from "@/lib/financialModelingEngine";
import { saveScenario, generateScenarioId, type ToolScenario } from "@/lib/scenarioEngine";
import { toast } from "sonner";

interface Props {
  analysisId: string;
  onScenarioSaved?: (scenario: ToolScenario) => void;
}

export function TAMCalculator({ analysisId, onScenarioSaved }: Props) {
  const [totalCustomers, setTotalCustomers] = useState(1000000);
  const [avgRevPerCustomer, setAvgRevPerCustomer] = useState(500);
  const [samPct, setSamPct] = useState(20);
  const [somPct, setSomPct] = useState(5);
  const [scenarioName, setScenarioName] = useState("Market Sizing 1");

  const results = useMemo(() => {
    const tam = totalCustomers * avgRevPerCustomer;
    const sam = tam * (samPct / 100);
    const som = sam * (somPct / 100);
    return { tam, sam, som };
  }, [totalCustomers, avgRevPerCustomer, samPct, somPct]);

  const handleSave = useCallback(() => {
    const scenario: ToolScenario = {
      scenarioId: generateScenarioId(),
      analysisId,
      toolId: "tam-calculator",
      scenarioName,
      inputVariables: { totalCustomers, avgRevPerCustomer, samPct, somPct },
      outputResults: { tam: results.tam, sam: results.sam, som: results.som },
      strategicImpact: results.som >= 50000000 ? "high" : results.som >= 10000000 ? "medium" : "low",
      timestamp: Date.now(),
    };
    saveScenario(scenario);
    onScenarioSaved?.(scenario);
    toast.success("Market sizing saved");
  }, [analysisId, scenarioName, totalCustomers, avgRevPerCustomer, samPct, somPct, results, onScenarioSaved]);

  const maxVal = Math.max(results.tam, 1);

  return (
    <div className="space-y-5">
      <div>
        <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Scenario Name</label>
        <input type="text" value={scenarioName} onChange={e => setScenarioName(e.target.value)}
          className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>

      <Slider label="Total Addressable Customers" value={totalCustomers} onChange={setTotalCustomers} min={1000} max={100000000} step={10000} format={v => v.toLocaleString()} />
      <Slider label="Avg Revenue / Customer" value={avgRevPerCustomer} onChange={setAvgRevPerCustomer} min={10} max={50000} step={10} format={v => fmtCurrency(v)} />
      <Slider label="Serviceable Addressable %" value={samPct} onChange={setSamPct} min={1} max={100} step={1} format={v => `${v}%`} />
      <Slider label="Serviceable Obtainable %" value={somPct} onChange={setSomPct} min={1} max={100} step={1} format={v => `${v}%`} />

      {/* Visual */}
      <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Market Sizing</p>

        {[
          { label: "TAM", value: results.tam, color: "hsl(229 89% 63%)" },
          { label: "SAM", value: results.sam, color: "hsl(38 92% 50%)" },
          { label: "SOM", value: results.som, color: "hsl(152 60% 44%)" },
        ].map(m => (
          <div key={m.label} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-foreground">{m.label}</span>
              <span className="text-sm font-extrabold tabular-nums" style={{ color: m.color }}>{fmtCurrency(m.value)}</span>
            </div>
            <div className="h-5 rounded-md overflow-hidden bg-muted">
              <div className="h-full rounded-md transition-all duration-500" style={{ width: `${Math.max((m.value / maxVal) * 100, 2)}%`, background: m.color }} />
            </div>
          </div>
        ))}
      </div>

      <button onClick={handleSave}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all hover:scale-[1.01] active:scale-[0.99] bg-primary text-primary-foreground">
        <Save size={15} />
        Save Scenario → Feed Intelligence
      </button>
    </div>
  );
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
