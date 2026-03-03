/**
 * ACTIVE HYPOTHESIS BANNER
 * Shows which structural hypothesis is driving the current step.
 * High-contrast, always visible, with a quick link to switch.
 */

import { motion } from "framer-motion";
import { GitBranch, ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { useModeTheme } from "@/hooks/useModeTheme";
import type { StrategicHypothesis } from "@/lib/strategicOS";

interface ActiveHypothesisBannerProps {
  stepName: string;
  accentColor?: string;
}

export function ActiveHypothesisBanner({ stepName, accentColor }: ActiveHypothesisBannerProps) {
  const { activeBranchId, governedData, analysisId } = useAnalysis();
  const theme = useModeTheme();
  const navigate = useNavigate();
  const color = accentColor || theme.primary;

  if (!activeBranchId || !governedData) return null;

  // Find the active hypothesis
  let hypotheses: StrategicHypothesis[] = [];
  if (Array.isArray(governedData.root_hypotheses)) {
    hypotheses = governedData.root_hypotheses as StrategicHypothesis[];
  } else {
    const cm = governedData.constraint_map as Record<string, unknown> | undefined;
    if (cm && Array.isArray(cm.root_hypotheses)) {
      hypotheses = cm.root_hypotheses as StrategicHypothesis[];
    }
  }

  const active = hypotheses.find(h => h.id === activeBranchId);
  if (!active) return null;

  const baseUrl = `/analysis/${analysisId}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
      className="rounded-2xl border-2 overflow-hidden"
      style={{
        borderColor: `${color}30`,
        background: `linear-gradient(135deg, hsl(var(--card)) 0%, ${color}06 100%)`,
      }}
    >
      <div className="px-4 sm:px-5 py-3.5 sm:py-4">
        {/* Top label row */}
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: `${color}12`, border: `1px solid ${color}20` }}
            >
              <GitBranch className="h-3.5 w-3.5" style={{ color }} />
            </div>
            <span
              className="text-[11px] font-extrabold uppercase tracking-wider"
              style={{ color }}
            >
              Active Hypothesis
            </span>
          </div>

          <button
            onClick={() => navigate(`${baseUrl}/report`, { state: { openHypothesesTab: true } })}
            className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all hover:scale-[1.03]"
            style={{
              color,
              background: `${color}08`,
              border: `1.5px solid ${color}20`,
            }}
          >
            Choose another hypothesis
            <ArrowUpRight className="h-3 w-3" />
          </button>
        </div>

        {/* Hypothesis statement */}
        <p className="text-sm sm:text-[15px] font-bold text-foreground leading-snug">
          {active.hypothesis_statement}
        </p>

        {/* Context line */}
        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
          This shapes everything on this page — the {stepName.toLowerCase()} analysis follows this structural angle.
          {hypotheses.length > 1 && (
            <> You can switch to a different hypothesis from the Intelligence Report to see how the analysis changes.</>
          )}
        </p>
      </div>
    </motion.div>
  );
}
