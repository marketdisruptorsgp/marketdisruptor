## Yes and also what other URLs host info? Like /admin /analytics, etc.  tell me list of those. 

&nbsp;

## Plan: Update Architecture, Pipeline & Release Pages with Latest Information

### What's outdated

**1. Releases page (`src/pages/ResourcesPage.tsx`)** — Last entry is March 9, 2026. Missing:

- **Confidence Gating System** — provenance badges (SCRAPED / PARAMETRIC / AI_INFERRED), confidence gates that convert low-data areas into research questions instead of fabricated insights
- **Research Checklist** — "What We Don't Know" section with prioritized investigative questions
- **Provenance UI** — visual badges distinguishing data reliability across the platform

**2. Pipeline Architecture page (`src/pages/PipelineArchitecturePage.tsx`)** — Missing:

- Confidence Gating as a cross-cutting layer (it sits between evidence extraction and synthesis)
- `concept-architecture` and `transformation-engine` edge functions not listed as pipeline steps (they exist in `supabase/functions/` and `config.toml` but the architecture page still describes the old `first-principles-analysis` monolith)
- Several newer edge functions in config.toml not reflected: `compute-analytics-insights`, `generate-opportunity-vectors`, `analyze-business-structure`, `research-competitive-positioning`, `industry-benchmarks`

**3. Pipeline Diagram (`src/components/PipelineDiagram.tsx`)** — Static legacy diagram that references the old 5-step model (Report → Intel → Deconstruct → Redesign → Stress Test). Doesn't reflect the current 4-phase Discovery Journey or the 7-stage intelligence architecture.

### Implementation

**A. Add March 10-12 releases to `RELEASES` array in `ResourcesPage.tsx`:**

- Confidence Gating System (engine tag) — provenance tagging, confidence gates, research question generation
- Research Checklist UI (ui tag) — "What We Don't Know" panel with copyable questions
- Provenance Badges (ui tag) — visual data reliability indicators across all outputs

**B. Update `PipelineArchitecturePage.tsx` STAGES array:**

- Add Stage 1.5: "Confidence Gating" between Evidence and Structural Diagnosis — describes the `confidenceGating.ts` system that assesses 7 data areas and gates low-confidence inversions
- Update Stage 5 (Pipeline Steps) to list `transformation-engine` and