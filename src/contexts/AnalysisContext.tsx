import React, { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo } from "react";
import { normalizeProductFields, isServiceCategory } from "@/utils/normalizeProduct";
import { clearAllState, hydrateFromRow, sanitizeProducts, type HydrationSetters } from "./hydrateAnalysis";
import { type Product, type FlippedIdea } from "@/data/mockProducts";
import { type AnalysisMode } from "@/components/AnalysisForm";
import type { UserLens } from "@/components/LensToggle";
import type { RoutingResult } from "@/lib/modeIntelligence";
import { type StrategicProfile, DEFAULT_PROFILES } from "@/lib/strategicOS";
import { type BusinessModelAnalysisData } from "@/components/BusinessModelAnalysis";
import { supabase } from "@/integrations/supabase/client";
import { invokeWithTimeout } from "@/lib/invokeWithTimeout";
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
  createAnalysis: (title: string, analysisType: string, extraFields?: Record<string, unknown>) => Promise<string>;
  saveStepData: (stepKey: string, data: unknown, targetAnalysisId?: string) => Promise<void>;

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

  // Scouted competitors (from Disrupt step — passed to Stress Test)
  scoutedCompetitors: unknown[];
  setScoutedCompetitors: (d: unknown[]) => void;

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
  activeModes?: string[]; // User-selected active modes (e.g., ["product", "service", "business"])
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
  // ── Scouted Competitors (from Disrupt → Stress Test) ──
  const [scoutedCompetitors, setScoutedCompetitors] = useState<unknown[]>([]);

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

  const createAnalysis = useCallback(async (title: string, analysisType: string, extraFields?: Record<string, unknown>): Promise<string> => {
    if (!user?.id) throw new Error("User not authenticated");

    // Check for duplicate titles and append version
    let finalTitle = title;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase.from("saved_analyses") as any)
      .select("title")
      .eq("user_id", user.id)
      .like("title", `${title}%`);
    if (existing && existing.length > 0) {
      const versions = existing.map((e: { title: string }) => {
        const match = e.title.match(/ v(\d+)$/);
        return match ? parseInt(match[1]) : 1;
      });
      const nextVersion = Math.max(...versions) + 1;
      finalTitle = `${title} v${nextVersion}`;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from("saved_analyses") as any).insert({
      user_id: user.id,
      title: finalTitle,
      category: extraFields?.category || "Business Model",
      era: "All Eras / Current",
      audience: (extraFields?.audience as string) || "General",
      analysis_type: analysisType,
      products: extraFields?.products || [],
      analysis_data: extraFields?.analysis_data || {},
      ...(extraFields?.batch_size != null ? { batch_size: extraFields.batch_size } : {}),
      ...(extraFields?.product_count != null ? { product_count: extraFields.product_count } : {}),
    }).select("id").single();

    if (error || !data?.id) throw new Error(error?.message || "Failed to create analysis record");

    setAnalysisId(data.id);
    setSavedRefreshTrigger((n) => n + 1);
    return data.id;
  }, [user?.id]);

  // ── Shared hydration setters object (used by clearAllState and hydrateFromRow) ──
  const hydrationSetters: HydrationSetters = useMemo(() => ({
    setAnalysisId, setProducts, setSelectedProduct, setAnalysisParams,
    setMainTab, setActiveMode, setStep, setDetailTab, setLoadedFromSaved,
    setDisruptData, setStressTestData, setPitchDeckData, setRedesignData,
    setGovernedData, setBusinessAnalysisData, setBusinessModelInput,
    setBusinessStressTestData,
    setActiveBranchIdState, setStrategicProfileState: setStrategicProfileState,
    setUserScores, setOutdatedSteps, setInsightPreferences, setSteeringText,
    setPitchDeckImages, setPitchDeckExclusions, setScoutedCompetitors,
    setAdaptiveContext: setAdaptiveContextState, setGeoData, setRegulatoryData,
    setActiveLensState,
  }), []);

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

    // Clear all step state to prevent cross-analysis contamination
    clearAllState(hydrationSetters);
    // Keep activeLens — user may want to run analysis with their lens

    startLoadingTimer();

    const hasCustom = customProducts && customProducts.length > 0;

    // ── DATABASE-FIRST ID: Create the DB row BEFORE navigating ──
    // This eliminates the dual-ID race condition where a client UUID
    // could differ from the DB-assigned ID.
    const isServiceMode = params.category === "Service";
    const customName = customProducts?.find(cp => cp.productName)?.productName;
    const prelimTitle = customName || `${params.category} Analysis`;
    let dbId: string;
    try {
      dbId = await createAnalysis(prelimTitle, isServiceMode ? "service" : "product", {
        category: params.category,
        batch_size: params.batchSize,
      });
    } catch (createErr) {
      console.error("Failed to create analysis record:", createErr);
      setStep("error");
      setErrorMsg("Failed to initialize analysis. Please try again.");
      stopLoadingTimer();
      return;
    }
    setAnalysisId(dbId);

    // Navigate to report page so user sees loading progress in-place
    navigate(`/analysis/${dbId}/report`);

    // isServiceMode already declared above

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
      const { data: scrapeData, error: scrapeError } = await invokeWithTimeout(
        "scrape-products",
        { body: { ...baseParams, customProducts } },
        180_000, // 3 min — scraping can be slow
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

      const { data: analyzeData, error: analyzeError } = await invokeWithTimeout(
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
        },
        180_000, // 3 min
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
      navigate(`/analysis/${dbId}/report`);
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
      // Build upstream intel bundle
      const upstreamIntel: Record<string, unknown> = {};
      if (product.pricingIntel) upstreamIntel.pricingIntel = product.pricingIntel;
      if (product.supplyChain) upstreamIntel.supplyChain = {
        suppliers: ((product.supplyChain as any).suppliers || []).slice(0, 5).map((s: any) => ({ name: s.name, region: s.region, role: s.role })),
        manufacturers: ((product.supplyChain as any).manufacturers || []).slice(0, 5).map((m: any) => ({ name: m.name, region: m.region, moq: m.moq })),
        distributors: ((product.supplyChain as any).distributors || []).slice(0, 3).map((d: any) => ({ name: d.name, region: d.region })),
      };
      if ((product as any).communityInsights) {
        const ci = (product as any).communityInsights;
        upstreamIntel.communityInsights = {
          communitySentiment: ci.communitySentiment || ci.redditSentiment,
          topComplaints: (ci.topComplaints || []).slice(0, 5),
          improvementRequests: (ci.improvementRequests || []).slice(0, 5),
        };
      }
      if ((product as any).userWorkflow) {
        const uw = (product as any).userWorkflow;
        upstreamIntel.userWorkflow = {
          stepByStep: (uw.stepByStep || []).slice(0, 8),
          frictionPoints: (uw.frictionPoints || []).slice(0, 5),
          cognitiveLoad: uw.cognitiveLoad,
        };
      }
      if (product.patentData) {
        upstreamIntel.patentLandscape = {
          totalPatents: product.patentData.totalPatents,
          expiredPatents: product.patentData.expiredPatents,
          keyPlayers: (product.patentData.keyPlayers || []).slice(0, 5),
          gapAnalysis: product.patentData.gapAnalysis,
        };
      }
      // Build disrupt context from saved disrupt data
      let disruptCtx: Record<string, unknown> | undefined;
      if (disruptData) {
        const dd = disruptData as Record<string, unknown>;
        disruptCtx = {
          hiddenAssumptions: dd.hiddenAssumptions || null,
          flippedLogic: dd.flippedLogic || null,
        };
      }
      const { data, error } = await supabase.functions.invoke("generate-flip-ideas", {
        body: {
          product,
          additionalContext: fullContext,
          insightPreferences: Object.keys(insightPreferences).length > 0 ? insightPreferences : undefined,
          steeringText: steeringText || undefined,
          activeBranch,
          adaptiveContext: adaptiveContext || undefined,
          upstreamIntel: Object.keys(upstreamIntel).length > 0 ? upstreamIntel : undefined,
          disruptContext: disruptCtx || undefined,
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
  // ── HARDENED: Context switch guard + atomic RPC for simple steps ──
  const saveStepData = useCallback(async (stepKey: string, data: unknown, targetAnalysisId?: string) => {
    const resolvedAnalysisId = targetAnalysisId || analysisId;
    if (!resolvedAnalysisId) return;

    // ── CONTEXT SWITCH GUARD: Capture current analysisId in closure ──
    const capturedId = resolvedAnalysisId;

    // ── Pipeline Validation ──
    const { validateStepData, logStepExecution } = await import("@/utils/pipelineValidation");
    const validation = validateStepData(stepKey, data);
    logStepExecution(stepKey, "save", { analysisId: capturedId, valid: validation.valid });

    if (!validation.valid) {
      console.error("[Pipeline] Validation failed for step:", stepKey, validation.errors);
      return;
    }

    // ── GOVERNED: Checkpoint gate — validate governed artifacts before persistence ──
    const { validateBeforePersistence, enforceDependencyIntegrity } = await import("@/utils/checkpointGate");
    const governedCheck = validateBeforePersistence(stepKey, data);
    if (!governedCheck.allowed) {
      console.error(`[Governed] PERSISTENCE BLOCKED for "${stepKey}": ${governedCheck.reason}`);
      toast.error(`Checkpoint gate blocked: ${governedCheck.reason}`);
      return;
    }

    // ── GOVERNED: Invalidate dependent downstream steps ──
    if (governedCheck.invalidatedSteps.length > 0) {
      console.log(`[Governed] Invalidating downstream steps: ${governedCheck.invalidatedSteps.join(", ")}`);
      for (const depStep of governedCheck.invalidatedSteps) {
        markStepOutdated(depStep);
      }
    }

    // ── CONTEXT SWITCH CHECK: Abort if user switched analyses during validation ──
    if (!targetAnalysisId && analysisId !== capturedId) {
      console.warn(`[saveStepData] Context switched during save (${capturedId} → ${analysisId}). Aborting.`);
      return;
    }

    try {
      // Check if this step requires the complex governed artifact extraction
      const { extractGovernedArtifacts, mergeGovernedIntoAnalysisData, checkRetroactiveInvalidation, applyRetroactiveInvalidation } = await import("@/lib/governedPersistence");
      const extraction = extractGovernedArtifacts(stepKey, data);
      const hasGovernedWork = extraction.hasGoverned && extraction.valid;
      const depIntegrity = enforceDependencyIntegrity(stepKey, data, {});
      const needsComplexMerge = hasGovernedWork || depIntegrity.purgeSteps.length > 0;

      if (!needsComplexMerge) {
        // ── ATOMIC PATH: Use Postgres RPC for simple step saves ──
        // This is concurrency-safe — no read-merge-write needed
        try {
          const { error: rpcError } = await (supabase.rpc as any)("merge_analysis_step", {
            p_analysis_id: capturedId,
            p_step_key: stepKey,
            p_step_payload: JSON.stringify(data),
          });
          if (rpcError) {
            console.error("Atomic merge_analysis_step failed:", rpcError);
            // Fall through to legacy path
          } else {
            logStepExecution(stepKey, "save", { analysisId: capturedId, success: true, atomic: true });
            return; // Success — done
          }
        } catch (rpcErr) {
          console.warn("[saveStepData] Atomic RPC failed, falling back to legacy merge:", rpcErr);
        }
      }

      // ── LEGACY COMPLEX PATH: Read-merge-write for governed artifacts ──
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existing } = await (supabase.from("saved_analyses") as any)
        .select("analysis_data")
        .eq("id", capturedId)
        .single();

      // ── CONTEXT SWITCH CHECK: Abort if user switched during DB read ──
      if (analysisId !== capturedId) {
        console.warn(`[saveStepData] Context switched during DB read. Aborting.`);
        return;
      }

      const prev = (existing?.analysis_data as Record<string, unknown>) || {};

      // Snapshot previous value for version comparison
      const previousSnapshot = (prev.previousSnapshot as Record<string, unknown>) || {};
      if (prev[stepKey] && JSON.stringify(prev[stepKey]) !== JSON.stringify(data)) {
        previousSnapshot[stepKey] = prev[stepKey];
      }

      // ── GOVERNED: Artifact versioning + dependency integrity ──
      const governedHashes = (prev.governedHashes as Record<string, string>) || {};
      const depIntegrityFull = enforceDependencyIntegrity(stepKey, data, governedHashes);
      governedHashes[stepKey] = depIntegrityFull.newHash;

      const { buildEvidenceRegistry } = await import("@/lib/evidenceRegistry");
      const { applyLensAdaptation } = await import("@/lib/lensAdaptationEngine");
      
      // ── PAYLOAD COMPACTION ──
      const MAX_SNAPSHOT_KEYS = 6;
      const snapshotKeys = Object.keys(previousSnapshot);
      if (snapshotKeys.length > MAX_SNAPSHOT_KEYS) {
        for (const oldKey of snapshotKeys.slice(0, snapshotKeys.length - MAX_SNAPSHOT_KEYS)) {
          delete previousSnapshot[oldKey];
        }
      }

      let merged: Record<string, unknown> = { ...prev, [stepKey]: data, previousSnapshot, governedHashes };
      
      // Merge governed artifacts into analysis_data.governed (top level)
      if (hasGovernedWork) {
        merged = mergeGovernedIntoAnalysisData(merged, extraction);
        console.log(`[GovernedPersistence] Merged ${extraction.presentArtifacts.length} artifacts (${extraction.governedByteSize} bytes) into analysis_data.governed`);
        
        const registry = buildEvidenceRegistry(merged);
        merged._evidenceRegistry = registry;

        const governedForLens = merged.governed as Record<string, unknown> | undefined;
        if (governedForLens) {
          const activeLensVal = (merged as any)._activeLens || null;
          const lensResult = applyLensAdaptation(governedForLens, activeLensVal);
          if (lensResult) {
            merged._lensAdaptation = lensResult;
          }
        }
        
        const governedObj = merged.governed as Record<string, unknown>;
        const invalidation = checkRetroactiveInvalidation(governedObj);
        if (invalidation.shouldInvalidate) {
          merged.governed = applyRetroactiveInvalidation(governedObj, invalidation);
          console.warn(`[RetroactiveInvalidation] Applied: confidence downgraded by ${invalidation.confidenceDowngrade}`);
          for (const affected of invalidation.affectedArtifacts) {
            markStepOutdated(affected);
          }
        }
      } else if (extraction.hasGoverned && !extraction.valid) {
        console.warn(`[GovernedPersistence] Governed data INVALID. Rejecting.`);
      }

      // ── GOVERNED: Purge invalidated downstream governed artifacts ──
      const allPurgeSteps = [...new Set([...governedCheck.invalidatedSteps, ...depIntegrityFull.purgeSteps])];
      if (allPurgeSteps.length > 0) {
        for (const depStep of allPurgeSteps) {
          markStepOutdated(depStep);
          const gd = merged.governed as Record<string, unknown> | undefined;
          if (gd && gd[depStep]) {
            delete gd[depStep];
            delete governedHashes[depStep];
          }
        }
      }

      // ── SIZE GUARD ──
      const mergedStr = JSON.stringify(merged);
      const payloadBytes = new TextEncoder().encode(mergedStr).length;
      const MAX_PAYLOAD_BYTES = 4_000_000;
      if (payloadBytes > MAX_PAYLOAD_BYTES) {
        console.warn(`[Pipeline] Payload too large (${(payloadBytes / 1_000_000).toFixed(1)}MB), stripping data`);
        delete merged.previousSnapshot;
        if (merged.pitchDeckImages && Array.isArray(merged.pitchDeckImages)) {
          merged.pitchDeckImages = (merged.pitchDeckImages as any[]).map(img => ({
            ...img,
            url: typeof img.url === "string" && img.url.startsWith("data:") ? "" : img.url,
          }));
        }
      }

      // ── FINAL CONTEXT SWITCH CHECK before write ──
      if (analysisId !== capturedId) {
        console.warn(`[saveStepData] Context switched before final write. Aborting.`);
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase.from("saved_analyses") as any)
        .update({ analysis_data: merged, updated_at: new Date().toISOString() })
        .eq("id", capturedId);
      if (updateError) {
        console.error("saveStepData update failed:", updateError, "analysisId:", capturedId, "stepKey:", stepKey);
      } else {
        logStepExecution(stepKey, "save", { analysisId: capturedId, success: true, governedByteSize: extraction.governedByteSize });
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
    // ── CLEAR ALL STATE using shared helper ──
    clearAllState(hydrationSetters);

    // If analysis_data is missing, fetch the full record first
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

    // ── USE SHARED HYDRATION HELPER ──
    const { sanitizedProducts, analysisData: ad } = hydrateFromRow(analysis, hydrationSetters);

    // Auto-backfill governed data if missing
    if (ad?.governed) {
      const gov = ad.governed as Record<string, unknown>;
      const cm = gov?.constraint_map as Record<string, unknown> | undefined;
      const hasRH = (Array.isArray(gov?.root_hypotheses) && (gov.root_hypotheses as unknown[]).length > 0) ||
        (Array.isArray(cm?.root_hypotheses) && (cm!.root_hypotheses as unknown[]).length > 0);
      const hasSynopsis = !!gov?.reasoning_synopsis;
      if ((!hasRH || !hasSynopsis) && analysis.id) {
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
            if (data?.synopsis) (updated as any).reasoning_synopsis = data.synopsis;
            return updated;
          });
        }).catch(() => {});
      }
    } else if (analysis.id) {
      supabase.functions.invoke("backfill-strategic-os", {
        body: { singleAnalysisId: analysis.id },
      }).then(({ data }) => {
        if (data?.hypotheses || data?.synopsis) {
          setGovernedData({
            root_hypotheses: data?.hypotheses || [],
            reasoning_synopsis: data?.synopsis || null,
          });
        }
      }).catch(() => {});
    }

    // Auto-detect legacy schema
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

    // Route-specific navigation
    if (analysis.analysis_type === "business_model") {
      toast.success("Business model analysis loaded!");
      navigate(`/business/${analysis.id}`);
    } else if (analysis.analysis_type === "first_principles") {
      toast.success("Analysis loaded — starting from Structural Analysis");
      navigate(`/analysis/${analysis.id}/disrupt`);
    } else {
      if (sanitizedProducts.length === 0) {
        toast.error("This analysis has no product data to display.");
        return;
      }
      toast.success("Analysis loaded — starting from Intelligence Report");
      navigate(`/analysis/${analysis.id}/report`);
    }
  }, [navigate, hydrationSetters]);

  // ── AUTO-HYDRATION: Load analysis from URL when context is empty ──
  // This handles direct navigation (bookmarks, shared links, page refresh)
  // Also re-triggers when the URL changes to a DIFFERENT analysis ID
  const autoHydratedIdRef = useRef<string | null>(null);
  useEffect(() => {
    // Extract analysis ID from URL path: /analysis/:id/... or /business/:id
    const match = window.location.pathname.match(/(?:\/analysis|\/business)\/([0-9a-f-]{36})/);
    if (!match) return;
    const urlAnalysisId = match[1];
    if (!urlAnalysisId || !user?.id) return;

    // Skip if we already hydrated THIS specific analysis
    if (autoHydratedIdRef.current === urlAnalysisId) return;
    // Skip if context already has the correct analysis loaded
    if (analysisId === urlAnalysisId && step === "done" && products.length > 0) {
      autoHydratedIdRef.current = urlAnalysisId;
      return;
    }
    // Don't interrupt an active analysis pipeline (scraping/analyzing)
    if (step === "scraping" || step === "analyzing") return;

    autoHydratedIdRef.current = urlAnalysisId;
    setIsHydrating(true);
    console.log("[AutoHydrate] Loading analysis from URL:", urlAnalysisId);

    // ── CLEAR ALL STATE using shared helper ──
    clearAllState(hydrationSetters);

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

        const testProducts = sanitizeProducts(data.products, data);
        if (testProducts.length === 0 && data.analysis_type !== "business_model") {
          console.warn("[AutoHydrate] Analysis has no products");
          return;
        }

        // ── USE SHARED HYDRATION HELPER ──
        hydrateFromRow(data, hydrationSetters);

        console.log("[AutoHydrate] Analysis loaded successfully:", data.title);
      } catch (err) {
        console.error("[AutoHydrate] Failed:", err);
      } finally {
        setIsHydrating(false);
      }
    })();
  }, [step, products.length, user?.id, analysisId, hydrationSetters]);

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
      handleAnalyze, handleRegenerateIdeas, handleManualSave, handleLoadSaved, saveAnalysis, createAnalysis, saveStepData,
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
      scoutedCompetitors, setScoutedCompetitors,
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
