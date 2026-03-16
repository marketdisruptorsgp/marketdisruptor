/**
 * ActionDirective — Zone 3: Action Directive (What To Do)
 *
 * Single recommended strategic move with full context:
 *   - Primary action (one sentence, imperative — "Your move:")
 *   - Mechanism (how it works)
 *   - First move (what to do THIS WEEK — from thesis.firstMove.action)
 *   - Success criteria (go/no-go — from thesis.firstMove.successCriteria)
 *   - Strategic precedents (2-3 real companies — from thesis.strategicPrecedents)
 *
 * Accepts either a full `thesis` (DeepenedOpportunity) for the self-contained
 * API, or individual props for backward compatibility with StrategicBriefing.
 *
 * Design: Dominant, high-contrast, action-focused — highest visual weight.
 */

import { motion } from "framer-motion";
import { Clock, Target, ArrowRight, CheckCircle2, Building2 } from "lucide-react";
import { humanizeLabel } from "@/lib/humanize";
import type { DeepenedOpportunity } from "@/lib/reconfiguration";

interface ActionDirectiveProps {
  /** Full thesis object — self-contained API for CommandDeckPage */
  thesis?: DeepenedOpportunity | null;
  /** Backward-compat individual props (used by StrategicBriefing) */
  action?: string;
  mechanism?: string | null;
  timingRationale?: string | null;
  riskMitigation?: string | null;
  timeline?: string;
  modeAccent: string;
}

export function ActionDirective({
  thesis,
  action: actionProp,
  mechanism: mechanismProp,
  timingRationale,
  riskMitigation,
  timeline: timelineProp,
  modeAccent,
}: ActionDirectiveProps) {
  // Derive from thesis when provided, fall back to individual props
  const action =
    (thesis?.firstMove?.action ? humanizeLabel(thesis.firstMove.action) : null) ??
    (actionProp ? humanizeLabel(actionProp) : null);

  const mechanism =
    thesis?.economicMechanism?.valueCreation ??
    thesis?.firstMove?.learningObjective ??
    mechanismProp ??
    null;

  const successCriteria = thesis?.firstMove?.successCriteria ?? null;
  const timeline = thesis?.firstMove?.timeframe ?? timelineProp ?? "2–4 weeks";

  // Use structured precedents when available; fall back to legacy string array only when absent
  const structuredPrecedents = thesis?.strategicPrecedents;
  const precedents =
    structuredPrecedents && structuredPrecedents.length > 0
      ? structuredPrecedents.slice(0, 3)
      : (thesis?.precedents?.slice(0, 3).map((p, i) => ({
          company: `Precedent ${i + 1}`,
          description: p,
          pattern: "",
        })) ?? []);

  if (!action) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25 }}
    >
      <div
        className="rounded-2xl px-6 py-5 space-y-4"
        style={{
          background: `${modeAccent}08`,
          border: `1.5px solid ${modeAccent}28`,
        }}
      >
        {/* Zone label */}
        <div className="flex items-center gap-2">
          <Target size={13} style={{ color: modeAccent }} />
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
            Your Move
          </span>
        </div>

        {/* Primary action — dominant type */}
        <h3 className="text-base sm:text-lg font-black text-foreground leading-snug">
          {action}
        </h3>

        {/* Context rows */}
        <div className="space-y-3">
          {mechanism && (
            <ContextRow label="How it works" value={mechanism} accent={modeAccent} />
          )}
          {timingRationale && (
            <ContextRow label="Why now" value={timingRationale} accent={modeAccent} />
          )}
          {riskMitigation && (
            <ContextRow label="De-risk execution" value={riskMitigation} accent={modeAccent} />
          )}
        </div>

        {/* First move this week */}
        {thesis?.firstMove?.action && (
          <div
            className="rounded-xl px-4 py-3 space-y-1"
            style={{
              background: `${modeAccent}0d`,
              border: `1px solid ${modeAccent}20`,
            }}
          >
            <p
              className="text-[9px] font-extrabold uppercase tracking-widest"
              style={{ color: modeAccent }}
            >
              This week
            </p>
            <p className="text-sm font-semibold text-foreground leading-snug">
              {humanizeLabel(thesis.firstMove.action)}
            </p>
            {successCriteria && (
              <div className="flex items-start gap-1.5 pt-1">
                <CheckCircle2 size={11} className="flex-shrink-0 mt-0.5" style={{ color: modeAccent }} />
                <p className="text-[11px] text-muted-foreground leading-snug">
                  <span className="font-bold">Go/no-go: </span>
                  {successCriteria}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Strategic precedents */}
        {precedents.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Building2 size={11} className="text-muted-foreground" />
              <p className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground">
                Precedents
              </p>
            </div>
            <div className="space-y-1">
              {precedents.map((p, i) => (
                <p key={i} className="text-[11px] text-muted-foreground leading-relaxed">
                  <span className="font-bold text-foreground/80">{p.company}</span>
                  {p.description ? ` — ${p.description}` : ""}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Timeline footer */}
        <div
          className="flex items-center gap-1.5 pt-1"
          style={{ borderTop: "1px solid hsl(var(--border) / 0.4)" }}
        >
          <Clock size={11} className="text-muted-foreground" />
          <span className="text-[11px] font-semibold text-muted-foreground">
            Timeline: {timeline}
          </span>
          <ArrowRight size={10} className="ml-auto text-muted-foreground/40" />
        </div>
      </div>
    </motion.div>
  );
}

function ContextRow({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="space-y-0.5">
      <p
        className="text-[9px] font-extrabold uppercase tracking-widest"
        style={{ color: `${accent}bb` }}
      >
        {label}
      </p>
      <p className="text-sm text-foreground/80 leading-relaxed">{value}</p>
    </div>
  );
}
