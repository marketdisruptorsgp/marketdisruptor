/**
 * LensBar — Prominent lens selector shown at the top of the mode selection page.
 * Shows active lens + expandable summary of key parameters.
 */

import { useState } from "react";
import { Focus, Building2, Star, ChevronDown, Clock, Shield, BarChart3, Scale } from "lucide-react";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { getLensType } from "@/lib/etaLens";
import { computeLensWeights } from "@/lib/lensWeighting";
import { LensToggle, type UserLens } from "@/components/LensToggle";
import { InfoExplainer } from "@/components/InfoExplainer";
import { AnimatePresence, motion } from "framer-motion";

interface LensParam {
  icon: typeof Clock;
  label: string;
  value: string;
}

function getLensParams(lens: UserLens | null): LensParam[] {
  const weights = computeLensWeights(lens as any);
  const lensType = getLensType(lens);

  const riskLabel = weights.acceptable_risk === "low" ? "Conservative" : weights.acceptable_risk === "high" ? "Aggressive" : "Balanced";
  const evidenceLabel = `${Math.round(weights.evidence_threshold * 100)}% min`;

  const params: LensParam[] = [
    { icon: Clock, label: "Time Horizon", value: `${weights.time_horizon_months} months` },
    { icon: Shield, label: "Risk Tolerance", value: riskLabel },
    { icon: BarChart3, label: "Evidence Bar", value: evidenceLabel },
  ];

  if (lensType === "eta") {
    params.push({ icon: Scale, label: "Focus", value: "Value durability & operational leverage" });
  } else if (lensType === "custom" && lens?.primary_objective) {
    const shortObj = lens.primary_objective.length > 40
      ? lens.primary_objective.slice(0, 40) + "…"
      : lens.primary_objective;
    params.push({ icon: Scale, label: "Focus", value: shortObj });
  }

  return params;
}

export function LensBar() {
  const analysis = useAnalysis();
  const [expanded, setExpanded] = useState(false);
  const lens = analysis.activeLens;
  const lensType = getLensType(lens);

  const LensIcon = lensType === "eta" ? Building2 : lensType === "custom" ? Star : Focus;
  const lensName = lensType === "eta" ? "ETA Acquisition Lens" : lensType === "custom" ? (lens?.name || "Custom Lens") : "Default Lens";
  const lensDesc = lensType === "eta"
    ? "Evaluates from ownership & value-creation perspective"
    : lensType === "custom"
      ? (lens?.target_outcome || "Custom evaluation framework")
      : "Explores disruption potential & innovation opportunities";

  const params = getLensParams(lens);

  return (
    <div className="mb-6">
      <div
        className="rounded-xl border-2 bg-card overflow-hidden transition-shadow hover:shadow-md"
        style={{
          borderColor: lensType !== "default" ? "hsl(var(--primary) / 0.4)" : "hsl(var(--border))",
          borderLeftWidth: "4px",
          borderLeftColor: lensType !== "default" ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.4)",
          background: lensType !== "default" ? "hsl(var(--primary) / 0.03)" : "hsl(var(--card))",
        }}
      >
        <div className="px-4 sm:px-5 py-3 flex items-center gap-3">
          {/* Icon */}
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: lensType !== "default" ? "hsl(var(--primary) / 0.1)" : "hsl(var(--muted))",
            }}
          >
            <LensIcon
              size={16}
              style={{ color: lensType !== "default" ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}
            />
          </div>

          {/* Label + description */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex-1 min-w-0 text-left"
          >
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Analysis Lens</span>
              <ChevronDown
                size={12}
                className={`text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`}
              />
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm font-bold text-foreground">{lensName}</span>
              <span className="text-xs text-muted-foreground hidden sm:inline">— {lensDesc}</span>
            </div>
          </button>

          {/* Lens toggle + info */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <LensToggle />
            <InfoExplainer explainerKey="lens-selector" />
          </div>
        </div>

        {/* Expandable params */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div
                className="px-4 sm:px-5 pb-3 pt-1 grid gap-3"
                style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}
              >
                {params.map((p) => (
                  <div key={p.label} className="flex items-center gap-2.5">
                    <p.icon size={14} className="text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground block">{p.label}</span>
                      <span className="text-xs font-semibold text-foreground">{p.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
