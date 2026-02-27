

# Replace "Start Disrupting" Dropdown with Dedicated Page

## What Changes

Replace the `NavigationMenuTrigger` dropdown for "Start Disrupting" in `PlatformNav` with a simple link to `/start`. Create a new `/start` page that presents all three modes as rich, explainer cards with CTAs linking to `/start/product`, `/start/service`, `/start/business`.

## Implementation Steps

### Step 1 — Create `src/pages/StartPage.tsx`

New page with:
- `HeroSection` / `PlatformNav` header (consistent with other pages)
- Page title: "Start Disrupting" with `typo-page-title`
- Subtitle explaining the three modes
- Three large cards in a `grid-cols-1 md:grid-cols-3` layout, one per mode:
  - **Product** (Upload icon, blue accent `--mode-product`): title, 2-3 sentence explainer of what product analysis does, list of 3-4 key capabilities, CTA button linking to `/start/product`
  - **Service** (Briefcase icon, pink accent `--mode-service`): same structure for service analysis
  - **Business** (Building2 icon, purple accent `--mode-business`): same structure for business model analysis
- Each card uses mode accent for top border, icon color, and CTA button
- Footer matching other pages

### Step 2 — Update `PlatformNav.tsx`

- Remove the `NavigationMenuTrigger` + `NavigationMenuContent` dropdown for "Start Disrupting" (lines 84-119)
- Replace with a simple `<a>` link to `/start`, styled like the Portfolio/Intel links with `border-b-2` active state and a Zap icon
- In the mobile Sheet: replace the 3 mode buttons under "Start Disrupting" with a single link to `/start`

### Step 3 — Add route in `App.tsx`

- Import `StartPage` and add `<Route path="/start" element={<StartPage />} />`

### Step 4 — Update `DashboardPage.tsx`

- If the homepage has any "Start Disrupting" CTAs that link to the dropdown, update them to navigate to `/start`

## Files

| File | Change |
|---|---|
| `src/pages/StartPage.tsx` | New — mode picker page with explainer cards |
| `src/components/PlatformNav.tsx` | Replace dropdown with `/start` link |
| `src/App.tsx` | Add `/start` route |
| `src/pages/DashboardPage.tsx` | Update any CTA links if needed |

