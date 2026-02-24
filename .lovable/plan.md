

# Remove Start Analysis Buttons + Fix Spacing

## Changes

### 1. Remove both "Start Analysis" buttons

**`src/pages/DashboardPage.tsx`:**
- Line 198: Remove the `onStartAnalysis` prop from `<DisruptionPathBanner />` so it no longer renders its internal CTA button
- Lines 211-218: Delete the "Start Analysis" button block below "What to expect"
- The `handleStartAnalysis` function can also be removed since nothing references it anymore

### 2. Match spacing between sections

Currently the "What to expect" callout sits inside a `<div>` with `mt-4`. The pipeline banner above it has significant bottom padding (`py-10 sm:py-16`). Below "What to expect", the gray mode pills section starts immediately.

**Fix:** Increase the bottom margin on the "What to expect" container to create equal visual breathing room above and below it — changing from `mt-4` to `my-10 sm:my-16` so the gap below matches the gap from the pipeline banner above.

### Summary

| File | Change |
|---|---|
| `src/pages/DashboardPage.tsx` | Remove `onStartAnalysis` prop, delete "Start Analysis" button below callout, increase bottom spacing on "What to expect" container |

No other files need changes. The `DisruptionPathBanner` component already handles the missing prop gracefully (the CTA only renders when `onStartAnalysis` is provided).
