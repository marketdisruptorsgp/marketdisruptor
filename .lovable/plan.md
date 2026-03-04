

## Problem

Each step page only passes **its own data** to the PDF generator. For example, the Disrupt page only passes `{ disrupt: ... }`, so the PDF only contains the disrupt section — missing the intel report data that's already on `selectedProduct`. The `gatherAllAnalysisData` utility already exists and collects everything, but no page uses it.

## Plan

### 1. Create a shared helper for cumulative PDF download

Create a single reusable function (or just inline `gatherAllAnalysisData`) that every page calls instead of manually building partial `data` objects.

**Edit each page's PDF button** to use `gatherAllAnalysisData(analysis)` instead of the manual per-step data object:

- **`DisruptPage.tsx`** (line 91-92): Replace `const data = {}; if (analysis.disruptData) data.disrupt = ...` with `import { gatherAllAnalysisData } from "@/lib/gatherAnalysisData"` and call `gatherAllAnalysisData(analysis)`.
- **`RedesignPage.tsx`** (line 83-84): Same change.
- **`StressTestPage.tsx`** (line 75-76): Same change.
- **`PitchPage.tsx`** (line 75-76): Same change.
- **`ReportPage.tsx`** (lines 162-167): Already gathers most data manually — replace with `gatherAllAnalysisData(analysis)` for consistency.

This ensures that **any page's PDF button always includes all completed steps up to that point**, since `gatherAllAnalysisData` checks each data field and only includes it if it exists.

### 2. No changes needed to PrintableReport

`PrintableReport.tsx` already renders sections conditionally based on what's in `analysisData` — it handles disrupt, stressTest, pitchDeck, redesign, and patent data. The intel report data comes from the `product` object itself, which is always passed. So once we pass all available data, the PDF will include everything.

### Summary of files to edit

| File | Change |
|---|---|
| `src/pages/DisruptPage.tsx` | Import + use `gatherAllAnalysisData(analysis)` |
| `src/pages/RedesignPage.tsx` | Import + use `gatherAllAnalysisData(analysis)` |
| `src/pages/StressTestPage.tsx` | Import + use `gatherAllAnalysisData(analysis)` |
| `src/pages/PitchPage.tsx` | Import + use `gatherAllAnalysisData(analysis)` |
| `src/pages/ReportPage.tsx` | Import + use `gatherAllAnalysisData(analysis)` |

Each change is ~3 lines: add import, replace manual data object with `gatherAllAnalysisData(analysis)`.

