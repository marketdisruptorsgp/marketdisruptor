

## Add Geographic & Regulatory Intelligence to FAQ + Methodology

### What changes

**1. FAQ Page — Update existing data sources FAQ + add new FAQ**

Update the first FAQ ("What data sources does the platform use?") to include geographic/demographic intelligence and adaptive regulatory data alongside the existing sources. Add a new FAQ entry: "How does the platform handle regulated industries?"

The new FAQ explains that the platform automatically detects when an analysis falls into a regulated category (cannabis, healthcare, fintech, food & beverage, alcohol, firearms, etc.) and pulls in relevant legal landscape data — state-by-state variance, active federal rulemaking, and licensing requirements. For non-regulated categories, this layer is skipped entirely. No specific API names or data providers mentioned — just the capability.

**2. Methodology Page — Add new section: "Adaptive Market Intelligence"**

Insert a new section between the existing "Analysis Pipeline" (Section 4) and "Analysis Lenses" (Section 5). This section covers two sub-areas:

- **Geographic & Demographic Enrichment** — The platform pulls real population, income, business density, and growth data to ground TAM/SAM/SOM estimates and GTM recommendations in actual numbers. Applied automatically during Stress Tests and Pitch Decks.

- **Regulatory & Legal Context** — Category-aware detection triggers real-world regulatory data collection for industries with legal complexity. Explains that non-regulated categories skip this entirely (zero overhead). Applied in Red Team arguments and GTM feasibility assessments.

Uses the same card/list design pattern as existing methodology sections (icon + title + description + bullet details).

### Files to change

- `src/pages/FaqsPage.tsx` — update FAQS array (edit item 0, insert new item after it)
- `src/pages/MethodologyPage.tsx` — add "Adaptive Market Intelligence" section between pipeline and lenses sections (~lines 306-308)

