

# Homepage Redesign + Mode Color-Coding

## Overview

Two major changes: (1) Replace the current dense workspace-style homepage with a clean Axial-inspired hero landing page, and (2) introduce consistent color-coding per disruption mode so users always know which mode they're in.

## 1. Mode Color System

Each mode gets a distinct accent color used consistently across the nav dropdown, form header, report pages, and breadcrumbs:

| Mode | Color | HSL |
|---|---|---|
| Product | Blue (primary) | 230 90% 63% |
| Service | Rose/Pink | 340 65% 55% |
| Business Model | Violet/Purple | 270 60% 58% |

These colors appear as:
- Left border accent on the icon box in the Access Modes dropdown (active item)
- A thin colored top bar on the analysis form card
- Colored mode badge/pill shown in nav bar when a mode is active (e.g., a small pill next to "Access Modes" showing "Product" in blue)
- Consistent coloring on report/results page headers

### CSS Variable Additions (src/index.css)

Add 3 new mode color variables:
```
--mode-product: 230 90% 63%;
--mode-service: 340 65% 55%;
--mode-business: 270 60% 58%;
```

### Higher Contrast Tweaks (src/index.css)

- Darken `--foreground` slightly to `224 20% 10%` for stronger text contrast
- Darken `--muted-foreground` to `220 10% 40%` for better readability
- Strengthen `--border` to `220 13% 86%` for more visible structure

## 2. Homepage Redesign (Axial-Style Hero)

Replace the current DashboardPage content (form, sidebar, DisruptionPathBanner) with a clean hero landing page when no analysis is active. The form moves behind the mode selection -- users click a mode pill first, which scrolls down to or reveals the form.

### New Homepage Structure

```text
+--------------------------------------------------+
|  PlatformNav (unchanged)                         |
+--------------------------------------------------+
|                                                  |
|          Reinvent any market.                    |
|          product  (bold, cycling word)           |
|          service                                 |
|          business model                          |
|                                                  |
|   Deconstruct markets, stress-test strategies,   |
|   and build what's next with AI-powered          |
|   competitive intelligence.                      |
|                                                  |
|   [Start Analysis]  [Learn More]                 |
|                                                  |
+--------------------------------------------------+
|  [Product]  [Service]  [Business Model]          |
|  (pill tabs, color-coded, clicking one opens     |
|   the analysis form below)                       |
+--------------------------------------------------+
|                                                  |
|  Analysis Form (shown when mode selected)        |
|  with colored top border matching mode           |
|                                                  |
+--------------------------------------------------+
|  Methodology strip (compact)                     |
+--------------------------------------------------+
|  Footer                                          |
+--------------------------------------------------+
```

### Files Modified

| File | Changes |
|---|---|
| `src/index.css` | Add `--mode-product`, `--mode-service`, `--mode-business` CSS variables. Increase foreground/muted-foreground contrast. Strengthen border color. |
| `src/pages/DashboardPage.tsx` | Major restructure: Add hero section at top with large headline (cycling word animation between "product", "service", "business model"), subtitle, two CTAs. Below hero, add color-coded mode pill tabs. Form only appears after selecting a mode. Remove the sidebar layout and "Your Activity" bar. Keep loading tracker, error state, business model form. Move sidebar content (stats, how-it-works, built-for) to below the fold or remove. |
| `src/components/HeroSection.tsx` | Simplify to just render PlatformNav (remove the welcome row and activity bar -- those are replaced by the hero in DashboardPage). |
| `src/components/PlatformNav.tsx` | Add active mode indicator: when a mode is selected, show a small colored pill next to "Access Modes" label. Color-code the icon boxes in the dropdown per mode. |
| `src/components/DisruptionPathBanner.tsx` | Remove or simplify -- the methodology strip becomes a compact single row below the form area instead of a separate banner. |

### DashboardPage Hero Details

- **Headline**: "Reinvent any" followed by a cycling/rotating word that fades between "product", "service", "business model" -- each word in its mode color. Uses CSS transition, not a glow/pulse animation.
- **Subtitle**: "Deconstruct markets, stress-test strategies, and build what's next with AI-powered competitive intelligence."
- **CTAs**: "Start Analysis" (solid blue pill button) scrolls to mode tabs. "Learn More" (outline pill button) navigates to /about.
- **Mode Pills**: Three horizontal pill buttons below the hero, color-coded. Clicking one sets the mode and reveals the form below with a smooth scroll. The active pill gets a filled background in its mode color.
- **Background**: Clean white with a very subtle light gray gradient at the bottom of the hero section for visual separation.

### Form Card Color-Coding

When the form is visible, the card gets a thin 3px top border in the active mode's color:
- Product: blue top border
- Service: rose top border  
- Business Model: violet top border

The mode label above the form also uses the mode color.

## 3. PlatformNav Mode Indicator

When a mode is active (user has selected one), show a small colored dot or pill next to "Access Modes" in the nav bar. In the dropdown, the active mode's icon box gets a left border or background tint in its color.

## Technical Details

### Word Cycling Animation

Simple `useEffect` with `setInterval` cycling through an array of 3 words every 3 seconds, with a CSS `opacity` transition (fade out, swap text, fade in). No framer-motion dependency needed.

### Removed from Homepage

- Welcome row ("Good morning, X's Workspace")
- Activity bar (Projects count, Latest Score, Member since)
- Right sidebar (Recent Projects, How It Works, Built For, Your Stats)
- Quick Start Templates
- DisruptionPathBanner (replaced by compact methodology strip)

These elements are informational but clutter the landing experience. Users access saved projects via the nav's Workspace dropdown, and stats via their profile.

