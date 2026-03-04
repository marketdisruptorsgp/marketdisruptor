import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { normalizeProductFields, isServiceCategory } from "@/utils/normalizeProduct";
import { type Product, type FlippedIdea } from "@/data/mockProducts";
import { type AnalysisMode } from "@/components/AnalysisForm";
import type { UserLens } from "@/components/LensToggle";
import type { RoutingResult } from "@/lib/modeIntelligence";
import { type StrategicProfile, DEFAULT_PROFILES } from "@/lib/strategicOS";
import { type BusinessModelAnalysisData } from "@/components/BusinessModelAnalysis";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { getResumeRoute } from "@/utils/analysisSteps";

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
  mainTab: "custom" | "service" | "business";
  setMainTab: (t: "custom" | "service" | "business") => void;
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

  // Disrupt
  disruptData: unknown;
  setDisruptData: (d: unknown) => void;

  // Stress test
  stressTestData: unknown;
  setStressTestData: (d: unknown) => void;
  stressTestTab: "debate" | "validate";
  setStressTestTab: (t: "debate" | "validate") => void;
  visitedStressTestTabs: Set<string>;
  setVisitedStressTestTabs: (s: Set<string>) => void;

  // Pitch deck
  pitchDeckData: unknown;
  setPitchDeckData: (d: unknown) => void;

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
  saveStepData: (stepKey: string, data: unknown) => Promise<void>;

  // Analysis ID for routing
  analysisId: string | null;
  setAnalysisId: (id: string | null) => void;

  // Outdated step tracking (System Layer)
  outdatedSteps: Set<string>;
  markStepOutdated: (step: string) => void;
  clearStepOutdated: (step: string) => void;

  // User score overrides (System Layer)
  userScores: Record<string, Record<string, number>>;
  setUserScore: (ideaId: string, scoreKey: string, value: number) => void;

  // Redesign data (isolated from Disrupt)
  redesignData: unknown;
  setRedesignData: (d: unknown) => void;

  // Insight preferences (liked/dismissed)
  insightPreferences: Record<string, "liked" | "dismissed" | "neutral">;
  setInsightPreference: (id: string, status: "liked" | "dismissed" | "neutral") => void;
  getLikedInsights: () => string[];
  getDismissedInsights: () => string[];

  // Steering text
  steeringText: string;
  setSteeringText: (text: string) => void;
  saveSteeringText: (text: string) => void;

  // Pitch deck selected images (up to 2)
  pitchDeckImages: { url: string; ideaName: string }[];
  setPitchDeckImage: (url: string, ideaName: string) => void;
  removePitchDeckImage: (url: string) => void;

  // Pitch deck content exclusions
  pitchDeckExclusions: Set<string>;
  togglePitchDeckExclusion: (key: string) => void;

  // Analysis Lens
  activeLens: UserLens | null;
  setActiveLens: (lens: UserLens | null) => void;

  // Governed data (reasoning synopsis, constraint maps, etc.)
  governedData: Record<string, unknown> | null;
  setGovernedData: (data: Record<string, unknown> | null) => void;

  // Multi-hypothesis branching
  activeBranchId: string | null;
  setActiveBranchId: (id: string | null) => void;

  // Strategic profile
  strategicProfile: StrategicProfile;
  setStrategicProfile: (p: StrategicProfile) => void;

  // Geo market data
  geoData: unknown;
  setGeoData: (d: unknown) => void;
  fetchGeoData: (category: string, productName?: string) => Promise<void>;

  // Regulatory data (adaptive — only populated for regulated categories)
  regulatoryData: unknown;
  setRegulatoryData: (d: unknown) => void;

  // Mode routing
  modeRouting: RoutingResult | null;
  setModeRouting: (r: RoutingResult | null) => void;

  // Adaptive context (problem analysis, challenges, entity)
  adaptiveContext: AdaptiveContextData | null;
  setAdaptiveContext: (ctx: AdaptiveContextData | null) => void;

  // Hydration state — true while auto-hydration DB fetch is in progress
  isHydrating: boolean;
}

export interface AdaptiveContextData {
  problemStatement?: string;
  entity?: { name: string; type: string };
  detectedModes?: { mode: string; confidence: number; reason: string }[];
  selectedChallenges?: { id: string; question: string; context: string; priority: string; related_mode: string }[];
  summary?: string;
  userGuidance?: string;
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
  const [isHydrating, setIsHydrating] = useState(false);
  const [mainTab, setMainTab] = useState<"custom" | "service" | "business">("custom");
  const [activeMode, setActiveMode] = useState<AnalysisMode>("custom");
  const [stepMessage, setStepMessage] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [analysisParams, setAnalysisParams] = useState<{ category: string; era: string; batchSize: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [generatingIdeasFor, setGeneratingIdeasFor] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<string>("overview");
  const [visitedDetailTabs, setVisitedDetailTabs] = useState<Set<string>>(new Set(["overview"]));
  const [disruptData, setDisruptData] = useState<unknown>(null);
  const [stressTestData, setStressTestData] = useState<unknown>(null);
  const [stressTestTab, setStressTestTab] = useState<"debate" | "validate">("debate");
  const [visitedStressTestTabs, setVisitedStressTestTabs] = useState<Set<string>>(new Set(["debate"]));
  const [pitchDeckData, setPitchDeckData] = useState<unknown>(null);
  const [businessAnalysisData, setBusinessAnalysisData] = useState<BusinessModelAnalysisData | null>(null);
  const [businessModelInput, setBusinessModelInput] = useState<BusinessModelInput | null>(null);
  const [businessStressTestData, setBusinessStressTestData] = useState<unknown>(null);
  const [businessStressTestTab, setBusinessStressTestTab] = useState<"debate" | "validate">("debate");
  const [visitedBusinessStressTestTabs, setVisitedBusinessStressTestTabs] = useState<Set<string>>(new Set(["debate"]));
  const [savedRefreshTrigger, setSavedRefreshTrigger] = useState(0);
  const [loadedFromSaved, setLoadedFromSaved] = useState(false);
  const [governedData, setGovernedData] = useState<Record<string, unknown> | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [activeBranchId, setActiveBranchIdState] = useState<string | null>(null);
  const [strategicProfile, setStrategicProfileState] = useState<StrategicProfile>(DEFAULT_PROFILES.operator);

  // ── System Layer: Outdated Step Tracking ──
  const [outdatedSteps, setOutdatedSteps] = useState<Set<string>>(new Set());

  // Step-data lookup so we can guard against marking empty steps outdated
  // We use a ref updated via effect (after all state vars are declared) to avoid declaration-order issues
  const stepDataRef = useRef<Record<string, unknown>>({});

  const markStepOutdated = useCallback((step: string) => {
    // Only mark a step outdated if it already has data — prevents
    // upstream changes from flagging downstream steps that don't exist yet
    if (!stepDataRef.current[step]) return;
    setOutdatedSteps(prev => new Set([...prev, step]));
  }, []);
  const clearStepOutdated = useCallback((step: string) => {
    setOutdatedSteps(prev => {
      const next = new Set(prev);
      next.delete(step);
      return next;
    });
  }, []);

  // ── System Layer: User Score Overrides ──
  const [userScores, setUserScores] = useState<Record<string, Record<string, number>>>({});
  const pendingScoreSaveRef = useRef<Record<string, Record<string, number>> | null>(null);
  const setUserScore = useCallback((ideaId: string, scoreKey: string, value: number) => {
    setUserScores(prev => {
      const next = {
        ...prev,
        [ideaId]: { ...(prev[ideaId] || {}), [scoreKey]: value },
      };
      pendingScoreSaveRef.current = next;
      return next;
    });
    // Mark all downstream steps as outdated
    markStepOutdated("redesign");
    markStepOutdated("stressTest");
    markStepOutdated("pitchDeck");
  }, [markStepOutdated]);

  // ── Redesign Data (isolated from Disrupt) ──
  // ── Multi-Hypothesis Branch Selection ──
  const pendingBranchSaveRef = useRef<string | null | undefined>(undefined);
  const setActiveBranchId = useCallback((id: string | null) => {
    setActiveBranchIdState(id);
    // "combined" or null means all hypotheses — only mark outdated when switching to/from isolated
    // Branch changes invalidate downstream steps — but NOT the current Disrupt step itself
    markStepOutdated("redesign");
    markStepOutdated("stressTest");
    markStepOutdated("pitchDeck");
    pendingBranchSaveRef.current = id;
  }, [markStepOutdated]);
  const pendingProfileSaveRef = useRef<StrategicProfile | undefined>(undefined);
  const setStrategicProfile = useCallback((p: StrategicProfile) => {
    setStrategicProfileState(p);
    pendingProfileSaveRef.current = p;
    // Re-ranking with new profile changes downstream — not Disrupt itself
    markStepOutdated("redesign");
    markStepOutdated("stressTest");
    markStepOutdated("pitchDeck");
  }, [markStepOutdated]);
  const [redesignData, setRedesignData] = useState<unknown>(null);

  // Keep stepDataRef in sync so markStepOutdated can guard empty steps
  useEffect(() => {
    stepDataRef.current = {
      disrupt: disruptData,
      stressTest: stressTestData,
      pitchDeck: pitchDeckData,
      redesign: redesignData,
    };
  }, [disruptData, stressTestData, pitchDeckData, redesignData]);

  // ── Insight Preferences (liked/dismissed) ──
  const [insightPreferences, setInsightPreferences] = useState<Record<string, "liked" | "dismissed" | "neutral">>({});
  const pendingPrefSaveRef = useRef<Record<string, "liked" | "dismissed" | "neutral"> | null>(null);
  const setInsightPreference = useCallback((id: string, status: "liked" | "dismissed" | "neutral") => {
    setInsightPreferences(prev => {
      const next = { ...prev };
      if (status === "neutral") {
        delete next[id];
      } else {
        next[id] = status;
      }
      pendingPrefSaveRef.current = next;
      return next;
    });
  }, []);
  const getLikedInsights = useCallback(() => {
    return Object.entries(insightPreferences).filter(([, s]) => s === "liked").map(([id]) => id);
  }, [insightPreferences]);
  const getDismissedInsights = useCallback(() => {
    return Object.entries(insightPreferences).filter(([, s]) => s === "dismissed").map(([id]) => id);
  }, [insightPreferences]);

  // ── Steering Text ──
  const [steeringText, setSteeringText] = useState<string>("");
  const saveSteeringText = useCallback((text: string) => {
    setSteeringText(text);
    // Update adaptive context with ongoing user guidance
    setAdaptiveContextState(prev => prev ? { ...prev, userGuidance: text || undefined } : null);
    if (analysisId) {
      saveStepData("steeringText", text);
    }
  }, [analysisId]);

  // ── Pitch Deck Images (up to 2 selected from flipped ideas) ──
  const [pitchDeckImages, setPitchDeckImages] = useState<{ url: string; ideaName: string }[]>([]);
  const pendingPitchImagesSaveRef = useRef<{ url: string; ideaName: string }[] | null>(null);
  const setPitchDeckImage = useCallback((url: string, ideaName: string) => {
    setPitchDeckImages(prev => {
      // Already selected? Skip
      if (prev.some(img => img.url === url)) return prev;
      // Max 2 — replace oldest if full
      const next = prev.length >= 2 ? [...prev.slice(1), { url, ideaName }] : [...prev, { url, ideaName }];
      pendingPitchImagesSaveRef.current = next;
      return next;
    });
  }, []);
  const removePitchDeckImage = useCallback((url: string) => {
    setPitchDeckImages(prev => {
      const next = prev.filter(img => img.url !== url);
      pendingPitchImagesSaveRef.current = next;
      return next;
    });
  }, []);

  // ── Pitch Deck Content Exclusions ──
  const [pitchDeckExclusions, setPitchDeckExclusions] = useState<Set<string>>(new Set());
  const pendingExclusionsSaveRef = useRef<string[] | null>(null);

  // ── Analysis Lens ──
  const [activeLens, setActiveLensState] = useState<UserLens | null>(null);
  // ── Mode Routing ──
  const [modeRouting, setModeRouting] = useState<RoutingResult | null>(null);
  // ── Adaptive Context ──
  const [adaptiveContext, setAdaptiveContextState] = useState<AdaptiveContextData | null>(null);
  const pendingAdaptiveCtxSaveRef = useRef<AdaptiveContextData | null | undefined>(undefined);
  const setAdaptiveContext = useCallback((ctx: AdaptiveContextData | null) => {
    setAdaptiveContextState(ctx);
  }, []);
  const pendingLensSaveRef = useRef<string | null | undefined>(undefined);
  const setActiveLens = useCallback((lens: UserLens | null) => {
    setActiveLensState(lens);
    pendingLensSaveRef.current = lens?.id ?? null;
    // Mark all downstream steps as outdated
    markStepOutdated("redesign");
    markStepOutdated("stressTest");
    markStepOutdated("pitchDeck");
  }, [markStepOutdated]);

  // ── Geo Market Data ──
  const [geoData, setGeoData] = useState<unknown>(null);
  // ── Regulatory Data (adaptive) ──
  const [regulatoryData, setRegulatoryData] = useState<unknown>(null);

  const fetchGeoData = useCallback(async (category: string, productName?: string) => {
    try {
      console.log("[GeoData] Fetching for category:", category);
      const { data: result, error } = await supabase.functions.invoke("geo-market-data", {
        body: { category, productName },
      });
      if (error || !result?.success) {
        console.warn("[GeoData] Fetch failed:", result?.error || error?.message);
        return;
      }
      setGeoData(result.geoData);
      // Extract regulatory profile if present
      if (result.geoData?.regulatoryProfile && result.geoData.regulatoryProfile.regulatoryRelevance !== "none") {
        setRegulatoryData(result.geoData.regulatoryProfile);
        console.log("[GeoData] Regulatory data loaded:", result.geoData.regulatoryProfile.matchedCategory);
      } else {
        setRegulatoryData(null);
      }
      console.log("[GeoData] Loaded successfully");
    } catch (err) {
      console.warn("[GeoData] Error:", err);
    }
  }, []);

  const togglePitchDeckExclusion = useCallback((key: string) => {
    setPitchDeckExclusions(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      pendingExclusionsSaveRef.current = Array.from(next);
      return next;
    });
  }, []);

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

  const saveAnalysis = useCallback(async (liveProducts: Product[], params: { category: string; era: string; batchSize: number }, customProductName?: string) => {
    try {
      const avgScore = liveProducts.reduce((acc, p) => acc + p.revivalScore, 0) / liveProducts.length;
      // Use the user's custom name if provided, otherwise use first product name
      const baseName = customProductName?.trim() || liveProducts[0]?.name || "Analysis";

      // Check for duplicate titles and append version
      let title = baseName;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existing } = await (supabase.from("saved_analyses") as any)
        .select("title")
        .eq("user_id", user?.id)
        .like("title", `${baseName}%`);
      if (existing && existing.length > 0) {
        const versions = existing.map((e: { title: string }) => {
          const match = e.title.match(/ v(\d+)$/);
          return match ? parseInt(match[1]) : 1;
        });
        const nextVersion = Math.max(...versions) + 1;
        title = `${baseName} v${nextVersion}`;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: insertedData } = await (supabase.from("saved_analyses") as any).insert({
        user_id: user?.id,
        title,
        category: params.category,
        era: "All Eras / Current",
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
    setDisruptData(null);
    setStressTestData(null);
    setPitchDeckData(null);
    setRedesignData(null);
    setGovernedData(null);
    setActiveBranchIdState(null);
    setUserScores({});
    setOutdatedSteps(new Set());
    setInsightPreferences({});
    setSteeringText("");
    setPitchDeckImages([]);
    setPitchDeckExclusions(new Set());
    // Keep activeLens — user may want to run analysis with their lens
    startLoadingTimer();

    const hasCustom = customProducts && customProducts.length > 0;
    const id = crypto.randomUUID();
    setAnalysisId(id);

    // Navigate to report page so user sees loading progress in-place
    navigate(`/analysis/${id}/report`);

    const isServiceMode = params.category === "Service";

    pushLog(hasCustom
      ? `Starting analysis pipeline for your custom ${isServiceMode ? "service" : "products"}...`
      : `Starting ${isServiceMode ? "service" : "product"} intelligence pipeline for ${params.category}...`
    );
    await new Promise(r => setTimeout(r, 300));
    pushLog(isServiceMode
      ? "Scanning customer reviews, competitor data & market positioning..."
      : "Scanning market data across pricing & resale sources..."
    );
    await new Promise(r => setTimeout(r, 600));
    pushLog("Analyzing community discussions & sentiment signals...");
    await new Promise(r => setTimeout(r, 600));
    pushLog("Cross-referencing trend data & search interest...");
    await new Promise(r => setTimeout(r, 600));
    pushLog(isServiceMode
      ? "Researching operational models, pricing tiers & delivery formats..."
      : "Researching supply chain: suppliers, manufacturers, distributors..."
    );
    await new Promise(r => setTimeout(r, 600));
    pushLog("Mining complaint signals & improvement requests...");
    await new Promise(r => setTimeout(r, 600));
    pushLog("Collecting competitive intelligence from multiple data sources...");


    try {
      setStepMessage(hasCustom
        ? `Deep research across multiple data sources for your ${isServiceMode ? "service" : "products"}…`
        : `Deep research across multiple data sources for ${params.category}${isServiceMode ? "" : " products"}…`
      );
      const { data: scrapeData, error: scrapeError } = await supabase.functions.invoke(
        "scrape-products",
        { body: { ...baseParams, customProducts } }
      );
      if (scrapeError || !scrapeData?.success) {
        throw new Error(scrapeData?.error || scrapeError?.message || "Scraping failed");
      }

      if (scrapeData.stats) {
        pushLog(`Collected data from ${scrapeData.stats.totalPages} pages, ${scrapeData.stats.communityPosts} community posts, ${scrapeData.stats.complaintSignals} complaint signals`);
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
      pushLog("Scoring potential & building action plans...");
      await new Promise(r => setTimeout(r, 800));
      pushLog(isServiceMode
        ? "Analyzing competitive landscape & differentiation opportunities..."
        : "Searching for real product images across data sources..."
      );

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
          } catch { /* ignore */ }
        }
        throw new Error(detailedMsg);
      }

      let liveProducts: Product[] = analyzeData.products;
      if (!liveProducts?.length) throw new Error("No results returned from analysis.");

      // Restore user-uploaded images onto matching products
      if (customProducts?.length) {
        liveProducts = liveProducts.map((p) => {
          const match = customProducts.find(
            (cp) => cp.productName && p.name.toLowerCase().includes(cp.productName.toLowerCase())
          );
          if (match?.imageDataUrl && (!p.image || p.image === "USER_IMAGE")) {
            return { ...p, image: match.imageDataUrl };
          }
          return p;
        });
      }

      pushLog(`Analysis complete — ${liveProducts.length} ${isServiceMode ? "service analyses" : "products"} with full intelligence reports ready.`);
      stopLoadingTimer();

      // Fetch geo market data + regulatory intelligence in background (non-blocking)
      const productNameForGeo = customProducts?.find(cp => cp.productName)?.productName || liveProducts[0]?.name;
      fetchGeoData(params.category, productNameForGeo).then(() => {
        console.log("[Pipeline] Geo market data + regulatory intel fetched for", params.category);
      }).catch(() => { /* best effort */ });

      setProducts(liveProducts);
      setSelectedProduct(liveProducts[0]);
      setDetailTab("overview");
      setStep("done");
      // Defer toast to let React reconcile the DOM tree swap first
      setTimeout(() => {
        toast.success(`Found ${liveProducts.length} ${isServiceMode ? "service analyses" : "products"} with deep intelligence reports!`);
      }, 100);

      try {
        await supabase.rpc("increment_usage", { p_user_id: user?.id });
        await checkSubscription();
        // Streak tracking
        await (supabase.rpc as any)("upsert_user_streak", { p_user_id: user?.id });
        // Milestone toasts
        const { data: usage } = await (supabase.from("user_usage") as any).select("analysis_count").eq("user_id", user?.id).single();
        const count = usage?.analysis_count || 0;
        if (count === 5) setTimeout(() => toast("🏆 Milestone: 5 analyses completed!", { description: "You're building real market intelligence." }), 200);
        else if (count === 10) setTimeout(() => toast("🔥 Milestone: 10 analyses!", { description: "You're a power user now." }), 200);
        else if (count === 25) setTimeout(() => toast("⭐ Milestone: 25 analyses!", { description: "Elite-level market intelligence." }), 200);
      } catch (_) { /* best effort */ }
      const customName = customProducts?.find(cp => cp.productName)?.productName;
      await saveAnalysis(liveProducts, baseParams, customName);

      // Mark adaptive context for deferred persistence
      if (adaptiveContext) {
        pendingAdaptiveCtxSaveRef.current = adaptiveContext;
      }

      // Fire webhooks (best effort)
      try {
        await supabase.functions.invoke("fire-webhook", {
          body: {
            event: "analysis.completed",
            data: {
              title: liveProducts[0]?.name || "Analysis",
              category: params.category,
              avg_revival_score: Math.round(liveProducts.reduce((a, p) => a + p.revivalScore, 0) / liveProducts.length * 10) / 10,
              product_count: liveProducts.length,
              top_idea: liveProducts[0]?.flippedIdeas?.[0]?.name || null,
            },
          },
        });
      } catch (_) { /* best effort */ }

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
  }, [canAnalyze, startLoadingTimer, stopLoadingTimer, pushLog, user?.id, checkSubscription, saveAnalysis, navigate, analysisId, adaptiveContext]);

  const handleRegenerateIdeas = useCallback(async (product: Product, userContext?: string) => {
    if (!analysisParams) return;
    setGeneratingIdeasFor(product.id);

    try {
      const baseContext = `Focus on ${analysisParams.category} market trends.`;
      const fullContext = userContext ? `${baseContext}\n\nUser's additional guidance: ${userContext}` : baseContext;
      // Wire active branch for isolated flip generation
      let activeBranch: unknown = undefined;
      if (activeBranchId && governedData) {
        const { getBranchPayload } = await import("@/lib/branchContext");
        activeBranch = getBranchPayload(governedData, activeBranchId, strategicProfile);
      }
      const { data, error } = await supabase.functions.invoke("generate-flip-ideas", {
        body: {
          product,
          additionalContext: fullContext,
          insightPreferences: Object.keys(insightPreferences).length > 0 ? insightPreferences : undefined,
          steeringText: steeringText || undefined,
          activeBranch,
          adaptiveContext: adaptiveContext || undefined,
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
      if (analysisParams) await saveAnalysis(updated, analysisParams);
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

  // Persist step-level data (disrupt, stress-test, pitch, userScores) into analysis_data JSON
  // Also snapshot previous values for version comparison
  // ── GOVERNED: Checkpoint gate validation + atomic governed persistence ──
  const saveStepData = useCallback(async (stepKey: string, data: unknown) => {
    if (!analysisId) return;

    // ── Pipeline Validation ──
    const { validateStepData, logStepExecution } = await import("@/utils/pipelineValidation");
    const validation = validateStepData(stepKey, data);
    logStepExecution(stepKey, "save", { analysisId, valid: validation.valid });

    if (!validation.valid) {
      console.error("[Pipeline] Validation failed for step:", stepKey, validation.errors);
      return; // Block invalid data from persisting
    }

    // ── GOVERNED: Checkpoint gate — validate governed artifacts before persistence ──
    const { validateBeforePersistence, enforceDependencyIntegrity } = await import("@/utils/checkpointGate");
    const governedCheck = validateBeforePersistence(stepKey, data);
    if (!governedCheck.allowed) {
      console.error(`[Governed] PERSISTENCE BLOCKED for "${stepKey}": ${governedCheck.reason}`);
      toast.error(`Checkpoint gate blocked: ${governedCheck.reason}`);
      return; // Do not persist invalid governed data
    }

    // ── GOVERNED: Invalidate dependent downstream steps ──
    if (governedCheck.invalidatedSteps.length > 0) {
      console.log(`[Governed] Invalidating downstream steps: ${governedCheck.invalidatedSteps.join(", ")}`);
      for (const depStep of governedCheck.invalidatedSteps) {
        markStepOutdated(depStep);
      }
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existing } = await (supabase.from("saved_analyses") as any)
        .select("analysis_data")
        .eq("id", analysisId)
        .single();
      const prev = (existing?.analysis_data as Record<string, unknown>) || {};

      // Snapshot previous value for version comparison
      const previousSnapshot = (prev.previousSnapshot as Record<string, unknown>) || {};
      if (prev[stepKey] && JSON.stringify(prev[stepKey]) !== JSON.stringify(data)) {
        previousSnapshot[stepKey] = prev[stepKey];
      }

      // ── GOVERNED: Artifact versioning + dependency integrity ──
      const governedHashes = (prev.governedHashes as Record<string, string>) || {};
      const depIntegrity = enforceDependencyIntegrity(stepKey, data, governedHashes);
      governedHashes[stepKey] = depIntegrity.newHash;

      // ── GOVERNED: Extract and persist governed artifacts at TOP LEVEL ──
      const { extractGovernedArtifacts, mergeGovernedIntoAnalysisData, checkRetroactiveInvalidation, applyRetroactiveInvalidation } = await import("@/lib/governedPersistence");
      const { buildEvidenceRegistry } = await import("@/lib/evidenceRegistry");
      const { applyLensAdaptation } = await import("@/lib/lensAdaptationEngine");
      const extraction = extractGovernedArtifacts(stepKey, data);
      
      let merged: Record<string, unknown> = { ...prev, [stepKey]: data, previousSnapshot, governedHashes };
      
      // Merge governed artifacts into analysis_data.governed (top level)
      if (extraction.hasGoverned && extraction.valid) {
        merged = mergeGovernedIntoAnalysisData(merged, extraction);
        console.log(`[GovernedPersistence] Merged ${extraction.presentArtifacts.length} artifacts (${extraction.governedByteSize} bytes) into analysis_data.governed`);
        
        // §8: Build evidence registry from current analysis state
        const registry = buildEvidenceRegistry(merged);
        merged._evidenceRegistry = registry;
        console.log(`[EvidenceRegistry] ${registry.trace}`);

        // §7: Apply lens adaptation — re-score constraints under active lens
        const governedForLens = merged.governed as Record<string, unknown> | undefined;
        if (governedForLens) {
          const activeLens = (merged as any)._activeLens || null;
          const lensResult = applyLensAdaptation(governedForLens, activeLens);
          if (lensResult) {
            merged._lensAdaptation = lensResult;
            if (lensResult.structuralChangeLog.length > 0) {
              console.log(`[LensAdaptation] Structural changes: ${lensResult.structuralChangeLog.join(" | ")}`);
            }
          }
        }
        
        // ── RETROACTIVE INVALIDATION: Check if falsification triggers upstream downgrades ──
        const governedObj = merged.governed as Record<string, unknown>;
        const invalidation = checkRetroactiveInvalidation(governedObj);
        if (invalidation.shouldInvalidate) {
          merged.governed = applyRetroactiveInvalidation(governedObj, invalidation);
          console.warn(`[RetroactiveInvalidation] Applied: confidence downgraded by ${invalidation.confidenceDowngrade}, fragility=${invalidation.fragilityScore}`);
          for (const affected of invalidation.affectedArtifacts) {
            markStepOutdated(affected);
          }
        }
      } else if (extraction.hasGoverned && !extraction.valid) {
        console.warn(`[GovernedPersistence] Governed data present but INVALID (${extraction.governedByteSize} bytes, ${extraction.presentArtifacts.length} artifacts). Rejecting.`);
      }

      // ── GOVERNED: Purge invalidated downstream governed artifacts ──
      const allPurgeSteps = [...new Set([...governedCheck.invalidatedSteps, ...depIntegrity.purgeSteps])];
      if (allPurgeSteps.length > 0) {
        for (const depStep of allPurgeSteps) {
          markStepOutdated(depStep);
          // Purge governed sub-artifacts
          const governedData = merged.governed as Record<string, unknown> | undefined;
          if (governedData && governedData[depStep]) {
            console.log(`[Governed] Purging stale governed artifact: ${depStep}`);
            delete governedData[depStep];
            // Remove stale hash
            delete governedHashes[depStep];
          }
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase.from("saved_analyses") as any)
        .update({ analysis_data: merged, updated_at: new Date().toISOString() })
        .eq("id", analysisId);
      if (updateError) {
        console.error("saveStepData update failed:", updateError, "analysisId:", analysisId, "stepKey:", stepKey);
      } else {
        logStepExecution(stepKey, "save", { analysisId, success: true, governedByteSize: extraction.governedByteSize });
        // Keep governedData state in sync
        if (merged.governed) {
          setGovernedData(merged.governed as Record<string, unknown>);
        }
      }
    } catch (err) {
      console.error("Failed to persist step data:", err);
    }
  }, [analysisId, markStepOutdated]);

  // Auto-persist userScores when changed
  useEffect(() => {
    if (pendingScoreSaveRef.current && analysisId) {
      const scores = pendingScoreSaveRef.current;
      pendingScoreSaveRef.current = null;
      saveStepData("userScores", scores);
    }
  }, [userScores, analysisId, saveStepData]);

  // Auto-persist outdated steps when changed
  useEffect(() => {
    if (analysisId) {
      saveStepData("outdatedSteps", Array.from(outdatedSteps));
    }
  }, [outdatedSteps, analysisId, saveStepData]);

  // Auto-persist insight preferences when changed
  useEffect(() => {
    if (pendingPrefSaveRef.current && analysisId) {
      const prefs = pendingPrefSaveRef.current;
      pendingPrefSaveRef.current = null;
      saveStepData("insightPreferences", prefs);
    }
  }, [insightPreferences, analysisId, saveStepData]);

  // Auto-persist pitch deck images when changed
  useEffect(() => {
    if (pendingPitchImagesSaveRef.current && analysisId) {
      const imgs = pendingPitchImagesSaveRef.current;
      pendingPitchImagesSaveRef.current = null;
      saveStepData("pitchDeckImages", imgs);
    }
  }, [pitchDeckImages, analysisId, saveStepData]);

  // Auto-persist pitch deck exclusions when changed
  useEffect(() => {
    if (pendingExclusionsSaveRef.current && analysisId) {
      const excl = pendingExclusionsSaveRef.current;
      pendingExclusionsSaveRef.current = null;
      saveStepData("pitchDeckExclusions", excl);
    }
  }, [pitchDeckExclusions, analysisId, saveStepData]);

  // Auto-persist active lens ID when changed
  useEffect(() => {
    if (pendingLensSaveRef.current !== undefined && analysisId) {
      const lensId = pendingLensSaveRef.current;
      pendingLensSaveRef.current = undefined;
      saveStepData("activeLensId", lensId);
    }
  }, [activeLens, analysisId, saveStepData]);

  // Auto-persist active branch ID when changed
  useEffect(() => {
    if (pendingBranchSaveRef.current !== undefined && analysisId) {
      const branchId = pendingBranchSaveRef.current;
      pendingBranchSaveRef.current = undefined;
      saveStepData("activeBranchId", branchId);
    }
  }, [activeBranchId, analysisId, saveStepData]);

  // Auto-persist strategic profile when changed
  useEffect(() => {
    if (pendingProfileSaveRef.current !== undefined && analysisId) {
      const prof = pendingProfileSaveRef.current;
      pendingProfileSaveRef.current = undefined;
      saveStepData("strategicProfile", prof);
    }
  }, [strategicProfile, analysisId, saveStepData]);

  // Auto-persist adaptive context when set after analysis
  useEffect(() => {
    if (pendingAdaptiveCtxSaveRef.current !== undefined && analysisId) {
      const ctx = pendingAdaptiveCtxSaveRef.current;
      pendingAdaptiveCtxSaveRef.current = undefined;
      if (ctx) saveStepData("adaptiveContext", ctx);
    }
  }, [adaptiveContext, analysisId, saveStepData]);

  const handleLoadSaved = useCallback(async (rawAnalysis: any) => {
    setLoadedFromSaved(true);

    // If analysis_data is missing (e.g. workspace list query), fetch the full record first
    let analysis = rawAnalysis;
    if (!analysis.analysis_data && analysis.id) {
      try {
        const { data: fullRecord, error } = await (supabase.from("saved_analyses") as any)
          .select("*")
          .eq("id", analysis.id)
          .single();
        if (!error && fullRecord) {
          analysis = fullRecord;
        }
      } catch (err) {
        console.warn("[handleLoadSaved] Failed to fetch full record:", err);
      }
    }

    // Ensure all products have an id and required fields (photo analyses may omit them)
    const rawProducts = Array.isArray(analysis.products) ? analysis.products : [];
    const sanitizedProducts = rawProducts.map((p: any, idx: number) => {
      const base = {
        id: p.id || `product-${analysis.id}-${idx}`,
        name: p.name || "Untitled Product",
        category: p.category || analysis.category || "",
        image: p.image || "",
        description: p.description || "",
        specs: p.specs || "",
        revivalScore: p.revivalScore ?? 0,
        era: p.era || "All Eras / Current",
        sources: Array.isArray(p.sources) ? p.sources : [],
        reviews: Array.isArray(p.reviews) ? p.reviews : [],
        socialSignals: Array.isArray(p.socialSignals) ? p.socialSignals : [],
        competitors: Array.isArray(p.competitors) ? p.competitors : [],
        assumptionsMap: Array.isArray(p.assumptionsMap) ? p.assumptionsMap : [],
        flippedIdeas: Array.isArray(p.flippedIdeas) ? p.flippedIdeas : [],
        confidenceScores: p.confidenceScores || { adoptionLikelihood: 5, feasibility: 5, emotionalResonance: 5 },
      };
      // Merge extra fields from DB (pricingIntel, supplyChain, etc.) without overriding guaranteed defaults
      // Normalize alternate field names (userJourney→userWorkflow, customerSentiment→communityInsights, etc.)
      return normalizeProductFields({ ...p, ...base });
    });

    // Restore persisted step data
    const ad = analysis.analysis_data as Record<string, unknown> | null;
    // Restore governed data (reasoning synopsis, constraint maps, etc.)
    if (ad?.governed) {
      setGovernedData(ad.governed as Record<string, unknown>);
      // Auto-backfill root_hypotheses if missing
      const gov = ad.governed as Record<string, unknown>;
      const cm = gov?.constraint_map as Record<string, unknown> | undefined;
      const hasRH = (Array.isArray(gov?.root_hypotheses) && (gov.root_hypotheses as unknown[]).length > 0) ||
        (Array.isArray(cm?.root_hypotheses) && (cm!.root_hypotheses as unknown[]).length > 0);
      const hasSynopsis = !!gov?.reasoning_synopsis;
      if ((!hasRH || !hasSynopsis) && analysis.id) {
        // Fire-and-forget backfill for this single analysis — generates both hypotheses + synopsis
        supabase.functions.invoke("backfill-strategic-os", {
          body: { singleAnalysisId: analysis.id },
        }).then(({ data }) => {
          setGovernedData((prev) => {
            if (!prev) return { root_hypotheses: data?.hypotheses || [], reasoning_synopsis: data?.synopsis || null };
            const updated = { ...prev };
            if (data?.hypotheses) {
              (updated as any).root_hypotheses = data.hypotheses;
              if (updated.constraint_map) {
                (updated.constraint_map as Record<string, unknown>).root_hypotheses = data.hypotheses;
              }
            }
            if (data?.synopsis) {
              (updated as any).reasoning_synopsis = data.synopsis;
            }
            return updated;
          });
        }).catch(() => { /* silent — non-critical */ });
      }
    } else {
      setGovernedData(null);
      // No governed data at all — trigger full backfill
      if (analysis.id) {
        supabase.functions.invoke("backfill-strategic-os", {
          body: { singleAnalysisId: analysis.id },
        }).then(({ data }) => {
          if (data?.hypotheses || data?.synopsis) {
            setGovernedData({
              root_hypotheses: data?.hypotheses || [],
              reasoning_synopsis: data?.synopsis || null,
            });
          }
        }).catch(() => { /* silent */ });
      }
    }
    if (ad?.activeBranchId) setActiveBranchIdState(ad.activeBranchId as string);
    else setActiveBranchIdState(null);
    if (ad?.strategicProfile) setStrategicProfileState(ad.strategicProfile as StrategicProfile);
    if (ad?.disrupt) setDisruptData(ad.disrupt);
    if (ad?.stressTest) setStressTestData(ad.stressTest);
    if (ad?.pitchDeck) setPitchDeckData(ad.pitchDeck);
    if (ad?.businessStressTest) setBusinessStressTestData(ad.businessStressTest);
    // Business pitch deck uses its own state — never overwrite product pitchDeckData
    // businessPitchDeck is loaded on-demand by BusinessResultsPage via analysis.pitchDeckData routing
    if (ad?.redesign) setRedesignData(ad.redesign);
    if (ad?.geoOpportunity) setGeoData(ad.geoOpportunity);
    if (ad?.regulatoryContext) setRegulatoryData(ad.regulatoryContext);
    if (ad?.userScores) setUserScores(ad.userScores as Record<string, Record<string, number>>);
    if (ad?.insightPreferences) setInsightPreferences(ad.insightPreferences as Record<string, "liked" | "dismissed" | "neutral">);
    if (ad?.steeringText) setSteeringText(ad.steeringText as string);
    if (ad?.adaptiveContext) setAdaptiveContext(ad.adaptiveContext as AdaptiveContextData);
    if (ad?.pitchDeckImages) setPitchDeckImages(ad.pitchDeckImages as { url: string; ideaName: string }[]);
    if (ad?.pitchDeckExclusions && Array.isArray(ad.pitchDeckExclusions)) setPitchDeckExclusions(new Set(ad.pitchDeckExclusions as string[]));
    // projectNotes is loaded on-demand in portfolio/report, no context state needed
    // Restore active lens (lens object is fetched on-demand by LensToggle; we just clear state here)
    // The activeLensId is stored but lens restoration requires a DB fetch — handled by LensToggle
    if (!ad?.activeLensId) setActiveLensState(null);

    // Restore outdated steps
    if (ad?.outdatedSteps && Array.isArray(ad.outdatedSteps)) {
      setOutdatedSteps(new Set(ad.outdatedSteps as string[]));
    } else {
      setOutdatedSteps(new Set());
    }

    // Auto-detect legacy schema and flag affected steps for regeneration
    const { detectLegacySchema } = await import("@/utils/legacyDetection");
    const legacy = detectLegacySchema(ad);
    if (legacy.isLegacy) {
      setOutdatedSteps(prev => {
        const next = new Set(prev);
        legacy.legacySteps.forEach(s => next.add(s));
        return next;
      });
      toast.info("This analysis used an older framework — regenerate steps to get improved insights");
    }

    if (analysis.analysis_type === "business_model") {
      setBusinessAnalysisData(analysis.analysis_data as BusinessModelAnalysisData);
      // For business analyses, route businessPitchDeck into pitchDeckData
      if (ad?.businessPitchDeck) setPitchDeckData(ad.businessPitchDeck);
      const titleParts = (analysis.title || "").split(" — ");
      setBusinessModelInput({ type: titleParts[0] || "Business", description: "", revenueModel: "", size: "", geography: "", painPoints: "", notes: "" });
      setMainTab("business");
      setActiveMode("business");
      setAnalysisId(analysis.id);
      toast.success("Business model analysis loaded!");
      navigate(`/business/${analysis.id}`);
    } else if (analysis.analysis_type === "first_principles") {
      if (sanitizedProducts.length > 0) {
        setProducts(sanitizedProducts);
        setSelectedProduct(sanitizedProducts[0]);
        setStep("done");
      }
      setMainTab("custom");
      setActiveMode("custom");
      setAnalysisId(analysis.id);
      toast.success("First principles analysis loaded — re-run to see full results.");
      navigate(`/analysis/${analysis.id}/disrupt`);
    } else {
      if (sanitizedProducts.length === 0) {
        toast.error("This analysis has no product data to display.");
        return;
      }
      setProducts(sanitizedProducts);
      setSelectedProduct(sanitizedProducts[0]);
      setAnalysisParams({ category: analysis.category, era: analysis.era || "All Eras / Current", batchSize: analysis.batch_size ?? analysis.batchSize ?? 5 });
      const isService = analysis.analysis_type === "service" || isServiceCategory(analysis.category || "");
      setMainTab(isService ? "service" : "custom");
      setActiveMode(isService ? "service" : "custom");
      setDetailTab("overview");
      setStep("done");
      setAnalysisId(analysis.id);

      // Quick photo analyses: always resume at report so user can proceed through the full pipeline
      const isQuickPhoto = analysis.analysis_depth === "quick";
      if (isQuickPhoto) {
        toast.success("Analysis loaded — continue through the full pipeline");
        navigate(`/analysis/${analysis.id}/report`);
      } else {
        // Use centralized resume logic
        const hasProducts = sanitizedProducts.length > 0;
        const { route: resumeRoute, label: resumeLabel } = getResumeRoute(ad, hasProducts);

        toast.success(`Resuming where you left off — ${resumeLabel}`);
        navigate(`/analysis/${analysis.id}/${resumeRoute}`);
      }
    }
  }, [navigate]);

  // ── AUTO-HYDRATION: Load analysis from URL when context is empty ──
  // This handles direct navigation (bookmarks, shared links, page refresh)
  const autoHydratedRef = useRef(false);
  useEffect(() => {
    if (autoHydratedRef.current) return;
    if (step !== "idle" || products.length > 0) return;

    // Extract analysis ID from URL path: /analysis/:id/report, /analysis/:id/disrupt, etc.
    const match = window.location.pathname.match(/\/analysis\/([0-9a-f-]{36})\//);
    if (!match) return;
    const urlAnalysisId = match[1];
    if (!urlAnalysisId || !user?.id) return;

    autoHydratedRef.current = true;
    setIsHydrating(true);
    console.log("[AutoHydrate] Loading analysis from URL:", urlAnalysisId);

    (async () => {
      try {
        const { data, error } = await (supabase.from("saved_analyses") as any)
          .select("*")
          .eq("id", urlAnalysisId)
          .single();

        if (error || !data) {
          console.warn("[AutoHydrate] Analysis not found:", urlAnalysisId, error?.message);
          return;
        }

        // Verify ownership
        if (data.user_id !== user.id) {
          console.warn("[AutoHydrate] User does not own this analysis");
          return;
        }

        // Use handleLoadSaved but suppress its navigation — we're already on the right page
        const rawProducts = Array.isArray(data.products) ? data.products : [];
        const sanitizedProducts = rawProducts.map((p: any, idx: number) => {
          const base = {
            id: p.id || `product-${data.id}-${idx}`,
            name: p.name || "Untitled Product",
            category: p.category || data.category || "",
            image: p.image || "",
            description: p.description || "",
            specs: p.specs || "",
            revivalScore: p.revivalScore ?? 0,
            era: p.era || "All Eras / Current",
            sources: Array.isArray(p.sources) ? p.sources : [],
            reviews: Array.isArray(p.reviews) ? p.reviews : [],
            socialSignals: Array.isArray(p.socialSignals) ? p.socialSignals : [],
            competitors: Array.isArray(p.competitors) ? p.competitors : [],
            assumptionsMap: Array.isArray(p.assumptionsMap) ? p.assumptionsMap : [],
            flippedIdeas: Array.isArray(p.flippedIdeas) ? p.flippedIdeas : [],
            confidenceScores: p.confidenceScores || { adoptionLikelihood: 5, feasibility: 5, emotionalResonance: 5 },
          };
          return normalizeProductFields({ ...p, ...base });
        });

        if (sanitizedProducts.length === 0) {
          console.warn("[AutoHydrate] Analysis has no products");
          return;
        }

        const ad = data.analysis_data as Record<string, unknown> | null;

        // Restore all state
        setLoadedFromSaved(true);
        setProducts(sanitizedProducts);
        setSelectedProduct(sanitizedProducts[0]);
        setAnalysisParams({ category: data.category, era: data.era || "All Eras / Current", batchSize: data.batch_size ?? 5 });
        const isService = data.analysis_type === "service" || isServiceCategory(data.category || "");
        setMainTab(isService ? "service" : data.analysis_type === "business_model" ? "business" : "custom");
        setActiveMode(isService ? "service" : data.analysis_type === "business_model" ? "business" : "custom");
        setStep("done");
        setAnalysisId(data.id);

        // Restore persisted data
        if (ad?.governed) setGovernedData(ad.governed as Record<string, unknown>);
        if (ad?.activeBranchId) setActiveBranchIdState(ad.activeBranchId as string);
        if (ad?.strategicProfile) setStrategicProfileState(ad.strategicProfile as StrategicProfile);
        if (ad?.disrupt) setDisruptData(ad.disrupt);
        if (ad?.stressTest) setStressTestData(ad.stressTest);
        if (ad?.pitchDeck) setPitchDeckData(ad.pitchDeck);
        if (ad?.businessStressTest) setBusinessStressTestData(ad.businessStressTest);
        if (ad?.redesign) setRedesignData(ad.redesign);
        if (ad?.geoOpportunity) setGeoData(ad.geoOpportunity);
        if (ad?.regulatoryContext) setRegulatoryData(ad.regulatoryContext);
        if (ad?.userScores) setUserScores(ad.userScores as Record<string, Record<string, number>>);
        if (ad?.insightPreferences) setInsightPreferences(ad.insightPreferences as Record<string, "liked" | "dismissed" | "neutral">);
        if (ad?.steeringText) setSteeringText(ad.steeringText as string);
        if (ad?.adaptiveContext) setAdaptiveContext(ad.adaptiveContext as AdaptiveContextData);
        if (ad?.pitchDeckImages) setPitchDeckImages(ad.pitchDeckImages as { url: string; ideaName: string }[]);
        if (ad?.pitchDeckExclusions && Array.isArray(ad.pitchDeckExclusions)) setPitchDeckExclusions(new Set(ad.pitchDeckExclusions as string[]));
        if (!ad?.activeLensId) setActiveLensState(null);
        if (ad?.outdatedSteps && Array.isArray(ad.outdatedSteps)) setOutdatedSteps(new Set(ad.outdatedSteps as string[]));
        else setOutdatedSteps(new Set());

        // Business model routing
        if (data.analysis_type === "business_model" && ad?.businessPitchDeck) {
          setPitchDeckData(ad.businessPitchDeck);
          setBusinessAnalysisData(data.analysis_data as BusinessModelAnalysisData);
        }

        console.log("[AutoHydrate] Analysis loaded successfully:", data.title);
      } catch (err) {
        console.error("[AutoHydrate] Failed:", err);
      } finally {
        setIsHydrating(false);
      }
    })();
  }, [step, products.length, user?.id]);

  return (
    <AnalysisContext.Provider value={{
      step, setStep, products, setProducts, selectedProduct, setSelectedProduct,
      analysisParams, setAnalysisParams, errorMsg, setErrorMsg,
      mainTab, setMainTab, activeMode, setActiveMode,
      elapsedSeconds, loadingLog, stepMessage,
      detailTab, setDetailTab, visitedDetailTabs, setVisitedDetailTabs,
      disruptData, setDisruptData,
      stressTestData, setStressTestData, stressTestTab, setStressTestTab,
      visitedStressTestTabs, setVisitedStressTestTabs,
      pitchDeckData, setPitchDeckData,
      businessAnalysisData, setBusinessAnalysisData,
      businessModelInput, setBusinessModelInput,
      businessStressTestData, setBusinessStressTestData,
      businessStressTestTab, setBusinessStressTestTab,
      visitedBusinessStressTestTabs, setVisitedBusinessStressTestTabs,
      generatingIdeasFor, savedRefreshTrigger, setSavedRefreshTrigger,
      loadedFromSaved, setLoadedFromSaved,
      handleAnalyze, handleRegenerateIdeas, handleManualSave, handleLoadSaved, saveAnalysis, saveStepData,
      analysisId, setAnalysisId,
      outdatedSteps, markStepOutdated, clearStepOutdated,
      userScores, setUserScore,
      redesignData, setRedesignData,
      insightPreferences, setInsightPreference, getLikedInsights, getDismissedInsights,
      steeringText, setSteeringText, saveSteeringText,
      pitchDeckImages, setPitchDeckImage, removePitchDeckImage,
      pitchDeckExclusions, togglePitchDeckExclusion,
      activeLens, setActiveLens,
      geoData, setGeoData, fetchGeoData,
      regulatoryData, setRegulatoryData,
      modeRouting, setModeRouting,
      adaptiveContext, setAdaptiveContext,
      governedData, setGovernedData,
      activeBranchId, setActiveBranchId,
      strategicProfile, setStrategicProfile,
      isHydrating,
    }}>
      {children}
    </AnalysisContext.Provider>
  );
}
