/**
 * IndustrySystemMapView — Main container with two tabs
 *
 * Tab 1: Industry System Map — structural "machine diagram"
 * Tab 2: Opportunity Map — same map with strategic signal overlays
 *
 * Manages selected node state, detail panel, and filter toggles.
 */

import { memo, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Map, Target, Info } from "lucide-react";
import { buildIndustryLayers, type BuildIndustryMapInput } from "@/lib/industrySystemMap";
import { overlayOpportunities, type MarkerType, type AnnotatedNode, type OverlayInput } from "@/lib/industryOpportunityOverlay";
import { SystemMapRenderer } from "./SystemMapRenderer";
import { SystemMapNodeDetail } from "./SystemMapNodeDetail";
import { OpportunityFilterToggles } from "./OpportunityFilterToggles";
import type { StructuralProfile } from "@/lib/reconfiguration";
import type { DeepenedOpportunity } from "@/lib/reconfiguration";
import type { StrategicNarrative } from "@/lib/strategicEngine";

interface IndustrySystemMapViewProps {
  /** Business name for the operations layer */
  businessName: string;
  /** Business description */
  businessDescription?: string;
  /** Structural profile from the reconfiguration engine */
  structuralProfile: StructuralProfile | null;
  /** Deepened opportunities for the overlay */
  opportunities: DeepenedOpportunity[];
  /** Narrative for additional context */
  narrative: StrategicNarrative | null;
  /** Governed first_principles data */
  firstPrinciples?: any;
  /** Governed constraint_map data */
  constraintMap?: any;
  /** Supply chain intel */
  supplyChain?: any;
  /** Analysis mode */
  mode: "product" | "service" | "business";
  /** Accent color */
  modeAccent: string;
}

type TabId = "system" | "opportunity";

export const IndustrySystemMapView = memo(function IndustrySystemMapView({
  businessName,
  businessDescription,
  structuralProfile,
  opportunities,
  narrative,
  firstPrinciples,
  constraintMap,
  supplyChain,
  mode,
  modeAccent,
}: IndustrySystemMapViewProps) {
  const [activeTab, setActiveTab] = useState<TabId>("system");
  const [selectedNode, setSelectedNode] = useState<AnnotatedNode | null>(null);
  const [visibleMarkerTypes, setVisibleMarkerTypes] = useState<Set<MarkerType>>(
    new Set(["constraint", "opportunity", "fragmentation", "trend"])
  );

  // Build the base system map
  const systemMap = useMemo(() => {
    const input: BuildIndustryMapInput = {
      businessName,
      businessDescription,
      structuralProfile,
      firstPrinciples,
      constraintMap,
      supplyChain,
      mode,
    };
    return buildIndustryLayers(input);
  }, [businessName, businessDescription, structuralProfile, firstPrinciples, constraintMap, supplyChain, mode]);

  // Build the annotated (opportunity) map
  const annotatedMap = useMemo(() => {
    const input: OverlayInput = {
      systemMap,
      opportunities,
      structuralProfile,
    };
    return overlayOpportunities(input);
  }, [systemMap, opportunities, structuralProfile]);

  const handleNodeClick = useCallback((node: AnnotatedNode) => {
    setSelectedNode(prev => prev?.id === node.id ? null : node);
  }, []);

  const handleToggleMarker = useCallback((type: MarkerType) => {
    setVisibleMarkerTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  // Highlighted constraint IDs when an opportunity node is selected
  const highlightedConstraintIds = useMemo(() => {
    if (!selectedNode || activeTab !== "opportunity") return [];
    return selectedNode.connectedConstraintIds || [];
  }, [selectedNode, activeTab]);

  // Use annotated map for both tabs (system tab just hides markers)
  const displayLayers = annotatedMap.layers;

  const hasData = systemMap.nodeCount > 0;

  if (!hasData) return null;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "hsl(var(--card))",
        border: "1.5px solid hsl(var(--border))",
      }}
    >
      {/* Tab header */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ borderBottom: "1px solid hsl(var(--border))" }}
      >
        <div className="flex items-center gap-1">
          {([
            { id: "system" as TabId, label: "Industry System Map", icon: Map },
            { id: "opportunity" as TabId, label: "Opportunity Map", icon: Target },
          ]).map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSelectedNode(null); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
              style={{
                background: activeTab === tab.id ? `${modeAccent}12` : "transparent",
                color: activeTab === tab.id ? modeAccent : "hsl(var(--muted-foreground))",
                border: activeTab === tab.id ? `1px solid ${modeAccent}30` : "1px solid transparent",
              }}
            >
              <tab.icon size={13} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Node count badge */}
        <span className="text-[10px] font-bold text-muted-foreground">
          {systemMap.nodeCount} nodes · {systemMap.layers.length} layers
        </span>
      </div>

      {/* Filter toggles (opportunity tab only) */}
      {activeTab === "opportunity" && (
        <div className="px-4 py-2" style={{ borderBottom: "1px solid hsl(var(--border) / 0.5)" }}>
          <OpportunityFilterToggles
            visibleTypes={visibleMarkerTypes}
            onToggle={handleToggleMarker}
          />
        </div>
      )}

      {/* Main content: Map + Detail panel */}
      <div className="flex flex-col lg:flex-row">
        {/* Map */}
        <div className={`flex-1 px-3 py-4 ${selectedNode ? "lg:w-[60%]" : "w-full"}`}>
          {/* Tab description */}
          <div className="flex items-start gap-2 mb-3 px-2">
            <Info size={12} className="text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {activeTab === "system"
                ? "This map shows how the industry works — from raw inputs to value capture. Click any node to understand its role."
                : `${annotatedMap.constraintCount} constraints and ${annotatedMap.opportunityCount} opportunities identified. Click any marked node to see the strategic detail.`
              }
            </p>
          </div>

          <SystemMapRenderer
            layers={displayLayers}
            selectedNodeId={selectedNode?.id || null}
            highlightedConstraintIds={highlightedConstraintIds}
            onNodeClick={handleNodeClick}
            showOpportunityMarkers={activeTab === "opportunity"}
            visibleMarkerTypes={visibleMarkerTypes}
            modeAccent={modeAccent}
          />
        </div>

        {/* Detail panel */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "auto", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:w-[40%] flex-shrink-0 p-3"
              style={{ borderLeft: "1px solid hsl(var(--border))" }}
            >
              <SystemMapNodeDetail
                node={selectedNode}
                isOpportunityMode={activeTab === "opportunity"}
                onClose={() => setSelectedNode(null)}
                modeAccent={modeAccent}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Legend */}
      <div
        className="px-4 py-2 flex flex-wrap items-center gap-4"
        style={{ borderTop: "1px solid hsl(var(--border) / 0.5)" }}
      >
        <LegendItem color={modeAccent} label="Your business" filled />
        <LegendItem color="hsl(38 92% 50%)" label="Structural node" />
        <LegendItem color="hsl(var(--muted-foreground))" label="Industry node" />
        {activeTab === "opportunity" && (
          <>
            <LegendItem color="hsl(var(--destructive))" label="⚠ Constraint" marker />
            <LegendItem color="hsl(142 71% 45%)" label="★ Opportunity" marker />
          </>
        )}
      </div>
    </div>
  );
});

function LegendItem({
  color,
  label,
  filled,
  marker,
}: {
  color: string;
  label: string;
  filled?: boolean;
  marker?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-3 h-3 rounded"
        style={{
          background: filled ? color : "transparent",
          border: `2px solid ${color}`,
        }}
      />
      <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
    </div>
  );
}
