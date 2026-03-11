/**
 * InnovationPaths — Themed groupings derived from structural pressures.
 * Shows 2-4 innovation directions with linked concept indices.
 */
import { memo } from "react";
import { motion } from "framer-motion";
import { Route, Zap } from "lucide-react";
import type { InnovationPath } from "./types";

interface InnovationPathsProps {
  paths: InnovationPath[];
  onPathClick?: (path: InnovationPath) => void;
}

export const InnovationPaths = memo(function InnovationPaths({ paths, onPathClick }: InnovationPathsProps) {
  if (!paths || paths.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: "hsl(var(--primary) / 0.1)" }}
        >
          <Route size={14} style={{ color: "hsl(var(--primary))" }} />
        </div>
        <h2 className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
          Innovation Directions
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {paths.map((path, i) => (
          <motion.button
            key={path.theme}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.05 }}
            onClick={() => onPathClick?.(path)}
            className="text-left rounded-xl px-4 py-3 transition-colors hover:bg-muted/50"
            style={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
            }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <Zap size={12} className="text-primary flex-shrink-0" />
              <h3 className="text-sm font-black text-foreground leading-snug">
                {path.theme}
              </h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {path.description}
            </p>
            {path.structural_pressures.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {path.structural_pressures.slice(0, 3).map((p, j) => (
                  <span
                    key={j}
                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                    style={{
                      background: "hsl(var(--muted))",
                      color: "hsl(var(--muted-foreground))",
                    }}
                  >
                    {p}
                  </span>
                ))}
              </div>
            )}
            <p className="text-[10px] font-bold text-primary mt-2">
              {path.concept_indices.length} concept{path.concept_indices.length !== 1 ? "s" : ""}
            </p>
          </motion.button>
        ))}
      </div>
    </div>
  );
});
