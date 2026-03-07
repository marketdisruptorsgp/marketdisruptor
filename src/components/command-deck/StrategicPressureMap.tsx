/**
 * Strategic Pressure Map — 3-bar structural health summary
 *
 * Shows where the business model is under pressure at a glance.
 * Calculated from constraint clusters in the strategic engine output.
 */

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import type { StrategicInsight } from "@/lib/strategicEngine";
import type { Evidence } from "@/lib/evidenceEngine";

interface PressureBar {
  label: string;
  value: number; // 0-10
  color: string;
  bgColor: string;
}

interface StrategicPressureMapProps {
  insights: StrategicInsight[];
  flatEvidence: Evidence[];
}

function classifyPressure(insights: StrategicInsight[], flatEvidence: Evidence[]): PressureBar[] {
  // Classify constraints and evidence into three pressure domains
  const demandKeywords = ["demand", "customer", "market", "growth", "acquisition", "retention", "revenue", "sales", "price", "competition", "competitive"];
  const operationalKeywords = ["operational", "process", "supply", "logistics", "delivery", "labor", "capacity", "production", "efficiency", "workflow", "bottleneck"];
  const financialKeywords = ["cash", "capital", "payment", "cost", "margin", "debt", "financing", "working capital", "collection", "cycle", "profit", "pricing"];

  const allText = [
    ...insights.map(i => `${i.label} ${i.description}`.toLowerCase()),
    ...flatEvidence.map(e => `${e.label} ${e.description || ""}`.toLowerCase()),
  ];

  function scoreDomain(keywords: string[]): number {
    let hits = 0;
    let totalImpact = 0;
    for (const text of allText) {
      for (const kw of keywords) {
        if (text.includes(kw)) {
          hits++;
          break;
        }
      }
    }
    // Also weight by constraint impact
    for (const insight of insights) {
      const text = `${insight.label} ${insight.description}`.toLowerCase();
      for (const kw of keywords) {
        if (text.includes(kw)) {
          totalImpact += insight.impact;
          break;
        }
      }
    }
    if (allText.length === 0) return 0;
    const density = hits / allText.length;
    const impactWeight = totalImpact / Math.max(1, insights.length);
    return Math.min(10, Math.round((density * 6 + impactWeight * 0.4) * 10) / 10);
  }

  const demand = scoreDomain(demandKeywords);
  const operational = scoreDomain(operationalKeywords);
  const financial = scoreDomain(financialKeywords);

  return [
    {
      label: "Demand Pressure",
      value: demand,
      color: demand >= 6 ? "hsl(var(--destructive))" : demand >= 3 ? "hsl(var(--warning))" : "hsl(var(--success))",
      bgColor: demand >= 6 ? "hsl(var(--destructive) / 0.1)" : demand >= 3 ? "hsl(var(--warning) / 0.1)" : "hsl(var(--success) / 0.1)",
    },
    {
      label: "Operational Pressure",
      value: operational,
      color: operational >= 6 ? "hsl(var(--destructive))" : operational >= 3 ? "hsl(var(--warning))" : "hsl(var(--success))",
      bgColor: operational >= 6 ? "hsl(var(--destructive) / 0.1)" : operational >= 3 ? "hsl(var(--warning) / 0.1)" : "hsl(var(--success) / 0.1)",
    },
    {
      label: "Financial Pressure",
      value: financial,
      color: financial >= 6 ? "hsl(var(--destructive))" : financial >= 3 ? "hsl(var(--warning))" : "hsl(var(--success))",
      bgColor: financial >= 6 ? "hsl(var(--destructive) / 0.1)" : financial >= 3 ? "hsl(var(--warning) / 0.1)" : "hsl(var(--success) / 0.1)",
    },
  ];
}

function pressureLabel(v: number): string {
  if (v >= 7) return "Critical";
  if (v >= 5) return "High";
  if (v >= 3) return "Moderate";
  if (v >= 1) return "Low";
  return "Minimal";
}

export const StrategicPressureMap = memo(function StrategicPressureMap({
  insights,
  flatEvidence,
}: StrategicPressureMapProps) {
  const bars = useMemo(() => classifyPressure(insights, flatEvidence), [insights, flatEvidence]);
  const maxPressure = Math.max(...bars.map(b => b.value));
  const dominantPressure = bars.find(b => b.value === maxPressure);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: "hsl(var(--card))", border: "1.5px solid hsl(var(--border))" }}
    >
      <div className="px-5 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity size={13} className="text-primary" />
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
              Structural Pressure
            </span>
          </div>
          {dominantPressure && maxPressure >= 3 && (
            <span
              className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full"
              style={{ background: dominantPressure.bgColor, color: dominantPressure.color }}
            >
              {dominantPressure.label.replace(" Pressure", "")} bottleneck
            </span>
          )}
        </div>

        {/* Pressure Bars */}
        <div className="space-y-3">
          {bars.map(bar => (
            <div key={bar.label} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-foreground">{bar.label}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-extrabold" style={{ color: bar.color }}>
                    {pressureLabel(bar.value)}
                  </span>
                  <span className="text-[10px] font-bold tabular-nums text-muted-foreground">
                    {bar.value.toFixed(1)}
                  </span>
                </div>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: bar.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, bar.value * 10)}%` }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
