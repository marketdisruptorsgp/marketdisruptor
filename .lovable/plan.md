

## Context-Aware Regulatory & Environmental Intelligence Layer

### What You're Asking For
An adaptive data enrichment system that detects when regulatory, legal, political, or other domain-specific factors are material to an analysis -- then fetches relevant real-world data accordingly. The THC/cannabis example (Missouri vs Florida laws) is one case; others include food safety (FDA), financial services (SEC/state licensing), healthcare (HIPAA), alcohol (TTB/state ABC), etc. This should NOT apply uniformly -- it should be category-aware and geography-aware.

### Architecture

The existing `geo-market-data` edge function is the right place to extend. Currently it fetches Census + World Bank data for every analysis. The new layer adds a **regulatory relevance detector** that:

1. **Classifies the category** against a regulatory sensitivity map (cannabis, alcohol, firearms, healthcare, fintech, food, etc.)
2. **Fetches real regulatory data** from public sources (state legislature APIs, federal register, Firecrawl for current legal status pages)
3. **Returns structured regulatory context** that downstream steps (Stress Test, Pitch Deck) can consume

### Data Sources (All Real, No Mock)

| Source | Data | Free? |
|--------|------|-------|
| Firecrawl web search | Current state-by-state legal status, recent regulatory changes, enforcement actions | Yes (already connected) |
| Federal Register API | Active rulemaking, proposed regulations by agency | Yes, no key |
| Congress.gov API | Active federal bills by keyword | Yes, no key |
| State legislature aggregators via Firecrawl | State-level bill tracking (e.g., cannabis legalization status) | Via existing Firecrawl |

### Implementation Plan

**1. Extend `geo-market-data` edge function**
- Add a `regulatoryProfile` section to the response
- Add a category-to-regulatory-domain mapping (e.g., "Cannabis" -> DEA scheduling, state legalization status; "FinTech" -> state money transmitter licenses)
- Use Firecrawl search to pull current regulatory landscape for relevant categories
- Query Federal Register API for active/proposed rules matching the category
- Structure output as: `{ regulatoryRelevance: "high|medium|low|none", domains: [...], stateVariance: [...], activeRulemaking: [...], risks: [...] }`

**2. Make it adaptive (not blanket)**
- Define a `REGULATORY_CATEGORIES` map: only categories with known regulatory complexity trigger the fetch
- Categories like "Consumer Electronics" or "Fashion" get `regulatoryRelevance: "none"` and skip the expensive Firecrawl calls
- The category detection is fuzzy-matched (e.g., "THC gummies" matches "Cannabis", "meal kit delivery" matches "Food Safety")

**3. Wire into pipeline prompts**
- Extend `critical-validation` and `generate-pitch-deck` system prompts (same pattern as geoData) to include regulatory context when present
- AI uses real legal constraints in Red Team arguments, feasibility checklists, and GTM strategy

**4. Extend the context object**
- Add `regulatoryData` to AnalysisContext alongside `geoData`
- Persist as `regulatoryContext` in `analysis_data` JSON blob
- Add to `SYSTEM_KEYS` in pipelineValidation.ts

### Technical Details

**Regulatory sensitivity map (sample):**
```text
Cannabis/THC/CBD    -> [DEA, state cannabis boards, FDA (edibles)]
Alcohol/Spirits     -> [TTB, state ABC, local dry/wet county laws]
Firearms/Weapons    -> [ATF, state carry laws, import/export]
Healthcare/Medical  -> [FDA, HIPAA, state medical boards]
FinTech/Payments    -> [SEC, CFPB, state money transmitter]
Food & Beverage     -> [FDA, USDA, state health dept]
Real Estate         -> [state licensing, zoning, fair housing]
Education/EdTech    -> [FERPA, state accreditation]
None of the above   -> skip regulatory fetch
```

**Firecrawl search queries (adaptive):**
For "THC gummies" in category "Cannabis":
- `"cannabis legal status" state-by-state 2025 2026`
- `"THC regulation" OR "cannabis licensing" recent changes`
- `federal cannabis legislation bill 2025 2026`

**Federal Register API call:**
```text
GET https://www.federalregister.gov/api/v1/documents?
  conditions[term]=cannabis
  &conditions[type][]=RULE
  &conditions[type][]=PROPOSED_RULE
  &per_page=10
  &order=newest
```

### Files to Change
- `supabase/functions/geo-market-data/index.ts` -- add regulatory detection + Firecrawl search + Federal Register API calls
- `src/utils/pipelineValidation.ts` -- add `regulatoryContext` to SYSTEM_KEYS
- `src/contexts/AnalysisContext.tsx` -- add `regulatoryData` state, extend `fetchGeoData` to return it
- `supabase/functions/critical-validation/index.ts` -- inject regulatory context into prompts
- `supabase/functions/generate-pitch-deck/index.ts` -- inject regulatory context into prompts

### What This Enables
- THC analysis automatically surfaces Missouri vs Florida legal differences, active federal bills, and licensing requirements
- A SaaS analysis skips all of this (zero extra latency)
- Stress Test Red Team cites real regulatory barriers instead of generic "regulatory risk" hand-waving
- Pitch Deck GTM slide recommends specific states based on regulatory favorability combined with demographic opportunity

