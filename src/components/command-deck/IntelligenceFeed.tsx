/**
 * IntelligenceFeed — Tier 2: Single scrollable feed replacing the 3-tab system
 * Cards are tagged (New Idea / Execution / Iterate) and sorted by impact.
 * Users filter by tag. Each card expands inline.
 */

import { memo, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lightbulb, Rocket, RefreshCw, ChevronDown, ChevronUp,
  Sparkles, Target, Zap, Brain,
} from "lucide-react";
import { humanizeLabel } from "@/lib/humanize";
import type { StrategicNarrative } from "@/lib/strategicEngine";
import type { TransformationPlaybook } from "@/lib/playbookEngine";

type FeedTag = "all" | "new-idea" | "execution" | "iterate";

interface FeedCard {
  id: string;
  tag: FeedTag;
  tagLabel: string;
  icon: React.ElementType;
  title: string;
  summary: string;
  detail?: string;
  accentColor: string;
  priority: number; // higher = shows first
}

interface IntelligenceFeedProps {
  narrative: StrategicNarrative | null;
  flatEvidence: Array<any>;
  insights: Array<any>;
  topPlaybook: TransformationPlaybook | null;
  mode: "product" | "service" | "business";
  modeAccent: string;
  detectedPatterns: Array<{ name?: string; label?: string; description?: string }>;
}

const TAG_CONFIG: Record<Exclude<FeedTag, "all">, { label: string; color: string; bg: string }> = {
  "new-idea": { label: "New Idea", color: "hsl(var(--success))", bg: "hsl(var(--success) / 0.08)" },
  "execution": { label: "Execution", color: "hsl(var(--primary))", bg: "hsl(var(--primary) / 0.06)" },
  "iterate": { label: "Iterate", color: "hsl(var(--warning))", bg: "hsl(var(--warning) / 0.08)" },
};

function buildFeedCards(props: IntelligenceFeedProps): FeedCard[] {
  const { narrative, flatEvidence, insights, topPlaybook, detectedPatterns } = props;
  const cards: FeedCard[] = [];

  // New Ideas: from insights with type opportunity/leverage_point
  const ideaInsights = insights.filter(i =>
    i.type === "opportunity" || i.type === "leverage_point" || i.type === "disruption_vector"
  );
  ideaInsights.forEach((insight, idx) => {
    cards.push({
      id: `idea-${idx}`,
      tag: "new-idea",
      tagLabel: "New Idea",
      icon: Lightbulb,
      title: humanizeLabel(insight.label || insight.description || "Opportunity"),
      summary: humanizeLabel(insight.description || insight.label || ""),
      detail: insight.rationale ? humanizeLabel(insight.rationale) : undefined,
      accentColor: TAG_CONFIG["new-idea"].color,
      priority: insight.confidence ? insight.confidence * 10 : 5,
    });
  });

  // Breakthrough opportunity as top new idea
  if (narrative?.breakthroughOpportunity) {
    cards.push({
      id: "breakthrough",
      tag: "new-idea",
      tagLabel: "New Idea",
      icon: Sparkles,
      title: humanizeLabel(narrative.breakthroughOpportunity),
      summary: narrative.strategicVerdict ? humanizeLabel(narrative.strategicVerdict) : "Strategic breakthrough identified by the reasoning engine.",
      accentColor: TAG_CONFIG["new-idea"].color,
      priority: 10,
    });
  }

  // Execution: top playbook
  if (topPlaybook) {
    cards.push({
      id: "playbook",
      tag: "execution",
      tagLabel: "Execution",
      icon: Target,
      title: topPlaybook.title,
      summary: topPlaybook.thesis,
      detail: `Timeline: ${topPlaybook.impact.executionDifficulty <= 3 ? "1–3 months" : topPlaybook.impact.executionDifficulty <= 5 ? "3–6 months" : "6–18 months"}`,
      accentColor: TAG_CONFIG["execution"].color,
      priority: 9,
    });
  }

  // Execution: constraint to address
  if (narrative?.primaryConstraint) {
    cards.push({
      id: "constraint",
      tag: "execution",
      tagLabel: "Execution",
      icon: Zap,
      title: `Address: ${humanizeLabel(narrative.primaryConstraint)}`,
      summary: narrative.narrativeSummary ? humanizeLabel(narrative.narrativeSummary) : "This is the primary structural constraint limiting growth.",
      accentColor: TAG_CONFIG["execution"].color,
      priority: 8,
    });
  }

  // Iterate: patterns detected
  detectedPatterns.forEach((p, idx) => {
    cards.push({
      id: `pattern-${idx}`,
      tag: "iterate",
      tagLabel: "Iterate",
      icon: Brain,
      title: humanizeLabel(p.label || p.name || "Pattern"),
      summary: humanizeLabel(p.description || "Structural pattern detected in evidence."),
      accentColor: TAG_CONFIG["iterate"].color,
      priority: 4,
    });
  });

  // Iterate: trapped value
  if (narrative?.trappedValue) {
    cards.push({
      id: "trapped-value",
      tag: "iterate",
      tagLabel: "Iterate",
      icon: RefreshCw,
      title: "Trapped Value Identified",
      summary: humanizeLabel(narrative.trappedValue),
      detail: narrative.trappedValueEstimate ? `Estimated: ${narrative.trappedValueEstimate}` : undefined,
      accentColor: TAG_CONFIG["iterate"].color,
      priority: 7,
    });
  }

  // Sort by priority descending
  return cards.sort((a, b) => b.priority - a.priority);
}

function FeedCardItem({ card }: { card: FeedCard }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = card.icon;
  const tagConf = TAG_CONFIG[card.tag as Exclude<FeedTag, "all">];

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-border bg-card overflow-hidden"
    >
      <button
        onClick={() => card.detail && setExpanded(!expanded)}
        className="w-full text-left px-4 py-3 flex items-start gap-3"
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: tagConf.bg }}
        >
          <Icon size={14} style={{ color: tagConf.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[9px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded"
              style={{ background: tagConf.bg, color: tagConf.color }}
            >
              {card.tagLabel}
            </span>
          </div>
          <p className="text-sm font-bold text-foreground leading-snug">{card.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{card.summary}</p>
        </div>
        {card.detail && (
          <div className="flex-shrink-0 mt-1">
            {expanded ? (
              <ChevronUp size={14} className="text-muted-foreground" />
            ) : (
              <ChevronDown size={14} className="text-muted-foreground" />
            )}
          </div>
        )}
      </button>
      <AnimatePresence>
        {expanded && card.detail && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 pt-0 border-t border-border">
              <p className="text-xs text-muted-foreground leading-relaxed pt-2">{card.detail}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export const IntelligenceFeed = memo(function IntelligenceFeed(props: IntelligenceFeedProps) {
  const allCards = useMemo(() => buildFeedCards(props), [props]);
  const [activeTag, setActiveTag] = useState<FeedTag>("all");

  const filtered = useMemo(() => {
    if (activeTag === "all") return allCards;
    return allCards.filter(c => c.tag === activeTag);
  }, [allCards, activeTag]);

  const tagCounts = useMemo(() => ({
    all: allCards.length,
    "new-idea": allCards.filter(c => c.tag === "new-idea").length,
    execution: allCards.filter(c => c.tag === "execution").length,
    iterate: allCards.filter(c => c.tag === "iterate").length,
  }), [allCards]);

  if (allCards.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card px-6 py-8 text-center">
        <p className="text-sm text-muted-foreground">
          Complete analysis steps to populate your intelligence feed.
        </p>
      </div>
    );
  }

  const tags: { key: FeedTag; label: string }[] = [
    { key: "all", label: `All (${tagCounts.all})` },
    { key: "new-idea", label: `New Ideas (${tagCounts["new-idea"]})` },
    { key: "execution", label: `Execution (${tagCounts.execution})` },
    { key: "iterate", label: `Iterate (${tagCounts.iterate})` },
  ];

  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-extrabold uppercase tracking-[0.15em] text-muted-foreground">
          Intelligence Feed
        </h3>
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {tags.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTag(t.key)}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
              activeTag === t.key
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="space-y-2">
        {filtered.map(card => (
          <FeedCardItem key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
});
