

# 90-Second Pipeline Redesign

## The Core Problem

The current pipeline makes **5 sequential AI calls** (decompose → transform → concept → stress → pitch), each waiting for the previous one. Even with the recent split and parallelization of steps 4+5, the critical path is still 4 deep:

```text
CURRENT CRITICAL PATH (best case)
─────────────────────────────────
decompose (20-30s) → transform (40-60s) → concept (30-40s) → stress+pitch parallel (40-60s)
                                                              
Total critical path: ~130-190s (2-3 min on a good day, 4-6 on retries)
```

The biggest time sink isn't individual calls — it's **sequential dependency**. Each call waits for the previous, AND each call carries a massive prompt (the 273-line reasoning framework alone is ~2500 tokens, injected into every function).

## The 90-Second Architecture

### Principle: Two AI calls on the critical path, not five.

```text
90-SECOND PIPELINE
──────────────────

Phase 1: PARALLEL FOUNDATION (0-30s)
  ┌─ structural-decomposition (Flash, 20s)
  └─ pre-context assembly (local, instant — patent/trend/competitor signals)

Phase 2: UNIFIED STRATEGIC ENGINE (30-75s)
  └─ strategic-synthesis (Pro, 40-45s)
     Receives: decomposition + pre-context
     Produces: ALL of these in ONE call:
       • hiddenAssumptions
       • flippedLogic  
       • structuralTransformations + viability gates
       • transformationClusters
       • redesignedConcept (from best cluster)
       • red team / blue team (top 3 attack vectors only)
       • elevator pitch (3-sentence)
       • governed artifacts

Phase 3: PARALLEL ENRICHMENT (75-90s, non-blocking)
  ┌─ deep-validation (Flash, background — full stress test)
  └─ pitch-deck (Flash, background — full slide deck)
  UI renders Phase 2 results immediately.
  Phase 3 results stream in as they complete.
```

**Critical path: 2 AI calls. ~65-75 seconds.**

### Why This Works

**The key insight**: the current pipeline asks 5 separate AI calls to reason about the SAME system. Each call re-reads the product, re-reads the reasoning framework, re-discovers the constraints. The 273-line reasoning framework is sent 4 times (transform, concept, stress, pitch). That's ~10,000 wasted tokens on framework repetition alone.

A single Pro call with focused instructions can produce assumptions + transformations + concept + lightweight validation in ONE pass. The model already does this internally — the current pipeline just forces it to output fragments across multiple calls.

### What Changes

**1. Merge transformation-engine + concept-architecture into `strategic-synthesis`**

Instead of:
- Call 1: Generate assumptions, flips, transformations, clusters (16K max_tokens)
- Call 2: Take clusters → generate concept (8K max_tokens)

Do:
- Call 1: Generate ALL of the above in one pass (16K max_tokens — same budget, less overhead)

The concept-architecture function currently receives the viable transformations and clusters from the transformation-engine output. But there's no reason the model can't produce transformations AND the concept in one call — it already has the reasoning context loaded. The split only saves tokens if the viability gate eliminates most transformations, but in practice 60-80% pass.

**Prompt change**: Instead of "do NOT generate a redesignedConcept" (current transformation-engine instruction), remove that restriction. Add: "After clustering, generate a redesignedConcept from the highest-scoring cluster."

**Token savings**: Eliminates ~8K input tokens (no second system prompt, no re-sending product/decomposition/governed context to concept-architecture).

**2. Slim the reasoning framework for decomposition**

The `structural-decomposition` function currently does NOT use `reasoningFramework.ts` (it has its own focused prompt). Good — keep this.

But `strategic-synthesis` should use a **compressed** version of the reasoning framework. The current 273-line, ~2500-token framework includes sections that are redundant when decomposition is already done upstream:
- Steps 1-3 (Domain Confirmation, Objective Definition, First-Principles Decomposition) — already done by structural-decomposition
- Visual-First Representation Rule — doesn't affect reasoning quality
- Progressive Disclosure Model — UX concern, not reasoning concern
- Distillation Requirements — post-processing concern

A compressed framework (~800 tokens) keeping only Steps 4-9 + Anti-Default Safeguards + Scoring Calibration would cut input tokens by ~1700 per call.

**3. Embed lightweight stress test in strategic-synthesis**

Instead of a full critical-validation call (which produces red team, blue team, counter-examples, feasibility checklist, confidence scores, competitive landscape — much of which users rarely read), embed a lightweight validation in the synthesis:

```
"quickValidation": {
  "topThreats": [{ "threat": "...", "severity": "high|medium", "mitigation": "..." }],
  "feasibilityScore": 3.8,
  "keyRisk": "...",
  "confidenceLevel": "conditional"
}
```

The full stress test still runs as Phase 3 background enrichment for users who want depth.

**4. Parallelize Phase 3 enrichment (non-blocking)**

After Phase 2 completes and the UI renders, fire off `deep-validation` and `pitch-deck` in parallel. These use Flash (cheaper, faster) and their results appear as progressive enrichment — the stress test tab populates, the pitch deck tab populates, but the user isn't waiting for them.

The orchestrator change:

```typescript
// Phase 2 complete — render immediately
setDisruptData(synthesisResult);
setRedesignData(synthesisResult); // same object, concept included
onRecompute?.();

// Phase 3 — fire and forget (results stream in)
Promise.allSettled([
  runDeepValidation(product, synthesisResult, decompResult),
  runPitchDeck(product, synthesisResult),
]).then(([stress, pitch]) => {
  // Update UI as each completes
});
```

**5. Pre-context assembly (zero AI cost)**

Before decomposition, assemble all available signals into a compact context object:

```typescript
const preContext = {
  patents: product.patentData ? summarizePatents(product.patentData) : null,
  trends: product.trendAnalysis ? summarizeTrends(product.trendAnalysis) : null,
  competitors: product.competitorAnalysis ? top3Competitors(product.competitorAnalysis) : null,
  complaints: product.communityInsights?.topComplaints?.slice(0, 5) || [],
};
```

This is passed to both decomposition AND strategic-synthesis, replacing the current pattern of each function independently extracting and formatting upstream intel.

### Expected Performance

| Metric | Current | 90-Second Design |
|---|---|---|
| AI calls on critical path | 4 | 2 |
| Total AI calls | 5 | 4 (2 critical + 2 background) |
| Critical path time | 130-190s | 60-75s |
| Total pipeline time | 180-360s | 75-100s |
| Input tokens | ~150K | ~80-90K |
| Reasoning framework copies | 4× | 1× (compressed) |
| User sees first results at | ~120s | ~65s |

### Implementation Plan

**Step 1**: Create `supabase/functions/strategic-synthesis/index.ts`
- Merge transformation-engine prompt + concept-architecture prompt into one
- Use compressed reasoning framework (Steps 4-9 only)
- Add `quickValidation` to output schema
- Model: gemini-2.5-pro, max_tokens: 16000

**Step 2**: Create `src/lib/preContextAssembly.ts`
- `assemblePreContext(product)` — extracts and compresses patent/trend/competitor/complaint signals
- Used by orchestrator before any AI calls

**Step 3**: Create compressed reasoning framework
- `supabase/functions/_shared/reasoningFrameworkLite.ts`
- ~800 tokens vs current ~2500
- Keeps: friction discovery, constraint mapping, leverage, solution generation, anti-defaults, scoring
- Drops: domain confirmation (done by decomposition), visual rules, progressive disclosure, distillation

**Step 4**: Update `usePipelineOrchestrator.ts`
- Phase 1: `runDecompose()` (unchanged)
- Phase 2: `runStrategicSynthesis()` (replaces runDisrupt + runRedesign)
- Phase 3: `Promise.allSettled([runDeepValidation(), runPitchDeck()])` — non-blocking
- Set disrupt + redesign data from synthesis result
- Early termination if all transformations fail viability (skip Phase 3)

**Step 5**: Update `critical-validation` to use Flash instead of Pro
- It receives the full synthesis output including quick validation
- Its job becomes enrichment (full red/blue team, competitive landscape) not core reasoning
- Flash is sufficient for adversarial testing when grounded in synthesis output

**Step 6**: Backward compatibility
- `strategic-synthesis` output includes all fields that `transformation-engine` + `concept-architecture` currently produce
- `flippedLogic`, `hiddenAssumptions`, `structuralTransformations`, `transformationClusters`, `redesignedConcept` all present
- UI components unchanged — same data shapes
- Keep `transformation-engine` and `concept-architecture` deployed for manual re-runs via FirstPrinciplesAnalysis.tsx

### Risks and Mitigations

**Risk**: Single Pro call produces lower quality than two focused calls.
**Mitigation**: The current concept-architecture call is already lightweight (8K max_tokens, simple prompt). Merging it adds ~200 tokens of instruction to strategic-synthesis. The model has plenty of capacity in 16K output tokens.

**Risk**: Quick validation is shallow compared to full stress test.
**Mitigation**: Full stress test still runs as Phase 3. Quick validation gives users immediate signal; deep validation follows 15-20s later.

**Risk**: 16K output tokens may truncate for complex analyses.
**Mitigation**: The current transformation-engine already uses 16K and handles truncation with JSON repair. The merged output is similar size — concept generation adds ~1-2K tokens, quick validation adds ~500 tokens, but we remove the governed artifacts duplication (currently produced twice across two calls).

