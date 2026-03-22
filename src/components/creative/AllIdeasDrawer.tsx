/**
 * AllIdeasDrawer — Zone 2.5 collapsible full idea list
 *
 * Compact table of all generated ideas with inline expand-to-card detail.
 * Collapsed by default with a "See all N ideas →" toggle.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, ChevronUp, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { IdeaCandidate } from "@/lib/creativeOpportunityEngine";

export interface AllIdeasDrawerProps {
  ideas: IdeaCandidate[];
  modeAccent: string;
}

const METHOD_SHORT: Record<string, string> = {
  morphological: "Morph",
  scamper: "SCAMPER",
  analogy: "Analogy",
  triz: "TRIZ",
};

function IdeaDetailPanel({ idea, modeAccent }: { idea: IdeaCandidate; modeAccent: string }) {
  return (
    <div className="px-3 py-2.5 space-y-2 border-t border-border/30 bg-muted/20">
      <p className="text-[11px] text-muted-foreground leading-relaxed">{idea.summary}</p>

      <div className="flex flex-wrap gap-1.5">
        <span className="text-[10px] px-2 py-0.5 rounded-full border border-border/50 text-foreground/70">
          <span className="font-semibold text-foreground/50">Job: </span>
          {idea.demandAnchor.length > 60 ? idea.demandAnchor.slice(0, 58) + "…" : idea.demandAnchor}
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-full border border-border/50 text-foreground/70">
          <span className="font-semibold text-foreground/50">Lever: </span>
          {idea.supplyAnchor.length > 60 ? idea.supplyAnchor.slice(0, 58) + "…" : idea.supplyAnchor}
        </span>
      </div>

      {idea.analogPrecedent && (
        <p className="text-[10px] text-muted-foreground italic">↳ Analog: {idea.analogPrecedent}</p>
      )}

      {idea.isBlocked && idea.blockedReason && (
        <div
          className="rounded px-2 py-1.5 text-[10px] leading-relaxed"
          style={{ background: "hsl(var(--destructive) / 0.06)", border: "1px solid hsl(var(--destructive) / 0.15)" }}
        >
          <span className="font-bold text-destructive">Blocked: </span>
          <span className="text-muted-foreground italic">{idea.blockedReason}</span>
        </div>
      )}

      {/* Score breakdown */}
      <div className="flex gap-3 pt-0.5">
        {[
          { label: "Viability", value: idea.viabilityScore },
          { label: "Radicality", value: idea.radicalityScore },
          { label: "Evidence", value: idea.evidenceScore },
        ].map(({ label, value }) => (
          <div key={label} className="flex-1 space-y-0.5">
            <div className="h-1 rounded-full bg-border/50 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.round(value * 100)}%`, background: modeAccent }}
              />
            </div>
            <p className="text-[8px] text-muted-foreground text-center">
              {label} {Math.round(value * 100)}%
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function IdeaRow({
  idea,
  modeAccent,
  index,
}: {
  idea: IdeaCandidate;
  modeAccent: string;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-border/30 last:border-0">
      <button
        className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(v => !v)}
      >
        {/* Title */}
        <span className="flex-1 min-w-0 text-[11px] font-medium text-foreground truncate">
          {idea.title}
        </span>

        {/* Method badge */}
        <span className="text-[9px] text-muted-foreground flex-shrink-0 w-14 text-right">
          {METHOD_SHORT[idea.innovationMethod] ?? idea.innovationMethod}
        </span>

        {/* Viability */}
        <span className="text-[9px] tabular-nums text-muted-foreground flex-shrink-0 w-10 text-right">
          {Math.round(idea.viabilityScore * 100)}%
        </span>

        {/* Radicality */}
        <span className="text-[9px] tabular-nums text-muted-foreground flex-shrink-0 w-10 text-right">
          {Math.round(idea.radicalityScore * 100)}%
        </span>

        {/* Evidence */}
        <span className="text-[9px] tabular-nums text-muted-foreground flex-shrink-0 w-8 text-right">
          {idea.evidenceItems.length}
        </span>

        {/* Blocked badge */}
        <span className="flex-shrink-0 w-10 flex justify-end">
          {idea.isBlocked ? (
            <Lock size={9} className="text-muted-foreground/60" />
          ) : (
            <span className="w-[9px]" />
          )}
        </span>

        {/* Expand toggle */}
        <span className="flex-shrink-0 text-muted-foreground/60">
          {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        </span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <IdeaDetailPanel idea={idea} modeAccent={modeAccent} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AllIdeasDrawer({ ideas, modeAccent }: AllIdeasDrawerProps) {
  const [open, setOpen] = useState(false);

  if (ideas.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 }}
      className="rounded-xl border border-border/50 bg-card overflow-hidden"
    >
      {/* Toggle header */}
      <button
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">
            Creative Space
          </span>
          <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">
            {ideas.length}
          </Badge>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
          {open ? "Collapse" : `See all ${ideas.length} ideas →`}
          {open ? <ChevronUp size={12} /> : <ChevronRight size={12} />}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            {/* Table header */}
            <div className="border-t border-border/40 px-3 py-1.5 flex items-center gap-2 bg-muted/30">
              <span className="flex-1 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">Title</span>
              <span className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground w-14 text-right">Method</span>
              <span className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground w-10 text-right">Viab.</span>
              <span className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground w-10 text-right">Rad.</span>
              <span className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground w-8 text-right">Evid.</span>
              <span className="text-[9px] font-bold uppercase tracking-wide text-muted-foreground w-10 text-right">Blocked</span>
              <span className="w-[11px]" />
            </div>

            {/* Rows */}
            <div>
              {ideas.map((idea, idx) => (
                <IdeaRow
                  key={idea.id}
                  idea={idea}
                  modeAccent={modeAccent}
                  index={idx}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
