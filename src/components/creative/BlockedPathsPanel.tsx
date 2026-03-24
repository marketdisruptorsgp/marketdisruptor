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

function BlockedPathRow({ path, index, affectedTitles = [] }: { path: BlockedPath; index: number; affectedTitles?: string[] }) {
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

        {/* Affected configurations (when multiple paths share this blocker) */}
        {affectedTitles.length > 1 && (
          <div className="pl-4 flex flex-wrap gap-1 pt-0.5">
            <span className="text-[9px] text-muted-foreground/60 mr-0.5 self-center">Affects:</span>
            {affectedTitles.map(title => (
              <span
                key={title}
                className="text-[9px] px-1.5 py-0 rounded bg-muted/60 text-muted-foreground font-medium border border-border/40"
              >
                {title.length > 35 ? title.slice(0, 33) + "…" : title}
              </span>
            ))}
          </div>
        )}
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

  // Group paths by blocking constraint — if multiple paths share the same
  // blocking explanation, show it once with the list of affected configurations.
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

      {/* Rows */}
      <div className="space-y-2">
        {grouped.map((group, index) => (
          <BlockedPathRow
            key={group.representative.id}
            path={group.representative}
            index={index}
            affectedTitles={group.affectedTitles}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ── Grouping logic ───────────────────────────────────────────────────────────

interface GroupedBlockedPath {
  representative: BlockedPath;
  affectedTitles: string[];
}

/**
 * Group blocked paths that share the same blockingConstraint key.
 * The first path in each group is used as the representative card.
 * Its affected configurations are listed as tags below the explanation.
 */
function groupByBlockingConstraint(paths: BlockedPath[]): GroupedBlockedPath[] {
  const groupMap = new Map<string, GroupedBlockedPath>();

  for (const path of paths) {
    const key = path.blockingConstraint.trim().toLowerCase();
    const existing = groupMap.get(key);
    if (existing) {
      existing.affectedTitles.push(path.title);
    } else {
      groupMap.set(key, {
        representative: path,
        affectedTitles: [path.title],
      });
    }
  }

  return Array.from(groupMap.values());
}
