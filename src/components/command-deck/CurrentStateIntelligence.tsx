/**
 * CurrentStateIntelligence — Distilled SWOT-style insight bullets
 *
 * Extracts 10-15 key insights from ALL available data and presents them
 * in dense, scannable category groups. No truncation, no filler words.
 */

import { memo, useMemo } from "react";
import {
  CheckCircle, AlertTriangle, Zap, TrendingUp, Lock,
} from "lucide-react";
import { humanizeLabel } from "@/lib/humanize";
import type { StrategicNarrative } from "@/lib/strategicEngine";

interface ProductData {
  name?: string;
  keyInsight?: string;
  description?: string;
  pricingIntel?: any;
  supplyChain?: any;
  communityInsights?: any;
  customerSentiment?: any;
  userJourney?: any;
  userWorkflow?: any;
  trendAnalysis?: string;
  marketSizeEstimate?: string;
  [key: string]: any;
}

interface CurrentStateIntelligenceProps {
  product: ProductData | null;
  businessData: Record<string, any> | null;
  narrative: StrategicNarrative | null;
  governedData: Record<string, any> | null;
  flatEvidence: Array<{ label?: string; description?: string; category?: string; impact?: number; type?: string }>;
  detectedPatterns: Array<{ label: string; description?: string }>;
}

interface InsightBullet {
  text: string;
  category: string;
}

function extractBullets(props: CurrentStateIntelligenceProps): Record<string, InsightBullet[]> {
  const { product, businessData, narrative, governedData, flatEvidence, detectedPatterns } = props;
  const p = product || {};
  const biz = businessData || {};
  const governed = governedData || (biz as any)?.governed || {};

  const groups: Record<string, InsightBullet[]> = {
    working: [],
    complaints: [],
    friction: [],
    patterns: [],
    constraints: [],
  };

  // ── What's Working ──
  if (narrative?.breakthroughOpportunity) {
    groups.working.push({ text: humanizeLabel(narrative.breakthroughOpportunity), category: "working" });
  }
  if (narrative?.strategicPathway) {
    groups.working.push({ text: humanizeLabel(narrative.strategicPathway), category: "working" });
  }
  // Positive pricing signals
  const pi = p.pricingIntel || (biz as any)?.pricingIntel || (biz as any)?.pricing;
  if (pi?.marginEstimate || pi?.margins) {
    const m = pi.marginEstimate || pi.margins;
    groups.working.push({ text: `Margin profile: ${typeof m === "string" ? m : String(m)}`, category: "working" });
  }
  if (pi?.priceRange) {
    groups.working.push({ text: `Price range: ${pi.priceRange}`, category: "working" });
  }

  // ── Top Complaints ──
  const ci = p.communityInsights || p.customerSentiment || (biz as any)?.communityInsights || (biz as any)?.customerSentiment;
  if (ci) {
    const complaints = ci.topComplaints || [];
    complaints.slice(0, 3).forEach((c: any) => {
      const text = typeof c === "string" ? c : c.text || c.label || "";
      if (text) groups.complaints.push({ text: humanizeLabel(text), category: "complaints" });
    });
    const requests = ci.improvementRequests || ci.marketGaps || [];
    requests.slice(0, 2).forEach((r: any) => {
      const text = typeof r === "string" ? r : r.text || r.label || "";
      if (text && groups.complaints.length < 4) groups.complaints.push({ text: humanizeLabel(text), category: "complaints" });
    });
    // Sentiment headline
    const sentiment = ci.communitySentiment || ci.redditSentiment;
    if (sentiment && !/no direct.*found|not found/i.test(sentiment) && groups.complaints.length < 4) {
      groups.complaints.unshift({ text: humanizeLabel(sentiment), category: "complaints" });
    }
  }

  // ── Journey Friction ──
  const uj = p.userJourney || p.userWorkflow || (biz as any)?.userJourney;
  if (uj) {
    const fps = uj.frictionPoints || [];
    fps.slice(0, 3).forEach((fp: any) => {
      const text = typeof fp === "string" ? fp : fp.friction || fp.text || fp.label;
      if (text) groups.friction.push({ text: humanizeLabel(text), category: "friction" });
    });
    if (uj.cognitiveLoad && groups.friction.length < 4) {
      groups.friction.push({ text: `Cognitive load: ${humanizeLabel(uj.cognitiveLoad)}`, category: "friction" });
    }
  }
  // Friction from governed tiers
  const ft = governed?.friction_tiers;
  if (ft?.tier_1?.length > 0) {
    ft.tier_1.slice(0, 2).forEach((f: any) => {
      const label = typeof f === "string" ? f : f.label || f.name;
      if (label && groups.friction.length < 4 && !groups.friction.some(b => b.text === humanizeLabel(label))) {
        groups.friction.push({ text: humanizeLabel(label), category: "friction" });
      }
    });
  }

  // ── Emerging Patterns ──
  detectedPatterns.slice(0, 3).forEach(pat => {
    groups.patterns.push({ text: humanizeLabel(pat.label), category: "patterns" });
  });
  // Evidence clusters as patterns
  if (groups.patterns.length < 2) {
    const categoryCounts = new Map<string, number>();
    for (const e of flatEvidence) {
      const cat = (e.category || "general").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
      categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
    }
    const strongClusters = [...categoryCounts.entries()].filter(([, c]) => c >= 3).sort((a, b) => b[1] - a[1]);
    strongClusters.slice(0, 2).forEach(([cat, count]) => {
      if (groups.patterns.length < 4) {
        groups.patterns.push({ text: `${cat}: ${count} converging signals detected`, category: "patterns" });
      }
    });
  }

  // ── Top Constraints ──
  if (narrative?.primaryConstraint) {
    groups.constraints.push({ text: humanizeLabel(narrative.primaryConstraint), category: "constraints" });
  }
  const cm = governed?.constraint_map;
  if (cm?.binding_constraint?.label) {
    const label = humanizeLabel(cm.binding_constraint.label);
    if (!groups.constraints.some(b => b.text === label)) {
      groups.constraints.push({ text: label, category: "constraints" });
    }
  }
  const chains = cm?.causal_chains || [];
  chains.slice(0, 2).forEach((c: any) => {
    if (c.constraint_label && groups.constraints.length < 4) {
      const label = humanizeLabel(c.constraint_label);
      if (!groups.constraints.some(b => b.text === label)) {
        groups.constraints.push({ text: label, category: "constraints" });
      }
    }
  });
  // Trapped value as a constraint signal
  if (narrative?.trappedValue && groups.constraints.length < 4) {
    groups.constraints.push({ text: humanizeLabel(narrative.trappedValue), category: "constraints" });
  }

  // Cap each group at 4
  for (const key of Object.keys(groups)) {
    groups[key] = groups[key].slice(0, 4);
  }

  return groups;
}

const CATEGORY_CONFIG = {
  working: {
    label: "What's Working",
    icon: CheckCircle,
    dotColor: "hsl(var(--success))",
  },
  complaints: {
    label: "Top Complaints",
    icon: AlertTriangle,
    dotColor: "hsl(var(--warning))",
  },
  friction: {
    label: "Journey Friction",
    icon: Zap,
    dotColor: "hsl(var(--destructive))",
  },
  patterns: {
    label: "Emerging Patterns",
    icon: TrendingUp,
    dotColor: "hsl(var(--primary))",
  },
  constraints: {
    label: "Top Constraints",
    icon: Lock,
    dotColor: "hsl(var(--destructive))",
  },
} as const;

function CategoryGroup({ groupKey, bullets }: { groupKey: keyof typeof CATEGORY_CONFIG; bullets: InsightBullet[] }) {
  if (bullets.length === 0) return null;
  const config = CATEGORY_CONFIG[groupKey];
  const Icon = config.icon;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Icon size={13} style={{ color: config.dotColor }} className="flex-shrink-0" />
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
          {config.label}
        </span>
      </div>
      <div className="space-y-1 pl-5">
        {bullets.map((b, i) => (
          <div key={i} className="flex items-start gap-2">
            <div
              className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
              style={{ background: config.dotColor }}
            />
            <p className="text-[12px] text-foreground leading-snug">{b.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export const CurrentStateIntelligence = memo(function CurrentStateIntelligence(props: CurrentStateIntelligenceProps) {
  const groups = useMemo(() => extractBullets(props), [props]);

  const totalBullets = Object.values(groups).reduce((s, arr) => s + arr.length, 0);
  if (totalBullets === 0) return null;

  const categoryKeys = Object.keys(CATEGORY_CONFIG) as (keyof typeof CATEGORY_CONFIG)[];
  // Split into two columns for layout
  const leftKeys = categoryKeys.filter((_, i) => i % 2 === 0);
  const rightKeys = categoryKeys.filter((_, i) => i % 2 !== 0);

  return (
    <div
      className="rounded-xl p-4 sm:p-5"
      style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: "hsl(var(--primary) / 0.08)" }}
        >
          <Zap size={14} className="text-primary" />
        </div>
        <h2 className="text-xs font-extrabold uppercase tracking-widest text-foreground">
          Current State Intelligence
        </h2>
        <span className="text-[10px] font-bold text-muted-foreground">
          {totalBullets} key findings
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <div className="space-y-4">
          {leftKeys.map(k => (
            <CategoryGroup key={k} groupKey={k} bullets={groups[k]} />
          ))}
        </div>
        <div className="space-y-4">
          {rightKeys.map(k => (
            <CategoryGroup key={k} groupKey={k} bullets={groups[k]} />
          ))}
        </div>
      </div>
    </div>
  );
});
