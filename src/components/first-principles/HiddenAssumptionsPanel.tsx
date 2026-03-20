import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Flame, ChevronDown, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { PipelineProcessingState } from "@/components/PipelineProcessingState";
import { PitchDeckToggle } from "@/components/PitchDeckToggle";
import { AnalysisVisualLayer } from "@/components/AnalysisVisualLayer";
import { StructuralDiagnosisPanel } from "@/components/StructuralDiagnosisPanel";
import { SyntheticBadge } from "@/components/SyntheticBadge";
import {
  StepCanvas, MetricCard, VisualGrid, ExpandableDetail,
} from "@/components/analysis/AnalysisComponents";
import type { HiddenAssumption, FirstPrinciplesData } from "./types";

/* ── Assumption Fragility Chart ── */
function AssumptionFragilityChart({
  assumptions,
  showLimit,
}: {
  assumptions: HiddenAssumption[];
  showLimit: number;
}) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);

  const sorted = [...assumptions].sort((a, b) => (b.leverageScore || 0) - (a.leverageScore || 0));
  const visible = showAll ? sorted : sorted.slice(0, showLimit);
  const maxScore = Math.max(...sorted.map((a) => a.leverageScore || 0), 1);

  const REASON_LABELS: Record<string, string> = {
    tradition: "Industry tradition",
    manufacturing: "Manufacturing limit",
    cost: "Cost structure",
    physics: "Physical constraint",
    habit: "Habit / inertia",
  };

  return (
    <div className="space-y-2">
      {/* Legend */}
      <div className="flex items-center gap-4 px-1 pb-1">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: "hsl(var(--destructive))" }} />
          <span className="text-xs text-muted-foreground">High risk</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: "hsl(38 92% 50%)" }} />
          <span className="text-xs text-muted-foreground">Medium risk</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ background: "hsl(152 60% 44%)" }} />
          <span className="text-xs text-muted-foreground">Low risk</span>
        </div>
      </div>

      {visible.map((a, i) => {
        const score = a.leverageScore || 0;
        const pct = Math.round((score / maxScore) * 100);
        const isExpanded = expandedId === i;

        const barColor =
          score >= 8
            ? "hsl(var(--destructive))"
            : score >= 5
            ? "hsl(38 92% 50%)"
            : "hsl(152 60% 44%)";

        const bgColor =
          score >= 8
            ? "hsl(var(--destructive) / 0.06)"
            : score >= 5
            ? "hsl(38 92% 50% / 0.06)"
            : "hsl(152 60% 44% / 0.06)";

        const borderColor =
          score >= 8
            ? "hsl(var(--destructive) / 0.2)"
            : score >= 5
            ? "hsl(38 92% 50% / 0.2)"
            : "hsl(152 60% 44% / 0.2)";

        const UrgencyIcon =
          a.urgencySignal === "eroding"
            ? TrendingDown
            : a.urgencySignal === "emerging"
            ? TrendingUp
            : Minus;

        const urgencyColor =
          a.urgencySignal === "eroding"
            ? "hsl(var(--destructive))"
            : a.urgencySignal === "emerging"
            ? "hsl(152 60% 44%)"
            : "hsl(var(--muted-foreground))";

        const reasonLabel = REASON_LABELS[a.reason] || "Industry norm";

        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="rounded-xl overflow-hidden"
            style={{ border: `1px solid ${borderColor}`, background: bgColor }}
          >
            {/* Bar row — tap to expand */}
            <button
              onClick={() => setExpandedId(isExpanded ? null : i)}
              className="w-full text-left px-4 py-3 min-h-[44px]"
              aria-expanded={isExpanded}
            >
              <div className="flex items-start gap-3">
                {/* Rank number */}
                <span
                  className="text-xs font-black tabular-nums flex-shrink-0 mt-0.5 w-5 text-center"
                  style={{ color: barColor }}
                >
                  {i + 1}
                </span>

                <div className="flex-1 min-w-0 space-y-2">
                  {/* Assumption text */}
                  <p className="text-sm font-semibold text-foreground leading-snug">
                    {a.assumption}
                  </p>

                  {/* Bar */}
                  <div className="flex items-center gap-2">
                    <div
                      className="flex-1 h-2 rounded-full overflow-hidden"
                      style={{ background: "hsl(var(--muted))" }}
                      role="progressbar"
                      aria-valuenow={score}
                      aria-valuemin={0}
                      aria-valuemax={10}
                    >
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: barColor }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.7, ease: "easeOut", delay: i * 0.05 + 0.1 }}
                      />
                    </div>

                    {/* Urgency signal */}
                    <UrgencyIcon
                      size={12}
                      style={{ color: urgencyColor, flexShrink: 0 }}
                      aria-label={a.urgencySignal ?? "stable"}
                    />
                  </div>

                  {/* Reason tag + badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        background: `${barColor.replace(/\)$/, " / 0.1)")}`,
                        color: barColor,
                      }}
                    >
                      {reasonLabel}
                    </span>
                    {a.isChallengeable && (
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          background: "hsl(var(--primary) / 0.1)",
                          color: "hsl(var(--primary))",
                        }}
                      >
                        Can be challenged
                      </span>
                    )}
                    {a.urgencySignal === "eroding" && (
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          background: "hsl(var(--destructive) / 0.1)",
                          color: "hsl(var(--destructive))",
                        }}
                      >
                        Breaking down now
                      </span>
                    )}
                  </div>
                </div>

                {/* Expand chevron */}
                <motion.span
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex-shrink-0 mt-1"
                >
                  <ChevronDown size={14} className="text-muted-foreground" />
                </motion.span>
              </div>
            </button>

            {/* Expanded detail */}
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  key="detail"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div
                    className="px-4 pb-4 pt-1 space-y-3 border-t"
                    style={{ borderColor }}
                  >
                    {a.currentAnswer && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {a.currentAnswer}
                      </p>
                    )}

                    {a.impactScenario && (
                      <div
                        className="rounded-lg p-3"
                        style={{
                          background: "hsl(152 60% 44% / 0.08)",
                          border: "1px solid hsl(152 60% 44% / 0.2)",
                        }}
                      >
                        <p className="text-xs font-bold text-foreground mb-1">
                          If you challenge this assumption:
                        </p>
                        <p className="text-sm text-foreground/80 leading-relaxed">
                          {a.impactScenario}
                        </p>
                      </div>
                    )}

                    {a.challengeIdea && (
                      <div
                        className="rounded-lg p-3"
                        style={{
                          background: "hsl(var(--primary) / 0.06)",
                          border: "1px solid hsl(var(--primary) / 0.15)",
                        }}
                      >
                        <p className="text-xs font-bold text-foreground mb-1">
                          How to challenge it:
                        </p>
                        <p className="text-sm text-foreground/80 leading-relaxed">
                          {a.challengeIdea}
                        </p>
                      </div>
                    )}

                    {a.competitiveBlindSpot && (
                      <div
                        className="rounded-lg p-3"
                        style={{
                          background: "hsl(38 92% 50% / 0.06)",
                          border: "1px solid hsl(38 92% 50% / 0.2)",
                        }}
                      >
                        <p className="text-xs font-bold text-foreground mb-1">
                          Who's exposed:
                        </p>
                        <p className="text-sm text-foreground/80 leading-relaxed">
                          {a.competitiveBlindSpot}
                        </p>
                      </div>
                    )}

                    {a.urgencyReason && (
                      <p className="text-xs text-muted-foreground leading-relaxed italic">
                        {a.urgencyReason}
                      </p>
                    )}

                    <div className="flex justify-end">
                      <PitchDeckToggle contentKey={`assumptions-${i}`} label="Add to Pitch" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}

      {/* Show more / less */}
      {sorted.length > showLimit && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full py-3 rounded-xl text-xs font-bold transition-all min-h-[44px]"
          style={{
            background: "hsl(var(--muted))",
            color: "hsl(var(--primary))",
            border: "1.5px solid hsl(var(--primary) / 0.2)",
          }}
        >
          {showAll
            ? "Show fewer"
            : `Show ${sorted.length - showLimit} more assumptions`}
        </button>
      )}
    </div>
  );
}

interface HiddenAssumptionsPanelProps {
  data: FirstPrinciplesData;
  governedData: Record<string, unknown> | null;
  onRerun: () => void;
  loading: boolean;
  rerunSuggestions: string;
  onRerunSuggestionsChange: (v: string) => void;
}

export function HiddenAssumptionsPanel({ data, governedData, onRerun, loading, rerunSuggestions, onRerunSuggestionsChange }: HiddenAssumptionsPanelProps) {
  const assumptions = data.hiddenAssumptions || [];
  const challengeableCount = assumptions.filter(a => a.isChallengeable).length;
  const avgLeverage = assumptions.length > 0
    ? (assumptions.reduce((s, a) => s + (a.leverageScore || 0), 0) / assumptions.length).toFixed(1)
    : "0";
  const SHOW_LIMIT = 10;

  return (
    <div className="space-y-4" data-fp-steps>
      {/* Header + re-run */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-foreground uppercase tracking-widest">Hidden Assumptions & Leverage Analysis</p>
        <button onClick={onRerun} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
          style={{ background: "hsl(var(--secondary))", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))" }}>
          {loading ? <span className="animate-spin">↻</span> : "↻"} Re-run
        </button>
      </div>

      {/* Steer AI */}
      <ExpandableDetail label="Refine your analysis — add direction, then Re-run" icon={Brain}>
        <textarea
          value={rerunSuggestions}
          onChange={(e) => onRerunSuggestionsChange(e.target.value)}
          placeholder="e.g. Focus on sustainability, explore modular design, target commercial users…"
          className="w-full rounded px-3 py-2.5 text-sm leading-relaxed resize-none transition-colors focus:outline-none mb-2"
          rows={2}
          style={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))" }}
        />
      </ExpandableDetail>

      {/* Structural Diagnosis */}
      <StructuralDiagnosisPanel constraintMap={governedData?.constraint_map as any} />

      {assumptions.length === 0 ? (
        <StepCanvas>
          <PipelineProcessingState stepKey="disrupt" title="Mapping hidden assumptions and leverage points" />
        </StepCanvas>
      ) : (
        <StepCanvas>
          <AnalysisVisualLayer analysis={data as unknown as Record<string, unknown>} step="firstPrinciples" governedOverride={governedData}>
            {/* Highest-Leverage Move Banner */}
            {(() => {
              const topMove = assumptions
                .filter(a => a.isChallengeable && (a.leverageScore || 0) >= 7)
                .sort((a, b) => (b.leverageScore || 0) - (a.leverageScore || 0))[0];
              if (!topMove) return null;
              const erodingCount = assumptions.filter(a => a.urgencySignal === "eroding").length;
              return (
                <div className="rounded-xl p-4 space-y-2" style={{ background: "hsl(var(--foreground))", border: "none" }}>
                  <div className="flex items-center gap-2">
                    <Flame size={14} style={{ color: "hsl(var(--background))" }} />
                    <p className="text-xs font-extrabold uppercase tracking-widest" style={{ color: "hsl(var(--background) / 0.7)" }}>Highest-Leverage Move</p>
                    {erodingCount > 0 && (
                      <span className="ml-auto px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: "hsl(0 70% 50% / 0.2)", color: "hsl(0 70% 65%)" }}>
                        {erodingCount} eroding now
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold leading-snug" style={{ color: "hsl(var(--background))" }}>
                    Challenge: "{topMove.assumption}"
                  </p>
                  {topMove.impactScenario && (
                    <p className="text-xs leading-relaxed" style={{ color: "hsl(var(--background) / 0.65)" }}>
                      {topMove.impactScenario}
                    </p>
                  )}
                </div>
              );
            })()}

            {/* Metric strip */}
            <VisualGrid columns={3}>
              <MetricCard label="Total Assumptions" value={String(assumptions.length)} />
              <MetricCard label="Challengeable" value={String(challengeableCount)} accentColor="hsl(var(--primary))" />
              <MetricCard label="Avg Leverage" value={Number(avgLeverage) >= 7 ? "High" : Number(avgLeverage) >= 4 ? "Moderate" : "Low"} accentColor="hsl(38 92% 42%)" />
            </VisualGrid>

            <AssumptionFragilityChart assumptions={assumptions} showLimit={SHOW_LIMIT} />
          </AnalysisVisualLayer>
        </StepCanvas>
      )}
    </div>
  );
}
