/**
 * REVENUE MODEL SIMULATOR — Compare revenue architectures
 * Pre-populated from governed business analysis data.
 */
import { useState, useMemo, useCallback } from "react";
import { Save } from "lucide-react";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { fmtCurrency } from "@/lib/financialModelingEngine";
import { saveScenario, generateScenarioId, type ToolScenario } from "@/lib/scenarioEngine";
import { toast } from "sonner";

interface Props {
  analysisId: string;
  onScenarioSaved?: (scenario: ToolScenario) => void;
}

type RevenueModel = "project_based" | "subscription" | "marketplace" | "licensing" | "hybrid";

const MODEL_LABELS: Record<RevenueModel, string> = {
  project_based: "Project-Based",
  subscription: "Subscription / Recurring",
  marketplace: "Marketplace / Platform",
  licensing: "Licensing / IP",
  hybrid: "Hybrid Model",
};

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

export function RevenueModelSimulator({ analysisId, onScenarioSaved }: Props) {
  const { businessAnalysisData } = useAnalysis();
  const gov = (businessAnalysisData as any)?.governed;

  // Infer current model from governed data
  const inferredModel = useMemo(() => {
    const text = JSON.stringify(gov || {}).toLowerCase();
    if (text.includes("subscription") || text.includes("recurring")) return "subscription";
    if (text.includes("marketplace") || text.includes("platform")) return "marketplace";
    if (text.includes("licensing") || text.includes("ip")) return "licensing";
    return "project_based";
  }, [gov]);

  const [currentModel, setCurrentModel] = useState<RevenueModel>(inferredModel);
  const [targetModel, setTargetModel] = useState<RevenueModel>("subscription");
  const [annualRevenue, setAnnualRevenue] = useState(2000000);
  const [customers, setCustomers] = useState(50);
  const [grossMargin, setGrossMargin] = useState(35);
  const [conversionRate, setConversionRate] = useState(15);
  const [scenarioName, setScenarioName] = useState("Revenue Model 1");

  const results = useMemo(() => {
    const currentRecurring = currentModel === "subscription" ? annualRevenue * 0.85 : annualRevenue * 0.15;
    const targetRecurring = targetModel === "subscription" ? annualRevenue * 0.7 + (customers * (annualRevenue / customers) * 0.3)
      : targetModel === "marketplace" ? annualRevenue * 0.2 * customers * 0.4
      : targetModel === "licensing" ? annualRevenue * 0.4
      : annualRevenue * 0.5;

    const currentValMultiple = currentModel === "project_based" ? 2.5 : currentModel === "subscription" ? 6 : 4;
    const targetValMultiple = targetModel === "subscription" ? 6 : targetModel === "marketplace" ? 8 : targetModel === "licensing" ? 5 : 3.5;

    const currentVal = annualRevenue * (grossMargin / 100) * currentValMultiple;
    const targetVal = targetRecurring * (grossMargin / 100) * targetValMultiple;
    const uplift = targetVal - currentVal;

    return {
      currentRecurring,
      targetRecurring,
      currentValMultiple,
      targetValMultiple,
      currentVal,
      targetVal,
      uplift,
      revenuePerCustomer: annualRevenue / Math.max(customers, 1),
      transitionRisk: targetModel === currentModel ? "none" : conversionRate < 20 ? "high" : conversionRate < 50 ? "medium" : "low",
    };
  }, [currentModel, targetModel, annualRevenue, customers, grossMargin, conversionRate]);

  const handleSave = useCallback(() => {
    const scenario: ToolScenario = {
      scenarioId: generateScenarioId(), analysisId, toolId: "revenue-model-simulator",
      scenarioName, timestamp: Date.now(),
      inputVariables: { currentModel, targetModel, annualRevenue, customers, grossMargin, conversionRate },
      outputResults: results,
      strategicImpact: results.uplift > 1000000 ? "high" : results.uplift > 0 ? "medium" : "low",
    };
    saveScenario(scenario);
    onScenarioSaved?.(scenario);
    toast.success("Revenue model scenario saved");
  }, [analysisId, scenarioName, currentModel, targetModel, annualRevenue, customers, grossMargin, conversionRate, results, onScenarioSaved]);

  // Extract real constraints from governed data
  const constraints = useMemo(() => {
    if (!gov?.constraint_map?.causal_chains) return [];
    return (gov.constraint_map.causal_chains as any[]).map((c: any) => c.structural_constraint || c.label).filter(Boolean);
  }, [gov]);

  return (
    <div className="space-y-5">
      <div>
        <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Scenario Name</label>
        <input type="text" value={scenarioName} onChange={e => setScenarioName(e.target.value)}
          className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Current Model</label>
          <select value={currentModel} onChange={e => setCurrentModel(e.target.value as RevenueModel)}
            className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground">
            {Object.entries(MODEL_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Target Model</label>
          <select value={targetModel} onChange={e => setTargetModel(e.target.value as RevenueModel)}
            className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground">
            {Object.entries(MODEL_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>

      <Slider label="Annual Revenue" value={annualRevenue} onChange={setAnnualRevenue} min={100000} max={50000000} step={50000} format={fmtCurrency} />
      <Slider label="Customer Count" value={customers} onChange={setCustomers} min={1} max={10000} step={1} format={v => v.toLocaleString()} />
      <Slider label="Gross Margin %" value={grossMargin} onChange={setGrossMargin} min={5} max={90} step={1} format={v => `${v}%`} />
      <Slider label="Conversion Rate %" value={conversionRate} onChange={setConversionRate} min={1} max={100} step={1} format={v => `${v}%`} />

      {/* Results */}
      <div className="rounded-xl border border-border p-4 space-y-3">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Comparison</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-[9px] font-bold text-muted-foreground uppercase">Current Valuation</p>
            <p className="text-lg font-black text-foreground">{fmtCurrency(results.currentVal)}</p>
            <p className="text-[10px] text-muted-foreground">{results.currentValMultiple}x multiple</p>
          </div>
          <div className="rounded-lg p-3" style={{ background: results.uplift > 0 ? "hsl(152 60% 44% / 0.08)" : "hsl(0 72% 52% / 0.08)" }}>
            <p className="text-[9px] font-bold text-muted-foreground uppercase">Target Valuation</p>
            <p className="text-lg font-black" style={{ color: results.uplift > 0 ? "hsl(152 60% 44%)" : "hsl(0 72% 52%)" }}>{fmtCurrency(results.targetVal)}</p>
            <p className="text-[10px] text-muted-foreground">{results.targetValMultiple}x multiple</p>
          </div>
        </div>
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold text-muted-foreground">Valuation Uplift</span>
          <span className="text-sm font-black" style={{ color: results.uplift > 0 ? "hsl(152 60% 44%)" : "hsl(0 72% 52%)" }}>
            {results.uplift > 0 ? "+" : ""}{fmtCurrency(results.uplift)}
          </span>
        </div>
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-bold text-muted-foreground">Transition Risk</span>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
            results.transitionRisk === "high" ? "bg-destructive/10 text-destructive"
            : results.transitionRisk === "medium" ? "bg-yellow-500/10 text-yellow-600"
            : "bg-green-500/10 text-green-600"
          }`}>{results.transitionRisk.toUpperCase()}</span>
        </div>
      </div>

      {constraints.length > 0 && (
        <div className="rounded-lg bg-muted/30 p-3">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-2">Structural Constraints (from analysis)</p>
          {constraints.map((c: string, i: number) => (
            <p key={i} className="text-[11px] text-foreground leading-relaxed">• {c}</p>
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
