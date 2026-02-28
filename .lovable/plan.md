  
NODE TYPE → VISUAL STYLE

constraint → high contrast border

effect → neutral

leverage → emphasized

intervention → action color

outcome → success tone  
Surface v3 Visual Specs & Action Plans in UI

### Problem

The reasoning framework tells the AI to think in structural visuals and action plans, but the per-function JSON schemas don't include these fields — so the AI can't output them. And the frontend has no renderers for them.

### Scope

Start with `business-model-analysis` as proof of concept, then extend to the remaining 4 pipeline functions.

### Implementation

**1. Create `StructuralVisual` renderer component**
New file: `src/components/StructuralVisual.tsx`

Renders visual specs from AI output. Supports these diagram types using pure CSS/HTML (no charting library needed):

- `constraint_map` — nodes with directed edges showing friction → constraint → impact
- `causal_chain` — linear left-to-right flow with arrows
- `leverage_hierarchy` — vertical ranked list with priority indicators

Each node shows: label, type badge (constraint/effect/leverage/intervention/outcome), priority level.
Edges rendered as labeled arrows between nodes.
Interpretation guide shown as a one-line subtitle.

**2. Create `ActionPlanCard` component**
New file: `src/components/ActionPlanCard.tsx`

Renders a single action plan with:

- Initiative name (title)
- Leverage type badge (optimization / structural / redesign)
- Mechanism of change (one-liner)
- Implementation complexity + time horizon
- Decision readiness score (1–5 visual dots)
- Expandable: risk profile, validation strategy, dependencies (using existing `DetailPanel`)

**3. Update `business-model-analysis` edge function JSON schema**
File: `supabase/functions/business-model-analysis/index.ts`

Add two new top-level fields to the JSON template:

```
"visualSpecs": [
  {
    "visual_type": "constraint_map | causal_chain | leverage_hierarchy",
    "title": "...",
    "purpose": "...",
    "nodes": [{ "id": "...", "label": "...", "type": "constraint|effect|leverage|intervention|outcome", "priority": 1|2|3 }],
    "edges": [{ "from": "...", "to": "...", "relationship": "causes|relaxed_by|implemented_by|produces", "label": "..." }],
    "layout": "linear | vertical | hierarchical",
    "interpretation": "One sentence"
  }
],
"actionPlans": [
  {
    "initiative": "...",
    "objective": "...",
    "leverage_type": "optimization | structural_improvement | redesign",
    "mechanism": "...",
    "complexity": "low | medium | high",
    "time_horizon": "near_term | mid_term | long_term",
    "risk": { "execution": "...", "adoption": "...", "market": "..." },
    "validation": "...",
    "decision_readiness": 1-5,
    "confidence": "high | medium | exploratory"
  }
]
```

Add prompt instruction: "Generate 1-2 visual specs for the dominant constraint structure. Generate 2-3 action plans for highest-leverage interventions."

**4. Update `BusinessModelAnalysis.tsx` frontend**
File: `src/components/BusinessModelAnalysis.tsx`

- Add `visualSpecs` and `actionPlans` to the `BusinessModelAnalysisData` interface
- Render `StructuralVisual` components at top of the "Business Reality" tab (before text content) — this is the L1 Executive Signal
- Render `ActionPlanCard` components in the "Reinvented Model" tab alongside the implementation roadmap
- Both use progressive disclosure: visual + one-line takeaway visible by default, details in `DetailPanel`

**5. Extend to remaining 4 edge functions**
Same pattern — add `visualSpecs` and `actionPlans` to JSON schemas in:

- `first-principles-analysis/index.ts`
- `critical-validation/index.ts`
- `generate-flip-ideas/index.ts`
- `generate-pitch-deck/index.ts`

Update corresponding frontend components:

- `FirstPrinciplesAnalysis.tsx` — visual in "reality" tab
- `CriticalValidation.tsx` — visual in "debate" tab
- (flip-ideas and pitch-deck render through existing components)

### Files Created

1. `src/components/StructuralVisual.tsx`
2. `src/components/ActionPlanCard.tsx`

### Files Modified

1. `supabase/functions/business-model-analysis/index.ts` — add visual/action schema
2. `src/components/BusinessModelAnalysis.tsx` — render new fields
3. `supabase/functions/first-principles-analysis/index.ts` — add visual/action schema
4. `supabase/functions/critical-validation/index.ts` — add visual/action schema
5. `supabase/functions/generate-flip-ideas/index.ts` — add visual/action schema
6. `supabase/functions/generate-pitch-deck/index.ts` — add visual/action schema
7. `src/components/FirstPrinciplesAnalysis.tsx` — render new fields
8. `src/components/CriticalValidation.tsx` — render new fields

### Risk

- Token increase ~10-15% per function from expanded JSON schema
- AI may not always populate visual specs if constraints aren't clear — components handle empty/missing gracefully
- Backward compatible: existing saved analyses without these fields still render normally