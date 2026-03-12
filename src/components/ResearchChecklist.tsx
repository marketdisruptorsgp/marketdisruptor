/**
 * RESEARCH CHECKLIST — "What We Don't Know"
 * 
 * Converts low-confidence data gaps into actionable research questions.
 * This is the honest alternative to fabricating insights from thin air.
 */

import React, { useState } from "react";
import { Search, AlertTriangle, CheckCircle2, Copy, ChevronDown, ChevronRight } from "lucide-react";
import type { ResearchQuestion, ConfidenceAssessment } from "@/lib/confidenceGating";
import { toast } from "sonner";

interface ResearchChecklistProps {
  assessment: ConfidenceAssessment;
  /** Compact mode for inline display */
  compact?: boolean;
}

const PRIORITY_STYLES: Record<string, { color: string; bg: string; label: string }> = {
  high: { color: "hsl(0 72% 50%)", bg: "hsl(0 72% 50% / 0.1)", label: "Critical" },
  medium: { color: "hsl(38 92% 42%)", bg: "hsl(38 92% 42% / 0.1)", label: "Important" },
  low: { color: "hsl(217 91% 45%)", bg: "hsl(217 91% 45% / 0.1)", label: "Nice to Have" },
};

const AREA_LABELS: Record<string, string> = {
  pricing: "💲 Pricing",
  supply_chain: "🔗 Supply Chain",
  competitive: "⚔️ Competitive",
  technical: "🔧 Technical",
  regulatory: "📋 Regulatory",
  market_size: "📊 Market Size",
  customer: "👥 Customer",
};

export function ResearchChecklist({ assessment, compact = false }: ResearchChecklistProps) {
  const [expanded, setExpanded] = useState(!compact);
  const { researchQuestions, knownVsInferred } = assessment;

  if (researchQuestions.length === 0) return null;

  const highPriority = researchQuestions.filter(q => q.priority === "high");
  const otherPriority = researchQuestions.filter(q => q.priority !== "high");

  const handleCopyAll = () => {
    const text = researchQuestions.map((q, i) => {
      const ps = PRIORITY_STYLES[q.priority];
      return `${i + 1}. [${ps.label}] ${q.question}\n   Rationale: ${q.rationale}\n   Data Needed: ${q.dataNeeded}`;
    }).join("\n\n");
    
    navigator.clipboard.writeText(`RESEARCH CHECKLIST — What We Don't Know\n${"=".repeat(50)}\n\n${text}`);
    toast.success("Research checklist copied");
  };

  if (compact) {
    return (
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-[10px] font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
      >
        <AlertTriangle size={12} />
        {highPriority.length} critical research gaps
        {expanded ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-left"
        >
          <Search size={14} className="text-amber-500" />
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              What We Don't Know
            </h4>
            <p className="text-[10px] text-muted-foreground">
              {highPriority.length} critical gaps • {otherPriority.length} additional questions
            </p>
          </div>
          {expanded ? <ChevronDown size={12} className="text-muted-foreground" /> : <ChevronRight size={12} className="text-muted-foreground" />}
        </button>
        
        <button
          onClick={handleCopyAll}
          className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Copy research checklist"
        >
          <Copy size={10} />
          Copy
        </button>
      </div>

      {expanded && (
        <div className="space-y-2">
          {/* Data reliability context */}
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            This analysis used real data for {knownVsInferred.knownCount} of {knownVsInferred.knownCount + knownVsInferred.inferredCount} data areas.
            The questions below highlight where AI inference was used instead of verified data — 
            <strong> investigating these will materially improve the analysis quality.</strong>
          </p>

          {/* Questions grouped by priority */}
          {highPriority.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: PRIORITY_STYLES.high.color }}>
                ⚡ Critical — Directly Impacts Viability
              </span>
              {highPriority.map((q, i) => (
                <QuestionItem key={`high-${i}`} question={q} />
              ))}
            </div>
          )}

          {otherPriority.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                📋 Additional Research
              </span>
              {otherPriority.map((q, i) => (
                <QuestionItem key={`other-${i}`} question={q} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function QuestionItem({ question }: { question: ResearchQuestion }) {
  const [checked, setChecked] = useState(false);
  const ps = PRIORITY_STYLES[question.priority];

  return (
    <div
      className={`rounded border p-2.5 transition-all ${checked ? "opacity-50 border-green-500/30 bg-green-500/5" : "border-border bg-card/50"}`}
    >
      <div className="flex items-start gap-2">
        <button
          onClick={() => setChecked(!checked)}
          className="mt-0.5 flex-shrink-0"
        >
          {checked ? (
            <CheckCircle2 size={14} className="text-green-500" />
          ) : (
            <div className="w-3.5 h-3.5 rounded border border-muted-foreground/40" />
          )}
        </button>
        
        <div className="flex-1 space-y-1">
          <p className={`text-[11px] font-medium leading-snug ${checked ? "line-through text-muted-foreground" : "text-foreground"}`}>
            {question.question}
          </p>
          <p className="text-[9px] text-muted-foreground leading-relaxed">
            {question.rationale}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="inline-flex items-center px-1.5 py-0.5 rounded text-[7px] font-bold uppercase"
              style={{ color: ps.color, background: ps.bg }}
            >
              {ps.label}
            </span>
            <span className="text-[8px] text-muted-foreground">
              {AREA_LABELS[question.affectedArea] || question.affectedArea}
            </span>
            <span className="text-[8px] text-muted-foreground/60">
              Need: {question.dataNeeded}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
