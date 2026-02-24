# Yes. Also each mode has a corresponding color like pink for service purple for business model blue for product. Use those as a basis somehow to always let user know which mode they're in. And ensure this styling logic here is applied across all modes steps sections. Polish UI: Match Analysis Journey Design Quality

## Problem

Several sections across the Intel Report and Disrupt steps use colored tinted backgrounds, emojis, dashed borders, and inconsistent card treatments that feel cheap and AI-generated. The 4th screenshot (Analysis Journey grid) has the right level of polish: clean backgrounds, subtle borders, professional typography, and minimal color usage limited to icons and status indicators.

## What Changes

### 1. DetailPanel (collapsible sections) -- `src/components/SectionNav.tsx`

- Remove dashed border style; use solid `1px solid hsl(var(--border))` consistently
- Remove the pulsing "Tap to expand" black badge (feels gimmicky)
- Replace with a subtle static chevron-only indicator
- Clean up hover/open states to use simple background shifts

### 2. Patent Intelligence cards -- `src/components/PatentIntelligence.tsx`

- **Score meters area**: Remove purple tinted background; use clean `hsl(var(--card))` with subtle border
- **Risk card**: Keep the semantic color for the risk level text/icon but use a neutral card background instead of colored tint
- **Expired Goldmines cards**: Remove green tinted backgrounds; use clean card bg with a small green accent dot or left-border only
- **Patent Gaps cards**: Remove emoji usage (fire, lightning bolt); use plain text labels like "High" / "Medium"
- **Innovation Angles cards**: Remove amber tinted background; use neutral card with subtle accent
- **Quick Actions**: Remove blue tinted background; use clean card with numbered list
- **Active Minefield**: Remove red tinted backgrounds and emoji (warning, lightning); use clean cards with small colored severity text
- **All sections**: Remove emoji characters entirely (no fire, lightning, warning, money bag icons in text)

### 3. Disrupt section cards -- `src/components/FirstPrinciplesAnalysis.tsx`

- **"The Real Problem" card**: Remove colored left-border + tinted background; use clean card with bold header
- **"Highest-Leverage Integration" card**: Same treatment -- remove blue tint + left-border
- **Challenge idea callouts**: Remove blue left-border + tinted background; use clean indented text with subtle styling
- **Missed Opportunities cards**: Remove purple tinted backgrounds; use neutral cards
- **Severity/reason badges**: Keep as small colored text labels but remove colored background tints -- use lighter, more subtle pill styling

### 4. General Badge Cleanup -- `src/components/SectionNav.tsx`

- "All sections explored" badge: Remove green tinted background; use clean styling consistent with the grid navigator
- Gating warning badge: Remove amber tint; use subtle neutral styling

---

## Technical Details

### Files Modified


| File                                         | Changes                                                                                          |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `src/components/SectionNav.tsx`              | DetailPanel: solid borders, remove pulse badge. NextStepButton/AllExploredBadge: cleaner styling |
| `src/components/PatentIntelligence.tsx`      | All cards: neutral backgrounds, remove emojis, cleaner borders                                   |
| `src/components/FirstPrinciplesAnalysis.tsx` | Content cards: remove colored tints/left-borders, cleaner callouts                               |


### Design Principles Applied

- Cards use `hsl(var(--card))` or `hsl(var(--muted))` backgrounds only -- no colored tints
- Semantic colors (red/amber/green) limited to small text labels and icons, never card backgrounds
- No emojis anywhere in rendered output
- Borders are always solid `1px solid hsl(var(--border))` -- no dashed borders
- No pulse/bounce animations on static UI elements
- Typography hierarchy carries the weight, not background colors