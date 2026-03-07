## This implementation plan looks strong and the direction makes sense. I want to review it primarily through a UX/UI lens and also make sure we stay consistent with the broader design system as we introduce these new structures.

First, on the concept cluster containers.

Using Cytoscape compound nodes is the right technical approach for grouping concept variants under their originating opportunity. From a UX perspective, though, we should make sure the cluster container visually aligns with the styling patterns already used elsewhere in the product.

That means the container shouldn’t introduce a completely new visual language. Border radius, color tokens, spacing, and typography should reuse the existing design system variables wherever possible so the concept layer feels like a natural extension of the interface rather than a separate visual mode.

Concept variants themselves should also visually read as exploratory artifacts, not structural insights. Making them slightly smaller and visually lighter than reasoning nodes will help users immediately distinguish between “ideas being explored” and “insights the system has discovered.”

Second, on the reasoning tier reveal system.

Moving from node-type reveal to semantic tiers is the right UX model because it matches how users mentally move through the workflow.

When implementing the tier controls, we should keep interaction patterns consistent with the rest of the system — things like toggle styling, button hierarchy, and active states should reuse the same UI primitives already used in other panels.

Also worth considering: if a tier is hidden, the interface should still subtly indicate that additional layers exist so users understand the graph has more depth available.

Third, edge differentiation.

The discovered / inherited / design distinction is a good structural addition, but we should be careful that the visual treatment stays within the existing line styles and color palette used elsewhere in the graph. Ideally we differentiate through line style and opacity rather than introducing new colors, so the overall graph remains visually cohesive.

Fourth, concept promotion behavior.

From a UX standpoint, the moment a concept becomes a promoted opportunity is an important transition in the workflow. If possible, the node should visually “break out” from the concept cluster when promoted so users clearly see that it has moved from exploratory space into the main reasoning graph.

Finally, zooming out a bit:

With concept clusters, reasoning tiers, and validation layers, the graph is now representing multiple types of structure at once. As we implement these upgrades, it will be important that every new visual element respects the system’s existing layout rhythm, spacing rules, and color hierarchy so the interface remains coherent as the graph grows.

The goal is for the concept layer to feel like a natural extension of the reasoning system, not a separate visual environment.

Let me know if anything in the current styling approach would make it difficult to stay aligned with the existing design tokens and UI primitives.

&nbsp;

Plan: Concept Cluster Containers, Reasoning Tier Reveal, and Edge Visual Differentiation

This plan covers three interconnected UX upgrades to the Cytoscape reasoning map.

---

### 1. Compound Node Clusters for Concept Variants

**What**: Concept variant nodes will be rendered inside a Cytoscape compound (parent) node that visually groups them under their parent opportunity. This creates a bounded "concept space container" in the graph.

**How** (in `CytoscapeReasoningMap.tsx`):

- In the `elements` builder, for each opportunity node that has `variant_of` children, create a **compound parent node** with id `cluster-{opportunityId}` and style it as a translucent rounded container with a subtle border matching the concept variant color scheme
- Set each concept variant node's `data.parent` to the cluster id — Cytoscape natively renders children inside compound nodes
- Add compound node styles: larger padding, rounded rectangle, low-opacity fill with a label like "Design Space" positioned at the top
- The dagre layout handles compound nodes — children get laid out inside the parent region automatically
- When a concept is later promoted, it loses its `parent` reference and becomes a top-level node (visual "breakout")

**Style additions**:

```
selector: "$node > node" (compound children) — smaller size, tighter spacing
selector: ":parent" (compound parent) — translucent bg, dashed border, top-aligned label
```

---

### 2. Reasoning Tier Progressive Reveal

**What**: Replace the current 5-layer node-type-based reveal with 4 semantic reasoning tiers that match the user's mental model.

**How** (in `CytoscapeReasoningMap.tsx`):

- Replace `REVEAL_LAYERS` with a tier-based structure:
  ```
  REASONING_TIERS = [
    { label: "Discovery",    types: ["signal", "evidence", "assumption"] },
    { label: "Opportunity",  types: ["constraint", "friction", "leverage_point", "driver", "insight", "outcome", "flipped_idea", "concept", "pathway", "scenario", "competitor"] },
    { label: "Concept",      types: ["concept_variant"] },
    { label: "Validation",   types: ["simulation", "risk"] },
  ]
  ```
- Default reveal: Opportunity tier (shows the core reasoning). Users expand upstream (Discovery) or downstream (Concept, Validation)
- Update the control bar button labels to match: "Discovery", "Opportunity", "Concept", "Validation"
- Concept tier visibility is independent — toggling it shows/hides the compound clusters as a group

---

### 3. Edge Visual Differentiation by Relationship Category

**What**: Visually distinguish discovered, inherited, and design edges using line style.

**How** (in `CytoscapeReasoningMap.tsx`):

- Add an `edgeCategory` data field to each edge element:
  - `"design"` for `variant_of` edges
  - `"inherited"` for edges where source or target is a promoted concept (detected by node id prefix `cv-` on a non-variant node, or a future `promotedFrom` field)
  - `"discovered"` for everything else
- Add Cytoscape style rules:
  ```
  edge[edgeCategory="discovered"] → line-style: solid, width: 1.5
  edge[edgeCategory="inherited"]  → line-style: dashed, width: 1.5
  edge[edgeCategory="design"]     → line-style: dotted, width: 1, opacity: 0.4
  ```
- Update the legend to show the three edge styles with a small visual key

---

### 4. Edge InsightGraphEdge Type Extension

**What**: Add an optional `category` field to `InsightGraphEdge` in `src/lib/insightGraph.ts`.

**How**:

- Add `category?: "discovered" | "inherited" | "design"` to the `InsightGraphEdge` interface
- In `injectConceptVariants` (`src/lib/conceptExpansion.ts`), set `category: "design"` on `variant_of` edges
- The Cytoscape component reads this field; defaults to `"discovered"` when absent

---

### Files Modified


| File                                                     | Changes                                                                                                       |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `src/lib/insightGraph.ts`                                | Add `category` to `InsightGraphEdge`                                                                          |
| `src/lib/conceptExpansion.ts`                            | Set `category: "design"` on variant edges                                                                     |
| `src/components/insight-graph/CytoscapeReasoningMap.tsx` | Compound cluster nodes, reasoning tier reveal system, edge style differentiation, updated legend and controls |
