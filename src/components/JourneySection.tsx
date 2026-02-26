import React from "react";

interface JourneySectionProps {
  /** Compact label for the analytical stage (e.g. "ASSUMPTIONS", "RISK ANALYSIS") */
  label: string;
  /** One-sentence analytical summary */
  summary: string;
  /** Primary insight content */
  children: React.ReactNode;
  /** Optional supporting signals rendered below primary content */
  supporting?: React.ReactNode;
  /** Mode accent color — only visual difference between modes */
  accentColor?: string;
}

/**
 * Standardized analytical section used across ALL modes and ALL steps.
 * Enforces: label → summary → insight → signals reading order.
 * Label is subdued; analytical content receives highest visual emphasis.
 */
export function JourneySection({
  label,
  summary,
  children,
  supporting,
  accentColor,
}: JourneySectionProps) {
  return (
    <section
      className="rounded-lg border border-border bg-card p-4 sm:p-5 space-y-3"
      style={accentColor ? { borderLeftWidth: "3px", borderLeftColor: accentColor } : undefined}
    >
      {/* 1. Section label — compact, not dominant */}
      <span
        className="inline-block typo-card-eyebrow"
        style={accentColor ? { color: accentColor } : undefined}
      >
        {label}
      </span>

      {/* 2. One-sentence analytical summary */}
      <p className="typo-card-body leading-snug text-foreground">{summary}</p>

      {/* 3. Primary insight content — highest visual emphasis */}
      <div className="space-y-3">{children}</div>

      {/* 4. Optional supporting signals */}
      {supporting && (
        <div className="pt-2 border-t border-border space-y-2">{supporting}</div>
      )}
    </section>
  );
}
