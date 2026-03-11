# Yes this makes sense. We cannot have this take several minutes and cannot be much more expensive. 

&nbsp;

# System Architecture Review and Disruption Engine Evaluation

---

## PART 1 — CURRENT SYSTEM AUDIT

### 1.1 Pipeline Workflow — Current State

```text
CURRENT EXECUTION SEQUENCE (usePipelineOrchestrator.ts)
──────────────────────────────────────────────────────────

Step 0: Structural Decomposition (structural-decomposition)
   │  Extracts: primitives, system dynamics, leverage analysis
   │  Model: gemini-2.5-flash | Timeout: 120s | max_tokens: 8000
   │
Step 1: Disrupt / First-Principles Analysis (first-principles-analysis)
   │  Receives: product + decomposition + upstream intel
   │  Produces: assumptions, flipped logic, structural transformations,
   │            viability gates, transformation clusters, redesigned concept,
   │            governed reasoning artifacts
   │  Model: gemini-2.5-pro | Timeout: 180s | max_tokens: 24000
   │
Step 2: Redesign (first-principles-analysis — SAME function, second call)
   │  Receives: product + disrupt context + governed context + decomposition
   │  Produces: redesigned concept (curated version)
   │  Model: gemini-2.5-pro | Timeout: 180s
   │
Step 3: Stress Test (critical-validation)
   │  Receives: product + analysis data + decomposition
   │  Produces: red/blue team, counter-examples, feasibility, confidence,
   │            competitive landscape, governed validation
   │  Model: gemini-2.5-pro | Timeout: 180s
   │
Step 4: Pitch Synthesis (generate-pitch-deck)
   │  Receives: product + disrupt + stress test + redesign
   │  Produces: slides, elevator pitch, metrics
   │  Model: gemini-2.5-flash | Timeout: 180s

PARALLEL: Steps 3 and 4 are documented as parallel but currently run sequentially.
UPSTREAM: analyze-products runs BEFORE this pipeline (product scraping, intel gathering).
```

**Key Findings:**

- Steps 1 and 2 call the SAME edge function (`first-principles-analysis`). Step 2 is essentially a re-run with user curation context injected. This is architecturally fragile — the function serves dual purposes (initial analysis + curated redesign) using prompt conditionals rather than separate endpoints.
- Step 0 (decomposition) is non-blocking: if it fails, the pipeline continues without structural grounding, silently degrading downstream quality.
- There is no explicit "Constraint Mapping" stage — it's embedded inside the `reasoningFramework.ts` prompt as Steps 4-6 of an internal reasoning sequence. The AI performs this internally but the artifacts are buried in the `governed` output object, not surfaced as a first-class pipeline stage.

### 1.2 Edge Functions Audit


| Function                        | Purpose                                  | Model   | Inputs                                                                     | Outputs                                                          | Issues                                                                                                  |
| ------------------------------- | ---------------------------------------- | ------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `structural-decomposition`      | Extract primitives + dynamics + leverage | Flash   | product, upstream intel, adaptive context                                  | decomposition JSON                                               | Clean. Single responsibility.                                                                           |
| `first-principles-analysis`     | Disrupt + Redesign (dual purpose)        | Pro     | product, upstream intel, decomposition, curation context, governed context | assumptions, flips, transformations, clusters, concept, governed | **Overloaded**: 985 lines. Serves two distinct pipeline stages. Prompt is ~3000 tokens of schema alone. |
| `critical-validation`           | Stress test                              | Pro     | product, analysis data, decomposition                                      | red/blue team, feasibility, confidence, competitive landscape    | Well-scoped. Receives decomposition for grounding.                                                      |
| `generate-pitch-deck`           | Pitch synthesis                          | Flash   | product, disrupt, stress test, redesign                                    | slides, metrics, elevator pitch                                  | Does NOT receive decomposition or leverage data — pitch narrative is ungrounded.                        |
| `analyze-products`              | Product scraping + intel report          | Flash   | user input, category                                                       | product object with pricing/supply/community intel               | Upstream data source. 712 lines.                                                                        |
| `extract-business-intelligence` | Document/URL extraction                  | Various | files, URLs                                                                | structured BI signals                                            | Feeds adaptive context.                                                                                 |


**Duplicated Reasoning:**

- `reasoningFramework.ts` (273 lines) is injected into EVERY edge function. It contains a 9-step internal reasoning protocol. The structural decomposition function has its OWN decomposition mandate, which partially overlaps with Steps 3-6 of the reasoning framework. The AI receives conflicting decomposition instructions.
- `first-principles-analysis` asks for `structuralTransformations` AND `flippedLogic` — these are conceptually the same output in different formats, duplicating work.

**Missing Functions:**

- No dedicated "Leverage Discovery" function — it's embedded in `structural-decomposition`
- No "Transformation Clustering" function — it's embedded in `first-principles-analysis`
- No "Counterfactual System Simulation" — does not exist anywhere

### 1.3 Data Flow and Schema

**Pipeline Data Objects (saved to `saved_analyses.analysis_data` via `merge_analysis_step`):**

```text
analysis_data: {
  decomposition: { mode, primitives, systemDynamics, leverageAnalysis }
  disrupt: { hiddenAssumptions, flippedLogic, structuralTransformations,
             transformationClusters, redesignedConcept, governed, ... }
  redesign: { same schema as disrupt but curated }
  stressTest: { redTeam, blueTeam, counterExamples, feasibility,
                confidenceScores, competitiveLandscape, governed }
  pitchDeck: { slides, elevatorPitch, metrics }
  governed: { reasoning_synopsis, constraint_map, root_hypotheses, ... }
  products: [{ name, category, pricingIntel, supplyChain, ... }]
  biExtraction: { ... }
  adaptiveContext: { ... }
}
```

**Schema Inconsistencies:**

1. `structuralTransformations` types are defined in `structuralDecomposition.ts` but the data is PRODUCED by `first-principles-analysis`, not by `structural-decomposition`. The type definitions live in the wrong file.
2. `flippedLogic` and `structuralTransformations` coexist — the system generates both, but they represent the same conceptual output. `flippedLogic` is the legacy format kept for backward compatibility.
3. `governed` data is a large nested object produced by `first-principles-analysis` and `critical-validation`, but it's also independently persisted as a top-level key. Potential double-storage.
4. `decomposition` is saved as a step but also stored in context memory (`decompositionData`). Two sources of truth.

**Unused/Orphaned Fields:**

- `StructuralTransformation.filtered` — set by the AI but never used by the orchestrator to actually filter concepts before redesign. The viability gate exists in schema but is NOT enforced in code.
- `TransformationCluster.strategicPowerScore` — generated but never used downstream.

### 1.4 Data Sources


| Source              | Entry Point                     | Coverage                                    | Gap                                |
| ------------------- | ------------------------------- | ------------------------------------------- | ---------------------------------- |
| Product Scraping    | `analyze-products` → Firecrawl  | Pricing, supply chain, competitors, reviews | No refresh mechanism — stale data  |
| Document Extraction | `extract-business-intelligence` | PDFs, URLs, images                          | No patent extraction from docs     |
| Patent Intelligence | `patent-analysis`               | Patent landscape                            | Not threaded into decomposition    |
| Market Trends       | `scrape-trend-intel`            | Google Trends, growth signals               | Not injected into leverage scoring |
| Competitor Scouting | `scout-competitors`             | On-demand competitor deep dives             | Not auto-triggered in pipeline     |
| Geo Market Data     | `geo-market-data`               | US/global market sizing                     | Not connected to viability gate    |
| User Photos         | `photo-analysis`                | Product image analysis                      | Limited utility                    |


**Critical Gap:** Patent landscape and trend data are available but NOT injected into the `structural-decomposition` function. The leverage scoring operates without knowledge of patent expiration or market trends, missing temporal signals that dramatically affect challengeability scores.

### 1.5 Prompt Architecture

**Strengths:**

- `reasoningFramework.ts` enforces constraint-driven reasoning, anti-default safeguards, and scoring calibration — this is well-designed
- `modeEnforcement.ts` structurally blocks cross-mode contamination (product prompts can't produce service outputs)
- `governedSchema.ts` enforces checkpoint gates with structured validation

**Weaknesses:**

1. **Prompt size**: `first-principles-analysis` system prompt exceeds ~6000 tokens including schema, reasoning framework, mode guard, lens prompt, and branch isolation. This approaches the effective instruction-following limit for complex structured output.
2. **Reasoning redundancy**: The reasoning framework's internal Steps 3-6 (decomposition → friction → constraints) overlap with the upstream `structural-decomposition` function. The AI receives decomposition results AND is told to decompose again internally.
3. **Schema-as-prompt**: The JSON output schema is embedded as a string literal in prompts (400+ lines in `first-principles-analysis`). This is fragile — any schema change requires editing multiple prompt strings.
4. **Hallucination risk**: The prompt asks for `structuralTransformations` targeting specific `leveragePrimitives` by ID. If the AI hallucinates IDs that don't match the decomposition output, the linkage breaks silently.

### 1.6 UI Dependencies — Backward Compatibility Requirements


| Component                               | Required Fields                                                                                 | Risk                              |
| --------------------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------- |
| `FlippedLogicPanel`                     | `flippedLogic[]` with `originalAssumption`, `boldAlternative`, `rationale`, `physicalMechanism` | MUST keep `flippedLogic` format   |
| `FlippedIdeasPanel` + `FlippedIdeaCard` | `FlippedIdea` type from `mockProducts.ts`                                                       | Legacy type — needs mapping layer |
| `HiddenAssumptionsPanel`                | `hiddenAssumptions[]` with `leverageScore`, `urgencySignal`, `competitiveBlindSpot`             | Stable                            |
| `DecompositionViewer`                   | Full decomposition schema                                                                       | Already updated for leverage      |
| `PipelineDataHealth`                    | Tracks decomposition, dynamics, leverage, viability                                             | Already updated                   |
| `RedesignedConceptPanel`                | `redesignedConcept` object                                                                      | Must remain in disrupt output     |
| `CriticalValidation`                    | `redTeam`, `blueTeam`, `counterExamples`, `feasibilityChecklist`, `confidenceScores`            | Stable                            |


---

## PART 2 — ARCHITECTURE COMPARISON

### Current vs. Proposed

```text
PROPOSED FRAMEWORK                CURRENT ENGINE                 STATUS
────────────────────────────────────────────────────────────────────────
1.  Structural Decomposition    → structural-decomposition        ✅
2.  System Dynamics Mapping     → structural-decomposition        ✅
3.  Constraint Mapping          → reasoningFramework (internal)   ⚠️ Implicit
4.  Leverage Discovery          → structural-decomposition        ✅ (recently added)
5.  Transform Search Space      → ❌                              ❌ MISSING
6.  Structural Transformations  → first-principles-analysis       ✅ (recently added)
7.  Counterfactual Simulation   → ❌                              ❌ MISSING
8.  Viability Gate              → first-principles-analysis       ⚠️ SCHEMA ONLY (not enforced)
9.  Transform Clustering        → first-principles-analysis       ✅ (recently added)
10. Concept Architecture Gen    → first-principles-analysis       ✅ (redesignedConcept)
11. Critical Validation         → critical-validation             ✅
12. Strategic Recommendation    → generate-pitch-deck             ✅
```

**What integrates easily:** Stages 1-2, 4, 6, 9-12 are already implemented or easily mappable.

**What requires major restructuring:**

- **Stage 3 (Constraint Mapping)**: Currently buried in prompt instructions. Making this a first-class output requires extracting the `governed.constraint_map` as a standalone pipeline artifact and surfacing it in UI.
- **Stage 5 (Transform Search Space)**: Does not exist. Currently the AI generates transformations directly without first establishing the search space matrix. Adding this requires either a separate function call or structured pre-processing.
- **Stage 7 (Counterfactual Simulation)**: Does not exist anywhere. This is the largest gap — the system never asks "what happens to the rest of the system if we execute this transformation?"
- **Stage 8 (Viability Gate enforcement)**: The schema exists but `usePipelineOrchestrator.ts` never reads `filtered` flags or uses `compositeScore` to exclude transformations before passing to redesign.

---

## PART 3 — RISKS, BLIND SPOTS, AND CHALLENGES

### Architectural Risks

1. **Pipeline Latency**: Current pipeline takes ~4-6 minutes. Adding Transform Search Space + Counterfactual Simulation as separate AI calls would add ~2-3 minutes. Total pipeline exceeding 8 minutes risks user abandonment.
2. **Prompt Complexity Ceiling**: `first-principles-analysis` already pushes model limits with ~6000 tokens of instructions. Adding counterfactual simulation requirements to this prompt would likely cause output degradation. The function should be split.
3. **Token Cost**: Each analysis currently consumes ~100K input tokens + ~50K output tokens across all functions. Adding two more Pro-tier calls would increase cost ~40%.
4. **Model Reliability**: The AI frequently fails to generate valid `structuralTransformations` with correct primitive ID references. Silent ID mismatches mean the viability gate operates on orphaned data.

### Blind Spots in Proposed Framework

1. **No temporal dimension**: Leverage scores are static. A primitive with bindingStrength=9 today may become 3 in 12 months due to patent expiration or technology maturation. The system needs temporal decay on leverage scores.
2. **No user feedback integration into decomposition**: The decomposition is generated once and never updated. If the user corrects a constraint or adds domain knowledge, the decomposition remains stale.
3. **No cross-analysis learning**: Each analysis starts from zero. The system has 50+ edge functions and tables of patent/trend data but doesn't use historical analyses to improve decomposition accuracy for similar domains.
4. **Competitive intelligence gap**: `scout-competitors` runs on-demand but doesn't feed into the structural decomposition. A competitor's patent portfolio or pricing strategy could change leverage scores dramatically.

### Potential Challenges

1. **Counterfactual Simulation quality**: Asking an LLM to simulate "what happens to the system if we remove component X" requires deep domain knowledge. For physical products (plumbing, electronics), the model may hallucinate plausible-sounding but physically impossible system states.
2. **Transformation compatibility detection**: The proposed `conflictsWith` / `compatibleWith` arrays require the model to reason about pairwise interactions between 8-12 transformations — that's up to 66 pair comparisons. LLMs struggle with systematic combinatorial reasoning.
3. **Schema explosion**: The proposed framework adds ~15 new data structures. Every downstream consumer (UI components, pitch generation, stress test) must handle the presence or absence of these structures gracefully.

---

## PART 4 — RECOMMENDATIONS

### Recommended Architecture

Rather than adding 5 new edge function calls (which would double latency and cost), the improvements should be implemented as **enrichment layers within existing functions**:

```text
RECOMMENDED PIPELINE (6 calls, not 12)
─────────────────────────────────────────
1. structural-decomposition (ENRICHED)
   → Primitives + Dynamics + Constraints + Leverage + Dependency Graph
   → Add: temporal decay on leverage scores
   → Add: patent/trend data injection for grounding

2. first-principles-analysis (SPLIT into two)
   2a. transformation-engine (NEW)
       → Search space generation
       → Structural transformations (4 types × top 5 leverage primitives)
       → Viability gate (quantitative scoring)
       → Transformation clustering
       → Counterfactual snippets (lightweight, per-transformation)
   2b. concept-architecture (EXISTING redesign path)
       → Takes winning cluster → generates full concept
       → Receives viability-filtered transformations only

3. critical-validation (ENRICHED)
   → Receives transformation clusters + viability scores
   → Red team targets specific failure modes from decomposition
   → Competitive landscape enriched with decomposition control points

4. generate-pitch-deck (ENRICHED)
   → Receives leverage analysis for narrative grounding
   → Pitch story built around the dominant structural transformation
```

### Implementation Order (Safe Rollout)

1. **Enforce the viability gate in orchestrator code** (zero AI cost, immediate value). Read `structuralTransformations[].filtered` and exclude failed transformations before passing to redesign. This is a 10-line code change.
2. **Inject patent + trend data into structural-decomposition**. Already available in the product object — just pass it through. Improves leverage scoring quality with no new AI calls.
3. **Split `first-principles-analysis` into two functions**. This is the highest-value structural change. The current 985-line function is doing too much. Split into `transformation-engine` (search space + viability) and `concept-architecture` (concept from clusters).
4. **Add lightweight counterfactual fields to transformation output**. Instead of a full simulation, add `systemImpact: { valueFlowChanges, newBottleneck, cascadeEffects }` to each transformation. The AI generates these alongside the transformation itself — no extra call needed.
5. **Surface constraint mapping as first-class UI**. The `governed.constraint_map` already exists but is hidden. Add a "Constraints" sub-tab to DecompositionViewer showing binding constraints, causal chains, and counterfactual removal results.

### Backward Compatibility Safeguards

- Keep `flippedLogic` array in output (map from `structuralTransformations`) until all consuming UI components are migrated
- Keep `hiddenAssumptions` unchanged — these serve a different UI purpose (the assumptions explorer)
- Add new fields as optional — `structuralTransformations`, `transformationClusters`, `leverageAnalysis` should all be gracefully absent without breaking existing views
- Version the decomposition schema: add `schemaVersion: 2` to allow UI components to detect and handle both old and new formats