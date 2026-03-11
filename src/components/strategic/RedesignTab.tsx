import React, { useState } from "react";
import { Wrench, Shield, TrendingUp, ChevronDown, Zap, Clock, Target, CheckCircle2, Lightbulb } from "lucide-react";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { ConceptExplorer } from "@/components/first-principles/ConceptExplorer";
import type { ConceptSynthesisResult } from "@/components/first-principles/types";
import type { StrategicHypothesis } from "@/lib/strategicOS";

interface StrategyCard {
  id: string;
  category: "break" | "mitigate" | "compound";
  title: string;
  description: string;
  impactScore: number;
  feasibilityScore: number;
  sensitivityExposure: string;
  timeHorizon: string;
  whatMustBeTrue: string[];
  compositeScore: number;
}

interface RedesignTabProps {
  disruptData: Record<string, unknown> | null;
  hypotheses: StrategicHypothesis[] | null;
  governedData: Record<string, unknown> | null;
}

const CATEGORY_CONFIG = {
  break: { label: "Constraint Break Strategy", icon: Wrench, color: "hsl(var(--primary))" },
  mitigate: { label: "Risk Mitigation / Validation", icon: Shield, color: "hsl(38 92% 42%)" },
  compound: { label: "Compounding Asset Build", icon: TrendingUp, color: "hsl(142 70% 35%)" },
};

function deriveStrategies(
  disruptData: Record<string, unknown> | null,
  hypotheses: StrategicHypothesis[] | null,
  governedData: Record<string, unknown> | null,
): StrategyCard[] {
  const cards: StrategyCard[] = [];
  const assumptions = (disruptData?.hiddenAssumptions || []) as any[];
  const flippedLogic = (disruptData?.flippedLogic || []) as any[];

  // Constraint Break Strategies — from high-leverage challengeable assumptions
  const highLeverage = assumptions
    .filter(a => a.isChallengeable && (a.leverageScore || 0) >= 6)
    .sort((a, b) => (b.leverageScore || 0) - (a.leverageScore || 0));

  highLeverage.slice(0, 3).forEach((a, i) => {
    const matchedFlip = flippedLogic.find((f: any) =>
      f.originalAssumption?.toLowerCase().includes(a.assumption?.toLowerCase().slice(0, 20))
    );
    const impact = a.leverageScore || 5;
    const feasibility = a.urgencySignal === "eroding" ? 7 : a.urgencySignal === "emerging" ? 8 : 5;
    const sensitivityWeight = a.urgencySignal === "eroding" ? 1.3 : 1.0;

    cards.push({
      id: `break-${i}`,
      category: "break",
      title: matchedFlip?.boldAlternative || `Challenge: ${a.assumption}`,
      description: matchedFlip?.rationale || a.challengeIdea || a.impactScenario || "Break this assumption to unlock structural shift.",
      impactScore: impact,
      feasibilityScore: feasibility,
      sensitivityExposure: a.urgencySignal === "eroding" ? "High — actively eroding" : a.urgencySignal === "emerging" ? "Medium — window opening" : "Low — stable",
      timeHorizon: a.urgencySignal === "eroding" ? "Immediate (0-6mo)" : "Medium (6-18mo)",
      whatMustBeTrue: [
        a.currentAnswer ? `Current state: ${a.currentAnswer}` : "",
        matchedFlip?.physicalMechanism || "",
        a.competitiveBlindSpot ? `Competitor gap: ${a.competitiveBlindSpot}` : "",
      ].filter(Boolean),
      compositeScore: Math.round(impact * feasibility * sensitivityWeight) / 10,
    });
  });

  // Risk Mitigation — from hypotheses with high fragility
  if (hypotheses) {
    hypotheses
      .filter(h => h.fragility_score > 5)
      .slice(0, 2)
      .forEach((h, i) => {
        const impact = Math.round((1 - h.fragility_score / 10) * 10);
        const feasibility = 6;
        cards.push({
          id: `mitigate-${i}`,
          category: "mitigate",
          title: `Validate: ${h.hypothesis_statement || h.id}`,
          description: h.friction_sources?.join("; ") || `Test whether ${h.hypothesis_statement} holds under pressure.`,
          impactScore: Math.max(impact, 3),
          feasibilityScore: feasibility,
          sensitivityExposure: h.fragility_score > 7 ? "Critical" : "Moderate",
          timeHorizon: "Short (0-3mo)",
          whatMustBeTrue: [
            h.hypothesis_statement || "",
            h.downstream_implications || "",
            h.constraint_type ? `Constraint type: ${h.constraint_type}` : "",
          ].filter(Boolean),
          compositeScore: Math.round(Math.max(impact, 3) * feasibility * (h.fragility_score > 7 ? 1.4 : 1.0)) / 10,
        });
      });
  }

  // Compounding Asset Builds — from emerging assumptions + smart tech
  const emerging = assumptions.filter(a => a.urgencySignal === "emerging");
  const smartTech = disruptData?.smartTechAnalysis as any;
  if (smartTech?.missedOpportunities) {
    smartTech.missedOpportunities.slice(0, 2).forEach((opp: any, i: number) => {
      cards.push({
        id: `compound-${i}`,
        category: "compound",
        title: opp.application || opp.tech || "Compounding Technology Play",
        description: opp.valueCreated || "Build an asset that compounds over time.",
        impactScore: 7,
        feasibilityScore: 5,
        sensitivityExposure: "Low — builds over time",
        timeHorizon: "Long (12-36mo)",
        whatMustBeTrue: [
          opp.tech ? `Tech: ${opp.tech}` : "",
          smartTech.whyNotAlreadyDone || "",
        ].filter(Boolean),
        compositeScore: 3.5,
      });
    });
  }
  if (emerging.length > 0 && cards.filter(c => c.category === "compound").length === 0) {
    const e = emerging[0];
    cards.push({
      id: "compound-emerging",
      category: "compound",
      title: `Capitalize: ${e.assumption}`,
      description: e.impactScenario || "Emerging opportunity for compounding value.",
      impactScore: 7,
      feasibilityScore: 6,
      sensitivityExposure: "Medium — timing dependent",
      timeHorizon: "Medium (6-18mo)",
      whatMustBeTrue: [e.currentAnswer || "", e.urgencyReason || ""].filter(Boolean),
      compositeScore: 4.2,
    });
  }

  return cards.sort((a, b) => b.compositeScore - a.compositeScore);
}

function StrategyCardComponent({ card }: { card: StrategyCard }) {
  const [expanded, setExpanded] = useState(false);
  const config = CATEGORY_CONFIG[card.category];
  const Icon = config.icon;

  return (
    <div className="rounded-xl overflow-hidden transition-all" style={{ background: "hsl(var(--card))", border: `1.5px solid ${expanded ? `${config.color}40` : "hsl(var(--border))"}` }}>
      <button onClick={() => setExpanded(!expanded)} className="w-full text-left px-5 py-4 flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: config.color }}>
          <Icon size={18} style={{ color: "white" }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: config.color }}>{config.label}</span>
          </div>
          <p className="text-sm font-bold text-foreground leading-snug">{card.title}</p>
          <p className="text-sm text-foreground/80 mt-1 leading-relaxed">{card.description}</p>
        </div>
        <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
          <span className="text-lg font-black tabular-nums text-foreground">{card.compositeScore.toFixed(1)}</span>
          <span className="text-xs font-bold text-foreground/60 uppercase">Score</span>
          <ChevronDown size={14} className="text-foreground/50 transition-transform mt-1" style={{ transform: expanded ? "rotate(180deg)" : "none" }} />
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-3" style={{ borderTop: "1px solid hsl(var(--border))" }}>
          {/* Score breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3">
            {[
              { label: "Impact", value: card.impactScore, icon: Zap },
              { label: "Feasibility", value: card.feasibilityScore, icon: Target },
              { label: "Sensitivity", value: card.sensitivityExposure, icon: Shield },
              { label: "Horizon", value: card.timeHorizon, icon: Clock },
            ].map((item) => (
              <div key={item.label} className="p-2.5 rounded-lg text-center" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                <item.icon size={13} className="mx-auto mb-1" style={{ color: "hsl(var(--foreground) / 0.7)" }} />
                <p className="text-xs font-bold uppercase tracking-wider text-foreground/70">{item.label}</p>
                <p className="text-sm font-bold text-foreground mt-0.5">
                  {typeof item.value === "number" ? `${item.value}/10` : item.value}
                </p>
              </div>
            ))}
          </div>

          {/* What must be true */}
          {card.whatMustBeTrue.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-foreground/60 mb-2">What Must Be True</p>
              <div className="space-y-1.5">
                {card.whatMustBeTrue.map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 size={13} className="flex-shrink-0 mt-0.5" style={{ color: config.color }} />
                    <p className="text-sm text-foreground leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function RedesignTab({ disruptData, hypotheses, governedData }: RedesignTabProps) {
  const analysis = useAnalysis();
  const conceptsSynthesis = analysis.conceptsData as ConceptSynthesisResult | null;

  // If Invention Engine concepts exist (Product Mode), show ConceptExplorer instead of strategies
  if (conceptsSynthesis && conceptsSynthesis.concepts?.length > 0) {
    return (
      <div className="space-y-6">
        <div className="px-1">
          <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground mb-1">Invention Concepts</p>
          <p className="text-sm text-foreground/70 leading-relaxed">
            {conceptsSynthesis.concepts.length} engineering-grounded concepts generated from structural pressures, assumption flips, and technical mechanisms.
          </p>
        </div>
        <ConceptExplorer data={conceptsSynthesis} />
      </div>
    );
  }

  const strategies = deriveStrategies(disruptData, hypotheses, governedData);
  const breakStrategies = strategies.filter(s => s.category === "break");
  const mitigations = strategies.filter(s => s.category === "mitigate");
  const compounds = strategies.filter(s => s.category === "compound");

  if (strategies.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="px-1">
        <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground mb-1">Strategic Responses</p>
        <p className="text-sm text-foreground/70 leading-relaxed">Actions derived from the constraints and hypotheses above — ranked by composite impact.</p>
      </div>
      {breakStrategies.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Wrench size={14} style={{ color: "hsl(var(--primary))" }} />
            <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Constraint Break Strategies</h3>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}>
              {breakStrategies.length}
            </span>
          </div>
          {breakStrategies.map(s => <StrategyCardComponent key={s.id} card={s} />)}
        </div>
      )}

      {mitigations.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Shield size={14} style={{ color: "hsl(38 92% 42%)" }} />
            <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Risk Mitigation & Validation</h3>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "hsl(38 92% 50% / 0.1)", color: "hsl(38 92% 42%)" }}>
              {mitigations.length}
            </span>
          </div>
          {mitigations.map(s => <StrategyCardComponent key={s.id} card={s} />)}
        </div>
      )}

      {compounds.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <TrendingUp size={14} style={{ color: "hsl(142 70% 35%)" }} />
            <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Compounding Asset Builds</h3>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "hsl(142 70% 40% / 0.1)", color: "hsl(142 70% 35%)" }}>
              {compounds.length}
            </span>
          </div>
          {compounds.map(s => <StrategyCardComponent key={s.id} card={s} />)}
        </div>
      )}
    </div>
  );
}
