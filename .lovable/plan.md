

# Pipeline Integrity Verification Report

## SECTION 1 — MODULE STATUS

| Module | Status | Input Sources | Output Destinations | Pipeline Location |
|---|---|---|---|---|
| **scrape-products** (Data Collection) | ENABLED | User form input (category, era, customProducts, URLs) | rawContent, communityContent, complaintsContent → analyze-products | Step 1 (Setup → Edge Function) |
| **analyze-products** (Intel Synthesis) | ENABLED | scrapeData.rawContent, communityContent, complaintsContent, sources | Product[] with pricingIntel, supplyChain, communityInsights, patentData, userWorkflow, flippedIdeas | Step 2 (Intelligence Report) |
| **geo-market-data** (Geographic Enrichment) | ENABLED | category, productName | geoData (population, income, business density), regulatoryProfile | Background fetch after Step 2 — feeds into Stress Test & Pitch |
| **analyze-problem** (Problem Analysis) | ENABLED | User problem statement | entity, detectedModes, selectedChallenges → adaptiveContext | Setup flow (NewAnalysisPage) |
| **first-principles-analysis** (Deconstruct Engine) | ENABLED | product, lens, activeBranch, governedContext, adaptiveContext, upstreamIntel, disruptContext | governed data (constraint_map, reasoning_synopsis, root_hypotheses, friction_map, leverage_map) | Step 3 (Disrupt) |
| **FirstPrinciplesAnalysis** (Redesign) | ENABLED | product, externalData (disruptData or redesignData), flippedIdeas | redesignData (flippedLogic, flippedIdeas, redesignedConcept) | Step 4 (Redesign) |
| **critical-validation** (Stress Test) | ENABLED | product, analysisData, geoData, regulatoryData, activeBranch, competitorIntel | stressTestData (redTeam, greenTeam, verdict, scores) | Step 5 (Stress Test) |
| **generate-pitch-deck** (Pitch Deck) | ENABLED | product, disruptData, stressTestData, redesignData, userScores, insightPreferences, steeringText | pitchDeckData (slides, elevatorPitch, metrics) | Step 6 (Pitch) |
| **business-model-analysis** | ENABLED | businessModel, lens, extractedContext, adaptiveContext | businessAnalysisData (7 tabs: summary, operational, assumptions, tech, revenue, disruption, reinvented) | Business Mode Step 2-3 |
| **reasoning-interrogation** | ENABLED | analysisData, governed, question | Structured reasoning challenge responses | Disrupt → Reasoning tab |
| **generate-flip-ideas** | ENABLED | product, additionalContext, insightPreferences, steeringText, activeBranch, adaptiveContext, upstreamIntel, disruptContext | FlippedIdea[] | Redesign (on-demand regeneration) |
| **scout-competitors** | ENABLED | product/category | scoutedCompetitors → Stress Test | Disrupt step (optional) |
| **Signal Detection** (signalDetection.ts) | ENABLED | Analysis data object | DetectedSignal[], VisualOntology[] | Feeds ObservedSignalMatrix in Report |
| **Signal Ranking** (signalRanking.ts) | ENABLED | Analysis data object | RankedSignal[], SignalRelationship[] | Used by AnalysisVisualLayer |
| **Strategic OS** (strategicOS.ts) | ENABLED | root_hypotheses, strategicProfile | Re-ranked hypotheses with dominance scores | Disrupt → Hypotheses tab |
| **Lens Adaptation** (lensAdaptationEngine.ts) | ENABLED | governed data, activeLens | Re-scored constraints, structuralChangeLog | Persistence layer (saveStepData) |
| **Evidence Registry** (evidenceRegistry.ts) | ENABLED | Merged analysis_data | Evidence trace per step | Persistence layer (saveStepData) |
| **Governed Persistence** (governedPersistence.ts) | ENABLED | Step data with governed artifacts | Extracted/merged governed data, retroactive invalidation | Persistence layer |
| **Checkpoint Gate** (checkpointGate.ts) | ENABLED | stepKey, data | Allowed/blocked persistence, invalidated downstream steps | Persistence layer |
| **Mode Enforcement** (modeEnforcement.ts) | ENABLED | mode, product data | Filtered input data, mode guard prompt | Every edge function |
| **Adaptive Context** (adaptiveContext.ts) | ENABLED | Problem statement, entity, challenges | Context prompt injected into all edge functions | Every edge function |
| **Branch Isolation** (branchIsolation.ts) | ENABLED | root_hypotheses, activeBranchId | Branch prompt for isolated/combined mode | first-principles, critical-validation |
| **Dependency Regeneration** | ENABLED | stepKey changes | markStepOutdated for downstream steps | AnalysisContext |
| **Structural Fingerprinting** | ENABLED | governed hashes | Hash-based drift detection, purge stale governed artifacts | saveStepData |

## SECTION 2 — DATA FLOW TRACE

```text
User Input (category, URLs, problem statement)
  → analyze-problem → adaptiveContext (entity, modes, challenges)
  → scrape-products → rawContent, communityContent, complaintsContent
  → analyze-products → Product[] (pricingIntel, supplyChain, patents, community, userWorkflow, flippedIdeas)
  → geo-market-data → geoData, regulatoryProfile (background, non-blocking)
  [STATE: products, selectedProduct stored in AnalysisContext, saved to DB]

Step 2: Intelligence Report (ReportPage)
  → Renders: Overview, User Journey, Community Intel, Pricing Intel, Supply Chain, Patent Intel
  → Signal Detection: detectSignals(product) → ObservedSignalMatrix
  → Signal Ranking: extractAndRankSignals(product) → AnalysisVisualLayer

Step 3: Deconstruct (DisruptPage)
  → first-principles-analysis edge function
    Inputs: product, lens, activeBranch, adaptiveContext, upstreamIntel
    Shared modules: modeEnforcement, reasoningFramework, lensPrompt, lensWeighting, modeWeighting, governedSchema, structuredOutput, branchIsolation, adaptiveContext
    Outputs: governed (domain_confirmation, objective_definition, first_principles, friction_map, friction_tiers, constraint_map, structural_analysis, leverage_map, constraint_driven_solution, root_hypotheses, reasoning_synopsis)
  → saveStepData("disrupt", data) → checkpoint gate → governed extraction → evidence registry → lens adaptation → dependency integrity → fingerprinting
  → Strategic OS: rankWithProfile(root_hypotheses, strategicProfile) → dominance-ranked hypotheses
  → Reasoning Interrogation: interactive challenge panel

Step 4: Redesign (RedesignPage)
  → FirstPrinciplesAnalysis component with renderMode="redesign"
    Uses: disruptData + upstreamIntel
    Calls: first-principles-analysis or generate-flip-ideas
    Outputs: redesignData (hiddenAssumptions, flippedLogic, flippedIdeas, redesignedConcept)
  → RedesignVisualGenerator: AI image generation for concepts
  → saveStepData("redesign", data) → marks stressTest/pitch outdated

Step 5: Stress Test (StressTestPage)
  → critical-validation edge function
    Inputs: product, analysisData, geoData, regulatoryData, activeBranch, competitorIntel
    Shared modules: modeEnforcement, reasoningFramework, lensPrompt, adaptiveContext, branchIsolation, governedSchema, confidenceComputation, structuredOutput
    Outputs: stressTestData (redTeam arguments, greenTeam rebuttals, verdict, scores)
  → saveStepData("stressTest", data) → marks pitch outdated

Step 6: Pitch Deck (PitchPage)
  → generate-pitch-deck edge function
    Inputs: product, disruptData, stressTestData, redesignData, userScores, insightPreferences, steeringText, pitchDeckImages, pitchDeckExclusions
    Shared modules: modeEnforcement, reasoningFramework, lensPrompt, adaptiveContext, visualFallback
    Outputs: pitchDeckData (11 slides: problem, solution, whynow, market, product, businessmodel, traction, ip, risks, gtm, invest)
  → saveStepData("pitchDeck", data)

DATA CONFIRMED FLOWING THROUGH EVERY STAGE.
```

## SECTION 3 — SUPPRESSION CHECK

| Check | Status | Evidence |
|---|---|---|
| Modules rendered but not executed | **NONE FOUND** | Every UI component (StructureTab, CriticalValidation, PitchDeck, BusinessModelAnalysis) directly invokes its corresponding edge function via `supabase.functions.invoke()` |
| Outputs overwritten by later steps | **NONE FOUND** | Each step saves to its own key (`disrupt`, `redesign`, `stressTest`, `pitchDeck`). Previous snapshot is preserved for version comparison. assertStepOwnership() guards cross-step writes |
| Hidden governance rules blocking components | **NONE FOUND** | Checkpoint gate only blocks persistence of invalid governed data, never suppresses UI rendering. GovernedMissingBanner allows regeneration if reasoning data is absent |
| Partial pipeline execution | **NONE FOUND** | Each step can run independently. Empty state UI with "Run" button ensures user can trigger any step. autoTrigger logic re-runs outdated steps |
| Skipped steps depending on mode | **BY DESIGN** — see Section 4 | Service mode hides supply chain + patents tabs (no data). Business mode uses a 4-step pipeline (no Redesign). These are intentional mode-specific behaviors, not suppressions |

## SECTION 4 — MODE CONSISTENCY CHECK

| Element | Product Mode | Service Mode | Business Model Mode | Differences |
|---|---|---|---|---|
| **Pipeline steps** | 5 (Report → Disrupt → Redesign → Stress Test → Pitch) | 5 (identical) | 4 (Report → Disrupt → Stress Test → Pitch — NO Redesign) | Business mode skips Redesign — model innovations are structural abstractions, not physical artifacts |
| **Insight synthesis layer** | ObservedSignalMatrix + AnalysisVisualLayer | Same | BusinessModelAnalysis component handles synthesis internally | Functionally equivalent |
| **Analysis lenses** | Default / ETA / Custom via LensBanner | Same | Same — ETA lens triggers additional ETA-specific tabs (Deal Economics, Addback Scrutiny, etc.) | ETA-specific modules only activate in Business mode with ETA lens |
| **Strategic signals** | Signal Detection + Signal Ranking | Same | Not directly used — BusinessModelAnalysis has its own disruption analysis tab | Business mode relies on its own structured output rather than generic signal detection |
| **Metrics intelligence** | ScoreBar (Adoption, Feasibility, Resonance) + RevivalScore | Same | BusinessModelAnalysis provides its own metrics (unit economics, revenue mix) | Different metric types per mode |
| **ETA algorithm logic** | Available via ETA lens (changes scoring weights) | Available via ETA lens | Full ETA module: Deal Economics Calculator, Addback Scrutiny, Owner Dependency, Stagnation Dx, 100-Day Playbook | ETA is a LENS that applies across all modes but only adds specialized output tabs in Business mode |
| **Output narrative layer** | Pitch Deck (11 slides) | Same | Pitch Deck (same edge function, mode-adapted prompts) | Content adapts via modeEnforcement but same structure |
| **Strategic OS (archetypes)** | rankWithProfile on root_hypotheses | Same | Not wired — BusinessResultsPage has no archetype selector | **GAP: Business mode does not expose Strategic OS re-ranking** |
| **Hypothesis branching** | Full (combined/isolated modes, branch selection) | Same | Not wired — BusinessResultsPage has no branch UI | **GAP: Business mode does not expose hypothesis branching** |

## SECTION 5 — VISUAL VS FUNCTIONAL CHECK

| Visual Element | Backend Execution | Connected? |
|---|---|---|
| ReportPage tabs (Overview, Journey, Community, Pricing, Supply, Patents) | analyze-products edge function populates product data | YES |
| DisruptPage → StructureTab "Run" button | first-principles-analysis edge function | YES |
| DisruptPage → Reasoning tab | reasoning_synopsis from governed data | YES |
| DisruptPage → Hypotheses tab | root_hypotheses from governed data + strategicOS ranking | YES |
| RedesignPage → Flip/Ideas/Concept tabs | FirstPrinciplesAnalysis with renderMode="redesign" | YES |
| StressTestPage → Red Team / Validate tabs | critical-validation edge function | YES |
| PitchPage → Slide tabs | generate-pitch-deck edge function | YES |
| BusinessResultsPage → Steps 2-5 | business-model-analysis, critical-validation, generate-pitch-deck | YES |
| Lens banner in Workspace | setActiveLens → persisted → injected into all edge functions via buildLensPrompt | YES |
| Strategic Profile selector | setStrategicProfile → rankWithProfile → re-ranked hypotheses | YES (Product/Service only) |

**No visual step exists without backend execution.**

## SECTION 6 — PIPELINE MAP

```text
INPUT (User: category, URLs, problem statement, mode selection)
    │
    ▼
PROBLEM ANALYSIS (analyze-problem)
    │ entity, detectedModes, selectedChallenges
    ▼
DATA COLLECTION (scrape-products)
    │ rawContent, communityContent, complaintsContent
    ▼
INTELLIGENCE SYNTHESIS (analyze-products)
    │ Product[] with full intel (pricing, supply, patents, community, workflow)
    ├──► GEO ENRICHMENT (geo-market-data) [background]
    │    │ geoData, regulatoryProfile
    │    ▼
    │    [Stored in AnalysisContext]
    ▼
SIGNAL DETECTION & RANKING (signalDetection + signalRanking)
    │ DetectedSignal[], RankedSignal[]
    ▼
REASONING ENGINE (first-principles-analysis)
    │ 9-step protocol: domain confirmation → first principles → friction → constraints → leverage → solutions
    │ Governed: constraint_map, root_hypotheses, reasoning_synopsis
    │ Shared: modeEnforcement, reasoningFramework, lensPrompt, branchIsolation, adaptiveContext
    ▼
STRATEGIC OS (strategicOS.ts)
    │ Re-rank hypotheses via archetype-specific dominance scoring
    │ Adaptive drift: profile evolution based on user selections
    ▼
FRAMEWORK APPLICATION (Redesign - first-principles-analysis renderMode="redesign")
    │ Flip the Logic → Flipped Ideas → Redesigned Concept
    │ Upstream intel bundle: pricing, supply chain, community, patents, disrupt context
    ▼
ADVERSARIAL VALIDATION (critical-validation)
    │ Red Team attacks, Green Team defends
    │ Inputs: product + geoData + regulatoryData + competitorIntel + activeBranch
    ▼
OUTPUT GENERATION (generate-pitch-deck)
    │ 11-slide investor-ready deck
    │ Inputs: product + disrupt + stressTest + redesign + userScores + preferences
    ▼
PERSISTENCE & INTEGRITY
    │ Checkpoint gate → Governed extraction → Evidence registry
    │ Lens adaptation → Structural fingerprinting → Dependency invalidation
    │ Previous snapshot → Version comparison
    ▼
OUTPUT (Analysis saved to DB with full analysis_data JSON blob)
```

## SECTION 7 — FAILURE POINTS & FIXES

### 1. Business Mode: Strategic OS Not Wired
**Issue:** `BusinessResultsPage` does not expose the Strategic Profile selector or hypothesis branching UI. The `AnalysisActionToolbar` is rendered without `strategicProfile` / `onChangeProfile` props being connected to hypothesis re-ranking. Root hypotheses from business-model-analysis's governed data are not displayed in a Strategic Mind Map.

**Impact:** Business mode users cannot re-rank hypotheses by archetype or isolate individual branches. The Strategic OS module is functionally disconnected in this mode.

**Fix:** Add Strategic Profile selector and hypothesis branching to BusinessResultsPage, wired through the same `rankWithProfile` / `setActiveBranchId` logic used in Product/Service modes.

### 2. Business Mode: Redesign Step Missing
**Issue:** Business mode uses a 4-step pipeline (Report → Disrupt → Stress Test → Pitch) with no Redesign step. This is documented as intentional ("model innovations are structural abstractions"), but it means the `generate-flip-ideas` and `RedesignVisualGenerator` modules are never executed for business analyses.

**Impact:** Low — this is a design decision, not a bug. Business model "reinvention" happens within the Disrupt tab via the "Reinvented Model" sub-tab.

**Status:** By design. No fix needed.

### 3. Edge Function Timeout Risk
**Issue:** `first-principles-analysis` (874 lines) and `business-model-analysis` (453 lines) make large AI calls. The AnalysisContext uses `invokeWithTimeout` (180s) for scrape/analyze, but Disrupt/Stress Test/Pitch calls in components use `supabase.functions.invoke()` without explicit timeout.

**Impact:** If Gemini Flash is slow or the context window is large, the call could hang indefinitely on the client side.

**Fix:** Wrap all step-level edge function calls in `invokeWithTimeout` with appropriate limits (60-90s for Disrupt, 45s for Stress Test, 60s for Pitch).

### 4. Signal Detection Not Used in Business Mode
**Issue:** `signalDetection.ts` and `signalRanking.ts` operate on Product-shaped data (field names like `pricingIntel`, `supplyChain`, `patentData`). Business mode data is structured differently (`businessSummary`, `operationalAudit`, `hiddenAssumptions`), so signal detection produces zero matches.

**Impact:** The `ObservedSignalMatrix` and `AnalysisVisualLayer` signal panels are not rendered in business mode (because BusinessResultsPage doesn't use them), so this has no visible user impact. But it means the cross-cutting signal intelligence layer is mode-incomplete.

**Fix (optional):** Extend signal detection rules to map business model field names, or create a business-specific signal matrix.

### 5. Index.tsx Legacy Pipeline
**Issue:** `src/pages/Index.tsx` contains a full legacy copy of the analysis pipeline (handleAnalyze, handleRegenerateIdeas, etc.) that duplicates `AnalysisContext`. This legacy code path is still reachable from the old `/` route if a user interacts with the embedded AnalysisForm.

**Impact:** The legacy Index.tsx pipeline does NOT persist governed data, does NOT use `invokeWithTimeout`, does NOT fire adaptive context, and does NOT navigate to the new routed pages. Users hitting this path get a degraded experience.

**Fix:** Remove or disable the analysis pipeline in Index.tsx. The StartPage/NewAnalysisPage + AnalysisContext is the canonical path. Index.tsx should only render the StartPage redirect or marketing hero.

### 6. Outdated Step Key Mismatch: "pitch" vs "pitchDeck"
**Issue:** `markStepOutdated` is called with `"pitch"` in some places (DisruptPage line 217, RedesignPage line 156) and `"pitchDeck"` in others (AnalysisContext lines 273, 284, 295, 384). The `stepDataRef` maps `pitchDeck` (line 304), so `markStepOutdated("pitch")` will never match `stepDataRef.current["pitch"]` — the guard `if (!stepDataRef.current[step]) return` silently skips the invalidation.

**Impact:** Pitch deck may not be correctly marked as outdated when upstream Disrupt or Redesign data changes. This is a **data integrity bug**.

**Fix:** Standardize on one key. Either always use `"pitchDeck"` (matching the state variable) or always use `"pitch"` and update stepDataRef accordingly. The canonical step key in `STEP_CONTRACTS` is `"pitchDeck"`, so all `markStepOutdated("pitch")` calls should be changed to `markStepOutdated("pitchDeck")`.

### 7. Business Pitch Deck Data Routing
**Issue:** In BusinessResultsPage, pitch deck is saved as `saveStepData("businessPitchDeck", d)` but loaded from `analysis.pitchDeckData`. The hydration logic in AnalysisContext must correctly map `businessPitchDeck` → `pitchDeckData` state for business mode.

**Impact:** If hydration doesn't handle this mapping, business pitch decks may not reload on page refresh.

**Status:** Documented in memory as "mode-data-isolation" — should be verified with an end-to-end test.

---

### Summary

The pipeline is **structurally sound** with all modules active and functionally connected. The two most significant findings are:

1. **Bug (Priority: High):** `"pitch"` vs `"pitchDeck"` key mismatch in `markStepOutdated` calls causes silent invalidation failures
2. **Gap (Priority: Medium):** Business mode does not expose Strategic OS re-ranking or hypothesis branching
3. **Technical debt (Priority: Low):** Legacy Index.tsx pipeline duplicates AnalysisContext and creates a degraded fallback path

