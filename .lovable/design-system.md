# Market Disruptor Executive Design System

Official governing specification for all UI implementation across Product, Service, and Business Model modes.

---

## 1. Design Philosophy

The Market Disruptor interface communicates **structured reasoning**, **evidence-weighted insight**, and **professional credibility**. Every pixel serves an analytical purpose.

**Core tenets:**

- **Clarity over decoration** — if a visual element does not aid interpretation, it is removed.
- **Interpretation over presentation** — the interface guides the user toward a conclusion, not just data.
- **Restraint as authority** — minimal color, generous whitespace, and precise typography signal institutional credibility.
- **Signal density, not data density** — every visible element must carry interpretive weight.
- **Motion as meaning** — animations reinforce hierarchy, guide attention, and confirm interaction. Never decorative.

The UI must read like an executive analytical report, not a consumer SaaS dashboard.

---

## 2. Visual Principles

1. **Evidence hierarchy**: Claim first, evidence second, implication third.
2. **Mode identity through color, not layout**: Only accent color changes between modes.
3. **Whitespace is content**: Empty space signals confidence and aids scanning speed.
4. **Data before chrome**: Charts, scores, and indicators take visual priority over containers.
5. **3-second rule**: Any headline, score, or data callout must be interpretable in under 3 seconds.
6. **Progressive disclosure**: Summary first, detail on demand. All deeper analysis hidden by default.
7. **Visual-first**: Lead with diagrams, frameworks, and signal indicators — never with paragraphs.

---

## 3. Design Tokens

All tokens are defined in `src/theme/designTokens.ts`. No arbitrary values permitted.

---

## 4. Layout System

| Context | Max Width |
|---|---|
| All pages | 1400px |
| Analysis step pages | 900px |
| Portfolio page | 1200px |
| Pitch slides (screen) | 800px |
| Shareable view | 720px |

- Desktop padding: 32px horizontal
- Mobile padding: 16px horizontal
- ModeHeader: always first element on analysis step pages
- Section labels: 11px semibold uppercase tracking-wider

---

## 5. Typography System

| Level | Size | Weight | Family |
|---|---|---|---|
| Page Title | 24px | 700 | Space Grotesk |
| Section Header | 18px | 700 | Space Grotesk |
| Headline Claim | 16px | 600 | Space Grotesk |
| Body | 14px | 400 | Inter |
| Small Body | 13px | 400 | Inter |
| Metadata | 11px | 600 | Inter |
| Micro | 9-10px | 600 | Inter |

Rules: max 5 bullets/section, max 12 words/bullet, tabular-nums for scores. Primary text must be black. No grey text for core content. Minimum 14px for strategic text.

---

## 6. Color Semantics

Color communicates meaning only. Decorative color usage is prohibited.

- Mode accent: header border, step badge, primary CTA, chart accent only
- Confidence tags: text at full hue, bg ~8% opacity, border ~20% opacity
- Score thresholds: high (≥8), mid (≥5), low (<5)

---

## 7. Standardized Component Library

All analytical UI must use components from `src/components/analysis/AnalysisComponents.tsx`. No custom card types permitted outside this system.

### Component Catalog

| Component | Purpose | Animation |
|---|---|---|
| `StepCanvas` | Primary container for each step. Wraps children with staggered fade-up entry. | Stagger 70ms per child, fade+translateY |
| `InsightCard` | Key insight with optional expandable detail. Hover lifts card. | Hover: y-2 + shadow elevation. Expand: height+opacity 250ms |
| `FrameworkPanel` | Structured analytical framework container with deep-dive toggle. | Fade-up entry. Expand: animated height |
| `SignalCard` | Single signal indicator (strength/weakness/opportunity/threat). | Hover: scale 1.015. Expand: animated |
| `OpportunityCard` | Structured opportunity summary with score bars. | Hover: lift. Score bars: 700ms fill on mount |
| `VisualGrid` | Responsive grid layout (1–4 columns). | None (container only) |
| `ExpandableDetail` | Standalone collapsible detail section. | Chevron rotation 200ms. Content: animated height |
| `MetricCard` | Single metric with label and trend indicator. | Hover: scale 1.02. Value: fade-up 400ms |
| `EvidenceCard` | Evidence/proof point with source URL and confidence badge. | Fade-up entry. Expand: animated |
| `HypothesisCard` | Strategic hypothesis with fragility score gauge. | Hover: lift. Fragility score: scale-in 400ms |
| `AnalysisPanel` | Generic titled panel with icon header and action slot. | Fade-up entry |

### Usage Rules

- **All** analysis step pages must wrap content in `StepCanvas`.
- **All** expandable content uses `AnimatePresence` + `expandVariants` from the library.
- **No** page may create custom card types outside this system.
- **No** inline `transition-*` hacks — use the shared `hoverLift` and `cardVariants` presets.

---

## 8. Animation System

Built on `framer-motion`. All presets defined in `AnalysisComponents.tsx`.

### Shared Presets

| Preset | Values | Usage |
|---|---|---|
| `cardVariants` | opacity 0→1, y 12→0, 350ms cubic-bezier | Entry animation for all cards |
| `expandVariants` | height 0→auto, opacity 0→1, 250ms ease-out | All expandable detail panels |
| `staggerContainer` | staggerChildren: 70ms | `StepCanvas` child orchestration |
| `hoverLift` | y 0→-2, shadow elevation, 200ms ease-out | Interactive cards (Insight, Opportunity, Hypothesis) |

### Motion Rules

- **Entry**: Cards fade up with stagger. Never instant-appear.
- **Expand/Collapse**: Animated height with opacity. Exit animation required (no snap-close).
- **Hover**: Subtle lift (y-2) + shadow on interactive cards. Scale (1.015) on signal cards.
- **Score bars**: 700ms ease-out fill animation on mount.
- **Metric values**: Fade-up with 150ms delay.
- **Fragility scores**: Scale-in with 200ms delay.
- **Chevron icons**: Rotate via `motion.span` — never CSS transform.
- **No auto-animations**: No infinite loops, no pulse, no auto-play.
- **Respect `prefers-reduced-motion`**: framer-motion handles this natively.

---

## 9. Text Density Rules

- Insight summary: 1–2 lines maximum.
- Detail explanation: expandable only (hidden by default).
- No section should appear overwhelming when first viewed.
- Replace paragraphs with structured frameworks where possible.
- Maximum 5 bullets per section, 12 words per bullet.
- Never truncate mid-sentence; use expandable detail instead.

---

## 10. Interaction Standards

- Button hover: 150ms ease
- Card hover: 200ms lift + shadow elevation (via `hoverLift` preset)
- Score bar: 700ms fill
- Expand/collapse: 250ms animated height
- Chevron rotation: 200ms
- Focus: 2px ring, focus-visible only
- No drag-and-drop, no infinite scroll

---

## 11. Data Visualization Rules

Allowed: horizontal bar, vertical bar (8 max), radar (6 dims), table (4 cols), progress, dot indicator.
Prohibited: 3D, pie, infographics, decorative icons, gridlines.

---

## 12. Pitch Deck Slide System

12 sections, each rendered as a card (screen) or full A4 page (PDF):
1. Problem → 2. Solution → 3. Why Now → 4. Market Opportunity → 5. Product/Innovation → 6. Business Model → 7. Traction Signals → 8. Risks & Mitigation → 9. Metrics That Matter → 10. Go-To-Market → 11. Competitive Landscape → 12. Investment Ask

PDF: 20mm margins, 170mm content width, one section per page, footer on every page.

---

## 13. Content Placement Rules

Each step has a specific analytical role. Content must only appear in the correct step.

| Step | Content Scope |
|---|---|
| Report | Market overview, key signals, competitive context |
| Disrupt | Structural decomposition, first principles reasoning, constraint identification |
| Redesign | New models, strategic alternatives, opportunity frameworks |
| Stress Test | Risk evaluation, failure scenarios, robustness testing |
| Pitch | Condensed strategic narrative, investor/operator summary |

No step may display content belonging to another step.

---

## 14. Cross-Mode Consistency

All modes share the same UI structure. Only differences allowed:
- Mode accent color
- Mode-specific step inputs

Everything else must be identical: navigation, components, layout, visual hierarchy.

---

## 15. Accessibility

- WCAG AA contrast ratios
- Keyboard navigation for all interactive elements
- aria-labels on icons, aria-valuenow on score bars
- Respect prefers-reduced-motion (framer-motion native)
- 44px minimum touch targets on mobile

---

## 16. Compliance

Design system takes precedence over feature-specific styling. No exceptions without documented justification.

Checklist: tokens only (no hardcoded values), correct typography, semantic color usage, layout constraints, standardized components only, animation presets only, interaction standards, data viz rules, accessibility, PDF consistency.
