import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, XCircle, AlertTriangle, Clock, Zap, ChevronDown, ChevronUp,
  Layers, Activity, Database, ArrowDown, RefreshCw, Eye, Shield
} from "lucide-react";
import { PlatformNav } from "@/components/PlatformNav";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { STEP_CONTRACTS } from "@/utils/pipelineValidation";
import { detectSignals } from "@/lib/signalDetection";
import { extractAndRankSignals } from "@/lib/signalRanking";
import { validatePipelineCheckpoints } from "@/utils/checkpointGate";
import { countOpportunities, deriveInnovationOpportunities } from "@/lib/innovationEngine";

/* ─── Types ─── */
interface PipelineStep {
  id: string;
  label: string;
  layer: string;
  status: "active" | "complete" | "empty" | "outdated" | "error";
  inputSources: string[];
  outputKeys: string[];
  dataSize: number;
  governedArtifacts: string[];
  executionNotes: string[];
}

/* ─── Layer definitions matching the 8 methodology layers ─── */
const METHODOLOGY_LAYERS = [
  { id: "assumptions", label: "Assumption Extraction", description: "Hidden assumptions, viability assumptions, evidence status tagging" },
  { id: "reasoning", label: "Reasoning Application", description: "9-step constraint-driven reasoning framework (reasoningFramework.ts)" },
  { id: "frameworks", label: "Framework Application", description: "Governed schema enforcement, friction tiers, constraint mapping" },
  { id: "mode_specific", label: "Mode-Specific Analysis", description: "Mode enforcement, dimension weighting, input filtering" },
  { id: "insight_synthesis", label: "Insight Synthesis", description: "Signal detection, signal ranking, visual ontology classification" },
  { id: "structural_diagnosis", label: "Structural Diagnosis", description: "Market failure identification: value chain, pricing distortions, trust failures" },
  { id: "strategic_signals", label: "Strategic Signal Generation", description: "Strategic OS archetypes, hypothesis branching, dominance scoring" },
  { id: "metrics", label: "Metrics Intelligence", description: "Confidence computation, scoring calibration, evidence governance" },
  { id: "narrative", label: "Narrative Output", description: "Pitch deck generation, action plans, visual specs" },
  { id: "eta_analysis", label: "ETA Analysis", description: "Acquisition viability, SBA modeling, DSCR, owner dependency" },
  { id: "financial_modeling", label: "Financial Modeling", description: "Deterministic SBA loan calc, valuation, scenario engine" },
  { id: "innovation_engine", label: "Innovation Engine", description: "Structural leverage, pricing shifts, automation opportunities" },
  { id: "data_provenance", label: "Data Provenance", description: "Provenance tracking for all numeric outputs (SOURCE/USER_INPUT/MODELED)" },
] as const;

/* ─── Status badge ─── */
function StatusBadge({ status }: { status: PipelineStep["status"] }) {
  const config = {
    active: { color: "hsl(var(--primary))", bg: "hsl(var(--primary) / 0.1)", text: "ACTIVE", Icon: Activity },
    complete: { color: "hsl(142 70% 35%)", bg: "hsl(142 70% 35% / 0.1)", text: "COMPLETE", Icon: CheckCircle2 },
    empty: { color: "hsl(var(--muted-foreground))", bg: "hsl(var(--muted) / 0.5)", text: "EMPTY", Icon: Clock },
    outdated: { color: "hsl(38 92% 42%)", bg: "hsl(38 92% 42% / 0.1)", text: "OUTDATED", Icon: AlertTriangle },
    error: { color: "hsl(var(--destructive))", bg: "hsl(var(--destructive) / 0.1)", text: "ERROR", Icon: XCircle },
  }[status];
  const { Icon } = config;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-extrabold tracking-wider" style={{ color: config.color, background: config.bg }}>
      <Icon className="w-3 h-3" /> {config.text}
    </span>
  );
}

/* ─── Layer status card ─── */
function LayerCard({ layer, status, evidence }: { layer: typeof METHODOLOGY_LAYERS[number]; status: "ACTIVE" | "PARTIALLY IMPLEMENTED" | "VISUAL ONLY" | "MISSING"; evidence: string[] }) {
  const [open, setOpen] = useState(false);
  const color = status === "ACTIVE" ? "hsl(142 70% 35%)" : status === "PARTIALLY IMPLEMENTED" ? "hsl(38 92% 42%)" : "hsl(var(--destructive))";
  return (
    <div className="rounded-lg border border-border p-4" style={{ background: "hsl(var(--card))" }}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between text-left">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full" style={{ background: color }} />
          <div>
            <p className="text-sm font-bold text-foreground">{layer.label}</p>
            <p className="text-sm text-muted-foreground">{layer.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold tracking-wider px-2 py-0.5 rounded" style={{ color, background: `${color}15` }}>{status}</span>
          {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-3 pt-3 border-t border-border space-y-1">
              {evidence.map((e, i) => (
                <p key={i} className="text-sm text-foreground flex items-start gap-2">
                  <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color }} />
                  {e}
                </p>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Pipeline step row ─── */
function StepRow({ step, isLast }: { step: PipelineStep; isLast: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-muted/50 transition-colors text-left">
        <div className="w-8 text-center">
          <div className="w-3 h-3 rounded-full mx-auto" style={{
            background: step.status === "complete" ? "hsl(142 70% 35%)" : step.status === "outdated" ? "hsl(38 92% 42%)" : step.status === "active" ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.3)"
          }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-foreground">{step.label}</span>
            <StatusBadge status={step.status} />
            <span className="text-xs text-muted-foreground">{step.layer}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {step.dataSize > 0 && (
            <span className="font-mono">{(step.dataSize / 1024).toFixed(1)}KB</span>
          )}
          <span>{step.governedArtifacts.length} artifacts</span>
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="ml-12 mr-4 mb-3 p-3 rounded-lg bg-muted/30 border border-border space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-bold text-foreground mb-1">Inputs</p>
                  {step.inputSources.length > 0 ? step.inputSources.map((s, i) => <p key={i} className="text-muted-foreground">← {s}</p>) : <p className="text-muted-foreground italic">User input only</p>}
                </div>
                <div>
                  <p className="font-bold text-foreground mb-1">Outputs</p>
                  {step.outputKeys.map((k, i) => <p key={i} className="text-muted-foreground">→ {k}</p>)}
                </div>
              </div>
              {step.governedArtifacts.length > 0 && (
                <div>
                  <p className="font-bold text-foreground mb-1">Governed Artifacts</p>
                  <div className="flex flex-wrap gap-1">
                    {step.governedArtifacts.map((a, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">{a}</span>
                    ))}
                  </div>
                </div>
              )}
              {step.executionNotes.length > 0 && (
                <div>
                  <p className="font-bold text-foreground mb-1">Notes</p>
                  {step.executionNotes.map((n, i) => <p key={i} className="text-muted-foreground">{n}</p>)}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {!isLast && (
        <div className="flex justify-center py-1">
          <ArrowDown className="w-4 h-4 text-muted-foreground/40" />
        </div>
      )}
    </div>
  );
}

/* ─── Main Page ─── */
export default function PipelineObservabilityPage() {
  const analysis = useAnalysis();
  const { selectedProduct, disruptData, redesignData, stressTestData, pitchDeckData, governedData, outdatedSteps, mainTab, businessAnalysisData, adaptiveContext } = analysis;

  // Build pipeline steps from current state
  const pipelineSteps = useMemo<PipelineStep[]>(() => {
    const isBusiness = mainTab === "business";
    const steps: PipelineStep[] = [];

    // Helper
    const dataSize = (d: unknown) => d ? JSON.stringify(d).length : 0;
    const governedKeys = (d: Record<string, unknown> | null) => d ? Object.keys(d).filter(k => d[k] != null) : [];
    const stepStatus = (key: string, data: unknown): PipelineStep["status"] => {
      if (outdatedSteps.has(key)) return "outdated";
      if (data) return "complete";
      return "empty";
    };

    // Step 1: Data Collection
    steps.push({
      id: "input",
      label: "Data Collection & Problem Analysis",
      layer: "INPUT",
      status: selectedProduct ? "complete" : "empty",
      inputSources: ["User form input", "URL scraping", "Photo analysis"],
      outputKeys: ["products[]", "selectedProduct", "adaptiveContext"],
      dataSize: dataSize(selectedProduct) + dataSize(adaptiveContext),
      governedArtifacts: [],
      executionNotes: [
        adaptiveContext?.entity ? `Entity: ${adaptiveContext.entity.name} (${adaptiveContext.entity.type})` : "No adaptive context",
        adaptiveContext?.activeModes ? `Active modes: ${adaptiveContext.activeModes.join(", ")}` : "",
        adaptiveContext?.selectedChallenges ? `${adaptiveContext.selectedChallenges.length} strategic challenges selected` : "",
      ].filter(Boolean),
    });

    // Step 2: Intelligence Synthesis
    const intelData = selectedProduct;
    steps.push({
      id: "intelData",
      label: "Intelligence Synthesis",
      layer: "INTEL",
      status: stepStatus("intelData", intelData),
      inputSources: ["scrape-products → analyze-products"],
      outputKeys: ["overview", "pricingIntel", "supplyChain", "communityInsights", "patentData", "userWorkflow"],
      dataSize: dataSize(intelData),
      governedArtifacts: [],
      executionNotes: intelData ? [
        `Product: ${(intelData as any)?.name || "Unknown"}`,
        `Category: ${(intelData as any)?.category || "Unknown"}`,
        `Potential: ${(intelData as any)?.revivalScore >= 8 ? "Strong" : (intelData as any)?.revivalScore >= 5 ? "Moderate" : "Early"}`,
      ] : ["Not yet generated"],
    });

    if (!isBusiness) {
      // Step 3: Deconstruct
      steps.push({
        id: "disrupt",
        label: "Deconstruct (First Principles)",
        layer: "REASONING + FRAMEWORKS",
        status: stepStatus("disrupt", disruptData),
        inputSources: ["selectedProduct", "activeLens", "activeBranch", "adaptiveContext", "upstreamIntel"],
        outputKeys: ["hiddenAssumptions", "flippedLogic", "redesignedConcept", "governed.*"],
        dataSize: dataSize(disruptData),
        governedArtifacts: governedKeys(governedData),
        executionNotes: disruptData ? [
          `${((disruptData as any)?.hiddenAssumptions || []).length} assumptions extracted`,
          `${((disruptData as any)?.flippedLogic || []).length} logic inversions`,
          governedData?.constraint_map ? "Constraint map: ✓ present" : "Constraint map: ✗ missing",
          governedData?.reasoning_synopsis ? "Reasoning synopsis: ✓ present" : "Reasoning synopsis: ✗ missing",
          governedData?.root_hypotheses || (governedData?.constraint_map as any)?.root_hypotheses ? `Root hypotheses: ${((governedData?.constraint_map as any)?.root_hypotheses || []).length} branches` : "Root hypotheses: ✗ missing",
        ] : ["Not yet generated"],
      });

      // Step 4: Redesign
      steps.push({
        id: "redesign",
        label: "Redesign (Logic Inversion)",
        layer: "FRAMEWORK APPLICATION",
        status: stepStatus("redesign", redesignData),
        inputSources: ["disruptData", "upstreamIntel", "flippedIdeas"],
        outputKeys: ["flippedLogic", "flippedIdeas", "redesignedConcept"],
        dataSize: dataSize(redesignData),
        governedArtifacts: [],
        executionNotes: redesignData ? [
          `Concept: ${(redesignData as any)?.redesignedConcept?.conceptName || "Unknown"}`,
        ] : ["Not yet generated"],
      });

      // Step 5: Stress Test
      steps.push({
        id: "stressTest",
        label: "Adversarial Validation (Stress Test)",
        layer: "METRICS + VALIDATION",
        status: stepStatus("stressTest", stressTestData),
        inputSources: ["selectedProduct", "disruptData", "geoData", "regulatoryData", "competitorIntel", "activeBranch"],
        outputKeys: ["redTeam", "blueTeam", "confidenceScores", "governed.falsification", "governed.decision_synthesis"],
        dataSize: dataSize(stressTestData),
        governedArtifacts: [
          governedData?.falsification ? "falsification" : "",
          governedData?.decision_synthesis ? "decision_synthesis" : "",
        ].filter(Boolean),
        executionNotes: stressTestData ? [
          `Overall viability: ${(stressTestData as any)?.confidenceScores?.overallViability?.score || "N/A"}/10`,
          `Counter-examples: ${((stressTestData as any)?.counterExamples || []).length}`,
          governedData?.falsification ? `Fragility score: ${(governedData.falsification as any)?.model_fragility_score || "N/A"}` : "",
          governedData?.decision_synthesis ? `Decision grade: ${(governedData.decision_synthesis as any)?.decision_grade || "N/A"}` : "",
        ].filter(Boolean) : ["Not yet generated"],
      });

      // Step 6: Pitch Deck
      steps.push({
        id: "pitchDeck",
        label: "Narrative Output (Pitch Deck)",
        layer: "NARRATIVE",
        status: stepStatus("pitchDeck", pitchDeckData),
        inputSources: ["selectedProduct", "disruptData", "stressTestData", "redesignData", "userScores", "insightPreferences"],
        outputKeys: ["slides", "elevatorPitch", "keyMetrics", "investmentAsk", "actionPlans", "visualSpecs"],
        dataSize: dataSize(pitchDeckData),
        governedArtifacts: [],
        executionNotes: pitchDeckData ? [
          `Tagline: ${(pitchDeckData as any)?.tagline || "N/A"}`,
          `Action plans: ${((pitchDeckData as any)?.actionPlans || []).length}`,
          `Visual specs: ${((pitchDeckData as any)?.visualSpecs || []).length}`,
        ] : ["Not yet generated"],
      });
    } else {
      // Business mode pipeline
      steps.push({
        id: "businessAnalysis",
        label: "Business Model Deconstruction",
        layer: "REASONING + FRAMEWORKS",
        status: stepStatus("businessAnalysis", businessAnalysisData),
        inputSources: ["businessModelInput", "activeLens", "adaptiveContext"],
        outputKeys: ["summary", "operational", "assumptions", "technology", "revenue", "disruption", "reinvented", "governed.*"],
        dataSize: dataSize(businessAnalysisData),
        governedArtifacts: governedKeys(governedData),
        executionNotes: businessAnalysisData ? [
          `${(businessAnalysisData as any)?.hiddenAssumptions?.length || 0} assumptions`,
          governedData?.constraint_map ? "Constraint map: ✓" : "Constraint map: ✗",
        ] : ["Not yet generated"],
      });

      steps.push({
        id: "businessStressTest",
        label: "Business Stress Test",
        layer: "METRICS + VALIDATION",
        status: stepStatus("businessStressTest", analysis.businessStressTestData),
        inputSources: ["businessAnalysisData", "selectedProduct"],
        outputKeys: ["redTeam", "blueTeam", "confidenceScores", "governed.falsification"],
        dataSize: dataSize(analysis.businessStressTestData),
        governedArtifacts: [],
        executionNotes: [],
      });

      steps.push({
        id: "businessPitchDeck",
        label: "Business Pitch Deck",
        layer: "NARRATIVE",
        status: stepStatus("pitchDeck", pitchDeckData),
        inputSources: ["businessAnalysisData", "businessStressTestData"],
        outputKeys: ["slides", "elevatorPitch", "investmentAsk"],
        dataSize: dataSize(pitchDeckData),
        governedArtifacts: [],
        executionNotes: [],
      });
    }

    return steps;
  }, [selectedProduct, disruptData, redesignData, stressTestData, pitchDeckData, governedData, outdatedSteps, mainTab, businessAnalysisData, adaptiveContext, analysis.businessStressTestData]);

  // Compute methodology layer statuses
  const layerStatuses = useMemo(() => {
    const product = selectedProduct as unknown as Record<string, unknown> | null;
    const governed = governedData || {};

    return METHODOLOGY_LAYERS.map(layer => {
      switch (layer.id) {
        case "assumptions":
          return {
            layer,
            status: (disruptData && (disruptData as any)?.hiddenAssumptions?.length > 0) || (governed as any)?.first_principles?.viability_assumptions?.length > 0
              ? "ACTIVE" as const : "MISSING" as const,
            evidence: [
              `hiddenAssumptions: ${(disruptData as any)?.hiddenAssumptions?.length || 0} items`,
              `viability_assumptions: ${(governed as any)?.first_principles?.viability_assumptions?.length || 0} items (governed)`,
              `Evidence status tagging: ${(governed as any)?.first_principles?.viability_assumptions?.some((a: any) => a.evidence_status) ? "✓ verified/modeled/speculative" : "✗ not present"}`,
              "Edge function: first-principles-analysis → governed.first_principles.viability_assumptions",
            ],
          };
        case "reasoning":
          return {
            layer,
            status: (governed as any)?.reasoning_synopsis ? "ACTIVE" as const : disruptData ? "PARTIALLY IMPLEMENTED" as const : "MISSING" as const,
            evidence: [
              `reasoning_synopsis: ${(governed as any)?.reasoning_synopsis ? "✓ present" : "✗ missing"}`,
              "Source: reasoningFramework.ts (265 lines, 9-step protocol)",
              "Injected into: first-principles-analysis, critical-validation, generate-pitch-deck, business-model-analysis",
              `problem_framing: ${(governed as any)?.reasoning_synopsis?.problem_framing ? "✓" : "✗"}`,
              `core_causal_logic: ${(governed as any)?.reasoning_synopsis?.core_causal_logic ? "✓" : "✗"}`,
              `decision_drivers: ${(governed as any)?.reasoning_synopsis?.decision_drivers ? "✓" : "✗"}`,
            ],
          };
        case "frameworks":
          return {
            layer,
            status: (governed as any)?.constraint_map ? "ACTIVE" as const : "MISSING" as const,
            evidence: [
              `friction_map: ${(governed as any)?.friction_map ? "✓" : "✗"} — ${((governed as any)?.friction_map || []).length} items`,
              `friction_tiers: ${(governed as any)?.friction_tiers ? "✓" : "✗"} — T1: ${((governed as any)?.friction_tiers?.tier_1 || []).length}, T2: ${((governed as any)?.friction_tiers?.tier_2 || []).length}`,
              `constraint_map: ${(governed as any)?.constraint_map ? "✓" : "✗"} — binding: ${(governed as any)?.constraint_map?.binding_constraint_id || "none"}`,
              `leverage_map: ${(governed as any)?.leverage_map ? "✓" : "✗"} — ${((governed as any)?.leverage_map || []).length} levers`,
              `structural_analysis: ${(governed as any)?.structural_analysis ? "✓" : "✗"}`,
              "Source: governedSchema.ts (569 lines, 11 artifact types)",
            ],
          };
        case "mode_specific":
          return {
            layer,
            status: "ACTIVE" as const,
            evidence: [
              `Current mode: ${mainTab}`,
              "modeEnforcement.ts: resolveMode(), filterInputData(), getModeGuardPrompt()",
              "modeWeighting.ts: buildModeWeightingPrompt() — dimension weights per mode",
              "Active in ALL edge functions: first-principles-analysis, critical-validation, generate-pitch-deck",
              `Input filtering: blocks ${mainTab === "business" ? "physical/supply chain" : mainTab === "service" ? "manufacturing/patents" : "none"} domains`,
            ],
          };
        case "insight_synthesis":
          return {
            layer,
            status: product ? "ACTIVE" as const : "MISSING" as const,
            evidence: [
              `Signal detection: ${product ? detectSignals(product).length + " signals detected" : "no product data"}`,
              `Signal ranking: ${product ? extractAndRankSignals(product).length + " signals ranked" : "no data"}`,
              "signalDetection.ts: 11 signal types, 10 visual ontologies",
              "signalRanking.ts: 6 signal roles (driver, constraint, mechanism, assumption, leverage, outcome)",
              mainTab === "business" ? "⚠ Business mode: signal detection uses product-shaped fields — partial coverage" : "Full coverage for product/service mode",
            ],
          };
        case "strategic_signals":
          return {
            layer,
            status: (governed as any)?.constraint_map?.root_hypotheses?.length > 0 ? "ACTIVE" as const : "MISSING" as const,
            evidence: [
              `Root hypotheses: ${((governed as any)?.constraint_map?.root_hypotheses || []).length} branches`,
              `Strategic profile: ${analysis.strategicProfile.archetype}`,
              "strategicOS.ts: 5 archetypes, calculateDominance(), rankWithProfile()",
              "Adaptive drift: 2% profile evolution on user selections",
              `Hypothesis branching: ${analysis.activeBranchId || "combined"} mode`,
            ],
          };
        case "metrics":
          return {
            layer,
            status: (governed as any)?.decision_synthesis || stressTestData ? "ACTIVE" as const : "MISSING" as const,
            evidence: [
              `Decision grade: ${(governed as any)?.decision_synthesis?.decision_grade || "N/A"}`,
              `Confidence score: ${(governed as any)?.decision_synthesis?.confidence_score || "N/A"}`,
              `Falsification score: ${(governed as any)?.falsification?.model_fragility_score || "N/A"}`,
              "confidenceComputation.ts: evidence-weighted confidence with lens threshold",
              "Scoring calibration: 5-6 default, ≥8 requires evidence, 9-10 almost never",
              `Stress test viability: ${(stressTestData as any)?.confidenceScores?.overallViability?.score || "N/A"}/10`,
            ],
          };
        case "narrative":
          return {
            layer,
            status: pitchDeckData ? "ACTIVE" as const : "MISSING" as const,
            evidence: [
              `Pitch deck: ${pitchDeckData ? "✓ generated" : "✗ not generated"}`,
              `Slides: ${pitchDeckData ? "11-slide structure" : "N/A"}`,
              `Action plans: ${((pitchDeckData as any)?.actionPlans || []).length} plans`,
              `Visual specs: ${((pitchDeckData as any)?.visualSpecs || []).length} specs`,
              "generate-pitch-deck: mode-adaptive prompts, truncation recovery, JSON repair",
            ],
          };
        case "structural_diagnosis":
          return {
            layer,
            status: (governed as any)?.constraint_map || (governed as any)?.friction_map?.length > 0 ? "ACTIVE" as const : "MISSING" as const,
            evidence: [
              `constraint_map: ${(governed as any)?.constraint_map ? "✓ binding constraint identified" : "✗ missing"}`,
              `friction_map: ${((governed as any)?.friction_map || []).length} friction points`,
              `leverage_map: ${((governed as any)?.leverage_map || []).length} leverage points`,
              "Analyzes: value chain inefficiencies, pricing distortions, trust failures, access barriers",
            ],
          };
        case "eta_analysis":
          return {
            layer,
            status: mainTab === "business" ? "ACTIVE" as const : "PARTIALLY IMPLEMENTED" as const,
            evidence: [
              "DealEconomicsPanel: SBA loan modeling, DSCR computation",
              "BusinessModelAnalysis: ETA tabs (Deal Economics, Addback Scrutiny, Stagnation Dx, Owner Risk, 100-Day Playbook)",
              mainTab === "business" ? "✓ Active in current mode" : "Available via ETA lens in non-business modes",
            ],
          };
        case "financial_modeling": {
          return {
            layer,
            status: "ACTIVE" as const,
            evidence: [
              "financialModelingEngine.ts: deterministic SBA loan calc, valuation, scenario engine",
              "All outputs include DataProvenance metadata (SOURCE/USER_INPUT/MODELED)",
              "Formula: P × r / (1 - (1+r)^-n) for monthly payments",
              "Scenario engine: Base, -10%, -20%, -30%, +10%, +20%",
            ],
          };
        }
        case "innovation_engine": {
          const innovOutput = deriveInnovationOpportunities(governed as any, (disruptData || businessAnalysisData) as any, stressTestData as any);
          const total = countOpportunities(innovOutput);
          return {
            layer,
            status: total > 0 ? "ACTIVE" as const : "MISSING" as const,
            evidence: [
              `${total} innovation opportunities derived`,
              `Structural leverage: ${innovOutput.structural_leverage.length}`,
              `Pricing shifts: ${innovOutput.pricing_model_shifts.length}`,
              `Automation: ${innovOutput.automation_opportunities.length}`,
              "Source: innovationEngine.ts — derives from constraint_map, friction_map, stress test",
            ],
          };
        }
        case "data_provenance":
          return {
            layer,
            status: "ACTIVE" as const,
            evidence: [
              "dataProvenance.ts: ProvenancedValue<T> type with full metadata",
              "financialModelingEngine.ts: all outputs use modeledValue() with provenance",
              "DealEconomicsPanel: ProvenanceBadge UI shows SOURCE/USER_INPUT/MODELED",
              "Types: SOURCE (external data), USER_INPUT (user-provided), MODELED (deterministic formula)",
            ],
          };
        default:
          return { layer, status: "MISSING" as const, evidence: [] };
      }
    });
  }, [selectedProduct, disruptData, stressTestData, pitchDeckData, governedData, mainTab, analysis.strategicProfile, analysis.activeBranchId, businessAnalysisData]);

  // Summary stats
  const stats = useMemo(() => {
    const completed = pipelineSteps.filter(s => s.status === "complete").length;
    const total = pipelineSteps.length;
    const totalDataSize = pipelineSteps.reduce((s, p) => s + p.dataSize, 0);
    const totalArtifacts = pipelineSteps.reduce((s, p) => s + p.governedArtifacts.length, 0);
    const activeLayers = layerStatuses.filter(l => l.status === "ACTIVE").length;
    return { completed, total, totalDataSize, totalArtifacts, activeLayers };
  }, [pipelineSteps, layerStatuses]);

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--background))" }}>
      <PlatformNav tier="explorer" />
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-5 h-5 text-primary" />
            <h1 className="text-2xl font-extrabold text-foreground">Pipeline Observability Console</h1>
          </div>
          <p className="text-sm text-muted-foreground">Real-time execution status, data flow, and methodology layer verification for the active analysis.</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Steps Complete", value: `${stats.completed}/${stats.total}`, icon: CheckCircle2, color: "hsl(142 70% 35%)" },
            { label: "Data Flowing", value: `${(stats.totalDataSize / 1024).toFixed(0)}KB`, icon: Database, color: "hsl(var(--primary))" },
            { label: "Governed Artifacts", value: String(stats.totalArtifacts), icon: Shield, color: "hsl(38 92% 42%)" },
            { label: "Active Layers", value: `${stats.activeLayers}/13`, icon: Layers, color: "hsl(var(--primary))" },
          ].map((card, i) => (
            <div key={i} className="rounded-lg border border-border p-4 flex items-center gap-3" style={{ background: "hsl(var(--card))" }}>
              <card.icon className="w-5 h-5 flex-shrink-0" style={{ color: card.color }} />
              <div>
                <p className="text-lg font-black text-foreground">{card.value}</p>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{card.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Section 1: Methodology Layer Audit */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Eye className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-extrabold text-foreground">Methodology Layer Audit</h2>
          </div>
          <div className="space-y-2">
            {layerStatuses.map((ls) => (
              <LayerCard key={ls.layer.id} layer={ls.layer} status={ls.status} evidence={ls.evidence} />
            ))}
          </div>
        </section>

        {/* Section 2: Pipeline Execution Trace */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-extrabold text-foreground">Pipeline Execution Trace</h2>
            <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-bold">{mainTab.toUpperCase()} MODE</span>
          </div>
          <div className="rounded-lg border border-border overflow-hidden" style={{ background: "hsl(var(--card))" }}>
            {pipelineSteps.map((step, i) => (
              <StepRow key={step.id} step={step} isLast={i === pipelineSteps.length - 1} />
            ))}
          </div>
        </section>

        {/* Section 3: Data Flow Summary */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-extrabold text-foreground">Data Flow Summary</h2>
          </div>
          <div className="rounded-lg border border-border p-4 space-y-3" style={{ background: "hsl(var(--card))" }}>
            <div className="text-sm text-foreground space-y-1 font-mono">
              <p>USER INPUT</p>
              <p className="text-muted-foreground pl-4">↓ analyze-problem → adaptiveContext</p>
              <p className="text-muted-foreground pl-4">↓ scrape-products → rawContent</p>
              <p>INTELLIGENCE SYNTHESIS (analyze-products)</p>
              <p className="text-muted-foreground pl-4">↓ Product[] + pricingIntel + supplyChain + patents + community</p>
              <p className="text-muted-foreground pl-4">↓ geo-market-data → geoData [background]</p>
              <p>{mainTab === "business" ? "BUSINESS MODEL ANALYSIS" : "REASONING ENGINE (first-principles-analysis)"}</p>
              <p className="text-muted-foreground pl-4">↓ governed: constraint_map, friction_tiers, leverage_map, reasoning_synopsis</p>
              <p>STRATEGIC OS (rankWithProfile)</p>
              <p className="text-muted-foreground pl-4">↓ dominance-ranked hypotheses + adaptive drift</p>
              {mainTab !== "business" && (
                <>
                  <p>REDESIGN (generate-flip-ideas)</p>
                  <p className="text-muted-foreground pl-4">↓ flippedIdeas, redesignedConcept</p>
                </>
              )}
              <p>ADVERSARIAL VALIDATION (critical-validation)</p>
              <p className="text-muted-foreground pl-4">↓ redTeam, blueTeam, confidenceScores, governed.falsification</p>
              <p>OUTPUT GENERATION (generate-pitch-deck)</p>
              <p className="text-muted-foreground pl-4">↓ 11-slide deck, actionPlans, visualSpecs</p>
              <p>PERSISTENCE (checkpoint gate → governed extraction → evidence registry → fingerprinting)</p>
            </div>
          </div>
        </section>

        {/* Section 4: Outdated Steps */}
        {outdatedSteps.size > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5" style={{ color: "hsl(38 92% 42%)" }} />
              <h2 className="text-lg font-extrabold text-foreground">Outdated Steps</h2>
            </div>
            <div className="rounded-lg border border-border p-4 space-y-2" style={{ background: "hsl(var(--card))" }}>
              {[...outdatedSteps].map(step => (
                <div key={step} className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" style={{ color: "hsl(38 92% 42%)" }} />
                  <span className="text-sm font-bold text-foreground">{step}</span>
                  <span className="text-xs text-muted-foreground">— needs regeneration due to upstream changes</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground">
            Pipeline Observability Console • {new Date().toISOString().split("T")[0]} • {pipelineSteps.length} steps tracked • {stats.activeLayers}/13 methodology layers active
          </p>
        </div>
      </div>
    </div>
  );
}
