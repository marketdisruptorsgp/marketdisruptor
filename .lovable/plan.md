

## Visual Branch Selector — Interactive Hypothesis Map

### The Problem
The current `StructuralInterpretationsPanel` is a vertical list of cards — functional but flat. For a platform that leads with cinematic visuals (Arena, Constellation, Tension), the branch selection moment deserves the same spatial, interactive treatment. This is the moment the user commits to a strategic universe.

### Concept: "Gravity Well" Branch Visualization

A spatial, force-based layout where each hypothesis is a **weighted orbital node** arranged around a central gravity point. The active branch pulls to the center; alternatives orbit at distance proportional to their dominance delta.

```text
          ┌─────────────────────────────────┐
          │                                 │
          │     ○ Adoption (6.2)            │
          │       ╲                         │
          │        ╲                        │
          │    ●════╪════ ACTIVE ════●      │
          │   Cost (8.1)    ↕    Scale(5.8) │
          │        center orb               │
          │        dominance                │
          │         scores                  │
          │                                 │
          │     ○ Reliability (4.9)         │
          │                                 │
          │   [ tap node → expand + select ]│
          └─────────────────────────────────┘
```

### Key Interactions
1. **Nodes sized by dominance score** — larger = stronger hypothesis
2. **Active branch pulls to center** with a glow ring; alternatives orbit outward
3. **Tap/click a node** → expands inline showing leverage, confidence, evidence mix, and a "Switch to this branch" button
4. **Animated transition** when switching branches — the new selection animates to center, old one drifts outward
5. **Connection lines** from each node to center show tension/relationship, with line opacity reflecting the dominance delta
6. **Competing indicator** — when delta < 1.5, nodes cluster close together with a pulsing "close contest" indicator between them

### Technical Approach

1. **New component**: `src/components/BranchGravityMap.tsx`
   - Uses Framer Motion for spatial positioning and animated transitions
   - Nodes positioned using polar coordinates based on dominance rank
   - Active branch at center (0,0); others at increasing radii
   - Each node renders: constraint type icon, dominance score, hypothesis label (truncated)
   - Expanded state shows evidence bar, fragility, leverage, and "Activate Branch" CTA

2. **Replace card list in `StructuralInterpretationsPanel`**
   - Keep the panel as the wrapper (header, description, competing badge)
   - Swap the `AnimatePresence` card list for `<BranchGravityMap />` 
   - Fall back to card list on very small screens (< 480px width)

3. **Styling**: Dark field background (matching cinematic aesthetic from `CinematicArena`), glowing nodes with mode-accent color for the active branch, muted for alternatives. Follows the "museum-quality spatial storytelling" standard from the design system.

4. **Data flow**: No changes — same `ranking.hypotheses`, `activeBranchId`, and `onSelectBranch` props. Pure visual upgrade.

### Scope
- One new component (~200 lines)
- One edit to `StructuralInterpretationsPanel` to swap the render
- No backend changes, no data model changes

