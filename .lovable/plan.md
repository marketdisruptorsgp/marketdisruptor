

## Problem

The Redesign step currently:
1. Shows an "Upstream data has changed" outdated banner that just nags — no auto-incorporation of user inputs
2. When regenerated, calls `first-principles-analysis` with only the raw product data — ignoring user scores, liked/dismissed insights, steering text, and pitch-deck-selected images from the Disrupt step
3. Doesn't auto-run — forces the user to manually click "Generate Redesign" even though all the input data is already available
4. Doesn't carry forward the images users liked in Flipped Ideas

## Plan

### 1. `src/components/FirstPrinciplesAnalysis.tsx` — Pass user context into redesign generation

In `runAnalysis()` (line 460), when `renderMode === "redesign"`, enrich the request body with:
- `analysisCtx.insightPreferences` (liked/dismissed assumptions & flips)
- `analysisCtx.userScores` (user-adjusted feasibility/desirability/etc scores on flipped ideas)
- `analysisCtx.steeringText` (free-text user guidance)
- `analysisCtx.disruptData` (the full disrupt output to ground the redesign)
- `analysisCtx.pitchDeckImages` (images user already selected)

### 2. `supabase/functions/first-principles-analysis/index.ts` — Accept and use enrichment data

- Accept new fields: `insightPreferences`, `userScores`, `steeringText`, `disruptContext`, `selectedImages`
- When these are present, add a new prompt section: "USER CURATION CONTEXT" that tells the AI which assumptions/flips the user liked, which they dismissed, what scores they adjusted, and their steering notes
- This ensures the redesigned concept reflects what the user actually agreed with

### 3. `src/pages/RedesignPage.tsx` — Auto-trigger redesign on arrival

- Remove the `OutdatedBanner` for redesign (it's not useful — redesign should just auto-run with latest context)
- When `isOutdated` is true OR `redesignData` is null, auto-trigger the analysis on mount
- Pass all user context props through to `FirstPrinciplesAnalysis`

### 4. `src/components/FirstPrinciplesAnalysis.tsx` — Show user-selected flipped idea images in redesign view

- In the redesign render section (line 625+), after the concept details, display any `pitchDeckImages` the user selected from flipped ideas as "Your Selected Concepts" — these carry forward visually

### 5. Redeploy `first-principles-analysis`

### Files to change
- `src/components/FirstPrinciplesAnalysis.tsx` — enrich runAnalysis body for redesign mode + show selected images
- `supabase/functions/first-principles-analysis/index.ts` — accept user curation context in prompt
- `src/pages/RedesignPage.tsx` — auto-trigger on arrival when outdated/empty, remove outdated banner

