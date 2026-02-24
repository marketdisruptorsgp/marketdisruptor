

## Add Showcase Gallery to Homepage + Separate Start Pages per Mode

### What Changes

The homepage (DashboardPage) currently shows mode pills and the analysis form inline. The plan is to:

1. **Add the ShowcaseGallery** to the homepage below the "Scrutiny CTA" section — same carousel with Play-Doh screenshots, auto-rotation, lightbox
2. **Create 3 new pages** (`/start/product`, `/start/service`, `/start/business`) — each contains the mode-specific analysis form, contextual tips, and loading/error states
3. **Remove the inline form from the homepage** — the mode pills now link to the new start pages instead of expanding the form inline

### Homepage Flow (After)

```text
┌─────────────────────────────────┐
│  PlatformNav                    │
├─────────────────────────────────┤
│  "Rethink any [product]"        │
│  Built For grid                 │
├─────────────────────────────────┤
│  DisruptionPathBanner           │
├─────────────────────────────────┤
│  Scrutiny CTA                   │
├─────────────────────────────────┤
│  ShowcaseGallery (Play-Doh)     │  ← NEW
├─────────────────────────────────┤
│  Value Prop Callout             │
├─────────────────────────────────┤
│  Mode Pills → link to           │
│  /start/product                 │
│  /start/service                 │
│  /start/business                │
├─────────────────────────────────┤
│  Footer                         │
└─────────────────────────────────┘
```

### New Start Pages

Each page (`/start/product`, `/start/service`, `/start/business`) will contain:
- PlatformNav header
- Mode header with accent color (e.g., "Disrupt This Product")
- Contextual pro tip
- The AnalysisForm pre-set to that mode
- Loading tracker + error state
- Footer

These pages will use the existing `AnalysisContext` for state management, so analysis flow continues to work the same way (results navigate to `/analysis/:id/report`).

### Files Changed

| File | Change |
|------|--------|
| `src/pages/StartProductPage.tsx` | New — product analysis form page |
| `src/pages/StartServicePage.tsx` | New — service analysis form page |
| `src/pages/StartBusinessPage.tsx` | New — business model form page |
| `src/pages/DashboardPage.tsx` | Remove inline form; add ShowcaseGallery; mode pills become links to `/start/*` |
| `src/App.tsx` | Add routes for `/start/product`, `/start/service`, `/start/business` |

### Navigation Updates

- Mode pills on homepage → `navigate("/start/product")` etc.
- "Start Disrupting" dropdown in PlatformNav → same targets
- Scrutiny CTA → navigates to `/start/product` (default)
- All existing analysis result routes unchanged

### Technical Details

- The 3 start pages share identical structure — a small shared layout component `StartPageLayout` will be created to avoid duplication
- Each page sets `analysis.mainTab` and `analysis.activeMode` on mount so the context stays in sync
- The `AnalysisForm` component is reused as-is, pre-set to `phase: "form"` (skipping the mode selector since the page itself is mode-specific)
- ShowcaseGallery is imported directly from the existing component — no changes needed to the gallery itself

