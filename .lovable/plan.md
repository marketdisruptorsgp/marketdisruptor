

## Analysis Lens System — Implementation Plan

### Overview

Add a "Default / Custom Lens" system that modifies how AI evaluates, scores, and prioritizes results across all analysis modes. Lens data flows into edge function prompts as evaluation context — it does NOT re-scrape or re-collect data.

---

### Database Changes

**New table: `user_lenses`**

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, default gen_random_uuid() |
| user_id | uuid | NOT NULL |
| name | text | NOT NULL |
| primary_objective | text | |
| target_outcome | text | |
| risk_tolerance | text | e.g. "low", "medium", "high" |
| time_horizon | text | e.g. "3 months", "1 year", "5 years" |
| available_resources | text | |
| constraints | text | |
| evaluation_priorities | jsonb | e.g. {"feasibility": 0.4, "profitability": 0.3, ...} |
| is_default | boolean | default false |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

RLS: users CRUD their own lenses only (`auth.uid() = user_id`).

---

### Context & State (AnalysisContext.tsx)

Add to the context:
- `activeLens: UserLens | null` — the currently active custom lens (null = default)
- `setActiveLens(lens)` — toggle lens on/off
- Persist `activeLensId` into `analysis_data` blob via `saveStepData`
- Restore lens on `handleLoadSaved`

The lens is analysis-scoped: each saved analysis records which lens was active when steps were generated.

---

### UI Components

#### 1. Lens Toggle (new: `src/components/LensToggle.tsx`)
A compact toggle shown in the analysis header area (near ModeHeader actions slot):

```
Analysis Perspective
● Default (Explore possibilities)
○ Custom Lens (Tailor to my goals)
```

- Radio-style toggle between Default and Custom
- When Custom selected and no lenses exist → open Lens Creator
- When Custom selected and lenses exist → show dropdown to pick lens
- Small badge/indicator when custom lens is active
- Subtext: "Switch anytime. Results update instantly."

#### 2. Lens Creator/Editor (new: `src/components/LensEditor.tsx`)
A modal/sheet with form fields for all lens properties:
- Name, Primary Objective, Target Outcome
- Risk Tolerance (Low / Medium / High radio)
- Time Horizon (dropdown: 3 months, 6 months, 1 year, 3 years, 5+ years)
- Available Resources (text)
- Constraints (text)
- Evaluation Priorities (sliders or weighted checkboxes for feasibility, desirability, profitability, novelty)
- Save / Delete actions

#### 3. First-Time Prompt (new: `src/components/LensOnboarding.tsx`)
Shown once after first completed analysis (check localStorage flag):
> "Want results ranked for YOU? Add a custom lens to prioritize based on goals, risk, and resources."
> CTA: "Create Lens"

#### 4. Active Lens Indicator
When a custom lens is active, show a small pill badge on ModeHeader (e.g., "🔍 Custom Lens: Growth Focus") so users always know evaluation context.

---

### Integration Into Step Pages

Add `<LensToggle />` into the actions slot of `<ModeHeader />` on these pages:
- ReportPage (Step 2)
- DisruptPage (Step 3)
- RedesignPage (Step 4)
- StressTestPage (Step 5)
- PitchPage (Step 6)
- BusinessResultsPage

Switching lens marks downstream steps as outdated (using existing `markStepOutdated`) but does NOT re-scrape.

---

### Edge Function Integration

All generative edge functions that build evaluations will receive lens data in the request body:

**Request body addition:**
```json
{
  "lens": {
    "name": "Growth Focus",
    "primary_objective": "Maximize revenue growth",
    "risk_tolerance": "high",
    "time_horizon": "1 year",
    "evaluation_priorities": { "profitability": 0.4, "feasibility": 0.2, "desirability": 0.2, "novelty": 0.2 }
  }
}
```

**Prompt injection (appended to system or user prompt):**
```
EVALUATION LENS (Custom):
- Primary Objective: {objective}
- Risk Tolerance: {risk_tolerance}
- Time Horizon: {horizon}
- Priority Weights: feasibility={w1}, desirability={w2}, profitability={w3}, novelty={w4}
- Constraints: {constraints}

Adjust all scoring, rankings, recommendations, and risk interpretations according to these priorities.
When lens is active, favor actionable recommendations aligned with the stated objective over broad exploration.
```

When no lens is active (Default), no extra prompt is injected — existing behavior unchanged.

**Edge functions to update:**
- `analyze-products` — scoring & ranking
- `first-principles-analysis` — feasibility evaluation
- `generate-flip-ideas` — idea prioritization
- `critical-validation` — stress test weighting
- `generate-pitch-deck` — narrative framing
- `business-model-analysis` — strategic recommendations

---

### Persistence & Data Flow

1. Lenses saved to `user_lenses` table (account-level, reusable across analyses)
2. Active lens ID persisted per analysis in `analysis_data.activeLensId`
3. When regenerating a step with a lens active, the lens data is sent to the edge function
4. Switching lens → `markStepOutdated` for all downstream steps → user re-generates with new lens context

---

### Files to Create
- `src/components/LensToggle.tsx`
- `src/components/LensEditor.tsx`
- `src/components/LensOnboarding.tsx`

### Files to Edit
- `src/contexts/AnalysisContext.tsx` — add activeLens state, persist/restore
- `src/components/ModeHeader.tsx` — show active lens indicator
- `src/pages/ReportPage.tsx` — add LensToggle in ModeHeader actions
- `src/pages/DisruptPage.tsx` — add LensToggle in ModeHeader actions
- `src/pages/RedesignPage.tsx` — add LensToggle in ModeHeader actions
- `src/pages/StressTestPage.tsx` — add LensToggle in ModeHeader actions
- `src/pages/PitchPage.tsx` — add LensToggle in ModeHeader actions
- `src/pages/BusinessResultsPage.tsx` — add LensToggle in ModeHeader actions
- `src/utils/pipelineValidation.ts` — add `activeLensId` to SYSTEM_KEYS
- `supabase/functions/analyze-products/index.ts` — accept & inject lens prompt
- `supabase/functions/first-principles-analysis/index.ts` — accept & inject lens prompt
- `supabase/functions/generate-flip-ideas/index.ts` — accept & inject lens prompt
- `supabase/functions/critical-validation/index.ts` — accept & inject lens prompt
- `supabase/functions/generate-pitch-deck/index.ts` — accept & inject lens prompt
- `supabase/functions/business-model-analysis/index.ts` — accept & inject lens prompt

### Database Migration
- Create `user_lenses` table with RLS policies

