

# About Page Rewrite + Homepage Headline Change

## Overview

Two changes: (1) rewrite the About page copy to match the provided Market Disruptor positioning, and (2) change "Reinvent" to "Rethink" on the homepage hero.

## Changes

### 1. Homepage Headline (`src/pages/DashboardPage.tsx`)

Line 120: Change `Reinvent any` to `Rethink any`

### 2. About Page Rewrite (`src/pages/AboutPage.tsx`)

Complete copy replacement within the existing page structure. Same layout, icons, and footer -- only the text content changes.

**Section 1 -- Hero Intro** (replaces "Strategic Reinvention" + single paragraph):
- Headline: "Deep Analytics for Strategic Reinvention"
- Two paragraphs:
  - Para 1: Market Disruptor is a proprietary deep analytics platform built for entrepreneurs, investors, and product teams who want to see opportunities others overlook. Not a surface-level tool or a simple AI wrapper.
  - Para 2: Combines advanced multi-model AI, real-time data analysis, computer vision, and structured strategic modeling to deconstruct any product, service, or business model and reconstruct it from entirely new angles.

**Section 2 -- "What It Does"** (replaces "How It Works"):
- Label: "What It Does"
- Four items (same step-badge layout):
  1. **Challenges Assumptions** -- Deliberately questions pricing logic, supply chain design, patent positioning, competitive assumptions, and the operational constraints incumbents accept as inevitable.
  2. **Isolates Structural Weaknesses** -- Examines what is taken for granted, identifies friction points, and tests alternative configurations most teams would never consider.
  3. **Reveals Hidden Leverage** -- Applies data-driven scrutiny exceeding normal human bandwidth to surface overlooked market segments and optimization opportunities that can materially change outcomes.
  4. **Delivers Actionable Output** -- Rigorously constructed strategic perspectives, investor-ready pitch decks, and clearly mapped pathways for experimentation, disruption, or targeted optimization.

**Section 3 -- "Built For"** (same structure, refined copy):
- Entrepreneurs: "Seeing opportunities others overlook with data-driven conviction, not guesswork."
- Investors: "Applying adversarial rigor to evaluate opportunities before committing capital."
- Product Teams: "Stress-testing strategy, positioning, and assumptions before launch."
- Agencies: "Delivering data-backed strategic perspectives that go beyond surface-level analysis."

**Section 4 -- CTA card**:
- Headline: "Apply a level of scrutiny that exceeds normal bandwidth."
- Subtitle: "See what a deep deconstruction reveals about your market."
- Button: "Start Analysis" (unchanged behavior)

## Technical Details

| File | Change |
|---|---|
| `src/pages/DashboardPage.tsx` | Line 120: `Reinvent any` becomes `Rethink any` |
| `src/pages/AboutPage.tsx` | Full copy replacement across all four sections. Same JSX structure, icons, footer, and navigation. No layout or component changes. |

