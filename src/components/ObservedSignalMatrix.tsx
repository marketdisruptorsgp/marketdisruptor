import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChevronDown, StickyNote, Sparkles, ShieldCheck, Eye, AlertTriangle, TrendingUp, X } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
};

type QuadrantKey = "strengths" | "complaints" | "friction" | "opportunities";

type MatrixData = Record<QuadrantKey, Signal[]>;

type UserSignalState = {
  attention_level: "high_concentration" | "structural_review" | "monitor" | null;
  note_text: string;
};

type PersistedState = Record<string, UserSignalState>;

/* ── Config ── */

const QUADRANTS: {
  key: QuadrantKey;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  dotColor: string;
  barColor: string;
  bgTint: string;
}[] = [
  {
    key: "strengths",
    title: "What's Working",
    subtitle: "Strongest positive signals",
    icon: ShieldCheck,
    dotColor: "bg-green-500",
    barColor: "bg-green-500",
    bgTint: "bg-green-50 dark:bg-green-950/20",
  },
  {
    key: "complaints",
    title: "Top Complaints",
    subtitle: "Most common pain points",
    icon: AlertTriangle,
    dotColor: "bg-red-500",
    barColor: "bg-red-500",
    bgTint: "bg-red-50 dark:bg-red-950/20",
  },
  {
    key: "friction",
    title: "Friction in the Journey",
    subtitle: "Where users get stuck",
    icon: Eye,
    dotColor: "bg-amber-500",
    barColor: "bg-amber-500",
    bgTint: "bg-amber-50 dark:bg-amber-950/20",
  },
  {
    key: "opportunities",
    title: "Emerging Patterns",
    subtitle: "Signals worth watching",
    icon: TrendingUp,
    dotColor: "bg-blue-500",
    barColor: "bg-blue-500",
    bgTint: "bg-blue-50 dark:bg-blue-950/20",
  },
];

const ATTENTION_LEVELS = [
  {
    value: "high_concentration" as const,
    label: "High Priority",
    description: "This signal demands immediate attention — it's concentrated and recurring.",
    color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    dot: "bg-red-500",
  },
  {
    value: "structural_review" as const,
    label: "Needs Review",
    description: "Worth a deeper look — may reveal a structural issue underneath.",
    color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  {
    value: "monitor" as const,
    label: "Monitor",
    description: "Keep an eye on this — not urgent but could become important.",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    dot: "bg-blue-500",
  },
];

/* ── Humanize text: strip code-like fragments ── */

function humanize(raw: string): string {
  // Remove JSON-like patterns, code syntax, brackets
  let text = raw
    .replace(/\{[^}]*\}/g, "")
    .replace(/\[[^\]]*\]/g, "")
    .replace(/[<>{}]/g, "")
    .replace(/\b(null|undefined|true|false|NaN)\b/gi, "")
    .replace(/\b\w+\.\w+\(\)/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  // Capitalize first letter
  if (text.length > 0) text = text.charAt(0).toUpperCase() + text.slice(1);
  // Remove trailing punctuation noise
  text = text.replace(/[;,]+$/, "").trim();
  return text || raw;
}

/* ── Signal extraction ── */

function extractMatrixData(product: Product): MatrixData {
  const ci = (product as any).communityInsights;
  const uw = (product as any).userWorkflow;
  const cs = product.confidenceScores;

  let idCounter = 0;
  const mkId = () => `sig-${idCounter++}`;

  const strengths: Signal[] = [];
  if (product.keyInsight) {
    strengths.push({ id: mkId(), label: humanize(product.keyInsight), score: 8, frequency: 1 });
  }
  if (product.reviews?.length) {
    product.reviews
      .filter((r: any) => r.sentiment === "positive")
      .forEach((r: any) => {
        if (r.text) strengths.push({ id: mkId(), label: humanize(r.text), score: 7, frequency: 1 });
      });
  }
  if (cs) {
    if ((cs.adoptionLikelihood ?? 0) >= 8)
      strengths.push({ id: mkId(), label: `High adoption likelihood (${cs.adoptionLikelihood}/10)`, score: cs.adoptionLikelihood ?? 8, frequency: 1 });
    if ((cs.emotionalResonance ?? 0) >= 8)
      strengths.push({ id: mkId(), label: `Strong emotional connection (${cs.emotionalResonance}/10)`, score: cs.emotionalResonance ?? 8, frequency: 1 });
  }

  const complaints: Signal[] = [];
  if (ci?.topComplaints?.length) {
    ci.topComplaints.forEach((c: string) => complaints.push({ id: mkId(), label: humanize(c), score: 6, frequency: 1 }));
  }
  if (product.reviews?.length) {
    product.reviews
      .filter((r: any) => r.sentiment === "negative")
      .forEach((r: any) => {
        if (r.text && !complaints.some((x) => x.label === humanize(r.text)))
          complaints.push({ id: mkId(), label: humanize(r.text), score: 5, frequency: 1 });
      });
  }

  const friction: Signal[] = [];
  if (uw?.frictionPoints?.length) {
    uw.frictionPoints.forEach((fp: any) => {
      const raw = typeof fp === "string" ? fp : fp.description || fp.label || fp.point || "";
      const text = humanize(raw);
      if (text) friction.push({ id: mkId(), label: text, score: 6, frequency: 1, journey_stage: fp.stage });
    });
  }

  const opportunities: Signal[] = [];
  if (ci?.improvementRequests?.length) {
    ci.improvementRequests.forEach((r: string) => opportunities.push({ id: mkId(), label: humanize(r), score: 5, frequency: 1 }));
  }

  return { strengths, complaints, friction, opportunities };
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
  const data = useMemo(() => extractMatrixData(product), [product]);
  const totalSignals = Object.values(data).reduce((s, arr) => s + arr.length, 0);

  const [userStates, setUserStates] = useState<PersistedState>({});
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load persisted states
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
    <section className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Sparkles size={15} className="text-primary" />
          <span className="text-sm font-extrabold text-foreground uppercase tracking-wider">
            Signal Overview
          </span>
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
        {QUADRANTS.map((q) => {
          const count = data[q.key].length;
          return (
            <div key={q.key} className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${q.dotColor}`} />
              <span className="text-xs font-semibold text-foreground">{q.title}</span>
              <span className="text-xs text-muted-foreground">({count})</span>
            </div>
          );
        })}
      </div>

      {/* Quadrant cards */}
      <div className="grid grid-cols-1 md:grid-cols-2">
        {QUADRANTS.map((q) => (
          <QuadrantCard
            key={q.key}
            config={q}
            signals={data[q.key]}
            userStates={userStates}
            onUpdateState={updateSignalState}
          />
        ))}
      </div>
    </section>
  );
}

/* ── Quadrant Card ── */

function QuadrantCard({
  config,
  signals,
  userStates,
  onUpdateState,
}: {
  config: (typeof QUADRANTS)[number];
  signals: Signal[];
  userStates: PersistedState;
  onUpdateState: (id: string, patch: Partial<UserSignalState>) => void;
}) {
  const Icon = config.icon;

  return (
    <div className="border-b border-r border-border last:border-r-0 p-5">
      {/* Quadrant header */}
      <div className="flex items-center gap-2.5 mb-1">
        <div className={`w-8 h-8 rounded-lg ${config.bgTint} flex items-center justify-center`}>
          <Icon size={16} className="text-foreground" />
        </div>
        <div>
          <h3 className="text-[13px] font-bold text-foreground">{config.title}</h3>
          <p className="text-[11px] text-muted-foreground">{config.subtitle}</p>
        </div>
        <span className="ml-auto text-lg font-extrabold text-foreground tabular-nums">{signals.length}</span>
      </div>

      {signals.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4 text-center">No signals detected</p>
      ) : (
        <div className="mt-3 space-y-0.5">
          {/* Top signals (always visible) */}
          {signals.slice(0, 3).map((signal) => (
            <SignalRow
              key={signal.id}
              signal={signal}
              config={config}
              state={userStates[signal.id] || { attention_level: null, note_text: "" }}
              onUpdate={(patch) => onUpdateState(signal.id, patch)}
            />
          ))}

          {/* Deeper analysis — collapsible */}
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
                <span className="group-data-[state=open]:hidden">Show {signals.length - 3} more signals</span>
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
  config: (typeof QUADRANTS)[number];
  state: UserSignalState;
  onUpdate: (patch: Partial<UserSignalState>) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const activeLevel = ATTENTION_LEVELS.find((l) => l.value === state.attention_level);

  return (
    <div className={`rounded-lg transition-colors ${expanded ? "bg-muted/40" : "hover:bg-muted/20"}`}>
      {/* Summary row */}
      <div
        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
        role="button"
        aria-expanded={expanded}
      >
        {/* Colored dot */}
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${config.dotColor}`} />

        {/* Label */}
        <p className="text-[13px] leading-snug text-foreground flex-1 min-w-0">
          {signal.label}
        </p>

        {/* Score bar — compact visual */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="h-1.5 w-12 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${config.barColor}`}
              style={{ width: `${(signal.score / 10) * 100}%` }}
            />
          </div>
          <span className="text-[10px] font-semibold text-muted-foreground tabular-nums w-6 text-right">
            {signal.score}
          </span>
        </div>

        {/* Attention badge */}
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
          {/* Journey stage */}
          {signal.journey_stage && (
            <div className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Stage:</span> {signal.journey_stage}
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
