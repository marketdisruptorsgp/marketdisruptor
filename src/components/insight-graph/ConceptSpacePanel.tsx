/**
 * ConceptSpacePanel — Design Space Expansion UI
 *
 * Shows the dimension matrix and concept variants generated from an opportunity.
 * Allows selecting variants for stress testing.
 */

import { memo, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Boxes, CheckCircle2, Circle, ArrowRight, ChevronDown, X } from "lucide-react";
import type { ConceptSpace, ConceptVariant, DesignDimension, QualitativeTier } from "@/lib/conceptExpansion";
import { NODE_TYPE_CONFIG } from "@/lib/insightGraph";

interface ConceptSpacePanelProps {
  conceptSpace: ConceptSpace;
  onToggleVariant: (variantId: string) => void;
  onDismissVariant?: (variantId: string) => void;
  onStressTestSelected?: () => void;
}

const TIER_ORDER: Record<QualitativeTier, number> = { strong: 3, moderate: 2, early: 1 };

function tierColor(tier: QualitativeTier): string {
  if (tier === "strong") return "hsl(142 70% 45%)";
  if (tier === "moderate") return "hsl(38 92% 50%)";
  return "hsl(var(--muted-foreground))";
}

export const ConceptSpacePanel = memo(function ConceptSpacePanel({
  conceptSpace,
  onToggleVariant,
  onDismissVariant,
  onStressTestSelected,
}: ConceptSpacePanelProps) {
  const [activeView, setActiveView] = useState<"variants" | "dimensions">("variants");
  const [sortBy, setSortBy] = useState<"feasibility" | "novelty" | "marketReadiness">("marketReadiness");

  const selectedCount = conceptSpace.variants.filter(v => v.selectedForStressTest).length;

  const sortedVariants = useMemo(() => {
    return [...conceptSpace.variants].sort((a, b) => {
      return TIER_ORDER[b[sortBy]] - TIER_ORDER[a[sortBy]];
    });
  }, [conceptSpace.variants, sortBy]);

  const cfg = NODE_TYPE_CONFIG["concept_variant"];

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: cfg.bgColor, border: `1.5px solid ${cfg.borderColor}` }}
        >
          <Boxes size={14} style={{ color: cfg.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: cfg.color }}>
            Design Space · {conceptSpace.dimensions.length} Dimensions
          </p>
          <p className="text-xs font-bold text-foreground">
            {conceptSpace.variants.length} concept directions generated
          </p>
        </div>
      </div>

      {/* View toggle */}
      <div className="flex items-center gap-1 rounded-lg p-0.5 bg-muted border border-border">
        {(["variants", "dimensions"] as const).map(v => (
          <button
            key={v}
            onClick={() => setActiveView(v)}
            className="px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all capitalize"
            style={{
              background: activeView === v ? "hsl(var(--card))" : "transparent",
              color: activeView === v ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
              boxShadow: activeView === v ? "0 1px 3px hsl(0 0% 0% / 0.1)" : "none",
            }}
          >
            {v === "variants" ? `Concepts (${conceptSpace.variants.length})` : `Dimensions (${conceptSpace.dimensions.length})`}
          </button>
        ))}
      </div>

      {/* Variants view */}
      {activeView === "variants" && (
        <>
          {/* Sort controls */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sort:</span>
            {(["marketReadiness", "feasibility", "novelty"] as const).map(s => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className="px-2 py-1 rounded-md text-[10px] font-bold transition-all"
                style={{
                  background: sortBy === s ? cfg.bgColor : "transparent",
                  color: sortBy === s ? cfg.color : "hsl(var(--muted-foreground))",
                  border: sortBy === s ? `1px solid ${cfg.borderColor}` : "1px solid transparent",
                }}
              >
                {s === "marketReadiness" ? "Market Ready" : s === "feasibility" ? "Feasibility" : "Novelty"}
              </button>
            ))}
          </div>

          {/* Variant cards */}
          <div className="space-y-2 max-h-[350px] overflow-y-auto scrollbar-hide">
            {sortedVariants.map((variant, i) => (
              <VariantCard
                key={variant.id}
                variant={variant}
                rank={i + 1}
                onToggle={() => onToggleVariant(variant.id)}
                onDismiss={onDismissVariant ? () => onDismissVariant(variant.id) : undefined}
              />
            ))}
          </div>

          {/* Stress test action */}
          {selectedCount > 0 && onStressTestSelected && (
            <motion.button
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={onStressTestSelected}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all hover:scale-[1.01] active:scale-[0.99]"
              style={{
                background: "hsl(var(--primary))",
                color: "hsl(var(--primary-foreground))",
              }}
            >
              <ArrowRight size={14} />
              Stress Test {selectedCount} Concept{selectedCount > 1 ? "s" : ""}
            </motion.button>
          )}
        </>
      )}

      {/* Dimensions view */}
      {activeView === "dimensions" && (
        <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-hide">
          {conceptSpace.dimensions.map(dim => (
            <DimensionCard key={dim.id} dimension={dim} />
          ))}
        </div>
      )}
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════
//  SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

function TierBadge({ label, tier }: { label: string; tier: QualitativeTier }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
      <span
        className="text-[9px] font-bold capitalize"
        style={{ color: tierColor(tier) }}
      >
        {tier}
      </span>
    </div>
  );
}

function VariantCard({ variant, rank, onToggle }: { variant: ConceptVariant; rank: number; onToggle: () => void }) {
  const cfg = NODE_TYPE_CONFIG["concept_variant"];

  return (
    <button
      onClick={onToggle}
      className="w-full text-left rounded-xl p-3 transition-all hover:scale-[1.005]"
      style={{
        background: variant.selectedForStressTest ? cfg.bgColor : "hsl(var(--muted))",
        border: variant.selectedForStressTest ? `1.5px solid ${cfg.borderColor}` : "1.5px solid hsl(var(--border))",
      }}
    >
      <div className="flex items-start gap-2">
        {variant.selectedForStressTest ? (
          <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" style={{ color: cfg.color }} />
        ) : (
          <Circle size={16} className="flex-shrink-0 mt-0.5 text-muted-foreground" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-bold text-muted-foreground">#{rank}</span>
            <p className="text-xs font-bold text-foreground">{variant.name}</p>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">{variant.description}</p>
          <p className="text-[10px] font-semibold mt-1 opacity-70" style={{ color: cfg.color }}>
            {variant.formula}
          </p>
          {/* Qualitative assessments */}
          <div className="flex gap-4 mt-2">
            <TierBadge label="Feasible" tier={variant.feasibility} />
            <TierBadge label="Novel" tier={variant.novelty} />
            <TierBadge label="Market" tier={variant.marketReadiness} />
          </div>
        </div>
      </div>
    </button>
  );
}

function DimensionCard({ dimension }: { dimension: DesignDimension }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div
      className="rounded-xl p-3"
      style={{ background: "hsl(var(--muted))", border: "1.5px solid hsl(var(--border))" }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 text-left"
      >
        <ChevronDown
          size={12}
          className="text-muted-foreground transition-transform flex-shrink-0"
          style={{ transform: expanded ? "none" : "rotate(-90deg)" }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-foreground">{dimension.name}</p>
          <p className="text-[10px] text-muted-foreground">
            Derived from: {dimension.derivedFrom}
          </p>
        </div>
        <span className="text-[10px] font-bold text-muted-foreground">{dimension.values.length} options</span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-1 mt-2">
              {dimension.values.map(val => (
                <span
                  key={val.id}
                  className="px-2 py-1 rounded-md text-[10px] font-bold"
                  style={{
                    background: val.novelty === "high"
                      ? "hsl(180 65% 45% / 0.12)"
                      : val.novelty === "medium"
                      ? "hsl(38 92% 50% / 0.10)"
                      : "hsl(var(--muted))",
                    border: `1px solid ${val.novelty === "high"
                      ? "hsl(180 65% 45% / 0.25)"
                      : val.novelty === "medium"
                      ? "hsl(38 92% 50% / 0.20)"
                      : "hsl(var(--border))"}`,
                    color: val.novelty === "high"
                      ? "hsl(180 65% 45%)"
                      : val.novelty === "medium"
                      ? "hsl(38 92% 50%)"
                      : "hsl(var(--muted-foreground))",
                  }}
                >
                  {val.label}
                  {val.feasibility === "low" && " ⚠"}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
