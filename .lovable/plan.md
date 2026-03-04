

## Analysis: Where Should Flipped Ideas Live?

### Current Flow

```text
Step 3 — DISRUPT (Deconstruction)
  ├── Hidden Assumptions (identify & challenge)
  ├── Flip the Logic (invert assumptions into alternatives)  ← generative
  └── Flipped Ideas (concrete alternative concepts)          ← generative
  └── [Reasoning / Hypotheses tabs below]

Step 4 — REDESIGN (Construction)
  ├── Redesigned Concept visual
  └── First Principles rendered in "redesign" mode
```

### The Logical Problem

Disrupt's purpose is **deconstruction** — tearing apart assumptions, exposing structural weaknesses, understanding *why things are the way they are*. But "Flip the Logic" and "Flipped Ideas" are **constructive** acts: they generate alternatives and new concepts. They don't belong in the deconstruction phase.

The natural cognitive flow is:

1. **Disrupt**: "Here are 12 assumptions holding this product together. Here's why each exists. Here's the leverage score for challenging each one."
2. **Redesign**: "Now, what if we inverted those assumptions? Here are the flips. Here's what a rebuilt concept looks like."

Moving Flip the Logic and Flipped Ideas to Redesign creates a clean separation:
- **Disrupt** = pure analysis (assumptions, reasoning, hypotheses)
- **Redesign** = pure synthesis (inversions, flipped ideas, concept generation)

This also makes the Redesign step more substantial — right now it's thin (just a concept visual and a re-render of FirstPrinciplesAnalysis in redesign mode), while Disrupt is overloaded.

### Recommendation

**Yes, move them.** The Disrupt step should end with the enriched Assumptions section and the Reasoning/Hypotheses tabs. The Redesign step should open with "Flip the Logic" (showing how assumptions were inverted), then "Flipped Ideas" (concrete alternatives), then the Redesigned Concept visual.

### Plan

1. **Disrupt step (`FirstPrinciplesAnalysis` default mode)**: Remove the "Flip the Logic" and "Flipped Ideas" sections from the section sequence. The step now shows: Hidden Assumptions → (end of interactive sections). Reasoning/Hypotheses tabs remain below as they are today.

2. **Redesign step (`FirstPrinciplesAnalysis` redesign mode)**: Add "Flip the Logic" and "Flipped Ideas" as the first two sections *before* the existing redesign concept visual. The section sequence becomes: Flip the Logic → Flipped Ideas → Redesigned Concept.

3. **Data flow**: Both sections already read from the same `data` object (`flippedLogic`, `flippedIdeas`). Since the Redesign step receives `externalData` from `analysis.redesignData ?? analysis.disruptData`, the flip data generated during Disrupt is already available downstream — no data plumbing changes needed.

4. **Section numbering**: Update `getSections()` in `FirstPrinciplesAnalysis.tsx` to conditionally include/exclude flip sections based on `renderMode`. Default mode gets assumptions only; redesign mode gets flips + ideas + concept.

### Files to Edit

- `src/components/FirstPrinciplesAnalysis.tsx` — restructure `getSections()` to move flip/ideas sections from default to redesign render mode

