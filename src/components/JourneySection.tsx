import React from "react";

interface JourneySectionProps {
  /** Compact label for the analytical stage (e.g. "ASSUMPTIONS", "RISK ANALYSIS") */
  label: string;
  /** One-sentence analytical summary */
  summary: string;
  /** L1 visual slot — rendered BEFORE any text (visual primacy) */
  visual?: React.ReactNode;
  /** Primary insight content (text-level detail) */
  children: React.ReactNode;
  /** Optional supporting signals rendered below primary content */
  supporting?: React.ReactNode;
  /** Mode accent color — only visual difference between modes */
  accentColor?: string;
}

/**
 * Standardized analytical section used across ALL modes and ALL steps.
 * Enforces: visual → label → summary → detail → signals reading order.
 * When a visual slot is provided, text children collapse into an expandable panel.
 */
export function JourneySection({
  label,
  summary,
  visual,
  children,
  supporting,
  accentColor,
}: JourneySectionProps) {
  const hasVisual = !!visual;

  return (
    <section
      className="rounded-lg border border-border bg-card p-4 sm:p-5 space-y-3"
      style={accentColor ? { borderLeftWidth: "3px", borderLeftColor: accentColor } : undefined}
    >
      {/* 1. L1 Visual — always first, always visible */}
      {hasVisual && <div className="space-y-2">{visual}</div>}

      {/* 2. Section label — compact, not dominant */}
      <span
        className="inline-block typo-card-eyebrow"
        style={accentColor ? { color: accentColor } : undefined}
      >
        {label}
      </span>

      {/* 3. One-sentence analytical summary (the only text at L1) */}
      <p className="typo-card-body leading-snug text-foreground">{summary}</p>

      {/* 4. Text detail — collapsed when visual is present (text suppression) */}
      {hasVisual ? (
        <details className="group">
          <summary className="cursor-pointer select-none flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] font-bold text-muted-foreground transition-colors hover:text-foreground hover:bg-muted">
            <span className="transition-transform group-open:rotate-90">▶</span>
            Structural Detail
          </summary>
          <div className="mt-2 space-y-3">{children}</div>
        </details>
      ) : (
        <div className="space-y-3">{children}</div>
      )}

      {/* 5. Optional supporting signals */}
      {supporting && (
        <div className="pt-2 border-t border-border space-y-2">{supporting}</div>
      )}
    </section>
  );
}
