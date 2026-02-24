

## Add PlatformNav Header + Back Button to Start Pages & Reorder Homepage

### Changes

**1. `src/components/StartPageLayout.tsx`** — Add header and back-home navigation
- Import and render `HeroSection` (which contains `PlatformNav`) at the top of the page, above `<main>`
- Add a "← Back to Home" breadcrumb link between the header and the form card
- Requires importing `HeroSection`, `useSubscription` for tier data
- All existing form logic, context sync, loading, error handling stays exactly as-is

**2. `src/pages/DashboardPage.tsx`** — Move ShowcaseGallery below "What to expect"
- Current order: Scrutiny CTA → ShowcaseGallery → What to expect → Mode Pills
- New order: Scrutiny CTA → What to expect → ShowcaseGallery → Mode Pills
- Pure block reorder, no logic changes

### Files Changed

| File | Change |
|------|--------|
| `src/components/StartPageLayout.tsx` | Add `HeroSection` + "Back to Home" link at top |
| `src/pages/DashboardPage.tsx` | Swap ShowcaseGallery and "What to expect" positions |

### No Logic Impact
- AnalysisForm, AnalysisContext sync, LoadingTracker, error handling, business model routing — all untouched
- Only layout wrapper additions in StartPageLayout and a block reorder in DashboardPage

