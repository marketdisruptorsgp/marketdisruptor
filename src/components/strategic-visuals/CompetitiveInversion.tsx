/**
 * CompetitiveInversion — Product Mode Visual
 *
 * Two-column diagram: what competitors fight over (left) vs. what's uncontested
 * (right). Hover any item to reveal evidence-backed tooltip.
 *
 * Only renders when analysisType === "product".
 */

import { useState } from "react";
import { Shield, Crosshair } from "lucide-react";
import type { Evidence } from "@/lib/evidenceEngine";
import type { Product } from "@/data/mockProducts";
import {
  inferCompetitiveArena,
  inferUncontestedSpace,
  type CompetitiveArenaItem,
  type UncontestedSpaceItem,
} from "@/lib/competitiveInversion";

// ═══════════════════════════════════════════════════════════════
//  PROPS
// ═══════════════════════════════════════════════════════════════

interface Props {
  product?: Product | null;
  analysisType: string;
  evidence: Evidence[];
  /** Flat list of constraint labels (optional — for future enrichment) */
  constraints?: string[];
  /** Flat list of opportunity labels (optional — for future enrichment) */
  opportunities?: string[];
}

// ═══════════════════════════════════════════════════════════════
//  SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

function ArenaItem({ item }: { item: CompetitiveArenaItem }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="relative rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 cursor-default transition-colors hover:bg-red-500/10"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <p className="text-sm font-bold text-foreground leading-snug">{item.label}</p>
      <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{item.description}</p>
      {hovered && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-20 rounded-lg border border-border bg-popover px-4 py-3 shadow-lg text-xs text-foreground leading-relaxed">
          {item.tooltip}
        </div>
      )}
    </div>
  );
}

function SpaceItem({ item }: { item: UncontestedSpaceItem }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="relative rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 cursor-default transition-colors hover:bg-emerald-500/10"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <p className="text-sm font-bold text-foreground leading-snug">{item.label}</p>
      <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5 leading-snug font-medium">
        {item.opportunity}
      </p>
      <p className="text-xs text-muted-foreground mt-1 leading-snug">{item.description}</p>
      {hovered && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-20 rounded-lg border border-border bg-popover px-4 py-3 shadow-lg text-xs text-foreground leading-relaxed">
          {item.tooltip}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function CompetitiveInversion({
  product,
  analysisType,
  evidence,
  constraints: _constraints,
  opportunities: _opportunities,
}: Props) {
  if (analysisType !== "product") return null;

  const arena = inferCompetitiveArena(evidence, product);
  const uncontested = inferUncontestedSpace(evidence, product);

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 bg-primary/5 border-b border-border">
        <div className="flex items-center gap-2">
          <Crosshair size={13} className="text-primary" />
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary">
            Competitive Inversion
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Stop competing where everyone is. Own what nobody else is.
        </p>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
        {/* LEFT — What competitors fight over */}
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-1.5">
            <Shield size={12} className="text-red-500" />
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-red-500">
              What competitors fight over
            </span>
          </div>
          <div className="space-y-2">
            {arena.map(item => (
              <ArenaItem key={item.id} item={item} />
            ))}
          </div>
        </div>

        {/* RIGHT — What's uncontested */}
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-1.5">
            <Crosshair size={12} className="text-emerald-500" />
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-500">
              What's uncontested (your move)
            </span>
          </div>
          <div className="space-y-2">
            {uncontested.map(item => (
              <SpaceItem key={item.id} item={item} />
            ))}
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="px-5 py-3 bg-primary/5 border-t border-border">
        <p className="text-xs font-bold text-foreground">
          Your Move:{" "}
          <span className="text-muted-foreground font-normal">
            Stop competing on audio specs. Own durability + repairability.
          </span>
        </p>
      </div>
    </div>
  );
}
