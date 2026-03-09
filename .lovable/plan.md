

# Content & Visual Audit — Full Platform Surface Map

## Method
I read every page component (CommandDeckPage, ReportPage, DisruptPage, RedesignPage, StressTestPage, PitchPage, InsightGraphPage) and all 54 command-deck sub-components to map every content surface, its purpose, and its value.

---

## COMPLETE CONTENT MAP

### 1. COMMAND DECK (the strategic hub) — `CommandDeckPage.tsx` (883 lines)
Renders content in 4 tiers:

| Tier | Component | What It Shows | Value to User |
|------|-----------|---------------|---------------|
| 0 | **HeroInsightCard** | Single biggest finding (opportunity/blindspot/constraint) with "See Why" CTA to Insight Graph | Immediate hook — answers "what should I care about?" |
| 0.5 | **ExecutiveSummary** | One-paragraph CEO brief synthesizing verdict + constraint + opportunity | 30-second decision context |
| 1 | **MetricRow** | 4 cards: Opportunity / Risk / Confidence / Signals count | Glanceable dashboard status |
| 2 | **OneThesisCard** | Full causal chain: Constraint → Belief → Move → Economics → First Move, plus alternative thesis | **Core product value** — the strategic thesis |
| 2b | **IntelligenceFeed** | Scrollable tagged cards (New Idea / Execution / Iterate) with filter tabs | All insights in one feed |
| 3 | **PowerToolsPanel** (collapsed) containing: | | |
| 3a | → **ProblemStatementCard** | Editable + cyclable problem framings, AI-generated | Lets user reframe the problem |
| 3b | → **CurrentStateIntelligence** | SWOT-style bullets: Working / Complaints / Friction / Patterns / Constraints | Current state overview |
| 3c | → **ValuePillarTabs** (3 tabs): | | |
| | → New Ideas tab | TransformationPaths + StrategicNarrativeStory + CTAs to Disrupt/Redesign | Ideation surface |
| | → Execution Path tab | OutcomeSimulator, VerdictBanner, TrappedValue + KillQuestion, ConfidenceMeter, ConfidenceExplanation, Benchmark, OpportunityMap | Execution planning |
| | → Iterate tab | StrategicXRay, ScenarioSimulator, ScenarioLab, PatternCard, OpportunityMap, LensIntelligencePanel | Iteration tools |

### 2. REPORT PAGE — `ReportPage.tsx` (598 lines)
Tabs: Command Deck (mini) | Overview | User Journey | Community | Pricing | Supply Chain | Patents

| Tab | Content | Value |
|-----|---------|-------|
| Command Deck | StrategicDashboard with insight graph preview | Quick strategic snapshot |
| Overview | KeyInsight card + confidence scores (Adoption/Feasibility/Resonance) + signal pills + Market Context + sources | Market intelligence foundation |
| User Journey | AdaptiveJourneyMap with friction points, cognitive load, refresh button | Shows customer experience |
| Community | Sentiment + TopComplaints clusters + ImprovementRequests clusters + Reviews | Voice of customer |
| Pricing | PricingIntelCard with competitive benchmarks | Price positioning |
| Supply Chain | Manufacturers / Distributors / Retailers with regions, notes, URLs | Physical supply visibility |
| Patents | PatentIntelligence component | IP landscape |

### 3. DISRUPT PAGE — `DisruptPage.tsx` (351 lines)
Tabs: Assumptions | Deconstruct | Reasoning | Hypotheses

| Tab | Content | Value |
|-----|---------|-------|
| Assumptions | StructureTab — surfaces hidden assumptions | Challenges mental models |
| Deconstruct | StructureTab — breaks down structural mechanics | Structural analysis |
| Reasoning | ReasoningSynopsis — radar chart, causal flow, decision weights, assumptions, counterfactuals + ReasoningInterrogation (AI chat) | Transparency + challenge capability |
| Hypotheses | Problem framing + StructuralInterpretationsPanel (competing root hypotheses with branch selection) + InnovationOpportunitiesPanel | **Key value** — structural choices |

### 4. REDESIGN PAGE — `RedesignPage.tsx` (205 lines)
Tabs: Flip the Logic | Flipped Ideas | Redesigned Concept

| Tab | Content | Value |
|-----|---------|-------|
| Flip the Logic | FirstPrinciplesAnalysis — assumption inversions | Creative provocation |
| Flipped Ideas | Generated "what if" ideas | Novel angles |
| Redesigned Concept | RedesignVisualGenerator — AI-generated concept with visuals | Tangible reimagined product |

### 5. STRESS TEST PAGE — `StressTestPage.tsx` (328 lines)
Tabs: Opportunities | Strategy | Red Team | Validate

| Tab | Content | Value |
|-----|---------|-------|
| Opportunities | OpportunityMatrix with scored opportunities | Prioritized opportunity list |
| Strategy | StrategicCommandDeck + ETAExecutionPanel | Execution planning |
| Red Team | CriticalValidation debate mode | Adversarial testing |
| Validate | CriticalValidation scoring mode | Feasibility validation |

### 6. PITCH PAGE — `PitchPage.tsx` (115 lines)
Single view: PitchDeck component (10 slides, investor-ready)

### 7. INSIGHT GRAPH PAGE — `InsightGraphPage.tsx` (182 lines)
Full-viewport Cytoscape reasoning map with tier column lanes

---

## CRITICAL ANALYSIS

### REDUNDANCY — Same content appearing in multiple places

1. **Strategic Thesis appears 3 times**: OneThesisCard (Command Deck Tier 2), IntelligenceFeed thesis cards (Tier 2b), and TransformationPaths (Power Tools → New Ideas tab). The causal chain (constraint → belief → move → economics → first move) is rendered identically in all three. **Fix: Show it once prominently, reference it elsewhere.**

2. **Opportunity/Constraint info repeated 4+ times**: HeroInsightCard shows the top constraint/opportunity, ExecutiveSummary restates it, MetricRow scores it, IntelligenceFeed has a constraint card, VerdictBanner shows it again, and CurrentStateIntelligence lists it again. **The user sees the same finding restated in different wrappers.**

3. **Kill Question appears twice**: Once in IntelligenceFeed (as a "New Idea" card), once in ValuePillarTabs → Execution tab as KillQuestionCard. Same content, different containers.

4. **Trapped Value appears twice**: IntelligenceFeed "Iterate" card + TrappedValueCard in Execution tab.

5. **StrategicCommandDeck appears both on Report (dashboard tab) AND StressTest (strategy tab)** — the same system intelligence rendered in two places.

6. **CriticalValidation is rendered TWICE on StressTestPage** (lines 265-286 AND 289-311) — this is literally a bug, the same component mounted twice.

### OVERWHELMING — Too much at once

1. **Command Deck has ~20 components** stacked vertically. Even with PowerToolsPanel collapsed, you see: Hero + Summary + 4 Metrics + Thesis + 5-8 feed cards + collapsed "Power Tools." That's ~15 visual blocks before scrolling to power tools. A user landing here for the first time would struggle to know what matters.

2. **ValuePillarTabs (inside collapsed Power Tools) contains 15+ sub-components** across 3 tabs. This is a full dashboard hidden behind a "Power Tools" expander. Most users will never find ScenarioLab, StrategicXRay, LensIntelligencePanel, etc.

3. **5 pipeline steps PLUS Command Deck PLUS Insight Graph = 7 pages** is too many destinations. Each has 3-4 sub-tabs. That's ~25 distinct views for one analysis.

### WHAT'S GENERIC / LOW-VALUE (vs. ChatGPT)

1. **ExecutiveSummary** — A single paragraph rephrasing what HeroInsightCard + OneThesisCard already say. ChatGPT gives you this for free. **Remove or merge into HeroInsightCard.**

2. **MetricRow** — "Opportunity: Moderate", "Risk: Low", "Confidence: Early Signal", "Signals: 12 from 3/5 steps." These qualitative labels on vague dimensions add zero decision value. A user could ask ChatGPT "rate the opportunity" and get the same. **Remove entirely or replace with specific, concrete metrics (e.g., "3 suppliers in single region" rather than "Risk: Moderate").**

3. **StrategicNarrativeStory** — A prose retelling of the thesis. By the time users reach this (inside Power Tools → New Ideas tab), they've already read the thesis in OneThesisCard. **Redundant.**

4. **ConfidenceMeter + ConfidenceExplanationPanel** — Two components explaining "we're 22% confident because 3/5 steps completed." This is meta-information about the tool, not strategic intelligence. Users don't care about your pipeline completion %. **Merge into a single small indicator.**

5. **IndustryBenchmarkPanel + OpportunityMapPanel** — Deterministic outputs derived from the same evidence. Without real benchmark data (industry averages, competitor financials), these are computed from the analysis's own data — circular. **Low credibility vs. ChatGPT which can cite actual benchmarks.**

6. **PatternCard** (Iterate tab) — "This analysis matches the [X] archetype." Generic pattern classification adds little. **Remove or fold into thesis narrative.**

### WHAT'S VALUABLE & DIFFERENTIATED (keep/enhance)

1. **OneThesisCard** — The causal chain visualization (Constraint → Belief → Move → Economics → First Move) is genuinely unique. No LLM produces this structured output with this visual clarity. **This is the product.** Enhance it.

2. **StrategicXRay** — Interactive reasoning chain with challenge mode. Being able to click a node and see evidence, then challenge it, is something ChatGPT cannot do. **But it's buried in Power Tools → Iterate tab.** Surface it.

3. **Insight Graph** — The Cytoscape reasoning map with tier lanes is visually impressive and structurally unique. **Keep and make more central.**

4. **ProblemStatementCard** — Cyclable, editable problem framings with AI generation is interactive and useful. **But buried in Power Tools.**

5. **ScenarioSimulator** — "What if pricing changes by X%" with recomputation is genuinely interactive. **Buried too deep.**

6. **ReasoningInterrogation** (in Disrupt → Reasoning tab) — AI chat that references specific hypotheses and scores. This is the "depth + feedback + iterate" capability the user wants. **But almost unfindable.**

7. **KillQuestionCard** — A single falsifiable question with validation steps and timeframe is extremely practical. **But shown redundantly and buried.**

### WHAT'S MISSING (would increase willingness to pay)

1. **"So What?" one-liner at the very top** — Before any cards, a single sentence: "If you do nothing, [consequence]. If you execute this thesis, [projected outcome]." Binary, stark, decision-forcing. ChatGPT doesn't frame decisions this sharply.

2. **Competitive positioning map** — A 2x2 or bubble chart showing where THIS business sits relative to named competitors on specific dimensions. Currently competitor data exists but isn't visualized comparatively.

3. **Evidence provenance trail** — When the system says "supply chain concentrated in one region," show the exact source (which URL, which data point). Currently evidence is abstract. Making it traceable builds trust that ChatGPT can't match.

4. **"What would [archetype] do?" quick switcher** — Show the same thesis reframed through different strategic lenses (Operator vs. Venture Growth vs. Bootstrapped) side-by-side on the Command Deck, not hidden in an archetype dropdown.

5. **Action checklist generator** — From OneThesisCard's "First Move," generate a concrete 7-day or 30-day checklist with specific tasks. Something the user can start executing TODAY. Currently the first move is one sentence.

6. **Before/After comparison** — When a user runs a scenario or challenges assumptions, show the thesis BEFORE vs AFTER the change side-by-side. Currently deltas are shown as a banner but not as a visual diff.

7. **Export thesis as one-pager** — A single-page PDF or image of just the OneThesisCard causal chain, suitable for sharing with a partner, investor, or team. Currently PDF export dumps everything.

---

## RECOMMENDED RESTRUCTURE

### Reduce from 7 pages to 4:
1. **Command Deck** — The strategic hub (keep, but dramatically simplify)
2. **Intelligence Report** — Raw data tabs (keep as-is, it's reference material)
3. **Reasoning Map** — Merge Insight Graph + Disrupt + Stress Test into one "explore the reasoning" page with the graph as primary and panels as overlays
4. **Pitch** — Keep as final output

### Command Deck should be 3 sections, not 20:
1. **The Thesis** (OneThesisCard — front and center, full width)
2. **The Evidence** (StrategicXRay — reasoning chain, currently buried)
3. **What's Next** (KillQuestion + First Move checklist + Scenario "what if")

Everything else (metrics, patterns, benchmarks, confidence meters, narrative stories) is either redundant filler or should be accessible via progressive disclosure, not stacked vertically.

### Fix the buried-value problem:
- **StrategicXRay**: Move from Power Tools → Iterate tab to main Command Deck as Tier 2
- **ProblemStatementCard**: Move from Power Tools to top of Intelligence Report
- **ReasoningInterrogation**: Surface as a persistent "Challenge" button on the Command Deck
- **ScenarioSimulator**: Surface as "What If?" button next to OneThesisCard

### Immediate bugs to fix:
- CriticalValidation rendered twice on StressTestPage (lines 265-286 duplicated at 289-311)

