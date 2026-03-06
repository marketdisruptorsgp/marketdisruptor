/**
 * DEAL RISK SCANNER — Identify concentration risks and operational vulnerabilities
 * Uses governed root_hypotheses, friction_tiers, and decision_synthesis.
 */
import { useMemo } from "react";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { Shield, AlertTriangle, CheckCircle2 } from "lucide-react";

interface Props {
  analysisId: string;
}

interface RiskItem {
  category: string;
  label: string;
  severity: "critical" | "high" | "medium" | "low";
  detail: string;
}

export function DealRiskScanner({ analysisId }: Props) {
  const { businessAnalysisData } = useAnalysis();
  const gov = (businessAnalysisData as any)?.governed;

  const risks = useMemo<RiskItem[]>(() => {
    const items: RiskItem[] = [];

    // From root hypotheses
    if (gov?.root_hypotheses) {
      (gov.root_hypotheses as any[]).forEach((h: any) => {
        const severity = h.fragility_score <= 2 ? "critical" : h.fragility_score <= 4 ? "high" : h.fragility_score <= 6 ? "medium" : "low";
        items.push({
          category: h.constraint_type || "operational",
          label: h.hypothesis_statement?.substring(0, 100) || "Unknown Risk",
          severity,
          detail: h.downstream_implications?.substring(0, 150) || "",
        });
      });
    }

    // From tier 1 frictions
    if (gov?.friction_tiers?.tier_1) {
      (gov.friction_tiers.tier_1 as any[]).forEach((f: any) => {
        if (!items.some(i => i.label.includes(f.description?.substring(0, 30) || ""))) {
          items.push({
            category: "operational",
            label: f.description || "Tier 1 Friction",
            severity: "high",
            detail: f.system_impact || "",
          });
        }
      });
    }

    // From blocking uncertainties
    if (gov?.decision_synthesis?.blocking_uncertainties) {
      (gov.decision_synthesis.blocking_uncertainties as string[]).forEach(u => {
        items.push({
          category: "strategic",
          label: u,
          severity: "critical",
          detail: "Identified as blocking uncertainty in decision synthesis",
        });
      });
    }

    return items;
  }, [gov]);

  const criticalCount = risks.filter(r => r.severity === "critical").length;
  const highCount = risks.filter(r => r.severity === "high").length;

  const overallRisk = criticalCount >= 2 ? "Critical" : criticalCount >= 1 || highCount >= 3 ? "High" : highCount >= 1 ? "Moderate" : "Low";
  const riskColor = overallRisk === "Critical" ? "hsl(0 72% 52%)" : overallRisk === "High" ? "hsl(38 92% 50%)" : "hsl(152 60% 44%)";

  const severityColor = (s: string) =>
    s === "critical" ? "bg-destructive/10 text-destructive" : s === "high" ? "bg-yellow-500/10 text-yellow-600" : s === "medium" ? "bg-blue-500/10 text-blue-600" : "bg-muted text-muted-foreground";

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border p-4 text-center">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Deal Risk Assessment</p>
        <p className="text-3xl font-black mt-2" style={{ color: riskColor }}>{overallRisk}</p>
        <p className="text-xs text-muted-foreground mt-1">{risks.length} risk factors identified</p>
        <div className="flex items-center justify-center gap-3 mt-2">
          {criticalCount > 0 && <span className="text-[10px] font-bold text-destructive">{criticalCount} critical</span>}
          {highCount > 0 && <span className="text-[10px] font-bold text-yellow-600">{highCount} high</span>}
        </div>
      </div>

      {risks.length === 0 ? (
        <div className="rounded-lg bg-muted/30 p-6 text-center">
          <CheckCircle2 size={24} className="text-green-500 mx-auto mb-2" />
          <p className="text-sm font-bold text-foreground">No significant risks detected</p>
          <p className="text-xs text-muted-foreground mt-1">Run a full analysis to populate risk data</p>
        </div>
      ) : (
        <div className="space-y-2">
          {risks.map((risk, i) => (
            <div key={i} className="rounded-lg border border-border p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle size={14} className={risk.severity === "critical" ? "text-destructive" : "text-yellow-500"} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-bold text-foreground">{risk.label}</p>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${severityColor(risk.severity)}`}>
                      {risk.severity.toUpperCase()}
                    </span>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase">{risk.category}</span>
                  </div>
                  {risk.detail && <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">{risk.detail}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
