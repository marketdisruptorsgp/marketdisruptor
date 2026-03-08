/**
 * EVIDENCE EXPLORER — Drilldown panel for metric investigation.
 *
 * Opens as a sheet/drawer when a MetricCard is clicked.
 * Shows structured evidence items traced to pipeline steps.
 * Supports tier, type, mode, and source engine filtering.
 */

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight, Layers, Search, Lightbulb, AlertTriangle,
  Crosshair, Zap, Shield, Filter, Building2, ChevronRight,
  Globe, Radio, Cpu, BarChart3,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import type {
  MetricDomain, MetricEvidence, Evidence,
  EvidenceTier, EvidenceType, EvidenceMode, EvidenceSourceEngine,
} from "@/lib/evidenceEngine";

const DOMAIN_META: Record<MetricDomain, { title: string; icon: React.ElementType; color: string }> = {
  opportunity: { title: "Opportunity Explorer", icon: Lightbulb, color: "hsl(152 60% 44%)" },
  friction:    { title: "Friction Explorer",    icon: AlertTriangle, color: "hsl(0 72% 52%)" },
  constraint:  { title: "Constraint Explorer",  icon: Crosshair, color: "hsl(0 72% 52%)" },
  leverage:    { title: "Leverage Explorer",     icon: Zap, color: "hsl(38 92% 50%)" },
  risk:        { title: "Risk Explorer",         icon: Shield, color: "hsl(0 72% 52%)" },
};

const TIER_CHIPS: { key: EvidenceTier; label: string; color: string }[] = [
  { key: "structural",   label: "Structural",    color: "hsl(0 72% 52%)" },
  { key: "system",       label: "System",        color: "hsl(38 92% 50%)" },
  { key: "optimization", label: "Optimization",  color: "hsl(229 89% 63%)" },
];

const TYPE_CHIPS: { key: EvidenceType; label: string }[] = [
  { key: "assumption",  label: "Assumption" },
  { key: "signal",      label: "Signal" },
  { key: "constraint",  label: "Constraint" },
  { key: "friction",    label: "Friction" },
  { key: "opportunity", label: "Opportunity" },
  { key: "risk",        label: "Risk" },
  { key: "leverage",    label: "Leverage" },
  { key: "competitor",  label: "Competitor" },
];

const STEP_LABELS: Record<string, string> = {
  report: "Report", disrupt: "Disrupt", redesign: "Redesign",
  stress_test: "Stress Test", pitch: "Pitch",
};

const MODE_LABELS: Record<EvidenceMode, string> = {
  product: "Product", service: "Service", business_model: "Business Model", object_reinvention: "Object Reinvention",
};

const ENGINE_LABELS: Record<string, string> = {
  pipeline: "Pipeline", innovation: "Innovation Engine",
  signal_detection: "Signal Detection", financial_model: "Financial Model",
  competitor_scout: "Competitor Scout", system_intelligence: "System Intelligence",
};

function ConfidenceBadge({ score }: { score: number }) {
  const color = score >= 0.7 ? "hsl(152 60% 44%)" : score >= 0.5 ? "hsl(38 92% 50%)" : "hsl(var(--muted-foreground))";
  const label = score >= 0.7 ? "High" : score >= 0.5 ? "Med" : "Low";
  return (
    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
      style={{ background: `${color}12`, color }}>
      {label} {(score * 100).toFixed(0)}%
    </span>
  );
}

function EvidenceItemContent({ item, tierChip, metaColor }: { item: Evidence; tierChip?: { color: string; label: string }; metaColor: string }) {
  return (
    <div className="flex items-start gap-2">
      <div className="w-1 h-full min-h-[20px] rounded-full flex-shrink-0 mt-0.5"
        style={{ background: tierChip?.color || "hsl(var(--muted-foreground))" }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground leading-snug">{item.label}</p>
        {item.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
        )}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: `${tierChip?.color || "gray"}12`, color: tierChip?.color }}>
            {tierChip?.label || item.tier}
          </span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
            {item.type}
          </span>
          {item.confidenceScore != null && <ConfidenceBadge score={item.confidenceScore} />}
          {item.impact != null && (
            <span className="text-[9px] font-bold tabular-nums" style={{ color: metaColor }}>
              Impact: {item.impact}/10
            </span>
          )}
          {item.mode && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
              {MODE_LABELS[item.mode]}
            </span>
          )}
          {item.sourceEngine && item.sourceEngine !== "pipeline" && (
            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: "hsl(199 89% 48% / 0.08)", color: "hsl(199 89% 48%)" }}>
              <Cpu size={7} />
              {ENGINE_LABELS[item.sourceEngine] || item.sourceEngine}
            </span>
          )}
          {item.sourceCount != null && item.sourceCount > 1 && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: "hsl(152 60% 44% / 0.08)", color: "hsl(152 60% 44%)" }}>
              {item.sourceCount}× corroborated
            </span>
          )}
          {item.relatedSignals && item.relatedSignals.length > 0 && (
            <span className="text-[9px] font-bold text-muted-foreground">
              {item.relatedSignals.length} related
            </span>
          )}
          {item.competitorReferences && item.competitorReferences.length > 0 && (
            <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: "hsl(262 83% 58% / 0.12)", color: "hsl(262 83% 58%)" }}>
              <Building2 size={8} />
              {item.competitorReferences.map(c => c.name).join(", ")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

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

  // Filters
  const [tierFilter, setTierFilter] = useState<EvidenceTier | null>(null);
  const [typeFilters, setTypeFilters] = useState<Set<EvidenceType>>(new Set());
  const [modeFilter, setModeFilter] = useState<EvidenceMode | null>(null);
  const [stepFilter, setStepFilter] = useState<string | null>(null);

  const toggleType = (t: EvidenceType) => {
    setTypeFilters(prev => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t); else next.add(t);
      return next;
    });
  };

  // Filtered + sorted items
  const filteredItems = useMemo(() => {
    let items = data.items;
    if (tierFilter) items = items.filter(i => i.tier === tierFilter);
    if (typeFilters.size > 0) items = items.filter(i => typeFilters.has(i.type));
    if (modeFilter) items = items.filter(i => i.mode === modeFilter);
    if (stepFilter) items = items.filter(i => i.pipelineStep === stepFilter);
    return [...items].sort((a, b) => (b.confidenceScore ?? 0) - (a.confidenceScore ?? 0));
  }, [data.items, tierFilter, typeFilters, modeFilter, stepFilter]);

  // Group by pipeline step
  const grouped = useMemo(() => {
    const groups: Record<string, Evidence[]> = {};
    filteredItems.forEach(item => {
      const key = item.pipelineStep;
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return groups;
  }, [filteredItems]);

  // Tier distribution
  const tierCounts = useMemo(() => {
    const counts: Record<EvidenceTier, number> = { structural: 0, system: 0, optimization: 0 };
    data.items.forEach(item => { counts[item.tier]++; });
    return counts;
  }, [data.items]);

  // Step distribution
  const stepCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    data.items.forEach(item => {
      counts[item.pipelineStep] = (counts[item.pipelineStep] || 0) + 1;
    });
    return counts;
  }, [data.items]);

  const hasActiveFilters = tierFilter !== null || typeFilters.size > 0 || modeFilter !== null || stepFilter !== null;

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
                  {filteredItems.length}{hasActiveFilters ? ` of ${data.evidenceCount}` : ""} evidence items
                </p>
              </div>
            </div>
          </SheetHeader>

          {/* Tier distribution bar */}
          <div className="flex items-center gap-3 mt-3">
            {TIER_CHIPS.filter(t => tierCounts[t.key] > 0).map(t => (
              <button
                key={t.key}
                onClick={() => setTierFilter(tierFilter === t.key ? null : t.key)}
                className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full transition-colors min-h-[28px]"
                style={{
                  background: tierFilter === t.key ? `${t.color}20` : "transparent",
                  color: tierFilter === t.key ? t.color : "hsl(var(--muted-foreground))",
                  border: tierFilter === t.key ? `1.5px solid ${t.color}40` : "1px solid hsl(var(--border))",
                }}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: t.color }} />
                <span>{tierCounts[t.key]}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>

          {/* Pipeline step filter */}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <Layers size={10} className="text-muted-foreground mr-0.5" />
            {Object.entries(stepCounts).map(([step, count]) => (
              <button
                key={step}
                onClick={() => setStepFilter(stepFilter === step ? null : step)}
                className="text-[9px] font-bold px-2 py-0.5 rounded-full transition-colors min-h-[24px]"
                style={{
                  background: stepFilter === step ? "hsl(var(--primary) / 0.15)" : "hsl(var(--muted))",
                  color: stepFilter === step ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                }}
              >
                {STEP_LABELS[step] || step} ({count})
              </button>
            ))}
          </div>

          {/* Type filter chips */}
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <Filter size={10} className="text-muted-foreground mr-0.5" />
            {TYPE_CHIPS.map(t => {
              const active = typeFilters.has(t.key);
              const hasItems = data.items.some(i => i.type === t.key);
              if (!hasItems) return null;
              return (
                <button
                  key={t.key}
                  onClick={() => toggleType(t.key)}
                  className="text-[9px] font-bold px-2 py-0.5 rounded-full transition-colors min-h-[24px]"
                  style={{
                    background: active ? "hsl(var(--primary) / 0.15)" : "hsl(var(--muted))",
                    color: active ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                  }}
                >
                  {t.label}
                </button>
              );
            })}
            {hasActiveFilters && (
              <button
                onClick={() => { setTierFilter(null); setTypeFilters(new Set()); setModeFilter(null); setStepFilter(null); }}
                className="text-[9px] font-bold text-muted-foreground underline ml-1 min-h-[24px]"
              >
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Evidence items grouped by step */}
        <div className="px-5 py-4 space-y-5">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <Search size={24} className="mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-bold text-foreground">
                {hasActiveFilters ? "No evidence matches filters" : "No evidence collected yet"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {hasActiveFilters ? "Try adjusting your filter criteria." : "Run pipeline steps to generate evidence."}
              </p>
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
                    const tierChip = TIER_CHIPS.find(t => t.key === item.tier);
                    const isLowConf = (item.confidenceScore ?? 1) < 0.4;
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03, duration: 0.2 }}
                        className="rounded-lg border border-border bg-background hover:bg-muted/30 transition-colors"
                      >
                        {isLowConf ? (
                          <details className="group">
                            <summary className="p-3 cursor-pointer list-none flex items-center gap-2 text-muted-foreground min-h-[44px]">
                              <div className="w-1 h-4 rounded-full flex-shrink-0" style={{ background: tierChip?.color || "hsl(var(--muted-foreground))" }} />
                              <span className="text-xs font-medium opacity-60 flex-1 truncate">{item.label}</span>
                              <ConfidenceBadge score={item.confidenceScore ?? 0} />
                              <ChevronRight size={12} className="group-open:rotate-90 transition-transform" />
                            </summary>
                            <div className="px-3 pb-3">
                              <EvidenceItemContent item={item} tierChip={tierChip} metaColor={meta.color} />
                            </div>
                          </details>
                        ) : (
                          <div className="p-3">
                            <EvidenceItemContent item={item} tierChip={tierChip} metaColor={meta.color} />
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))
          )}

          {/* Traceability note */}
          {filteredItems.length > 0 && (
            <div className="rounded-lg bg-muted/50 px-4 py-3 mt-4">
              <p className="text-[10px] font-bold text-muted-foreground leading-relaxed">
                <ArrowRight size={10} className="inline mr-1" />
                Every insight traces to evidence. Pipeline: Signal → Engine → Evidence → Tier → Graph → Metric.
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
