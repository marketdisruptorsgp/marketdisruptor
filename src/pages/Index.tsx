import React, { useState, useCallback, useEffect, useRef } from "react";
import { PricingIntelCard } from "@/components/PricingIntelCard";


import { sampleProducts, type Product, type FlippedIdea } from "@/data/mockProducts";
import { downloadFullAnalysisPDF } from "@/lib/pdfExport";
import { gatherAllAnalysisData, gatherBusinessAnalysisData } from "@/lib/gatherAnalysisData";
import { useAnalysis } from "@/contexts/AnalysisContext";

import { AnalysisForm, type AnalysisMode } from "@/components/AnalysisForm";
import { ProductCard } from "@/components/ProductCard";
import { FlippedIdeaCard } from "@/components/FlippedIdeaCard";
import { AssumptionsMap } from "@/components/AssumptionsMap";
import { ScoreBar } from "@/components/ScoreBar";
import { RevivalScoreBadge } from "@/components/RevivalScoreBadge";
import { SavedAnalyses } from "@/components/SavedAnalyses";
import { FirstPrinciplesAnalysis } from "@/components/FirstPrinciplesAnalysis";
import { BusinessModelAnalysis, type BusinessModelInput, type BusinessModelAnalysisData } from "@/components/BusinessModelAnalysis";
import { CriticalValidation } from "@/components/CriticalValidation";
import { PitchDeck } from "@/components/PitchDeck";
import { ReferralCTA } from "@/components/ReferralCTA";
import { KeyTakeawayBanner, getCommunityTakeaway, getPricingTakeaway, getSupplyChainTakeaway, getVerdictBadges, getWorkflowTakeaway } from "@/components/KeyTakeawayBanner";
import { WorkflowTimeline } from "@/components/FirstPrinciplesAnalysis";

import { ContextualTip } from "@/components/ContextualTip";
import MobileTour from "@/components/MobileTour";
import { HeroSection } from "@/components/HeroSection";
import { DisruptionPathBanner } from "@/components/DisruptionPathBanner";
import { LoadingTracker } from "@/components/LoadingTracker";
import { StepNavigator, type StepConfig } from "@/components/StepNavigator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
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
  Swords,
  Building2,
  FileDown,
  Telescope,
  Upload,
  Database,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  X,
  ScrollText,
} from "lucide-react";
import { PatentIntelligence } from "@/components/PatentIntelligence";
import { DecompositionViewer } from "@/components/DecompositionViewer";

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
  { id: "scraping",   icon: Globe,     label: "Web Scraping",      detail: "Running deep analysis across a large subset of live market data sources" },
  { id: "analyzing",  icon: Brain,     label: "Deep Analysis",       detail: "Building pricing intel, supply chain, trend analysis & action plans" },
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
    <span className="inline-flex items-center gap-0.5 typo-card-meta font-bold text-success">
      <TrendingUp size={10} /> Rising
    </span>
  );
  if (trend === "down") return (
    <span className="inline-flex items-center gap-0.5 typo-card-meta font-bold text-destructive">
      <TrendingDown size={10} /> Falling
    </span>
  );
  return (
    <span className="inline-flex items-center gap-0.5 typo-card-meta font-bold text-warning">
      <Minus size={10} /> Stable
    </span>
  );
}

function ValuePropCallout() {
  return (
    <div className="rounded-2xl px-5 py-5 flex items-start gap-4" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
      <Target size={20} className="flex-shrink-0 mt-0.5 text-primary" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground mb-1">What to expect</p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          The goal isn't to promise a "better" answer every time. The goal is to apply a level of data-driven scrutiny and critical analysis that exceeds normal human bandwidth — revealing hidden leverage points, unlocking overlooked market segments, or optimizing specific components in ways that can materially change outcomes.
        </p>
      </div>
    </div>
  );
}

export default function Index() {
  const { user, profile } = useAuth();
  const analysis = useAnalysis();
  const { canAnalyze, remainingAnalyses, tier, usage, checkSubscription } = useSubscription();
  const [showPaywall, setShowPaywall] = useState(false);
  const [step, setStep] = useState<AnalysisStep>("idle");
  const [mainTab, setMainTab] = useState<"custom" | "service" | "business">("custom");
  const [activeMode, setActiveMode] = useState<AnalysisMode>("custom");
  const [stepMessage, setStepMessage] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [businessAnalysisData, setBusinessAnalysisData] = useState<BusinessModelAnalysisData | null>(null);
  const [businessModelInput, setBusinessModelInput] = useState<BusinessModelInput | null>(null);
  const [businessActiveStep, setBusinessActiveStep] = useState(2);
  const [businessVisitedSteps, setBusinessVisitedSteps] = useState<Set<number>>(new Set([2]));
  const [businessStressTestData, setBusinessStressTestData] = useState<unknown>(null);
  const [businessStressTestTab, setBusinessStressTestTab] = useState<"debate" | "validate">("debate");
  const [expandedSection, setExpandedSection] = useState<string>("discovery");
  const [analysisParams, setAnalysisParams] = useState<{
    category: string; era: string; batchSize: number;
  } | null>(null);
  const [generatingIdeasFor, setGeneratingIdeasFor] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [detailTab, setDetailTab] = useState<"overview" | "structure" | "pricing" | "supply" | "patents" | "action" | "ideas" | "community" | "workflow">("overview");
  const [visitedDetailTabs, setVisitedDetailTabs] = useState<Set<string>>(new Set(["overview"]));
  const [visitedStressTestTabs, setVisitedStressTestTabs] = useState<Set<string>>(new Set(["debate"]));
  const [intelRerunNotes, setIntelRerunNotes] = useState("");
  const [visitedBusinessStressTestTabs, setVisitedBusinessStressTestTabs] = useState<Set<string>>(new Set(["debate"]));
  const [activeStep, setActiveStep] = useState(2);
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set([2]));
  const [showExitPrompt, setShowExitPrompt] = useState(false);
  const [pendingExitAction, setPendingExitAction] = useState<(() => void) | null>(null);
  const [savedRefreshTrigger, setSavedRefreshTrigger] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedPanel, setShowSavedPanel] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  // Loading progress state
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [loadingLog, setLoadingLog] = useState<{ text: string; ts: number }[]>([]);
  const loadingStartRef = useRef<number>(0);
  const logTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const step3Ref = useRef<HTMLDivElement>(null);
  const step4Ref = useRef<HTMLDivElement>(null);
  const step5Ref = useRef<HTMLDivElement>(null);
  const [disruptData, setDisruptData] = useState<unknown>(null);
  const [stressTestData, setStressTestData] = useState<unknown>(null);
  const [stressTestTab, setStressTestTab] = useState<"debate" | "validate">("debate");
  const businessResultsRef = useRef<HTMLDivElement>(null);
  const sectionTabsRef = useRef<HTMLDivElement>(null);

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
    const hasUnvisited = step === "done" && [3, 4, 5].some(s => !visitedSteps.has(s));

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


  const saveAnalysis = useCallback(async (liveProducts: Product[], params: { category: string; era: string; batchSize: number }) => {
    try {
      const avgScore = liveProducts.reduce((acc, p) => acc + p.revivalScore, 0) / liveProducts.length;
      // Use the user's custom name (from customName input) as title
      const userTypedName = liveProducts[0]?.name || "Analysis";
      let title = userTypedName;

      // Check for duplicate titles and append version
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existing } = await (supabase.from("saved_analyses") as any)
        .select("title")
        .eq("user_id", user?.id)
        .like("title", `${userTypedName}%`);
      if (existing && existing.length > 0) {
        const versions = existing.map((e: { title: string }) => {
          const match = e.title.match(/ v(\d+)$/);
          return match ? parseInt(match[1]) : 1;
        });
        const nextVersion = Math.max(...versions) + 1;
        title = `${userTypedName} v${nextVersion}`;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("saved_analyses") as any).insert({
        user_id: user?.id,
        title,
        category: params.category,
        era: "All Eras / Current",
        audience: "",
        batch_size: params.batchSize,
        products: JSON.parse(JSON.stringify(liveProducts)),
        product_count: liveProducts.length,
        avg_revival_score: Math.round(avgScore * 10) / 10,
        analysis_type: mainTab === "business" ? "business_model" : params.category === "Service" ? "service" : "product",
      });
      setSavedRefreshTrigger((n) => n + 1);
      toast.success("Analysis auto-saved!");
    } catch (err) {
      console.error("Auto-save failed:", err);
    }
  }, [user?.id]);

  const [loadedFromSaved, setLoadedFromSaved] = useState(false);

  const handleLoadSaved = useCallback(async (analysis: { products: Product[]; category: string; era: string; audience?: string; batch_size?: number; batchSize?: number; id?: string; title?: string; product_count?: number; avg_revival_score?: number; created_at?: string; analysis_type?: string; analysis_data?: unknown }) => {
    setLoadedFromSaved(true);

    // Auto-detect legacy schema and notify user
    const ad = analysis.analysis_data as Record<string, unknown> | null;
    if (ad) {
      const { detectLegacySchema } = await import("@/utils/legacyDetection");
      const legacy = detectLegacySchema(ad);
      if (legacy.isLegacy) {
        toast.info("This analysis used an older framework — regenerate steps to get improved insights");
      }
    }

    if (analysis.analysis_type === "business_model") {
      setBusinessAnalysisData(analysis.analysis_data as BusinessModelAnalysisData);
      // Try to extract input from title (format: "Type — Business Model")
      const titleParts = (analysis.title || "").split(" — ");
      setBusinessModelInput({ type: titleParts[0] || "Business", description: "", revenueModel: "", size: "", geography: "", painPoints: "", notes: "" });
      setBusinessActiveStep(2);
      setBusinessVisitedSteps(new Set([2]));
      setMainTab("business");
      setActiveMode("business");
      toast.success("Business model analysis loaded!");
      setTimeout(() => businessResultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
    } else if (analysis.analysis_type === "first_principles") {
      // Legacy: first_principles is not a mode — treat as product analysis
      if (analysis.products && analysis.products.length > 0) {
        setProducts(analysis.products);
        setSelectedProduct(analysis.products[0]);
        setStep("done");
      }
      setMainTab("custom");
      setActiveMode("custom");
      setExpandedSection("detail");
      setDetailTab("overview");
      setActiveStep(3);
      toast.success("Analysis loaded — starting from Structural Analysis");
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
    } else if (analysis.analysis_type === "service") {
      setProducts(analysis.products);
      setSelectedProduct(analysis.products[0] || null);
      setAnalysisParams({ category: analysis.category, era: analysis.era, batchSize: analysis.batch_size ?? analysis.batchSize ?? 5 });
      setMainTab("service");
      setActiveMode("service");
      setExpandedSection("detail");
      setDetailTab("overview");
      setStep("done");
      toast.success("Service analysis loaded!");
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
    } else {
      setProducts(analysis.products);
      setSelectedProduct(analysis.products[0] || null);
      setAnalysisParams({ category: analysis.category, era: analysis.era, batchSize: analysis.batch_size ?? analysis.batchSize ?? 5 });
      setMainTab("custom");
      setActiveMode("custom");
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

    const isServiceMode = params.category === "Service";

    // --- Scraping phase log messages ---
    pushLog(hasCustom
      ? `Starting analysis pipeline for your custom ${isServiceMode ? "service" : "products"}...`
      : `Starting ${isServiceMode ? "service" : "product"} intelligence pipeline for ${params.category}...`
    );
    await new Promise(r => setTimeout(r, 300));
    pushLog(isServiceMode
      ? "Scanning customer reviews & competitor positioning..."
      : "Querying pricing databases for market intelligence..."
    );
    await new Promise(r => setTimeout(r, 600));
    pushLog("Crawling marketplace data for trend signals...");
    await new Promise(r => setTimeout(r, 600));
    pushLog("Analyzing community sentiment data...");
    await new Promise(r => setTimeout(r, 600));
    pushLog("Collecting demand & trend signals...");
    await new Promise(r => setTimeout(r, 600));
    pushLog(isServiceMode
      ? "Researching operational models & pricing strategies..."
      : "Searching wholesale directories for supply chain data..."
    );
    await new Promise(r => setTimeout(r, 600));
    pushLog("Collecting complaint signals & improvement requests...");

    try {
      setStepMessage(hasCustom
        ? `Analyzing your ${isServiceMode ? "service" : "product"} URLs across multiple data sources…`
        : `Running deep market analysis for ${params.category}${isServiceMode ? "" : " products"}…`
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
        pushLog(`Collected data from ${scrapeData.stats.totalPages} pages, ${scrapeData.stats.communityPosts} community posts, ${scrapeData.stats.complaintSignals} signals`);
      } else {
        pushLog(`Web scraping complete — data collected from ${(scrapeData.sources || []).length} sources`);
      }

      setStep("analyzing");
      setStepMessage(isServiceMode
        ? "Building deep intelligence: pricing, customer journey, competitive landscape & reinvention ideas…"
        : "Building deep intelligence: pricing, supply chain, trends, flip ideas & action plans…"
      );

      await new Promise(r => setTimeout(r, 400));
      pushLog(isServiceMode
        ? "Parsing service data & customer sentiment..."
        : "Parsing product data & community sentiment..."
      );
      await new Promise(r => setTimeout(r, 800));
      pushLog("Building pricing intelligence from real market data...");
      await new Promise(r => setTimeout(r, 800));
      pushLog(isServiceMode
        ? "Mapping customer journey friction & operational bottlenecks..."
        : "Mapping supply chain: suppliers, manufacturers, distributors..."
      );
      await new Promise(r => setTimeout(r, 800));
      pushLog("Generating flipped ideas from community pain points...");
      await new Promise(r => setTimeout(r, 800));
      pushLog(isServiceMode
        ? "Analyzing competitive landscape & differentiation opportunities..."
        : "Searching patent databases for relevant filings..."
      );
      await new Promise(r => setTimeout(r, 800));
      pushLog("Finalizing intelligence report...");

      const { data: analyzeData, error: analyzeError } = await supabase.functions.invoke(
        "analyze-products",
        {
          body: {
            rawContent: scrapeData.rawContent,
            communityContent: scrapeData.communityContent,
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
      if (!liveProducts?.length) throw new Error("No products returned from analysis.");

      pushLog(`Analysis complete — ${liveProducts.length} ${isServiceMode ? "service analyses" : "products"} with full intelligence reports ready.`);
      stopLoadingTimer();

      setProducts(liveProducts);
      setSelectedProduct(liveProducts[0]);
      setExpandedSection("detail");
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

  const handleRegenerateIdeas = async (product: Product, userContext?: string, rejectedIdeas?: string[]) => {
    if (!analysisParams) return;
    setGeneratingIdeasFor(product.id);

    try {
      const baseContext = `Focus on ${analysisParams.category} market trends.`;
      const fullContext = userContext ? `${baseContext}\n\nUser's additional guidance: ${userContext}` : baseContext;
      const { data, error } = await supabase.functions.invoke("generate-flip-ideas", {
        body: {
          product,
          additionalContext: fullContext,
          rejectedIdeas: rejectedIdeas || undefined,
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
      {/* Mobile Guided Tour */}
      {user && <MobileTour userId={user.id} />}

      {/* Exit-Intent Prompt */}
      {showExitPrompt && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ background: "hsl(var(--foreground) / 0.5)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-md rounded overflow-hidden" style={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}>
            <div className="p-6">
              <h3 className="text-base font-bold text-foreground mb-2">You haven't explored everything</h3>
              <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                You still have unexplored sections — these contain the most actionable insights.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowExitPrompt(false);
                    const firstUnvisited = [3, 4, 5].find(s => !visitedSteps.has(s));
                    if (firstUnvisited) {
                      setActiveStep(firstUnvisited);
                      setVisitedSteps(prev => new Set([...prev, firstUnvisited]));
                    }
                    setPendingExitAction(null);
                  }}
                  className="flex-1 py-2 rounded text-sm font-medium transition-colors"
                  style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
                >
                  Continue
                </button>
                <button
                  onClick={() => {
                    setShowExitPrompt(false);
                    if (pendingExitAction) pendingExitAction();
                    setPendingExitAction(null);
                  }}
                  className="px-4 py-2 rounded text-sm font-medium transition-colors"
                  style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))" }}
                >
                  Leave
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Paywall Modal */}
      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} />}

      {/* HERO */}
      <HeroSection tier={tier} remainingAnalyses={remainingAnalyses()} profileFirstName={profile?.first_name} onOpenSaved={() => setShowSavedPanel(true)} savedCount={savedCount} />

      {/* Saved Projects Sheet */}
      <Sheet open={showSavedPanel} onOpenChange={setShowSavedPanel}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Saved Projects</SheetTitle>
            <SheetDescription>Click any project to reload its full analysis</SheetDescription>
          </SheetHeader>
          <div className="mt-4">
            <SavedAnalyses
              onLoad={(a) => { handleLoadSaved(a); setShowSavedPanel(false); }}
              refreshTrigger={savedRefreshTrigger}
              onCountChange={setSavedCount}
            />
          </div>
        </SheetContent>
      </Sheet>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-6">
        {/* ── DISRUPTION PATH BANNER ── */}
        <DisruptionPathBanner />

        {/* ── VALUE PROPOSITION CALLOUT ── */}
        <ValuePropCallout />

        {/* ── TOP-LEVEL TAB BAR ── */}
        {(() => {
          const TABS = [
            { id: "custom" as const, label: "Disrupt This Product", icon: Upload, accent: "hsl(var(--mode-product))" },
            { id: "service" as const, label: "Disrupt This Service", icon: Briefcase, accent: "hsl(var(--mode-service))" },
            { id: "business" as const, label: "Disrupt This Business Model", icon: Building2, accent: "hsl(var(--mode-business))" },
          ];
          return (
            <div className="rounded-xl overflow-hidden border border-border bg-card">
              <div className="flex border-b" style={{ borderColor: "hsl(var(--border))" }}>
                {TABS.map((tab) => {
                  const isActive = mainTab === tab.id;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={(e) => {
                        setMainTab(tab.id);
                        setActiveMode(tab.id as AnalysisMode);
                        setTimeout(() => (e.currentTarget.closest('.rounded') as HTMLElement)?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
                      }}
                      className="flex items-center gap-2 px-4 py-3 text-xs font-medium transition-colors relative flex-1 justify-center"
                      style={{
                        color: isActive ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                        borderBottom: isActive ? "2px solid hsl(var(--foreground))" : "2px solid transparent",
                        background: isActive ? "hsl(var(--muted) / 0.5)" : "transparent",
                      }}
                    >
                      <Icon size={14} />
                      <span className="hidden sm:inline">{tab.label}</span>
                      <span className="sm:hidden text-[10px]">{tab.label.replace("Disrupt This ", "")}</span>
                    </button>
                  );
                })}
              </div>

              <div className="p-5">
                <ContextualTip
                  id="discovery-tip-1"
                  message={`Pro tip, ${profile?.first_name ?? "explorer"}: The best opportunities are in unexpected niches. The stranger the category, the less competition you'll face.`}
                />
                <div className="mt-4" data-tour="analysis-form">
                  <AnalysisForm
                    onAnalyze={handleAnalyze}
                    isLoading={isLoading}
                    mode={activeMode}
                    onModeChange={(m) => {
                      setActiveMode(m);
                      setMainTab(m as typeof mainTab);
                    }}
                    onBusinessAnalysis={(data) => {
                      setBusinessAnalysisData(data as BusinessModelAnalysisData);
                      toggleSection("businessmodel");
                      setTimeout(() => businessResultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })()}


        {/* LOADING — rich live tracker */}
        {isLoading && (
          <LoadingTracker
            step={step as "scraping" | "analyzing"}
            elapsedSeconds={elapsedSeconds}
            loadingLog={loadingLog}
          />
        )}

        {/* ERROR */}
        {step === "error" && (
          <div
            className="p-5 rounded flex items-start gap-3"
            style={{ background: "hsl(var(--destructive) / 0.05)", border: "1px solid hsl(var(--destructive) / 0.2)" }}
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
          const modeAccentLight = isCustomMode ? "hsl(var(--muted))" : "hsl(var(--muted))";
          const modeLabel = isCustomMode ? "Product Deep Audit" : "Market Intelligence";
          const totalSources = products.reduce((a, p) => a + (p.sources?.length || 0), 0);
          const totalIdeas = products.reduce((acc, p) => acc + (p.flippedIdeas?.length || 0), 0);
          const avgScore = (products.reduce((acc, p) => acc + p.revivalScore, 0) / products.length).toFixed(1);

          return (
          <div ref={resultsRef} className="space-y-5">
            {/* ── STICKY STEP NAVIGATOR ── */}
            <StepNavigator
              steps={[
                { step: 2, label: "Intelligence Report", description: "Deep market data, pricing & supply chain intel", icon: Target, color: modeAccent },
                { step: 3, label: "Deconstruct", description: "Assumptions, flip the logic & flipped ideas", icon: Brain, color: "hsl(271 81% 55%)" },
                { step: 4, label: "Redesign", description: "Interactive concept illustrations", icon: Sparkles, color: "hsl(38 92% 50%)" },
                { step: 5, label: "Stress Test", description: "Red vs Green team critical validation", icon: Swords, color: "hsl(350 80% 55%)" },
                { step: 6, label: "Pitch Deck", description: "Investor-ready presentation builder", icon: Presentation, color: "hsl(var(--primary))" },
              ]}
              activeStep={activeStep}
              visitedSteps={visitedSteps}
              onStepChange={(s) => {
                setActiveStep(s);
                setVisitedSteps(prev => new Set([...prev, s]));
                setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
              }}
            />

            {/* ── BACK TO SAVED PROJECTS ── */}
            {loadedFromSaved && (
              <button
                onClick={() => {
                  const unvisited = [3, 4, 5].filter(s => !visitedSteps.has(s));
                  if (unvisited.length > 0) {
                    setPendingExitAction(() => () => {
                      setMainTab("custom");
                      setLoadedFromSaved(false);
                      setStep("idle");
                      setProducts([]);
                      setSelectedProduct(null);
                      setBusinessAnalysisData(null);
                    });
                    setShowExitPrompt(true);
                  } else {
                    setMainTab("custom");
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
            <div className="rounded overflow-hidden" style={{ border: "1px solid hsl(var(--border))" }}>
              <div className="px-5 py-4 flex items-center gap-4" style={{ background: "hsl(var(--muted))" }}>
                <span className="flex-shrink-0 w-8 h-8 rounded flex items-center justify-center text-sm font-semibold" style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
                  2
                </span>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-bold text-foreground">Intelligence Report</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {products.length} product{products.length > 1 ? "s" : ""} · {totalSources} sources · {totalIdeas} ideas
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => selectedProduct && downloadFullAnalysisPDF(selectedProduct, { ...gatherAllAnalysisData(analysis), ...(disruptData ? { disrupt: disruptData } : {}), ...(stressTestData ? { stressTest: stressTestData } : {}), ...(selectedProduct.patentData ? { patentData: selectedProduct.patentData } : {}) })}
                    disabled={!selectedProduct}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors"
                    style={{ background: "hsl(var(--background))", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))", opacity: selectedProduct ? 1 : 0.5 }}
                  >
                    <FileDown size={12} /> PDF
                  </button>
                  <button
                    onClick={handleManualSave}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors"
                    style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))", opacity: isSaving ? 0.7 : 1 }}
                  >
                    {isSaving ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
                    {isSaving ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            </div>

            {/* ── PRODUCT SELECTOR ── */}
            {products.length > 1 && (
              <div className="flex flex-wrap gap-1.5">
                {products.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => {
                      setSelectedProduct(product);
                      setExpandedSection("detail");
                      setDetailTab("overview");
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors"
                    style={{
                      background: selectedProduct?.id === product.id ? "hsl(var(--primary))" : "hsl(var(--muted))",
                      color: selectedProduct?.id === product.id ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))",
                      border: `1px solid ${selectedProduct?.id === product.id ? "hsl(var(--primary))" : "hsl(var(--border))"}`,
                    }}
                  >
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
                <div className="space-y-5">
                  {/* Tab nav */}
                  {(() => {
                    const DETAIL_TABS = [
                      { id: "overview" as const, label: "Overview", icon: Target },
                      { id: "structure" as const, label: "Structure", icon: Layers },
                      { id: "community" as const, label: "Community", icon: Users },
                      { id: "workflow" as const, label: "User Journey", icon: Clock },
                      { id: "pricing" as const, label: "Pricing", icon: DollarSign },
                      { id: "supply" as const, label: "Supply Chain", icon: Package },
                      { id: "patents" as const, label: "Patents", icon: ScrollText },
                    ];
                    const currentIdx = DETAIL_TABS.findIndex(t => t.id === detailTab);
                    return (
                    <>
                  <div ref={sectionTabsRef} className="flex gap-1 border-b pb-2 overflow-x-auto scrollbar-hide" style={{ borderColor: "hsl(var(--border))" }}>
                    {DETAIL_TABS.map(({ id, label, icon: Icon }) => {
                      const isActive = detailTab === id;
                      const isUnvisited = !isActive && !visitedDetailTabs.has(id);
                      return (
                        <button
                          key={id}
                          onClick={() => { setDetailTab(id); setVisitedDetailTabs(prev => new Set([...prev, id])); setTimeout(() => sectionTabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50); }}
                          className="flex items-center gap-1.5 px-3 py-2 rounded text-xs font-medium transition-colors flex-shrink-0 whitespace-nowrap"
                          style={{
                            background: isActive ? "hsl(var(--primary))" : "transparent",
                            color: isActive ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
                          }}
                        >
                          {isUnvisited && (
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "hsl(var(--primary))" }} />
                          )}
                          <Icon size={13} />
                          <span className="hidden sm:inline">{label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* TAB: OVERVIEW */}
                  {detailTab === "overview" && (
                    <div className="space-y-6">
                      {/* Key Takeaway Banner */}
                      {selectedProduct.keyInsight && (
                        <KeyTakeawayBanner
                          takeaway={selectedProduct.keyInsight}
                          accentColor="hsl(var(--primary))"
                          badges={getVerdictBadges(selectedProduct as any)}
                        />
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Product image - only show if user-uploaded */}
                        {(selectedProduct as unknown as { imageSource?: string }).imageSource === "user" && (
                        <div className="md:col-span-1">
                          <div className="rounded overflow-hidden" style={{ border: "1px solid hsl(var(--border))" }}>
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
                        )}
                        <div className={`${(selectedProduct as unknown as { imageSource?: string }).imageSource === "user" ? "md:col-span-2" : "md:col-span-3"} space-y-4`}>
                          {/* Tags & score */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="tag-pill">{selectedProduct.category}</span>
                          </div>

                          {/* Key Insight — professional callout */}
                          {selectedProduct.keyInsight && (
                            <div className="insight-callout">
                              <p className="typo-card-eyebrow mb-1.5 flex items-center gap-1 not-italic">
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
                            <p className="typo-card-eyebrow mb-2.5">Live Sources</p>
                            <div className="flex flex-wrap gap-2">
                              {selectedProduct.sources?.map((src) => (
                                <a
                                  key={src.url}
                                  href={src.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                                  style={{ background: "hsl(var(--muted))", color: "hsl(var(--primary))", border: "1px solid hsl(var(--border))" }}
                                >
                                  <ExternalLink size={10} />
                                  {src.label?.slice(0, 40)}
                                </a>
                              ))}
                            </div>
                          </div>

                        </div>
                      </div>
                      {/* Reviews & Competitors */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="section-panel">
                          <p className="typo-card-eyebrow mb-3 flex items-center gap-1">
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
                          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1.5">Competitors</p>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedProduct.competitors?.map((c) => (
                              <span key={c} className="tag-pill">{c}</span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Assumptions Map */}
                      <div className="section-panel">
                        <p className="typo-card-eyebrow mb-3">Assumptions Map</p>
                        <AssumptionsMap product={selectedProduct} />
                      </div>
                    </div>
                  )}

                  {/* TAB: STRUCTURE (Decomposition) */}
                  {detailTab === "structure" && (
                    <DecompositionViewer />
                  )}

                  {/* TAB: COMMUNITY INTEL */}
                  {detailTab === "community" && (
                    <div className="space-y-6">
                      {/* Key Takeaway Banner */}
                      {(() => {
                        const ci = (selectedProduct as unknown as { communityInsights?: { topComplaints?: string[]; improvementRequests?: string[]; communitySentiment?: string; redditSentiment?: string } }).communityInsights;
                        const takeaway = ci ? getCommunityTakeaway(ci) : null;
                        return takeaway ? <KeyTakeawayBanner takeaway={takeaway} accentColor="hsl(25 90% 40%)" /> : null;
                      })()}
                      {/* Community Sentiment */}
                      {(selectedProduct as unknown as { communityInsights?: { communitySentiment?: string; redditSentiment?: string; topComplaints?: string[]; improvementRequests?: string[]; competitorComplaints?: string[] } }).communityInsights ? (
                        <>
                          {(() => {
                            const ci = (selectedProduct as unknown as { communityInsights: { communitySentiment?: string; redditSentiment?: string; topComplaints?: string[]; improvementRequests?: string[]; competitorComplaints?: string[] } }).communityInsights;
                            const sentiment = ci.communitySentiment || ci.redditSentiment;
                            const hasRealSentiment = sentiment && !/no direct.*found|not found|no.*sentiment.*found/i.test(sentiment);
                            return (
                              <div className="space-y-5">
                                {hasRealSentiment && (
                                  <div className="p-4 rounded-xl" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                                    <p className="typo-card-eyebrow mb-2 flex items-center gap-1" style={{ color: "hsl(25 90% 40%)" }}>
                                      <MessageSquare size={12} /> Community Sentiment
                                    </p>
                                    <p className="text-sm leading-relaxed" style={{ color: "hsl(25 90% 30%)" }}>{sentiment}</p>
                                  </div>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {ci.topComplaints?.length ? (
                                    <div>
                                       <p className="typo-card-eyebrow mb-3 flex items-center gap-1">
                                        <ThumbsDown size={12} style={{ color: "hsl(var(--destructive))" }} /> Top Complaints
                                      </p>
                                      <div className="space-y-2">
                                        {ci.topComplaints.map((c, i) => (
                                          <div key={i} className="flex gap-2 items-start p-3 rounded-lg text-xs" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                                            <ShieldAlert size={12} style={{ color: "hsl(var(--destructive))", flexShrink: 0, marginTop: 1 }} />
                                            <span className="text-foreground/80">{c}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ) : null}
                                  {ci.improvementRequests?.length ? (
                                    <div>
                                       <p className="typo-card-eyebrow mb-3 flex items-center gap-1">
                                        <Wrench size={12} style={{ color: "hsl(217 91% 60%)" }} /> Community Improvement Requests
                                      </p>
                                      <div className="space-y-2">
                                        {ci.improvementRequests.map((r, i) => (
                                          <div key={i} className="flex gap-2 items-start p-3 rounded-lg text-xs" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                                            <Lightbulb size={12} style={{ color: "hsl(217 91% 55%)", flexShrink: 0, marginTop: 1 }} />
                                            <span className="text-foreground/80">{r}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ) : null}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {ci.competitorComplaints?.length ? (
                                    <div>
                                       <p className="typo-card-eyebrow mb-3 flex items-center gap-1">
                                        <ThumbsUp size={12} style={{ color: "hsl(142 70% 40%)" }} /> Why People Hate Current Alternatives
                                      </p>
                                      <div className="space-y-2">
                                        {ci.competitorComplaints.map((c, i) => (
                                          <div key={i} className="flex gap-2 items-start p-3 rounded-lg text-xs" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
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
                          <p className="text-xs text-muted-foreground mt-1">Sample data doesn't include community scraping.</p>
                        </div>
                      )}

                      {/* Reviews + Social Signals */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <p className="typo-card-eyebrow mb-3 flex items-center gap-1">
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
                          <p className="typo-card-eyebrow mb-3 flex items-center gap-1">
                            <TrendingUp size={12} /> Demand Signals
                          </p>
                          <div className="space-y-2">
                            {selectedProduct.socialSignals?.map((sig, i) => (
                              <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <TrendBadge trend={sig.trend} />
                                  </div>
                                  <p className="text-[11px] text-muted-foreground">{sig.signal}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
                                    {sig.volume}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB: USER JOURNEY */}
                  {detailTab === "workflow" && (
                    <div className="space-y-4">
                      {(() => {
                        const productData = selectedProduct as unknown as Record<string, unknown>;
                        const takeaway = getWorkflowTakeaway(productData);
                        return takeaway ? <KeyTakeawayBanner takeaway={takeaway} accentColor="hsl(217 91% 55%)" /> : null;
                      })()}
                      {(() => {
                        const uw = (selectedProduct as unknown as { userWorkflow?: { stepByStep?: string[]; frictionPoints?: { step: string; friction: string; severity: "high" | "medium" | "low"; rootCause: string }[]; cognitiveLoad?: string; contextOfUse?: string } }).userWorkflow;
                        if (!uw?.stepByStep?.length) {
                          return (
                            <div className="py-8 text-center">
                              <Clock size={32} className="mx-auto mb-3 opacity-20" />
                              <p className="text-sm text-muted-foreground">User journey data generates with deeper analysis runs.</p>
                            </div>
                          );
                        }
                        return (
                          <div className="space-y-4">
                            <WorkflowTimeline steps={uw.stepByStep} frictionPoints={uw.frictionPoints || []} />
                            {uw.cognitiveLoad && (
                              <div className="p-3 rounded-lg" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Cognitive Load</p>
                                <p className="text-xs text-foreground/80">{uw.cognitiveLoad}</p>
                              </div>
                            )}
                            {uw.contextOfUse && (
                              <div className="p-3 rounded-lg" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Context of Use</p>
                                <p className="text-xs text-foreground/80">{uw.contextOfUse}</p>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* TAB: PRICING INTEL */}
                  {detailTab === "pricing" && selectedProduct.pricingIntel && (
                    <div className="space-y-4">
                      {/* Key Takeaway Banner */}
                      {(() => {
                        const takeaway = getPricingTakeaway(selectedProduct.pricingIntel as any);
                        return takeaway ? <KeyTakeawayBanner takeaway={takeaway} accentColor="hsl(142 70% 35%)" /> : null;
                      })()}
                      <PricingIntelCard pricingIntel={selectedProduct.pricingIntel as any} />
                    </div>
                  )}

                  {detailTab === "pricing" && !selectedProduct.pricingIntel && (
                    <p className="text-sm text-muted-foreground text-center py-8">No pricing intelligence available for this product.</p>
                  )}

                  {/* TAB: SUPPLY CHAIN */}
                  {detailTab === "supply" && selectedProduct.supplyChain && (
                    <div className="space-y-6">
                      {/* Key Takeaway Banner */}
                      {(() => {
                        const takeaway = getSupplyChainTakeaway(selectedProduct.supplyChain as any);
                        return takeaway ? <KeyTakeawayBanner takeaway={takeaway} accentColor="hsl(217 91% 55%)" /> : null;
                      })()}
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
                        <p className="typo-card-eyebrow mb-3 flex items-center gap-2">
                          <Store size={14} style={{ color: "hsl(142 70% 40%)" }} /> Retailers & Market Share
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {selectedProduct.supplyChain.retailers.map((r) => (
                            <div key={r.name} className="p-3 rounded-xl text-center space-y-1" style={{ background: "hsl(142 70% 45% / 0.08)", border: "1px solid hsl(142 70% 45% / 0.2)" }}>
                              <p className="text-xs font-bold text-foreground">{r.name}</p>
                              <p className="text-[10px] text-muted-foreground">{r.type}</p>
                              <p className="text-lg font-bold" style={{ color: "hsl(142 70% 35%)" }}>{r.marketShare}</p>
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
                    <p className="text-sm text-muted-foreground text-center py-8">Supply chain data generates with deeper analysis runs.</p>
                  )}

                  {/* TAB: PATENTS */}
                  {detailTab === "patents" && (
                    <PatentIntelligence product={selectedProduct} />
                  )}

                  {/* TAB: ACTION PLAN */}
                  {detailTab === "action" && selectedProduct.actionPlan && (
                    <div className="space-y-6">
                      <div
                        className="p-4 rounded-xl text-sm leading-relaxed"
                        style={{ background: "hsl(var(--primary-muted))", borderLeft: "4px solid hsl(var(--primary))" }}
                      >
                        <p className="typo-card-eyebrow mb-2">Strategic Direction</p>
                        <p style={{ color: "hsl(var(--primary-dark))" }}>{selectedProduct.actionPlan.strategy}</p>
                      </div>

                      {/* Quick Wins */}
                      <div>
                        <p className="typo-card-eyebrow mb-3 flex items-center gap-1">
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
                        <p className="typo-card-eyebrow mb-3">Execution Roadmap</p>
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
                                Milestone: {phase.milestone}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Summary metrics */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-4 rounded-xl text-center" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                          <p className="typo-card-eyebrow mb-1">Total Investment</p>
                          <p className="text-lg font-bold text-foreground">{selectedProduct.actionPlan.totalInvestment}</p>
                        </div>
                        <div className="p-4 rounded-xl text-center" style={{ background: "hsl(142 70% 45% / 0.08)", border: "1px solid hsl(142 70% 45% / 0.3)" }}>
                          <p className="typo-card-eyebrow mb-1" style={{ color: "hsl(142 70% 35%)" }}>Expected ROI</p>
                          <p className="text-lg font-bold" style={{ color: "hsl(142 70% 28%)" }}>{selectedProduct.actionPlan.expectedROI}</p>
                        </div>
                        <div className="p-4 rounded-xl" style={{ background: "hsl(var(--primary-muted))", border: "1px solid hsl(var(--primary) / 0.2)" }}>
                          <p className="typo-card-eyebrow mb-2">Go-To-Market Channels</p>
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

                  {/* ── Rerun Intelligence Report ── */}
                  <div className="rounded-xl p-4 space-y-3" style={{ background: "hsl(var(--primary) / 0.06)", border: "1px solid hsl(var(--primary) / 0.18)", borderLeft: "4px solid hsl(var(--primary))" }}>
                    <div className="flex items-center gap-2">
                      <Telescope size={14} style={{ color: "hsl(var(--primary))" }} />
                      <p className="text-xs font-bold" style={{ color: "hsl(var(--primary))" }}>Rerun Intelligence Report</p>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Re-scrape live market data and regenerate the full intelligence report with fresh pricing, supply chain, community, and patent data.
                    </p>
                    <textarea
                      value={intelRerunNotes}
                      onChange={(e) => setIntelRerunNotes(e.target.value)}
                      placeholder="Optional: guide the rerun — e.g. focus on European suppliers, look for newer pricing data…"
                      className="w-full rounded-lg px-3 py-2.5 text-xs leading-relaxed resize-none transition-colors focus:outline-none"
                      style={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))", minHeight: 48 }}
                      rows={2}
                    />
                    <button
                      onClick={() => {
                        if (!analysisParams) return;
                        handleAnalyze({ ...analysisParams });
                      }}
                      disabled={isLoading || !analysisParams}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all"
                      style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))", opacity: isLoading || !analysisParams ? 0.5 : 1 }}
                    >
                      <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
                      {isLoading ? "Running…" : "Rerun Intel Report"}
                    </button>
                  </div>

                  {/* Next / Previous section nav */}
                  <div className="flex items-center justify-between pt-4 mt-4" style={{ borderTop: "2px solid hsl(var(--border))" }}>
                    {currentIdx > 0 ? (
                      <button
                        onClick={() => {
                          const prevTab = DETAIL_TABS[currentIdx - 1].id;
                          setDetailTab(prevTab);
                          setVisitedDetailTabs(prev => new Set([...prev, prevTab]));
                          setTimeout(() => sectionTabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
                        style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))", border: "2px solid hsl(var(--border))" }}
                      >
                        <ChevronLeft size={16} />
                        {DETAIL_TABS[currentIdx - 1].label}
                      </button>
                    ) : <div />}
                    {currentIdx < DETAIL_TABS.length - 1 ? (
                      <button
                        onClick={() => {
                          const nextTab = DETAIL_TABS[currentIdx + 1].id;
                          setDetailTab(nextTab);
                          setVisitedDetailTabs(prev => new Set([...prev, nextTab]));
                          setTimeout(() => sectionTabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors"
                        style={{
                          background: "hsl(var(--primary))",
                          color: "hsl(var(--primary-foreground))",
                        }}
                      >
                        Next: {DETAIL_TABS[currentIdx + 1].label}
                        <ChevronRight size={16} />
                      </button>
                    ) : (
                      <span className="text-xs font-bold px-3 py-2 rounded-lg" style={{ background: "hsl(142 70% 45% / 0.12)", color: "hsl(142 70% 35%)" }}>
                        All sections explored
                      </span>
                    )}
                  </div>

                  </>
                    );
                  })()}
                </div>
              </SectionAccordion>
            )}
            </>
            )}

            {/* ── STEP 3: DISRUPT ── */}
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
                <div className="rounded overflow-hidden" style={{ border: "1px solid hsl(var(--border))" }}>
                  <div className="px-5 py-4 flex items-start gap-4" style={{ background: "hsl(var(--card))" }}>
                    <div className="flex-shrink-0 w-7 h-7 rounded flex items-center justify-center text-white font-semibold text-sm" style={{ background: "hsl(271 81% 55%)" }}>3</div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-bold text-foreground">Disrupt</h2>
                      <p className="text-sm text-muted-foreground">Deconstructing <strong className="text-foreground">{selectedProduct.name}</strong> — questioning every assumption and generating radical reinvention ideas.</p>
                    </div>
                  </div>
                  <div className="p-5" style={{ background: "hsl(var(--card))" }}>
                    <FirstPrinciplesAnalysis
                      product={selectedProduct}
                      onSaved={() => setSavedRefreshTrigger((n) => n + 1)}
                      flippedIdeas={selectedProduct.flippedIdeas}
                      onRegenerateIdeas={(ctx) => handleRegenerateIdeas(selectedProduct, ctx)}
                      generatingIdeas={generatingIdeasFor === selectedProduct.id}
                      externalData={disruptData}
                      onDataLoaded={setDisruptData}
                      onPatentSave={(patentData) => {
                        const updated = products.map(p =>
                          p.id === selectedProduct.id ? { ...p, patentData } : p
                        );
                        setProducts(updated);
                        setSelectedProduct({ ...selectedProduct, patentData });
                        if (analysisParams) saveAnalysis(updated, analysisParams);
                      }}
                    />
                  </div>
                </div>
                {/* Next Step: Redesign */}
                <button
                  onClick={() => { setActiveStep(4); setVisitedSteps(prev => new Set([...prev, 4])); setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100); }}
                  className="w-full flex items-center justify-center gap-2 text-sm font-bold px-5 py-3.5 rounded-lg transition-colors"
                  style={{ background: "hsl(38 92% 50%)", color: "white" }}
                >
                  Next: Redesign <ArrowRight size={14} />
                </button>
              </div>
            )}

            {/* ── STEP 4: REDESIGN ── */}
            {activeStep === 4 && selectedProduct && (
              <div className="space-y-4">
                <button
                  onClick={() => setActiveStep(3)}
                  className="flex items-center gap-2 text-sm font-semibold transition-colors hover:opacity-80"
                  style={{ color: "hsl(38 92% 50%)" }}
                >
                  <ArrowLeft size={16} />
                  Back to Disrupt
                </button>
                <div className="rounded overflow-hidden" style={{ border: "1px solid hsl(var(--border))" }}>
                  <div className="px-5 py-4 flex items-start gap-4" style={{ background: "hsl(var(--card))" }}>
                    <div className="flex-shrink-0 w-7 h-7 rounded flex items-center justify-center text-white font-semibold text-sm" style={{ background: "hsl(38 92% 50%)" }}>4</div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-bold text-foreground">Redesign</h2>
                      <p className="text-sm text-muted-foreground">Interactive concept illustrations for <strong className="text-foreground">{selectedProduct.name}</strong> — visualizing the reinvented model.</p>
                    </div>
                  </div>
                  <div className="p-5" style={{ background: "hsl(var(--card))" }}>
                    <FirstPrinciplesAnalysis
                      product={selectedProduct}
                      onSaved={() => setSavedRefreshTrigger((n) => n + 1)}
                      flippedIdeas={selectedProduct.flippedIdeas}
                      onRegenerateIdeas={(ctx) => handleRegenerateIdeas(selectedProduct, ctx)}
                      generatingIdeas={generatingIdeasFor === selectedProduct.id}
                      renderMode="redesign"
                      externalData={disruptData}
                      onDataLoaded={setDisruptData}
                      onPatentSave={(patentData) => {
                        const updated = products.map(p =>
                          p.id === selectedProduct.id ? { ...p, patentData } : p
                        );
                        setProducts(updated);
                        setSelectedProduct({ ...selectedProduct, patentData });
                        if (analysisParams) saveAnalysis(updated, analysisParams);
                      }}
                    />
                  </div>
                </div>
                {/* Next Step: Stress Test */}
                <button
                  onClick={() => { setActiveStep(5); setVisitedSteps(prev => new Set([...prev, 5])); setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100); }}
                  className="w-full flex items-center justify-center gap-2 text-sm font-bold px-5 py-3.5 rounded-lg transition-colors"
                  style={{ background: "hsl(350 80% 55%)", color: "white" }}
                >
                  Next: Stress Test <ArrowRight size={14} />
                </button>
              </div>
            )}

            {/* ── STEP 5: STRESS TEST ── */}
            {activeStep === 5 && selectedProduct && (
              <div className="space-y-4">
                <button
                  onClick={() => setActiveStep(4)}
                  className="flex items-center gap-2 text-sm font-semibold transition-colors hover:opacity-80"
                  style={{ color: "hsl(350 80% 55%)" }}
                >
                  <ArrowLeft size={16} />
                  Back to Redesign
                </button>
                <div className="rounded overflow-hidden" style={{ border: "1px solid hsl(var(--border))" }}>
                  <div className="px-5 py-4 flex items-start gap-4" style={{ background: "hsl(var(--card))" }}>
                    <div className="flex-shrink-0 w-7 h-7 rounded flex items-center justify-center text-white font-semibold text-sm" style={{ background: "hsl(350 80% 55%)" }}>5</div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-bold text-foreground">Stress Test</h2>
                      <p className="text-sm text-muted-foreground">Red Team vs Green Team critical validation for <strong className="text-foreground">{selectedProduct.name}</strong> — counter-examples, feasibility, confidence scoring.</p>
                    </div>
                  </div>
                  <div className="p-5 space-y-6" style={{ background: "hsl(var(--card))" }}>
                    {/* Sub-tabs for Debate and Validate */}
                    <div className="flex gap-2">
                      {[
                        { id: "debate" as const, label: "Red vs Green Debate", icon: Swords },
                        { id: "validate" as const, label: "Validate & Score", icon: CheckCircle2 },
                      ].map(tab => {
                        const isActive = (stressTestTab) === tab.id;
                        const TabIcon = tab.icon;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => { setStressTestTab(tab.id); setVisitedStressTestTabs(prev => new Set([...prev, tab.id])); }}
                            className="flex items-center gap-2 px-4 py-2.5 rounded text-sm font-medium transition-colors relative"
                            style={{
                              background: isActive ? "hsl(350 80% 55%)" : "transparent",
                              color: isActive ? "white" : "hsl(var(--muted-foreground))",
                              border: isActive ? "1px solid hsl(350 80% 55%)" : "1px solid hsl(var(--border))",
                            }}
                          >
                            {!isActive && !visitedStressTestTabs.has(tab.id) && (
                              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "hsl(350 80% 55%)" }} />
                            )}
                            <TabIcon size={14} />
                            {tab.label}
                          </button>
                        );
                      })}
                    </div>
                    <CriticalValidation
                      product={selectedProduct}
                      analysisData={selectedProduct}
                      activeTab={stressTestTab}
                      externalData={stressTestData}
                      onDataLoaded={setStressTestData}
                    />
                  </div>
                </div>
                {/* Next Step: Pitch Deck */}
                <button
                  onClick={() => { setActiveStep(6); setVisitedSteps(prev => new Set([...prev, 6])); setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100); }}
                  className="w-full flex items-center justify-center gap-2 text-sm font-bold px-5 py-3.5 rounded-lg transition-colors"
                  style={{ background: "hsl(var(--primary))", color: "white" }}
                >
                  Next: Pitch Deck <ArrowRight size={14} />
                </button>
              </div>
            )}

            {/* ── STEP 6: PITCH DECK ── */}
            {activeStep === 6 && selectedProduct && (
              <div className="space-y-4">
                <button
                  onClick={() => setActiveStep(5)}
                  className="flex items-center gap-2 text-sm font-semibold transition-colors hover:opacity-80"
                  style={{ color: "hsl(var(--primary))" }}
                >
                  <ArrowLeft size={16} />
                  Back to Stress Test
                </button>
                <div className="rounded overflow-hidden" style={{ border: "1px solid hsl(var(--border))" }}>
                  <div className="px-5 py-4 flex items-start gap-4" style={{ background: "hsl(var(--card))" }}>
                    <div className="flex-shrink-0 w-7 h-7 rounded flex items-center justify-center text-white font-semibold text-sm" style={{ background: "hsl(var(--primary))" }}>6</div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-bold text-foreground">Investor Pitch Deck</h2>
                      <p className="text-sm text-muted-foreground">Professional pitch deck for <strong className="text-foreground">{selectedProduct.name}</strong> — TAM/SAM/SOM, unit economics, go-to-market strategy.</p>
                    </div>
                  </div>
                  <div className="p-5" style={{ background: "hsl(var(--card))" }}>
                    <PitchDeck product={selectedProduct} />
                    {/* Referral CTA after Pitch Deck */}
                    <div className="mt-6">
                      <ReferralCTA />
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
          );
        })()}


        {businessAnalysisData && (() => {
          const bizAccent = "hsl(271 81% 55%)";
          const bizAccentLight = "hsl(271 81% 55% / 0.06)";
          const bizName = businessModelInput?.type || "Business Model";

          // Synthetic product for Stress Test and Pitch Deck
          const bizSyntheticProduct: Product = {
            id: "biz-model",
            name: bizName,
            category: "Business Model",
            era: "Present",
            image: "",
            description: businessAnalysisData.businessSummary?.trueJobToBeDone || businessModelInput?.description || "",
            specs: businessModelInput?.description || "",
            revivalScore: 75,
            keyInsight: businessAnalysisData.businessSummary?.currentModel || "",
            sources: [],
            reviews: [],
            socialSignals: [],
            competitors: [],
            assumptionsMap: (businessAnalysisData.hiddenAssumptions || []).map((a: { assumption: string; challengeIdea: string }) => ({ assumption: a.assumption, challenge: a.challengeIdea })),
            flippedIdeas: [],
            confidenceScores: { adoptionLikelihood: 7, feasibility: 7, emotionalResonance: 6 },
            marketSizeEstimate: businessAnalysisData.revenueReinvention?.currentRevenueMix,
          };

          return (
          <div ref={businessResultsRef} className="space-y-5">
            {/* ── STICKY STEP NAVIGATOR ── */}
            <StepNavigator
              steps={[
                { step: 2, label: "Intelligence Report", description: "Business model deep analysis", icon: Target, color: bizAccent },
                { step: 3, label: "Deconstruct", description: "Challenge assumptions & reinvent", icon: Brain, color: "hsl(271 81% 55%)" },
                { step: 4, label: "Redesign", description: "Reinvented concept illustrations", icon: Sparkles, color: "hsl(38 92% 50%)" },
                { step: 5, label: "Stress Test", description: "Red vs Green team debate", icon: Swords, color: "hsl(350 80% 55%)" },
                { step: 6, label: "Pitch Deck", description: "Investor-ready pitch builder", icon: Presentation, color: "hsl(var(--primary))" },
              ]}
              activeStep={businessActiveStep}
              visitedSteps={businessVisitedSteps}
              onStepChange={(s) => {
                setBusinessActiveStep(s);
                setBusinessVisitedSteps(prev => new Set([...prev, s]));
                setTimeout(() => businessResultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
              }}
            />

            {/* ── BACK TO SAVED PROJECTS ── */}
            {loadedFromSaved && (
              <button
                onClick={() => {
                  setMainTab("custom");
                  setLoadedFromSaved(false);
                  setBusinessAnalysisData(null);
                  setBusinessModelInput(null);
                }}
                className="flex items-center gap-2 text-sm font-semibold transition-colors hover:opacity-80"
                style={{ color: bizAccent }}
              >
                <ArrowLeft size={16} />
                Back to Saved Projects
              </button>
            )}

            {/* ── STEP 2: INTELLIGENCE REPORT ── */}
            {businessActiveStep === 2 && (
              <div className="space-y-4">
                <div className="rounded overflow-hidden" style={{ border: "1px solid hsl(var(--border))" }}>
                  <div className="px-5 py-4 flex items-center gap-4" style={{ background: "hsl(var(--card))" }}>
                    <div className="flex-shrink-0 w-7 h-7 rounded flex items-center justify-center text-white font-semibold text-sm" style={{ background: bizAccent }}>2</div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-bold text-foreground">Intelligence Report</h2>
                      <p className="text-sm text-muted-foreground">Deep business model deconstruction for <strong className="text-foreground">{bizName}</strong></p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => downloadFullAnalysisPDF(bizSyntheticProduct, gatherBusinessAnalysisData(analysis))}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                        style={{ background: "hsl(var(--secondary))", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))" }}
                      >
                        <FileDown size={12} /> PDF
                      </button>
                    </div>
                  </div>
                  <div className="p-5" style={{ background: "hsl(var(--card))" }}>
                    <BusinessModelAnalysis initialData={businessAnalysisData} renderMode="report" onSaved={() => setSavedRefreshTrigger((n) => n + 1)} />
                  </div>
                </div>

              </div>
            )}

            {/* ── STEP 3: DISRUPT ── */}
            {businessActiveStep === 3 && (
              <div className="space-y-4">
                <button
                  onClick={() => setBusinessActiveStep(2)}
                  className="flex items-center gap-2 text-sm font-semibold transition-colors hover:opacity-80"
                  style={{ color: "hsl(350 80% 55%)" }}
                >
                  <ArrowLeft size={16} />
                  Back to Intelligence Report
                </button>
                <div className="rounded overflow-hidden" style={{ border: "1px solid hsl(var(--border))" }}>
                  <div className="px-5 py-4 flex items-start gap-4" style={{ background: "hsl(var(--card))" }}>
                    <div className="flex-shrink-0 w-7 h-7 rounded flex items-center justify-center text-white font-semibold text-sm" style={{ background: "hsl(350 80% 55%)" }}>3</div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-bold text-foreground">Disrupt</h2>
                      <p className="text-sm text-muted-foreground">Disruption vulnerabilities and reinvented model for <strong className="text-foreground">{bizName}</strong></p>
                    </div>
                  </div>
                  <div className="p-5" style={{ background: "hsl(var(--card))" }}>
                    <BusinessModelAnalysis initialData={businessAnalysisData} renderMode="disrupt" onSaved={() => setSavedRefreshTrigger((n) => n + 1)} />
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 4: STRESS TEST ── */}
            {businessActiveStep === 4 && (
              <div className="space-y-4">
                <button
                  onClick={() => setBusinessActiveStep(2)}
                  className="flex items-center gap-2 text-sm font-semibold transition-colors hover:opacity-80"
                  style={{ color: "hsl(38 92% 50%)" }}
                >
                  <ArrowLeft size={16} />
                  Back to Intelligence Report
                </button>
                <div className="rounded overflow-hidden" style={{ border: "1px solid hsl(var(--border))" }}>
                  <div className="px-5 py-4 flex items-start gap-4" style={{ background: "hsl(var(--card))" }}>
                    <div className="flex-shrink-0 w-7 h-7 rounded flex items-center justify-center text-white font-semibold text-sm" style={{ background: "hsl(38 92% 50%)" }}>4</div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-bold text-foreground">Stress Test</h2>
                      <p className="text-sm text-muted-foreground">Red Team vs Green Team critical validation for <strong className="text-foreground">{bizName}</strong></p>
                    </div>
                  </div>
                  <div className="p-5 space-y-6" style={{ background: "hsl(var(--card))" }}>
                    <div className="flex gap-2">
                      {[
                        { id: "debate" as const, label: "Red vs Green Debate", icon: Swords },
                        { id: "validate" as const, label: "Validate & Score", icon: CheckCircle2 },
                      ].map(tab => {
                        const isActive = businessStressTestTab === tab.id;
                        const TabIcon = tab.icon;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => { setBusinessStressTestTab(tab.id); setVisitedBusinessStressTestTabs(prev => new Set([...prev, tab.id])); }}
                            className="flex items-center gap-2 px-4 py-2.5 rounded text-sm font-medium transition-colors relative"
                            style={{
                              background: isActive ? "hsl(38 92% 50%)" : "transparent",
                              color: isActive ? "white" : "hsl(var(--muted-foreground))",
                              border: isActive ? "1px solid hsl(38 92% 50%)" : "1px solid hsl(var(--border))",
                            }}
                          >
                            {!isActive && !visitedBusinessStressTestTabs.has(tab.id) && (
                              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "hsl(38 92% 50%)" }} />
                            )}
                            <TabIcon size={14} />
                            {tab.label}
                          </button>
                        );
                      })}
                    </div>
                    <CriticalValidation
                      product={{ name: bizName, category: "Business Model" }}
                      analysisData={businessAnalysisData}
                      activeTab={businessStressTestTab}
                      externalData={businessStressTestData}
                      onDataLoaded={setBusinessStressTestData}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 5: PITCH DECK ── */}
            {businessActiveStep === 5 && (
              <div className="space-y-4">
                <button
                  onClick={() => setBusinessActiveStep(2)}
                  className="flex items-center gap-2 text-sm font-semibold transition-colors hover:opacity-80"
                  style={{ color: "hsl(var(--primary))" }}
                >
                  <ArrowLeft size={16} />
                  Back to Intelligence Report
                </button>
                <div className="rounded overflow-hidden" style={{ border: "1px solid hsl(var(--border))" }}>
                  <div className="px-5 py-4 flex items-start gap-4" style={{ background: "hsl(var(--card))" }}>
                    <div className="flex-shrink-0 w-7 h-7 rounded flex items-center justify-center text-white font-semibold text-sm" style={{ background: "hsl(var(--primary))" }}>5</div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-bold text-foreground">Pitch Deck</h2>
                      <p className="text-sm text-muted-foreground">Auto-generated investor-ready pitch for <strong className="text-foreground">{bizName}</strong></p>
                    </div>
                  </div>
                  <div className="p-5" style={{ background: "hsl(var(--card))" }}>
                    <PitchDeck product={bizSyntheticProduct} />
                  </div>
                </div>
              </div>
            )}
          </div>
          );
        })()}

        {/* ── Business Model Form (when no results yet) ── */}
        {!businessAnalysisData && mainTab === "business" && (
          <div ref={businessResultsRef}>
            <BusinessModelAnalysis
              onSaved={() => setSavedRefreshTrigger((n) => n + 1)}
              onAnalysisComplete={(data, input) => {
                setBusinessAnalysisData(data);
                setBusinessModelInput(input);
                setBusinessActiveStep(2);
                setBusinessVisitedSteps(new Set([2]));
                setTimeout(() => businessResultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
              }}
            />
          </div>
        )}

        {/* SGP Capital CTA moved to PitchDeck component */}

      </main>

      <footer className="border-t mt-12 py-8 text-center" style={{ borderColor: "hsl(var(--border))" }}>
        {profile && <p className="text-xs mt-2 text-muted-foreground">Signed in as <strong className="text-foreground">{profile.first_name}</strong></p>}
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
      <p className="typo-card-eyebrow mb-3 flex items-center gap-2">{icon} {title}</p>
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
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "hsl(var(--muted))" }}>
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
