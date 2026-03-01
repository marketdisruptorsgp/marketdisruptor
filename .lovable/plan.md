

## What the User Shared

A **Mode Routing Engine** that auto-classifies user problem descriptions into product / service / business_model using signal-based text scoring, with LLM fallback for low-confidence cases.

## Current State

- Mode selection is **manual** — user picks from 3 cards on `/analysis/new`
- No text input exists on the mode selection page
- `modeGuards.ts` already has strict mode enforcement and `resolveStrictMode()`
- The `AnalysisForm` already has a notes/description field per mode, but it's on the **next** page (Step 2)
- No auto-routing logic exists anywhere

## Plan

### 1. Create Mode Intelligence Engine utility

New file: `src/lib/modeIntelligence.ts`

Contains the user's code, adapted to match existing type conventions:
- `InnovationMode`, `ModeScore`, `RoutingResult` types
- Signal dictionaries (PRODUCT_SIGNALS, SERVICE_SIGNALS, BUSINESS_MODEL_SIGNALS)
- `scoreText()`, `normalizeScores()`, `routeInnovationMode()`
- `createAnalysisPlan()`, `explainRouting()`
- `analyzeProblem()` master entry point
- `MODE_CLASSIFICATION_PROMPT` and `MODE_EXPLANATION_PROMPT` for future LLM fallback

Map `business_model` ↔ `business` (existing frontend convention) in the adapter layer.

### 2. Add problem description input to NewAnalysisPage

On `/analysis/new` (Step 1: Select Mode), add above the mode cards:
- **Text input** — "Describe your problem or opportunity" textarea (optional)
- When user types ≥15 characters and pauses (debounce 500ms), run `routeInnovationMode()` client-side
- Auto-select the highest-scoring mode card
- Show a **routing explanation banner** below the input:
  - Primary mode highlighted with confidence %
  - Secondary modes mentioned if score > 25%
  - e.g. "Primary constraint detected in **product** (62%) with contributing factors in **service**."
- User can still manually override by clicking a different card — the explanation banner updates to note the override
- If no text entered, manual selection works exactly as today (no regression)

### 3. Pass routing context downstream

- Store `RoutingResult` in `AnalysisContext` as new optional field `modeRouting: RoutingResult | null`
- When user continues to Step 2, the routing reasoning is available for the analysis form's notes field (pre-populated context)
- Edge functions can receive the routing metadata for mode enforcement validation

### 4. Low-confidence LLM fallback (display only)

When `confidence < 0.45` (no mode dominates):
- Show a subtle "Low confidence — consider adding more detail" hint below the explanation
- No LLM call on this page — keep it instant. The `MODE_CLASSIFICATION_PROMPT` is available for future backend integration

### 5. Visual treatment

- Textarea styled with existing `input-executive` class
- Routing banner uses mode accent colors from `--mode-product`, `--mode-service`, `--mode-business` CSS vars
- Confidence shown as a small inline badge
- Secondary modes shown as muted text
- Smooth transition when auto-selection changes (card border animates)

### Technical Details

**Signal scoring** runs purely client-side — zero latency, no API calls. The text scoring engine is ~50 lines of deterministic logic.

**Type mapping**: `business_model` (engine) ↔ `business` (frontend) handled by a simple adapter in the utility, consistent with `resolveStrictMode()` in `modeGuards.ts`.

**No breaking changes**: textarea is optional, all existing manual-select behavior preserved. `modeRouting` field defaults to `null`.

