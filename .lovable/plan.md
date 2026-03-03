

## Analysis: Where Do Hypotheses Belong?

### Current State
- **Report (Step 2):** Intel data + visual layer with 3 tabs: Intel, Reasoning, **Hypotheses** (mind map + "Pose Another Hypothesis")
- **Disrupt (Step 3):** Assumptions, flip logic, flipped ideas — uses `FirstPrinciplesAnalysis` component

### The Problem
Hypotheses are structural interpretations derived from first-principles decomposition. They represent "which constraint is the binding one?" — this is fundamentally a **deconstruction/disruption** concern, not an intelligence-gathering concern. The Report step is about collecting market intel, pricing, supply chain, patents. Hypotheses sitting there feels misplaced.

### Recommendation: Move Hypotheses to Disrupt (Step 3)

**Why this aligns better:**
- The Disrupt step already does first-principles analysis — assumptions, constraint identification, flip logic
- Hypotheses are the structural output of that decomposition ("here are the competing root constraints")
- The Report step should remain pure intelligence: data, signals, market context
- The Disrupt step is where the user makes interpretive choices about what matters most — that's exactly what hypothesis selection is

### Plan

1. **Move the Hypotheses tab from `AnalysisVisualLayer` (Report) to `DisruptPage`**
   - Remove `branchingPanel` and `defaultTab="hypotheses"` props from `AnalysisVisualLayer`
   - Remove the "Hypotheses" tab from the tab switcher in `AnalysisVisualLayer` (keep Intel + Reasoning only)
   - Add the `StructuralInterpretationsPanel` (mind map + Pose Another Hypothesis) directly into `DisruptPage.tsx` as a prominent section above or alongside the existing assumptions/flip content
   - Create a local tab system in DisruptPage: "Hypotheses" | "Assumptions" | "Flip" | "Ideas" (or integrate into existing section nav)

2. **Update navigation references**
   - `ActiveHypothesisBanner.tsx`: Change "Choose another hypothesis" to navigate to the Disrupt step (`${baseUrl}/disrupt`) instead of Report with `openHypothesesTab`
   - Remove `openHypothesesTab` location state handling from `ReportPage.tsx`

3. **Move hypothesis-related logic from ReportPage to DisruptPage**
   - The `onApplyRevision` handler for `new_hypothesis`
   - The `onSelectBranch` handler with strategic profile adaptation
   - The ranking/governed data extraction for hypotheses

4. **Clean up AnalysisVisualLayer**
   - Remove `branchingPanel` and `defaultTab` props
   - Simplify tab switcher to just Intel + Reasoning (when synopsis exists)

5. **No backend changes needed** — same edge functions, same data flow

### Files to Change
- `src/pages/DisruptPage.tsx` — add hypothesis panel + handlers
- `src/pages/ReportPage.tsx` — remove hypothesis logic
- `src/components/AnalysisVisualLayer.tsx` — remove hypotheses tab + props
- `src/components/ActiveHypothesisBanner.tsx` — update navigation target to disrupt step

