

# Expand Inputs for Business & Nostalgia Modes

## Overview
The Business Model and Nostalgia/Discover modes currently show minimal inputs despite the data structures already supporting more fields. This update surfaces all available fields and adds context inputs to give the AI models maximum information.

## Changes

### 1. Business Model Mode -- Surface All 7 Fields
The `BusinessInput` interface already defines `revenueModel`, `size`, `geography`, `painPoints`, and `notes` but they are never rendered. Add all of them:

- **Business Type** (existing) -- text input
- **Description** (existing) -- textarea
- **Revenue Model** (new) -- text input, placeholder "e.g. Subscription, Per-unit, Commission, Freemium..."
- **Business Size** (new) -- text input, placeholder "e.g. Solo operator, 10 employees, $2M ARR..."
- **Geography** (new) -- text input, placeholder "e.g. Local (Austin, TX), National, Global..."
- **Pain Points** (new) -- textarea, placeholder "What are the biggest operational or customer pain points?"
- **Additional Notes** (new) -- textarea, placeholder "Competitive landscape, unique constraints, strategic goals..."

All fields are already wired into `businessInput` state and sent to the edge function. No backend changes needed.

### 2. Discover/Nostalgia Mode -- Add Context Fields
Currently only has Category and Era dropdowns. Add:

- **Target Audience** (new state field) -- text input, placeholder "e.g. Millennial collectors, Gen-Z hobbyists, Parents with kids 6-12..."
- **Budget Range** (new state field) -- text input, placeholder "e.g. Under $50, $50-200, Premium $500+..."  
- **Context & Notes** (new state field) -- textarea, placeholder "Any specific products, brands, or trends you want explored..."
- **Batch Size** slider or select -- expose the existing `batchSize` state (currently hardcoded to 10), let users pick 5/10/15

These new fields will be passed through `onAnalyze` params. The `category` and `era` params already exist; the new fields will be appended to a notes/context string so the edge function receives them without schema changes.

## Technical Details

### State additions in AnalysisForm
- `discoverAudience: string` (new)
- `discoverBudget: string` (new)  
- `discoverNotes: string` (new)

### handleSubmit update for discover mode
Concatenate new context fields into a notes string passed alongside existing params:
```text
onAnalyze({ 
  category, era, batchSize,
  customProducts: [{ 
    notes: `Target: ${discoverAudience}. Budget: ${discoverBudget}. ${discoverNotes}` 
  }] 
})
```

### Business mode -- no logic changes
All fields already exist in `businessInput` state and are sent to `business-model-analysis` edge function as `body.businessModel`. Just need to render the inputs.

### Files to modify
- `src/components/AnalysisForm.tsx` -- add missing input fields for both modes

### No breaking changes
- No database changes
- No edge function changes (data already flows through)
- Backward compatible with existing analyses
