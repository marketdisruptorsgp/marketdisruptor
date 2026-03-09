

## Thesis Quality Audit: Building an Evaluation Framework

### The Core Discovery

After investigating the database and codebase, I found a critical gap that actually blocks the evaluation you're proposing: **deepened theses are never persisted to the database**. They're computed in-memory during each session via `useAutoAnalysis` → `runStrategicAnalysisAsync` → `deepenOpportunitiesAsync`, but when the page is refreshed or the analysis is revisited, they're recomputed from scratch (or lost entirely).

This means:
- There are **zero historical thesis outputs** stored in `analysis_data` across all 20+ saved analyses
- We cannot retroactively sample and classify past outputs
- Every analysis visit re-runs the strategic engine, but the thesis deepening results evaporate

### What I Propose Instead (Two-Part Plan)

**Part 1: Persist thesis outputs so we can actually audit them**

Modify `useAutoAnalysis` (or the analysis context's step-save flow) to persist the strategic engine's full output — structural profile, qualified patterns, and deepened opportunities — into `analysis_data` under a `strategicEngine` key when the engine completes.

This would store:
- `analysis_data.strategicEngine.structuralProfile` — the 10-dimension profile
- `analysis_data.strategicEngine.qualifiedPatterns` — which patterns passed qualification and why
- `analysis_data.strategicEngine.deepenedOpportunities` — the actual thesis outputs
- `analysis_data.strategicEngine.pipelineEvents` — the event log (e.g., "AI gate PASSED", "12 evidence objects")
- `analysis_data.strategicEngine.computedAt` — timestamp

**Part 2: Build a lightweight admin audit view**

Create an admin-only page (e.g., `/admin/thesis-audit`) that:
- Queries all analyses where `analysis_data.strategicEngine` exists
- Displays a table with: title, analysis type, evidence count, constraint count, AI vs deterministic, thesis reconfiguration labels
- Lets you tag each thesis as: **structural reconfiguration** / **solid conventional** / **generic pattern**
- Shows the full causal chain, economic mechanism, and first move inline for quick review
- Aggregates stats: % generic vs structural, correlation with evidence count, correlation with operator lens presence

### Technical Details

**Persistence change** — in `src/hooks/useAutoAnalysis.ts`, after `applyResult()` succeeds, call `saveStepData("strategicEngine", { structuralProfile, qualifiedPatterns, deepenedOpportunities, pipelineEvents, computedAt })`. The existing `merge_analysis_step` RPC handles the JSONB merge atomically.

**Audit page** — a new route `/admin/thesis-audit` with a single component that:
1. Fetches `saved_analyses` rows where `analysis_data->'strategicEngine'` is not null
2. Renders a sortable/filterable table
3. Stores classification tags in a local state (or a new `thesis_audit_tags` column if we want persistence)

**No schema changes needed** — everything fits within the existing `analysis_data` JSONB column.

### Why This Matters Before Prompt Changes

Without persisted outputs, any prompt changes would be evaluated anecdotally ("I ran one analysis and it felt better"). With persisted outputs + the audit view, you can:
- Run 10-20 analyses across different business types
- Classify the outputs systematically
- Identify whether the issue correlates with evidence quality, constraint detection, pattern qualification, or the AI prompt itself
- Make targeted prompt changes and compare before/after

### Files to Create/Modify

| File | Change |
|------|--------|
| `src/hooks/useAutoAnalysis.ts` | Add `saveStepData` call after engine completes |
| `src/pages/ThesisAuditPage.tsx` | New admin audit dashboard |
| `src/App.tsx` | Add route for `/admin/thesis-audit` |

