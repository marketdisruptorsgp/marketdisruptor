
# Institutional-Grade Pitch Presentation Overhaul

## Summary
Redesign the entire pitch slide system to match the Axial.net capital-markets aesthetic: flat surfaces, typography-driven hierarchy, neutral backgrounds, zero decoration. Add a fullscreen "Present" mode. Consolidate from 12 to 10 slides. Move SGP Capital CTA to the completion page. Make the completion action prominent.

---

## 1. Redesign PitchSlideFrame -- Institutional Style

**File: `src/components/pitch/PitchSlideFrame.tsx`**

Remove all current decorative elements (accent bar, colored icon box, rounded-xl, box-shadow, gradient footer). Replace with:

- **Flat white background** (`hsl(var(--card))`) with a single thin `1px` border, no shadow, no rounded corners beyond `rounded-md`
- **Header**: Left-aligned slide title in 22-24px Space Grotesk 700, subtitle below in 12px Inter 400 muted. No icon box -- just the text. Slide number right-aligned in `11px` muted (`01 / 10` format with zero-padded numbers)
- **Footer**: Thin `1px` top border. "MARKET DISRUPTOR" left, "CONFIDENTIAL" center, product name right. All in `9px` uppercase tracking-widest muted
- **No accent bar, no colored icon container, no box-shadow**
- **Aspect ratio**: Keep `16 / 9`

Update `SlideStatCard`: Remove colored accent values. Use black text for the metric value, muted label above, thin border. Flat muted background.

Update `SlideBullet`: Replace colored icon with a simple `4px` circle (muted-foreground) or em-dash prefix. Text in `13-14px` Inter.

---

## 2. Consolidate to 10 Slides

**File: `src/components/PitchDeck.tsx`**

Merge 12 slides into 10 standard VC sections:
1. Problem
2. Solution
3. Why Now
4. Market Opportunity
5. Product / Innovation
6. Business Model
7. Traction and Metrics (merge slides 7+9)
8. Risks and Mitigation
9. Go-to-Market (merge with Competitive into GTM + Positioning)
10. The Ask (Investment)

Update `SLIDE_TABS`, `SLIDE_TITLES`, and `PITCH_SLIDE_DESCRIPTIONS` accordingly.

---

## 3. Strip Decorative Styling from All Slide Content

**File: `src/components/PitchDeck.tsx`**

For every slide's JSX content:
- **Remove** all colored background panels (`hsl(var(--destructive) / 0.05)`, gradient elevator pitch box, colored border-top on phases, colored pills for revenue streams)
- **Replace** with flat `hsl(var(--muted))` backgrounds with `1px solid hsl(var(--border))` borders
- **Remove** all accent-colored text for labels -- use `text-muted-foreground` for all section labels
- **Section labels**: 10px uppercase tracking-widest in muted foreground (same pattern but no color variation)
- **Body text**: 13-14px Inter, `text-foreground/85`, `leading-relaxed`
- **Key metrics**: Bold foreground, no colored backgrounds on badges
- **Severity tags** (risks): Use text-only labels with foreground weight differences, not colored pills

---

## 4. Create Fullscreen Presentation Mode

**New file: `src/components/pitch/PresentationMode.tsx`**

- Fixed 1920x1080 slide rendered at center, scaled via `transform: scale()` to fit viewport
- **Black background** (neutral, not decorative)
- No decorative overlays -- only a subtle slide counter in bottom-right (`01 / 10` in 12px muted white)
- Keyboard navigation: ArrowRight/Space = next, ArrowLeft = prev, Escape = exit
- Uses browser Fullscreen API
- Each slide's content is passed as render functions extracted from PitchDeck
- No auto-advance, no transitions, no animations
- Exit button: small "ESC" label in top-right, auto-hides after 3 seconds of no mouse movement

**Integration in PitchDeck toolbar**: Add a "Present" button next to Export and Regenerate, using the `Presentation` icon.

---

## 5. Fix SectionWorkflowNav Grid for 10 Tabs

**File: `src/components/SectionNav.tsx`**

Update `gridCols` logic to add a case for 7-12 tabs:
- `grid-cols-2 sm:grid-cols-5 lg:grid-cols-5` for exactly 10 tabs (2 rows of 5 on tablet/desktop)

---

## 6. Move SGP Capital CTA to Completion Page

**File: `src/components/PitchDeck.tsx`**
- Remove the entire SGP Capital block (lines 688-740) from the Investment slide footer
- Replace with a prominent "Complete Analysis" button (full-width, primary background, Sparkles icon)

**File: `src/components/CompletionExperience.tsx`**
- Add the SGP Capital partnership CTA between the main completion card and the Evolution View
- Accept additional props: `product`, `profile`, `user`, `userScore`, `analysisId`

---

## 7. Update stepConfigs

**File: `src/lib/stepConfigs.ts`**
- Update `PITCH_SLIDE_DESCRIPTIONS` to reflect the new 10-slide structure

---

## Files Modified
| File | Change |
|---|---|
| `src/components/pitch/PitchSlideFrame.tsx` | Institutional flat redesign, remove all decoration |
| `src/components/pitch/PresentationMode.tsx` | New fullscreen presenter component |
| `src/components/PitchDeck.tsx` | 10-slide consolidation, strip decorative styling, add Present button, remove SGP CTA, prominent completion button |
| `src/components/SectionNav.tsx` | Fix grid for 10 tabs |
| `src/components/CompletionExperience.tsx` | Add SGP Capital CTA section |
| `src/lib/stepConfigs.ts` | Update slide descriptions for 10 slides |

## Design Principles Applied
- Flat surfaces, no gradients, no shadows
- Typography-driven hierarchy (size + weight only)
- Neutral muted background, semantic accent only for data meaning (score thresholds)
- Max 5 bullets, max 12 words per bullet
- Generous whitespace, information-first
- Identical structure across all modes (Product, Service, Business)
