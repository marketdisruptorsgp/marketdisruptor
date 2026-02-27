## The share analysis link must work and take you directly to the entire analysis. maje sure all links are correct 

&nbsp;

## Plan: Fix Hardcoded Colors + Transform Deep Dive CTA into a Showstopper

### 1. Replace all hardcoded Tailwind color classes with semantic tokens

**ScoreBadge** (line 37): Replace `bg-green-100 text-green-800`, `bg-yellow-100 text-yellow-800`, `bg-red-100 text-red-800` with inline styles using `scoreColors` from designTokens or `hsl(var(--success))` / `hsl(var(--warning))` / `hsl(var(--destructive))`.

**ConfidenceBadge** (lines 42-47): Replace `bg-green-50 text-green-700 border-green-200` etc. with semantic CSS variable equivalents.

**Friction severity badges** (line 408): Replace `bg-red-100 text-red-700`, `bg-yellow-100 text-yellow-700`, `bg-green-100 text-green-700` with semantic token styles.

**SentimentList** (lines 696-707): Replace `text-green-600`, `text-red-600`, `bg-green-500`, `bg-red-500`, `bg-amber-500` with `hsl(var(--success))`, `hsl(var(--destructive))`, `hsl(var(--warning))`.

**Copy button check icon** (line 668): Replace `text-green-600` with `text-success` or inline `hsl(var(--success))`.

### 2. Transform the anonymous Deep Dive CTA (lines 492-526) into a compelling conversion block

Replace the bland "Want the full picture?" with a high-impact section that:

- Bold headline: "You just scratched the surface."
- Subhead: "Deep Dive gives you the intelligence that takes consulting firms weeks to assemble — in seconds."
- A grid of 6 capability cards showing what Deep Dive unlocks:
  - **Full Supply Chain Map** — trace every component from raw material to shelf
  - **Patent & IP Landscape** — see who owns the ideas around this space
  - **Disruption Scoring** — quantified vulnerability and opportunity analysis
  - **Investor-Ready Pitch Deck** — 12-slide deck generated from your analysis
  - **Competitive Moat Analysis** — defensibility breakdown with evidence
  - **Actionable Recommendations** — prioritized next steps, not just observations
- Prominent CTA: "Start Free — 10 Analyses, No Credit Card"
- Supporting line: "Simple email signup. Your current analysis is preserved."

### 3. Also update the depth toggle area (lines 291-295) for anonymous users

Replace the dry "Deep Dive requires a free account" with a more enticing teaser: "Deep Dive: full intelligence layers including pitch decks, patent maps, and disruption scoring — free to try"

### Files to modify

- `src/pages/InstantAnalysisPage.tsx` — all changes in one file