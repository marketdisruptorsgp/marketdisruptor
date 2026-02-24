

# Output Quality & Completion Experience Upgrades

---

## 1. Completion Experience Component

**New file: `src/components/CompletionExperience.tsx`**

A reusable completion panel that replaces the inline completion screen currently hardcoded in PitchDeck.tsx.

Props:
- `productName` (string)
- `completionMessage` (string) -- the AI-generated strategic insight
- `onExportPDF` (callback)
- `onBackToSections` (callback)
- `accentColor` (string)

Features:
- Rotating success messages based on analysis outcome type (opportunity framing, disruption potential, creative reframing, breakthrough insight)
- "Project saved" confirmation badge
- "Next: View Portfolio" CTA button
- PDF export button
- Back-to-sections link

**Edit: `src/components/PitchDeck.tsx`**
- Replace the inline completion screen (lines 224-267) with `<CompletionExperience>` component
- Pass through `completionMessage`, product name, PDF handler, and accent color

---

## 2. Header Mode Consistency

**Edit: `src/pages/ReportPage.tsx`**
- Import and use `useModeTheme` hook
- Pass `theme.primary` as `accentColor` to `ModeHeader`, `StepNavBar`, `ShareAnalysis`, `KeyTakeawayBanner`, and `NextStepButton`
- This is the only step page currently missing the mode theme integration

---

## 3. Intel Engine Minimum Results Enforcement

### News scraper

**Edit: `supabase/functions/scrape-market-news/index.ts`**
- Add `MIN_RESULTS = 10` constant
- After initial scrape loop, check if `recentNews.length < MIN_RESULTS`
- If below minimum, run a broadened fallback query with `tbs: "qdr:y"` (last year) to backfill
- Remove hardcoded category assignments on queries -- instead let AI dynamically categorize each article from content

### Trend scraper

**Edit: `supabase/functions/scrape-trend-intel/index.ts`**
- Add `MIN_RESULTS = 10` constant
- Expand `TREND_KEYWORDS` from 8 to 12+ broad keywords covering more sectors
- After initial loop, if `allTrends.length < MIN_RESULTS`, run additional broad keyword searches to fill the gap
- Remove hardcoded category mapping -- let AI dynamically assign categories from trend content

### Patent scraper
- Already has `MIN_RESULTS = 10` with broadening logic -- no changes needed

---

## 4. Pitch Structure Verification

The pitch edge function (`generate-pitch-deck/index.ts`) already:
- Follows the 12-section order (Problem, Solution, Why Now, Market, Product, Business Model, Traction, Risks, Metrics, GTM, Competitive, Investment Ask)
- Incorporates `redesignData`, `userScores`, `stressTestData`
- Uses realistic risk framing with severity tagging
- Includes `completionMessage` field for strategic insight

The PitchDeck.tsx component already renders all 12 sections via `SLIDE_TABS` in the correct order.

**No changes needed** -- structure is already compliant.

---

## 5. Share/Referral Verification

Both `ShareAnalysis.tsx` and `ReferralCTA.tsx` already use `http://marketdisruptor.sgpcapital.com` as the referral destination. The share dropdown already has `z-[9999]` and `overflow: visible`.

**No changes needed.**

---

## Technical Summary

| Change | Files | Type |
|---|---|---|
| CompletionExperience component | New `src/components/CompletionExperience.tsx` | New |
| Use CompletionExperience in PitchDeck | Edit `src/components/PitchDeck.tsx` | Edit |
| Mode theme on ReportPage | Edit `src/pages/ReportPage.tsx` | Edit |
| News scraper min results | Edit `supabase/functions/scrape-market-news/index.ts` | Edit |
| Trend scraper min results | Edit `supabase/functions/scrape-trend-intel/index.ts` | Edit |

**No database changes. No new dependencies.**
Edge functions `scrape-market-news` and `scrape-trend-intel` will be redeployed after edits.
