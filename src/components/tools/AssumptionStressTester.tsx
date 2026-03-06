/**
 * ASSUMPTION STRESS TESTER — Challenge structural assumptions
 * Uses governed first_principles.viability_assumptions.
 */
import { useState, useMemo } from "react";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { AlertTriangle, CheckCircle2, HelpCircle } from "lucide-react";

interface Props {
  analysisId: string;
}

export function AssumptionStressTester({ analysisId }: Props) {
  const { businessAnalysisData } = useAnalysis();
  const gov = (businessAnalysisData as any)?.governed;

  const assumptions = useMemo(() => {
    const items: { text: string; status: string; leverage: number; challenged: boolean }[] = [];

    // From viability_assumptions
    if (gov?.first_principles?.viability_assumptions) {
      (gov.first_principles.viability_assumptions as any[]).forEach((a: any) => {
        items.push({
          text: a.assumption || a.label || "Unknown assumption",
          status: a.evidence_status || "speculative",
          leverage: a.leverage_if_wrong ?? 5,
          challenged: false,
        });
      });
    }

    // From root hypotheses
    if (gov?.root_hypotheses) {
      (gov.root_hypotheses as any[]).forEach((h: any) => {
        const text = h.hypothesis_statement;
        if (text && !items.some(i => i.text === text)) {
          items.push({
            text,
            status: h.evidence_mix?.verified > 0.5 ? "verified" : h.evidence_mix?.modeled > 0.5 ? "modeled" : "speculative",
            leverage: h.leverage_score || 5,
            challenged: false,
          });
        }
      });
    }

    return items.sort((a, b) => b.leverage - a.leverage);
  }, [gov]);

  const [challenged, setChallenged] = useState<Set<number>>(new Set());

  const toggleChallenge = (i: number) => {
    setChallenged(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const statusColor = (s: string) =>
    s === "verified" ? "bg-green-500/10 text-green-600"
    : s === "modeled" ? "bg-yellow-500/10 text-yellow-600"
    : "bg-destructive/10 text-destructive";

  const StatusIcon = ({ status }: { status: string }) =>
    status === "verified" ? <CheckCircle2 size={14} className="text-green-500" />
    : status === "modeled" ? <HelpCircle size={14} className="text-yellow-500" />
    : <AlertTriangle size={14} className="text-destructive" />;

  const challengedCount = challenged.size;
  const highLeverageUnchallenged = assumptions.filter((a, i) => a.leverage >= 7 && !challenged.has(i));

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border p-4 text-center">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Assumption Stress Test</p>
        <p className="text-2xl font-black text-foreground mt-2">{assumptions.length} assumptions</p>
        <p className="text-xs text-muted-foreground">{challengedCount} challenged · {assumptions.filter(a => a.status === "speculative").length} speculative</p>
      </div>

      {highLeverageUnchallenged.length > 0 && (
        <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-3">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-destructive">
            ⚠ {highLeverageUnchallenged.length} high-leverage assumptions unchallenged
          </p>
        </div>
      )}

      {assumptions.length === 0 ? (
        <div className="rounded-lg bg-muted/30 p-6 text-center">
          <AlertTriangle size={24} className="text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-bold text-foreground">No assumptions found</p>
          <p className="text-xs text-muted-foreground mt-1">Run a full analysis to extract assumptions</p>
        </div>
      ) : (
        <div className="space-y-2">
          {assumptions.map((a, i) => (
            <button key={i} onClick={() => toggleChallenge(i)}
              className={`w-full text-left rounded-lg border p-3 transition-all ${
                challenged.has(i) ? "border-primary/30 bg-primary/[0.03]" : "border-border hover:border-border/80"
              }`}>
              <div className="flex items-start gap-2.5">
                <StatusIcon status={a.status} />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-bold leading-relaxed ${challenged.has(i) ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {a.text}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${statusColor(a.status)}`}>{a.status}</span>
                    <span className="text-[9px] font-bold text-muted-foreground">Leverage: {a.leverage}/10</span>
                    {challenged.has(i) && <span className="text-[9px] font-bold text-primary">✓ Challenged</span>}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
