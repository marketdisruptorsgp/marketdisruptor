

# Modern Light Theme Redesign (Axial-Inspired)

## Overview

Full visual overhaul from dark theme to a clean, white-background design matching the Axial.net aesthetic: white backgrounds, generous whitespace, a strong blue accent, subtle gray borders, and pill-shaped CTA buttons. No emojis, no glow effects, no AI-looking decorations.

## What Changes

- White page background, very light gray card backgrounds
- Larger spacing and padding throughout all components
- Clean blue primary accent (similar to Axial's blue)
- Dark text on light backgrounds for high contrast readability
- Pill-shaped primary CTA buttons (rounded-full)
- Subtle shadows instead of heavy borders
- Larger typography with better hierarchy
- All inline `style={{ background: "hsl(var(--card))" }}` replaced with class-based theming

## Files Modified

| File | Changes |
|---|---|
| `src/index.css` | Rewrite all CSS variables to light palette: white background, light gray cards (#F8F9FC), near-black text (#1A1D2B), blue primary (#4A6CF7). Update all component utility classes with lighter borders, subtle shadows, more padding. Remove duplicate `.dark` block. |
| `tailwind.config.ts` | Increase border-radius values (lg: 1rem, md: 0.75rem, sm: 0.5rem). |
| `src/components/PlatformNav.tsx` | Remove inline `style` props. Use Tailwind classes for white bg. Increase font sizes from `text-xs` to `text-sm`. Make Upgrade button `rounded-full`. Increase vertical padding. |
| `src/components/HeroSection.tsx` | Remove inline `style` props. Use light gray background section. Increase padding. Use Tailwind classes. |
| `src/pages/DashboardPage.tsx` | Remove all inline `style` props. Increase content padding. Replace emoji icons in QuickStartTemplates with Lucide icons. Cards use `bg-card` class with shadow. |
| `src/components/DisruptionPathBanner.tsx` | Remove inline styles. Use Tailwind classes. More padding. |
| `src/components/ui/card.tsx` | Add `shadow-sm` to default card class. |
| `src/components/ui/button.tsx` | Increase default border-radius. Slightly larger default size. |
| `src/pages/AboutPage.tsx` | Remove inline styles. Cards use Tailwind classes. More spacious layout. |
| `src/pages/PricingPage.tsx` | Update to use new light theme classes. Cards get subtle shadows. |
| `src/pages/ResourcesPage.tsx` | Remove inline styles. Inherit new theme. |
| `src/pages/AuthPage.tsx` | Remove inline `inputStyle` object. Use Tailwind classes for inputs. Light theme for hero panel. |
| `src/components/LoadingTracker.tsx` | Remove inline styles. Use Tailwind classes. |

## New Color Palette

```text
Background:        white (0 0% 100%)
Card:              very light blue-gray (220 20% 97%)
Border:            soft gray (220 13% 90%)
Text (foreground): near-black (225 15% 15%)
Muted text:        readable gray (220 9% 46%)
Primary:           Axial blue (230 90% 63%)
Primary dark:      deeper blue (230 85% 55%)
Primary light:     lighter blue (230 70% 72%)
Success:           green (152 60% 44%)
Warning:           amber (36 80% 52%)
Destructive:       red (0 72% 52%)
```

## Key Design Principles

1. White space over density -- card padding increases, section gaps widen
2. Shadows over borders -- cards use `shadow-sm` with thin light borders
3. Pill buttons for primary CTAs -- `rounded-full` with generous horizontal padding
4. High contrast maintained -- near-black text on white/light backgrounds
5. No emojis -- QuickStartTemplates use Lucide icons instead
6. No glow, gradients, or pulse animations
7. Typography scales up slightly for readability

