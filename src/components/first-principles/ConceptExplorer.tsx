/**
 * ConceptExplorer — Displays 4-6 invention concepts with origin traces.
 * Each card shows: origin (driver → assumption → mechanism), before/after narrative,
 * engineering summary, rough BOM, persona fit scores, and precedent technologies.
 */
import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lightbulb, ChevronDown, ChevronUp, Wrench, Package, FlaskConical,
  ArrowRight, Eye, EyeOff, Users, Zap, Building2, GraduationCap,
  Rocket, Factory, Truck, Network,
} from "lucide-react";
import type { InventionConcept, ConceptSynthesisResult, BreakthroughMetric, PerformerMapping, SystemArchitecture } from "./types";
import type { InventionConcept, ConceptSynthesisResult } from "./types";
import { PERSONA_LENS_META } from "./types";

interface ConceptExplorerProps {
  data: ConceptSynthesisResult;
  onSelectForDeepDive?: (concept: InventionConcept) => void;
}

// ═══════════════════════════════════════════════════════════════
//  BEFORE / AFTER NARRATIVE — The "Aha" Moment
// ═══════════════════════════════════════════════════════════════

const BeforeAfterNarrative = memo(function BeforeAfterNarrative({
  before_after,
}: {
  before_after: { the_old_way: string; the_new_way: string };
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {/* The Old Way */}
      <div
        className="rounded-lg px-4 py-3 relative overflow-hidden"
        style={{
          background: "hsl(var(--destructive) / 0.04)",
          border: "1px solid hsl(var(--destructive) / 0.12)",
        }}
      >
        <div className="flex items-center gap-1.5 mb-2">
          <EyeOff size={11} style={{ color: "hsl(var(--destructive))" }} />
          <p
            className="text-[9px] font-extrabold uppercase tracking-widest"
            style={{ color: "hsl(var(--destructive))" }}
          >
            The Old Way
          </p>
        </div>
        <p className="text-xs text-foreground/70 leading-relaxed italic">
          "{before_after.the_old_way}"
        </p>
        {/* Strikethrough decoration */}
        <div
          className="absolute top-1/2 left-0 right-0 h-[1px] opacity-10 pointer-events-none"
          style={{ background: "hsl(var(--destructive))" }}
        />
      </div>

      {/* The New Way */}
      <div
        className="rounded-lg px-4 py-3"
        style={{
          background: "hsl(142 70% 45% / 0.04)",
          border: "1px solid hsl(142 70% 45% / 0.15)",
        }}
      >
        <div className="flex items-center gap-1.5 mb-2">
          <Eye size={11} style={{ color: "hsl(142 70% 35%)" }} />
          <p
            className="text-[9px] font-extrabold uppercase tracking-widest"
            style={{ color: "hsl(142 70% 35%)" }}
          >
            The New Way
          </p>
        </div>
        <p className="text-xs text-foreground leading-relaxed font-medium">
          "{before_after.the_new_way}"
        </p>
      </div>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════
//  PERSONA FIT STRIP — Multi-lens comparison
// ═══════════════════════════════════════════════════════════════

const PersonaFitStrip = memo(function PersonaFitStrip({
  persona_fit,
  activeLens,
}: {
  persona_fit: Record<string, { fit_score: number; rationale: string; key_adaptation: string } | undefined>;
  activeLens: string | null;
}) {
  const lensIds = Object.keys(PERSONA_LENS_META);

  return (
    <div className="grid grid-cols-3 gap-2">
      {lensIds.map((id) => {
        const meta = PERSONA_LENS_META[id];
        const fit = persona_fit?.[id];
        if (!fit) return null;

        const isActive = activeLens === id;
        const score = fit.fit_score;
        const scoreColor =
          score >= 8
            ? "hsl(142 70% 35%)"
            : score >= 5
              ? "hsl(38 92% 42%)"
              : "hsl(var(--destructive))";

        return (
          <div
            key={id}
            className="rounded-lg px-3 py-2.5 transition-all"
            style={{
              background: isActive ? `${scoreColor}08` : "hsl(var(--muted) / 0.4)",
              border: `1px solid ${isActive ? `${scoreColor}25` : "hsl(var(--border))"}`,
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs">{meta.emoji}</span>
              <span
                className="text-sm font-black tabular-nums"
                style={{ color: scoreColor }}
              >
                {score}/10
              </span>
            </div>
            <p className="text-[9px] font-bold text-foreground truncate">
              {meta.label}
            </p>
            <p className="text-[9px] text-muted-foreground leading-snug mt-0.5 line-clamp-2">
              {fit.rationale}
            </p>
          </div>
        );
      })}
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════
//  CONCEPT CARD
// ═══════════════════════════════════════════════════════════════

const ConceptCard = memo(function ConceptCard({
  concept,
  index,
  onSelectForDeepDive,
  activeLens,
}: {
  concept: InventionConcept;
  index: number;
  onSelectForDeepDive?: (c: InventionConcept) => void;
  activeLens: string | null;
}) {
  const [expanded, setExpanded] = useState(false);

  // If a lens is active, show the fit score in the header
  const activeFit = activeLens && concept.persona_fit?.[activeLens];
  const fitScore = activeFit ? (activeFit as any).fit_score : null;
  const fitColor =
    fitScore !== null
      ? fitScore >= 8
        ? "hsl(142 70% 35%)"
        : fitScore >= 5
          ? "hsl(38 92% 42%)"
          : "hsl(var(--destructive))"
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.06 }}
      className="rounded-xl overflow-hidden"
      style={{
        background: "hsl(var(--card))",
        border: fitColor
          ? `1.5px solid ${fitColor}30`
          : "1px solid hsl(var(--border))",
      }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left px-5 py-4 flex items-start gap-3 hover:bg-muted/30 transition-colors"
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{
            background: "hsl(var(--primary) / 0.1)",
            border: "1.5px solid hsl(var(--primary) / 0.2)",
          }}
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
        <div className="flex items-center gap-2 flex-shrink-0 mt-1">
          {fitScore !== null && (
            <span
              className="text-sm font-black tabular-nums"
              style={{ color: fitColor! }}
            >
              {fitScore}/10
            </span>
          )}
          {expanded ? (
            <ChevronUp size={14} className="text-muted-foreground" />
          ) : (
            <ChevronDown size={14} className="text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Before/After Narrative — always visible (the aha moment) */}
      {concept.before_after && (
        <div
          className="px-5 py-3"
          style={{ borderTop: "1px solid hsl(var(--border))" }}
        >
          <BeforeAfterNarrative before_after={concept.before_after} />
        </div>
      )}

      {/* Origin Trace Strip */}
      <div
        className="px-5 py-2.5 flex flex-wrap items-center gap-2 text-[10px]"
        style={{
          borderTop: "1px solid hsl(var(--border))",
          background: "hsl(var(--muted) / 0.3)",
        }}
      >
        <span className="font-bold text-muted-foreground">ORIGIN:</span>
        <span
          className="px-1.5 py-0.5 rounded font-semibold"
          style={{
            background: "hsl(0 72% 51% / 0.08)",
            color: "hsl(0 72% 40%)",
          }}
        >
          {concept.origin.structural_driver?.slice(0, 50)}
        </span>
        <ArrowRight size={8} className="text-muted-foreground" />
        <span
          className="px-1.5 py-0.5 rounded font-semibold"
          style={{
            background: "hsl(38 92% 50% / 0.08)",
            color: "hsl(38 92% 35%)",
          }}
        >
          {concept.origin.assumption_flipped?.slice(0, 50)}
        </span>
        <ArrowRight size={8} className="text-muted-foreground" />
        <span
          className="px-1.5 py-0.5 rounded font-semibold"
          style={{
            background: "hsl(217 91% 60% / 0.08)",
            color: "hsl(217 91% 40%)",
          }}
        >
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

              {/* Persona Fit — Multi-lens comparison */}
              {concept.persona_fit && (
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-2">
                    <Users size={10} className="inline mr-1" />
                    Who Should Build This
                  </p>
                  <PersonaFitStrip
                    persona_fit={concept.persona_fit}
                    activeLens={activeLens}
                  />
                  {/* Show key adaptation for active lens */}
                  {activeLens && concept.persona_fit[activeLens] && (
                    <div
                      className="mt-2 px-3 py-2 rounded-lg text-xs"
                      style={{
                        background: "hsl(var(--muted) / 0.5)",
                        border: "1px solid hsl(var(--border))",
                      }}
                    >
                      <span className="font-bold text-foreground">
                        {PERSONA_LENS_META[activeLens]?.emoji} Key Adaptation:
                      </span>{" "}
                      <span className="text-foreground/80">
                        {(concept.persona_fit[activeLens] as any)?.key_adaptation}
                      </span>
                    </div>
                  )}
                </div>
              )}

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
                        style={{
                          background: "hsl(var(--muted))",
                          color: "hsl(var(--foreground))",
                        }}
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
                  <div
                    className="rounded-lg overflow-hidden"
                    style={{ border: "1px solid hsl(var(--border))" }}
                  >
                    <table className="w-full text-xs">
                      <thead>
                        <tr style={{ background: "hsl(var(--muted))" }}>
                          <th className="text-left px-2 py-1.5 font-bold text-muted-foreground">
                            Component
                          </th>
                          <th className="text-left px-2 py-1.5 font-bold text-muted-foreground">
                            Material
                          </th>
                          <th className="text-left px-2 py-1.5 font-bold text-muted-foreground">
                            Process
                          </th>
                          <th className="text-right px-2 py-1.5 font-bold text-muted-foreground">
                            Cost
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {concept.estimated_bom.map((item, i) => (
                          <tr
                            key={i}
                            style={{
                              borderTop:
                                i > 0
                                  ? "1px solid hsl(var(--border))"
                                  : undefined,
                            }}
                          >
                            <td className="px-2 py-1.5 text-foreground font-semibold">
                              {item.component}
                            </td>
                            <td className="px-2 py-1.5 text-muted-foreground">
                              {item.material}
                            </td>
                            <td className="px-2 py-1.5 text-muted-foreground">
                              {item.process}
                            </td>
                            <td className="px-2 py-1.5 text-right text-foreground font-mono">
                              {item.unitCost}
                            </td>
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
              {concept.precedent_products &&
                concept.precedent_products.length > 0 && (
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-1">
                      Precedent Technologies
                    </p>
                    <div className="space-y-1">
                      {concept.precedent_products.map((p, i) => (
                        <div key={i} className="text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground">
                            {p.product}
                          </span>
                          {p.company && <span> ({p.company})</span>}
                          {p.relevance && <span> — {p.relevance}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Breakthrough Metric Badge */}
              {concept.breakthrough_metric && (
                <BreakthroughMetricBadge metric={concept.breakthrough_metric} />
              )}

              {/* System Architecture */}
              {concept.system_architecture && concept.system_architecture.nodes?.length > 0 && (
                <SystemArchitectureDiagram architecture={concept.system_architecture} />
              )}

              {/* Performer Network */}
              {concept.performer_network && concept.performer_network.length > 0 && (
                <PerformerNetworkPanel performers={concept.performer_network} />
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

// ═══════════════════════════════════════════════════════════════
//  LENS SWITCHER — Multi-lens filter tabs
// ═══════════════════════════════════════════════════════════════

const LensSwitcher = memo(function LensSwitcher({
  activeLens,
  onSetLens,
}: {
  activeLens: string | null;
  onSetLens: (lens: string | null) => void;
}) {
  const lensIds = Object.keys(PERSONA_LENS_META);

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <button
        onClick={() => onSetLens(null)}
        className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all"
        style={{
          background: activeLens === null ? "hsl(var(--primary) / 0.12)" : "hsl(var(--muted) / 0.5)",
          color: activeLens === null ? "hsl(var(--primary))" : "hsl(var(--foreground) / 0.6)",
          border: `1px solid ${activeLens === null ? "hsl(var(--primary) / 0.2)" : "transparent"}`,
        }}
      >
        All Lenses
      </button>
      {lensIds.map((id) => {
        const meta = PERSONA_LENS_META[id];
        const isActive = activeLens === id;
        return (
          <button
            key={id}
            onClick={() => onSetLens(isActive ? null : id)}
            className="px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all"
            style={{
              background: isActive ? "hsl(var(--primary) / 0.12)" : "hsl(var(--muted) / 0.5)",
              color: isActive ? "hsl(var(--primary))" : "hsl(var(--foreground) / 0.6)",
              border: `1px solid ${isActive ? "hsl(var(--primary) / 0.2)" : "transparent"}`,
            }}
          >
            {meta.emoji} {meta.label}
          </button>
        );
      })}
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════
//  CONTRARIAN NARRATIVE BANNER — Industry blind spot
// ═══════════════════════════════════════════════════════════════

const ContrarianNarrativeBanner = memo(function ContrarianNarrativeBanner({
  narrative,
}: {
  narrative: { industry_blind_spot: string; why_blind: string; evidence: string; unlock_statement: string };
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-xl overflow-hidden"
      style={{
        background: "linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--primary) / 0.03) 100%)",
        border: "1.5px solid hsl(var(--primary) / 0.15)",
      }}
    >
      <div className="px-5 py-4 space-y-3">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center"
            style={{ background: "hsl(var(--destructive) / 0.1)" }}
          >
            <span className="text-xs">🔥</span>
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
            Industry Blind Spot
          </span>
        </div>

        <p className="text-base font-black text-foreground leading-snug">
          "{narrative.industry_blind_spot}"
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <p className="text-[9px] font-extrabold uppercase tracking-widest" style={{ color: "hsl(var(--destructive))" }}>
              Why the industry is blind
            </p>
            <p className="text-xs text-foreground/70 leading-relaxed">
              {narrative.why_blind}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[9px] font-extrabold uppercase tracking-widest" style={{ color: "hsl(142 70% 35%)" }}>
              Value unlocked
            </p>
            <p className="text-xs text-foreground leading-relaxed font-medium">
              {narrative.unlock_statement}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

// ═══════════════════════════════════════════════════════════════
//  MAIN EXPORT
// ═══════════════════════════════════════════════════════════════

export const ConceptExplorer = memo(function ConceptExplorer({
  data,
  onSelectForDeepDive,
}: ConceptExplorerProps) {
  const [activeLens, setActiveLens] = useState<string | null>(null);

  if (!data?.concepts || data.concepts.length === 0) return null;

  // Sort concepts by active lens fit score if a lens is selected
  const sortedConcepts = activeLens
    ? [...data.concepts].sort((a, b) => {
        const aScore = (a.persona_fit?.[activeLens] as any)?.fit_score ?? 0;
        const bScore = (b.persona_fit?.[activeLens] as any)?.fit_score ?? 0;
        return bScore - aScore;
      })
    : data.concepts;

  // Check if any concept has persona_fit data
  const hasPersonaFit = data.concepts.some((c) => c.persona_fit);

  return (
    <div className="space-y-3">
      {/* Contrarian Narrative Banner — the big "aha" */}
      {data.contrarian_narrative && (
        <ContrarianNarrativeBanner narrative={data.contrarian_narrative} />
      )}

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
          {data.concepts.length} concept
          {data.concepts.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Lens Switcher — Multi-lens filter */}
      {hasPersonaFit && (
        <LensSwitcher activeLens={activeLens} onSetLens={setActiveLens} />
      )}

      <div className="space-y-2">
        {sortedConcepts.map((concept, i) => (
          <ConceptCard
            key={concept.name || i}
            concept={concept}
            index={i}
            onSelectForDeepDive={onSelectForDeepDive}
            activeLens={activeLens}
          />
        ))}
      </div>
    </div>
  );
});
