/**
 * ConceptExplorer — Displays 4-6 invention concepts with origin traces.
 * Each card shows: origin (driver → assumption → mechanism), engineering summary,
 * rough BOM, and precedent technologies.
 */
import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, ChevronDown, ChevronUp, Wrench, Package, FlaskConical, ArrowRight } from "lucide-react";
import type { InventionConcept, ConceptSynthesisResult } from "./types";

interface ConceptExplorerProps {
  data: ConceptSynthesisResult;
  onSelectForDeepDive?: (concept: InventionConcept) => void;
}

const ConceptCard = memo(function ConceptCard({
  concept, index, onSelectForDeepDive,
}: {
  concept: InventionConcept; index: number; onSelectForDeepDive?: (c: InventionConcept) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      className="rounded-xl overflow-hidden"
      style={{
        background: "hsl(var(--card))",
        border: "1px solid hsl(var(--border))",
      }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-5 py-4 flex items-start gap-3 hover:bg-muted/30 transition-colors"
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: "hsl(var(--primary) / 0.1)", border: "1.5px solid hsl(var(--primary) / 0.2)" }}
        >
          <span className="text-xs font-black text-primary">{index + 1}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm sm:text-base font-black text-foreground leading-snug">
            {concept.name}
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed mt-1">
            {concept.tagline}
          </p>
        </div>
        <div className="flex-shrink-0 mt-1">
          {expanded ? (
            <ChevronUp size={14} className="text-muted-foreground" />
          ) : (
            <ChevronDown size={14} className="text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Origin Trace Strip */}
      <div
        className="px-5 py-2.5 flex flex-wrap items-center gap-2 text-[10px]"
        style={{ borderTop: "1px solid hsl(var(--border))", background: "hsl(var(--muted) / 0.3)" }}
      >
        <span className="font-bold text-muted-foreground">ORIGIN:</span>
        <span className="px-1.5 py-0.5 rounded font-semibold" style={{ background: "hsl(0 72% 51% / 0.08)", color: "hsl(0 72% 40%)" }}>
          {concept.origin.structural_driver?.slice(0, 50)}
        </span>
        <ArrowRight size={8} className="text-muted-foreground" />
        <span className="px-1.5 py-0.5 rounded font-semibold" style={{ background: "hsl(38 92% 50% / 0.08)", color: "hsl(38 92% 35%)" }}>
          {concept.origin.assumption_flipped?.slice(0, 50)}
        </span>
        <ArrowRight size={8} className="text-muted-foreground" />
        <span className="px-1.5 py-0.5 rounded font-semibold" style={{ background: "hsl(217 91% 60% / 0.08)", color: "hsl(217 91% 40%)" }}>
          {concept.origin.enabling_mechanism?.slice(0, 50)}
        </span>
      </div>

      {/* Expanded Detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div
              className="px-5 py-4 space-y-4"
              style={{ borderTop: "1px solid hsl(var(--border))" }}
            >
              {/* Description */}
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-1">
                  Description
                </p>
                <p className="text-sm text-foreground leading-relaxed">
                  {concept.description}
                </p>
              </div>

              {/* Mechanism */}
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-1">
                  <FlaskConical size={10} className="inline mr-1" />
                  How It Works
                </p>
                <p className="text-sm text-foreground leading-relaxed">
                  {concept.mechanism_description}
                </p>
              </div>

              {/* Materials */}
              {concept.materials && concept.materials.length > 0 && (
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-1">
                    <Package size={10} className="inline mr-1" />
                    Materials
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {concept.materials.map((m, i) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-0.5 rounded font-semibold"
                        style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))" }}
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* BOM */}
              {concept.estimated_bom && concept.estimated_bom.length > 0 && (
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-1">
                    Estimated BOM
                  </p>
                  <div className="rounded-lg overflow-hidden" style={{ border: "1px solid hsl(var(--border))" }}>
                    <table className="w-full text-xs">
                      <thead>
                        <tr style={{ background: "hsl(var(--muted))" }}>
                          <th className="text-left px-2 py-1.5 font-bold text-muted-foreground">Component</th>
                          <th className="text-left px-2 py-1.5 font-bold text-muted-foreground">Material</th>
                          <th className="text-left px-2 py-1.5 font-bold text-muted-foreground">Process</th>
                          <th className="text-right px-2 py-1.5 font-bold text-muted-foreground">Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {concept.estimated_bom.map((item, i) => (
                          <tr key={i} style={{ borderTop: i > 0 ? "1px solid hsl(var(--border))" : undefined }}>
                            <td className="px-2 py-1.5 text-foreground font-semibold">{item.component}</td>
                            <td className="px-2 py-1.5 text-muted-foreground">{item.material}</td>
                            <td className="px-2 py-1.5 text-muted-foreground">{item.process}</td>
                            <td className="px-2 py-1.5 text-right text-foreground font-mono">{item.unitCost}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Manufacturing Path */}
              {concept.manufacturing_path && (
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-1">
                    <Wrench size={10} className="inline mr-1" />
                    Manufacturing Path
                  </p>
                  <p className="text-sm text-foreground leading-relaxed">
                    {concept.manufacturing_path}
                  </p>
                </div>
              )}

              {/* Precedent Products */}
              {concept.precedent_products && concept.precedent_products.length > 0 && (
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-1">
                    Precedent Technologies
                  </p>
                  <div className="space-y-1">
                    {concept.precedent_products.map((p, i) => (
                      <div key={i} className="text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">{p.product}</span>
                        {p.company && <span> ({p.company})</span>}
                        {p.relevance && <span> — {p.relevance}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* DFM Notes */}
              {concept.dfm_notes && (
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-1">
                    DFM Notes
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {concept.dfm_notes}
                  </p>
                </div>
              )}

              {/* Deep Dive Button */}
              {onSelectForDeepDive && (
                <button
                  onClick={() => onSelectForDeepDive(concept)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors"
                  style={{
                    background: "hsl(var(--primary))",
                    color: "hsl(var(--primary-foreground))",
                  }}
                >
                  <Wrench size={12} />
                  Engineering Deep Dive
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

export const ConceptExplorer = memo(function ConceptExplorer({
  data, onSelectForDeepDive,
}: ConceptExplorerProps) {
  if (!data?.concepts || data.concepts.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: "hsl(38 92% 50% / 0.1)" }}
        >
          <Lightbulb size={14} style={{ color: "hsl(38 92% 50%)" }} />
        </div>
        <h2 className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
          Invention Concepts
        </h2>
        <span className="text-xs font-bold text-muted-foreground/60">
          {data.concepts.length} concept{data.concepts.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="space-y-2">
        {data.concepts.map((concept, i) => (
          <ConceptCard
            key={concept.name || i}
            concept={concept}
            index={i}
            onSelectForDeepDive={onSelectForDeepDive}
          />
        ))}
      </div>
    </div>
  );
});
