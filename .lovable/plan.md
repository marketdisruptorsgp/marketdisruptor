── INSTRUCTION PRECEDENCE ──

When directives conflict, obey this priority order:

1. Anti-default safeguards

2. Mode-specific leverage rules

3. Constraint-driven reasoning process

4. Decision-first output standard

5. Visual representation rules

6. Distillation requirements

Output formatting must never override causal validity.

Visual clarity must never introduce speculative structure.  
  
Visual requirement applies only to:

• constraints

• causal chains

• leverage mechanisms

• system structures

• tradeoffs

Observations, assumptions, and uncertainties do not require visual mapping.  
  
  
Reasoning Framework v3: Decision-Grade Output Engine

### What This Changes

Upgrade the reasoning framework in `reasoningFramework.ts` to enforce **decision-first output standards**, **progressive disclosure**, **visual-first representation**, and two new output schemas (`VISUAL_SPEC_SCHEMA`, `ACTION_PLAN_SCHEMA`). This is purely a prompt-layer upgrade — no frontend or JSON schema changes.

### Current State

The existing framework (v2) has the 9-step adaptive analysis process, anti-default safeguards, lens integration, scoring calibration, and quality standard. It tells the AI **how to reason** but not **how to structure output for decision usability**.

### What v3 Adds

Seven new directives layered onto the existing 9-step process:

1. **Primary Operating Principles** — 7 rules (constraint-driven innovation, causal analysis, visual translatability, executive-consumable default, progressive depth, structure > coverage, fewer high-confidence insights)
2. **Decision-First Output Standard** — default responses highlight only system-limiting constraints, ranked leverage, simplest viable redesign, explicit uncertainty
3. **Progressive Disclosure Model** — 3 levels: L1 Executive Signal (default), L2 Structural Explanation, L3 Evidence & Validation
4. **Visual-First Representation Rule** — every insight must map to: constraint map, causal chain, leverage hierarchy, system model, flow structure, impact pathway, or tradeoff matrix
5. **Distillation Requirements** — 1 insight = 1 structural idea, no redundancy, no filler, 60-second comprehension target
6. **Visual Spec Schema** — structured spec for programmatic rendering (visual_type, entities, relationships, layout_logic, interpretation_guide, priority_highlights)
7. **Action Plan Schema** — structured intervention format (initiative_name, objective, leverage_type, mechanism_of_change, risk_profile, validation_strategy, decision_readiness 1-5)

### Implementation Plan

**File 1: `supabase/functions/_shared/reasoningFramework.ts**`

Expand the `REASONING_FRAMEWORK` constant to add the 7 new directive blocks **after** the existing quality standard section but **before** the closing `END INTERNAL FRAMEWORK` line. The existing 9-step process, anti-default safeguards, lens integration, and scoring calibration remain untouched.

New sections added (in order):

- `── PRIMARY OPERATING PRINCIPLES ──`
- `── DECISION-FIRST OUTPUT STANDARD ──`
- `── PROGRESSIVE DISCLOSURE MODEL ──`
- `── VISUAL-FIRST REPRESENTATION RULE ──`
- `── DISTILLATION REQUIREMENTS ──`
- `── VISUAL_SPEC_SCHEMA ──`
- `── ACTION_PLAN_SCHEMA ──`

Each section is transcribed directly from the user's specification with no interpretation changes.

**Estimated prompt size increase**: ~120 lines added to existing ~125 lines. Total framework ~245 lines.

### What Does NOT Change

- The 9-step adaptive analysis process (Steps 1-9)
- Anti-default safeguards
- Lens integration rules
- Scoring calibration rules
- Mode enforcement (`modeEnforcement.ts`) — no changes
- Lens prompt (`lensPrompt.ts`) — no changes
- Edge function JSON schemas — output structures stay identical
- Per-function system prompts in edge functions — untouched
- Frontend components — no UI changes
- `getReasoningFramework()` export interface — unchanged

### Files Modified

1. `supabase/functions/_shared/reasoningFramework.ts` — add 7 new directive sections to the `REASONING_FRAMEWORK` constant

### Risk

- Token usage increase ~40-50% on the framework prompt. Monitor for timeout issues on `analyze-products` (already near limits).
- The `VISUAL_SPEC_SCHEMA` and `ACTION_PLAN_SCHEMA` are internal reasoning guidance — they will influence AI thinking but won't force JSON output changes because per-function schemas override. If you later want AI to actually emit these schemas, per-function JSON templates would need updating (separate task).
- Progressive disclosure is prompt guidance only — the frontend doesn't currently have L1/L2/L3 rendering. This plants the seed for future UI work.

### Deploy

All 6 edge functions that import `getReasoningFramework()` will automatically pick up the changes on next deploy: `analyze-products`, `first-principles-analysis`, `generate-flip-ideas`, `critical-validation`, `generate-pitch-deck`, `business-model-analysis`.