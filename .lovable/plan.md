

## Thoughts on Your Three Topics

### 1. Progressive Reveal — Keeping the Graph Explorable

Your instincts are right. The current `InsightGraphView` already has a version of this via `ZoomLevel` (Overview / Structural / Full Reasoning) and the Opportunity Paths filter. But these are toggle-based, not progressive.

**Recommended approach for Cytoscape implementation:**

- **Default view: Opportunities + Leverage Points only** (the "so what" layer). This is ~10-20 nodes max — immediately scannable.
- **Click-to-expand upstream**: Tapping an Opportunity reveals its parent Constraints and Leverage Points. Tapping a Constraint reveals its parent Signals/Assumptions. Each click peels back one layer.
- **Auto-collapse weak signals**: Nodes with `confidence: "low"` and `evidenceCount < 2` start hidden. A "Show all signals" toggle reveals them.
- **Strongest path highlight**: On load, auto-detect and highlight the single strongest Signal → Opportunity chain (highest cumulative evidence count). This gives users an immediate entry point.

This is a better UX than the current zoom-level toggles because it's driven by user curiosity rather than abstract filter categories.

### 2. Architecture — Cytoscape Inside InsightGraphView

**No major issues embedding Cytoscape in the existing container.** The SimulationPanel, RecomputeOverlay, and IntelligenceEventFeed are all positioned independently (fixed/absolute) and communicate via state/callbacks — they don't depend on ReactFlow internals.

**Recommended approach:**
- Build `CytoscapeReasoningMap` as an **isolated component** that accepts `graph: InsightGraph`, emits events (`onSelectNode`, `onRequestSimulation`, etc.)
- The parent `InsightGraphView` keeps orchestrating the surrounding UI (toolbar, side panel, simulation panel, event feed)
- This means we swap the ReactFlow `<ReactFlow>` block for `<CytoscapeReasoningMap>` — everything else stays

This is cleaner than deep integration because Cytoscape manages its own DOM canvas, and isolating it makes it testable and reusable (e.g., in the ConstraintMap view too).

### 3. Leverage Amplification — Future Feature

Good instinct to defer this. When we do build it, the architecture supports it naturally: a Leverage Point node would spawn multiple child Opportunity nodes via an edge function call. The graph would animate the new nodes branching out. No structural changes needed — just a new AI generation step triggered from the node detail panel.

---

## Implementation Plan

### Phase 1 — Install Cytoscape.js + Core Renderer
- Add `cytoscape`, `cytoscape-dagre` dependencies
- Create `CytoscapeReasoningMap.tsx` as isolated component
- Props: `graph`, `onSelectNode`, `onRequestSimulation`
- Dagre left-to-right layout with 5 color-coded node types
- Basic tap-to-select and hover tooltips

### Phase 2 — Progressive Reveal
- Default view shows only Opportunities + Leverage Points
- Click-to-expand-upstream interaction
- Auto-highlight strongest reasoning path on load
- Low-confidence nodes hidden by default with toggle

### Phase 3 — Swap Renderer in InsightGraphView
- Replace ReactFlow block with CytoscapeReasoningMap
- Keep all surrounding UI (toolbar, side panel, SimulationPanel, EventFeed)
- Preserve existing node detail panel (InsightNodeCard) via `onSelectNode` callback

### Phase 4 — Path Highlighting + Filtering
- Click any node → highlight full upstream/downstream chain
- Dim unrelated nodes to 20% opacity
- Type filter toggles in toolbar
- Breakthrough path detection (longest Signal → Opportunity chain with most evidence)

