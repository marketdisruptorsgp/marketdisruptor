/**
 * Explainer registry — maps every step, section, panel, and slide key
 * to a 2-3 sentence contextual description shown via InfoExplainer popovers.
 */
export const EXPLAINERS: Record<string, string> = {
  // ── Steps ─────────────────────────────────────────────
  "step-report":
    "The Intelligence Report aggregates data from dozens of sources — reviews, patents, supply chains, pricing, and community sentiment — into a single briefing. It's your strategic foundation before any creative or disruptive thinking begins.",
  "step-disrupt":
    "Disrupt deconstructs every assumption behind the product or service. It generates radical 'what-if' scenarios and flipped ideas to surface hidden opportunities competitors have missed.",
  "step-redesign":
    "Redesign takes the strongest disruption ideas and visualizes them as concrete, reinvented concepts. You'll see mockups, feature sets, and positioning for a reimagined version of the product.",
  "step-stress-test":
    "Stress Test pits a Red Team (attackers) against a Green Team (defenders) to battle-test every claim. It surfaces fatal flaws before you commit real resources.",
  "step-pitch":
    "The Pitch Deck compiles your entire analysis into a 10-slide, investor-ready presentation. Each slide is backed by data from earlier steps so nothing is hand-waved.",

  // ── Report Sections ───────────────────────────────────
  "section-overview":
    "Overview synthesizes the product's core value proposition, market size, confidence scores, and key insight into a single view. Start here to ground your analysis.",
  "section-community":
    "Community Intel scrapes forums, review platforms, and public discussions to surface real user complaints, requests, and sentiment — the unfiltered voice of the market.",
  "section-workflow":
    "User Journey maps every step a customer takes — from discovery to purchase to advocacy — and identifies friction points, drop-off risks, and delight moments.",
  "section-pricing":
    "Pricing Intel benchmarks the product against competitors on price, value perception, and willingness-to-pay. It reveals whether the current pricing leaves money on the table.",
  "section-supply":
    "Supply Chain breaks down manufacturing, logistics, and sourcing — highlighting concentration risks, cost drivers, and opportunities to vertically integrate.",
  "section-patents":
    "Patent Intel maps the competitive IP landscape: who holds key patents, where white space exists, and what freedom-to-operate risks you face.",

  // ── Stress Test Tabs ──────────────────────────────────
  "stress-debate":
    "The Red vs Green Debate simulates a structured argument: the Red Team attacks assumptions, feasibility, and market claims while the Green Team defends with evidence and counter-arguments.",
  "stress-validate":
    "Validate & Score runs a feasibility checklist across technical, market, financial, and regulatory dimensions, producing confidence scores that quantify risk.",

  // ── Pitch Slides ──────────────────────────────────────
  "pitch-problem":
    "The Problem slide frames the core pain point your product addresses — grounded in real user data, not assumptions. A strong problem statement is the foundation of every compelling pitch.",
  "pitch-solution":
    "The Solution slide presents your reinvented approach and why it's fundamentally different. It connects directly to the problem with a clear 'before vs after' narrative.",
  "pitch-why-now":
    "Why Now explains the market timing — regulatory shifts, technology inflections, cultural trends — that make this the right moment to launch.",
  "pitch-market":
    "The Market slide sizes TAM, SAM, and SOM with bottom-up logic. Investors want to see a large addressable market with a credible path to capture.",
  "pitch-product":
    "The Product slide showcases your redesigned concept with visuals, key features, and the core user experience. Show, don't just tell.",
  "pitch-business-model":
    "Business Model details how you make money — pricing tiers, unit economics, LTV/CAC ratios, and revenue projections backed by comparable benchmarks.",
  "pitch-traction":
    "Traction proves momentum: early users, waitlist size, LOIs, partnerships, or pilot results. Even pre-launch signals count if they're credible.",
  "pitch-risks":
    "Risks shows you've thought critically about what could go wrong — and already have mitigations in place. Investors respect founders who see around corners.",
  "pitch-gtm":
    "Go-To-Market maps your launch strategy: target segments, acquisition channels, pricing strategy, and the first 90-day plan to hit initial milestones.",
  "pitch-invest":
    "The Investment Ask specifies the raise amount, use of funds, key milestones the capital will unlock, and the strategic rationale for this round size.",

  // ── Detail Panels ─────────────────────────────────────
  "panel-sources":
    "Sources & Trend Analysis lists every data source used and summarizes macro trends affecting this product category — rising demand, declining interest, or emerging niches.",
  "panel-assumptions":
    "The Assumptions Map surfaces hidden beliefs baked into the current product model and challenges each one. Unquestioned assumptions are the #1 source of strategic blind spots.",
  "panel-complaints":
    "Complaints & Requests aggregates the most common user pain points and feature requests from community forums, reviews, and social media.",
  "panel-reviews":
    "Reviews, Signals & Triggers compiles review sentiment, social volume metrics, and behavioral triggers that indicate shifting user preferences.",
  "panel-competitors":
    "Competitor landscape maps direct and indirect competitors, their positioning, pricing, and where gaps exist for differentiation.",
  "panel-pricing-breakdown":
    "Pricing Breakdown analyzes the product's price architecture — per-unit economics, margin structure, and how each tier compares to alternatives.",
  "panel-supply-details":
    "Supply Chain Details maps upstream suppliers, manufacturing locations, logistics partners, and identifies single-point-of-failure risks in the chain.",

  // ── Business Model Mode ───────────────────────────────
  "biz-report":
    "The Business Intelligence Report deconstructs your business model — revenue streams, cost structure, customer segments, and value proposition — into a data-driven briefing.",
  "biz-disrupt":
    "Business Disrupt identifies where your model is vulnerable to disruption: commoditization risks, shifting customer expectations, and emerging competitor strategies.",
  "biz-stress-test":
    "Business Stress Test challenges every revenue assumption and growth projection with Red Team scrutiny to find weaknesses before the market does.",
  "biz-pitch":
    "The Business Pitch Deck turns your model analysis into an investor-ready narrative with revenue projections, market sizing, and a defensible competitive moat.",

  // ── Instant Photo Analysis ──────────────────────────────
  "instant-user-journey":
    "Maps every step a customer takes when interacting with this product or service — from first awareness through purchase and ongoing use — and flags where friction causes drop-off or frustration.",
  "instant-supply-chain":
    "Breaks down the manufacturing, sourcing, and logistics behind what you photographed. Identifies concentration risks, cost drivers, and vertical integration opportunities.",
  "instant-operations":
    "Analyzes the operational backbone — staffing, workflows, technology stack, and process efficiency — to surface bottlenecks and scaling constraints.",
  "instant-sentiment":
    "Predicts what customers love, hate, and struggle with based on the product's design, positioning, and market context. Surfaces pain points and adoption barriers before they show up in reviews.",
  "instant-defensibility":
    "Assesses the competitive moat: patent protection, trade secrets, brand strength, and switching costs. Identifies where the business is vulnerable to copycats or disruption.",
  "instant-market":
    "Positions the product within its competitive landscape — segment, price tier, key competitors, and the core differentiator that determines win/loss dynamics.",
  "instant-disruption":
    "Scores how ripe this market is for disruption. Identifies the biggest opportunities to reinvent the category and the risks that could derail a challenger.",

  // ── Analysis Lens ──────────────────────────────────────
  "lens-selector":
    "The Analysis Lens controls HOW results are evaluated — it doesn't change what data is collected, but reframes how it's scored, ranked, and presented.\n\n" +
    "• <strong>Default Lens</strong>: Explores disruption potential and innovation opportunities. Best for brainstorming and discovering what's possible.\n\n" +
    "• <strong>ETA Acquisition Lens</strong>: Evaluates everything through an ownership perspective — value durability, operational leverage, defensibility, and realistic improvement pathways. Recommendations prioritize process improvements over technology. Ideal for investors and acquirers.\n\n" +
    "• <strong>Custom Lens</strong>: You define the priorities, risk tolerance, time horizon, and constraints. The AI weights all scoring and recommendations to match your specific goals.\n\n" +
    "The lens applies across all pipeline steps (<strong>Intel → Disrupt → Stress Test → Pitch</strong>) and changes <strong>interpretation, not data</strong>. Claims that can't be supported are labeled as limitations.",

  // ── Strategic Archetype ────────────────────────────────
  "strategic-archetype":
    "The Strategic Archetype controls how results are <strong>ranked and weighted after generation</strong> — it applies mathematical weights to already-generated hypotheses without re-running the analysis.\n\n" +
    "• <strong>Operator</strong>: Cost discipline, reliability focus, medium time horizon.\n" +
    "• <strong>ETA Acquirer</strong>: Capital discipline, risk assessment, acquisition value creation.\n" +
    "• <strong>Venture Growth</strong>: Speed & scale priority, higher risk tolerance.\n" +
    "• <strong>Bootstrapped Founder</strong>: Capital-constrained, speed-to-revenue focus.\n" +
    "• <strong>Enterprise Strategist</strong>: Defensibility & reliability, long time horizons.\n\n" +
    "Unlike the Lens (which shapes what data the AI generates), the Archetype re-ranks hypotheses <strong>instantly</strong> using dominance scoring — no re-run required.",

  // ── Reasoning Interrogation ────────────────────────────
  "reasoning-interrogation":
    "Challenge This Reasoning lets you <strong>interrogate the analysis</strong> — ask why a constraint ranked highest, what happens if a key assumption is wrong, or request a re-evaluation from a different perspective.\n\n" +
    "This is not a generic chatbot. Every response references <strong>specific hypotheses, causal chains, evidence mixes, and scores</strong> from your analysis. The AI acts as a reasoning auditor — it can challenge its own conclusions, identify blind spots, and suggest structural revisions.\n\n" +
    "Quick-action buttons are pre-loaded with the most relevant questions based on your analysis data. You can also ask free-form questions.",

  // ── Root Hypotheses / Strategic OS ─────────────────────
  "root-hypotheses":
    "Root Hypotheses are the <strong>2-4 most fundamental structural constraints</strong> shaping this domain. They represent Tier 1 forces — the constraints that, if resolved, would create the most leverage.\n\n" +
    "Each hypothesis includes a dominance score (combining leverage, impact, evidence quality, and fragility), a causal chain showing how the constraint propagates through the system, and downstream implications.\n\n" +
    "The Strategic Archetype re-ranks these hypotheses based on your profile — an Operator sees different priorities than a Venture Growth strategist, even with identical data.",
};
