
## Simplify the Analysis Form: Two Distinct Modes

The goal is to make the form feel like a clean choice between two modes — not one form with both sections always visible together.

### What's Changing

**1. Remove the "Audience / Market" field**
The `audience` state, its label, and its input are removed. The `onAnalyze` callback signature will drop `audience` as a parameter, and all downstream references in `Index.tsx` and edge functions will be updated to remove it.

**2. Replace the "always visible + collapsible" layout with a two-mode toggle**
Instead of showing the Category / Era / Batch Size grid at the top AND the custom upload section below it, the form will present two mutually exclusive modes:

```text
┌─────────────────────────────────────────────────────┐
│  How do you want to analyze?                        │
│                                                     │
│  [ Discover by Category ]  [ Analyze My Products ]  │
└─────────────────────────────────────────────────────┘
```

- **Mode A — "Discover by Category"** (default): Shows the Category, Era, and Batch Size fields. The custom product section is hidden entirely.
- **Mode B — "Analyze My Products"**: Shows only the custom product upload/URL section. The Category/Era/Batch Size fields are hidden entirely.

When Mode B is active and has products added, the submit button label updates to "Analyze My Products". When Mode A is active, it says "Run Product Intelligence Analysis" (with batch size count in the subtitle).

### Technical Details

**Files to modify:**
- `src/components/AnalysisForm.tsx` — Primary change. Replace `showCustom` toggle + grid layout with a `mode: "discover" | "custom"` state. Remove `audience` state and prop.
- `src/pages/Index.tsx` — Remove `audience` from the `onAnalyze` call params and any places it's passed to edge functions.
- `supabase/functions/scrape-products/index.ts` — Remove `audience` from the destructured request body.
- `supabase/functions/analyze-products/index.ts` — Remove `audience` from prompt context (AI infers audience naturally from product data).

### UX Flow

**Mode A (Discover):**
- Category dropdown
- Era dropdown  
- Batch Size slider
- Submit → scrapes + analyzes {batchSize} products from that category/era

**Mode B (My Products):**
- URL tab / Image tab toggle
- One or more product entries (name + url/image + notes)
- Submit → analyzes only those specific products

The toggle between modes uses a pill-style switcher at the top of the form, clearly communicating that these are two separate paths — not additive inputs.
