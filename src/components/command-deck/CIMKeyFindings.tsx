/**
 * CIM Key Findings — Surfaces extracted constraints AND opportunities
 * from uploaded documents with evidence quotes.
 *
 * Now consumes both constraints[] and opportunities[] from the extraction
 * schema (the AI classifies them correctly at source).
 */

import { memo, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileSearch, ChevronDown, ChevronUp, Quote, TrendingUp, AlertTriangle, Sparkles } from "lucide-react";

interface ExtractedConstraint {
  constraint: string;
  type: string;
  confidence: string;
  causes: string[];
  effects: string[];
  evidence: string[];
}

interface ExtractedOpportunity {
  opportunity: string;
  type: string;
  confidence: string;
  enablers: string[];
  potential_impact: string[];
  evidence: string[];
}

interface UnifiedFinding {
  label: string;
  type: string;
  confidence: string;
  details: string[];        // causes or enablers
  impacts: string[];        // effects or potential_impact
  evidence: string[];
  classification: "constraint" | "opportunity";
}

interface CIMKeyFindingsProps {
  biExtraction: Record<string, unknown> | null | undefined;
  modeAccent: string;
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

function FindingCard({ finding, index }: { finding: UnifiedFinding; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const isOpp = finding.classification === "opportunity";
  const colors = isOpp
    ? { bg: "hsl(152 60% 44% / 0.08)", text: "hsl(152 60% 44%)", dot: "hsl(152 60% 44%)" }
    : { bg: "hsl(0 72% 50% / 0.08)", text: "hsl(0 72% 50%)", dot: "hsl(0 72% 50%)" };
  const specifics = finding.evidence.flatMap(e => extractSpecifics(e));
  const ClassIcon = isOpp ? TrendingUp : AlertTriangle;

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
              {isOpp ? "Opportunity" : finding.type.charAt(0).toUpperCase() + finding.type.slice(1)}
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

              {/* Impact */}
              {finding.impacts.length > 0 && (
                <div>
                  <p className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground mb-1">
                    {isOpp ? "Upside Potential" : "Business Impact"}
                  </p>
                  <ul className="space-y-0.5">
                    {finding.impacts.map((e, i) => (
                      <li key={i} className="text-xs text-foreground/70 flex items-start gap-1.5">
                        <span className="text-muted-foreground mt-1">→</span>
                        {e}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Enablers / Causes */}
              {finding.details.length > 0 && (
                <div>
                  <p className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground mb-1">
                    {isOpp ? "What Makes This Possible" : "Root Causes"}
                  </p>
                  <ul className="space-y-0.5">
                    {finding.details.map((d, i) => (
                      <li key={i} className="text-xs text-foreground/70 flex items-start gap-1.5">
                        <span className="text-muted-foreground mt-1">•</span>
                        {d}
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
  const findings = useMemo(() => {
    if (!biExtraction) return [];
    const unified: UnifiedFinding[] = [];

    // Constraints
    const rawConstraints = (biExtraction.constraints ?? []) as ExtractedConstraint[];
    if (Array.isArray(rawConstraints)) {
      for (const c of rawConstraints) {
        unified.push({
          label: c.constraint,
          type: c.type || "operational",
          confidence: c.confidence || "medium",
          details: c.causes || [],
          impacts: c.effects || [],
          evidence: c.evidence || [],
          classification: "constraint",
        });
      }
    }

    // Opportunities (new schema)
    const rawOpportunities = (biExtraction.opportunities ?? []) as ExtractedOpportunity[];
    if (Array.isArray(rawOpportunities)) {
      for (const o of rawOpportunities) {
        unified.push({
          label: o.opportunity,
          type: o.type || "capacity",
          confidence: o.confidence || "medium",
          details: o.enablers || [],
          impacts: o.potential_impact || [],
          evidence: o.evidence || [],
          classification: "opportunity",
        });
      }
    }

    // Sort: opportunities first, then constraints
    return unified.sort((a, b) => {
      if (a.classification === "opportunity" && b.classification !== "opportunity") return -1;
      if (a.classification !== "opportunity" && b.classification === "opportunity") return 1;
      return 0;
    });
  }, [biExtraction]);

  if (!biExtraction || findings.length === 0) return null;

  const oppCount = findings.filter(f => f.classification === "opportunity").length;
  const constraintCount = findings.filter(f => f.classification === "constraint").length;

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
          {oppCount > 0 && <span style={{ color: "hsl(152 60% 44%)" }}>{oppCount} opportunit{oppCount !== 1 ? "ies" : "y"}</span>}
          {oppCount > 0 && constraintCount > 0 && <span>·</span>}
          {constraintCount > 0 && <span>{constraintCount} constraint{constraintCount !== 1 ? "s" : ""}</span>}
        </div>
      </div>

      <div className="space-y-1.5">
        {findings.map((f, i) => (
          <FindingCard key={f.label || i} finding={f} index={i} />
        ))}
      </div>
    </div>
  );
});
