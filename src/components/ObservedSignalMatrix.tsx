import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChevronDown, StickyNote, Sparkles } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { Product } from "@/data/mockProducts";

/* ── Types ── */

type Insight = {
  id: string;
  theme: string;
  score: number;
  frequency: number;
  journey_stage?: string;
  segments?: string[];
  quotes?: string[];
  related_signals?: string[];
};

type QuadrantKey = "strengths" | "complaints" | "friction" | "opportunities";

type MatrixData = Record<QuadrantKey, Insight[]>;

type UserInsightState = {
  attention_level: "high_concentration" | "structural_review" | "monitor" | null;
  note_text: string;
};

type PersistedState = Record<string, UserInsightState>;

/* ── Config ── */

const QUADRANT_META: {
  key: QuadrantKey;
  label: string;
  accent: string;
  accentBg: string;
  accentBorder: string;
}[] = [
  { key: "strengths", label: "Strengths", accent: "text-green-700", accentBg: "bg-green-600", accentBorder: "border-green-500/30" },
  { key: "complaints", label: "Complaints / Requests", accent: "text-red-700", accentBg: "bg-red-500", accentBorder: "border-red-500/30" },
  { key: "friction", label: "Friction Points", accent: "text-amber-700", accentBg: "bg-amber-500", accentBorder: "border-amber-500/30" },
  { key: "opportunities", label: "Emerging Patterns", accent: "text-blue-700", accentBg: "bg-blue-600", accentBorder: "border-blue-500/30" },
];

const ATTENTION_OPTIONS: { value: string; label: string }[] = [
  { value: "high_concentration", label: "High Concentration Signal" },
  { value: "structural_review", label: "Requires Structural Review" },
  { value: "monitor", label: "Monitor" },
];

/* ── Signal extraction ── */

function extractMatrixData(product: Product): MatrixData {
  const ci = (product as any).communityInsights;
  const uw = (product as any).userWorkflow;
  const cs = product.confidenceScores;

  let idCounter = 0;
  const mkId = () => `sig-${idCounter++}`;

  // Strengths
  const strengths: Insight[] = [];
  if (product.keyInsight) {
    strengths.push({ id: mkId(), theme: product.keyInsight, score: 8, frequency: 1 });
  }
  if (product.reviews?.length) {
    product.reviews
      .filter((r: any) => r.sentiment === "positive")
      .forEach((r: any) => {
        if (r.text) strengths.push({ id: mkId(), theme: r.text, score: 7, frequency: 1 });
      });
  }
  if (cs) {
    if ((cs.adoptionLikelihood ?? 0) >= 8)
      strengths.push({ id: mkId(), theme: `High adoption likelihood (${cs.adoptionLikelihood}/10)`, score: cs.adoptionLikelihood ?? 8, frequency: 1 });
    if ((cs.emotionalResonance ?? 0) >= 8)
      strengths.push({ id: mkId(), theme: `Strong emotional resonance (${cs.emotionalResonance}/10)`, score: cs.emotionalResonance ?? 8, frequency: 1 });
  }

  // Complaints
  const complaints: Insight[] = [];
  if (ci?.topComplaints?.length) {
    ci.topComplaints.forEach((c: string) => complaints.push({ id: mkId(), theme: c, score: 6, frequency: 1 }));
  }
  if (product.reviews?.length) {
    product.reviews
      .filter((r: any) => r.sentiment === "negative")
      .forEach((r: any) => {
        if (r.text && !complaints.some((x) => x.theme === r.text))
          complaints.push({ id: mkId(), theme: r.text, score: 5, frequency: 1 });
      });
  }

  // Friction
  const friction: Insight[] = [];
  if (uw?.frictionPoints?.length) {
    uw.frictionPoints.forEach((fp: any) => {
      const text = typeof fp === "string" ? fp : fp.description || fp.label || fp.point || JSON.stringify(fp);
      friction.push({ id: mkId(), theme: text, score: 6, frequency: 1, journey_stage: fp.stage });
    });
  }

  // Opportunities (improvementRequests)
  const opportunities: Insight[] = [];
  if (ci?.improvementRequests?.length) {
    ci.improvementRequests.forEach((r: string) => opportunities.push({ id: mkId(), theme: r, score: 5, frequency: 1 }));
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

  const [densityView, setDensityView] = useState(false);
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
    [saveStepData]
  );

  const updateInsightState = useCallback(
    (insightId: string, patch: Partial<UserInsightState>) => {
      const current = userStates[insightId] || { attention_level: null, note_text: "" };
      const next = { ...userStates, [insightId]: { ...current, ...patch } };
      persist(next);
    },
    [userStates, persist]
  );

  const quadrantTotals = useMemo(() => {
    return {
      strengths: data.strengths.reduce((a, b) => a + b.score, 0),
      complaints: data.complaints.reduce((a, b) => a + b.score, 0),
      friction: data.friction.reduce((a, b) => a + b.score, 0),
      opportunities: data.opportunities.reduce((a, b) => a + b.score, 0),
    };
  }, [data]);

  const orderedQuadrants = useMemo(() => {
    const entries = QUADRANT_META.map((m) => ({
      ...m,
      insights: data[m.key],
    }));
    if (!densityView) return entries;
    return [...entries].sort((a, b) => quadrantTotals[b.key] - quadrantTotals[a.key]);
  }, [densityView, data, quadrantTotals]);

  if (totalSignals === 0) return null;

  const markedCount = Object.values(userStates).filter((s) => s.attention_level).length;

  return (
    <section className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-primary" />
          <span className="text-sm font-extrabold text-foreground uppercase tracking-wider">
            Observed Signal Matrix
          </span>
          <span className="text-xs text-muted-foreground">{totalSignals} signals</span>
        </div>
        <div className="flex items-center gap-3">
          {markedCount > 0 && (
            <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              {markedCount} flagged
            </span>
          )}
          <button
            onClick={() => setDensityView(!densityView)}
            className="text-xs font-semibold border border-border rounded-md px-3 py-1.5 bg-background hover:bg-muted transition-colors"
          >
            {densityView ? "Default View" : "Density View"}
          </button>
        </div>
      </div>

      {/* Context banner */}
      <div className="px-5 py-2.5 border-b border-border bg-muted/40">
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          This layer reflects surfaced upstream signals. Structural reframing has not yet been applied.
        </p>
      </div>

      {/* Quadrant Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border">
        {orderedQuadrants.map((q) => (
          <QuadrantPanel
            key={q.key}
            label={q.label}
            accent={q.accent}
            accentBg={q.accentBg}
            accentBorder={q.accentBorder}
            insights={q.insights}
            userStates={userStates}
            onUpdateState={updateInsightState}
          />
        ))}
      </div>
    </section>
  );
}

/* ── Quadrant ── */

function QuadrantPanel({
  label,
  accent,
  accentBg,
  accentBorder,
  insights,
  userStates,
  onUpdateState,
}: {
  label: string;
  accent: string;
  accentBg: string;
  accentBorder: string;
  insights: Insight[];
  userStates: PersistedState;
  onUpdateState: (id: string, patch: Partial<UserInsightState>) => void;
}) {
  return (
    <div className="bg-card p-4">
      <h3 className={`text-[11px] font-extrabold uppercase tracking-wider mb-3 ${accent}`}>
        {label}
        <span className="ml-2 text-muted-foreground font-semibold">({insights.length})</span>
      </h3>
      {insights.length === 0 ? (
        <p className="text-xs text-muted-foreground py-3">No signals detected.</p>
      ) : (
        <div className="space-y-0 divide-y divide-border">
          {insights.map((insight) => (
            <InsightRow
              key={insight.id}
              insight={insight}
              accentBg={accentBg}
              accentBorder={accentBorder}
              state={userStates[insight.id] || { attention_level: null, note_text: "" }}
              onUpdate={(patch) => onUpdateState(insight.id, patch)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Insight Row ── */

function InsightRow({
  insight,
  accentBg,
  accentBorder,
  state,
  onUpdate,
}: {
  insight: Insight;
  accentBg: string;
  accentBorder: string;
  state: UserInsightState;
  onUpdate: (patch: Partial<UserInsightState>) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="py-3">
      {/* Clickable header */}
      <div
        className="flex items-start gap-3 cursor-pointer group"
        onClick={() => setExpanded(!expanded)}
        role="button"
        aria-expanded={expanded}
      >
        <div className="flex-1 min-w-0">
          <p className={`text-[13px] leading-relaxed text-foreground ${state.attention_level ? "font-semibold" : ""}`}>
            {insight.theme}
          </p>

          {/* Score bar + metadata */}
          <div className="flex items-center gap-3 mt-1.5">
            <div className="h-[5px] w-24 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${accentBg}`}
                style={{ width: `${(insight.score / 10) * 100}%` }}
              />
            </div>
            <span className="text-[10px] font-semibold text-muted-foreground tabular-nums">
              {insight.score}/10
            </span>
            {insight.frequency > 1 && (
              <span className="text-[10px] text-muted-foreground">
                {insight.frequency} mentions
              </span>
            )}
            {insight.journey_stage && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded border ${accentBorder} text-muted-foreground`}>
                {insight.journey_stage}
              </span>
            )}
            {state.attention_level && (
              <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                {state.attention_level === "high_concentration"
                  ? "⬤ High"
                  : state.attention_level === "structural_review"
                  ? "◉ Review"
                  : "○ Monitor"}
              </span>
            )}
          </div>
        </div>

        <ChevronDown
          size={14}
          className={`mt-1 flex-shrink-0 text-muted-foreground transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="mt-3 pl-0 space-y-3">
          {/* Segments */}
          {insight.segments && insight.segments.length > 0 && (
            <div className="text-xs text-muted-foreground">
              <strong className="text-foreground">Segments:</strong> {insight.segments.join(", ")}
            </div>
          )}

          {/* Quotes */}
          {insight.quotes && insight.quotes.length > 0 && (
            <div className="space-y-1.5">
              {insight.quotes.slice(0, 5).map((q, i) => (
                <blockquote
                  key={i}
                  className="text-xs text-foreground border-l-[3px] border-foreground/20 pl-3 italic leading-relaxed"
                >
                  "{q}"
                </blockquote>
              ))}
            </div>
          )}

          {/* Related signals */}
          {insight.related_signals && insight.related_signals.length > 0 && (
            <div className="text-xs text-muted-foreground">
              <strong className="text-foreground">Related:</strong> {insight.related_signals.join(", ")}
            </div>
          )}

          {/* Attention level */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider">
              Attention Level
            </span>
            <RadioGroup
              value={state.attention_level || ""}
              onValueChange={(v) => onUpdate({ attention_level: v as any })}
              className="flex flex-col gap-1.5"
            >
              {ATTENTION_OPTIONS.map((opt) => (
                <div key={opt.value} className="flex items-center gap-2">
                  <RadioGroupItem value={opt.value} id={`${insight.id}-${opt.value}`} />
                  <Label htmlFor={`${insight.id}-${opt.value}`} className="text-xs text-foreground cursor-pointer">
                    {opt.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Note */}
          <div className="flex items-start gap-2">
            <StickyNote size={11} className="text-muted-foreground mt-1.5 flex-shrink-0" />
            <textarea
              className="w-full text-xs leading-relaxed text-foreground bg-muted/50 border border-border rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-primary/30 placeholder:text-muted-foreground"
              placeholder="Add internal note about this signal…"
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
