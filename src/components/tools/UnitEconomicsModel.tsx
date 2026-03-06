/**
 * UNIT ECONOMICS MODEL — CAC, LTV, payback period, contribution margin
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

export function UnitEconomicsModel({ analysisId, onScenarioSaved }: Props) {
  const { businessAnalysisData } = useAnalysis();
  const gov = (businessAnalysisData as any)?.governed;

  const [avgProjectRevenue, setAvgProjectRevenue] = useState(40000);
  const [projectsPerYear, setProjectsPerYear] = useState(30);
  const [directCostPct, setDirectCostPct] = useState(65);
  const [salesCostPerProject, setSalesCostPerProject] = useState(5000);
  const [customerLifespan, setCustomerLifespan] = useState(3);
  const [repeatRate, setRepeatRate] = useState(30);
  const [scenarioName, setScenarioName] = useState("Unit Economics 1");

  const results = useMemo(() => {
    const grossProfit = avgProjectRevenue * (1 - directCostPct / 100);
    const contributionMargin = grossProfit - salesCostPerProject;
    const contributionMarginPct = (contributionMargin / Math.max(avgProjectRevenue, 1)) * 100;
    const ltv = contributionMargin * customerLifespan * (1 + repeatRate / 100);
    const cac = salesCostPerProject;
    const ltvCacRatio = ltv / Math.max(cac, 1);
    const paybackMonths = cac / Math.max(contributionMargin / 12, 1);
    const annualRevenue = avgProjectRevenue * projectsPerYear;
    const annualGrossProfit = grossProfit * projectsPerYear;

    return {
      grossProfit, contributionMargin, contributionMarginPct,
      ltv, cac, ltvCacRatio, paybackMonths,
      annualRevenue, annualGrossProfit,
    };
  }, [avgProjectRevenue, projectsPerYear, directCostPct, salesCostPerProject, customerLifespan, repeatRate]);

  const handleSave = useCallback(() => {
    const scenario: ToolScenario = {
      scenarioId: generateScenarioId(), analysisId, toolId: "unit-economics-model",
      scenarioName, timestamp: Date.now(),
      inputVariables: { avgProjectRevenue, projectsPerYear, directCostPct, salesCostPerProject, customerLifespan, repeatRate },
      outputResults: results,
      strategicImpact: results.ltvCacRatio >= 3 ? "high" : results.ltvCacRatio >= 1.5 ? "medium" : "low",
    };
    saveScenario(scenario);
    onScenarioSaved?.(scenario);
    toast.success("Unit economics saved");
  }, [analysisId, scenarioName, avgProjectRevenue, projectsPerYear, directCostPct, salesCostPerProject, customerLifespan, repeatRate, results, onScenarioSaved]);

  // Pull friction sources from governed data
  const frictionSources = useMemo(() => {
    if (!gov?.root_hypotheses) return [];
    return (gov.root_hypotheses as any[]).flatMap((h: any) =>
      (h.friction_sources || []).map((fs: string) => fs)
    );
  }, [gov]);

  const metricColor = (good: boolean) => good ? "hsl(152 60% 44%)" : "hsl(0 72% 52%)";

  return (
    <div className="space-y-5">
      <div>
        <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Scenario Name</label>
        <input type="text" value={scenarioName} onChange={e => setScenarioName(e.target.value)}
          className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>

      <Slider label="Avg Project Revenue" value={avgProjectRevenue} onChange={setAvgProjectRevenue} min={1000} max={500000} step={1000} format={fmtCurrency} />
      <Slider label="Projects Per Year" value={projectsPerYear} onChange={setProjectsPerYear} min={1} max={500} step={1} format={v => v.toString()} />
      <Slider label="Direct Cost %" value={directCostPct} onChange={setDirectCostPct} min={10} max={95} step={1} format={v => `${v}%`} />
      <Slider label="Sales Cost / Project" value={salesCostPerProject} onChange={setSalesCostPerProject} min={0} max={50000} step={500} format={fmtCurrency} />
      <Slider label="Customer Lifespan (yrs)" value={customerLifespan} onChange={setCustomerLifespan} min={1} max={20} step={1} format={v => `${v} yrs`} />
      <Slider label="Repeat Rate %" value={repeatRate} onChange={setRepeatRate} min={0} max={100} step={1} format={v => `${v}%`} />

      <div className="rounded-xl border border-border p-4 space-y-3">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Unit Economics</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "LTV", value: fmtCurrency(results.ltv), good: results.ltv > results.cac * 3 },
            { label: "CAC", value: fmtCurrency(results.cac), good: true },
            { label: "LTV:CAC", value: `${results.ltvCacRatio.toFixed(1)}x`, good: results.ltvCacRatio >= 3 },
            { label: "Payback", value: `${results.paybackMonths.toFixed(0)} mo`, good: results.paybackMonths <= 12 },
            { label: "Contribution Margin", value: `${results.contributionMarginPct.toFixed(0)}%`, good: results.contributionMarginPct >= 30 },
            { label: "Annual Gross Profit", value: fmtCurrency(results.annualGrossProfit), good: results.annualGrossProfit > 0 },
          ].map(item => (
            <div key={item.label} className="rounded-lg bg-muted/50 p-3">
              <p className="text-[9px] font-bold text-muted-foreground uppercase">{item.label}</p>
              <p className="text-lg font-black" style={{ color: metricColor(item.good) }}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {frictionSources.length > 0 && (
        <div className="rounded-lg bg-muted/30 p-3">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-2">Friction Sources (from analysis)</p>
          {frictionSources.slice(0, 6).map((f: string, i: number) => (
            <p key={i} className="text-[11px] text-foreground leading-relaxed">• {f}</p>
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
