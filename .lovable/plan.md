

## Better User Journey Visualization

### Problem
The current `WorkflowTimeline` is a simple vertical list of steps with expandable friction details. It looks the same regardless of what's being analyzed (SaaS product vs physical product vs service). It doesn't feel like a real process/workflow diagram.

### Approach: Adaptive Journey Layout

**1. New `AdaptiveJourneyMap` component** (replaces `WorkflowTimeline` in journey tab)

Detects the type of journey from step content and `contextOfUse`/category, then renders an appropriate layout:

- **Digital/SaaS journeys** (keywords: sign up, download, configure, dashboard) → Horizontal swimlane-style flow with phase groupings (Discovery → Onboarding → Core Usage → Retention)
- **Physical/Service journeys** (keywords: visit, drive, arrive, wait, appointment) → Location-based vertical timeline with environment context
- **E-commerce journeys** (keywords: browse, cart, checkout, deliver) → Funnel-style visualization showing conversion stages
- **Default** → Enhanced horizontal process flow with connected nodes

**2. Visual improvements across all layouts:**
- Steps rendered as connected **process nodes** (rounded cards with directional arrows/connectors between them)
- Friction points shown **inline** as red warning badges on the connector lines (not hidden behind expand)
- High-severity friction steps get a red/amber border glow — severity is visible at a glance
- Phase grouping headers (e.g., "DISCOVERY", "ONBOARDING", "CORE USAGE") auto-derived from step content
- Cognitive Load and Context of Use rendered as a summary bar at the top, not buried at the bottom

**3. Horizontal flow for desktop, vertical for mobile:**
- On desktop (sm+): steps flow left-to-right in a scrollable horizontal track with curved SVG connectors
- On mobile: collapses to the current vertical layout but with the new styling

### Technical Plan

| Task | Detail |
|------|--------|
| Create `src/components/AdaptiveJourneyMap.tsx` | New component with phase detection, horizontal flow layout, friction overlays |
| Phase detection logic | Categorize steps into phases (Discovery/Evaluation/Acquisition/Usage/Retention) based on keyword matching from existing `STEP_ICON_KEYWORDS` |
| Journey type detection | Use `contextOfUse`, category, and step keywords to pick layout variant |
| Friction severity visualization | Red/amber/green connector segments between nodes; high-severity steps get prominent callout |
| Update `ReportPage.tsx` | Replace `WorkflowTimeline` with `AdaptiveJourneyMap` in the journey tab |
| Update `ShareableAnalysisPage.tsx` | Same replacement for shared view |
| Keep `WorkflowTimeline` export | Other pages (Index, PrintableReport) still use it — don't break them |

### Data available for adaptation
From `userWorkflow`:
- `stepByStep: string[]` — step names
- `frictionPoints: { stepIndex, friction, severity, rootCause }[]`
- `cognitiveLoad: string`
- `contextOfUse: string`

From parent product:
- `category` — product/service/business type
- `name`, `description` — what's being analyzed

