/**
 * STRATEGY BRIEFING
 * Consulting-style visual strategy dashboard that renders structured
 * competitive refinement data as cards, checklists, and warning tiles.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target, Shield, TrendingUp, Zap, OctagonX,
  ChevronDown, ChevronUp, CheckCircle2, ArrowRight,
  Lightbulb, Swords, DollarSign, Clock,
} from "lucide-react";

export interface StrategyBriefingData {
  coreDifferentiator: {
    headline: string;
    bullets: string[];
    competitorRef: string;
  };
  positioning: {
    approach: string;
    avoid: { competitor: string; reason: string }[];
    challenge: { competitor: string; angle: string }[];
  };
  businessModelAngles: {
    name: string;
    description: string;
    opportunity: string;
  }[];
  quickWins: {
    action: string;
    detail: string;
    timeframe: string;
  }[];
  antiPatterns: {
    rule: string;
    reason: string;
    competitor: string;
  }[];
}

interface StrategyBriefingProps {
  data: StrategyBriefingData;
  accentColor?: string;
}

const cardBase = "rounded-xl border border-border bg-card overflow-hidden";
const sectionTitle = "text-[10px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2";

export function StrategyBriefing({ data, accentColor = "hsl(var(--primary))" }: StrategyBriefingProps) {
  const [expandedAnti, setExpandedAnti] = useState<Record<number, boolean>>({});

  return (
    <div className="space-y-5">
      {/* ── CORE DIFFERENTIATOR ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className={`${cardBase} relative`}
        style={{ borderLeft: `4px solid ${accentColor}` }}
      >
        <div className="p-5 space-y-3">
          <div className={sectionTitle} style={{ color: accentColor }}>
            <Target size={14} strokeWidth={2.5} />
            Core Differentiator
          </div>
          <p className="text-base font-bold text-foreground leading-snug">
            {data.coreDifferentiator.headline}
          </p>
          <ul className="space-y-2">
            {data.coreDifferentiator.bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-foreground/85 leading-relaxed">
                <Lightbulb size={14} className="mt-0.5 shrink-0" style={{ color: accentColor }} />
                {b}
              </li>
            ))}
          </ul>
          {data.coreDifferentiator.competitorRef && (
            <p className="text-xs text-muted-foreground pt-1 border-t border-border mt-2">
              vs. {data.coreDifferentiator.competitorRef}
            </p>
          )}
        </div>
      </motion.div>

      {/* ── POSITIONING STRATEGY ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="space-y-3"
      >
        <div className={sectionTitle} style={{ color: "hsl(var(--primary))" }}>
          <Shield size={14} strokeWidth={2.5} />
          Positioning Strategy
        </div>

        <div className={`${cardBase} p-4`}>
          <p className="text-sm text-foreground leading-relaxed font-medium">{data.positioning.approach}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Avoid column */}
          <div className={`${cardBase} p-4 space-y-4`}>
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-destructive">
              <OctagonX size={12} />
              Do Not Challenge
            </div>
            {data.positioning.avoid.map((a, i) => (
              <div key={i} className="space-y-1">
                <p className="text-sm font-bold text-foreground">{a.competitor}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">— {a.reason}</p>
              </div>
            ))}
          </div>

          {/* Challenge column */}
          <div className={`${cardBase} p-4 space-y-4`}>
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest" style={{ color: "hsl(142 71% 45%)" }}>
              <Swords size={12} />
              Challenge Head-On
            </div>
            {data.positioning.challenge.map((c, i) => (
              <div key={i} className="space-y-1">
                <p className="text-sm font-bold text-foreground">{c.competitor}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">— {c.angle}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── BUSINESS MODEL ANGLES ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="space-y-3"
      >
        <div className={sectionTitle} style={{ color: "hsl(38 92% 50%)" }}>
          <DollarSign size={14} strokeWidth={2.5} />
          Business Model Angles
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {data.businessModelAngles.map((m, i) => (
            <div key={i} className={`${cardBase} p-4 space-y-2`}>
              <p className="text-sm font-bold text-foreground">{m.name}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{m.description}</p>
              <div className="flex items-start gap-1.5 pt-1 border-t border-border text-xs" style={{ color: "hsl(38 92% 50%)" }}>
                <TrendingUp size={12} className="mt-0.5 shrink-0" />
                <span className="text-foreground">{m.opportunity}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── QUICK WINS ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15 }}
        className="space-y-3"
      >
        <div className={sectionTitle} style={{ color: "hsl(142 71% 45%)" }}>
          <Zap size={14} strokeWidth={2.5} />
          Quick Wins — First 90 Days
        </div>
        <div className="space-y-2">
          {data.quickWins.map((w, i) => (
            <div key={i} className={`${cardBase} p-4 flex items-start gap-3`}>
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: "hsl(142 71% 45% / 0.1)" }}
              >
                <CheckCircle2 size={15} style={{ color: "hsl(142 71% 45%)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-foreground">{w.action}</p>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0 flex items-center gap-1">
                    <Clock size={9} /> {w.timeframe}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{w.detail}</p>
              </div>
              <ArrowRight size={14} className="text-muted-foreground shrink-0 mt-1" />
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── ANTI-PATTERNS ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.2 }}
        className="space-y-3"
      >
        <div className={sectionTitle} style={{ color: "hsl(0 84% 60%)" }}>
          <OctagonX size={14} strokeWidth={2.5} />
          Anti-Patterns — What NOT to Do
        </div>
        <div className="space-y-2">
          {data.antiPatterns.map((a, i) => (
            <div
              key={i}
              className={`${cardBase} cursor-pointer transition-colors hover:bg-destructive/[0.03]`}
              style={{ borderLeft: "3px solid hsl(0 84% 60%)" }}
              onClick={() => setExpandedAnti(prev => ({ ...prev, [i]: !prev[i] }))}
            >
              <div className="p-4 flex items-center gap-3">
                <OctagonX size={16} className="shrink-0" style={{ color: "hsl(0 84% 60%)" }} />
                <p className="text-sm font-bold text-foreground flex-1">{a.rule}</p>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive shrink-0">
                  {a.competitor}
                </span>
                {expandedAnti[i] ? (
                  <ChevronUp size={14} className="text-muted-foreground shrink-0" />
                ) : (
                  <ChevronDown size={14} className="text-muted-foreground shrink-0" />
                )}
              </div>
              <AnimatePresence>
                {expandedAnti[i] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-0 text-xs text-muted-foreground leading-relaxed border-t border-border mt-0">
                      <div className="pt-3">{a.reason}</div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
