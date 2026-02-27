

## Replace BuiltForSection with a Visual Flow Illustration

The current card-based layout reads like buttons and feels repetitive. Replace it with an **SVG-based visual flow diagram** that illustrates three scenario paths converging into the platform and diverging to outcomes — no cards, no button affordances.

### Visual Concept

```text
  "I have an idea"          "There's got to be       "I need to pitch"
        💡                    a better way" 🔍              📊
        |                         |                         |
        v                         v                         v
   ┌─────────┐             ┌─────────┐              ┌─────────┐
   │ Validate │             │Teardown │              │  Intel   │
   └────┬────┘             └────┬────┘              └────┬────┘
        │                       │                        │
        v                       v                        v
   ┌─────────┐             ┌─────────┐              ┌─────────┐
   │ Stress  │             │  Gap    │              │  Pitch  │
   │  Test   │             │Analysis│              │  Deck   │
   └────┬────┘             └────┬────┘              └────┬────┘
        │                       │                        │
        v                       v                        v
    Go / No-Go          Disruption Paths           Export & Ship
```

Three vertical lanes, each with:
- A **trigger phrase** at the top (italic, quoted)
- **2–3 small step nodes** connected by thin SVG lines/arrows
- A **bold outcome** at the bottom

No cards, no borders, no button styling. Pure typographic + line-art illustration. The connecting lines and nodes are rendered as inline SVG for crisp rendering at any size. Subtle primary-color accents on the nodes, muted lines.

### Responsive behavior
- Desktop: 3 columns side by side
- Mobile: stack vertically, shrink SVG proportionally

### Files to change
- `src/components/BuiltForSection.tsx` — full rewrite to SVG flow diagram

