

# Implementation Plan: Graph as Reasoning Backbone

## Critical Bugs Found

### Bug 1: Async pipeline drops deepened opportunities from graph
**Line 877 of `strategicEngine.ts`**: The async path passes `undefined` as the 8th arg to `buildInsightGraph`, while the sync path (line 613) correctly passes `deepenedForGraph`. This means AI-powered theses never enter the graph when the async pipeline succeeds (which is the primary path).

### Bug 2: Strategic engine state never hydrated
`hydrateFromRow` reads `strategicProfile` but never reads `analysis_data.strategicEngine` (which contains structural profile, deepened opportunities, qualified patterns). On reload, the graph recomputes from scratch.

### Bug 3: Scenario nodes leak numeric scores
Line 386 of `insightGraph.ts`: `detail: \`Return ${sc.projectedReturn.toFixed(1)}% · Risk ${sc.riskScore.toFixed(1)}\``

### Bug 4: PatentIntelligence shows ScoreMeter with numeric /10 values
Lines 195-196 of `PatentIntelligence.tsx`.

---

## Phase 1: Refactor Graph Builder Signature

**File: `src/lib/insightGraph.ts`**

- Rename conceptual framing: update file header comment from "Evidence-First Architecture" to "Pipeline-Driven Reasoning Graph"
- Create a `PipelineOutput` interface consolidating all inputs
- Refactor `buildInsightGraph` to accept `PipelineOutput` instead of 8 positional args
- Keep `buildGraphFromEvidence` as internal but rename to `buildGraphFromPipeline`
- Strengthen Step 1e: treat `opportunityNodes < 2` as a **pipeline failure** that triggers mandatory synthesis from constraints, insights, deepened opportunities, AND generates a pathway node

## Phase 2: Fix Async Pipeline Graph Call

**File: `src/lib/strategicEngine.ts`**

- Line 877: Pass `deepenedForGraph` (built from `deepenedOpps`) instead of `undefined`
- Build the `deepenedForGraph` array in the async path (same as sync path around line 600-607)
- Update both sync and async callers to use the new `PipelineOutput` interface

## Phase 3: Strategic Engine Hydration

**File: `src/contexts/hydrateAnalysis.ts`**

- After existing hydration, read `ad.strategicEngine` and populate:
  - Structural profile (already partially done via `ad.strategicProfile`)
  - Deepened opportunities → store in a new context field or pass to graph builder on reload
- Add `strategicEngine` to the `internalKeys` set (line 168) so it's not misread as business analysis data

**File: `src/hooks/useAutoAnalysis.ts`**

- On hydration, check if `analysis_data.strategicEngine` exists with valid data before triggering a full recompute — skip recompute if persisted state is fresh

## Phase 4: Score Leak Cleanup

**File: `src/lib/insightGraph.ts`** (line 386)
- Replace scenario `detail` with qualitative text: `"Scenario: {strategicImpact}"` instead of `Return X% · Risk Y`

**File: `src/components/PatentIntelligence.tsx`** (lines 193-197)
- Replace `ScoreMeter` components with qualitative labels (Strong/Moderate/Limited clarity)

**Files: `OpportunityMap.tsx`, `MetricsStrip.tsx`, `StrategicSnapshot.tsx`, `StrategicSummaryStrip.tsx`**
- Replace all rendered numeric scores with qualitative labels from existing `scoreLabel()` utility
- Internal numeric values kept for layout/sorting — only strip from rendered text

## Phase 5: Pipeline Step UX

**Command Deck step card components**
- Replace "No data yet — Click Run" states with animated `PipelineProcessingState` showing what each step does:
  - Deconstruct: "Identifying structural constraints and hidden assumptions..."
  - Reimagine: "Exploring reconfiguration possibilities..."
  - Stress Test: "Testing strategic viability..."
  - Pitch: "Synthesizing opportunity articulation..."

---

## Summary

| Phase | Core Change | Files |
|-------|------------|-------|
| 1 | `PipelineOutput` interface + opportunity guarantee | `insightGraph.ts` |
| 2 | Fix async path dropping theses from graph | `strategicEngine.ts` |
| 3 | Hydrate strategic engine as first-class state | `hydrateAnalysis.ts`, `useAutoAnalysis.ts` |
| 4 | Strip all visible numeric scores | 6 component files |
| 5 | Processing states for pipeline steps | Step card components |

~200 lines changed across ~10 files. Phases are independent.

