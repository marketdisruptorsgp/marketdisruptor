

## Plan: Refocus Command Deck Around Distilled Insights + 3 Value Pillars

### What This Changes

The Command Deck currently has a scattered layout: ProblemStatementCard, 3x2 grid (pricing/customer/constraints/supply chain/trapped value/opportunities), journey map, recommended move, then collapsible sections (Confidence, Playbooks, Diagnosis, Market, Reasoning, Lab, Tools).

**New structure** — two clear zones:

---

### Zone 1: "Current State Intelligence" (front and center)

A new `CurrentStateIntelligence` component that distills 10-15 bullet-style insights from ALL available data into categorized groups. No panels, no collapsible sections — just dense, scannable bullets organized SWOT-style:

| Category | Data Sources |
|---|---|
| **What's Working** | `narrative.breakthroughOpportunity`, `narrative.strategicPathway`, positive community signals, strong evidence categories |
| **Top Complaints** | `communityInsights.topComplaints`, `customerSentiment`, negative friction points |
| **Journey Friction** | `userJourney.frictionPoints`, `cognitiveLoad`, friction tiers from governed data |
| **Emerging Patterns** | Strategic patterns from `detectStructuralPattern`, evidence clusters, trend signals |
| **Top Constraints** | `narrative.primaryConstraint`, governed `constraint_map`, `friction_tiers` |
| **Problem Framing** | Problem statement candidates (keep the editable ProblemStatementCard above) |

Rules:
- No `line-clamp` or truncation anywhere — full text always visible
- No filler words — `humanizeLabel` applied to everything
- 2-4 bullets per category, hard max ~15 total
- Each bullet is a single concise sentence, not a paragraph

---

### Zone 2: Three Value Pillars

Replace the current collapsible BriefingSections with three clear cards/tabs:

**1. New Ideas** — Combines Disrupt + Reimagine outputs
- Flipped ideas, breakthrough opportunities, strategic pathways
- Links to `/disrupt` and `/redesign` steps

**2. Execution Path** — Combines Playbooks + Stress Test + Pitch
- Top playbook with detailed steps
- Outcome simulator
- Risk validation (kill question)
- Links to `/stress-test` and `/pitch`

**3. Iterate** — Scenario Lab + Challenge Mode + Tools
- Scenario simulations, what-if analysis
- Challenge mode entry point
- Lens tools
- Encourages returning to try new approaches

---

### Files to Change

1. **New: `src/components/command-deck/CurrentStateIntelligence.tsx`**
   - Extracts and categorizes 10-15 key insights from product data, narrative, governed data, evidence, and patterns
   - SWOT-style grid layout (2x3 or stacked cards)
   - No truncation (`line-clamp` removed), full `humanizeLabel` on all text

2. **New: `src/components/command-deck/ValuePillarTabs.tsx`**
   - Three-tab or three-card layout: "New Ideas" | "Execution Path" | "Iterate"
   - Each tab houses the relevant existing components (TransformationPaths, StrategicOutcomeSimulator, ScenarioLab, etc.)

3. **Modified: `src/pages/CommandDeckPage.tsx`**
   - Replace `ExecutiveSnapshot` + scattered BriefingSections with:
     - `ProblemStatementCard` (keep as-is, top)
     - `CurrentStateIntelligence` (new, front and center)
     - `ValuePillarTabs` (new, below)
   - Remove individual BriefingSection wrappers for Confidence/Playbooks/Diagnosis/Market/Reasoning/Lab/Tools
   - Keep journey map inside Current State if friction data exists

4. **Modified: `src/components/command-deck/ExecutiveSnapshot.tsx`**
   - Remove `line-clamp-2` and `line-clamp-3` from Bullet component
   - This component may be deprecated in favor of CurrentStateIntelligence, but kept for backward compatibility

