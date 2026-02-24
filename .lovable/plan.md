

# Redesign: User Workflow Section in Disrupt Step

## What We're Changing

The "User Workflow" section (Section 3 inside the Disrupt step) currently shows the product's user journey as small text pills connected by tiny chevron arrows, with text-only friction point cards below. We'll transform this into a prominent, interactive visual workflow diagram that works across all 3 modes (Product, Service, Business Model).

---

## Current State

- Steps shown as small inline `flex-wrap` text badges with `ChevronRight` arrows
- Friction points listed as flat colored cards below
- No visual connection between steps and their friction points
- Cognitive Load, Context, and Optimizations hidden in a collapsible panel

## New Design

### 1. Visual Workflow Pipeline

Replace the inline text pills with a **vertical timeline** layout (mobile-first) that becomes a **horizontal pipeline** on desktop:

- Each step rendered as a prominent card with a numbered circle, step title, and connecting line to the next step
- Friction points displayed as colored badges directly attached to their corresponding step
- Steps are clickable/tappable to expand and show the full step description and root cause of friction
- Active/expanded step gets a highlighted border and subtle scale effect

```text
Desktop (horizontal):
  [1. Unbox] -----> [2. Setup] -----> [3. First Use] -----> [4. Daily Use]
     |                  |                   |
   (low)            (HIGH!)             (medium)
                   "Complex           "Cognitive
                    pairing"           overload"

Mobile (vertical timeline):
  o-- [1. Unbox] .............. (low friction)
  |
  o-- [2. Setup] .............. (HIGH friction)
  |     > "Complex pairing process"
  |
  o-- [3. First Use] ......... (medium)
  |
  o-- [4. Daily Use]
```

### 2. Interactive Friction Overlay

- Each step card shows a small severity indicator (colored dot: red/amber/green)
- Tapping a step expands it inline to reveal: friction description, root cause, and severity badge
- The expanded state uses the existing `SEVERITY_COLORS` for consistency

### 3. Context Cards Below

- Cognitive Load and Context of Use shown as two side-by-side summary cards (not hidden in a collapsible)
- Workflow Optimizations remain in a collapsible detail panel

### 4. Cross-Mode Support

- Product mode: "User Workflow" label, physical product journey steps
- Service mode: "Customer Journey" label (already handled via `isService` flag)
- Business Model mode: Uses the same component since Disrupt shares `FirstPrinciplesAnalysis`

---

## Technical Details

### Files Modified

**`src/components/FirstPrinciplesAnalysis.tsx`** (lines ~561-629)

Replace the current workflow section with:

1. A new inline `WorkflowTimeline` component that:
   - Maps `data.userWorkflow.stepByStep` into numbered step cards
   - Cross-references `data.userWorkflow.frictionPoints` by matching step names
   - Uses `useState` to track which step is expanded
   - Renders a vertical timeline on mobile (`flex-col`) and horizontal on desktop (`sm:flex-row` with overflow-x-auto)

2. Each step card includes:
   - Numbered circle with connecting line/border
   - Step title text
   - Severity dot if a friction point exists for that step
   - Expandable area showing friction detail and root cause

3. Cognitive Load and Context of Use promoted to visible cards (2-column grid) instead of being hidden in a collapsible

### Visual Specifications (matching design system)

- Step cards: `rounded-lg`, `bg: hsl(var(--muted))`, `border: 1px solid hsl(var(--border))`
- Active/expanded card: `border: 1.5px solid hsl(var(--primary))`, slight scale via CSS
- Timeline connector: 2px solid line using `hsl(var(--border))`
- Friction severity dots use existing `SEVERITY_COLORS` map
- No gradients, no glow, no emojis per design system rules
- All text uses existing font sizes (10px labels, xs body text)

