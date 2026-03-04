

## Plan: Integrate Competitive Landscape Intelligence into Stress Test

### What Changes

The Stress Test currently runs Red/Green team debates without awareness of real competitors. This plan adds two capabilities:

1. **Pass competitor data into the stress test AI prompt** — any competitors already scouted during the Disrupt step (plus the product's existing competitor data) get injected into the `critical-validation` edge function so the AI can reference real businesses in its attacks/defenses.

2. **Add a new "Competitive Landscape" section to the Stress Test UI** — a dedicated panel (between the Red/Green arena and the existing Counter Examples) that shows a structured comparison of the original product vs. the redesigned concept against discovered competitors.

### Technical Approach

**1. Data Flow: Persist scouted competitors in analysis context**

- Add a `scoutedCompetitors` field to `AnalysisContext` (similar to how `stressTestData` or `geoData` are stored) so that competitors discovered on FlippedIdeaCard are available to downstream steps.
- When `CompetitorScoutPanel` successfully fetches competitors, bubble them up to the context via a callback.

**2. Edge Function: Enrich `critical-validation` prompt**

- Accept a new `competitorIntel` field in the request body containing scouted competitor profiles (name, url, strengths, weaknesses, differentiator_gap).
- Add a `COMPETITIVE INTELLIGENCE` section to the user prompt that lists each competitor with their profile data.
- Expand the JSON schema to include a new `competitiveLandscape` object:
```text
"competitiveLandscape": {
  "originalVsCompetitors": [
    { "competitor": "Name", "url": "...", 
      "originalAdvantage": "where original beats them",
      "originalVulnerability": "where they beat the original",
      "redesignAdvantage": "where redesign wins",
      "redesignGap": "remaining weakness vs this competitor" }
  ],
  "positioningRecommendation": "one-line positioning strategy",
  "pricingInsight": "competitive pricing takeaway",
  "biggestCompetitiveThreat": "name + why",
  "categoryDynamics": "is this winner-take-all, fragmented, or consolidating"
}
```

**3. UI: New "Competitive Landscape" panel in CriticalValidation**

- Add the `competitiveLandscape` field to the `ValidationData` interface.
- Render a new section on the "debate" tab (after the Red/Green arena, before Counter Examples) with:
  - A competitor comparison table/cards showing original vs. redesign against each competitor.
  - Positioning recommendation, pricing insight, and biggest threat highlighted.
  - Cherry-pick `PitchDeckToggle` on each competitor comparison.
- If no competitor data was provided (user didn't scout), show a subtle prompt: "Scout competitors in the Disrupt step for deeper competitive analysis here."

**4. Context wiring**

- In `FlippedIdeaCard` / `CompetitorScoutPanel`, call `analysis.setScoutedCompetitors(data)` when scouting completes.
- In `StressTestPage`, pass `scoutedCompetitors` through to `CriticalValidation`.
- `CriticalValidation.runValidation()` includes `competitorIntel: scoutedCompetitors` in the edge function body.

### Files to Change

| File | Change |
|------|--------|
| `src/contexts/AnalysisContext.tsx` | Add `scoutedCompetitors` state + setter + persistence |
| `src/components/FlippedIdeaCard.tsx` | Bubble scouted competitors to context |
| `supabase/functions/critical-validation/index.ts` | Accept `competitorIntel`, add to prompt, expand JSON schema |
| `src/components/CriticalValidation.tsx` | Add `competitiveLandscape` to interface, render new section with comparison cards |
| `src/pages/StressTestPage.tsx` | Pass `scoutedCompetitors` prop to CriticalValidation |

