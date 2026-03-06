/**
 * KPI GAUGE — Circular gauge for Command Deck metrics.
 * Animated SVG ring with center value, label, and subtitle.
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

export function KPIGauge({ label, value, max = 100, subtitle, icon: Icon, color, delay = 0 }: KPIGaugeProps) {
  const numValue = typeof value === "string" ? parseFloat(value) || 0 : value;
  const pct = Math.min(numValue / max, 1);
  const r = 32;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);

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
        <p className="text-2xl font-extrabold tabular-nums text-foreground leading-none">{value}</p>
        <p className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground mt-1">{label}</p>
        {subtitle && <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
    </motion.div>
  );
}
