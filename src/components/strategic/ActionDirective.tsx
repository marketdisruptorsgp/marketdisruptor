/**
 * ActionDirective — Zone 3: Action Directive (What To Do)
 *
 * Single recommended move with full strategic context:
 *   - Primary action ("Do this next week")
 *   - Mechanism ("Here's how it works")
 *   - Timing rationale ("Why now is the moment")
 *   - Risk mitigation ("How to de-risk execution")
 *
 * Executive briefing aesthetic — one directive, fully contextualised.
 */

import { motion } from "framer-motion";
import { Clock, Target, ArrowRight } from "lucide-react";
import { humanizeLabel } from "@/lib/humanize";

interface ActionDirectiveProps {
  action: string;
  mechanism: string | null;
  timingRationale: string | null;
  riskMitigation: string | null;
  timeline: string;
  modeAccent: string;
}

export function ActionDirective({
  action,
  mechanism,
  timingRationale,
  riskMitigation,
  timeline,
  modeAccent,
}: ActionDirectiveProps) {
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
            Action Directive
          </span>
        </div>

        {/* Primary action */}
        <h3 className="text-base sm:text-lg font-black text-foreground leading-snug">
          {humanizeLabel(action)}
        </h3>

        {/* Context grid */}
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

        {/* Timeline */}
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
