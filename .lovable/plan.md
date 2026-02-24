

# Global Scroll-to-Top + Portfolio Intelligence Rebuild

---

## 1. Global Scroll-to-Top Provider

**New file: `src/components/ScrollToTopProvider.tsx`**
- A component that uses `useLocation()` from react-router-dom
- On every `pathname` change, calls `window.scrollTo({ top: 0, behavior: "smooth" })`
- Renders `children` passthrough (no DOM output)

**Edit: `src/App.tsx`**
- Import `ScrollToTopProvider`
- Place it inside `<BrowserRouter>` wrapping `<AuthProvider>` and everything below it
- This ensures every route change auto-scrolls to top globally

**Edit: `src/components/StepNavigator.tsx`**
- Import and call `scrollToTop()` inside the `onStepChange` button click handler

**Edit: `src/components/SectionNav.tsx`**
- Import and call `scrollToTop()` in `NextStepButton` and `NextSectionButton` click handlers

**Edit: `src/components/PlatformNav.tsx`**
- Import and call `scrollToTop()` after each `navigate()` call in desktop and mobile nav links

**Existing `src/utils/scrollToTop.ts`** stays as-is -- already exports the utility.

---

## 2. Portfolio: Project Insight Card Grid

**New file: `src/components/portfolio/ProjectInsightCard.tsx`**
- Props: `analysis` (SavedAnalysis), `onOpen` callback
- Displays: title, category badge, score (color-coded), key insight (from `analysis_data` or first product), strongest projection, easiest GTM channel
- Responsive card with hover state, click triggers `onOpen`

**Edit: `src/pages/PortfolioPage.tsx`**
- Replace the inline "Top Projects" card grid (lines 179-230) with `<ProjectInsightCard>` components
- Show all analyses in the card grid (not just first 6), paginated or scrollable
- Move "All Projects" list below the grid as secondary reference

---

## 3. Score Distribution Fix + AI vs User Score Panel

**New file: `src/components/portfolio/ScoreInsightPanel.tsx`**
- Reads `analysis_data.userScores` from each saved analysis
- Computes two distributions: AI scores (from `avg_revival_score`) and user-adjusted scores (from `userScores` averages)
- Renders side-by-side or overlaid bar chart using Recharts `BarChart` with two `Bar` series (AI in blue, User in amber)
- Highlights buckets where deviation is largest (bold border or different opacity)

**Edit: `src/pages/PortfolioPage.tsx`**
- Replace the current single "Score Distribution" bar chart with the new `<ScoreInsightPanel>` component
- Pass `analyses` array as prop

---

## 4. Category Breakdown Cleanup

**Edit: `src/pages/PortfolioPage.tsx`**
- Normalize category names in the `categoryBreakdown` memo:
  - Map `"custom"` to `"Product"`, `"service"` to `"Service"`, `"business"` to `"Business"`, `"first_principles"` to `"First Principles"`
- Use mode-consistent colors from the existing `modeTheme`:
  - Product: blue (`#1249a3`), Service: rose (`#df2060`), Business: violet (`#8b3fd9`), First Principles: teal (`#0d9488`)
- Use `label` rendering on the Pie chart with proper offsets to prevent overlap (use `labelLine={false}` and render a legend row below instead)

---

## 5. Comparison Tool: Insight-Focused View

**New file: `src/components/portfolio/ComparisonInsightView.tsx`**
- Replaces the current table-based comparison
- Props: `compareList` (array of SavedAnalysis)
- For each selected project, extracts from `analysis_data`:
  - Disruption thesis (from disrupt data / first-principles output)
  - Risk profile (from stress test data)
  - Opportunity magnitude (from pitch deck market opportunity)
  - GTM difficulty (from pitch deck GTM strategy)
  - Projected leverage (from product leverage scores)
- Renders as side-by-side insight cards with visual difference highlights (color-coded bars showing relative values)

**Edit: `src/pages/PortfolioPage.tsx`**
- Replace the comparison table section (lines 279-332) with `<ComparisonInsightView>` component
- Keep the project selector pills above it

---

## 6. Final Portfolio Page Structure

The page layout in `PortfolioPage.tsx` will follow this order:

```text
Back + Title
Portfolio Summary Metrics (stats row -- existing)
Project Insight Grid (new card grid)
Score Intelligence Panel (new AI vs User chart)
Category Breakdown (cleaned up pie chart)
Activity Timeline (existing, if >1 month)
Comparison Insight View (rebuilt)
All Projects List (secondary, existing)
```

---

## Technical Summary

| Change | Files | Type |
|---|---|---|
| ScrollToTopProvider | New `src/components/ScrollToTopProvider.tsx`, edit `App.tsx` | New + Edit |
| Scroll calls | Edit `StepNavigator.tsx`, `SectionNav.tsx`, `PlatformNav.tsx` | Edit |
| ProjectInsightCard | New `src/components/portfolio/ProjectInsightCard.tsx` | New |
| ScoreInsightPanel | New `src/components/portfolio/ScoreInsightPanel.tsx` | New |
| ComparisonInsightView | New `src/components/portfolio/ComparisonInsightView.tsx` | New |
| PortfolioPage rebuild | Edit `src/pages/PortfolioPage.tsx` | Edit |

**No database changes. No new dependencies.** All changes reuse existing AnalysisContext, saved analysis data structures, and Recharts.

