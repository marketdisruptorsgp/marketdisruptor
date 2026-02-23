import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { type Product, type FlippedIdea } from "@/data/mockProducts";
import { type AnalysisMode } from "@/components/AnalysisForm";
import { type BusinessModelAnalysisData } from "@/components/BusinessModelAnalysis";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export type AnalysisStep = "idle" | "scraping" | "analyzing" | "done" | "error";

export interface BusinessModelInput {
  type: string;
  description: string;
  revenueModel?: string;
  size?: string;
  geography?: string;
  painPoints?: string;
  notes?: string;
}

interface AnalysisContextType {
  // Core state
  step: AnalysisStep;
  setStep: (s: AnalysisStep) => void;
  products: Product[];
  setProducts: (p: Product[]) => void;
  selectedProduct: Product | null;
  setSelectedProduct: (p: Product | null) => void;
  analysisParams: { category: string; era: string; batchSize: number } | null;
  setAnalysisParams: (p: { category: string; era: string; batchSize: number } | null) => void;
  errorMsg: string;
  setErrorMsg: (msg: string) => void;

  // Mode
  mainTab: "discover" | "custom" | "service" | "business";
  setMainTab: (t: "discover" | "custom" | "service" | "business") => void;
  activeMode: AnalysisMode;
  setActiveMode: (m: AnalysisMode) => void;

  // Loading
  elapsedSeconds: number;
  loadingLog: { text: string; ts: number }[];
  stepMessage: string;

  // Detail tabs
  detailTab: string;
  setDetailTab: (t: string) => void;
  visitedDetailTabs: Set<string>;
  setVisitedDetailTabs: (s: Set<string>) => void;

  // Stress test
  stressTestData: unknown;
  setStressTestData: (d: unknown) => void;
  stressTestTab: "debate" | "validate";
  setStressTestTab: (t: "debate" | "validate") => void;
  visitedStressTestTabs: Set<string>;
  setVisitedStressTestTabs: (s: Set<string>) => void;

  // Business model
  businessAnalysisData: BusinessModelAnalysisData | null;
  setBusinessAnalysisData: (d: BusinessModelAnalysisData | null) => void;
  businessModelInput: BusinessModelInput | null;
  setBusinessModelInput: (i: BusinessModelInput | null) => void;
  businessStressTestData: unknown;
  setBusinessStressTestData: (d: unknown) => void;
  businessStressTestTab: "debate" | "validate";
  setBusinessStressTestTab: (t: "debate" | "validate") => void;
  visitedBusinessStressTestTabs: Set<string>;
  setVisitedBusinessStressTestTabs: (s: Set<string>) => void;

  // Flip ideas
  generatingIdeasFor: string | null;

  // Saved
  savedRefreshTrigger: number;
  setSavedRefreshTrigger: React.Dispatch<React.SetStateAction<number>>;
  loadedFromSaved: boolean;
  setLoadedFromSaved: (b: boolean) => void;

  // Actions
  handleAnalyze: (params: {
    category: string; era: string; batchSize: number;
    customProducts?: { imageDataUrl?: string; productUrl?: string; productName?: string; notes?: string }[];
  }) => Promise<void>;
  handleRegenerateIdeas: (product: Product, userContext?: string) => Promise<void>;
  handleManualSave: () => Promise<void>;
  handleLoadSaved: (analysis: any) => void;
  saveAnalysis: (products: Product[], params: { category: string; era: string; batchSize: number }) => Promise<void>;

  // Analysis ID for routing
  analysisId: string | null;
  setAnalysisId: (id: string | null) => void;
}

const AnalysisContext = createContext<AnalysisContextType | null>(null);

export function useAnalysis() {
  const ctx = useContext(AnalysisContext);
  if (!ctx) throw new Error("useAnalysis must be used within AnalysisProvider");
  return ctx;
}

export function AnalysisProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { canAnalyze, checkSubscription } = useSubscription();
  const navigate = useNavigate();

  const [step, setStep] = useState<AnalysisStep>("idle");
  const [mainTab, setMainTab] = useState<"discover" | "custom" | "service" | "business">("custom");
  const [activeMode, setActiveMode] = useState<AnalysisMode>("custom");
  const [stepMessage, setStepMessage] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [analysisParams, setAnalysisParams] = useState<{ category: string; era: string; batchSize: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [generatingIdeasFor, setGeneratingIdeasFor] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<string>("overview");
  const [visitedDetailTabs, setVisitedDetailTabs] = useState<Set<string>>(new Set(["overview"]));
  const [stressTestData, setStressTestData] = useState<unknown>(null);
  const [stressTestTab, setStressTestTab] = useState<"debate" | "validate">("debate");
  const [visitedStressTestTabs, setVisitedStressTestTabs] = useState<Set<string>>(new Set(["debate"]));
  const [businessAnalysisData, setBusinessAnalysisData] = useState<BusinessModelAnalysisData | null>(null);
  const [businessModelInput, setBusinessModelInput] = useState<BusinessModelInput | null>(null);
  const [businessStressTestData, setBusinessStressTestData] = useState<unknown>(null);
  const [businessStressTestTab, setBusinessStressTestTab] = useState<"debate" | "validate">("debate");
  const [visitedBusinessStressTestTabs, setVisitedBusinessStressTestTabs] = useState<Set<string>>(new Set(["debate"]));
  const [savedRefreshTrigger, setSavedRefreshTrigger] = useState(0);
  const [loadedFromSaved, setLoadedFromSaved] = useState(false);
  const [analysisId, setAnalysisId] = useState<string | null>(null);

  // Loading
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [loadingLog, setLoadingLog] = useState<{ text: string; ts: number }[]>([]);
  const loadingStartRef = useRef<number>(0);
  const logTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
      const { data: insertedData } = await (supabase.from("saved_analyses") as any).insert({
        user_id: user?.id,
        title,
        category: params.category,
        era: params.era,
        audience: "",
        batch_size: params.batchSize,
        products: JSON.parse(JSON.stringify(liveProducts)),
        product_count: liveProducts.length,
        avg_revival_score: Math.round(avgScore * 10) / 10,
        analysis_type: params.category === "Service" ? "service" : "product",
      }).select("id").single();
      if (insertedData?.id) {
        setAnalysisId(insertedData.id);
      }
      setSavedRefreshTrigger((n) => n + 1);
      toast.success("Analysis auto-saved!");
    } catch (err) {
      console.error("Auto-save failed:", err);
    }
  }, [user?.id]);

  const handleAnalyze = useCallback(async (params: {
    category: string; era: string; batchSize: number;
    customProducts?: { imageDataUrl?: string; productUrl?: string; productName?: string; notes?: string }[];
  }) => {
    if (!canAnalyze()) {
      return;
    }

    const { customProducts, ...baseParams } = params;
    setAnalysisParams(baseParams);
    setStep("scraping");
    setErrorMsg("");
    startLoadingTimer();

    const hasCustom = customProducts && customProducts.length > 0;
    const id = crypto.randomUUID();
    setAnalysisId(id);

    // Navigate to loading view
    navigate("/");

    pushLog(hasCustom
      ? "Starting analysis pipeline for your custom products..."
      : `Starting product intelligence pipeline for ${params.era} ${params.category}...`
    );
    await new Promise(r => setTimeout(r, 300));
    pushLog("Querying eBay for sold listings & collector pricing...");
    await new Promise(r => setTimeout(r, 600));
    pushLog("Crawling Etsy for vintage & handmade revival trends...");
    await new Promise(r => setTimeout(r, 600));
    pushLog("Mining Reddit for community sentiment & nostalgia signals...");
    await new Promise(r => setTimeout(r, 600));
    pushLog("Scanning TikTok & Google for viral trend signals...");
    await new Promise(r => setTimeout(r, 600));
    pushLog("Searching Alibaba & wholesale directories for suppliers...");
    await new Promise(r => setTimeout(r, 600));
    pushLog("Collecting complaint signals & improvement requests...");

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

      if (scrapeData.stats) {
        pushLog(`Scraped ${scrapeData.stats.totalPages} pages, ${scrapeData.stats.redditPosts} Reddit posts, ${scrapeData.stats.complaintSignals} complaint signals`);
      } else {
        pushLog(`Web scraping complete — data collected from ${(scrapeData.sources || []).length} sources`);
      }

      setStep("analyzing");
      setStepMessage("Gemini AI building deep intelligence: pricing, supply chain, trends, flip ideas & action plans…");

      await new Promise(r => setTimeout(r, 400));
      pushLog("AI reasoning — parsing product data & community sentiment...");
      await new Promise(r => setTimeout(r, 800));
      pushLog("Building pricing intelligence from real market data...");
      await new Promise(r => setTimeout(r, 800));
      pushLog("Mapping supply chain: suppliers, manufacturers, distributors...");
      await new Promise(r => setTimeout(r, 800));
      pushLog("Generating flipped ideas from community pain points...");
      await new Promise(r => setTimeout(r, 800));
      pushLog("Scoring Revival Potential & building action plans...");
      await new Promise(r => setTimeout(r, 800));
      pushLog("Searching for real product images (eBay, Amazon, Wikipedia)...");

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
          } catch { /* ignore */ }
        }
        throw new Error(detailedMsg);
      }

      const liveProducts: Product[] = analyzeData.products;
      if (!liveProducts?.length) throw new Error("No products returned by AI.");

      pushLog(`Analysis complete — ${liveProducts.length} products with full intelligence reports ready.`);
      stopLoadingTimer();

      setProducts(liveProducts);
      setSelectedProduct(liveProducts[0]);
      setDetailTab("overview");
      setStep("done");
      toast.success(`Found ${liveProducts.length} products with deep intelligence reports!`);

      try {
        await supabase.rpc("increment_usage", { p_user_id: user?.id });
        await checkSubscription();
      } catch (_) { /* best effort */ }
      await saveAnalysis(liveProducts, baseParams);

      // Navigate to report page
      navigate(`/analysis/${analysisId || id}/report`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Analysis pipeline error:", msg);
      setErrorMsg(msg);
      setStep("error");
      stopLoadingTimer();
      toast.error("Analysis failed: " + msg);
    }
  }, [canAnalyze, startLoadingTimer, stopLoadingTimer, pushLog, user?.id, checkSubscription, saveAnalysis, navigate, analysisId]);

  const handleRegenerateIdeas = useCallback(async (product: Product, userContext?: string) => {
    if (!analysisParams) return;
    setGeneratingIdeasFor(product.id);

    try {
      const baseContext = `Focus on ${analysisParams.era} nostalgia and ${analysisParams.category} market trends.`;
      const fullContext = userContext ? `${baseContext}\n\nUser's additional guidance: ${userContext}` : baseContext;
      const { data, error } = await supabase.functions.invoke("generate-flip-ideas", {
        body: { product, additionalContext: fullContext },
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
  }, [analysisParams, products, selectedProduct]);

  const handleManualSave = useCallback(async () => {
    if (!analysisParams || products.length === 0) return;
    await saveAnalysis(products, analysisParams);
  }, [analysisParams, products, saveAnalysis]);

  const handleLoadSaved = useCallback((analysis: any) => {
    setLoadedFromSaved(true);
    if (analysis.analysis_type === "business_model") {
      setBusinessAnalysisData(analysis.analysis_data as BusinessModelAnalysisData);
      const titleParts = (analysis.title || "").split(" — ");
      setBusinessModelInput({ type: titleParts[0] || "Business", description: "", revenueModel: "", size: "", geography: "", painPoints: "", notes: "" });
      setMainTab("business");
      setActiveMode("business");
      setAnalysisId(analysis.id);
      toast.success("Business model analysis loaded!");
      navigate(`/business/${analysis.id}`);
    } else if (analysis.analysis_type === "first_principles") {
      if (analysis.products && analysis.products.length > 0) {
        setProducts(analysis.products);
        setSelectedProduct(analysis.products[0]);
        setStep("done");
      }
      setMainTab("discover");
      setActiveMode("discover");
      setAnalysisId(analysis.id);
      toast.success("First principles analysis loaded — re-run to see full results.");
      navigate(`/analysis/${analysis.id}/disrupt`);
    } else {
      setProducts(analysis.products);
      setSelectedProduct(analysis.products[0] || null);
      setAnalysisParams({ category: analysis.category, era: analysis.era, batchSize: analysis.batch_size ?? analysis.batchSize ?? 5 });
      const isCustom = analysis.category === "Custom" || analysis.era === "All Eras / Current";
      setMainTab(isCustom ? "custom" : "discover");
      setActiveMode(isCustom ? "custom" : "discover");
      setDetailTab("overview");
      setStep("done");
      setAnalysisId(analysis.id);
      toast.success("Analysis loaded from saved workspace!");
      navigate(`/analysis/${analysis.id}/report`);
    }
  }, [navigate]);

  return (
    <AnalysisContext.Provider value={{
      step, setStep, products, setProducts, selectedProduct, setSelectedProduct,
      analysisParams, setAnalysisParams, errorMsg, setErrorMsg,
      mainTab, setMainTab, activeMode, setActiveMode,
      elapsedSeconds, loadingLog, stepMessage,
      detailTab, setDetailTab, visitedDetailTabs, setVisitedDetailTabs,
      stressTestData, setStressTestData, stressTestTab, setStressTestTab,
      visitedStressTestTabs, setVisitedStressTestTabs,
      businessAnalysisData, setBusinessAnalysisData,
      businessModelInput, setBusinessModelInput,
      businessStressTestData, setBusinessStressTestData,
      businessStressTestTab, setBusinessStressTestTab,
      visitedBusinessStressTestTabs, setVisitedBusinessStressTestTabs,
      generatingIdeasFor, savedRefreshTrigger, setSavedRefreshTrigger,
      loadedFromSaved, setLoadedFromSaved,
      handleAnalyze, handleRegenerateIdeas, handleManualSave, handleLoadSaved, saveAnalysis,
      analysisId, setAnalysisId,
    }}>
      {children}
    </AnalysisContext.Provider>
  );
}
