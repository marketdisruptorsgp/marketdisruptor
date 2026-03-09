/**
 * INDUSTRY OPPORTUNITY OVERLAY — Signal Overlay Engine
 *
 * Annotates an IndustrySystemMap with strategic signals from
 * binding constraints and deepened opportunities.
 *
 * Markers: ⚠ constraint, ★ opportunity, ● fragmentation, ▲ trend
 */

import type { IndustrySystemMap, SystemNode, SystemLayerType } from "./industrySystemMap";
import type { DeepenedOpportunity } from "@/lib/reconfiguration";
import type { StructuralProfile } from "@/lib/reconfiguration";
import type { ConstraintCandidate } from "@/lib/constraintDetectionEngine";

// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════

export type MarkerType = "constraint" | "opportunity" | "fragmentation" | "trend";

export interface NodeMarker {
  type: MarkerType;
  label: string;
  /** Icon character for display */
  icon: string;
  /** Brief explanation in plain language */
  explanation: string;
}

export interface OpportunityDetail {
  /** Opportunity title */
  title: string;
  /** The constraint that creates this opportunity */
  constraint: string;
  /** Why this is an opportunity (plain language) */
  structuralInsight: string;
  /** What could be done differently */
  strategicMove: string;
  /** Concrete first step */
  firstMove: string;
  /** The strategic bet being made */
  strategicBet: string;
}

export interface AnnotatedNode extends SystemNode {
  markers: NodeMarker[];
  /** Full opportunity detail (for opportunity markers) */
  opportunityDetail: OpportunityDetail | null;
  /** Connected constraint node IDs (for visual highlighting) */
  connectedConstraintIds: string[];
}

export interface AnnotatedSystemMap {
  layers: Array<{
    id: SystemLayerType;
    label: string;
    nodes: AnnotatedNode[];
  }>;
  connections: IndustrySystemMap["connections"];
  nodeCount: number;
  userLayer: SystemLayerType;
  /** Summary counts */
  constraintCount: number;
  opportunityCount: number;
}

// ═══════════════════════════════════════════════════════════════
//  LAYER MAPPING — Which constraints/opportunities affect which layers
// ═══════════════════════════════════════════════════════════════

const CONSTRAINT_LAYER_KEYWORDS: Record<SystemLayerType, string[]> = {
  supply: ["supply", "material", "manufacturer", "vendor", "raw", "input", "sourcing", "procurement"],
  infrastructure: ["distribut", "equipment", "tool", "software", "platform", "technology", "logistics", "middlem"],
  operations: ["production", "labor", "workforce", "capacity", "process", "operation", "execution", "skill", "custom", "design", "bidding", "project"],
  customer_access: ["customer", "client", "consumer", "acquisition", "sales", "marketing", "channel", "referral", "relationship", "demand"],
  value_capture: ["revenue", "pricing", "margin", "payment", "cash flow", "contract", "subscription", "billing", "profit", "cost"],
  regulation: ["regulat", "compliance", "license", "permit", "legal", "government"],
};

function inferLayerForText(text: string): SystemLayerType {
  const lower = text.toLowerCase();
  let bestLayer: SystemLayerType = "operations";
  let bestScore = 0;

  for (const [layer, keywords] of Object.entries(CONSTRAINT_LAYER_KEYWORDS)) {
    const score = keywords.filter(kw => lower.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestLayer = layer as SystemLayerType;
    }
  }

  return bestLayer;
}

// ═══════════════════════════════════════════════════════════════
//  OVERLAY ENGINE
// ═══════════════════════════════════════════════════════════════

export interface OverlayInput {
  systemMap: IndustrySystemMap;
  opportunities: DeepenedOpportunity[];
  structuralProfile: StructuralProfile | null;
}

export function overlayOpportunities(input: OverlayInput): AnnotatedSystemMap {
  const { systemMap, opportunities, structuralProfile } = input;

  // Initialize annotated nodes
  const annotatedLayers = systemMap.layers.map(layer => ({
    id: layer.id,
    label: layer.label,
    nodes: layer.nodes.map(node => ({
      ...node,
      markers: [] as NodeMarker[],
      opportunityDetail: null as OpportunityDetail | null,
      connectedConstraintIds: [] as string[],
    })),
  }));

  // Helper to find a node in a specific layer
  const findLayerNodes = (layerId: SystemLayerType) =>
    annotatedLayers.find(l => l.id === layerId)?.nodes || [];

  // ── 1. Add constraint markers from binding constraints or opportunity causal chains ──
  const constraints = structuralProfile?.bindingConstraints || [];
  const constraintNodeMap = new Map<string, string>(); // constraintText → nodeId

  // If no binding constraints exist, extract them from opportunity causal chains
  const constraintTexts: Array<{ text: string; explanation: string }> = constraints.length > 0
    ? constraints.map(c => ({ text: c.constraintName || c.explanation || "", explanation: c.explanation || "" }))
    : opportunities.map(o => ({ text: o.causalChain?.constraint || "", explanation: o.causalChain?.reasoning || "" })).filter(c => c.text.length > 0);

  for (const constraint of constraintTexts) {
    const text = constraint.text;
    if (!text) continue;
    const targetLayer = inferLayerForText(text);
    const layerNodes = findLayerNodes(targetLayer);

    if (layerNodes.length > 0) {
      const targetNode = layerNodes[0];
      targetNode.markers.push({
        type: "constraint",
        label: text.length > 50 ? text.slice(0, 47) + "…" : text,
        icon: "⚠",
        explanation: constraint.explanation || text,
      });
      constraintNodeMap.set(text, targetNode.id);
    }
  }

  // ── 2. Add fragmentation markers ──
  if (structuralProfile?.supplyFragmentation === "fragmented" || structuralProfile?.supplyFragmentation === "atomized") {
    const supplyNodes = findLayerNodes("supply");
    if (supplyNodes.length > 0) {
      supplyNodes[0].markers.push({
        type: "fragmentation",
        label: "Fragmented supply",
        icon: "●",
        explanation: "Many small suppliers with no dominant player — potential for aggregation.",
      });
    }
  }

  // ── 3. Add opportunity markers from deepened opportunities ──
  for (const opp of opportunities) {
    // Determine which layer this opportunity targets
    const oppText = `${opp.causalChain.constraint} ${opp.causalChain.outcome} ${opp.reconfigurationLabel}`;
    const targetLayer = inferLayerForText(oppText);
    const layerNodes = findLayerNodes(targetLayer);

    if (layerNodes.length > 0) {
      // Find the best node — prefer non-user-business nodes
      const targetNode = layerNodes.find(n => !n.isUserBusiness) || layerNodes[0];

      targetNode.markers.push({
        type: "opportunity",
        label: opp.reconfigurationLabel,
        icon: "★",
        explanation: opp.summary || opp.causalChain.reasoning,
      });

      targetNode.opportunityDetail = {
        title: opp.reconfigurationLabel,
        constraint: opp.causalChain.constraint,
        structuralInsight: opp.causalChain.reasoning,
        strategicMove: opp.economicMechanism.valueCreation,
        firstMove: opp.firstMove.action,
        strategicBet: opp.strategicBet.contrarianBelief,
      };

      // Link to constraint nodes
      const constraintText = opp.causalChain.constraint;
      const constraintNodeId = constraintNodeMap.get(constraintText);
      if (constraintNodeId) {
        targetNode.connectedConstraintIds.push(constraintNodeId);
      }
    }
  }

  // ── 4. Add trend markers for revenue model opportunities ──
  if (structuralProfile?.revenueModel === "project_based" || structuralProfile?.revenueModel === "transactional") {
    const valueNodes = findLayerNodes("value_capture");
    if (valueNodes.length > 0) {
      valueNodes[0].markers.push({
        type: "trend",
        label: "Recurring revenue potential",
        icon: "▲",
        explanation: structuralProfile.revenueModel === "project_based"
          ? "Project-based businesses are shifting to recurring models (subscriptions, maintenance plans)."
          : "One-time sales are being replaced by subscription and membership models.",
      });
    }
  }

  const constraintCount = annotatedLayers.flatMap(l => l.nodes).filter(n => n.markers.some(m => m.type === "constraint")).length;
  const opportunityCount = annotatedLayers.flatMap(l => l.nodes).filter(n => n.markers.some(m => m.type === "opportunity")).length;

  return {
    layers: annotatedLayers,
    connections: systemMap.connections,
    nodeCount: systemMap.nodeCount,
    userLayer: systemMap.userLayer,
    constraintCount,
    opportunityCount,
  };
}
