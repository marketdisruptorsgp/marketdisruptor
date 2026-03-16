/**
 * StrategicNarrativeStory — Prose-based strategic summary
 * Tells a coherent strategy story from constraint to projected impact.
 */

import { memo } from "react";
import { BookOpen, TrendingUp } from "lucide-react";
import type { StrategicNarrativeStory as StoryType } from "@/lib/benchmarkEngine";

interface StrategicNarrativeStoryProps {
  story: StoryType | null;
}

export const StrategicNarrativeStory = memo(function StrategicNarrativeStory({ story }: StrategicNarrativeStoryProps) {
  if (!story || story.paragraphs.length === 0) return null;

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "hsl(var(--card))", border: "1.5px solid hsl(var(--border))" }}>
      {/* Header */}
      <div className="px-5 pt-4 pb-2 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--primary) / 0.1)" }}>
          <BookOpen size={14} className="text-primary" />
        </div>
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
          Strategic Summary
        </span>
      </div>

      {/* Narrative — bold highlighted bullets instead of dense paragraphs */}
      <div className="px-5 pb-4">
        <div className="space-y-2">
          {story.paragraphs.map((p, i) => (
            <div key={i} className="flex gap-3 items-start p-3 rounded-lg bg-primary/5 border border-primary/10">
              <span className="text-primary font-black text-lg leading-none mt-0.5">→</span>
              <p className="text-sm font-semibold text-foreground leading-snug">{p}</p>
            </div>
          ))}
        </div>

        {/* Impact line — only shown when specific and data-backed */}
        {story.impactLine && (
          <div
            className="mt-4 rounded-lg p-3 flex items-start gap-2"
            style={{ background: "hsl(var(--success) / 0.06)", border: "1px solid hsl(var(--success) / 0.12)" }}
          >
            <TrendingUp size={13} style={{ color: "hsl(var(--success))" }} className="mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider mb-0.5" style={{ color: "hsl(var(--success))" }}>
                Expected Impact
              </p>
              <p className="text-xs font-bold text-foreground leading-relaxed">
                {story.impactLine}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
