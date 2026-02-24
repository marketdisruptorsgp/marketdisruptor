
# Step-Level Picker — "Choose Your Analysis Depth"

## Overview
Allow users at Step 1 (input form) to select which analysis steps they want to run. Default is all 6 steps (full analysis). Users can uncheck steps they don't need, creating a shorter journey. This is a **step-level** picker (not section-level).

---

## Steps Available for Selection

| Step | Name | Skippable? | Notes |
|------|------|-----------|-------|
| 1 | Choose What to Disrupt | ❌ No | Always required — it's the input form |
| 2 | Intelligence Report | ❌ No | Foundation data needed by downstream steps |
| 3 | Disrupt | ✅ Yes | Assumptions + Flip the Logic |
| 4 | Redesign | ✅ Yes | Interactive concept illustrations |
| 5 | Stress Test | ✅ Yes | Red vs Green debate |
| 6 | Pitch Deck | ✅ Yes | Revival Score + investor slides |

Steps 1 & 2 are always included. Steps 3–6 can be toggled individually.

---

## UI Design

### Location
Add a collapsible "Customize Analysis" section at the bottom of the `AnalysisForm` (Step 1), below existing inputs but above the submit button.

### Layout
```
┌─────────────────────────────────────┐
│  ⚙ Customize Analysis Steps        │
│  ─────────────────────────────────  │
│  ☑ Intelligence Report (required)   │
│  ☑ Disrupt                          │
│  ☑ Redesign                         │
│  ☑ Stress Test                      │
│  ☑ Pitch Deck                       │
│                                     │
│  Uncheck steps you want to skip.    │
│  Skipped steps won't run AI models. │
└─────────────────────────────────────┘
```

Default: all checked. A "Quick Mode" preset button unchecks Stress Test + Pitch Deck.

---

## Data Model Changes

### AnalysisContext
Add a new field to the analysis context:
```typescript
selectedSteps: number[] // e.g., [1, 2, 3, 4, 5, 6] for full, [1, 2, 3, 4] for quick
```
This gets persisted to `saved_analyses.analysis_data.selectedSteps`.

### No DB migration needed
`selectedSteps` is stored inside the existing `analysis_data` JSONB column.

---

## Implementation Changes

### 1. `src/components/AnalysisForm.tsx`
- Add a collapsible "Customize Analysis Steps" panel with checkboxes for steps 3–6
- Add a "Quick Mode" preset button that unchecks steps 5 & 6
- Pass `selectedSteps` to the analysis context on submit

### 2. `src/contexts/AnalysisContext.tsx`
- Add `selectedSteps` to context state (default: `[1, 2, 3, 4, 5, 6]`)
- Persist to `analysis_data.selectedSteps` on save
- Restore from saved analysis on load

### 3. `src/lib/stepConfigs.ts`
- Filter step configs based on `selectedSteps`
- OR: add an `enabled` flag per step that the navigator respects

### 4. `src/components/StepNavigator.tsx`
- Skip disabled steps in navigation (next/prev buttons jump over them)
- Show disabled steps as grayed-out dots in `StepProgressDots`

### 5. `src/components/StepProgressDots.tsx`
- Render skipped steps as hollow/grayed dots
- Tooltip: "Skipped"

### 6. Edge function prompt fallbacks
- **Disrupt prompts** (first-principles-analysis): Already self-contained, no upstream dependency issues
- **Stress Test** (critical-validation): If Disrupt was skipped, use the raw Intelligence Report data instead of disrupt output. Add a fallback in the prompt: "No disrupt analysis available — stress test the original concept."
- **Pitch Deck** (generate-pitch-deck): If Stress Test was skipped, omit the debate section from the pitch. If Disrupt was skipped, pitch the original concept. Add conditional prompt sections.

### 7. Portfolio & Timeline
- `AnalysisTimeline` should only show steps that were selected, not mark skipped ones as incomplete
- `ProjectInsightCard` already handles missing pitchDeck gracefully
- `CompletionExperience` should trigger after the last selected step, not always after step 6

---

## Prompt Fallback Matrix

| Step Generating | If Step 3 (Disrupt) Skipped | If Step 5 (Stress Test) Skipped |
|----------------|---------------------------|-------------------------------|
| Stress Test | Use raw Intel Report data for stress testing | N/A |
| Pitch Deck | Pitch original concept, skip "disruption" narrative | Skip debate/validation slide |
| Completion | Show completion after last active step | Show completion after last active step |

---

## Effort Estimate

| Task | Effort |
|------|--------|
| UI (form + checkboxes) | Small |
| Context + persistence | Small |
| Step navigation filtering | Medium |
| Prompt fallbacks (3 edge functions) | Medium |
| Timeline/portfolio null handling | Small |
| Testing all combinations | Medium |

**Total: Medium effort** — ~2-3 focused sessions.

---

## Risk Mitigation

- Default to full analysis (all steps) so existing behavior is unchanged
- Skipped steps store `null` in `analysis_data` — all existing null checks already handle this
- "Quick Mode" preset reduces decision fatigue while still offering customization
- Edge function fallbacks should be tested with each skip combination

---

# Pitch Deck Visual Enhancement + Cover Slide

## Overview
Add subtle, professional design elements across all pitch slides (both on-screen presentation mode and PDF export) and introduce a Cover/Title slide as slide 1. The goal is to elevate the visual quality without breaking the institutional, typography-driven aesthetic.

---

## Design Elements Being Added

These are restrained, capital-markets-grade enhancements -- not decorative fluff:

1. **Cover/Title Slide (new slide 1)** -- Product name, AI-generated presentation title (from elevator pitch), date, "Confidential" label, and a subtle geometric accent (diagonal line or corner rule)
2. **Slide number accent bar** -- A thin 3px accent-colored strip at the very top of each slide (matches mode theme), giving visual rhythm without being loud
3. **Section divider line** -- A subtle horizontal rule between the header area and content on each slide, already partially there but will be refined with slightly more presence
4. **Corner geometric accent** -- A small right-angled geometric element (two thin lines forming an "L") in the bottom-right corner of every slide, adds a professional "designed" feel
5. **Headline quote marks** -- When a slide has a headline claim, render subtle oversized quotation marks as a typographic accent behind the text
6. **Slide category label** -- A small uppercase label in the header (e.g., "MARKET ANALYSIS", "FINANCIAL MODEL") that contextualizes the slide type
7. **Data callout visual upgrade** -- The existing data callout boxes get a left accent border instead of flat background, making them pop more

---

## File Changes

### A. `src/components/pitch/PitchSlideFrame.tsx` (MODIFIED)

- Add a 3px accent-colored top bar to the slide frame
- Add a subtle geometric corner accent (bottom-right "L" shape using CSS borders)
- Add an optional `categoryLabel` prop rendered as micro uppercase text in the header
- Upgrade the `SlideStatCard` with a subtle left accent border
- Add a `SlideQuoteAccent` component for headline slides

### B. `src/components/PitchDeck.tsx` (MODIFIED)

- Add a **Cover Slide** as the first element in the `allSlides` array for presentation mode
- The cover slide renders: product name, a subtitle derived from `data.elevatorPitch` (first sentence), the date, and "Confidential | Market Disruptor"
- Add `categoryLabel` props to each `makeSlide` call (e.g., "Market Analysis", "Financial Model", "Risk Assessment")
- Pass accent color through to `PitchSlideFrame`

### C. `src/components/pitch/PresentationMode.tsx` (MODIFIED)

- No structural changes needed -- it already renders whatever slides are passed to it. The cover slide will automatically appear as slide 1.

### D. `src/services/export/pdfGenerator.ts` (MODIFIED)

- **Cover page upgrade**: Add a geometric accent element (thin diagonal line), refine typography spacing, add the AI-generated title below the product name
- **All slide pages**: Add a thin accent-colored top bar, geometric corner accent (bottom-right), and category label in the header band
- **Data callout boxes**: Add a left accent border
- Update `formatPitchToSlides` call to also accept the elevator pitch for the cover title

### E. `src/services/export/pitchFormatter.ts` (MODIFIED)

- Add a `categoryLabel` field to the `SlideModel` interface
- Populate category labels for each slide (e.g., "Problem Discovery", "Market Sizing", "Financial Model")

---

## Cover Slide Content

On-screen (presentation mode) and PDF:

```text
--------------------------------------------
|  [3px accent bar]                         |
|                                           |
|  MARKET DISRUPTOR                         |
|  INVESTOR PITCH DECK                      |
|                                           |
|  [Product Name]                           |
|  [First sentence of elevator pitch]       |
|                                           |
|                                           |
|  February 24, 2026                        |
|  Confidential                             |
|                                    [L]    |
--------------------------------------------
```

The "[L]" is the geometric corner accent -- two thin lines forming an angular detail.

---

## Visual Before/After Summary

| Element | Before | After |
|---------|--------|-------|
| Top of slide | Nothing | 3px accent color bar |
| Header area | Title + subtitle only | Title + subtitle + category label |
| Content cards | Flat muted background | Left accent border on key callouts |
| Bottom corner | Empty | Subtle geometric "L" accent |
| Slide 1 | Problem slide | New Cover/Title slide |
| PDF cover | Purple block with name | Refined with geometric accent + AI title |

---

## Technical Notes

- The accent color is passed via the existing `accentColor` prop already threaded through the theme system
- Cover slide in presentation mode is prepended to the `allSlides` array, so `PresentationMode` handles it automatically
- PDF geometric elements use simple `doc.line()` calls -- no images or external assets needed
- Category labels are static strings mapped per slide ID, not AI-generated
- The cover slide's subtitle uses `data.elevatorPitch?.split(".")?.[0]` -- first sentence only, already available in the data
