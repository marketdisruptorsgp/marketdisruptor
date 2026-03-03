## Strategic Mind Map — Interactive Branching Tree

### What We're Building

Replace the current orbital gravity map with a **horizontal mind map / decision tree** that reads left-to-right. The product name sits as the root node on the left. Each root hypothesis branches out as a primary limb, and each hypothesis's **causal chain** entries fan out as child nodes. Clicking a branch activates it and all downstream analysis recomputes from that path.

```text
                    ┌─ Friction: supplier lock-in
                    │
    ┌─ Cost (8.1) ──┼─ Friction: margin compression
    │   ● ACTIVE     │
    │                └─ Friction: capital drag
    │
 [Product] ─┼─ Adoption (6.2) ──┬─ Friction: onboarding drop-off
    │                            └─ Friction: channel mismatch
    │
    └─ Scale (5.8) ──┬─ Friction: infrastructure ceiling
                     └─ Friction: ops bottleneck
```

### Key Interactions

1. **Root node** (left) = the product under analysis
2. **Primary branches** = root hypotheses, sized/weighted by dominance score
3. **Secondary branches** = causal chain entries (friction sources, structural constraints)
4. **Click a primary branch** → it highlights as active, siblings dim, downstream steps mark outdated
5. **Hover a secondary node** → tooltip shows system_impact and impact_dimension
6. **Active path glows** with the mode accent color; inactive paths are muted
7. **Animated transitions** when switching branches — the new path pulses, old one fades
8. **Competing indicator** — when delta < 1.5, the two closest branches pulse with a tension line between them

### Technical Approach

1. **Replace `BranchGravityMap.tsx**` with a new tree/mind-map layout using Framer Motion (no external lib needed)
  - Nodes positioned with a simple tree layout algorithm: root at left center, primary branches spaced vertically, secondary branches offset further right
  - SVG paths (cubic bezier curves) connect parent → child nodes for organic tree feel
  - Each primary node shows: constraint icon, type label, dominance score, confidence badge
  - Each secondary node shows: friction label (truncated), impact dimension badge
2. **Expanded detail** — clicking a primary branch shows a slim inline panel below it with leverage, evidence bar, fragility, and "Focus on this path" CTA (same data as current NodeExpanded)
3. **Responsive** — on mobile, collapse to a vertical accordion tree (indented list with expand/collapse)
4. **Integration** — same props interface (`hypotheses`, `activeBranchId`, `onSelectBranch`), drop-in replacement in `StructuralInterpretationsPanel`
5. **Styling** — light background matching the museum-quality aesthetic, organic bezier connectors, mode-accent glow on active path, muted tones for inactive branches  
  
styling should have some substance, some neat design elements that a professioanl designer would be proud of.  but also consistent with our colors/fonts, no emojis. 

### Scope

- Rewrite `BranchGravityMap.tsx` (~250 lines)
- No other file changes needed (same props contract)
- No backend changes