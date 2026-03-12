/**
 * PROVENANCE BADGE — Visual indicator of data reliability.
 * 
 * Shows whether a data point is VERIFIED, SCRAPED, MODELED, or AI-INFERRED.
 * AI-INFERRED gets an amber warning treatment to signal lower confidence.
 */

import React from "react";
import { AlertTriangle, CheckCircle, Database, Cpu, User } from "lucide-react";
import type { DataConfidenceLevel } from "@/lib/confidenceGating";
import { getConfidenceBadgeStyle } from "@/lib/confidenceGating";

interface ProvenanceBadgeProps {
  level: DataConfidenceLevel;
  /** Optional tooltip with source detail */
  source?: string;
  /** Compact mode — icon only */
  compact?: boolean;
}

export function ProvenanceBadge({ level, source, compact = false }: ProvenanceBadgeProps) {
  const style = getConfidenceBadgeStyle(level);
  
  const Icon = level === "verified" ? CheckCircle
    : level === "scraped" ? Database
    : level === "parametric" ? Cpu
    : level === "user_input" ? User
    : AlertTriangle;

  if (compact) {
    return (
      <span
        title={source || style.label}
        className="inline-flex items-center"
        style={{ color: style.color }}
      >
        <Icon size={10} />
      </span>
    );
  }

  return (
    <span
      title={source || `Data source: ${style.label}`}
      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider cursor-help"
      style={{
        color: style.color,
        background: style.bgColor,
        border: `1px solid ${style.borderColor}`,
      }}
    >
      <Icon size={8} />
      {style.label}
    </span>
  );
}

/**
 * Data confidence summary bar — shows overall analysis reliability
 */
interface ConfidenceSummaryBarProps {
  overallScore: number;
  knownCount: number;
  inferredCount: number;
}

export function ConfidenceSummaryBar({ overallScore, knownCount, inferredCount }: ConfidenceSummaryBarProps) {
  const total = knownCount + inferredCount;
  const knownPct = total > 0 ? (knownCount / total) * 100 : 0;
  const inferredPct = total > 0 ? (inferredCount / total) * 100 : 0;

  const overallLabel = overallScore >= 0.7 ? "Well Grounded"
    : overallScore >= 0.5 ? "Partially Grounded"
    : overallScore >= 0.3 ? "Mostly Inferred"
    : "Low Data — Treat as Hypotheses";

  const overallColor = overallScore >= 0.7 ? "hsl(142 70% 35%)"
    : overallScore >= 0.5 ? "hsl(217 91% 45%)"
    : overallScore >= 0.3 ? "hsl(38 92% 42%)"
    : "hsl(0 72% 50%)";

  return (
    <div className="rounded-lg border border-border bg-card/50 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Data Confidence
        </span>
        <span
          className="text-[10px] font-bold uppercase tracking-wider"
          style={{ color: overallColor }}
        >
          {overallLabel}
        </span>
      </div>
      
      {/* Confidence bar */}
      <div className="h-1.5 rounded-full bg-muted overflow-hidden flex">
        <div
          className="h-full rounded-l-full transition-all"
          style={{
            width: `${knownPct}%`,
            background: "hsl(142 70% 45%)",
          }}
        />
        <div
          className="h-full transition-all"
          style={{
            width: `${inferredPct}%`,
            background: "hsl(38 92% 50% / 0.5)",
          }}
        />
      </div>
      
      <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ background: "hsl(142 70% 45%)" }} />
          {knownCount} data-grounded
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ background: "hsl(38 92% 50% / 0.5)" }} />
          {inferredCount} AI-inferred
        </span>
      </div>
    </div>
  );
}
