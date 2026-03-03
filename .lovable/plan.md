

## Plan: Backfill Strategic OS + Interactive Reasoning Interrogation

### Part 1 — Backfill Strategic OS to All Existing Analyses

**What:** Create a new edge function `backfill-strategic-os` (modeled after `backfill-reasoning-synopsis`) that iterates over all `saved_analyses`, generates `root_hypotheses` for each, and writes them into `analysis_data.governed.root_hypotheses` and `analysis_data.governed.constraint_map.root_hypotheses`.

**How:**
- New edge function: `supabase/functions/backfill-strategic-os/index.ts`
  - Uses service role to read all analyses in batches
  - For each analysis missing `root_hypotheses`, sends the analysis data to AI (Gemini 2.5 Flash) with a prompt that extracts 2-4 Tier 1 constraint hypotheses from the existing governed data
  - Writes the structured `root_hypotheses` array back into `analysis_data.governed`
  - Supports `batchSize`, `offset`, `dryRun` parameters (same pattern as reasoning backfill)
  - Skips analyses that already have `root_hypotheses`

**Prompt design:** The AI receives the existing `constraint_map`, `reasoning_synopsis`, products, and scores, then returns structured JSON with `id`, `constraint_type`, `hypothesis_statement`, `causal_chain`, `friction_sources`, `leverage_score`, `impact_score`, `evidence_mix`, `fragility_score`, `confidence`, `downstream_implications`.

---

### Part 2 — Interactive Reasoning Interrogation

**What:** Add a conversational panel inside the Reasoning tab where users can question, challenge, or redirect the reasoning. This is NOT a generic chatbot — it's a reasoning-specific interrogation tool pre-loaded with the full analysis context.

**How it works:**

1. **New edge function: `supabase/functions/reasoning-interrogation/index.ts`**
   - Receives: `analysisId`, `question`, `history`, the full `analysis_data` blob (governed data, products, scores, root_hypotheses, strategic profile)
   - System prompt enforces the "reasoning auditor" persona — answers must reference specific causal chains, evidence mixes, constraint rankings, and scores from THIS analysis
   - Supports streaming responses
   - Has tool calling for `render_chart` (same pattern as workspace-query)
   - Can produce structured outputs like revised hypotheses or re-scored assumptions

2. **UI: `ReasoningInterrogation` component embedded in `ReasoningSynopsis.tsx`**
   - Appears at the bottom of the Reasoning tab as a collapsible "Challenge This Reasoning" panel
   - Quick-action buttons for common interrogation patterns:
     - "Why did [constraint] rank highest?"
     - "What if [top assumption] is wrong?"
     - "Re-evaluate with [different lens]"
     - "What's missing from this analysis?"
   - Free-text input for custom questions
   - Streaming response display with markdown rendering
   - Conversation history maintained in component state (not persisted unless user saves)
   - When the AI suggests a re-ranking or revised hypothesis, show an "Apply This" button that updates the governed data

3. **Data flow:**
   - Component reads from `analysis.governedData` and `analysis.strategicProfile`
   - Passes full context to edge function on each question
   - Responses can include `:::insight` cards and chart tool calls
   - If the AI produces a structural revision (new hypothesis ranking, updated assumption status), surface an action button to apply it

**Technical details:**

```text
┌─────────────────────────────────────┐
│  Reasoning Tab                       │
│  ┌─────────────────────────────────┐ │
│  │ Existing Synopsis Visuals       │ │
│  │ (Radar, Causal Flow, etc.)     │ │
│  └─────────────────────────────────┘ │
│  ┌─────────────────────────────────┐ │
│  │ Challenge This Reasoning        │ │
│  │ ┌─────────────────────────┐     │ │
│  │ │ Quick Actions (chips)   │     │ │
│  │ └─────────────────────────┘     │ │
│  │ ┌─────────────────────────┐     │ │
│  │ │ Chat history + stream   │     │ │
│  │ └─────────────────────────┘     │ │
│  │ ┌─────────────────────────┐     │ │
│  │ │ Text input + Send       │     │ │
│  │ └─────────────────────────┘     │ │
│  └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Files to create:
- `supabase/functions/backfill-strategic-os/index.ts`
- `supabase/functions/reasoning-interrogation/index.ts`
- `src/components/ReasoningInterrogation.tsx`

### Files to modify:
- `src/components/ReasoningSynopsis.tsx` — integrate the interrogation panel
- `supabase/config.toml` — register new functions with `verify_jwt = false`

### Estimated scope: 4 implementation tasks

