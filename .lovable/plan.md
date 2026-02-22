&nbsp;

Actually change email subject to Steven invited you to Market Disruptor 

And make sure security privacy info is clear and obvious high contrast  

Confirm links work   

&nbsp;

# Referral Email Overhaul

## Summary

Complete rewrite of the referral email HTML template and subject line to match your exact copy, structure, and visual direction.

## Changes (single file: `supabase/functions/send-referral-email/index.ts`)

### 1. Subject Line and Title

- **Subject**: Change from `${senderName} thinks you need to see this` to `Thought you'd get a ton of value from this! - ${senderName}`
- **HTML title tag**: Same as subject

### 2. Header / Greeting

- Remove the old `<h1>` that says "thinks you need to see this"
- Replace with: `Hi ${recipientName},` (or `Hi there,` if no name) as a simple high-contrast white heading

### 3. Body Copy (4 paragraphs, exact text you provided)

All in white (#ffffff), 15px, high line-height for readability:

1. "You've been invited to access Market Disruptor..." paragraph
2. "This is not a surface-level tool..." paragraph
3. "It doesn't assume the current model is right..." paragraph
4. "The goal isn't to promise..." paragraph
5. "The output is not a generic report..." paragraph

### 4. CTA Button

- Text: **"Access Here"**
- Links to `${shareUrl}` (the working share URL)
- Blue gradient button, white text, centered

### 5. Four Modes Section

- **"Four Ways to Uncover Opportunity"** header stays large (18-20px), bold, white, uppercase, centered with accent underline
- Each mode card keeps its color theme (blue/purple/amber/green) with tinted background, colored left border, rounded corners

**Disrupt This Product** (blue) -- 8 bullets:

- Commercial intelligence dossier from deep web crawling
- Real pricing data, market averages, premiums, and trend trajectories
- Supply chain mapping with OEMs, cost breakdowns, and alt sourcing
- Competitive landscape with pricing gaps and positioning blind spots
- Patent intel, expired IP to leverage, active patents to avoid, white space
- Unfiltered community complaints and feature requests from forums
- Flipped product ideas challenging original design assumptions
- 3-phase go-to-market plan with stress-tested projections

**Disrupt This Service** (purple) -- 7 bullets:

- Market positioning against the full competitive landscape
- Pricing breakdown -- how competitors charge and where gaps exist
- Customer journey friction map with drop-off points and causes
- Underserved segments the competition has overlooked
- Operational workflow analysis -- inefficiencies and automation opportunities
- Growth strategy with acquisition channels, costs, and retention mechanics
- Scaling projections grounded in real market data

**Disrupt The Business Model** (amber) -- 7 bullets:

- Customer journey friction map ranked by impact
- Cost structure deconstruction, where money leaks and why
- Technology leverage audit with automation difficulty ratings
- User workflow analysis, actual behavior vs. assumptions
- Competitive repositioning with a defensible moat plan
- Revenue paths surfaced by challenging pricing assumptions
- Reinvention blueprint with IP considerations and phased timeline

**Disrupt This Nostalgia** (green) -- 8 bullets:

- Revival Potential Score (1-10) across 6 dimensions per product
- Reinvented product concepts with bill-of-materials estimates
- Live pricing from eBay, Etsy, and collector marketplaces
- Community sentiment from Reddit, TikTok, and Google trends
- Supply chain mapping with verified suppliers and MOQs
- Patent landscape, expired IP goldmines, active risks, and innovation gaps
- Friction analysis, why the product lost traction and what was never fixed
- 3-phase execution roadmap with budget and ROI projections

### 6. Footer

- Remains the same (encryption note, invite disclaimer, SGP Capital branding)

### 7. No Other Files Changed

- This is entirely contained in the edge function. No UI changes.

## Technical Details

- Rewrite the `buildReferralEmailHtml` function body with the new HTML
- Update subject line on line 230 to the new format
- All bullet text in white (#ffffff) at 13px for consistency
- Key terms in each mode highlighted with the mode's accent color (bold)
- Deploy the `send-referral-email` edge function