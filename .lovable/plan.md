# Skip items 10, 11. 

&nbsp;

# Also remove [steven@sgpcapital.com](mailto:steven@sgpcapital.com) at footer everywhere. 

&nbsp;

# Comprehensive UI & Logic Overhaul

This is a significant restructuring that touches the step pipeline, content sanitization, section reorganization, and new features across the platform.

---

## Summary of Changes

1. **Hide Action Plan** from Intel Report step
2. **Remove brand name references** (Reddit, TikTok, Google Trends) from all UI components
3. **Remove Revival Score** from beginning; only show at Pitch Deck (final step) with user ranking option
4. **Hide images in Intel Report** unless user-uploaded
5. **Move Core Reality, Physical Form, User Workflow** from Disrupt step to Intel Report step
6. **Hide Smart Tech section** from Disrupt step (Disrupt = Assumptions + Flip the Logic + Flipped Ideas)
7. **Create new "Redesign" step** (Step 4) with interactive illustrations from the current Redesign section
8. **Update loading messages** to use generic terms (pricing intel, patent databases) instead of brand names
9. **Remove severity labels/colors** from User Workflow friction points
10. **Filter patents** to only show filings updated within past 24 hours
11. **Filter market news/signals** to past 24 hours only
12. **Update Home Screen** DisruptionPathBanner to reflect the new Redesign step
13. **About page**: Change "Rethink The Game" to "Rethink The Possible"
14. **SGP Capital tailored CTA** at end of last step with "Help Disrupt" mailto link
15. **Mobile**: Show full user name instead of truncated

---

## Technical Plan

### File 1: `src/pages/AboutPage.tsx`

- Line 18: Change `"Rethink The Game"` to `"Rethink The Possible"`

### File 2: `src/components/UserHeader.tsx`

- Line 154: Remove `hidden sm:inline` from the name span so full name shows on mobile too

### File 3: `src/lib/stepConfigs.ts`

- Restructure step pipeline from 4 steps to 5 steps (steps 2-6):
  - Step 2: Intelligence Report (now includes Core Reality, Physical Form, Workflow, Community, Pricing, Supply, Patents)
  - Step 3: Disrupt (Assumptions, Flip the Logic, Flipped Ideas only)
  - Step 4: Redesign (new step -- interactive redesigned concept with illustrations)
  - Step 5: Stress Test
  - Step 6: Pitch Deck (with Revival Score + user ranking)
- Add new icon import for Redesign step (Sparkles)
- Update `SECTION_DESCRIPTIONS` to remove "action" and add descriptions for new sections

### File 4: `src/components/DisruptionPathBanner.tsx`

- Update `PIPELINE_STEPS` to 6 steps: Choose, Intel Report, Disrupt, Redesign, Stress Test, Pitch Deck
- Add Redesign step with Sparkles icon between Disrupt and Stress Test
- Update grid to `lg:grid-cols-6`

### File 5: `src/components/ProductCard.tsx`

- Remove `RevivalScoreBadge` display (line 97)
- Remove `socialSignals` display section (lines 116-130) -- these reference platform names
- Remove era badge from image overlay (line 53-55) and no-image view (line 69-74)

### File 6: `src/components/FirstPrinciplesAnalysis.tsx`

**Major restructuring -- this is the biggest change:**

**Remove from Disrupt step (move to Intel Report):**

- Core Reality section (`reality`)
- Physical Form section (`physical`)
- User Workflow section (`workflow`)

**Remove from Disrupt step entirely:**

- Smart Tech section (`smarttech`)

**Remove from Disrupt step (becomes new Redesign step):**

- Redesigned Concept section (`concept`)

**Disrupt step `allSteps` becomes:**

```
[assumptions, flip, ideas]
```

**User Workflow changes:**

- Remove severity color coding (`SEVERITY_COLORS` usage)
- Remove "high"/"medium"/"low" labels from friction point badges
- Keep the interactive timeline but make all step cards neutral-colored

### File 7: `src/pages/Index.tsx`

**Intel Report (Step 2) changes:**

- Hide Action Plan tab from `DETAIL_TABS`
- Hide product image unless `product.imageSource === "user"` or image is from user upload
- Remove Revival Score from product selector buttons and header
- Add new tabs for Core Reality, Physical Form, User Workflow (fetched from first-principles-analysis data or rendered inline)
- Remove all brand name references from Community Intel (replace "Reddit Sentiment" with "Community Sentiment", remove `sig.platform` display)

**Step pipeline restructuring (steps 2-6):**

- Step 2: Intel Report (existing + Core Reality/Physical/Workflow moved here)
- Step 3: Disrupt (only Assumptions, Flip Logic, Flipped Ideas)
- Step 4: Redesign (new -- renders the RedesignedConcept section with interactive illustrations)
- Step 5: Stress Test (renumbered from 4)
- Step 6: Pitch Deck (renumbered from 5, now includes Revival Score with user ranking)

**Loading messages (lines 354-405):**

- Replace "Mining community forums" with "Analyzing community sentiment data..."
- Replace "Scanning search & social data" with "Collecting demand & trend signals..."
- Replace "Scoring Revival Potential" with "Finalizing intelligence report..."
- All messages should avoid Reddit/TikTok/Google/eBay/Etsy

**SGP Capital CTA at end of Step 6 (Pitch Deck):**

- Replace generic CTA with tailored bullets based on analysis context
- Add "Help Disrupt" button that opens mailto:[steven@sgpcapital.com](mailto:steven@sgpcapital.com) with pre-populated subject containing project name and user contact info

### File 8: `src/pages/ReportPage.tsx`

- Same changes as Index.tsx Intel Report:
  - Hide Action Plan tab
  - Remove Revival Score from header and product selector
  - Add Core Reality, Physical Form, User Workflow tabs
  - Remove brand references from Community Intel
  - Hide image unless user-uploaded

### File 9: `src/components/LoadingTracker.tsx`

- Update `SCRAPE_SOURCES` labels to avoid brand names:
  - "Market Data" stays
  - "Community Intel" stays (no Reddit mention)
  - "Trend Signals" stays (no TikTok/Google Trends mention)
  - Already clean -- just verify details don't mention brands

### File 10: `src/data/mockProducts.ts`

- Remove platform-specific references from `socialSignals` items (change `platform: "TikTok"` to `platform: "Social Video"`, `platform: "Reddit"` to `platform: "Community Forum"`, etc.)
- Clean `trendAnalysis` strings of brand names

### File 11: `src/components/PatentIntelligence.tsx`

- Add date filtering: only show patents with filing/update dates within the past 24 hours
- If no patents match the 24-hour filter, show a "No recent patent activity" message

### File 12: `src/components/intel/MarketNewsSection.tsx`

- Add date filtering: only show news/signals from the past 24 hours
- If no items match, show "No market signals in the past 24 hours"

### File 13: `src/components/PitchDeck.tsx` (end of last step)

- Add Revival Score display here (moved from beginning)
- Add user ranking slider/input so user can rank alongside AI score
- Add tailored SGP Capital CTA section:
  - Dynamically generate 2-4 bullet points based on analysis data (e.g., "Connect with manufacturers in [region]", "Refine go-to-market strategy for [channel]", "Identify investors in [category] space")
  - Add "Help Disrupt" button: `mailto:steven@sgpcapital.com?subject=Help%20Disrupt%3A%20[ProjectName]&body=[project summary + user contact]`

---

## Step Pipeline Before vs After

```text
BEFORE (Steps 2-5):
2. Intel Report (Overview, Community, Pricing, Supply, Action, Patents)
3. Disrupt (Reality, Physical, Workflow, SmartTech, Assumptions, Flip, Concept, Ideas)
4. Stress Test
5. Pitch Deck

AFTER (Steps 2-6):
2. Intel Report (Overview, Core Reality, Physical Form, User Workflow, Community, Pricing, Supply, Patents)
3. Disrupt (Assumptions, Flip the Logic, Flipped Ideas)
4. Redesign (Redesigned Concept with interactive illustrations)
5. Stress Test
6. Pitch Deck (+ Revival Score + User Ranking + SGP Capital tailored CTA)
```

---

## Content Sanitization Rules (Applied Globally)


| Before                                    | After                               |
| ----------------------------------------- | ----------------------------------- |
| "Reddit Sentiment"                        | "Community Sentiment"               |
| "TikTok", "Google Trends"                 | "Social platforms", "Search trends" |
| `sig.platform` showing "Reddit", "TikTok" | Hidden or genericized               |
| Revival score badges in cards/headers     | Removed until Pitch Deck            |
| Era tags ("2010s-present", "90s")         | Hidden from UI                      |
| Product images (stock/scraped)            | Hidden unless user-uploaded         |
| Loading: "Mining Reddit forums"           | "Analyzing community sentiment..."  |
| Loading: "Scanning TikTok trends"         | "Collecting demand signals..."      |


---

## What Stays the Same

- All backend edge functions and AI prompts (they can still reference brands internally for data quality)
- Database schema and RLS policies
- Authentication flow
- CSS variables and theming
- The overall component architecture (just reorganizing which step renders which section)