

## Showcase Gallery — Implementation Plan

You uploaded 9 screenshots showing the platform's key outputs: Intel Report sections, Disrupt ideas with AI visuals, Stress Test red/green team debate, and the Pitch Deck. These are reference screenshots from your own analyses — they will be copied into the project as static assets and displayed in a scrollable gallery.

### What Gets Built

**New component**: `src/components/ShowcaseGallery.tsx`
- Horizontal carousel using the existing `Carousel` / `CarouselContent` / `CarouselItem` from `src/components/ui/carousel.tsx` (Embla-based, already installed)
- Each slide: rounded card with the screenshot, a short caption, and a colored badge (e.g., "Intel", "Disrupt", "Stress Test", "Pitch Deck")
- Click-to-expand lightbox using the existing `Dialog` component — shows the full-resolution image
- Responsive: 1 image per slide on mobile, 2 on tablet, 3 on desktop via Embla's `slidesToScroll` option
- Navigation arrows using existing `CarouselPrevious` / `CarouselNext`
- Dot indicators below the carousel

**Placement**: New section on the About page between "What It Does" and "Built For", with the heading "See What It Produces".

### Asset Handling

All 9 uploaded images will be copied to `public/examples/` (not `src/assets/`, since there are many and they don't need bundler optimization — they're large screenshots best served statically):

```text
public/examples/
  intel-overview.png       ← image-63 (Overview section with scores)
  intel-user-journey.png   ← image-64 (User Journey steps)
  intel-supply-chain.png   ← image-65 (Supply Chain intel)
  intel-patent.png         ← image-66 (Patent intel with expired IP)
  disrupt-idea-1.png       ← image-67 (AuraDough visual mockup)
  disrupt-idea-2.png       ← image-68 (Play-Doh Artist Edition)
  stress-test-red.png      ← image-69 (Red Team debate)
  stress-test-green.png    ← image-70 (Green Team + precedents)
  pitch-deck-ask.png       ← image-71 (Pitch Deck — The Ask slide)
```

### Gallery Data Structure

```typescript
const SHOWCASE_ITEMS = [
  { src: "/examples/intel-overview.png", caption: "Market Overview & Confidence Scores", badge: "Intel", color: "primary" },
  { src: "/examples/intel-user-journey.png", caption: "User Journey Mapping", badge: "Intel", color: "primary" },
  { src: "/examples/intel-supply-chain.png", caption: "Supply Chain Intelligence", badge: "Intel", color: "primary" },
  { src: "/examples/intel-patent.png", caption: "Patent Landscape & Expired IP", badge: "Intel", color: "primary" },
  { src: "/examples/disrupt-idea-1.png", caption: "AI Product Visual & Scores", badge: "Disrupt", color: "green" },
  { src: "/examples/disrupt-idea-2.png", caption: "Redesigned Product Concept", badge: "Disrupt", color: "green" },
  { src: "/examples/stress-test-red.png", caption: "Red Team — Why It Will Fail", badge: "Stress Test", color: "red" },
  { src: "/examples/stress-test-green.png", caption: "Green Team — Why It Will Succeed", badge: "Stress Test", color: "green" },
  { src: "/examples/pitch-deck-ask.png", caption: "Investor Pitch Deck — The Ask", badge: "Pitch Deck", color: "blue" },
];
```

### Files Changed

| File | Change |
|------|--------|
| `public/examples/*.png` | 9 new image files copied from uploads |
| `src/components/ShowcaseGallery.tsx` | New component — carousel + lightbox |
| `src/pages/AboutPage.tsx` | Import and render `<ShowcaseGallery />` between "What It Does" and "Built For" |

### Technical Details

- Uses existing Embla carousel — no new dependencies
- Lightbox uses existing `Dialog` / `DialogContent` from shadcn
- Images lazy-loaded with `loading="lazy"` to avoid blocking page render
- Carousel configured with `{ align: "start", loop: true }` for continuous scrolling
- Mobile: single slide per view; Desktop: 3 slides via `basis-1/3` on `CarouselItem`
- Each card has a subtle `border border-border rounded-xl overflow-hidden shadow-sm` with the badge positioned as a small pill in the top-left corner

