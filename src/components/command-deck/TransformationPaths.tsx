/**
 * TransformationPaths — Strategic Playbook Comparison Panel
 *
 * Shows the #1 recommended playbook as "Recommended Strategic Move"
 * with Strategy Profile (qualitative, no numeric scores).
 */

import { memo, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Route, Sparkles, ChevronDown, ChevronUp, TrendingUp, Clock, Gauge, Shield, DollarSign, Zap } from "lucide-react";
import type { Evidence, EvidenceMode } from "@/lib/evidenceEngine";
import type { StrategicInsight, StrategicNarrative } from "@/lib/strategicEngine";
import { generatePlaybooks, type TransformationPlaybook } from "@/lib/playbookEngine";
import { PlaybookCard } from "./PlaybookCard";

interface TransformationPathsProps {
  evidence: Evidence[];
  insights: StrategicInsight[];
  narrative: StrategicNarrative | null;
  mode: "product" | "service" | "business";
}

function qualitativeLabel(score: number): { label: string; color: string } {
  if (score >= 7) return { label: "Strong", color: "hsl(var(--success))" };
  if (score >= 4) return { label: "Moderate", color: "hsl(var(--warning))" };
  return { label: "Limited", color: "hsl(var(--muted-foreground))" };
}

function difficultyLabel(d: number): { label: string; color: string } {
  if (d >= 7) return { label: "High", color: "hsl(var(--destructive))" };
  if (d >= 4) return { label: "Moderate", color: "hsl(var(--warning))" };
  return { label: "Low", color: "hsl(var(--success))" };
}

function timeHorizon(d: number): string {
  if (d >= 7) return "18–36 months";
  if (d >= 4) return "6–18 months";
  return "3–6 months";
}

function speedLabel(d: number): { label: string; color: string } {
  if (d <= 3) return { label: "Fast", color: "hsl(var(--success))" };
  if (d <= 6) return { label: "Medium", color: "hsl(var(--warning))" };
  return { label: "Slow", color: "hsl(var(--muted-foreground))" };
}

export const TransformationPaths = memo(function TransformationPaths({
  evidence,
  insights,
  narrative,
  mode,
}: TransformationPathsProps) {
  const evidenceMode: EvidenceMode = mode === "business" ? "business_model" : mode;
  const [showAlternatives, setShowAlternatives] = useState(false);

  const playbooks = useMemo(
    () => generatePlaybooks(evidence, insights, narrative, evidenceMode),
    [evidence, insights, narrative, evidenceMode],
  );

  if (playbooks.length === 0) return null;

  const topPlaybook = playbooks[0];
  const alternates = playbooks.slice(1);
  const revenue = qualitativeLabel(topPlaybook.impact.revenueExpansion);
  const cost = qualitativeLabel(topPlaybook.impact.marginImprovement);
  const moat = qualitativeLabel(topPlaybook.impact.capitalEfficiency);
  const difficulty = difficultyLabel(topPlaybook.impact.executionDifficulty);
  const speed = speedLabel(topPlaybook.impact.executionDifficulty);
  const horizon = timeHorizon(topPlaybook.impact.executionDifficulty);

  return (
    <div className="space-y-4">
      {/* ═══ RECOMMENDED STRATEGIC MOVE — Hero Card ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-xl overflow-hidden"
        style={{ background: "hsl(var(--card))", border: "2px solid hsl(var(--primary) / 0.3)" }}
      >
        {/* Header */}
        <div className="px-5 pt-4 pb-2 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles size={14} className="text-primary" />
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
            Recommended Strategic Move
          </span>
        </div>

        {/* Title */}
        <div className="px-5 pb-3">
          <h3 className="text-lg sm:text-xl font-black text-foreground leading-tight">
            {topPlaybook.title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed mt-1.5">
            {topPlaybook.strategicThesis}
          </p>
        </div>

        {/* ═══ STRATEGY PROFILE — qualitative attributes ═══ */}
        <div className="px-5 pb-4">
          <div className="flex items-center gap-1.5 mb-3">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
              Strategy Profile
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { label: "Revenue Expansion", val: revenue, Icon: TrendingUp },
              { label: "Cost Advantage", val: cost, Icon: DollarSign },
              { label: "Market Control", val: moat, Icon: Shield },
              { label: "Execution Complexity", val: difficulty, Icon: Gauge },
              { label: "Speed to Impact", val: speed, Icon: Zap },
            ].map(attr => (
              <div
                key={attr.label}
                className="rounded-lg p-2.5 text-center"
                style={{ background: `${attr.val.color}08`, border: `1px solid ${attr.val.color}18` }}
              >
                <attr.Icon size={12} className="mx-auto mb-1" style={{ color: attr.val.color }} />
                <p className="text-xs font-black" style={{ color: attr.val.color }}>
                  {attr.val.label}
                </p>
                <p className="text-[9px] font-bold text-muted-foreground mt-0.5 leading-tight">
                  {attr.label}
                </p>
              </div>
            ))}
          </div>

          {/* Time Horizon */}
          <div className="mt-3 flex items-center gap-2">
            <Clock size={11} className="text-muted-foreground" />
            <span className="text-[11px] font-bold text-muted-foreground">
              Estimated timeline: {horizon}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Full recommended playbook detail (expand) */}
      <PlaybookCard playbook={topPlaybook} rank={0} />

      {/* ═══ ALTERNATIVE PATHS — expandable ═══ */}
      {alternates.length > 0 && (
        <div>
          <button
            onClick={() => setShowAlternatives(!showAlternatives)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-colors hover:bg-muted/50"
            style={{ background: "hsl(var(--muted) / 0.3)", border: "1px solid hsl(var(--border))" }}
          >
            <span className="text-muted-foreground">
              {showAlternatives ? "Hide" : "View"} {alternates.length} alternative strategic path{alternates.length > 1 ? "s" : ""}
            </span>
            {showAlternatives ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
          </button>

          <AnimatePresence>
            {showAlternatives && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden space-y-4 mt-4"
              >
                {alternates.map((pb, idx) => (
                  <PlaybookCard key={pb.id} playbook={pb} rank={idx + 1} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
});
