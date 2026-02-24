# No do not do number 5. I want the tracker card below patent section like it is for other steps/sectionx. 

&nbsp;

&nbsp;

# Homepage Cleanup and Loading Tracker Repositioning

## Changes

### 1. Increase "Rethink any [mode]" font size

**File: `src/pages/DashboardPage.tsx**` (line 151)

Current: `text-2xl sm:text-4xl md:text-5xl`
New: `text-3xl sm:text-5xl md:text-6xl` -- bumps each breakpoint up one notch for a more impactful hero headline.

### 2. Remove "Continue where you left off" banner

**File: `src/pages/DashboardPage.tsx**` (lines 218-223)

Remove the `<ContinueBanner>` block and its import (line 16). The component file `src/components/ContinueBanner.tsx` can remain in the codebase (unused code is tree-shaken out).

### 3. Remove Welcome Modal

**File: `src/pages/Index.tsx**`

- Remove the `WelcomeModal` import (line 20)
- Remove the `showWelcome` state (line 184-186)
- Remove `handleCloseWelcome` function (lines 255-258)
- Remove the WelcomeModal render block (lines 542-545)
- Remove the `!showWelcome` guard on MobileTour (line 548 -- simplify to just `user &&`)

Also remove the "Welcome back" toast:
**File: `src/hooks/useAuth.tsx**` (line 45) -- Remove the `toast.success("Welcome back...")` call.

### 4. "Edit with Lovable" badge

This badge is injected by the Lovable platform itself and is not part of the project's source code. It cannot be hidden or removed via code changes. It is only visible in the preview/development environment and does not appear on the published production URL.

### 5. Move Loading Tracker inside the analysis form parent card

**File: `src/pages/Index.tsx**` (lines 685-692)

Currently the `<LoadingTracker>` renders as a separate block BELOW the tab card. Move it INSIDE the tab card's `<div className="p-5">` area, directly below the `<AnalysisForm>`, so it appears within the same parent container when analysis is running. This gives a cohesive feel -- the tasks/activity log appears right under the form that triggered it.

Specifically:

- Remove the standalone `LoadingTracker` block at lines 685-692
- Insert `{isLoading && <LoadingTracker ... />}` inside the tab card div, right after the `<AnalysisForm>` component (after line 677)

---

## Technical Details


| File                          | Changes                                                                       |
| ----------------------------- | ----------------------------------------------------------------------------- |
| `src/pages/DashboardPage.tsx` | Increase h1 font classes; remove ContinueBanner import + render               |
| `src/pages/Index.tsx`         | Remove WelcomeModal import/state/render; move LoadingTracker inside form card |
| `src/hooks/useAuth.tsx`       | Remove "Welcome back" toast                                                   |


No new dependencies. No database changes.