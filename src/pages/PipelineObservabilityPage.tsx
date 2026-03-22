import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, XCircle, AlertTriangle, Clock, Zap, ChevronDown, ChevronUp,
  Layers, Activity, Database, ArrowDown, RefreshCw, Eye, Shield,
  Copy, Code2, FlaskConical, BookOpen
} from "lucide-react";
import { PlatformNav } from "@/components/PlatformNav";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { STEP_CONTRACTS } from "@/utils/pipelineValidation";
import { detectSignals } from "@/lib/signalDetection";
import { extractAndRankSignals } from "@/lib/signalRanking";
import { validatePipelineCheckpoints } from "@/utils/checkpointGate";
import { countOpportunities, deriveInnovationOpportunities } from "@/lib/innovationEngine";
import {
  computeSystemHealth,
  checkRetroactiveInvalidation,
  GOVERNED_ARTIFACT_KEYS,
} from "@/lib/governedPersistence";
import { buildEvidenceRegistry, type SourceType } from "@/lib/evidenceRegistry";
import { JsonTree } from "@/components/JsonTree";

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
  const { selectedProduct, disruptData, redesignData, stressTestData, pitchDeckData, governedData, outdatedSteps, mainTab, businessAnalysisData, adaptiveContext, geoData, regulatoryData } = analysis;

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
          `Overall viability: ${((stressTestData as any)?.confidenceScores?.overallViability?.score || 0) >= 7 ? "Strong" : "Moderate"}`,
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

  // Reconstructed analysis data for health / evidence registry
  const analysisDataForHealth = useMemo(() => ({
    governed: governedData,
    disrupt: disruptData,
    stressTest: stressTestData,
    pitchDeck: pitchDeckData,
    redesign: redesignData,
    businessAnalysis: businessAnalysisData,
    geoOpportunity: geoData,
    regulatoryContext: regulatoryData,
    adaptiveContext,
    intelData: selectedProduct,
  }), [governedData, disruptData, stressTestData, pitchDeckData, redesignData, businessAnalysisData, geoData, regulatoryData, adaptiveContext, selectedProduct]);

  const systemHealth = useMemo(
    () => computeSystemHealth(analysisDataForHealth as Record<string, unknown>),
    [analysisDataForHealth]
  );

  const evidenceRegistry = useMemo(
    () => buildEvidenceRegistry(analysisDataForHealth as Record<string, unknown>),
    [analysisDataForHealth]
  );

  const invalidationResult = useMemo(() => {
    if (!governedData) return null;
    try {
      return checkRetroactiveInvalidation(governedData as unknown as Record<string, unknown>);
    } catch {
      return null;
    }
  }, [governedData]);

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

        {/* System Health Score Panel */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-extrabold text-foreground">System Health Score</h2>
            <span
              className="ml-auto text-sm font-extrabold px-3 py-1 rounded"
              style={{
                background: systemHealth.market_ready ? "hsl(142 70% 35% / 0.15)" : "hsl(var(--destructive) / 0.15)",
                color: systemHealth.market_ready ? "hsl(142 70% 35%)" : "hsl(var(--destructive))",
              }}
            >
              {systemHealth.market_ready ? "✓ MARKET READY" : "✗ NOT READY"}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Governed Persistence */}
            <div className="rounded-lg border border-border p-3" style={{ background: "hsl(var(--card))" }}>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Governed Persistence</p>
              <p className="text-base font-black text-foreground">
                {systemHealth.artifact_count}/{systemHealth.total_required} artifacts
              </p>
              <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.round(systemHealth.governed_persistence_rate * 100)}%`,
                    background: systemHealth.governed_persistence_rate >= 0.9 ? "hsl(142 70% 35%)" : systemHealth.governed_persistence_rate >= 0.5 ? "hsl(38 92% 42%)" : "hsl(var(--destructive))",
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{Math.round(systemHealth.governed_persistence_rate * 100)}%</p>
            </div>
            {/* Schema Validation */}
            <div className="rounded-lg border border-border p-3" style={{ background: "hsl(var(--card))" }}>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Schema Validation</p>
              <p className="text-base font-black text-foreground">{Math.round(systemHealth.schema_validation_pass_rate * 100)}%</p>
              <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.round(systemHealth.schema_validation_pass_rate * 100)}%`,
                    background: systemHealth.schema_validation_pass_rate >= 0.9 ? "hsl(142 70% 35%)" : "hsl(38 92% 42%)",
                  }}
                />
              </div>
            </div>
            {/* Causal Structure */}
            <div className="rounded-lg border border-border p-3" style={{ background: "hsl(var(--card))" }}>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Causal Structure</p>
              <p className="text-base font-black" style={{ color: systemHealth.causal_structure_presence_rate > 0 ? "hsl(142 70% 35%)" : "hsl(var(--destructive))" }}>
                {systemHealth.causal_structure_presence_rate > 0 ? "✓ Present" : "✗ Absent"}
              </p>
            </div>
            {/* Confidence Computed */}
            <div className="rounded-lg border border-border p-3" style={{ background: "hsl(var(--card))" }}>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Confidence Computed</p>
              <p className="text-base font-black" style={{ color: systemHealth.confidence_computed ? "hsl(142 70% 35%)" : "hsl(var(--destructive))" }}>
                {systemHealth.confidence_computed ? "✓ Yes" : "✗ No"}
              </p>
            </div>
            {/* Decision Grade */}
            <div className="rounded-lg border border-border p-3" style={{ background: "hsl(var(--card))" }}>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Decision Grade</p>
              <p className="text-base font-black" style={{ color: systemHealth.decision_grade_present ? "hsl(142 70% 35%)" : "hsl(var(--destructive))" }}>
                {systemHealth.decision_grade_present ? "✓ Present" : "✗ Absent"}
              </p>
            </div>
            {/* Data Traceability */}
            <div className="rounded-lg border border-border p-3" style={{ background: "hsl(var(--card))" }}>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Data Traceability</p>
              <p className="text-base font-black text-foreground">{Math.round(systemHealth.data_traceability_rate * 100)}%</p>
              <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.round(systemHealth.data_traceability_rate * 100)}%`,
                    background: "hsl(var(--primary))",
                  }}
                />
              </div>
            </div>
            {/* Governed Size */}
            <div className="rounded-lg border border-border p-3" style={{ background: "hsl(var(--card))" }}>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Governed Size</p>
              <p className="text-base font-black text-foreground">
                {(systemHealth.governed_byte_size / 1024).toFixed(1)} KB
              </p>
            </div>
            {/* Market Ready */}
            <div className="rounded-lg border border-border p-3 flex flex-col justify-center items-center" style={{ background: "hsl(var(--card))" }}>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Market Ready</p>
              <span
                className="text-sm font-extrabold px-2 py-1 rounded"
                style={{
                  background: systemHealth.market_ready ? "hsl(142 70% 35% / 0.15)" : "hsl(var(--destructive) / 0.15)",
                  color: systemHealth.market_ready ? "hsl(142 70% 35%)" : "hsl(var(--destructive))",
                }}
              >
                {systemHealth.market_ready ? "✓ YES" : "✗ NO"}
              </span>
            </div>
          </div>
        </section>

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

        {/* Section 5: Governed Artifact Inspector */}
        <GovernedArtifactInspector governedData={governedData} />

        {/* Section 6: Step Data Inspector */}
        <StepDataInspector
          disruptData={disruptData}
          redesignData={redesignData}
          stressTestData={stressTestData}
          pitchDeckData={pitchDeckData}
          businessAnalysisData={businessAnalysisData}
          governedData={governedData}
          adaptiveContext={adaptiveContext}
        />

        {/* Section 7: Evidence Registry */}
        <EvidenceRegistryPanel registry={evidenceRegistry} />

        {/* Section 8: Invalidation Check */}
        {invalidationResult && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <FlaskConical className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-extrabold text-foreground">Invalidation Check</h2>
            </div>
            <div className="rounded-lg border border-border p-4" style={{ background: "hsl(var(--card))" }}>
              {invalidationResult.shouldInvalidate ? (
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "hsl(38 92% 42%)" }} />
                  <div>
                    <p className="text-sm font-bold text-foreground" style={{ color: "hsl(38 92% 42%)" }}>
                      ⚠ Retroactive invalidation triggered
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Fragility score {invalidationResult.fragilityScore}/100 exceeds threshold (70).
                      Confidence downgraded by {invalidationResult.confidenceDowngrade} points.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Affected: {invalidationResult.affectedArtifacts.join(", ")}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: "hsl(142 70% 35%)" }} />
                  <p className="text-sm font-bold" style={{ color: "hsl(142 70% 35%)" }}>
                    ✓ No invalidation required
                  </p>
                  {invalidationResult.fragilityScore > 0 && (
                    <span className="text-xs text-muted-foreground">
                      (Fragility: {invalidationResult.fragilityScore}/100)
                    </span>
                  )}
                </div>
              )}
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

/* ─── Governed Artifact Inspector ─── */
const OPTIONAL_ARTIFACT_KEYS = ["causal_chains", "evidence_registry", "confidence_metrics", "redesign_logic", "reasoning_synopsis"] as const;

function GovernedArtifactInspector({ governedData }: { governedData: Record<string, unknown> | null }) {
  const [open, setOpen] = useState(false);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const toggleKey = (key: string) => {
    setExpandedKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const allKeys = [...GOVERNED_ARTIFACT_KEYS, ...OPTIONAL_ARTIFACT_KEYS];
  const presentOptional = OPTIONAL_ARTIFACT_KEYS.filter(k => governedData && governedData[k] != null);
  const keysToShow = [...GOVERNED_ARTIFACT_KEYS, ...presentOptional];

  return (
    <section>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-2 mb-4 text-left">
        <BookOpen className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-extrabold text-foreground">Governed Artifact Inspector</h2>
        <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
          {governedData ? Object.keys(governedData).filter(k => allKeys.includes(k as never) && governedData[k] != null).length : 0}/{GOVERNED_ARTIFACT_KEYS.length} present
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground ml-auto" /> : <ChevronDown className="w-4 h-4 text-muted-foreground ml-auto" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="space-y-2">
              {keysToShow.map(key => {
                const artifact = governedData ? (governedData as Record<string, unknown>)[key] : undefined;
                const present = artifact != null;
                const byteSize = present ? new Blob([JSON.stringify(artifact)]).size : 0;
                const isOptional = OPTIONAL_ARTIFACT_KEYS.includes(key as never);
                const isExpanded = expandedKeys.has(key);

                return (
                  <div key={key} className="rounded-lg border border-border" style={{ background: "hsl(var(--card))" }}>
                    <button
                      onClick={() => present && toggleKey(key)}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left"
                      disabled={!present}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-foreground font-mono">{key}</span>
                          {isOptional && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">optional</span>
                          )}
                          <span
                            className="text-xs font-extrabold px-2 py-0.5 rounded"
                            style={{
                              color: present ? "hsl(142 70% 35%)" : "hsl(var(--destructive))",
                              background: present ? "hsl(142 70% 35% / 0.1)" : "hsl(var(--destructive) / 0.1)",
                            }}
                          >
                            {present ? "PRESENT" : "MISSING"}
                          </span>
                          {present && (
                            <span className="text-xs text-muted-foreground font-mono">
                              {(byteSize / 1024).toFixed(1)} KB
                            </span>
                          )}
                        </div>
                      </div>
                      {present && (
                        isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      )}
                    </button>
                    <AnimatePresence>
                      {isExpanded && present && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
                            {/* Prominent fields for specific artifacts */}
                            {key === "constraint_map" && artifact && (
                              <ConstraintMapHighlight data={artifact as Record<string, unknown>} />
                            )}
                            {key === "decision_synthesis" && artifact && (
                              <DecisionSynthesisHighlight data={artifact as Record<string, unknown>} />
                            )}
                            {key === "falsification" && artifact && (
                              <FalsificationHighlight data={artifact as Record<string, unknown>} />
                            )}
                            {/* Full JSON tree */}
                            <div>
                              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Full Content</p>
                              <div className="rounded-lg bg-muted/30 p-3 overflow-auto max-h-96">
                                <JsonTree data={artifact} maxDepth={4} />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function ConstraintMapHighlight({ data }: { data: Record<string, unknown> }) {
  const hypotheses = (data.root_hypotheses as Array<Record<string, unknown>>) || [];
  return (
    <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 space-y-2">
      <p className="text-xs font-bold text-primary uppercase tracking-wider">Key Fields</p>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="font-bold text-foreground">Binding Constraint: </span>
          <span className="text-muted-foreground font-mono">{String(data.binding_constraint_id || "—")}</span>
        </div>
        <div>
          <span className="font-bold text-foreground">Dominance Proof: </span>
          <span className="text-muted-foreground">{String(data.dominance_proof || "—")}</span>
        </div>
      </div>
      {hypotheses.length > 0 && (
        <div>
          <p className="text-xs font-bold text-foreground mb-1">Root Hypotheses ({hypotheses.length})</p>
          <div className="space-y-1.5">
            {hypotheses.map((h, i) => (
              <div key={i} className="rounded bg-muted/40 px-2 py-1.5 text-xs space-y-0.5">
                <p className="font-semibold text-foreground">{String(h.hypothesis_statement || `Hypothesis ${i + 1}`)}</p>
                <div className="flex gap-3 text-muted-foreground">
                  <span>Confidence: <strong>{String(h.confidence ?? "—")}</strong></span>
                  <span>Leverage: <strong>{String(h.leverage_score ?? "—")}</strong></span>
                  <span>Fragility: <strong>{String(h.fragility_score ?? "—")}</strong></span>
                </div>
                {h.evidence_mix && (
                  <p>Evidence mix: {String(h.evidence_mix)}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DecisionSynthesisHighlight({ data }: { data: Record<string, unknown> }) {
  const blockingUncertainties = (data.blocking_uncertainties as string[]) || [];
  const grade = String(data.decision_grade || "—");
  const gradeColor = grade === "proceed" ? "hsl(142 70% 35%)" : grade === "conditional" ? "hsl(38 92% 42%)" : grade === "blocked" ? "hsl(var(--destructive))" : "hsl(var(--muted-foreground))";
  const confidence = typeof data.confidence_score === "number" ? data.confidence_score : null;
  const confColor = confidence !== null ? (confidence >= 70 ? "hsl(142 70% 35%)" : confidence >= 45 ? "hsl(38 92% 42%)" : "hsl(var(--destructive))") : "inherit";

  return (
    <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 space-y-2">
      <p className="text-xs font-bold text-primary uppercase tracking-wider">Key Fields</p>
      <div className="flex items-center gap-4">
        <div>
          <p className="text-xs text-muted-foreground">Decision Grade</p>
          <span className="text-lg font-black uppercase px-2 py-0.5 rounded" style={{ color: gradeColor, background: `${gradeColor}20` }}>{grade}</span>
        </div>
        {confidence !== null && (
          <div>
            <p className="text-xs text-muted-foreground">Confidence Score</p>
            <p className="text-lg font-black" style={{ color: confColor }}>{confidence}/100</p>
          </div>
        )}
      </div>
      {blockingUncertainties.length > 0 && (
        <div>
          <p className="text-xs font-bold text-foreground mb-1">Blocking Uncertainties</p>
          <ul className="space-y-0.5">
            {blockingUncertainties.map((u, i) => (
              <li key={i} className="text-xs text-muted-foreground flex gap-1">
                <XCircle className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: "hsl(var(--destructive))" }} />
                {u}
              </li>
            ))}
          </ul>
        </div>
      )}
      {data.fastest_validation_experiment && (
        <div>
          <p className="text-xs font-bold text-foreground">Fastest Validation Experiment</p>
          <p className="text-xs text-muted-foreground">{String(data.fastest_validation_experiment)}</p>
        </div>
      )}
    </div>
  );
}

function FalsificationHighlight({ data }: { data: Record<string, unknown> }) {
  const fragilityScore = Number(data.model_fragility_score ?? 0);
  const fragColor = fragilityScore > 70 ? "hsl(var(--destructive))" : fragilityScore > 40 ? "hsl(38 92% 42%)" : "hsl(142 70% 35%)";
  const flags = Object.entries(data).filter(([k]) => k.toLowerCase().includes("flag") || k.toLowerCase().includes("fragil") && k !== "model_fragility_score");

  return (
    <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 space-y-2">
      <p className="text-xs font-bold text-primary uppercase tracking-wider">Key Fields</p>
      <div>
        <p className="text-xs text-muted-foreground">Model Fragility Score</p>
        <p className="text-2xl font-black" style={{ color: fragColor }}>{fragilityScore}/100</p>
      </div>
      {flags.length > 0 && (
        <div>
          <p className="text-xs font-bold text-foreground mb-1">Fragility Flags</p>
          <div className="space-y-1">
            {flags.map(([k, v]) => (
              <div key={k} className="text-xs flex gap-2">
                <span className="font-mono text-muted-foreground">{k}:</span>
                <span className="text-foreground">{typeof v === "object" ? JSON.stringify(v).slice(0, 80) : String(v)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Step Data Inspector ─── */
function StepDataInspector({
  disruptData, redesignData, stressTestData, pitchDeckData,
  businessAnalysisData, governedData, adaptiveContext,
}: {
  disruptData: unknown; redesignData: unknown; stressTestData: unknown; pitchDeckData: unknown;
  businessAnalysisData: unknown; governedData: unknown; adaptiveContext: unknown;
}) {
  const [open, setOpen] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  const toggleStep = (key: string) => {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const steps: Array<{ key: string; label: string; data: unknown }> = [
    { key: "disrupt", label: "Deconstruct (First Principles)", data: disruptData },
    { key: "redesign", label: "Redesign", data: redesignData },
    { key: "stressTest", label: "Stress Test", data: stressTestData },
    { key: "pitchDeck", label: "Pitch Deck", data: pitchDeckData },
    { key: "businessAnalysis", label: "Business Analysis", data: businessAnalysisData },
    { key: "governed", label: "Governed Artifacts", data: governedData },
    { key: "adaptiveContext", label: "Adaptive Context", data: adaptiveContext },
  ].filter(s => s.data != null);

  return (
    <section>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-2 mb-4 text-left">
        <Code2 className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-extrabold text-foreground">Step Data Inspector</h2>
        <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{steps.length} steps with data</span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground ml-auto" /> : <ChevronDown className="w-4 h-4 text-muted-foreground ml-auto" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="space-y-2">
              {steps.map(({ key, label, data }) => {
                const byteSize = JSON.stringify(data).length;
                const isExpanded = expandedSteps.has(key);
                const itemCounts = data && typeof data === "object" && !Array.isArray(data)
                  ? Object.entries(data as Record<string, unknown>)
                      .filter(([, v]) => Array.isArray(v))
                      .map(([k, v]) => `${k}: ${(v as unknown[]).length} items`)
                  : [];

                return (
                  <div key={key} className="rounded-lg border border-border" style={{ background: "hsl(var(--card))" }}>
                    <button onClick={() => toggleStep(key)} className="w-full flex items-center gap-3 px-4 py-3 text-left">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-foreground">{label}</span>
                          <span className="text-xs font-mono text-muted-foreground">{(byteSize / 1024).toFixed(1)} KB</span>
                          {itemCounts.slice(0, 3).map((c, i) => (
                            <span key={i} className="text-xs text-muted-foreground">{c}</span>
                          ))}
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                    </button>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  try { navigator.clipboard.writeText(JSON.stringify(data, null, 2)); } catch { /* ignore */ }
                                }}
                                className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-muted hover:bg-muted/70 text-muted-foreground transition-colors"
                              >
                                <Copy className="w-3 h-3" /> Copy JSON
                              </button>
                            </div>
                            <div className="rounded-lg bg-muted/30 p-3 overflow-auto max-h-96">
                              <JsonTree data={data} maxDepth={4} />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
              {steps.length === 0 && (
                <div className="rounded-lg border border-border p-6 text-center" style={{ background: "hsl(var(--card))" }}>
                  <p className="text-sm text-muted-foreground">No step data available yet. Run an analysis to populate this inspector.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/* ─── Evidence Registry Panel ─── */
const SOURCE_TYPE_COLORS: Record<SourceType, { bg: string; color: string }> = {
  verified:   { bg: "hsl(142 70% 35% / 0.1)", color: "hsl(142 70% 35%)" },
  scraped:    { bg: "hsl(210 80% 55% / 0.1)", color: "hsl(210 80% 55%)" },
  database:   { bg: "hsl(210 80% 55% / 0.1)", color: "hsl(210 80% 55%)" },
  modeled:    { bg: "hsl(48 92% 42% / 0.1)",  color: "hsl(48 92% 42%)" },
  assumed:    { bg: "hsl(25 80% 50% / 0.1)",  color: "hsl(25 80% 50%)" },
  user_input: { bg: "hsl(var(--muted))",       color: "hsl(var(--muted-foreground))" },
};

function EvidenceRegistryPanel({ registry }: { registry: ReturnType<typeof buildEvidenceRegistry> }) {
  const [open, setOpen] = useState(false);
  const [expandedClaims, setExpandedClaims] = useState<Set<string>>(new Set());

  const toggleClaim = (id: string) => {
    setExpandedClaims(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <section>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-2 mb-4 text-left">
        <Database className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-extrabold text-foreground">Evidence Registry</h2>
        <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{registry.entries.length} signals</span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground ml-auto" /> : <ChevronDown className="w-4 h-4 text-muted-foreground ml-auto" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            {/* Summary row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { label: "Total Signals", value: String(registry.entries.length) },
                { label: "Provenance Score", value: `${Math.round(registry.provenance_score * 100)}%` },
                { label: "Stale", value: String(registry.stale_count) },
                { label: "Unverified", value: String(registry.unverified_count) },
              ].map((item, i) => (
                <div key={i} className="rounded-lg border border-border p-3" style={{ background: "hsl(var(--card))" }}>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{item.label}</p>
                  <p className="text-lg font-black text-foreground">{item.value}</p>
                </div>
              ))}
            </div>
            {registry.entries.length === 0 ? (
              <div className="rounded-lg border border-border p-6 text-center" style={{ background: "hsl(var(--card))" }}>
                <p className="text-sm text-muted-foreground">
                  Evidence registry is empty. It requires a completed analysis with governed artifacts (particularly <span className="font-mono">first_principles.viability_assumptions</span>).
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-border overflow-hidden" style={{ background: "hsl(var(--card))" }}>
                <div className="grid grid-cols-[1fr_auto_auto_2fr_auto] gap-0 text-xs font-bold text-muted-foreground uppercase tracking-wider px-4 py-2 border-b border-border bg-muted/30">
                  <span>Signal ID</span>
                  <span>Source</span>
                  <span>Status</span>
                  <span>Claim</span>
                  <span>Age</span>
                </div>
                {registry.entries.map((entry) => {
                  const sc = SOURCE_TYPE_COLORS[entry.source_type] || SOURCE_TYPE_COLORS.user_input;
                  const claim = entry.supports_which_claim;
                  const truncated = claim.length > 80;
                  const isClaimExpanded = expandedClaims.has(entry.signal_id);
                  const statusColor = entry.verification_status === "verified" ? "hsl(142 70% 35%)" : entry.verification_status === "stale" ? "hsl(38 92% 42%)" : "hsl(var(--muted-foreground))";

                  return (
                    <div key={entry.signal_id} className="grid grid-cols-[1fr_auto_auto_2fr_auto] gap-2 items-start px-4 py-2 border-b border-border/50 text-xs hover:bg-muted/20">
                      <span className="font-mono text-muted-foreground truncate">{entry.signal_id}</span>
                      <span className="px-1.5 py-0.5 rounded font-bold whitespace-nowrap" style={{ background: sc.bg, color: sc.color }}>
                        {entry.source_type}
                      </span>
                      <span className="font-bold whitespace-nowrap" style={{ color: statusColor }}>
                        {entry.verification_status}
                      </span>
                      <span className="text-foreground">
                        {isClaimExpanded || !truncated ? claim : `${claim.slice(0, 80)}…`}
                        {truncated && (
                          <button onClick={() => toggleClaim(entry.signal_id)} className="ml-1 text-primary underline">
                            {isClaimExpanded ? "less" : "more"}
                          </button>
                        )}
                      </span>
                      <span className="text-muted-foreground whitespace-nowrap font-mono">
                        {entry.verification_status === "stale" ? "stale" : entry.freshness_hours != null ? `${entry.freshness_hours}h ago` : "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
