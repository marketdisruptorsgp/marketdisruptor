

# Market Disruptor OS — System Prompt & UI Integration

## Overview
Integrate the "Market Disruptor OS" intelligence framework into the platform's edge functions and UI components. This upgrades all AI prompts with data validation labeling, granularity enforcement, and dashboard-ready structured output — while preserving the existing JSON schemas and UI rendering logic.

## What Changes

### 1. Edge Function System Prompt Upgrades

Each edge function gets a new preamble injected before its existing domain-specific instructions. This preamble establishes the Market Disruptor OS identity and rules without breaking existing JSON output schemas.

**Functions to update:**
- `analyze-products` — Intelligence Report generation
- `first-principles-analysis` — Disrupt step (product + service variants)
- `generate-flip-ideas` — Flipped idea generation
- `critical-validation` — Red/Blue team stress testing
- `business-model-analysis` — Business model deconstruction
- `bundle-deep-dive` — Bundle opportunity analysis
- `generate-pitch-deck` — Pitch deck generation

**Preamble content (prepended to each system prompt):**
```
You are Market Disruptor OS — a platform-grade strategic reinvention engine by SGP Capital.

CORE PRINCIPLES:
- First-principles reasoning over analogy or convention
- Decompose every system into at least 3 layers of depth
- Never present modeled or inferred data as verified fact

DATA VALIDATION — Tag all claims:
- [VERIFIED] — From cited public source or user-provided data
- [MODELED] — Derived logically from verified inputs
- [ASSUMPTION] — Logical assumption where no verified data exists
- [DATA GAP] — No reliable source available

OUTPUT RULES:
- Metrics must be ≤12 words
- Include leverage scores (1-10) on key assumptions
- Flag risk levels: [Risk: Low/Medium/High]
- Flag capital requirements: [Capital: Low/Medium/High]
- Use directional indicators: ↑ ↓ → for trends
```

### 2. JSON Schema Extensions

Add new fields to existing JSON structures (backward-compatible — UI gracefully ignores missing fields):

**`first-principles-analysis` additions:**
- `hiddenAssumptions[].leverageScore` (1-10)
- `hiddenAssumptions[].dataLabel` ("[VERIFIED]", "[MODELED]", "[ASSUMPTION]", "[DATA GAP]")
- `redesignedConcept.riskLevel` ("[Risk: Low/Medium/High]")
- `redesignedConcept.capitalRequired` ("[Capital: Low/Medium/High]")

**`critical-validation` additions:**
- `redTeam.arguments[].dataLabel`
- `blueTeam.arguments[].dataLabel`
- `feasibility[].dataLabel`

**`business-model-analysis` additions:**
- `hiddenAssumptions[].leverageScore`
- `hiddenAssumptions[].dataLabel`
- `operationalAudit.frictionPoints[].dataLabel`

**`generate-flip-ideas` additions:**
- `[].dataLabels` object with key claim labels
- `[].riskLevel` and `[].capitalRequired` badges

**`analyze-products` additions:**
- `pricingIntel` fields get `dataLabel` tags
- `marketSizeEstimate` gets a `dataLabel`

### 3. UI Rendering Updates

**New shared component: `DataLabel.tsx`**
A small inline badge that renders `[VERIFIED]`, `[MODELED]`, `[ASSUMPTION]`, `[DATA GAP]` with distinct colors:
- VERIFIED: muted green text
- MODELED: muted blue text  
- ASSUMPTION: muted amber text
- DATA GAP: muted red text

**New shared component: `RiskBadge.tsx`**
Renders `[Risk: Low]`, `[Risk: Medium]`, `[Risk: High]` with appropriate colors.

**New shared component: `LeverageScore.tsx`**
A small inline `[Leverage: 8/10]` indicator.

**Components to update:**
- `FirstPrinciplesAnalysis.tsx` — Show leverage scores on assumptions, data labels on key claims, risk/capital badges on redesigned concept
- `BusinessModelAnalysis.tsx` — Show leverage scores on assumptions, data labels on operational audit items
- `CriticalValidation.tsx` — Show data labels on Red/Blue team arguments
- `FlippedIdeaCard.tsx` — Show risk and capital badges
- `ProductCard.tsx` — Show data labels on pricing intel

### 4. Intelligence Report Enhancement

Update `analyze-products` to explicitly tag pricing data, market size estimates, and competitive intel with data labels. The UI in `Index.tsx` (Step 2 detail tabs) renders these labels inline next to the relevant data points.

---

## Technical Details

### Edge Function Changes (all 7 functions)
Each function's `systemPrompt` string gets the Market Disruptor OS preamble prepended. The existing JSON schema instructions remain — new fields are added as optional extensions. The AI model will include them when present in the prompt but existing parsing won't break if they're missing.

### New UI Components (3 files)
- `src/components/DataLabel.tsx` — ~20 lines, renders tagged inline badges
- `src/components/RiskBadge.tsx` — ~15 lines, renders risk/capital level badges  
- `src/components/LeverageScore.tsx` — ~15 lines, renders leverage score indicator

### Component Updates (5 files)
- `FirstPrinciplesAnalysis.tsx` — Add optional rendering of `leverageScore`, `dataLabel`, `riskLevel`, `capitalRequired`
- `BusinessModelAnalysis.tsx` — Add optional rendering of `leverageScore`, `dataLabel`
- `CriticalValidation.tsx` — Add optional rendering of `dataLabel`
- `FlippedIdeaCard.tsx` — Add `riskLevel` and `capitalRequired` badges
- `ProductCard.tsx` or `Index.tsx` Step 2 section — Add `dataLabel` on pricing intel

### Backward Compatibility
All new JSON fields use optional chaining (`?.`) in the UI. Existing analyses without these fields render exactly as before. New analyses include the enhanced metadata.

### No Breaking Changes
- No database changes
- No new API endpoints  
- No changes to authentication or subscription logic
- Existing saved analyses continue to render correctly

