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

The UI must read like an executive analytical report, not a consumer SaaS dashboard.

---

## 2. Visual Principles

1. **Evidence hierarchy**: Claim first, evidence second, implication third.
2. **Mode identity through color, not layout**: Only accent color changes between modes.
3. **Whitespace is content**: Empty space signals confidence and aids scanning speed.
4. **Data before chrome**: Charts, scores, and indicators take visual priority over containers.
5. **3-second rule**: Any headline, score, or data callout must be interpretable in under 3 seconds.
6. **Progressive disclosure**: Summary first, detail on demand.

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

Rules: max 5 bullets/section, max 12 words/bullet, tabular-nums for scores.

---

## 6. Color Semantics

Color communicates meaning only. Decorative color usage is prohibited.

- Mode accent: header border, step badge, primary CTA, chart accent only
- Confidence tags: text at full hue, bg ~8% opacity, border ~20% opacity
- Score thresholds: high (≥8), mid (≥5), low (<5)

---

## 7. Component Standards

- **ModeHeader**: 3px left border, step badge, card surface
- **DecisionPanel**: section label + headline claim + bullets + data callout
- **ScoreBar**: 6px track, 700ms fill transition
- **OutdatedBanner**: amber background/border, AlertCircle icon
- **SteeringPanel**: muted surface, Sparkles icon header
- **ExportPanel**: dropdown with 3 options (PDF, Brief, Link)
- **DataLabel**: 9px uppercase badge with semantic color

---

## 8. Interaction Standards

- Button hover: 150ms ease
- Card hover: 200ms ease, shadow elevation
- Score bar: 700ms fill
- Focus: 2px ring, focus-visible only
- No drag-and-drop, no infinite scroll, no auto-animations

---

## 9. Data Visualization Rules

Allowed: horizontal bar, vertical bar (8 max), radar (6 dims), table (4 cols), progress, dot indicator.
Prohibited: 3D, pie, infographics, decorative icons, gridlines.

---

## 10. Pitch Deck Slide System

12 sections, each rendered as a card (screen) or full A4 page (PDF):
1. Problem → 2. Solution → 3. Why Now → 4. Market Opportunity → 5. Product/Innovation → 6. Business Model → 7. Traction Signals → 8. Risks & Mitigation → 9. Metrics That Matter → 10. Go-To-Market → 11. Competitive Landscape → 12. Investment Ask

PDF: 20mm margins, 170mm content width, one section per page, footer on every page.

---

## 11. Accessibility

- WCAG AA contrast ratios
- Keyboard navigation for all interactive elements
- aria-labels on icons, aria-valuenow on score bars
- Respect prefers-reduced-motion
- 44px minimum touch targets on mobile

---

## 12. Compliance

Design system takes precedence over feature-specific styling. No exceptions without documented justification.

Checklist: tokens only (no hardcoded values), correct typography, semantic color usage, layout constraints, component patterns, interaction standards, data viz rules, accessibility, PDF consistency.
