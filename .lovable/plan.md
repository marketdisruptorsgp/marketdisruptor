

## Header Nav Adjustment

Match the layout shown in the screenshots by restructuring the desktop nav tabs and right-side actions.

### Changes (PlatformNav.tsx only)

1. **Remove "Start Disrupting" from nav tabs** — it currently sits as the first tab link with a Zap icon. Remove it from the NavigationMenuList.

2. **Remove "Pricing" from nav tabs** — it's the last tab in the nav list. Remove it.

3. **Keep these nav tabs** (in order): Portfolio, Intel, Photo Analysis, About, Resources dropdown — matching the screenshot exactly.

4. **Replace the right-side "Upgrade" button** with a "Start Analysis →" primary button that navigates to `/start`. This button should:
   - Use `rounded-full`, `bg-primary`, `text-primary-foreground`
   - Include an ArrowRight icon
   - Show on both desktop and mobile (hidden only on very small screens)
   - Display regardless of tier (remove the `tier !== "disruptor"` conditional)

5. **Mobile menu adjustments**: Remove "Pricing" from the mobile sheet. Keep "Start Disrupting" section in mobile as-is since it serves as the entry point there.

### Files to edit
- `src/components/PlatformNav.tsx`

