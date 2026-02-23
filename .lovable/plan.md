# No I don't just want to insert the name of the product in the first principles questions. I want to know if you can dynamically change the questions based on whatever product you're analyzing or do we have to keep these questions? 

Don't just apply the exec design system to direct area  it should be enforced in all steps, sections, etc across the entire app/project components to ensure consistency 

# UI Overhaul: Design System Compliance, Dynamic Questions, Mobile Fix & Multi-Page Navigation

## Overview

Four changes: enforce the executive design system, make first-principles section labels dynamic per product, fix the mobile step label, and restructure the app from a single-page flow into a true multi-page experience with dedicated routes.

---

## 1. Design System Compliance (FirstPrinciplesAnalysis.tsx)

The Disrupt step tabs violate several design guidelines:

**Current violations:**

- `rounded-xl` on step buttons, cards, and inputs (should be `rounded` / 4px)
- `scale(1.03)` transform on active step buttons (no scaling allowed)
- `animate-pulse` on "Explore" badges (no bounce/pulse animations)
- `boxShadow` glow effects on step buttons (restrained shadows only)
- `rounded-2xl` on the pre-analysis icon container
- `rounded-full` on "Explore" badge (should be `rounded`)
- `hover:scale-[1.02]` on "Next" buttons

**Fixes:**

- Replace all `rounded-xl` / `rounded-2xl` with `rounded` (4px via --radius)
- Remove `transform: scale(1.03)` and `hover:scale-[1.02]`
- Replace `animate-pulse` with static visibility
- Remove colored `boxShadow` glow effects, use only `var(--shadow-card)` patterns
- Replace `rounded-full` badges with `rounded`

These same fixes apply throughout all cards and buttons in FirstPrinciplesAnalysis.tsx and related components.

---

## 2. Dynamic, Product-Specific Section Labels

**Problem:** The Physical Form section always shows generic labels like "Why This Size?", "Why This Weight?", "Why This Form Factor?", "Static vs Dynamic" regardless of what product is being analyzed.

**Solution:** Make labels contextual by interpolating the product name:

```text
Before: "Why This Size?"
After:  "Why Is [Water Fountain] This Size?"

Before: "Why This Weight?"  
After:  "Why Does [Water Fountain] Weigh This Much?"

Before: "Why This Form Factor?"
After:  "Why Is [Water Fountain] Shaped This Way?"

Before: "Static vs Dynamic"
After:  "Is [Water Fountain] Too Rigid?"
```

This applies to all analysis sections (Core Reality, Workflow, Smart Tech, etc.) where static template labels can be made product-aware. The edge function already generates product-specific content -- it's only the UI labels that are templated.

**Files:** `src/components/FirstPrinciplesAnalysis.tsx`

---

## 3. Mobile Step 4 Label: "Stress" to "Test"

**Current:** StepNavigator shows "Stress" on mobile for step 4
**Fix:** Change to "Test" on mobile (the full "Stress Test" shows on wider screens)

**File:** `src/components/StepNavigator.tsx` line 43

---

## 4. Multi-Page Navigation Architecture

**Current:** Everything lives in a single `Index.tsx` (2035 lines) with conditional rendering based on state variables. No URL changes as users move through steps.

**Proposed route structure:**

```text
/                          -- Dashboard (mode selection + input form)
/analysis/:id/report       -- Step 2: Intelligence Report
/analysis/:id/disrupt      -- Step 3: Disrupt Analysis
/analysis/:id/stress-test  -- Step 4: Stress Test
/analysis/:id/pitch        -- Step 5: Pitch Deck
/business/:id              -- Business Model results (all steps)
/pricing                   -- Pricing (existing)
/share                     -- Share (existing)
```

**How it works:**

- After analysis completes, navigate to `/analysis/:id/report` (using a generated ID or timestamp)
- Analysis data is stored in a React context (`AnalysisContext`) that persists across pages
- Each step is its own page component, loaded from its own route
- The StepNavigator becomes a real navigation bar with `<Link>` elements
- Loading a saved project navigates to its report page
- Browser back/forward works naturally
- Each page can be bookmarked/shared

**New files:**

- `src/contexts/AnalysisContext.tsx` -- shared state provider (products, params, business data, stress test data)
- `src/pages/DashboardPage.tsx` -- mode selection + analysis form (extracted from Index.tsx)
- `src/pages/ReportPage.tsx` -- Intelligence Report step
- `src/pages/DisruptPage.tsx` -- Disrupt analysis step
- `src/pages/StressTestPage.tsx` -- Stress Test step
- `src/pages/PitchPage.tsx` -- Pitch Deck step
- `src/pages/BusinessResultsPage.tsx` -- Business model results

**Modified files:**

- `src/App.tsx` -- add new routes
- `src/pages/Index.tsx` -- gutted down to redirect to DashboardPage
- `src/components/StepNavigator.tsx` -- use `<NavLink>` instead of buttons

**Data flow:**

- `AnalysisContext` wraps all analysis routes
- On analysis completion, context stores results and router navigates to report
- Each page reads from context; if context is empty (direct URL visit), redirects to dashboard
- Saved analyses load into context then navigate to the appropriate page

---

## Implementation Order

1. Fix mobile step label (quick, isolated)
2. Apply design system fixes across FirstPrinciplesAnalysis.tsx
3. Make section labels dynamic/product-specific
4. Build AnalysisContext and extract pages from Index.tsx
5. Update App.tsx routes and StepNavigator navigation
6. Test full flow end-to-end