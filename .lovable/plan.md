

## Diagnosis: You're Correct — Reasoning & Hypotheses Are Outputs of First Principles

### What the code confirms

The `first-principles-analysis` edge function is the **sole producer** of:
- `root_hypotheses` (generated at line 615-628, ranked and validated)
- `reasoning_synopsis` (generated as part of the governed artifacts)
- `constraint_map`, `causal_chains`, `decision_synthesis`, etc.

These artifacts **do not exist** until the user clicks "Run Disrupt Analysis." The backfill function only exists for retroactively patching old analyses — it's not called in the normal flow.

### The problem with the current layout

Right now in `DisruptPage.tsx`, the Reasoning/Hypotheses tabs sit **above** the `FirstPrinciplesAnalysis` component (which contains the "Run" button). So the user sees empty tabs before they've even generated the data. This is backwards.

### Correct approach: Keep everything in Disrupt, but reorder

Creating a separate step is unnecessary because the data all comes from one edge function call. Instead:

1. **Move the Reasoning/Hypotheses tabs BELOW the FirstPrinciplesAnalysis component** — they only appear after data exists
2. **Show them only when `governedData` has been populated** (i.e., after the analysis runs)
3. **Make them prominent post-run** with clear explainers so users know to engage with them

### Plan

**Single file change: `src/pages/DisruptPage.tsx`**

- Move the entire Reasoning/Hypotheses tabbed section (the `(() => { ... })()` block with the tabs) from its current position (above `FirstPrinciplesAnalysis`) to **below** the `FirstPrinciplesAnalysis` card
- Keep the tabs, explainers, and all handler logic exactly as-is
- Add a brief intro heading above the tabs like "Review the AI's Strategic Reasoning" so it reads as a natural follow-up to the analysis results
- The tabs already check `hasSynopsis` and `hasHypotheses` before rendering, so they'll naturally hide until data exists

No new step, no new routes, no backend changes. Just moving a UI block down the page to match the actual data flow.

