

## Plan: Pipeline Optimization — Split, Filter, Parallelize, Compress

This implements the highest-impact optimizations from the audit, targeting ~40-50% reduction in pipeline time and ~30% token savings without adding new AI calls.

### Changes (ordered by impact)

**1. Split `first-principles-analysis` into two edge functions**

Create `supabase/functions/transformation-engine/index.ts`:
- Receives: product, upstream intel, decomposition, adaptive context
- Produces: `hiddenAssumptions`, `flippedLogic`, `structuralTransformations`, `transformationClusters`, `viabilityGate` results, `coreReality`, `frictionDimensions`, `userWorkflow`, `smartTechAnalysis`, `currentStrengths`
- Also produces `governed` reasoning artifacts (domain_confirmation through constraint_map)
- Model: gemini-2.5-pro, max_tokens: 16000 (down from 24000)
- Reuses all shared utilities (modeEnforcement, reasoningFramework, governedSchema, structuredOutput, etc.)

Create `supabase/functions/concept-architecture/index.ts`:
- Receives: product, viable transformations (pre-filtered), winning cluster, governed context, decomposition
- Produces: `redesignedConcept`, `visualSpecs`, `actionPlans`, final governed artifacts (decision_synthesis)
- Model: gemini-2.5-pro, max_tokens: 8000
- Much smaller prompt — only concept generation instructions + the winning cluster context
- No duplicate schema for assumptions/flips/transformations

Keep `first-principles-analysis` as-is temporarily for backward compatibility (the `FirstPrinciplesAnalysis.tsx` component calls it directly for manual re-runs). Add a deprecation log.

Update `supabase/config.toml` with the two new functions.

**2. Update orchestrator pipeline sequence**

Modify `usePipelineOrchestrator.ts`:
- Step 0: `structural-decomposition` (unchanged)
- Step 1: `transformation-engine` (replaces `first-principles-analysis` for disrupt)
- Step 2: `concept-architecture` (replaces `first-principles-analysis` for redesign) — receives only viable transformations
- Steps 3+4: `critical-validation` + `generate-pitch-deck` run in **parallel** via `Promise.allSettled`

The viability gate enforcement already exists in the orchestrator (lines 201-220) — it filters transformations before passing to redesign. Now the concept-architecture function receives a much smaller payload.

**3. Parallelize stress test + pitch**

Change the sequential calls at lines 357-362 to:
```
const [stressSettled, pitchSettled] = await Promise.allSettled([
  runStressTest(product, extractedContext, disruptResult, redesignResult, decompResult),
  runPitch(product, extractedContext, disruptResult, redesignResult, null),
]);
```
If stress test finishes first and pitch hasn't started, pass stress data to pitch. Otherwise pitch runs without stress data (it already handles this gracefully).

**4. Make decomposition mandatory with retry**

Change `runDecompose` to retry once on failure before continuing. If both attempts fail, abort pipeline with a clear error message instead of silently degrading.

**5. Compress inter-stage payloads**

In `runDisrupt` and `runRedesign`, trim the product object before sending — strip large arrays (reviews beyond top 5, full supply chain lists beyond top 3) to reduce input tokens. Create a `compressProductPayload()` utility.

**6. Add early termination**

After transformation-engine returns, check if all transformations were filtered (all failed viability). If so, skip concept-architecture and show a "low disruption potential" message instead of wasting a Pro call.

### Files to create
- `supabase/functions/transformation-engine/index.ts` — extracted from first-principles-analysis (assumptions, flips, transformations, viability)
- `supabase/functions/concept-architecture/index.ts` — extracted from first-principles-analysis (concept generation only)

### Files to modify
- `supabase/config.toml` — add two new function entries
- `src/hooks/usePipelineOrchestrator.ts` — new pipeline sequence, parallel steps 3+4, mandatory decomposition, payload compression, early termination
- `src/components/FirstPrinciplesAnalysis.tsx` — update to call new functions for manual triggers
- `src/utils/pipelineValidation.ts` — add new step contracts

### Backward compatibility
- `first-principles-analysis` edge function remains deployed (used by `FirstPrinciplesAnalysis.tsx` for manual re-runs)
- All output schemas remain identical — `transformation-engine` + `concept-architecture` combined produce the same fields as the current single function
- `flippedLogic` array preserved alongside `structuralTransformations`
- No UI component changes needed — `FlippedLogicPanel`, `HiddenAssumptionsPanel`, `RedesignedConceptPanel` all receive the same data shapes

### Expected impact
- Pipeline time: ~4-6 min → ~2.5-3.5 min (parallel steps + smaller prompts + early termination)
- Token usage: ~150k → ~95-110k (split prompts + payload compression + viability filtering)
- Reliability: higher (each function has a focused prompt under 3000 tokens of schema)

