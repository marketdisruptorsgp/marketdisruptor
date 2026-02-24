

# Engagement, Retention, and Growth Feature Suite

This plan covers six major feature areas to make the platform stickier, more polished, and worth paying for.

---

## 1. "Market Changed" Notifications

**What it does:** When users return to the dashboard, the platform checks if new patent filings or market news overlap with their saved analyses (by category/keywords). If matches exist, a notification banner appears on the dashboard prompting them to re-run or review.

**Implementation:**
- New component `MarketChangeAlert.tsx` that runs on dashboard mount
- Queries `patent_filings` and `market_news` for items newer than the user's most recent login/visit
- Cross-references against the user's `saved_analyses` categories
- Displays a dismissable alert card: "3 new patents filed in [category] since your last analysis -- Re-run Intel?"
- Add a `last_seen_at` column to the `profiles` table (updated on each login) to track what's "new"

**Files:** New `src/components/MarketChangeAlert.tsx`, edit `src/pages/DashboardPage.tsx`, migration for `profiles.last_seen_at`

---

## 2. Gamification -- Completion Tracking and Streaks

**What it does:** Adds visible progress indicators and weekly streak tracking to encourage users to complete all analysis steps and return regularly.

**Implementation:**
- **Completion percentage on project cards:** Already have `StepProgressDots` showing "3 of 5 explored". Enhance to show a percentage ring and a "Complete all 5 steps" CTA on the Saved Projects panel
- **Weekly streak counter:** New `StreakBadge` component on the dashboard hero section showing "Week 3 streak" with a flame icon. Tracked via a `user_streaks` table (user_id, week_start, analysis_count) updated each time an analysis completes
- **Milestone toasts:** When a user hits 5, 10, 25 analyses, show a celebratory toast with an achievement badge

**Files:** New `src/components/StreakBadge.tsx`, edit `src/components/SavedAnalyses.tsx` (enhance cards), edit `src/pages/DashboardPage.tsx`, edit `src/contexts/AnalysisContext.tsx` (milestone check), migration for `user_streaks` table

---

## 3. Encourage Tweaking and Fine-Tuning

**What it does:** After each analysis step completes, show a prominent "Refine This" prompt that lets users add custom instructions and re-run the step with their guidance. Makes the platform feel collaborative, not one-shot.

**Implementation:**
- New `RefinementPrompt` component: a collapsible input area below each completed step section (Report, Disrupt, Stress Test, Pitch) saying "Not quite right? Tell the AI what to focus on and regenerate this section"
- When submitted, calls the same edge function with the additional `userPrompt` parameter (already supported per the architecture notes)
- Track refinement count per analysis to show "Refined 3x" badge on project cards -- signals depth of engagement
- Add a subtle "Tip: Try adjusting..." contextual hint after first analysis completes

**Files:** New `src/components/RefinementPrompt.tsx`, edit `src/pages/ReportPage.tsx`, `src/pages/DisruptPage.tsx`, `src/pages/StressTestPage.tsx`, `src/pages/PitchPage.tsx`

---

## 4. Portfolio Dashboard

**What it does:** A dedicated `/portfolio` page that aggregates all saved analyses into a strategic overview with comparative metrics, scatter plots, and category breakdowns.

**Implementation:**
- New `PortfolioPage.tsx` with sections:
  - **Overview stats:** Total projects, average revival score, top score, analyses this month
  - **Score distribution chart:** Bar chart of revival scores across all projects (using existing Recharts)
  - **Category breakdown:** Pie/donut chart showing product vs service vs business model split
  - **Side-by-side comparison:** Select 2-3 projects to compare key metrics in a table
  - **Timeline view:** When each analysis was created, showing activity density
- Add route `/portfolio` to `App.tsx`
- Add nav link in `PlatformNav`

**Files:** New `src/pages/PortfolioPage.tsx`, edit `src/App.tsx`, edit `src/components/PlatformNav.tsx`

---

## 5. Branded PDF Exports

**What it does:** Upgrade the existing PDF exports with stronger branding, a table of contents, page numbers, and a branded footer on every page.

**Implementation:**
- Add a consistent footer to every page: "Market Disruptor | Confidential | Page X of Y" with the primary brand color
- Add a table of contents on page 2 listing all sections with page numbers
- Add a "Prepared for [User Name]" line on the cover page using profile data
- Add a watermark-style "MARKET DISRUPTOR" diagonal text on each page (subtle, low opacity)
- Ensure the cover page includes the user's tier badge (e.g., "Disruptor Plan")

**Files:** Edit `src/lib/pdfExport.ts` (all export functions)

---

## 6. Share with Team Including Referral Link

**What it does:** A "Share This Analysis" button on completed analyses that generates a shareable summary with the user's referral link embedded. Supports email (via existing Resend integration) and copy-to-clipboard.

**Implementation:**
- New `ShareAnalysis` component with two modes:
  - **Copy shareable link:** Generates a URL like `/share?ref={userId}&preview={analysisId}` -- the share page already exists and handles `ref` parameter
  - **Email to team:** Opens a modal with recipient email/name fields. Calls a new edge function `share-analysis` that sends a branded email with analysis highlights (title, score, top idea, category) plus the referral link
- Add the share button to the step navigator bar on Report, Disrupt, Stress Test, and Pitch pages
- The referral link is embedded in both the email and the copied link, so every share doubles as a referral

**Files:** New `src/components/ShareAnalysis.tsx`, new `supabase/functions/share-analysis/index.ts`, edit `src/components/StepNavigator.tsx` or step pages to add share button

---

## Technical Summary

| Feature | New Files | Edited Files | DB Changes |
|---|---|---|---|
| Market Changed Notifications | `MarketChangeAlert.tsx` | `DashboardPage.tsx` | Add `last_seen_at` to profiles |
| Gamification | `StreakBadge.tsx` | `DashboardPage.tsx`, `SavedAnalyses.tsx`, `AnalysisContext.tsx` | New `user_streaks` table |
| Refinement Prompts | `RefinementPrompt.tsx` | `ReportPage.tsx`, `DisruptPage.tsx`, `StressTestPage.tsx`, `PitchPage.tsx` | None |
| Portfolio Dashboard | `PortfolioPage.tsx` | `App.tsx`, `PlatformNav.tsx` | None |
| Branded PDFs | None | `pdfExport.ts` | None |
| Share with Team | `ShareAnalysis.tsx`, `share-analysis/index.ts` | Step pages / `StepNavigator.tsx` | None |

**Dependencies:** No new npm packages needed. All charts use existing Recharts. PDF uses existing jsPDF. Emails use existing Resend integration.

**Priority order (recommended):**
1. Refinement Prompts (highest engagement impact, leverages existing `userPrompt` support)
2. Portfolio Dashboard (makes the platform feel like a workspace, not a tool)
3. Market Changed Notifications (brings users back)
4. Branded PDFs (premium feel, quick win)
5. Share with Team (growth loop)
6. Gamification (retention layer)

