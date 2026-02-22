import React, { useState, useCallback, useEffect, useRef } from "react";


import { sampleProducts, type Product, type FlippedIdea } from "@/data/mockProducts";
import { downloadFullAnalysisPDF, downloadPatentPDF } from "@/lib/pdfExport";
import { AnalysisForm, type AnalysisMode } from "@/components/AnalysisForm";
import { ProductCard } from "@/components/ProductCard";
import { FlippedIdeaCard } from "@/components/FlippedIdeaCard";
import { AssumptionsMap } from "@/components/AssumptionsMap";
import { ScoreBar } from "@/components/ScoreBar";
import { RevivalScoreBadge } from "@/components/RevivalScoreBadge";
import { SavedAnalyses } from "@/components/SavedAnalyses";
import { FirstPrinciplesAnalysis } from "@/components/FirstPrinciplesAnalysis";
import { BusinessModelAnalysis } from "@/components/BusinessModelAnalysis";
import { PitchDeck } from "@/components/PitchDeck";
import { PatentIntelligence } from "@/components/PatentIntelligence";
import { UserHeader } from "@/components/UserHeader";
import WelcomeModal from "@/components/WelcomeModal";
import { ContextualTip } from "@/components/ContextualTip";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription, TIERS } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import PaywallModal from "@/components/PaywallModal";

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
  ScrollText,
  Telescope,
  Upload,
  Database,
  ArrowLeft,
  ChevronRight,
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

const PIPELINE_STEPS = [
  { id: "scraping",   icon: Globe,     label: "Web Scraping",      detail: "Crawling eBay, Etsy, Reddit, Google & TikTok for live market data" },
  { id: "analyzing",  icon: Brain,     label: "AI Analysis",       detail: "Building pricing intel, supply chain, trend analysis & action plans" },
  { id: "done",       icon: CheckCircle2, label: "Complete",       detail: "Results ready!" },
];

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
  const { user, profile } = useAuth();
  const { canAnalyze, remainingAnalyses, tier, usage, checkSubscription } = useSubscription();
  const [showPaywall, setShowPaywall] = useState(false);
  const [step, setStep] = useState<AnalysisStep>("idle");
  const [mainTab, setMainTab] = useState<"discover" | "custom" | "business" | "saved">("discover");
  const [activeMode, setActiveMode] = useState<AnalysisMode>("discover");
  const [stepMessage, setStepMessage] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [businessAnalysisData, setBusinessAnalysisData] = useState<unknown>(null);
  const [expandedSection, setExpandedSection] = useState<string>("discovery");
  const [analysisParams, setAnalysisParams] = useState<{
    category: string; era: string; batchSize: number;
  } | null>(null);
  const [generatingIdeasFor, setGeneratingIdeasFor] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [detailTab, setDetailTab] = useState<"overview" | "pricing" | "supply" | "action" | "ideas" | "community" | "patents">("overview");
  const [activeStep, setActiveStep] = useState(2);
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set([2]));
  const [showExitPrompt, setShowExitPrompt] = useState(false);
  const [pendingExitAction, setPendingExitAction] = useState<(() => void) | null>(null);
  const [savedRefreshTrigger, setSavedRefreshTrigger] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [showWelcome, setShowWelcome] = useState(() => {
    return !localStorage.getItem("welcomed_" + (user?.id ?? ""));
  });
  // Loading progress state
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [loadingLog, setLoadingLog] = useState<{ text: string; ts: number }[]>([]);
  const loadingStartRef = useRef<number>(0);
  const logTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const step3Ref = useRef<HTMLDivElement>(null);
  const step4Ref = useRef<HTMLDivElement>(null);
  const businessResultsRef = useRef<HTMLDivElement>(null);

  const pushLog = useCallback((text: string) => {
    setLoadingLog(prev => [...prev.slice(-12), { text, ts: Date.now() }]);
  }, []);

  const startLoadingTimer = useCallback(() => {
    loadingStartRef.current = Date.now();
    setElapsedSeconds(0);
    setLoadingLog([]);
    if (logTimerRef.current) clearInterval(logTimerRef.current);
    logTimerRef.current = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - loadingStartRef.current) / 1000));
    }, 1000);
  }, []);

  const stopLoadingTimer = useCallback(() => {
    if (logTimerRef.current) {
      clearInterval(logTimerRef.current);
      logTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopLoadingTimer();
  }, [stopLoadingTimer]);

  // Site-exit engagement: prompt users who haven't explored key areas
  useEffect(() => {
    const hasUnvisited = step === "done" && [3, 4].some(s => !visitedSteps.has(s));

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnvisited) {
        e.preventDefault();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && hasUnvisited && !showExitPrompt) {
        setPendingExitAction(null);
        setShowExitPrompt(true);
      }
    };

    if (hasUnvisited) {
      window.addEventListener("beforeunload", handleBeforeUnload);
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [step, visitedSteps, showExitPrompt]);

  const handleCloseWelcome = () => {
    localStorage.setItem("welcomed_" + (user?.id ?? ""), "1");
    setShowWelcome(false);
  };

  const saveAnalysis = useCallback(async (liveProducts: Product[], params: { category: string; era: string; batchSize: number }) => {
    try {
      const avgScore = liveProducts.reduce((acc, p) => acc + p.revivalScore, 0) / liveProducts.length;
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
        user_id: user?.id,
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
      toast.success("Analysis auto-saved!");
    } catch (err) {
      console.error("Auto-save failed:", err);
    }
  }, [user?.id]);

  const [loadedFromSaved, setLoadedFromSaved] = useState(false);

  const handleLoadSaved = useCallback((analysis: { products: Product[]; category: string; era: string; audience?: string; batch_size?: number; batchSize?: number; id?: string; title?: string; product_count?: number; avg_revival_score?: number; created_at?: string; analysis_type?: string; analysis_data?: unknown }) => {
    setLoadedFromSaved(true);
    if (analysis.analysis_type === "business_model") {
      setBusinessAnalysisData(analysis.analysis_data as never);
      setExpandedSection("businessmodel");
      setMainTab("business");
      setActiveMode("business");
      toast.success("Business model analysis loaded!");
      setTimeout(() => businessResultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
    } else if (analysis.analysis_type === "first_principles") {
      if (analysis.products && analysis.products.length > 0) {
        setProducts(analysis.products);
        setSelectedProduct(analysis.products[0]);
        setStep("done");
      }
      setMainTab("discover");
      setActiveMode("discover");
      setExpandedSection("detail");
      setDetailTab("overview");
      setActiveStep(3);
      toast.success("First principles analysis loaded — re-run to see full results.");
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
    } else {
      setProducts(analysis.products);
      setSelectedProduct(analysis.products[0] || null);
      setAnalysisParams({ category: analysis.category, era: analysis.era, batchSize: analysis.batch_size ?? analysis.batchSize ?? 5 });
      // Switch to correct tab based on whether it was a custom analysis
      const isCustom = analysis.category === "Custom" || analysis.era === "All Eras / Current";
      setMainTab(isCustom ? "custom" : "discover");
      setActiveMode(isCustom ? "custom" : "discover");
      setExpandedSection("detail");
      setDetailTab("overview");
      setStep("done");
      toast.success("Analysis loaded from saved workspace!");
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
    }
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
    // Check usage limit before proceeding
    if (!canAnalyze()) {
      setShowPaywall(true);
      return;
    }

    const { customProducts, ...baseParams } = params;
    setAnalysisParams(baseParams);
    setStep("scraping");
    setErrorMsg("");
    startLoadingTimer();

    const hasCustom = customProducts && customProducts.length > 0;

    // --- Scraping phase log messages ---
    pushLog(hasCustom
      ? "🚀 Starting analysis pipeline for your custom products…"
      : `🚀 Starting product intelligence pipeline for ${params.era} ${params.category}…`
    );
    await new Promise(r => setTimeout(r, 300));
    pushLog("🔍 Querying eBay for sold listings & collector pricing…");
    await new Promise(r => setTimeout(r, 600));
    pushLog("🛍️ Crawling Etsy for vintage & handmade revival trends…");
    await new Promise(r => setTimeout(r, 600));
    pushLog("💬 Mining Reddit for community sentiment & nostalgia signals…");
    await new Promise(r => setTimeout(r, 600));
    pushLog("📱 Scanning TikTok & Google for viral trend signals…");
    await new Promise(r => setTimeout(r, 600));
    pushLog("🏭 Searching Alibaba & wholesale directories for suppliers…");
    await new Promise(r => setTimeout(r, 600));
    pushLog("📊 Collecting complaint signals & improvement requests…");

    try {
      setStepMessage(hasCustom
        ? "Scraping your product URLs + eBay, Etsy, Reddit, Google, TikTok…"
        : `Crawling eBay, Etsy, Reddit, Google & TikTok for ${params.era} ${params.category} products…`
      );
      const { data: scrapeData, error: scrapeError } = await supabase.functions.invoke(
        "scrape-products",
        { body: { ...baseParams, customProducts } }
      );
      if (scrapeError || !scrapeData?.success) {
        throw new Error(scrapeData?.error || scrapeError?.message || "Scraping failed");
      }

      // Log scrape results
      if (scrapeData.stats) {
        pushLog(`✅ Scraped ${scrapeData.stats.totalPages} pages · ${scrapeData.stats.redditPosts} Reddit posts · ${scrapeData.stats.complaintSignals} complaint signals`);
      } else {
        pushLog(`✅ Web scraping complete — data collected from ${(scrapeData.sources || []).length} sources`);
      }

      setStep("analyzing");
      setStepMessage("Gemini AI building deep intelligence: pricing, supply chain, trends, flip ideas & action plans…");

      await new Promise(r => setTimeout(r, 400));
      pushLog("🧠 Gemini 2.5 Flash — parsing product data & community sentiment…");
      await new Promise(r => setTimeout(r, 800));
      pushLog("💰 Building pricing intelligence from real market data…");
      await new Promise(r => setTimeout(r, 800));
      pushLog("📦 Mapping supply chain: suppliers, manufacturers, distributors…");
      await new Promise(r => setTimeout(r, 800));
      pushLog("⚡ Generating flipped ideas from community pain points…");
      await new Promise(r => setTimeout(r, 800));
      pushLog("🎯 Scoring Revival Potential & building action plans…");
      await new Promise(r => setTimeout(r, 800));
      pushLog("🖼️ Searching for real product images (eBay, Amazon, Wikipedia)…");

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

      pushLog(`✅ Analysis complete — ${liveProducts.length} products with full intelligence reports ready!`);
      stopLoadingTimer();

      setProducts(liveProducts);
      setSelectedProduct(liveProducts[0]);
      setExpandedSection("discovery");
      setDetailTab("overview");
      setStep("done");
      setVisitedSteps(new Set([2]));
      toast.success(`Found ${liveProducts.length} products with deep intelligence reports!`);
      // Increment usage count
      try {
        await supabase.rpc("increment_usage", { p_user_id: user?.id });
        await checkSubscription();
      } catch (_) { /* best effort */ }
      await saveAnalysis(liveProducts, params);
      // Auto-scroll to results
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Analysis pipeline error:", msg);
      setErrorMsg(msg);
      setStep("error");
      stopLoadingTimer();
      toast.error("Analysis failed: " + msg);
    }
  };

  const handleRegenerateIdeas = async (product: Product, userContext?: string) => {
    if (!analysisParams) return;
    setGeneratingIdeasFor(product.id);

    try {
      const baseContext = `Focus on ${analysisParams.era} nostalgia and ${analysisParams.category} market trends.`;
      const fullContext = userContext ? `${baseContext}\n\nUser's additional guidance: ${userContext}` : baseContext;
      const { data, error } = await supabase.functions.invoke("generate-flip-ideas", {
        body: {
          product,
          additionalContext: fullContext,
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
  const showResults = step === "done";

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--background))" }}>
      {/* Welcome Modal */}
      {showWelcome && profile && (
        <WelcomeModal firstName={profile.first_name} onClose={handleCloseWelcome} />
      )}

      {/* Exit-Intent Prompt */}
      {showExitPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "hsl(220 20% 5% / 0.6)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-2xl" style={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}>
            <div className="h-1.5" style={{ background: "linear-gradient(90deg, hsl(271 81% 55%), hsl(var(--primary)))" }} />
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "hsl(271 81% 55% / 0.12)" }}>
                  <Sparkles size={18} style={{ color: "hsl(271 81% 55%)" }} />
                </div>
                <h3 className="text-lg font-extrabold text-foreground">You haven't explored everything!</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                You still have{" "}
                {[3, 4].filter(s => !visitedSteps.has(s)).map(s => s === 3 ? <strong key={s} style={{ color: "hsl(271 81% 55%)" }}>Disrupt</strong> : <strong key={s} style={{ color: "hsl(var(--primary))" }}>Pitch Deck</strong>).reduce<React.ReactNode[]>((acc, el, i) => i === 0 ? [el] : [...acc, " and ", el], [])}
                {" "}waiting for you — these are the most powerful sections.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowExitPrompt(false);
                    const firstUnvisited = [3, 4].find(s => !visitedSteps.has(s));
                    if (firstUnvisited) {
                      setActiveStep(firstUnvisited);
                      setVisitedSteps(prev => new Set([...prev, firstUnvisited]));
                    }
                    setPendingExitAction(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
                  style={{ background: "hsl(271 81% 55%)", boxShadow: "0 4px 12px -4px hsl(271 81% 55% / 0.4)" }}
                >
                  Show Me
                </button>
                <button
                  onClick={() => {
                    setShowExitPrompt(false);
                    if (pendingExitAction) pendingExitAction();
                    setPendingExitAction(null);
                  }}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                  style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))" }}
                >
                  Leave anyway
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Paywall Modal */}
      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} />}

      {/* HERO */}
      <header className="relative" style={{ background: "linear-gradient(135deg, hsl(220 25% 6%) 0%, hsl(220 30% 12%) 50%, hsl(220 25% 8%) 100%)" }}>
        {/* Subtle gradient orbs for depth */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-[0.07]" style={{ background: "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)" }} />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full opacity-[0.05]" style={{ background: "radial-gradient(circle, hsl(217 91% 50%) 0%, transparent 70%)" }} />
        </div>
        {/* Top nav bar with user */}
        <div className="relative z-10 border-b" style={{ borderColor: "hsl(0 0% 100% / 0.06)" }}>
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap size={15} style={{ color: "hsl(var(--primary-light))" }} />
              <span className="text-xs font-bold tracking-widest uppercase text-white/70">Market Disruptor</span>
            </div>
            <UserHeader />
          </div>
        </div>
        <div className="relative z-[1] max-w-6xl mx-auto px-4 py-10 sm:py-14">
          {/* Usage badge */}
          <div className="flex items-center gap-2 mb-4">
            <span
              className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider"
              style={{
                background: tier === "disruptor" ? "hsl(38 92% 50% / 0.15)" : tier === "builder" ? "hsl(var(--primary) / 0.15)" : "hsl(0 0% 100% / 0.08)",
                color: tier === "disruptor" ? "hsl(38 92% 60%)" : tier === "builder" ? "hsl(var(--primary-light))" : "hsl(0 0% 100% / 0.85)",
                border: `1px solid ${tier === "disruptor" ? "hsl(38 92% 50% / 0.3)" : tier === "builder" ? "hsl(var(--primary) / 0.3)" : "hsl(0 0% 100% / 0.1)"}`,
              }}
            >
              {TIERS[tier].name} Plan{remainingAnalyses() !== null ? ` · ${remainingAnalyses()} analyses left` : " · Unlimited"}
            </span>
            {tier !== "disruptor" && (
              <button
                onClick={() => window.location.href = "/pricing"}
                className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all hover:scale-105"
                style={{ background: "hsl(var(--primary))", color: "white" }}
              >
                View Plan Options
              </button>
            )}
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white leading-tight mb-4">
            Analyze, Deconstruct, <span style={{ color: "hsl(var(--primary-light))" }}>Capitalize!</span>
          </h1>
          <p className="text-lg text-white leading-relaxed">
            Developed by SGP Capital, these advanced AI research models don't just analyze products and markets — they challenge every assumption, flip conventional thinking, and rebuild better versions from the ground up. We built them to arm entrepreneurs like yourself with the tools to reinvent markets and bring bold ideas to life. Scroll below to begin your analysis!
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
                  style={{ background: "hsl(0 0% 100% / 0.06)", color: "white", border: "1px solid hsl(0 0% 100% / 0.1)" }}
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
        {/* ── TOP-LEVEL TAB BAR ── */}
        {(() => {
          const TABS = [
            { id: "discover" as const, label: "Reinvent Nostalgic Products", icon: Telescope, accent: "hsl(var(--primary))" },
            { id: "custom" as const, label: "Analyze A Product", icon: Upload, accent: "hsl(217 91% 38%)" },
            { id: "business" as const, label: "Business Model Analysis", icon: Building2, accent: "hsl(271 81% 55%)" },
            { id: "saved" as const, label: "Saved Projects", icon: Database, accent: "hsl(var(--primary))" },
          ];
          return (
            <div className="rounded-2xl overflow-hidden" style={{ border: "2px solid hsl(var(--border))", boxShadow: "var(--shadow-card)", background: "hsl(var(--card))" }}>
              <div className="flex" style={{ background: "hsl(220 25% 6%)" }}>
                {TABS.map((tab) => {
                  const isActive = mainTab === tab.id;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setMainTab(tab.id);
                        if (tab.id !== "saved") {
                          setActiveMode(tab.id as AnalysisMode);
                        }
                      }}
                      className="flex-1 flex items-center justify-center gap-2.5 px-4 py-4 text-sm font-bold transition-all relative"
                       style={{
                        color: isActive ? "white" : "hsl(0 0% 100% / 0.5)",
                        background: isActive ? `${tab.accent}` : "transparent",
                        borderRight: "1px solid hsl(0 0% 100% / 0.25)",
                        boxShadow: isActive ? `inset 0 -3px 0 0 white` : "none",
                      }}
                    >
                      <Icon size={17} />
                      <span className="hidden sm:inline">{tab.label}</span>
                      {tab.id === "saved" && (
                        <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "hsl(var(--success))" }} />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="p-5">
                {mainTab !== "saved" && (
                  <>
                    <ContextualTip
                      id="discovery-tip-1"
                      message={`💡 Pro tip, ${profile?.first_name ?? "explorer"}: The best opportunities are in weird niches — try '70s Fitness Equipment', 'Y2K Gadgets', or 'Retro Office Tech'. The stranger the category, the less competition you'll face.`}
                    />
                    <div className="mt-4">
                      <AnalysisForm
                        onAnalyze={handleAnalyze}
                        isLoading={isLoading}
                        mode={activeMode}
                        onModeChange={(m) => {
                          setActiveMode(m);
                          setMainTab(m as typeof mainTab);
                        }}
                        onBusinessAnalysis={(data) => {
                          setBusinessAnalysisData(data);
                          toggleSection("businessmodel");
                          setTimeout(() => businessResultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
                        }}
                      />
                    </div>
                  </>
                )}

                {mainTab === "saved" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "hsl(var(--primary))" }}>
                          <Save size={16} style={{ color: "white" }} />
                        </div>
                        <div>
                          <h2 className="text-xl font-extrabold text-foreground">Your Saved Projects</h2>
                          <p className="text-xs text-muted-foreground">All analyses auto-save · Click any to reload instantly</p>
                        </div>
                      </div>
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold" style={{ background: "hsl(var(--primary-muted))", color: "hsl(var(--primary))" }}>
                        <CheckCircle2 size={12} /> Auto-saved
                      </span>
                    </div>
                    <SavedAnalyses onLoad={handleLoadSaved} refreshTrigger={savedRefreshTrigger} />
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* LOADING — rich live tracker */}
        {isLoading && (() => {
          const isScraping = step === "scraping";
          const isAnalyzing = step === "analyzing";
          // Total estimated time: ~35s scrape + ~55s analyze = ~90s
          const SCRAPE_EST = 35;
          const ANALYZE_EST = 55;
          const totalEst = SCRAPE_EST + ANALYZE_EST;
          // Progress: scraping counts as first 35s, analyzing as last 55s
          const effectiveElapsed = isScraping
            ? Math.min(elapsedSeconds, SCRAPE_EST)
            : Math.min(SCRAPE_EST + elapsedSeconds, totalEst);
          const progressPct = Math.min(97, Math.round((effectiveElapsed / totalEst) * 100));
          const remaining = Math.max(0, totalEst - effectiveElapsed);
          const remainingLabel = remaining > 60
            ? `~${Math.ceil(remaining / 60)}m ${remaining % 60}s`
            : remaining > 0 ? `~${remaining}s` : "Almost done…";

          const SCRAPE_SOURCES = [
            { icon: "🛍️", label: "eBay", detail: "Sold listings, collector pricing, bid history" },
            { icon: "🌿", label: "Etsy", detail: "Vintage revival trends, handmade alternatives" },
            { icon: "💬", label: "Reddit", detail: "Community sentiment, nostalgia signals, complaints" },
            { icon: "📱", label: "TikTok / Google", detail: "Viral trends, search volume signals" },
            { icon: "🏭", label: "Alibaba / Wholesale", detail: "Suppliers, MOQs, manufacturer sources" },
          ];
          const ANALYZE_TASKS = [
            { icon: "🧠", label: "AI Reasoning", detail: "Gemini 2.5 Flash parsing all collected data" },
            { icon: "💰", label: "Pricing Intel", detail: "Real market prices, collector premiums, margins" },
            { icon: "📦", label: "Supply Chain", detail: "Mapping real suppliers, manufacturers, distributors" },
            { icon: "⚡", label: "Flip Ideas", detail: "Generating innovations from community pain points" },
            { icon: "🎯", label: "Action Plans", detail: "Revival scoring + week-one execution steps" },
            { icon: "🖼️", label: "Product Images", detail: "Finding real images from eBay, Amazon, Wikipedia" },
          ];

          return (
            <div className="card-intelligence overflow-hidden">
              {/* Top header bar */}
              <div className="px-6 pt-6 pb-4" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <div key={i} className="w-2 h-2 rounded-full animate-bounce"
                          style={{ background: "hsl(var(--primary))", animationDelay: `${i * 0.18}s` }} />
                      ))}
                    </div>
                    <p className="font-extrabold text-foreground text-base">
                      {isScraping ? "Collecting Market Data…" : "AI Building Your Report…"}
                    </p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse"
                      style={{ background: "hsl(var(--primary) / 0.12)", color: "hsl(var(--primary))" }}>
                      {isScraping ? "SCRAPING" : "ANALYZING"}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-foreground">{progressPct}%</p>
                    <p className="text-[10px] text-muted-foreground">{remainingLabel} left</p>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
                  <div className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${progressPct}%`, background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary-light)))" }} />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-muted-foreground">⏱ {elapsedSeconds}s elapsed</span>
                  <span className="text-[10px] text-muted-foreground">Typical range: 45–120 seconds</span>
                </div>
              </div>

              {/* Two column: phases + live log */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-0" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
                {/* Phase checklist */}
                <div className="p-5 space-y-3" style={{ borderRight: "1px solid hsl(var(--border))" }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "hsl(var(--primary))" }}>
                    {isScraping ? "Data Sources" : "AI Tasks"}
                  </p>
                  {(isScraping ? SCRAPE_SOURCES : ANALYZE_TASKS).map((item, i) => (
                    <div key={item.label} className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-xs"
                        style={{ background: "hsl(var(--primary-muted))" }}>
                        {item.icon}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground leading-tight">{item.label}</p>
                        <p className="text-[10px] text-muted-foreground">{item.detail}</p>
                      </div>
                      <div className="ml-auto flex-shrink-0 mt-0.5">
                        <div className="w-3 h-3 rounded-full border-2 border-t-transparent animate-spin"
                          style={{ borderColor: `hsl(var(--primary) / ${i === 0 ? 1 : 0.3})`, borderTopColor: "transparent" }} />
                      </div>
                    </div>
                  ))}

                  {/* Phase 2 upcoming */}
                  {isScraping && (
                    <div className="mt-4 pt-3" style={{ borderTop: "1px dashed hsl(var(--border))" }}>
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-2 text-muted-foreground">Up Next</p>
                      <div className="flex items-center gap-2 opacity-40">
                        <Brain size={13} style={{ color: "hsl(271 81% 55%)" }} />
                        <span className="text-xs text-muted-foreground">Gemini AI Deep Analysis</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Live activity log */}
                <div className="p-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "hsl(var(--primary))" }}>
                    Live Activity
                  </p>
                  <div className="space-y-1.5 font-mono max-h-48 overflow-y-auto">
                    {loadingLog.length === 0 ? (
                      <p className="text-xs text-muted-foreground animate-pulse">Initializing…</p>
                    ) : (
                      [...loadingLog].reverse().map((entry, i) => (
                        <div key={entry.ts} className={`flex items-start gap-1.5 transition-opacity ${i === 0 ? "opacity-100" : "opacity-50"}`}>
                          <span className="text-[10px] text-muted-foreground flex-shrink-0 mt-0.5">
                            {Math.floor((Date.now() - entry.ts) / 1000) < 2 ? "now" : `${Math.floor((Date.now() - entry.ts) / 1000)}s`}
                          </span>
                          <span className="text-[11px] text-foreground leading-relaxed">{entry.text}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-3 flex items-center justify-between" style={{ background: "hsl(var(--muted))" }}>
                <p className="text-[11px] text-muted-foreground">
                  🔒 Your analysis is private — auto-saves to your workspace when complete
                </p>
                <p className="text-[11px] font-semibold" style={{ color: "hsl(var(--primary))" }}>
                  {isScraping ? "Phase 1 of 2" : "Phase 2 of 2"}
                </p>
              </div>
            </div>
          );
        })()}

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
        {showResults && products.length > 0 && (() => {
          const isCustomMode = analysisParams?.category === "Custom";
          const modeAccent = isCustomMode ? "hsl(217 91% 38%)" : "hsl(var(--primary))";
          const modeAccentLight = isCustomMode ? "hsl(214 95% 93%)" : "hsl(var(--primary-muted))";
          const modeLabel = isCustomMode ? "Product Deep Audit" : "Market Intelligence";
          const totalSources = products.reduce((a, p) => a + (p.sources?.length || 0), 0);
          const totalIdeas = products.reduce((acc, p) => acc + (p.flippedIdeas?.length || 0), 0);
          const avgScore = (products.reduce((acc, p) => acc + p.revivalScore, 0) / products.length).toFixed(1);

          return (
          <div ref={resultsRef} className="space-y-5">
            {/* ── STICKY STEP NAVIGATOR ── */}
            <div className="sticky top-0 z-30 -mx-4 px-4 py-3" style={{ background: "hsl(var(--background) / 0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid hsl(var(--border))" }}>
              <div className="max-w-6xl mx-auto flex items-center gap-0">
                {[
                  { step: 2, label: "Intelligence Report", icon: Target, color: modeAccent, ref: resultsRef },
                  { step: 3, label: "Disrupt", icon: Brain, color: "hsl(271 81% 55%)", ref: step3Ref },
                  { step: 4, label: "Pitch Deck", icon: Presentation, color: "hsl(var(--primary))", ref: step4Ref },
                ].map((s, i, arr) => {
                  const SIcon = s.icon;
                  const isCurrent = activeStep === s.step;
                  const isPast = activeStep > s.step;
                  return (
                    <div key={s.step} className="flex items-center flex-1 min-w-0">
                      <button
                        onClick={() => {
                          setActiveStep(s.step);
                          setVisitedSteps(prev => new Set([...prev, s.step]));
                        }}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all w-full justify-center relative ${!isCurrent && !visitedSteps.has(s.step) ? "animate-pulse-subtle" : ""}`}
                        style={{
                          background: isCurrent ? s.color : isPast ? `color-mix(in srgb, ${s.color} 12%, transparent)` : !visitedSteps.has(s.step) ? `color-mix(in srgb, ${s.color} 8%, hsl(var(--muted)))` : "hsl(var(--muted))",
                          color: isCurrent ? "white" : isPast ? s.color : !visitedSteps.has(s.step) ? s.color : "hsl(var(--muted-foreground))",
                          boxShadow: isCurrent ? `0 4px 16px -4px ${s.color}50` : !visitedSteps.has(s.step) ? `0 0 12px -2px ${s.color}30, 0 0 0 1px ${s.color}20` : "none",
                          border: isCurrent ? `2px solid ${s.color}` : isPast ? `2px solid ${s.color}30` : !visitedSteps.has(s.step) ? `2px solid ${s.color}40` : "2px solid hsl(var(--border))",
                        }}
                      >
                        {!isCurrent && !visitedSteps.has(s.step) && (
                          <span className="absolute -top-2 -right-1 px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider text-white z-10" style={{ background: s.color, boxShadow: `0 2px 8px -2px ${s.color}60` }}>
                            Explore
                          </span>
                        )}
                        <span className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-extrabold flex-shrink-0" style={{ background: isCurrent ? "hsl(0 0% 100% / 0.25)" : isPast ? s.color : !visitedSteps.has(s.step) ? `color-mix(in srgb, ${s.color} 20%, transparent)` : "hsl(var(--border))", color: isCurrent || isPast ? "white" : !visitedSteps.has(s.step) ? s.color : "hsl(var(--muted-foreground))" }}>
                          {isPast ? "✓" : s.step}
                        </span>
                        <SIcon size={14} className="hidden sm:block flex-shrink-0" />
                        <span className="hidden sm:inline truncate">{s.label}</span>
                        <span className="sm:hidden text-[11px]">Step {s.step}</span>
                      </button>
                      {i < arr.length - 1 && (
                        <div className="flex-shrink-0 mx-1 flex items-center">
                          <div className="w-6 h-0.5 rounded-full" style={{ background: isPast ? s.color : "hsl(var(--border))" }} />
                          <ChevronRight size={16} className="flex-shrink-0 -ml-0.5" style={{ color: isPast ? s.color : "hsl(var(--muted-foreground))" }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── BACK TO SAVED PROJECTS ── */}
            {loadedFromSaved && (
              <button
                onClick={() => {
                  const unvisited = [3, 4].filter(s => !visitedSteps.has(s));
                  if (unvisited.length > 0) {
                    setPendingExitAction(() => () => {
                      setMainTab("saved");
                      setLoadedFromSaved(false);
                      setStep("idle");
                      setProducts([]);
                      setSelectedProduct(null);
                      setBusinessAnalysisData(null);
                    });
                    setShowExitPrompt(true);
                  } else {
                    setMainTab("saved");
                    setLoadedFromSaved(false);
                    setStep("idle");
                    setProducts([]);
                    setSelectedProduct(null);
                    setBusinessAnalysisData(null);
                  }
                }}
                className="flex items-center gap-2 text-sm font-semibold transition-colors hover:opacity-80"
                style={{ color: "hsl(var(--primary))" }}
              >
                <ArrowLeft size={16} />
                Back to Saved Projects
              </button>
            )}
            {/* ── STEP 2: INTELLIGENCE REPORT ── */}
            {activeStep === 2 && (
            <>
            <div className="rounded-2xl overflow-hidden" style={{ border: `2px solid ${modeAccent}30`, boxShadow: `0 4px 24px -4px ${modeAccent}18` }}>
              <div className="px-5 py-4 flex items-center gap-4" style={{ background: `linear-gradient(135deg, ${modeAccentLight} 0%, hsl(var(--card)) 100%)` }}>
                <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white font-extrabold text-sm" style={{ background: modeAccent }}>
                  2
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-extrabold text-foreground">Intelligence Report</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {products.length} product{products.length > 1 ? "s" : ""} · {totalSources} sources · {totalIdeas} flip ideas · <strong style={{ color: modeAccent }}>{avgScore}/10</strong> avg score
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => selectedProduct && downloadFullAnalysisPDF(selectedProduct)}
                    disabled={!selectedProduct}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                    style={{ background: "hsl(var(--secondary))", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))", opacity: selectedProduct ? 1 : 0.5 }}
                  >
                    <FileDown size={12} /> PDF
                  </button>
                  <button
                    onClick={handleManualSave}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all text-white"
                    style={{ background: modeAccent, opacity: isSaving ? 0.7 : 1 }}
                  >
                    {isSaving ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
                    {isSaving ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            </div>

            {/* ── PRODUCT SELECTOR ── */}
            {products.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {products.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => {
                      setSelectedProduct(product);
                      setExpandedSection("detail");
                      setDetailTab("overview");
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all"
                    style={{
                      background: selectedProduct?.id === product.id ? modeAccent : "hsl(var(--muted))",
                      color: selectedProduct?.id === product.id ? "white" : "hsl(var(--foreground))",
                      border: `2px solid ${selectedProduct?.id === product.id ? modeAccent : "hsl(var(--border))"}`,
                    }}
                  >
                    <RevivalScoreBadge score={product.revivalScore} size="sm" />
                    {product.name}
                  </button>
                ))}
              </div>
            )}


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
                  {/* Tab guidance */}
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "hsl(var(--primary) / 0.08)", border: "1px solid hsl(var(--primary) / 0.15)" }}>
                    <Sparkles size={13} className="flex-shrink-0" style={{ color: "hsl(var(--primary))" }} />
                    <p className="text-xs font-medium" style={{ color: "hsl(var(--primary))" }}>
                      Click each tab below to explore deeper intelligence layers for this product.
                    </p>
                  </div>
                  {/* Tab nav */}
                  <div className="flex flex-wrap gap-2">
                     {([
                      { id: "overview", label: "Overview", icon: Target },
                      { id: "community", label: "Community Intel", icon: Users },
                      { id: "pricing", label: "Pricing Intel", icon: DollarSign },
                      { id: "supply", label: "Supply Chain", icon: Package },
                      { id: "action", label: "Action Plan", icon: Rocket },
                      { id: "patents", label: "Patent Intel", icon: ScrollText },
                    ] as const).map(({ id, label, icon: Icon }) => {
                      const isActive = detailTab === id;
                      const activeColor = id === "patents" ? "hsl(271 81% 55%)" : "hsl(var(--primary))";
                      return (
                        <button
                          key={id}
                          onClick={() => setDetailTab(id)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all"
                          style={{
                            background: isActive ? activeColor : "hsl(var(--card))",
                            color: isActive ? "white" : "hsl(var(--foreground))",
                            border: `2px solid ${isActive ? activeColor : "hsl(var(--border))"}`,
                            boxShadow: isActive ? `0 2px 8px -2px ${activeColor}60` : "none",
                          }}
                        >
                          <Icon size={13} />
                          {label}
                        </button>
                      );
                    })}
                  </div>

                  {/* TAB: OVERVIEW */}
                  {detailTab === "overview" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Product image with refined frame */}
                        <div className="md:col-span-1">
                          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid hsl(var(--border))", boxShadow: "var(--shadow-section)" }}>
                            <img
                              src={selectedProduct.image}
                              alt={selectedProduct.name}
                              className="w-full object-cover h-56"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = getFallback(selectedProduct.category);
                              }}
                            />
                          </div>
                        </div>
                        <div className="md:col-span-2 space-y-4">
                          {/* Tags & score */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="tag-pill">{selectedProduct.category}</span>
                            <span className="tag-pill">{selectedProduct.era}</span>
                            <RevivalScoreBadge score={selectedProduct.revivalScore} size="md" />
                          </div>

                          {/* Key Insight — professional callout */}
                          {selectedProduct.keyInsight && (
                            <div className="insight-callout">
                              <p className="section-label text-[10px] mb-1.5 flex items-center gap-1 not-italic">
                                <Lightbulb size={10} /> Key Insight
                              </p>
                              <p className="text-sm italic leading-relaxed" style={{ color: "hsl(var(--foreground) / 0.85)" }}>
                                "{selectedProduct.keyInsight}"
                              </p>
                            </div>
                          )}

                          <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--foreground) / 0.8)" }}>{selectedProduct.description}</p>

                          {/* Specs */}
                          <div className="text-xs px-3.5 py-2.5 rounded-lg font-mono" style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))", border: "1px solid hsl(var(--border))" }}>
                            {selectedProduct.specs}
                          </div>

                          {/* TAM */}
                          {selectedProduct.marketSizeEstimate && (
                            <div className="insight-callout--success insight-callout">
                              <div className="flex items-start gap-2">
                                <BarChart3 size={14} className="flex-shrink-0 mt-0.5" style={{ color: "hsl(var(--success))" }} />
                                <p className="text-xs font-semibold leading-relaxed" style={{ color: "hsl(142 70% 28%)" }}>
                                  TAM: {selectedProduct.marketSizeEstimate}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Live Sources */}
                          <div className="section-panel">
                            <p className="section-label text-[10px] mb-2.5">Live Sources</p>
                            <div className="flex flex-wrap gap-2">
                              {selectedProduct.sources?.map((src) => (
                                <a
                                  key={src.url}
                                  href={src.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                                  style={{ background: "hsl(var(--primary) / 0.06)", color: "hsl(var(--primary))", border: "1px solid hsl(var(--primary) / 0.12)" }}
                                >
                                  <ExternalLink size={10} />
                                  {src.label?.slice(0, 40)}
                                </a>
                              ))}
                            </div>
                          </div>

                          {/* Confidence Scores */}
                          <div className="section-panel">
                            <p className="section-label text-[10px] mb-3">Confidence Scores</p>
                            <div className="grid grid-cols-1 gap-3">
                              <ScoreBar label="Adoption Likelihood" score={selectedProduct.confidenceScores?.adoptionLikelihood ?? 7} />
                              <ScoreBar label="Feasibility" score={selectedProduct.confidenceScores?.feasibility ?? 7} />
                              <ScoreBar label="Emotional Resonance" score={selectedProduct.confidenceScores?.emotionalResonance ?? 8} />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Trend analysis */}
                      {selectedProduct.trendAnalysis && (
                        <div className="insight-callout">
                          <p className="section-label text-[10px] mb-2 flex items-center gap-1">
                            <TrendingUp size={11} /> Trend Analysis
                          </p>
                          <p className="text-sm leading-relaxed" style={{ color: "hsl(var(--foreground) / 0.8)" }}>{selectedProduct.trendAnalysis}</p>
                        </div>
                      )}

                      {/* Reviews + Social */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="section-panel">
                          <p className="section-label text-[10px] mb-3 flex items-center gap-1">
                            <MessageSquare size={12} /> Reviews & Sentiment
                          </p>
                          <div className="space-y-2">
                            {selectedProduct.reviews?.map((review, i) => (
                              <div
                                key={i}
                                className="flex gap-2.5 items-start p-3 rounded-lg text-xs leading-relaxed"
                                style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}
                              >
                                <span className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${review.sentiment === "positive" ? "bg-green-500" : review.sentiment === "negative" ? "bg-red-500" : "bg-yellow-500"}`} />
                                <span style={{ color: "hsl(var(--foreground) / 0.8)" }}>{review.text}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="section-panel">
                          <p className="section-label text-[10px] mb-3 flex items-center gap-1">
                            <TrendingUp size={12} /> Social Signals
                          </p>
                          <div className="space-y-2">
                            {selectedProduct.socialSignals?.map((sig, i) => (
                              <div
                                key={i}
                                className="flex items-center justify-between p-3 rounded-lg"
                                style={{ background: "hsl(var(--primary) / 0.04)", border: "1px solid hsl(var(--primary) / 0.1)" }}
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

                          <div className="mt-4 pt-3" style={{ borderTop: "1px solid hsl(var(--border))" }}>
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
                      <div className="section-panel">
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


                  {/* First Principles & Pitch Deck moved to standalone sections below */}

                  {/* TAB: PATENT INTELLIGENCE */}
                  {detailTab === "patents" && (
                    <div className="space-y-4">
                      {selectedProduct.patentData && (
                        <div className="flex justify-end">
                          <button
                            onClick={() => downloadPatentPDF(selectedProduct, selectedProduct.patentData)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                            style={{ background: "hsl(271 81% 55%)", color: "white" }}
                          >
                            <FileDown size={14} />
                            Download Patent PDF
                          </button>
                        </div>
                      )}
                      <PatentIntelligence
                        product={selectedProduct}
                        onSave={(patentData) => {
                          const updated = products.map(p =>
                            p.id === selectedProduct.id ? { ...p, patentData } : p
                          );
                          setProducts(updated);
                          setSelectedProduct({ ...selectedProduct, patentData });
                          // Persist updated products to DB
                          if (analysisParams) saveAnalysis(updated, analysisParams);
                        }}
                      />
                    </div>
                  )}
                </div>
              </SectionAccordion>
            )}
            </>
            )}

            {/* ── STEP 3: FIRST PRINCIPLES DEEP DIVE ── */}
            {activeStep === 3 && selectedProduct && (
              <div className="space-y-4">
                <button
                  onClick={() => setActiveStep(2)}
                  className="flex items-center gap-2 text-sm font-semibold transition-colors hover:opacity-80"
                  style={{ color: "hsl(271 81% 55%)" }}
                >
                  <ArrowLeft size={16} />
                  Back to Intelligence Report
                </button>
                <div className="rounded-2xl overflow-hidden" style={{ border: "2px solid hsl(271 81% 55% / 0.25)", boxShadow: "0 4px 24px -4px hsl(271 81% 55% / 0.1)" }}>
                  <div className="px-5 py-4 flex items-start gap-4" style={{ background: "linear-gradient(135deg, hsl(271 81% 55% / 0.06) 0%, hsl(var(--card)) 100%)" }}>
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white font-extrabold text-sm" style={{ background: "hsl(271 81% 55%)" }}>3</div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-extrabold text-foreground">Disrupt</h2>
                      <p className="text-sm text-muted-foreground">Deconstructing <strong className="text-foreground">{selectedProduct.name}</strong> — questioning every assumption and generating radical reinvention ideas.</p>
                    </div>
                  </div>
                  <div className="p-5" style={{ background: "hsl(var(--card))" }}>
                    <FirstPrinciplesAnalysis product={selectedProduct} onSaved={() => setSavedRefreshTrigger((n) => n + 1)} flippedIdeas={selectedProduct.flippedIdeas} onRegenerateIdeas={(ctx) => handleRegenerateIdeas(selectedProduct, ctx)} generatingIdeas={generatingIdeasFor === selectedProduct.id} />
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 4: PITCH DECK ── */}
            {activeStep === 4 && selectedProduct && (
              <div className="space-y-4">
                <button
                  onClick={() => setActiveStep(2)}
                  className="flex items-center gap-2 text-sm font-semibold transition-colors hover:opacity-80"
                  style={{ color: "hsl(var(--primary))" }}
                >
                  <ArrowLeft size={16} />
                  Back to Intelligence Report
                </button>
                <div className="rounded-2xl overflow-hidden" style={{ border: "2px solid hsl(var(--primary) / 0.25)", boxShadow: "0 4px 24px -4px hsl(var(--primary) / 0.1)" }}>
                  <div className="px-5 py-4 flex items-start gap-4" style={{ background: "linear-gradient(135deg, hsl(var(--primary) / 0.06) 0%, hsl(var(--card)) 100%)" }}>
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white font-extrabold text-sm" style={{ background: "hsl(var(--primary))" }}>4</div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-extrabold text-foreground">Investor Pitch Deck</h2>
                      <p className="text-sm text-muted-foreground">Professional pitch deck for <strong className="text-foreground">{selectedProduct.name}</strong> — TAM/SAM/SOM, unit economics, go-to-market strategy.</p>
                    </div>
                  </div>
                  <div className="p-5" style={{ background: "hsl(var(--card))" }}>
                    <PitchDeck product={selectedProduct} />
                  </div>
                </div>
              </div>
            )}

          </div>
          );
        })()}


        {(businessAnalysisData || expandedSection === "businessmodel") && (
          <div ref={businessResultsRef}>
            {loadedFromSaved && (
              <button
                onClick={() => {
                  setMainTab("saved");
                  setLoadedFromSaved(false);
                  setBusinessAnalysisData(null);
                  setExpandedSection("discovery");
                }}
                className="flex items-center gap-2 text-sm font-semibold transition-colors hover:opacity-80 mb-4"
                style={{ color: "hsl(var(--primary))" }}
              >
                <ArrowLeft size={16} />
                Back to Saved Projects
              </button>
            )}
            <SectionAccordion
              id="businessmodel"
              title="Business Model Deconstruction"
              subtitle="First-principles analysis for any business — laundromat, distributor, B2B, service business & more"
              icon={<Building2 size={16} style={{ color: "hsl(var(--primary))" }} />}
              expanded={expandedSection === "businessmodel"}
              onToggle={() => toggleSection("businessmodel")}
            >
              <BusinessModelAnalysis initialData={businessAnalysisData as never} onSaved={() => setSavedRefreshTrigger((n) => n + 1)} />
            </SectionAccordion>
          </div>
        )}

        {/* ── SGP CAPITAL CTA ── */}
        {(step === "done" || businessAnalysisData) && (
          <div className="rounded-2xl overflow-hidden" style={{ border: "2px solid hsl(var(--primary) / 0.25)", background: "linear-gradient(135deg, hsl(var(--primary) / 0.06) 0%, hsl(var(--card)) 100%)" }}>
            <div className="px-6 py-6 flex flex-col sm:flex-row items-center gap-5">
              <div className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "hsl(var(--primary))" }}>
                <Rocket size={24} className="text-white" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="text-lg font-extrabold text-foreground mb-1">Ready to Bring This to Life?</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  SGP Capital helps entrepreneurs and investors turn market intelligence into real businesses. From product sourcing to launch strategy — let's build together.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-2 flex-shrink-0">
                <a
                  href="https://sgpcapital.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 flex items-center gap-2"
                  style={{ background: "hsl(var(--primary))" }}
                >
                  <Globe size={14} />
                  Visit SGP Capital
                </a>
                <a
                  href="mailto:steven@sgpcapital.com"
                  className="px-5 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
                  style={{ border: "1.5px solid hsl(var(--primary))", color: "hsl(var(--primary))" }}
                >
                  <Users size={14} />
                  Get in Touch
                </a>
              </div>
            </div>
          </div>
        )}

      </main>

      <footer className="border-t mt-12 py-8 text-center" style={{ borderColor: "hsl(var(--border))" }}>
        <p className="text-xs mt-2">
          <a href="https://sgpcapital.com" target="_blank" rel="noopener noreferrer" className="font-semibold transition-opacity hover:opacity-80" style={{ color: "hsl(var(--primary))" }}>
            Built by SGP Capital
          </a>
          <span className="text-muted-foreground"> · </span>
          <a href="mailto:steven@sgpcapital.com" className="text-muted-foreground hover:underline">steven@sgpcapital.com</a>
          {profile && <span className="text-muted-foreground"> · Signed in as <strong className="text-foreground">{profile.first_name}</strong></span>}
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
