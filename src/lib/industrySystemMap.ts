/**
 * INDUSTRY SYSTEM MAP — Data Engine
 *
 * Builds a deterministic layered "machine diagram" of how an industry works.
 * Reads StructuralProfile dimensions + governed first_principles data to
 * produce 5-6 vertical layers, each with 1-4 nodes (capped at 15 total).
 *
 * Layers: Supply → Infrastructure → Operations → Customer Access → Value Capture
 * Optional: Regulation layer if regulatorySensitivity >= "moderate"
 */

import type {
  StructuralProfile,
  FragmentationLevel,
  DistributionControl,
  RevenueModel,
  ValueChainPosition,
} from "@/lib/reconfiguration";

// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════

export type SystemLayerType =
  | "supply"
  | "infrastructure"
  | "operations"
  | "customer_access"
  | "value_capture"
  | "regulation";

export interface SystemNode {
  id: string;
  label: string;
  /** Plain-language role description */
  roleDescription: string;
  /** Why this layer matters to the user's business */
  whyItMatters: string;
  /** Structural characteristics */
  structureNote: string;
  /** Strategic signals observable at this node */
  strategicSignals: string[];
  /** Is this the user's business? */
  isUserBusiness: boolean;
  /** Is this structurally important (e.g., bottleneck, high concentration)? */
  isStructuralNode: boolean;
  /** Layer this node belongs to */
  layer: SystemLayerType;
}

export interface SystemLayer {
  id: SystemLayerType;
  label: string;
  nodes: SystemNode[];
}

export interface IndustrySystemMap {
  layers: SystemLayer[];
  /** All connections between layers (always top-down) */
  connections: { fromLayer: SystemLayerType; toLayer: SystemLayerType }[];
  /** Total node count */
  nodeCount: number;
  /** The user's business layer */
  userLayer: SystemLayerType;
}

// ═══════════════════════════════════════════════════════════════
//  PLAIN-LANGUAGE HELPERS
// ═══════════════════════════════════════════════════════════════

function describeFragmentation(level: FragmentationLevel): string {
  switch (level) {
    case "consolidated": return "Dominated by a few large players";
    case "moderate": return "Mix of large and small players";
    case "fragmented": return "Many small players, no dominant leader";
    case "atomized": return "Highly scattered — thousands of tiny operators";
  }
}

function describeDistribution(level: DistributionControl): string {
  switch (level) {
    case "owned": return "Companies sell directly to customers";
    case "shared": return "Mix of direct sales and middlemen";
    case "intermediated": return "Sales go through distributors or brokers";
    case "no_control": return "No control over how products reach customers";
  }
}

function describeRevenue(model: RevenueModel): string {
  switch (model) {
    case "recurring": return "Subscription or recurring payments";
    case "mixed": return "Mix of recurring and one-time payments";
    case "transactional": return "One-time purchases or per-use payments";
    case "project_based": return "Project-based billing with custom quotes";
  }
}

// ═══════════════════════════════════════════════════════════════
//  BUILD INDUSTRY LAYERS
// ═══════════════════════════════════════════════════════════════

export interface BuildIndustryMapInput {
  /** Business name or product name */
  businessName: string;
  /** Business description (from model input or product description) */
  businessDescription?: string;
  /** StructuralProfile from the reconfiguration engine */
  structuralProfile: StructuralProfile | null;
  /** Governed first_principles data */
  firstPrinciples?: {
    causal_model?: {
      inputs?: string[];
      outputs?: string[];
      mechanism?: string;
    };
    dependency_structure?: string[];
    minimum_viable_system?: string;
    resource_limits?: string[];
  } | null;
  /** Governed constraint_map */
  constraintMap?: {
    causal_chains?: Array<{
      structural_constraint: string;
      system_impact: string;
      impact_dimension: string;
    }>;
    binding_constraint_id?: string;
    dominance_proof?: string;
  } | null;
  /** Supply chain intel from product data */
  supplyChain?: {
    manufacturers?: Array<{ name?: string; region?: string } | string>;
    distributors?: Array<{ name?: string; region?: string } | string>;
    retailers?: Array<{ name?: string } | string>;
    vendors?: Array<{ name?: string } | string>;
  } | null;
  /** Analysis mode */
  mode: "product" | "service" | "business";
}

function extractName(item: { name?: string } | string): string {
  return typeof item === "string" ? item : item.name || "Unknown";
}

export function buildIndustryLayers(input: BuildIndustryMapInput): IndustrySystemMap {
  const {
    businessName,
    businessDescription,
    structuralProfile: sp,
    firstPrinciples: fp,
    constraintMap: cm,
    supplyChain: sc,
    mode,
  } = input;

  const layers: SystemLayer[] = [];
  let nodeId = 0;
  const makeId = () => `node-${++nodeId}`;

  // Determine user's position in the value chain
  const userPosition: SystemLayerType =
    sp?.valueChainPosition === "infrastructure" ? "infrastructure"
      : sp?.valueChainPosition === "platform" ? "infrastructure"
        : sp?.valueChainPosition === "end_service" ? "operations"
          : "operations";

  // ── LAYER 1: SUPPLY ──
  const supplyNodes: SystemNode[] = [];

  // From supply chain data
  if (sc?.manufacturers?.length) {
    const names = sc.manufacturers.slice(0, 2).map(extractName);
    supplyNodes.push({
      id: makeId(),
      label: names.length === 1 ? names[0] : "Material Suppliers",
      roleDescription: "Companies that provide raw materials and components needed for production.",
      whyItMatters: "They control the cost and availability of your inputs.",
      structureNote: sp ? describeFragmentation(sp.supplyFragmentation) : "Structure unknown",
      strategicSignals: [
        sp?.supplyFragmentation === "fragmented" ? "Potential to aggregate suppliers for better pricing" : "",
        "Supply disruptions directly impact your operations",
      ].filter(Boolean),
      isUserBusiness: false,
      isStructuralNode: sp?.supplyFragmentation === "consolidated" || sp?.supplyFragmentation === "atomized",
      layer: "supply",
    });
  }

  // From first principles inputs
  if (fp?.causal_model?.inputs?.length) {
    const inputLabels = fp.causal_model.inputs.slice(0, 3);
    for (const inp of inputLabels) {
      if (supplyNodes.length >= 3) break;
      // Avoid duplicate if supply chain already covered
      if (supplyNodes.some(n => inp.toLowerCase().includes(n.label.toLowerCase()))) continue;
      const shortLabel = inp.length > 30 ? inp.slice(0, 27) + "…" : inp;
      supplyNodes.push({
        id: makeId(),
        label: shortLabel,
        roleDescription: `A key input to the business: ${inp}.`,
        whyItMatters: "Without this, the business cannot deliver its core product or service.",
        structureNote: sp ? describeFragmentation(sp.supplyFragmentation) : "Structure varies",
        strategicSignals: [],
        isUserBusiness: false,
        isStructuralNode: false,
        layer: "supply",
      });
    }
  }

  // Fallback
  if (supplyNodes.length === 0) {
    supplyNodes.push({
      id: makeId(),
      label: "Material Suppliers",
      roleDescription: "Companies that provide raw materials and components.",
      whyItMatters: "They control input costs and availability.",
      structureNote: sp ? describeFragmentation(sp.supplyFragmentation) : "Structure unknown",
      strategicSignals: [],
      isUserBusiness: false,
      isStructuralNode: false,
      layer: "supply",
    });
  }

  layers.push({ id: "supply", label: "SUPPLY", nodes: supplyNodes.slice(0, 3) });

  // ── LAYER 2: INFRASTRUCTURE ──
  const infraNodes: SystemNode[] = [];

  if (sc?.distributors?.length) {
    infraNodes.push({
      id: makeId(),
      label: sc.distributors.length === 1 ? extractName(sc.distributors[0]) : "Distributors",
      roleDescription: "Companies that move products from manufacturers to operators.",
      whyItMatters: "They control access to tools, equipment, and materials.",
      structureNote: sp ? describeDistribution(sp.distributionControl) : "Structure unknown",
      strategicSignals: [
        sp?.distributionControl === "intermediated" ? "Removing middlemen could reduce costs" : "",
        "Distribution bottlenecks affect speed and price",
      ].filter(Boolean),
      isUserBusiness: userPosition === "infrastructure",
      isStructuralNode: sp?.distributionControl === "intermediated" || sp?.distributionControl === "owned",
      layer: "infrastructure",
    });
  }

  if (sc?.vendors?.length) {
    infraNodes.push({
      id: makeId(),
      label: "Software & Tools",
      roleDescription: "Technology and tools used to run day-to-day operations.",
      whyItMatters: "Better tools can dramatically improve efficiency and reduce costs.",
      structureNote: "Varies by segment",
      strategicSignals: ["Technology adoption gaps create competitive advantages"],
      isUserBusiness: false,
      isStructuralNode: false,
      layer: "infrastructure",
    });
  }

  // Fallback
  if (infraNodes.length === 0) {
    infraNodes.push({
      id: makeId(),
      label: "Equipment & Tools",
      roleDescription: "The equipment, tools, and software that enable the work.",
      whyItMatters: "Infrastructure quality determines operational efficiency.",
      structureNote: sp ? describeDistribution(sp.distributionControl) : "Structure varies",
      strategicSignals: [],
      isUserBusiness: userPosition === "infrastructure",
      isStructuralNode: false,
      layer: "infrastructure",
    });
  }

  layers.push({ id: "infrastructure", label: "INFRASTRUCTURE", nodes: infraNodes.slice(0, 3) });

  // ── LAYER 3: OPERATIONS (always contains the user's business) ──
  const opsNodes: SystemNode[] = [];

  // User's business — always present
  opsNodes.push({
    id: makeId(),
    label: businessName,
    roleDescription: businessDescription
      ? businessDescription.slice(0, 150)
      : fp?.causal_model?.mechanism || "The core business being analyzed.",
    whyItMatters: "This is your business — the center of this system.",
    structureNote: sp
      ? `${describeFragmentation(sp.supplyFragmentation)} market · ${sp.laborIntensity === "artisan" ? "Craft-based" : sp.laborIntensity === "labor_heavy" ? "Labor-intensive" : sp.laborIntensity === "mixed" ? "Mixed labor/tech" : "Technology-driven"} operations`
      : "Your operating position",
    strategicSignals: cm?.causal_chains?.slice(0, 2).map(c => c.structural_constraint) || [],
    isUserBusiness: true,
    isStructuralNode: false,
    layer: "operations",
  });

  // Competitors / peers
  if (sp?.supplyFragmentation === "fragmented" || sp?.supplyFragmentation === "atomized") {
    opsNodes.push({
      id: makeId(),
      label: "Competing Operators",
      roleDescription: "Other businesses offering similar products or services in this market.",
      whyItMatters: "A fragmented competitor landscape means no one has figured out how to scale yet — that's your opportunity.",
      structureNote: describeFragmentation(sp.supplyFragmentation),
      strategicSignals: ["Fragmentation often signals an aggregation opportunity"],
      isUserBusiness: false,
      isStructuralNode: false,
      layer: "operations",
    });
  }

  layers.push({ id: "operations", label: "OPERATIONS", nodes: opsNodes.slice(0, 3) });

  // ── LAYER 4: CUSTOMER ACCESS ──
  const customerNodes: SystemNode[] = [];

  // Infer customer types from evidence/first-principles
  const customerHints: string[] = [];
  if (fp?.dependency_structure?.length) {
    for (const dep of fp.dependency_structure) {
      const lower = dep.toLowerCase();
      if (lower.includes("customer") || lower.includes("client") || lower.includes("homeowner") || lower.includes("contractor") || lower.includes("consumer")) {
        customerHints.push(dep);
      }
    }
  }

  if (customerHints.length > 0) {
    // Extract customer type labels from dependency descriptions
    for (const hint of customerHints.slice(0, 2)) {
      const label = hint.length > 40 ? hint.slice(0, 37) + "…" : hint;
      customerNodes.push({
        id: makeId(),
        label,
        roleDescription: hint,
        whyItMatters: "Understanding who pays and why is the foundation of any strategy.",
        structureNote: sp ? `Switching costs: ${sp.switchingCosts === "high" ? "Hard to switch" : sp.switchingCosts === "moderate" ? "Some friction" : "Easy to switch"}` : "",
        strategicSignals: [
          sp?.switchingCosts === "low" || sp?.switchingCosts === "none" ? "Low switching costs — customers can leave easily" : "",
        ].filter(Boolean),
        isUserBusiness: false,
        isStructuralNode: sp?.customerConcentration === "concentrated" || sp?.customerConcentration === "single_customer",
        layer: "customer_access",
      });
    }
  }

  // Fallback based on mode
  if (customerNodes.length === 0) {
    const label = mode === "business" ? "Clients & Buyers" : mode === "service" ? "Service Customers" : "End Consumers";
    customerNodes.push({
      id: makeId(),
      label,
      roleDescription: "The people or businesses who ultimately pay for the product or service.",
      whyItMatters: "All value eventually flows from customers — understanding their needs is critical.",
      structureNote: sp
        ? `Customer concentration: ${sp.customerConcentration === "diversified" ? "Many customers, no dependency" : sp.customerConcentration === "concentrated" ? "Dangerously concentrated" : "Moderate concentration"}`
        : "",
      strategicSignals: [],
      isUserBusiness: false,
      isStructuralNode: false,
      layer: "customer_access",
    });
  }

  layers.push({ id: "customer_access", label: "CUSTOMERS", nodes: customerNodes.slice(0, 3) });

  // ── LAYER 5: VALUE CAPTURE ──
  const valueNodes: SystemNode[] = [];

  // From revenue model
  const revenueLabel = sp?.revenueModel === "recurring" ? "Subscriptions"
    : sp?.revenueModel === "project_based" ? "Project Contracts"
      : sp?.revenueModel === "transactional" ? "One-Time Sales"
        : "Revenue Streams";

  valueNodes.push({
    id: makeId(),
    label: revenueLabel,
    roleDescription: sp
      ? `The primary way money flows in: ${describeRevenue(sp.revenueModel)}.`
      : "How the business captures value from customers.",
    whyItMatters: "The revenue model determines scalability, predictability, and long-term viability.",
    structureNote: sp
      ? `Margin structure: ${sp.marginStructure === "high_margin" ? "Healthy margins" : sp.marginStructure === "thin_margin" ? "Razor-thin margins" : "Moderate margins"}`
      : "",
    strategicSignals: [
      sp?.revenueModel === "project_based" ? "Project-based billing creates unpredictable cash flow" : "",
      sp?.revenueModel === "transactional" ? "One-time sales have no built-in retention" : "",
      sp?.marginStructure === "thin_margin" ? "Thin margins leave little room for error" : "",
    ].filter(Boolean),
    isUserBusiness: false,
    isStructuralNode: sp?.marginStructure === "thin_margin" || sp?.revenueModel === "project_based",
    layer: "value_capture",
  });

  // From first principles outputs
  if (fp?.causal_model?.outputs?.length) {
    const outputLabels = fp.causal_model.outputs.filter(
      o => !o.toLowerCase().includes("revenue") && !o.toLowerCase().includes("profit")
    ).slice(0, 1);
    for (const out of outputLabels) {
      const shortLabel = out.length > 30 ? out.slice(0, 27) + "…" : out;
      valueNodes.push({
        id: makeId(),
        label: shortLabel,
        roleDescription: `A key output of the business: ${out}.`,
        whyItMatters: "These outputs represent the value the business creates for customers.",
        structureNote: "",
        strategicSignals: [],
        isUserBusiness: false,
        isStructuralNode: false,
        layer: "value_capture",
      });
    }
  }

  layers.push({ id: "value_capture", label: "VALUE CAPTURE", nodes: valueNodes.slice(0, 3) });

  // ── OPTIONAL LAYER 6: REGULATION ──
  if (sp?.regulatorySensitivity === "moderate" || sp?.regulatorySensitivity === "heavy") {
    layers.push({
      id: "regulation",
      label: "REGULATION",
      nodes: [{
        id: makeId(),
        label: sp.regulatorySensitivity === "heavy" ? "Heavy Regulatory Framework" : "Industry Regulations",
        roleDescription: "Government rules and compliance requirements that affect how the industry operates.",
        whyItMatters: "Regulation creates barriers to entry but also protects established players.",
        structureNote: sp.regulatorySensitivity === "heavy" ? "Heavily regulated — compliance is a major cost" : "Moderately regulated",
        strategicSignals: [
          "Regulatory changes can create sudden opportunities",
          "Compliance costs may keep smaller competitors out",
        ],
        isUserBusiness: false,
        isStructuralNode: true,
        layer: "regulation",
      }],
    });
  }

  // Build connections (simple top-down between adjacent layers)
  const connections: IndustrySystemMap["connections"] = [];
  for (let i = 0; i < layers.length - 1; i++) {
    connections.push({
      fromLayer: layers[i].id,
      toLayer: layers[i + 1].id,
    });
  }

  const totalNodes = layers.reduce((sum, l) => sum + l.nodes.length, 0);

  return {
    layers,
    connections,
    nodeCount: totalNodes,
    userLayer: userPosition,
  };
}
