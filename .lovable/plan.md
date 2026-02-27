

## Make PitchDeckToggle More Visually Prominent

### `src/components/PitchDeckToggle.tsx`

Increase contrast and visual weight of the toggle button:

**When included (active state):**
- Background: solid `hsl(var(--primary))` instead of 12% opacity
- Text: white (`hsl(var(--primary-foreground))`)
- Border: solid primary
- Icon size: 13px instead of 11px
- Add subtle shadow for depth

**When excluded (inactive state):**
- Background: keep muted but add dashed border for "not selected" affordance
- Slightly larger padding for better hit target

**Both states:**
- Bump font size from `text-xs` to `text-sm`
- Increase padding from `px-3 py-1.5` to `px-4 py-2`
- Icon size from 11 to 14

### Files to change
- `src/components/PitchDeckToggle.tsx` — restyle button for higher contrast

