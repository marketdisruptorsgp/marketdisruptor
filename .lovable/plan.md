&nbsp;

This Phase 1 design looks strong and the scope is appropriate. The constraint taxonomy, deterministic rule layer, and pattern linkage structure all make sense.

Before implementation begins I want to add three structural refinements to make the system more stable as it grows.

First, every constraint type should have a stable internal ID in addition to the human-readable name.

For example:

C-LAB-01 labor_intensity  

C-LAB-02 owner_dependency  

C-REV-01 commoditized_pricing  

These IDs should be used internally for constraint-pattern mappings and analytics so the system remains stable even if naming changes later.

Second, patterns should include a “strength by constraint” field rather than just resolvesConstraints.

For example:

manual_to_automated

strengthByConstraint:

- manual_process: high

- labor_intensity: medium

- skill_scarcity: low

This allows the engine to prefer stronger structural transformations when multiple patterns match a constraint.

Third, the constraint detection engine should persist the constraint–evidence graph rather than computing it transiently.

Each constraint hypothesis should store the evidence chain that triggered it so we retain traceability:

Constraint → Evidence Items → Facet Basis → Explanation.

This graph will later power explainability, UI visualization, and second-order opportunity discovery.

One additional taxonomy suggestion: add a small “Demand Constraints” category to capture cases where the limiting factor is customer demand rather than supply or operations. Examples could include awareness gaps, access constraints, or motivation decay in consumer contexts.

Other than these adjustments, the Phase 1 scope looks correct and I’m comfortable proceeding with implementation.

## Phase 1: Evidence Foundation + Constraint-First Reasoning Spine

### Constraint Taxonomy

The system needs a closed set of named constraint types that bridge evidence facets to pattern firing. Organized by structural category:

**Labor & Operations**

- `labor_intensity` — Revenue scales linearly with headcount
- `owner_dependency` — Key person risk, non-delegatable functions
- `operational_bottleneck` — Process step limiting throughput
- `skill_scarcity` — Specialized roles hard to hire/retain
- `manual_process` — Human-dependent workflow that could be systematized

**Revenue & Pricing**

- `commoditized_pricing` — Weak price-setting power, race to bottom
- `revenue_concentration` — Excessive dependence on few customers/contracts
- `transactional_revenue` — No recurring relationship, unpredictable cash flow
- `forced_bundling` — Customers pay for unwanted value components
- `capital_barrier` — High upfront cost limiting adoption

**Supply & Distribution**

- `supply_fragmentation` — Many small suppliers, no aggregation
- `geographic_constraint` — Value delivery limited by physical proximity
- `channel_dependency` — Reliance on intermediaries who capture margin
- `inventory_burden` — Carrying cost, waste, or obsolescence risk
- `capacity_ceiling` — Fixed assets limiting growth

**Technology & Information**

- `legacy_lock_in` — Outdated systems creating switching costs
- `information_asymmetry` — Value lost because data isn't captured or used
- `analog_process` — Physical-only workflow missing digital layer

**Market & Adoption**

- `expertise_barrier` — Product/service requires specialized knowledge to use
- `switching_friction` — Customers locked into existing solutions
- `trust_deficit` — Market skepticism preventing adoption
- `regulatory_barrier` — Legal/compliance constraints limiting options

**Structural & Economic**

- `margin_compression` — Declining margins from structural cost pressure
- `asset_underutilization` — Owned resources not generating proportional value
- `linear_scaling` — Growth requires proportional resource increase
- `vendor_concentration` — Critical dependency on few suppliers

~25 constraint types, each maps to specific evidence facet configurations AND to specific patterns that resolve them.

---

### Implementation: 5 New/Modified Files

**1. `src/lib/evidenceFacets.ts**` (NEW)

Types and helpers for domain-specific evidence metadata:

- `ObjectFacets` interface (componentRole, materialClass, manufacturingMethod, failureMode, maintenanceBurden, ergonomicConstraint, usageContext, costDriver, replacementCycle)
- `BusinessFacets` interface (concentrationRisk, laborProfile, pricingArchitecture, marginStructure, operationalBottleneck)
- `MarketFacets` interface (marketGrowth, competitiveDensity, regulatoryEnvironment)
- `EvidenceFacets` union type
- Helper: `extractFacetsFromEvidence(evidence: Evidence): EvidenceFacets | null` — parses existing evidence text to infer facet values where possible (graceful degradation for sparse evidence)

**2. `src/lib/constraintDetectionEngine.ts**` (NEW)

Three-layer constraint detection:

*Layer 1 — Deterministic Candidate Rules:*

- `ConstraintCandidate` interface: `{ id, constraintType, tier, evidenceIds, facetBasis, confidence: "strong"|"moderate"|"limited", explanation }`
- `ConstraintRule` interface: `{ constraintType, requiredFacets, condition: (evidence, facets) => boolean, explanation }`
- ~25-30 initial rules mapping facet configurations to constraint candidates
- Example rule: `laborProfile.intensity === "high" && laborProfile.ownerDependency === true` → `owner_dependency` (Tier 1)
- Rules that fire on text-only evidence (no facets) use keyword patterns as fallback but are tagged `confidence: "limited"`
- Function: `detectCandidateConstraints(evidence: Evidence[]): ConstraintCandidate[]`

*Layer 2 — AI-Assisted Ranking:*

- Takes candidate list + supporting evidence
- Ranks by system-limiting impact (which constraint, if removed, unlocks most value)
- Returns ranked list with causal explanation per ranking decision
- Uses edge function `rank-constraint-hypotheses`
- Fallback: if AI unavailable, rank by evidence count + tier

*Layer 3 — Counterfactual Validation:*

- For each top-ranked candidate, compute evidence connectivity: how many other evidence items would be affected if this constraint were removed
- Graph-based: build evidence adjacency from `relatedEvidence` and `relatedSignals` fields
- Output: `ConstraintHypothesisSet` — ranked 2-3 constraints with evidence chains, causal explanations, and counterfactual impact scores

**3. `src/lib/strategicPatternLibrary.ts**` (MODIFY)

Restructure from 10 patterns to ~20, organized by constraint type:

- Add `resolvesConstraints: string[]` field — which constraint types this pattern addresses
- Add `contraindications: string[]` — constraint types where this pattern fails
- Add `minimumEvidenceRequired: string[]` — what evidence/facet types must exist
- Add 10 new patterns: `expert_to_guided`, `synchronous_to_async`, `centralized_to_distributed`, `inventory_to_on_demand`, `linear_to_circular`, `single_use_to_multi_use`, `analog_to_digital_twin`, `complex_to_simplified`, `individual_to_community`, `reactive_to_predictive`
- New firing logic: `firePatterns(constraintHypotheses, baseline, evidence)` — patterns fire based on constraint type match + minimum evidence check + relevance scoring, NOT just regex on dimension text
- Contraindication check: pattern is rejected if any of its contraindications match detected constraints
- Evidence gap flagging: if a constraint has no matching pattern, emit a structured `{ type: "evidence_gap", constraint, message }` rather than forcing a match
- Preserve existing `applyPatterns()` as deprecated fallback during transition

**4. `src/lib/evidenceEngine.ts**` (MODIFY)

- Add optional `facets?: EvidenceFacets` field to `Evidence` interface
- Add `"object_reinvention"` to `EvidenceMode` type
- No other changes — facet population happens in the extraction/ingestion layer, not here

**5. `src/lib/opportunityDesignEngine.ts**` (MODIFY)

- Update `runMorphologicalSearch` to accept `ConstraintHypothesisSet` and pass constraint hypotheses to pattern firing
- Wire: constraints → pattern firing (new logic) → vector generation → existing qualification gates
- Add `constraintHypothesisId` to `OpportunityVector` so every vector traces to its parent constraint hypothesis

---

### Wiring Into Existing Pipeline

The `strategicEngine.ts` pipeline (Stage 4: detectConstraints) currently produces `StrategicInsight[]` from signals. The new constraint detection engine will:

- Run **alongside** the existing Stage 4, not replace it immediately
- Produce `ConstraintHypothesisSet` that feeds into the updated pattern firing in Stage 7 (opportunity generation)
- The existing constraint detection continues to feed Stages 5-6 (drivers, leverage) unchanged
- Once the new system is validated, we can migrate Stages 5-6 to use constraint hypotheses too

### What This Does NOT Include

- Validation engine (Phase 5)
- Analogous industry discovery
- Contrarian inversion
- Visual decomposition / CIM parsing (ingestion layer)
- Edge function for constraint ranking (will stub with deterministic fallback)