

# System Logic Revision (Batch 1)

This revision applies system-layer consistency rules and mode-specific fixes across the entire pipeline (Product, Service, Business Model).

---

## 1. Patent Scan Execution -- Single Run, Cached (Mode-Specific)

**Current problem:** Patent scan runs inside `FirstPrinciplesAnalysis.runAnalysis()` (Disrupt step) every time, meaning it re-executes if user re-runs Disrupt, and could potentially run in downstream steps.

**Changes:**

- **`src/components/FirstPrinciplesAnalysis.tsx`**: Remove the `patent-analysis` call from `runAnalysis()`. Patent data already comes from the Intel step (ReportPage's Patent Intel tab). The Disrupt component should read patent data from `product.patentData` (already passed via props) and never trigger its own patent call.
- **`src/components/StepLoadingTracker.tsx`**: Remove "Patent Scan" task from `DISRUPT_TASKS` since it no longer runs in Disrupt.
- **`src/pages/ReportPage.tsx`**: Patent scan already runs here via PatentIntelligence component. No change needed -- this is the canonical location. Ensure patent results are cached in `product.patentData` and persisted to `saved_analyses`.
- **Guard in downstream steps**: Disrupt, Redesign, Stress Test, and Pitch must only reference `product.patentData` -- never invoke `patent-analysis` directly.

---

## 2. Redesign Generation -- Only in Redesign Step + Outdated Markers

**Current problem:** The Disrupt step's loading tracker shows a "Redesign Concept" task. The `first-principles-analysis` edge function generates `redesignedConcept` as part of its output, meaning the Redesign step displays pre-generated data from Disrupt rather than generating fresh content.

**Changes:**

- **`src/components/StepLoadingTracker.tsx`**: Remove "Redesign Concept" task from `DISRUPT_TASKS`. Replace with "Disrupt Concept" if needed, or remove entirely since the Disrupt step focuses on Assumptions, Flip Logic, and Ideas.
- **`supabase/functions/first-principles-analysis/index.ts`**: Keep `redesignedConcept` in the JSON output (it feeds the Redesign step), but rename the conceptual framing from "Redesign" to "Disrupt Concept" in the prompt so it doesn't overwrite Redesign. Alternatively, separate the redesign generation into its own edge function call triggered only from the Redesign step.
- **`src/pages/RedesignPage.tsx`**: Instead of passively displaying `disruptData.redesignedConcept`, add a dedicated "Generate Redesign" button that calls the edge function with the latest state (flipped ideas, user-modified scores, user context, updated assumptions). Store result separately as `redesignData` in AnalysisContext.
- **`src/contexts/AnalysisContext.tsx`**: Add `redesignData` / `setRedesignData` state. Add `outdatedSteps` state (`Set<string>`) tracking which steps need regeneration. When upstream data changes (disrupt data, scores, user steering), mark "redesign" and "pitch" as outdated.
- **Outdated indicator UI**: Add an "Outdated" badge component that appears on step cards in `StepNavigator` when a step is in the `outdatedSteps` set. Clicking it prompts regeneration.

---

## 3. Pitch Step -- Only in Pitch Step + Outdated Markers

**Current problem:** Pitch generates only when user clicks "Generate" in the Pitch step, which is correct. But it doesn't reference the latest Redesign output, user-adjusted scores, or stress test results.

**Changes:**

- **`supabase/functions/generate-pitch-deck/index.ts`**: Accept additional body parameters: `redesignData`, `stressTestData`, `userScores`, `disruptData`. Incorporate these into the prompt so the pitch reflects the full upstream chain.
- **`src/components/PitchDeck.tsx`**: Pass upstream data (redesign output, stress test output, user-adjusted scores) to the edge function call.
- **Outdated logic**: When Redesign regenerates, mark Pitch as "Outdated" in `outdatedSteps`. Show banner: "Upstream data changed -- regenerate to reflect latest analysis."

---

## 4. Scoring System -- User Override + Persistence + Reduced Optimism

**Current problem:** Scores are AI-generated but users have limited ability to adjust them. The FlippedIdeaCard shows scores but no user override. The Leverage/Challengeable text block adds noise.

**Changes:**

- **`src/components/FlippedIdeaCard.tsx`**: Add interactive score sliders (or +/- buttons) next to each score (Feasibility, Desirability, Profitability, Novelty). Display "AI: X | You: Y" when user modifies. Persist user scores to `analysis_data` via `saveStepData`.
- **`src/components/FirstPrinciplesAnalysis.tsx`**: Remove the "Habit / Challengeable / Leverage" text block from assumption cards. Keep only the reason badge (Tradition, Mfg, Cost, Physics, Habit) and the leverage score number.
- **Score persistence**: Store user-adjusted scores in `analysis_data.userScores` keyed by idea ID. On reload, restore user scores.
- **Downstream propagation**: When user modifies any score, mark Redesign and Pitch as "Outdated" in `outdatedSteps`.
- **AI scoring tone**: Update prompts in `first-principles-analysis`, `generate-pitch-deck`, and `critical-validation` to emphasize realistic scoring based on market signals, competitive density, and structural feasibility rather than optimistic defaults.

---

## 5. Global System Consistency -- Outdated Step Tracking

**New system-layer infrastructure:**

- **`src/contexts/AnalysisContext.tsx`**: Add `outdatedSteps: Set<string>` and `markStepOutdated(step)` / `clearStepOutdated(step)`. Triggers:
  - User modifies scores -> mark "redesign", "pitch" outdated
  - User modifies steering/context -> mark current step's downstream as outdated
  - Disrupt regenerates -> mark "redesign", "stressTest", "pitch" outdated
  - Redesign regenerates -> mark "pitch" outdated
  - Stress Test regenerates -> mark "pitch" outdated
- **`src/components/StepNavigator.tsx`**: Show a small amber "Outdated" dot/badge on steps that are in `outdatedSteps`.
- **Step pages (Redesign, StressTest, Pitch)**: Show a banner at top when step is outdated: "Upstream data has changed. Regenerate to reflect your latest inputs."
- **On regeneration**: Clear the step from `outdatedSteps` and persist the new data.

---

## Technical Summary

| Area | Files Changed | Type |
|---|---|---|
| Patent scan caching | `FirstPrinciplesAnalysis.tsx`, `StepLoadingTracker.tsx` | Mode-specific fix |
| Redesign isolation | `RedesignPage.tsx`, `AnalysisContext.tsx`, `first-principles-analysis/index.ts`, `StepLoadingTracker.tsx` | System + Mode |
| Pitch upstream refs | `PitchDeck.tsx`, `generate-pitch-deck/index.ts` | System + Mode |
| Score overrides | `FlippedIdeaCard.tsx`, `FirstPrinciplesAnalysis.tsx`, `AnalysisContext.tsx` | System layer |
| Outdated tracking | `AnalysisContext.tsx`, `StepNavigator.tsx`, `RedesignPage.tsx`, `StressTestPage.tsx`, `PitchPage.tsx` | System layer |
| Scoring tone | `first-principles-analysis/index.ts`, `generate-pitch-deck/index.ts`, `critical-validation/index.ts` | Mode layer |

**No new database tables needed.** All state persists in the existing `analysis_data` JSON column of `saved_analyses`.

**Post-implementation test flow:** Intel -> Disrupt -> Adjust scores -> Confirm Redesign "Outdated" -> Regenerate Redesign -> Confirm Pitch "Outdated" -> Regenerate Pitch -> Verify no stale data, no duplicate patent calls, scores persisted after reload.

