/**
 * IntelligenceFeed — Tier 2: Single scrollable feed replacing the 3-tab system
 * Now consumes DeepenedOpportunity thesis format alongside legacy cards.
 * Cards are tagged (New Idea / Execution / Iterate) and sorted by impact.
 */

import { memo, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lightbulb, Rocket, RefreshCw, ChevronDown, ChevronUp,
  Sparkles, Target, Zap, Brain, AlertTriangle, DollarSign, Play,
} from "lucide-react";
import { humanizeLabel } from "@/lib/humanize";
import type { StrategicNarrative } from "@/lib/strategicEngine";
import type { TransformationPlaybook } from "@/lib/playbookEngine";
import type { DeepenedOpportunity } from "@/lib/reconfiguration";

type FeedTag = "all" | "new-idea" | "execution" | "iterate";

interface FeedCard {
  id: string;
  tag: FeedTag;
  tagLabel: string;
  icon: React.ElementType;
  title: string;
  summary: string;
  detail?: string;
  /** Optional causal chain for thesis cards */
  causalChain?: {
    constraint: string;
    belief: string;
    move: string;
    economics: string;
    firstMove: string;
  };
  accentColor: string;
  priority: number;
}

export interface DetectedPatternForFeed {
  name?: string;
  label?: string;
  description?: string;
  characteristics?: string[];
  commonTransformations?: string[];
  riskFactors?: string[];
}

interface IntelligenceFeedProps {
  narrative: StrategicNarrative | null;
  flatEvidence: Array<any>;
  insights: Array<any>;
  topPlaybook: TransformationPlaybook | null;
  deepenedOpportunities?: DeepenedOpportunity[];
  mode: "product" | "service" | "business";
  modeAccent: string;
  detectedPatterns: DetectedPatternForFeed[];
}

const TAG_CONFIG: Record<Exclude<FeedTag, "all">, { label: string; color: string; bg: string }> = {
  "new-idea": { label: "New Idea", color: "hsl(var(--success))", bg: "hsl(var(--success) / 0.08)" },
  "execution": { label: "Execution", color: "hsl(var(--primary))", bg: "hsl(var(--primary) / 0.06)" },
  "iterate": { label: "Iterate", color: "hsl(var(--warning))", bg: "hsl(var(--warning) / 0.08)" },
};

function buildPatternDescription(p: DetectedPatternForFeed): string {
  const parts: string[] = [];
  if (p.characteristics && p.characteristics.length > 0) {
    parts.push(p.characteristics[0]);
    if (p.characteristics.length > 1) parts.push(p.characteristics[1]);
  }
  if (p.commonTransformations && p.commonTransformations.length > 0) {
    parts.push(`Common transformation paths: ${p.commonTransformations.slice(0, 2).join(", ")}.`);
  }
  if (parts.length > 0) return parts.join(". ");
  if (p.description && p.description.toLowerCase() !== "structural pattern detected in evidence.") {
    return humanizeLabel(p.description);
  }
  return `This analysis matches the ${humanizeLabel(p.name || p.label || "detected")} archetype based on evidence signals.`;
}

function buildPatternDetail(p: DetectedPatternForFeed): string | undefined {
  const parts: string[] = [];
  if (p.riskFactors && p.riskFactors.length > 0) parts.push(`Key risks: ${p.riskFactors.join("; ")}.`);
  if (p.characteristics && p.characteristics.length > 2) parts.push(...p.characteristics.slice(2));
  return parts.length > 0 ? parts.join(" ") : undefined;
}

function buildFeedCards(props: IntelligenceFeedProps): FeedCard[] {
  const { narrative, flatEvidence, insights, topPlaybook, deepenedOpportunities, detectedPatterns } = props;
  const cards: FeedCard[] = [];
  const heroText = narrative?.breakthroughOpportunity || narrative?.primaryConstraint || "";

  // ═══ THESIS CARDS (from deepened opportunities) — replace generic playbook cards ═══
  if (deepenedOpportunities && deepenedOpportunities.length > 0) {
    deepenedOpportunities.forEach((thesis, idx) => {
      cards.push({
        id: `thesis-${idx}`,
        tag: idx === 0 ? "new-idea" : "execution",
        tagLabel: idx === 0 ? "Strategic Thesis" : "Alternative Thesis",
        icon: idx === 0 ? Sparkles : Target,
        title: thesis.reconfigurationLabel,
        summary: `${thesis.strategicBet.contrarianBelief}`,
        causalChain: {
          constraint: thesis.causalChain.constraint,
          belief: thesis.strategicBet.contrarianBelief,
          move: thesis.reconfigurationLabel,
          economics: thesis.economicMechanism.valueCreation,
          firstMove: thesis.firstMove.action,
        },
        accentColor: idx === 0 ? TAG_CONFIG["new-idea"].color : TAG_CONFIG["execution"].color,
        priority: 10 - idx,
      });
    });
  } else if (topPlaybook) {
    // Fallback: use legacy playbook card if no theses available
    cards.push({
      id: "playbook",
      tag: "execution",
      tagLabel: "Execution",
      icon: Target,
      title: topPlaybook.title,
      summary: topPlaybook.strategicThesis,
      detail: `Timeline: ${topPlaybook.impact.executionDifficulty <= 3 ? "1–3 months" : topPlaybook.impact.executionDifficulty <= 5 ? "3–6 months" : "6–18 months"}`,
      accentColor: TAG_CONFIG["execution"].color,
      priority: 9,
    });
  }

  // New Ideas from insights (skip duplicates with thesis cards)
  const thesisTitles = new Set((deepenedOpportunities || []).map(t => t.reconfigurationLabel.toLowerCase()));
  const ideaInsights = insights.filter(i =>
    i.type === "opportunity" || i.type === "leverage_point" || i.type === "disruption_vector"
  );
  ideaInsights.forEach((insight, idx) => {
    const label = insight.label || insight.description || "Opportunity";
    if (heroText && label.slice(0, 40) === heroText.slice(0, 40)) return;
    if (thesisTitles.has(label.toLowerCase())) return;
    cards.push({
      id: `idea-${idx}`,
      tag: "new-idea",
      tagLabel: "New Idea",
      icon: Lightbulb,
      title: humanizeLabel(label),
      summary: humanizeLabel(insight.description || insight.label || ""),
      detail: insight.rationale ? humanizeLabel(insight.rationale) : undefined,
      accentColor: TAG_CONFIG["new-idea"].color,
      priority: insight.confidence ? insight.confidence * 10 : 5,
    });
  });

  // Kill question
  if (narrative?.killQuestion) {
    cards.push({
      id: "kill-question",
      tag: "new-idea",
      tagLabel: "New Idea",
      icon: Sparkles,
      title: "Critical validation question",
      summary: humanizeLabel(narrative.killQuestion),
      detail: narrative.validationExperiment
        ? `Experiment: ${humanizeLabel(narrative.validationExperiment)}. Timeframe: ${narrative.validationTimeframe || "30 days"}.`
        : undefined,
      accentColor: TAG_CONFIG["new-idea"].color,
      priority: 9,
    });
  }

  // Constraint
  if (narrative?.primaryConstraint) {
    cards.push({
      id: "constraint",
      tag: "execution",
      tagLabel: "Execution",
      icon: Zap,
      title: `Address: ${humanizeLabel(narrative.primaryConstraint)}`,
      summary: narrative.verdictRationale
        ? humanizeLabel(narrative.verdictRationale)
        : narrative.narrativeSummary
          ? humanizeLabel(narrative.narrativeSummary)
          : "This is the primary structural constraint limiting growth.",
      accentColor: TAG_CONFIG["execution"].color,
      priority: 8,
    });
  }

  // Patterns
  detectedPatterns.forEach((p, idx) => {
    cards.push({
      id: `pattern-${idx}`,
      tag: "iterate",
      tagLabel: "Iterate",
      icon: Brain,
      title: humanizeLabel(p.label || p.name || "Pattern"),
      summary: buildPatternDescription(p),
      detail: buildPatternDetail(p),
      accentColor: TAG_CONFIG["iterate"].color,
      priority: 4,
    });
  });

  // Trapped value
  if (narrative?.trappedValue) {
    cards.push({
      id: "trapped-value",
      tag: "iterate",
      tagLabel: "Iterate",
      icon: RefreshCw,
      title: "Trapped value identified",
      summary: humanizeLabel(narrative.trappedValue),
      detail: narrative.trappedValueEstimate ? `Estimated: ${narrative.trappedValueEstimate}` : undefined,
      accentColor: TAG_CONFIG["iterate"].color,
      priority: 7,
    });
  }

  return cards.sort((a, b) => b.priority - a.priority);
}

/** Mini causal chain inside a feed card */
function ThesisChainDetail({ chain, accent }: { chain: FeedCard["causalChain"]; accent: string }) {
  if (!chain) return null;
  const steps = [
    { label: "Constraint", value: chain.constraint, icon: AlertTriangle },
    { label: "Belief", value: chain.belief, icon: Lightbulb },
    { label: "Economics", value: chain.economics, icon: DollarSign },
    { label: "First Move", value: chain.firstMove, icon: Play },
  ];
  return (
    <div className="space-y-1.5 pt-2">
      {steps.map((s, i) => (
        <div key={s.label} className="flex items-start gap-2">
          <s.icon size={11} className="text-muted-foreground mt-0.5 flex-shrink-0" />
          <div>
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground">
              {s.label}
            </span>
            <p className="text-xs text-foreground leading-snug">{s.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function FeedCardItem({ card }: { card: FeedCard }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = card.icon;
  const tagConf = TAG_CONFIG[card.tag as Exclude<FeedTag, "all">];
  const hasExpandable = !!(card.detail || card.causalChain);

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-border bg-card overflow-hidden"
    >
      <button
        onClick={() => hasExpandable && setExpanded(!expanded)}
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
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{card.summary}</p>
        </div>
        {hasExpandable && (
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
        {expanded && hasExpandable && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 pt-0 border-t border-border">
              {card.causalChain ? (
                <ThesisChainDetail chain={card.causalChain} accent={card.accentColor} />
              ) : card.detail ? (
                <p className="text-xs text-muted-foreground leading-relaxed pt-2">{card.detail}</p>
              ) : null}
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
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-extrabold uppercase tracking-[0.15em] text-muted-foreground">
          Intelligence Feed
        </h3>
      </div>

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

      <div className="space-y-2">
        {filtered.map(card => (
          <FeedCardItem key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
});
