/**
 * Pipeline Architecture Diagram — Detailed system illustration
 * All stages auto-expanded, PDF download, horizontal flow diagram
 */

import React, { useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronRight as ChevronRightIcon, Cpu, Database, Brain, Zap, Filter, GitBranch, Layers, Target, Search, Settings, FileDown, RotateCcw } from "lucide-react";
import { useWorkspaceTheme } from "@/hooks/useWorkspaceTheme";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/* ── Stage Data ── */

interface DataSource {
  name: string;
  type: "user_input" | "edge_function" | "database" | "ai_model" | "deterministic" | "browser";
}

interface StageConfig {
  id: string;
  number: number;
  name: string;
  shortName: string;
  subtitle: string;
  icon: React.ElementType;
  trigger: string;
  dataSources: DataSource[];
  aiUsage: { model: string; purpose: string; temperature?: number; unique: boolean } | null;
  lensImpact: string | null;
  uniqueLogic: string[];
  outputs: string[];
  processingWeight: "low" | "medium" | "high" | "critical";
  edgeFunction: string | null;
  description: string;
}

const STAGES: StageConfig[] = [
  {
    id: "evidence",
    number: 1,
    name: "Evidence Extraction & Normalization",
    shortName: "Evidence",
    subtitle: "Raw signals → Canonical Evidence objects",
    icon: Search,
    trigger: "Automatic — triggered after each pipeline step completes (report, disrupt, redesign, stress test, pitch)",
    dataSources: [
      { name: "User product/service/business input", type: "user_input" },
      { name: "scrape-products edge function (web scraping)", type: "edge_function" },
      { name: "analyze-products edge function (structured parsing)", type: "edge_function" },
      { name: "photo-analysis edge function (image→product)", type: "edge_function" },
      { name: "scrape-url-autofill (URL metadata extraction)", type: "edge_function" },
      { name: "patent-analysis edge function", type: "edge_function" },
      { name: "scrape-market-news (market headlines)", type: "edge_function" },
      { name: "scrape-trend-intel (Google Trends velocity)", type: "edge_function" },
      { name: "scrape-patent-intel (patent landscape)", type: "edge_function" },
      { name: "geo-market-data (geographic market sizing)", type: "edge_function" },
      { name: "extract-business-intelligence (financial signals)", type: "edge_function" },
      { name: "scout-competitors (competitive landscape)", type: "edge_function" },
      { name: "Saved analysis data (saved_analyses table)", type: "database" },
      { name: "Tool scenario simulations (tool_scenarios table)", type: "database" },
      { name: "Market signals (market_signals table)", type: "database" },
      { name: "Trend signals (trend_signals table)", type: "database" },
    ],
    aiUsage: {
      model: "Gemini 2.5 Flash (via analyze-products)",
      purpose: "Parses raw user input into structured product objects with category, pricing, features, audience. Also used in photo-analysis for image-to-product extraction.",
      temperature: 0.3,
      unique: false,
    },
    lensImpact: "ETA lens adds 3 dimensions to evidence: ownerDependency, acquisitionComplexity, improvementRunway. Evidence archetype tagged as 'eta'.",
    uniqueLogic: [
      "evidenceEngine.ts — 1,100+ lines of deterministic normalization, deduplication, and tier classification",
      "Canonical Evidence type with 20+ fields (tier, lens, archetype, mode, sourceEngine, confidence)",
      "tierDiscoveryEngine.ts — Classifies every signal into Structural / System / Optimization tiers",
      "constraintDetectionEngine.ts — Extracts binding constraints from hidden assumptions and friction patterns",
      "constraintSeverityEngine.ts — Ranks constraints by severity and interaction effects",
      "constraintInteractionEngine.ts — Models how constraints amplify/dampen each other",
      "constraintInverter.ts — Flips constraints into opportunity vectors",
      "frictionEngine.ts — Identifies operational friction points and maps them to evidence",
      "evidenceAdapters.ts — Adapts raw step data into canonical evidence format",
      "evidenceBridge.ts — Bridges evidence between pipeline stages",
      "evidenceRegistry.ts — Central registry for evidence lifecycle tracking",
      "evidenceFacets.ts — Multi-dimensional faceting and filtering",
      "dataProvenance.ts — Full lineage tracking for every evidence object",
    ],
    outputs: ["Evidence[] (20-60 normalized objects per analysis)", "ConstraintCandidate[] (binding constraints with severity)", "Tier classifications (structural/system/optimization)", "Evidence provenance chain"],
    processingWeight: "high",
    edgeFunction: "analyze-products, scrape-products, patent-analysis, photo-analysis, scrape-url-autofill, scrape-market-news, scrape-trend-intel, scrape-patent-intel, geo-market-data, extract-business-intelligence, scout-competitors",
    description: "All raw signals from every pipeline step and 11 edge functions are normalized into canonical Evidence objects. Each evidence item carries tier, lens, archetype, mode, source, and confidence metadata. Evidence normalization itself is 100% deterministic custom logic.",
  },
  {
    id: "structural",
    number: 2,
    name: "Structural Diagnosis",
    shortName: "Diagnosis",
    subtitle: "Evidence → 10-dimension Structural Profile",
    icon: Layers,
    trigger: "Automatic — fires when evidence count ≥ 5 and at least 1 constraint detected",
    dataSources: [
      { name: "Evidence[] from Stage 1", type: "deterministic" },
      { name: "ConstraintCandidate[] from constraint detection", type: "deterministic" },
      { name: "User lens configuration (ETA fields)", type: "user_input" },
      { name: "Market signals (market_signals table)", type: "database" },
    ],
    aiUsage: null,
    lensImpact: "ETA lens activates 3 additional dimensions: Owner Dependency (autonomous→critical), Acquisition Complexity (turnkey→prohibitive), Improvement Runway (optimized→transformative). Total: 13 dimensions for ETA vs 10 base.",
    uniqueLogic: [
      "structuralProfile.ts — 333 lines of deterministic dimension inference",
      "10 core dimensions: Labor Intensity, Supply Fragmentation, Distribution Control, Margin Structure, Switching Costs, Asset Density, Regulatory Burden, Operational Complexity, Demand Predictability, Capital Intensity",
      "Each dimension inferred from evidence keyword matching + constraint analysis (zero AI)",
      "DiagnosisLensConfig system — pluggable lens configurations change how dimensions are weighted/inferred",
      "ETA-specific: Owner dependency inferred from 'owner', 'founder', 'key person' evidence signals",
      "marketStructureEngine.ts — Market structure overlay for dimension calibration",
      "lensWeighting.ts — Dynamic weight adjustment based on active lens profile",
      "lensAdaptationEngine.ts — Adapts structural dimensions to operator context",
    ],
    outputs: ["StructuralProfile (10-13 typed dimensions)", "Diagnosis metadata (confidence per dimension, evidence backing)", "Lens-adjusted weight vectors"],
    processingWeight: "low",
    edgeFunction: null,
    description: "100% deterministic. Reads the evidence dataset and infers qualitative values for each structural dimension using keyword matching and constraint analysis. No AI model is called. Entirely custom logic with pluggable lens system.",
  },
  {
    id: "pattern",
    number: 3,
    name: "Pattern Qualification",
    shortName: "Patterns",
    subtitle: "Structural Profile → Qualified Patterns (binary gates)",
    icon: Filter,
    trigger: "Automatic — fires immediately after Stage 2 completes",
    dataSources: [
      { name: "StructuralProfile from Stage 2", type: "deterministic" },
      { name: "6 Structural Patterns (hardcoded pattern library)", type: "deterministic" },
      { name: "Business analogs (business_analogs table)", type: "database" },
    ],
    aiUsage: null,
    lensImpact: "ETA lens applies additional acquisition-aware gates: patterns are filtered/boosted based on owner dependency (prefer 'delegatable'), acquisition complexity (prefer 'manageable'), and improvement runway (prefer 'significant'). Signal density ranking adjusted by etaAdjustment score.",
    uniqueLogic: [
      "patternLibrary.ts — 387 lines defining 6 core structural moves",
      "6 Patterns: Aggregation, Unbundling, Rebundling, Supply Chain Relocation, Stakeholder Monetization, Infrastructure Abstraction",
      "Each pattern has a binary qualification gate function (profile → qualifies/disqualified)",
      "patternQualification.ts — 174 lines of gate evaluation + signal density ranking",
      "Typically produces 1-2 qualified patterns from 6 candidates",
      "strategicPatternLibrary.ts — Extended strategic pattern definitions",
      "strategicPatternEngine.ts — Cross-references patterns against historical analogs",
      "analogEngine.ts — Matches structural profile to known business analog outcomes",
      "ETA gates: additional filtering based on acquisition-specific structural dimensions",
    ],
    outputs: ["QualifiedPattern[] (1-2 patterns, ranked by signal density)", "Qualification reasons and strength signals per pattern", "Analog matches with outcome data"],
    processingWeight: "low",
    edgeFunction: null,
    description: "100% deterministic. Evaluates each of 6 hardcoded structural innovation patterns against the diagnosed profile. Binary pass/fail gates — no probability scores, no AI. Pattern library, analog matching, and qualification logic are entirely custom strategic reasoning.",
  },
  {
    id: "deepening",
    number: 4,
    name: "AI-Powered Thesis Deepening",
    shortName: "AI Deepening",
    subtitle: "Qualified Patterns → Causal chains, economic mechanisms, first moves",
    icon: Brain,
    trigger: "Gated — requires ≥12 evidence items, ≥1 binding constraint, ≥1 qualified pattern. Falls back to deterministic templates if gate fails.",
    dataSources: [
      { name: "QualifiedPattern[] from Stage 3", type: "deterministic" },
      { name: "StructuralProfile from Stage 2", type: "deterministic" },
      { name: "Evidence[] summary (top 15 signals)", type: "deterministic" },
      { name: "ConstraintCandidate[] (binding constraints)", type: "deterministic" },
      { name: "Operator context (ETA: cash available, time horizon, skills, strategy)", type: "user_input" },
      { name: "Active lens configuration (user_lenses table)", type: "user_input" },
      { name: "Business analogs for grounding", type: "database" },
    ],
    aiUsage: {
      model: "Gemini 2.5 Pro (via deepen-thesis edge function)",
      purpose: "Generates business-specific causal chains, economic mechanisms, feasibility assessments, and first moves. Prompt includes structural profile, evidence summary, operator context, and 6 strategic reasoning lenses.",
      temperature: 0.4,
      unique: true,
    },
    lensImpact: "Operator context ($250K cash, 3yr horizon, tech-savvy, partnerships) is injected directly into the AI prompt as 'operator_profile'. The AI tailors its thesis, feasibility assessment, and first-move recommendation to the specific operator.",
    uniqueLogic: [
      "opportunityDeepening.ts — 822 lines of deepening logic + deterministic fallback",
      "AI Quality Gate: evCount ≥ 12, constraintCount ≥ 1, qualifiedPatternCount ≥ 1",
      "If gate fails → deterministic template-based deepening (zero AI cost)",
      "Structured output schema enforcement (CausalChain, EconomicMechanism, FeasibilityAssessment, FirstMove)",
      "6 strategic reasoning lenses embedded in system prompt (not separate engine calls)",
      "deepen-thesis edge function: ~400 lines including prompt construction, response parsing, fallback handling",
      "Context truncation to 12,000 chars to prevent token overflow",
      "Deterministic fallback: builds thesis from pattern templates + constraint descriptions",
      "hypothesisRanking.ts — Ranks competing hypotheses by evidence strength",
      "convergenceEngine.ts — Detects convergence across multiple deepening iterations",
      "secondOrderEngine.ts — Models second-order effects of strategic moves",
    ],
    outputs: [
      "DeepenedOpportunity[] (1-2 fully reasoned theses)",
      "Each contains: CausalChain, EconomicMechanism, FeasibilityAssessment, FirstMove",
      "Confidence scores derived from evidence density + qualification strength",
      "Second-order effect projections",
    ],
    processingWeight: "critical",
    edgeFunction: "deepen-thesis",
    description: "The crown jewel. AI generates business-specific strategic theses with full structural context. The prompt is heavily structured with structural profile, evidence summary, and operator context. 6 strategic reasoning lenses woven into system prompt. Temperature 0.4 for stable output. Deterministic fallback guarantees output even without AI.",
  },
  {
    id: "pipeline_steps",
    number: 5,
    name: "Pipeline Step Functions (Understand → Pitch)",
    shortName: "Pipeline Steps",
    subtitle: "8+ sequential edge functions generating raw analysis data",
    icon: GitBranch,
    trigger: "Sequential — orchestrated by usePipelineOrchestrator. Auto-triggers when analysis begins.",
    dataSources: [
      { name: "Selected product/service/business model", type: "user_input" },
      { name: "Adaptive context (user-provided constraints)", type: "user_input" },
      { name: "Prior step results (cascading)", type: "deterministic" },
      { name: "Governed data (reasoning synopsis, constraint map)", type: "deterministic" },
      { name: "Patent data (if available)", type: "edge_function" },
      { name: "Market intel data", type: "database" },
    ],
    aiUsage: {
      model: "Gemini 2.5 Flash (primary) → Gemini 2.5 Pro (fallback for complex schemas)",
      purpose: "Each step calls a dedicated edge function that uses AI to generate analysis artifacts. Flash-first for speed/cost, Pro fallback for complex reasoning.",
      temperature: 0.3,
      unique: false,
    },
    lensImpact: "Adaptive context from user lenses (user_lenses table) is passed to each edge function. ETA lens adds acquisition-specific prompting. Business mode activates business-model-analysis and analyze-business-structure functions.",
    uniqueLogic: [
      "usePipelineOrchestrator.ts — 255 lines orchestrating sequential execution",
      "Step 1 (Understand): first-principles-analysis — structural deconstruction",
      "Step 2 (Disrupt): first-principles-analysis (redesign mode) — with disruptContext + governedContext",
      "Step 3 (Stress Test): critical-validation — risk/vulnerability analysis",
      "Step 4 (Pitch): generate-pitch-deck — synthesis of all prior steps",
      "Business Mode: business-model-analysis — operational audit, revenue reinvention, disruption analysis",
      "Business Mode: analyze-business-structure — structural decomposition of business models",
      "Idea Generation: generate-flip-ideas — assumption-flipped product concepts with unit economics",
      "Concept Space: generate-concept-space — explores adjacent concept variants",
      "Opportunity Vectors: generate-opportunity-vectors — directional opportunity mapping",
      "Problem Framing: analyze-problem, generate-problem-statements — problem space decomposition",
      "Action Items: generate-action-items — AI-generated strategic to-do lists",
      "Visual Mockups: generate-product-visual — AI concept visualizations",
      "Each step: 180s timeout, error isolation (one step failing doesn't stop pipeline)",
      "Results saved to DB via merge_analysis_step RPC",
    ],
    outputs: [
      "disruptData — hidden assumptions, flipped logic, structural analysis",
      "redesignData — reimagined product/service concepts with scoring",
      "stressTestData — vulnerability assessment, risk signals",
      "pitchDeckData — synthesized pitch narrative (5-slide deck)",
      "businessModelData — operational audit, revenue models, disruption paths",
      "flippedIdeas — assumption-inverted product concepts with unit economics",
    ],
    processingWeight: "critical",
    edgeFunction: "first-principles-analysis, critical-validation, generate-pitch-deck, business-model-analysis, analyze-business-structure, generate-flip-ideas, generate-concept-space, generate-opportunity-vectors, analyze-problem, generate-problem-statements, generate-action-items, generate-product-visual",
    description: "The raw material generators. 12+ edge functions produce the analysis data that feeds into evidence extraction. Each uses AI for generation but orchestration, error handling, context cascading, governed reasoning, and data persistence are custom logic.",
  },
  {
    id: "intelligence",
    number: 6,
    name: "Strategic Intelligence Synthesis",
    shortName: "Synthesis",
    subtitle: "All data → Command Deck intelligence briefing",
    icon: Target,
    trigger: "Automatic — useAutoAnalysis recomputes whenever evidence dataset changes (debounced 2s)",
    dataSources: [
      { name: "Evidence[] (full normalized dataset)", type: "deterministic" },
      { name: "DeepenedOpportunity[] from Stage 4", type: "deterministic" },
      { name: "StructuralProfile from Stage 2", type: "deterministic" },
      { name: "QualifiedPattern[] from Stage 3", type: "deterministic" },
      { name: "Pipeline step data (disrupt, redesign, stress test, pitch)", type: "deterministic" },
      { name: "Tool scenario simulations (tool_scenarios table)", type: "database" },
      { name: "Concept evaluations (concept_evaluations table)", type: "database" },
      { name: "Market signals & opportunity zones", type: "database" },
      { name: "System intelligence cache", type: "deterministic" },
    ],
    aiUsage: null,
    lensImpact: "Active lenses determine which intelligence facets are highlighted. ETA lens surfaces acquisition-specific metrics (SDE, deal economics, owner risk). Business lens surfaces operational audit metrics.",
    uniqueLogic: [
      "strategicEngine.ts — Strategic insight generation, narrative synthesis",
      "systemIntelligence.ts — Cross-cutting intelligence aggregation",
      "insightGraph.ts — Graph construction for visual reasoning map (nodes + edges)",
      "insightGovernance.ts — Enforces insight quality: no filler, evidence-backed only",
      "insightProvenance.ts — Traces every insight back to source evidence",
      "insightLayer.ts — Layered insight composition for progressive disclosure",
      "scenarioComparisonEngine.ts — Side-by-side scenario evaluation and ranking",
      "scenarioLabEngine.ts — What-if scenario laboratory with parameter sweeps",
      "recomputeIntelligence.ts — Orchestrates full recomputation cycle",
      "commandDeckMetrics.ts — Computes all Command Deck card metrics",
      "modeIntelligence.ts — Mode-specific intelligence (product vs business vs ETA)",
      "convergenceEngine.ts — Detects when intelligence stabilizes across iterations",
      "visualStoryCompiler.ts — Compiles intelligence into visual narrative sequences",
      "All deterministic — no AI calls in synthesis layer",
    ],
    outputs: [
      "SystemIntelligence — cross-cutting strategic assessment",
      "InsightGraph — visual reasoning map (nodes + edges)",
      "StrategicNarrative — executive summary text",
      "ScenarioComparison — what-if scenario rankings",
      "Command Deck metrics and intelligence feed cards",
      "Mode-specific intelligence overlays",
    ],
    processingWeight: "medium",
    edgeFunction: null,
    description: "100% deterministic synthesis. Takes all pipeline outputs, evidence, and deepened theses and produces the final intelligence briefing. 14+ custom engines with zero AI calls. The Command Deck is entirely driven by deterministic computation.",
  },
  {
    id: "tools",
    number: 7,
    name: "Interactive Tools & AI Interrogation",
    shortName: "Tools",
    subtitle: "User-driven modeling + AI reasoning partner → Evidence feedback loop",
    icon: Settings,
    trigger: "Manual — user opens a tool from the lens toolkit, runs simulations, or starts an interrogation conversation",
    dataSources: [
      { name: "Analysis artifacts (disrupt, redesign, stress test data)", type: "deterministic" },
      { name: "User-provided simulation inputs", type: "user_input" },
      { name: "Saved scenarios (tool_scenarios table)", type: "database" },
      { name: "Market signals (market_signals table)", type: "database" },
      { name: "Interrogation conversation history", type: "database" },
      { name: "Concept evaluations & outcomes", type: "database" },
    ],
    aiUsage: {
      model: "Gemini 2.5 Flash (reasoning-interrogation) + Gemini 2.5 Pro (hypothesis-interrogation)",
      purpose: "AI reasoning partner for challenging assumptions, exploring alternatives, and suggesting revisions. Maintains conversation context with full analysis data injection.",
      temperature: 0.4,
      unique: true,
    },
    lensImpact: "ETA lens provides specialized tools: SBA Loan Calculator, Acquisition ROI Model, Cash Flow Quality Analyzer, Owner Transition Planner. Business lens provides operational modeling tools.",
    uniqueLogic: [
      "lensToolkitRegistry.ts — Tool registry mapping lenses to available tools",
      "scenarioEngine.ts — Converts saved scenarios into canonical Evidence objects",
      "financialModelingEngine.ts — Unit economics and deal modeling",
      "sensitivityEngine.ts — Parameter sensitivity analysis",
      "viabilityEngine.ts — Business viability scoring",
      "outcomeSimulatorEngine.ts — Monte Carlo-style outcome simulation",
      "temporalArbitrageEngine.ts — Time-based opportunity arbitrage modeling",
      "negativeSpaceEngine.ts — Identifies what's missing from the analysis",
      "toolReasoningEngine.ts — Reasoning chain construction for tool outputs",
      "reasoning-interrogation edge function — Streaming AI conversation with full analysis context",
      "hypothesis-interrogation edge function — Deep hypothesis challenge and revision suggestions",
      "generate-market-intel edge function — On-demand market intelligence synthesis",
      "bundle-deep-dive edge function — Deep-dive into specific insight bundles",
      "help-assistant edge function — Contextual help and guidance",
      "Each saved scenario generates evidence that feeds back into Stage 1",
      "Closed loop: Tool → Scenario → Evidence → Recompute → Updated Intelligence",
    ],
    outputs: [
      "ToolScenario — saved simulation results",
      "Simulation Evidence — canonical evidence objects from scenario results",
      "AI interrogation responses with revision suggestions",
      "Concept evaluations with TAM estimates and analog matching",
      "Automatic intelligence recomputation triggered",
    ],
    processingWeight: "medium",
    edgeFunction: "reasoning-interrogation, hypothesis-interrogation, generate-market-intel, bundle-deep-dive, help-assistant, compute-platform-intel",
    description: "User-facing modeling tools and AI reasoning partner creating a closed feedback loop. Saved scenarios and interrogation insights generate Evidence objects that flow back into Stage 1, triggering full recomputation. 8+ custom engines + 6 edge functions. The system gets smarter as users explore.",
  },
];

/* ── Processing weight colors ── */
const WEIGHT_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  low: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "Low CPU/AI" },
  medium: { bg: "bg-amber-500/10", text: "text-amber-400", label: "Medium" },
  high: { bg: "bg-orange-500/10", text: "text-orange-400", label: "High" },
  critical: { bg: "bg-red-500/10", text: "text-red-400", label: "Highest AI/Processing" },
};

const TYPE_COLORS: Record<string, string> = {
  user_input: "text-blue-400 bg-blue-500/10",
  edge_function: "text-violet-400 bg-violet-500/10",
  database: "text-amber-400 bg-amber-500/10",
  ai_model: "text-red-400 bg-red-500/10",
  deterministic: "text-cyan-400 bg-cyan-500/10",
  browser: "text-green-400 bg-green-500/10",
};

/* ════════════════════════════════════════════════════════════════
   HORIZONTAL PIPELINE FLOW DIAGRAM
   ════════════════════════════════════════════════════════════════ */

function HorizontalPipelineFlow() {
  const stageColors: Record<string, string> = {
    evidence: "border-orange-500/40 bg-orange-500/5",
    structural: "border-cyan-500/40 bg-cyan-500/5",
    pattern: "border-cyan-500/40 bg-cyan-500/5",
    deepening: "border-violet-500/40 bg-violet-500/5",
    pipeline_steps: "border-red-500/40 bg-red-500/5",
    intelligence: "border-amber-500/40 bg-amber-500/5",
    tools: "border-emerald-500/40 bg-emerald-500/5",
  };

  const stageTextColors: Record<string, string> = {
    evidence: "text-orange-400",
    structural: "text-cyan-400",
    pattern: "text-cyan-400",
    deepening: "text-violet-400",
    pipeline_steps: "text-red-400",
    intelligence: "text-amber-400",
    tools: "text-emerald-400",
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 mb-4 overflow-x-auto">
      <h3 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground mb-4">
        Pipeline Flow — Left to Right
      </h3>

      {/* Main horizontal flow */}
      <div className="flex items-stretch gap-0 min-w-[900px]">
        {STAGES.map((stage, i) => {
          const Icon = stage.icon;
          return (
            <React.Fragment key={stage.id}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.07 }}
                className={`flex flex-col items-center justify-start rounded-lg border-2 p-3 min-w-[120px] max-w-[140px] flex-1 ${stageColors[stage.id]}`}
              >
                <div className={`flex items-center justify-center w-8 h-8 rounded-lg mb-1.5 ${stageColors[stage.id]}`}>
                  <Icon size={16} className={stageTextColors[stage.id]} />
                </div>
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  S{stage.number}
                </span>
                <span className={`text-[10px] font-bold text-center mt-0.5 ${stageTextColors[stage.id]}`}>
                  {stage.shortName}
                </span>
                <div className="flex flex-col items-center gap-0.5 mt-1.5">
                  {stage.aiUsage ? (
                    <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-400">AI</span>
                  ) : (
                    <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-400">Det.</span>
                  )}
                  <span className="text-[8px] text-muted-foreground">{stage.dataSources.length} sources</span>
                </div>
              </motion.div>
              {i < STAGES.length - 1 && (
                <div className="flex items-center justify-center px-0.5 flex-shrink-0">
                  <ChevronRightIcon size={16} className="text-muted-foreground/40" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Feedback loop arrow */}
      <div className="flex items-center justify-center mt-3 min-w-[900px]">
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5">
          <RotateCcw size={12} className="text-primary" />
          <span className="text-[9px] font-bold text-primary uppercase tracking-wider">
            Stage 7 → Stage 1 feedback loop — saved scenarios generate new evidence → full recompute
          </span>
        </div>
      </div>

      {/* Data flow annotations */}
      <div className="grid grid-cols-7 gap-1 mt-3 min-w-[900px]">
        {STAGES.map(s => (
          <div key={s.id} className="text-center">
            <div className="text-[8px] text-muted-foreground leading-tight">
              {s.outputs[0]?.split("(")[0]?.trim() || "—"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   STAGE DETAIL CARD (always expanded)
   ════════════════════════════════════════════════════════════════ */

function StageCardExpanded({ stage }: { stage: StageConfig }) {
  const Icon = stage.icon;
  const weight = WEIGHT_STYLES[stage.processingWeight];

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-start gap-3 p-4 border-b border-border">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary flex-shrink-0 mt-0.5">
          <Icon size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
              Stage {stage.number}
            </span>
            <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${weight.bg} ${weight.text}`}>
              {weight.label}
            </span>
            {stage.aiUsage ? (
              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400">
                AI-Powered
              </span>
            ) : (
              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400">
                Deterministic
              </span>
            )}
          </div>
          <h3 className="text-sm font-bold text-foreground mt-1">{stage.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{stage.subtitle}</p>
        </div>
      </div>

      {/* Always-visible details */}
      <div className="px-4 pb-4 space-y-4 pt-3">
        <p className="text-xs text-foreground/80 leading-relaxed">{stage.description}</p>

        <div>
          <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-1.5">
            <Zap size={10} className="inline mr-1" />Trigger
          </h4>
          <p className="text-xs text-foreground/70">{stage.trigger}</p>
        </div>

        <div>
          <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-1.5">
            <Database size={10} className="inline mr-1" />Data Sources ({stage.dataSources.length})
          </h4>
          <div className="space-y-1">
            {stage.dataSources.map((ds, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className={`text-[9px] font-bold uppercase px-1 py-0.5 rounded flex-shrink-0 ${TYPE_COLORS[ds.type] || "text-muted-foreground"}`}>
                  {ds.type.replace("_", " ")}
                </span>
                <span className="text-foreground/70">{ds.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-1.5">
            <Brain size={10} className="inline mr-1" />AI Instrumentation
          </h4>
          {stage.aiUsage ? (
            <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-3 space-y-1.5">
              <div className="text-xs"><span className="font-bold text-violet-400">Model:</span> <span className="text-foreground/70">{stage.aiUsage.model}</span></div>
              <div className="text-xs"><span className="font-bold text-violet-400">Purpose:</span> <span className="text-foreground/70">{stage.aiUsage.purpose}</span></div>
              {stage.aiUsage.temperature !== undefined && (
                <div className="text-xs"><span className="font-bold text-violet-400">Temperature:</span> <span className="text-foreground/70">{stage.aiUsage.temperature}</span></div>
              )}
              <div className="text-xs">
                <span className="font-bold text-violet-400">Unique vs Generic LLM:</span>{" "}
                <span className="text-foreground/70">
                  {stage.aiUsage.unique
                    ? "Highly custom — structured prompts with domain-specific schema enforcement, business context injection, and deterministic fallbacks. Not a generic ChatGPT call."
                    : "Uses LLM for generation but with custom prompt engineering, structured output schemas, and fallback chains. More structured than generic chat but AI-dependent."}
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3">
              <p className="text-xs text-cyan-400 font-bold">No AI used — 100% deterministic logic</p>
              <p className="text-xs text-foreground/60 mt-1">Custom algorithms, pattern matching, and rule-based inference. Zero API costs, instant execution.</p>
            </div>
          )}
        </div>

        {stage.lensImpact && (
          <div>
            <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-1.5">
              <Filter size={10} className="inline mr-1" />Lens / Operator Context Impact
            </h4>
            <p className="text-xs text-foreground/70 leading-relaxed">{stage.lensImpact}</p>
          </div>
        )}

        <div>
          <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-1.5">
            <Cpu size={10} className="inline mr-1" />Unique / Custom Logic
          </h4>
          <ul className="space-y-1">
            {stage.uniqueLogic.map((item, i) => (
              <li key={i} className="text-xs text-foreground/70 flex items-start gap-1.5">
                <span className="text-primary mt-1 flex-shrink-0">•</span>
                <span className="font-mono text-[11px]">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {stage.edgeFunction && (
          <div>
            <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-1.5">
              <Zap size={10} className="inline mr-1" />Edge Functions
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {stage.edgeFunction.split(", ").map(fn => (
                <span key={fn} className="text-[10px] font-mono font-bold px-2 py-1 rounded bg-muted text-foreground/70 border border-border">
                  {fn}
                </span>
              ))}
            </div>
          </div>
        )}

        <div>
          <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-1.5">
            Outputs
          </h4>
          <ul className="space-y-0.5">
            {stage.outputs.map((o, i) => (
              <li key={i} className="text-xs text-foreground/70">→ {o}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ── Flow Arrow ── */
function FlowArrow({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center py-1">
      <div className="w-px h-4 bg-border" />
      {label && <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider my-1">{label}</span>}
      <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-border" />
    </div>
  );
}

/* ── Summary Stats ── */
function SummaryStats() {
  const stats = [
    { label: "Custom Code", value: "~5,000 lines", desc: "Deterministic logic (no AI)" },
    { label: "AI Stages", value: "2 of 7", desc: "Stage 4 (Deepening) + Stage 5 (Pipeline)" },
    { label: "Edge Functions", value: "48", desc: "Backend serverless functions" },
    { label: "Structural Patterns", value: "6", desc: "Hardcoded strategic moves" },
    { label: "Evidence Dimensions", value: "20+", desc: "Per canonical Evidence object" },
    { label: "Structural Dimensions", value: "10-13", desc: "10 base + 3 ETA-specific" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-6">
      {stats.map(s => (
        <div key={s.label} className="rounded-lg border border-border bg-card p-3 text-center">
          <div className="text-lg font-extrabold text-foreground">{s.value}</div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-primary mt-1">{s.label}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">{s.desc}</div>
        </div>
      ))}
    </div>
  );
}

/* ── Heatmap ── */
function ProcessingHeatmap() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 mb-4">
      <h3 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground mb-3">
        Processing & AI Consumption Heatmap
      </h3>
      <div className="space-y-2">
        {STAGES.map(s => {
          const widths: Record<string, string> = { low: "15%", medium: "35%", high: "65%", critical: "95%" };
          const colors: Record<string, string> = { low: "bg-emerald-500", medium: "bg-amber-500", high: "bg-orange-500", critical: "bg-red-500" };
          return (
            <div key={s.id} className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-muted-foreground w-28 flex-shrink-0 truncate">
                S{s.number} {s.shortName}
              </span>
              <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${colors[s.processingWeight]} transition-all`} style={{ width: widths[s.processingWeight] }} />
              </div>
              <span className="text-[9px] font-bold text-muted-foreground w-16 text-right">
                {s.aiUsage ? "AI" : "Determ."}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] text-muted-foreground mt-3">
        Most AI/processing: <strong className="text-red-400">Stage 4 (AI Deepening)</strong> and <strong className="text-red-400">Stage 5 (Pipeline)</strong>. 
        Stages 2, 3, 6, 7 are deterministic with zero AI cost.
      </p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   MAIN PAGE
   ════════════════════════════════════════════════════════════════ */

export default function PipelineArchitecturePage() {
  const navigate = useNavigate();
  useWorkspaceTheme();
  const contentRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = useCallback(async () => {
    if (!contentRef.current) return;
    toast.loading("Generating PDF…", { id: "arch-pdf" });
    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#0f1219",
        logging: false,
        windowWidth: 1200,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const usableW = pdfW - margin * 2;
      const imgW = canvas.width;
      const imgH = canvas.height;
      const ratio = usableW / imgW;
      const scaledH = imgH * ratio;
      const pageContentH = pdfH - margin * 2;

      let yOffset = 0;
      let page = 0;
      while (yOffset < scaledH) {
        if (page > 0) pdf.addPage();
        pdf.addImage(imgData, "PNG", margin, margin - yOffset, usableW, scaledH);
        yOffset += pageContentH;
        page++;
      }
      pdf.save("Pipeline-Architecture.pdf");
      toast.dismiss("arch-pdf");
      toast.success("PDF downloaded!");
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.dismiss("arch-pdf");
      toast.error("Failed to generate PDF");
    }
  }, []);

  return (
    <div className="flex-1 bg-background overflow-y-auto">
      {/* Sticky header with actions */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft size={16} className="text-foreground" />
          </button>
          <div>
            <h1 className="text-lg font-extrabold text-foreground">Pipeline Architecture</h1>
            <p className="text-xs text-muted-foreground">7-stage strategic reasoning pipeline</p>
          </div>
        </div>
        <button
          onClick={handleDownloadPDF}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <FileDown size={14} />
          Download PDF
        </button>
      </div>

      {/* PDF-capturable content */}
      <div ref={contentRef} className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        <SummaryStats />

        {/* Horizontal flow diagram */}
        <HorizontalPipelineFlow />

        <ProcessingHeatmap />

        {/* Legend */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground mb-2">Legend</h3>
          <div className="flex flex-wrap gap-3">
            {[
              { label: "User Input", color: "text-blue-400 bg-blue-500/10" },
              { label: "Edge Function", color: "text-violet-400 bg-violet-500/10" },
              { label: "Database", color: "text-amber-400 bg-amber-500/10" },
              { label: "Deterministic", color: "text-cyan-400 bg-cyan-500/10" },
              { label: "AI-Powered", color: "text-violet-400 bg-violet-500/10 border border-violet-500/20" },
              { label: "No AI (Custom Logic)", color: "text-cyan-400 bg-cyan-500/10 border border-cyan-500/20" },
            ].map(l => (
              <span key={l.label} className={`text-[9px] font-bold uppercase px-2 py-1 rounded ${l.color}`}>{l.label}</span>
            ))}
          </div>
        </div>

        {/* All stages — fully expanded */}
        <div className="space-y-0">
          {STAGES.map((stage, i) => (
            <React.Fragment key={stage.id}>
              <StageCardExpanded stage={stage} />
              {i < STAGES.length - 1 && (
                <FlowArrow label={
                  i === 0 ? "feeds into" :
                  i === 1 ? "qualifies" :
                  i === 2 ? "deepens" :
                  i === 3 ? "generates raw data" :
                  i === 4 ? "synthesizes" :
                  "feedback loop"
                } />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Feedback Loop */}
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 mt-4">
          <h3 className="text-sm font-extrabold text-primary mb-2">↻ Closed-Loop Intelligence</h3>
          <p className="text-xs text-foreground/70 leading-relaxed">
            The pipeline is not linear — it's a loop. Interactive simulation tools (Stage 7) generate Evidence objects that flow back to Stage 1, 
            triggering a full recomputation through Stages 2→3→4→6. Every user interaction with a modeling tool automatically refines the strategic thesis. 
            This closed-loop architecture means the system gets smarter as users explore scenarios.
          </p>
        </div>

        {/* Unique vs LLM */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground mb-3">Unique Custom Logic vs Generic LLM Usage</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-cyan-400">100% Custom / Unique</h4>
              <ul className="space-y-1 text-xs text-foreground/70">
                <li>• Evidence normalization & tier classification (~1,100 lines)</li>
                <li>• Structural profile diagnosis — 10-13 dimensions (~333 lines)</li>
                <li>• Pattern library — 6 hardcoded strategic moves (~387 lines)</li>
                <li>• Pattern qualification — binary gates (~174 lines)</li>
                <li>• Constraint detection engine</li>
                <li>• Friction engine</li>
                <li>• Intelligence synthesis & graph construction</li>
                <li>• Scenario → Evidence feedback loop</li>
                <li>• Pipeline orchestration & error isolation</li>
                <li>• ETA lens dimensions & acquisition gates</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-violet-400">AI-Assisted (Structured, Not Generic)</h4>
              <ul className="space-y-1 text-xs text-foreground/70">
                <li>• Thesis deepening — Gemini 2.5 Pro with full structural context</li>
                <li>• Pipeline step generation — Gemini Flash/Pro with structured schemas</li>
                <li>• Product analysis — structured parsing from user input</li>
                <li>• Patent analysis — structured extraction</li>
                <li>• Concept space generation — variant exploration</li>
                <li className="text-foreground/50 italic mt-2">All AI calls use: custom prompts, structured output schemas, temperature control, deterministic fallbacks, context truncation</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
