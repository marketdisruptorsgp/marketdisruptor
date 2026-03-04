import React, { useState } from "react";
import { ChevronDown, AlertTriangle, Flame, Target, Activity, Route, Clock } from "lucide-react";
import type { StrategicHypothesis } from "@/lib/strategicOS";

interface SignalCard {
  id: string;
  type: "constraint" | "assumption" | "sensitivity" | "path";
  title: string;
  summary: string;
  score: number;
  maxScore: number;
  whyMatters: string;
  ifBroken: string;
  dependencies: string[];
  urgency?: "eroding" | "stable" | "emerging";
}

interface SignalTabProps {
  disruptData: Record<string, unknown> | null;
  governedData: Record<string, unknown> | null;
  hypotheses: StrategicHypothesis[] | null;
  analysisType: string;
  lastUpdated?: string;
}

const CARD_ICONS: Record<string, React.ElementType> = {
  constraint: AlertTriangle,
  assumption: Flame,
  sensitivity: Activity,
  path: Route,
};

const CARD_LABELS: Record<string, string> = {
  constraint: "Dominant Constraint",
  assumption: "Highest-Leverage Assumption",
  sensitivity: "Most Sensitive Variable",
  path: "Primary Strategic Path",
};

function extractSignalCards(
  disruptData: Record<string, unknown> | null,
  governedData: Record<string, unknown> | null,
  hypotheses: StrategicHypothesis[] | null,
): SignalCard[] {
  const cards: SignalCard[] = [];
  const assumptions = (disruptData?.hiddenAssumptions || []) as any[];
  const synopsis = (governedData?.reasoning_synopsis || {}) as any;

  // 1. Dominant Constraint — highest fragility score hypothesis or top constraint from assumptions
  const constraints = assumptions.filter(a => a.reason === "physics" || a.reason === "manufacturing" || a.reason === "cost");
  const topConstraint = constraints.sort((a, b) => (b.leverageScore || 0) - (a.leverageScore || 0))[0];
  if (topConstraint) {
    cards.push({
      id: "dominant-constraint",
      type: "constraint",
      title: topConstraint.assumption,
      summary: topConstraint.currentAnswer || "Structural constraint limiting system evolution.",
      score: topConstraint.leverageScore || 0,
      maxScore: 10,
      whyMatters: topConstraint.impactScenario || "Breaking this constraint unlocks the highest-leverage structural shift.",
      ifBroken: topConstraint.challengeIdea || "System architecture fundamentally changes.",
      dependencies: [topConstraint.reason ? `Root: ${topConstraint.reason}` : ""].filter(Boolean),
      urgency: topConstraint.urgencySignal,
    });
  }

  // 2. Highest-Leverage Assumption
  const topAssumption = [...assumptions]
    .filter(a => a.isChallengeable)
    .sort((a, b) => (b.leverageScore || 0) - (a.leverageScore || 0))[0];
  if (topAssumption && topAssumption !== topConstraint) {
    cards.push({
      id: "highest-leverage",
      type: "assumption",
      title: topAssumption.assumption,
      summary: topAssumption.currentAnswer || "Untested assumption with high leverage potential.",
      score: topAssumption.leverageScore || 0,
      maxScore: 10,
      whyMatters: topAssumption.impactScenario || "Challenging this assumption creates disproportionate value.",
      ifBroken: topAssumption.competitiveBlindSpot || "Competitors exposed to disruption.",
      dependencies: [topAssumption.reason ? `Root: ${topAssumption.reason}` : "", topAssumption.urgencySignal === "eroding" ? "Currently eroding" : ""].filter(Boolean),
      urgency: topAssumption.urgencySignal,
    });
  }

  // 3. Most Sensitive Variable — from synopsis confidence_sensitivity or highest-urgency eroding assumption
  const sensitiveAssumptions = assumptions.filter(a => a.urgencySignal === "eroding");
  const sensitivity = synopsis?.confidence_sensitivity;
  if (sensitivity) {
    cards.push({
      id: "sensitive-variable",
      type: "sensitivity",
      title: typeof sensitivity === "string" ? sensitivity : sensitivity.variable || "Key Sensitivity Variable",
      summary: typeof sensitivity === "string" ? sensitivity : sensitivity.description || "This variable most affects analysis confidence.",
      score: sensitiveAssumptions.length,
      maxScore: Math.max(assumptions.length, 1),
      whyMatters: `${sensitiveAssumptions.length} assumption${sensitiveAssumptions.length !== 1 ? "s" : ""} currently eroding. System fragility concentrates here.`,
      ifBroken: "Analysis confidence drops significantly. Downstream strategies may need re-evaluation.",
      dependencies: sensitiveAssumptions.slice(0, 3).map(a => a.assumption),
    });
  } else if (sensitiveAssumptions.length > 0) {
    const top = sensitiveAssumptions[0];
    cards.push({
      id: "sensitive-variable",
      type: "sensitivity",
      title: top.assumption,
      summary: top.urgencyReason || "This assumption is actively eroding.",
      score: sensitiveAssumptions.length,
      maxScore: assumptions.length || 1,
      whyMatters: `${sensitiveAssumptions.length} eroding assumption${sensitiveAssumptions.length !== 1 ? "s" : ""} detected. System stability at risk.`,
      ifBroken: top.competitiveBlindSpot || "Incumbent model becomes vulnerable.",
      dependencies: sensitiveAssumptions.slice(0, 3).map(a => a.assumption),
      urgency: "eroding",
    });
  }

  // 4. Primary Strategic Path — from top hypothesis
  if (hypotheses && hypotheses.length > 0) {
    const top = hypotheses[0];
    cards.push({
      id: "primary-path",
      type: "path",
      title: top.hypothesis_statement || top.id,
      summary: top.downstream_implications || "Primary strategic direction based on constraint analysis.",
      score: Math.round((top.dominance_score || 0) * 10),
      maxScore: 10,
      whyMatters: top.downstream_implications || "This path addresses the dominant constraint with the highest leverage.",
      ifBroken: top.friction_sources?.join("; ") || "Path becomes non-viable if core assumptions fail.",
      dependencies: [
        top.constraint_type ? `Constraint: ${top.constraint_type}` : "",
        top.estimated_capital_required ? `Capital: $${(top.estimated_capital_required / 1000).toFixed(0)}K` : "",
        top.estimated_time_to_impact_months ? `Timeline: ${top.estimated_time_to_impact_months}mo` : "",
      ].filter(Boolean),
    });
  }

  return cards.sort((a, b) => b.score - a.score);
}

function SignalCardComponent({ card }: { card: SignalCard }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = CARD_ICONS[card.type] || Target;
  const label = CARD_LABELS[card.type] || card.type;
  const scoreColor = card.score >= 7 ? "hsl(0 70% 50%)" : card.score >= 4 ? "hsl(38 92% 42%)" : "hsl(142 70% 35%)";

  return (
    <div
      className="rounded-xl overflow-hidden transition-all"
      style={{ background: "hsl(var(--card))", border: `1.5px solid ${expanded ? "hsl(var(--primary) / 0.3)" : "hsl(var(--border))"}` }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-5 py-4 flex items-start gap-4"
      >
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "hsl(var(--foreground))" }}>
          <Icon size={18} style={{ color: "hsl(var(--background))" }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "hsl(var(--primary))" }}>{label}</span>
            {card.urgency === "eroding" && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: "hsl(0 70% 50% / 0.1)", color: "hsl(0 70% 50%)" }}>↓ Eroding</span>
            )}
            {card.urgency === "emerging" && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: "hsl(142 70% 40% / 0.1)", color: "hsl(142 70% 35%)" }}>↑ Emerging</span>
            )}
          </div>
          <p className="text-sm font-bold text-foreground leading-snug">{card.title}</p>
          <p className="text-sm text-foreground/80 mt-1 leading-relaxed">{card.summary}</p>
        </div>
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <span className="text-2xl font-black tabular-nums" style={{ color: scoreColor }}>{card.score}</span>
          <span className="text-[10px] font-bold text-foreground/50">/{card.maxScore}</span>
          <ChevronDown size={14} className="text-foreground/40 transition-transform mt-1" style={{ transform: expanded ? "rotate(180deg)" : "none" }} />
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 pt-0 space-y-3" style={{ borderTop: "1px solid hsl(var(--border))" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
            <div className="p-3.5 rounded-lg" style={{ background: "hsl(var(--primary) / 0.04)", border: "1px solid hsl(var(--primary) / 0.12)" }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "hsl(var(--primary))" }}>Why This Matters</p>
              <p className="text-sm text-foreground leading-relaxed">{card.whyMatters}</p>
            </div>
            <div className="p-3.5 rounded-lg" style={{ background: "hsl(0 70% 50% / 0.04)", border: "1px solid hsl(0 70% 50% / 0.12)" }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "hsl(0 70% 45%)" }}>If False / If Broken</p>
              <p className="text-sm text-foreground leading-relaxed">{card.ifBroken}</p>
            </div>
          </div>
          {card.dependencies.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-foreground/60 mb-1.5">Dependencies</p>
              <div className="flex flex-wrap gap-1.5">
                {card.dependencies.map((d, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-semibold" style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))" }}>
                    {d}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function SignalTab({ disruptData, governedData, hypotheses, analysisType, lastUpdated }: SignalTabProps) {
  const cards = extractSignalCards(disruptData, governedData, hypotheses);

  if (cards.length === 0) {
    return (
      <div className="text-center py-12">
        <Target size={32} className="mx-auto mb-3" style={{ color: "hsl(var(--muted-foreground))" }} />
        <p className="text-sm font-bold text-foreground">No signal data yet</p>
        <p className="text-sm text-foreground/60 mt-1">Run the analysis to generate executive signals.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Dynamic banner */}
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <Activity size={14} style={{ color: "hsl(var(--primary))" }} />
          <span className="text-xs font-bold text-foreground/60">Analysis is dynamic. Rankings update per re-run.</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-foreground/50 flex items-center gap-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}>
              {analysisType}
            </span>
          </span>
          {lastUpdated && (
            <span className="text-xs text-foreground/40 flex items-center gap-1">
              <Clock size={10} /> {new Date(lastUpdated).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Ranked signal cards */}
      <div className="space-y-3">
        {cards.map((card, i) => (
          <SignalCardComponent key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
}
