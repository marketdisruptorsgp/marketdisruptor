/**
 * CIM Key Findings — Surfaces specific extracted constraints and evidence
 * from uploaded documents. This is where the "aha moments" live.
 *
 * Shows the actual data points extracted from the CIM with evidence quotes,
 * specific numbers, and business-specific details that generic analysis misses.
 */

import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileSearch, AlertTriangle, ChevronDown, ChevronUp, Quote } from "lucide-react";

interface ExtractedConstraint {
  constraint: string;
  type: string;
  confidence: string;
  causes: string[];
  effects: string[];
  evidence: string[];
}

interface CIMKeyFindingsProps {
  biExtraction: Record<string, unknown> | null | undefined;
  modeAccent: string;
}

/** Pull specific dollar amounts, percentages, timeframes from text */
function extractSpecifics(text: string): string[] {
  const patterns = [
    /\$[\d,]+[KkMmBb]?\b/g,                    // dollar amounts
    /\d+\.?\d*\s*%/g,                            // percentages
    /\d+\s*(?:months?|weeks?|years?|days?|hours?)/gi, // timeframes
    /\d{1,3}(?:,\d{3})+/g,                       // large numbers
  ];
  const specifics = new Set<string>();
  for (const p of patterns) {
    const matches = text.match(p);
    if (matches) matches.forEach(m => specifics.add(m.trim()));
  }
  return Array.from(specifics).slice(0, 5);
}

function constraintTypeColor(type: string): string {
  switch (type) {
    case "financial": return "hsl(0 72% 50%)";
    case "operational": return "hsl(38 92% 50%)";
    case "market": return "hsl(229 89% 63%)";
    case "strategic": return "hsl(280 65% 55%)";
    default: return "hsl(var(--muted-foreground))";
  }
}

function ConstraintCard({ constraint, index }: { constraint: ExtractedConstraint; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const typeColor = constraintTypeColor(constraint.type);
  const specifics = constraint.evidence.flatMap(e => extractSpecifics(e));

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
          className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
          style={{ background: typeColor, boxShadow: `0 0 6px ${typeColor}40` }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground leading-snug">
            {constraint.constraint}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span
              className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{ background: `${typeColor}15`, color: typeColor }}
            >
              {constraint.type}
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
              {/* Evidence quotes — the actual CIM text */}
              {constraint.evidence.length > 0 && (
                <div>
                  <p className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground mb-1.5">
                    From the document
                  </p>
                  {constraint.evidence.map((e, i) => (
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
              {constraint.effects.length > 0 && (
                <div>
                  <p className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground mb-1">
                    Business Impact
                  </p>
                  <ul className="space-y-0.5">
                    {constraint.effects.map((e, i) => (
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

  const constraints = (biExtraction.constraints ?? []) as ExtractedConstraint[];
  if (!Array.isArray(constraints) || constraints.length === 0) return null;

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
        <span className="text-xs font-bold text-muted-foreground/60">
          {constraints.length} constraint{constraints.length !== 1 ? "s" : ""} identified
        </span>
      </div>

      <div className="space-y-1.5">
        {constraints.map((c, i) => (
          <ConstraintCard key={c.constraint || i} constraint={c} index={i} />
        ))}
      </div>
    </div>
  );
});
