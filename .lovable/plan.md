Is this all the things we were planning on or only some?

&nbsp;

# UX Improvements: Key Takeaways, Progress Indicators, Analysis Aging, Referral Hook & Continue Banner

## Overview

Five improvements to make the platform stickier, findings clearer, and users more engaged post-analysis.

---

## 1. Key Takeaway Banners on Report Sections

**What**: A bold, single-sentence "Key Takeaway" callout at the top of each report sub-section (Overview, Community, Pricing, Supply Chain) -- dynamically pulled from the AI data.

**Where**: `src/pages/Index.tsx` (inside each `detailTab` block) and `src/pages/ReportPage.tsx`

**How**:

- At the top of each tab's content block, render a styled callout if relevant data exists:
  - **Overview**: Use `selectedProduct.keyInsight` (already exists, but will add a more prominent "Key Takeaway" banner style above the existing card)
  - **Community**: Summarize top complaint count + sentiment direction (e.g., "3 recurring complaints identified -- users want X")
  - **Pricing**: Pull `selectedProduct.pricing?.verdict` or compute from margin data (e.g., "Underpriced by 20-35% vs. market average")
  - **Supply Chain**: Count of manufacturers + regions (e.g., "4 verified suppliers across 2 regions -- lead times 15-30 days")
- Styled as a full-width banner with left border accent, matching the section's color theme
- Also add **Verdict Badges** inline: colored pills like "Underpriced", "Supply Chain Risk", "High Demand" derived from scores and data thresholds

---

## 2. Step Progress on Saved Project Cards

**What**: Show which steps the user has completed on each saved project card, so they can see at a glance what's left to explore.

**Where**: `src/components/SavedAnalyses.tsx`

**How**:

- The `analysis_data` JSON blob already stores step completion data (visited steps, visited detail tabs, stress test data, pitch data)
- Extract a `completedSteps` count from `analysis_data` and render a small progress indicator on SpotlightCard and ProjectCard
- Show as a row of 5 small dots/circles (one per step: Intel, Disrupt, Redesign, Stress Test, Pitch) -- filled if the user visited that step, hollow if not
- Add a text label: "3 of 5 steps explored" below the dots
- For projects with all steps completed, show a green checkmark badge: "Complete"

---

## 3. Analysis Aging + "Re-run Intel" Button

**What**: Show how old each analysis is (e.g., "Analyzed 47 days ago") with a "Re-run Intel" button on stale analyses.

**Where**: `src/components/SavedAnalyses.tsx` (SpotlightCard and ProjectCard), and when loading a saved analysis in `src/pages/Index.tsx`

**How**:

- Replace or supplement the date display with a relative time label using `date-fns`'s `formatDistanceToNow` (already installed)
- For analyses older than 30 days, show an amber "Stale" badge and a small "Re-run Intel" button
- The re-run button triggers a re-analysis with the same parameters (product name, URLs, mode) and updates the existing record
- On the loaded analysis view (Index.tsx), show a banner at the top: "This analysis is X days old. Market conditions may have changed." with a "Refresh Intel" CTA

---

## 4. "Continue Where You Left Off" Banner

**What**: A prominent banner on the dashboard when the user has an incomplete analysis (not all steps visited).

**Where**: `src/pages/DashboardPage.tsx` (between the DisruptionPathBanner and the mode pills)

**How**:

- On mount, query `saved_analyses` for the user's most recent analysis
- Check `analysis_data` for step completion -- if fewer than 5 steps visited, show the banner
- Banner content: "[Project Name] -- You've explored 2 of 5 steps. [Continue]"
- "Continue" button loads the analysis and navigates to the next unvisited step
- Dismissible with an X button (session-only, reappears next visit)
- Styled with a subtle gradient left border matching the analysis mode color

---

## 5. Surface Referral Program After Completed Analyses

**What**: After a user completes all 5 steps (or reaches Pitch Deck), show a referral CTA card.

**Where**: `src/components/PitchDeck.tsx` (at the bottom, after the SGP Capital CTA) and `src/pages/Index.tsx` (after step 6 content)

**How**:

- Add a "Share & Earn" card after the Help Disrupt CTA in PitchDeck:
  - Headline: "Know someone who'd use this?"
  - Body: "Share your referral link and earn extended access when they sign up."
  - Button: "Copy Referral Link" -- copies `https://productideas.lovable.app?ref=[userId]`
  - Uses existing `claim-referral` and `send-referral-email` edge functions
- Also show a smaller inline prompt when a user finishes the Stress Test step (step 5) before they reach Pitch Deck

---

## Technical Details

### Files Modified


| File                               | Changes                                                                                                              |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `src/pages/Index.tsx`              | Key takeaway banners in each detailTab block; stale analysis banner on loaded projects; referral prompt after step 6 |
| `src/pages/ReportPage.tsx`         | Key takeaway banners matching Index.tsx pattern                                                                      |
| `src/components/SavedAnalyses.tsx` | Step progress dots on cards; relative time labels; stale badge + re-run button                                       |
| `src/pages/DashboardPage.tsx`      | "Continue where you left off" banner                                                                                 |
| `src/components/PitchDeck.tsx`     | Referral CTA card after SGP Capital section                                                                          |


### No New Dependencies

- `date-fns` already installed for `formatDistanceToNow`
- All existing edge functions reused (no new backend)
- No database schema changes needed

### Patterns Followed

- Dismissible UI uses existing `localStorage` + `dismissed_tips` pattern from `ContextualTip`
- Card styling uses existing `hsl(var(--muted))`, `hsl(var(--border))`, accent color conventions
- Step progress derives from existing `analysis_data` JSON structure in `saved_analyses`