/**
 * TierDiscoveryPanel — Progressive tier exploration UI
 *
 * Inserted into Command Deck between Zone 1 and Zone 2.
 * Shows three tiers with unlock state, signal counts, and narratives.
 * Limits visible signals to 8-12 per tier with "Explore More Signals" expansion.
 */

import { memo, useState } from "react";
import { motion } from "framer-motion";
import { Lock, CheckCircle2, ChevronRight, Layers, ArrowRight } from "lucide-react";
import { TIER_META, type TierNumber, type TierState, getUnlockCondition } from "@/lib/tierDiscoveryEngine";
import type { EvidenceTier } from "@/lib/evidenceEngine";

const SIGNALS_CAP = 8;

interface TierDiscoveryPanelProps {
  tierState: TierState;
  activeTierFilter: EvidenceTier | null;
  onSelectTier: (tier: TierNumber) => void;
  onMarkComplete: (tier: TierNumber) => void;
  /** Opens Evidence Explorer pre-filtered to a tier */
  onExploreTier?: (tier: EvidenceTier) => void;
}

export const TierDiscoveryPanel = memo(function TierDiscoveryPanel({
  tierState,
  activeTierFilter,
  onSelectTier,
  onMarkComplete,
  onExploreTier,
}: TierDiscoveryPanelProps) {
  const tiers: TierNumber[] = [1, 2, 3];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08, duration: 0.4 }}
      className="rounded-xl p-5 bg-card border border-border"
    >
      <div className="flex items-center gap-2 mb-4">
        <Layers size={14} className="text-foreground" />
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-foreground">
          Discovery Tiers
        </p>
        <span className="text-[10px] font-bold text-muted-foreground">
          — Progressive strategic depth
        </span>
      </div>

      <div className="space-y-2">
        {tiers.map(tierNum => {
          const meta = TIER_META[tierNum];
          const unlocked = tierState.tierUnlocked[tierNum - 1];
          const signalCount = tierState.tierSignalCounts[tierNum - 1];
          const isActive = activeTierFilter === meta.tier;
          const unlockCondition = getUnlockCondition(tierNum, tierState);
          const remaining = Math.max(0, signalCount - SIGNALS_CAP);

          return (
            <button
              key={tierNum}
              onClick={() => unlocked && onSelectTier(tierNum)}
              disabled={!unlocked}
              className="w-full text-left rounded-xl p-4 transition-all duration-200 min-h-[64px]"
              style={{
                background: isActive ? meta.bgColor : unlocked ? "hsl(var(--muted) / 0.5)" : "hsl(var(--muted) / 0.25)",
                border: isActive
                  ? `2px solid ${meta.color}`
                  : unlocked
                    ? "1px solid hsl(var(--border))"
                    : "1px dashed hsl(var(--border))",
                opacity: unlocked ? 1 : 0.6,
                cursor: unlocked ? "pointer" : "not-allowed",
              }}
            >
              <div className="flex items-center gap-3">
                {/* Tier indicator */}
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-extrabold"
                  style={{
                    background: unlocked ? `${meta.color}15` : "hsl(var(--muted))",
                    color: unlocked ? meta.color : "hsl(var(--muted-foreground))",
                  }}
                >
                  {unlocked ? tierNum : <Lock size={14} />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-extrabold text-foreground">
                      Tier {tierNum} — {meta.label}
                    </p>
                    {isActive && (
                      <span className="text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full"
                        style={{ background: `${meta.color}20`, color: meta.color }}>
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 italic">
                    {meta.narrative}
                  </p>
                  {!unlocked && unlockCondition && (
                    <p className="text-[10px] font-bold mt-1" style={{ color: "hsl(38 92% 50%)" }}>
                      🔒 {unlockCondition}
                    </p>
                  )}
                </div>

                {/* Signal count or lock */}
                {unlocked ? (
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Signal bar */}
                    <div className="flex items-center gap-1.5">
                      <div className="w-16 h-2 rounded-full overflow-hidden bg-muted">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: meta.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((signalCount / 15) * 100, 100)}%` }}
                          transition={{ duration: 0.6 }}
                        />
                      </div>
                      <span className="text-sm font-extrabold tabular-nums" style={{ color: meta.color }}>
                        {Math.min(signalCount, SIGNALS_CAP)}{remaining > 0 ? `+${remaining}` : ""}
                      </span>
                    </div>
                    <ChevronRight size={14} className="text-muted-foreground" />
                  </div>
                ) : (
                  <Lock size={14} className="text-muted-foreground flex-shrink-0" />
                )}
              </div>

              {/* "Explore More Signals" button for active tier with overflow */}
              {unlocked && isActive && remaining > 0 && onExploreTier && (
                <div className="mt-3 pt-3 border-t" style={{ borderColor: `${meta.color}20` }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); onExploreTier(meta.tier); }}
                    className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors hover:opacity-80"
                    style={{ background: `${meta.color}12`, color: meta.color }}
                  >
                    <ArrowRight size={12} />
                    Explore {remaining} more signals
                  </button>
                </div>
              )}

              {/* Mark complete button for active tier */}
              {unlocked && isActive && tierNum < 3 && !tierState.tierUnlocked[tierNum as 1 | 2] && (
                <div className="mt-3 pt-3 border-t" style={{ borderColor: `${meta.color}20` }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); onMarkComplete(tierNum); }}
                    className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors"
                    style={{ background: `${meta.color}12`, color: meta.color }}
                  >
                    <CheckCircle2 size={12} />
                    Mark Tier {tierNum} Complete — Unlock Tier {tierNum + 1}
                  </button>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Description */}
      <p className="text-[10px] text-muted-foreground mt-3 leading-relaxed">
        Click a tier to filter all metrics and opportunities to that depth level.
        {activeTierFilter && " Click again to show all tiers."}
      </p>
    </motion.div>
  );
});
