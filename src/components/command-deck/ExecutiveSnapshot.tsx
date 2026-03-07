/**
 * ExecutiveSnapshot — Dense above-fold strategic intelligence grid
 * 
 * 6 compact panels in a 3x2 grid showing all key intelligence at a glance.
 * Each panel has a bold headline + 2-3 key bullets. Click to expand.
 */

import { memo, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crosshair, Shield, Lock, Zap, Radar, Fingerprint,
  ChevronDown, ChevronUp, TrendingUp, AlertTriangle,
  Eye, Target, ArrowRight,
} from "lucide-react";
import { humanizeLabel } from "@/lib/humanize";
import type { Evidence } from "@/lib/evidenceEngine";
import type { StrategicInsight, StrategicNarrative } from "@/lib/strategicEngine";
import type { StructuralPattern } from "@/lib/strategicPatternEngine";

interface ExecutiveSnapshotProps {
  narrative: StrategicNarrative | null;
  evidence: Evidence[];
  insights: StrategicInsight[];
  mode: "product" | "service" | "business";
  completedSteps: number;
  totalSteps: number;
  modeAccent: string;
  strongCategories: string[];
  weakCategories: string[];
  trappedValue: string | null;
  trappedValueEstimate: string | null;
  trappedValueDrivers: string[];
  patterns: StructuralPattern[];
  diagnosisEvidence: Array<{ category: string; detail: string }>;
}

function strengthBadge(c: number): { label: string; color: string } {
  if (c >= 0.7) return { label: "Strong", color: "hsl(var(--success))" };
  if (c >= 0.4) return { label: "Moderate", color: "hsl(var(--warning))" };
  if (c >= 0.15) return { label: "Early", color: "hsl(var(--muted-foreground))" };
  return { label: "Preliminary", color: "hsl(var(--muted-foreground))" };
}

/* ── Individual Panel ── */
function SnapshotPanel({
  icon: Icon, title, badgeLabel, badgeColor, children, accent, expandedContent,
}: {
  icon: React.ElementType;
  title: string;
  badgeLabel?: string;
  badgeColor?: string;
  children: React.ReactNode;
  accent: string;
  expandedContent?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
      onClick={() => expandedContent && setOpen(o => !o)}
    >
      <div className="px-3 py-2.5">
        <div className="flex items-center gap-2 mb-1.5">
          <Icon size={13} style={{ color: accent }} className="flex-shrink-0" />
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground truncate">
            {title}
          </span>
          {badgeLabel && (
            <span
              className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ml-auto flex-shrink-0"
              style={{ color: badgeColor, background: `${badgeColor}15` }}
            >
              {badgeLabel}
            </span>
          )}
          {expandedContent && (
            <span className="ml-auto text-muted-foreground">
              {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </span>
          )}
        </div>
        {children}
      </div>
      <AnimatePresence>
        {open && expandedContent && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-border px-3 py-2 overflow-hidden"
          >
            {expandedContent}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Bullet item ── */
function Bullet({ text, color }: { text: string; color?: string }) {
  return (
    <div className="flex items-start gap-1.5 py-0.5">
      <div className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0" style={{ background: color || "hsl(var(--muted-foreground))" }} />
      <span className="text-[11px] text-foreground/80 leading-snug line-clamp-2">{text}</span>
    </div>
  );
}

export const ExecutiveSnapshot = memo(function ExecutiveSnapshot({
  narrative, evidence, insights, mode, completedSteps, totalSteps, modeAccent,
  strongCategories, weakCategories, trappedValue, trappedValueEstimate,
  trappedValueDrivers, patterns, diagnosisEvidence,
}: ExecutiveSnapshotProps) {
  const confidence = narrative?.verdictConfidence ?? 0;
  const strength = strengthBadge(confidence);
  const constraint = humanizeLabel(narrative?.primaryConstraint) || null;
  const opportunity = humanizeLabel(narrative?.breakthroughOpportunity) || null;
  const verdict = narrative?.strategicVerdict || null;

  // Top signals from evidence
  const topSignals = useMemo(() => {
    const byImpact = [...evidence].sort((a, b) => (b.impact ?? 0) - (a.impact ?? 0));
    return byImpact.slice(0, 4).map(e => humanizeLabel(e.label || e.description || "") || "Signal detected");
  }, [evidence]);

  // Top drivers from insights
  const topDrivers = useMemo(() => {
    return insights
      .filter(i => i.insightType === "driver" || i.insightType === "leverage_point" || i.insightType === "constraint_cluster")
      .slice(0, 4)
      .map(i => humanizeLabel(i.label) || i.description?.slice(0, 60) || "Driver identified");
  }, [insights]);

  // X-ray chain summary
  const xrayChain = useMemo(() => {
    const parts: string[] = [];
    if (constraint) parts.push(`Constraint: ${constraint}`);
    if (narrative?.strategicDirection) parts.push(`Direction: ${humanizeLabel(narrative.strategicDirection)}`);
    if (opportunity) parts.push(`Opportunity: ${opportunity}`);
    if (narrative?.whyThisMatters) parts.push(narrative.whyThisMatters);
    return parts.slice(0, 3);
  }, [constraint, opportunity, narrative]);

  const primaryPattern = patterns.length > 0 ? patterns[0] : null;
  const hasData = !!constraint || !!verdict || confidence >= 0.15;

  const diagnosis = useMemo(() => {
    if (narrative?.verdictRationale && narrative.verdictRationale.length > 20 && narrative.verdictRationale.length < 200)
      return narrative.verdictRationale;
    if (constraint && verdict) return `${constraint} is constraining growth. ${verdict}.`;
    if (constraint) return `Key structural constraint: ${constraint.toLowerCase()}.`;
    if (verdict) return verdict;
    if (completedSteps > 0) return "Initial signals detected — run more steps to strengthen diagnosis.";
    return "Run analysis to generate strategic diagnosis.";
  }, [constraint, verdict, narrative, completedSteps]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-2"
    >
      {/* ── Row 1: Diagnosis headline (full width) ── */}
      <div
        className="rounded-lg px-4 py-3"
        style={{ background: "hsl(var(--card))", border: `2px solid ${modeAccent}30` }}
      >
        <div className="flex items-center gap-2 mb-1">
          <Crosshair size={13} style={{ color: modeAccent }} />
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
            Strategic Diagnosis
          </span>
          <span
            className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ml-auto"
            style={{ color: strength.color, background: `${strength.color}15` }}
          >
            {strength.label} Evidence · {evidence.length} signals · {completedSteps}/{totalSteps} steps
          </span>
        </div>
        <p className={`text-sm sm:text-base font-black leading-snug ${hasData ? "text-foreground" : "text-muted-foreground italic"}`}>
          {diagnosis}
        </p>
        {opportunity && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <ArrowRight size={11} style={{ color: modeAccent }} />
            <span className="text-[11px] font-bold text-muted-foreground">Unlock:</span>
            <span className="text-[11px] font-bold text-foreground">{opportunity}</span>
          </div>
        )}
      </div>

      {/* ── Row 2: 3x2 dense grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">

        {/* 1. Evidence Confidence */}
        <SnapshotPanel
          icon={Shield}
          title="Evidence"
          badgeLabel={strength.label}
          badgeColor={strength.color}
          accent={modeAccent}
          expandedContent={
            weakCategories.length > 0 ? (
              <div>
                <p className="text-[10px] font-bold text-muted-foreground mb-1">Missing data:</p>
                {weakCategories.map(w => <Bullet key={w} text={w} color="hsl(var(--destructive))" />)}
              </div>
            ) : undefined
          }
        >
          {strongCategories.length > 0 ? (
            strongCategories.slice(0, 3).map(cat => (
              <Bullet key={cat} text={cat} color="hsl(var(--success))" />
            ))
          ) : (
            <p className="text-[11px] text-muted-foreground italic">Run more steps to build evidence</p>
          )}
        </SnapshotPanel>

        {/* 2. Trapped Value */}
        <SnapshotPanel
          icon={Lock}
          title="Trapped Value"
          badgeLabel={trappedValueEstimate || undefined}
          badgeColor={modeAccent}
          accent={modeAccent}
          expandedContent={
            trappedValueDrivers.length > 1 ? (
              <div>
                {trappedValueDrivers.slice(1).map((d, i) => <Bullet key={i} text={d} color={modeAccent} />)}
              </div>
            ) : undefined
          }
        >
          {trappedValue ? (
            <p className="text-[11px] text-foreground/80 leading-snug line-clamp-3">{trappedValue}</p>
          ) : (
            <p className="text-[11px] text-muted-foreground italic">No trapped value identified yet</p>
          )}
        </SnapshotPanel>

        {/* 3. Key Drivers */}
        <SnapshotPanel
          icon={Zap}
          title="Drivers"
          badgeLabel={topDrivers.length > 0 ? `${topDrivers.length}` : undefined}
          badgeColor={modeAccent}
          accent={modeAccent}
        >
          {topDrivers.length > 0 ? (
            topDrivers.slice(0, 3).map((d, i) => <Bullet key={i} text={d} color={modeAccent} />)
          ) : (
            <p className="text-[11px] text-muted-foreground italic">Drivers emerge after analysis</p>
          )}
        </SnapshotPanel>

        {/* 4. Market Signals */}
        <SnapshotPanel
          icon={Radar}
          title="Key Signals"
          badgeLabel={topSignals.length > 0 ? `${evidence.length}` : undefined}
          badgeColor={modeAccent}
          accent={modeAccent}
          expandedContent={
            topSignals.length > 3 ? (
              <div>
                {topSignals.slice(3).map((s, i) => <Bullet key={i} text={s} color="hsl(var(--warning))" />)}
              </div>
            ) : undefined
          }
        >
          {topSignals.length > 0 ? (
            topSignals.slice(0, 3).map((s, i) => <Bullet key={i} text={s} color="hsl(var(--warning))" />)
          ) : (
            <p className="text-[11px] text-muted-foreground italic">Signals detected after analysis</p>
          )}
        </SnapshotPanel>

        {/* 5. Structural Pattern */}
        <SnapshotPanel
          icon={Fingerprint}
          title="Pattern"
          badgeLabel={primaryPattern ? (primaryPattern.matchScore >= 0.6 ? "Strong" : "Moderate") : undefined}
          badgeColor={primaryPattern?.matchScore && primaryPattern.matchScore >= 0.6 ? "hsl(var(--success))" : "hsl(var(--warning))"}
          accent={modeAccent}
          expandedContent={
            patterns.length > 1 ? (
              <div>
                {patterns.slice(1, 3).map((p, i) => <Bullet key={i} text={`${p.name}: ${p.description?.slice(0, 60) || "detected"}`} color="hsl(var(--muted-foreground))" />)}
              </div>
            ) : undefined
          }
        >
          {primaryPattern ? (
            <>
              <p className="text-[11px] font-bold text-foreground leading-snug">{primaryPattern.name}</p>
              <p className="text-[10px] text-muted-foreground leading-snug line-clamp-2 mt-0.5">
                {primaryPattern.description?.slice(0, 80) || "Structural archetype detected"}
              </p>
            </>
          ) : (
            <p className="text-[11px] text-muted-foreground italic">Patterns detected after deeper analysis</p>
          )}
        </SnapshotPanel>

        {/* 6. X-Ray Insights */}
        <SnapshotPanel
          icon={Eye}
          title="X-Ray"
          accent={modeAccent}
          expandedContent={
            xrayChain.length > 2 ? (
              <div>
                {xrayChain.slice(2).map((c, i) => <Bullet key={i} text={c} color={modeAccent} />)}
              </div>
            ) : undefined
          }
        >
          {xrayChain.length > 0 ? (
            xrayChain.slice(0, 2).map((c, i) => <Bullet key={i} text={c} color={modeAccent} />)
          ) : (
            <p className="text-[11px] text-muted-foreground italic">Causal chain builds after analysis</p>
          )}
        </SnapshotPanel>
      </div>
    </motion.div>
  );
});
