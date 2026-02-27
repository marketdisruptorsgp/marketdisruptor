

## Remove Photo Analysis Tab & Move to Start Page

### Changes

#### 1. Remove Photo Analysis from header nav (PlatformNav.tsx)
- Delete the desktop Photo Analysis `<NavigationMenuItem>` (lines 108-117)
- Delete the mobile Photo Analysis link (lines 216-223)

#### 2. Add Photo Analysis card to Start Page (StartPage.tsx)
- Add a 4th card below the 3 mode cards — a distinct "Photo Analysis" section with Camera icon
- Use a full-width card spanning all 3 columns, styled differently (e.g. dashed border or lighter bg) to distinguish it as a quick-access tool vs a full pipeline
- Card navigates to `/instant-analysis` on click
- Include brief description: "Point. Shoot. Understand Everything." with capabilities list (Supply Chain, User Journey, Patent Landscape, Market Position)

#### 3. Keep the `/instant-analysis` route in App.tsx
- No routing changes needed — page still exists, just no longer in the nav

### Files to edit
- `src/components/PlatformNav.tsx` — remove Photo Analysis from desktop + mobile nav
- `src/pages/StartPage.tsx` — add Photo Analysis card below the 3 mode cards

