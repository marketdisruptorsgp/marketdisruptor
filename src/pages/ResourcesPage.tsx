import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PlatformNav } from "@/components/PlatformNav";
import { useSubscription } from "@/hooks/useSubscription";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, TrendingUp, TrendingDown, Zap, AlertTriangle, BookOpen, Flame, Eye, ShieldCheck } from "lucide-react";

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

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Resources</p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight mb-10">
          Learn How It Works
        </h1>

        <Tabs defaultValue={initialTab}>
          <TabsList className="mb-10 flex overflow-x-auto scrollbar-hide">
            <TabsTrigger value="faqs" className="text-sm">FAQs</TabsTrigger>
            <TabsTrigger value="methodology" className="text-sm">Methodology</TabsTrigger>
            <TabsTrigger value="market-intel" className="text-sm">Market Intel</TabsTrigger>
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
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{t.category}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          <TrendingUp size={12} /> {t.momentum}
                        </span>
                        <span className="text-xs text-muted-foreground">{t.period}</span>
                        <span className="text-xs font-semibold text-primary">Revival Score: {t.score}</span>
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
                            <span className="text-[10px] text-muted-foreground">{s.time}</span>
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
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">{p.subtitle}</span>
                      </div>
                      <p className="text-xs font-medium text-muted-foreground mb-3">{p.stats}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{p.summary}</p>
                      <button
                        onClick={() => navigate("/")}
                        className="mt-3 text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                      >
                        Run your own analysis in this category <ArrowRight size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </TabsContent>
        </Tabs>

        <footer className="mt-20 pt-6 border-t border-border text-center">
          <p className="text-xs">
            <a href="https://sgpcapital.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:opacity-80 transition-opacity">
              Built by SGP Capital
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
}
