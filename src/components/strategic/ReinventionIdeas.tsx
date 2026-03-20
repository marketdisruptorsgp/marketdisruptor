/**
 * ReinventionIdeas — The highest-value differentiator.
 *
 * Surfaces flipped logic / reinvention ideas from the strategic synthesis
 * directly on the Command Deck. These represent "what if you did the opposite?"
 * structural moves — the core product value.
 *
 * Design: Bold, high-contrast cards with the assumption → alternative pivot.
 * Each card answers: "Everyone does X. What if you did Y instead?"
 */

import { memo } from "react";
import { motion } from "framer-motion";
import { Lightbulb, ArrowRight } from "lucide-react";
import { humanizeLabel, scrubBannedWords } from "@/lib/humanize";

export interface FlippedIdeaItem {
  originalAssumption: string;
  boldAlternative: string;
  rationale: string;
  physicalMechanism?: string;
}

interface ReinventionIdeasProps {
  ideas: FlippedIdeaItem[];
  modeAccent: string;
}

export const ReinventionIdeas = memo(function ReinventionIdeas({
  ideas,
  modeAccent,
}: ReinventionIdeasProps) {
  if (ideas.length === 0) return null;

  // Show top 4 ideas max
  const visible = ideas.slice(0, 4);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.08 }}
    >
      <div className="space-y-3">
        {/* Section header */}
        <div className="flex items-center gap-2">
          <Lightbulb
            size={14}
            style={{ color: modeAccent }}
            aria-hidden="true"
          />
          <span
            className="text-[10px] font-extrabold uppercase tracking-widest"
            style={{ color: modeAccent }}
          >
            What if you flipped the model?
          </span>
        </div>

        {/* Idea cards */}
        <div className="grid grid-cols-1 gap-2.5">
          {visible.map((idea, i) => (
            <FlipCard key={i} idea={idea} index={i} accent={modeAccent} />
          ))}
        </div>
      </div>
    </motion.div>
  );
});

function FlipCard({
  idea,
  index,
  accent,
}: {
  idea: FlippedIdeaItem;
  index: number;
  accent: string;
}) {
  const assumption = scrubBannedWords(idea.originalAssumption || "");
  const alternative = humanizeLabel(idea.boldAlternative || "");
  const rationale = scrubBannedWords(idea.rationale || "");

  if (!assumption && !alternative) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 + index * 0.07, duration: 0.4 }}
      className="rounded-xl overflow-hidden"
      style={{
        background: index === 0 ? `${accent}06` : "hsl(var(--card))",
        border: index === 0
          ? `1.5px solid ${accent}30`
          : "1px solid hsl(var(--border))",
      }}
    >
      <div className="px-4 py-3.5 space-y-2.5">
        {/* Assumption → Alternative pivot */}
        <div className="flex flex-col sm:flex-row gap-2 items-start">
          {/* The assumption everyone holds */}
          <div
            className="flex-1 rounded-lg px-3 py-2 min-w-0"
            style={{
              background: "hsl(var(--destructive) / 0.05)",
              border: "1px solid hsl(var(--destructive) / 0.12)",
            }}
          >
            <p
              className="text-[8px] font-extrabold uppercase tracking-widest mb-0.5"
              style={{ color: "hsl(var(--destructive) / 0.7)" }}
            >
              Everyone assumes
            </p>
            <p className="text-xs text-foreground/75 leading-snug">
              {assumption}
            </p>
          </div>

          {/* Arrow */}
          <div className="flex items-center justify-center py-1 sm:py-0 sm:pt-3">
            <ArrowRight
              size={14}
              className="text-muted-foreground/50 rotate-90 sm:rotate-0"
            />
          </div>

          {/* The structural alternative */}
          <div
            className="flex-1 rounded-lg px-3 py-2 min-w-0"
            style={{
              background: `${accent}08`,
              border: `1px solid ${accent}18`,
            }}
          >
            <p
              className="text-[8px] font-extrabold uppercase tracking-widest mb-0.5"
              style={{ color: accent }}
            >
              Instead, try
            </p>
            <p className="text-xs font-semibold text-foreground leading-snug">
              {alternative}
            </p>
          </div>
        </div>

        {/* Rationale — why this works */}
        {rationale && (
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {rationale}
          </p>
        )}
      </div>
    </motion.div>
  );
}