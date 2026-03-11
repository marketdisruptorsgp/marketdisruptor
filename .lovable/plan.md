

# Invention Engine — System Architecture Revision (Product Mode)

## Summary

Replace the current dual-pipeline architecture (Reconfiguration Engine + Transformation Engine) with a unified **Invention Engine** that generates causally-traced, engineering-grounded invention concepts through structured combination of three knowledge layers: Structural Pressure, Assumption Breaks, and Technical Mechanisms.

---

## Current State

The pipeline currently runs:

```text
Phase 1: structural-decomposition (edge function)
Phase 2: strategic-synthesis (edge function) → produces:
         - hiddenAssumptions, flippedLogic
         - structuralTransformations, transformationClusters
         - redesignedConcept (single concept)
         - governed data
Phase 3: critical-validation + pitch-deck (background)
```

The `strategic-synthesis` edge function merges the old `transformation-engine` + `concept-architecture` into one AI call. The reconfiguration engine (`qualifyPatterns`, `selectRelevantDirections`, `deepenOpportunitiesAsync`) runs client-side in `strategicEngine.ts` to produce Command Deck opportunities.

**Problem**: Two independent idea-generation systems. No causal tracing from assumption → mechanism → concept.

---

## Architecture Changes

### 1. New Edge Function: `concept-synthesis`

Replaces the concept generation portion of `strategic-synthesis` for Product Mode.

**Inputs:**
- `structuralDecomposition` (from Phase 1)
- `assumptions[]` (from modified strategic-synthesis)
- `mechanismLibrary[]` (embedded in the edge function)
- `product` intel

**Output:**
```text
{
  concepts: [
    {
      name, tagline,
      origin: {
        structural_driver,      // which weakness
        assumption_flipped,     // which assumption
        enabling_mechanism      // which technical mechanism
      },
      description,
      mechanism_description,
      materials: [],
      estimated_bom: [],
      manufacturing_path,
      certification_considerations: [],
      precedent_products: [],
      prototype_approach,
      dfm_notes
    }
  ]  // 4-6 concepts
}
```

The mechanism library is a curated dataset of ~30-50 technical enablers (magnetic seals, ultrasonic sensing, shape memory alloys, hydrophobic coatings, piezoelectric actuation, modular snap-fit, etc.) embedded directly in the edge function prompt. Each entry has: mechanism name, physical principle, applicable domains, example products, manufacturing notes.

### 2. Modify `strategic-synthesis` for Product Mode

When `mode === "product"`:
- Still produce `hiddenAssumptions` (6-10, ranked by leverage) and `flippedLogic`
- Still produce structural analysis (coreReality, frictionDimensions, etc.)
- **Remove** `redesignedConcept` generation (moved to `concept-synthesis`)
- **Remove** `structuralTransformations` and `transformationClusters` (replaced by concept synthesis)
- Add structured assumption output: each assumption gets `constraint_type`, `leverage_score`, `flip_statement`

Service and Business modes remain unchanged.

### 3. Modify Pipeline Orchestrator (`usePipelineOrchestrator.ts`)

For Product Mode, the pipeline becomes 4 phases:

```text
Phase 1: structural-decomposition          (unchanged)
Phase 2: strategic-synthesis (modified)    (assumptions + analysis only)
Phase 3: concept-synthesis (NEW)           (4-6 traced concepts)
Phase 4: critical-validation + pitch       (background, unchanged)
```

`STEP_DEFS` gains a `"concepts"` step between synthesis and stressTest. The orchestrator passes assumptions + decomposition + product intel to the new edge function.

### 4. New UI: Concept Explorer

Replace the current Disrupt → Flipped Ideas → Redesign flow with:

**Step 1 — Hidden Assumptions** (existing, refined)
- Show 6-10 ranked assumptions with leverage scores
- Each shows: assumption, why it exists, constraint type, flip statement

**Step 2 — Innovation Paths** (NEW)
- Derived from structural pressures in decomposition data
- Themed groupings: "Failure Elimination", "Installation Simplification", "Material Reinvention", etc.
- Auto-generated from structural weakness clusters

**Step 3 — Concept Explorer** (NEW — replaces Flipped Ideas + single Redesign)
- 4-6 concept cards, each showing:
  - Origin trace (structural driver → assumption flipped → mechanism)
  - Engineering summary
  - Rough BOM
  - Precedent technologies
- User can select concept count (3-6) before generation

**Step 4 — Engineering Deep Dive** (replaces single Redesign concept view)
- User selects one concept to expand
- Calls existing `concept-architecture` (modified) for deep engineering detail
- Detailed BOM, prototype notes, supplier categories, regulatory, test plan

### 5. Remove for Product Mode

- **Command Deck strategic opportunities** (OpportunityDirectionsGrid) — hidden in Product Mode
- **Flipped Ideas tab** (FlippedIdeasPanel) — absorbed into Concept Explorer origin traces
- **Single Redesign concept** (RedesignedConceptPanel as primary output) — replaced by multi-concept explorer
- Client-side `qualifyPatterns()` and `selectRelevantDirections()` calls — skipped in Product Mode in `strategicEngine.ts`

### 6. Files Changed

| Area | Files | Change |
|------|-------|--------|
| Edge Functions | `supabase/functions/concept-synthesis/index.ts` | **NEW** — concept synthesis with mechanism library |
| Edge Functions | `supabase/functions/strategic-synthesis/index.ts` | Modify Product Mode output schema |
| Orchestrator | `src/hooks/usePipelineOrchestrator.ts` | Add concepts phase for Product Mode |
| Strategic Engine | `src/lib/strategicEngine.ts` | Skip pattern qualification in Product Mode |
| UI Components | `src/components/first-principles/ConceptExplorer.tsx` | **NEW** — multi-concept card grid |
| UI Components | `src/components/first-principles/InnovationPaths.tsx` | **NEW** — themed pressure groupings |
| UI Components | `src/components/first-principles/EngineeringDeepDive.tsx` | **NEW** — expanded single concept |
| UI Components | `src/components/FirstPrinciplesAnalysis.tsx` | New step flow for Product Mode |
| Command Deck | `src/pages/CommandDeckPage.tsx` | Hide opportunity grid in Product Mode |
| Types | `src/components/first-principles/types.ts` | Add concept synthesis types |
| Analysis Context | `src/contexts/AnalysisContext.tsx` | Add conceptsData state |

### 7. Mechanism Library (embedded in edge function)

~40 entries covering:
- **Fluid/Seal**: magnetic fluid seals, hydrophobic coatings, pressure-sensing membranes
- **Sensing**: ultrasonic flow, piezoelectric, capacitive touch, MEMS accelerometers
- **Materials**: shape memory alloys, self-healing polymers, antimicrobial surfaces
- **Assembly**: modular snap-fit, bayonet mount, tool-free replacement
- **Actuation**: solenoid, servo, pneumatic, bi-metallic thermal
- **Surface**: self-cleaning, anti-fouling, wear-resistant ceramics
- **Communication**: BLE, NFC, LoRa, passive RFID

Each entry includes physical principle, applicable domains, manufacturing notes, and example products. The AI uses this as a "palette" when combining with structural weaknesses and assumption flips.

---

## Implementation Order

1. Create `concept-synthesis` edge function with mechanism library
2. Modify `strategic-synthesis` for Product Mode (remove concept generation, enrich assumptions)
3. Add new types and context state for concepts data
4. Modify pipeline orchestrator to add concepts phase
5. Build Concept Explorer, Innovation Paths, and Engineering Deep Dive UI components
6. Modify FirstPrinciplesAnalysis step flow for Product Mode
7. Skip pattern qualification and hide Command Deck opportunities in Product Mode
8. Wire Engineering Deep Dive to call `concept-architecture` for selected concept expansion

