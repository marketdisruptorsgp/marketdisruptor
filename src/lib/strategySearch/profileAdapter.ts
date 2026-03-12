/**
 * PROFILE ADAPTER — Build a lightweight StructuralProfile from decomposition data.
 *
 * The pipeline orchestrator receives decomposition from the edge function (AI-generated),
 * not from the local evidence engine. This adapter extracts enough structural signal
 * to drive the strategy search engine's analogy matching and candidate generation.
 */

import type { StructuralProfile } from "@/lib/reconfiguration/structuralProfile";
import type { ConstraintCandidate } from "@/lib/constraintDetectionEngine";

/**
 * Extract a StructuralProfile from edge-function decomposition data.
 * Uses leverage primitives, system dynamics, and functional components
 * to infer structural dimensions heuristically.
 */
export function profileFromDecomposition(decomp: any): StructuralProfile | null {
  if (!decomp) return null;

  const leveragePrimitives = decomp.leverageAnalysis?.leveragePrimitives || [];
  const dynamics = decomp.systemDynamics || {};
  const components = decomp.functionalComponents || [];
  const corpus = [
    ...leveragePrimitives.map((p: any) => `${p.label} ${p.currentBehavior} ${p.bestTransformation}`),
    ...(dynamics.failureModes || []),
    ...(dynamics.bottlenecks || []),
    ...components.map((c: any) => c.name || c.label || ""),
  ].join(" ").toLowerCase();

  // Build binding constraints from leverage primitives
  const bindingConstraints: ConstraintCandidate[] = leveragePrimitives
    .slice(0, 5)
    .map((p: any) => ({
      constraintName: p.label || "unknown",
      explanation: p.currentBehavior || p.label || "",
      severity: (p.disruption_score || 5) / 10,
      evidenceIds: [],
    }));

  return {
    supplyFragmentation: inferFromCorpus(corpus, 
      ["fragmented", "atomized", "scattered", "many providers", "many suppliers"], "fragmented",
      ["consolidated", "dominant", "monopol", "few players"], "consolidated",
      "moderate"
    ) as StructuralProfile["supplyFragmentation"],

    marginStructure: inferFromCorpus(corpus,
      ["thin margin", "low margin", "commodity", "price war", "race to bottom"], "thin_margin",
      ["high margin", "premium", "luxury", "pricing power"], "high_margin",
      "moderate_margin"
    ) as StructuralProfile["marginStructure"],

    switchingCosts: inferFromCorpus(corpus,
      ["lock-in", "switching cost", "sticky", "embedded", "integrated"], "high",
      ["easy to switch", "no switching", "commodity", "interchangeable"], "low",
      "moderate"
    ) as StructuralProfile["switchingCosts"],

    distributionControl: inferFromCorpus(corpus,
      ["intermediat", "broker", "platform depend", "lead gen", "marketplace"], "intermediated",
      ["direct", "owned channel", "d2c", "direct-to"], "owned",
      "shared"
    ) as StructuralProfile["distributionControl"],

    laborIntensity: inferFromCorpus(corpus,
      ["labor heavy", "labor-intensive", "manual", "technician", "artisan", "craftsman"], "labor_heavy",
      ["automated", "software", "digital", "ai-driven", "machine"], "automated",
      "mixed"
    ) as StructuralProfile["laborIntensity"],

    revenueModel: inferFromCorpus(corpus,
      ["project-based", "project based", "one-time", "per-job", "per job"], "project_based",
      ["subscription", "recurring", "monthly", "annual contract", "saas"], "recurring",
      "transactional"
    ) as StructuralProfile["revenueModel"],

    customerConcentration: inferFromCorpus(corpus,
      ["single customer", "key account", "concentrated", "whale"], "concentrated",
      ["diversified", "many customers", "mass market", "consumer"], "diversified",
      "moderate"
    ) as StructuralProfile["customerConcentration"],

    assetUtilization: inferFromCorpus(corpus,
      ["idle", "underutilized", "low utilization", "40% util", "30% util"], "underutilized",
      ["high utilization", "fully utilized", "capacity constrained"], "high",
      "moderate"
    ) as StructuralProfile["assetUtilization"],

    regulatorySensitivity: inferFromCorpus(corpus,
      ["heavily regulated", "fda", "hipaa", "compliance heavy", "licensing"], "heavy",
      ["unregulated", "no regulation", "minimal oversight"], "none",
      "light"
    ) as StructuralProfile["regulatorySensitivity"],

    valueChainPosition: inferFromCorpus(corpus,
      ["infrastructure", "backend", "platform"], "infrastructure",
      ["end service", "consumer", "last mile", "retail"], "end_service",
      "application"
    ) as StructuralProfile["valueChainPosition"],

    // ETA dimensions — not available from decomp
    ownerDependency: null,
    acquisitionComplexity: null,
    improvementRunway: null,
    etaActive: false,

    bindingConstraints,
    evidenceDepth: leveragePrimitives.length + (dynamics.failureModes?.length || 0),
    evidenceCategories: ["decomposition"],
  };
}

function inferFromCorpus(
  corpus: string,
  positiveTerms: string[], positiveValue: string,
  negativeTerms: string[], negativeValue: string,
  defaultValue: string,
): string {
  const posHits = positiveTerms.filter(t => corpus.includes(t)).length;
  const negHits = negativeTerms.filter(t => corpus.includes(t)).length;
  if (posHits > negHits) return positiveValue;
  if (negHits > posHits) return negativeValue;
  return defaultValue;
}
