/**
 * Problem Statement Page — Read-only mirror of the input area
 *
 * Shows: problem statement, detected modes, and identified challenges
 * exactly as entered during setup.
 */

import { useMemo } from "react";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { motion } from "framer-motion";
import { Sparkles, Zap } from "lucide-react";

const fadeIn = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 } };

export default function ProblemStatementPage() {
  const { adaptiveContext, selectedProduct } = useAnalysis();

  const problemStatement =
    adaptiveContext?.problemStatement || selectedProduct?.description || "";
  const detectedModes = adaptiveContext?.detectedModes || [];
  const activeModes = new Set(adaptiveContext?.activeModes || []);
  const challenges = adaptiveContext?.selectedChallenges || [];
  const entityName =
    adaptiveContext?.entity?.name || selectedProduct?.name || "Analysis";

  // Mode color map
  const modeColor: Record<string, string> = {
    business: "bg-red-500",
    service: "bg-orange-500",
    product: "bg-yellow-500",
  };
  const modeLabelColor: Record<string, string> = {
    business: "text-red-600",
    service: "text-orange-600",
    product: "text-yellow-600",
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <motion.div {...fadeIn} transition={{ duration: 0.3 }}>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
          {entityName}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Problem Statement</p>
      </motion.div>

      {/* Problem Statement */}
      <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.05 }}>
        <div className="rounded-xl border border-border/60 bg-card p-5">
          {problemStatement ? (
            <p className="text-sm leading-relaxed text-foreground/90">{problemStatement}</p>
          ) : (
            <p className="text-sm text-muted-foreground italic">No problem statement provided.</p>
          )}
        </div>
      </motion.div>

      {/* Detected Modes */}
      {detectedModes.length > 0 && (
        <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.1 }}>
          <div className="rounded-xl border border-border/60 bg-card p-5 space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Zap size={15} className="text-primary" />
                <span className="text-sm text-muted-foreground">Modes — click to toggle:</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {detectedModes.map((m) => {
                  const modeKey = m.mode?.toLowerCase() || "";
                  const isActive = activeModes.has(modeKey) || activeModes.size === 0;
                  return (
                    <span
                      key={m.mode}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                        isActive
                          ? "border-border bg-card text-foreground"
                          : "border-border/40 bg-muted/50 text-muted-foreground"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${modeColor[modeKey] || "bg-muted-foreground"}`} />
                      {formatModeLabel(m.mode)} · {Math.round((m.confidence || 0) * 100)}%
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Mode descriptions */}
            <div className="space-y-1">
              {detectedModes.map((m) => {
                const modeKey = m.mode?.toLowerCase() || "";
                return (
                  <p key={m.mode} className="text-xs text-muted-foreground leading-relaxed">
                    <span className={`font-bold ${modeLabelColor[modeKey] || "text-muted-foreground"}`}>
                      {formatModeLabel(m.mode)}:
                    </span>{" "}
                    {m.reason}
                  </p>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* Identified Challenges */}
      {challenges.length > 0 && (
        <motion.div {...fadeIn} transition={{ duration: 0.3, delay: 0.15 }}>
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Sparkles size={15} className="text-primary" />
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-primary">
                We Identified These Challenges
              </h2>
            </div>
            <p className="text-xs text-muted-foreground px-1">
              Select which ones to focus on. High-priority items are pre-selected.
            </p>

            <div className="space-y-2.5">
              {challenges.map((ch, i) => {
                const priorityColor =
                  ch.priority === "high"
                    ? "border-red-500/30 bg-red-500/5"
                    : ch.priority === "medium"
                      ? "border-amber-500/30 bg-amber-500/5"
                      : "border-border/60 bg-card";
                const badgeColor =
                  ch.priority === "high"
                    ? "text-red-500"
                    : ch.priority === "medium"
                      ? "text-amber-500"
                      : "text-muted-foreground";

                return (
                  <div
                    key={ch.id || i}
                    className={`rounded-xl border p-4 ${priorityColor}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <p className="text-sm font-semibold text-foreground leading-snug">
                          {ch.question}
                        </p>
                        {ch.context && (
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {ch.context}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className={`text-xs font-bold ${badgeColor}`}>
                          {ch.priority}
                        </span>
                        <span className={`w-2 h-2 rounded-full ${
                          ch.priority === "high"
                            ? "bg-red-500"
                            : ch.priority === "medium"
                              ? "bg-amber-500"
                              : "bg-muted-foreground"
                        }`} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function formatModeLabel(mode: string): string {
  if (!mode) return "";
  return mode.charAt(0).toUpperCase() + mode.slice(1).replace(/_/g, " ");
}
