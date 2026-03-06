/**
 * EVIDENCE EXPLORER — Drilldown panel for metric investigation.
 *
 * Opens as a sheet/drawer when a MetricCard is clicked.
 * Shows structured evidence items traced to pipeline steps.
 */

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, Layers, Search, Lightbulb, AlertTriangle, Crosshair, Zap, Shield } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type { MetricDomain, MetricEvidence, Evidence, EvidenceTier } from "@/lib/evidenceEngine";

const DOMAIN_META: Record<MetricDomain, { title: string; icon: React.ElementType; color: string }> = {
  opportunity: { title: "Opportunity Explorer", icon: Lightbulb, color: "hsl(152 60% 44%)" },
  friction:    { title: "Friction Explorer",    icon: AlertTriangle, color: "hsl(0 72% 52%)" },
  constraint:  { title: "Constraint Explorer",  icon: Crosshair, color: "hsl(0 72% 52%)" },
  leverage:    { title: "Leverage Explorer",     icon: Zap, color: "hsl(38 92% 50%)" },
  risk:        { title: "Risk Explorer",         icon: Shield, color: "hsl(0 72% 52%)" },
};

const TIER_LABELS: Record<EvidenceTier, { label: string; color: string }> = {
  structural:   { label: "Structural", color: "hsl(0 72% 52%)" },
  system:       { label: "System",     color: "hsl(38 92% 50%)" },
  optimization: { label: "Optimization", color: "hsl(229 89% 63%)" },
};

const STEP_LABELS: Record<string, string> = {
  report: "Report", disrupt: "Disrupt", redesign: "Redesign",
  stress_test: "Stress Test", pitch: "Pitch",
};

interface EvidenceExplorerProps {
  open: boolean;
  onClose: () => void;
  domain: MetricDomain | null;
  evidence: Record<MetricDomain, MetricEvidence>;
}

export function EvidenceExplorer({ open, onClose, domain, evidence }: EvidenceExplorerProps) {
  const safeDomain = domain || "opportunity";
  const data = evidence[safeDomain];
  const meta = DOMAIN_META[safeDomain];
  const Icon = meta.icon;

  // Group by pipeline step
  const grouped = useMemo(() => {
    const groups: Record<string, Evidence[]> = {};
    data.items.forEach(item => {
      const key = item.pipelineStep;
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return groups;
  }, [data.items]);

  // Tier distribution
  const tierCounts = useMemo(() => {
    const counts: Record<EvidenceTier, number> = { structural: 0, system: 0, optimization: 0 };
    data.items.forEach(item => { counts[item.tier]++; });
    return counts;
  }, [data.items]);

  if (!domain) return null;

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto p-0">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-card border-b border-border px-5 py-4">
          <SheetHeader className="p-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${meta.color}15` }}>
                <Icon size={18} style={{ color: meta.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <SheetTitle className="text-base font-extrabold text-foreground">{meta.title}</SheetTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {data.evidenceCount} evidence items from pipeline analysis
                </p>
              </div>
            </div>
          </SheetHeader>

          {/* Tier distribution bar */}
          <div className="flex items-center gap-3 mt-4">
            {(Object.entries(tierCounts) as [EvidenceTier, number][]).filter(([, c]) => c > 0).map(([tier, count]) => {
              const t = TIER_LABELS[tier];
              return (
                <span key={tier} className="inline-flex items-center gap-1.5 text-[10px] font-bold">
                  <span className="w-2 h-2 rounded-full" style={{ background: t.color }} />
                  <span style={{ color: t.color }}>{count}</span>
                  <span className="text-muted-foreground">{t.label}</span>
                </span>
              );
            })}
          </div>
        </div>

        {/* Evidence items grouped by step */}
        <div className="px-5 py-4 space-y-5">
          {data.items.length === 0 ? (
            <div className="text-center py-12">
              <Search size={24} className="mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-bold text-foreground">No evidence collected yet</p>
              <p className="text-xs text-muted-foreground mt-1">Run pipeline steps to generate evidence.</p>
            </div>
          ) : (
            Object.entries(grouped).map(([step, items]) => (
              <div key={step}>
                <div className="flex items-center gap-2 mb-2">
                  <Layers size={12} className="text-muted-foreground" />
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                    {STEP_LABELS[step] || step}
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground">({items.length})</span>
                </div>
                <div className="space-y-1.5">
                  {items.map((item, i) => {
                    const tierInfo = TIER_LABELS[item.tier];
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03, duration: 0.2 }}
                        className="rounded-lg border border-border p-3 bg-background hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-start gap-2">
                          <div className="w-1 h-full min-h-[20px] rounded-full flex-shrink-0 mt-0.5"
                            style={{ background: tierInfo.color }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground leading-snug">{item.label}</p>
                            {item.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                                style={{ background: `${tierInfo.color}12`, color: tierInfo.color }}>
                                {tierInfo.label}
                              </span>
                              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                                {item.type}
                              </span>
                              {item.impact != null && (
                                <span className="text-[9px] font-bold tabular-nums" style={{ color: meta.color }}>
                                  Impact: {item.impact}/10
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))
          )}

          {/* Traceability note */}
          {data.items.length > 0 && (
            <div className="rounded-lg bg-muted/50 px-4 py-3 mt-4">
              <p className="text-[10px] font-bold text-muted-foreground leading-relaxed">
                <ArrowRight size={10} className="inline mr-1" />
                Every insight is derived from evidence. Trace: Metric → Signal → Pipeline Step → Source Insight.
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
