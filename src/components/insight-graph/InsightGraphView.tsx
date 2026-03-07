/**
 * Insight Graph View — Interactive Reasoning Explorer
 *
 * Orchestrates the graph visualization and surrounding UI.
 * Core renderer: CytoscapeReasoningMap (dagre layout, progressive reveal).
 * Preserves: side panel, simulation panel, intelligence event feed, alternate views.
 */

import { memo, useMemo, useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import type { InsightGraph, InsightGraphNode, InsightNodeType } from "@/lib/insightGraph";
import { NODE_TYPE_CONFIG, getInsightChain } from "@/lib/insightGraph";
import { injectConceptVariants } from "@/lib/conceptExpansion";
import { CytoscapeReasoningMap } from "./CytoscapeReasoningMap";
import { InsightNodeCard } from "./InsightNodeCard";
import { OpportunityLandscape } from "./OpportunityLandscape";
import { ConstraintMap } from "./ConstraintMap";
import { StrategicPathways } from "./StrategicPathways";
import { SimulationPanel } from "@/components/SimulationPanel";
import { RecomputeOverlay } from "@/components/RecomputeOverlay";
import { IntelligenceEventFeed } from "@/components/IntelligenceEventFeed";
import { type LensTool } from "@/lib/lensToolkitRegistry";
import { type ToolScenario, scenarioToEvidence } from "@/lib/scenarioEngine";
import { useConceptExpansion } from "@/hooks/useConceptExpansion";
import { useIsMobile } from "@/hooks/use-mobile";

// ═══════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

interface InsightGraphViewProps {
  graph: InsightGraph;
  analysisId?: string;
  onScenarioSaved?: (s: ToolScenario) => void;
}

export const InsightGraphView = memo(function InsightGraphView({ graph, analysisId = "", onScenarioSaved }: InsightGraphViewProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"graph" | "landscape" | "constraints" | "pathways">("graph");
  const [simPanelOpen, setSimPanelOpen] = useState(false);
  const [simTool, setSimTool] = useState<LensTool | null>(null);
  const [intelligenceEvents, setIntelligenceEvents] = useState<string[]>([]);
  const isMobile = useIsMobile();

  // Concept expansion
  const { generateConceptSpace, getConceptSpace, toggleVariantSelection, loading: conceptLoading } = useConceptExpansion(graph);

  // Graph with concept variants injected
  const enrichedGraph = useMemo(() => {
    let g = graph;
    // Inject any generated concept variants
    for (const node of graph.nodes) {
      const space = getConceptSpace(node.id);
      if (space) {
        g = injectConceptVariants(g, space);
      }
    }
    return g;
  }, [graph, getConceptSpace]);

  const handleOpenTool = useCallback((tool: LensTool) => {
    setSimTool(tool);
    setSimPanelOpen(true);
  }, []);

  const handleSimScenarioSaved = useCallback((scenario: ToolScenario) => {
    const evidence = scenarioToEvidence(scenario);
    setIntelligenceEvents(prev => [
      `Simulation created ${evidence.type} signal: "${evidence.label}"`,
      `Evidence confidence: ${Math.round((evidence.confidenceScore || 0) * 100)}%`,
      ...prev,
    ].slice(0, 10));
    onScenarioSaved?.(scenario);
  }, [onScenarioSaved]);

  // Auto-focus from URL ?node= param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nodeParam = params.get("node");
    if (nodeParam && graph.nodes.find(n => n.id === nodeParam)) {
      setSelectedNodeId(nodeParam);
    }
  }, [graph.nodes]);

  const selectedNode = useMemo(() => {
    return selectedNodeId ? enrichedGraph.nodes.find(n => n.id === selectedNodeId) ?? null : null;
  }, [selectedNodeId, enrichedGraph.nodes]);

  const highlightedIds = useMemo(() => {
    if (!selectedNodeId) return null;
    const chain = getInsightChain(enrichedGraph, selectedNodeId);
    return new Set(chain.map(n => n.id));
  }, [selectedNodeId, enrichedGraph]);

  if (graph.nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 rounded-2xl bg-muted border border-border gap-3">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
        </div>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          Run the analysis pipeline to populate the Insight Graph.
        </p>
        <p className="text-xs text-muted-foreground text-center">Complete Report → Disrupt to generate graph nodes</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0 gap-2">
      {/* Toolbar: View Tabs */}
      <div className="rounded-xl border border-border bg-card p-2">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {([
            { id: "graph", label: "Reasoning Map" },
            { id: "landscape", label: "Opportunity Landscape" },
            { id: "constraints", label: "Constraint Map" },
            { id: "pathways", label: "Strategic Pathways" },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSelectedNodeId(null); }}
              className="min-h-[44px] px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap flex-shrink-0"
              style={{
                borderBottom: activeTab === tab.id ? "2px solid hsl(var(--primary))" : "2px solid transparent",
                color: activeTab === tab.id ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                background: "transparent",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "landscape" ? (
        <OpportunityLandscape graph={graph} onSelectNode={setSelectedNodeId} />
      ) : activeTab === "constraints" ? (
        <ConstraintMap graph={graph} onSelectNode={setSelectedNodeId} />
      ) : activeTab === "pathways" ? (
        <StrategicPathways graph={graph} onSelectNode={setSelectedNodeId} />
      ) : (
        <>
          {/* Active path indicator */}
          <AnimatePresence>
            {selectedNode && highlightedIds && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-xl px-4 py-3 flex items-center gap-3 overflow-hidden"
                style={{
                  background: NODE_TYPE_CONFIG[selectedNode.type].bgColor,
                  border: `1.5px solid ${NODE_TYPE_CONFIG[selectedNode.type].borderColor}`,
                }}
              >
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: NODE_TYPE_CONFIG[selectedNode.type].color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: NODE_TYPE_CONFIG[selectedNode.type].color }}>
                    Reasoning Chain Active
                  </p>
                  <p className="text-xs font-bold text-foreground truncate">
                    Tracing {highlightedIds.size} connected nodes from "{selectedNode.label.slice(0, 50)}"
                  </p>
                </div>
                <button
                  onClick={() => setSelectedNodeId(null)}
                  className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-md text-xs font-bold bg-muted border border-border text-foreground hover:bg-card transition-colors"
                >
                  ✕
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Graph Canvas + Side Panel */}
          <div className="flex gap-3 flex-1 min-h-0 h-full">
            {/* Cytoscape Reasoning Map */}
             <div className="flex-1 min-h-0">
              <CytoscapeReasoningMap
                graph={enrichedGraph}
                onSelectNode={setSelectedNodeId}
                selectedNodeId={selectedNodeId}
              />
            </div>

            {/* Side Panel — desktop only */}
            {!isMobile && selectedNode && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-[360px] flex-shrink-0 max-h-[580px] overflow-y-auto"
              >
                <InsightNodeCard
                  node={selectedNode}
                  graph={enrichedGraph}
                  onClose={() => setSelectedNodeId(null)}
                  onSelectNode={setSelectedNodeId}
                  onOpenTool={handleOpenTool}
                  conceptSpace={getConceptSpace(selectedNode.id)}
                  onExpandDesignSpace={(n) => generateConceptSpace(n)}
                  onToggleConceptVariant={toggleVariantSelection}
                  conceptExpansionLoading={conceptLoading === selectedNode.id}
                />
              </motion.div>
            )}
          </div>

          {/* Mobile bottom sheet */}
          {isMobile && (
            <AnimatePresence>
              {selectedNode && (
                <InsightNodeCard
                  node={selectedNode}
                  graph={enrichedGraph}
                  onClose={() => setSelectedNodeId(null)}
                  onSelectNode={setSelectedNodeId}
                  onOpenTool={handleOpenTool}
                  isMobile
                  conceptSpace={getConceptSpace(selectedNode.id)}
                  onExpandDesignSpace={(n) => generateConceptSpace(n)}
                  onToggleConceptVariant={toggleVariantSelection}
                  conceptExpansionLoading={conceptLoading === selectedNode.id}
                />
              )}
            </AnimatePresence>
          )}
        </>
      )}

      {/* Simulation Panel */}
      <SimulationPanel
        isOpen={simPanelOpen}
        onClose={() => { setSimPanelOpen(false); setSimTool(null); }}
        activeTool={simTool}
        analysisId={analysisId}
        onScenarioSaved={handleSimScenarioSaved}
        intelligenceEvents={intelligenceEvents}
      />

      {/* Intelligence Event Feed */}
      <IntelligenceEventFeed
        events={intelligenceEvents}
        onDismiss={(idx) => setIntelligenceEvents(prev => prev.filter((_, i) => i !== idx))}
      />
    </div>
  );
});
