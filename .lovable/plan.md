

## Plan: Solid Mode Color for Visited Section Cards

The user wants visited cards to have the **full solid accent color** as background (same as the active card), with white text/numbers — not the current faint 30% opacity tint.

### Change: `src/components/SectionNav.tsx` (lines 234-290)

**Visited card background** — change from `${accent}30` (faint tint) to solid `${accent}` (same as active):
- Line 239: `${accent}30` → `accent` (solid color)

**Visited icon container** — use the same white-on-accent style as active:
- Line 253: keep `"hsla(0 0% 100% / 0.2)"` for both active and visited

**Visited text colors** — all white, matching active:
- Line 265 (step counter): visited color → `"hsla(0 0% 100% / 0.6)"` (same as active)
- Line 271 (title): visited color → `"white"` (same as active)
- Line 282 (description): visited color → `"hsla(0 0% 100% / 0.6)"` (same as active)

**Visited bottom border** — remove since the card is already fully colored:
- Line 242: only show bottom border for active, not visited

**Active card distinction** — keep the white bottom bar (line 287-289) as the only differentiator between active and visited

Result: all visited + active cards are solid accent color with white text. Only unvisited cards remain neutral. The active card has a small white underline to distinguish it.

