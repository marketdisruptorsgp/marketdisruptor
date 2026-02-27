

# Global Responsive Behavior Implementation

## Scope

Standardize responsive layout across all pages and components using three breakpoints: Mobile (≤640px), Tablet (641–1024px), Desktop (≥1025px). No custom breakpoints — only Tailwind's `sm:`, `md:`, `lg:`.

---

## Step 1 — Update CSS typography roles for responsive scaling

**File: `src/index.css`**

Add responsive size overrides to `typo-page-title` so titles scale down on mobile while body text stays fixed:

- `.typo-page-title`: keep `2rem` base but reduce on small screens via media query or keep current `text-3xl sm:text-5xl` pattern
- `.typo-section-title`: stays at `1.125rem` (18px) — already works
- Ensure no `typo-*` class produces text smaller than 13px (already enforced)

No changes needed to body/card roles — they're already consistent.

---

## Step 2 — DisruptionPathBanner: fix inline font sizes + mobile layout

**File: `src/components/DisruptionPathBanner.tsx`**

- Replace `text-[11px] font-bold uppercase tracking-widest` → `typo-status-label` (lines 68, 138)
- Replace `text-sm sm:text-base font-bold` → `typo-card-title` (line 146)
- Replace `text-xs text-muted-foreground` → `typo-card-body text-muted-foreground` (line 151)
- Replace `text-[11px] text-muted-foreground/80` → `typo-card-meta text-muted-foreground/80` (line 163)
- Replace `text-xl sm:text-3xl font-bold` → `typo-page-title text-xl sm:text-3xl` (line 73)
- Replace `text-sm sm:text-base text-muted-foreground` → `typo-page-meta` (line 76)
- Grid: already `grid-cols-1 sm:grid-cols-2 lg:grid-cols-6` — correct

---

## Step 3 — BusinessModelAnalysis: replace remaining inline font sizes

**File: `src/components/BusinessModelAnalysis.tsx`**

Many `text-[10px]`, `text-[9px]`, `text-[11px]`, `text-xs` remain (lines 383, 403, 410, 414, 443, 457–458, 460, 472–473, 487, 496, 523, 527, 531, etc.):

- `text-[10px] font-bold uppercase tracking-wider` → `typo-card-eyebrow`
- `text-[9px] font-bold` / `text-[9px] font-black` → `typo-status-label`
- `text-xs text-foreground/80` → `typo-card-body text-foreground/80`
- `text-[11px] text-muted-foreground` → `typo-card-body text-muted-foreground`
- `text-xs font-bold text-foreground` → `typo-card-body font-bold text-foreground`
- `text-[11px] font-semibold` → `typo-card-meta`
- Multi-column grids: ensure `grid-cols-1 md:grid-cols-2` pattern (already present)

---

## Step 4 — DashboardPage responsive fixes

**File: `src/pages/DashboardPage.tsx`**

- Hero section `text-3xl sm:text-5xl` — keep, this is correct responsive scaling
- "Built For" grid: change `grid-cols-2` to `grid-cols-1 sm:grid-cols-2` for true single-column on mobile
- Mode pills: already `flex-wrap` — good
- Primary CTA button: add `w-full sm:w-auto` for full-width on mobile

---

## Step 5 — StepNavigator: ensure mobile scroll works

**File: `src/components/StepNavigator.tsx`**

Already has `overflow-x-auto scrollbar-hide` and `min-w-max` on the card row. This is correct — horizontal scroll is the exception. No changes needed.

---

## Step 6 — SectionWorkflowNav: mobile grid fix

**File: `src/components/SectionNav.tsx`**

- Grid logic already uses `grid-cols-2` base — correct for mobile
- `NextSectionButton` and `NextStepButton`: already `w-full` — correct
- Buttons already have comfortable height (`py-3.5`) — good

---

## Step 7 — Index.tsx (main analysis page): fix multi-column grids

**File: `src/pages/Index.tsx`**

This is a ~2000-line file with many inline grids. Key patterns to fix:
- `grid-cols-3` without mobile fallback → `grid-cols-1 sm:grid-cols-3`
- `grid-cols-2 sm:grid-cols-3` → keep (already collapses)
- `grid grid-cols-1 md:grid-cols-3` → already correct

Will search for bare `grid-cols-3` or `grid-cols-4` usages without a mobile `grid-cols-1` prefix.

---

## Step 8 — ReportPage: fix remaining inline font sizes and grids

**File: `src/pages/ReportPage.tsx`**

- `grid-cols-2 sm:grid-cols-3` → keep
- `grid-cols-2 sm:grid-cols-4` → keep
- Any bare multi-column grids → add `grid-cols-1` mobile fallback

---

## Step 9 — PitchDeck: fix grids and inline sizes

**File: `src/components/PitchDeck.tsx`**

- `grid grid-cols-3` → `grid grid-cols-1 sm:grid-cols-3`
- `grid-cols-2 sm:grid-cols-4` → keep
- Remaining `text-[8px]`, `text-[10px]`, `text-[11px]` → map to `typo-status-label`, `typo-card-meta`, `typo-card-body`

---

## Step 10 — FirstPrinciplesAnalysis: fix grids

**File: `src/components/FirstPrinciplesAnalysis.tsx`**

- `grid grid-cols-3 gap-3` → `grid grid-cols-1 sm:grid-cols-3 gap-3`
- `grid-cols-2 sm:grid-cols-4` → keep

---

## Step 11 — FlippedIdeaCard: fix score grid

**File: `src/components/FlippedIdeaCard.tsx`**

- `grid grid-cols-3 gap-2` (action plan stats) → `grid grid-cols-1 sm:grid-cols-3 gap-2`
- Score grid `grid-cols-2` → keep (already 2-col, works on mobile)

---

## Step 12 — Global button responsiveness

Across all pages, ensure primary CTA buttons use `w-full sm:w-auto` pattern:
- DashboardPage CTA → add `w-full sm:w-auto`
- AnalysisForm submit buttons → already `w-full`
- NextStepButton/NextSectionButton → already `w-full`

---

## Step 13 — Verify via browser screenshots

After implementation, navigate to the DashboardPage at three viewports:
1. Desktop (1920×1080)
2. Tablet (768×1024)
3. Mobile (390×844)

Confirm no overflow, no text clipping, no hierarchy collapse.

---

## Summary of changes

| File | Changes |
|---|---|
| `src/components/DisruptionPathBanner.tsx` | Replace 6 inline font sizes with `typo-*` classes |
| `src/components/BusinessModelAnalysis.tsx` | Replace ~20 inline font sizes with `typo-*` classes |
| `src/pages/DashboardPage.tsx` | "Built For" grid → single-col mobile; CTA → full-width mobile |
| `src/pages/Index.tsx` | Fix bare multi-column grids to include mobile fallback |
| `src/components/PitchDeck.tsx` | Fix `grid-cols-3` → add mobile fallback; replace inline sizes |
| `src/components/FirstPrinciplesAnalysis.tsx` | Fix bare `grid-cols-3` and `grid-cols-4` |
| `src/components/FlippedIdeaCard.tsx` | Fix action plan stats grid |
| `src/pages/ReportPage.tsx` | Fix any remaining bare multi-column grids |

