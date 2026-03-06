

# Product Alignment Audit — Current State vs Directive

## Already Implemented (No Changes Needed)

The vast majority of this directive is already built and functioning:

- **Evidence Engine** (`evidenceEngine.ts`): Structured `Evidence` objects with `id`, `label`, `type`, `tier`, `pipelineStep`, `impact`, `confidenceScore`, `relatedSignals`, `category`
- **Three-Tier Discovery Model** (`tierDiscoveryEngine.ts`): Structural/System/Optimization classification with keyword-based `classifyTier()`, progressive unlock logic (Tier 2 at 5+ structural signals, Tier 3 when redesign system signals exist)
- **Command Deck**: 5 evidence-backed metric cards (Opportunity, Friction, Constraints, Leverage, Risk) with circular gauges, evidence counts, drilldown to Evidence Explorer
- **Discovery Tiers Panel** (`TierDiscoveryPanel.tsx`): Sequential tier progression UI with signal bars, lock/unlock state, manual completion
- **Evidence Explorer** (`EvidenceExplorer.tsx`): Tier filter chips, type filter chips, confidence badges, grouped by pipeline step, sorted by confidence
- **Signal Accumulation**: Bar chart showing real signal counts per pipeline step with breakdown labels
- **Confidence Scoring**: Evidence density-based computation (0-1), corroboration across domains
- **Quality Controls**: Downgrade weak ideas when `relatedSignals < 2`
- **Auto-Recomputation**: 600ms debounced via `useAutoAnalysis()`
- **Insight Graph**: Tiered horizontal layout with path highlighting, zoom levels, node cards

---

## Gaps to Close (3 items)

### 1. Insight Graph — Tier-Based Node Coloring
**Current**: Nodes are colored by type (signal, constraint, etc.) only.
**Required**: Add visual tier rings — Structural nodes get red/amber border, System get amber/blue, Optimization get blue/green — so the graph visually groups by discovery depth.

**File**: `src/components/insight-graph/InsightGraphView.tsx`
- In the custom node renderer, check `node.data.tier` and apply a colored ring/border matching `TIER_META` colors
- Pass tier data through from `insightGraph.ts` node construction

**File**: `src/lib/insightGraph.ts`
- Ensure `InsightGraphNode` includes a `tier` field derived from `classifyTier(node.label)`

### 2. "Explore More Signals" Expansion
**Current**: All signals shown at once per tier — no progressive disclosure cap.
**Required**: Limit visible ideas to 8-12 per tier with an "Explore More Signals" button.

**File**: `src/components/TierDiscoveryPanel.tsx`
- When tier is active, show top 8 insights inline with a count badge
- Add "Explore {remaining} more signals →" button that opens Evidence Explorer filtered to that tier

### 3. Competitor Analog Integration in Evidence Items
**Current**: Competitor scouting exists separately (`CompetitorScoutPanel`) but isn't linked to evidence confidence.
**Required**: When competitor analogs exist for a flipped idea, boost its confidence score and display the reference in Evidence Explorer.

**File**: `src/lib/evidenceEngine.ts`
- In `extractOpportunityEvidence()`, check if flipped ideas have `competitorReferences` and attach them to the evidence item
- In `computeConfidenceScores()`, boost confidence by 0.1 when competitor analogs exist

**File**: `src/components/EvidenceExplorer.tsx`
- Show competitor reference badge on evidence items that have them

---

## Summary

3 targeted changes to achieve full alignment. No architectural restructuring needed — the platform already operates as the directive describes. These are refinements to visual grouping, progressive disclosure, and competitor-evidence linking.

