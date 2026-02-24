

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

