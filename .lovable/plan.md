This plan looks very solid technically and I like the architecture approach — especially the deterministic layer generation and the decision to use a CSS grid instead of a graph library. That will keep the visualization clean and readable.

Before implementation, I want to add a UX perspective so the feature doesn’t just display structure but actually creates insight and “aha moments” for the user.

The main goal of this visualization should be helping users connect three things:

1. How their industry works
2. Where the constraints are
3. Where the strategic opportunities exist

So the experience should guide the user through that understanding step-by-step.

A few UX principles I’d like us to incorporate.

First, progressive discovery.

When the Industry System Map first loads, it should feel very simple and understandable — almost like a diagram of how the industry works. The user should immediately see the major layers and where their business sits.

Example structure:

Supply  
Infrastructure  
Operations (their business highlighted)  
Customer Access  
Value Capture

The user’s business should stand out clearly so they immediately orient themselves in the system.

Second, every node should answer a simple question.

When a user clicks a node, the detail panel should explain in very plain language:

• what this part of the industry does  
• why it matters in the system  
• how it affects the user’s business

Avoid strategy jargon — this should read like a clear explanation of how the industry machine works.

Third, the Opportunity Map tab should create “aha” moments.

Instead of just adding markers, the interface should visually connect the dots between:

constraint → opportunity → strategic move

For example when a user clicks an opportunity node, the detail panel should show:

Constraint  
What problem exists in this part of the system

Structural Insight  
Why this problem creates an opportunity

Strategic Move  
What a company could do differently

First Move  
A concrete first step

This should feel like the system is explaining the reasoning behind the opportunity, not just labeling nodes.

Fourth, visual clarity is critical.

Some guidelines:

• keep total nodes around 10–15 maximum  
• never allow node labels to overlap  
• keep arrows straight and simple  
• maintain generous spacing between layers  
• keep labels short and readable

The map should feel more like a clean system diagram than a complex network graph.

Fifth, add subtle interaction cues to make the map feel more alive and engaging.

Ideas:

• hovering a node slightly highlights the entire layer it belongs to  
• clicking a node could briefly highlight connected nodes in the layers above and below  
• when an opportunity is selected, the relevant constraint node could glow or pulse to visually show the connection

These small interactions can help the user intuitively understand how parts of the system relate to each other.

Sixth, use plain language consistently.

For example instead of terms like “disintermediation” or “vertical integration,” we should say things like:

“removing middlemen”  
“owning more steps of the process”

The goal is that even a non-technical business owner can immediately understand what they’re seeing.

Overall the experience should feel less like a data visualization and more like exploring a clear map of the industry system.

If we do this well, users should be able to quickly see:

• where they sit in the system  
• what parts of the system are broken or inefficient  
• where the most interesting opportunities exist

That’s the moment where this visualization becomes extremely valuable.  
  
  
also.. if you have suggestions on ux/ui tools to be using for these and/or other components in our project to improve design style/polish let me know (d3.js, retool, recharts, visx, etc.) open to suggestions.   
  
  
Industry System Map & Opportunity Map

## What We're Building

A two-tab visualization component that replaces abstract text analysis with an interactive "machine diagram" of the user's industry. Tab 1 shows how the industry works structurally. Tab 2 overlays strategic signals on that same structure.

## Data Sources (already available — no new AI calls needed)

The system already computes everything we need:

- **StructuralProfile** — `valueChainPosition`, `supplyFragmentation`, `distributionControl`, `laborIntensity`, `revenueModel`, `marginStructure`, `switchingCosts`
- **SupplyChainIntel** — named suppliers, manufacturers, distributors, retailers, vendors
- **Evidence[]** — categorized signals with `confidenceScore`, `impact`, `category`
- **BindingConstraints** — from structural diagnosis
- **DeepenedOpportunity[]** — thesis with causal chain, economic mechanism, first move
- **StrategicNarrative** — constraint, leverage, trapped value

## Architecture

### New files:

`**src/lib/industrySystemMap.ts**` — Data engine

- `buildIndustryLayers(product, structuralProfile, evidence, supplyChain)` → `IndustrySystemMap`
- Deterministic: reads StructuralProfile dimensions + SupplyChainIntel to produce 5-6 vertical layers
- Each layer contains 1-4 nodes (capped at 15 total)
- Layers: Supply → Infrastructure → Operations → Customer Access → Value Capture (+ optional Regulation layer if `regulatorySensitivity !== "none"`)
- Auto-detects the user's business position from `valueChainPosition`
- Node labels come from real data: named manufacturers/distributors from `SupplyChainIntel`, or structural archetypes ("Fragmented Local Operators") when specific names unavailable

`**src/lib/industryOpportunityOverlay.ts**` — Signal overlay engine

- `overlayOpportunities(systemMap, opportunities, constraints, evidence)` → annotated map
- Tags nodes with markers: ⚠ constraint, ★ opportunity, ● fragmentation, ▲ trend
- Maps `bindingConstraints` to the layer they affect (e.g., "supply_fragmentation" → Supply layer)
- Maps `DeepenedOpportunity` to target layer based on pattern type

`**src/components/industry-map/IndustrySystemMapView.tsx**` — Main container

- Two tabs: "Industry System Map" | "Opportunity Map"
- Manages selected node state, detail panel open/close
- Passes layer data to renderer

`**src/components/industry-map/SystemMapRenderer.tsx**` — Visual renderer

- Pure CSS grid layout (NOT Cytoscape) — guarantees no overlap, clean spacing
- Each layer = full-width row with centered nodes
- Vertical arrows between layers (straight, never diagonal)
- Color coding: neutral gray (industry), bright blue (user's business), orange (structural nodes)
- In Opportunity Map mode: adds marker badges to nodes

`**src/components/industry-map/SystemMapNodeDetail.tsx**` — Right side panel

- Slides in when a node is clicked
- Tab 1 content: Role, Why This Layer Matters, Structure (from StructuralProfile dimension), Potential Strategic Signals
- Tab 2 content: Opportunity name, Constraint, Structural Insight, AI Thesis, First Move, Strategic Bet (all from `DeepenedOpportunity`)

`**src/components/industry-map/OpportunityFilterToggles.tsx**` — Layer toggles for Tab 2

- Checkboxes: Show Constraints / Show Opportunities / Show Strategic Moves
- Filter which marker types are visible

### Integration point:

- Add as a new section on the **Command Deck** between the Thesis and Evidence sections
- Also accessible from sidebar navigation as its own page route

### Layout approach — CSS Grid, not graph library

Using CSS Grid for deterministic, overlap-free layout:

```text
┌────────────────────────────────────────────┐
│  SUPPLY                                    │
│  ┌──────────┐  ┌──────────────────┐        │
│  │Manufactur│  │Material Suppliers │        │
│  └──────────┘  └──────────────────┘        │
│         ↓                                  │
│  INFRASTRUCTURE                            │
│  ┌──────────┐  ┌────────┐  ┌───────┐       │
│  │Distribut.│  │Equipmt │  │Software│      │
│  └──────────┘  └────────┘  └───────┘       │
│         ↓                                  │
│  OPERATIONS                                │
│  ┌══════════════════════════┐              │
│  ║ Your Business (blue)    ║              │
│  └══════════════════════════┘              │
│         ↓                                  │
│  CUSTOMERS                                 │
│  ┌──────────┐  ┌──────────────────┐        │
│  │Homeowners│  │Property Managers │        │
│  └──────────┘  └──────────────────┘        │
│         ↓                                  │
│  VALUE CAPTURE                             │
│  ┌──────────────┐  ┌───────────────┐       │
│  │Service Cont. │  │Maint. Plans   │       │
│  └──────────────┘  └───────────────┘       │
└────────────────────────────────────────────┘
```

Node detail panel slides in from the right (40% width on desktop, full-width sheet on mobile).

### Node data derivation logic:

- **Supply layer**: from `supplyChain.manufacturers` + `supplyChain.suppliers` names, or "Material Suppliers" archetype
- **Infrastructure layer**: from `supplyChain.distributors` + `supplyChain.vendors`, or inferred from `distributionControl` dimension
- **Operations layer**: user's business name (always present, always highlighted)
- **Customer layer**: inferred from evidence categories containing "customer", "user", "consumer" signals, or from business type
- **Value Capture layer**: inferred from `revenueModel` dimension — "Service Contracts" for transactional, "Subscriptions" for recurring, etc.
- **Regulation layer** (optional): only if `regulatorySensitivity` >= "moderate"

### Sizing estimate: ~800 lines across 6 files. No new dependencies needed — uses existing Tailwind + framer-motion.