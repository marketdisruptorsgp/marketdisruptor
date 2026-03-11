import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PlatformNav } from "@/components/PlatformNav";
import { useSubscription } from "@/hooks/useSubscription";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, TrendingUp, TrendingDown, Zap, AlertTriangle, BookOpen, Flame, Eye, ShieldCheck, Sparkles, Calendar, MapPin, Database } from "lucide-react";

const FAQS = [
  { q: "What data sources does the platform use?", a: "We aggregate data from pricing databases (historical and current market pricing), wholesale and supplier directories, online community forums and discussion threads, Google Trends and search volume data, social media virality signals, and patent filings. These sources are cross-referenced to build a multi-layered market picture — not just what's selling, but why, where demand is heading, and what supply chains look like." },
  { q: "Which AI models power the analysis?", a: "Our pipeline uses Google Gemini and OpenAI GPT-class models for deep reasoning, claim generation, competitive analysis, and adversarial red-teaming. Each step in the pipeline is purpose-built: one model handles market research synthesis, another generates strategic claims, and a separate adversarial model stress-tests those claims. All outputs include confidence tags (Verified, Modeled, or Assumption) so you always know the basis of each insight." },
  { q: "Is my data private?", a: "Yes. Every analysis is scoped to your authenticated account using row-level security — meaning no other user can see, access, or query your data. All data is encrypted in transit (TLS 1.2+) and at rest (AES-256). We do not sell, share, or use your analyses to train models. You can delete any saved project at any time, and it's permanently removed from our database." },
  { q: "How is the Revival Score calculated?", a: "The Revival Score (1–10) is a weighted composite of five signals: (1) Market demand — search volume, trend trajectory, and community buzz; (2) Supply chain feasibility — availability of manufacturers, suppliers, and raw materials; (3) Community sentiment — positive vs. negative discussion ratio and engagement depth; (4) Trend momentum — whether interest is accelerating, plateauing, or declining over 6–12 months; (5) Competitive density — how many active competitors exist and how differentiated they are. A score of 8+ indicates strong revival potential with clear market opportunity." },
  { q: "What does 'Claim Tagging' mean?", a: "Every insight in your report carries one of three transparency labels: Verified (backed by real, traceable data like pricing records, patent filings, or confirmed supplier listings), Modeled (derived from AI pattern analysis across multiple data points — directionally reliable but not directly sourced), or Assumption (a strategic hypothesis that requires your own validation before acting on it). This system ensures you never confuse an AI-generated hypothesis with a hard fact." },
  { q: "Can I export my reports?", a: "Yes. You can export full Intelligence Reports, Pitch Decks, and Stress Test results as formatted PDFs. Exports include all charts, scores, claim tags, and strategic recommendations. PDFs are generated client-side for instant download — no waiting for email delivery. Pro and Disruptor tier users get unlimited exports." },
  { q: "What's the difference between Product, Service, and Business Model modes?", a: "Each mode runs the same 5-step journey — Selection → Intelligence Report → Disrupt → Stress Test → Pitch Deck — but tailored to the input type. Product mode ('Disrupt This Product') focuses on physical goods: sourcing costs, supply chain mapping, patent landscape, retail pricing, and community demand signals. Service mode ('Disrupt This Service') skips product-specific steps like physical form and patent analysis, and instead deconstructs customer journey friction, operational workflows, technology leverage, and competitive positioning. Business Model mode ('Disrupt This Business Model') performs a full strategic teardown across revenue models, cost structures, operational audits, value propositions, competitive moats, and disruption vulnerabilities. Every mode generates its own tailored Intelligence Report, adversarial Stress Test (Red vs. Blue debate), and investor-ready Pitch Deck." },
  { q: "How many analyses can I run?", a: "Explorer (Free) users get 10 analyses total. Builder ($25/mo) users get 75 analyses per month. Disruptor ($59/mo) users get unlimited analyses with priority processing and access to advanced AI models for deeper strategic insights. Bonus analyses earned through referrals are added on top of your tier limit. Unused monthly analyses do not roll over. Visit the Pricing page for full tier comparisons." },
];

const METHODOLOGY_STEPS = [
  { title: "Data Collection", desc: "We run deep analysis across a large subset of real-world data sources — pricing databases, wholesale directories, community forums, search trends, and viral content signals — to build comprehensive market intelligence." },
  { title: "3-Layer Deconstruction", desc: "Every market is analyzed across three layers: Supply (sourcing, manufacturing, logistics), Demand (audience segments, willingness to pay, growth signals), and Positioning (competitive landscape, differentiation opportunities)." },
  { title: "Claim Tagging & Leverage Scoring", desc: "All AI-generated insights are tagged as Verified, Modeled, or Assumption. Each assumption is scored 1–10 for strategic leverage — high-leverage assumptions are the ones most worth validating." },
  { title: "Adversarial Red Teaming", desc: "A simulated adversary stress-tests your strategy by attacking key assumptions, identifying blind spots, and pressure-testing market positioning. This is how you find weaknesses before competitors do." },
];

const TREND_SPOTLIGHTS = [
  { name: "Portable Espresso Machines", momentum: "+340%", period: "12mo search growth", score: 8.7, insight: "3 dominant brands control 70% of market. DTC gap in premium segment ($150–$300). Supply chain is mature — 12+ OEMs in Shenzhen with MOQ under 500 units.", category: "Consumer Electronics" },
  { name: "AI-Powered Tutoring Services", momentum: "+280%", period: "12mo search growth", score: 9.1, insight: "Massive fragmentation — no clear market leader. Parents willing to pay 2–3x traditional tutoring rates. Key differentiator: adaptive curriculum vs. static question banks.", category: "EdTech Services" },
  { name: "Modular Tiny Homes", momentum: "+190%", period: "12mo search growth", score: 7.4, insight: "Zoning regulation changes in 14 US states creating new demand. Average build cost $45K–$85K. Community sentiment strongly positive but financing remains a friction point.", category: "Real Estate" },
  { name: "Traditional Film Photography", momentum: "+160%", period: "12mo search growth", score: 7.9, insight: "Gen Z nostalgia driving revival. Film stock supply constrained — only 3 major manufacturers globally. Used camera prices up 40% YoY. Opportunity in film development services.", category: "Nostalgia / Hobby" },
];

const DISRUPTION_SIGNALS = [
  { icon: ShieldCheck, label: "Patent Filing Surge", desc: "47 new patents filed in solid-state battery tech in Q4 2025 — up 3x from previous quarter. Major implications for portable electronics and EV accessories.", time: "2 days ago" },
  { icon: AlertTriangle, label: "Supply Chain Shift", desc: "Three major Vietnamese textile manufacturers now offering DTC fulfillment. Average lead times dropped from 45 to 18 days. Opens new possibilities for fashion and home goods startups.", time: "5 days ago" },
  { icon: Flame, label: "Viral Market Signal", desc: "\"Anti-productivity\" planners trending across social media (28M views). Community demanding intentional slowdown tools. No dominant brand has emerged yet — white space for a positioned entrant.", time: "1 week ago" },
  { icon: TrendingDown, label: "Price Collapse Detected", desc: "Smart home sensor kits dropped 62% in average retail price over 6 months. Margin compression forcing incumbents to bundle. Opportunity for value-added service layer on top of commoditized hardware.", time: "1 week ago" },
  { icon: Eye, label: "Community Demand Spike", desc: "Online community threads requesting 'repairable' versions of popular kitchen appliances up 400% YoY. Right-to-repair sentiment creating product differentiation opportunity.", time: "2 weeks ago" },
];

const CATEGORY_PLAYBOOKS = [
  { title: "DTC Skincare", subtitle: "Product Disruption", stats: "~$18B US market · 12% CAGR · High fragmentation", summary: "The DTC skincare market is saturated at the low end but underserved in clinical-grade, dermatologist-validated products priced $30–$80. Community analysis reveals 'ingredient transparency' as the #1 purchase driver — yet most brands still use vague labeling. Supply chain: 8+ US-based contract manufacturers with MOQ under 200 units. Key risk: FDA regulatory tightening on 'active ingredient' marketing claims." },
  { title: "Micro-SaaS for Freelancers", subtitle: "Service Disruption", stats: "~60M US freelancers · $1.3T economy · Tool fatigue rising", summary: "Freelancers use an average of 7+ tools for invoicing, contracts, scheduling, and client management. Community sentiment shows strong demand for a single, opinionated platform that handles 80% of workflows. Pricing sweet spot: $15–$29/mo. Competitive moat comes from workflow automation, not features. Key insight: the winners won't have the most features — they'll have the fewest clicks to get paid." },
  { title: "Premium Pet Supplements", subtitle: "Product Disruption", stats: "~$2.4B US market · 9% CAGR · Trust deficit", summary: "Pet supplement market is growing fast but plagued by skepticism — 68% of pet owners in community surveys don't trust supplement efficacy claims. Opportunity: clinically-tested, vet-endorsed formulations with transparent sourcing. Supply chain mature — 15+ contract manufacturers with FDA-registered facilities. Pricing power exists: owners who buy supplements spend 3.2x more on pet care overall." },
];

// ═══════════════════════════════════════════════════════════════
//  RELEASES / CHANGELOG
// ═══════════════════════════════════════════════════════════════

interface ReleaseEntry {
  date: string;
  title: string;
  description: string;
  valueToUser: string;
  location: string;
  dataSources: string;
  tag: "engine" | "ui" | "pipeline" | "infrastructure" | "intelligence";
}

const RELEASE_TAG_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  engine: { label: "Engine", color: "hsl(var(--primary))", bg: "hsl(var(--primary) / 0.1)" },
  ui: { label: "UI", color: "hsl(262 83% 58%)", bg: "hsl(262 83% 58% / 0.1)" },
  pipeline: { label: "Pipeline", color: "hsl(142 70% 35%)", bg: "hsl(142 70% 35% / 0.1)" },
  infrastructure: { label: "Infra", color: "hsl(38 92% 42%)", bg: "hsl(38 92% 42% / 0.1)" },
  intelligence: { label: "Intelligence", color: "hsl(199 89% 48%)", bg: "hsl(199 89% 48% / 0.1)" },
};

const RELEASES: ReleaseEntry[] = [
  // ── March 9, 2026 ──
  {
    date: "March 9, 2026",
    title: "Command Deck 2.0 — Single-Scroll Strategic Briefing",
    description: "Redesigned the Command Deck from a multi-tab layout to a single continuous scroll. Hero Insight Card, Strategic Diagnosis Banner, tag-filtered Intelligence Feed, and metrics row — all visible without clicking through tabs.",
    valueToUser: "Full strategic picture in one scroll. The hero insight hits immediately, the diagnosis explains why, and the intelligence feed gives actionable next steps.",
    location: "Command Deck — default view for any analysis.",
    dataSources: "Strategic Engine narrative builder, Intelligence Feed sourced from insights, playbooks, patterns, and validation questions.",
    tag: "ui",
  },
  {
    date: "March 9, 2026",
    title: "Text Quality Engine — Consulting-Grade Sentences",
    description: "Overhauled text generation: sentence case globally, eliminated circular verdicts, intelligent sentence-boundary truncation, stripped internal IDs. Retroactive — all existing analyses benefit.",
    valueToUser: "Every piece of text reads like it was written by a strategist. Complete sentences, no truncation, no machine artifacts.",
    location: "All text across Command Deck, Intelligence Feed, Insight Graph, Evidence Explorer, PDF exports.",
    dataSources: "humanizeLabel utility, Strategic Engine narrative builder with anti-circular logic, trimAt with sentence-boundary cutting.",
    tag: "engine",
  },
  {
    date: "March 9, 2026",
    title: "Intelligence Feed — Deduplicated, Evidence-Rich Cards",
    description: "Rebuilt feed: no duplicate hero card, real pattern characteristics, critical validation question card, inline expansion.",
    valueToUser: "Every card provides unique, actionable information with real structural details instead of generic placeholders.",
    location: "Command Deck → Intelligence Feed section.",
    dataSources: "Strategic Engine insights, Playbook Engine, Pattern Detection Engine, Validation Step Builder.",
    tag: "intelligence",
  },

  // ── March 8, 2026 ──
  {
    date: "March 8, 2026",
    title: "Opportunity Design Engine — Morphological Search for Business Models",
    description: "Introduced a morphological search engine inspired by Fritz Zwicky's design space analysis. Instead of generating generic opportunity labels ('Resolve X to unlock growth'), the system now maps the current business configuration as coordinates in a multi-dimensional design space, identifies dimensions worth exploring, generates controlled 1–2 variable shifts, filters through four deterministic qualification gates (evidence, constraint linkage, feasibility, redundancy), and clusters results into opportunity zones.",
    valueToUser: "You now see specific dimensional shifts from your current state — for example, 'Pricing: annual → usage-based, triggered by trial friction + SMB demand signals' — instead of vague improvement suggestions. Each opportunity is traceable to specific evidence and expressed as a delta from your baseline, so you can evaluate exactly what would change and why. Opportunities are grouped into strategic zones (e.g., 'Product-Led Delivery Transformation') so you can explore entire strategic themes, not just individual ideas.",
    location: "Command Deck → Strategic Intelligence → Opportunities section. Opportunity vectors also appear as nodes in the Insight Graph. The morphological search runs automatically as part of the strategic analysis pipeline when sufficient evidence exists (≥18 evidence items + leverage points identified).",
    dataSources: "Evidence from all pipeline steps, normalized into 9 canonical categories. Deterministic morphological search generates alternatives. Qualification gates are fully deterministic — no AI involved in filtering or clustering.",
    tag: "engine",
  },
  {
    date: "March 8, 2026",
    title: "No-Score Architecture — Platform-Wide Qualitative Reasoning",
    description: "Completed the removal of all numeric scores, percentages, and rankings across the entire platform. Replaced with qualitative tiers (Strong / Moderate / Early) and evidence-backed structural labels. This applies to the Confidence Meter, concept variants, opportunity vectors, leverage points, and all strategic outputs.",
    valueToUser: "You no longer see misleading precision (e.g., '7.3 out of 10') that implies accuracy the system can't guarantee. Instead, every finding stands on its own reasoning and evidence. When the system says 'Strong evidence,' it means multiple corroborating signals from different pipeline steps — not a calculated number.",
    location: "Affects every panel on the Command Deck, all Insight Graph node details, the Evidence Explorer, concept variant cards, and the Strategy Profile on Transformation Paths. Visible throughout the entire analysis workspace.",
    dataSources: "Evidence Engine (evidenceEngine.ts) provides structured evidence with provenance tags. Tier classification uses the Tier Discovery Engine which analyzes text patterns to classify findings as Structural (Tier 1), System (Tier 2), or Optimization (Tier 3).",
    tag: "intelligence",
  },

  // ── March 7, 2026 ──
  {
    date: "March 7, 2026",
    title: "Concept Expansion Engine — Design Space Exploration",
    description: "Added a Concept Generation / Design Space Expansion stage between the Opportunity and Stress Test phases. The engine identifies Design Dimensions (e.g., Interaction Surface, Input Mechanism, Form Factor) derived from upstream constraints and leverage points, then combines them to generate 10–30 structured Concept Variants with feasibility, novelty, and market readiness tiers.",
    valueToUser: "Instead of getting a single product or service idea, you now see a full design space — multiple 'how' configurations for each strategic opportunity. You can compare concept variants side-by-side, select promising ones for stress testing, and understand how different design choices (pricing model × distribution channel × form factor) create different strategic positions. This is the business equivalent of how Nike and Apple explore product design space before committing to a single design.",
    location: "Command Deck → New Ideas tab → Concept Expansion section. Also accessible from any Opportunity node in the Insight Graph via the 'Expand Design Space' button. Concept variants appear as connected nodes in the Insight Graph under the 'Concept Variant' type.",
    dataSources: "Constraints and leverage points from the Strategic Engine (stages 4–6) feed into the generate-concept-space backend function, which uses Google Gemini 2.5 Flash with structured tool calling. Competitor approaches from the Intel Report and flipped ideas from the Deconstruct step provide negative space and creative provocations. Dimensions are dynamically derived — not hardcoded.",
    tag: "engine",
  },
  {
    date: "March 7, 2026",
    title: "Skeptical Intelligence Calibration",
    description: "Implemented a platform-wide skepticism bias. Default confidence starts at 0.3 (not 0.8). Single-source evidence is penalized by up to 40%. Pipeline coverage factor starts at 0.5x for incomplete pipelines. Narrative prose now includes uncertainty qualifiers. UI shows 'Needs validation' badges for uncorroborated findings.",
    valueToUser: "The system no longer tells you things are 'high confidence' just because it generated them. If an insight comes from a single pipeline step with no corroborating evidence from other steps, the system explicitly flags it as low confidence. This means you can trust the system's confidence labels — when it says 'Strong,' it actually means strong.",
    location: "Visible on every insight card, evidence item, and strategic recommendation across the Command Deck, Evidence Explorer, and Insight Graph. Confidence labels appear as badges next to each finding.",
    dataSources: "Cross-engine corroboration checks across all 6 pipeline steps. Source count tracking per evidence item. Confidence Engine (confidenceEngine.ts) applies deterministic scoring based on evidence density, impact thresholds, and cross-domain corroboration — not AI judgment.",
    tag: "intelligence",
  },

  // ── March 6, 2026 ──
  {
    date: "March 6, 2026",
    title: "Strategic Command Deck — Mission Control Dashboard",
    description: "Launched the Command Deck as the central strategic intelligence briefing and default landing page for all analyses. Features 'Current State Intelligence' (10–15 SWOT-style bullets), three-tab Value Pillars (New Ideas, Execution Path, Iterate), an interactive Problem Statement card, and context-aware Model Archetype benchmarks.",
    valueToUser: "You get a single-screen strategic briefing that shows what's working, what's broken, where the constraints are, and what the system recommends — without clicking through multiple tabs. The Problem Statement card lets you frame and reframe the strategic question, and the three-tab structure guides you through the complete strategic arc: understanding, ideation, and execution.",
    location: "Automatically loads as the default view when you open any analysis. Accessible from the 'Summary' toggle in the analysis header. The Command Deck synthesizes outputs from all completed pipeline steps into one unified view.",
    dataSources: "Strategic Engine (strategicEngine.ts) — 11-stage sequential pipeline processing evidence from all completed analysis steps. Current State Intelligence derives from governed analysis data. Model Archetype benchmarks are contextually selected based on the detected business model pattern (e.g., SaaS Platform vs. Service Project vs. DTC Brand).",
    tag: "ui",
  },
  {
    date: "March 6, 2026",
    title: "Strategic Scenario Engine — What-If Simulations",
    description: "Added interactive 'What if' simulation capability. Users can adjust hypothetical variables (pricing changes, distribution shifts, productization decisions) using magnitude sliders. The engine recomputes the entire strategic model — including the verdict, playbooks, and narrative — to show how the strategy adapts to each hypothesis. Scenarios are saved and tagged for side-by-side comparison.",
    valueToUser: "You can test strategic hypotheses before committing. For example: 'What if we switched from annual to usage-based pricing?' The system recalculates the full strategic model and shows you how that single change ripples through constraints, leverage points, and opportunities. Saved scenarios let you compare outcomes side-by-side.",
    location: "Command Deck → Iterate tab → Scenario Lab. Scenarios are also accessible from the Lens Intelligence toolkit. Saved scenarios persist in your analysis and can be revisited at any time. Scenario data feeds back into the Strategic Engine, automatically updating the strategic model.",
    dataSources: "Scenario inputs are user-defined. The Scenario Engine (scenarioEngine.ts) generates 'simulation' evidence that feeds back into the Strategic Intelligence Engine. Scenario comparisons use the Scenario Comparison Engine for side-by-side structural analysis. Financial projections use deterministic formulas from the Financial Modeling Engine — not AI estimates.",
    tag: "engine",
  },
  {
    date: "March 6, 2026",
    title: "Evidence-Based Confidence Meter",
    description: "Replaced technical pipeline metrics with business evidence domains (Demand Signals, Cost Structure, Distribution, etc.) in the Confidence Meter. The system explicitly labels 'Strong,' 'Moderate,' and 'Limited' evidence domains and provides actionable 'Improve Confidence' hints suggesting specific missing data types.",
    valueToUser: "Instead of seeing '3/5 pipeline steps complete' (which tells you nothing about analysis quality), you now see which evidence domains are well-covered and which are thin. The hints tell you exactly what kind of data to add — for example, 'Add competitor pricing benchmarks to strengthen the Competitive Pressure domain.'",
    location: "Command Deck → top-right area of the strategic briefing. The Confidence Meter updates dynamically as you complete more pipeline steps. Evidence domain breakdowns are also visible in the Evidence Explorer.",
    dataSources: "Evidence Engine categorizes all signals into 9 canonical domains. Domain strength is determined by evidence count, cross-step corroboration, and source diversity — not AI judgment. Improvement hints are rule-based, matching under-evidenced domains to specific pipeline steps that typically produce that evidence type.",
    tag: "ui",
  },

  // ── March 5, 2026 ──
  {
    date: "March 5, 2026",
    title: "11-Stage Strategic Reasoning Pipeline",
    description: "Refactored the intelligence architecture from a distributed, step-based model to a centralized 11-stage sequential reasoning pipeline: Evidence Collection → Normalization → Signal Formation → Constraint Detection → Driver Identification → Leverage Discovery → Opportunity Generation → Strategic Pathways → Narrative Generation → Graph Construction → Metrics Computation. Progressive thresholds ensure each stage only fires when sufficient evidence exists.",
    valueToUser: "The system no longer generates placeholder insights or 'synthetic' reasoning when it doesn't have enough data. If you've only completed one pipeline step, the system tells you exactly what it can conclude from that evidence — and explicitly marks what it can't yet determine. As you complete more steps, the reasoning deepens progressively. This prevents the 'confident bullshit' problem where AI systems present uncertain conclusions with false authority.",
    location: "The pipeline runs automatically when you click 'Run Strategic Analysis' on the Command Deck. Pipeline progress and threshold status are visible in the Pipeline Diagnostics panel (accessible from the analysis header). Each stage's output feeds into the Insight Graph and Command Deck.",
    dataSources: "Evidence Engine (evidenceEngine.ts) extracts structured signals from all pipeline steps. Signal formation uses Jaccard similarity (>0.7) clustering. Constraint detection requires ≥2 corroborating signals. Progressive thresholds: 4 evidence → signals, 8 → constraints, 11 → drivers, 15 → leverage, 18 → opportunities, 22 → pathways.",
    tag: "pipeline",
  },
  {
    date: "March 5, 2026",
    title: "Business Model Analysis Mode — Full Strategic Teardown",
    description: "Added dedicated Business Model analysis mode with seven primary tabs: Business Summary, Operational Audit, Hidden Assumptions, Tech Leverage, Revenue Reinvention, Disruption, and Reinvented Model. In acquisition scenarios, five specialized ETA (Entrepreneurship Through Acquisition) tabs activate: Deal Economics, Addback Scrutiny, Stagnation Dx, Owner Risk, and 100-Day Playbook.",
    valueToUser: "If you're analyzing a business you want to buy, improve, or disrupt, you now get purpose-built strategic analysis instead of product-focused outputs. The Operational Audit identifies process bottlenecks. Hidden Assumptions surfaces beliefs the current owner might not question. Revenue Reinvention explores entirely different monetization models. For acquisition buyers, the ETA tools include SBA loan modeling, adjusted SDE calculations, and a structured 100-day transformation playbook.",
    location: "Select 'Disrupt This Business Model' when creating a new analysis. The seven tabs appear in the analysis workspace sidebar. ETA tabs activate automatically when the system detects acquisition-oriented language in the problem statement. All tabs feed evidence into the Strategic Engine.",
    dataSources: "Business Model Analysis edge function (business-model-analysis) uses Google Gemini for structured extraction of revenue models, cost structures, value chain analysis, and competitive dynamics. Financial modeling uses deterministic formulas (SBA amortization, DSCR, debt service). Evidence maps to 9 canonical categories with specific business model extractors for revenue model assumptions, value chain bottlenecks, and distribution architecture.",
    tag: "pipeline",
  },

  // ── March 4, 2026 ──
  {
    date: "March 4, 2026",
    title: "Multi-Lens Strategic Intelligence — Convergence Zones",
    description: "Implemented a shared-model orchestration architecture that analyzes a business through Product, Service, and Business Model lenses simultaneously. A Convergence Engine detects Strategic Convergence Zones when 3+ lenses identify the same high-leverage point, highlighting high-confidence disruption opportunities where multiple analytical models intersect.",
    valueToUser: "When the Product lens, Service lens, and Business Model lens all independently identify the same leverage point — for example, 'pricing model flexibility' — that convergence is a much stronger signal than any single lens finding it. These convergence zones are the highest-confidence opportunities in the system because they're validated from three independent analytical perspectives.",
    location: "Command Deck → the convergence indicator appears on leverage points and opportunities that are identified by multiple lenses. The Lens Intelligence toolkit (Command Deck → Iterate tab) provides 12+ interactive modeling tools. System Intelligence layer (accessible via the analysis header) shows the full convergence map.",
    dataSources: "Lens Orchestrator (lensOrchestrator.ts) runs three parallel analytical passes using shared evidence. Each lens reinterprets the structural model using artifact-driven assessment. Convergence detection uses set intersection of leverage point IDs across lenses. Intelligence is cached per analysis ID to prevent redundant computation.",
    tag: "intelligence",
  },
  {
    date: "March 4, 2026",
    title: "Insight Graph — Interactive Reasoning Map",
    description: "Built an evidence-first interactive graph that visualizes the causal chain from raw evidence → signals → constraints → drivers → leverage points → opportunities → pathways. Every node is backed by traceable evidence. Edges represent causal relationships (causes, supports, blocks, enables, unlocks). Includes Cytoscape-powered rendering with dagre layout.",
    valueToUser: "You can visually trace any strategic recommendation back to the raw evidence that supports it. Click any opportunity node and follow the edges backward through leverage points, drivers, and constraints to see exactly why the system recommended it. This makes the reasoning transparent and auditable — you're not trusting a black box.",
    location: "Accessible via the 'Insight Graph' toggle in the analysis header (next to 'Summary'). Also reachable from any strategic insight card via the 'View in Graph' action. The graph updates automatically when you complete additional pipeline steps or run new scenarios.",
    dataSources: "Graph nodes are generated from canonical Evidence objects (evidenceEngine.ts). Strategic insight nodes come from the Strategic Engine's 11-stage pipeline. Scenario nodes come from the Scenario Engine. Concept variant nodes come from the Concept Expansion Engine. Edge weights and relations are determined by evidence ID overlap and Jaccard similarity between node labels.",
    tag: "ui",
  },

  // ── March 3, 2026 ──
  {
    date: "March 3, 2026",
    title: "Tier Discovery System — Structural Depth Classification",
    description: "Implemented the Three-Tier First Principles Innovation Model that classifies all insights by structural depth: Tier 1 (Structural: Revenue/Ownership/Architecture), Tier 2 (System: Logistics/Operations/Process), and Tier 3 (Optimization: UX/Features/Marketing). Tier progression is gated — deeper tiers unlock as evidence density grows.",
    valueToUser: "The system helps you focus on the right level of analysis. Tier 1 insights (structural assumptions about revenue models, ownership, business architecture) have 10x more strategic impact than Tier 3 insights (UX tweaks, feature additions). By default, the system starts at Tier 1 and only surfaces Tier 2/3 when the structural picture is clear. This prevents the common trap of optimizing marketing when the business model itself is broken.",
    location: "Discovery Tiers panel in the Situation Room (analysis workspace). Tier badges appear on every insight card, evidence item, and graph node. The Insight Graph can be filtered by tier. Tier activation is visible in the sidebar as numbered stages.",
    dataSources: "Tier Discovery Engine (tierDiscoveryEngine.ts) classifies evidence using text pattern analysis against structural, system, and optimization keyword dictionaries. Classification is deterministic — no AI involved. Tier thresholds are based on evidence count per tier (default: 5+ structural signals to unlock Tier 2).",
    tag: "intelligence",
  },
  {
    date: "March 3, 2026",
    title: "Adaptive Context System — Problem Statement Intelligence",
    description: "Built a full-stack Adaptive Context system. A dedicated edge function deconstructs the user's problem statement into primary entities, detected modes (Product, Service, Business), and discrete strategic challenges. These challenges are presented as selectable cards that steer the downstream reasoning engine.",
    valueToUser: "When you describe your business problem, the system doesn't just take your words at face value. It breaks your problem statement into component challenges (e.g., 'pricing pressure,' 'channel dependency,' 'customer concentration risk') and lets you select which ones to focus on. This context is then injected into every analysis step, ensuring the entire pipeline is aligned with your actual strategic question — not a generic analysis.",
    location: "Analysis setup flow — appears after you enter your problem statement, before the first pipeline step begins. Selected challenges persist and are visible in the analysis header. Context is automatically injected into all backend functions (Disrupt, Redesign, Stress Test, Pitch).",
    dataSources: "The analyze-problem edge function uses Google Gemini to parse natural language problem statements into structured entities and challenges. User selections are persisted and used as context injection for all downstream analysis functions. No external data sources — this is purely a structuring layer for user intent.",
    tag: "pipeline",
  },

  // ── March 2, 2026 ──
  {
    date: "March 2, 2026",
    title: "Deterministic Financial Modeling Engine",
    description: "Built a standalone financial modeling engine that performs all numeric calculations — SBA loan amortization, debt service coverage ratio (DSCR), scenario simulations, and unit economics — using explicit, auditable formulas independent of AI reasoning. Every numeric value carries a Data Provenance record (SOURCE, USER_INPUT, or MODELED).",
    valueToUser: "When the system shows you financial projections (loan payments, margin impact, ROI estimates), those numbers come from deterministic formulas — not AI guesses. Every number has a provenance tag telling you whether it came from your input, a verified data source, or a mathematical model. This means you can trust the math and focus your skepticism on the assumptions going in, not the calculations coming out.",
    location: "Lens Intelligence toolkit → ROI Model, SBA Loan Calculator, Cash Flow Quality Analyzer, Unit Economics tools. Also powers the financial projections in the Strategic Outcome Simulator (Command Deck). ETA-specific tools (Deal Economics, Addback Scrutiny) use the same engine.",
    dataSources: "User inputs for assumptions. Deterministic formulas for all calculations (no AI). SBA loan modeling uses standard 10-year amortization at market rates. DSCR calculations follow SBA 7(a) program guidelines. Provenance tracking is built into every output object.",
    tag: "engine",
  },
  {
    date: "March 2, 2026",
    title: "Edge Function Resilience Architecture",
    description: "Implemented standardized resilience patterns across all backend functions: AbortController timeouts (150s–180s), defensive body reading for interrupted network streams, JSON repair logic for truncated AI responses, and Flash-first/Pro-fallback model strategy for cost optimization.",
    valueToUser: "Analyses complete more reliably, even on slow connections or when AI providers experience latency spikes. If a response is partially received before a timeout, the system attempts to repair and extract usable data rather than failing entirely. The Flash-first strategy keeps analysis costs low while automatically escalating to more powerful models when the simpler model fails to produce valid output.",
    location: "Invisible to users — this is infrastructure. You'll notice it as fewer 'analysis failed' errors and faster average completion times. The model fallback strategy is logged in the Pipeline Diagnostics panel for transparency.",
    dataSources: "All backend functions (analyze-products, business-model-analysis, generate-flip-ideas, first-principles-analysis, generate-pitch-deck, critical-validation, generate-concept-space, generate-opportunity-vectors) implement this pattern. Primary model: Google Gemini 2.5 Flash. Fallback: Google Gemini 2.5 Pro.",
    tag: "infrastructure",
  },

  // ── February 2, 2026 ──
  {
    date: "February 2, 2026",
    title: "Platform Foundation — Analysis Pipeline & Evidence Engine",
    description: "Launched the foundational platform architecture: six-step analytical pipeline (Analyze → Intel Report → Deconstruct → Reimagine → Stress Test → Pitch), the canonical Evidence Engine with 9 evidence categories, row-level security for all user data, authentication system, and the core analysis workspace with sidebar navigation.",
    valueToUser: "The starting point for everything. You can analyze any product, service, or business model through a structured six-step journey that moves from understanding the current state, through generating strategic ideas, to stress-testing and packaging them. Every analysis is private to your account, persisted in the database, and accessible from your portfolio.",
    location: "The entire platform. Create a new analysis from the home page. The six steps appear in the analysis workspace sidebar. Your saved analyses appear in the portfolio view.",
    dataSources: "Analysis data from AI-powered edge functions (Google Gemini, OpenAI GPT). Market intelligence scraped from pricing databases, patent filings, trend signals, and market news. All evidence is structured into the canonical Evidence format with type, tier, mode, lens, and provenance metadata.",
    tag: "pipeline",
  },
];

// Group releases by date
function groupByDate(releases: ReleaseEntry[]): { date: string; entries: ReleaseEntry[] }[] {
  const groups: { date: string; entries: ReleaseEntry[] }[] = [];
  for (const r of releases) {
    const existing = groups.find(g => g.date === r.date);
    if (existing) {
      existing.entries.push(r);
    } else {
      groups.push({ date: r.date, entries: [r] });
    }
  }
  return groups;
}

export default function ResourcesPage() {
  const { tier } = useSubscription();
  const location = useLocation();
  const navigate = useNavigate();

  const hashToTab: Record<string, string> = {
    "#faqs": "faqs",
    "#methodology": "methodology",
    "#market-intel": "market-intel",
    "#releases": "releases",
  };
  const initialTab = hashToTab[location.hash] || "faqs";

  useEffect(() => {
    if (location.hash) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [location.hash]);

  const releaseGroups = groupByDate(RELEASES);

  return (
    <div className="min-h-screen bg-background">
      <PlatformNav tier={tier} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <p className="text-sm font-bold uppercase tracking-widest text-primary mb-3">Resources</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight mb-10">
          Learn How It Works
        </h1>

        <Tabs defaultValue={initialTab}>
          <TabsList className="mb-10 flex overflow-x-auto scrollbar-hide">
            <TabsTrigger value="faqs" className="text-sm">FAQs</TabsTrigger>
            <TabsTrigger value="methodology" className="text-sm">Methodology</TabsTrigger>
            <TabsTrigger value="market-intel" className="text-sm">Market Intel</TabsTrigger>
            <TabsTrigger value="releases" className="text-sm">New Releases</TabsTrigger>
          </TabsList>

          <TabsContent value="faqs">
            <Accordion type="single" collapsible className="space-y-3">
              {FAQS.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border border-border rounded-lg px-4 sm:px-5 bg-card shadow-sm">
                  <AccordionTrigger className="text-sm font-semibold text-foreground py-4 hover:no-underline text-left">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </TabsContent>

          <TabsContent value="methodology">
            <div className="space-y-8">
              {METHODOLOGY_STEPS.map((step, i) => (
                <div key={i} className="flex items-start gap-4">
                  <div className="step-badge flex-shrink-0 mt-0.5">{i + 1}</div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{step.title}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed mt-1">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="market-intel">
            <div className="space-y-10">
              {/* Trend Spotlights */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={16} className="text-primary" />
                  <h2 className="text-base font-bold text-foreground">Trend Spotlights</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                  Categories showing accelerating demand, supply chain readiness, and disruption potential — surfaced from our analysis engine.
                </p>
                <div className="space-y-3">
                  {TREND_SPOTLIGHTS.map((t, i) => (
                    <div key={i} className="border border-border rounded-lg p-4 sm:p-5 bg-card shadow-sm">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-sm font-bold text-foreground">{t.name}</span>
                        <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{t.category}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <span className="inline-flex items-center gap-1 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          <TrendingUp size={14} /> {t.momentum}
                        </span>
                        <span className="text-sm text-muted-foreground">{t.period}</span>
                        <span className="text-sm font-semibold text-primary">Revival Score: {t.score}</span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{t.insight}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Disruption Signals */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Zap size={16} className="text-primary" />
                  <h2 className="text-base font-bold text-foreground">Disruption Signals</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                  Real-time market shifts, patent activity, supply chain changes, and viral signals that create windows of opportunity.
                </p>
                <div className="space-y-3">
                  {DISRUPTION_SIGNALS.map((s, i) => {
                    const Icon = s.icon;
                    return (
                      <div key={i} className="flex items-start gap-3 border border-border rounded-lg p-4 bg-card shadow-sm">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-muted mt-0.5">
                          <Icon size={14} className="text-primary" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-sm font-bold text-foreground">{s.label}</span>
                            <span className="text-sm text-muted-foreground">{s.time}</span>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Category Playbooks */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen size={16} className="text-primary" />
                  <h2 className="text-base font-bold text-foreground">Category Playbooks</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                  Deep-dive strategic breakdowns of high-potential verticals — competitive maps, pricing benchmarks, and entry strategies.
                </p>
                <div className="space-y-4">
                  {CATEGORY_PLAYBOOKS.map((p, i) => (
                    <div key={i} className="border border-border rounded-lg p-4 sm:p-5 bg-card shadow-sm">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-foreground">{p.title}</span>
                        <span className="text-sm font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">{p.subtitle}</span>
                      </div>
                      <p className="text-sm font-medium text-muted-foreground mb-3">{p.stats}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{p.summary}</p>
                      <button
                        onClick={() => navigate("/")}
                        className="mt-3 text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1"
                      >
                        Run your own analysis in this category <ArrowRight size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </TabsContent>

          {/* ═══ NEW RELEASES TAB ═══ */}
          <TabsContent value="releases">
            <div className="space-y-2 mb-8">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Platform updates, new capabilities, and engine improvements — organized by release date. Each entry explains what was built, the value it provides, where to find it, and what data sources power it.
              </p>
            </div>

            <div className="space-y-10">
              {releaseGroups.map((group) => (
                <div key={group.date}>
                  {/* Date header */}
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar size={14} className="text-muted-foreground" />
                    <h2 className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground">
                      {group.date}
                    </h2>
                  </div>

                  <div className="space-y-4 pl-0 sm:pl-4 border-l-2 border-border sm:ml-1.5">
                    {group.entries.map((entry, i) => {
                      const tagConfig = RELEASE_TAG_CONFIG[entry.tag];
                      return (
                        <div key={i} className="pl-4 sm:pl-6">
                          <div className="border border-border rounded-lg bg-card shadow-sm overflow-hidden">
                            {/* Title row */}
                            <div className="px-4 sm:px-5 pt-4 pb-2 flex flex-wrap items-start gap-2">
                              <Sparkles size={14} className="text-primary mt-0.5 flex-shrink-0" />
                              <h3 className="text-sm font-bold text-foreground leading-tight flex-1 min-w-0">
                                {entry.title}
                              </h3>
                              <span
                                className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full flex-shrink-0"
                                style={{ color: tagConfig.color, background: tagConfig.bg }}
                              >
                                {tagConfig.label}
                              </span>
                            </div>

                            {/* Description */}
                            <div className="px-4 sm:px-5 pb-3">
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {entry.description}
                              </p>
                            </div>

                            {/* Detail sections */}
                            <Accordion type="single" collapsible>
                              <AccordionItem value="details" className="border-t border-border">
                                <AccordionTrigger className="px-4 sm:px-5 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:no-underline">
                                  Details
                                </AccordionTrigger>
                                <AccordionContent className="px-4 sm:px-5 pb-4 space-y-4">
                                  {/* Value to User */}
                                  <div>
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                      <Sparkles size={11} className="text-primary" />
                                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-primary">Value to You</p>
                                    </div>
                                    <p className="text-sm text-foreground leading-relaxed">{entry.valueToUser}</p>
                                  </div>

                                  {/* Where to find it */}
                                  <div>
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                      <MapPin size={11} className="text-muted-foreground" />
                                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Where to Find It</p>
                                    </div>
                                    <p className="text-sm text-muted-foreground leading-relaxed">{entry.location}</p>
                                  </div>

                                  {/* Data Sources */}
                                  <div>
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                      <Database size={11} className="text-muted-foreground" />
                                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Data Sources</p>
                                    </div>
                                    <p className="text-sm text-muted-foreground leading-relaxed">{entry.dataSources}</p>
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <footer className="mt-20 pt-6 border-t border-border text-center">
        </footer>
      </main>
    </div>
  );
}
