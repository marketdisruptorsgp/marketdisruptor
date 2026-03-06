/**
 * CASH FLOW QUALITY ANALYZER — Assess revenue quality and SDE accuracy
 * Pre-populated from governed root_hypotheses and decision_synthesis.
 */
import { useState, useMemo, useCallback } from "react";
import { Save, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
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

interface QualityCheck {
  label: string;
  status: "pass" | "warn" | "fail";
  detail: string;
}

export function CashFlowQualityAnalyzer({ analysisId, onScenarioSaved }: Props) {
  const { businessAnalysisData } = useAnalysis();
  const gov = (businessAnalysisData as any)?.governed;

  const [reportedRevenue, setReportedRevenue] = useState(2500000);
  const [reportedSDE, setReportedSDE] = useState(500000);
  const [ownerSalary, setOwnerSalary] = useState(150000);
  const [oneTimeExpenses, setOneTimeExpenses] = useState(50000);
  const [recurringPct, setRecurringPct] = useState(20);
  const [topCustomerConcentration, setTopCustomerConcentration] = useState(25);
  const [scenarioName, setScenarioName] = useState("Cash Flow Quality 1");

  const checks = useMemo<QualityCheck[]>(() => {
    const results: QualityCheck[] = [];
    const sdeMargin = (reportedSDE / Math.max(reportedRevenue, 1)) * 100;

    results.push({
      label: "SDE Margin",
      status: sdeMargin >= 25 ? "pass" : sdeMargin >= 15 ? "warn" : "fail",
      detail: `${sdeMargin.toFixed(1)}% — ${sdeMargin >= 25 ? "healthy" : sdeMargin >= 15 ? "below average" : "concerning"} for this business type`,
    });

    results.push({
      label: "Revenue Recurring %",
      status: recurringPct >= 50 ? "pass" : recurringPct >= 20 ? "warn" : "fail",
      detail: `${recurringPct}% recurring — ${recurringPct >= 50 ? "strong predictability" : recurringPct >= 20 ? "moderate, project-heavy" : "high volatility risk"}`,
    });

    results.push({
      label: "Customer Concentration",
      status: topCustomerConcentration <= 15 ? "pass" : topCustomerConcentration <= 30 ? "warn" : "fail",
      detail: `Top customer is ${topCustomerConcentration}% of revenue — ${topCustomerConcentration <= 15 ? "well diversified" : topCustomerConcentration <= 30 ? "moderate risk" : "high concentration risk"}`,
    });

    const addbackRatio = oneTimeExpenses / Math.max(reportedSDE, 1);
    results.push({
      label: "Addback Legitimacy",
      status: addbackRatio <= 0.1 ? "pass" : addbackRatio <= 0.25 ? "warn" : "fail",
      detail: `Addbacks are ${(addbackRatio * 100).toFixed(0)}% of SDE — ${addbackRatio <= 0.1 ? "minimal, credible" : addbackRatio <= 0.25 ? "review recommended" : "excessive, verify each line item"}`,
    });

    const ownerRatio = ownerSalary / Math.max(reportedSDE, 1);
    results.push({
      label: "Owner Dependency",
      status: ownerRatio <= 0.25 ? "pass" : ownerRatio <= 0.4 ? "warn" : "fail",
      detail: `Owner salary is ${(ownerRatio * 100).toFixed(0)}% of SDE — ${ownerRatio <= 0.25 ? "manageable replacement cost" : ownerRatio <= 0.4 ? "significant replacement cost" : "business may be owner-dependent"}`,
    });

    return results;
  }, [reportedRevenue, reportedSDE, ownerSalary, oneTimeExpenses, recurringPct, topCustomerConcentration]);

  const overallScore = useMemo(() => {
    const scores = checks.map(c => c.status === "pass" ? 3 : c.status === "warn" ? 1.5 : 0);
    return Math.round((scores.reduce((s, v) => s + v, 0) / (checks.length * 3)) * 100);
  }, [checks]);

  const handleSave = useCallback(() => {
    const scenario: ToolScenario = {
      scenarioId: generateScenarioId(), analysisId, toolId: "cash-flow-quality",
      scenarioName, timestamp: Date.now(),
      inputVariables: { reportedRevenue, reportedSDE, ownerSalary, oneTimeExpenses, recurringPct, topCustomerConcentration },
      outputResults: { overallScore, checks: checks.map(c => ({ label: c.label, status: c.status })) },
      strategicImpact: overallScore >= 70 ? "high" : overallScore >= 40 ? "medium" : "low",
    };
    saveScenario(scenario);
    onScenarioSaved?.(scenario);
    toast.success("Cash flow analysis saved");
  }, [analysisId, scenarioName, reportedRevenue, reportedSDE, ownerSalary, oneTimeExpenses, recurringPct, topCustomerConcentration, overallScore, checks, onScenarioSaved]);

  // Pull blocking uncertainties from governed data
  const blockingUncertainties = useMemo(() => {
    if (!gov?.decision_synthesis?.blocking_uncertainties) return [];
    return gov.decision_synthesis.blocking_uncertainties as string[];
  }, [gov]);

  const StatusIcon = ({ status }: { status: string }) =>
    status === "pass" ? <CheckCircle2 size={14} className="text-green-500" />
    : status === "warn" ? <AlertTriangle size={14} className="text-yellow-500" />
    : <XCircle size={14} className="text-destructive" />;

  return (
    <div className="space-y-5">
      <div>
        <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Scenario Name</label>
        <input type="text" value={scenarioName} onChange={e => setScenarioName(e.target.value)}
          className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>

      <Slider label="Reported Revenue" value={reportedRevenue} onChange={setReportedRevenue} min={100000} max={50000000} step={50000} format={fmtCurrency} />
      <Slider label="Reported SDE" value={reportedSDE} onChange={setReportedSDE} min={50000} max={5000000} step={10000} format={fmtCurrency} />
      <Slider label="Owner Salary" value={ownerSalary} onChange={setOwnerSalary} min={0} max={500000} step={5000} format={fmtCurrency} />
      <Slider label="One-Time Expenses (Addbacks)" value={oneTimeExpenses} onChange={setOneTimeExpenses} min={0} max={500000} step={5000} format={fmtCurrency} />
      <Slider label="Recurring Revenue %" value={recurringPct} onChange={setRecurringPct} min={0} max={100} step={1} format={v => `${v}%`} />
      <Slider label="Top Customer Concentration %" value={topCustomerConcentration} onChange={setTopCustomerConcentration} min={1} max={100} step={1} format={v => `${v}%`} />

      {/* Quality Score */}
      <div className="rounded-xl border border-border p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Cash Flow Quality Score</p>
          <span className="text-2xl font-black" style={{ color: overallScore >= 70 ? "hsl(152 60% 44%)" : overallScore >= 40 ? "hsl(38 92% 50%)" : "hsl(0 72% 52%)" }}>
            {overallScore}%
          </span>
        </div>
        <div className="space-y-2">
          {checks.map(check => (
            <div key={check.label} className="flex items-start gap-2.5 rounded-lg bg-muted/30 p-2.5">
              <StatusIcon status={check.status} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground">{check.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{check.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {blockingUncertainties.length > 0 && (
        <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-3">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-destructive mb-2">Blocking Uncertainties (from analysis)</p>
          {blockingUncertainties.map((u, i) => (
            <p key={i} className="text-[11px] text-foreground leading-relaxed mb-1">• {u}</p>
          ))}
        </div>
      )}

      <button onClick={handleSave}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
        <Save size={14} /> Save Analysis
      </button>
    </div>
  );
}
