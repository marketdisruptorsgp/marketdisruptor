

## Analysis Lens System — Default + ETA + Custom

### Overview

Rebuild the existing lens system to support three lens types: Default (current behavior), ETA Acquisition (prebuilt), and Custom (user-defined). Move lens selection to the Start page (before analysis) and show an active lens badge with switcher on results pages.

---

### 1. Database Changes

**No schema changes needed.** The existing `user_lenses` table supports all custom lens fields. The ETA lens is a prebuilt constant — not stored in DB.

---

### 2. ETA Lens — Prebuilt Constant

Create `src/lib/etaLens.ts` with a hardcoded `ETA_LENS` object:

```text
name: "ETA Acquisition Lens"
primary_objective: "Evaluate from ownership and value-creation perspective"
risk_tolerance: "medium"
time_horizon: "3 years"
evaluation_priorities: {
  value_durability: 0.15,
  operational_leverage: 0.12,
  defensibility: 0.12,
  improvement_pathways: 0.12,
  implementation_complexity: 0.10,
  downside_risk: 0.10,
  scalability: 0.10,
  cost_flexibility: 0.10,
  ownership_risk: 0.09
}
constraints: "Do not default to AI/technology solutions. Prioritize: 1) process improvement, 2) pricing/positioning change, 3) structural model change, 4) operational optimization, 5) technology enablement only if justified."
```

Also export a `type: "default" | "eta" | "custom"` discriminator on the UserLens interface.

---

### 3. Lens Prompt Builder Update (`supabase/functions/_shared/lensPrompt.ts`)

Extend `buildLensPrompt` to handle ETA lens specifically:

- When lens type is ETA, inject ETA-specific prompt rules:
  - ETA evaluation priorities list
  - Output framing: ownership viability, improvement pathway, risk profile, value creation timeline
  - Non-AI bias rule (process > pricing > structural > operational > technology)
  - Mode-specific interpretation (Product/Service/Business)
  - Validation: if a priority cannot be evaluated, label as "not directly measurable with current data"
  - Never fabricate ownership conclusions
- When lens type is Custom, use existing custom prompt logic
- When Default, return empty string (unchanged)

---

### 4. LensToggle Redesign (`src/components/LensToggle.tsx`)

Rebuild to support 3 options:
- **Default** — dot indicator, "Explore possibilities"
- **ETA** — prebuilt, "Acquisition & ownership lens"
- **Custom** — user's saved lenses with create/edit/delete

Dropdown shows all three categories. Active lens shows as a pill badge.

---

### 5. Start Page Integration (`src/components/StartPageLayout.tsx`)

Add `<LensToggle />` below the mode header and above the form, inside the card. This is the primary lens selection point — users pick their lens before running analysis.

---

### 6. Context Changes (`src/contexts/AnalysisContext.tsx`)

Update UserLens type import to include a `lensType` discriminator (`"default" | "eta" | "custom"`). The ETA lens is set via `setActiveLens(ETA_LENS)` — same mechanism as custom lenses. No new context fields needed.

---

### 7. LensEditor Update (`src/components/LensEditor.tsx`)

Minor: ensure custom lenses get `lensType: "custom"` tag. No other changes needed — the editor already handles all custom lens fields.

---

### 8. LensOnboarding Update (`src/components/LensOnboarding.tsx`)

Update copy to mention all three lens types. Add a brief description of ETA lens alongside the "Create Custom Lens" CTA.

---

### 9. Edge Function Integration

All 6 edge functions already accept and inject lens data via `buildLensPrompt`. The only change is in the shared `lensPrompt.ts` to handle ETA-specific prompt injection with:
- ETA priorities and framing rules
- Mode-specific interpretation (the `mode` field is already passed in request bodies)
- Non-AI bias enforcement
- Limitation labeling for unsupported evaluations

---

### Files to Create
- `src/lib/etaLens.ts`

### Files to Edit
- `src/components/LensToggle.tsx` — rebuild for 3-way selection
- `src/components/LensEditor.tsx` — add lensType tag
- `src/components/LensOnboarding.tsx` — update copy for 3 lens types
- `src/components/StartPageLayout.tsx` — add LensToggle before form
- `supabase/functions/_shared/lensPrompt.ts` — ETA prompt injection + mode-specific rules

