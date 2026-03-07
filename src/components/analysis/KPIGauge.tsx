/**
 * KPI GAUGE — Qualitative indicator for Command Deck metrics.
 * No numeric scores. Uses evidence strength labels.
 */

import { motion } from "framer-motion";

interface KPIGaugeProps {
  label: string;
  value: number | string;
  max?: number;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
  delay?: number;
}

function qualLabel(value: number | string, max: number): string {
  const numValue = typeof value === "string" ? parseFloat(value) || 0 : value;
  const pct = numValue / max;
  if (pct >= 0.7) return "Strong";
  if (pct >= 0.4) return "Moderate";
  if (pct >= 0.1) return "Limited";
  return "TBD";
}

export function KPIGauge({ label, value, max = 100, subtitle, icon: Icon, color, delay = 0 }: KPIGaugeProps) {
  const numValue = typeof value === "string" ? parseFloat(value) || 0 : value;
  const pct = Math.min(numValue / max, 1);
  const r = 32;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);
  const qual = qualLabel(value, max);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="rounded-xl p-4 flex flex-col items-center gap-2 bg-card border border-border"
    >
      <div className="relative">
        <svg width="76" height="76" viewBox="0 0 76 76" className="transform -rotate-90">
          <circle cx="38" cy="38" r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="5" />
          <motion.circle
            cx="38" cy="38" r={r} fill="none"
            stroke={color} strokeWidth="5" strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: "easeOut", delay: delay + 0.2 }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon size={18} style={{ color }} />
        </div>
      </div>
      <div className="text-center">
        <p className="text-lg font-extrabold text-foreground leading-none">{qual}</p>
        <p className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground mt-1">{label}</p>
        {subtitle && <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
    </motion.div>
  );
}
