/**
 * TransformationPaths — Strategic Playbook Comparison Panel
 *
 * Shows the #1 recommended playbook as "Recommended Strategic Move"
 * with Impact/Difficulty/Time Horizon visible immediately.
 * Additional paths are expandable below.
 */

import { memo, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Route, Sparkles, ChevronDown, ChevronUp, TrendingUp, Clock, Gauge } from "lucide-react";
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

function difficultyLabel(d: number): { label: string; desc: string; color: string } {
  if (d >= 7) return { label: "High", desc: "Requires significant structural change", color: "hsl(var(--destructive))" };
  if (d >= 4) return { label: "Moderate", desc: "Requires process standardization", color: "hsl(var(--warning))" };
  return { label: "Low", desc: "Incremental changes to existing operations", color: "hsl(var(--success))" };
}

function timeHorizon(d: number): string {
  if (d >= 7) return "18–36 months";
  if (d >= 4) return "6–18 months";
  return "3–6 months";
}

function impactLabel(pb: TransformationPlaybook): { label: string; desc: string } {
  const avg = (pb.impact.revenueExpansion + pb.impact.marginImprovement) / 2;
  if (avg >= 7) return { label: "High", desc: "Unlocks scalable revenue and margin expansion" };
  if (avg >= 4) return { label: "Moderate", desc: "Meaningful improvement to current economics" };
  return { label: "Low", desc: "Incremental gains within existing model" };
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

  if (playbooks.length === 0) {
    return (
      <div
        className="rounded-xl px-5 py-6 text-center"
        style={{ background: "hsl(var(--card))", border: "1.5px solid hsl(var(--border))" }}
      >
        <Route size={20} className="mx-auto text-muted-foreground mb-2" />
        <p className="text-sm font-bold text-muted-foreground">
          Strategic moves will emerge once more structural patterns are detected.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Complete additional analysis to generate actionable transformation paths.
        </p>
      </div>
    );
  }

  const topPlaybook = playbooks[0];
  const alternates = playbooks.slice(1);
  const impact = impactLabel(topPlaybook);
  const difficulty = difficultyLabel(topPlaybook.impact.executionDifficulty);
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
        <div className="px-5 pt-4 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles size={14} className="text-primary" />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
              Recommended Strategic Move
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-black text-primary">{topPlaybook.impact.leverageScore}</span>
            <span className="text-[9px] font-bold text-muted-foreground uppercase">Leverage</span>
          </div>
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

        {/* ═══ Impact / Difficulty / Time Horizon — always visible ═══ */}
        <div className="px-5 pb-4">
          <div className="grid grid-cols-3 gap-3">
            {/* Impact */}
            <div className="rounded-lg p-3" style={{ background: "hsl(var(--success) / 0.06)", border: "1px solid hsl(var(--success) / 0.12)" }}>
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp size={11} style={{ color: "hsl(var(--success))" }} />
                <span className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: "hsl(var(--success))" }}>
                  Impact
                </span>
              </div>
              <p className="text-sm font-black text-foreground">{impact.label}</p>
              <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">{impact.desc}</p>
            </div>

            {/* Difficulty */}
            <div className="rounded-lg p-3" style={{ background: `${difficulty.color}08`, border: `1px solid ${difficulty.color}18` }}>
              <div className="flex items-center gap-1.5 mb-1">
                <Gauge size={11} style={{ color: difficulty.color }} />
                <span className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: difficulty.color }}>
                  Difficulty
                </span>
              </div>
              <p className="text-sm font-black text-foreground">{difficulty.label}</p>
              <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">{difficulty.desc}</p>
            </div>

            {/* Time Horizon */}
            <div className="rounded-lg p-3" style={{ background: "hsl(var(--muted) / 0.4)", border: "1px solid hsl(var(--border))" }}>
              <div className="flex items-center gap-1.5 mb-1">
                <Clock size={11} className="text-muted-foreground" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  Time Horizon
                </span>
              </div>
              <p className="text-sm font-black text-foreground">{horizon}</p>
              <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">Estimated execution timeline</p>
            </div>
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
