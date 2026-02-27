## Header & Homepage Fixes

### 1. Remove "OS" bubble from header (PlatformNav.tsx)

Remove lines 78-80 — the `<span>` with the "OS" badge next to "Market Disruptor".

### 2. Make nav tab text black instead of gray (PlatformNav.tsx)

Change all inactive nav tab classes from `text-muted-foreground` to `text-foreground` so they render black by default. Affects Portfolio, Intel, Photo Analysis, About, and Resources tabs.

### 3. Sync DisruptionPathBanner step icon colors with rotating hero text (DashboardPage.tsx + DisruptionPathBanner.tsx)

Currently each step has its own hardcoded color. Instead, make all 6 step icons use the same color as the currently active rotating word (product → blue, service → pink, business → purple). and they should all change colors on own, not have to hover over them to see the color.

**DisruptionPathBanner.tsx changes:**

- Add a new prop `accentColor?: string` to `DisruptionPathBannerProps`
- When `accentColor` is provided, use it for ALL step circle backgrounds (desktop hover/active state and mobile) instead of individual per-step colors

**DashboardPage.tsx changes:**

- Pass the current `MODE_WORDS[wordIndex].color` as `accentColor` to `<DisruptionPathBanner />`

### Files to edit

- `src/components/PlatformNav.tsx` — remove OS bubble, make tabs black
- `src/components/DisruptionPathBanner.tsx` — accept and apply `accentColor` prop
- `src/pages/DashboardPage.tsx` — pass accent color to DisruptionPathBanner