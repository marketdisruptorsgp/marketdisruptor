# This is a solid implementation plan — the architecture understanding is correct and the 6-file scope is realistic. A few things worth flagging before your dev runs with it:

**The banned-word scrubber approach is the wrong layer**

Scrubbing words post-generation in `humanize.ts` is a patch, not a fix. "Leverage" gets replaced with "use" — but the sentence it was in was probably still structured like jargon. You end up with clean words in bad sentences. The scrubber should be a safety net, not the primary fix. The primary fix is rewriting the prompts that generate the text in `strategicEngine.ts` and `opportunityDeepening.ts` so the words never appear in the first place. Do both, but don't rely on the scrubber as the main solution.

`buildStrategicNarrative()` **needs more than line edits**

The plan calls out line 315 specifically, but the problem is structural — the whole function builds narrative by concatenating template strings with analysis variables dropped in. That pattern produces generic sentences by design. The real fix is replacing the template concatenation with a constrained AI call that takes the structured data and returns prose within the output spec. That's a bigger change than the plan implies — worth flagging to your dev so they don't underscope it.

**The extractors in** `swotExtractor.ts` **need a fallback strategy**

`extractSingleInsight()`, `extractCriticalQuestion()` etc. will sometimes get data that genuinely can't be distilled into the character limits — especially for complex businesses. The plan doesn't specify what happens when the source narrative doesn't contain enough signal to fill a field cleanly. Add a rule: if a field can't be filled with specific, business-relevant content within the limit, return `null` and the UI renders nothing rather than generic filler. Rendering nothing is better than rendering "pipeline."

**The Command Deck removals need a destination, not just a deletion**

The plan says remove `WhyThisMattersSection`, `IndustryBenchmarkPanel`, `CompetitiveMoatRadar` etc. and "keep in PowerTools deep dive." But if PowerTools already exists and these components aren't currently wired into it, someone needs to wire them. "Keep in PowerTools" shouldn't mean "delete from Command Deck and figure out PowerTools later" — that's how features disappear. Make sure the ticket explicitly says where each removed component lands, not just where it leaves.

**One missing piece: the Overview "3 insights" → "1 insight" change**

The plan correctly says replace the 3-card insight grid with a single insight. But `extractSingleInsight()` needs a selection algorithm — how does it choose which of the 3 is "most surprising/counterintuitive"? The plan doesn't specify this. Options: have the AI rank them and return only the top one, use a confidence score if one exists, or default to whichever maps to the primary assumed-false belief. Your dev needs a decision here or they'll just take `insights[0]`.

**Suggested addition to the ticket:**

Add a QA criterion at the bottom:

```
Definition of done:
- Load Overview with the woodworking business data
- Read the entire page aloud. It should take under 60 seconds.
- Every sentence must be specific enough that removing the 
  business name would make it feel wrong.
- Zero instances of the 16 banned words in any rendered text.
- No field renders if its value is null, empty, or a single word.
- "pipeline" never appears as a standalone field value.

```

Otherwise the dev ships it, it looks different, and the same content problems reappear in a new layout. Implement Strict Output Rules for Overview + Command Deck

## Problem

The Overview and Command Deck pages currently show verbose, jargon-heavy text with banned words (leverage, synergy, paradigm, etc.), bullet points within fields, generic statements, and repeated ideas across sections. The output spec demands a tight, founder-readable format with hard character limits and specific field structures.

## Architecture Understanding

**Data flow:** `strategicEngine.ts` → `buildStrategicNarrative()` → `StrategicNarrative` → consumed by `OverviewPage.tsx` (via `swotExtractor.ts`) and `CommandDeckPage.tsx` (via components like `ContrarianInsightCard`, `StrategicDiagnosisBanner`, `SoWhatHeader`).

The raw text comes from:

1. `buildStrategicNarrative()` in `strategicEngine.ts` — constructs `whyThisMatters`, `verdictRationale`, `trappedValue`, etc. using template strings with jargon baked in (e.g., "structural reconfiguration that changes where and how value accrues")
2. `DeepenedOpportunity` objects from `reconfiguration/opportunityDeepening.ts` — AI-generated thesis text
3. `humanizeLabel()` in `humanize.ts` — strips ID prefixes but does NOT filter banned words

## Plan

### 1. Add a banned-word scrubber to `humanize.ts`

Add a `scrubBannedWords(text)` function that replaces or removes the 16 banned words from all user-facing text. Also add a `enforceCharLimit(text, max)` helper. Wire `scrubBannedWords` into `humanizeLabel()` so every rendered string is automatically cleaned.

Banned words: leverage, synergy, optimize, operationalize, streamline, ecosystem, robust, utilize, unlock, headcount, preliminary, proportional, actionable, stakeholder, paradigm, holistic.

Replacement map (examples):

- "leverage" → "use" or "advantage"
- "optimize" → "improve"
- "streamline" → "simplify"
- "utilize" → "use"
- "unlock" → "reveal" or "open up"
- "actionable" → "practical"
- "robust" → "strong"
- "stakeholder" → "people involved"
- Others → remove entirely

### 2. Fix `buildStrategicNarrative()` in `strategicEngine.ts`

Line 315 currently hardcodes: `"This isn't a surface optimization: it's a structural reconfiguration that changes where and how value accrues."` — rewrite to plain English within character limits.

Similarly fix `verdictRationale` (line 311) and `executiveSummary` (line 362) templates to avoid jargon.

### 3. Restructure `OverviewPage.tsx` to match the new output spec

Replace the current 5-section layout with the spec's JSON-aligned structure:

- **Single insight** (not 3) — the most surprising finding with `insight_headline` (8 words max) + `insight_body` (2 sentences)
- **Assumption banner** — `everyone_assumes` (20 words) / `evidence_suggests` (20 words) / `so_what` (15 words)
- **Business Reality (SWOT)** — 4 fields: `working`, `blocking`, `opening`, `risk` — each exactly 2 sentences
- **Critical question** — single question, max 20 words
- **Opportunities** — exactly 3, verb-first title (8 words), 2-sentence description, 1-2 badges
- Remove "Key Insights" 3-card grid, "Recommended Focus" section, and "Structural Assumptions" section (these get folded into the new structure)

### 4. Add new extractors to `swotExtractor.ts`

Add functions:

- `extractSingleInsight(narrative, deepenedOpps)` → `{ headline, body }`
- `extractAssumptionBanner(narrative, deepenedOpps, entityName)` → `{ everyone_assumes, evidence_suggests, so_what }`
- `extractCriticalQuestion(narrative, deepenedOpps)` → string
- `extractSwotProse(narrative)` → `{ working, blocking, opening, risk }` (2 sentences each)
- `extractOpportunitiesWithBadges(topOpps, deepenedOpps)` → array of `{ title, description, badges }`

Each enforces character limits and banned-word scrubbing.

### 5. Update Command Deck to match spec

The Command Deck spec says: show assumption_banner, swot (restated from different angle), critical_question (execution-focused), and 3 opportunities (more specific than Overview). Remove diagnosis paragraphs, "why this matters" explanations, benchmark scores, competitive moat, strategy simulator output, document intelligence, key findings lists.

Changes to `CommandDeckPage.tsx`:

- Remove `WhyThisMattersSection`, `SecondOrderEffectsSection`, `CIMKeyFindings`, `IndustryBenchmarkPanel`, `RevivalScoreCard`, `CompetitiveMoatRadar`, `LeverageToDirectionsLink` from the main view (keep in PowerTools deep dive)
- Replace `StrategicDiagnosisBanner` + `SoWhatHeader` with a compact assumption banner + critical question
- Keep `ContrarianInsightCard` but enforce the 20-word limits on each field
- Keep `OpportunityDirectionsGrid` but enforce exactly 3 items with verb-first titles and badges

### 6. Update `ContrarianInsightCard.tsx`

Enforce the 20-word / 15-word limits from the spec. Replace "Everyone Assumes" / "The Evidence Suggests" labels with the spec's structure. Add the `so_what` line.

## What stays the same

- Deep Dive / PowerTools panel keeps all advanced tools
- Data pipeline and strategic engine internals unchanged
- Deal-specific sections (biExtraction) unchanged
- Scenario Lab unchanged

## Estimated scope

- 6 files modified: `humanize.ts`, `strategicEngine.ts`, `swotExtractor.ts`, `OverviewPage.tsx`, `CommandDeckPage.tsx`, `ContrarianInsightCard.tsx`
- No new dependencies
- No database changes