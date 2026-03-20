/**
 * BreakthroughGrid — Zone 2: What You Could Do
 *
 * 2×2 grid (stacked on mobile) of opportunity vectors, ranked by confidence.
 * Max 4 cards. Highlights the top opportunity.
 * Each card: label + rationale + contrarian belief badge.
 *
 * Design: Energetic, option-focused, contrarian badges for each card.
 */

import { motion } from "framer-motion";
import { humanizeLabel } from "@/lib/humanize";

export interface OpportunityGridItem {
  id: string;
  title: string;
  rationale: string;
  contrarianBelief: string;
  category: "paradigm" | "optimization" | "flanking" | "unlock";
  confidence: number;
}

const CATEGORY_COLORS: Record<OpportunityGridItem["category"], string> = {
  paradigm:     "hsl(var(--primary))",
  optimization: "hsl(142 70% 35%)",
  flanking:     "hsl(38 92% 42%)",
  unlock:       "hsl(263 70% 60%)",
};

const CATEGORY_LABELS: Record<OpportunityGridItem["category"], string> = {
  paradigm:     "Strategic Shift",
  optimization: "Quick Win",
  flanking:     "Market Opening",
  unlock:       "New Revenue",
};

interface BreakthroughGridProps {
  opportunities: OpportunityGridItem[];
  modeAccent: string;
}

function OpportunityCard({
  item,
  index,
  isTop,
}: {
  item: OpportunityGridItem;
  index: number;
  isTop: boolean;
}) {
  const color = CATEGORY_COLORS[item.category];
  const label = CATEGORY_LABELS[item.category];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.06, duration: 0.35 }}
      className="rounded-xl overflow-hidden"
      style={{
        background: isTop ? `${color}08` : "hsl(var(--card))",
        border: isTop
          ? `1.5px solid ${color}35`
          : "1px solid hsl(var(--border))",
      }}
    >
      <div className="px-4 py-3 space-y-2">
        {/* Category badge */}
        <span
          className="inline-flex items-center text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider"
          style={{ background: `${color}18`, color }}
        >
          {label}
        </span>

        {/* Title */}
        <p className={`font-bold text-foreground leading-snug ${isTop ? "text-base" : "text-sm"}`}>
          {humanizeLabel(item.title)}
        </p>

        {/* Rationale */}
        {item.rationale && (
          <p className="text-[12px] text-muted-foreground leading-relaxed">
            {item.rationale}
          </p>
        )}

        {/* Key insight badge */}
        {item.contrarianBelief && (
          <div
            className="rounded-lg px-2.5 py-1.5 mt-1"
            style={{
              background: "hsl(var(--muted) / 0.6)",
              border: "1px solid hsl(var(--border) / 0.6)",
            }}
          >
            <p className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground mb-0.5">
              The Insight
            </p>
            <p className="text-[11px] font-semibold text-foreground/80 leading-snug italic">
              "{item.contrarianBelief}"
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function BreakthroughGrid({ opportunities, modeAccent }: BreakthroughGridProps) {
  if (opportunities.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
    >
      <div className="space-y-2.5">
        {/* Zone label */}
        <span
          className="text-[10px] font-extrabold uppercase tracking-widest"
          style={{ color: `${modeAccent}cc` }}
        >
          Breakthrough Vectors
        </span>

        {/* 2×2 grid — top card spans full width on mobile, grid on sm+ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {opportunities.map((item, i) => (
            <OpportunityCard key={item.id} item={item} index={i} isTop={i === 0} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
