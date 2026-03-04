

## Problem

The **Assumptions** and **Flip the Logic** sections in the Disrupt step render minimal content: each assumption shows just `assumption`, `currentAnswer`, `challengeIdea`, and metadata tags. Flip the Logic shows `originalAssumption → boldAlternative` with a collapsible rationale/mechanism. The user wants richer, more articulated output explaining the analytical approach, what was considered, and why — with top 10 bullets, expand-for-more, and dynamic visual accents.

## Root Cause

The edge function already returns rich fields (`reason`, `leverageScore`, `isChallengeable`, `challengeIdea`, `rationale`, `physicalMechanism`) but the UI treats them as secondary metadata rather than primary content. There's no introductory "approach" narrative and no progressive disclosure beyond the existing `DetailPanel`.

## Plan

### 1. Add Analytical Approach Banners to Both Sections

Replace the static "Why this matters" and "Methodology" blurbs with structured, data-driven approach summaries that dynamically reflect what was analyzed:

**Assumptions section** — a bordered banner showing:
- How many assumptions were uncovered
- Breakdown by reason category (e.g., "3 from tradition, 2 from cost, 1 from habit")
- How many are challengeable vs. structural
- Average leverage score
- A 1-sentence methodology note

**Flip the Logic section** — a bordered banner showing:
- How many inversions were generated
- Which assumption categories were targeted
- A 1-sentence methodology note on structural inversion

These banners use section-aware coloring with left accent borders.

### 2. Enrich Assumption Cards with Progressive Disclosure

Currently each card shows assumption + currentAnswer + challengeIdea inline. Redesign to:

- **Primary**: Numbered assumption text (bold, full width)
- **Always visible**: Reason tag (color-coded pill with accent border), leverage score bar (horizontal, like `ScoreBar`), challengeable badge
- **"Current state" line**: `currentAnswer` displayed as a quoted insight
- **"Challenge approach" line**: `challengeIdea` — currently hidden behind metadata, promote to a visible accent-bordered callout
- Show top 10 by default; if more than 10, show "Show N more" expand button

### 3. Enrich Flip the Logic Cards with Richer Content

Currently shows assumption → flip in a 3-column grid with collapsible rationale. Redesign to:

- **Primary row**: Original assumption (muted) → Bold alternative (accent-highlighted)
- **Always visible below the flip**: 2-line rationale preview (first 120 chars), with "Read full analysis" expand
- **Expanded state**: Full rationale + physicalMechanism in a structured 2-column layout with labeled sections ("Why this creates value" / "How it works")
- Add a small "Inversion strength" indicator based on how different the flip is from the original (heuristic: if leverageScore exists on the source assumption, use it)
- Show top 10 by default; "Show N more" expand for remainder

### 4. Dynamic Visual Summary Strip

At the top of each section, add a compact horizontal stats strip with high-contrast coloring:

**Assumptions**: `[N Assumptions] [M Challengeable] [Avg Leverage: X/10] [Top reason: Tradition]`
**Flip the Logic**: `[N Inversions] [M High-leverage] [Top category: Cost]`

Each stat chip uses the mode accent color with a subtle background tint, matching the section-aware coloring system.

### 5. Reason Color System Enhancement

Upgrade the existing `REASON_COLORS` to use accent-border left strips on cards instead of tiny muted pills. Each reason gets a distinct left-border color (tradition=amber, manufacturing=blue, cost=green, physics=purple, habit=pink), making the cards scannable at a glance.

### Technical Scope

All changes are in `src/components/FirstPrinciplesAnalysis.tsx`:
- Lines ~885-950 (Assumptions section): Add approach banner, stats strip, enrich cards, add show-more gate
- Lines ~952-998 (Flip the Logic section): Add approach banner, stats strip, enrich cards with always-visible rationale, add show-more gate
- No edge function changes needed — all data fields already exist
- No new components needed — reuses existing `DetailPanel`, `Collapsible` patterns

