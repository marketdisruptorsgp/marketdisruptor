import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PlatformNav } from "@/components/PlatformNav";
import { useSubscription } from "@/hooks/useSubscription";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight } from "lucide-react";

const FAQS = [
  { q: "What data sources does the platform use?", a: "We aggregate data from pricing databases (historical and current market pricing), wholesale and supplier directories, online community forums and discussion threads, Google Trends and search volume data, social media virality signals, and patent filings. These sources are cross-referenced to build a multi-layered market picture — not just what's selling, but why, where demand is heading, and what supply chains look like." },
  { q: "Which AI models power the analysis?", a: "Our pipeline uses Google Gemini and OpenAI GPT-class models for deep reasoning, claim generation, competitive analysis, and adversarial red-teaming. Each step in the pipeline is purpose-built: one model handles market research synthesis, another generates strategic claims, and a separate adversarial model stress-tests those claims. All outputs include confidence tags (Verified, Modeled, or Assumption) so you always know the basis of each insight." },
  { q: "Is my data private?", a: "Yes. Every analysis is scoped to your authenticated account using row-level security — meaning no other user can see, access, or query your data. All data is encrypted in transit (TLS 1.2+) and at rest (AES-256). We do not sell, share, or use your analyses to train models. You can delete any saved project at any time, and it's permanently removed from our database." },
  { q: "How is the Revival Score calculated?", a: "The Revival Score (1–10) is a weighted composite of five signals: (1) Market demand — search volume, trend trajectory, and community buzz; (2) Supply chain feasibility — availability of manufacturers, suppliers, and raw materials; (3) Community sentiment — positive vs. negative discussion ratio and engagement depth; (4) Trend momentum — whether interest is accelerating, plateauing, or declining over 6–12 months; (5) Competitive density — how many active competitors exist and how differentiated they are. A score of 8+ indicates strong revival potential with clear market opportunity." },
  { q: "What does 'Claim Tagging' mean?", a: "Every insight in your report carries one of three transparency labels: Verified (backed by real, traceable data like pricing records, patent filings, or confirmed supplier listings), Modeled (derived from AI pattern analysis across multiple data points — directionally reliable but not directly sourced), or Assumption (a strategic hypothesis that requires your own validation before acting on it). This system ensures you never confuse an AI-generated hypothesis with a hard fact." },
  { q: "Can I export my reports?", a: "Yes. You can export full Intelligence Reports, Pitch Decks, and Stress Test results as formatted PDFs. Exports include all charts, scores, claim tags, and strategic recommendations. PDFs are generated client-side for instant download — no waiting for email delivery. Pro and Disruptor tier users get unlimited exports." },
  { q: "What's the difference between Product, Service, and Business Model modes?", a: "Product mode analyzes physical goods — sourcing costs, retail pricing, competitor products, supply chain, and community demand. Service mode deconstructs service-based businesses — pricing models, delivery methods, competitive positioning, and customer acquisition channels. Business Model mode does a full strategic teardown — revenue streams, cost structures, value propositions, competitive moats, and disruption vulnerabilities. Each mode generates tailored reports, stress tests, and pitch materials specific to that business type." },
  { q: "How many analyses can I run?", a: "Free users get 3 analyses per month. Pro tier users get 25 analyses per month plus access to advanced features like the Stress Test and Pitch Deck generator. Disruptor tier users get unlimited analyses, priority processing, and early access to new features. Unused analyses do not roll over. Visit the Pricing page for full tier comparisons." },
];

const METHODOLOGY_STEPS = [
  { title: "Data Collection", desc: "We run deep analysis across a large subset of real-world data sources — pricing databases, wholesale directories, community forums, search trends, and viral content signals — to build comprehensive market intelligence." },
  { title: "3-Layer Deconstruction", desc: "Every market is analyzed across three layers: Supply (sourcing, manufacturing, logistics), Demand (audience segments, willingness to pay, growth signals), and Positioning (competitive landscape, differentiation opportunities)." },
  { title: "Claim Tagging & Leverage Scoring", desc: "All AI-generated insights are tagged as Verified, Modeled, or Assumption. Each assumption is scored 1–10 for strategic leverage — high-leverage assumptions are the ones most worth validating." },
  { title: "Adversarial Red Teaming", desc: "A simulated adversary stress-tests your strategy by attacking key assumptions, identifying blind spots, and pressure-testing market positioning. This is how you find weaknesses before competitors do." },
];

export default function ResourcesPage() {
  const { tier } = useSubscription();
  const location = useLocation();
  const navigate = useNavigate();

  const hashToTab: Record<string, string> = {
    "#faqs": "faqs",
    "#methodology": "methodology",
    "#market-intel": "market-intel",
  };
  const initialTab = hashToTab[location.hash] || "faqs";

  useEffect(() => {
    if (location.hash) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [location.hash]);

  return (
    <div className="min-h-screen bg-background">
      <PlatformNav tier={tier} />

      <main className="max-w-3xl mx-auto px-6 py-20">
        <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Resources</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight mb-10">
          Learn How It Works
        </h1>

        <Tabs defaultValue={initialTab}>
          <TabsList className="mb-10">
            <TabsTrigger value="faqs" className="text-sm">FAQs</TabsTrigger>
            <TabsTrigger value="methodology" className="text-sm">Methodology</TabsTrigger>
            <TabsTrigger value="market-intel" className="text-sm">Market Intel</TabsTrigger>
          </TabsList>

          <TabsContent value="faqs">
            <Accordion type="single" collapsible className="space-y-3">
              {FAQS.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border border-border rounded-lg px-5 bg-card shadow-sm">
                  <AccordionTrigger className="text-sm font-semibold text-foreground py-4 hover:no-underline">
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
            <div className="rounded-lg border border-border p-8 text-center bg-card shadow-sm">
              <p className="text-base font-semibold text-foreground mb-2">Market Intelligence Reports — Coming Soon</p>
              <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto leading-relaxed">
                We're building curated market reports that surface emerging opportunities across categories. In the meantime, run your own analysis to generate custom intelligence.
              </p>
              <button onClick={() => navigate("/")} className="btn-primary inline-flex items-center gap-2">
                Run an Analysis <ArrowRight size={14} />
              </button>
            </div>
          </TabsContent>
        </Tabs>

        <footer className="mt-20 pt-6 border-t border-border text-center">
          <p className="text-xs">
            <a href="https://sgpcapital.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:opacity-80 transition-opacity">
              Built by SGP Capital
            </a>
            <span className="text-muted-foreground"> · </span>
            <a href="mailto:steven@sgpcapital.com" className="text-muted-foreground hover:underline">steven@sgpcapital.com</a>
          </p>
        </footer>
      </main>
    </div>
  );
}
