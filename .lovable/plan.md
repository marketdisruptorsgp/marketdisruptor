

## Diagnosis

**Truncation issue:** The `generate-pitch-deck` edge function requests `max_tokens: 24000` but the JSON schema is massive (~163 lines of structured output). The AI model frequently hits the token limit, producing truncated JSON. The current repair logic (brace-balancing) partially works but loses entire slide sections (typically the last 2-4 fields like `competitiveLandscape`, `investmentAsk`, `supplierContacts`). There is **no `finish_reason` check** — truncated outputs silently pass through.

**Styling/wow factor:** The current slide components are functional but lack visual punch — everything uses the same `#fafafa` panels with `1px solid #e8e8ec` borders. No gradients, no depth hierarchy, no dramatic focal points.

## Plan

### 1. Fix truncation — Edge function improvements
**File:** `supabase/functions/generate-pitch-deck/index.ts`

- Check `finish_reason` / `finishReason` — if `"length"` or `"MAX_TOKENS"`, log warning and attempt a **completion request** (send the truncated JSON back with instruction to complete it)
- Reduce prompt input size: trim `disruptData`, `stressTestData`, `redesignData` to only essential fields (not full JSON dumps) — cut input tokens by ~40%
- Simplify the JSON schema in the prompt: remove `supplierContacts` and `distributorContacts` from the required output (these are rarely rendered and consume ~15% of output tokens). Generate them only if explicitly needed.
- Add `"response_format": { "type": "json_object" }` to force JSON mode (supported by Gemini via the gateway)

### 2. Add defensive fallbacks — Frontend
**File:** `src/components/PitchDeck.tsx`

- Add null guards on every slide section: `data.risks?.slice(0, 4)` → already done for some, but `data.competitiveAdvantages`, `data.investorHighlights`, `data.keyMetrics` etc. need `|| []` fallbacks
- If a slide's content is entirely empty (all fields null), show a "This section wasn't generated — click Regenerate" placeholder instead of blank/crashing

### 3. Enhance slide styling — Visual wow factor
**File:** `src/components/pitch/PitchSlideFrame.tsx`

- **Cover slide**: Add a subtle gradient wash using the accent color (radial gradient from bottom-right corner at 5% opacity), larger monogram, and a geometric accent shape
- **SlideQuoteBlock**: Add a faint gradient background instead of flat `#fafafa`, larger opening quote mark as a decorative element
- **KeyMetricPanel**: Make the value dramatically larger (64px+), add a subtle pulsing glow ring behind the number
- **InsightCard**: Add a subtle top-border gradient (accent → transparent) instead of flat 3px border
- **TakeawayCallout**: Add a frosted-glass effect with backdrop blur styling
- **RiskSeverityBar**: Wider track (10px), rounded pill shape, animated fill on mount
- **PitchSlideFrame header**: Add a subtle gradient fade beneath the header divider for depth
- **SlideStatCard**: Add hover-like elevation shadow for more dimensionality
- **MarketSizeVisual**: Add animated dash-array on circles for a premium feel, subtle radial gradient fill

### 4. Consistent across modes
- All accent colors already flow through `accentColor` prop — no mode-specific fixes needed
- Add the same null-guard pattern to all slide content blocks so Service and Business analyses with different data shapes don't break

