
# Remove Nostalgia Mode, Era References, and Fix Analysis Naming

## Overview

Three core changes:

1. **Remove the "Disrupt This Nostalgia" mode entirely** from the tab bar and all related UI/logic -- the platform keeps 3 modes: Product, Service, Business Model
2. **Strip all era-related fields, labels, and descriptions** across every component -- no more "80s", "vintage", "nostalgia triggers", era badges, era dropdowns, era-based context
3. **Use the exact user-typed name** for the analysis title (from the input field), and append version numbers for duplicates instead of AI-generated names

---

## Technical Plan

### File 1: `src/components/AnalysisForm.tsx`
- Remove the `"discover"` entry from `MODE_OPTIONS` array (lines 93-101)
- Remove `ERAS` constant (lines 34-36)
- Remove `era` state variable (line 124) and the Era dropdown from the discover form (lines 279-289)
- Remove the entire `mode === "discover"` form block (lines 265-352) since the mode no longer exists
- Remove `discoverAudience`, `discoverBudget`, `discoverNotes` state (lines 131-133)
- Update the `handleSubmit` to remove the `else` branch for discover mode (lines 165-174)
- The `onAnalyze` callback still accepts `era` param for backward compat but it will always be `"All Eras / Current"`
- Update `Mode` type to remove `"discover"` -- becomes `"custom" | "service" | "business"`

### File 2: `src/pages/Index.tsx`

**Tab bar (lines 629-634):**
- Remove the `"discover"` tab entry (`{ id: "discover", label: "Disrupt This Nostalgia", ... }`)
- Only 3 tabs remain: Product, Service, Business Model

**State/types (line 168):**
- Change `mainTab` type from `"discover" | "custom" | "service" | "business"` to `"custom" | "service" | "business"`
- Remove all `setMainTab("discover")` calls (lines 327, 350)
- Change fallback for loading saved analyses: if `isCustom` just use `"custom"`

**Loading messages (lines 386-406):**
- Remove `${params.era}` from log messages -- just use category
- Remove era references from step messages

**`handleRegenerateIdeas` (line 509):**
- Replace `Focus on ${analysisParams.era} nostalgia and ${analysisParams.category} market trends` with `Focus on ${analysisParams.category} market trends`

**`saveAnalysis` (lines 272-299):**
- Change title logic: use the first product's `customName` (user-typed name) as the title
- For discover/batch mode: keep existing product-name-based logic but strip era from the title
- For duplicates: query existing saved_analyses with the same title and append ` v2`, ` v3`, etc.

**Community Intel nostalgia triggers (lines 1052-1064):**
- Remove the "Nostalgia Triggers" section entirely

**`analysisParams` type and all references:**
- Keep `era` field in the type for backward compatibility but always set to `"All Eras / Current"` and never display it

### File 3: `src/contexts/AnalysisContext.tsx`
- Update `mainTab` type to remove `"discover"` union member (lines 37-38)
- Remove `setMainTab("discover")` fallback logic (lines 463-464)
- Update `handleRegenerateIdeas` to remove nostalgia/era from context string (line 376)

### File 4: `src/components/SavedAnalyses.tsx`
- Remove era display from the SpotlightCard meta row (line 182: `<span>{analysis.era}</span>`)
- Remove era from `deduplicateAnalyses` key (line 71) -- use `category|analysis_type|batch_size` instead

### File 5: `src/components/WelcomeModal.tsx`
- Update slide 2 (lines 24-33): remove era/nostalgia references
  - Change body text from "Enter a category and era" to something like "Enter a product, service, or business model"
  - Remove "Try surprising combos: '80s Fitness', 'Millennial Nostalgia'" tip
  - Update "Let's Discover" button text (line 165) to "Let's Go"

### File 6: `src/data/mockProducts.ts`
- Remove `era` field from all mock product objects
- Remove `nostalgiaTriggers` from `communityInsights` objects
- Clean any remaining nostalgia/vintage language from `trendAnalysis` and `description` fields

### File 7: `src/components/ProductCard.tsx`
- Remove any remaining `era` display (already partially cleaned in prior changes, but verify no references remain)

### File 8: `src/pages/ReportPage.tsx`
- Remove nostalgia triggers section from community intel (same pattern as Index.tsx)
- Remove era display from product header if present

### File 9: Edge functions (backend -- no changes needed)
- The `analyze-products` function still receives `era` but the UI will always send `"All Eras / Current"` which triggers `eraLabel()` to return empty string -- so the AI prompt naturally omits era context
- `nostalgiaTriggers` may still be returned by AI but the UI will simply not render them

---

## Analysis Title Logic (Duplicate Handling)

When saving an analysis, the title will be set as follows:

1. **Custom/Service mode**: Use `customName` exactly as the user typed it (e.g., "Vintage Camera" stays "Vintage Camera")
2. **Business mode**: Use `businessInput.type` exactly as typed
3. **If a saved analysis with the same title already exists**: Query existing titles, find the highest version, and append ` v2`, ` v3`, etc.

This replaces the current logic that auto-generates titles from AI-returned product names.

---

## What Gets Removed

| Item | Where |
|------|-------|
| "Disrupt This Nostalgia" tab | Index.tsx tab bar, AnalysisForm MODE_OPTIONS |
| Era dropdown (70s, 80s, 90s...) | AnalysisForm discover form |
| `ERAS` constant | AnalysisForm |
| Era display in saved analyses | SavedAnalyses |
| "Nostalgia Triggers" section | Index.tsx, ReportPage.tsx community intel |
| Era in loading messages | Index.tsx |
| "nostalgia" in context prompts | Index.tsx, AnalysisContext |
| WelcomeModal era/nostalgia tips | WelcomeModal |
| `era` from mock products | mockProducts.ts |

## What Stays

- Backend `era` field in DB and edge functions (backward compatible, always receives "All Eras / Current")
- The 3 remaining modes: Product, Service, Business Model
- All other analysis pipeline logic unchanged
