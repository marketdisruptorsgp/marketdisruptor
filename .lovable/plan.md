# No dark slides. 

&nbsp;

# Pitch Deck Visual Wow Factor Upgrade

## Current State

Slides are predominantly white (`#ffffff`) with `#fafafa` panels, `#e8e8ec` borders, and a barely-visible grid pattern at 1.5% opacity. The accent glow is at 3-8% opacity. The result is clean but reads as a document rather than a presentation. Every slide has the same visual weight — no rhythm, no contrast, no drama.

## Plan

### 1. Introduce Dark "Hero" Slides for Key Moments

Alternate between light and dark slides to create visual rhythm. The **Cover**, **Problem**, **Market**, and **The Ask** slides will use a dark theme (`#0a0a0f` background) with light text and glowing accent elements.

**File: `src/components/pitch/PitchSlideFrame.tsx**`

- Add a `variant` prop to `PitchSlideFrame`: `"light" | "dark"` (default `"light"`)
- Dark variant: background `#0a0a0f`, text `#f4f4f5`, borders `rgba(255,255,255,0.08)`, footer `#111115`
- Increase `AccentGlow` opacity from 3-8% to 10-20% on dark slides for dramatic radial washes
- Add a subtle noise texture overlay (CSS `background-image` with inline SVG data URI) for depth

### 2. Amplify Cover Slide

**File: `src/components/pitch/PitchSlideFrame.tsx**` — `PitchCoverSlide`

- Switch to dark background with large radial accent gradient (35% opacity center fade)
- Add animated concentric accent rings behind the monogram (3 rings, staggered opacity)
- Product name in white with subtle text-shadow glow in accent color
- Add a horizontal gradient divider line (accent → transparent) below the title
- Increase geometric shapes: multiple offset circles at varying opacities

### 3. Richer Data Visualization Components

**File: `src/components/pitch/PitchSlideFrame.tsx**`

- `**SlideStatCard**`: Add a gradient background strip on the left edge, increase value font to 34px, add subtle inner shadow
- `**KeyMetricPanel**`: Make the glow ring more prominent (20% opacity, larger radius), add a pulsing accent dot indicator
- `**MarketSizeVisual**`: Add gradient fills to the concentric circles instead of flat opacity, add dashed connector lines between rings
- `**InsightCard**`: Increase the top gradient border from 3px to 4px, add a subtle gradient wash across the card background
- `**TakeawayCallout**`: Add a subtle pattern overlay and increase shadow depth

### 4. Add Visual Section Accents to Slide Frame

**File: `src/components/pitch/PitchSlideFrame.tsx**` — `PitchSlideFrame`

- Increase top accent bar from 4px to 6px with more vivid gradient
- Add a decorative corner accent (quarter-circle gradient in bottom-right, 4% opacity)
- Add a faint vertical accent stripe on the right side (mirror of left accent bar in header)
- Make the category label pill-shaped with tinted background instead of plain text

### 5. Upgrade Slide Content Styling

**File: `src/components/PitchDeck.tsx**`

- **Problem slide**: Use dark variant. Make the quote block larger with accent-tinted background
- **Market slide**: Use dark variant. MarketSizeVisual circles get accent gradient fills
- **The Ask slide**: Use dark variant. Funding amount displayed as a massive hero number with glow
- **Risks slide**: Add severity-colored left gradient strips instead of plain left borders
- Wrap `panel` style objects with subtle gradient backgrounds (`linear-gradient(135deg, #fafafa, #f8f8fa)` → `linear-gradient(135deg, #ffffff, #f8f9fc)`)

### 6. Add Geometric Depth Elements

**File: `src/components/pitch/PitchSlideFrame.tsx**`

- New `SlideDecorativeElements` component: renders 2-3 subtle geometric shapes per slide (circles, lines) using the accent color at 3-6% opacity
- Positioned in corners/edges to add depth without competing with content
- Different arrangements per slide number (modulo-based variation)

## Technical Approach

- All changes are inline styles (existing pattern) — no new CSS files
- Dark variant uses the same accent color system — just inverts the neutral palette
- `PitchSlideFrame` gets a `variant` prop; `PitchCoverSlide` is always dark
- No new dependencies
- Backwards-compatible: default variant is `"light"`, existing slides unchanged unless explicitly set

## Files to Edit


| File                                       | Changes                                                                       |
| ------------------------------------------ | ----------------------------------------------------------------------------- |
| `src/components/pitch/PitchSlideFrame.tsx` | Add dark variant, amplify visual elements, richer component styling           |
| `src/components/PitchDeck.tsx`             | Apply dark variant to cover/problem/market/ask slides, upgrade content panels |
