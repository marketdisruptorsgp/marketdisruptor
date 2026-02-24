

# Portfolio Action Items, Notes, and Pitch Persistence

## Overview
Three interconnected features: (1) a cross-project Action Items panel at the top of the Portfolio dashboard, (2) per-project Notes that persist with the analysis, and (3) saving investor pitch deck data so it shows in the portfolio and is accessible from project cards.

---

## 1. New Database Table: `portfolio_action_items`

A dedicated table for user-managed action items that span across all projects.

```text
portfolio_action_items
  id            uuid (PK, default gen_random_uuid())
  user_id       uuid (NOT NULL)
  analysis_id   uuid (nullable -- links to a project, optional)
  text          text (NOT NULL)
  notes         text (nullable)
  position      integer (NOT NULL, default 0)  -- for drag/reorder
  completed     boolean (NOT NULL, default false)
  created_at    timestamptz (default now())
  updated_at    timestamptz (default now())
```

RLS policies: full CRUD for `auth.uid() = user_id`.

This table is separate from `saved_analyses` because action items are portfolio-level (cross-project), not scoped to a single analysis.

---

## 2. Per-Project Notes (stored in `analysis_data` JSONB)

No schema change needed. Notes will be stored as `analysis_data.projectNotes` (a string) inside the existing `saved_analyses` row. This follows the same pattern used by `steeringMemory`, `userScores`, and other step-level data.

- Saved via the existing `saveStepData("projectNotes", text)` pattern
- Loaded in `handleLoadSaved` alongside other step data
- Editable from both the Portfolio project card (inline) and the Report/analysis pages

---

## 3. Pitch Deck Persistence in Portfolio

Pitch deck data is already saved as `analysis_data.pitchDeck`. The portfolio will now:
- Show a "Pitch Deck" badge on project cards that have pitch data
- Allow clicking to navigate directly to the pitch page (`/analysis/:id/pitch`)

---

## File Changes

### A. `src/components/portfolio/ActionItemsPanel.tsx` (NEW)

A new component rendered at the top of the Portfolio page. Features:
- Fetches from `portfolio_action_items` table ordered by `position`
- Each item shows: text, optional linked project name, notes (expandable), completed toggle
- Inline editing of text and notes
- Add new item (text input + optional project link dropdown)
- Delete item (trash icon with confirm)
- Move up/down buttons to reorder (updates `position` column)
- Auto-generates suggested action items from analyses (e.g., "Review high-scoring project X", "Stress-test project Y") -- shown as suggestions the user can add with one click
- All mutations use optimistic UI with `supabase.from("portfolio_action_items")`

### B. `src/components/portfolio/ProjectNotesEditor.tsx` (NEW)

A small notes editor component (textarea + save button) used in two places:
- Inside the Portfolio's project card (via a collapsible "Notes" section)
- On the Report/analysis page (always-visible notes section at the bottom)
- Persists via `saveStepData("projectNotes", text)` or direct Supabase update
- Shows last-edited timestamp

### C. `src/pages/PortfolioPage.tsx` (MODIFIED)

- Import and render `ActionItemsPanel` between the stats row and Score Intelligence Panel
- Update `ProjectInsightCard` usage to pass notes and pitch data
- Add a notes section that expands inline on each project card

### D. `src/components/portfolio/ProjectInsightCard.tsx` (MODIFIED)

- Show a small "Pitch Deck" badge if `analysis_data?.pitchDeck` exists
- Show a truncated notes preview if `analysis_data?.projectNotes` exists
- Add an inline collapsible notes editor (click "Notes" to expand)
- Notes save directly to `saved_analyses.analysis_data` via Supabase update

### E. `src/contexts/AnalysisContext.tsx` (MODIFIED)

- In `handleLoadSaved`: restore `projectNotes` from `analysis_data`
- Add `projectNotes` / `setProjectNotes` state
- Expose in context so Report pages can show/edit notes

### F. `src/pages/ReportPage.tsx` (MODIFIED)

- Add a "Notes" section at the bottom of the report view using `ProjectNotesEditor`
- Connected to `analysis.projectNotes` and saves via `saveStepData`

---

## Action Items Intelligence

The `ActionItemsPanel` will auto-suggest action items based on analysis data:
- Projects with score >= 7.5 but no pitch deck: "Generate pitch deck for [Project]"
- Projects with no stress test: "Run stress test for [Project]"
- Projects marked outdated: "Re-run analysis for [Project]"
- Highest-scoring project: "Focus on [Project] -- your strongest opportunity"

These appear as grey suggestion chips that the user can click to add to their list.

---

## Technical Details

### Database Migration SQL
```sql
CREATE TABLE public.portfolio_action_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  analysis_id uuid,
  text text NOT NULL,
  notes text,
  position integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.portfolio_action_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select their own action items"
  ON public.portfolio_action_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own action items"
  ON public.portfolio_action_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own action items"
  ON public.portfolio_action_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own action items"
  ON public.portfolio_action_items FOR DELETE USING (auth.uid() = user_id);
```

### Notes Storage Pattern
Notes are stored in the existing `analysis_data` JSONB column as:
```json
{
  "projectNotes": "User's free-text notes about this project...",
  "pitchDeck": { ... },
  "disrupt": { ... }
}
```

This requires zero schema changes and follows the established pattern.

### Reorder Logic
Move up/down swaps `position` values between adjacent items and batch-updates both rows in a single call.
