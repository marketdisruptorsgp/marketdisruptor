import { PlatformNav } from "@/components/PlatformNav";
import { useSubscription } from "@/hooks/useSubscription";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQS = [
  { q: "What data sources does the platform use?", a: "We aggregate data from <strong>pricing databases</strong> (historical and current market pricing), <strong>wholesale and supplier directories</strong>, <strong>online community forums</strong> and discussion threads, <strong>Google Trends</strong> and search volume data, <strong>social media virality signals</strong>, and <strong>patent filings</strong>. These sources are cross-referenced to build a multi-layered market picture — not just what's selling, but why, where demand is heading, and what supply chains look like.<br/><br/>Beyond market data, the platform also pulls <strong>real-world geographic and demographic intelligence</strong> — population, median income, business density, and regional growth rates — to ground TAM/SAM/SOM estimates in actual numbers rather than top-down guesses. For industries with regulatory complexity, an <strong>adaptive legal and regulatory layer</strong> automatically detects the category and fetches relevant data: state-by-state legal variance, active federal rulemaking, and licensing requirements. Non-regulated categories skip this entirely — zero overhead." },
  { q: "How does the platform handle regulated industries?", a: "The platform automatically detects when an analysis falls into a <strong>regulated category</strong> — such as cannabis/THC, healthcare, fintech, food &amp; beverage, alcohol, or firearms — and pulls in relevant legal landscape data as part of the intelligence pipeline.<br/><br/>This includes <strong>state-by-state legal variance</strong> (e.g., where a product is legal vs. restricted vs. prohibited), <strong>active federal rulemaking</strong> and proposed regulations, and <strong>licensing and compliance requirements</strong> specific to the category. This regulatory context is then injected into <strong>Stress Test</strong> Red Team arguments and <strong>Pitch Deck</strong> go-to-market recommendations so the AI cites real legal barriers and state-level nuances — not generic 'regulatory risk' hand-waving.<br/><br/>For categories without meaningful regulatory complexity (e.g., consumer electronics, fashion, SaaS), this layer is skipped entirely with zero extra latency or cost." },
  { q: "Which AI models power the analysis?", a: "Our pipeline uses multiple advanced AI models purpose-built for each stage of the analysis. One model handles market research synthesis, another generates strategic claims, and a separate adversarial model stress-tests those claims. All outputs include confidence tags (<strong>Verified</strong>, <strong>Modeled</strong>, or <strong>Assumption</strong>) so you always know the basis of each insight." },
  { q: "How do the different analysis modes work?", a: "Each mode — <strong>Product</strong>, <strong>Service</strong>, and <strong>Business Model</strong> — runs its own tailored pipeline through the same 5-step journey (<strong>Selection → Intelligence Report → Disrupt → Stress Test → Pitch Deck</strong>). <strong>Product mode</strong> focuses on physical goods: sourcing costs, supply chain mapping, patent landscape, and community demand signals. In <strong>Service Mode</strong>, the focus shifts from product details to analyzing customer journey friction, operational workflows, and technology use. In <strong>Business Model Mode</strong>, the process expands into a full strategic teardown covering revenue models, cost structures, competitive advantages, and potential disruption risks. Each mode produces its own customized <strong>Intelligence Report</strong>, adversarial <strong>Stress Test</strong>, and investor-ready <strong>Pitch Deck</strong>." },
  { q: "Is my data private?", a: "Yes. Every analysis is scoped to your authenticated account using <strong>row-level security</strong> — meaning no other user can see, access, or query your data. All data is encrypted in transit (<strong>TLS 1.2+</strong>) and at rest (<strong>AES-256</strong>). We do not sell, share, or use your analyses to train models. You can delete any saved project at any time, and it's permanently removed from our database." },
  { q: "How is the Revival Score calculated?", a: "The Revival Score (1–10) is a weighted composite of five signals: (1) <strong>Market demand</strong> — search volume, trend trajectory, and community buzz; (2) <strong>Supply chain feasibility</strong> — availability of manufacturers, suppliers, and raw materials; (3) <strong>Community sentiment</strong> — positive vs. negative discussion ratio and engagement depth; (4) <strong>Trend momentum</strong> — whether interest is accelerating, plateauing, or declining over 6–12 months; (5) <strong>Competitive density</strong> — how many active competitors exist and how differentiated they are. A score of 8+ indicates strong revival potential with clear market opportunity." },
  { q: "What does 'Claim Tagging' mean?", a: "Every insight in your report carries one of three transparency labels: <strong>Verified</strong> (backed by real, traceable data like pricing records, patent filings, or confirmed supplier listings), <strong>Modeled</strong> (derived from AI pattern analysis across multiple data points — directionally reliable but not directly sourced), or <strong>Assumption</strong> (a strategic hypothesis that requires your own validation before acting on it). This system ensures you never confuse an AI-generated hypothesis with a hard fact." },
  { q: "Can I export my reports?", a: "Yes. You can export full <strong>Intelligence Reports</strong>, <strong>Pitch Decks</strong>, and <strong>Stress Test</strong> results as formatted PDFs. Exports include all charts, scores, claim tags, and strategic recommendations. PDFs are generated client-side for instant download — no waiting for email delivery. <strong>Pro</strong> and <strong>Disruptor</strong> tier users get unlimited exports." },
  { q: "What's the difference between Product, Service, and Business Model modes?", a: "Each mode is optimized for a different input type. <strong>Product mode</strong> analyzes physical goods — sourcing, patents, retail pricing. <strong>Service mode</strong> focuses on customer journey friction and operational leverage. <strong>Business Model mode</strong> performs a full strategic teardown of revenue, costs, and competitive moats. See 'How do the different analysis modes work?' above for the full pipeline details." },
  { q: "How many analyses can I run?", a: "<strong>Explorer</strong> (Free) users get 10 analyses total. <strong>Builder</strong> ($25/mo) users get 75 analyses per month. <strong>Disruptor</strong> ($59/mo) users get unlimited analyses with priority processing and access to advanced AI models for deeper strategic insights. Bonus analyses earned through referrals are added on top of your tier limit. Unused monthly analyses do not roll over. Visit the Pricing page for full tier comparisons." },
  { q: "What is an Analysis Lens?", a: "An <strong>Analysis Lens</strong> controls <em>how</em> your results are evaluated and scored — it doesn't change what data is collected, but reframes how it's interpreted. Think of it as a strategic perspective applied on top of the raw intelligence.<br/><br/><strong>Default Lens</strong> — explores disruption potential and innovation opportunities. Best for brainstorming and discovering what's possible.<br/><strong>ETA Acquisition Lens</strong> — evaluates everything from an ownership perspective: value durability, operational leverage, defensibility, and realistic improvement pathways. Ideal for investors and acquirers.<br/><strong>Custom Lens</strong> — you define the priorities, risk tolerance, time horizon, and constraints. The AI weights all scoring and recommendations to match your specific goals.<br/><br/>The lens applies across all pipeline steps (Intel → Disrupt → Stress Test → Pitch) and changes <strong>interpretation, not data</strong>. You can switch lenses at any time from your Workspace." },
  { q: "How do I create or switch lenses?", a: "Go to your <strong>Workspace</strong> — the lens configuration banner is right at the top. You can instantly switch between Default and ETA Acquisition with one click, or hit <strong>Create Lens</strong> to build a custom one. When creating a custom lens, you define your primary objective, time horizon, risk tolerance, constraints, and evaluation priorities. The AI then reweights all scoring and recommendations to align with your goals. Your active lens persists across all new analyses until you change it." },
  { q: "What is a Strategic Archetype?", a: "A <strong>Strategic Archetype</strong> controls how analysis results are <em>ranked and weighted after generation</em> — it doesn't change what data exists, but shifts which constraints are prioritized and how hypotheses are scored.<br/><br/>Five archetypes are available: <strong>Operator</strong> (cost discipline, reliability), <strong>ETA Acquirer</strong> (capital discipline, acquisition value), <strong>Venture Growth</strong> (speed & scale), <strong>Bootstrapped Founder</strong> (capital-constrained, revenue focus), and <strong>Enterprise Strategist</strong> (defensibility, long horizons).<br/><br/>Unlike a Lens (which changes the AI's reasoning at generation time and requires a re-run), the Archetype re-ranks hypotheses <strong>instantly</strong> using a dominance scoring engine — no re-run required." },
  { q: "What is 'Challenge This Reasoning'?", a: "The <strong>Challenge This Reasoning</strong> panel appears at the bottom of the Reasoning tab on every analysis. It lets you interrogate the analysis — ask why a constraint ranked highest, what happens if a key assumption is wrong, or request a re-evaluation from a different perspective.<br/><br/>This is not a generic chatbot. Every response references <strong>specific hypotheses, causal chains, evidence mixes, and dominance scores</strong> from your analysis. Quick-action buttons suggest the most relevant questions based on your data, or you can type free-form queries. Responses stream in real-time with full markdown formatting." },
  { q: "What are Root Hypotheses?", a: "Root Hypotheses are the <strong>2-4 most fundamental structural constraints</strong> shaping the domain you analyzed. They represent Tier 1 forces — the constraints that, if resolved, would create the most leverage.<br/><br/>Each hypothesis includes a <strong>dominance score</strong> (combining leverage × impact × evidence quality × fragility), a <strong>causal chain</strong> showing how the constraint propagates, and <strong>downstream implications</strong>. The Strategic Archetype re-ranks these based on your profile — an Operator sees different priorities than a Venture Growth strategist, even with identical underlying data." },
];

export default function FaqsPage() {
  const { tier } = useSubscription();

  return (
    <div className="min-h-screen bg-background">
      <PlatformNav tier={tier} />

      <div className="border-b border-border bg-card">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-4">Support</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight mb-3">
            Frequently Asked Questions
          </h1>
          <p className="text-base text-muted-foreground max-w-2xl leading-relaxed">
            Everything you need to know about the platform, our methodology, data privacy, and pricing.
          </p>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <Accordion type="single" collapsible defaultValue="faq-0" className="space-y-3">
          {FAQS.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="border border-border rounded-lg px-4 sm:px-5 bg-card shadow-sm">
              <AccordionTrigger className="text-sm font-semibold text-foreground py-4 hover:no-underline text-left">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                <span dangerouslySetInnerHTML={{ __html: faq.a }} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </main>

      <footer className="max-w-3xl mx-auto px-4 sm:px-6 py-6 border-t border-border text-center">
        <p className="text-xs">
          <a href="https://sgpcapital.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:opacity-80 transition-opacity">
            Built by SGP Capital
          </a>
        </p>
      </footer>
    </div>
  );
}
