

# Opportunity Design Engine — Implementation Plan

## What We're Building

A morphological search engine for business models that replaces the current generic Stage 7 (`generateOpportunities`) with a structured design space exploration system. Instead of producing labels like "Resolve X to unlock growth," the engine maps the current business configuration, identifies dimensions worth exploring, generates controlled 1-2 variable shifts, filters through deterministic gates (no scores), and clusters results into opportunity zones.

## Key Architectural Decisions

**No scoring anywhere.** The current `generateOpportunities` uses `impact` and `confidence` numbers. The new engine replaces these with deterministic qualification gates:
1. Evidence gate (≥2 items per dimension, ≥3 for adjacency)
2. Constraint linkage gate (constraint-driven vectors must reference a constraint/leverage ID)
3. Feasibility gate (reject vectors conflicting with regulatory/capability constraints)
4. Redundancy gate (collapse similar shifts using Jaccard similarity on dimension+value pairs)

**Two exploration modes:**
- **Constraint-driven**: Dimensions with associated constraints/leverage points → max 10 vectors
- **Adjacency**: Dimensions with ≥3 evidence but no constraint → max 5 vectors

**Evidence-derived dimensions only.** Dimensions map from the 9 existing evidence categories (`demand_signal`, `cost_structure`, `distribution_channel`, `pricing_model`, `operational_dependency`, `regulatory_constraint`, `technology_dependency`, `customer_behavior`, `competitive_pressure`). No hardcoded business dimensions. If a category has <2 evidence items, that dimension doesn't exist.

## Build Order

### 1. New file: `src/lib/opportunityDesignEngine.ts` (~300 lines)

**Types:**
- `BusinessDimension` — `{ id, name, category (evidence category), currentValue, evidenceIds[], hasConstraint, hasLeverage, evidenceCount }`
- `OpportunityVector` — `{ id, changedDimensions: { dimension, from, to }[], triggerIds[], explorationMode: "constraint" | "adjacency", rationale, evidenceIds[] }`
- `OpportunityZone` — `{ id, theme, vectors: OpportunityVector[], sharedDimensionId }`
- `BusinessBaseline` — `Record<string, BusinessDimension>`

**Deterministic functions:**
- `extractBaseline(flatEvidence, constraints, leveragePoints)` — groups evidence by category, infers current value from most frequent label per category, only populates dimensions with ≥2 evidence
- `identifyActiveDimensions(baseline, constraints, leveragePoints)` — marks dimensions as "hot" (has constraint/leverage) or "warm" (≥3 evidence, no constraint, for adjacency)
- `applyQualificationGates(vectors, constraints, flatEvidence)` — evidence gate → constraint linkage gate → feasibility gate → redundancy gate. No scores. Vectors pass or don't.
- `clusterIntoZones(vectors)` — groups vectors sharing a changed dimension, derives theme label from the shared dimension name
- `generateOpportunityVectors(baseline, activeDimensions, aiAlternatives, constraints, leveragePoints)` — combines baseline with AI-generated alternatives, applies gates, clusters into zones

### 2. New edge function: `supabase/functions/generate-opportunity-vectors/index.ts` (~180 lines)

Uses Lovable AI (`google/gemini-2.5-flash`) with structured tool calling (same pattern as existing `generate-concept-space`).

**Input:** baseline dimensions with current values, hot/warm dimension list, upstream constraint + leverage labels, analysis type.

**Output:** For each active dimension, 2-4 realistic alternative values with brief rationale. The AI generates alternative values only — combination, gating, and clustering are deterministic client-side.

**System prompt enforces:** no scores, alternatives must be concrete operational states (not vague), each alternative needs a one-sentence rationale explaining why it's viable.

### 3. Modify `strategicEngine.ts` Stage 7 (~80 lines changed)

Replace `generateOpportunities()` (lines 677-720) with `generateOpportunityVectors()` that:
1. Calls `extractBaseline()` with flat evidence + constraints + leverage
2. Calls `identifyActiveDimensions()`
3. If ≥2 active dimensions: invokes edge function, then runs deterministic gating + clustering
4. Converts `OpportunityVector[]` → `StrategicInsight[]` with `insightType: "emerging_opportunity"`. Labels become specific deltas (e.g., "Shift pricing from annual to usage-based, triggered by trial friction cluster") instead of generic "Resolve X to unlock growth"
5. Stores vector metadata in a new optional `opportunityVectorData` field on `StrategicInsight`
6. Falls back to current logic if <2 active dimensions

**Critical:** The `StrategicInsight` type gains an optional `opportunityVectorData` field. The existing `impact` and `confidence` fields on generated vectors will use neutral defaults (impact: 5, confidence: 0.5) since downstream stages still reference them — but they won't be surfaced in UI. This preserves pipeline compatibility without introducing new scoring.

### 4. Extend `insightGraph.ts` node type (~40 lines)

- Add `"opportunity_vector"` to `InsightNodeType` union
- Add `opportunityVectorData` to `InsightGraphNode`:
  ```
  opportunityVectorData?: {
    changedDimensions: { dimension: string; from: string; to: string }[];
    baselineSnapshot: Record<string, string>;
    triggerConstraintIds: string[];
    explorationMode: "constraint" | "adjacency";
  }
  ```
- Add entry to `NODE_TYPE_CONFIG` for visual styling
- Add `"opportunity_vector"` to `OPPORTUNITY_NODE_TYPES` array

### 5. Cytoscape rendering (~20 lines)

Opportunity vector nodes display changed dimensions in their detail text (e.g., "Pricing: annual → usage-based"). This surfaces through the existing `InsightNodeCard` component — no new panels needed. The existing "Expand Design Space" button on opportunity nodes continues to trigger concept expansion downstream.

## What Stays Unchanged

- `conceptExpansion.ts` — product-level design space, operates downstream
- `generate-concept-space` edge function — unchanged
- All other strategic engine stages (1-6, 8-11)
- Pipeline thresholds (Stage 7 still requires ≥22 evidence)
- `checkpointGate.ts` — unchanged

## Guardrails Summary

| Gate | Rule | Enforcement |
|------|------|-------------|
| Evidence | ≥2 evidence per dimension (≥3 for adjacency) | `extractBaseline()` excludes under-evidenced dimensions |
| Constraint link | Constraint-driven vectors must reference ≥1 constraint/leverage ID | `applyQualificationGates()` |
| Feasibility | Reject vectors conflicting with `regulatory_constraint` or `operational_dependency` evidence | `applyQualificationGates()` |
| Complexity | Max 2 dimension changes per vector | Enforced in combination step |
| Redundancy | Jaccard >0.7 on dimension+value pairs collapses duplicates | `applyQualificationGates()` |
| Output cap | Max 15 vectors (10 constraint + 5 adjacency) | Hard cap in `generateOpportunityVectors()` |

