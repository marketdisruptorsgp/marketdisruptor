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

function FragilityIndicator({ score }: { score: number }) {
  const color = score <= 3 ? "text-green-500" : score <= 6 ? "text-amber-500" : "text-red-500";
  const label = score <= 3 ? "Resilient" : score <= 6 ? "Moderate" : "Fragile";
  return (
    <span className={`text-xs font-medium ${color}`}>
      {label} ({score}/10)
    </span>
  );
}

function HypothesisCard({
  hypothesis,
  isActive,
  isPrimary,
  onSelect,
  loading,
}: {
  hypothesis: StrategicHypothesis;
  isActive: boolean;
  isPrimary: boolean;
  onSelect: () => void;
  loading?: boolean;
}) {
  const Icon = CONSTRAINT_ICONS[hypothesis.constraint_type] || Target;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={`p-4 cursor-pointer transition-all border-2 ${
          isActive
            ? "border-primary bg-primary/5 shadow-lg"
            : "border-border/50 hover:border-primary/40 hover:shadow-md"
        }`}
        onClick={onSelect}
      >
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${isActive ? "bg-primary/20" : "bg-muted"}`}>
            <Icon className={`h-5 w-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            {/* Header row */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={isActive ? "default" : "outline"} className="text-xs">
                {hypothesis.constraint_type}
              </Badge>
              {isPrimary && (
                <Badge variant="secondary" className="text-xs">
                  Primary
                </Badge>
              )}
              {isActive && (
                <Badge className="text-xs bg-primary/20 text-primary border-primary/30">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Active Branch
                </Badge>
              )}
            </div>

            {/* Hypothesis statement */}
            <p className="text-sm font-medium text-foreground leading-snug">
              {hypothesis.hypothesis_statement}
            </p>

            {/* Scores row */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      Leverage: {hypothesis.leverage_score}/10
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>How much relief this constraint provides if resolved</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <span>Confidence: {hypothesis.confidence}%</span>

              <FragilityIndicator score={hypothesis.fragility_score} />
            </div>

            {/* Evidence mix bar */}
            <div className="space-y-1">
              <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-muted">
                {hypothesis.evidence_mix.verified > 0 && (
                  <div
                    className="bg-green-500 rounded-l-full"
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
                    className="bg-red-400 rounded-r-full"
                    style={{ width: `${hypothesis.evidence_mix.assumption * 100}%` }}
                  />
                )}
              </div>
              <div className="flex gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                  Verified {Math.round(hypothesis.evidence_mix.verified * 100)}%
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                  Modeled {Math.round(hypothesis.evidence_mix.modeled * 100)}%
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                  Assumed {Math.round(hypothesis.evidence_mix.assumption * 100)}%
                </span>
              </div>
            </div>

            {/* Causal summary */}
            {hypothesis.downstream_implications && (
              <p className="text-xs text-muted-foreground italic">
                → {hypothesis.downstream_implications}
              </p>
            )}

            {/* Dominance score */}
            {hypothesis.dominance_score !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">Dominance</span>
                <Progress
                  value={(hypothesis.dominance_score / 10) * 100}
                  className="h-1.5 flex-1"
                />
                <span className="text-xs font-mono text-muted-foreground">
                  {hypothesis.dominance_score.toFixed(1)}
                </span>
              </div>
            )}
          </div>

          {/* Action arrow */}
          <ChevronRight className={`h-5 w-5 mt-1 transition-transform ${isActive ? "text-primary rotate-90" : "text-muted-foreground"}`} />
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
    <div className="space-y-3">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <GitBranch className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">
          {ranking.interpretation === "competing_structural_interpretations"
            ? "Competing Structural Interpretations"
            : "Structural Root Hypotheses"}
        </h3>
        {ranking.competing && (
          <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
            Δ {ranking.delta.toFixed(1)} — close contest
          </Badge>
        )}
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        By default, all hypotheses are combined — every angle shapes the analysis. You can focus on a single hypothesis to isolate that perspective across all downstream steps.
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
        <AnimatePresence mode="popLayout">
          {ranking.hypotheses.map((h, i) => (
            <HypothesisCard
              key={h.id}
              hypothesis={h}
              isActive={activeBranchId === h.id}
              isPrimary={i === 0}
              onSelect={() => onSelectBranch(h.id)}
              loading={loading}
            />
          ))}
        </AnimatePresence>
      )}
    </div>
  );
}
