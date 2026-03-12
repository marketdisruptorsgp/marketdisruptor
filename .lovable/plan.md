

# Overview Page — Analysis Landing Tab

## What We're Building

A new **Overview** page that becomes the default landing page when users open an analysis (replacing Command Deck as the first thing they see). It sits above Command Deck in the Discovery sidebar section.

## Layout (Two-Column)

```text
┌─────────────────────────────┬─────────────────────────────┐
│  LEFT COLUMN                │  RIGHT COLUMN               │
│                             │                             │
│  ┌───────────────────────┐  │  ┌───────────────────────┐  │
│  │ PROBLEM STATEMENT     │  │  │ ANALYSIS OVERVIEW     │  │
│  │ (user's original      │  │  │ 2-3 sentence summary  │  │
│  │  input text)          │  │  │ from executiveSummary  │  │
│  └───────────────────────┘  │  │ or narrativeSummary   │  │
│                             │  └───────────────────────┘  │
│  ┌───────────────────────┐  │                             │
│  │ KEY CHALLENGES        │  │  ┌───────────────────────┐  │
│  │                       │  │  │ SWOT                  │  │
│  │ • Challenge 1 (high)  │  │  │ S: bullet, bullet     │  │
│  │   context line        │  │  │ W: bullet, bullet     │  │
│  │                       │  │  │ O: bullet, bullet     │  │
│  │ • Challenge 2 (high)  │  │  │ T: bullet, bullet     │  │
│  │   context line        │  │  │ (no filler, concise)  │  │
│  │                       │  │  └───────────────────────┘  │
│  │ • Challenge 3 (med)   │  │                             │
│  │   context line        │  │  ┌───────────────────────┐  │
│  └───────────────────────┘  │  │ TOP OPPORTUNITIES     │  │
│                             │  │ 1. Opp label + 1 line │  │
│                             │  │ 2. Opp label + 1 line │  │
│                             │  │ 3. Opp label + 1 line │  │
│                             │  │ 4. Opp label + 1 line │  │
│                             │  │ 5. Opp label + 1 line │  │
│                             │  └───────────────────────┘  │
└─────────────────────────────┴─────────────────────────────┘
```

## Data Sources (All Already Available)

| Section | Source |
|---|---|
| Problem Statement | `analysis.adaptiveContext?.problemStatement` |
| Key Challenges | `analysis.adaptiveContext?.selectedChallenges` (array with question, context, priority) |
| Analysis Overview | `narrative.executiveSummary` or `narrative.narrativeSummary` from `useAutoAnalysis()` |
| SWOT | Derived from `narrative` fields + `allEvidence` + `intelligence` — distilled into bullet points |
| Top Opportunities | `aggregateOpportunities()` from `commandDeckMetrics` (already used by Command Deck) |

## Implementation Steps

### 1. Create `src/pages/OverviewPage.tsx`
- Two-column responsive layout (stacks on mobile)
- Left: Problem Statement card + Challenges card
- Right: Analysis Overview card + SWOT card + Top Opportunities card
- Uses `useAnalysis()` for adaptiveContext, `useAutoAnalysis()` for narrative/opportunities
- Clean card-based design matching existing aesthetic
- Shows a "pipeline running" state if analysis isn't complete yet
- CTA button at bottom: "Go to Command Deck →"

### 2. Create `src/lib/swotExtractor.ts`
- Small utility that takes `narrative`, `evidence`, `intelligence` and extracts SWOT bullets
- Strengths from positive evidence signals + competitive advantages
- Weaknesses from constraints + friction points
- Opportunities from deepened opportunities (top labels)
- Threats from risk signals + competitive pressure
- Each bullet: max 8 words, no filler

### 3. Update `src/App.tsx`
- Add lazy import for `OverviewPage`
- Add route: `/analysis/:id/overview`
- Change `CommandDeckRedirect` to redirect to `/analysis/:id/overview` instead of `/analysis/:id/command-deck`

### 4. Update `src/components/layout/CommandNavigation.tsx`
- Add "Overview" as first item in `DISCOVERY_ITEMS` (above Command Deck)
- Icon: `ClipboardList` or `Eye` from lucide

