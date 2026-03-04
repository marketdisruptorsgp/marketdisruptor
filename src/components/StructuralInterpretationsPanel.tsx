/**
 * STRUCTURAL INTERPRETATIONS PANEL
 * Displays competing root hypotheses from governed constraint mapping.
 * Allows user to select a branch for downstream recomputation.
 */

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Zap, Shield, Target, ChevronRight, GitBranch, CheckCircle2, BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import BranchGravityMap from "@/components/BranchGravityMap";
import { HypothesisInterrogation } from "@/components/HypothesisInterrogation";
import type { StrategicRankingResult, StrategicHypothesis } from "@/lib/strategicOS";

interface StructuralInterpretationsPanelProps {
  ranking: StrategicRankingResult;
  activeBranchId: string | null;
  onSelectBranch: (hypothesisId: string) => void;
  loading?: boolean;
  analysisData?: any;
  title?: string;
  category?: string;
  onApplyRevision?: (revision: any) => void;
}

const CONSTRAINT_ICONS: Record<string, typeof Zap> = {
  cost: BarChart3,
  time: Target,
  adoption: Zap,
  scale: GitBranch,
  reliability: Shield,
  risk: AlertTriangle,
  physical: Target,
  structural: GitBranch,
  economic: BarChart3,
};

const CONSTRAINT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  cost: { bg: "bg-amber-500/10", border: "border-amber-500/40", text: "text-amber-600" },
  time: { bg: "bg-blue-500/10", border: "border-blue-500/40", text: "text-blue-600" },
  adoption: { bg: "bg-violet-500/10", border: "border-violet-500/40", text: "text-violet-600" },
  scale: { bg: "bg-emerald-500/10", border: "border-emerald-500/40", text: "text-emerald-600" },
  reliability: { bg: "bg-cyan-500/10", border: "border-cyan-500/40", text: "text-cyan-600" },
  risk: { bg: "bg-red-500/10", border: "border-red-500/40", text: "text-red-600" },
  physical: { bg: "bg-orange-500/10", border: "border-orange-500/40", text: "text-orange-600" },
  structural: { bg: "bg-indigo-500/10", border: "border-indigo-500/40", text: "text-indigo-600" },
  economic: { bg: "bg-yellow-500/10", border: "border-yellow-500/40", text: "text-yellow-600" },
};

function FragilityIndicator({ score }: { score: number }) {
  const color = score <= 3 ? "text-green-500" : score <= 6 ? "text-amber-500" : "text-red-500";
  const bg = score <= 3 ? "bg-green-500/10" : score <= 6 ? "bg-amber-500/10" : "bg-red-500/10";
  const label = score <= 3 ? "Resilient" : score <= 6 ? "Moderate" : "Fragile";
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${bg} ${color}`}>
      {label} {score}/10
    </span>
  );
}

function HypothesisCard({
  hypothesis,
  isActive,
  isPrimary,
  rank,
  onSelect,
  loading,
}: {
  hypothesis: StrategicHypothesis;
  isActive: boolean;
  isPrimary: boolean;
  rank: number;
  onSelect: () => void;
  loading?: boolean;
}) {
  const Icon = CONSTRAINT_ICONS[hypothesis.constraint_type] || Target;
  const colors = CONSTRAINT_COLORS[hypothesis.constraint_type] || CONSTRAINT_COLORS.structural;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
    >
      <Card
        className={`p-3 cursor-pointer transition-all ${
          isActive
            ? "border-[2.5px] border-primary bg-primary/5 shadow-lg shadow-primary/10"
            : "border-[2px] border-border hover:border-primary/50 hover:shadow-md"
        }`}
        onClick={onSelect}
      >
        <div className="flex items-start gap-2.5">
          {/* Rank + Icon column */}
          <div className="flex flex-col items-center gap-1">
            <span className={`text-[10px] font-black ${isActive ? "text-primary" : "text-muted-foreground"}`}>
              #{rank}
            </span>
            <div className={`p-1.5 rounded-md border ${isActive ? "bg-primary/15 border-primary/30" : `${colors.bg} ${colors.border}`}`}>
              <Icon className={`h-4 w-4 ${isActive ? "text-primary" : colors.text}`} />
            </div>
          </div>

          <div className="flex-1 min-w-0 space-y-1.5">
            {/* Header row */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge
                variant={isActive ? "default" : "outline"}
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0 h-5 ${
                  !isActive ? `${colors.border} ${colors.text}` : ""
                }`}
              >
                {hypothesis.constraint_type}
              </Badge>
              {isPrimary && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 font-bold">
                  Primary
                </Badge>
              )}
              {isActive && (
                <Badge className="text-[10px] bg-primary/20 text-primary border-primary/30 px-1.5 py-0 h-5 font-bold">
                  <CheckCircle2 className="h-3 w-3 mr-0.5" />
                  Active
                </Badge>
              )}
            </div>

            {/* Hypothesis statement */}
            <p className="text-sm font-semibold text-foreground leading-snug">
              {hypothesis.hypothesis_statement}
            </p>

            {/* Scores row */}
            <div className="flex items-center gap-3 flex-wrap">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex items-center gap-1 text-[10px] font-semibold bg-accent/60 px-1.5 py-0.5 rounded text-foreground/80">
                      <Zap className="h-3 w-3 text-primary" />
                      Leverage {hypothesis.leverage_score}/10
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>How much relief this constraint provides if resolved</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <span className="text-[10px] font-semibold bg-accent/60 px-1.5 py-0.5 rounded text-foreground/80">
                Confidence {hypothesis.confidence}%
              </span>

              <FragilityIndicator score={hypothesis.fragility_score} />
            </div>

            {/* Evidence mix bar */}
            <div className="space-y-0.5">
              <div className="flex gap-0.5 h-2.5 rounded overflow-hidden bg-muted border border-border">
                {hypothesis.evidence_mix.verified > 0 && (
                  <div
                    className="bg-green-500 rounded-l"
                    style={{ width: `${hypothesis.evidence_mix.verified * 100}%` }}
                  />
                )}
                {hypothesis.evidence_mix.modeled > 0 && (
                  <div
                    className="bg-amber-500"
                    style={{ width: `${hypothesis.evidence_mix.modeled * 100}%` }}
                  />
                )}
                {hypothesis.evidence_mix.assumption > 0 && (
                  <div
                    className="bg-red-400 rounded-r"
                    style={{ width: `${hypothesis.evidence_mix.assumption * 100}%` }}
                  />
                )}
              </div>
              <div className="flex gap-2.5 text-[10px] text-muted-foreground font-medium">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm bg-green-500 inline-block border border-green-600/30" />
                  Verified {Math.round(hypothesis.evidence_mix.verified * 100)}%
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm bg-amber-500 inline-block border border-amber-600/30" />
                  Modeled {Math.round(hypothesis.evidence_mix.modeled * 100)}%
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm bg-red-400 inline-block border border-red-500/30" />
                  Assumed {Math.round(hypothesis.evidence_mix.assumption * 100)}%
                </span>
              </div>
            </div>

            {/* Causal summary */}
            {hypothesis.downstream_implications && (
              <p className="text-xs text-muted-foreground leading-snug border-l-[3px] border-primary/30 pl-2">
                {hypothesis.downstream_implications}
              </p>
            )}

            {/* Dominance score */}
            {hypothesis.dominance_score !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Dominance</span>
                <Progress
                  value={(hypothesis.dominance_score / 10) * 100}
                  className="h-2 flex-1"
                />
                <span className="text-[10px] font-mono font-bold text-foreground/70">
                  {hypothesis.dominance_score.toFixed(1)}
                </span>
              </div>
            )}
          </div>

          {/* Action arrow */}
          <ChevronRight className={`h-4 w-4 mt-1 transition-transform ${isActive ? "text-primary rotate-90" : "text-muted-foreground"}`} />
        </div>
      </Card>
    </motion.div>
  );
}

export default function StructuralInterpretationsPanel({
  ranking,
  activeBranchId,
  onSelectBranch,
  loading,
  analysisData,
  title,
  category,
  onApplyRevision,
}: StructuralInterpretationsPanelProps) {
  const isMobile = useIsMobile();

  if (!ranking || ranking.hypotheses.length === 0) return null;

  return (
    <div className="space-y-2">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <div className="p-1 rounded bg-primary/10 border border-primary/20">
          <GitBranch className="h-4 w-4 text-primary" />
        </div>
        <h3 className="text-sm font-extrabold text-foreground tracking-tight">
          {ranking.interpretation === "competing_structural_interpretations"
            ? "Competing Structural Interpretations"
            : "Structural Root Hypotheses"}
        </h3>
        {ranking.competing && (
          <Badge variant="outline" className="text-[10px] font-bold text-amber-600 border-amber-400 border-[1.5px]">
            Δ {ranking.delta.toFixed(1)} — close contest
          </Badge>
        )}
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        By default, we're weighing all of these together — each one influences the analysis based on your lens and strategic profile. If you'd rather zero in on just one, select it below. You can also pose your own hypothesis and we'll run everything through that angle instead.
      </p>

      {/* Pose Another Hypothesis — interactive panel */}
      {analysisData && (
        <HypothesisInterrogation
          analysisData={analysisData}
          title={title || ""}
          category={category || ""}
          onApplyRevision={onApplyRevision}
        />
      )}

      {/* Gravity map on desktop, card list on mobile */}
      {!isMobile ? (
        <BranchGravityMap
          hypotheses={ranking.hypotheses}
          activeBranchId={activeBranchId}
          onSelectBranch={onSelectBranch}
          competing={ranking.competing}
          delta={ranking.delta}
        />
      ) : (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {ranking.hypotheses.map((h, i) => (
              <HypothesisCard
                key={h.id}
                hypothesis={h}
                isActive={activeBranchId === h.id}
                isPrimary={i === 0}
                rank={i + 1}
                onSelect={() => onSelectBranch(h.id)}
                loading={loading}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
