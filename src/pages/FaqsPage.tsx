import { useState, useMemo } from "react";
import { PlatformNav } from "@/components/PlatformNav";
import { useSubscription } from "@/hooks/useSubscription";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Search, Database, Shield, BarChart3, Layers, CreditCard, Telescope, Briefcase } from "lucide-react";

interface FaqItem {
  q: string;
  a: string;
  category: string;
}

const CATEGORIES = [
  { id: "all", label: "All", icon: Layers, color: "bg-primary/10 text-primary border-primary/20" },
  { id: "platform", label: "Platform & Data", icon: Database, color: "bg-blue-500/10 text-blue-700 border-blue-500/20" },
  { id: "analysis", label: "Analysis & Scoring", icon: BarChart3, color: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" },
  { id: "eta", label: "ETA / Acquisitions", icon: Briefcase, color: "bg-amber-500/10 text-amber-700 border-amber-500/20" },
  { id: "lenses", label: "Lenses & Archetypes", icon: Telescope, color: "bg-violet-500/10 text-violet-700 border-violet-500/20" },
  { id: "privacy", label: "Privacy & Security", icon: Shield, color: "bg-rose-500/10 text-rose-700 border-rose-500/20" },
  { id: "pricing", label: "Plans & Pricing", icon: CreditCard, color: "bg-cyan-500/10 text-cyan-700 border-cyan-500/20" },
];

const CATEGORY_ACCENT: Record<string, string> = {
  platform: "border-l-blue-500",
  analysis: "border-l-emerald-500",
  eta: "border-l-amber-500",
  lenses: "border-l-violet-500",
  privacy: "border-l-rose-500",
  pricing: "border-l-cyan-500",
};

const FAQS: FaqItem[] = [
  // Platform & Data
  { category: "platform", q: "What data sources does the platform use?", a: "We aggregate data from <strong>pricing databases</strong> (historical and current market pricing), <strong>wholesale and supplier directories</strong>, <strong>online community forums</strong> and discussion threads, <strong>Google Trends</strong> and search volume data, <strong>social media virality signals</strong>, and <strong>patent filings</strong>. These sources are cross-referenced to build a multi-layered market picture — not just what's selling, but why, where demand is heading, and what supply chains look like.<br/><br/>Beyond market data, the platform also pulls <strong>real-world geographic and demographic intelligence</strong> — population, median income, business density, and regional growth rates — to ground TAM/SAM/SOM estimates in actual numbers rather than top-down guesses. For industries with regulatory complexity, an <strong>adaptive legal and regulatory layer</strong> automatically detects the category and fetches relevant data: state-by-state legal variance, active federal rulemaking, and licensing requirements. Non-regulated categories skip this entirely — zero overhead." },
  { category: "platform", q: "How does the platform handle regulated industries?", a: "The platform automatically detects when an analysis falls into a <strong>regulated category</strong> — such as cannabis/THC, healthcare, fintech, food &amp; beverage, alcohol, or firearms — and pulls in relevant legal landscape data as part of the intelligence pipeline.<br/><br/>This includes <strong>state-by-state legal variance</strong> (e.g., where a product is legal vs. restricted vs. prohibited), <strong>active federal rulemaking</strong> and proposed regulations, and <strong>licensing and compliance requirements</strong> specific to the category. This regulatory context is then injected into <strong>Stress Test</strong> Red Team arguments and <strong>Pitch Deck</strong> go-to-market recommendations so the AI cites real legal barriers and state-level nuances — not generic 'regulatory risk' hand-waving.<br/><br/>For categories without meaningful regulatory complexity (e.g., consumer electronics, fashion, SaaS), this layer is skipped entirely with zero extra latency or cost." },
  { category: "platform", q: "Which AI models power the analysis?", a: "Our pipeline uses multiple advanced AI models purpose-built for each stage of the analysis. One model handles market research synthesis, another generates strategic claims, and a separate adversarial model stress-tests those claims. All outputs include confidence tags (<strong>Verified</strong>, <strong>Modeled</strong>, or <strong>Assumption</strong>) so you always know the basis of each insight." },
  { category: "platform", q: "How do the different analysis modes work?", a: "Each mode — <strong>Product</strong>, <strong>Service</strong>, and <strong>Business Model</strong> — runs its own tailored pipeline through the same 5-step journey (<strong>Selection → Intelligence Report → Disrupt → Stress Test → Pitch Deck</strong>). <strong>Product mode</strong> focuses on physical goods: sourcing costs, supply chain mapping, patent landscape, and community demand signals. In <strong>Service Mode</strong>, the focus shifts from product details to analyzing customer journey friction, operational workflows, and technology use. In <strong>Business Model Mode</strong>, the process expands into a full strategic teardown covering revenue models, cost structures, competitive advantages, and potential disruption risks. Each mode produces its own customized <strong>Intelligence Report</strong>, adversarial <strong>Stress Test</strong>, and investor-ready <strong>Pitch Deck</strong>." },
  { category: "platform", q: "Can I export my reports?", a: "Yes. You can export full <strong>Intelligence Reports</strong>, <strong>Pitch Decks</strong>, and <strong>Stress Test</strong> results as formatted PDFs. Exports include all charts, scores, claim tags, and strategic recommendations. PDFs are generated client-side for instant download — no waiting for email delivery. <strong>Pro</strong> and <strong>Disruptor</strong> tier users get unlimited exports." },

  // Analysis & Scoring
  { category: "analysis", q: "How is the Revival Score calculated?", a: "The Revival Score (1–10) is a weighted composite of five signals: (1) <strong>Market demand</strong> — search volume, trend trajectory, and community buzz; (2) <strong>Supply chain feasibility</strong> — availability of manufacturers, suppliers, and raw materials; (3) <strong>Community sentiment</strong> — positive vs. negative discussion ratio and engagement depth; (4) <strong>Trend momentum</strong> — whether interest is accelerating, plateauing, or declining over 6–12 months; (5) <strong>Competitive density</strong> — how many active competitors exist and how differentiated they are. A score of 8+ indicates strong revival potential with clear market opportunity." },
  { category: "analysis", q: "What does 'Claim Tagging' mean?", a: "Every insight in your report carries one of three transparency labels: <strong>Verified</strong> (backed by real, traceable data like pricing records, patent filings, or confirmed supplier listings), <strong>Modeled</strong> (derived from AI pattern analysis across multiple data points — directionally reliable but not directly sourced), or <strong>Assumption</strong> (a strategic hypothesis that requires your own validation before acting on it). This system ensures you never confuse an AI-generated hypothesis with a hard fact." },
  { category: "analysis", q: "What are Root Hypotheses?", a: "Root Hypotheses are the <strong>2-4 most fundamental structural constraints</strong> shaping the domain you analyzed. They represent Tier 1 forces — the constraints that, if resolved, would create the most leverage.<br/><br/>Each hypothesis includes a <strong>dominance score</strong> (combining leverage × impact × evidence quality × fragility), a <strong>causal chain</strong> showing how the constraint propagates, and <strong>downstream implications</strong>. The Strategic Archetype re-ranks these based on your profile — an Operator sees different priorities than a Venture Growth strategist, even with identical underlying data." },
  { category: "analysis", q: "What is 'Challenge This Reasoning'?", a: "The <strong>Challenge This Reasoning</strong> panel appears at the bottom of the Reasoning tab on every analysis. It lets you interrogate the analysis — ask why a constraint ranked highest, what happens if a key assumption is wrong, or request a re-evaluation from a different perspective.<br/><br/>This is not a generic chatbot. Every response references <strong>specific hypotheses, causal chains, evidence mixes, and dominance scores</strong> from your analysis. Quick-action buttons suggest the most relevant questions based on your data, or you can type free-form queries. Responses stream in real-time with full markdown formatting." },

  // Lenses & Archetypes
  { category: "lenses", q: "What is an Analysis Lens?", a: "An <strong>Analysis Lens</strong> controls <em>how</em> your results are evaluated and scored — it doesn't change what data is collected, but reframes how it's interpreted. Think of it as a strategic perspective applied on top of the raw intelligence.<br/><br/><strong>Default Lens</strong> — explores disruption potential and innovation opportunities. Best for brainstorming and discovering what's possible.<br/><strong>ETA Acquisition Lens</strong> — evaluates everything from an ownership perspective: value durability, operational leverage, defensibility, and realistic improvement pathways. Ideal for investors and acquirers.<br/><strong>Custom Lens</strong> — you define the priorities, risk tolerance, time horizon, and constraints. The AI weights all scoring and recommendations to match your specific goals.<br/><br/>The lens applies across all pipeline steps (Intel → Disrupt → Stress Test → Pitch) and changes <strong>interpretation, not data</strong>. You can switch lenses at any time from your Workspace." },
  { category: "lenses", q: "How do I create or switch lenses?", a: "Go to your <strong>Workspace</strong> — the lens configuration banner is right at the top. You can instantly switch between Default and ETA Acquisition with one click, or hit <strong>Create Lens</strong> to build a custom one. When creating a custom lens, you define your primary objective, time horizon, risk tolerance, constraints, and evaluation priorities. The AI then reweights all scoring and recommendations to align with your goals. Your active lens persists across all new analyses until you change it." },
  { category: "lenses", q: "What is a Strategic Archetype?", a: "A <strong>Strategic Archetype</strong> controls how analysis results are <em>ranked and weighted after generation</em> — it doesn't change what data exists, but shifts which constraints are prioritized and how hypotheses are scored.<br/><br/>Five archetypes are available: <strong>Operator</strong> (cost discipline, reliability), <strong>ETA Acquirer</strong> (capital discipline, acquisition value), <strong>Venture Growth</strong> (speed & scale), <strong>Bootstrapped Founder</strong> (capital-constrained, revenue focus), and <strong>Enterprise Strategist</strong> (defensibility, long horizons).<br/><br/>Unlike a Lens (which changes the AI's reasoning at generation time and requires a re-run), the Archetype re-ranks hypotheses <strong>instantly</strong> using a dominance scoring engine — no re-run required." },

  // Privacy & Security
  { category: "privacy", q: "Is my data private?", a: "Yes. Every analysis is scoped to your authenticated account using <strong>row-level security</strong> — meaning no other user can see, access, or query your data. All data is encrypted in transit (<strong>TLS 1.2+</strong>) and at rest (<strong>AES-256</strong>). We do not sell, share, or use your analyses to train models. You can delete any saved project at any time, and it's permanently removed from our database." },

  // Plans & Pricing
  { category: "pricing", q: "How many analyses can I run?", a: "<strong>Explorer</strong> (Free) users get 10 analyses total. <strong>Builder</strong> ($25/mo) users get 75 analyses per month. <strong>Disruptor</strong> ($59/mo) users get unlimited analyses with priority processing and access to advanced AI models for deeper strategic insights. Bonus analyses earned through referrals are added on top of your tier limit. Unused monthly analyses do not roll over. Visit the Pricing page for full tier comparisons." },
  { category: "pricing", q: "What's the difference between Product, Service, and Business Model modes?", a: "Each mode is optimized for a different input type. <strong>Product mode</strong> analyzes physical goods — sourcing, patents, retail pricing. <strong>Service mode</strong> focuses on customer journey friction and operational leverage. <strong>Business Model mode</strong> performs a full strategic teardown of revenue, costs, and competitive moats. See 'How do the different analysis modes work?' above for the full pipeline details." },

  // ETA / Acquisitions
  { category: "eta", q: "What is the ETA Acquisition Lens?", a: "The <strong>ETA (Entrepreneur Through Acquisition) Lens</strong> is purpose-built for people evaluating small businesses to buy — typically $500K–$5M purchase price, often using <strong>SBA 7(a) financing</strong>. When activated, every part of the analysis shifts from \"how to disrupt this industry\" to \"<strong>should I buy this business and how do I improve it?</strong>\"<br/><br/>Specifically, it adds: a <strong>Deal Economics Calculator</strong> (SBA loan math, DSCR, valuation multiples), an <strong>Owner Dependency Assessment</strong> (transition risk scoring, key-person identification), a <strong>100-Day Ownership Playbook</strong> (phased actions for a new owner), <strong>Addback Scrutiny</strong> (challenging seller-claimed addbacks), a <strong>Stagnation Diagnostic</strong> (why the business stopped growing), and targeted <strong>Due Diligence Questions</strong> to ask the broker.<br/><br/>Activate it from your Workspace — one click." },
  { category: "eta", q: "Can I upload a CIM (Confidential Information Memorandum)?", a: "Yes. When you start a <strong>Business Model</strong> analysis, you can upload documents — including CIMs, P&Ls, tax returns, or broker packages. The platform extracts key financials, operational details, and claims from the document, then uses that extracted data as <strong>primary evidence</strong> throughout the analysis.<br/><br/>With the <strong>ETA Lens</strong> active, the extraction engine specifically looks for: <strong>SDE (Seller's Discretionary Earnings)</strong>, claimed addbacks, revenue concentration data, owner involvement details, and staffing structure. Anything the CIM claims is cross-referenced against the AI's independent assessment — so you get a second opinion on every broker claim." },
  { category: "eta", q: "What is the Deal Economics Calculator?", a: "The <strong>Deal Economics Calculator</strong> appears automatically when the ETA Lens is active. Enter the <strong>asking price</strong>, <strong>SDE</strong>, and <strong>revenue</strong> — it instantly computes:<br/><br/>• <strong>SBA 7(a) loan terms</strong> — monthly payment, annual debt service, down payment<br/>• <strong>DSCR (Debt Service Coverage Ratio)</strong> — does the business cash-flow enough to cover the loan? SBA requires ≥1.25x<br/>• <strong>Valuation sanity check</strong> — SDE multiple vs. industry norms (below 3x = strong value, above 4.5x = premium)<br/>• <strong>Sensitivity analysis</strong> — what happens to DSCR if revenue drops 10%, 20%, 30%?<br/>• <strong>Owner take-home</strong> — your actual income after debt service<br/><br/>Adjustable inputs include down payment percentage (10–25%), interest rate (9.5–12%), and loan term (7–25 years)." },
  { category: "eta", q: "What is the Stagnation Diagnostic?", a: "Many businesses for sale are <strong>stagnant or declining</strong> — that's often <em>why</em> the owner is selling. The <strong>Stagnation Diagnostic</strong> (ETA Lens only) identifies the root causes:<br/><br/>• <strong>Revenue trajectory</strong> — is the business growing, flat, or shrinking? What changed?<br/>• <strong>Competitive erosion</strong> — have new entrants or substitutes eaten market share?<br/>• <strong>Owner fatigue signals</strong> — has the owner stopped investing, marketing, or innovating?<br/>• <strong>Structural decay</strong> — are there systemic issues (deferred maintenance, outdated systems, lost key employees) that accumulated over time?<br/>• <strong>Market shift</strong> — has the customer base, pricing environment, or demand pattern fundamentally changed?<br/><br/>Each factor includes a <strong>reversibility score</strong> — some stagnation causes are easily fixable by a new owner (owner fatigue), while others may be structural and harder to reverse (market shift)." },
  { category: "eta", q: "What is Addback Scrutiny?", a: "CIM financials almost always include <strong>addbacks</strong> — expenses the broker claims a new owner wouldn't incur (owner's salary, personal expenses run through the business, one-time costs). These inflate SDE and make the business look more profitable than it is.<br/><br/>The <strong>Addback Scrutiny</strong> panel (ETA Lens only) evaluates each claimed addback and assigns a <strong>confidence rating</strong>:<br/>• <strong>Legitimate</strong> — clearly a personal expense or truly one-time cost<br/>• <strong>Questionable</strong> — could be legitimate but needs verification (e.g., \"consulting fees\" to a family member)<br/>• <strong>Suspicious</strong> — common broker inflation pattern; request documentation<br/><br/>It also estimates the <strong>adjusted SDE</strong> after removing questionable and suspicious addbacks — giving you a more conservative (and realistic) valuation basis." },
  { category: "eta", q: "How does the 100-Day Ownership Playbook work?", a: "When the ETA Lens is active, the analysis generates a <strong>phased transition plan</strong> specifically for a new owner — not generic \"disruption\" recommendations. The five phases are:<br/><br/>• <strong>Week 1-2: Listen & Learn</strong> — build relationships, understand operations from the inside, don't change anything yet<br/>• <strong>Month 1: Quick Wins</strong> — low-risk, high-impact improvements that build credibility with staff and customers<br/>• <strong>Month 2-3: Process Optimization</strong> — fix operational friction, pricing gaps, and efficiency losses<br/>• <strong>Month 3-6: Structural Changes</strong> — implement model changes, new revenue streams, technology upgrades<br/>• <strong>Month 6-12: Scale & Optimize</strong> — scale proven improvements, explore expansion<br/><br/>Each phase includes specific actions, a success milestone, and risks to watch for. The playbook is derived from the analysis findings — not a generic template." },
  { category: "eta", q: "Can I compare multiple businesses side by side?", a: "Yes. Save multiple Business Model analyses to your <strong>Workspace</strong>, then use the <strong>comparison view</strong> in the Portfolio page to evaluate them side by side. When the ETA Lens is active, the comparison dimensions include: <strong>Owner Dependency</strong>, <strong>Improvement Potential</strong>, <strong>Customer Concentration</strong>, <strong>Cash Flow Stability</strong>, and <strong>Operational Complexity</strong> — the exact factors that matter for acquisition decisions." },
  { category: "eta", q: "What due diligence questions does the platform generate?", a: "The <strong>Ask the Broker / Seller</strong> section (ETA Lens only) generates 5-8 specific questions that CIMs typically <strong>don't answer or answer evasively</strong>. These are tailored to the specific business — not generic checklists. Examples include questions about customer concentration specifics, owner involvement in sales, staff turnover history, deferred maintenance or capex, lease terms and transferability, and the real reason for selling.<br/><br/>These questions are designed to surface <strong>deal-killing information</strong> early — before you've invested significant time and money in due diligence." },
];

export default function FaqsPage() {
  const { tier } = useSubscription();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const filtered = useMemo(() => {
    return FAQS.filter((faq) => {
      const matchesCategory = activeCategory === "all" || faq.category === activeCategory;
      const matchesSearch = !search || faq.q.toLowerCase().includes(search.toLowerCase()) || faq.a.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [search, activeCategory]);

  const categoryCount = (id: string) => id === "all" ? FAQS.length : FAQS.filter(f => f.category === id).length;

  return (
    <div className="min-h-screen bg-background">
      <PlatformNav tier={tier} />

      <div className="border-b border-border bg-card">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Support</p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-tight mb-1.5">
            Frequently Asked Questions
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed mb-4">
            Everything you need to know about the platform, our methodology, data privacy, and pricing.
          </p>

          {/* Search */}
          <div className="relative max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions…"
              className="pl-8 h-9 text-sm"
            />
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">


        {/* Category pills */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            const catColor = cat.color;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all border ${
                  isActive
                    ? catColor
                    : "bg-card text-muted-foreground border-border hover:text-foreground"
                }`}
              >
                <Icon size={11} />
                {cat.label}
                <span className={`text-[10px] ml-0.5 opacity-60`}>
                  {categoryCount(cat.id)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Results count */}
        {(search || activeCategory !== "all") && (
          <p className="text-[11px] text-muted-foreground mb-3">
            {filtered.length} {filtered.length === 1 ? "result" : "results"}
            {search && <> for "<span className="font-semibold text-foreground">{search}</span>"</>}
            {activeCategory !== "all" && <> in <span className="font-semibold text-foreground">{CATEGORIES.find(c => c.id === activeCategory)?.label}</span></>}
          </p>
        )}

        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <Search size={28} className="mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">No matching questions found.</p>
            <button onClick={() => { setSearch(""); setActiveCategory("all"); }} className="text-xs text-primary font-semibold mt-1.5 hover:underline">
              Clear filters
            </button>
          </div>
        ) : (
          <Accordion type="single" collapsible defaultValue="faq-0" className="space-y-1.5">
            {filtered.map((faq, i) => {
              const catMeta = CATEGORIES.find(c => c.id === faq.category);
              const accentClass = CATEGORY_ACCENT[faq.category] || "border-l-primary";
              return (
                <AccordionItem key={`${faq.category}-${i}`} value={`faq-${i}`} className={`border border-border border-l-[3px] ${accentClass} rounded-md px-3.5 sm:px-4 bg-card`}>
                  <AccordionTrigger className="text-[13px] font-semibold text-foreground py-3 hover:no-underline text-left">
                    <div className="flex items-center gap-2.5 w-full pr-2">
                      <span className="flex-1">{faq.q}</span>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded flex-shrink-0 border ${catMeta?.color || "bg-muted text-muted-foreground"}`}>
                        {catMeta?.label}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-[13px] text-muted-foreground leading-relaxed pb-3 pt-0">
                    <span dangerouslySetInnerHTML={{ __html: faq.a }} />
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}

        <footer className="mt-12 pt-4 border-t border-border text-center" />
      </main>
    </div>
  );
}
