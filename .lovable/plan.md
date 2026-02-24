

# Market Disruptor Executive Design System

Official governing specification for all UI implementation across Product, Service, and Business Model modes.

---

## 1. Design Philosophy

The Market Disruptor interface communicates **structured reasoning**, **evidence-weighted insight**, and **professional credibility**. Every pixel serves an analytical purpose.

**Core tenets:**

- **Clarity over decoration** -- if a visual element does not aid interpretation, it is removed.
- **Interpretation over presentation** -- the interface guides the user toward a conclusion, not just data.
- **Restraint as authority** -- minimal color, generous whitespace, and precise typography signal institutional credibility.
- **Signal density, not data density** -- every visible element must carry interpretive weight.

The UI must read like an executive analytical report, not a consumer SaaS dashboard.

---

## 2. Visual Principles

1. **Evidence hierarchy**: Claim first, evidence second, implication third. Every section follows this reading order.
2. **Mode identity through color, not layout**: Product, Service, and Business modes share identical structural layouts. Only accent color changes.
3. **Whitespace is content**: Empty space signals confidence and aids scanning speed.
4. **Data before chrome**: Charts, scores, and indicators take visual priority over containers, borders, and decorative elements.
5. **3-second rule**: Any headline, score, or data callout must be interpretable in under 3 seconds.
6. **Progressive disclosure**: Summary first, detail on demand. Use collapsible panels and expandable cards, never long scrolling walls.

---

## 3. Design Tokens (Code-Ready)

The following token structure maps to `src/theme/designTokens.ts`:

```typescript
// src/theme/designTokens.ts

// ── Spacing Scale ──
// 4px base unit. All spacing derives from this.
export const spacing = {
  0:    "0px",
  0.5:  "2px",
  1:    "4px",
  1.5:  "6px",
  2:    "8px",
  3:    "12px",
  4:    "16px",
  5:    "20px",
  6:    "24px",
  8:    "32px",
  10:   "40px",
  12:   "48px",
  16:   "64px",
  20:   "80px",
} as const;

// ── Border Radius Scale ──
export const radii = {
  none: "0px",
  sm:   "4px",       // tags, badges, inline indicators
  md:   "8px",       // buttons, inputs, small cards
  lg:   "10px",      // section panels, cards (--radius)
  xl:   "16px",      // modal dialogs, completion panels
  full: "9999px",    // pills, avatar circles
} as const;

// ── Neutral Palette ──
// HSL values matching CSS custom properties
export const neutrals = {
  white:      "0 0% 100%",
  gray50:     "220 20% 97%",    // card surfaces
  gray100:    "220 14% 95%",    // muted backgrounds
  gray200:    "220 14% 93%",    // accent backgrounds
  gray300:    "220 13% 86%",    // borders, dividers
  gray400:    "220 10% 65%",    // disabled text
  gray500:    "220 10% 40%",    // muted foreground
  gray900:    "224 20% 10%",    // primary foreground
} as const;

// ── Semantic Colors ──
export const semantic = {
  success:      "152 60% 44%",
  warning:      "36 80% 52%",
  destructive:  "0 72% 52%",
  info:         "217 91% 45%",
} as const;

// ── Confidence Indicator Colors ──
export const confidence = {
  verified:       "hsl(142 70% 35%)",   // dark green -- factual
  modeled:        "hsl(217 91% 45%)",   // steel blue -- computed
  assumption:     "hsl(38 92% 42%)",    // amber -- inferred
  dataGap:        "hsl(0 72% 52%)",     // red -- missing
  userProvided:   "hsl(271 70% 45%)",   // violet -- manual
  visualInference:"hsl(200 80% 45%)",   // teal -- image-derived
} as const;

// ── Score Thresholds ──
export const scoreColors = {
  high:  "160 60% 44%",   // score >= 8
  mid:   "36 77% 52%",    // score >= 5
  low:   "0 72% 52%",     // score < 5
} as const;

// ── Risk Severity ──
export const riskColors = {
  low:    "hsl(142 70% 35%)",
  medium: "hsl(38 92% 42%)",
  high:   "hsl(0 72% 52%)",
} as const;

// ── Mode Accent Palette ──
export const modeAccent = {
  product: {
    primary:    "hsl(217 91% 38%)",
    outline:    "hsl(217 91% 60%)",
    background: "hsl(217 91% 96%)",
  },
  service: {
    primary:    "hsl(340 75% 50%)",
    outline:    "hsl(340 75% 65%)",
    background: "hsl(340 75% 96%)",
  },
  business: {
    primary:    "hsl(271 81% 55%)",
    outline:    "hsl(271 81% 70%)",
    background: "hsl(271 81% 96%)",
  },
} as const;

// ── Surface Backgrounds ──
export const surfaces = {
  page:       "hsl(0 0% 100%)",          // white page
  card:       "hsl(220 20% 97%)",        // elevated card
  muted:      "hsl(220 14% 95%)",        // inset/recessed
  callout:    "hsl(220 14% 95%)",        // insight panels
  overlay:    "hsl(224 20% 10% / 0.5)",  // modal backdrop
} as const;

// ── Divider Styles ──
export const dividers = {
  subtle:   "1px solid hsl(220 13% 86%)",
  section:  "1px solid hsl(220 13% 86%)",
  emphasis: "1px solid hsl(220 13% 78%)",
  mode:     "3px solid",   // left-border accent, color from mode
} as const;

// ── Shadows ──
// Shadows are used sparingly: cards only.
export const shadows = {
  card:      "0 1px 3px 0 hsl(220 20% 80% / 0.12), 0 1px 2px -1px hsl(220 20% 80% / 0.08)",
  cardHover: "0 8px 24px -4px hsl(220 20% 80% / 0.18), 0 2px 6px -1px hsl(220 20% 80% / 0.08)",
  dropdown:  "0 10px 30px -4px hsl(220 20% 80% / 0.2)",
  none:      "none",
} as const;

// ── Z-Index Hierarchy ──
export const zIndex = {
  base:       0,
  card:       1,
  sticky:     10,
  dropdown:   50,
  modal:      100,
  toast:      200,
  tooltip:    300,
  overlay:    9999,
} as const;
```

**Rule**: No arbitrary pixel values, hex colors, or inline magic numbers are permitted. All values must reference these tokens or CSS custom properties.

---

## 4. Layout System

### Page Container

| Property | Value | Context |
|---|---|---|
| Max width | 1400px | All pages |
| Padding | 32px horizontal | Desktop |
| Padding | 16px horizontal | Mobile (<768px) |
| Center | `margin: 0 auto` | Always |

### Content Max Widths

| Context | Max Width |
|---|---|
| Analysis step pages | 900px |
| Portfolio page | 1200px |
| Pitch slides (screen) | 800px |
| Export/PDF layout | 210mm (A4) |
| Shareable view | 720px |

### Vertical Rhythm Scale

All vertical spacing uses the 4px base unit:

| Usage | Token | Value |
|---|---|---|
| Between inline elements | `spacing.2` | 8px |
| Within a card section | `spacing.3` | 12px |
| Between card sections | `spacing.4` | 16px |
| Between panels | `spacing.6` | 24px |
| Between page sections | `spacing.8` | 32px |
| Major section breaks | `spacing.12` | 48px |

### Grid Structure

- Analysis pages: single column, max-width constrained
- Portfolio page: responsive grid -- `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` with `gap-4`
- Pitch slides: single column, card-per-section
- Comparison views: 2-column side-by-side at `md:` breakpoint

### Header Placement Rules

- **ModeHeader**: Always first element on analysis step pages. Flush to content container, 3px left-border accent.
- **PlatformNav**: Fixed top, full-width, `z-index: sticky` (10).
- **Section labels**: Placed above their section with `spacing.2` gap. Use `.section-label` class (11px, semibold, uppercase, tracking-wider).

---

## 5. Typography System

### Font Stack

| Role | Family | Fallback |
|---|---|---|
| Body | Inter | system-ui, sans-serif |
| Headings | Space Grotesk | system-ui, sans-serif |

### Type Scale

| Level | Size | Weight | Line Height | Family | Usage |
|---|---|---|---|---|---|
| Page Title | 24px (1.5rem) | 700 | 1.2 | Space Grotesk | Top of page, one per view |
| Section Header | 18px (1.125rem) | 700 | 1.3 | Space Grotesk | Panel/card titles |
| Headline Claim | 16px (1rem) | 600 | 1.4 | Space Grotesk | Key insight statement |
| Body | 14px (0.875rem) | 400 | 1.6 | Inter | Paragraph text, bullets |
| Small Body | 13px (0.8125rem) | 400 | 1.5 | Inter | Secondary descriptions |
| Metadata | 11px (0.6875rem) | 600 | 1.4 | Inter | Timestamps, labels |
| Micro | 9-10px | 600 | 1.3 | Inter | Tags, badges, evidence labels |

### Text Rules

- **Maximum 5 bullets per section**
- **Maximum 12 words per bullet**
- **No multi-line paragraphs in slide views** -- use bullets or single-sentence claims
- **Headings use `letter-spacing: -0.02em`**
- **Metadata uses `letter-spacing: 0.06em` uppercase**
- **Tabular numbers (`font-variant-numeric: tabular-nums`)** for all scores, metrics, and counts
- **No bold within body text** except for product names or entity references

---

## 6. Color Semantics

### Governing Rule

Color communicates **meaning only**. Decorative color usage is prohibited.

### Mode Accent Usage

Mode accent (Product blue, Service rose, Business violet) may appear in:
- ModeHeader left border and step badge
- Active step indicator
- Primary action buttons within the mode context
- Section markers and data highlights (sparingly)
- Chart accent lines

Mode accent must NOT appear in:
- Body text
- Background fills larger than a badge
- Borders (except ModeHeader left accent)
- Multiple simultaneous accent usages on screen

### Confidence Indicators

| Label | Color | Background | Border |
|---|---|---|---|
| VERIFIED | `hsl(142 70% 35%)` | `{color}15` | `{color}30` |
| MODELED | `hsl(217 91% 45%)` | `{color}15` | `{color}30` |
| ASSUMPTION | `hsl(38 92% 42%)` | `{color}15` | `{color}30` |
| DATA GAP | `hsl(0 72% 52%)` | `{color}15` | `{color}30` |
| USER PROVIDED | `hsl(271 70% 45%)` | `{color}15` | `{color}30` |

Pattern: text color at full saturation, background at 8-15% opacity, border at 20-30% opacity.

### Score Indicators

| Range | Color Token | Usage |
|---|---|---|
| 8-10 | `scoreColors.high` | Strong signal |
| 5-7 | `scoreColors.mid` | Moderate signal |
| 0-4 | `scoreColors.low` | Weak signal |

### Risk Indicators

| Level | Color | Usage |
|---|---|---|
| Low | `riskColors.low` (green) | Favorable risk |
| Medium | `riskColors.medium` (amber) | Caution |
| High | `riskColors.high` (red) | Critical |

### Prohibited

- Gradient backgrounds on content areas
- Multiple accent colors on the same view
- Color as the sole differentiator (always pair with label or icon)
- Saturated background fills -- all backgrounds use muted/opacity variants

---

## 7. Component Standards

### ModeHeader

**Purpose**: Identifies the current analysis step and mode.

```text
+--[accent border]--------------------------------------+
| [step#]  Step Title                    [action btns]  |
|          Subtitle (optional, muted)                   |
+-------------------------------------------------------+
```

- 3px left border in mode accent color
- Step number badge: 24-28px square, rounded, accent fill, white text
- Title: Section Header scale (18px bold)
- Subtitle: Small Body (13px muted), truncated on mobile
- Actions: right-aligned, flex-shrink-0
- Surface: card background
- **Use**: First element on every analysis step page
- **Do not use**: On portfolio, landing, or settings pages

### DecisionPanel (SlideSection)

**Purpose**: Presents a single analytical claim with supporting evidence.

```text
+-------------------------------------------------------+
| SECTION LABEL (micro, uppercase)                      |
| Headline Claim (16px semibold)                        |
|                                                       |
| * Bullet point one                                    |
| * Bullet point two                [EVIDENCE TAG]      |
| * Bullet point three                                  |
|                                                       |
| +-- Data Callout Box ---+                             |
| | METRIC LABEL          |                             |
| | $4.2M                 |                             |
| +-----------------------+                             |
+-------------------------------------------------------+
```

- Surface: card background with subtle border
- Max 5 bullets, max 12 words each
- Evidence tags: right-aligned to heading row
- Data callout: muted background inset box
- **Use**: Each of the 12 pitch sections, analysis result panels
- **Do not use**: For navigation, forms, or settings

### SignalIndicator (ScoreBar)

**Purpose**: Visualizes a single numeric score on a 0-10 scale.

- Label (left): 12px medium, muted
- Score (right): 14px bold, color-coded by threshold
- Bar: 6px height, rounded-full, muted track, colored fill
- Transition: 700ms ease on width
- **Use**: Score displays, metric comparisons
- **Do not use**: For binary states or categorical data

### OutdatedBanner

**Purpose**: Alerts the user that upstream data has changed.

- Background: `hsl(38 92% 50% / 0.08)`
- Border: `1px solid hsl(38 92% 50% / 0.3)`
- Icon: AlertCircle in amber, flex-shrink-0
- Title: 12px bold foreground
- Description: 11px muted
- Action: "Regenerate" button in accent or amber fill
- **Use**: When a downstream step depends on changed upstream data
- **Do not use**: For general warnings or error states

### SteeringPanel

**Purpose**: User input area for guiding AI behavior.

- Surface: muted background with 1.5px border
- Header strip: icon (Sparkles, 13px) + title (12px bold) + optional description (10px muted)
- Separator: 1px border-bottom on header
- Content area: 16px padding
- **Use**: Any step where user can provide context, rationale, or overrides
- **Do not use**: For displaying results or read-only content

### ExportPanel

**Purpose**: Dropdown for export actions.

- Trigger: small accent-filled button with Download icon
- Dropdown: 256px wide, card surface, rounded-xl, shadow-dropdown
- Each option: 40px icon area (rounded-lg, tinted background) + label (12px bold) + description (10px muted)
- **Use**: Pitch step, portfolio cards
- **Do not use**: As a navigation element

### DataLabel (Confidence Tag)

**Purpose**: Inline indicator of data provenance.

- Size: 9px, semibold, uppercase, tracking-wide
- Shape: rounded rectangle, minimal padding (px-1.5 py-0.5)
- Color: text at full hue, background at ~8%, border at ~20%
- **Use**: Inline with section headings, data points, bullets
- **Do not use**: As a standalone element or in large quantities (max 1 per section heading)

---

## 8. Interaction Standards

### Transitions

| Element | Property | Duration | Easing |
|---|---|---|---|
| Button hover | background-color | 150ms | ease |
| Card hover | box-shadow, border-color | 200ms | ease |
| Score bar fill | width | 700ms | ease |
| Accordion | height | 200ms | ease-out |
| Dropdown | opacity | 150ms | ease |

### Hover States

- Cards: elevate shadow from `card` to `cardHover`, tint border with `primary/0.2`
- Buttons: darken background by one step (primary to primary-dark)
- Links: underline on hover only
- No hover animations, no scale transforms, no color shifts on text

### Focus States

- Ring: 2px solid `hsl(var(--ring))`, 2px offset
- Visible only on keyboard navigation (`:focus-visible`)

### Click/Active States

- Buttons: no visual active state beyond hover
- Cards: no pressed state -- navigate immediately

### Loading States

- Use `Loader2` icon with `animate-spin` class
- Disable interactive elements during async operations
- Show progress via `StepLoadingTracker` for multi-step operations
- No skeleton screens for primary content -- use centered spinner with status text

### Prohibited Interactions

- No drag-and-drop for content reordering
- No horizontal swipe gestures on analysis cards
- No infinite scroll -- use pagination or "Load More"
- No auto-playing animations

---

## 9. Data Visualization Rules

### Governing Principle

Charts must be **minimal**, **interpretable in under 3 seconds**, and **free of decoration**.

### Allowed Elements

| Type | Usage | Max Complexity |
|---|---|---|
| Horizontal bar | Score comparison, metric display | 6 bars max |
| Vertical bar chart | Category comparison | 8 bars max |
| Radar chart | Multi-dimension comparison | 6 dimensions max |
| Simple table | Side-by-side comparison | 4 columns max |
| Progress indicator | Score bar, completion | Single metric |
| Dot/signal indicator | Binary or ternary state | Single point |

### Prohibited Elements

- 3D charts of any kind
- Pie charts (use bar charts instead for portfolio views)
- Complex infographics
- Decorative icons within data areas
- Animated chart transitions beyond initial render
- Gridlines (use implied alignment)

### Chart Styling

- Axis labels: 10-11px, muted foreground
- Data labels: 12px, bold, foreground
- Grid: hidden or single reference line only
- Colors: mode accent for primary series, gray for secondary
- Tooltip: card surface, 12px text, border, shadow-card
- Legend: below chart, horizontal, 11px, muted

### Data Callout Boxes

- Background: `gray50` (card surface) or muted
- Border-radius: `radii.md` (8px)
- Structure: metric label (7px uppercase muted) above metric value (12-16px bold, accent or foreground)
- Use for: single key metric, directional signal, structural insight
- Max one callout per section

---

## 10. Pitch Deck Slide System

### Screen Slide Template

Each of the 12 pitch sections renders as a card following this structure:

```text
+-------------------------------------------------------+
| SECTION LABEL (11px, uppercase, muted)       [TAG]    |
+-------------------------------------------------------+
|                                                       |
| Headline Claim (16px, semibold, accent)               |
|                                                       |
| -- divider line --                                    |
|                                                       |
| * Supporting bullet one (14px, normal)                |
| * Supporting bullet two                               |
| * Supporting bullet three                             |
|                                                       |
| +-- Data Callout ----------------------+              |
| | KEY METRIC (7px uppercase muted)     |              |
| | $12.4M TAM (16px bold accent)        |              |
| +--------------------------------------+              |
|                                                       |
| Source: [data type] -- [timestamp]     (10px muted)   |
+-------------------------------------------------------+
```

### PDF Slide Template

Each slide occupies a full A4 page (210mm x 297mm):

| Zone | Y Position | Content |
|---|---|---|
| Header band | 0-16mm | Accent-fill rectangle, slide title (8px uppercase white) |
| Title | 30mm | Slide title repeated (18px bold dark) |
| Headline | 40mm | Headline claim (11px bold accent) |
| Divider | below headline | 1px gray line, full content width |
| Sections | dynamic | Section heading (9px bold) + evidence tag + bullets (8px) |
| Data callout | bottom area | Gray rounded box with label + metric |
| Footer | 279mm | Source type, timestamp, "Market Disruptor - Confidential", page number |

### PDF Dimensions

- Margins: 20mm left, 20mm right
- Content width: 170mm
- Font sizes: Title 18pt, Headline 11pt, Section 9pt, Bullet 8pt, Footer 6pt
- Max 5 bullets per section, enforced at rendering time
- Page break after each section -- one section per page

### Slide Order (12 sections)

1. Problem
2. Solution
3. Why Now
4. Market Opportunity
5. Product / Innovation
6. Business Model
7. Traction Signals
8. Risks and Mitigation
9. Metrics That Matter
10. Go-To-Market
11. Competitive Landscape
12. Investment Ask

---

## 11. Accessibility Rules

### Color Contrast

- All text must meet WCAG 2.1 AA contrast ratios:
  - Normal text (< 18px): minimum 4.5:1 against background
  - Large text (>= 18px bold): minimum 3:1 against background
- Score badge text against its tinted background must pass 4.5:1
- Confidence tags: text color chosen at full saturation against 8% opacity background passes contrast

### Keyboard Navigation

- All interactive elements must be reachable via Tab
- Focus ring: 2px solid ring color, 2px offset, visible only on `:focus-visible`
- Dropdown menus: Escape to close, arrow keys to navigate
- Modals: trap focus within, Escape to dismiss

### Screen Reader Support

- All icons paired with `aria-label` or adjacent visible text
- Decorative icons use `aria-hidden="true"`
- Score bars include `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- Charts include summary text in `aria-label`
- Dynamic content changes use `aria-live="polite"`

### Motion

- Respect `prefers-reduced-motion`: disable transitions and animations
- No auto-playing animations
- Loading spinners are exempt from reduced-motion

### Touch Targets

- Minimum 44x44px touch target on mobile
- Buttons: minimum `py-2.5 px-5` (40px height)
- Tag pills and badges are display-only, not interactive

---

## 12. Compliance Requirements

### Pre-Merge Compliance Checklist

Before any feature is marked complete, developers must verify:

**Tokens**
- [ ] No hardcoded hex, rgb, or hsl values -- all colors reference tokens or CSS custom properties
- [ ] No arbitrary pixel values for spacing -- all use the spacing scale
- [ ] Border radius uses scale tokens (sm/md/lg/xl/full)

**Typography**
- [ ] Headings use Space Grotesk, body uses Inter
- [ ] No font sizes outside the defined type scale
- [ ] Bullet lists respect the 5-bullet, 12-word maximum
- [ ] Metadata text uses uppercase tracking-wider pattern

**Color**
- [ ] Mode accent used only in permitted locations (header border, step badge, primary CTA, chart accent)
- [ ] No decorative color usage
- [ ] Confidence tags use the standard pattern (text + 8% bg + 20% border)
- [ ] Score colors follow threshold rules (8+/5+/below)

**Layout**
- [ ] Content respects max-width constraints
- [ ] Vertical spacing follows the rhythm scale
- [ ] Mobile breakpoints render correctly at 320px minimum
- [ ] No horizontal scroll on any viewport

**Components**
- [ ] ModeHeader is first element on analysis step pages
- [ ] Cards use `card-intelligence` or `section-panel` patterns
- [ ] Evidence tags use DataLabel component
- [ ] Export actions use ExportPanel component

**Interaction**
- [ ] Transitions use defined durations and easing
- [ ] No hover-dependent information (always accessible without hover)
- [ ] Loading states show spinner + status text

**Data Visualization**
- [ ] Charts use approved types only (bar, radar, table, progress)
- [ ] No 3D, pie, or decorative charts
- [ ] Max data points respected per chart type
- [ ] Tooltips follow card-surface styling

**Accessibility**
- [ ] Color contrast passes WCAG AA
- [ ] All interactive elements keyboard-accessible
- [ ] Icons have aria-labels or are hidden
- [ ] Touch targets meet 44px minimum on mobile

**PDF Export**
- [ ] One section per page
- [ ] Consistent margins (20mm)
- [ ] Footer metadata on every page
- [ ] Evidence tags rendered inline

### Conflict Resolution

When implementation requirements conflict with this design system:

1. **Design system takes precedence** over feature-specific styling
2. If a component cannot conform, the component must be refactored -- not the system
3. Exceptions require documented justification and approval
4. Temporary overrides must include a `// TODO: DS-compliance` comment with a remediation plan

---

*This document governs all visual implementation for Market Disruptor. It is the single source of truth for design decisions.*
