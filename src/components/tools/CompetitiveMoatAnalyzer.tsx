/**
 * COMPETITIVE MOAT ANALYZER — Assess defensibility
 * Uses governed first_principles and viability_assumptions.
 */
import { useState, useMemo, useCallback } from "react";
import { Save, Shield } from "lucide-react";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { saveScenario, generateScenarioId, type ToolScenario } from "@/lib/scenarioEngine";
import { toast } from "sonner";

interface Props {
  analysisId: string;
  onScenarioSaved?: (scenario: ToolScenario) => void;
}

interface MoatDimension {
  id: string;
  label: string;
  description: string;
  score: number;
}

const MOAT_DIMENSIONS: Omit<MoatDimension, "score">[] = [
  { id: "switching", label: "Switching Costs", description: "How costly/painful is it for customers to leave?" },
  { id: "network", label: "Network Effects", description: "Does the product get better as more people use it?" },
  { id: "scale", label: "Scale Advantages", description: "Do unit costs decrease meaningfully at scale?" },
  { id: "brand", label: "Brand / Reputation", description: "Is there strong brand recognition or trust?" },
  { id: "ip", label: "IP / Proprietary Tech", description: "Do you have patents, trade secrets, or unique capabilities?" },
  { id: "regulatory", label: "Regulatory Barriers", description: "Do licenses, certifications create entry barriers?" },
];

export function CompetitiveMoatAnalyzer({ analysisId, onScenarioSaved }: Props) {
  const { businessAnalysisData } = useAnalysis();
  const gov = (businessAnalysisData as any)?.governed;

  const [scores, setScores] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    MOAT_DIMENSIONS.forEach(d => { initial[d.id] = 3; });
    return initial;
  });
  const [scenarioName, setScenarioName] = useState("Moat Analysis 1");

  const overallScore = useMemo(() => {
    const vals = Object.values(scores);
    return Math.round((vals.reduce((s, v) => s + v, 0) / (vals.length * 10)) * 100);
  }, [scores]);

  const moatStrength = overallScore >= 70 ? "Strong" : overallScore >= 40 ? "Moderate" : "Weak";

  const handleSave = useCallback(() => {
    const scenario: ToolScenario = {
      scenarioId: generateScenarioId(), analysisId, toolId: "competitive-moat-analyzer",
      scenarioName, timestamp: Date.now(),
      inputVariables: scores,
      outputResults: { overallScore, moatStrength, dimensions: MOAT_DIMENSIONS.map(d => ({ ...d, score: scores[d.id] })) },
      strategicImpact: overallScore >= 70 ? "high" : overallScore >= 40 ? "medium" : "low",
    };
    saveScenario(scenario);
    onScenarioSaved?.(scenario);
    toast.success("Moat analysis saved");
  }, [analysisId, scenarioName, scores, overallScore, moatStrength, onScenarioSaved]);

  // Pull assumptions from governed data
  const assumptions = useMemo(() => {
    if (!gov?.first_principles?.viability_assumptions) return [];
    return (gov.first_principles.viability_assumptions as any[]).map((a: any) => ({
      text: a.assumption,
      leverage: a.leverage_if_wrong,
      status: a.evidence_status,
    }));
  }, [gov]);

  const fundamentalConstraints = useMemo(() => {
    if (!gov?.first_principles?.fundamental_constraints) return [];
    return gov.first_principles.fundamental_constraints as string[];
  }, [gov]);

  const scoreColor = (s: number) =>
    s >= 7 ? "hsl(152 60% 44%)" : s >= 4 ? "hsl(38 92% 50%)" : "hsl(0 72% 52%)";

  return (
    <div className="space-y-5">
      <div>
        <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Scenario Name</label>
        <input type="text" value={scenarioName} onChange={e => setScenarioName(e.target.value)}
          className="mt-1 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>

      {/* Overall Score */}
      <div className="rounded-xl border border-border p-4 text-center">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Competitive Moat Strength</p>
        <p className="text-4xl font-black mt-2" style={{ color: scoreColor(overallScore / 10) }}>{overallScore}%</p>
        <p className="text-sm font-bold mt-1" style={{ color: scoreColor(overallScore / 10) }}>{moatStrength}</p>
      </div>

      {/* Dimension Sliders */}
      <div className="space-y-4">
        {MOAT_DIMENSIONS.map(dim => (
          <div key={dim.id} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-[11px] font-bold text-foreground">{dim.label}</label>
                <p className="text-[10px] text-muted-foreground">{dim.description}</p>
              </div>
              <span className="text-sm font-extrabold tabular-nums" style={{ color: scoreColor(scores[dim.id]) }}>
                {scores[dim.id]}/10
              </span>
            </div>
            <input type="range" min={0} max={10} step={1} value={scores[dim.id]}
              onChange={e => setScores(prev => ({ ...prev, [dim.id]: parseInt(e.target.value) }))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer bg-muted accent-primary" />
          </div>
        ))}
      </div>

      {assumptions.length > 0 && (
        <div className="rounded-lg bg-muted/30 p-3">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-2">Viability Assumptions (from analysis)</p>
          {assumptions.map((a: any, i: number) => (
            <div key={i} className="flex items-start gap-2 mb-2">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${
                a.status === "verified" ? "bg-green-500/10 text-green-600"
                : a.status === "modeled" ? "bg-yellow-500/10 text-yellow-600"
                : "bg-destructive/10 text-destructive"
              }`}>{a.status}</span>
              <p className="text-[11px] text-foreground leading-relaxed">{a.text}</p>
            </div>
          ))}
        </div>
      )}

      {fundamentalConstraints.length > 0 && (
        <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-3">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-destructive mb-2">Fundamental Constraints</p>
          {fundamentalConstraints.map((c, i) => (
            <p key={i} className="text-[11px] text-foreground leading-relaxed mb-1">• {c}</p>
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
