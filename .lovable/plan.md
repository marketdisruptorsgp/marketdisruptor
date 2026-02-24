

# Platform-Wide UX Consistency and Navigation Improvements

---

## 1. Global Mode Design System

**New file: `src/theme/modeTheme.ts`**
- Export a `modeTheme` object with three mode keys:
  - `product`: blue palette (`hsl(217 91% 38%)` primary, lighter outline/bg variants)
  - `service`: purple/rose palette (`hsl(340 75% 50%)`)
  - `business`: violet palette (`hsl(271 81% 55%)`)
- Each mode includes `primary`, `outline`, `background` color strings

**New file: `src/hooks/useModeTheme.ts`**
- Hook accepts the current mode from `AnalysisContext.mainTab`
- Returns the corresponding theme object from `modeTheme`

**Apply theme to:**
- Step page headers (the step number badge + left border color)
- StepNavigator active step indicator
- Mode containers on DashboardPage (already partially done via `modeColor` CSS var -- will unify through the hook)

---

## 2. Standardized Mode Header Component

**New file: `src/components/ModeHeader.tsx`**
- Props: `stepNumber`, `stepTitle`, `subtitle`, `accentColor`
- Renders the consistent header block currently duplicated across DisruptPage, RedesignPage, StressTestPage, PitchPage (the numbered badge + title + description inside a bordered card)
- Applies outline color based on the mode theme

**Update `StepNavBar` in `src/components/SectionNav.tsx`:**
- Change "Dashboard" label on ReportPage to "Home" (already says "Home" in StepNavBar but ReportPage passes `backLabel="Dashboard"`)

**Apply `ModeHeader` to:**
- `DisruptPage.tsx` (replaces inline header JSX)
- `RedesignPage.tsx`
- `StressTestPage.tsx`
- `PitchPage.tsx`
- `ReportPage.tsx` (the step 2 header block)

---

## 3. Step Navigation Scroll Fix

**New file: `src/utils/scrollToTop.ts`**
- Export `scrollToTop()` that calls `window.scrollTo({ top: 0, behavior: "smooth" })`

**Update `StepNavigator.tsx`:**
- Import and call `scrollToTop()` inside the `onStepChange` callback wrapper
- Also call it on `NextStepButton` clicks in each step page

---

## 4. Outdated Step Banner UI

**Update existing `src/components/OutdatedBanner.tsx`:**
- Already exists with amber styling. Will verify/enhance:
  - Amber background container with border
  - "Upstream data changed" message
  - Regenerate button
- Already applied to RedesignPage, StressTestPage, PitchPage -- confirm consistent usage

No new file needed -- the component already matches the requirements.

---

## 5. Steering Input Visibility

**New file: `src/components/SteeringPanel.tsx`**
- A wrapper component with:
  - Bordered container with highlighted background (`hsl(var(--muted))`)
  - Short explanatory header (e.g., "Guide the AI")
  - Consistent placement above editable inputs
- Apply to RefinementPrompt areas and any user steering/context input fields

**Dropdown improvements:**
- Update dropdown/select elements across the app to increase arrow size, contrast, and click affordance
- Ensure solid background (not transparent) and high z-index per the knowledge file on dropdowns

---

## 6. Disrupt Page Visual Hierarchy

**Update `src/components/FirstPrinciplesAnalysis.tsx`:**
- Reduce visual dominance of "journey" section headers (smaller font, less padding)
- Increase prominence of assumptions and insight cards (slightly larger text, bolder borders)
- Remove "habit / challengeable / leverage" text block (already done in previous batch -- verify)
- Keep reason badge and leverage score number

No analysis logic changes.

---

## 7. Navigation + Onboarding Improvements

**Update `src/components/PlatformNav.tsx`:**
- Reorder desktop nav items to: Disruptor Modes, Portfolio, Intel, About, Resources (dropdown), Pricing
- Reorder mobile nav items to match
- Ensure nav links use `<a>` or `NavLink` so right-click "Open in new tab" works (currently using `<button onClick={navigate}>` which breaks right-click)

**Update `src/pages/DashboardPage.tsx`:**
- Move "Start Analysis" button below "What to expect" callout
- Increase spacing between onboarding pipeline steps in `DisruptionPathBanner`
- Make pipeline step arrows more visible (larger size, higher contrast)

---

## 8. Share Dropdown Visibility Fix

**Update `src/components/ShareAnalysis.tsx`:**
- Add `z-[9999]` to the dropdown container
- Set `overflow: visible` on parent
- Ensure the dropdown renders with `position: fixed` or uses a portal pattern to avoid clipping in step pages

---

## 9. FAQ Default State

**Update `src/pages/FaqsPage.tsx`:**
- Change `<Accordion type="single" collapsible>` to include `defaultValue="faq-0"` so the first FAQ item auto-expands on load

---

## 10. Mode Header State

Already covered by items 1 and 2 above:
- `useModeTheme` hook provides the current mode color
- `ModeHeader` component applies the outline color based on active mode
- All step pages will use `useModeTheme` to derive the accent color instead of hardcoding it

---

## Technical Summary

| Change | Files | Type |
|---|---|---|
| Mode theme system | New `src/theme/modeTheme.ts`, `src/hooks/useModeTheme.ts` | New |
| ModeHeader component | New `src/components/ModeHeader.tsx` | New |
| Scroll utility | New `src/utils/scrollToTop.ts` | New |
| SteeringPanel component | New `src/components/SteeringPanel.tsx` | New |
| Nav reorder + right-click | Edit `PlatformNav.tsx` | Edit |
| Scroll on step change | Edit `StepNavigator.tsx` | Edit |
| Step page headers | Edit `DisruptPage`, `RedesignPage`, `StressTestPage`, `PitchPage`, `ReportPage` | Edit |
| Share dropdown fix | Edit `ShareAnalysis.tsx` | Edit |
| FAQ default open | Edit `FaqsPage.tsx` | Edit |
| Disrupt visual hierarchy | Edit `FirstPrinciplesAnalysis.tsx` | Edit |
| Dashboard layout | Edit `DashboardPage.tsx` | Edit |
| OutdatedBanner polish | Edit `OutdatedBanner.tsx` (minor) | Edit |

**No database changes. No new dependencies.** All changes are frontend-only, reusing existing AnalysisContext and state architecture.

