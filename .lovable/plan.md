

# Replace "Blue Team" with "Green Team" Across the Site

## Summary
Several pages still reference "Blue Team" instead of the correct "Green Team" terminology. The `CriticalValidation` component already renders the label as "Green Team" in the UI, but surrounding pages, descriptions, and the edge function prompt still say "Blue Team."

## What Changes

### User-Facing Text Updates (6 files)

| File | What to change |
|---|---|
| `src/pages/BusinessResultsPage.tsx` | Line 17: "Blue Team defenses" -> "Green Team defenses"; Line 137: "Blue Team" -> "Green Team" |
| `src/components/DisruptionPathBanner.tsx` | Lines 41-42: Both "Blue Team" references -> "Green Team" |
| `src/pages/DashboardPage.tsx` | Line 43: "Blue Team" -> "Green Team" in the tips array |
| `src/pages/MethodologyPage.tsx` | Line 28: "Blue Team defends" -> "Green Team defends" |
| `src/pages/Index.tsx` | Lines 1591, 1811: "Blue Team" -> "Green Team" in stress test descriptions |

### Edge Function Prompt (1 file)

| File | What to change |
|---|---|
| `supabase/functions/critical-validation/index.ts` | Replace all "Blue Team" mentions in the system prompt and user prompt text with "Green Team" (approximately 8 occurrences). The JSON key `blueTeam` will remain unchanged since it is a data contract used by the frontend. |

### No Structural Changes
- The TypeScript interface `BlueTeamArg` and the JSON key `blueTeam` in the response schema stay as-is to avoid breaking existing saved data and the frontend parser
- Only human-readable strings change

## Technical Notes
- Total: ~15 string replacements across 7 files
- No logic, routing, or data model changes
- Edge function will need redeployment after prompt text updates

