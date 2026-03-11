/**
 * CIM Key Findings — Surfaces specific extracted constraints and evidence
 * from uploaded documents. This is where the "aha moments" live.
 *
 * Includes a post-extraction contradiction detector that reclassifies
 * items with positive framing (growth capacity, expansion runway) as
 * opportunities rather than constraints.
 */

import { memo, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileSearch, ChevronDown, ChevronUp, Quote, TrendingUp, AlertTriangle } from "lucide-react";

interface ExtractedConstraint {
  constraint: string;
  type: string;
  confidence: string;
  causes: string[];
  effects: string[];
  evidence: string[];
}

interface ClassifiedFinding {
  label: string;
  type: string;
  confidence: string;
  causes: string[];
  effects: string[];
  evidence: string[];
  /** Reclassified from constraint → opportunity by contradiction detection */
  classification: "constraint" | "opportunity" | "mixed";
  contradictionNote?: string;
}

interface CIMKeyFindingsProps {
  biExtraction: Record<string, unknown> | null | undefined;
  modeAccent: string;
}

// ── Contradiction Detection ──
// Positive-framing signals that indicate opportunity, not constraint
const POSITIVE_SIGNALS = [
  /additional\s+\$[\d,]+/i,                    // "additional $800,000"
  /room\s+for\s+(growth|expansion)/i,           // "room for growth"
  /can\s+support/i,                             // "can support"
  /capacity\s+(allows?|for|to)/i,               // "capacity to..."
  /growth\s+potential/i,                         // "growth potential"
  /more\s+aggressive\s+project/i,               // "more aggressive project acquisition"
  /utilizing\s+the\s+existing/i,                // "utilizing the existing footprint"
  /without\s+(additional|new)\s+(investment|capital|hiring)/i,
  /opportunity\s+to\s+(expand|grow|add)/i,
  /untapped/i,
  /upside/i,
  /runway/i,
];

const NEGATIVE_SIGNALS = [
  /missed\s+(revenue|opportunities?)/i,
  /inability\s+to/i,
  /limited\s+by/i,
  /bottleneck/i,
  /constrain(ed|ing|t)/i,
  /capping\s+growth/i,
  /strain/i,
  /risk/i,
];

function detectContradiction(finding: ExtractedConstraint): ClassifiedFinding {
  const allText = [
    finding.constraint,
    ...finding.evidence,
    ...finding.causes,
  ].join(" ");

  const effectsText = finding.effects.join(" ");

  const positiveScore = POSITIVE_SIGNALS.reduce((s, p) => s + (p.test(allText) ? 1 : 0), 0);
  const negativeInEffects = NEGATIVE_SIGNALS.reduce((s, p) => s + (p.test(effectsText) ? 1 : 0), 0);
  const positiveInEvidence = POSITIVE_SIGNALS.reduce((s, p) => s + (p.test(finding.evidence.join(" ")) ? 1 : 0), 0);

  // If evidence is positive but effects are negative → contradiction
  if (positiveInEvidence >= 2 && negativeInEffects >= 1) {
    return {
      ...finding,
      label: finding.constraint,
      classification: "opportunity",
      contradictionNote: `The document frames this as expansion capacity, not a limitation. The evidence shows untapped upside rather than a structural bottleneck.`,
    };
  }

  // Strong positive framing → opportunity
  if (positiveScore >= 2 && negativeInEffects < 2) {
    return {
      ...finding,
      label: finding.constraint,
      classification: "opportunity",
    };
  }

  // Mixed signals
  if (positiveScore >= 1 && negativeInEffects >= 1) {
    return {
      ...finding,
      label: finding.constraint,
      classification: "mixed",
      contradictionNote: `This has both constraint and opportunity dimensions — the underlying capacity exists but isn't being captured.`,
    };
  }

  return {
    ...finding,
    label: finding.constraint,
    classification: "constraint",
  };
}

/** Pull specific dollar amounts, percentages, timeframes from text */
function extractSpecifics(text: string): string[] {
  const patterns = [
    /\$[\d,]+[KkMmBb]?\b/g,
    /\d+\.?\d*\s*%/g,
    /\d+\s*(?:months?|weeks?|years?|days?|hours?)/gi,
    /\d{1,3}(?:,\d{3})+/g,
  ];
  const specifics = new Set<string>();
  for (const p of patterns) {
    const matches = text.match(p);
    if (matches) matches.forEach(m => specifics.add(m.trim()));
  }
  return Array.from(specifics).slice(0, 5);
}

function classificationColor(classification: string): { bg: string; text: string; dot: string } {
  switch (classification) {
    case "opportunity":
      return { bg: "hsl(152 60% 44% / 0.08)", text: "hsl(152 60% 44%)", dot: "hsl(152 60% 44%)" };
    case "mixed":
      return { bg: "hsl(38 92% 50% / 0.08)", text: "hsl(38 92% 50%)", dot: "hsl(38 92% 50%)" };
    default: // constraint
      return { bg: "hsl(0 72% 50% / 0.08)", text: "hsl(0 72% 50%)", dot: "hsl(0 72% 50%)" };
  }
}

function typeLabel(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function FindingCard({ finding, index }: { finding: ClassifiedFinding; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const colors = classificationColor(finding.classification);
  const specifics = finding.evidence.flatMap(e => extractSpecifics(e));
  const ClassIcon = finding.classification === "opportunity" ? TrendingUp : AlertTriangle;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
      className="rounded-lg overflow-hidden"
      style={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-muted/30 transition-colors"
      >
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5"
          style={{ background: colors.dot, boxShadow: `0 0 6px ${colors.dot}40` }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground leading-snug">
            {finding.label}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span
              className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded flex items-center gap-1"
              style={{ background: colors.bg, color: colors.text }}
            >
              <ClassIcon size={9} />
              {finding.classification === "opportunity" ? "Opportunity" : finding.classification === "mixed" ? "Mixed" : typeLabel(finding.type)}
            </span>
            {specifics.length > 0 && specifics.slice(0, 3).map((s, i) => (
              <span key={i} className="text-[10px] font-bold text-foreground/70 bg-muted px-1.5 py-0.5 rounded">
                {s}
              </span>
            ))}
          </div>
        </div>
        <div className="flex-shrink-0 mt-0.5">
          {expanded ? (
            <ChevronUp size={12} className="text-muted-foreground" />
          ) : (
            <ChevronDown size={12} className="text-muted-foreground" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              className="px-4 py-3 space-y-3"
              style={{ borderTop: "1px solid hsl(var(--border))" }}
            >
              {/* Contradiction note */}
              {finding.contradictionNote && (
                <div
                  className="flex items-start gap-2 px-3 py-2 rounded-lg text-xs"
                  style={{ background: colors.bg, border: `1px solid ${colors.text}20` }}
                >
                  <ClassIcon size={11} className="flex-shrink-0 mt-0.5" style={{ color: colors.text }} />
                  <p style={{ color: colors.text }} className="font-semibold leading-snug">
                    {finding.contradictionNote}
                  </p>
                </div>
              )}

              {/* Evidence quotes */}
              {finding.evidence.length > 0 && (
                <div>
                  <p className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground mb-1.5">
                    From the document
                  </p>
                  {finding.evidence.map((e, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <Quote size={10} className="text-muted-foreground flex-shrink-0 mt-1" />
                      <p className="text-xs text-foreground/80 leading-relaxed italic">
                        "{e}"
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Business impact */}
              {finding.effects.length > 0 && (
                <div>
                  <p className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground mb-1">
                    {finding.classification === "opportunity" ? "Upside Potential" : "Business Impact"}
                  </p>
                  <ul className="space-y-0.5">
                    {finding.effects.map((e, i) => (
                      <li key={i} className="text-xs text-foreground/70 flex items-start gap-1.5">
                        <span className="text-muted-foreground mt-1">→</span>
                        {e}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export const CIMKeyFindings = memo(function CIMKeyFindings({
  biExtraction,
  modeAccent,
}: CIMKeyFindingsProps) {
  if (!biExtraction) return null;

  const rawConstraints = (biExtraction.constraints ?? []) as ExtractedConstraint[];
  if (!Array.isArray(rawConstraints) || rawConstraints.length === 0) return null;

  // Run contradiction detection on all extracted constraints
  const classifiedFindings = useMemo(() => {
    return rawConstraints.map(c => detectContradiction(c));
  }, [rawConstraints]);

  // Sort: opportunities first, then mixed, then constraints
  const sortedFindings = useMemo(() => {
    const order = { opportunity: 0, mixed: 1, constraint: 2 };
    return [...classifiedFindings].sort(
      (a, b) => order[a.classification] - order[b.classification]
    );
  }, [classifiedFindings]);

  const oppCount = classifiedFindings.filter(f => f.classification === "opportunity").length;
  const constraintCount = classifiedFindings.filter(f => f.classification === "constraint").length;
  const mixedCount = classifiedFindings.filter(f => f.classification === "mixed").length;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: `${modeAccent}12` }}
        >
          <FileSearch size={14} style={{ color: modeAccent }} />
        </div>
        <h2 className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
          Key Findings from Document
        </h2>
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground/60">
          {constraintCount > 0 && <span>{constraintCount} constraint{constraintCount !== 1 ? "s" : ""}</span>}
          {oppCount > 0 && <><span>·</span><span className="text-emerald-500">{oppCount} opportunit{oppCount !== 1 ? "ies" : "y"}</span></>}
          {mixedCount > 0 && <><span>·</span><span className="text-amber-500">{mixedCount} mixed</span></>}
        </div>
      </div>

      <div className="space-y-1.5">
        {sortedFindings.map((f, i) => (
          <FindingCard key={f.label || i} finding={f} index={i} />
        ))}
      </div>
    </div>
  );
});
