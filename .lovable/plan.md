Stop identifying constraints when:

• additional constraints do not change leverage decisions OR

• dominant outcome drivers are explained  
  
Every relevant friction MUST be assigned Tier 1, 2, or 3.

Redesign decisions may reference only Tier 1 or Tier 2.  
  
Technology may only be proposed if:

• a Tier 1 constraint requires capability change AND

• non-technical interventions cannot remove it  
  
Add to mode guard:

Product → artifact change  
Service → flow change  
Business → value engine change

Every constraint should connect to one of these:

• cost  
• time  
• adoption  
• scale  
• reliability  
• risk

For each leverage point, state confidence level and what evidence would change it.  
  
Reasoning Framework Upgrade: Constraint-Driven Reinvention Engine

### What This Changes

Replace the current 6-part reasoning framework in `reasoningFramework.ts` with the constraint-driven adaptive analysis process you provided. This is the hidden prompt layer injected into all 5 edge functions.

### Current State

The existing `reasoningFramework.ts` has 6 sections:

1. Harvard-Style Structured Reasoning
2. Deep First-Principles Validation
3. Market Desirability Test
4. Anti-Tech-Default Rule
5. Realism Constraint + Score Calibration
6. Output Quality Filters

These are **heuristic guidelines** — they tell the AI what to think about but not **in what order** or **how to connect conclusions**. The process is flat: all 6 run in parallel with no dependency chain.

### What the New Framework Adds

The new framework is **sequential and causal** — each step feeds the next:

1. **Domain Confirmation** → locks the system type
2. **Objective Definition** → defines success independent of current solution
3. **First-Principles Decomposition** → separates constraints from assumptions (with a stopping rule)
4. **Friction Discovery** → wide exploratory scan
5. **Friction Relevance Qualification** → Tier 1/2/3 classification (only Tier 1-2 drive redesign)
6. **Constraint Mapping** → causal chains: friction → constraint → system impact
7. **Mode-Specific Structural Analysis** → dedicated evaluation dimensions per mode
8. **Leverage Identification** → classify as optimization / structural improvement / system redesign
9. **Solution Generation** → constraint-driven only, with explicit transformation tools

Plus three cross-cutting rules:

- **Anti-Default Safeguards** (technology requires causal necessity)
- **Lens Integration** (reweight based on active lens)
- **Quality Standard** (clarity > completeness, causality > creativity)

### Implementation Plan

**Step 1: Replace `reasoningFramework.ts**`

Rewrite the `REASONING_FRAMEWORK` constant with the new 9-step adaptive analysis process, anti-default safeguards, lens integration rules, and quality standard. Keep the same export interface (`getReasoningFramework()`).

**Step 2: Update `modeGuardPrompt` in `modeEnforcement.ts**`

Align the mode guard prompt to reference the new Step 7 dimensions. Currently it lists allowed/blocked domains. Enhance it to include the mode-specific structural analysis dimensions from the new framework (e.g., Product: physical limits, manufacturability, cost drivers, usability burden, dependency structure).

**Step 3: Add `getModeGuardPrompt()` to `business-model-analysis**`

This is a known gap — the business-model-analysis edge function currently imports `getReasoningFramework` and `buildLensPrompt` but not `getModeGuardPrompt`. Add mode enforcement to match the other pipeline functions.

**Step 4: Preserve existing score calibration**

The current score calibration rules (5-6 default, burden of proof for ≥8, long-horizon cap at 6) are embedded in individual edge function prompts, not just the framework. These stay. The new framework's quality standard complements rather than replaces per-function calibration.

### What Does NOT Change

- **Edge function JSON schemas** — output structures stay identical
- `**modeEnforcement.ts` data filtering** — capability matrix and `filterInputData` untouched
- `**lensPrompt.ts**` — lens injection logic unchanged
- **Per-function system prompts** — the OS_PREAMBLE, persona descriptions, and JSON templates in each edge function remain
- **Frontend components** — no UI changes

### Technical Detail

The new framework is ~120 lines of prompt text, replacing ~100 lines. It injects via the same `getReasoningFramework()` call already used by all 5 edge functions:

- `analyze-products` (line 94)
- `business-model-analysis` (line 21)
- `generate-flip-ideas` (line 27)
- `critical-validation` (line 26)
- `generate-pitch-deck` (line 26)

`first-principles-analysis` does NOT currently import `getReasoningFramework` — it uses its own inline preamble. This should also be updated to import the shared framework for consistency.

### Files Modified

1. `supabase/functions/_shared/reasoningFramework.ts` — full rewrite of prompt constant
2. `supabase/functions/_shared/modeEnforcement.ts` — enhance `getModeGuardPrompt()` with mode-specific structural dimensions
3. `supabase/functions/business-model-analysis/index.ts` — add `getModeGuardPrompt` import and injection
4. `supabase/functions/first-principles-analysis/index.ts` — add `getReasoningFramework()` import and injection

### Risk

Prompt changes affect all AI output quality. The new framework is more structured and sequential, which should improve consistency, but may increase token usage by ~15-20%. Monitor for:

- Longer response times
- Any change in score distributions
- Whether the tiered friction classification actually manifests in output