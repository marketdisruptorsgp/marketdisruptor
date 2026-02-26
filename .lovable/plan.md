

## Three Changes to Homepage

### 1. Center the "Rethink any ___" heading
**File:** `src/pages/DashboardPage.tsx` (line 88)
- Add `text-center` to the container div so the heading block centers with content below

### 2. Remove StreakBadge
**File:** `src/pages/DashboardPage.tsx`
- Remove import of `StreakBadge` (line 12)
- Remove the StreakBadge JSX block (lines 112-115)

### 3. Redesign pipeline cards — shorter but keep expandable details
**File:** `src/components/DisruptionPathBanner.tsx`
- Reduce card padding from `p-5 sm:p-6` → `p-4`
- Shrink icon from `w-10 h-10 sm:w-11 sm:h-11` → `w-8 h-8`
- Put step number and icon on the same line more compactly (reduce gap/margin from `mb-4` → `mb-2`)
- Reduce label margin from `mb-1.5` → `mb-1`
- Reduce desc margin from `mb-3` → `mb-2`
- **Keep** the expandable detail section on hover/active (the animated `maxHeight` block stays)
- Remove the active/completed indicator badges at the bottom (lines 169-183) — these add unnecessary height
- Net effect: cards are ~30% shorter in their collapsed state but still expand on hover to show the detail text

