# Looks good but make each model have a different color to help differentiate them. 

&nbsp;

&nbsp;

# Global Design System Overhaul — Executive SaaS Aesthetic

## Overview

Apply the detailed design system prompt across every page, component, and breakpoint. Each analysis mode retains its own restrained accent color, used sparingly for borders, text, and small indicators — never for filled backgrounds or gradients.

## Mode Color System (Retained, Restrained)


| Mode           | Accent                          | Usage                              |
| -------------- | ------------------------------- | ---------------------------------- |
| Product        | `hsl(217 91% 38%)` deep cobalt  | Left borders, text, dot indicators |
| Service        | `hsl(340 65% 45%)` muted rose   | Left borders, text, dot indicators |
| Business Model | `hsl(271 70% 50%)` muted indigo | Left borders, text, dot indicators |
| Nostalgia      | `hsl(220 65% 18%)` primary navy | Left borders, text, dot indicators |


---

## Violations to Fix (by file)

### 1. `src/index.css` — Design Tokens

- Update primary background to `#0F1113` (deep charcoal)
- Ensure border-radius defaults are 4px globally
- Remove `--shadow-primary` glow variable if present
- Confirm 8pt spacing rhythm in base styles

### 2. `tailwind.config.ts`

- Set `borderRadius.lg` to `6px`, `md` to `4px`, `sm` to `2px` (already done, confirm)
- Ensure no animation utilities beyond accordion (no bounce, no scale)

### 3. `src/pages/Index.tsx` — Main Dashboard (~30 violations)

**Step CTA buttons (lines 1451-1521, 1757-1794):**

- Remove `linear-gradient` backgrounds
- Remove `boxShadow` glow effects
- Remove `rounded-2xl` (use `rounded` = 4px)
- Remove `hover:scale-[1.02]`
- Replace with flat accent-colored solid buttons, max height 44px, no glow

**Step 3/4/5 section wrappers (lines 1542, 1582, 1645, 1810, 1836, 1898):**

- Remove `rounded-2xl` -> `rounded`
- Remove gradient backgrounds in headers (`linear-gradient(135deg, ...)`)
- Remove glow `boxShadow`
- Use flat `hsl(var(--card))` background with a left border accent instead

**Step number badges (w-10 h-10 rounded-xl):**

- Change to `w-7 h-7 rounded` (4px radius, smaller)
- Remove `font-extrabold` -> `font-semibold`

**"Explore" badges (lines 1612, 1865):**

- Remove `animate-pulse`
- Remove glow `boxShadow`
- Replace with a simple dot indicator (w-1.5 h-1.5)

**Stress test sub-tabs (lines 1600-1620, 1852-1872):**

- Remove `rounded-xl` -> `rounded`
- Remove glow boxShadow
- Simplify to text-only tabs with underline active state

**Detail tab previous/next buttons:**

- Remove `rounded-xl` and `rounded-2xl` -> `rounded`
- Remove gradient styling on "Previous" button

**SGP Capital CTA (lines 1932-1967):**

- Remove `rounded-2xl` -> `rounded`
- Remove gradient background
- Simplify to flat card with subtle border

### 4. `src/components/HeroSection.tsx`

- Already minimal — confirm `rounded` usage (currently using `rounded-lg`)
- Tighten heading: remove extra font weight if over 700

### 5. `src/components/AnalysisForm.tsx`

- Confirmation dialog header gradient -> flat dark background
- Remove `rounded-xl` on inputs -> `rounded` (4px)
- Remove `rounded-2xl` on cards -> `rounded`
- Capability stat cards: flatten, remove any heavy styling
- Submit button: remove glow boxShadow, use flat primary

### 6. `src/pages/AuthPage.tsx`

- Remove background gradient (`linear-gradient(165deg, ...)`) -> flat `#0F1113`
- Remove `rounded-xl` on inputs -> `rounded`
- Remove `rounded-2xl` on icon containers -> `rounded`
- Mode toggle: remove `rounded-xl` -> `rounded`
- Submit button: remove glow boxShadow
- Feature cards on mobile: remove `rounded-xl` -> `rounded`
- "Check your inbox" confirmation: remove `rounded-2xl` -> `rounded`

### 7. `src/pages/PricingPage.tsx`

- Remove background gradient -> flat `#0F1113`
- Tier cards: remove `rounded-2xl` -> `rounded`, remove gradient on Disruptor card
- Badges ("Your Plan", "Most Popular"): remove `rounded-full` -> `rounded`
- Upgrade buttons: remove `hover:scale-[1.02]`, remove glow boxShadow
- Icon containers: remove `rounded-xl` -> `rounded`

### 8. `src/components/StepNavigator.tsx`

- Already fairly clean — confirm no gradient usage

### 9. `src/components/ProductCard.tsx`

- Remove `rounded-lg` on elements -> `rounded`
- Ensure tag pills use 4px radius

### 10. `src/components/LoadingTracker.tsx`

- Already clean — confirm `rounded-sm` usage on progress bar is acceptable

### 11. Additional Components to Audit

- `RevivalScoreBadge.tsx` — remove `rounded-full` if using pill badges
- `ScoreBar.tsx` — ensure consistent radius
- `FlippedIdeaCard.tsx` — remove any rounded-xl/2xl
- `WelcomeModal.tsx` — flatten any gradients
- `PaywallModal.tsx` — flatten styling
- `PitchDeck.tsx` — remove gradients, rounded-2xl
- `FirstPrinciplesAnalysis.tsx` — remove gradients, rounded-2xl
- `CriticalValidation.tsx` — remove gradients, rounded-2xl
- `BusinessModelAnalysis.tsx` — remove gradients, rounded-2xl

---

## Technical Details

### CSS Token Updates (`index.css`)

```text
Dark theme values:
--background: 220 16% 7%    (approx #0F1113)
--card: 220 16% 9%
--border: 220 16% 14%
```

### Border Radius Rule

Every `rounded-xl`, `rounded-2xl`, `rounded-full` (except tiny dot indicators) replaced with `rounded` (4px) or `rounded-md` (4px).

### Shadow Rule

Only shadow allowed: `0 1px 2px 0 hsl(220 14% 10% / 0.04)` (card resting state).
No glow, no colored shadows, no `boxShadow` with color opacity.

### Typography Constraints

- Max 2 weights for body: `font-medium` (500), `font-semibold` (600)
- Hero only: `font-bold` (700)
- Remove all `font-extrabold` (800) usage
- Remove all `font-black` (900) usage

### Button Styles (exactly 2)

1. **Primary**: flat `hsl(var(--primary))` background, white text, `rounded`, `h-9` or `h-10`
2. **Secondary**: `1px solid hsl(var(--border))`, transparent background, foreground text, `rounded`

### Interaction Rules

- Remove all `hover:scale-*` transforms
- Remove all `animate-pulse` except loading spinners
- Transitions: `transition-colors duration-150` only
- No bounce, no spring, no glow on hover

### Mobile

- Minimum button height: 44px (`min-h-[44px]`)
- Preserve spacing integrity (no cramping)
- Typography scales proportionally via existing responsive classes

### Scope

All files listed above will be updated in a single pass. The changes are purely visual — no logic, data flow, or API changes.