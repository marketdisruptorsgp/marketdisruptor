

# Move Saved Projects to Top Nav + Deduplicate

## Overview
Replace the current "Saved Projects" section (buried below the analysis form) with a prominent button in the top navigation bar next to the user's name. Clicking it opens a slide-out panel (sheet/drawer) showing saved analyses. Add server-side deduplication that compares analysis content (not just title) and keeps only the most recent version.

## Changes

### 1. HeroSection.tsx -- Add "Saved Projects" Button
- Add a new prop `onOpenSaved` callback and `savedCount` number
- Render a clearly visible button next to the UserHeader in the top nav bar
- Style: secondary outline style with a Database icon and count badge
- Example: `[Database icon] Saved (12)` -- high contrast, always visible

### 2. SavedAnalyses.tsx -- Deduplication Logic
- After fetching analyses, deduplicate by comparing `category + era + audience + analysis_type + batch_size` (the substantive content fingerprint, not just title)
- Since results are ordered by `created_at DESC`, keep the first occurrence (most recent) and discard older duplicates
- This runs client-side after fetch, so no database changes needed

### 3. SavedAnalyses.tsx -- Design Cleanup
- Replace `rounded-xl` with `rounded` (4px) on search input and cards
- Remove `hover:scale-[1.01]` and colored `boxShadow` on hover (per design system)
- Remove `rounded-full` on badges, use `rounded` instead

### 4. Index.tsx -- Replace Inline Section with Sheet/Dialog
- Remove the "Saved Projects" card section (lines ~635-652) from the main page flow
- Add state `showSavedPanel` (boolean)
- Render a Sheet (slide-out from right) that contains `SavedAnalyses`
- Pass `onOpenSaved` and `savedCount` to HeroSection

### 5. Index.tsx -- Track Saved Count
- After `fetchAnalyses` in SavedAnalyses, expose the count via a callback prop `onCountChange?: (count: number) => void`
- Index.tsx stores this in state and passes it to HeroSection for the badge

---

## Technical Details

### Deduplication fingerprint
```text
key = `${analysis.category}|${analysis.era}|${analysis.audience}|${analysis.analysis_type}|${analysis.batch_size}`
```
When multiple analyses share the same key, only the one with the latest `created_at` is kept. Since the query already orders by `created_at DESC`, we simply skip any analysis whose key has already been seen.

### New props
- `HeroSection`: add `onOpenSaved: () => void` and `savedCount: number`
- `SavedAnalyses`: add `onCountChange?: (count: number) => void`

### Sheet component
Use the existing `src/components/ui/sheet.tsx` (already in the project) for the slide-out panel. The sheet will be triggered from the top nav button and contain the full SavedAnalyses component with search and list.

### Files to modify
- `src/components/HeroSection.tsx` -- add saved button in top nav
- `src/components/SavedAnalyses.tsx` -- add dedup logic, design fixes, count callback
- `src/pages/Index.tsx` -- remove inline section, add sheet, wire up state

### No breaking changes
- No database modifications
- No edge function changes
- Existing saved analyses render identically (minus duplicates)
