
# Polish UI Across All Modes, Steps, and Sections

## Overview

Apply consistent, professional styling across every component in the platform. Replace all colored tinted backgrounds (`primary-muted`, colored `/0.06` overlays), left-border accents, dashed borders, pulse animations, and emojis with clean neutral card styling. Mode colors (Blue for Product, Rose for Service, Violet for Business Model) will be used subtly for mode indicators only -- not for card backgrounds.

---

## Files to Modify (8 files)

### 1. `src/components/BusinessModelAnalysis.tsx` (782 lines, ~15 fixes)

**Issues found:**
- Line 264: `primary-muted` background on hero icon
- Line 402: `primary-muted` + left-border on "True Job To Be Done" card
- Line 533: `primary-muted` + left-border on challenge callouts
- Line 599: `primary-muted` + left-border on "Platform Opportunity"
- Line 643: `primary-muted` + left-border on "Bold Pricing Redesign"
- Line 689: `primary-muted` + left-border on "If You Were Disrupting..." card
- Lines 624, 663: Colored tinted backgrounds on revenue streams and disruptor cards
- Line 719: `primary-muted` on key changes cards
- Line 728-734: Green/blue tinted backgrounds + left-borders on value/economics cards
- Line 751: Checkmark emoji in milestone text
- Line 774: Green tinted "All sections explored" badge

**Fixes:**
- All `primary-muted` backgrounds become `hsl(var(--muted))` with `1px solid hsl(var(--border))`
- All colored left-borders removed; use bold header text for emphasis instead
- Revenue stream cards: neutral `hsl(var(--card))` bg, keep colored severity text only
- Disruptor card: neutral card bg, keep red text label
- Hero icon container: `hsl(var(--muted))` instead of `primary-muted`
- Challenge callouts: `hsl(var(--muted))` bg, remove left-border, keep bold colored label text
- Milestone checkmark emoji replaced with CheckCircle2 icon
- "All sections explored" badge: neutral `hsl(var(--muted))` bg with green CheckCircle2 icon (matching SectionNav style)

### 2. `src/components/PitchDeck.tsx` (530 lines, ~8 fixes)

**Issues found:**
- Line 140: `primary-muted` on hero icon
- Line 204: Destructive tinted card for "The Problem"
- Line 208: Green tinted card for "The Solution"
- Line 214: Amber tinted + left-border "Why Now?" card
- Line 270: `primary-muted` on growth rate card
- Line 305: `primary-muted` on highlighted financial cards
- Line 330: `primary-muted` on funding ask card
- Line 410: Left-borders on GTM phase cards
- Line 424: Green tinted launch budget card
- Line 464: Colored tinted risk severity cards

**Fixes:**
- Hero icon: `hsl(var(--muted))` bg
- Problem/Solution/Why Now cards: all use `hsl(var(--card))` bg with `1px solid hsl(var(--border))`, keep colored header text labels
- Growth rate, funding ask, highlighted financials: `hsl(var(--muted))` bg, `1px solid hsl(var(--border))`
- GTM phases: remove left-borders, use numbered bold labels instead
- Launch budget: neutral card with green text value
- Risk cards: neutral bg, keep colored severity text label

### 3. `src/components/CriticalValidation.tsx` (535 lines, ~10 fixes)

**Issues found:**
- Line 80-101: `SEVERITY_STYLES`, `STRENGTH_STYLES`, `OUTCOME_STYLES`, `STATUS_STYLES` all use colored bg tints
- Line 146: Colored tinted icon container on empty state
- Line 213: Red tinted + left-border on Red Team header
- Line 229, 246: Red tinted argument cards
- Line 261: Red tinted "Kill Shot" card
- Line 278: Green tinted + left-border on Green Team header
- Line 294, 310: Green tinted argument cards
- Line 326: Green tinted "Moonshot" card
- Line 362: Green tinted strategic recommendation cards
- Line 378-389: Emoji characters in Current Approach Assessment
- Line 398: Primary tinted verdict card
- Line 498: Colored status background cards in feasibility

**Fixes:**
- All style maps: change `bg` values to `hsl(var(--muted))` or `hsl(var(--card))`, keep colored `text` values and border as subtle `hsl(var(--border))`
- Red/Green Team headers: `hsl(var(--card))` bg, remove left-border, keep colored icon + label
- Kill Shot / Moonshot: `hsl(var(--card))` bg, `1px solid hsl(var(--border))`, keep bold colored label
- Emojis (checkmark, loop arrow): replace with lucide icons
- Feasibility cards: neutral backgrounds, keep colored status text labels

### 4. `src/components/BundleDeepDive.tsx` (207 lines, ~5 fixes)

**Issues found:**
- Line 84: `primary-muted` bg when open
- Line 99: "Tap to explore deeper" text prompt
- Line 131: Primary tinted + left-border "Why this works" card
- Line 163: Green tinted + left-border "Quick Win" card
- Line 170: Primary tinted "Competitive Moat" card
- Line 185: Destructive tinted risk cards

**Fixes:**
- Open state: `hsl(var(--muted))` bg
- Remove "Tap to explore deeper" prompt
- All content cards: `hsl(var(--card))` or `hsl(var(--muted))` bg, `1px solid hsl(var(--border))`, remove left-borders, keep bold colored label text
- Risk cards: neutral bg, keep red icon

### 5. `src/components/SectionNav.tsx` (308 lines, 2 remaining fixes)

**Issues found:**
- Line 167: Dashed border on unvisited pills
- Line 264: `animate-pulse` on unvisited grid dots

**Fixes:**
- Unvisited pills: `1px solid hsl(var(--border))` (solid, not dashed)
- Unvisited dots: remove `animate-pulse`, keep static dot

### 6. `src/components/SavedAnalyses.tsx` (~462 lines, 1 fix)

**Issue:** Line 170: `dashed` border on snippet card

**Fix:** Replace with `1px solid hsl(var(--border))`

### 7. `src/components/AssumptionsMap.tsx` (1 fix)

**Issue:** Line 44: `primary-muted` + left-border on assumption card

**Fix:** `hsl(var(--muted))` bg, `1px solid hsl(var(--border))`, remove left-border

### 8. `src/pages/Index.tsx` (~3 fixes)

**Issues:** Lines 686, 1134, 1176: `primary-muted` backgrounds on social signals and highlight cards

**Fixes:** Replace with `hsl(var(--muted))` and `1px solid hsl(var(--border))`

---

## Design Rules Applied Everywhere

| Pattern | Before | After |
|---------|--------|-------|
| Card backgrounds | `primary-muted`, colored tints (`/0.06`, `/0.08`) | `hsl(var(--muted))` or `hsl(var(--card))` |
| Emphasis borders | `borderLeft: 3px solid [color]` | Removed; bold header text carries emphasis |
| Borders | Dashed borders | Solid `1px solid hsl(var(--border))` |
| Animations | `animate-pulse` on dots/badges | Static elements |
| Emojis | Checkmark, loop, fire emoji chars | Lucide icons (CheckCircle2, RefreshCw, etc.) |
| Semantic colors | Card background tints | Text labels and small icons only |
| Mode awareness | Mode color on card backgrounds | Mode color on step number badges and header accents only |

## What Stays the Same

- Gradient hero banners (Elevator Pitch, Reinvented Model) -- these are intentional branding, not cheap tints
- Score bar colors (confidence scores use green/amber/red on progress bars -- semantic and appropriate)
- Tab navigation styling (already polished in SectionWorkflowNav)
- The overall layout, typography hierarchy, and component structure
