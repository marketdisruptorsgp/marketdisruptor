

# Analysis Memory, Structured Export & Pitch Deck Visual Upgrade

This plan covers three major feature areas across the platform. Given the scope, changes are organized into clear phases.

---

## Phase 1: Analysis Timeline & Evolution View

### New file: `src/components/analysis/AnalysisTimeline.tsx`

A chronological event feed built from `analysis_data` stored in `saved_analyses`.

- Reads the analysis_data JSON blob and extracts timestamps/presence of each step key (disrupt, redesign, stressTest, pitchDeck, userScores)
- Renders a vertical timeline with event cards: "Initial Analysis", "Disrupt Completed", "Redesign Generated", "Score Adjusted", "Pitch Generated"
- Uses existing `created_at` from saved_analyses + step presence as markers
- Color-coded by mode theme (Product blue, Service rose, Business violet)

### New file: `src/components/analysis/EvolutionView.tsx`

A horizontal pipeline visualization showing the progression:

```text
Original Idea --> Disrupt Concept --> Redesign --> Stress Test --> Pitch Outcome
```

- Each node shows a summary snippet extracted from the corresponding step data
- Connected with directional arrows
- Completed nodes are filled with mode accent color; pending nodes are muted
- Expandable: clicking a node shows a brief summary card

Both components will be added to the **Pitch step completion screen** (inside CompletionExperience) and to the **Portfolio page** as an expandable section on project cards.

---

## Phase 2: Version Comparison System

### New file: `src/components/analysis/VersionComparison.tsx`

- Compares the current analysis state with a previous version (if the project has been re-analyzed)
- Uses `analysis_data` to extract score sets, redesign outputs, and pitch revisions
- Displays side-by-side diff cards with highlighted changes:
  - Score deltas (up/down arrows with magnitude)
  - Redesign concept text diffs (bold changed sections)
  - Pitch section changes (highlight new vs old content)
- Since we store a single `analysis_data` blob (no version history in DB), comparison will work by storing a `previousSnapshot` key inside analysis_data when regeneration occurs

### Edit: `src/contexts/AnalysisContext.tsx`

- In `saveStepData`, before merging new data, save the previous value under `previousSnapshot.{stepKey}` if it already exists
- This creates a lightweight version trail without schema changes

---

## Phase 3: Steering Memory Service

### New file: `src/services/steeringMemory.ts`

A persistence service for user steering context:

- Stores: user context inputs, rationale notes, score adjustments
- Uses `analysis_data` blob -- saves under `steeringMemory` key
- Functions:
  - `saveSteeringContext(analysisId, stepKey, context)` -- persists to DB
  - `loadSteeringContext(analysisData, stepKey)` -- retrieves from loaded data
  - `getAllSteeringHistory(analysisData)` -- returns all steering inputs across steps
- Auto-loads when reopening analysis via `handleLoadSaved`

### Edit: `src/contexts/AnalysisContext.tsx`

- Add `steeringContext` state: `Record<string, string>`
- In `handleLoadSaved`, restore `steeringMemory` from analysis_data
- Expose `setSteeringContext(stepKey, text)` and `steeringContext` through context

### Edit: Steering panels across steps

- Pre-populate the SteeringPanel textarea with saved context when analysis is loaded from saved
- Affected files: `PitchDeck.tsx`, `StressTestPage.tsx`, `DisruptPage.tsx` (anywhere SteeringPanel or "Guide the AI" inputs exist)

---

## Phase 4: Resume Workflow Entry Point

### Edit: `src/contexts/AnalysisContext.tsx` -- `handleLoadSaved`

- After loading, determine the last completed step using `getCompletedSteps` from `StepProgressDots.tsx`
- Navigate to the next incomplete step (or pitch if all done)
- Show toast: "Resuming where you left off -- {Step Name}"

### Edit: `src/components/SavedAnalyses.tsx`

- Add a "Resume" badge next to the step progress dots showing the last active step name
- E.g., "Resume at Stress Test" in small text below the progress dots

---

## Phase 5: Structured Export System

### New file: `src/services/export/pitchFormatter.ts`

Converts PitchDeckData into a structured slide model:

```typescript
interface SlideModel {
  title: string;
  sections: Array<{
    heading: string;
    bullets: string[];
    evidenceTag?: string; // VERIFIED, MODELED, ASSUMPTION
    dataRef?: string;
  }>;
  metadata: { timestamp: string; platform: string };
}
```

- Maps each of the 12 pitch sections into this format
- Preserves confidence labels from the AI output
- Used as input for both PDF generation and shareable view

### New file: `src/services/export/pdfGenerator.ts`

An executive-grade PDF slide renderer:

- Uses jsPDF (already installed) with a standardized slide template
- Each "slide" is a full A4 page with:
  - Top header band: slide title + confidence indicator
  - Main content: headline claim + 3-5 bullets (max 12 words each)
  - Optional data panel: single key metric or visual
  - Footer: data source type, timestamp, "Market Disruptor | Confidential"
- Design system:
  - White background, neutral text, subtle gray dividers
  - Mode accent color used sparingly for section markers and data highlights
  - Generous whitespace, strict alignment
  - No decorative graphics or heavy gradients
- Replaces the current `downloadPitchDeckPDF` for the investor deck export

### New file: `src/services/export/opportunityBrief.ts`

Generates a 2-3 page opportunity brief PDF:

- Extracts from analysis_data: disruption thesis (from disrupt), risk profile (from stressTest), market opportunity (from pitchDeck), recommended actions (from gtmStrategy)
- Structured sections: Opportunity Summary, Disruption Thesis, Risk Profile, Recommended Next Actions, Confidence Summary
- Uses the same jsPDF template system from pdfGenerator

### New file: `src/components/export/ExportPanel.tsx`

Export UI accessible from the Pitch step:

- Three export options:
  1. "Investor Pitch PDF" -- calls new pdfGenerator
  2. "Opportunity Brief" -- calls opportunityBrief
  3. "Copy Shareable Link" -- uses existing ShareAnalysis logic
- Replaces the single PDF download button in PitchDeck header
- Styled as a dropdown panel with icons and descriptions

### Edit: `src/components/PitchDeck.tsx`

- Replace the PDF download button with ExportPanel component
- Wire up all three export actions

---

## Phase 6: Shareable Analysis View

### Edit: `src/App.tsx`

- Add route: `/analysis/share/:id`
- Maps to new ShareableAnalysisPage

### New file: `src/pages/ShareableAnalysisPage.tsx`

- Read-only view of a shared analysis
- Fetches analysis from `saved_analyses` by ID (requires public read or share token -- will use existing `share_token` column if present, otherwise fetch by ID with RLS bypass via edge function)
- Renders: Intelligence Summary, Redesign Concept, Stress Test Results, Decision Recommendation
- Professional, minimal layout suitable for external viewing
- No edit controls, no navigation to other steps

### New edge function: `supabase/functions/fetch-shared-analysis/index.ts`

- Accepts analysis ID and optional share token
- Returns the analysis data (products, analysis_data) in read-only format
- No auth required (public endpoint for shared links)

---

## Phase 7: Pitch Deck Visual Upgrade

### Edit: `src/components/PitchDeck.tsx`

Redesign all 12 slide sections to follow executive-grade visual standards:

- **Layout grid**: Each section gets a consistent structure -- header band, primary content area, optional data callout, footer metadata
- **Typography hierarchy**:
  - Slide title: text-lg font-bold, minimal wording
  - Headline claim: text-base font-semibold, prominent positioning
  - Body bullets: text-sm, max 5 bullets, max 12 words each
  - Metadata: text-[10px] text-muted-foreground
- **Color system**:
  - White/card background base
  - Mode accent used only for section markers, data highlights, confidence indicators
  - Confidence tags: Verified (neutral/dark), Modeled (muted accent), Assumption (subtle amber)
- **Data visualization**: Simple bar indicators for metrics, clean comparison tables for scenarios, minimal signal indicators
- **Visual hierarchy**: claim then evidence then implication -- headline readable in under 3 seconds
- **Whitespace**: Increased padding between sections, generous spacing within cards

### Edit: `src/lib/pdfExport.ts` -- `downloadPitchDeckPDF`

- Restructure to render one section per page (slide format)
- Each page follows the slide template: header, content, data panel, footer
- Consistent margins and typography scale
- Pixel-consistent spacing for stable PDF rendering
- Suitable for investor distribution, email sharing, presentation display

---

## Technical Summary

| Change | Files | Type |
|---|---|---|
| AnalysisTimeline | `src/components/analysis/AnalysisTimeline.tsx` | New |
| EvolutionView | `src/components/analysis/EvolutionView.tsx` | New |
| VersionComparison | `src/components/analysis/VersionComparison.tsx` | New |
| SteeringMemory service | `src/services/steeringMemory.ts` | New |
| PitchFormatter | `src/services/export/pitchFormatter.ts` | New |
| PDFGenerator | `src/services/export/pdfGenerator.ts` | New |
| OpportunityBrief | `src/services/export/opportunityBrief.ts` | New |
| ExportPanel | `src/components/export/ExportPanel.tsx` | New |
| ShareableAnalysisPage | `src/pages/ShareableAnalysisPage.tsx` | New |
| fetch-shared-analysis | `supabase/functions/fetch-shared-analysis/index.ts` | New |
| AnalysisContext | `src/contexts/AnalysisContext.tsx` | Edit |
| CompletionExperience | `src/components/CompletionExperience.tsx` | Edit |
| PitchDeck visual upgrade | `src/components/PitchDeck.tsx` | Edit |
| PDF export upgrade | `src/lib/pdfExport.ts` | Edit |
| SavedAnalyses resume | `src/components/SavedAnalyses.tsx` | Edit |
| App routes | `src/App.tsx` | Edit |

**No database schema changes. No new dependencies.** All changes use existing jsPDF, Recharts, and AnalysisContext patterns.

