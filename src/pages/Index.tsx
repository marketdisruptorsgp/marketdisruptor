import { useState, useCallback } from "react";
import heroBanner from "@/assets/hero-banner.jpg";
import { sampleProducts, type Product, type FlippedIdea } from "@/data/mockProducts";
import { downloadFullAnalysisPDF } from "@/lib/pdfExport";
import { AnalysisForm } from "@/components/AnalysisForm";
import { ProductCard } from "@/components/ProductCard";
import { FlippedIdeaCard } from "@/components/FlippedIdeaCard";
import { AssumptionsMap } from "@/components/AssumptionsMap";
import { ScoreBar } from "@/components/ScoreBar";
import { RevivalScoreBadge } from "@/components/RevivalScoreBadge";
import { SavedAnalyses } from "@/components/SavedAnalyses";
import { FirstPrinciplesAnalysis } from "@/components/FirstPrinciplesAnalysis";
import { BusinessModelAnalysis } from "@/components/BusinessModelAnalysis";
import { PitchDeck } from "@/components/PitchDeck";
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
  TrendingDown,
  ChevronDown,
  ChevronUp,
  Sparkles,
  RefreshCw,
  Globe,
  AlertCircle,
  DollarSign,
  Package,
  Store,
  Truck,
  Factory,
  Rocket,
  CheckCircle2,
  Clock,
  Minus,
  Lightbulb,
  Save,
  Users,
  ThumbsDown,
  ThumbsUp,
  Wrench,
  Heart,
  ShieldAlert,
  Brain,
  Presentation,
  Building2,
  FileDown,
} from "lucide-react";

const STEPS = [
  { icon: Search, label: "Discover & Collect" },
  { icon: Filter, label: "Prioritize & Filter" },
  { icon: Layers, label: "Deconstruct" },
  { icon: RotateCcw, label: "Challenge Assumptions" },
  { icon: Zap, label: "Generate Flips" },
  { icon: BarChart3, label: "Output & Score" },
];

type AnalysisStep = "idle" | "scraping" | "analyzing" | "done" | "error";

const FALLBACK_IMAGES: Record<string, string> = {
  "Electronic Toys": "https://images.unsplash.com/photo-1566240258998-c85da43741f2?w=600&h=400&fit=crop",
  "Instant Photography": "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&h=400&fit=crop",
  "Photography": "https://images.unsplash.com/photo-1495745966610-2a67f2297e5e?w=600&h=400&fit=crop",
  "Gaming Hardware": "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&h=400&fit=crop",
  "Construction Toys": "https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=600&h=400&fit=crop",
  "Fashion": "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop",
  "Kitchen": "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&h=400&fit=crop",
  "Music": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&h=400&fit=crop",
  "default": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&h=400&fit=crop",
};

function getFallback(category: string) {
  return FALLBACK_IMAGES[category] || FALLBACK_IMAGES["default"];
}

function TrendBadge({ trend }: { trend?: "up" | "down" | "stable" }) {
  if (trend === "up") return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-green-600">
      <TrendingUp size={9} /> Rising
    </span>
  );
  if (trend === "down") return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-red-500">
      <TrendingDown size={9} /> Falling
    </span>
  );
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-yellow-600">
      <Minus size={9} /> Stable
    </span>
  );
}

export default function Index() {
  const [step, setStep] = useState<AnalysisStep>("idle");
  const [stepMessage, setStepMessage] = useState("");
  const [products, setProducts] = useState<Product[]>(sampleProducts);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(sampleProducts[0]);
  const [businessAnalysisData, setBusinessAnalysisData] = useState<unknown>(null);
  const [expandedSection, setExpandedSection] = useState<string>("discovery");
  const [analysisParams, setAnalysisParams] = useState<{
    category: string; era: string; batchSize: number;
  } | null>(null);
  const [generatingIdeasFor, setGeneratingIdeasFor] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [detailTab, setDetailTab] = useState<"overview" | "pricing" | "supply" | "action" | "ideas" | "community" | "firstprinciples" | "pitchdeck">("overview");
  const [savedRefreshTrigger, setSavedRefreshTrigger] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const saveAnalysis = useCallback(async (liveProducts: Product[], params: { category: string; era: string; batchSize: number }) => {
    try {
      const avgScore = liveProducts.reduce((acc, p) => acc + p.revivalScore, 0) / liveProducts.length;
      // Build a meaningful title from actual product names
      const productNames = liveProducts.map(p => p.name);
      let title: string;
      if (productNames.length === 1) {
        title = productNames[0];
      } else if (productNames.length === 2) {
        title = `${productNames[0]} & ${productNames[1]}`;
      } else if (productNames.length <= 4) {
        title = productNames.slice(0, -1).join(", ") + " & " + productNames[productNames.length - 1];
      } else {
        title = `${productNames[0]}, ${productNames[1]}, ${productNames[2]} +${productNames.length - 3} more`;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("saved_analyses") as any).insert({
        title,
        category: params.category,
        era: params.era,
        audience: "",
        batch_size: params.batchSize,
        products: JSON.parse(JSON.stringify(liveProducts)),
        product_count: liveProducts.length,
        avg_revival_score: Math.round(avgScore * 10) / 10,
      });
      setSavedRefreshTrigger((n) => n + 1);
      toast.success("Analysis auto-saved! Find it in Saved Analyses.");
    } catch (err) {
      console.error("Auto-save failed:", err);
    }
  }, []);

  const handleLoadSaved = useCallback((analysis: { products: Product[]; category: string; era: string; audience?: string; batch_size?: number; batchSize?: number; id?: string; title?: string; product_count?: number; avg_revival_score?: number; created_at?: string }) => {
    setProducts(analysis.products);
    setSelectedProduct(analysis.products[0] || null);
    setAnalysisParams({ category: analysis.category, era: analysis.era, batchSize: analysis.batch_size ?? analysis.batchSize ?? 5 });
    setExpandedSection("discovery");
    setDetailTab("overview");
    setStep("done");
    toast.success("Analysis loaded from saved workspace!");
  }, []);

  const handleManualSave = async () => {
    if (!analysisParams || products.length === 0) return;
    setIsSaving(true);
    await saveAnalysis(products, analysisParams);
    setIsSaving(false);
  };

  const handleAnalyze = async (params: {
    category: string; era: string; batchSize: number;
    customProducts?: { imageDataUrl?: string; productUrl?: string; productName?: string; notes?: string }[];
  }) => {
    const { customProducts, ...baseParams } = params;
    setAnalysisParams(baseParams);
    setStep("scraping");
    setErrorMsg("");
    const hasCustom = customProducts && customProducts.length > 0;
    setStepMessage(hasCustom
      ? `Scraping custom product data + eBay, Etsy, Reddit, Google, TikTok…`
      : `Searching eBay, Etsy, Reddit, Google, TikTok for ${params.era} ${params.category}…`
    );

    try {
      const { data: scrapeData, error: scrapeError } = await supabase.functions.invoke(
        "scrape-products",
        { body: { ...baseParams, customProducts } }
      );
      if (scrapeError || !scrapeData?.success) {
        throw new Error(scrapeData?.error || scrapeError?.message || "Scraping failed");
      }

      setStep("analyzing");
      setStepMessage("AI building deep product intelligence: pricing, supply chain, trends, action plans…");

      const { data: analyzeData, error: analyzeError } = await supabase.functions.invoke(
        "analyze-products",
        {
          body: {
            rawContent: scrapeData.rawContent,
            redditContent: scrapeData.redditContent,
            complaintsContent: scrapeData.complaintsContent,
            sources: scrapeData.sources,
            category: params.category,
            era: params.era,
            batchSize: params.batchSize,
            customProducts: customProducts?.map(cp => ({
              productName: cp.productName,
              productUrl: cp.productUrl,
              notes: cp.notes,
              hasImage: !!cp.imageDataUrl,
            })),
          },
        }
      );

      if (analyzeError || !analyzeData?.success) {
        // Try to extract the real error message from the response context
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const context = (analyzeError as any)?.context;
        let detailedMsg = analyzeData?.error || analyzeError?.message || "Analysis failed";
        if (context) {
          try {
            const parsed = typeof context === "string" ? JSON.parse(context) : await context.json?.();
            if (parsed?.error) detailedMsg = parsed.error;
          } catch { /* ignore parse errors */ }
        }
        throw new Error(detailedMsg);
      }

      const liveProducts: Product[] = analyzeData.products;
      if (!liveProducts?.length) throw new Error("No products returned by AI.");

      setProducts(liveProducts);
      setSelectedProduct(liveProducts[0]);
      setExpandedSection("discovery");
      setDetailTab("overview");
      setStep("done");
      toast.success(`Found ${liveProducts.length} products with deep intelligence reports!`);
      // Auto-save to database
      await saveAnalysis(liveProducts, params);
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
          additionalContext: `Focus on ${analysisParams.era} nostalgia and ${analysisParams.category} market trends.`,
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
  const showResults = step === "done" || (step === "idle" && products.length > 0);

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--background))" }}>
      {/* HERO */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBanner} alt="Product Intelligence AI" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: "hsl(220 20% 5% / 0.75)" }} />
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
            <span style={{ color: "hsl(var(--primary-light))" }}>Capitalize</span>
          </h1>
          <p className="text-lg text-white/70 max-w-2xl leading-relaxed">
            Deep market intelligence from eBay, Etsy, Reddit & more — pricing, suppliers, vendors,
            action plans, and AI-generated innovation opportunities.
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
        <AnalysisForm
          onAnalyze={handleAnalyze}
          isLoading={isLoading}
          onBusinessAnalysis={(data) => {
            setBusinessAnalysisData(data);
            toggleSection("businessmodel");
          }}
        />

        {/* LOADING */}
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
                <Sparkles size={12} /> Deep AI Analysis
              </span>
            </div>
          </div>
        )}

        {/* ERROR */}
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
                Tip: Try a more specific category or reduce batch size. Showing sample data below.
              </p>
            </div>
          </div>
        )}

        {/* RESULTS */}
        {showResults && products.length > 0 && (
          <div className="space-y-6">
            {/* Stats bar */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
              {[
                { label: "Sources Scraped", value: String(products.reduce((a, p) => a + (p.sources?.length || 0), 0)), icon: Globe },
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => selectedProduct && downloadFullAnalysisPDF(selectedProduct)}
                  disabled={!selectedProduct}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: "hsl(var(--secondary))", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))", opacity: selectedProduct ? 1 : 0.5 }}
                >
                  <FileDown size={14} />
                  Download PDF
                </button>
                <button
                  onClick={handleManualSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: "hsl(var(--primary))", color: "white", opacity: isSaving ? 0.7 : 1 }}
                >
                  {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                  {isSaving ? "Saving…" : "Save Analysis"}
                </button>
              </div>
            </div>


            {/* DISCOVERY LIST */}
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
                      setDetailTab("overview");
                    }}
                  />
                ))}
              </div>
            </SectionAccordion>

            {/* PRODUCT DETAIL */}
            {selectedProduct && (
              <SectionAccordion
                id="detail"
                title={selectedProduct.name}
                subtitle="Deep intelligence · Pricing · Supply chain · Action plan · Flipped ideas"
                icon={<Target size={16} style={{ color: "hsl(var(--primary))" }} />}
                expanded={expandedSection === "detail"}
                onToggle={() => toggleSection("detail")}
              >
                <div className="space-y-6">
                  {/* Tab nav */}
                  <div className="flex flex-wrap gap-2 border-b pb-4" style={{ borderColor: "hsl(var(--border))" }}>
                     {([
                      { id: "overview", label: "Overview", icon: Target },
                      { id: "community", label: "Community Intel", icon: Users },
                      { id: "pricing", label: "Pricing Intel", icon: DollarSign },
                      { id: "supply", label: "Supply Chain", icon: Package },
                      { id: "action", label: "Action Plan", icon: Rocket },
                      { id: "ideas", label: "Flipped Ideas", icon: Zap },
                      { id: "firstprinciples", label: "First Principles", icon: Brain },
                      { id: "pitchdeck", label: "Pitch Deck", icon: Presentation },
                    ] as const).map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        onClick={() => setDetailTab(id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                        style={{
                          background: detailTab === id ? "hsl(var(--primary))" : "hsl(var(--secondary))",
                          color: detailTab === id ? "white" : "hsl(var(--foreground))",
                          border: `1px solid ${detailTab === id ? "hsl(var(--primary))" : "hsl(var(--border))"}`,
                        }}
                      >
                        <Icon size={11} />
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* TAB: OVERVIEW */}
                  {detailTab === "overview" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-1">
                          <img
                            src={selectedProduct.image}
                            alt={selectedProduct.name}
                            className="w-full rounded-xl object-cover h-52"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = getFallback(selectedProduct.category);
                            }}
                          />
                        </div>
                        <div className="md:col-span-2 space-y-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="tag-pill">{selectedProduct.category}</span>
                            <span className="tag-pill">{selectedProduct.era}</span>
                            <RevivalScoreBadge score={selectedProduct.revivalScore} size="md" />
                          </div>

                          {selectedProduct.keyInsight && (
                            <div
                              className="p-3 rounded-lg text-sm italic leading-relaxed"
                              style={{ background: "hsl(var(--primary-muted))", borderLeft: "3px solid hsl(var(--primary))", color: "hsl(var(--primary-dark))" }}
                            >
                              <p className="text-[10px] font-bold not-italic uppercase tracking-wider mb-1" style={{ color: "hsl(var(--primary))" }}>
                                <Lightbulb size={10} className="inline mr-1" />Key Insight
                              </p>
                              "{selectedProduct.keyInsight}"
                            </div>
                          )}

                          <p className="text-sm text-foreground/80 leading-relaxed">{selectedProduct.description}</p>
                          <div className="text-xs px-3 py-2 rounded-lg font-mono" style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>
                            {selectedProduct.specs}
                          </div>

                          {selectedProduct.marketSizeEstimate && (
                            <div
                              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold"
                              style={{ background: "hsl(142 70% 45% / 0.1)", color: "hsl(142 70% 30%)", border: "1px solid hsl(142 70% 45% / 0.3)" }}
                            >
                              <BarChart3 size={12} />
                              TAM: {selectedProduct.marketSizeEstimate}
                            </div>
                          )}

                          <div>
                            <p className="section-label text-[10px] mb-2">Live Sources</p>
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

                      {/* Trend analysis */}
                      {selectedProduct.trendAnalysis && (
                        <div className="p-4 rounded-xl text-sm leading-relaxed" style={{ background: "hsl(var(--muted))", borderLeft: "4px solid hsl(var(--primary))" }}>
                          <p className="section-label text-[10px] mb-2 flex items-center gap-1">
                            <TrendingUp size={11} /> Trend Analysis
                          </p>
                          <p className="text-foreground/80">{selectedProduct.trendAnalysis}</p>
                        </div>
                      )}

                      {/* Reviews + Social */}
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
                                <span className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${review.sentiment === "positive" ? "bg-green-500" : review.sentiment === "negative" ? "bg-red-500" : "bg-yellow-500"}`} />
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
                                  <div className="flex items-center gap-2">
                                    <p className="text-xs font-semibold" style={{ color: "hsl(var(--primary-dark))" }}>{sig.platform}</p>
                                    <TrendBadge trend={sig.trend} />
                                  </div>
                                  <p className="text-[11px] text-muted-foreground">{sig.signal}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
                                    {sig.volume}
                                  </span>
                                  {sig.url && (
                                    <a href={sig.url} target="_blank" rel="noopener noreferrer">
                                      <ExternalLink size={11} style={{ color: "hsl(var(--primary))" }} />
                                    </a>
                                  )}
                                </div>
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
                    </div>
                  )}

                  {/* TAB: COMMUNITY INTEL */}
                  {detailTab === "community" && (
                    <div className="space-y-6">
                      {/* Reddit Sentiment */}
                      {(selectedProduct as unknown as { communityInsights?: { redditSentiment?: string; topComplaints?: string[]; improvementRequests?: string[]; nostalgiaTriggers?: string[]; competitorComplaints?: string[] } }).communityInsights ? (
                        <>
                          {(() => {
                            const ci = (selectedProduct as unknown as { communityInsights: { redditSentiment?: string; topComplaints?: string[]; improvementRequests?: string[]; nostalgiaTriggers?: string[]; competitorComplaints?: string[] } }).communityInsights;
                            return (
                              <div className="space-y-5">
                                {ci.redditSentiment && (
                                  <div className="p-4 rounded-xl" style={{ background: "hsl(25 90% 50% / 0.08)", border: "1px solid hsl(25 90% 50% / 0.3)" }}>
                                    <p className="section-label text-[10px] mb-2 flex items-center gap-1" style={{ color: "hsl(25 90% 40%)" }}>
                                      <MessageSquare size={12} /> Reddit Community Sentiment
                                    </p>
                                    <p className="text-sm leading-relaxed" style={{ color: "hsl(25 90% 30%)" }}>{ci.redditSentiment}</p>
                                  </div>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {ci.topComplaints?.length ? (
                                    <div>
                                      <p className="section-label text-[10px] mb-3 flex items-center gap-1">
                                        <ThumbsDown size={12} style={{ color: "hsl(var(--destructive))" }} /> Top Complaints
                                      </p>
                                      <div className="space-y-2">
                                        {ci.topComplaints.map((c, i) => (
                                          <div key={i} className="flex gap-2 items-start p-3 rounded-lg text-xs" style={{ background: "hsl(var(--destructive) / 0.06)", border: "1px solid hsl(var(--destructive) / 0.2)" }}>
                                            <ShieldAlert size={12} style={{ color: "hsl(var(--destructive))", flexShrink: 0, marginTop: 1 }} />
                                            <span className="text-foreground/80">{c}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ) : null}
                                  {ci.improvementRequests?.length ? (
                                    <div>
                                      <p className="section-label text-[10px] mb-3 flex items-center gap-1">
                                        <Wrench size={12} style={{ color: "hsl(217 91% 60%)" }} /> Community Improvement Requests
                                      </p>
                                      <div className="space-y-2">
                                        {ci.improvementRequests.map((r, i) => (
                                          <div key={i} className="flex gap-2 items-start p-3 rounded-lg text-xs" style={{ background: "hsl(217 91% 60% / 0.06)", border: "1px solid hsl(217 91% 60% / 0.25)" }}>
                                            <Lightbulb size={12} style={{ color: "hsl(217 91% 55%)", flexShrink: 0, marginTop: 1 }} />
                                            <span className="text-foreground/80">{r}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ) : null}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {ci.nostalgiaTriggers?.length ? (
                                    <div>
                                      <p className="section-label text-[10px] mb-3 flex items-center gap-1">
                                        <Heart size={12} style={{ color: "hsl(330 80% 55%)" }} /> Nostalgia Triggers
                                      </p>
                                      <div className="flex flex-wrap gap-2">
                                        {ci.nostalgiaTriggers.map((t, i) => (
                                          <span key={i} className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: "hsl(330 80% 55% / 0.1)", color: "hsl(330 80% 40%)", border: "1px solid hsl(330 80% 55% / 0.3)" }}>
                                            {t}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  ) : null}
                                  {ci.competitorComplaints?.length ? (
                                    <div>
                                      <p className="section-label text-[10px] mb-3 flex items-center gap-1">
                                        <ThumbsUp size={12} style={{ color: "hsl(142 70% 40%)" }} /> Why People Hate Current Alternatives
                                      </p>
                                      <div className="space-y-2">
                                        {ci.competitorComplaints.map((c, i) => (
                                          <div key={i} className="flex gap-2 items-start p-3 rounded-lg text-xs" style={{ background: "hsl(142 70% 45% / 0.06)", border: "1px solid hsl(142 70% 45% / 0.25)" }}>
                                            <CheckCircle2 size={12} style={{ color: "hsl(142 70% 40%)", flexShrink: 0, marginTop: 1 }} />
                                            <span className="text-foreground/80">{c}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            );
                          })()}
                        </>
                      ) : (
                        <div className="py-10 text-center">
                          <Users size={32} className="mx-auto mb-3 opacity-20" />
                          <p className="text-sm text-muted-foreground">Community insights will appear here after running a live analysis.</p>
                          <p className="text-xs text-muted-foreground mt-1">Sample data doesn't include Reddit/community scraping.</p>
                        </div>
                      )}

                      {/* Reviews + Social Signals */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <p className="section-label text-[10px] mb-3 flex items-center gap-1">
                            <MessageSquare size={12} /> Reviews & Sentiment
                          </p>
                          <div className="space-y-2">
                            {selectedProduct.reviews?.map((review, i) => (
                              <div key={i} className="flex gap-2 items-start p-3 rounded-lg text-xs leading-relaxed" style={{ background: "hsl(var(--muted))" }}>
                                <span className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${review.sentiment === "positive" ? "bg-green-500" : review.sentiment === "negative" ? "bg-red-500" : "bg-yellow-500"}`} />
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
                              <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "hsl(var(--primary-muted))", border: "1px solid hsl(var(--primary) / 0.15)" }}>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="text-xs font-semibold" style={{ color: "hsl(var(--primary-dark))" }}>{sig.platform}</p>
                                    <TrendBadge trend={sig.trend} />
                                  </div>
                                  <p className="text-[11px] text-muted-foreground">{sig.signal}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
                                    {sig.volume}
                                  </span>
                                  {sig.url && (
                                    <a href={sig.url} target="_blank" rel="noopener noreferrer">
                                      <ExternalLink size={11} style={{ color: "hsl(var(--primary))" }} />
                                    </a>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB: PRICING INTEL */}
                  {detailTab === "pricing" && selectedProduct.pricingIntel && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {[
                          { label: "Current Market Price", value: selectedProduct.pricingIntel.currentMarketPrice, highlight: false },
                          { label: "Collector Premium", value: selectedProduct.pricingIntel.collectorPremium, highlight: false },
                          { label: "eBay Avg Sold", value: selectedProduct.pricingIntel.ebayAvgSold, highlight: true },
                          { label: "Etsy Avg Sold", value: selectedProduct.pricingIntel.etsyAvgSold, highlight: true },
                          { label: "Original MSRP", value: selectedProduct.pricingIntel.msrpOriginal, highlight: false },
                          { label: "Price Trend", value: selectedProduct.pricingIntel.priceDirection.toUpperCase(), highlight: true },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className="p-4 rounded-xl"
                            style={{
                              background: item.highlight ? "hsl(var(--primary-muted))" : "hsl(var(--muted))",
                              border: item.highlight ? "1px solid hsl(var(--primary) / 0.2)" : "1px solid hsl(var(--border))",
                            }}
                          >
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{item.label}</p>
                            <p className="text-sm font-bold" style={{ color: item.highlight ? "hsl(var(--primary-dark))" : "hsl(var(--foreground))" }}>
                              {item.value}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="p-4 rounded-xl" style={{ background: "hsl(142 70% 45% / 0.08)", border: "1px solid hsl(142 70% 45% / 0.3)" }}>
                        <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "hsl(142 70% 30%)" }}>
                          <DollarSign size={10} className="inline mr-1" />Margin Analysis
                        </p>
                        <p className="text-sm" style={{ color: "hsl(142 70% 25%)" }}>{selectedProduct.pricingIntel.margins}</p>
                      </div>

                      <div className="p-4 rounded-xl" style={{ background: "hsl(var(--muted))" }}>
                        <p className="text-[10px] font-bold uppercase tracking-wider mb-2 text-muted-foreground">Full Price Range</p>
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-extrabold text-foreground">{selectedProduct.pricingIntel.priceRange}</span>
                          <TrendBadge trend={selectedProduct.pricingIntel.priceDirection as "up" | "down" | "stable"} />
                        </div>
                      </div>
                    </div>
                  )}

                  {detailTab === "pricing" && !selectedProduct.pricingIntel && (
                    <p className="text-sm text-muted-foreground text-center py-8">No pricing intelligence available for this product.</p>
                  )}

                  {/* TAB: SUPPLY CHAIN */}
                  {detailTab === "supply" && selectedProduct.supplyChain && (
                    <div className="space-y-6">
                      {/* Suppliers */}
                      <SupplySection
                        title="Suppliers & IP Owners"
                        icon={<Factory size={14} style={{ color: "hsl(var(--primary))" }} />}
                        items={selectedProduct.supplyChain.suppliers.map((s) => ({
                          name: s.name,
                          badge: s.region,
                          detail: s.role,
                          url: s.url,
                        }))}
                        color="hsl(var(--primary-muted))"
                        borderColor="hsl(var(--primary) / 0.3)"
                      />

                      {/* Manufacturers */}
                      <SupplySection
                        title="Manufacturers / OEM"
                        icon={<Package size={14} style={{ color: "hsl(217 91% 60%)" }} />}
                        items={selectedProduct.supplyChain.manufacturers.map((m) => ({
                          name: m.name,
                          badge: m.region,
                          detail: `MOQ: ${m.moq}`,
                          url: m.url,
                        }))}
                        color="hsl(217 91% 60% / 0.08)"
                        borderColor="hsl(217 91% 60% / 0.3)"
                      />

                      {/* Vendors */}
                      <SupplySection
                        title="Vendors & Specialty Sellers"
                        icon={<Store size={14} style={{ color: "hsl(262 83% 58%)" }} />}
                        items={selectedProduct.supplyChain.vendors.map((v) => ({
                          name: v.name,
                          badge: v.type,
                          detail: v.notes,
                          url: v.url,
                        }))}
                        color="hsl(262 83% 58% / 0.08)"
                        borderColor="hsl(262 83% 58% / 0.3)"
                      />

                      {/* Retailers */}
                      <div>
                        <p className="section-label text-[10px] mb-3 flex items-center gap-2">
                          <Store size={14} style={{ color: "hsl(142 70% 40%)" }} /> Retailers & Market Share
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {selectedProduct.supplyChain.retailers.map((r) => (
                            <div key={r.name} className="p-3 rounded-xl text-center space-y-1" style={{ background: "hsl(142 70% 45% / 0.08)", border: "1px solid hsl(142 70% 45% / 0.2)" }}>
                              <p className="text-xs font-bold text-foreground">{r.name}</p>
                              <p className="text-[10px] text-muted-foreground">{r.type}</p>
                              <p className="text-lg font-extrabold" style={{ color: "hsl(142 70% 35%)" }}>{r.marketShare}</p>
                              {r.url && (
                                <a href={r.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-[10px]" style={{ color: "hsl(var(--primary))" }}>
                                  <ExternalLink size={9} /> Visit
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Distributors */}
                      <SupplySection
                        title="Distributors"
                        icon={<Truck size={14} style={{ color: "hsl(32 100% 50%)" }} />}
                        items={selectedProduct.supplyChain.distributors.map((d) => ({
                          name: d.name,
                          badge: d.region,
                          detail: d.notes,
                          url: d.url,
                        }))}
                        color="hsl(32 100% 50% / 0.08)"
                        borderColor="hsl(32 100% 50% / 0.3)"
                      />
                    </div>
                  )}

                  {detailTab === "supply" && !selectedProduct.supplyChain && (
                    <p className="text-sm text-muted-foreground text-center py-8">No supply chain data available for this product.</p>
                  )}

                  {/* TAB: ACTION PLAN */}
                  {detailTab === "action" && selectedProduct.actionPlan && (
                    <div className="space-y-6">
                      <div
                        className="p-4 rounded-xl text-sm leading-relaxed"
                        style={{ background: "hsl(var(--primary-muted))", borderLeft: "4px solid hsl(var(--primary))" }}
                      >
                        <p className="section-label text-[10px] mb-2">Strategic Direction</p>
                        <p style={{ color: "hsl(var(--primary-dark))" }}>{selectedProduct.actionPlan.strategy}</p>
                      </div>

                      {/* Quick Wins */}
                      <div>
                        <p className="section-label text-[10px] mb-3 flex items-center gap-1">
                          <Zap size={11} /> Quick Wins (This Week)
                        </p>
                        <div className="space-y-2">
                          {selectedProduct.actionPlan.quickWins.map((win, i) => (
                            <div
                              key={i}
                              className="flex items-start gap-3 p-3 rounded-lg text-sm"
                              style={{ background: "hsl(142 70% 45% / 0.08)", border: "1px solid hsl(142 70% 45% / 0.25)" }}
                            >
                              <CheckCircle2 size={16} style={{ color: "hsl(142 70% 40%)", flexShrink: 0, marginTop: 1 }} />
                              <span style={{ color: "hsl(142 70% 25%)" }}>{win}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Phases */}
                      <div>
                        <p className="section-label text-[10px] mb-3">Execution Roadmap</p>
                        <div className="space-y-4">
                          {selectedProduct.actionPlan.phases.map((phase, i) => (
                            <div
                              key={i}
                              className="p-4 rounded-xl space-y-3"
                              style={{
                                background: "hsl(var(--muted))",
                                border: `1px solid hsl(var(--border))`,
                                borderLeft: `4px solid ${i === 0 ? "hsl(142 70% 45%)" : i === 1 ? "hsl(var(--primary))" : "hsl(32 100% 50%)"}`,
                              }}
                            >
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <h4 className="font-bold text-sm text-foreground">{phase.phase}</h4>
                                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                                  <span className="flex items-center gap-1"><Clock size={10} /> {phase.timeline}</span>
                                  <span className="flex items-center gap-1 font-semibold" style={{ color: "hsl(var(--primary))" }}>
                                    <DollarSign size={10} /> {phase.budget}
                                  </span>
                                </div>
                              </div>
                              <ul className="space-y-1.5">
                                {phase.actions.map((action, j) => (
                                  <li key={j} className="flex items-start gap-2 text-xs text-foreground/80">
                                    <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5"
                                      style={{ background: "hsl(var(--primary) / 0.15)", color: "hsl(var(--primary))" }}>
                                      {j + 1}
                                    </span>
                                    {action}
                                  </li>
                                ))}
                              </ul>
                              <div
                                className="px-3 py-1.5 rounded-lg text-[11px] font-semibold"
                                style={{ background: "hsl(var(--primary) / 0.08)", color: "hsl(var(--primary-dark))" }}
                              >
                                ✓ Milestone: {phase.milestone}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Summary metrics */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-4 rounded-xl text-center" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Total Investment</p>
                          <p className="text-lg font-extrabold text-foreground">{selectedProduct.actionPlan.totalInvestment}</p>
                        </div>
                        <div className="p-4 rounded-xl text-center" style={{ background: "hsl(142 70% 45% / 0.08)", border: "1px solid hsl(142 70% 45% / 0.3)" }}>
                          <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "hsl(142 70% 35%)" }}>Expected ROI</p>
                          <p className="text-lg font-extrabold" style={{ color: "hsl(142 70% 28%)" }}>{selectedProduct.actionPlan.expectedROI}</p>
                        </div>
                        <div className="p-4 rounded-xl" style={{ background: "hsl(var(--primary-muted))", border: "1px solid hsl(var(--primary) / 0.2)" }}>
                          <p className="section-label text-[10px] mb-2">Go-To-Market Channels</p>
                          <div className="flex flex-wrap gap-1">
                            {selectedProduct.actionPlan.channels.map((ch) => (
                              <span key={ch} className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: "hsl(var(--primary) / 0.15)", color: "hsl(var(--primary))" }}>
                                {ch}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {detailTab === "action" && !selectedProduct.actionPlan && (
                    <p className="text-sm text-muted-foreground text-center py-8">No action plan available for this product. Try regenerating ideas.</p>
                  )}

                  {/* TAB: FLIPPED IDEAS */}
                  {detailTab === "ideas" && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
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
                          <FlippedIdeaCard key={`${idea.name}-${i}`} idea={idea} rank={i + 1} productName={selectedProduct.name} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB: FIRST PRINCIPLES */}
                  {detailTab === "firstprinciples" && (
                    <FirstPrinciplesAnalysis product={selectedProduct} />
                  )}

                  {/* TAB: PITCH DECK */}
                  {detailTab === "pitchdeck" && (
                    <PitchDeck product={selectedProduct} />
                  )}

                </div>
              </SectionAccordion>
            )}
          </div>
        )}

        {/* BUSINESS MODEL ANALYSIS */}
        <SectionAccordion
          id="businessmodel"
          title="Business Model Deconstruction"
          subtitle="First-principles analysis for any business — laundromat, distributor, B2B, service business & more"
          icon={<Building2 size={16} style={{ color: "hsl(var(--primary))" }} />}
          expanded={expandedSection === "businessmodel"}
          onToggle={() => toggleSection("businessmodel")}
        >
          <BusinessModelAnalysis initialData={businessAnalysisData as never} />
        </SectionAccordion>

        {/* SAVED ANALYSES */}
        <SavedAnalyses onLoad={handleLoadSaved} refreshTrigger={savedRefreshTrigger} />

        {/* IDLE with no data */}
        {step === "idle" && products.length === 0 && (
          <div
            className="text-center py-16 space-y-4 rounded-2xl"
            style={{ background: "hsl(var(--secondary))", border: "2px dashed hsl(var(--border))" }}
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto" style={{ background: "hsl(var(--primary-muted))" }}>
              <Zap size={28} style={{ color: "hsl(var(--primary))" }} />
            </div>
            <h3 className="text-xl font-bold text-foreground">Ready to Discover Hidden Opportunities</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Configure your parameters above and click "Run Product Intelligence Analysis".
            </p>
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

// ── Supply chain section helper ──
function SupplySection({
  title, icon, items, color, borderColor,
}: {
  title: string;
  icon: React.ReactNode;
  items: { name: string; badge: string; detail: string; url?: string }[];
  color: string;
  borderColor: string;
}) {
  return (
    <div>
      <p className="section-label text-[10px] mb-3 flex items-center gap-2">{icon} {title}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {items.map((item) => (
          <div
            key={item.name}
            className="p-3 rounded-xl flex items-start justify-between gap-2"
            style={{ background: color, border: `1px solid ${borderColor}` }}
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground truncate">{item.name}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{item.detail}</p>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-background/80 text-foreground/70">
                {item.badge}
              </span>
              {item.url && (
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-[10px]" style={{ color: "hsl(var(--primary))" }}>
                  <ExternalLink size={9} /> Link
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
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
