/**
 * ACTIVE HYPOTHESIS BANNER
 * Shows which structural hypothesis (or combined mode) is driving the current step.
 * High-contrast, always visible, with a quick link to switch.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GitBranch, ArrowUpRight, Layers, AlertTriangle, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { useModeTheme } from "@/hooks/useModeTheme";
import type { StrategicHypothesis } from "@/lib/strategicOS";

interface ActiveHypothesisBannerProps {
  stepName: string;
  accentColor?: string;
}

/** Detect tensions between hypotheses */
function findTensions(hypotheses: StrategicHypothesis[]): string[] {
  const tensions: string[] = [];
  for (let i = 0; i < hypotheses.length; i++) {
    for (let j = i + 1; j < hypotheses.length; j++) {
      const a = hypotheses[i];
      const b = hypotheses[j];
      // Opposing constraint types suggest tension
      if (
        (a.constraint_type === "cost" && b.constraint_type === "scale") ||
        (a.constraint_type === "scale" && b.constraint_type === "cost") ||
        (a.constraint_type === "time" && b.constraint_type === "reliability") ||
        (a.constraint_type === "reliability" && b.constraint_type === "time") ||
        (a.constraint_type === "adoption" && b.constraint_type === "cost") ||
        (a.constraint_type === "cost" && b.constraint_type === "adoption")
      ) {
        tensions.push(
          `"${a.constraint_type}" suggests ${a.downstream_implications?.split(".")[0] || "one direction"}, while "${b.constraint_type}" points the opposite way.`
        );
      }
      // Large dominance score gap with different implications
      if (Math.abs((a.dominance_score ?? 0) - (b.dominance_score ?? 0)) < 2 && a.constraint_type !== b.constraint_type) {
        tensions.push(
          `Both "${a.constraint_type}" and "${b.constraint_type}" are nearly equal in weight — this is a genuine strategic tradeoff.`
        );
        break; // One tension per close pair is enough
      }
    }
  }
  return tensions.slice(0, 2);
}

export function ActiveHypothesisBanner({ stepName, accentColor }: ActiveHypothesisBannerProps) {
  const { activeBranchId, governedData, analysisId } = useAnalysis();
  const theme = useModeTheme();
  const navigate = useNavigate();
  const color = accentColor || theme.primary;
  const [showTensions, setShowTensions] = useState(false);

  if (!governedData) return null;

  // Find hypotheses
  let hypotheses: StrategicHypothesis[] = [];
  if (Array.isArray(governedData.root_hypotheses)) {
    hypotheses = governedData.root_hypotheses as StrategicHypothesis[];
  } else {
    const cm = governedData.constraint_map as Record<string, unknown> | undefined;
    if (cm && Array.isArray(cm.root_hypotheses)) {
      hypotheses = cm.root_hypotheses as StrategicHypothesis[];
    }
  }

  if (hypotheses.length === 0) return null;

  const isCombined = !activeBranchId || activeBranchId === "combined";
  const active = !isCombined ? hypotheses.find(h => h.id === activeBranchId) : null;
  const tensions = isCombined ? findTensions(hypotheses) : [];
  const baseUrl = `/analysis/${analysisId}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
      className="rounded-2xl border-2 overflow-hidden"
      style={{
        borderColor: isCombined ? "hsl(var(--border))" : `${color}30`,
        background: isCombined
          ? "linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--muted) / 0.15) 100%)"
          : `linear-gradient(135deg, hsl(var(--card)) 0%, ${color}06 100%)`,
      }}
    >
      <div className="px-4 sm:px-5 py-3.5 sm:py-4">
        {/* Top label row */}
        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{
                background: isCombined ? "hsl(var(--muted) / 0.5)" : `${color}12`,
                border: isCombined ? "1px solid hsl(var(--border))" : `1px solid ${color}20`,
              }}
            >
              {isCombined
                ? <Layers className="h-3.5 w-3.5 text-foreground" />
                : <GitBranch className="h-3.5 w-3.5" style={{ color }} />
              }
            </div>
            <span
              className="text-[11px] font-extrabold uppercase tracking-wider"
              style={{ color: isCombined ? "hsl(var(--foreground))" : color }}
            >
              {isCombined ? "Combined View" : "Focused Hypothesis"}
            </span>
          </div>

          <button
            onClick={() => navigate(`${baseUrl}/report`, { state: { openHypothesesTab: true } })}
            className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all hover:scale-[1.03]"
            style={{
              color: isCombined ? "hsl(var(--foreground))" : color,
              background: isCombined ? "hsl(var(--muted) / 0.3)" : `${color}08`,
              border: isCombined ? "1.5px solid hsl(var(--border))" : `1.5px solid ${color}20`,
            }}
          >
            {isCombined ? "Focus on one hypothesis" : "Choose another hypothesis"}
            <ArrowUpRight className="h-3 w-3" />
          </button>
        </div>

        {/* Statement */}
        {isCombined ? (
          <div>
            <p className="text-sm sm:text-[15px] font-bold text-foreground leading-snug">
              All {hypotheses.length} hypotheses are being considered together.
            </p>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              The {stepName.toLowerCase()} weighs every structural angle. You can focus on a single hypothesis for a deeper, isolated perspective.
            </p>

            {/* Tensions */}
            {tensions.length > 0 && (
              <div className="mt-2">
                <button
                  onClick={() => setShowTensions(!showTensions)}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-amber-600 hover:text-amber-700 transition-colors"
                >
                  <AlertTriangle className="h-3 w-3" />
                  {tensions.length} tension{tensions.length > 1 ? "s" : ""} between hypotheses
                  <ChevronDown className={`h-3 w-3 transition-transform ${showTensions ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {showTensions && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 space-y-1.5">
                        {tensions.map((t, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-2 px-3 py-2 rounded-lg text-xs text-foreground/80"
                            style={{ background: "hsl(38 92% 50% / 0.06)", border: "1px solid hsl(38 92% 50% / 0.15)" }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                            {t}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        ) : active ? (
          <div>
            <p className="text-sm sm:text-[15px] font-bold text-foreground leading-snug">
              {active.hypothesis_statement}
            </p>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
              This shapes everything on this page — the {stepName.toLowerCase()} follows this structural angle only.
            </p>
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}
