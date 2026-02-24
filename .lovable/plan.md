

# Consistent Section Navigation Across All Steps

## Problem
The platform currently uses two different section navigation components:
- **`SectionWorkflowNav`** (grid cards with progress bar) — used in Intelligence Report (Step 2), Disrupt (Step 3), and Stress Test (Step 5)
- **`SectionPills`** (simple inline pills) — used only in Pitch Deck (Step 6)

This creates an inconsistent experience when navigating between steps.

## Solution
Replace `SectionPills` with `SectionWorkflowNav` in the Pitch Deck component, and add section descriptions for each slide tab. This makes every step in every mode use the same polished grid-card navigator with the progress header.

## Changes

### 1. Add Pitch Deck section descriptions
Create a `PITCH_SLIDE_DESCRIPTIONS` map so each of the 12 pitch slides shows a helpful subtitle in the grid card (matching how Report, Disrupt, and Stress Test steps display descriptions).

### 2. Update PitchDeck component
- Replace `SectionPills` with `SectionWorkflowNav`
- Pass the new descriptions and a journey label like "Pitch Deck Sections"
- The 12 slides will render in a responsive grid (2-col mobile, 4-col tablet, 6-col desktop) — the existing `SectionWorkflowNav` already handles this

### 3. Remove `SectionPills` from codebase
Since PitchDeck is the only consumer of `SectionPills`, remove the component from `SectionNav.tsx` to prevent future inconsistent usage.

### Files Modified
- `src/components/PitchDeck.tsx` — swap `SectionPills` for `SectionWorkflowNav`, add descriptions
- `src/components/SectionNav.tsx` — remove the unused `SectionPills` component

