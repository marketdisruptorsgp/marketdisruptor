import { useState } from "react";
import heroBanner from "@/assets/hero-banner.jpg";
import { sampleProducts, type Product, type FlippedIdea } from "@/data/mockProducts";
import { AnalysisForm } from "@/components/AnalysisForm";
import { ProductCard } from "@/components/ProductCard";
import { FlippedIdeaCard } from "@/components/FlippedIdeaCard";
import { AssumptionsMap } from "@/components/AssumptionsMap";
import { ScoreBar } from "@/components/ScoreBar";
import { RevivalScoreBadge } from "@/components/RevivalScoreBadge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Zap,
  Search,
  Filter,
  Layers,
  RotateCcw,
  Target,
  BarChart3,
  ExternalLink,
  MessageSquare,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Sparkles,
  RefreshCw,
  Globe,
  AlertCircle,
} from "lucide-react";

const STEPS = [
  { icon: Search, label: "Discover & Collect" },
  { icon: Filter, label: "Prioritize & Filter" },
  { icon: Layers, label: "Deconstruct" },
  { icon: RotateCcw, label: "Challenge Assumptions" },
  { icon: Zap, label: "Generate Flips" },
  { icon: BarChart3, label: "Output & Score" },
];

type AnalysisStep =
  | "idle"
  | "scraping"
  | "analyzing"
  | "done"
  | "error";

export default function Index() {
  const [step, setStep] = useState<AnalysisStep>("idle");
  const [stepMessage, setStepMessage] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [expandedSection, setExpandedSection] = useState<string>("discovery");
  const [analysisParams, setAnalysisParams] = useState<{
    category: string; era: string; audience: string; batchSize: number;
  } | null>(null);
  const [generatingIdeasFor, setGeneratingIdeasFor] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleAnalyze = async (params: {
    category: string; era: string; audience: string; batchSize: number;
  }) => {
    setAnalysisParams(params);
    setStep("scraping");
    setErrorMsg("");
    setStepMessage(`Searching eBay, Etsy, Reddit, TikTok for ${params.era} ${params.category}…`);

    try {
      // Step 1: Scrape
      const { data: scrapeData, error: scrapeError } = await supabase.functions.invoke(
        "scrape-products",
        { body: params }
      );
      if (scrapeError || !scrapeData?.success) {
        throw new Error(scrapeData?.error || scrapeError?.message || "Scraping failed");
      }

      // Step 2: Analyze with AI
      setStep("analyzing");
      setStepMessage("AI analyzing content and generating product intelligence…");

      const { data: analyzeData, error: analyzeError } = await supabase.functions.invoke(
        "analyze-products",
        {
          body: {
            rawContent: scrapeData.rawContent,
            sources: scrapeData.sources,
            category: params.category,
            era: params.era,
            audience: params.audience,
            batchSize: params.batchSize,
          },
        }
      );

      if (analyzeError || !analyzeData?.success) {
        throw new Error(analyzeData?.error || analyzeError?.message || "Analysis failed");
      }

      const liveProducts: Product[] = analyzeData.products;
      if (!liveProducts?.length) throw new Error("No products returned by AI.");

      setProducts(liveProducts);
      setSelectedProduct(liveProducts[0]);
      setExpandedSection("discovery");
      setStep("done");
      toast.success(`Found ${liveProducts.length} products with ${liveProducts.reduce((a, p) => a + (p.flippedIdeas?.length || 0), 0)} flip ideas!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Analysis pipeline error:", msg);
      setErrorMsg(msg);
      setStep("error");
      toast.error("Analysis failed: " + msg);
    }
  };

  const handleRegenerateIdeas = async (product: Product) => {
    if (!analysisParams) return;
    setGeneratingIdeasFor(product.id);

    try {
      const { data, error } = await supabase.functions.invoke("generate-flip-ideas", {
        body: {
          product,
          audience: analysisParams.audience,
          additionalContext: `Focus on ${analysisParams.era} nostalgia and ${analysisParams.category} market trends for ${analysisParams.audience}.`,
        },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || "Generation failed");
      }

      const newIdeas: FlippedIdea[] = data.ideas;
      const updated = products.map((p) =>
        p.id === product.id ? { ...p, flippedIdeas: newIdeas } : p
      );
      setProducts(updated);
      if (selectedProduct?.id === product.id) {
        setSelectedProduct({ ...product, flippedIdeas: newIdeas });
      }
      toast.success("New flip ideas generated!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error("Could not generate ideas: " + msg);
    } finally {
      setGeneratingIdeasFor(null);
    }
  };

  const toggleSection = (section: string) =>
    setExpandedSection(expandedSection === section ? "" : section);

  const isLoading = step === "scraping" || step === "analyzing";

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--background))" }}>
      {/* HERO */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBanner} alt="Product Intelligence AI" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "hsl(220 20% 5% / 0.72)" }} />
        </div>
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-16 sm:py-24">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={18} style={{ color: "hsl(var(--primary-light))" }} />
            <span className="text-sm font-semibold tracking-wider uppercase" style={{ color: "hsl(var(--primary-light))" }}>
              Product Intelligence AI
            </span>
            <span
              className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
              style={{ background: "hsl(var(--primary))", color: "white" }}
            >
              Live Data
            </span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white leading-tight mb-4 max-w-3xl">
            Discover, Deconstruct &{" "}
            <span style={{ color: "hsl(var(--primary-light))" }}>Flip</span> Products
          </h1>
          <p className="text-lg text-white/70 max-w-2xl leading-relaxed">
            Real-time web intelligence from eBay, Etsy, Reddit & more — powered by Firecrawl + Gemini AI
            to find high-value innovation opportunities.
          </p>
          <div className="mt-10 flex flex-wrap gap-2">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
                  style={{ background: "hsl(var(--primary) / 0.2)", color: "white", border: "1px solid hsl(var(--primary) / 0.4)" }}
                >
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: "hsl(var(--primary))" }}>{i + 1}</span>
                  <Icon size={13} />
                  {s.label}
                </div>
              );
            })}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10 space-y-8">
        {/* FORM */}
        <AnalysisForm onAnalyze={handleAnalyze} isLoading={isLoading} />

        {/* LOADING STATE */}
        {isLoading && (
          <div className="card-intelligence p-10 flex flex-col items-center justify-center space-y-4">
            <div className="flex gap-1.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-3 h-3 rounded-full animate-bounce"
                  style={{ background: "hsl(var(--primary))", animationDelay: `${i * 0.12}s` }}
                />
              ))}
            </div>
            <p className="font-semibold text-foreground">{stepMessage}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className={`flex items-center gap-1 ${step === "scraping" ? "text-blue-600 font-semibold" : "opacity-50"}`}>
                <Globe size={12} /> Firecrawl Web Scraping
              </span>
              <span>→</span>
              <span className={`flex items-center gap-1 ${step === "analyzing" ? "text-blue-600 font-semibold" : "opacity-50"}`}>
                <Sparkles size={12} /> Gemini AI Analysis
              </span>
            </div>
          </div>
        )}

        {/* ERROR STATE */}
        {step === "error" && (
          <div
            className="p-6 rounded-xl flex items-start gap-4"
            style={{ background: "hsl(var(--destructive) / 0.07)", border: "1px solid hsl(var(--destructive) / 0.3)" }}
          >
            <AlertCircle size={20} style={{ color: "hsl(var(--destructive))", flexShrink: 0, marginTop: 2 }} />
            <div>
              <p className="font-semibold text-sm" style={{ color: "hsl(var(--destructive))" }}>Analysis Failed</p>
              <p className="text-sm text-muted-foreground mt-1">{errorMsg}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Tip: Try a more specific category or reduce batch size. Firecrawl searches real websites in real time.
              </p>
            </div>
          </div>
        )}

        {/* RESULTS */}
        {step === "done" && products.length > 0 && (
          <div className="space-y-6">
            {/* Stats bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Sources Scraped", value: products[0]?.sources?.length ? `${products.reduce((a, p) => a + (p.sources?.length || 0), 0)}` : "–", icon: Globe },
                { label: "Products Found", value: String(products.length), icon: Filter },
                { label: "Flip Ideas", value: String(products.reduce((acc, p) => acc + (p.flippedIdeas?.length || 0), 0)), icon: Zap },
                { label: "Avg Revival Score", value: (products.reduce((acc, p) => acc + p.revivalScore, 0) / products.length).toFixed(1) + "/10", icon: TrendingUp },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="card-intelligence p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "hsl(var(--primary-muted))" }}>
                      <Icon size={18} style={{ color: "hsl(var(--primary))" }} />
                    </div>
                    <div>
                      <p className="text-2xl font-extrabold text-foreground leading-none">{stat.value}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── SECTION: DISCOVERY LIST ── */}
            <SectionAccordion
              id="discovery"
              title="Product Discovery List"
              subtitle={`${products.length} prioritized candidates · Sorted by Revival Score · Click to analyze`}
              icon={<Search size={16} style={{ color: "hsl(var(--primary))" }} />}
              expanded={expandedSection === "discovery"}
              onToggle={() => toggleSection("discovery")}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isSelected={selectedProduct?.id === product.id}
                    onClick={() => {
                      setSelectedProduct(product);
                      setExpandedSection("detail");
                    }}
                  />
                ))}
              </div>
            </SectionAccordion>

            {/* ── SECTION: SELECTED PRODUCT DETAIL ── */}
            {selectedProduct && (
              <SectionAccordion
                id="detail"
                title={selectedProduct.name}
                subtitle="Full deconstruction · Assumptions Map · Flipped Ideas · Confidence Scores"
                icon={<Target size={16} style={{ color: "hsl(var(--primary))" }} />}
                expanded={expandedSection === "detail"}
                onToggle={() => toggleSection("detail")}
              >
                <div className="space-y-8">
                  {/* Product overview */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1">
                      <img
                        src={selectedProduct.image}
                        alt={selectedProduct.name}
                        className="w-full rounded-xl object-cover h-52"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop";
                        }}
                      />
                    </div>
                    <div className="md:col-span-2 space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="tag-pill">{selectedProduct.category}</span>
                        <span className="tag-pill">{selectedProduct.era}</span>
                        <RevivalScoreBadge score={selectedProduct.revivalScore} size="md" />
                      </div>
                      <p className="text-sm text-foreground/80 leading-relaxed">{selectedProduct.description}</p>
                      <div className="text-xs px-3 py-2 rounded-lg font-mono" style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>
                        Specs: {selectedProduct.specs}
                      </div>

                      {/* Sources */}
                      <div>
                        <p className="section-label text-[10px] mb-2">Live Data Sources</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedProduct.sources?.map((src) => (
                            <a
                              key={src.url}
                              href={src.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="source-link inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs"
                              style={{ background: "hsl(var(--secondary))", border: "1px solid hsl(var(--border))" }}
                            >
                              <ExternalLink size={10} />
                              {src.label?.slice(0, 40)}
                            </a>
                          ))}
                        </div>
                      </div>

                      {/* Confidence scores */}
                      <div>
                        <p className="section-label text-[10px] mb-3">Confidence Scores</p>
                        <div className="grid grid-cols-1 gap-2">
                          <ScoreBar label="Adoption Likelihood" score={selectedProduct.confidenceScores?.adoptionLikelihood ?? 7} />
                          <ScoreBar label="Feasibility" score={selectedProduct.confidenceScores?.feasibility ?? 7} />
                          <ScoreBar label="Emotional Resonance" score={selectedProduct.confidenceScores?.emotionalResonance ?? 8} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reviews + Social Signals */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="section-label text-[10px] mb-3 flex items-center gap-1">
                        <MessageSquare size={12} /> Reviews & Sentiment
                      </p>
                      <div className="space-y-2">
                        {selectedProduct.reviews?.map((review, i) => (
                          <div
                            key={i}
                            className="flex gap-2 items-start p-3 rounded-lg text-xs leading-relaxed"
                            style={{ background: "hsl(var(--muted))" }}
                          >
                            <span
                              className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                                review.sentiment === "positive"
                                  ? "bg-green-500"
                                  : review.sentiment === "negative"
                                  ? "bg-red-500"
                                  : "bg-yellow-500"
                              }`}
                            />
                            <span className="text-foreground/80">{review.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="section-label text-[10px] mb-3 flex items-center gap-1">
                        <TrendingUp size={12} /> Social Signals
                      </p>
                      <div className="space-y-2">
                        {selectedProduct.socialSignals?.map((sig, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-3 rounded-lg"
                            style={{ background: "hsl(var(--primary-muted))", border: "1px solid hsl(var(--primary) / 0.15)" }}
                          >
                            <div>
                              <p className="text-xs font-semibold" style={{ color: "hsl(var(--primary-dark))" }}>{sig.platform}</p>
                              <p className="text-[11px] text-muted-foreground">{sig.signal}</p>
                            </div>
                            <span
                              className="text-xs font-bold px-2 py-0.5 rounded-full"
                              style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
                            >
                              {sig.volume}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3">
                        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1.5">Competitors</p>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedProduct.competitors?.map((c) => (
                            <span key={c} className="tag-pill">{c}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Assumptions Map */}
                  <div>
                    <p className="section-label text-[10px] mb-3">Assumptions Map</p>
                    <AssumptionsMap product={selectedProduct} />
                  </div>

                  {/* Flipped Ideas */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="section-label text-[10px] flex items-center gap-1">
                        <Zap size={12} /> Flipped Product Ideas (Ranked)
                      </p>
                      <button
                        onClick={() => handleRegenerateIdeas(selectedProduct)}
                        disabled={generatingIdeasFor === selectedProduct.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        style={{
                          background: "hsl(var(--primary-muted))",
                          color: "hsl(var(--primary))",
                          border: "1px solid hsl(var(--primary) / 0.3)",
                        }}
                      >
                        {generatingIdeasFor === selectedProduct.id ? (
                          <><RefreshCw size={11} className="animate-spin" /> Generating…</>
                        ) : (
                          <><Sparkles size={11} /> Regenerate with AI</>
                        )}
                      </button>
                    </div>
                    <div className="space-y-4">
                      {selectedProduct.flippedIdeas?.map((idea, i) => (
                        <FlippedIdeaCard key={`${idea.name}-${i}`} idea={idea} rank={i + 1} />
                      ))}
                    </div>
                  </div>
                </div>
              </SectionAccordion>
            )}
          </div>
        )}

        {/* CTA when idle */}
        {step === "idle" && (
          <div
            className="text-center py-16 space-y-4 rounded-2xl"
            style={{ background: "hsl(var(--secondary))", border: "2px dashed hsl(var(--border))" }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
              style={{ background: "hsl(var(--primary-muted))" }}
            >
              <Zap size={28} style={{ color: "hsl(var(--primary))" }} />
            </div>
            <h3 className="text-xl font-bold text-foreground">Ready to Discover Hidden Opportunities</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Configure your parameters above and click "Run Product Intelligence Analysis". Firecrawl will
              scrape live data from eBay, Etsy, Reddit, and more — then Gemini AI will extract products,
              challenge assumptions, and generate flipped innovation ideas.
            </p>
            <div className="flex items-center justify-center gap-6 pt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Globe size={12} /> Live web scraping</span>
              <span className="flex items-center gap-1"><Sparkles size={12} /> AI-powered analysis</span>
              <span className="flex items-center gap-1"><Zap size={12} /> Sourced & linked</span>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t mt-12 py-8 text-center" style={{ borderColor: "hsl(var(--border))" }}>
        <p className="text-xs text-muted-foreground">
          Product Intelligence AI · Powered by Firecrawl + Gemini · Live data from eBay, Etsy, Reddit, TikTok & more
        </p>
      </footer>
    </div>
  );
}

// ── Accordion wrapper ──
function SectionAccordion({
  id, title, subtitle, icon, expanded, onToggle, children,
}: {
  id: string; title: string; subtitle: string; icon: React.ReactNode;
  expanded: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="card-intelligence overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "hsl(var(--primary-muted))" }}>
            {icon}
          </div>
          <div>
            <h3 className="font-bold text-foreground text-base leading-tight">{title}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          </div>
        </div>
        {expanded ? <ChevronUp size={18} className="text-muted-foreground flex-shrink-0" /> : <ChevronDown size={18} className="text-muted-foreground flex-shrink-0" />}
      </button>
      {expanded && (
        <div className="px-5 pb-6 border-t" style={{ borderColor: "hsl(var(--border))" }}>
          <div className="pt-5">{children}</div>
        </div>
      )}
    </div>
  );
}
