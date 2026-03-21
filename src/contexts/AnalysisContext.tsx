import React, { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo } from "react";
import { computeInstantInsights, type InstantInsights } from "@/lib/instantInsights";
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
import { buildDiagnosticContext, extractLensConfig, type DiagnosticContext } from "@/lib/diagnosticContext";

// Extracted hooks
import { useLoadingTimer } from "@/hooks/useLoadingTimer";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useAutoPersistEffects } from "@/hooks/useAutoPersistEffects";

/** Lightweight summary of a concept variant for cross-page transfer */
export interface ConceptVariantSummary {
  id: string;
  name: string;
  description: string;
  formula: string;
  feasibility: "strong" | "moderate" | "early";
  novelty: "strong" | "moderate" | "early";
  marketReadiness: "strong" | "moderate" | "early";
  dimensionValues: Record<string, string>;
  opportunityLabel: string;
}

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
  /** Computed DiagnosticContext (mode + lens) that flows to all diagnostic engines */
  diagnosticContext: DiagnosticContext;

  // Loading
  elapsedSeconds: number;
  loadingLog: { text: string; ts: number }[];
  stepMessage: string;

  // Detail tabs
  detailTab: string;
  setDetailTab: (t: string) => void;
  visitedDetailTabs: Set<string>;
  setVisitedDetailTabs: (s: Set<string>) => void;

  // Structural Decomposition (first-principles primitives)
  decompositionData: unknown;
  setDecompositionData: (d: unknown) => void;

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
    territory?: string;
  }) => Promise<void>;
  retryAnalysis: () => void;
  handleRegenerateIdeas: (product: Product, userContext?: string, rejectedIdeas?: string[]) => Promise<void>;
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

  // Invention Engine concepts (Product Mode)
  conceptsData: unknown;
  setConceptsData: (d: unknown) => void;

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
  fetchGeoData: (category: string, productName?: string, geography?: string) => Promise<void>;

  // Regulatory data (adaptive — only populated for regulated categories)
  regulatoryData: unknown;
  setRegulatoryData: (d: unknown) => void;

  // Scouted competitors (from Disrupt step — passed to Stress Test)
  scoutedCompetitors: unknown[];
  setScoutedCompetitors: (d: unknown[]) => void;

  // Persisted rejected idea names (survives reloads)
  rejectedIdeasPersisted: string[];

  // Concept variants selected for stress testing (from Insight Graph → Stress Test)
  conceptVariantsForStressTest: ConceptVariantSummary[];
  setConceptVariantsForStressTest: (d: ConceptVariantSummary[]) => void;

  // Mode routing
  modeRouting: RoutingResult | null;
  setModeRouting: (r: RoutingResult | null) => void;

  // Adaptive context (problem analysis, challenges, entity)
  adaptiveContext: AdaptiveContextData | null;
  setAdaptiveContext: (ctx: AdaptiveContextData | null) => void;

  // Hydration state — true while auto-hydration DB fetch is in progress
  isHydrating: boolean;

  // Instant structural insights (deterministic, computed from scraped data)
  instantInsights: InstantInsights | null;
  setInstantInsights: (d: InstantInsights | null) => void;
}

export interface AdaptiveContextData {
  problemStatement?: string;
  entity?: { name: string; type: string };
  detectedModes?: { mode: string; confidence: number; reason: string }[];
  activeModes?: string[];
  selectedChallenges?: { id: string; question: string; context: string; priority: string; related_mode: string }[];
  summary?: string;
  userGuidance?: string;
  /** Flattened BI extraction context string from uploaded documents — threaded to all pipeline steps */
  extractedContext?: string;
  /** Raw structured BI extraction data from uploaded documents */
  biExtraction?: Record<string, unknown>;
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

  // ── Core State ──
  const [step, setStep] = useState<AnalysisStep>("idle");
  const [isHydrating, setIsHydrating] = useState(false);
  const [mainTab, setMainTab] = useState<"custom" | "service" | "business">("custom");
  const [activeMode, setActiveModeState] = useState<AnalysisMode>("custom");
  const activeModeRef = useRef<AnalysisMode>("custom");
  const pendingModeSnapshotRef = useRef<{ key: string; data: Record<string, any> } | null>(null);
  const [stepMessage, setStepMessage] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [analysisParams, setAnalysisParams] = useState<{ category: string; era: string; batchSize: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [generatingIdeasFor, setGeneratingIdeasFor] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<string>("overview");
  const [visitedDetailTabs, setVisitedDetailTabs] = useState<Set<string>>(new Set(["overview"]));
  const [decompositionData, setDecompositionData] = useState<unknown>(null);
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

  // Declare these before the stepDataRef useEffect that references them
  const [redesignData, setRedesignData] = useState<unknown>(null);
  const [conceptsData, setConceptsData] = useState<unknown>(null);

  // ── Loading Timer (extracted) ──
  const { elapsedSeconds, loadingLog, pushLog, startLoadingTimer, stopLoadingTimer } = useLoadingTimer();

  // ── Outdated Step Tracking ──
  const [outdatedSteps, setOutdatedSteps] = useState<Set<string>>(new Set());
  const stepDataRef = useRef<Record<string, unknown>>({});

  const markStepOutdated = useCallback((step: string) => {
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

  // Keep stepDataRef in sync
  useEffect(() => {
    stepDataRef.current = {
      decompose: decompositionData,
      disrupt: disruptData,
      stressTest: stressTestData,
      pitchDeck: pitchDeckData,
      redesign: redesignData,
      concepts: conceptsData,
    };
  }, [decompositionData, disruptData, stressTestData, pitchDeckData, redesignData, conceptsData]);

  // ── User Preferences (extracted) ──
  const prefs = useUserPreferences(markStepOutdated);

  // ── Branch & Profile ──
  const pendingBranchSaveRef = useRef<string | null | undefined>(undefined);
  const setActiveBranchId = useCallback((id: string | null) => {
    setActiveBranchIdState(id);
    markStepOutdated("redesign");
    markStepOutdated("stressTest");
    markStepOutdated("pitchDeck");
    pendingBranchSaveRef.current = id;
  }, [markStepOutdated]);
  const pendingProfileSaveRef = useRef<StrategicProfile | undefined>(undefined);
  const setStrategicProfile = useCallback((p: StrategicProfile) => {
    setStrategicProfileState(p);
    pendingProfileSaveRef.current = p;
    markStepOutdated("redesign");
    markStepOutdated("stressTest");
    markStepOutdated("pitchDeck");
  }, [markStepOutdated]);

  // ── Lens ──
  const [activeLens, setActiveLensState] = useState<UserLens | null>(null);
  const pendingLensSaveRef = useRef<string | null | undefined>(undefined);
  const setActiveLens = useCallback((lens: UserLens | null) => {
    setActiveLensState(lens);
    pendingLensSaveRef.current = lens?.id ?? null;
    markStepOutdated("redesign");
    markStepOutdated("stressTest");
    markStepOutdated("pitchDeck");
  }, [markStepOutdated]);

  const setActiveMode = useCallback((m: AnalysisMode) => {
    // #8: Snapshot current mode artifacts before switching
    const currentMode = activeModeRef.current;
    if (currentMode && currentMode !== m) {
      const snapshotKey = `modeSnapshot_${currentMode}`;
      const snapshot: Record<string, any> = {};
      if (decompositionData) snapshot.decompositionData = decompositionData;
      if (disruptData) snapshot.disruptData = disruptData;
      if (stressTestData) snapshot.stressTestData = stressTestData;
      if (pitchDeckData) snapshot.pitchDeckData = pitchDeckData;
      if (redesignData) snapshot.redesignData = redesignData;
      if (Object.keys(snapshot).length > 0) {
        console.log(`[ModeSwitch] Snapshotting ${Object.keys(snapshot).length} artifacts from ${currentMode} mode`);
        pendingModeSnapshotRef.current = { key: snapshotKey, data: snapshot };
      }
    }
    activeModeRef.current = m;
    setActiveModeState(m);
    markStepOutdated("redesign");
    markStepOutdated("stressTest");
    markStepOutdated("pitchDeck");
  }, [markStepOutdated, decompositionData, disruptData, stressTestData, pitchDeckData, redesignData]);

  const diagnosticContext = useMemo((): DiagnosticContext =>
    buildDiagnosticContext(activeMode, extractLensConfig(activeLens as unknown as Record<string, unknown> | null)),
  [activeMode, activeLens]);

  // ── Additional State ──
  const [geoData, setGeoData] = useState<unknown>(null);
  const [regulatoryData, setRegulatoryData] = useState<unknown>(null);
  const [scoutedCompetitors, setScoutedCompetitors] = useState<unknown[]>([]);
  const [rejectedIdeasPersisted, setRejectedIdeasPersisted] = useState<string[]>([]);
  const [conceptVariantsForStressTest, setConceptVariantsForStressTest] = useState<ConceptVariantSummary[]>([]);
  const [instantInsights, setInstantInsights] = useState<InstantInsights | null>(null);
  const [modeRouting, setModeRouting] = useState<RoutingResult | null>(null);
  const [adaptiveContext, setAdaptiveContextState] = useState<AdaptiveContextData | null>(null);
  const pendingAdaptiveCtxSaveRef = useRef<AdaptiveContextData | null | undefined>(undefined);
  const setAdaptiveContext = useCallback((ctx: AdaptiveContextData | null) => {
    setAdaptiveContextState(ctx);
  }, []);

  const fetchGeoData = useCallback(async (category: string, productName?: string, geography?: string) => {
    try {
      console.log("[GeoData] Fetching for category:", category, geography ? `| territory: ${geography}` : "");
      const { data: result, error } = await supabase.functions.invoke("geo-market-data", {
        body: { category, productName, geography },
      });
      if (error || !result?.success) {
        console.warn("[GeoData] Fetch failed:", result?.error || error?.message);
        return;
      }
      setGeoData(result.geoData);
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

  // ── Shared hydration setters ──
  const hydrationSetters: HydrationSetters = useMemo(() => ({
    setAnalysisId, setProducts, setSelectedProduct, setAnalysisParams,
    setMainTab, setActiveMode, setStep, setDetailTab, setLoadedFromSaved,
    setDecompositionData, setDisruptData, setStressTestData, setPitchDeckData, setRedesignData, setConceptsData,
    setGovernedData, setBusinessAnalysisData, setBusinessModelInput,
    setBusinessStressTestData,
    setActiveBranchIdState, setStrategicProfileState,
    setUserScores: prefs.setUserScores, setOutdatedSteps,
    setInsightPreferences: prefs.setInsightPreferences,
    setSteeringText: prefs.setSteeringText,
    setPitchDeckImages: prefs.setPitchDeckImages,
    setPitchDeckExclusions: prefs.setPitchDeckExclusions,
    setScoutedCompetitors,
    setAdaptiveContext: setAdaptiveContextState, setGeoData, setRegulatoryData,
    setActiveLensState,
    setRejectedIdeasPersisted,
  }), []);

  // ── Save Analysis ──
  const saveAnalysis = useCallback(async (liveProducts: Product[], params: { category: string; era: string; batchSize: number }, customProductName?: string) => {
    try {
      const avgScore = liveProducts.reduce((acc, p) => acc + p.revivalScore, 0) / liveProducts.length;
      const baseName = customProductName?.trim() || liveProducts[0]?.name || "Analysis";

      let title = baseName;
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

    let finalTitle = title;
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

  // ── Save Step Data (persistence engine) ──
  const saveStepData = useCallback(async (stepKey: string, data: unknown, targetAnalysisId?: string) => {
    const resolvedAnalysisId = targetAnalysisId || analysisId;
    if (!resolvedAnalysisId) return;

    const capturedId = resolvedAnalysisId;

    const { validateStepData, logStepExecution } = await import("@/utils/pipelineValidation");
    const validation = validateStepData(stepKey, data);
    logStepExecution(stepKey, "save", { analysisId: capturedId, valid: validation.valid });

    if (!validation.valid) {
      console.error("[Pipeline] Validation failed for step:", stepKey, validation.errors);
      return;
    }

    const { validateBeforePersistence, enforceDependencyIntegrity } = await import("@/utils/checkpointGate");
    const governedCheck = validateBeforePersistence(stepKey, data);
    if (!governedCheck.allowed) {
      console.error(`[Governed] PERSISTENCE BLOCKED for "${stepKey}": ${governedCheck.reason}`);
      toast.error(`Checkpoint gate blocked: ${governedCheck.reason}`);
      return;
    }

    if (governedCheck.invalidatedSteps.length > 0) {
      console.log(`[Governed] Invalidating downstream steps: ${governedCheck.invalidatedSteps.join(", ")}`);
      for (const depStep of governedCheck.invalidatedSteps) {
        markStepOutdated(depStep);
      }
    }

    if (!targetAnalysisId && analysisId !== capturedId) {
      console.warn(`[saveStepData] Context switched during save (${capturedId} → ${analysisId}). Aborting.`);
      return;
    }

    try {
      const { extractGovernedArtifacts, mergeGovernedIntoAnalysisData, checkRetroactiveInvalidation, applyRetroactiveInvalidation } = await import("@/lib/governedPersistence");
      const extraction = extractGovernedArtifacts(stepKey, data);
      const hasGovernedWork = extraction.hasGoverned && extraction.valid;
      const depIntegrity = enforceDependencyIntegrity(stepKey, data, {});
      const needsComplexMerge = hasGovernedWork || depIntegrity.purgeSteps.length > 0;

      if (!needsComplexMerge) {
        try {
          const { error: rpcError } = await (supabase.rpc as any)("merge_analysis_step", {
            p_analysis_id: capturedId,
            p_step_key: stepKey,
            p_step_payload: data,
          });
          if (rpcError) {
            console.error("Atomic merge_analysis_step failed:", rpcError);
          } else {
            logStepExecution(stepKey, "save", { analysisId: capturedId, success: true, atomic: true });
            return;
          }
        } catch (rpcErr) {
          console.warn("[saveStepData] Atomic RPC failed, falling back to legacy merge:", rpcErr);
        }
      }

      // Legacy complex path: read-merge-write for governed artifacts
      const { data: existing } = await (supabase.from("saved_analyses") as any)
        .select("analysis_data")
        .eq("id", capturedId)
        .single();

      if (!targetAnalysisId && analysisId !== capturedId) {
        console.warn(`[saveStepData] Context switched during DB read. Aborting.`);
        return;
      }

      const prev = (existing?.analysis_data as Record<string, unknown>) || {};

      const previousSnapshot = (prev.previousSnapshot as Record<string, unknown>) || {};
      if (prev[stepKey] && JSON.stringify(prev[stepKey]) !== JSON.stringify(data)) {
        previousSnapshot[stepKey] = prev[stepKey];
      }

      const governedHashes = (prev.governedHashes as Record<string, string>) || {};
      const depIntegrityFull = enforceDependencyIntegrity(stepKey, data, governedHashes);
      governedHashes[stepKey] = depIntegrityFull.newHash;

      const { buildEvidenceRegistry } = await import("@/lib/evidenceRegistry");
      const { applyLensAdaptation } = await import("@/lib/lensAdaptationEngine");
      
      const MAX_SNAPSHOT_KEYS = 6;
      const snapshotKeys = Object.keys(previousSnapshot);
      if (snapshotKeys.length > MAX_SNAPSHOT_KEYS) {
        for (const oldKey of snapshotKeys.slice(0, snapshotKeys.length - MAX_SNAPSHOT_KEYS)) {
          delete previousSnapshot[oldKey];
        }
      }

      let merged: Record<string, unknown> = { ...prev, [stepKey]: data, previousSnapshot, governedHashes };
      
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

      // Size guard
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

      if (!targetAnalysisId && analysisId !== capturedId) {
        console.warn(`[saveStepData] Context switched before final write. Aborting.`);
        return;
      }

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

  // ── Steering Text save (declared after saveStepData) ──
  // When steering text changes, mark upstream pipeline steps as outdated
  // so only affected steps rerun on next page visit (delta rerun strategy).
  const saveSteeringText = useCallback((text: string) => {
    const prev = prefs.steeringText;
    prefs.setSteeringText(text);
    setAdaptiveContextState(prevCtx => prevCtx ? { ...prevCtx, userGuidance: text || undefined } : null);
    if (analysisId) {
      saveStepData("steeringText", text);
    }
    // Delta rerun: if steering actually changed and we have existing pipeline data, mark upstream steps outdated
    if (text !== prev && (decompositionData || disruptData)) {
      console.log("[Steering] Text changed — marking decompose/synthesis/concepts as outdated for delta rerun");
      markStepOutdated("decompose");
      markStepOutdated("synthesis");
      markStepOutdated("concepts");
    }
  }, [analysisId, saveStepData, prefs, decompositionData, disruptData, markStepOutdated]);

  // ── Auto-persist effects (extracted) ──
  useAutoPersistEffects({
    analysisId, saveStepData,
    userScores: prefs.userScores, pendingScoreSaveRef: prefs.pendingScoreSaveRef,
    outdatedSteps,
    insightPreferences: prefs.insightPreferences, pendingPrefSaveRef: prefs.pendingPrefSaveRef,
    pitchDeckImages: prefs.pitchDeckImages, pendingPitchImagesSaveRef: prefs.pendingPitchImagesSaveRef,
    pitchDeckExclusions: prefs.pitchDeckExclusions, pendingExclusionsSaveRef: prefs.pendingExclusionsSaveRef,
    activeLens, pendingLensSaveRef,
    activeBranchId: activeBranchId, pendingBranchSaveRef,
    strategicProfile, pendingProfileSaveRef,
    adaptiveContext, pendingAdaptiveCtxSaveRef,
  });

  // ── Pipeline: handleAnalyze ──
  const handleAnalyze = useCallback(async (params: {
    category: string; era: string; batchSize: number;
    customProducts?: { imageDataUrl?: string; productUrl?: string; productName?: string; notes?: string }[];
    territory?: string;
  }) => {
    if (!canAnalyze()) {
      toast.error("You've reached your analysis limit. Upgrade your plan to continue.");
      return;
    }

    if (!user?.id) {
      toast.error("Please sign in to run an analysis.");
      return;
    }

    const { customProducts, territory, ...baseParams } = params;
    setAnalysisParams(baseParams);
    setStep("scraping");
    setErrorMsg("");

    clearAllState(hydrationSetters);
    startLoadingTimer();

    const hasCustom = customProducts && customProducts.length > 0;

    const isServiceMode = params.category === "Service";
    const isBusinessMode = mainTab === "business" || activeMode === "business";
    const analysisType = isBusinessMode ? "business_model" : isServiceMode ? "service" : "product";
    const customName = customProducts?.find(cp => cp.productName)?.productName;
    const prelimTitle = customName || `${params.category} Analysis`;
    let dbId: string;
    try {
      dbId = await createAnalysis(prelimTitle, analysisType, {
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

    navigate(`/analysis/${dbId}/command-deck`);

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
        180_000,
      );
      if (scrapeError || !scrapeData?.success) {
        throw new Error(scrapeData?.error || scrapeError?.message || "Scraping failed");
      }

      if (scrapeData.stats) {
        pushLog(`Collected data from ${scrapeData.stats.totalPages} pages, ${scrapeData.stats.communityPosts} community posts, ${scrapeData.stats.complaintSignals} complaint signals`);
      } else {
        pushLog(`Web scraping complete — data collected from ${(scrapeData.sources || []).length} sources`);
      }

      // Early instant insights from scrape metadata
      try {
        const earlyProduct: any = {
          name: customProducts?.find(cp => cp.productName)?.productName || params.category,
          category: params.category,
          description: customProducts?.find(cp => cp.notes)?.notes || "",
          communityInsights: scrapeData.stats ? {
            topComplaints: [],
            communitySentiment: scrapeData.stats.complaintSignals > 3 ? "frustrated" : "neutral",
          } : undefined,
        };
        const earlyInsights = computeInstantInsights(earlyProduct, diagnosticContext);
        if (earlyInsights) {
          setInstantInsights(earlyInsights);
          console.log(`[InstantInsights] Early pre-compute during scraping: ${earlyInsights.assumptions.length} assumptions`);
        }
      } catch (e) {
        console.warn("[InstantInsights] Early pre-computation failed (non-blocking):", e);
      }

      setStep("analyzing");
      setStepMessage(isServiceMode
        ? "Building deep intelligence: pricing, customer journey, competitive landscape & reinvention ideas…"
        : "Building deep intelligence: pricing, supply chain, trends, flip ideas & action plans…"
      );

      await new Promise(r => setTimeout(r, 400));
      pushLog(isServiceMode ? "Parsing service data & customer sentiment..." : "Parsing product data & community sentiment...");
      await new Promise(r => setTimeout(r, 800));
      pushLog("Building pricing intelligence from real market data...");
      await new Promise(r => setTimeout(r, 800));
      pushLog(isServiceMode ? "Mapping customer journey friction & operational bottlenecks..." : "Mapping supply chain: suppliers, manufacturers, distributors...");
      await new Promise(r => setTimeout(r, 800));
      pushLog("Generating flipped ideas from community pain points...");
      await new Promise(r => setTimeout(r, 800));
      pushLog("Scoring potential & building action plans...");
      await new Promise(r => setTimeout(r, 800));
      pushLog(isServiceMode ? "Analyzing competitive landscape & differentiation opportunities..." : "Searching for real product images across data sources...");

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
        180_000,
      );

      if (analyzeError || !analyzeData?.success) {
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

      const productNameForGeo = customProducts?.find(cp => cp.productName)?.productName || liveProducts[0]?.name;
      fetchGeoData(params.category, productNameForGeo, territory).then(() => {
        console.log("[Pipeline] Geo market data + regulatory intel fetched for", params.category);
      }).catch(() => {});

      setProducts(liveProducts);
      setSelectedProduct(liveProducts[0]);
      setDetailTab("overview");
      setStep("done");

      try {
        const instant = computeInstantInsights(liveProducts[0], diagnosticContext);
        if (instant) {
          setInstantInsights(instant);
          console.log(`[InstantInsights] Pre-computed: ${instant.assumptions.length} assumptions, ${instant.leveragePoints.length} leverage points, ${instant.constraints.length} constraints`);
        }
      } catch (e) {
        console.warn("[InstantInsights] Pre-computation failed (non-blocking):", e);
      }
      setTimeout(() => {
        toast.success(`Found ${liveProducts.length} ${isServiceMode ? "service analyses" : "products"} with deep intelligence reports!`);
      }, 100);

      try {
        await supabase.rpc("increment_usage", { p_user_id: user?.id });
        await checkSubscription();
        await (supabase.rpc as any)("upsert_user_streak", { p_user_id: user?.id });
        const { data: usage } = await (supabase.from("user_usage") as any).select("analysis_count").eq("user_id", user?.id).single();
        const count = usage?.analysis_count || 0;
        if (count === 5) setTimeout(() => toast("🏆 Milestone: 5 analyses completed!", { description: "You're building real market intelligence." }), 200);
        else if (count === 10) setTimeout(() => toast("🔥 Milestone: 10 analyses!", { description: "You're a power user now." }), 200);
        else if (count === 25) setTimeout(() => toast("⭐ Milestone: 25 analyses!", { description: "Elite-level market intelligence." }), 200);
      } catch (_) { /* best effort */ }
      const finalCustomName = customProducts?.find(cp => cp.productName)?.productName;
      await saveAnalysis(liveProducts, baseParams, finalCustomName);

      if (adaptiveContext) {
        pendingAdaptiveCtxSaveRef.current = adaptiveContext;
        if (adaptiveContext.biExtraction) {
          saveStepData("biExtraction", adaptiveContext.biExtraction, dbId).catch(() => {});
        }
        saveStepData("adaptiveContext", adaptiveContext, dbId).catch(() => {});
      }

      // Background patent analysis
      const primaryProduct = liveProducts[0];
      if (primaryProduct && !isServiceMode) {
        const industryContext: Record<string, unknown> = {};
        const pp = primaryProduct as any;
        if (pp.category) industryContext.industry = pp.category;
        if (pp.description) industryContext.businessDescription = pp.description;
        if (pp.supplyChain) {
          const sc = pp.supplyChain;
          const productsList: string[] = [];
          const processes: string[] = [];
          const materials: string[] = [];
          if (sc.manufacturers?.length) materials.push(...sc.manufacturers.map((m: any) => m.name || m).slice(0, 3));
          if (sc.distributors?.length) processes.push("distribution");
          if (pp.name) productsList.push(pp.name);
          if (productsList.length) industryContext.products = productsList;
          if (processes.length) industryContext.processes = processes;
          if (materials.length) industryContext.materials = materials;
        }
        invokeWithTimeout("patent-analysis", {
          body: {
            productName: primaryProduct.name,
            category: params.category,
            era: params.era,
            industryContext: Object.keys(industryContext).length > 0 ? industryContext : undefined,
          },
        }, 90_000).then(({ data: patentResult, error: patentErr }) => {
          if (!patentErr && patentResult?.success && patentResult.patentData) {
            const enriched = { ...primaryProduct, patentData: patentResult.patentData } as Product;
            setProducts(prev => prev.map(p => p.name === primaryProduct.name ? enriched : p));
            setSelectedProduct(prev => prev?.name === primaryProduct.name ? enriched : prev);
            saveStepData("products", liveProducts.map(p => p.name === primaryProduct.name ? enriched : p)).catch(() => {});
            console.log("[Pipeline] Patent intelligence auto-loaded for", primaryProduct.name);
          }
        }).catch(() => {});
      }

      // Fire webhooks
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

      navigate(`/analysis/${dbId}/command-deck`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Analysis pipeline error:", msg);
      setErrorMsg(msg);
      setStep("error");
      stopLoadingTimer();
      toast.error("Analysis failed — tap Retry to try again");
    }
  }, [canAnalyze, startLoadingTimer, stopLoadingTimer, pushLog, user?.id, checkSubscription, saveAnalysis, navigate, analysisId, adaptiveContext]);

  const retryAnalysis = useCallback(() => {
    if (!analysisParams) return;
    handleAnalyze(analysisParams);
  }, [analysisParams, handleAnalyze]);

  // ── Regenerate Ideas ──
  const handleRegenerateIdeas = useCallback(async (product: Product, userContext?: string, rejectedIdeas?: string[]) => {
    if (!analysisParams) return;
    setGeneratingIdeasFor(product.id);

    try {
      const baseContext = `Focus on ${analysisParams.category} market trends.`;
      const fullContext = userContext ? `${baseContext}\n\nUser's additional guidance: ${userContext}` : baseContext;
      let activeBranch: unknown = undefined;
      if (activeBranchId && governedData) {
        const { getBranchPayload } = await import("@/lib/branchContext");
        activeBranch = getBranchPayload(governedData, activeBranchId, strategicProfile);
      }
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
      let disruptCtx: Record<string, unknown> | undefined;
      if (disruptData) {
        const dd = disruptData as Record<string, unknown>;
        disruptCtx = {
          hiddenAssumptions: dd.hiddenAssumptions || null,
          flippedLogic: dd.flippedLogic || null,
        };
      }
      let governedReasoningContext: Record<string, unknown> | undefined;
      if (governedData) {
        const gov = governedData as Record<string, unknown>;
        const cm = gov.constraint_map as Record<string, unknown> | undefined;
        governedReasoningContext = {
          binding_constraint: cm?.binding_constraint || cm?.primary_constraint || null,
          dominant_mechanism: cm?.dominant_mechanism || null,
          constraint_map_summary: cm ? {
            friction_tiers: (cm.friction_tiers as unknown[])?.slice(0, 5) || [],
            dominance_proof: cm.dominance_proof || null,
          } : null,
          transformation_clusters: gov.transformation_clusters
            ? (gov.transformation_clusters as unknown[]).slice(0, 5).map((tc: any) => ({
                cluster_name: tc.cluster_name || tc.name,
                theme: tc.theme || tc.description,
                transformations: (tc.transformations || []).slice(0, 3).map((t: any) => t.title || t.name),
              }))
            : null,
          reasoning_synopsis: typeof gov.reasoning_synopsis === 'string'
            ? gov.reasoning_synopsis.slice(0, 500)
            : null,
        };
      }
      if (decompositionData) {
        const decomp = decompositionData as Record<string, unknown>;
        const leverage = decomp.leverageAnalysis as Record<string, unknown> | undefined;
        if (leverage?.leveragePrimitives) {
          if (!governedReasoningContext) governedReasoningContext = {};
          governedReasoningContext.leverage_primitives = (leverage.leveragePrimitives as any[]).slice(0, 5).map((lp: any) => ({
            primitiveId: lp.primitiveId || lp.id,
            primitiveLabel: lp.primitiveLabel || lp.label,
            bindingStrength: lp.bindingStrength,
            cascadeReach: lp.cascadeReach,
            challengeability: lp.challengeability,
            leverageScore: lp.leverageScore,
            bestTransformation: lp.bestTransformation,
            reasoning: typeof lp.reasoning === 'string' ? lp.reasoning.slice(0, 200) : undefined,
          }));
        }
      }

      const { data, error } = await supabase.functions.invoke("generate-flip-ideas", {
        body: {
          product,
          additionalContext: fullContext,
          insightPreferences: Object.keys(prefs.insightPreferences).length > 0 ? prefs.insightPreferences : undefined,
          steeringText: prefs.steeringText || undefined,
          activeBranch,
          adaptiveContext: adaptiveContext || undefined,
          upstreamIntel: Object.keys(upstreamIntel).length > 0 ? upstreamIntel : undefined,
          disruptContext: disruptCtx || undefined,
          rejectedIdeas: rejectedIdeas || undefined,
          governedReasoning: governedReasoningContext || undefined,
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

  // ── Load Saved Analysis ──
  const handleLoadSaved = useCallback(async (rawAnalysis: any) => {
    clearAllState(hydrationSetters);

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

    if (analysis.analysis_type === "business_model") {
      toast.success("Business model analysis loaded!");
      navigate(`/analysis/${analysis.id}/command-deck`);
    } else if (analysis.analysis_type === "first_principles") {
      toast.success("Analysis loaded — opening Command Deck");
      navigate(`/analysis/${analysis.id}/command-deck`);
    } else {
      if (sanitizedProducts.length === 0) {
        toast.error("This analysis has no product data to display.");
        return;
      }
      toast.success("Analysis loaded — opening Command Deck");
      navigate(`/analysis/${analysis.id}/command-deck`);
    }
  }, [navigate, hydrationSetters]);

  // ── Auto-hydration from URL ──
  const autoHydratedIdRef = useRef<string | null>(null);

  useEffect(() => {
    const match = window.location.pathname.match(/(?:\/analysis|\/business)\/([0-9a-f-]{36})/);
    if (!match) return;
    const urlAnalysisId = match[1];
    if (!urlAnalysisId || !user?.id) return;

    if (autoHydratedIdRef.current === urlAnalysisId) return;
    if (analysisId === urlAnalysisId && step === "done" && (products.length > 0 || !!businessAnalysisData)) {
      autoHydratedIdRef.current = urlAnalysisId;
      return;
    }
    if (step === "scraping" || step === "analyzing") return;

    autoHydratedIdRef.current = urlAnalysisId;
    setIsHydrating(true);
    console.log("[AutoHydrate] Loading analysis from URL:", urlAnalysisId);

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

        if (data.user_id !== user.id) {
          console.warn("[AutoHydrate] User does not own this analysis");
          return;
        }

        const testProducts = sanitizeProducts(data.products, data);
        if (testProducts.length === 0 && data.analysis_type !== "business_model") {
          console.warn("[AutoHydrate] Analysis has no products");
          return;
        }

        hydrateFromRow(data, hydrationSetters);

        // Auto-repair mismatched analysis_type
        const ad = data.analysis_data as Record<string, unknown> | null;
        const hasBusinessData = !!ad?.businessAnalysis || data.analysis_type === "business_model";
        if (hasBusinessData && data.analysis_type !== "business_model") {
          console.warn("[AutoRepair] Fixing analysis_type from", data.analysis_type, "to business_model");
          (supabase.from("saved_analyses") as any)
            .update({ analysis_type: "business_model", updated_at: new Date().toISOString() })
            .eq("id", urlAnalysisId)
            .then(() => {
              hydrationSetters.setMainTab("business");
              hydrationSetters.setActiveMode("business");
            });
        }

        // Auto-repair: detect missing strategicEngine when step data exists
        const hasStepData = !!ad?.disrupt || !!ad?.stressTest || !!ad?.pitchDeck || !!ad?.businessAnalysis;
        const hasEngine = !!ad?.strategicEngine;
        if (hasStepData && !hasEngine) {
          console.warn("[AutoRepair] Step data exists but strategicEngine missing — will recompute on next auto-analysis cycle");
        }

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
      mainTab, setMainTab, activeMode, setActiveMode, diagnosticContext,
      elapsedSeconds, loadingLog, stepMessage,
      detailTab, setDetailTab, visitedDetailTabs, setVisitedDetailTabs,
      decompositionData, setDecompositionData,
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
      handleAnalyze, retryAnalysis, handleRegenerateIdeas, handleManualSave, handleLoadSaved, saveAnalysis, createAnalysis, saveStepData,
      analysisId, setAnalysisId,
      outdatedSteps, markStepOutdated, clearStepOutdated,
      userScores: prefs.userScores, setUserScore: prefs.setUserScore,
      redesignData, setRedesignData,
      conceptsData, setConceptsData,
      insightPreferences: prefs.insightPreferences, setInsightPreference: prefs.setInsightPreference,
      getLikedInsights: prefs.getLikedInsights, getDismissedInsights: prefs.getDismissedInsights,
      steeringText: prefs.steeringText, setSteeringText: prefs.setSteeringText, saveSteeringText,
      pitchDeckImages: prefs.pitchDeckImages, setPitchDeckImage: prefs.setPitchDeckImage, removePitchDeckImage: prefs.removePitchDeckImage,
      pitchDeckExclusions: prefs.pitchDeckExclusions, togglePitchDeckExclusion: prefs.togglePitchDeckExclusion,
      activeLens, setActiveLens,
      geoData, setGeoData, fetchGeoData,
      regulatoryData, setRegulatoryData,
      scoutedCompetitors, setScoutedCompetitors,
      rejectedIdeasPersisted,
      conceptVariantsForStressTest, setConceptVariantsForStressTest,
      modeRouting, setModeRouting,
      adaptiveContext, setAdaptiveContext,
      governedData, setGovernedData,
      activeBranchId, setActiveBranchId,
      strategicProfile, setStrategicProfile,
      isHydrating,
      instantInsights, setInstantInsights,
    }}>
      {children}
    </AnalysisContext.Provider>
  );
}
