# Market Disruptor — Unified Design System Specification v2

Single source of truth for all UI implementation across Product, Service, and Business Model modes.
Every component, page, and interaction must comply. No exceptions without documented justification.

---

## 1. Design Philosophy

The interface communicates **structured reasoning**, **evidence-weighted insight**, and **professional credibility**.

**Core tenets:**
- **Clarity over decoration** — if a visual element does not aid interpretation, remove it.
- **Visual-first** — lead with metrics, frameworks, and signal indicators — never paragraphs.
- **Progressive disclosure** — summary first, detail on demand. Deeper analysis hidden by default.
- **Signal density, not data density** — every visible element carries interpretive weight.
- **3-second rule** — any headline, score, or data callout is interpretable in under 3 seconds.
- **Motion as meaning** — animations reinforce hierarchy. Never decorative.

---

## 2. Typography Scale

**Fonts:** `Space Grotesk` (display/headings), `Inter` (body/UI).

| Token Class | Size | Weight | Family | Usage |
|---|---|---|---|---|
| `typo-page-title` | 2.2rem (35px) | 700 | Space Grotesk | Hero / page titles |
| `typo-section-title` | 1.24rem (20px) | 700 | Space Grotesk | Section headers inside analysis panels |
| `typo-card-title` | 1.1rem (18px) | 600 | Inter | Card headings |
| `typo-nav-primary` | 1.03rem (16px) | 600 | Inter | Navigation links |
| `typo-step-title-active` | 0.96rem (15px) | 700 | Inter | Active step label in StepNavigator |
| `typo-step-title-inactive` | 0.96rem (15px) | 700 | Inter | Inactive step label |
| `typo-card-body` | 0.96rem (15px) | 400 | Inter | Card body text |
| `typo-page-meta` | 0.96rem (15px) | 400 | Inter | Page-level metadata |
| `typo-section-description` | 0.96rem (15px) | 400 | Inter | Section description |
| `typo-button-primary` | 0.96rem (15px) | 600 | Inter | Primary buttons |
| `typo-card-eyebrow` | 0.89rem (14px) | 600 | Inter | Eyebrow / category labels (uppercase) |
| `typo-card-meta` | 0.89rem (14px) | 500 | Inter | Card metadata |
| `typo-step-subtitle` | 0.89rem (14px) | 500 | Inter | Step description |
| `typo-status-label` | 0.89rem (14px) | 600 | Inter | Status badges, counters (uppercase) |
| `typo-button-secondary` | 0.89rem (14px) | 600 | Inter | Secondary buttons |

### Typography Rules

- **Minimum font size: 12px (text-xs)**. No `text-[10px]`, `text-[11px]`, or `text-[9px]`.
- Primary text: true black (`foreground`) on light backgrounds; light gray on command-deck dark theme.
- Secondary text: `muted-foreground`. Never use raw gray hex values.
- Max line length: 65–80 characters.
- Tabular-nums for all scores and numeric data.
- Max 5 bullets per section, max 12 words per bullet.

---

## 3. Spacing Scale

Based on a 4px unit. All spacing uses Tailwind utilities mapped to this scale.

| Token | Value | Tailwind | Usage |
|---|---|---|---|
| `space-0.5` | 2px | `p-0.5` | Micro gaps (badge padding) |
| `space-1` | 4px | `p-1` | Tight internal spacing |
| `space-1.5` | 6px | `p-1.5` | Icon-to-text gaps |
| `space-2` | 8px | `p-2, gap-2` | Default element gap |
| `space-3` | 12px | `p-3, gap-3` | Card internal padding (compact) |
| `space-4` | 16px | `p-4, gap-4` | Standard card padding, section gaps |
| `space-5` | 20px | `p-5` | Panel padding |
| `space-6` | 24px | `p-6` | Section padding (desktop) |
| `space-8` | 32px | `p-8` | Desktop horizontal page padding |
| `space-10` | 40px | `p-10` | Large section spacing |
| `space-12` | 48px | `p-12` | Empty states vertical padding |
| `space-16` | 64px | `p-16` | Hero spacing |

### Spacing Rules

- Mobile page padding: `px-3` (12px)
- Desktop page padding: `px-6` (24px)
- Section vertical gaps: `space-y-4` (16px)
- Card internal padding: `p-4` mobile, `p-5 sm:p-6` desktop
- Icon-to-text gap: `gap-1.5` (6px) for inline, `gap-3` (12px) for card headers

---

## 4. Color System

All colors are HSL CSS custom properties. No hardcoded hex/rgb in components.

### Semantic Palette

| Token | Light | Dark (Command Deck) | Usage |
|---|---|---|---|
| `--background` | `0 0% 100%` | `222 28% 7%` | Page background |
| `--foreground` | `0 0% 0%` | `210 20% 92%` | Primary text |
| `--card` | `0 0% 100%` | `222 24% 10%` | Card surface |
| `--muted` | `220 10% 96%` | `222 18% 14%` | Muted backgrounds |
| `--muted-foreground` | `0 0% 20%` | `215 15% 78%` | Secondary text |
| `--border` | `0 0% 85%` | `222 15% 20%` | Borders, dividers |
| `--primary` | `229 89% 63%` | `217 91% 60%` | Primary actions |
| `--destructive` | `0 72% 52%` | `0 72% 55%` | Errors, risks |
| `--success` | `152 60% 44%` | `152 60% 48%` | Positive signals |
| `--warning` | `36 80% 52%` | `36 80% 55%` | Caution signals |

### Mode Accent Colors

| Mode | CSS Variable | HSL | Hex |
|---|---|---|---|
| Product | `--mode-product` | `229 89% 63%` | `#4b68f5` |
| Service | `--mode-service` | `343 65% 55%` | `#d64174` |
| Business | `--mode-business` | `271 82% 55%` | `#9030ea` |

Each mode has `-hover`, `-active`, `-tint`, `-outline` variants.

### Score Colors

| Threshold | Token | Color |
|---|---|---|
| ≥ 8 (High) | `--score-high` | `160 60% 44%` |
| ≥ 5 (Mid) | `--score-mid` | `36 77% 52%` |
| < 5 (Low) | `--score-low` | `0 72% 52%` |

### Color Rules

- Mode accent: header border, step badge, primary CTA, chart accent only.
- Confidence tags: text at full hue, bg ~8% opacity, border ~20% opacity.
- No decorative color. Color always communicates meaning.

---

## 5. Component Hierarchy

### Layout Shell (from `AnalysisPageShell.tsx`)

Every analysis page follows this exact ordering:

```
AnalysisPageShell
  ├── AnalysisStepHeader (ModeBadge + StepNavigator + StepNavBar + OutdatedBanner)
  ├── AnalysisActionToolbar (h1 title + h2 step title + action buttons / overflow menu)
  ├── AnalysisTabBar (pill tabs — horizontal scroll on mobile)
  ├── AnalysisDivider
  ├── AnalysisContextBanner (optional — icon + title + description)
  └── Content (StepCanvas + cards)
```

### Content Components (from `AnalysisComponents.tsx`)

| Component | Purpose | Animation |
|---|---|---|
| `StepCanvas` | Primary container. Wraps children with staggered fade-up. | Stagger 70ms |
| `InsightCard` | Key insight with optional expandable detail. | Hover: lift. Expand: 250ms |
| `FrameworkPanel` | Structured analytical framework container. | Fade-up. Expand: animated |
| `SignalCard` | Single signal indicator (strength/weakness/opportunity/threat). | Hover: scale 1.015 |
| `OpportunityCard` | Structured opportunity with score bars. | Score bars: 700ms fill |
| `MetricCard` | Single metric with label and trend. | Value: fade-up 400ms |
| `EvidenceCard` | Proof point with source and confidence badge. | Fade-up. Expand: animated |
| `HypothesisCard` | Strategic hypothesis with fragility score. | Fragility: scale-in 400ms |
| `AnalysisPanel` | Generic titled panel with icon header. | Fade-up |
| `VisualGrid` | Responsive grid (1–4 columns). | None (container) |
| `ExpandableDetail` | Standalone collapsible section. | Chevron: 200ms. Height: animated |

### Component Rules

- All analysis step pages wrap content in `StepCanvas`.
- All expandable content uses `AnimatePresence` + `expandVariants`.
- No custom card types outside this system.
- No inline `transition-*` hacks — use shared presets.

---

## 6. Border Radius Scale

| Token | Value | Usage |
|---|---|---|
| `rounded-sm` | 0.5rem (8px) | Tags, badges |
| `rounded-md` | 0.75rem (12px) | Buttons, inputs |
| `rounded-lg` | 1rem (16px) | Cards, panels |
| `rounded-xl` | 1.25rem (20px) | Large panels, modals |
| `rounded-2xl` | 1.5rem (24px) | Content cards |
| `rounded-full` | 9999px | Pills, avatars |

---

## 7. Shadow System

| Token | Usage |
|---|---|
| `--shadow-card` | Default card shadow |
| `--shadow-card-hover` | Card hover elevation |
| `--shadow-vi-panel` | Visual intelligence panels |
| `--shadow-vi-node` | Graph nodes at rest |
| `--shadow-vi-node-hover` | Graph nodes on hover |

---

## 8. Responsive Breakpoints

| Breakpoint | Width | Behavior |
|---|---|---|
| Mobile | < 768px | Single column, stacked layout, bottom sheets, overflow menu |
| Tablet | 768–1023px | 2-column grids, side panels begin appearing |
| Desktop | 1024–1399px | Full layout, multi-panel, inline toolbars |
| Large Desktop | ≥ 1400px | Max-width container, increased whitespace |

### Page Max Widths

| Context | Max Width |
|---|---|
| All pages | 1400px |
| Analysis step pages | `max-w-5xl` (64rem / ~900px) |
| Portfolio page | 1200px |
| Pitch slides | 800px |
| Shareable view | 720px |

---

## 9. Mobile Interaction Standards

### Touch Targets
- **Minimum 44px** (`min-h-[44px]`) on all interactive elements.
- Tab bar buttons: `min-h-[44px]` + `whitespace-nowrap` + `flex-shrink-0`.
- Action buttons: `min-h-[44px]`.

### Navigation
- Header-only navigation. No bottom navigation bars.
- Tab bar: horizontal scroll with `overflow-x-auto scrollbar-hide`.

### Toolbar
- Run button stays visible (label shortened to icon-only on mobile).
- Secondary actions (PDF, Save, Graph, Share) collapse into `⋯` overflow menu.
- Overflow menu: absolute dropdown, closes on outside click.

### Panels
- Node detail panels render as **fixed bottom sheets** (`max-h-[70vh]`, `rounded-t-2xl`).
- Desktop: absolute-positioned side panels.

### Content
- Stack content vertically.
- Collapse secondary panels.
- Convert dense tables into cards.
- `VisualGrid`: 1 column on mobile, 2+ on tablet/desktop.

### Graph (Mobile)
- Dynamic height: `calc(100vh - 320px)`.
- MiniMap hidden.
- Tooltips disabled (use tap-to-select + bottom sheet instead).
- `fitView` padding: `0.15` (vs `0.3` desktop).
- Tier legend hidden.
- Zoom/toggle toolbar: `overflow-x-auto`.

---

## 10. Graph Interaction Rules

### Layout
- Tiered horizontal: `Signals → Constraints → Assumptions → Leverage → Opportunities → Validation`
- Nodes organized by reasoning stage (column index 0–5).

### Zoom Levels
| Level | Label | Visible Types |
|---|---|---|
| Overview | "Overview" | Signals, Constraints, Opportunities |
| Structural | "Structural" | + Assumptions, Drivers, Leverage Points |
| Full | "Full Reasoning" | All nodes including Risk and Evidence |

### Node Interaction
- Click: highlights causal chain (upstream + downstream).
- Hover (desktop): tooltip with label, type, influence score.
- Tap (mobile): opens bottom sheet detail panel.
- Top 10% influence nodes: pulsing glow ring ("System Leverage Points").
- Breakthrough opportunity: enhanced glow + badge in detail panel.

### Edge Styling
| Relation | Color |
|---|---|
| causes | `hsl(0 72% 52%)` (red) |
| leads_to | `hsl(229 89% 63%)` (blue) |
| contradicts | `hsl(14 90% 55%)` (orange) |
| supports | `hsl(152 60% 44%)` (green) |
| unlocks | `hsl(262 83% 58%)` (purple) |
| depends_on | `hsl(210 14% 53%)` (gray) |
| invalidates | `hsl(0 72% 52%)` (red) |

### Opportunity Landscape (Tab 2)
- 2-axis scatter: X = Feasibility, Y = Strategic Impact.
- Node size = influence. Color = node type.
- Four quadrants: Long Bets, Breakthrough, Low Priority, Incremental Wins.

### Constraint Map (Tab 3)
- Causal flow diagram showing constraint relationships.

### Strategic Pathways (Tab 4)
- Pathway visualization from signals to opportunities.

---

## 11. Animation System

Built on `framer-motion`. All presets in `AnalysisComponents.tsx`.

| Preset | Values | Usage |
|---|---|---|
| `cardVariants` | opacity 0→1, y 12→0, 350ms cubic-bezier | Entry for all cards |
| `expandVariants` | height 0→auto, opacity 0→1, 250ms ease-out | Expandable panels |
| `staggerContainer` | staggerChildren: 70ms | `StepCanvas` orchestration |
| `hoverLift` | y 0→-2, shadow elevation, 200ms ease-out | Interactive cards |

### Motion Rules
- Entry: cards fade up with stagger. Never instant-appear.
- Expand/Collapse: animated height with opacity. Exit animation required.
- Hover: subtle lift (y-2) + shadow on interactive cards.
- Score bars: 700ms ease-out fill on mount.
- Chevron rotation via `motion.span` — never CSS transform.
- No auto-animations (no infinite loops, no pulse, no auto-play).
- Respect `prefers-reduced-motion` (framer-motion native).

---

## 12. Text Density Rules

- Insight summary: 1–2 lines maximum.
- Detail explanation: expandable only (hidden by default).
- Replace paragraphs with structured frameworks where possible.
- Maximum 5 bullets per section, 12 words per bullet.
- Never truncate mid-sentence; use expandable detail instead.
- No emojis in analytical content.

---

## 13. Cross-Mode Consistency

All modes share the same UI structure. Only differences allowed:
- Mode accent color (via CSS custom properties).
- Mode-specific step inputs and domain content.

Everything else is identical: navigation, components, layout, visual hierarchy.

Page component order is enforced: `StepHeader → ActionToolbar → TabBar → Divider → ContextBanner → Content`.

---

## 14. Data Visualization Rules

**Allowed:** horizontal bar, vertical bar (8 max), radar (6 dims), table (4 cols), progress, dot indicator.
**Prohibited:** 3D, pie, infographics, decorative icons, gridlines.

---

## 15. Z-Index Scale

| Layer | Value | Usage |
|---|---|---|
| Base | z-0 | Default content |
| Floating | z-10 | Badges, indicators |
| Sticky | z-20 | StepNavigator, sticky headers |
| Dropdown | z-30 | Dropdowns, tooltips, popovers |
| Modal | z-50 | Modals, sheets, dialogs |
| App Modal | z-[60] | PaywallModal, exit-intent |
| Tour | z-[100] | Onboarding overlays |

No local z-index values outside this scale.

---

## 16. Accessibility

- WCAG AA contrast ratios.
- Keyboard navigation for all interactive elements.
- `aria-labels` on icons, `aria-valuenow` on score bars.
- Respect `prefers-reduced-motion`.
- 44px minimum touch targets on mobile.
- Focus: 2px ring, `focus-visible` only.

---

## 17. Compliance Checklist

Before any PR/change:
- [ ] Uses design tokens only (no hardcoded values)
- [ ] Correct typography classes (no sub-12px fonts)
- [ ] Semantic color usage (no raw hex/rgb)
- [ ] Layout constraints respected (max widths, padding scale)
- [ ] Standardized components only (from AnalysisComponents.tsx)
- [ ] Animation presets only (from shared presets)
- [ ] Mobile touch targets ≥ 44px
- [ ] Tab bar scrolls horizontally on mobile
- [ ] Toolbar uses overflow menu on mobile
- [ ] Page component order matches canonical ordering
- [ ] Cross-mode consistency maintained
