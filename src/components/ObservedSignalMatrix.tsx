import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChevronDown, StickyNote, Sparkles, ShieldCheck, Eye, AlertTriangle, TrendingUp, X, Info } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import type { Product } from "@/data/mockProducts";

/* ── Types ── */

type Signal = {
  id: string;
  label: string;
  score: number;
  frequency: number;
  journey_stage?: string;
  segments?: string[];
  quotes?: string[];
  related_signals?: string[];
  why?: string; // plain-english reason this signal matters
};

type QuadrantKey = string;
type MatrixData = Record<QuadrantKey, Signal[]>;

type UserSignalState = {
  attention_level: "high_concentration" | "structural_review" | "monitor" | null;
  note_text: string;
};
type PersistedState = Record<string, UserSignalState>;

/* ── Quadrant Definition ── */

interface QuadrantDef {
  key: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  dotColor: string;
  barColor: string;
  bgTint: string;
  explanation: string;
  /** Priority for slot selection — higher = more likely to be shown */
  priority: number;
  /** Extract signals from product data */
  extract: (product: Product, mkId: () => string) => Signal[];
}

/* ── All possible quadrant types ── */

const QUADRANT_POOL: QuadrantDef[] = [
  {
    key: "strengths",
    title: "What's Working",
    subtitle: "Strongest positive signals",
    icon: ShieldCheck,
    dotColor: "bg-green-500",
    barColor: "bg-green-500",
    bgTint: "bg-green-50/60 dark:bg-green-950/20",
    explanation: "These are the things people genuinely like. High scores mean more people mentioned it positively or it showed up as a clear advantage.",
    priority: 100, // always try to show
    extract: (product, mkId) => {
      const signals: Signal[] = [];
      const ci = (product as any).communityInsights;
      const cs = product.confidenceScores;
      if (product.keyInsight) {
        const text = humanize(product.keyInsight);
        if (text) signals.push({ id: mkId(), label: text, score: 8, frequency: 1, why: "This is the single most important positive finding from the analysis." });
      }
      if (product.reviews?.length) {
        product.reviews.filter((r: any) => r.sentiment === "positive").forEach((r: any) => {
          const text = humanize(r.text || "");
          if (text) signals.push({ id: mkId(), label: text, score: 7, frequency: 1, why: "Found in positive user reviews — real people said this." });
        });
      }
      if (cs) {
        if ((cs.adoptionLikelihood ?? 0) >= 8)
          signals.push({ id: mkId(), label: `High adoption likelihood (${cs.adoptionLikelihood}/10)`, score: cs.adoptionLikelihood ?? 8, frequency: 1, why: "Based on how likely people are to start using this product." });
        if ((cs.emotionalResonance ?? 0) >= 8)
          signals.push({ id: mkId(), label: `Strong emotional connection (${cs.emotionalResonance}/10)`, score: cs.emotionalResonance ?? 8, frequency: 1, why: "Measures how much this product resonates emotionally with its audience." });
      }
      // Nostalgia triggers as strengths
      if (ci?.nostalgiaTriggers?.length) {
        ci.nostalgiaTriggers.forEach((t: string) => {
          const text = humanize(t);
          if (text) signals.push({ id: mkId(), label: text, score: 6, frequency: 1, why: "An emotional hook or loyalty driver from the community." });
        });
      }
      return signals;
    },
  },
  {
    key: "complaints",
    title: "Top Complaints",
    subtitle: "Most common pain points",
    icon: AlertTriangle,
    dotColor: "bg-red-500",
    barColor: "bg-red-500",
    bgTint: "bg-red-50/60 dark:bg-red-950/20",
    explanation: "These are the most frequently mentioned frustrations from real users. Higher scores indicate more people raised this same issue.",
    priority: 90, // always try to show
    extract: (product, mkId) => {
      const signals: Signal[] = [];
      const ci = (product as any).communityInsights;
      if (ci?.topComplaints?.length) {
        ci.topComplaints.forEach((c: string) => {
          const text = humanize(c);
          if (text) signals.push({ id: mkId(), label: text, score: 6, frequency: 1, why: "Surfaced from community discussions and user feedback." });
        });
      }
      if (ci?.competitorComplaints?.length) {
        ci.competitorComplaints.forEach((c: string) => {
          const text = humanize(c);
          if (text && !signals.some(s => s.label === text))
            signals.push({ id: mkId(), label: text, score: 5, frequency: 1, why: "What users say is wrong with competing alternatives." });
        });
      }
      if (product.reviews?.length) {
        product.reviews.filter((r: any) => r.sentiment === "negative").forEach((r: any) => {
          const text = humanize(r.text || "");
          if (text && !signals.some(s => s.label === text))
            signals.push({ id: mkId(), label: text, score: 5, frequency: 1, why: "From negative user reviews — a real frustration people expressed." });
        });
      }
      return signals;
    },
  },
  {
    key: "friction",
    title: "Friction in the Journey",
    subtitle: "Where users get stuck or drop off",
    icon: Eye,
    dotColor: "bg-amber-500",
    barColor: "bg-amber-500",
    bgTint: "bg-amber-50/60 dark:bg-amber-950/20",
    explanation: "These are moments in the user experience where people slow down, get confused, or leave. Pulled from the user journey analysis and workflow data.",
    priority: 80,
    extract: (product, mkId) => {
      const signals: Signal[] = [];
      const seen = new Set<string>();
      const uw = (product as any).userWorkflow;
      const oi = (product as any).operationalIntel;
      const ci = (product as any).communityInsights;

      // userWorkflow.frictionPoints
      if (uw?.frictionPoints?.length) {
        uw.frictionPoints.forEach((fp: any) => {
          const raw = typeof fp === "string" ? fp : fp.friction || fp.description || fp.label || fp.point || "";
          const text = humanize(raw);
          if (text && !seen.has(text.toLowerCase())) {
            seen.add(text.toLowerCase());
            const severity = typeof fp === "object" ? fp.severity : undefined;
            const severityScore = severity === "high" ? 8 : severity === "medium" ? 6 : 5;
            signals.push({
              id: mkId(), label: text, score: severityScore, frequency: 1,
              journey_stage: typeof fp === "object" ? (fp.stage || (fp.stepIndex !== undefined ? `Step ${fp.stepIndex + 1}` : undefined)) : undefined,
              why: typeof fp === "object" && fp.rootCause ? `Root cause: ${humanize(fp.rootCause)}` : "Identified as a point where users slow down or get stuck in their journey.",
            });
          }
        });
      }

      // userWorkflow.steps with friction
      if (uw?.steps?.length) {
        uw.steps.forEach((step: any) => {
          if (step.friction) {
            const text = humanize(step.friction);
            if (text && !seen.has(text.toLowerCase())) {
              seen.add(text.toLowerCase());
              signals.push({
                id: mkId(), label: text, score: 5, frequency: 1,
                journey_stage: step.label || step.name,
                why: step.rootCause ? `Root cause: ${humanize(step.rootCause)}` : "Friction detected at this step in the user journey.",
              });
            }
          }
        });
      }

      // communityInsights.painPoints
      if (ci?.painPoints?.length) {
        ci.painPoints.forEach((p: string) => {
          const text = humanize(p);
          if (text && !seen.has(text.toLowerCase())) {
            seen.add(text.toLowerCase());
            signals.push({ id: mkId(), label: text, score: 5, frequency: 1, why: "Mentioned as a pain point by the community." });
          }
        });
      }

      // operationalIntel.customerJourneyFriction (service mode)
      if (oi?.customerJourneyFriction?.length) {
        oi.customerJourneyFriction.forEach((f: string) => {
          const text = humanize(f);
          if (text && !seen.has(text.toLowerCase())) {
            seen.add(text.toLowerCase());
            signals.push({ id: mkId(), label: text, score: 6, frequency: 1, why: "Customer journey friction point from service analysis." });
          }
        });
      }

      // Fallback: negative reviews with UX keywords
      if (signals.length === 0 && product.reviews?.length) {
        const uxKeywords = /confus|difficult|slow|complicated|hard to|frustrat|broken|bug|crash|stuck|wait|load/i;
        product.reviews.filter((r: any) => r.sentiment === "negative" && uxKeywords.test(r.text || "")).slice(0, 3).forEach((r: any) => {
          const text = humanize(r.text || "");
          if (text && !seen.has(text.toLowerCase())) {
            seen.add(text.toLowerCase());
            signals.push({ id: mkId(), label: text, score: 4, frequency: 1, why: "Derived from user review describing a frustrating experience." });
          }
        });
      }

      return signals;
    },
  },
  {
    key: "opportunities",
    title: "Emerging Patterns",
    subtitle: "Signals worth watching",
    icon: TrendingUp,
    dotColor: "bg-blue-500",
    barColor: "bg-blue-500",
    bgTint: "bg-blue-50/60 dark:bg-blue-950/20",
    explanation: "These are improvement requests, unmet needs, or growing trends that could become opportunities. They're not yet problems — they're openings.",
    priority: 70,
    extract: (product, mkId) => {
      const signals: Signal[] = [];
      const ci = (product as any).communityInsights;
      if (ci?.improvementRequests?.length) {
        ci.improvementRequests.forEach((r: string) => {
          const text = humanize(r);
          if (text) signals.push({ id: mkId(), label: text, score: 5, frequency: 1, why: "Users specifically requested this improvement." });
        });
      }
      // Social signals with upward trends
      const ss = (product as any).socialSignals;
      if (Array.isArray(ss)) {
        ss.filter((s: any) => s.trend === "up").forEach((s: any) => {
          const text = humanize(`${s.platform}: ${s.signal} (${s.volume})`);
          if (text) signals.push({ id: mkId(), label: text, score: 5, frequency: 1, why: "Social signal showing upward momentum." });
        });
      }
      return signals;
    },
  },
  {
    key: "competitive_gaps",
    title: "Competitive Gaps",
    subtitle: "Where rivals fall short",
    icon: AlertTriangle,
    dotColor: "bg-purple-500",
    barColor: "bg-purple-500",
    bgTint: "bg-purple-50/60 dark:bg-purple-950/20",
    explanation: "Market gaps and weaknesses in current competitors. These are openings that could be exploited for differentiation.",
    priority: 60,
    extract: (product, mkId) => {
      const signals: Signal[] = [];
      const ca = (product as any).competitorAnalysis;
      if (ca?.gaps?.length) {
        ca.gaps.forEach((g: string) => {
          const text = humanize(g);
          if (text) signals.push({ id: mkId(), label: text, score: 6, frequency: 1, why: "A specific gap in the current competitive landscape." });
        });
      }
      if (ca?.differentiationOpportunity) {
        const text = humanize(ca.differentiationOpportunity);
        if (text) signals.push({ id: mkId(), label: text, score: 7, frequency: 1, why: "The strongest angle to differentiate from existing competitors." });
      }
      return signals;
    },
  },
  {
    key: "operational_bottlenecks",
    title: "Operational Bottlenecks",
    subtitle: "What limits scale and efficiency",
    icon: Eye,
    dotColor: "bg-orange-500",
    barColor: "bg-orange-500",
    bgTint: "bg-orange-50/60 dark:bg-orange-950/20",
    explanation: "Structural bottlenecks in how the service or business operates. These constrain growth and create inefficiency.",
    priority: 65,
    extract: (product, mkId) => {
      const signals: Signal[] = [];
      const oi = (product as any).operationalIntel;
      if (oi?.operationalBottlenecks?.length) {
        oi.operationalBottlenecks.forEach((b: string) => {
          const text = humanize(b);
          if (text) signals.push({ id: mkId(), label: text, score: 7, frequency: 1, why: "An operational bottleneck that limits scale." });
        });
      }
      if (oi?.scalingChallenges) {
        const text = humanize(oi.scalingChallenges);
        if (text) signals.push({ id: mkId(), label: text, score: 6, frequency: 1, why: "The primary challenge preventing 10x growth." });
      }
      if (oi?.automationOpportunities?.length) {
        oi.automationOpportunities.forEach((a: string) => {
          const text = humanize(a);
          if (text) signals.push({ id: mkId(), label: text, score: 5, frequency: 1, why: "An area where automation could remove manual overhead." });
        });
      }
      return signals;
    },
  },
  {
    key: "pricing_signals",
    title: "Pricing Intelligence",
    subtitle: "Market price dynamics and margins",
    icon: TrendingUp,
    dotColor: "bg-emerald-500",
    barColor: "bg-emerald-500",
    bgTint: "bg-emerald-50/60 dark:bg-emerald-950/20",
    explanation: "Key pricing signals including market rates, margin data, and price direction trends from verified and modeled sources.",
    priority: 50,
    extract: (product, mkId) => {
      const signals: Signal[] = [];
      const pi = (product as any).pricingIntel;
      if (!pi) return signals;
      if (pi.currentMarketPrice) {
        const label = `Market price: ${pi.currentMarketPrice}`;
        if (label.length >= 5) signals.push({ id: mkId(), label, score: 7, frequency: 1, why: `Current market pricing ${pi.currentMarketPriceDataLabel || ""}`.trim() });
      }
      if (pi.margins) {
        const text = humanize(pi.margins);
        if (text) signals.push({ id: mkId(), label: `Margins: ${text}`, score: 6, frequency: 1, why: `Margin estimate ${pi.marginsDataLabel || ""}`.trim() });
      }
      if (pi.priceDirection) {
        const dir = pi.priceDirection === "rising" ? "↑ Prices rising" : pi.priceDirection === "falling" ? "↓ Prices falling" : "→ Prices stable";
        signals.push({ id: mkId(), label: dir, score: 5, frequency: 1, why: "Price direction trend in this market." });
      }
      if (pi.collectorPremium) {
        const text = humanize(pi.collectorPremium);
        if (text) signals.push({ id: mkId(), label: text, score: 5, frequency: 1, why: "Premium tier pricing data." });
      }
      return signals;
    },
  },
  {
    key: "supply_chain",
    title: "Supply Chain Intel",
    subtitle: "Sourcing, manufacturing, distribution",
    icon: ShieldCheck,
    dotColor: "bg-teal-500",
    barColor: "bg-teal-500",
    bgTint: "bg-teal-50/60 dark:bg-teal-950/20",
    explanation: "Intelligence on suppliers, manufacturers, distributors and retailers. Shows the supply network structure.",
    priority: 40,
    extract: (product, mkId) => {
      const signals: Signal[] = [];
      const sc = (product as any).supplyChain;
      if (!sc) return signals;
      const categories = [
        { key: "suppliers", label: "Supplier", why: "Identified supplier in the supply chain." },
        { key: "manufacturers", label: "Manufacturer", why: "Known manufacturer for this product category." },
        { key: "distributors", label: "Distributor", why: "Distribution channel identified." },
      ];
      for (const cat of categories) {
        const items = sc[cat.key];
        if (Array.isArray(items)) {
          items.forEach((item: any) => {
            const name = item.name || item.label || "";
            const region = item.region ? ` (${item.region})` : "";
            const text = `${cat.label}: ${name}${region}`;
            if (name) signals.push({ id: mkId(), label: text, score: 5, frequency: 1, why: cat.why });
          });
        }
      }
      return signals;
    },
  },
];

/* ── Adaptive Quadrant Selection ── */

interface ActiveQuadrant {
  key: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  dotColor: string;
  barColor: string;
  bgTint: string;
  explanation: string;
}

function selectQuadrants(product: Product): { quadrants: ActiveQuadrant[]; data: MatrixData } {
  let idCounter = 0;
  const mkId = () => `sig-${idCounter++}`;

  // Run all extractors
  const results: Array<{ def: QuadrantDef; signals: Signal[] }> = [];
  for (const def of QUADRANT_POOL) {
    const signals = def.extract(product, mkId).filter(s => s.label.length >= 5);
    results.push({ def, signals });
  }

  // Sort by: has signals first, then by priority, then by signal count
  results.sort((a, b) => {
    const aHas = a.signals.length > 0 ? 1 : 0;
    const bHas = b.signals.length > 0 ? 1 : 0;
    if (bHas !== aHas) return bHas - aHas;
    if (b.def.priority !== a.def.priority) return b.def.priority - a.def.priority;
    return b.signals.length - a.signals.length;
  });

  // Pick top 4
  const selected = results.slice(0, 4);

  const quadrants: ActiveQuadrant[] = selected.map(s => ({
    key: s.def.key,
    title: s.def.title,
    subtitle: s.def.subtitle,
    icon: s.def.icon,
    dotColor: s.def.dotColor,
    barColor: s.def.barColor,
    bgTint: s.def.bgTint,
    explanation: s.def.explanation,
  }));

  const data: MatrixData = {};
  for (const s of selected) {
    data[s.def.key] = s.signals;
  }

  return { quadrants, data };
}
const ATTENTION_LEVELS = [
  {
    value: "high_concentration" as const,
    label: "High Priority",
    description: "This signal demands immediate attention — it's concentrated and recurring across multiple sources.",
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    dot: "bg-red-500",
  },
  {
    value: "structural_review" as const,
    label: "Needs Review",
    description: "Worth investigating further — there may be a deeper structural issue causing this pattern.",
    color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  {
    value: "monitor" as const,
    label: "Monitor",
    description: "Not urgent right now, but keep watching — this could grow into something significant over time.",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    dot: "bg-blue-500",
  },
];

/* ── Humanize text: strip code-like fragments ── */

function humanize(raw: string): string {
  if (!raw) return "";
  let text = raw
    .replace(/\{[^}]*\}/g, "")
    .replace(/\[[^\]]*\]/g, "")
    .replace(/[<>{}]/g, "")
    .replace(/\b(null|undefined|true|false|NaN)\b/gi, "")
    .replace(/\b\w+\.\w+\(\)/g, "")
    .replace(/\b\w+_\w+/g, (match) => match.replace(/_/g, " "))  // snake_case → words
    .replace(/([a-z])([A-Z])/g, "$1 $2") // camelCase → words
    .replace(/\s{2,}/g, " ")
    .trim();
  if (text.length > 0) text = text.charAt(0).toUpperCase() + text.slice(1);
  text = text.replace(/[;,]+$/, "").trim();
  // If it still looks like code (has = or => or { ) return empty
  if (/[=>{]/.test(text) || text.length < 5) return "";
  return text;
}

/* ── Main Component ── */

export function ObservedSignalMatrix({
  product,
  analysisId,
  saveStepData,
}: {
  product: Product;
  analysisId: string | null;
  saveStepData: (key: string, data: unknown) => Promise<void>;
}) {
  const { quadrants, data } = useMemo(() => selectQuadrants(product), [product]);
  const totalSignals = Object.values(data).reduce((s, arr) => s + arr.length, 0);

  const [userStates, setUserStates] = useState<PersistedState>({});
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!analysisId || loaded) return;
    (async () => {
      const { data: row } = await (supabase.from("saved_analyses") as any)
        .select("analysis_data")
        .eq("id", analysisId)
        .single();
      const ad = row?.analysis_data as Record<string, unknown> | null;
      if (ad?.signalMatrixStates) {
        setUserStates(ad.signalMatrixStates as PersistedState);
      }
      setLoaded(true);
    })();
  }, [analysisId, loaded]);

  const persist = useCallback(
    (next: PersistedState) => {
      setUserStates(next);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        saveStepData("signalMatrixStates", next);
      }, 800);
    },
    [saveStepData],
  );

  const updateSignalState = useCallback(
    (signalId: string, patch: Partial<UserSignalState>) => {
      const current = userStates[signalId] || { attention_level: null, note_text: "" };
      const next = { ...userStates, [signalId]: { ...current, ...patch } };
      persist(next);
    },
    [userStates, persist],
  );

  const flaggedCount = Object.values(userStates).filter((s) => s.attention_level).length;

  if (totalSignals === 0) return null;

  return (
    <TooltipProvider>
      <section className="rounded-xl border border-border overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border bg-card flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sparkles size={15} className="text-primary" />
            <span className="text-sm font-extrabold text-foreground uppercase tracking-wider">
              Signal Overview
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground transition-colors">
                  <Info size={13} />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-[280px] text-xs leading-relaxed">
                This panel distills the most important findings from the analysis into adaptive categories based on available data. 
                Scores (0–10) reflect how strongly a signal appeared across reviews, community data, and journey analysis. 
                Use the priority tags to mark what matters most to you.
              </TooltipContent>
            </Tooltip>
            <span className="text-xs text-muted-foreground ml-1">{totalSignals} signals found</span>
          </div>
          {flaggedCount > 0 && (
            <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
              {flaggedCount} flagged
            </span>
          )}
        </div>

        {/* Visual summary strip */}
        <div className="px-5 py-3 border-b border-border bg-muted/30 flex items-center gap-4 flex-wrap">
          {quadrants.map((q) => {
            const count = (data[q.key] || []).length;
            return (
              <div key={q.key} className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${q.dotColor}`} />
                <span className="text-xs font-semibold text-foreground">{q.title}</span>
                <span className="text-xs text-muted-foreground">({count})</span>
              </div>
            );
          })}
        </div>

        {/* Quadrant cards — each with its own tinted background */}
        <div className="grid grid-cols-1 md:grid-cols-2">
          {quadrants.map((q) => (
            <QuadrantCard
              key={q.key}
              config={q}
              signals={data[q.key] || []}
              userStates={userStates}
              onUpdateState={updateSignalState}
            />
          ))}
        </div>
      </section>
    </TooltipProvider>
  );
}

/* ── Quadrant Card ── */

function QuadrantCard({
  config,
  signals,
  userStates,
  onUpdateState,
}: {
  config: ActiveQuadrant;
  signals: Signal[];
  userStates: PersistedState;
  onUpdateState: (id: string, patch: Partial<UserSignalState>) => void;
}) {
  const Icon = config.icon;

  return (
    <div className={`border-b border-r border-border last:border-r-0 p-5 ${config.bgTint}`}>
      {/* Quadrant header */}
      <div className="flex items-center gap-2.5 mb-1">
        <div className="w-8 h-8 rounded-lg bg-background/80 flex items-center justify-center">
          <Icon size={16} className="text-foreground" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="text-[13px] font-bold text-foreground">{config.title}</h3>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground/60 hover:text-foreground transition-colors">
                  <Info size={11} />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-[260px] text-xs leading-relaxed">
                {config.explanation}
              </TooltipContent>
            </Tooltip>
          </div>
          <p className="text-[11px] text-muted-foreground">{config.subtitle}</p>
        </div>
        <span className="text-lg font-extrabold text-foreground tabular-nums">{signals.length}</span>
      </div>

      {signals.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 text-center italic">No signals detected in this category</p>
      ) : (
        <div className="mt-3 space-y-0.5">
          {signals.slice(0, 3).map((signal) => (
            <SignalRow
              key={signal.id}
              signal={signal}
              config={config}
              state={userStates[signal.id] || { attention_level: null, note_text: "" }}
              onUpdate={(patch) => onUpdateState(signal.id, patch)}
            />
          ))}

          {signals.length > 3 && (
            <Collapsible>
              <CollapsibleContent>
                <div className="space-y-0.5">
                  {signals.slice(3).map((signal) => (
                    <SignalRow
                      key={signal.id}
                      signal={signal}
                      config={config}
                      state={userStates[signal.id] || { attention_level: null, note_text: "" }}
                      onUpdate={(patch) => onUpdateState(signal.id, patch)}
                    />
                  ))}
                </div>
              </CollapsibleContent>
              <CollapsibleTrigger className="w-full mt-2 flex items-center justify-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors py-2 group">
                <ChevronDown size={13} className="group-data-[state=open]:rotate-180 transition-transform" />
                <span className="group-data-[state=open]:hidden">Dig deeper — {signals.length - 3} more signals</span>
                <span className="hidden group-data-[state=open]:inline">Show less</span>
              </CollapsibleTrigger>
            </Collapsible>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Signal Row ── */

function SignalRow({
  signal,
  config,
  state,
  onUpdate,
}: {
  signal: Signal;
  config: ActiveQuadrant;
  state: UserSignalState;
  onUpdate: (patch: Partial<UserSignalState>) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const activeLevel = ATTENTION_LEVELS.find((l) => l.value === state.attention_level);

  return (
    <div className={`rounded-lg transition-colors ${expanded ? "bg-background/60" : "hover:bg-background/40"}`}>
      {/* Summary row */}
      <div
        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
        role="button"
        aria-expanded={expanded}
      >
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${config.dotColor}`} />

        <p className="text-[13px] leading-snug text-foreground flex-1 min-w-0">
          {signal.label}
        </p>

        {/* Score bar */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 cursor-help">
                <div className="h-1.5 w-12 bg-background rounded-full overflow-hidden border border-border/50">
                  <div
                    className={`h-full rounded-full ${config.barColor}`}
                    style={{ width: `${(signal.score / 10) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] font-semibold text-muted-foreground tabular-nums w-6 text-right">
                  {signal.score}/10
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-[220px] text-xs">
              <span className="font-semibold">Signal strength: {signal.score}/10.</span>{" "}
              {signal.score >= 8 ? "Very strong — appeared consistently across multiple sources." :
               signal.score >= 6 ? "Moderate — mentioned by several users or sources." :
               "Emerging — detected but not yet widespread."}
            </TooltipContent>
          </Tooltip>
        </div>

        {activeLevel && !expanded && (
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${activeLevel.color}`}>
            {activeLevel.label}
          </span>
        )}

        <ChevronDown
          size={13}
          className={`flex-shrink-0 text-muted-foreground transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        />
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-3 pb-3 space-y-3">
          {/* Why this signal matters */}
          {signal.why && (
            <div className="text-xs text-muted-foreground bg-muted/40 rounded-md px-3 py-2 leading-relaxed">
              <span className="font-semibold text-foreground">Why this is here: </span>
              {signal.why}
            </div>
          )}

          {/* Journey stage */}
          {signal.journey_stage && (
            <div className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Journey stage:</span> {signal.journey_stage}
            </div>
          )}

          {/* Quotes */}
          {signal.quotes && signal.quotes.length > 0 && (
            <div className="space-y-1.5">
              {signal.quotes.slice(0, 3).map((q, i) => (
                <blockquote
                  key={i}
                  className="text-xs text-foreground/80 border-l-2 border-foreground/15 pl-3 italic"
                >
                  "{q}"
                </blockquote>
              ))}
            </div>
          )}

          {/* Attention level picker */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-foreground uppercase tracking-wider">
              How important is this to you?
            </span>
            <div className="flex flex-wrap gap-1.5">
              {ATTENTION_LEVELS.map((level) => {
                const isActive = state.attention_level === level.value;
                return (
                  <button
                    key={level.value}
                    onClick={() =>
                      onUpdate({ attention_level: isActive ? null : level.value })
                    }
                    className={`
                      text-[11px] font-semibold px-3 py-1.5 rounded-full border transition-all
                      flex items-center gap-1.5
                      ${
                        isActive
                          ? `${level.color} border-transparent`
                          : "bg-background border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                      }
                    `}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${level.dot}`} />
                    {level.label}
                    {isActive && <X size={10} className="ml-0.5" />}
                  </button>
                );
              })}
            </div>
            {activeLevel && (
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {activeLevel.description}
              </p>
            )}
          </div>

          {/* Note */}
          <div className="flex items-start gap-2">
            <StickyNote size={11} className="text-muted-foreground mt-2 flex-shrink-0" />
            <textarea
              className="w-full text-xs leading-relaxed text-foreground bg-background border border-border rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary/30 placeholder:text-muted-foreground min-h-[36px]"
              placeholder="Add a note about this signal…"
              rows={2}
              value={state.note_text}
              onChange={(e) => onUpdate({ note_text: e.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
