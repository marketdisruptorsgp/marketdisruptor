

# Rebuild Insight Graph Page: From "What did the AI find?" to "What should I do?"

## What changes

Replace the entire `InsightGraphView` component (tabs, graph visualization, node cards, cytoscape) with a single-scroll **Strategic Action Brief** page. No tabs, no graph, no nodes.

## New page structure (4 sections + collapsible)

### User context toggle (top bar)
Three pill buttons: **Buyer** / **Founder** / **Investor**. Default based on `activeMode` from AnalysisContext (`"business"` → Buyer, `"custom"` → Founder, `"service"` → Investor). Stored in local state. Changes only the "As a [role]:" action lines in each card.

### Section 1 — The Verdict
Two sentences, large text (18px). Derived from the graph's `topNodes.primaryConstraint` and `topNodes.breakthroughOpportunity` — synthesize into a situation summary. Example: "This business has strong recurring revenue but is bottlenecked by manual bid estimation. The biggest upside is automating the 70% of quotes that follow predictable rules."

### Section 2 — What's Blocking the Value (red left border)
Top 3 constraint nodes from `graph.nodes.filter(n => n.type === "constraint")`, sorted by `impact * influence`. Each card:
- **Title**: constraint label (scrubbed)
- **Body**: 2 sentences from `node.detail` or `node.reasoning`
- **Action line**: "As a [buyer/founder/investor]: [specific action]" — generated from constraint type + user role mapping

### Section 3 — Where the Upside Is (green left border)
Top 3 opportunity/leverage nodes from `graph.nodes.filter(n => OPPORTUNITY_NODE_TYPES.includes(n.type) || n.type === "leverage_point")`, sorted by `impact`. Same card format with role-specific action line.

### Section 4 — What to Do in Order (numbered list)
4–5 action items derived from the constraints and levers above. Each item gets a timing badge: "Before close", "Month 1", "Year 1", or "Validate first". The sequencing logic: constraints with highest urgency → quick-win levers → longer-term opportunities.

### Collapsible — "How we reasoned"
At the bottom, a single `<Collapsible>` section. For each key finding, show a linear text chain: `Signal → Assumption → Constraint → Lever → Concept`. Built from the existing `getInsightChain()` function, rendered as inline text with arrow separators.

## Files to modify

1. **`src/pages/InsightGraphPage.tsx`** — Remove `InsightGraphView` import. Replace with new `StrategicActionBrief` component. Keep the toolbar (nav breadcrumb, PDF, Refresh buttons). Pass `graph`, `activeMode`, entity name.

2. **Create `src/components/insight-graph/StrategicActionBrief.tsx`** — New component with all 4 sections + collapsible. ~250 lines. Contains:
   - `UserContextToggle` (inline, 3 buttons)
   - `VerdictSection` — extracts summary from topNodes
   - `BlockerCards` — filters/sorts constraint nodes, renders 3 cards with red left border
   - `UpsideCards` — filters/sorts opportunity nodes, renders 3 cards with green left border  
   - `ActionPlan` — derives sequenced actions from the constraints + opportunities, assigns timing badges
   - `ReasoningCollapsible` — uses `getInsightChain()` to build text chains
   - Role-specific action line generator: a simple function mapping `(nodeType, role)` → action sentence template

3. **`src/components/insight-graph/InsightGraphView.tsx`** — Keep the file but it becomes unused from this page. No deletion needed (other pages may reference sub-components).

## Role-to-action mapping logic

```text
constraint + buyer  → "Negotiate a price reduction for this" / "Build a 90-day fix plan before closing"
constraint + founder → "Fix this before it limits growth" / "Hire for this gap"
constraint + investor → "Factor this into valuation" / "Require a remediation plan"
lever + buyer → "This is your Day 1 value creation play"
lever + founder → "Double down on this — it's your competitive edge"
lever + investor → "This is the thesis — fund this"
```

These are template strings with the node label interpolated. Simple, no AI call needed.

## Timing badge assignment

- Constraints with `impact > 0.7` → "Before close" (buyer) / "This quarter" (founder)
- Leverage points with `feasibilityScore > 0.6` → "Month 1"
- Lower-impact opportunities → "Year 1"
- Anything with `confidence === "low"` → "Validate first"

## What gets removed

All imports and usage of: `CytoscapeReasoningMap`, `InsightNodeCard`, `OpportunityMatrix`, `ConstraintMap`, `DataConfidenceBanner`, `PrimaryBlockerCallout`, `StrategicPathways`, `SimulationPanel`, `RecomputeOverlay`, `IntelligenceEventFeed`, concept expansion hooks, simulation hooks. These files stay in the codebase but are no longer rendered on this page.

## No new dependencies needed

Uses existing: `framer-motion` (for section animations), `@radix-ui/react-collapsible`, `lucide-react`, graph data types from `insightGraph.ts`.

