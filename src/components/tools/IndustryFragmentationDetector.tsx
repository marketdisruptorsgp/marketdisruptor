/**
 * INDUSTRY FRAGMENTATION DETECTOR — Identify rollup opportunities
 * Uses governed first_principles and constraint_map.
 */
import { useMemo } from "react";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { Layers, TrendingUp, AlertTriangle } from "lucide-react";

interface Props {
  analysisId: string;
}

interface FragmentationSignal {
  label: string;
  detected: boolean;
  detail: string;
  opportunity: string;
}

export function IndustryFragmentationDetector({ analysisId }: Props) {
  const { businessAnalysisData } = useAnalysis();
  const gov = (businessAnalysisData as any)?.governed;

  const signals = useMemo<FragmentationSignal[]>(() => {
    const text = JSON.stringify(gov || {}).toLowerCase();

    return [
      {
        label: "Many Small Players",
        detected: text.includes("independent") || text.includes("small business") || text.includes("fragmented") || text.includes("local"),
        detail: "Market appears to have many independent operators without dominant players",
        opportunity: "Roll-up acquisition strategy to consolidate market share",
      },
      {
        label: "Low Technology Adoption",
        detected: text.includes("manual") || text.includes("legacy") || text.includes("outdated") || text.includes("erp"),
        detail: "Incumbents operating with manual or legacy systems",
        opportunity: "Technology-enabled acquisition creates instant competitive advantage",
      },
      {
        label: "Relationship-Based Sales",
        detected: text.includes("relationship") || text.includes("word of mouth") || text.includes("referral") || text.includes("bidding"),
        detail: "Customer acquisition relies on personal relationships rather than scalable channels",
        opportunity: "Systematized sales and marketing can capture share from relationship-dependent competitors",
      },
      {
        label: "High Fixed Cost Base",
        detected: text.includes("fixed cost") || text.includes("overhead") || text.includes("union") || text.includes("facility"),
        detail: "High fixed costs create economies of scale opportunity through consolidation",
        opportunity: "Shared infrastructure across acquired companies reduces per-unit costs",
      },
      {
        label: "Aging Ownership",
        detected: text.includes("retire") || text.includes("succession") || text.includes("owner") || text.includes("aging"),
        detail: "Owner demographics suggest upcoming transition wave",
        opportunity: "Pipeline of willing sellers as Baby Boomer owners seek exits",
      },
      {
        label: "Regulatory Complexity",
        detected: text.includes("regulation") || text.includes("compliance") || text.includes("license") || text.includes("permit"),
        detail: "Regulatory barriers create natural moats for compliant operators",
        opportunity: "Compliance infrastructure scales across acquisitions, creating regulatory moat",
      },
    ];
  }, [gov]);

  const detectedCount = signals.filter(s => s.detected).length;
  const fragmentationScore = Math.round((detectedCount / signals.length) * 100);
  const rollupViability = fragmentationScore >= 70 ? "High" : fragmentationScore >= 40 ? "Moderate" : "Low";
  const viabilityColor = fragmentationScore >= 70 ? "hsl(152 60% 44%)" : fragmentationScore >= 40 ? "hsl(38 92% 50%)" : "hsl(0 72% 52%)";

  const bindingConstraint = gov?.constraint_map?.binding_constraint_id;
  const nextConstraint = gov?.constraint_map?.next_binding_constraint;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border p-4 text-center">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Rollup Viability Score</p>
        <p className="text-4xl font-black mt-2" style={{ color: viabilityColor }}>{fragmentationScore}%</p>
        <p className="text-sm font-bold mt-1" style={{ color: viabilityColor }}>{rollupViability} Fragmentation</p>
        <p className="text-xs text-muted-foreground mt-1">{detectedCount}/{signals.length} fragmentation signals detected</p>
      </div>

      {bindingConstraint && (
        <div className="rounded-lg bg-muted/30 p-3">
          <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-1">Binding Constraint</p>
          <p className="text-xs font-bold text-foreground">{bindingConstraint}</p>
          {nextConstraint && <p className="text-[10px] text-muted-foreground mt-1">Next: {nextConstraint}</p>}
        </div>
      )}

      <div className="space-y-2">
        {signals.map(signal => (
          <div key={signal.label} className={`rounded-lg border p-3 ${signal.detected ? "border-primary/20 bg-primary/[0.03]" : "border-border"}`}>
            <div className="flex items-start gap-2.5">
              {signal.detected
                ? <TrendingUp size={14} className="text-primary flex-shrink-0 mt-0.5" />
                : <Layers size={14} className="text-muted-foreground flex-shrink-0 mt-0.5" />}
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-bold ${signal.detected ? "text-foreground" : "text-muted-foreground"}`}>{signal.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{signal.detail}</p>
                {signal.detected && (
                  <p className="text-[10px] font-semibold text-primary mt-1">→ {signal.opportunity}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
