

# Mobile UX Overhaul — World-Class Standards

## Current Issues Identified

1. **Navigation**: Mobile hamburger menu is a plain list with no visual hierarchy, no active state indicators, and no quick-action buttons. The user avatar button is too small (28px tap target). No bottom navigation for core actions.
2. **Start Page Hero**: `text-7xl` title causes horizontal overflow on small screens (390px). The rotating word has no width constraint, causing layout shift.
3. **Mode Cards**: `grid-cols-1 md:grid-cols-3` works but cards are overly tall on mobile with excessive padding (`p-5 sm:p-6`). No horizontal swipe affordance.
4. **Step Navigator**: `min-w-max` with horizontal scroll and no scroll indicators. Steps are tiny pill-shaped buttons that are hard to tap. No visible scrollbar or swipe hint.
5. **Showcase Gallery**: Carousel arrows (`CarouselPrevious`/`CarouselNext`) clip outside container on mobile (`-left-4`). Images are full-width but captions are cramped.
6. **Analysis Setup (NewAnalysisPage)**: The "Deconstruct My Problem" textarea and clarifier section has excessive nested padding on mobile. "Continue to Configuration" button is right-aligned and small on mobile — should be full-width.
7. **Footer**: Duplicated across DashboardPage and StartPage with inconsistent structure.
8. **Modals/Sheets**: UserHeader dropdown uses absolute positioning with `min(14rem, calc(100vw - 2rem))` which works but the font sizes and spacing are desktop-optimized.
9. **About Page Hero**: `text-6xl sm:text-8xl` is good but line break mid-phrase on smaller screens.
10. **Pipeline Steps (How It Works)**: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-6` — 2-col grid on mobile makes cards too narrow, descriptions get truncated.
11. **Touch targets**: Multiple buttons throughout are below the 44px minimum recommended by Apple HIG / Material Design.

## Plan

### 1. Add Persistent Bottom Navigation Bar (Mobile Only)
**New file: `src/components/MobileBottomNav.tsx`**

- Fixed bottom bar visible only on `md:hidden`
- 4 tabs: Home, New Analysis, Workspace, Profile
- Active state with accent color fill, inactive with muted
- `safe-area-inset-bottom` padding for notched devices
- 56px height with 44px+ tap targets
- Renders in `App.tsx` inside the auth-gated routes

### 2. Fix Start Page Mobile Hero
**File: `src/pages/StartPage.tsx`**

- Reduce hero title from `text-7xl` to `text-4xl` on mobile (keep `sm:text-8xl md:text-9xl`)
- Set `min-h-[52px]` on the rotating word container to prevent layout shift
- Reduce hero padding: `pt-6 sm:pt-12`

### 3. Improve Mobile Navigation Drawer
**File: `src/components/PlatformNav.tsx`**

- Add active route highlighting in mobile menu
- Add a prominent "Start Analysis" CTA button at the top of the drawer
- Increase touch targets to 48px height
- Add user info + plan badge at bottom of drawer
- Sheet width from `w-72` to `w-[85vw] max-w-sm`

### 4. Optimize Mode Cards for Mobile
**File: `src/pages/NewAnalysisPage.tsx`**

- On mobile: make mode cards horizontal scroll (`flex overflow-x-auto snap-x`) instead of stacked grid — shows partial next card as swipe affordance
- Reduce internal padding to `p-4` on mobile
- Make "Continue to Configuration" button full-width on mobile
- Reduce "Have a specific problem in mind?" divider text size on mobile

### 5. Enhance Step Navigator for Mobile
**File: `src/components/StepNavigator.tsx`**

- Add scroll-snap behavior to step cards
- Show gradient fade on right edge to hint at scrollability
- Increase step card tap area to 48px minimum height
- Add step number badge visible on mobile

### 6. Fix Showcase Gallery Mobile
**File: `src/components/ShowcaseGallery.tsx`**

- Move carousel arrows inside the card area on mobile (not outside the container)
- Add padding to prevent arrow clipping
- Reduce heading size: `text-xl sm:text-3xl`

### 7. Global Mobile Spacing & Touch Targets
**File: `src/index.css`**

- Add `.touch-target-min` utility class: `min-h-[44px] min-w-[44px]`
- Add `env(safe-area-inset-bottom)` padding to fixed bottom elements
- Add scrollbar-hide utility for horizontal scroll containers

### 8. Pipeline Steps Mobile Layout
**File: `src/pages/StartPage.tsx`**

- Change from `grid-cols-2` to single-column vertically stacked cards on mobile (`grid-cols-1 sm:grid-cols-3 lg:grid-cols-6`)
- Or use horizontal scroll with snap on mobile for a more premium feel

### 9. Footer Consolidation
**Files: `src/pages/StartPage.tsx`, `src/pages/DashboardPage.tsx`**

- Extract shared footer into `src/components/AppFooter.tsx`
- Add `pb-20` on mobile to account for bottom nav bar

### 10. About Page Mobile
**File: `src/pages/AboutPage.tsx`**

- Reduce hero title to `text-4xl sm:text-6xl md:text-8xl` for mobile
- Reduce hero padding: `pt-16 sm:pt-24`

## Technical Details

- Bottom nav uses `useLocation()` for active state
- All touch targets will meet 44px minimum (Apple HIG)
- `safe-area-inset-bottom` via Tailwind's `pb-[env(safe-area-inset-bottom)]` for iPhone notch
- Horizontal scroll containers use `snap-x snap-mandatory` with `snap-center` children
- No new dependencies needed — uses existing framer-motion for subtle transitions

## Files to Create/Edit

| File | Action |
|------|--------|
| `src/components/MobileBottomNav.tsx` | Create |
| `src/components/AppFooter.tsx` | Create |
| `src/App.tsx` | Add MobileBottomNav |
| `src/pages/StartPage.tsx` | Fix hero, pipeline layout |
| `src/pages/AboutPage.tsx` | Fix hero sizing |
| `src/pages/NewAnalysisPage.tsx` | Mode cards, button sizing |
| `src/pages/DashboardPage.tsx` | Use AppFooter, bottom padding |
| `src/components/PlatformNav.tsx` | Enhance mobile drawer |
| `src/components/StepNavigator.tsx` | Scroll snap, touch targets |
| `src/components/ShowcaseGallery.tsx` | Fix arrow positioning |
| `src/index.css` | Add mobile utilities |

