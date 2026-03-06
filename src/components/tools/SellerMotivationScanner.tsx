/**
 * SELLER MOTIVATION SCANNER — Detect seller readiness signals
 * Uses governed root_hypotheses and decision_synthesis.
 */
import { useMemo } from "react";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { Users, AlertTriangle, CheckCircle2, MinusCircle } from "lucide-react";

interface Props {
  analysisId: string;
}

interface MotivationSignal {
  label: string;
  detected: boolean;
  detail: string;
  urgency: "high" | "medium" | "low";
}

export function SellerMotivationScanner({ analysisId }: Props) {
  const { businessAnalysisData } = useAnalysis();
  const gov = (businessAnalysisData as any)?.governed;

  const signals = useMemo<MotivationSignal[]>(() => {
    const text = JSON.stringify(gov || {}).toLowerCase();
    const results: MotivationSignal[] = [];

    results.push({
      label: "Owner Dependency",
      detected: text.includes("owner") || text.includes("key person") || text.includes("key man"),
      detail: text.includes("owner") ? "Business shows owner-dependent operations — common motivation for selling" : "No strong owner dependency signals detected",
      urgency: text.includes("owner") ? "high" : "low",
    });

    results.push({
      label: "Aging Infrastructure",
      detected: text.includes("legacy") || text.includes("outdated") || text.includes("aging"),
      detail: text.includes("legacy") ? "Legacy systems or aging infrastructure suggest capital needs — potential seller trigger" : "No aging infrastructure signals",
      urgency: text.includes("legacy") ? "medium" : "low",
    });

    results.push({
      label: "Succession Gap",
      detected: text.includes("succession") || text.includes("retire") || text.includes("next generation"),
      detail: text.includes("succession") ? "Succession planning gaps indicate potential readiness to sell" : "No succession signals detected",
      urgency: text.includes("succession") || text.includes("retire") ? "high" : "low",
    });

    results.push({
      label: "Growth Plateau",
      detected: text.includes("stagnant") || text.includes("plateau") || text.includes("flat revenue") || text.includes("scale"),
      detail: text.includes("scale") ? "Scaling constraints may motivate owner to seek acquisition partner" : "No growth plateau signals",
      urgency: "medium",
    });

    results.push({
      label: "Cash Flow Pressure",
      detected: text.includes("cash flow") || text.includes("working capital") || text.includes("cash conversion"),
      detail: text.includes("cash") ? "Cash flow pressures detected — can accelerate seller timeline" : "No immediate cash flow pressure signals",
      urgency: text.includes("cash") ? "high" : "low",
    });

    results.push({
      label: "Market Window",
      detected: text.includes("consolidation") || text.includes("fragmented") || text.includes("industry shift"),
      detail: text.includes("consolidation") || text.includes("fragmented") ? "Industry dynamics may create urgency window" : "No market timing signals",
      urgency: "medium",
    });

    return results;
  }, [gov]);

  const detectedCount = signals.filter(s => s.detected).length;
  const overallReadiness = detectedCount >= 4 ? "High" : detectedCount >= 2 ? "Moderate" : "Low";
  const readinessColor = detectedCount >= 4 ? "hsl(152 60% 44%)" : detectedCount >= 2 ? "hsl(38 92% 50%)" : "hsl(0 72% 52%)";

  // Pull decision synthesis
  const decisionGrade = gov?.decision_synthesis?.decision_grade;
  const confidence = gov?.decision_synthesis?.confidence_score;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border p-4 text-center">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Seller Readiness Assessment</p>
        <p className="text-3xl font-black mt-2" style={{ color: readinessColor }}>{overallReadiness}</p>
        <p className="text-xs text-muted-foreground mt-1">{detectedCount}/{signals.length} motivation signals detected</p>
      </div>

      {decisionGrade && (
        <div className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
          <span className="text-[11px] font-bold text-muted-foreground">Decision Grade</span>
          <span className={`text-sm font-black ${decisionGrade === "blocked" ? "text-destructive" : "text-foreground"}`}>
            {decisionGrade.toUpperCase()} ({confidence || 0}%)
          </span>
        </div>
      )}

      <div className="space-y-2">
        {signals.map(signal => (
          <div key={signal.label} className="flex items-start gap-3 rounded-lg border border-border p-3">
            {signal.detected
              ? <CheckCircle2 size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
              : <MinusCircle size={16} className="text-muted-foreground flex-shrink-0 mt-0.5" />}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-foreground">{signal.label}</p>
                {signal.detected && (
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                    signal.urgency === "high" ? "bg-destructive/10 text-destructive"
                    : signal.urgency === "medium" ? "bg-yellow-500/10 text-yellow-600"
                    : "bg-muted text-muted-foreground"
                  }`}>{signal.urgency}</span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">{signal.detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
