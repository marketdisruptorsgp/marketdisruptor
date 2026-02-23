import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PlatformNav } from "@/components/PlatformNav";
import { useSubscription } from "@/hooks/useSubscription";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight } from "lucide-react";

const FAQS = [
  { q: "What data sources does the platform use?", a: "We scrape real-time data from eBay sold listings, Etsy trends, Reddit community discussions, TikTok viral signals, Google search trends, and wholesale directories like Alibaba." },
  { q: "Which AI models power the analysis?", a: "Our pipeline uses advanced language models for deep reasoning, claim generation, and adversarial validation. All outputs are tagged with confidence levels." },
  { q: "Is my data private?", a: "Yes. All analyses are scoped to your account using row-level security. Your data is encrypted in transit and at rest, and is never shared with other users." },
  { q: "How is the Revival Score calculated?", a: "The Revival Score (1–10) is a composite metric based on market demand signals, supply chain feasibility, community sentiment, trend momentum, and competitive positioning." },
  { q: "What does 'Claim Tagging' mean?", a: "Every insight in your report is tagged as Verified (backed by real data), Modeled (derived from AI analysis), or Assumption (requires further validation). This helps you know what to trust." },
  { q: "Can I export my reports?", a: "Yes. Intelligence reports, pitch decks, and stress tests can all be exported as PDFs directly from the platform." },
  { q: "What's the difference between Product, Service, and Business Model modes?", a: "Product mode analyzes physical goods. Service mode deconstructs service businesses. Business Model mode does a full teardown of an entire business model including revenue, positioning, and competitive dynamics." },
  { q: "How many analyses can I run?", a: "Free users get a limited number of analyses per month. Pro and Disruptor tiers offer significantly more — check the Pricing page for details." },
];

const METHODOLOGY_STEPS = [
  { title: "Data Collection", desc: "We scrape multiple real-world sources — eBay sold listings for pricing intelligence, Etsy for handmade & vintage trends, Reddit for community sentiment, TikTok & Google for viral signals, and Alibaba for supply chain feasibility." },
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
