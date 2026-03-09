/**
 * HeroInsightCard — Tier 0: The single most surprising finding
 * Full-width, large type. Punches the user in the face with one insight.
 */

import { memo } from "react";
import { motion } from "framer-motion";
import { Zap, ArrowRight, AlertTriangle } from "lucide-react";
import { humanizeLabel } from "@/lib/humanize";
import type { StrategicNarrative } from "@/lib/strategicEngine";

interface HeroInsightCardProps {
  narrative: StrategicNarrative | null;
  modeAccent: string;
  analysisId: string;
  onNavigateToGraph: () => void;
  isPipelineRunning?: boolean;
}

function pickHeroInsight(narrative: StrategicNarrative | null): {
  label: string;
  headline: string;
  detail: string | null;
  type: "blindspot" | "opportunity" | "constraint";
} | null {
  if (!narrative) return null;

  // Priority 1: Breakthrough opportunity (most exciting)
  if (narrative.breakthroughOpportunity) {
    return {
      label: "Biggest Opportunity",
      headline: humanizeLabel(narrative.breakthroughOpportunity),
      detail: narrative.strategicVerdict ? humanizeLabel(narrative.strategicVerdict) : null,
      type: "opportunity",
    };
  }

  // Priority 2: Primary constraint (biggest blind spot)
  if (narrative.primaryConstraint) {
    return {
      label: "Biggest Blind Spot",
      headline: humanizeLabel(narrative.primaryConstraint),
      detail: narrative.narrativeSummary ? humanizeLabel(narrative.narrativeSummary) : null,
      type: "blindspot",
    };
  }

  // Priority 3: Strategic verdict
  if (narrative.strategicVerdict) {
    return {
      label: "Strategic Verdict",
      headline: humanizeLabel(narrative.strategicVerdict),
      detail: narrative.narrativeSummary ? humanizeLabel(narrative.narrativeSummary) : null,
      type: "constraint",
    };
  }

  return null;
}

const TYPE_CONFIG = {
  blindspot: {
    icon: AlertTriangle,
    gradient: "from-amber-500/10 to-orange-500/5",
    borderColor: "hsl(var(--warning) / 0.3)",
    accentColor: "hsl(var(--warning))",
  },
  opportunity: {
    icon: Zap,
    gradient: "from-emerald-500/10 to-teal-500/5",
    borderColor: "hsl(var(--success) / 0.3)",
    accentColor: "hsl(var(--success))",
  },
  constraint: {
    icon: AlertTriangle,
    gradient: "from-primary/8 to-primary/3",
    borderColor: "hsl(var(--primary) / 0.3)",
    accentColor: "hsl(var(--primary))",
  },
};

export const HeroInsightCard = memo(function HeroInsightCard({
  narrative,
  modeAccent,
  analysisId,
  onNavigateToGraph,
}: HeroInsightCardProps) {
  const hero = pickHeroInsight(narrative);

  if (!hero) {
    return (
      <div className="rounded-xl border border-border bg-card px-6 py-8 text-center">
        <p className="text-sm text-muted-foreground">
          Run the analysis pipeline to surface your biggest insight.
        </p>
      </div>
    );
  }

  const config = TYPE_CONFIG[hero.type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`rounded-xl bg-gradient-to-br ${config.gradient} overflow-hidden`}
      style={{ border: `1.5px solid ${config.borderColor}` }}
    >
      <div className="px-5 sm:px-8 py-6 sm:py-8">
        {/* Eyebrow */}
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: `${config.accentColor}20` }}
          >
            <Icon size={14} style={{ color: config.accentColor }} />
          </div>
          <span
            className="text-[11px] font-extrabold uppercase tracking-[0.15em]"
            style={{ color: config.accentColor }}
          >
            {hero.label}
          </span>
        </div>

        {/* Headline — the punch */}
        <h2 className="text-xl sm:text-2xl font-black text-foreground leading-tight max-w-[65ch] mb-2">
          {hero.headline}
        </h2>

        {/* Supporting detail */}
        {hero.detail && (
          <p className="text-sm text-muted-foreground leading-relaxed max-w-[75ch] mb-4">
            {hero.detail}
          </p>
        )}

        {/* CTA */}
        <button
          onClick={onNavigateToGraph}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: config.accentColor,
            color: "white",
          }}
        >
          See Why
          <ArrowRight size={12} />
        </button>
      </div>
    </motion.div>
  );
});
