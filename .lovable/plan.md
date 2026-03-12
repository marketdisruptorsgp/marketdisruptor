

# Phase 5+6: Slim concept-synthesis + Add Guardrails

## What changes

### Phase 5 — Slim the prompt (fix JSON truncation)

**Problem**: The prompt requests ~16 fields per concept including `persona_fit` (3 nested objects), `performer_network` (2-3 array items), `system_architecture` (5 nodes + edges), and `breakthrough_metric`. This bloats output to 16K+ tokens, causing frequent truncation.

**Frontend safety**: All four fields are already optional (`?`) in `types.ts` and conditionally rendered in `ConceptExplorer.tsx`. Removing them from generation won't break the UI — those sections simply won't render until `engineering-deepen` populates them later.

**Changes to `supabase/functions/concept-synthesis/index.ts`**:

1. **Remove from system prompt** (lines 236-240): Delete the instructions for `breakthrough_metric`, `performer_network`, `system_architecture`, and `persona_fit`. Remove the `personaInstructions` variable and `PERSONA_LENSES` constant.

2. **Remove from user prompt JSON schema** (line 256): Strip `persona_fit`, `breakthrough_metric`, `performer_network`, `system_architecture` from the schema example.

3. **Remove default-fill logic** (lines 341-362): Delete the fallback blocks that pad `persona_fit`, `breakthrough_metric`, `performer_network`, and `system_architecture` with generic defaults. These produced misleading data anyway.

4. **Reduce `max_tokens`** from 16000 to 8000 (line 285) — the slimmed schema needs roughly half the tokens.

### Phase 6 — Validation guardrails + dedup

Add two post-processing steps after JSON parse, before returning:

1. **Causal trace validation**: Each concept must have `origin.structural_driver`, `origin.assumption_flipped`, and `origin.enabling_mechanism` as non-empty strings. Concepts missing any of these get logged as warnings and receive a `_causal_incomplete: true` flag (not rejected — preserved but flagged).

2. **Deduplication**: Compute Jaccard similarity on concept `description` fields (word-level). If two concepts exceed 0.7 similarity, drop the shorter one and log. This prevents the AI from generating near-identical concepts with different names.

3. **Minimum concept count guard**: If after dedup fewer than 2 concepts remain, log a warning but return what we have (don't fail).

**All changes are in one file**: `supabase/functions/concept-synthesis/index.ts`. No frontend changes needed. No deletions.

