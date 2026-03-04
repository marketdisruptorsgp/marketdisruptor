&nbsp;

I don't want print to pdf   I want download pdf  and I want it to work properly on both browser and mobile  the mobile download could download as if a browser layout if that's easier/better  will take your lead  

## Plan: Match-the-UI PDF Export via Browser Print

### Problem

The current PDF export uses jsPDF to manually draw text/shapes (1,800+ lines of imperative code). This approach:

- Cannot match the actual UI styling (different fonts, spacing, colors, layout)
- Is fragile — every UI change requires mirroring in PDF code
- Produces a document that looks nothing like what users see on screen

### Solution: Browser Print-to-PDF

Use the browser's native `window.print()` with `@media print` CSS. The PDF **is** the rendered UI, so formatting matches by definition.

### How it works

1. **Add a "Download PDF" button** that triggers a print-optimized view
2. **Create print-specific CSS** in `index.css` using `@media print` that:
  - Hides nav, footer, buttons, interactive elements
  - Forces white background, proper page breaks
  - Expands all collapsed `<details>` sections
  - Sets clean typography and margins
  - Adds page headers/footers via `@page` rules
3. **Add a print wrapper component** (`PrintableAnalysis`) that:
  - Renders all analysis sections in a single scrollable layout (no accordions)
  - Includes a cover page with product name, mode, date
  - Opens all sections that are normally collapsed
4. **Wire it into the Export Panel** as the primary "Full Report PDF" option, replacing the jsPDF `downloadFullAnalysisPDF` call

### Technical approach

- **New file**: `src/components/export/PrintableReport.tsx` — a print-optimized layout that renders all analysis data in reading order (cover → overview → journey → community → pricing → supply chain → disruption → stress test → pitch → redesign → patents)
- **CSS additions** to `src/index.css`: `@media print` block (~40 lines) hiding non-print elements, forcing page breaks, expanding details
- **Trigger**: `window.print()` after temporarily applying a `printing` class to body, or navigate to a `/print` route that renders the printable view
- **Approach choice**: Use a dedicated `/analysis/:id/print` route that renders the full report in print layout, then auto-triggers `window.print()`. This is the cleanest — no DOM manipulation needed.

### What stays the same

- The existing jsPDF exports (Investor Pitch PDF, Opportunity Brief, PowerPoint) remain as-is — they serve different purposes (formatted slide decks, executive summaries)
- The "Full Report PDF" button in ExportPanel and ReportPage will switch to use the new print approach

### Key print CSS rules

- `@page { margin: 15mm; size: A4; }`
- Hide `.no-print` elements (nav, buttons, export panel)
- `details[open] > summary { display: none }` — show content without toggle
- `break-inside: avoid` on cards/sections
- Force `color-adjust: exact` for backgrounds/colors

### Files to create/modify

- **Create**: `src/components/export/PrintableReport.tsx` — full printable layout
- **Create**: `src/pages/PrintReportPage.tsx` — route that renders + triggers print
- **Modify**: `src/index.css` — add `@media print` styles
- **Modify**: `src/App.tsx` — add `/analysis/:id/print` route
- **Modify**: `src/components/export/ExportPanel.tsx` — update "Full Report PDF" to navigate to print page
- **Modify**: `src/pages/ReportPage.tsx` — update PDF button to use print route