

## Workspace Dashboard Grid Layout

Transform the current single-column scrolling workspace into a **dashboard-style grid layout** inspired by the reference image, where content is organized into distinct visual cards/panels arranged in a grid rather than a vertical scroll.

### Current State
The workspace is a `max-w-5xl` single-column layout with sections stacked vertically: Metrics Strip → Favorites → Intelligence Explorer → Saved Conversations → All Projects → Action Items → Score Intelligence → Top Performers. Users must scroll extensively.

### Proposed Layout

**Desktop (lg+):** A CSS grid with mixed card sizes, similar to the reference dashboard:

```text
┌─────────────────┬──────────────────┬─────────────────┐
│  Metrics Strip (full width, 4 cols)                   │
├─────────────────┬──────────────────┬─────────────────┤
│  My Top Choices │  All Projects    │  Score Intel     │
│  (favorites)    │  (list+filters)  │  (panel)         │
│  ~col-span-1    │  ~col-span-1     │  ~col-span-1     │
├─────────────────┼──────────────────┼─────────────────┤
│  Intelligence   │  Action Items    │  Top Performers  │
│  Explorer       │  (panel)         │  (ranked list)   │
│  ~col-span-1    │  ~col-span-1     │  ~col-span-1     │
└─────────────────┴──────────────────┴─────────────────┘
```

**Tablet:** 2-column grid with cards wrapping.  
**Mobile:** Single column (current behavior preserved).

### Implementation Plan

1. **Restructure WorkspacePage layout** — Replace the `space-y-8` vertical stack with a responsive CSS grid (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`). Full-width sections (metrics, page header) span all columns. Each section becomes a self-contained card with fixed/max height and internal scroll.

2. **Constrain card heights** — Give each grid card a `max-h` with `overflow-y-auto` so they don't push the grid tall. The "All Projects" list, "Intelligence Explorer", and "Top Performers" get internal scrolling rather than extending the page.

3. **Adjust section cards for grid fit** — Each section already uses `rounded-xl border bg-card p-5` styling. Ensure consistent padding, remove redundant wrappers, and make cards fill their grid cells with `h-full`.

4. **Keep metrics strip full-width** — The 4-stat row spans all columns as a banner at the top.

5. **Mobile fallback** — Below `md` breakpoint, revert to single-column stacked layout (current UX preserved).

### Files to Modify
- `src/pages/WorkspacePage.tsx` — Primary restructure from vertical stack to grid layout

