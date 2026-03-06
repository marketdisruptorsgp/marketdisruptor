/**
 * LENS TOOLKIT REGISTRY
 *
 * Dynamic registry mapping each strategic lens to its relevant
 * intelligence modules, calculators, and tools.
 * 
 * The Lens Intelligence Panel on the Command Deck pulls tools
 * dynamically from this registry based on the active lens.
 */

import type { ElementType } from "react";
import {
  Calculator, TrendingUp, PieChart, Users, AlertTriangle,
  BarChart3, DollarSign, Building2, Layers, Target,
  Lightbulb, Zap, Shield, Compass, Cpu, GitBranch,
  Briefcase, ArrowUpDown,
} from "lucide-react";

export type LensId = "eta" | "venture" | "product" | "business_model" | "operator" | "innovator" | "investor" | "customer";

export type ToolCategory = "finance" | "deal_analysis" | "market" | "strategy" | "operations" | "innovation";
export type ToolInteraction = "calculator" | "analyzer" | "scanner" | "simulator" | "detector";
export type ToolStage = "discovery" | "disrupt" | "redesign" | "stress_test" | "pitch";

export interface LensTool {
  id: string;
  title: string;
  description: string;
  icon: ElementType;
  category: ToolCategory;
  interactionType: ToolInteraction;
  stages: ToolStage[];
  lenses: LensId[];
  /** Signal patterns that trigger this tool recommendation */
  triggerPatterns: string[];
  /** Accent color (HSL string) */
  accentColor: string;
}

export interface ToolTrigger {
  toolId: string;
  reason: string;
  confidence: number;
}

// ── ETA / Acquisition Tools ──
const ETA_TOOLS: LensTool[] = [
  {
    id: "sba-loan-calculator",
    title: "SBA Loan Calculator",
    description: "Estimate monthly payments, DSCR, and leverage scenarios for SBA-backed acquisitions.",
    icon: Calculator,
    category: "finance",
    interactionType: "calculator",
    stages: ["discovery", "stress_test", "pitch"],
    lenses: ["eta"],
    triggerPatterns: ["leverage", "acquisition", "loan", "financing", "debt"],
    accentColor: "hsl(229 89% 63%)",
  },
  {
    id: "deal-structure-simulator",
    title: "Deal Structure Simulator",
    description: "Test equity vs debt combinations and ownership outcomes across deal scenarios.",
    icon: ArrowUpDown,
    category: "deal_analysis",
    interactionType: "simulator",
    stages: ["discovery", "stress_test"],
    lenses: ["eta"],
    triggerPatterns: ["equity", "ownership", "deal structure", "seller note"],
    accentColor: "hsl(152 60% 44%)",
  },
  {
    id: "acquisition-roi-model",
    title: "Acquisition ROI Model",
    description: "Project return on investment across hold periods with multiple exit scenarios.",
    icon: TrendingUp,
    category: "finance",
    interactionType: "calculator",
    stages: ["stress_test", "pitch"],
    lenses: ["eta", "investor"],
    triggerPatterns: ["roi", "return", "exit", "multiple"],
    accentColor: "hsl(38 92% 50%)",
  },
  {
    id: "seller-motivation-signals",
    title: "Seller Motivation Signals",
    description: "Detect signals of likely seller readiness and urgency in the target market.",
    icon: Users,
    category: "market",
    interactionType: "scanner",
    stages: ["discovery", "disrupt"],
    lenses: ["eta"],
    triggerPatterns: ["retiring", "succession", "seller", "owner", "aging"],
    accentColor: "hsl(0 72% 52%)",
  },
  {
    id: "deal-risk-scanner",
    title: "Deal Risk Scanner",
    description: "Identify concentration risks, customer dependency, and operational vulnerabilities.",
    icon: Shield,
    category: "deal_analysis",
    interactionType: "scanner",
    stages: ["stress_test"],
    lenses: ["eta", "operator"],
    triggerPatterns: ["risk", "concentration", "dependency", "key person"],
    accentColor: "hsl(0 72% 52%)",
  },
  {
    id: "industry-fragmentation-detector",
    title: "Industry Fragmentation Detector",
    description: "Identify markets ideal for acquisition rollups based on fragmentation signals.",
    icon: Layers,
    category: "market",
    interactionType: "detector",
    stages: ["discovery"],
    lenses: ["eta"],
    triggerPatterns: ["fragmented", "consolidation", "rollup", "independent"],
    accentColor: "hsl(262 83% 58%)",
  },
  {
    id: "cash-flow-quality",
    title: "Cash Flow Quality Analyzer",
    description: "Assess recurring revenue quality, addback legitimacy, and SDE accuracy.",
    icon: DollarSign,
    category: "finance",
    interactionType: "analyzer",
    stages: ["discovery", "stress_test"],
    lenses: ["eta", "investor"],
    triggerPatterns: ["cash flow", "revenue", "addback", "sde", "ebitda"],
    accentColor: "hsl(152 60% 44%)",
  },
  {
    id: "dscr-calculator",
    title: "Debt Service Coverage Calculator",
    description: "Calculate DSCR ratios across acquisition financing structures.",
    icon: PieChart,
    category: "finance",
    interactionType: "calculator",
    stages: ["stress_test", "pitch"],
    lenses: ["eta"],
    triggerPatterns: ["dscr", "debt service", "coverage ratio"],
    accentColor: "hsl(229 89% 63%)",
  },
];

// ── Venture / Growth Tools ──
const VENTURE_TOOLS: LensTool[] = [
  {
    id: "tam-calculator",
    title: "TAM/SAM/SOM Calculator",
    description: "Estimate total addressable market with bottom-up and top-down models.",
    icon: BarChart3,
    category: "market",
    interactionType: "calculator",
    stages: ["discovery", "pitch"],
    lenses: ["venture", "investor"],
    triggerPatterns: ["market size", "tam", "addressable", "opportunity"],
    accentColor: "hsl(152 60% 44%)",
  },
  {
    id: "unit-economics-model",
    title: "Unit Economics Model",
    description: "Calculate CAC, LTV, payback period, and contribution margin.",
    icon: DollarSign,
    category: "finance",
    interactionType: "calculator",
    stages: ["stress_test", "pitch"],
    lenses: ["venture", "investor"],
    triggerPatterns: ["unit economics", "cac", "ltv", "payback", "margin"],
    accentColor: "hsl(38 92% 50%)",
  },
  {
    id: "competitive-moat-analyzer",
    title: "Competitive Moat Analyzer",
    description: "Assess defensibility through network effects, switching costs, and scale advantages.",
    icon: Shield,
    category: "strategy",
    interactionType: "analyzer",
    stages: ["disrupt", "stress_test"],
    lenses: ["venture", "investor"],
    triggerPatterns: ["moat", "defensibility", "switching cost", "network effect"],
    accentColor: "hsl(229 89% 63%)",
  },
];

// ── Product Innovation Tools ──
const PRODUCT_TOOLS: LensTool[] = [
  {
    id: "assumption-stress-tester",
    title: "Assumption Stress Tester",
    description: "Systematically challenge each structural assumption with counter-evidence.",
    icon: AlertTriangle,
    category: "strategy",
    interactionType: "analyzer",
    stages: ["disrupt", "redesign"],
    lenses: ["product", "innovator"],
    triggerPatterns: ["assumption", "challenge", "convention", "belief"],
    accentColor: "hsl(0 72% 52%)",
  },
  {
    id: "innovation-pathway-mapper",
    title: "Innovation Pathway Mapper",
    description: "Map feasible innovation paths from constraints to breakthrough opportunities.",
    icon: Compass,
    category: "innovation",
    interactionType: "analyzer",
    stages: ["redesign"],
    lenses: ["product", "innovator"],
    triggerPatterns: ["innovation", "breakthrough", "novel", "redesign"],
    accentColor: "hsl(152 60% 44%)",
  },
];

// ── Business Model Tools ──
const BM_TOOLS: LensTool[] = [
  {
    id: "revenue-model-simulator",
    title: "Revenue Model Simulator",
    description: "Compare subscription, marketplace, licensing, and hybrid revenue architectures.",
    icon: Cpu,
    category: "finance",
    interactionType: "simulator",
    stages: ["redesign", "stress_test"],
    lenses: ["business_model", "investor"],
    triggerPatterns: ["revenue model", "subscription", "marketplace", "pricing"],
    accentColor: "hsl(38 92% 50%)",
  },
  {
    id: "value-chain-analyzer",
    title: "Value Chain Analyzer",
    description: "Identify value chain inefficiencies and disintermediation opportunities.",
    icon: GitBranch,
    category: "strategy",
    interactionType: "analyzer",
    stages: ["disrupt", "redesign"],
    lenses: ["business_model", "operator"],
    triggerPatterns: ["value chain", "middleman", "disintermediation", "margin"],
    accentColor: "hsl(229 89% 63%)",
  },
];

// ── Master Registry ──
const ALL_TOOLS: LensTool[] = [
  ...ETA_TOOLS,
  ...VENTURE_TOOLS,
  ...PRODUCT_TOOLS,
  ...BM_TOOLS,
];

/**
 * Get tools relevant to a specific lens.
 */
export function getToolsForLens(lens: LensId): LensTool[] {
  return ALL_TOOLS.filter(t => t.lenses.includes(lens));
}

/**
 * Get tools relevant to any of the given lenses.
 */
export function getToolsForLenses(lenses: LensId[]): LensTool[] {
  const seen = new Set<string>();
  return ALL_TOOLS.filter(t => {
    if (seen.has(t.id)) return false;
    const match = t.lenses.some(l => lenses.includes(l));
    if (match) seen.add(t.id);
    return match;
  });
}

/**
 * Detect tool recommendations based on signal keywords from analysis data.
 */
export function detectToolTriggers(
  signals: string[],
  activeLenses: LensId[]
): ToolTrigger[] {
  const normalizedSignals = signals.map(s => s.toLowerCase());
  const relevantTools = activeLenses.length > 0
    ? getToolsForLenses(activeLenses)
    : ALL_TOOLS;

  const triggers: ToolTrigger[] = [];

  for (const tool of relevantTools) {
    let matchCount = 0;
    let bestMatch = "";

    for (const pattern of tool.triggerPatterns) {
      const patternLower = pattern.toLowerCase();
      for (const signal of normalizedSignals) {
        if (signal.includes(patternLower)) {
          matchCount++;
          bestMatch = pattern;
        }
      }
    }

    if (matchCount > 0) {
      triggers.push({
        toolId: tool.id,
        reason: `Detected "${bestMatch}" signal in analysis`,
        confidence: Math.min(1, matchCount * 0.25),
      });
    }
  }

  return triggers
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5);
}

/**
 * Get a tool by its ID.
 */
export function getToolById(id: string): LensTool | undefined {
  return ALL_TOOLS.find(t => t.id === id);
}

/**
 * Infer active lenses from analysis mode.
 */
export function inferLensesFromMode(mode: string): LensId[] {
  switch (mode) {
    case "product":
    case "custom":
      return ["product", "innovator"];
    case "service":
      return ["operator", "customer"];
    case "business":
    case "business_model":
      return ["business_model", "investor"];
    default:
      return ["product"];
  }
}
