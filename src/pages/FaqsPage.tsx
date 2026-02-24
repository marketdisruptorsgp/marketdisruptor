import { PlatformNav } from "@/components/PlatformNav";
import { useSubscription } from "@/hooks/useSubscription";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQS = [
  { q: "What data sources does the platform use?", a: "We aggregate data from pricing databases (historical and current market pricing), wholesale and supplier directories, online community forums and discussion threads, Google Trends and search volume data, social media virality signals, and patent filings. These sources are cross-referenced to build a multi-layered market picture — not just what's selling, but why, where demand is heading, and what supply chains look like." },
  { q: "Which AI models power the analysis?", a: "Our pipeline uses multiple advanced AI models purpose-built for each stage of the analysis. One model handles market research synthesis, another generates strategic claims, and a separate adversarial model stress-tests those claims. All outputs include confidence tags (Verified, Modeled, or Assumption) so you always know the basis of each insight." },
  { q: "How do the different analysis modes work?", a: "Each mode — Product, Service, and Business Model — runs its own tailored pipeline through the same 5-step journey (Selection → Intelligence Report → Disrupt → Stress Test → Pitch Deck). Product mode focuses on physical goods: sourcing costs, supply chain mapping, patent landscape, and community demand signals. Service mode skips product-specific steps and instead deconstructs customer journey friction, operational workflows, and technology leverage. Business Model mode performs a full strategic teardown across revenue models, cost structures, competitive moats, and disruption vulnerabilities. Every mode generates its own tailored Intelligence Report, adversarial Stress Test, and investor-ready Pitch Deck." },
  { q: "Is my data private?", a: "Yes. Every analysis is scoped to your authenticated account using row-level security — meaning no other user can see, access, or query your data. All data is encrypted in transit (TLS 1.2+) and at rest (AES-256). We do not sell, share, or use your analyses to train models. You can delete any saved project at any time, and it's permanently removed from our database." },
  { q: "How is the Revival Score calculated?", a: "The Revival Score (1–10) is a weighted composite of five signals: (1) Market demand — search volume, trend trajectory, and community buzz; (2) Supply chain feasibility — availability of manufacturers, suppliers, and raw materials; (3) Community sentiment — positive vs. negative discussion ratio and engagement depth; (4) Trend momentum — whether interest is accelerating, plateauing, or declining over 6–12 months; (5) Competitive density — how many active competitors exist and how differentiated they are. A score of 8+ indicates strong revival potential with clear market opportunity." },
  { q: "What does 'Claim Tagging' mean?", a: "Every insight in your report carries one of three transparency labels: Verified (backed by real, traceable data like pricing records, patent filings, or confirmed supplier listings), Modeled (derived from AI pattern analysis across multiple data points — directionally reliable but not directly sourced), or Assumption (a strategic hypothesis that requires your own validation before acting on it). This system ensures you never confuse an AI-generated hypothesis with a hard fact." },
  { q: "Can I export my reports?", a: "Yes. You can export full Intelligence Reports, Pitch Decks, and Stress Test results as formatted PDFs. Exports include all charts, scores, claim tags, and strategic recommendations. PDFs are generated client-side for instant download — no waiting for email delivery. Pro and Disruptor tier users get unlimited exports." },
  { q: "What's the difference between Product, Service, and Business Model modes?", a: "Each mode is optimized for a different input type. Product mode analyzes physical goods — sourcing, patents, retail pricing. Service mode focuses on customer journey friction and operational leverage. Business Model mode performs a full strategic teardown of revenue, costs, and competitive moats. See 'How do the different analysis modes work?' above for the full pipeline details." },
  { q: "How many analyses can I run?", a: "Explorer (Free) users get 10 analyses total. Builder ($25/mo) users get 75 analyses per month. Disruptor ($59/mo) users get unlimited analyses with priority processing and access to advanced AI models for deeper strategic insights. Bonus analyses earned through referrals are added on top of your tier limit. Unused monthly analyses do not roll over. Visit the Pricing page for full tier comparisons." },
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
