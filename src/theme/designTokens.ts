/**
 * Market Disruptor Executive Design System — Code-Ready Tokens
 *
 * This is the single source of truth for all visual values.
 * No arbitrary pixel values, hex colors, or inline magic numbers are permitted.
 * All component styling must reference these tokens or CSS custom properties.
 */

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

// ── Neutral Palette (HSL values) ──
export const neutrals = {
  white:   "0 0% 100%",
  gray50:  "220 20% 97%",    // card surfaces
  gray100: "220 14% 95%",    // muted backgrounds
  gray200: "220 14% 93%",    // accent backgrounds
  gray300: "220 13% 86%",    // borders, dividers
  gray400: "220 10% 65%",    // disabled text
  gray500: "220 10% 40%",    // muted foreground
  gray900: "224 20% 10%",    // primary foreground
} as const;

// ── Semantic Colors (HSL values) ──
export const semantic = {
  success:     "152 60% 44%",
  warning:     "36 80% 52%",
  destructive: "0 72% 52%",
  info:        "217 91% 45%",
} as const;

// ── Confidence Indicator Colors ──
export const confidence = {
  verified:        "hsl(142 70% 35%)",
  modeled:         "hsl(217 91% 45%)",
  assumption:      "hsl(38 92% 42%)",
  dataGap:         "hsl(0 72% 52%)",
  userProvided:    "hsl(271 70% 45%)",
  visualInference: "hsl(200 80% 45%)",
} as const;

// ── Score Threshold Colors (HSL values) ──
export const scoreColors = {
  high: "160 60% 44%",   // score >= 8
  mid:  "36 77% 52%",    // score >= 5
  low:  "0 72% 52%",     // score < 5
} as const;

// ── Risk Severity Colors ──
export const riskColors = {
  low:    "hsl(142 70% 35%)",
  medium: "hsl(38 92% 42%)",
  high:   "hsl(0 72% 52%)",
} as const;

// ── Mode Accent Palette ──
export const modeAccent = {
  product: {
    primary:    "hsl(229 89% 63%)",
    hover:      "hsl(229 85% 55%)",
    active:     "hsl(229 85% 48%)",
    tint:       "hsl(229 89% 96%)",
    outline:    "hsl(229 89% 72%)",
    background: "hsl(229 89% 96%)",
  },
  service: {
    primary:    "hsl(343 65% 55%)",
    hover:      "hsl(343 60% 47%)",
    active:     "hsl(343 60% 40%)",
    tint:       "hsl(343 65% 96%)",
    outline:    "hsl(343 65% 68%)",
    background: "hsl(343 65% 96%)",
  },
  business: {
    primary:    "hsl(271 82% 55%)",
    hover:      "hsl(271 78% 47%)",
    active:     "hsl(271 78% 40%)",
    tint:       "hsl(271 82% 96%)",
    outline:    "hsl(271 82% 70%)",
    background: "hsl(271 82% 96%)",
  },
} as const;

// ── Surface Backgrounds ──
export const surfaces = {
  page:    "hsl(0 0% 100%)",
  card:    "hsl(220 20% 97%)",
  muted:   "hsl(220 14% 95%)",
  callout: "hsl(220 14% 95%)",
  overlay: "hsl(224 20% 10% / 0.5)",
} as const;

// ── Divider Styles ──
export const dividers = {
  subtle:   "1px solid hsl(220 13% 86%)",
  section:  "1px solid hsl(220 13% 86%)",
  emphasis: "1px solid hsl(220 13% 78%)",
  mode:     "3px solid",   // left-border accent, color from mode
} as const;

// ── Shadows (cards only) ──
export const shadows = {
  card:      "0 1px 3px 0 hsl(220 20% 80% / 0.12), 0 1px 2px -1px hsl(220 20% 80% / 0.08)",
  cardHover: "0 8px 24px -4px hsl(220 20% 80% / 0.18), 0 2px 6px -1px hsl(220 20% 80% / 0.08)",
  dropdown:  "0 10px 30px -4px hsl(220 20% 80% / 0.2)",
  none:      "none",
} as const;

// ── Z-Index Hierarchy ──
export const zIndex = {
  base:     0,
  card:     1,
  sticky:   10,
  dropdown: 50,
  modal:    100,
  toast:    200,
  tooltip:  300,
  overlay:  9999,
} as const;

// ── Content Max Widths ──
export const maxWidths = {
  page:       "1400px",
  analysis:   "900px",
  portfolio:  "1200px",
  pitch:      "800px",
  shareable:  "720px",
} as const;

// ── Typography Scale (14px base, 13px minimum) ──
export const typeScale = {
  navPrimary:        { size: "0.9375rem",  weight: 600, lineHeight: 1.4, family: "sans",    class: "typo-nav-primary" },
  stepTitleActive:   { size: "0.875rem",   weight: 700, lineHeight: 1.3, family: "sans",    class: "typo-step-title-active" },
  stepTitleInactive: { size: "0.875rem",   weight: 700, lineHeight: 1.3, family: "sans",    class: "typo-step-title-inactive" },
  stepSubtitle:      { size: "0.8125rem",  weight: 500, lineHeight: 1.3, family: "sans",    class: "typo-step-subtitle" },
  pageTitle:         { size: "2rem",       weight: 700, lineHeight: 1.2, family: "display",  class: "typo-page-title" },
  pageMeta:          { size: "0.875rem",   weight: 400, lineHeight: 1.5, family: "sans",    class: "typo-page-meta" },
  cardEyebrow:       { size: "0.8125rem",  weight: 600, lineHeight: 1.4, family: "sans",    class: "typo-card-eyebrow" },
  cardTitle:         { size: "1rem",       weight: 600, lineHeight: 1.3, family: "sans",    class: "typo-card-title" },
  cardBody:          { size: "0.875rem",   weight: 400, lineHeight: 1.5, family: "sans",    class: "typo-card-body" },
  cardMeta:          { size: "0.8125rem",  weight: 500, lineHeight: 1.4, family: "sans",    class: "typo-card-meta" },
  sectionTitle:      { size: "1.125rem",   weight: 700, lineHeight: 1.3, family: "display",  class: "typo-section-title" },
  sectionDescription:{ size: "0.875rem",   weight: 400, lineHeight: 1.5, family: "sans",    class: "typo-section-description" },
  statusLabel:       { size: "0.8125rem",  weight: 600, lineHeight: 1.3, family: "sans",    class: "typo-status-label" },
  buttonPrimary:     { size: "0.875rem",   weight: 600, lineHeight: 1,   family: "sans",    class: "typo-button-primary" },
  buttonSecondary:   { size: "0.8125rem",  weight: 600, lineHeight: 1,   family: "sans",    class: "typo-button-secondary" },
} as const;

// ── Transition Presets ──
export const transitions = {
  buttonHover:  "background-color 150ms ease",
  cardHover:    "box-shadow 200ms ease, border-color 200ms ease",
  scoreBar:     "width 700ms ease",
  accordion:    "height 200ms ease-out",
  dropdown:     "opacity 150ms ease",
} as const;

// ── Utility: score color resolver ──
export function getScoreColor(score: number): string {
  if (score >= 8) return `hsl(${scoreColors.high})`;
  if (score >= 5) return `hsl(${scoreColors.mid})`;
  return `hsl(${scoreColors.low})`;
}

// ── Utility: score CSS class resolver ──
export function getScoreBadgeClass(score: number): string {
  if (score >= 8) return "score-badge-high";
  if (score >= 6) return "score-badge-mid";
  return "score-badge-low";
}
