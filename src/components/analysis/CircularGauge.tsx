/**
 * CircularGauge — Command center metric display
 * 
 * Qualitative signal gauge with animated ring indicator.
 * No numeric values — uses qualitative labels.
 */

import { motion } from "framer-motion";

interface CircularGaugeProps {
  /** 0-100 percentage (drives ring fill internally) */
  value: number;
  /** Short label below the value */
  label: string;
  /** Gauge size in px */
  size?: number;
  /** Accent color for the filled arc */
  accentColor?: string;
  /** Optional subtext shown below label */
  subtext?: string;
}

function qualitativeLabel(value: number): string {
  if (value >= 70) return "Strong";
  if (value >= 40) return "Moderate";
  if (value > 10) return "Early";
  return "Limited";
}

export function CircularGauge({
  value,
  label,
  size = 120,
  accentColor,
  subtext,
}: CircularGaugeProps) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedValue = Math.max(0, Math.min(100, value));
  const offset = circumference - (clampedValue / 100) * circumference;

  const color = accentColor || (
    clampedValue >= 70 ? "hsl(var(--success))"
    : clampedValue >= 40 ? "hsl(var(--warning))"
    : "hsl(var(--destructive))"
  );

  const qualLabel = qualitativeLabel(clampedValue);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Track */}
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth={strokeWidth}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
          />
        </svg>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-sm font-black"
            style={{ color }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {qualLabel}
          </motion.span>
        </div>
        {/* Glow effect */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${color}08 0%, transparent 70%)`,
          }}
        />
      </div>
      <div className="text-center">
        <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
          {label}
        </p>
        {subtext && (
          <p className="text-xs text-muted-foreground/70 mt-0.5">{subtext}</p>
        )}
      </div>
    </div>
  );
}
