# Can they be jpeg images and added after all disruption paths at bottom of email? Can user click on them to make larger? And can you explicitly say just a simple example of some of what they'll gain access to?

&nbsp;

# Add Example Output Previews to Referral Email

## Summary

Build 4 high-impact HTML "preview cards" directly in the email that simulate real platform outputs. These go between the "Access Here" CTA button and the "Four Disruption Paths" section, giving recipients a visual taste of what they'll get.

## What We'll Showcase (4 cards)

### 1. Investor Pitch Deck -- TAM/SAM/SOM Market Sizing

A mini version of the market opportunity slide with three columns showing TAM, SAM, and SOM values plus a growth rate callout. Uses the Polaroid example data ($3.1B TAM). This is one of the most visually striking outputs.

### 2. Flipped Product Idea with Scores

A compact card showing a reinvented product concept (e.g., "RetroPrint -- AI Film Subscription") with the four score bars (Feasibility, Desirability, Profitability, Novelty) rendered as colored inline bars. Shows the "flip" thinking that makes the platform unique.

### 3. Patent Intelligence -- Expired IP Goldmine

A card showing an example expired patent with its commercial opportunity and estimated value. The "expired goldmine" concept is immediately compelling and unlike anything else on the market.

### 4. Assumptions Map -- The Flip

A visual showing an assumption on the left, an arrow, and the challenge on the right -- the core "flip" mechanic. Example: "Photo must be printed on the spot" flipped to "Batch printing: take 24 photos, get a curated printed roll later."

## Placement

After the "Access Here" CTA, before "Four Disruption Paths":

- New section header: "See What's Inside" (16-18px, white, centered)
- 4 cards stacked vertically with subtle section labels
- Each card styled as a dark panel with colored accents matching the platform's real UI

## Technical Details

**File changed:** `supabase/functions/send-referral-email/index.ts` only

**Implementation approach:**

- Insert new HTML block after the CTA table (after line ~90) and before the divider/modes section
- Each preview card is a `<table>` (email-safe) with:
  - Dark background (`#1c2333`) to simulate the app's dark mode
  - Colored left borders and accent highlights matching real UI
  - Small "EXAMPLE OUTPUT" label in muted text at top of section
- Score bars rendered as inline colored `<td>` width percentages
- Assumptions map arrow rendered as a centered blue circle with arrow character
- All text in white/light gray for high contrast
- Static example data from the Polaroid OneStep analysis (already in mockProducts.ts)

**No other files changed.** Edge function will be redeployed after edit.