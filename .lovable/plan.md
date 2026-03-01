

## Add Structural Visuals to Shareable Analysis Page

### Problem
`ShareableAnalysisPage.tsx` doesn't import or render `StructuralVisualList` or `ActionPlanList`. The Intelligence Report step (step 2) shows product data without any L1 Executive Signal visuals. Steps 3 and 5 already delegate to `FirstPrinciplesAnalysis` and `CriticalValidation` which render visuals internally.

### Changes

**File: `src/pages/ShareableAnalysisPage.tsx`**

1. Add imports for `StructuralVisualList` and `ActionPlanList`
2. In Step 2 (Intelligence Report), render `StructuralVisualList` and `ActionPlanList` immediately after the `ProductCard` — matching the same placement as `ReportPage.tsx` (lines 152-153)
3. The product data already flows from the saved analysis, so `product.visualSpecs` and `product.v3ActionPlans` will render automatically when present, and gracefully return null when absent (backward compatible)

### Implementation Detail
- Insert `<StructuralVisualList specs={(product as any).visualSpecs} />` and `<ActionPlanList plans={(product as any).v3ActionPlans} />` after line 206 (`<ProductCard .../>`)
- No other steps need changes — Disrupt/Stress Test/Pitch already render visuals via their child components

### Files Modified
1. `src/pages/ShareableAnalysisPage.tsx` — add imports + render visuals in step 2

