

## Bold Key Terms in Lens Explainer & FAQ

### Problem
The lens explainer popover and FAQ answers render as plain text — key terms like "Default Lens", "ETA Acquisition Lens", "Verified", "Product mode", etc. aren't visually distinguished.

### Changes

#### 1. `src/components/InfoExplainer.tsx`
- Render content with `dangerouslySetInnerHTML` when the string contains HTML tags, otherwise render as plain text
- This allows bolding via `<strong>` in explainer strings

#### 2. `src/lib/explainers.ts` — `lens-selector` entry
- Wrap key terms in `<strong>` tags:
  - **Default Lens**, **ETA Acquisition Lens**, **Custom Lens**
  - **Intel → Disrupt → Stress Test → Pitch**
  - **interpretation, not data**

#### 3. `src/pages/FaqsPage.tsx`
- Switch FAQ answers from plain text to `dangerouslySetInnerHTML` rendering (already done for some components elsewhere)
- Bold key terms across all FAQ answers:
  - Data sources FAQ: **pricing databases**, **Google Trends**, **patent filings**, etc.
  - AI models FAQ: **Verified**, **Modeled**, **Assumption**
  - Modes FAQ: **Product**, **Service**, **Business Model**, step names
  - Privacy FAQ: **row-level security**, **AES-256**, **TLS 1.2+**
  - Revival Score FAQ: **Market demand**, **Supply chain feasibility**, **Community sentiment**, **Trend momentum**, **Competitive density**
  - Claim Tagging FAQ: **Verified**, **Modeled**, **Assumption**
  - Export FAQ: **Intelligence Reports**, **Pitch Decks**, **Stress Test**
  - Tiers FAQ: **Explorer**, **Builder**, **Disruptor**

### Files to Edit
- `src/components/InfoExplainer.tsx` — support HTML rendering
- `src/lib/explainers.ts` — add `<strong>` to lens-selector
- `src/pages/FaqsPage.tsx` — add `<strong>` to FAQ answers, render with `dangerouslySetInnerHTML`

