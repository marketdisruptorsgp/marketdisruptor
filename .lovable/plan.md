

# Axial-Style Top Navigation with "Access Modes" Dropdown

## What Changes

The current inline tab bar ("Access Modes" with 3 tabs in the dashboard body) gets replaced by a proper **top navigation bar** with hover/click dropdown menus -- matching the Axial.net pattern shown in the screenshot. The modes move into a dropdown panel under an "Access Modes" nav item, and the dashboard body simplifies to show just the form for the currently selected mode.

Additionally, new **Resources** and **About** pages are created, accessible from the top nav.

## User-Facing Summary

- **Top nav bar** replaces the simple logo + user button header. Items: **Access Modes** (dropdown), **Workspace** (dropdown), **Resources** (dropdown), **About**, **Pricing**. Right side keeps Projects button, Upgrade CTA, and user menu.
- **Access Modes dropdown** shows 3 items with bold titles and muted descriptions:
  - Disrupt This Product
  - Disrupt This Service
  - Disrupt This Business Model
- **Resources dropdown** links to FAQs, Methodology, and Market Intel sections on a new `/resources` page.
- **About page** at `/about` covers: why the platform exists, how it works, who it's for, and the value proposition.
- **Dashboard body** no longer has the inline tab bar -- just the form for the currently active mode, loading tracker, error state, and quick-start templates.
- **Image handling** remains as previously implemented (user images preserved, neutral placeholder when none available).

## Technical Details

### New Files

| File | Purpose |
|---|---|
| `src/components/PlatformNav.tsx` | Axial-style nav bar using `@radix-ui/react-navigation-menu`. Contains "Access Modes" dropdown with the 3 mode items (click sets analysis mode + scrolls to form), "Workspace" dropdown (Saved Projects, Stats), "Resources" dropdown (FAQ, Methodology, Market Intel), plus direct links to About and Pricing. Right side: Projects button, Upgrade CTA, UserHeader. |
| `src/pages/ResourcesPage.tsx` | Tabbed page with real platform content: FAQs (accordion), Methodology (pipeline explanation, claim tagging, leverage scoring), Market Intel (placeholder for future reports). Uses existing Tabs and Accordion components. |
| `src/pages/AboutPage.tsx` | Static page: platform thesis ("Strategic Reinvention"), numbered how-it-works walkthrough, audience profiles (entrepreneurs, investors, teams, agencies), SGP Capital branding and contact. |

### Modified Files

| File | Changes |
|---|---|
| `src/components/HeroSection.tsx` | Replace the top nav `div` (lines 57-86) with the new `PlatformNav` component. Keep the welcome row and activity bar as-is. Pass mode-setting callbacks and nav state as props. |
| `src/pages/DashboardPage.tsx` | Remove the inline TABS array and tab bar (lines 100-160). Keep the form, but wrap it in a simpler card without the tab UI. The mode is now set from the nav dropdown. Keep loading tracker, error state, business model section, quick-start templates, and sidebar. |
| `src/App.tsx` | Add two new routes: `/resources` pointing to `ResourcesPage` and `/about` pointing to `AboutPage`, inside the authenticated route block. |

### PlatformNav Component Architecture

```text
+-----------------------------------------------------------------------+
| [Logo]  Access Modes v  Workspace v  Resources v  About  Pricing  |  [Projects] [Upgrade] [User] |
+-----------------------------------------------------------------------+
          |                                                    
          +-- Dropdown Panel --------+                        
          | Disrupt This Product     |                        
          |   Upload & analyze any   |                        
          |   physical product       |                        
          |                          |                        
          | Disrupt This Service     |                        
          |   Deconstruct any service|                        
          |   business               |                        
          |                          |                        
          | Disrupt This Business    |                        
          |   Model                  |                        
          |   Full business model    |                        
          |   teardown               |                        
          +--------------------------+                        
```

- Uses Radix `NavigationMenu` for accessible hover-open behavior
- Dropdown panels: `bg-card`, `border`, `rounded`, high `z-index`
- Each mode item: bold title + muted description, click sets `analysis.setMainTab()` and `analysis.setActiveMode()`
- No gradients, glow, or scaling -- flat bordered panels per design system

### Resources Page Structure

- **FAQs tab**: Accordion with 8-10 real questions about the platform (data sources, AI models, privacy, scoring methodology)
- **Methodology tab**: Detailed breakdown of the 4-step pipeline, claim tagging system, leverage scoring, adversarial red teaming
- **Market Intel tab**: Placeholder section explaining upcoming market reports, with a CTA to run an analysis

### About Page Structure

- Hero section with platform thesis
- Numbered "How It Works" steps (1. Input, 2. Deconstruction, 3. Validation, 4. Output)
- Audience profiles grid
- SGP Capital footer with contact

