/**
 * SystemMapRenderer — CSS Grid visual renderer
 *
 * Deterministic layout: each layer = full-width row, nodes centered.
 * Straight vertical arrows between layers. No overlap, no clutter.
 * Hover highlights entire layer. Click selects a node.
 */

import { memo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type { SystemLayerType } from "@/lib/industrySystemMap";
import type { AnnotatedNode } from "@/lib/industryOpportunityOverlay";
import type { MarkerType } from "@/lib/industryOpportunityOverlay";

interface SystemMapRendererProps {
  layers: Array<{
    id: SystemLayerType;
    label: string;
    nodes: AnnotatedNode[];
  }>;
  selectedNodeId: string | null;
  highlightedConstraintIds: string[];
  onNodeClick: (node: AnnotatedNode) => void;
  showOpportunityMarkers: boolean;
  visibleMarkerTypes: Set<MarkerType>;
  modeAccent: string;
}

const LAYER_COLORS: Record<SystemLayerType, string> = {
  supply: "hsl(var(--muted))",
  infrastructure: "hsl(var(--muted))",
  operations: "hsl(var(--muted))",
  customer_access: "hsl(var(--muted))",
  value_capture: "hsl(var(--muted))",
  regulation: "hsl(var(--muted))",
};

export const SystemMapRenderer = memo(function SystemMapRenderer({
  layers,
  selectedNodeId,
  highlightedConstraintIds,
  onNodeClick,
  showOpportunityMarkers,
  visibleMarkerTypes,
  modeAccent,
}: SystemMapRendererProps) {
  const [hoveredLayer, setHoveredLayer] = useState<SystemLayerType | null>(null);

  return (
    <div className="w-full space-y-0">
      {layers.map((layer, layerIdx) => (
        <div key={layer.id}>
          {/* Layer */}
          <motion.div
            className="relative rounded-xl px-4 py-3 transition-colors duration-200"
            style={{
              background: hoveredLayer === layer.id
                ? `${modeAccent}08`
                : "transparent",
            }}
            onMouseEnter={() => setHoveredLayer(layer.id)}
            onMouseLeave={() => setHoveredLayer(null)}
          >
            {/* Layer label */}
            <div className="mb-2">
              <span
                className="text-[10px] font-black uppercase tracking-[0.2em]"
                style={{ color: "hsl(var(--muted-foreground))" }}
              >
                {layer.label}
              </span>
            </div>

            {/* Nodes — centered grid */}
            <div className="flex flex-wrap justify-center gap-3">
              {layer.nodes.map(node => {
                const isSelected = selectedNodeId === node.id;
                const isHighlightedConstraint = highlightedConstraintIds.includes(node.id);
                const hasMarkers = showOpportunityMarkers && node.markers.length > 0;
                const visibleMarkers = showOpportunityMarkers
                  ? node.markers.filter(m => visibleMarkerTypes.has(m.type))
                  : [];

                return (
                  <motion.button
                    key={node.id}
                    onClick={() => onNodeClick(node)}
                    className="relative group text-left transition-all duration-200 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    style={{
                      background: node.isUserBusiness
                        ? modeAccent
                        : isSelected
                          ? "hsl(var(--card))"
                          : node.isStructuralNode
                            ? "hsl(38 92% 50% / 0.12)"
                            : "hsl(var(--card))",
                      border: isSelected
                        ? `2px solid ${modeAccent}`
                        : isHighlightedConstraint
                          ? "2px solid hsl(var(--destructive))"
                          : node.isUserBusiness
                            ? `2px solid ${modeAccent}`
                            : node.isStructuralNode
                              ? "2px solid hsl(38 92% 50% / 0.4)"
                              : "1.5px solid hsl(var(--border))",
                      minWidth: node.isUserBusiness ? "200px" : "140px",
                      maxWidth: "260px",
                    }}
                    whileHover={{ scale: 1.03, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    animate={isHighlightedConstraint ? {
                      boxShadow: ["0 0 0 0 hsl(var(--destructive) / 0)", "0 0 12px 4px hsl(var(--destructive) / 0.3)", "0 0 0 0 hsl(var(--destructive) / 0)"],
                    } : {}}
                    transition={isHighlightedConstraint ? { duration: 1.5, repeat: Infinity } : {}}
                  >
                    <div className="px-3 py-2.5">
                      {/* Node label */}
                      <p
                        className="text-xs font-bold leading-tight truncate"
                        style={{
                          color: node.isUserBusiness
                            ? "white"
                            : "hsl(var(--foreground))",
                        }}
                      >
                        {node.label}
                      </p>

                      {/* Subtitle for user's business */}
                      {node.isUserBusiness && (
                        <p className="text-[10px] mt-0.5 opacity-80" style={{ color: "white" }}>
                          Your business
                        </p>
                      )}
                    </div>

                    {/* Opportunity/Constraint markers */}
                    {visibleMarkers.length > 0 && (
                      <div className="absolute -top-2 -right-2 flex gap-0.5">
                        {visibleMarkers.map((marker, mIdx) => (
                          <span
                            key={mIdx}
                            className="flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold shadow-sm"
                            style={{
                              background: marker.type === "constraint"
                                ? "hsl(var(--destructive))"
                                : marker.type === "opportunity"
                                  ? "hsl(142 71% 45%)"
                                  : marker.type === "fragmentation"
                                    ? "hsl(38 92% 50%)"
                                    : "hsl(var(--primary))",
                              color: "white",
                            }}
                            title={marker.label}
                          >
                            {marker.icon}
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Arrow between layers */}
          {layerIdx < layers.length - 1 && (
            <div className="flex justify-center py-1">
              <ChevronDown
                size={16}
                className="text-muted-foreground/40"
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
});
