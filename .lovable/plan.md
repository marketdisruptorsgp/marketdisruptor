## Do not touch my homepage at all. 

&nbsp;

## We are only focusing on when you're inside an analysis. 

## UI/Layout Redesign — Clean Slate Approach

### Current Problems

1. **Three competing landing pages** — `StartPage` (/), `DashboardPage`, and `Index.tsx` (2000-line legacy monolith) all serve overlapping purposes. The user journey fractures before it begins.
2. **Two navigation systems** — `PlatformNav` (top bar on public/start pages) and `CommandNavigation` (sidebar on workspace pages) create a jarring context switch when entering an analysis. Users lose spatial orientation.
3. **Command Deck is overwhelming** — 854 lines rendering: Problem Statement → Current State Intelligence (15 SWOT bullets) → Journey Map → Recommended Move → 3-tab Value Pillars (each containing 5-8 sub-components). No visual hierarchy says "START HERE."
4. **Homepage sells instead of serving** — Rotating words, showcase gallery, pipeline steps, value props, mode pills, Instant Photo CTA, Scrutiny CTA. It's a marketing site, not an app home screen. Logged-in users don't need to be sold.
5. **Dead weight** — `Index.tsx` (2000 lines) is a legacy analysis runner that still exists alongside the new pipeline-based workspace. `DashboardPage.tsx` duplicates StartPage content.

---

### Proposed Architecture

```text
┌─────────────────────────────────────────────────┐
│                  APP SHELL                       │
│  ┌──────────┐  ┌────────────────────────────┐   │
│  │ Sidebar  │  │  Content Area               │   │
│  │ (always) │  │                              │   │
│  │          │  │  / → Home (projects + CTA)   │   │
│  │ Logo     │  │  /analysis/new → New         │   │
│  │ ──────── │  │  /analysis/:id/* → Workspace │   │
│  │ Projects │  │                              │   │
│  │ + New    │  │                              │   │
│  │ ──────── │  │                              │   │
│  │ Journey  │  │                              │   │
│  │ (when in │  │                              │   │
│  │ analysis)│  │                              │   │
│  │ ──────── │  │                              │   │
│  │ Resources│  │                              │   │
│  └──────────┘  └────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

### Plan

**1. Unify navigation into a single persistent sidebar**

Replace the dual nav system (PlatformNav + CommandNavigation) with one collapsible sidebar that's always present. Top section: logo + project list + "New Analysis." When inside an analysis, the 5-step journey appears contextually. Resources/settings at the bottom. Mobile: collapse to bottom tab bar. Remove PlatformNav entirely for authenticated users.

**2. Replace the homepage with a project-first home screen**

Kill StartPage, DashboardPage, and Index.tsx landing content. The authenticated home (`/`) becomes a clean project list: recent analyses as cards with status indicators, a prominent "New Analysis" action, and a small "What's New" banner. No rotating words, no showcase gallery, no pipeline diagrams, no value props. The app proves its value through use, not marketing copy.

**3. Redesign Command Deck with progressive disclosure**

Restructure the Command Deck into three clear tiers with a single "hero insight" at the top:

- **Tier 0 — Lead Insight**: One sentence, the single most surprising finding. Full-width, large type. "Your biggest blind spot: [X]" with a "See Why →" link to the graph.
- **Tier 1 — Executive Snapshot**: 3-4 metric cards in a row (Opportunity Score, Risk, Confidence, Signals). Compact, glanceable.
- **Tier 2 — Intelligence Feed**: A single scrollable feed replacing the 3-tab system. Cards are tagged (New Idea / Execution / Iterate) and sorted by impact. Users filter by tag rather than switching tabs. Each card expands inline.
- **Tier 3 — Deep Tools**: Scenario Lab, Challenge Mode, Opportunity Map — collapsed by default behind a "Power Tools" expander.

**4. Simplify the step workspace pages**

Each analysis step (Understand, Disrupt, Reimagine, Stress Test, Pitch) gets a consistent layout: step header with progress → primary content → "Next Step" CTA at the bottom. Remove the split-panel sidebar toggle (hidden by default = nobody finds it). Instead, surface key visuals inline within each step.

**5. Clean up dead code**

- Delete `Index.tsx` (2000-line legacy monolith) or gut it to a redirect
- Merge `DashboardPage.tsx` into the new home screen
- Remove `StartPage.tsx` marketing content for auth'd users
- Remove `HeroSection.tsx` (just wraps PlatformNav)
- Remove `DisruptionPathBanner`, `ShowcaseGallery`, `ReferralCTA` from app interior

### Technical approach

- Extend `AppLayout.tsx` to render the unified sidebar on ALL authenticated routes (not just workspace prefixes)
- Update `CommandNavigation.tsx` to include project list and resources (currently only shows analysis journey)
- Create a new `HomePage.tsx` replacing the three landing pages
- Refactor `CommandDeckPage.tsx` to use the tiered progressive disclosure layout
- Route changes: `/` → new HomePage, remove `/start/*` redirects, keep `/analysis/*` structure

### What this achieves

- **30-second win**: User sees their projects or starts a new one immediately. No marketing friction.
- **3-minute win**: Command Deck leads with the most surprising insight, not structure. Users know what matters.
- **10-minute win**: Power tools are discoverable but not overwhelming. Consistent sidebar means users always know where they are.