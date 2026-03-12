

# Overview Page Redesign — Operator Briefing Style

## What Changes

Complete rewrite of `src/pages/OverviewPage.tsx` and `src/lib/swotExtractor.ts` to shift from generic consulting layout to a specific, actionable operator briefing.

## New Page Structure

```text
┌─────────────────────────────────────────────────────┐
│  YOUR SITUATION                                      │
│  1-2 sentence restatement of user's problem          │
└─────────────────────────────────────────────────────┘

┌──────────┬──────────┬──────────┐
│ KEY INSIGHT 1       │ KEY INSIGHT 2       │ KEY INSIGHT 3       │
│                     │                     │                     │
│ What was found      │ What was found      │ What was found      │
│                     │                     │                     │
│ Why it matters      │ Why it matters      │ Why it matters      │
│ (implication)       │ (implication)       │ (implication)       │
└──────────┴──────────┴──────────┘

┌──────────┬──────────┬──────────┐
│ STRENGTHS           │ WEAKNESSES          │ RISKS               │
│ • bullet            │ • bullet            │ • bullet            │
│ • bullet            │ • bullet            │ • bullet            │
└──────────┴──────────┴──────────┘

┌─────────────────────────────────────────────────────┐
│  TOP OPPORTUNITIES (2-3 cards)                       │
│  ┌─────────────────────────────────────────────┐    │
│  │ Title                                        │    │
│  │ Why it exists (from analysis)                │    │
│  │ What benefit the user could capture          │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  RECOMMENDED FOCUS                                   │
│  Single clear takeaway paragraph                     │
└─────────────────────────────────────────────────────┘

          [ Explore Full Analysis → ]
```

## Data Mapping

| Section | Data Source |
|---|---|
| Your Situation | `adaptiveContext.problemStatement` — displayed as-is |
| Key Insight 1 | `narrative.primaryConstraint` + `narrative.whyThisMatters` |
| Key Insight 2 | `narrative.keyDriver` (what) + derived implication |
| Key Insight 3 | `narrative.killQuestion` (what) + derived implication |
| Strengths | `narrative.keyDriver`, `narrative.leveragePoint`, `narrative.unlockPotential` |
| Weaknesses | `narrative.primaryConstraint`, `narrative.trappedValue` |
| Risks | `narrative.killQuestion`, `narrative.verdictRationale` |
| Top Opportunities | `aggregateOpportunities()` top 3 — label + source + firstMove |
| Recommended Focus | `narrative.strategicPathway` or `narrative.breakthroughOpportunity` combined with `narrative.strategicVerdict` |

## Implementation

### 1. Rewrite `src/pages/OverviewPage.tsx`
- Remove the two-column Problem/Challenges + SWOT layout
- Replace with 5 sequential sections as described above
- "Your Situation" = problem statement, plain text, no card chrome
- "Key Insights" = 3-column grid of cards, each with bold insight + "Why it matters" sub-text
- "Business Reality" = 3-column grid (Strengths / Weaknesses / Risks) replacing SWOT quadrant
- "Top Opportunities" = 2-3 stacked cards with title, explanation, impact
- "Recommended Focus" = single card with the strategic takeaway
- All text run through `humanizeLabel()` from existing `src/lib/humanize.ts`
- Keep existing data hooks (`useAnalysis`, `useAutoAnalysis`, `aggregateOpportunities`)
- Keep loading/skeleton states for when pipeline is still running

### 2. Update `src/lib/swotExtractor.ts`
- Rename to export `extractBusinessReality` returning `{ strengths, weaknesses, risks }` (3 columns, no "opportunities" — those get their own section)
- Keep the same truncation and data sources
- Threats → Risks rename

### 3. Extract Key Insights helper
- New function `extractKeyInsights(narrative)` that returns up to 3 `{ insight, whyItMatters }` objects
- Maps: constraint → insight about the main bottleneck, driver → insight about the core advantage, killQuestion → insight about the biggest risk
- Each insight is humanized and kept to 1-2 sentences max

### 4. Extract Recommended Focus helper
- `extractRecommendedFocus(narrative)` returns a single paragraph
- Combines `breakthroughOpportunity` + `strategicPathway` + `strategicVerdict` into one plain-language takeaway

No routing or navigation changes needed — same URL, same nav item.

