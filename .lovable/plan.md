

## Add a Bold Explainer Section Above the Mode Selection

### What's Changing

A new prominent "guidance banner" will be inserted directly above the "Step 1" heading. It will serve as a quick orientation for users, explaining what the three modes do and why the platform is powerful -- all in a scannable, visually bold format.

### Design

The section will appear between the pro-tip area and the "Step 1" heading, styled as a high-contrast card with:

- A bold headline like **"Choose Your Analysis Path"**
- A short paragraph explaining that each mode uses a different AI pipeline and data strategy, so picking the right one matters
- Three compact inline summaries (icon + mode name + one-liner) arranged horizontally, giving users an at-a-glance comparison before they scroll to the full cards
- A subtle "behind the scenes" note mentioning live web scraping, vision AI, and strategic deconstruction to build credibility

The styling will use the existing design language: bold black text, muted supporting copy, and a light background with a subtle border -- keeping it distinct from the mode cards below but visually connected.

### Technical Details

**File to modify:** `src/components/AnalysisForm.tsx`

- Insert a new `div` block inside the form, before the "Step 1" heading area (around line 202)
- The block will contain:
  - A large, bold heading (`text-xl font-extrabold`)
  - A 1-2 sentence subtitle in muted text explaining the choice
  - A 3-column mini-summary row, each with the mode's icon, name, and a single short sentence (e.g., "AI scrapes marketplaces to find hidden gems", "Drop URLs + photos for a full product audit", "Deconstruct any business model from first principles")
  - A small footer line like: "Powered by live web scraping, vision AI, and multi-model strategic analysis"
- All content is static -- no new state or logic needed
- Uses existing icon imports (`Telescope`, `Upload`, `Building2`) and tailwind classes

