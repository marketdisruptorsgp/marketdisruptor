

## Plan: Global Font Color + Size Upgrade

### Problem
Gray/muted text throughout the platform reduces readability. Font sizes need a ~10% bump across all modes, steps, and sections.

### Approach — Two CSS-level changes (no component edits needed)

**1. Kill gray text globally** — Change `--muted-foreground` CSS variable from `220 10% 40%` (gray) to match `--foreground` (`224 20% 10%`, near-black). This single change propagates to every `text-muted-foreground` usage across all 117+ files without touching any component code.

**2. Bump all font sizes ~10%** — Increase the base `body` font-size from `0.875rem` to `0.9625rem`, and scale each typography role class proportionally:

| Role | Current | New (~+10%) |
|------|---------|-------------|
| body | 0.875rem (14px) | 0.9625rem (15.4px) |
| typo-nav-primary | 0.9375rem | 1.03rem |
| typo-step-title-active/inactive | 0.875rem | 0.9625rem |
| typo-step-subtitle | 0.8125rem | 0.894rem |
| typo-page-title | 2rem | 2.2rem |
| typo-page-meta | 0.875rem | 0.9625rem |
| typo-card-eyebrow | 0.8125rem | 0.894rem |
| typo-card-title | 1rem | 1.1rem |
| typo-card-body | 0.875rem | 0.9625rem |
| typo-card-meta | 0.8125rem | 0.894rem |
| typo-section-title | 1.125rem | 1.2375rem |
| typo-section-description | 0.875rem | 0.9625rem |
| typo-status-label | 0.8125rem | 0.894rem |
| typo-button-primary | 0.875rem | 0.9625rem |
| typo-button-secondary | 0.8125rem | 0.894rem |

### Files to edit
- **`src/index.css`** — The only file that needs changes. Both the CSS variable and all typography class sizes live here.

### What this covers
- All modes (Product, Service, Business Model)
- All steps (Intel, Disrupt, Redesign, Stress Test, Pitch)
- All sections, cards, panels, navigation, badges, buttons
- Existing and new analyses

### What stays unchanged
- No component files touched
- Color accents, borders, spacing unaffected
- Heading font family (Space Grotesk) unchanged

