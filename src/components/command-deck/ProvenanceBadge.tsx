/**
 * Provenance Badge — Shows where data came from
 * Tags: CIM Extract, Census/BLS, AI-Inferred, Modeled, User Input
 */
import { memo } from "react";

export type ProvenanceSource =
  | "cim"        // Extracted from uploaded document
  | "census"     // Census Bureau / BLS data
  | "market"     // Market intelligence / Firecrawl
  | "ai"         // AI-inferred
  | "modeled"    // Deterministic calculation
  | "user"       // User-provided input
  | "benchmark"; // Industry benchmark

const CONFIG: Record<ProvenanceSource, { label: string; color: string; bg: string }> = {
  cim:       { label: "CIM Extract",   color: "hsl(var(--primary))",      bg: "hsl(var(--primary) / 0.10)" },
  census:    { label: "Census/BLS",    color: "hsl(142, 71%, 45%)",       bg: "hsl(142, 71%, 45% / 0.10)" },
  market:    { label: "Market Intel",  color: "hsl(262, 83%, 58%)",       bg: "hsl(262, 83%, 58% / 0.10)" },
  ai:        { label: "AI-Inferred",   color: "hsl(38, 92%, 50%)",        bg: "hsl(38, 92%, 50% / 0.10)" },
  modeled:   { label: "Modeled",       color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted) / 0.5)" },
  user:      { label: "User Input",    color: "hsl(200, 95%, 50%)",       bg: "hsl(200, 95%, 50% / 0.10)" },
  benchmark: { label: "Benchmark",     color: "hsl(330, 81%, 60%)",       bg: "hsl(330, 81%, 60% / 0.10)" },
};

interface ProvenanceBadgeProps {
  source: ProvenanceSource;
  className?: string;
}

export const ProvenanceBadge = memo(function ProvenanceBadge({ source, className = "" }: ProvenanceBadgeProps) {
  const c = CONFIG[source];
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${className}`}
      style={{ background: c.bg, color: c.color }}
    >
      <span className="w-1 h-1 rounded-full" style={{ background: c.color }} />
      {c.label}
    </span>
  );
});
