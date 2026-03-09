

## Dead Code Audit: These Files Are NOT Safe to Delete

After searching the codebase, I found that the ~40 "dead" engine files are **still actively imported by 80+ components, pages, hooks, and other library files**. Deleting them would immediately break the build.

### What's Actually Happening

The **execution pipeline** no longer calls most of these engines at runtime for new analyses. But the **UI layer** still imports types, functions, and constants from them extensively:

| "Dead" Engine File | Still Imported By |
|---|---|
| `frictionEngine.ts` | `OpportunityMatrix`, `ETAExecutionPanel`, `StrategicCommandDeck`, `StrategicSummaryPanel`, `systemIntelligence`, `insightGovernance` |
| `insightGraph.ts` | 19 files (pages, components, hooks) |
| `systemIntelligence.ts` | 14 files (pages, components, hooks, `strategicEngine`) |
| `multiLensEngine.ts` | `StrategicDashboard`, `StrategicCommandDeck`, `StrategicSummaryPanel`, `lensOrchestrator`, `systemIntelligence` |
| `convergenceEngine.ts` | `StrategicSummaryPanel`, `lensOrchestrator` |
| `scenarioComparisonEngine.ts` | `ScenarioCommandCenter`, `recomputeIntelligence` |
| `sensitivityEngine.ts` | `strategicEngine`, `recomputeIntelligence` |
| `strategicPatternEngine.ts` | `StrategicPatternCard` component |
| `opportunityDesignEngine.ts` | `diagnosticHarness`, `negativeSpaceEngine` |
| `conceptExpansion.ts` | `ConceptSpacePanel`, `InsightGraphView`, hooks |
| `playbookEngine.ts` | `RecommendedMoveCard` |
| `innovationEngine.ts` | `PipelineObservabilityPage` |
| `benchmarkEngine.ts` | `StrategicNarrativeStory` |
| `financialModelingEngine.ts` | `UnitEconomicsModel` tool |
| `scenarioEngine.ts` | `UnitEconomicsModel` tool |
| `toolReasoningEngine.ts` | `InsightNodeCard` |

### Three Options

**Option A: Leave them alone (for now)**
The files aren't hurting anything — they add bundle size but don't affect the active pipeline. The UI pages that use them (InsightGraph, StressTest, Report, PipelineObservability) still render and work. Some of these views (insight graph, scenario simulator, strategic dashboard) may still provide value to users even if they're powered by the older engine.

**Option B: Phased removal**
Identify which UI pages/components are actually dead (never navigated to), then delete those pages AND their engine dependencies together. This is safe because you remove consumers and producers simultaneously. Requires a page-by-page audit of routing and navigation.

**Option C: Full replacement**
Replace the old UI components with new ones powered by the reconfiguration pipeline. The old `StrategicCommandDeck`, `OpportunityMatrix`, `InsightGraphView` etc. would be rebuilt to consume the new `DeepenedOpportunity` and `StructuralProfile` types. This is the "right" long-term answer but is a multi-day effort.

### Recommendation

**Option B is the pragmatic path.** Before deleting any engine file, we need to audit which routes/pages are actually reachable by users and which are vestigial. Files that are only imported by other dead files can be deleted in dependency-order batches without breaking anything live.

The files that are truly safe to delete today are ones with **zero imports from non-dead files** — likely `constraintInteractionEngine.ts`, `constraintSeverityEngine.ts`, `constraintInverter.ts`, and `analogEngine.ts` (which are only imported by each other or by other dead engines). But even that needs a precise dependency trace first.

Want me to do the precise dependency trace and identify the safe-to-delete batch?

