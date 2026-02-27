

## Plan: Enhance Disrupt Step UX + Section Progress Visuals

This is a multi-part change touching section navigation visuals, Disrupt content depth, flipped ideas auto-generation, and pitch deck inclusion clarity.

### Technical Details

---

#### 1. Fill completed sections with mode color (`SectionWorkflowNav` in `src/components/SectionNav.tsx`)

Currently, visited sections show a green `CheckCircle2` icon on a neutral background. Instead, fill the entire card background with the mode accent color (like the active card) but at a lighter opacity, replacing the green checkmark with a white checkmark on the colored background.

**Changes in `SectionWorkflowNav`:**
- Visited cards: `background: ${accent}` at ~15-20% opacity with accent-colored border
- Visited icon container: solid accent background with white `CheckCircle2`
- Visited text: foreground color (keep readable)
- This mirrors the screenshot reference where completed sections have a colored fill

---

#### 2. Beef up Disrupt Assumptions section (`src/components/FirstPrinciplesAnalysis.tsx`)

- Show ALL assumptions by default (remove the `.slice(0, 4)` limit), use the `DetailPanel` only for the expand/collapse of individual challenge ideas
- Add a short intro paragraph explaining what assumptions are and why challenging them matters
- For "Include in Pitch Deck" toggle on assumptions: add helper text clarifying it sends only a concise executive summary, not the full section: *"Adds a concise summary of key assumptions to the pitch — not the full analysis."*

---

#### 3. Beef up Flip the Logic section

- Add an intro paragraph explaining the methodology: "Each assumption is inverted to explore what happens when conventional wisdom is deliberately violated."
- Add `InsightRating` (like/dismiss) to each flip item for user curation

---

#### 4. Clarify Pitch Deck inclusion (`src/components/PitchDeckToggle.tsx`)

- Update the confirmation text from "Applied — nothing else to do" to "Exec summary will be added to pitch deck"
- Update label prop usage: add `sublabel` prop showing "(concise summary only)" beneath the toggle

---

#### 5. Auto-generate visuals for Flipped Ideas (`src/components/FlippedIdeaCard.tsx`)

- On mount, if `mockupImage` is null, auto-trigger `handleGenerateVisual()` via a `useEffect`
- Remove the empty state placeholder that says "Click to generate" — since it auto-generates, show a loading skeleton instead
- Keep the "Regenerate Visual" button for manual re-runs

---

#### 6. Flipped Ideas section UX — explain the 2 ideas + selective regeneration (`src/components/FirstPrinciplesAnalysis.tsx`)

- Replace the generic "X ideas ranked by viability" header with an explanatory banner:
  - "We generated **2 bold reinvention ideas** based on the assumptions and flipped logic above."
  - "Love an idea? Save it or add its visual to your pitch deck."
  - "Want to change one? Click **Regenerate** on the specific idea, or regenerate all ideas below."
- Change the generate-flip-ideas prompt from 3 ideas to 2 (`supabase/functions/generate-flip-ideas/index.ts` line 91)
- Add per-idea regenerate button on each `FlippedIdeaCard` (new prop `onRegenerateSingle`)

---

#### 7. Per-idea regeneration support

- Add a "Regenerate this idea" button to `FlippedIdeaCard`
- In the parent (`FirstPrinciplesAnalysis`), handle single-idea regeneration by calling `generate-flip-ideas` with `count: 1` and replacing only that idea in the array
- Update `generate-flip-ideas/index.ts` to accept optional `count` parameter (default 2)

---

### Files to Edit
1. `src/components/SectionNav.tsx` — fill visited cards with accent color
2. `src/components/FirstPrinciplesAnalysis.tsx` — remove assumption slice limit, add intro copy, explanatory banner for flipped ideas, per-idea regenerate
3. `src/components/PitchDeckToggle.tsx` — clarify exec summary language
4. `src/components/FlippedIdeaCard.tsx` — auto-generate visual on mount, add per-idea regenerate button
5. `supabase/functions/generate-flip-ideas/index.ts` — change default to 2 ideas, support `count` param

