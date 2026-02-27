

## The Problem

Your concern is valid. The prompts in both `analyze-products` and `first-principles-analysis` contain a **heavily physical-biased questioning framework** (lines 156-166 in first-principles):

```text
- Why is it this SIZE? Would 50% smaller work?
- Why this WEIGHT? What if it were featherlight?
- Why this SHAPE? Round vs. flat vs. ergonomic?
- Why STATIC? Could it be modular, collapsible?
- Why these MATERIALS?
```

This primes the AI to anchor on size/weight/transport friction for **every** product — even when the real friction might be pricing, learning curve, maintenance, durability, safety, social/cultural barriers, or ecosystem lock-in.

The JSON schema examples reinforce this: `sizeAnalysis`, `weightAnalysis`, `formFactorAnalysis` get dedicated fields, but pricing friction, skill barriers, safety concerns, or ecosystem dependencies get nothing.

## Plan: Broaden Friction Discovery

### 1. `supabase/functions/first-principles-analysis/index.ts` — Rewrite questioning framework (lines 156-166)

Replace the size/weight/shape-dominated list with a **balanced friction taxonomy**:

```text
Your mission: completely deconstruct a product and uncover radical redesign opportunities. 
Investigate friction across ALL dimensions — do NOT anchor on physical form alone:

PHYSICAL: Size, weight, shape, materials, ergonomics — but ONLY if these are genuine friction sources
SKILL/LEARNING: How hard is it to learn, master, or use correctly? What expertise barrier exists?
COST/ACCESS: Is the price justified? What about ongoing costs, accessories, maintenance?
SAFETY/RISK: Physical danger, financial risk, social risk of using it wrong?
ECOSYSTEM: Does it lock users into specific accessories, platforms, locations, or conditions?
MAINTENANCE: Cleaning, repair, storage, degradation over time?
SOCIAL/CULTURAL: Stigma, status signaling, community gatekeeping, intimidation factor?
WORKFLOW: What do they do before, during, after? Where does the process break down?

Identify which dimensions carry the MOST friction for THIS specific product.
Do not assume physical form is the primary issue — let the evidence lead.
```

### 2. `supabase/functions/first-principles-analysis/index.ts` — Update JSON schema (lines 183-189)

Rename `physicalDimensions` to `frictionDimensions` and broaden the fields:

```json
"frictionDimensions": {
  "primaryFriction": "The single biggest friction source for THIS product — identify the dimension (physical, skill, cost, safety, ecosystem, maintenance, social, workflow) and explain why it dominates",
  "physicalForm": "Size/weight/shape analysis — ONLY if relevant. If physical form is NOT the main friction, say so explicitly",
  "skillBarrier": "Learning curve, expertise required, mastery gap — how hard is it to use well?",
  "costStructure": "Upfront cost, ongoing costs, hidden costs, price-to-value friction",
  "ecosystemLockIn": "Dependencies on locations, conditions, accessories, platforms, or other products",
  "maintenanceBurden": "Storage, care, repair, degradation — what ongoing effort does ownership demand?",
  "gaps": ["Gap 1: specific friction with dimension labeled", "Gap 2", "Gap 3"],
  "opportunities": ["Opportunity from addressing the PRIMARY friction", "Opportunity 2", "Opportunity 3"]
}
```

### 3. `supabase/functions/analyze-products/index.ts` — Same schema update (lines 330-340 area)

Mirror the broadened `frictionDimensions` schema in the product JSON template so initial analysis also captures multi-dimensional friction.

### 4. `supabase/functions/first-principles-analysis/index.ts` — Add anti-anchoring rule to USER JOURNEY RULE (line 43-48)

Add:
```text
- ANTI-ANCHORING: Do NOT let one friction type dominate all steps. A surfboard's friction might be skill-based (learning to paddle/pop-up), not size-based (transport). A camera's friction might be software/workflow, not weight. Let scraped evidence and product reality determine which friction types appear — do not default to physical.
```

### 5. `supabase/functions/analyze-products/index.ts` — Same anti-anchoring rule (line 115-120)

Mirror the anti-anchoring instruction.

### 6. UI backward compatibility

The `physicalDimensions` field is rendered in `ReportPage.tsx` and `ShareableAnalysisPage.tsx`. Add fallback: read `frictionDimensions` first, fall back to `physicalDimensions` for old data.

### Files to change
- `supabase/functions/first-principles-analysis/index.ts` — rewrite questioning framework + schema + anti-anchoring rule
- `supabase/functions/analyze-products/index.ts` — mirror schema + anti-anchoring rule  
- `src/pages/ReportPage.tsx` — render `frictionDimensions` with `physicalDimensions` fallback
- `src/pages/ShareableAnalysisPage.tsx` — same fallback
- Redeploy: `first-principles-analysis`, `analyze-products`

