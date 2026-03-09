import { PlatformNav } from "@/components/PlatformNav";
import { useSubscription } from "@/hooks/useSubscription";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Sparkles, Calendar, MapPin, Database } from "lucide-react";

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
    description: "Redesigned the Command Deck from a multi-tab layout to a single continuous scroll. The new layout leads with a Hero Insight Card (the single most surprising finding), followed by the Strategic Diagnosis Banner, an Intelligence Feed with tag-based filtering (New Idea / Execution / Iterate), and a clean metrics row — all visible without clicking through tabs.",
    valueToUser: "You now get the full strategic picture in one scroll instead of hunting through tabs. The hero insight hits you immediately with the biggest finding, the diagnosis explains why it matters, and the intelligence feed gives you actionable next steps — all without a single click.",
    location: "Command Deck — loads automatically as the default view for any analysis. The Intelligence Feed filter chips let you focus on New Ideas, Execution paths, or Iterate opportunities.",
    dataSources: "Strategic Engine narrative builder generates the hero insight and diagnosis. Intelligence Feed cards are sourced from insights, playbooks, detected patterns, and validation questions — each with distinct content (no duplication).",
    tag: "ui",
  },
  {
    date: "March 9, 2026",
    title: "Text Quality Engine — Consulting-Grade Sentence Generation",
    description: "Overhauled the entire text generation pipeline to produce clean, complete sentences. Removed Title Case formatting system-wide in favor of sentence case. Eliminated circular logic in strategic verdicts ('Shift from X to resolve X'). Replaced hard character truncation with intelligent sentence-boundary cutting. Stripped all internal IDs (C1, F1) from user-facing text.",
    valueToUser: "Every piece of generated text now reads like it was written by a human strategist, not assembled by a machine. Sentences are complete, grammatically correct, and never cut off mid-thought. The strategic verdict explains the actual move instead of restating the problem.",
    location: "Affects all text across the Command Deck, Intelligence Feed, Insight Graph node labels, Evidence Explorer, and PDF exports. The fix is retroactive — all existing analyses automatically render with improved text.",
    dataSources: "humanizeLabel utility performs system-wide text sanitization. Strategic Engine narrative builder (buildStrategicNarrative) constructs verdicts with anti-circular logic detection. trimAt function cuts at sentence and clause boundaries instead of arbitrary character limits.",
    tag: "engine",
  },
  {
    date: "March 9, 2026",
    title: "Intelligence Feed — Deduplicated, Evidence-Rich Cards",
    description: "Rebuilt the Intelligence Feed to eliminate the duplicate 'breakthrough' card that copied the hero insight. Pattern cards now display real structural characteristics instead of the generic 'Structural pattern detected in evidence.' Added a 'Critical Validation Question' card sourced from the kill question engine. Each card expands inline to reveal deeper context.",
    valueToUser: "Every card in the feed now provides unique, actionable information. Pattern cards tell you specifically what characteristics define the detected archetype and what transformation paths are common. The validation question gives you the single most important thing to test before committing to the strategy.",
    location: "Command Deck → Intelligence Feed section (below the Diagnosis Banner). Filter by tag: New Ideas, Execution, or Iterate. Each card expands on click to show additional detail.",
    dataSources: "Insights from the Strategic Engine (constraints, opportunities, leverage points). Transformation Playbooks from the Playbook Engine. Structural patterns from the Pattern Detection Engine with full characteristics, transformations, and risk factors. Kill questions from the Validation Step Builder.",
    tag: "intelligence",
  },

  // ── March 8, 2026 ──
  {
    date: "March 8, 2026",
    title: "Opportunity Design Engine — Morphological Search for Business Models",
    description: "Introduced a morphological search engine inspired by Fritz Zwicky's design space analysis. Instead of generating generic opportunity labels ('Resolve X to unlock growth'), the system now maps the current business configuration as coordinates in a multi-dimensional design space, identifies dimensions worth exploring, generates controlled 1–2 variable shifts, filters through four deterministic qualification gates (evidence, constraint linkage, feasibility, redundancy), and clusters results into opportunity zones.",
    valueToUser: "You now see specific dimensional shifts from your current state — for example, 'Pricing: annual → usage-based, triggered by trial friction + SMB demand signals' — instead of vague improvement suggestions. Each opportunity is traceable to specific evidence and expressed as a delta from your baseline, so you can evaluate exactly what would change and why.",
    location: "Command Deck → Strategic Intelligence → Opportunities section. Opportunity vectors also appear as nodes in the Insight Graph. The morphological search runs automatically as part of the strategic analysis pipeline when sufficient evidence exists (≥18 evidence items + leverage points identified).",
    dataSources: "Evidence from all 6 pipeline steps, normalized into 9 canonical categories. AI-assisted alternative generation uses Google Gemini 2.5 Flash via the generate-opportunity-vectors backend function. Qualification gates are fully deterministic — no AI involved in filtering or clustering.",
    tag: "engine",
  },
  {
    date: "March 8, 2026",
    title: "No-Score Architecture — Platform-Wide Qualitative Reasoning",
    description: "Completed the removal of all numeric scores, percentages, and rankings across the entire platform. Replaced with qualitative tiers (Strong / Moderate / Early) and evidence-backed structural labels.",
    valueToUser: "You no longer see misleading precision (e.g., '7.3 out of 10') that implies accuracy the system can't guarantee. Instead, every finding stands on its own reasoning and evidence.",
    location: "Affects every panel on the Command Deck, all Insight Graph node details, the Evidence Explorer, concept variant cards, and the Strategy Profile.",
    dataSources: "Evidence Engine provides structured evidence with provenance tags. Tier classification uses the Tier Discovery Engine which analyzes text patterns to classify findings as Structural (Tier 1), System (Tier 2), or Optimization (Tier 3).",
    tag: "intelligence",
  },

  // ── March 7, 2026 ──
  {
    date: "March 7, 2026",
    title: "Concept Expansion Engine — Design Space Exploration",
    description: "Added a Concept Generation / Design Space Expansion stage. The engine identifies Design Dimensions derived from upstream constraints and leverage points, then combines them to generate 10–30 structured Concept Variants with feasibility, novelty, and market readiness tiers.",
    valueToUser: "Instead of getting a single product or service idea, you now see a full design space — multiple 'how' configurations for each strategic opportunity. You can compare concept variants side-by-side and understand how different design choices create different strategic positions.",
    location: "Command Deck → New Ideas tab → Concept Expansion section. Also accessible from any Opportunity node in the Insight Graph via the 'Expand Design Space' button.",
    dataSources: "Constraints and leverage points from the Strategic Engine feed into the generate-concept-space backend function using Google Gemini 2.5 Flash with structured tool calling. Dimensions are dynamically derived — not hardcoded.",
    tag: "engine",
  },
  {
    date: "March 7, 2026",
    title: "Skeptical Intelligence Calibration",
    description: "Implemented a platform-wide skepticism bias. Default confidence starts at 0.3 (not 0.8). Single-source evidence is penalized by up to 40%. Pipeline coverage factor starts at 0.5x for incomplete pipelines.",
    valueToUser: "The system no longer tells you things are 'high confidence' just because it generated them. When it says 'Strong,' it actually means strong — backed by multiple corroborating signals from different pipeline steps.",
    location: "Visible on every insight card, evidence item, and strategic recommendation across the Command Deck, Evidence Explorer, and Insight Graph.",
    dataSources: "Cross-engine corroboration checks across all 6 pipeline steps. Confidence Engine applies deterministic scoring based on evidence density, impact thresholds, and cross-domain corroboration — not AI judgment.",
    tag: "intelligence",
  },

  // ── March 6, 2026 ──
  {
    date: "March 6, 2026",
    title: "Strategic Command Deck — Mission Control Dashboard",
    description: "Launched the Command Deck as the central strategic intelligence briefing and default landing page for all analyses. Features 'Current State Intelligence' (10–15 SWOT-style bullets), three-tab Value Pillars (New Ideas, Execution Path, Iterate), an interactive Problem Statement card, and context-aware Model Archetype benchmarks.",
    valueToUser: "You get a single-screen strategic briefing that shows what's working, what's broken, where the constraints are, and what the system recommends — without clicking through multiple tabs.",
    location: "Automatically loads as the default view when you open any analysis. Accessible from the 'Summary' toggle in the analysis header.",
    dataSources: "Strategic Engine — 11-stage sequential pipeline processing evidence from all completed analysis steps. Model Archetype benchmarks are contextually selected based on the detected business model pattern.",
    tag: "ui",
  },
  {
    date: "March 6, 2026",
    title: "Strategic Scenario Engine — What-If Simulations",
    description: "Added interactive 'What if' simulation capability. Users can adjust hypothetical variables using magnitude sliders. The engine recomputes the entire strategic model to show how the strategy adapts to each hypothesis. Scenarios are saved and tagged for side-by-side comparison.",
    valueToUser: "You can test strategic hypotheses before committing. The system recalculates the full strategic model and shows how a single change ripples through constraints, leverage points, and opportunities.",
    location: "Command Deck → Iterate tab → Scenario Lab. Saved scenarios persist in your analysis and can be revisited at any time.",
    dataSources: "Scenario inputs are user-defined. The Scenario Engine generates 'simulation' evidence that feeds back into the Strategic Intelligence Engine. Financial projections use deterministic formulas — not AI estimates.",
    tag: "engine",
  },
  {
    date: "March 6, 2026",
    title: "Evidence-Based Confidence Meter",
    description: "Replaced technical pipeline metrics with business evidence domains (Demand Signals, Cost Structure, Distribution, etc.) in the Confidence Meter. The system explicitly labels 'Strong,' 'Moderate,' and 'Limited' evidence domains.",
    valueToUser: "Instead of seeing '3/5 pipeline steps complete,' you now see which evidence domains are well-covered and which are thin. Hints tell you exactly what kind of data to add.",
    location: "Command Deck → top-right area of the strategic briefing. Updates dynamically as you complete more pipeline steps.",
    dataSources: "Evidence Engine categorizes all signals into 9 canonical domains. Domain strength is determined by evidence count, cross-step corroboration, and source diversity — not AI judgment.",
    tag: "ui",
  },

  // ── March 5, 2026 ──
  {
    date: "March 5, 2026",
    title: "11-Stage Strategic Reasoning Pipeline",
    description: "Refactored the intelligence architecture from a distributed model to a centralized 11-stage sequential reasoning pipeline with progressive thresholds ensuring each stage only fires when sufficient evidence exists.",
    valueToUser: "The system no longer generates placeholder insights when it doesn't have enough data. As you complete more steps, the reasoning deepens progressively. This prevents 'confident bullshit' where AI presents uncertain conclusions with false authority.",
    location: "Runs automatically when you click 'Run Strategic Analysis' on the Command Deck. Pipeline progress and threshold status are visible in the analysis header.",
    dataSources: "Evidence Engine extracts structured signals from all pipeline steps. Signal formation uses Jaccard similarity (>0.7) clustering. Progressive thresholds: 4 evidence → signals, 8 → constraints, 11 → drivers, 15 → leverage, 18 → opportunities, 22 → pathways.",
    tag: "pipeline",
  },
  {
    date: "March 5, 2026",
    title: "Business Model Analysis Mode — Full Strategic Teardown",
    description: "Added dedicated Business Model analysis mode with seven primary tabs and five specialized ETA (Entrepreneurship Through Acquisition) tabs for acquisition scenarios.",
    valueToUser: "If you're analyzing a business you want to buy, improve, or disrupt, you now get purpose-built strategic analysis. For acquisition buyers, the ETA tools include SBA loan modeling, adjusted SDE calculations, and a structured 100-day transformation playbook.",
    location: "Select 'Disrupt This Business Model' when creating a new analysis. ETA tabs activate automatically when acquisition-oriented language is detected.",
    dataSources: "Business Model Analysis edge function uses Google Gemini for structured extraction. Financial modeling uses deterministic formulas (SBA amortization, DSCR, debt service).",
    tag: "pipeline",
  },

  // ── March 4, 2026 ──
  {
    date: "March 4, 2026",
    title: "Multi-Lens Strategic Intelligence — Convergence Zones",
    description: "Implemented a shared-model orchestration architecture that analyzes through Product, Service, and Business Model lenses simultaneously. A Convergence Engine detects Strategic Convergence Zones when 3+ lenses identify the same high-leverage point.",
    valueToUser: "When multiple lenses independently identify the same leverage point, that convergence is a much stronger signal. These convergence zones are the highest-confidence opportunities because they're validated from three independent analytical perspectives.",
    location: "Command Deck → convergence indicator on leverage points and opportunities. Lens Intelligence toolkit accessible from the Iterate tab.",
    dataSources: "Lens Orchestrator runs three parallel analytical passes using shared evidence. Convergence detection uses set intersection of leverage point IDs across lenses.",
    tag: "intelligence",
  },
  {
    date: "March 4, 2026",
    title: "Insight Graph — Interactive Reasoning Map",
    description: "Built an evidence-first interactive graph visualizing the causal chain from raw evidence → signals → constraints → drivers → leverage points → opportunities → pathways. Cytoscape-powered rendering with dagre layout.",
    valueToUser: "You can visually trace any strategic recommendation back to the raw evidence that supports it. This makes the reasoning transparent and auditable — you're not trusting a black box.",
    location: "Accessible via the 'Insight Graph' toggle in the analysis header. Also reachable from any strategic insight card via 'View in Graph.'",
    dataSources: "Graph nodes from canonical Evidence objects. Strategic insight nodes from the 11-stage pipeline. Edge weights determined by evidence ID overlap and Jaccard similarity.",
    tag: "ui",
  },

  // ── March 3, 2026 ──
  {
    date: "March 3, 2026",
    title: "Tier Discovery System — Structural Depth Classification",
    description: "Implemented the Three-Tier First Principles Innovation Model classifying all insights by structural depth: Tier 1 (Structural), Tier 2 (System), Tier 3 (Optimization). Tier progression is gated by evidence density.",
    valueToUser: "The system helps you focus on the right level. Tier 1 insights (revenue models, business architecture) have 10x more strategic impact than Tier 3 (UX tweaks). This prevents optimizing marketing when the business model itself is broken.",
    location: "Visible on every insight card in the Command Deck and Insight Graph. Tier badges appear next to findings and determine their visual hierarchy.",
    dataSources: "Tier Discovery Engine analyzes text patterns and keyword signatures to classify findings. Tier progression gates require minimum evidence density per tier before surfacing deeper insights.",
    tag: "intelligence",
  },
  {
    date: "March 3, 2026",
    title: "Automated Pipeline Orchestrator",
    description: "Built an automated orchestrator that sequentially triggers all foundational and deep reasoning steps (Disrupt, Redesign, Stress Test, Pitch) when a new analysis is started. Real-time progress tracking on the Command Deck.",
    valueToUser: "You no longer need to manually click through each pipeline step. Start an analysis and the system automatically runs all steps, showing live progress. When complete, the full strategic intelligence model is ready.",
    location: "Activates automatically when a new analysis is created. Progress Banner on the Command Deck tracks completion. Triggers a final strategic recompute once all steps finish.",
    dataSources: "Pipeline Orchestrator (usePipelineOrchestrator.ts) invokes 4 edge functions sequentially. Each function contributes structured evidence to the Strategic Engine.",
    tag: "pipeline",
  },

  // ── March 2, 2026 ──
  {
    date: "March 2, 2026",
    title: "Evidence Engine — Structured Signal Extraction",
    description: "Built the foundational Evidence Engine that extracts, normalizes, and categorizes structured signals from all pipeline steps into 9 canonical evidence categories with provenance tracking.",
    valueToUser: "Every insight the system generates can be traced back to specific, categorized evidence. No more mysterious AI outputs — you can see exactly what data informed each recommendation and how it was classified.",
    location: "Evidence feeds into every downstream component: Command Deck, Insight Graph, Confidence Meter, and all strategic reasoning stages. Evidence Explorer provides direct access to browse all extracted evidence.",
    dataSources: "Extracts from: product analysis data, first-principles deconstruction, redesign concepts, stress test results, pitch deck synthesis, governed analysis data, and business model analysis. Each evidence item carries source attribution, confidence tier, and category classification.",
    tag: "engine",
  },
  {
    date: "March 2, 2026",
    title: "Platform Foundation — Analysis Workspace & Navigation",
    description: "Established the core platform architecture: five-step analytical journey (Understand, Deconstruct, Reimagine, Stress Test, Pitch), persistent workspace navigation, and the analysis context system for state management across all pipeline steps.",
    valueToUser: "A structured, guided workflow that takes you from initial market understanding through strategic deconstruction, reimagination, adversarial testing, and finally pitch-ready synthesis. Every step builds on the last.",
    location: "The workspace sidebar shows the five numbered steps. Analysis header provides navigation between Summary (Command Deck) and Insight Graph views. All analysis state persists across sessions.",
    dataSources: "Analysis Context (AnalysisContext.tsx) manages state. Data persistence via Lovable Cloud with row-level security. Step data saved via merge_analysis_step database function.",
    tag: "infrastructure",
  },
];

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

export default function ReleasesPage() {
  const { tier } = useSubscription();
  const releaseGroups = groupByDate(RELEASES);

  return (
    <div className="min-h-screen bg-background">
      <PlatformNav tier={tier} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <p className="text-sm font-bold uppercase tracking-widest text-primary mb-3">Resources</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight mb-4">
          New Releases
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed mb-10 max-w-2xl">
          Platform updates, new capabilities, and engine improvements — organized by release date.
          Each entry explains what was built, the value it provides, where to find it, and what data sources power it.
        </p>

        <div className="space-y-10">
          {releaseGroups.map((group) => (
            <div key={group.date}>
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

                        <div className="px-4 sm:px-5 pb-3">
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {entry.description}
                          </p>
                        </div>

                        <Accordion type="single" collapsible>
                          <AccordionItem value="details" className="border-t border-border">
                            <AccordionTrigger className="px-4 sm:px-5 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:no-underline">
                              Details
                            </AccordionTrigger>
                            <AccordionContent className="px-4 sm:px-5 pb-4 space-y-4">
                              <div>
                                <div className="flex items-center gap-1.5 mb-1.5">
                                  <Sparkles size={11} className="text-primary" />
                                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-primary">Value to You</p>
                                </div>
                                <p className="text-sm text-foreground leading-relaxed">{entry.valueToUser}</p>
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5 mb-1.5">
                                  <MapPin size={11} className="text-muted-foreground" />
                                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Where to Find It</p>
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed">{entry.location}</p>
                              </div>
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
      </main>
    </div>
  );
}
