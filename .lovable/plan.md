

# Evidence-Driven Strategic Discovery Engine — Implementation Plan

## Current State

The platform already has:
- **Evidence Engine** (`src/lib/evidenceEngine.ts`) with `Evidence` objects containing `tier: "structural" | "system" | "optimization"` and `pipelineStep` tracing
- **Evidence Explorer** (`src/components/EvidenceExplorer.tsx`) with drilldown by domain
- **Command Deck** with 5 metric cards, signal accumulation, opportunity table, insight graph preview
- **Auto-Analysis Engine** with 600ms debounce recomputation
- **Insight Graph** with typed nodes (signal, constraint, assumption, leverage_point, concept, risk) and relationship edges
- **Command Deck Metrics** aggregating signal counts from all 5 pipeline steps

The tier model (`structural | system | optimization`) already exists in the Evidence types. The main gaps are: tier-aware UI, progressive tier unlocking, tier classification of ideas, confidence scoring on evidence, and filtering in the Evidence Explorer.

---

## Architecture Changes

### 1. Extend Evidence Engine with Confidence + Related Signals

**File: `src/lib/evidenceEngine.ts`**

Add `confidenceScore` (0-1) and `relatedSignals` fields to the `Evidence` interface. Compute confidence based on evidence density (how many corroborating signals exist in the same domain). Add a `classifyTier()` function that inspects idea content keywords to assign tier automatically:
- Revenue/ownership/platform/network → structural
- Logistics/operations/fulfillment/supply → system  
- UX/features/messaging/marketing → optimization

Add tier-level aggregation: `extractTierSummary(evidence) → { structural: Evidence[], system: Evidence[], optimization: Evidence[] }`.

### 2. Create Tier Discovery Engine

**New file: `src/lib/tierDiscoveryEngine.ts`**

Core logic:
- `TierState` type: `{ activeTier: 1|2|3, tierUnlocked: [true, boolean, boolean], signals: { tier1: Evidence[], tier2: Evidence[], tier3: Evidence[] } }`
- `computeTierState(allEvidence)`: counts signals per tier, determines unlock status
  - Tier 2 unlocks when tier 1 structural signals ≥ 5 OR user manually confirms
  - Tier 3 unlocks when tier 2 system signals exist from redesign step
- `getTierInsights(tier, evidence, limit=12)`: returns top insights for a tier sorted by confidence, capped at 12
- Tier metadata constants (names, narratives, colors)

### 3. Add Tier Progression UI to Command Deck

**File: `src/pages/CommandDeckPage.tsx`**

Insert a **new Zone between Zone 1 and Zone 2**: "Discovery Tiers" panel.

```text
┌─────────────────────────────────────────────────┐
│  TIER 1 — Structural     ██████████  12 signals │  ← active
│  Rethinking the foundation                      │
├─────────────────────────────────────────────────┤
│  TIER 2 — System         🔒 locked              │  ← locked
│  Reengineering the operating system             │
├─────────────────────────────────────────────────┤
│  TIER 3 — Optimization   🔒 locked              │  ← locked
│  Optimizing execution                           │
└─────────────────────────────────────────────────┘
```

- Clicking an unlocked tier filters the entire Command Deck (metrics, opportunities, evidence explorer) to show only that tier's data
- Locked tiers show unlock conditions ("Need 5+ structural signals" or "Confirm exploration complete")
- "Mark Tier Complete" button on active tier to manually unlock next
- Store active tier in component state (no persistence needed — resets per session)

### 4. Enhance Evidence Explorer with Tier + Type Filters

**File: `src/components/EvidenceExplorer.tsx`**

Add filter controls at top of the sheet:
- **Tier filter**: Structural | System | Optimization (toggle chips)
- **Type filter**: assumption | signal | constraint | opportunity | risk | leverage (multi-select chips)
- Sort by confidence score (descending) when available
- Show confidence badge on each evidence item

### 5. Add Confidence Scoring to Evidence Items

**File: `src/lib/evidenceEngine.ts`**

After extracting all evidence, run a confidence pass:
- Items with `impact >= 7` and corroborating signals in related domains → confidence 0.8-1.0
- Items with moderate support → 0.5-0.7
- Items with no corroboration → 0.3-0.5
- Items below confidence 0.3 get flagged as "low confidence" in UI

### 6. Tier-Aware Opportunity Table

**File: `src/pages/CommandDeckPage.tsx` (OpportunityTable)**

Add a "Tier" column showing structural/system/optimization badge per opportunity. When a tier filter is active, only show opportunities matching that tier. Add confidence column using the new confidence scores.

### 7. Insight Graph Tier Coloring

**File: `src/pages/InsightGraphPage.tsx` / `src/components/insight-graph/InsightGraphView.tsx`**

Add tier-based visual grouping:
- Structural nodes: red/amber ring
- System nodes: blue ring  
- Optimization nodes: green ring
- Edge rendering already exists; just needs tier metadata on nodes

### 8. Quality Controls

**File: `src/lib/tierDiscoveryEngine.ts`**

`downgradeWeakIdeas(ideas, evidence)`:
- If `evidenceCount < 2` → mark confidence as "low"
- If no competitor analog exists → reduce confidence by 0.2
- Display confidence badge on every idea card

---

## File Change Summary

| File | Action |
|------|--------|
| `src/lib/evidenceEngine.ts` | Extend `Evidence` with `confidenceScore`, `relatedSignals`, `category`. Add `classifyTier()`, confidence computation pass |
| `src/lib/tierDiscoveryEngine.ts` | **New** — Tier state machine, unlock logic, tier filtering, quality controls |
| `src/pages/CommandDeckPage.tsx` | Add Tier Discovery panel (new zone), tier-filtered metrics, tier column in opportunity table |
| `src/components/EvidenceExplorer.tsx` | Add tier/type filter chips, confidence badges, sort by confidence |
| `src/hooks/useAutoAnalysis.ts` | No changes needed — already recomputes on data change with 600ms debounce |
| `src/lib/commandDeckMetrics.ts` | Add optional `tierFilter` parameter to `computeCommandDeckMetrics()` to scope counts to a specific tier |

---

## What This Does NOT Change

- Pipeline steps remain the same 5-step sequence
- Existing edge functions untouched
- No database changes required
- No new API calls — all computation is client-side from existing pipeline data
- Insight Graph engine structure preserved; only adds tier metadata to node rendering

