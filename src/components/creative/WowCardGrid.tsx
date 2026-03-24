/**
 * WowCardGrid — Zone 2.5 radical opportunity cards
 *
 * Displays top 3–5 radical WowCards from the creative opportunity engine.
 * Each card shows title, method badge, summary, demand/supply anchors,
 * evidence count, cross-industry analog, composite score bar, and
 * an expandable Heilmeier panel.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, Lightbulb, Layers, GitMerge, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { WowCard } from "@/lib/creativeOpportunityEngine";

export interface WowCardGridProps {
  cards: WowCard[];
  modeAccent: string;
}

const METHOD_CONFIG = {
  morphological: {
    label: "Morphological",
    icon: Layers,
    color: "hsl(217 91% 55%)",
    bg: "hsl(217 91% 55% / 0.10)",
  },
  scamper: {
    label: "SCAMPER",
    icon: GitMerge,
    color: "hsl(142 70% 38%)",
    bg: "hsl(142 70% 38% / 0.10)",
  },
  analogy: {
    label: "Analogy",
    icon: BookOpen,
    color: "hsl(263 70% 60%)",
    bg: "hsl(263 70% 60% / 0.10)",
  },
  triz: {
    label: "TRIZ",
    icon: Lightbulb,
    color: "hsl(38 92% 45%)",
    bg: "hsl(38 92% 45% / 0.10)",
  },
} as const;

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1 rounded-full bg-border/50 overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.round(value * 100)}%` }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      />
    </div>
  );
}

function HeilmeierPanelView({ panel }: { panel: NonNullable<WowCard["heilmeier"]> }) {
  return (
    <div className="space-y-2 pt-2">
      {[
        { label: "Objective", value: panel.objective },
        { label: "Today's Limit", value: panel.todaysLimit },
        { label: "What's New", value: panel.whatsNew },
        { label: "Who Cares", value: panel.whoCares },
        { label: "Risks", value: panel.risks },
        { label: "Success Metric", value: panel.successMetric },
      ].map(({ label, value }) => (
        <div key={label} className="space-y-0.5">
          <p className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground">{label}</p>
          <p className="text-[11px] text-foreground/80 leading-relaxed">{value}</p>
        </div>
      ))}
    </div>
  );
}

interface AnnotationState {
  verdict: "pursue" | "not_viable" | null;
  note: string;
}

function WowCardItem({
  card,
  modeAccent,
  index,
  variantCount = 1,
}: {
  card: WowCard;
  modeAccent: string;
  index: number;
  variantCount?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [annotation, setAnnotation] = useState<AnnotationState>({ verdict: null, note: "" });
  const [noteInput, setNoteInput] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);

  const methodCfg = METHOD_CONFIG[card.innovationMethod] ?? METHOD_CONFIG.morphological;
  const MethodIcon = methodCfg.icon;

  const handleAnnotate = (verdict: "pursue" | "not_viable") => {
    setAnnotation(prev => ({ ...prev, verdict: prev.verdict === verdict ? null : verdict }));
  };

  const handleNoteSubmit = () => {
    setAnnotation(prev => ({ ...prev, note: noteInput }));
    setShowNoteInput(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.08 * index }}
      className="rounded-xl border border-border/60 bg-card overflow-hidden"
    >
      {/* Card header */}
      <div className="px-4 pt-4 pb-3 space-y-2">
        {/* Method badge + title row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide"
                style={{ color: methodCfg.color, background: methodCfg.bg }}
              >
                <MethodIcon size={9} />
                {methodCfg.label}
              </span>
              {card.mutationType && (
                <span className="text-[9px] font-semibold text-muted-foreground px-1.5 py-0.5 rounded bg-muted/60">
                  {card.mutationType}
                </span>
              )}
              {variantCount > 1 && (
                <span className="text-[9px] font-semibold text-muted-foreground px-1.5 py-0.5 rounded bg-muted/60 border border-border/50">
                  {variantCount} variants
                </span>
              )}
            </div>
            <h3 className="text-sm font-bold text-foreground leading-snug">{card.title}</h3>
          </div>
          <div className="flex-shrink-0 text-right">
            <span
              className="text-[10px] font-black tabular-nums"
              style={{ color: modeAccent }}
            >
              {Math.round(card.compositeScore * 100)}
            </span>
            <p className="text-[8px] text-muted-foreground">score</p>
          </div>
        </div>

        {/* Summary */}
        <p className="text-xs text-muted-foreground leading-relaxed">{card.summary}</p>

        {/* Anchors */}
        <div className="flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border border-border/50 text-foreground/70">
            <span className="font-semibold text-foreground/50">Job:</span>
            {card.demandAnchor.length > 50 ? card.demandAnchor.slice(0, 48) + "…" : card.demandAnchor}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border border-border/50 text-foreground/70">
            <span className="font-semibold text-foreground/50">Lever:</span>
            {card.supplyAnchor.length > 50 ? card.supplyAnchor.slice(0, 48) + "…" : card.supplyAnchor}
          </span>
        </div>

        {/* Evidence + analog row */}
        <div className="flex items-center gap-2 flex-wrap">
          {card.evidenceItems.length > 0 && (
            <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 font-semibold">
              {card.evidenceItems.length} evidence item{card.evidenceItems.length !== 1 ? "s" : ""}
            </Badge>
          )}
          {card.analogPrecedent && (
            <span className="text-[9px] text-muted-foreground italic">
              ↳ {card.analogPrecedent}
            </span>
          )}
        </div>

        {/* Score bar */}
        <div className="space-y-0.5">
          <ScoreBar value={card.compositeScore} color={modeAccent} />
          <div className="flex justify-between text-[8px] text-muted-foreground">
            <span>V {Math.round(card.viabilityScore * 100)}%</span>
            <span>R {Math.round(card.radicalityScore * 100)}%</span>
            <span>E {Math.round(card.evidenceScore * 100)}%</span>
          </div>
        </div>
      </div>

      {/* Expandable Heilmeier panel */}
      {card.heilmeier && (
        <div className="border-t border-border/40">
          <button
            className="w-full flex items-center justify-between px-4 py-2 text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setExpanded(v => !v)}
          >
            Heilmeier Panel
            {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-3">
                  <HeilmeierPanelView panel={card.heilmeier} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Annotation row */}
      <div className="border-t border-border/40 px-4 py-2 flex items-center gap-2 flex-wrap">
        <Button
          size="sm"
          variant={annotation.verdict === "pursue" ? "default" : "outline"}
          className="h-6 text-[10px] px-2 py-0"
          onClick={() => handleAnnotate("pursue")}
        >
          Pursue
        </Button>
        <Button
          size="sm"
          variant={annotation.verdict === "not_viable" ? "destructive" : "outline"}
          className="h-6 text-[10px] px-2 py-0"
          onClick={() => handleAnnotate("not_viable")}
        >
          Not Viable
        </Button>
        {!showNoteInput && (
          <button
            className="text-[10px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline transition-colors ml-auto"
            onClick={() => setShowNoteInput(true)}
          >
            {annotation.note ? `Note: ${annotation.note.slice(0, 20)}…` : "+ Add note"}
          </button>
        )}
        {showNoteInput && (
          <div className="flex items-center gap-1 ml-auto flex-1 min-w-0">
            <input
              className="flex-1 text-[10px] border border-border/60 rounded px-2 py-0.5 bg-background text-foreground outline-none focus:ring-1 focus:ring-primary/40 min-w-0"
              placeholder="Your annotation…"
              value={noteInput}
              onChange={e => setNoteInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleNoteSubmit()}
              autoFocus
            />
            <button
              className="text-[9px] font-bold text-primary hover:opacity-80"
              onClick={handleNoteSubmit}
            >
              Save
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function WowCardGrid({ cards, modeAccent }: WowCardGridProps) {
  if (cards.length === 0) return null;

  // Deduplicate morphological cards: if two cards share the same title (case-insensitive)
  // and are within 5% composite score of each other, collapse them into one card and
  // show a "N variants" badge.
  const deduplicatedCards = deduplicateCards(cards);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-3"
    >
      {/* Section header */}
      <div className="flex items-center gap-2">
        <div className="w-1 h-4 rounded-full" style={{ background: modeAccent }} />
        <h2 className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">
          Radical Opportunities
        </h2>
        <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">
          {deduplicatedCards.length}
        </Badge>
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {deduplicatedCards.map((entry, index) => (
          <WowCardItem
            key={entry.card.id}
            card={entry.card}
            modeAccent={modeAccent}
            index={index}
            variantCount={entry.variantCount}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ── Deduplication logic ──────────────────────────────────────────────────────

interface DeduplicatedCard {
  card: WowCard;
  variantCount: number;
}

/**
 * Collapse cards with identical titles (morphological duplicates) or
 * SCAMPER cards with the same mutationType (near-identical lens applied to
 * different theses) into one representative card per group.
 *
 * Design note on asymmetry:
 *   - Morphological cards: deduplicated by exact (lowercased) title because
 *     identical delivery+pricing combos generate identical titles regardless
 *     of which evidence drove them.
 *   - SCAMPER cards: deduplicated by mutationType (Substitute, Reverse, etc.)
 *     because each SCAMPER lens is applied to the top 3 opportunities, producing
 *     3 near-identical "Reverse: Invert customer flow in [thesis]" cards that
 *     differ only in which thesis they reference. Grouping by lens type makes
 *     the output read as one "Reverse" idea, not three.
 */
function deduplicateCards(cards: WowCard[]): DeduplicatedCard[] {
  const seen = new Map<string, DeduplicatedCard>();

  for (const card of cards) {
    // Dedup key: for SCAMPER cards, group by mutationType so "Reverse" applied to
    // 3 different theses becomes one card. For morphological, group by exact title.
    const dedupKey = card.innovationMethod === "scamper" && card.mutationType
      ? `scamper::${card.mutationType}`
      : `title::${card.title.toLowerCase().trim()}`;

    const existing = seen.get(dedupKey);
    if (existing) {
      existing.variantCount += 1;
    } else {
      seen.set(dedupKey, { card, variantCount: 1 });
    }
  }

  return Array.from(seen.values());
}
