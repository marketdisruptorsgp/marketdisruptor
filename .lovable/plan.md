

# Global Typography System

## Overview

Create a centralized typography system with 15 named roles, applied via Tailwind utility classes. All inline `text-*`, `font-*`, and color overrides for text will be replaced with role-based classes. Typography does NOT vary by mode — only accent colors differ.

## Typography Role Definitions

All roles use `Inter` unless marked `display` (Space Grotesk).

```text
Role                 | Size   | Weight | Line-H | Color              | Font
─────────────────────|────────|────────|────────|────────────────────|─────────
nav-primary          | 14px   | 600    | 1.4    | foreground         | sans
step-title-active    | 13px   | 700    | 1.3    | inherit (context)  | sans
step-title-inactive  | 13px   | 700    | 1.3    | muted-foreground   | sans
step-subtitle        | 10px   | 500    | 1.3    | muted-foreground   | sans
page-title           | 30px+  | 700    | 1.2    | foreground         | display
page-meta            | 13px   | 400    | 1.5    | muted-foreground   | sans
card-eyebrow         | 11px   | 600    | 1.4    | muted-foreground   | sans (uppercase, tracking-wider)
card-title           | 14px   | 600    | 1.3    | foreground         | sans
card-body            | 13px   | 400    | 1.5    | foreground         | sans
card-meta            | 10px   | 500    | 1.4    | muted-foreground   | sans
section-title        | 14px   | 700    | 1.3    | foreground         | display
section-description  | 13px   | 400    | 1.5    | muted-foreground   | sans
status-label         | 9px    | 600    | 1.3    | inherit            | sans (uppercase, tracking-widest)
button-primary       | 14px   | 600    | 1      | primary-foreground | sans
button-secondary     | 12px   | 600    | 1      | foreground         | sans
```

## Base Body Style
`body` selector: Inter, 13px (`0.8125rem`), `#000000` (foreground), weight 400, line-height 1.5.

## Implementation Steps

### Step 1 — Define Tailwind plugin classes in `src/index.css`

Add a new `@layer components` block defining each typography role as a CSS class (e.g., `.typo-nav-primary`, `.typo-page-title`, etc.). Each class sets `font-size`, `font-weight`, `line-height`, `font-family`, `letter-spacing`, `text-transform`, and `color` as appropriate. This keeps all definitions in one place and avoids scattering values.

Example:
```css
.typo-nav-primary {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.4;
  color: hsl(var(--foreground));
}
.typo-card-eyebrow {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 0.6875rem;
  font-weight: 600;
  line-height: 1.4;
  color: hsl(var(--muted-foreground));
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
/* ... 13 more roles */
```

### Step 2 — Update base body style in `src/index.css`

Change body font-size from browser default to `0.8125rem` (13px), ensure `color: hsl(var(--foreground))`, weight 400, line-height 1.5.

### Step 3 — Update `src/theme/designTokens.ts`

Replace the existing `typeScale` object with the new 15-role system so the token file stays in sync as documentation.

### Step 4 — Update components to use `typo-*` classes

Replace inline `text-sm font-bold`, `text-xs font-extrabold`, `text-[10px] font-semibold`, etc. with the corresponding `typo-*` class. **~45 component files** need updates. Key files and their mappings:

| Component | Current Pattern | New Class |
|---|---|---|
| `PlatformNav` — nav links | `text-sm font-semibold` | `typo-nav-primary` |
| `StepNavigator` — step labels | `text-xs sm:text-sm font-extrabold` | `typo-step-title-active` / `typo-step-title-inactive` |
| `StepNavigator` — step desc | `text-[9px] sm:text-[10px]` | `typo-step-subtitle` |
| `DashboardPage` — hero h1 | `text-3xl sm:text-5xl font-bold` | `typo-page-title` (responsive sizes kept) |
| `DashboardPage` — subtitle | `text-sm sm:text-base text-muted-foreground` | `typo-page-meta` |
| `ProductCard` — category | `section-label text-[10px]` | `typo-card-eyebrow` |
| `ProductCard` — name | `font-semibold text-xs sm:text-sm` | `typo-card-title` |
| `ProductCard` — insight | `text-[11px] text-muted-foreground` | `typo-card-body` |
| `ProductCard` — market size | `text-[10px] text-muted-foreground` | `typo-card-meta` |
| `ModeHeader` — title | `text-base sm:text-lg font-bold` | `typo-section-title` |
| `JourneySection` — label | `text-[0.6875rem] font-semibold uppercase` | `typo-card-eyebrow` |
| `JourneySection` — summary | `text-sm font-medium` | `typo-section-description` |
| `SectionHeader` — label | `text-sm font-extrabold` | `typo-section-title` |
| `SectionWorkflowNav` — tab label | `text-[11px] sm:text-xs font-bold` | `typo-card-title` (smaller variant) |
| `SectionWorkflowNav` — counter | `text-[9px] font-bold uppercase` | `typo-status-label` |
| `DataLabel` / `LeverageScore` | `text-[9px] font-semibold` | `typo-status-label` |
| `SectionNav` buttons | `text-sm font-bold` | `typo-button-primary` |
| `SectionNav` — detail toggle | `text-[10px] font-bold uppercase` | `typo-status-label` |
| All `section-label` usages | `.section-label` class | `typo-card-eyebrow` (merge into it) |

### Step 5 — Normalize `font-extrabold` → `font-bold`

The design system specifies weight 700 max. All `font-extrabold` (800) occurrences across components will be changed to use the role's defined weight (700 or 600).

### Step 6 — Remove the old `.section-label` CSS class

It's replaced by `typo-card-eyebrow`. Remove from `index.css` and update all references.

## Files Modified

- `src/index.css` — add 15 `typo-*` classes, update body, remove `.section-label`
- `src/theme/designTokens.ts` — update `typeScale` to match new roles
- ~45 component files — replace inline typography with `typo-*` classes

## What Does NOT Change

- Color accents for modes (only accent colors differ by mode, not typography)
- Layout, spacing, container widths
- Component structure and props
- Responsive breakpoints (hero title keeps responsive sizing via `typo-page-title` + responsive overrides)

