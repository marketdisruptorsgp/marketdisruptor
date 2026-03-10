# Product Reset Plan: From Pipeline Tool → Strategic Insight Product

## The Problem
The Command Deck is currently an 812-line engineering dashboard exposing pipeline internals. A user running an analysis sees: confidence meters, reasoning stage overlays, evidence thresholds, node counts, pipeline progress bars, convergence zones, friction dashboards, provenance registries, and developer diagnostics. The *actual strategic value* — the constraint diagnosis, opportunities, and recommended moves — is buried under layers of system chrome.

## The North Star
**User inputs a business → gets strategic insight they didn't see before.**

The experience should feel like receiving a strategy consultant's one-page brief, not watching an AI pipeline execute.

## Current UI Audit (CommandDeckPage.tsx — 812 lines)

### What stays (core value):
1. **SoWhatHeader** — "Do nothing → X. Act now → Y." (Good, decision-forcing)
2. **OneThesisCard** — Constraint → Belief → Move → Economics → First Move (Strong, this IS the product)
3. **WhatsNextPanel** — Kill question + first move (Actionable)

### What gets demoted or removed:

| Component | Current Role | Action |
|---|---|---|
| `ReasoningStagesOverlay` | Shows "Detecting patterns…" animation | **REMOVE** — internal diagnostic |
| `RecomputeOverlay` | Loading spinner for recompute | **SIMPLIFY** — just a subtle loading state |
| `PipelineProgress` bar | Shows 5-step pipeline completion | **REMOVE** from main view |
| `ModeBadge` | Shows "Product/Service/Business" | **KEEP** but simplify |
| `StrategicXRay` | Interactive reasoning chain w/ challenge mode | **MOVE** to "Deep Dive" tab |
| `IndustrySystemMapView` | Industry map visualization | **MOVE** to "Deep Dive" tab |
| `PowerToolsPanel` (6 tools) | Problem Statement, Current State, Scenario Sim, Scenario Lab, Outcome Sim, Lens Intelligence | **MOVE** to "Deep Dive" tab |
| `ScenarioBanner` + `DeltaChanges` | Scenario mode UI | **MOVE** to "Deep Dive" tab |
| `StrategicCommandDeck` component | Friction dashboard, convergence zones, opportunity landscape, constraint/leverage/opportunity 3-col grid | **REPLACE** with clean opportunity cards |
| `ConfidenceMeter` / confidence tags | Numeric confidence display | **REMOVE** |
| Pipeline step count ("3/5 steps") | Developer progress | **REMOVE** |
| Signal counts, evidence counts | Developer metrics | **REMOVE** |

## New Command Deck Layout (3 sections)

### Section 1: Diagnosis
**What we found** — One bold sentence explaining the structural constraint.
- Source: `narrative.primaryConstraint` + `narrative.strategicVerdict`
- Plain English, no jargon
- No confidence scores, no "preliminary signal" labels

### Section 2: Opportunities (3–5 cards)
**What you could do** — Multiple strategic directions derived from the constraint.
- Each card: Title + 1-sentence explanation + "why this works"
- Source: `autoAnalysis.deepenedOpportunities` (need to ensure we generate 3-5, not just 1-2)
- Plain, action-oriented language
- No impact scores, no node types

### Section 3: Recommended Move
**What we'd do first** — The highest-leverage play with clear next step.
- Source: Top `deepenedOpportunity` with `firstMove`
- "Here's the move. Here's why. Here's how to start."
- Timeline estimate in human terms

### Section 4 (optional): "Show me why" link
- Links to Deep Dive tab containing: Reasoning Map, X-Ray, Industry Map, Scenario tools
- This is the explanation layer, NOT the product

## Opportunity Generation Fix
Current problem: System often produces only 1 opportunity.
Required: Generate 3–5 meaningful opportunity directions per constraint.

### Approach:
- Enhance `src/lib/reconfiguration.ts` to generate multiple opportunity vectors from a single constraint
- Use different strategic lenses: automation, platform, marketplace, data, consolidation
- Each opportunity = a different strategic path, not a variation of the same idea

## Language Cleanup
All user-facing text must be rewritten:
- "Convergence zones" → removed
- "Evidence threshold" → removed  
- "Node count" → removed
- "Pipeline step" → removed
- "Reasoning chain" → "Our analysis shows…"
- "Leverage point" → "Key advantage"
- "Friction index" → removed

## Navigation Changes
Current 4-page structure:
1. Command Deck (main)
2. Intelligence Report
3. Reasoning Map
4. Pitch

New structure:
1. **Strategic Brief** (the 3-section layout above) — this IS the product
2. **Deep Dive** (reasoning map, X-Ray, industry map, scenario tools)
3. **Intelligence Report** (raw evidence)
4. **Pitch** (investor-ready output)

## Implementation Order
1. **Phase 1**: Strip Command Deck to 3 sections (diagnosis, opportunities, recommended move)
2. **Phase 2**: Create "Deep Dive" tab and move demoted components there
3. **Phase 3**: Fix opportunity generation to produce 3–5 per analysis
4. **Phase 4**: Language cleanup across all user-facing components
5. **Phase 5**: Test with real analyses to ensure consistent, useful output

## Success Criteria
- User runs analysis → reads diagnosis in 3 seconds
- Sees 3–5 actionable opportunity directions
- Understands the recommended move and how to start
- Can optionally explore "why" via Deep Dive
- Zero developer terminology visible in default view
- No numeric scores, thresholds, or pipeline indicators
