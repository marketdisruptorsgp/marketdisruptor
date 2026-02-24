

# Auto-Persist All Step Data Across All Modes

## Problem

When a user generates results for any step (Intel Report, Disrupt, Stress Test, Pitch Deck), the data is only partially saved. If they reload from Saved Projects, some steps must be re-run. Specifically:

- **Business Model mode**: Stress Test and Pitch Deck results are never persisted to the database
- **Business Model Disrupt**: Not persisted separately
- **Patent Intelligence** (Report step): Data is saved on the product object but the updated products array isn't always re-saved to the database
- **ReportPage patent save**: Updates products in memory but doesn't persist the updated array back to the database

## Solution

Add `saveStepData` calls everywhere step data is generated, and ensure `handleLoadSaved` restores all of it.

---

## Changes

### 1. BusinessResultsPage.tsx -- Persist business stress test and pitch deck

- **Stress Test** (line ~159): Change `onDataLoaded={analysis.setBusinessStressTestData}` to also call `saveStepData("businessStressTest", d)`
- **Pitch Deck** (line ~179): Add `onSave` callback that calls `setPitchDeckData` and `saveStepData("businessPitchDeck", d)`

### 2. ReportPage.tsx -- Persist patent data back to database

- In the `onSave` callback for `PatentIntelligence`, after updating `products` in memory, also call `saveAnalysis(updated, analysisParams)` to write the updated product array (with patent data) back to the database

### 3. AnalysisContext.tsx -- Restore all persisted step data on load

Update `handleLoadSaved` to also restore:
- `ad?.businessStressTest` into `setBusinessStressTestData`
- `ad?.businessPitchDeck` into `setPitchDeckData`

This ensures that when a user opens a saved Business Model project, the Stress Test and Pitch Deck results are fully restored without re-running.

---

## Technical Details

### Files Modified

| File | Change |
|------|--------|
| `src/pages/BusinessResultsPage.tsx` | Add `saveStepData` calls for stress test and pitch deck |
| `src/pages/ReportPage.tsx` | Persist updated products array after patent data is saved |
| `src/contexts/AnalysisContext.tsx` | Restore `businessStressTest` and `businessPitchDeck` in `handleLoadSaved` |

### What Already Works (no changes needed)

- Product/Service mode: Disrupt, Stress Test, and Pitch Deck pages already call `saveStepData`
- Initial analysis products are auto-saved via `saveAnalysis` after the analysis pipeline completes
- `saveStepData` merges into the existing `analysis_data` JSON column, so multiple step saves don't overwrite each other

