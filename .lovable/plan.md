

## Plan: Auto-Detect Legacy Analysis Data and Prompt Re-Run

The old surfboard data will **always** show the old biased output because the AI results are saved as JSON blobs. We can't retroactively rewrite AI-generated text. The fix is to **detect legacy schema** when loading saved data and automatically flag those steps for regeneration.

### Approach

**1. Add legacy detection utility** (`src/utils/legacyDetection.ts`)
- Function `detectLegacySchema(analysisData)` that checks for:
  - `physicalDimensions` present but no `frictionDimensions` → legacy first-principles
  - `redditSentiment` present but no `communitySentiment` → legacy intel
  - `ebayAvgSold` present but no `resaleAvgSold` → legacy pricing
- Returns `{ isLegacy: boolean, legacySteps: string[] }`

**2. Auto-flag legacy steps as outdated on load** (`src/contexts/AnalysisContext.tsx`)
- In `handleLoadSaved`, after restoring data, call `detectLegacySchema(ad)`
- If legacy detected, automatically add affected steps to `outdatedSteps` set
- This triggers the existing `OutdatedBanner` component to show on those steps with "Regenerate" button

**3. Show a one-time toast on load** (`src/contexts/AnalysisContext.tsx`)
- When legacy data detected: `toast.info("This analysis used an older framework — regenerate steps to get improved insights")`

**4. Same logic in `Index.tsx` handleLoadSaved** — mirror the detection

### What this achieves
- Old projects auto-show the "Upstream data has changed" banner on legacy steps
- One click to regenerate with the new friction framework
- No data loss — old results remain visible until explicitly regenerated
- New analyses use the updated framework automatically

### Files to create
- `src/utils/legacyDetection.ts`

### Files to modify
- `src/contexts/AnalysisContext.tsx` — add legacy detection in `handleLoadSaved`
- `src/pages/Index.tsx` — same detection in its `handleLoadSaved`

