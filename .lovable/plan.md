

# Mode-Specific Rotating Pro Tips

## Overview

Replace the single static "weird niches" tip with a rotating, mode-aware tip system. Each mode (Product, Service, Business Model) gets its own curated set of tips that reflect actual platform capabilities. Tips rotate on each visit/mode switch and are visually upgraded to stand out more.

## Tip Content by Mode

**Product Mode (4 tips, rotating):**
1. "Upload a product photo alongside the URL -- the AI uses computer vision to catch design details that text listings miss, like material quality, ergonomic flaws, and packaging inefficiencies."
2. "Add competitor URLs in the same batch. The analysis cross-references pricing, features, and positioning across all inputs to find gaps no single product review would reveal."
3. "The Disrupt step doesn't just improve -- it deliberately flips every assumption. If a product is heavy, it asks: what if weight is the feature? That's where breakthrough ideas live."
4. "After analysis, use the Red Team / Blue Team debate to stress-test the AI's own conclusions. The best strategies survive adversarial scrutiny."

**Service Mode (4 tips, rotating):**
1. "Paste your service's landing page URL -- the AI maps the entire customer journey, from first impression to post-purchase, and flags friction points competitors accept as normal."
2. "Describe your service in the notes field even if you add a URL. Insider context about operational pain points gives the AI a sharper starting point for deconstruction."
3. "Service analysis skips product-centric logic and focuses on what matters: customer journey friction, operational workflows, and where technology can create structural advantages."
4. "The best service disruptions come from questioning delivery models, not just pricing. The AI tests configurations like unbundling, self-service layers, and subscription pivots."

**Business Model Mode (4 tips, rotating):**
1. "Be specific about your revenue model and pain points -- the more context you provide, the deeper the AI can go on operational audits and revenue reinvention."
2. "The analysis deconstructs your model across multiple dimensions: core reality, operations audit, revenue structure, and adjacency opportunities most teams overlook."
3. "Try running the same business type with different geography or scale inputs. A laundromat strategy in a dense urban market looks completely different from a suburban one."
4. "After the intelligence report, the Disrupt step generates flipped concepts you can guide with custom goals -- tell the AI what constraints or objectives matter most to you."

## Visual Upgrade

- Larger padding and slightly bigger text (text-sm instead of text-xs)
- Mode-colored left border accent (3px solid) matching the active mode color
- Bolder "Pro tip" label prefix in the mode color
- Subtle gradient background tinted with the mode color

## Technical Changes

| File | Change |
|---|---|
| `src/components/ContextualTip.tsx` | Add support for `accentColor` prop and updated styling with left border, bolder label, and slightly larger text |
| `src/pages/DashboardPage.tsx` | Replace single static tip with mode-specific tip arrays, pick a random tip per mode (seeded by session so it doesn't flicker), pass mode color to the tip component. Tip `id` includes mode + tip index so each can be individually dismissed |

