

## Intel Digest: A Structured Signal Summary for the Report Page

### What it is
A new `IntelDigest` component placed at the top of the report (above the accordion sections), acting as a distilled visual dashboard of the key findings. It extracts signals from the existing product data — strengths, complaints, friction points, reviews — and presents them in a scannable, interactive, color-coded layout.

### Data Sources (all already available on `selectedProduct`)
- **Strengths**: Positive reviews, high confidence scores, key insight
- **Complaints**: `communityInsights.topComplaints`
- **Friction Points**: `userWorkflow.frictionPoints`
- **Requests**: `communityInsights.improvementRequests`
- **Pricing Signal**: `pricingIntel.priceDirection`

### Visual Design

```text
┌─────────────────────────────────────────────────────┐
│  Intel Digest                                       │
├──────────┬──────────┬──────────┬────────────────────┤
│ Strengths│Complaints│ Friction │ Requests           │
│  (green) │  (red)   │ (amber)  │ (blue)             │
├──────────┴──────────┴──────────┴────────────────────┤
│                                                     │
│  ● Strong brand nostalgia        [☐] [expand ▾]    │
│  ● Film cost is #1 barrier       [☐] [expand ▾]    │
│  ● Checkout flow has 3 drops     [☐] [expand ▾]    │
│  ...                                                │
└─────────────────────────────────────────────────────┘
```

### Layout & Interaction
- **4-column tab bar** at the top: Strengths (green), Complaints (red), Friction (amber), Requests (blue). Each tab shows a count badge.
- **Signal rows** below the active tab: each row shows:
  - A colored dot matching the category
  - The signal text (full text, no truncation)
  - A **checkbox** (☐) — user can checkmark items they care about
  - An **expand** toggle — reveals a text area for adding a personal note
- Checked items and notes are **persisted** via `saveStepData("intelDigestNotes", ...)` to `analysis_data`, same pattern as `projectNotes`.
- All text is high-contrast black (`text-foreground`), 13px body. No cut-off — each row expands naturally.
- Mode-agnostic: works for Product (reviews + supply chain signals), Service (community + journey), Business (all applicable fields). Falls back gracefully if a category has zero items.

### Implementation Plan

**1. New component: `src/components/IntelDigest.tsx`**
- Props: `product: Product`, `analysisId: string | null`, `saveStepData: fn`
- Internal state: `activeTab` (strengths | complaints | friction | requests), `checkedItems: Record<string, boolean>`, `notes: Record<string, string>`
- On mount, loads persisted digest notes from `analysis_data.intelDigestNotes`
- Each tab filters signals from the product data
- Checkbox toggles and note edits auto-save with debounce

**2. Update `src/pages/ReportPage.tsx`**
- Import and render `<IntelDigest>` between the `<ProductCard>` and the `<AnalysisVisualLayer>` accordion sections
- Pass `selectedProduct`, `analysisId`, `analysis.saveStepData`

**3. No backend changes** — uses existing `saveStepData` which writes to `saved_analyses.analysis_data`

### Technical Details
- Tabs use simple state, not Radix Tabs (keeps it lightweight)
- Checkbox state stored as `{ [signalText]: true }` 
- Notes stored as `{ [signalText]: "user note text" }`
- Both persisted together as `intelDigestNotes` in analysis_data
- Expand/collapse uses Collapsible from Radix (already installed)
- Colors: green-600, red-500, amber-500, blue-500 for category dots/tabs — all on white/card background for high contrast

