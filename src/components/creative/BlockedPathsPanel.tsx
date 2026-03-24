/**
 * BlockedPathsPanel — Zone 2.5 disqualified / blocked ideas
 *
 * Shows blocked ideas with "what would need to be true" annotations
 * and expandable Heilmeier panels.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { BlockedPath } from "@/lib/creativeOpportunityEngine";

export interface BlockedPathsPanelProps {
  paths: BlockedPath[];
  modeAccent: string;
}

function HeilmeierPanelView({ panel }: { panel: NonNullable<BlockedPath["heilmeier"]> }) {
  return (
    <div className="space-y-2 pt-2">
      {[
        { label: "Objective", value: panel.objective },
        { label: "Today's Limit", value: panel.todaysLimit },
        { label: "What's New", value: panel.whatsNew },
        { label: "Who Cares", value: panel.whoCares },
        { label: "Risks", value: panel.risks },
        { label: "Success Metric", value: panel.successMetric },
      ].map(({ label, value }) => (
        <div key={label} className="space-y-0.5">
          <p className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground">{label}</p>
          <p className="text-[11px] text-foreground/80 leading-relaxed">{value}</p>
        </div>
      ))}
    </div>
  );
}

/**
 * Group blocked paths by their blockingConstraint, collapsing duplicates.
 *
 * Returns a map from constraintLabel → array of paths that share that
 * blocking constraint, sorted by descending radicalityScore within each group.
 */
export function groupByBlockingConstraint(
  paths: BlockedPath[],
): Map<string, BlockedPath[]> {
  const groups = new Map<string, BlockedPath[]>();

  for (const path of paths) {
    const key = path.blockingConstraint.toLowerCase().trim();
    const group = groups.get(key);
    if (group) {
      group.push(path);
    } else {
      groups.set(key, [path]);
    }
  }

  // Sort paths within each group by descending radicalityScore
  for (const group of groups.values()) {
    group.sort((a, b) => b.radicalityScore - a.radicalityScore);
  }

  return groups;
}

function BlockedPathRow({ path, index }: { path: BlockedPath; index: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.06 * index }}
      className="rounded-lg border border-border/50 bg-card/60 overflow-hidden"
    >
      {/* Main row */}
      <div className="px-3 py-2.5 space-y-1.5">
        {/* Title + radicality */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0 flex items-start gap-1.5">
            <Lock size={10} className="text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground leading-snug">{path.title}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Blocked by:{" "}
                <span className="font-semibold text-foreground/70">{path.blockingConstraint}</span>
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="text-[9px] px-1.5 py-0 h-4 flex-shrink-0 font-semibold border-border/50"
          >
            R {Math.round(path.radicalityScore * 100)}%
          </Badge>
        </div>

        {/* What would need to be true */}
        <p className="text-[11px] text-muted-foreground/80 italic leading-relaxed pl-4">
          "{path.whatWouldNeedToBeTrue}"
        </p>
      </div>

      {/* Expandable Heilmeier */}
      {path.heilmeier && (
        <div className="border-t border-border/30">
          <button
            className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setExpanded(v => !v)}
          >
            Heilmeier Panel
            {expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
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
                <div className="px-3 pb-2.5">
                  <HeilmeierPanelView panel={path.heilmeier} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}

export function BlockedPathsPanel({ paths, modeAccent: _modeAccent }: BlockedPathsPanelProps) {
  if (paths.length === 0) return null;

  const grouped = groupByBlockingConstraint(paths);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="space-y-2"
    >
      {/* Section header */}
      <div className="flex items-center gap-2">
        <Lock size={12} className="text-muted-foreground" />
        <h2 className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">
          Blocked Paths
        </h2>
        <span className="text-[9px] text-muted-foreground/60">
          — Ideas that require a structural change to unlock
        </span>
      </div>

      {/* Groups */}
      <div className="space-y-3">
        {Array.from(grouped.entries()).map(([constraintKey, groupPaths]) => (
          <div key={constraintKey} className="space-y-1.5">
            {/* Constraint header */}
            <div className="flex items-center gap-1.5 px-1">
              <Lock size={10} className="text-muted-foreground/70 flex-shrink-0" />
              <p className="text-[10px] font-bold text-foreground/80 uppercase tracking-wide">
                {groupPaths[0].blockingConstraint}
              </p>
              {groupPaths.length > 1 && (
                <Badge variant="outline" className="text-[8px] px-1 py-0 h-3.5 font-semibold border-border/40">
                  Affects {groupPaths.length}
                </Badge>
              )}
            </div>
            {/* Paths in this group */}
            <div className="space-y-2 pl-3 border-l border-border/30">
              {groupPaths.map((path, index) => (
                <BlockedPathRow key={path.id} path={path} index={index} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
