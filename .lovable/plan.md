
# Value Proposition Callout + Enhanced SGP Capital Email

## Overview

Two focused changes:

1. **Add a prominent value proposition callout** on the home screen, placed between the DisruptionPathBanner and the mode tab bar, so users immediately understand what to expect before starting an analysis.

2. **Rewrite the SGP Capital "Help Disrupt" mailto** with a richer, more personal email body that includes user context, project situation, what they need help with, and a direct link to their saved project.

---

## Technical Plan

### File 1: `src/pages/Index.tsx`

**Add value proposition callout between line 590 (DisruptionPathBanner) and line 592 (tab bar).**

Insert a new section -- a clean, neutral card with the key message:

```
"The goal isn't to promise a 'better' answer every time. The goal is to apply
a level of data-driven scrutiny and critical analysis that exceeds normal human
bandwidth -- revealing hidden leverage points, unlocking overlooked market
segments, or optimizing specific components in ways that can materially change
outcomes."
```

Styling:
- Neutral `hsl(var(--muted))` background, `1px solid hsl(var(--border))`, `rounded-2xl`
- Small `Target` or `Telescope` Lucide icon on the left
- Bold lead-in text ("What to expect") followed by the message in slightly smaller text
- Dismissible via localStorage (same pattern as `ContextualTip`) so returning users aren't pestered

### File 2: `src/components/PitchDeck.tsx`

**Rewrite the mailto body (line 553)** to be a richer, first-person email draft:

Current body is just a flat data dump:
```
Product: X
Category: Y
AI Revival Score: Z/10
...
Generated via Product Ideas platform
```

New body will be structured as a personal outreach email:

```
Subject: Help Disrupt: [Product Name]

Hi SGP Capital team,

I've been working through a disruption analysis on [Product Name] in the
[Category] space and I think there's real potential here.

[If revival score exists]: The AI scored it [X]/10 for revival potential
and I rated it [Y]/10.

[If financial model exists]: The projected gross margin is [margin] with
a break-even timeline of [period].

I'm looking for help with:
- [Dynamic bullet 1 from the tailored CTA bullets]
- [Dynamic bullet 2]
- [Dynamic bullet 3 if applicable]

You can view my full analysis here:
[link to published URL + /analysis/analysisId or share page]

Best,
[User first name]
[User email]
```

The link will use the published URL (`https://productideas.lovable.app`) + the analysis route so Steven can click through and see the full project. We'll check if `analysisId` is available from context/props; if not, we'll link to the share page or dashboard.

Also need to pass `analysisId` into PitchDeck if not already available -- check if it comes from `AnalysisContext` or needs to be threaded through props.

---

## What Stays the Same

- No functional logic changes
- No backend/database changes
- No new dependencies
- Existing CSS variable system used throughout
