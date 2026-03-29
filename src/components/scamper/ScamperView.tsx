/**
 * ScamperView — Interactive SCAMPER methodology UI
 *
 * Renders a layman-friendly introduction, dynamic operator illustrations,
 * and the full mutation results produced by scamperEngine.applyScamper().
 */

import React, { useState, useMemo } from "react";
import {
  applyScamper,
  getTopScamperMoves,
  SCAMPER_OPERATOR_NAMES,
  SCAMPER_OPERATOR_QUESTIONS,
  type ScamperOperator,
  type ScamperResult,
  type ScamperApplication,
  type ScamperVerdict,
} from "@/lib/scamperEngine";
import {
  RefreshCw, ArrowLeftRight, Layers, GitMerge, Wrench,
  Recycle, Scissors, RotateCcw, ChevronDown, ChevronUp,
  Info, Zap, CheckCircle, XCircle, AlertCircle, Star, TrendingUp,
} from "lucide-react";

// ─── Operator meta ────────────────────────────────────────────────────────────

interface OperatorMeta {
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  label: string;
  tagline: string;
  analogy: string;
}

const OPERATOR_META: Record<ScamperOperator, OperatorMeta> = {
  S: {
    icon: ArrowLeftRight,
    color: "hsl(217 91% 60%)",
    bg: "hsl(217 91% 60% / 0.08)",
    border: "hsl(217 91% 60% / 0.20)",
    label: "Substitute",
    tagline: "Swap one thing for something better",
    analogy: "Like swapping an ingredient in a recipe — same dish, totally different flavour.",
  },
  C: {
    icon: GitMerge,
    color: "hsl(142 70% 38%)",
    bg: "hsl(142 70% 38% / 0.08)",
    border: "hsl(142 70% 38% / 0.20)",
    label: "Combine",
    tagline: "Merge two things into one powerful whole",
    analogy: "Like a smartphone — camera + phone + music player merged into one device.",
  },
  A: {
    icon: Recycle,
    color: "hsl(263 70% 60%)",
    bg: "hsl(263 70% 60% / 0.08)",
    border: "hsl(263 70% 60% / 0.20)",
    label: "Adapt",
    tagline: "Borrow a winning idea from another field",
    analogy: "Like how Netflix adapted the DVD rental model from mail-order catalogues.",
  },
  M: {
    icon: Wrench,
    color: "hsl(38 92% 45%)",
    bg: "hsl(38 92% 45% / 0.08)",
    border: "hsl(38 92% 45% / 0.20)",
    label: "Modify",
    tagline: "Turn the dial up or strip it down",
    analogy: "Like super-sizing a fast-food meal — same product, different scale.",
  },
  P: {
    icon: Layers,
    color: "hsl(185 70% 40%)",
    bg: "hsl(185 70% 40% / 0.08)",
    border: "hsl(185 70% 40% / 0.20)",
    label: "Put to Other Uses",
    tagline: "Repurpose for an entirely new audience or job",
    analogy: "Like WD-40 — invented for missile maintenance, now sells in every home.",
  },
  E: {
    icon: Scissors,
    color: "hsl(0 72% 51%)",
    bg: "hsl(0 72% 51% / 0.08)",
    border: "hsl(0 72% 51% / 0.20)",
    label: "Eliminate",
    tagline: "Cut what adds cost but no real value",
    analogy: "Like Spirit Airlines eliminating all extras — ruthless simplicity.",
  },
  R: {
    icon: RotateCcw,
    color: "hsl(280 65% 55%)",
    bg: "hsl(280 65% 55% / 0.08)",
    border: "hsl(280 65% 55% / 0.20)",
    label: "Reverse",
    tagline: "Flip the process or role upside-down",
    analogy: "Like Airbnb turning guests into hosts — the customer becomes the provider.",
  },
};

// ─── Verdict badge ────────────────────────────────────────────────────────────

function VerdictBadge({ verdict }: { verdict: ScamperVerdict }) {
  const configs = {
    accept: { icon: CheckCircle, label: "Accept", color: "hsl(142 70% 38%)", bg: "hsl(142 70% 38% / 0.10)", border: "hsl(142 70% 38% / 0.25)" },
    conditional: { icon: AlertCircle, label: "Conditional", color: "hsl(38 92% 45%)", bg: "hsl(38 92% 45% / 0.10)", border: "hsl(38 92% 45% / 0.25)" },
    reject: { icon: XCircle, label: "Reject", color: "hsl(0 72% 51%)", bg: "hsl(0 72% 51% / 0.10)", border: "hsl(0 72% 51% / 0.25)" },
  };
  const c = configs[verdict];
  const Icon = c.icon;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold"
      style={{ color: c.color, background: c.bg, border: `1px solid ${c.border}` }}
    >
      <Icon size={11} />
      {c.label}
    </span>
  );
}

// ─── Disruption score bar ─────────────────────────────────────────────────────

function DisruptionBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${(score / 10) * 100}%`, background: color }}
        />
      </div>
      <span className="text-[11px] font-bold tabular-nums" style={{ color }}>
        {score}/10
      </span>
    </div>
  );
}

// ─── Individual mutation card ─────────────────────────────────────────────────

function MutationCard({ app, meta }: { app: ScamperApplication; meta: OperatorMeta }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = meta.icon;

  return (
    <div
      className="rounded-xl p-4 space-y-3 transition-all"
      style={{
        background: "hsl(var(--card))",
        border: `1.5px solid hsl(var(--border))`,
      }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background: meta.bg }}
          >
            <Icon size={14} style={{ color: meta.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground leading-snug">{app.mutationIdea}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 italic">"{app.triggerQuestion}"</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <VerdictBadge verdict={app.verdict} />
        </div>
      </div>

      {/* Disruption score */}
      <DisruptionBar score={app.disruptionScore} color={meta.color} />

      {/* Expandable details */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        {expanded ? "Hide reasoning" : "Show reasoning"}
      </button>

      {expanded && (
        <div className="space-y-2.5 pt-1 border-t border-border">
          <div className="space-y-1">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Why this verdict?</p>
            <p className="text-xs text-foreground/80 leading-relaxed">{app.verdictReasoning}</p>
          </div>
          {app.leverageHint && (
            <div
              className="rounded-lg p-3 space-y-1"
              style={{ background: meta.bg, border: `1px solid ${meta.border}` }}
            >
              <div className="flex items-center gap-1.5">
                <Zap size={12} style={{ color: meta.color }} />
                <p className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: meta.color }}>Leverage Hint</p>
              </div>
              <p className="text-xs font-medium leading-relaxed" style={{ color: meta.color }}>{app.leverageHint}</p>
            </div>
          )}
          <div className="space-y-1">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Element targeted</p>
            <p className="text-xs text-muted-foreground">{app.element.label}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Operator section (collapsible) ──────────────────────────────────────────

function OperatorSection({
  operator,
  apps,
}: {
  operator: ScamperOperator;
  apps: ScamperApplication[];
}) {
  const [open, setOpen] = useState(true);
  const meta = OPERATOR_META[operator];
  const Icon = meta.icon;
  const acceptedCount = apps.filter(a => a.verdict === "accept" || a.verdict === "conditional").length;
  const topScore = Math.max(...apps.map(a => a.disruptionScore));

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: `1.5px solid ${meta.border}` }}
    >
      {/* Section header */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left transition-colors hover:opacity-90"
        style={{ background: meta.bg }}
      >
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: meta.bg }}
        >
          <Icon size={18} style={{ color: meta.color }} />
        </div>

        {/* Labels */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-extrabold" style={{ color: meta.color }}>
              {meta.label}
            </span>
            <span className="text-xs text-muted-foreground font-medium">— {meta.tagline}</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5 italic">{meta.analogy}</p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-[11px] font-bold text-muted-foreground">
              {acceptedCount}/{apps.length} viable
            </p>
            <p className="text-[10px] text-muted-foreground">Top score: {topScore}/10</p>
          </div>
          {open ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
        </div>
      </button>

      {/* Cards */}
      {open && (
        <div className="p-4 space-y-3">
          {/* Operator questions tooltip */}
          <div className="rounded-lg px-4 py-3 space-y-1" style={{ background: "hsl(var(--muted))" }}>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Info size={11} />
              Guiding questions for {meta.label}
            </p>
            <ul className="space-y-0.5">
              {SCAMPER_OPERATOR_QUESTIONS[operator].map((q, i) => (
                <li key={i} className="text-[11px] text-muted-foreground leading-relaxed">
                  • {q}
                </li>
              ))}
            </ul>
          </div>

          {apps.map(app => (
            <MutationCard key={app.id} app={app} meta={meta} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Top Moves Section ────────────────────────────────────────────────────────

function TopMovesSection({ moves, scamperResult }: { moves: ScamperApplication[]; scamperResult: ScamperResult }) {
  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Mutations", value: scamperResult.summary.totalApplications, color: "hsl(var(--primary))" },
          { label: "Accepted / Conditional", value: scamperResult.accepted.length, color: "hsl(142 70% 38%)" },
          { label: "Rejected", value: scamperResult.rejected.length, color: "hsl(0 72% 51%)" },
          { label: "Acceptance Rate", value: `${Math.round(scamperResult.summary.acceptanceRate * 100)}%`, color: "hsl(38 92% 45%)" },
        ].map(stat => (
          <div
            key={stat.label}
            className="rounded-xl px-4 py-3 text-center"
            style={{ background: "hsl(var(--muted))", border: "1.5px solid hsl(var(--border))" }}
          >
            <p className="text-xl font-extrabold" style={{ color: stat.color }}>{stat.value}</p>
            <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Top cards */}
      <div className="space-y-3">
        {moves.map((app, idx) => {
          const meta = OPERATOR_META[app.operator];
          return (
            <div
              key={app.id}
              className="rounded-xl p-4 space-y-2"
              style={{ background: "hsl(var(--card))", border: `1.5px solid ${meta.border}` }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: meta.bg }}
                >
                  <span className="text-xs font-extrabold" style={{ color: meta.color }}>#{idx + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: meta.bg, color: meta.color }}>
                      {meta.label}
                    </span>
                    <VerdictBadge verdict={app.verdict} />
                  </div>
                  <p className="text-sm font-semibold text-foreground leading-snug">{app.mutationIdea}</p>
                  {app.leverageHint && (
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      💡 {app.leverageHint}
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0 text-right">
                  <div className="flex items-center gap-1">
                    <TrendingUp size={12} style={{ color: meta.color }} />
                    <span className="text-sm font-extrabold" style={{ color: meta.color }}>{app.disruptionScore}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">disruption</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Intro section ────────────────────────────────────────────────────────────

function ScamperIntro() {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: "1.5px solid hsl(var(--border))" }}>
      {/* Hero */}
      <div
        className="px-6 py-5 space-y-3"
        style={{ background: "hsl(var(--primary) / 0.06)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "hsl(var(--primary) / 0.15)" }}
          >
            <RefreshCw size={20} style={{ color: "hsl(var(--primary))" }} />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-foreground">What is SCAMPER?</h2>
            <p className="text-xs text-muted-foreground">A 7-step creative thinking toolkit for business innovation</p>
          </div>
        </div>
        <p className="text-sm text-foreground/80 leading-relaxed">
          <strong>SCAMPER</strong> is a structured brainstorming method that helps you generate new ideas by systematically
          challenging every element of an existing business. Instead of staring at a blank page, SCAMPER gives you 7 specific
          lenses to look through — each one forcing a different kind of creative question.
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">
          Think of it as a creative cheat sheet: rather than waiting for inspiration, you
          <em> substitute</em>, <em>combine</em>, <em>adapt</em>, <em>modify</em>, <em>repurpose</em>,
          <em> eliminate</em>, and <em>reverse</em> the parts of your business until breakthrough ideas emerge.
        </p>
      </div>

      {/* Operator overview pills */}
      <div className="px-6 py-4 border-t border-border">
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-3">The 7 operators at a glance</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {(Object.keys(OPERATOR_META) as ScamperOperator[]).map(op => {
            const m = OPERATOR_META[op];
            const Ic = m.icon;
            return (
              <div
                key={op}
                className="rounded-xl px-3 py-2.5 flex flex-col items-center gap-1.5 text-center"
                style={{ background: m.bg, border: `1px solid ${m.border}` }}
              >
                <Ic size={16} style={{ color: m.color }} />
                <span className="text-[10px] font-extrabold leading-tight" style={{ color: m.color }}>{op}</span>
                <span className="text-[9px] font-semibold text-muted-foreground leading-tight">{m.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step-by-step process overlay */}
      <div className="px-6 py-4 border-t border-border">
        <button
          onClick={() => setShowDetails(v => !v)}
          className="flex items-center gap-2 text-sm font-semibold text-primary hover:opacity-80 transition-opacity"
        >
          {showDetails ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          {showDetails ? "Hide" : "Show"} step-by-step process explanation
        </button>

        {showDetails && (
          <div className="mt-4 space-y-3">
            {[
              { step: 1, title: "Extract business elements", desc: "The engine identifies the key moving parts of your business — pricing model, delivery mechanism, distribution channels, technology stack, and more." },
              { step: 2, title: "Apply each operator", desc: "Every one of the 7 SCAMPER operators is applied to every relevant business element. The engine generates a specific mutation idea for each combination." },
              { step: 3, title: "Verdict + reasoning", desc: "Each mutation gets an Accept, Reject, or Conditional verdict — never just a list of ideas. The reasoning is always shown so you understand why." },
              { step: 4, title: "Disruption score", desc: "Every accepted idea is scored 1–10 for its disruptive potential. Higher scores indicate ideas that could structurally shift competitive position." },
              { step: 5, title: "Leverage hints", desc: "Accepted ideas include a specific, actionable first move — a 30-90 day experiment you can run to test the mutation before committing to it." },
              { step: 6, title: "Prioritise top moves", desc: "The Top Moves tab surfaces your highest-impact SCAMPER ideas sorted by disruption score — so you know exactly where to focus." },
            ].map(s => (
              <div key={s.step} className="flex gap-3">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-[11px] font-extrabold"
                  style={{ background: "hsl(var(--primary) / 0.12)", color: "hsl(var(--primary))" }}
                >
                  {s.step}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{s.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab definitions ──────────────────────────────────────────────────────────

type ScamperTabId = "intro" | "operators" | "top";

// ─── Main ScamperView ─────────────────────────────────────────────────────────

interface ScamperViewProps {
  /** Raw product/business object from analysis context */
  product: any;
  /** Accent colour from useModeTheme */
  accentColor?: string;
}

export function ScamperView({ product, accentColor = "hsl(var(--primary))" }: ScamperViewProps) {
  const [activeTab, setActiveTab] = useState<ScamperTabId>("intro");

  const scamperResult: ScamperResult = useMemo(() => applyScamper(product), [product]);
  const topMoves = useMemo(() => getTopScamperMoves(scamperResult, 7), [scamperResult]);

  // Group applications by operator
  const byOperator = useMemo(() => {
    const groups: Partial<Record<ScamperOperator, ScamperApplication[]>> = {};
    for (const app of scamperResult.applications) {
      if (!groups[app.operator]) groups[app.operator] = [];
      groups[app.operator]!.push(app);
    }
    return groups;
  }, [scamperResult]);

  const TABS: { id: ScamperTabId; label: string; icon: React.ElementType }[] = [
    { id: "intro", label: "What is SCAMPER?", icon: Info },
    { id: "operators", label: "By Operator", icon: Layers },
    { id: "top", label: "Top Moves", icon: Star },
  ];

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div
        className="flex gap-1 p-1 rounded-xl"
        style={{ background: "hsl(var(--muted))" }}
      >
        {TABS.map(tab => {
          const TabIcon = tab.icon;
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
              style={
                isActive
                  ? { background: "hsl(var(--card))", color: accentColor, boxShadow: "0 1px 3px hsl(var(--foreground)/0.08)" }
                  : { color: "hsl(var(--muted-foreground))" }
              }
            >
              <TabIcon size={13} />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.id === "intro" ? "Intro" : tab.id === "operators" ? "Operators" : "Top"}</span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "intro" && <ScamperIntro />}

      {activeTab === "operators" && (
        <div className="space-y-4">
          {/* Context banner */}
          <div
            className="rounded-xl px-5 py-4 flex items-start gap-3"
            style={{ background: "hsl(var(--muted))" }}
          >
            <Info size={16} className="text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground leading-relaxed">
              Each section below shows the mutations generated for one SCAMPER operator.
              Expand any card to see the full reasoning, leverage hints, and the targeted business element.
              Sections are collapsible — click the header to collapse or expand.
            </p>
          </div>

          {(Object.keys(SCAMPER_OPERATOR_NAMES) as ScamperOperator[]).map(op => {
            const apps = byOperator[op] || [];
            if (apps.length === 0) return null;
            return (
              <OperatorSection key={op} operator={op} apps={apps} />
            );
          })}
        </div>
      )}

      {activeTab === "top" && (
        <TopMovesSection moves={topMoves} scamperResult={scamperResult} />
      )}
    </div>
  );
}
