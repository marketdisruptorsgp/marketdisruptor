## Yes and it needs to be high contrast. Noticeable. 

## Plan: Add Help/Info Explainer Icons Across All Analysis Components

### Problem

Users have no way to understand what each step, section, or panel means. There are no contextual help icons anywhere in the analysis pipeline.

### Approach

Create a single reusable `InfoExplainer` component (a `?` icon that opens a popover with a detailed explanation), then wire it into the 4 key shared components that render across all modes, steps, and sections. This gives universal coverage without touching every page individually.

### Implementation

#### 1. Create explainer content registry (`src/lib/explainers.ts`)

A single record mapping every step, section, and panel ID to a detailed explainer string (2-3 sentences each). Covers:

- **Steps**: Intelligence Report, Disrupt, Redesign, Stress Test, Pitch Deck
- **Report sections**: Overview, Community Intel, User Journey, Pricing Intel, Supply Chain, Patent Intel
- **Stress Test sections**: Debate, Validate
- **Pitch slides**: Problem, Solution, Why Now, Market, Product, Business Model, Traction, Risks, GTM, Invest
- **Panels**: Sources & Trend Analysis, Assumptions Map, Complaints & Requests, etc.
- **Business Model sections**: all relevant keys

#### 2. Create `InfoExplainer` component (`src/components/InfoExplainer.tsx`)

- A small `HelpCircle` icon (lucide) button, 16-18px
- On click/tap, opens a `Popover` (Radix) with the explainer text
- Props: `explainerKey: string` (looks up from registry), or `text: string` (inline override)
- Styled subtly (muted-foreground, hover to primary) so it doesn't compete with content
- Works on both mobile (tap) and desktop (click)

#### 3. Wire into shared components

`**ModeHeader**` — Add `explainerKey?: string` prop. Render `InfoExplainer` next to step title. Every step page already uses `ModeHeader`, so all steps get help icons automatically.

`**SectionHeader**` — Add `explainerKey?: string` prop. Render `InfoExplainer` next to section label. Used in ReportPage for every tab section.

`**SectionWorkflowNav**` — Add optional `explainerKeys?: Record<string, string>` prop. Render a small `?` icon inside each grid card. Used in Report, Stress Test, and Business Results pages.

`**DetailPanel**` — Add `explainerKey?: string` prop. Render `InfoExplainer` next to title text. Every collapsible panel across all steps gets a help icon.

#### 4. Update page files to pass explainer keys

- `ReportPage.tsx` — pass keys to `SectionHeader`, `DetailPanel`, `SectionWorkflowNav`
- `DisruptPage.tsx` — pass key to `ModeHeader`
- `RedesignPage.tsx` — pass key to `ModeHeader`
- `StressTestPage.tsx` — pass keys to `ModeHeader`, `SectionWorkflowNav`
- `PitchPage.tsx` — pass key to `ModeHeader`
- `BusinessResultsPage.tsx` — pass keys to step-level headers and nav

### Technical Details

- Popover uses `@radix-ui/react-popover` (already installed)
- Icon: `HelpCircle` from lucide-react
- Touch targets: 32px minimum tap area via padding
- Popover max-width: 280px, with `typo-card-body` text
- Z-index handled by Radix portal automatically

### Files to create

- `src/lib/explainers.ts`
- `src/components/InfoExplainer.tsx`

### Files to modify

- `src/components/ModeHeader.tsx`
- `src/components/SectionNav.tsx` (SectionHeader, SectionWorkflowNav, DetailPanel)
- `src/pages/ReportPage.tsx`
- `src/pages/DisruptPage.tsx`
- `src/pages/RedesignPage.tsx`
- `src/pages/StressTestPage.tsx`
- `src/pages/PitchPage.tsx`
- `src/pages/BusinessResultsPage.tsx`