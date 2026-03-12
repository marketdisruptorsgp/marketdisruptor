/**
 * Shared hydration helper — single source of truth for restoring
 * all AnalysisContext state from a saved_analyses DB row.
 *
 * Used by both handleLoadSaved and auto-hydration to prevent
 * logic duplication and ensure consistency.
 */

import { normalizeProductFields, isServiceCategory } from "@/utils/normalizeProduct";
import type { StrategicProfile } from "@/lib/strategicOS";
import type { AdaptiveContextData } from "./AnalysisContext";
import type { BusinessModelAnalysisData } from "@/components/BusinessModelAnalysis";
import type { BusinessModelInput } from "./AnalysisContext";
import { extractionToContext, type BIExtraction } from "@/hooks/useBIExtraction";

export interface HydrationSetters {
  setAnalysisId: (id: string | null) => void;
  setProducts: (p: any[]) => void;
  setSelectedProduct: (p: any | null) => void;
  setAnalysisParams: (p: { category: string; era: string; batchSize: number } | null) => void;
  setMainTab: (t: "custom" | "service" | "business") => void;
  setActiveMode: (m: any) => void;
  setStep: (s: any) => void;
  setDetailTab: (t: string) => void;
  setLoadedFromSaved: (b: boolean) => void;

  // Step data
  setDecompositionData: (d: unknown) => void;
  setDisruptData: (d: unknown) => void;
  setStressTestData: (d: unknown) => void;
  setPitchDeckData: (d: unknown) => void;
  setRedesignData: (d: unknown) => void;
  setConceptsData: (d: unknown) => void;
  setGovernedData: (d: Record<string, unknown> | null) => void;
  setBusinessAnalysisData: (d: BusinessModelAnalysisData | null) => void;
  setBusinessModelInput: (i: BusinessModelInput | null) => void;
  setBusinessStressTestData: (d: unknown) => void;
  setActiveBranchIdState: (id: string | null) => void;
  setStrategicProfileState: (p: StrategicProfile) => void;
  setUserScores: (s: Record<string, Record<string, number>>) => void;
  setOutdatedSteps: (s: Set<string>) => void;
  setInsightPreferences: (p: Record<string, "liked" | "dismissed" | "neutral">) => void;
  setSteeringText: (t: string) => void;
  setPitchDeckImages: (imgs: { url: string; ideaName: string }[]) => void;
  setPitchDeckExclusions: (s: Set<string>) => void;
  setScoutedCompetitors: (d: unknown[]) => void;
  setAdaptiveContext: (ctx: AdaptiveContextData | null) => void;
  setGeoData: (d: unknown) => void;
  setRegulatoryData: (d: unknown) => void;
  setActiveLensState: (l: any | null) => void;
  setRejectedIdeasPersisted: (r: string[]) => void;
}

/**
 * Clear ALL context state to prevent cross-analysis contamination.
 * Must be called BEFORE populating with new data.
 */
export function clearAllState(setters: HydrationSetters) {
  setters.setDecompositionData(null);
  setters.setDisruptData(null);
  setters.setStressTestData(null);
  setters.setPitchDeckData(null);
  setters.setRedesignData(null);
  setters.setConceptsData(null);
  setters.setGovernedData(null);
  setters.setBusinessAnalysisData(null);
  setters.setBusinessStressTestData(null);
  setters.setActiveBranchIdState(null);
  setters.setUserScores({});
  setters.setOutdatedSteps(new Set());
  setters.setInsightPreferences({});
  setters.setSteeringText("");
  setters.setPitchDeckImages([]);
  setters.setPitchDeckExclusions(new Set());
  setters.setScoutedCompetitors([]);
  setters.setAdaptiveContext(null);
  setters.setGeoData(null);
  setters.setRegulatoryData(null);

  // Clear intelligence cache to prevent stale data
  import("@/lib/systemIntelligence").then(({ clearIntelligenceCache }) => {
    clearIntelligenceCache();
  }).catch(() => { /* non-critical */ });
}

/**
 * Repair double-serialized values in analysis_data.
 * A bug in saveStepData was JSON.stringify-ing data before passing to the RPC,
 * causing values like strategicEngine/insightGraph to be stored as JSON strings
 * instead of objects. This function detects and parses them back.
 */
function repairDoubleSerialized(ad: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!ad) return null;
  const repaired = { ...ad };
  const keysToCheck = ["strategicEngine", "insightGraph", "disrupt", "stressTest", "pitchDeck",
    "redesign", "decomposition", "businessStressTest", "businessPitchDeck", "governed", "biExtraction",
    "adaptiveContext", "geoOpportunity", "regulatoryContext", "competitiveIntel"];
  for (const key of keysToCheck) {
    const val = repaired[key];
    if (typeof val === "string" && val.startsWith("{")) {
      try {
        repaired[key] = JSON.parse(val);
      } catch { /* leave as-is */ }
    }
  }
  return repaired;
}

/**
 * Sanitize raw products from DB into safe Product[] with all required fields.
 */
export function sanitizeProducts(rawProducts: any[], analysisRow: any): any[] {
  const products = Array.isArray(rawProducts) ? rawProducts : [];
  return products.map((p: any, idx: number) => {
    const base = {
      id: p.id || `product-${analysisRow.id}-${idx}`,
      name: p.name || "Untitled Product",
      category: p.category || analysisRow.category || "",
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
}

/**
 * Populate all AnalysisContext state from a saved_analyses DB row.
 * Single source of truth for hydration — used by handleLoadSaved and auto-hydration.
 */
export function hydrateFromRow(analysisRow: any, setters: HydrationSetters) {
  const sanitizedProducts = sanitizeProducts(analysisRow.products, analysisRow);
  // Defensive: parse any double-serialized (stringified JSON) values in analysis_data
  const ad = repairDoubleSerialized(analysisRow.analysis_data as Record<string, unknown> | null);

  // Set core metadata — analysisId FIRST to ensure saveStepData targets the right row
  setters.setAnalysisId(analysisRow.id);
  setters.setLoadedFromSaved(true);
  setters.setProducts(sanitizedProducts);
  setters.setSelectedProduct(sanitizedProducts[0] || null);
  setters.setAnalysisParams({
    category: analysisRow.category,
    era: analysisRow.era || "All Eras / Current",
    batchSize: analysisRow.batch_size ?? analysisRow.batchSize ?? 5,
  });

  const isService = analysisRow.analysis_type === "service" || isServiceCategory(analysisRow.category || "");
  setters.setMainTab(isService ? "service" : analysisRow.analysis_type === "business_model" ? "business" : "custom");
  setters.setActiveMode(isService ? "service" : analysisRow.analysis_type === "business_model" ? "business" : "custom");
  setters.setDetailTab("overview");
  setters.setStep("done");

  // Restore persisted step data — explicit null fallbacks to clear stale state
  setters.setGovernedData(ad?.governed ? (ad.governed as Record<string, unknown>) : null);
  setters.setActiveBranchIdState(ad?.activeBranchId ? (ad.activeBranchId as string) : null);
  if (ad?.strategicProfile) setters.setStrategicProfileState(ad.strategicProfile as StrategicProfile);
  setters.setDecompositionData(ad?.decomposition || null);
  setters.setDisruptData(ad?.disrupt || null);
  setters.setStressTestData(ad?.stressTest || null);
  setters.setPitchDeckData(ad?.pitchDeck || null);
  setters.setBusinessStressTestData(ad?.businessStressTest || null);
  setters.setRedesignData(ad?.redesign || null);
  setters.setConceptsData(ad?.concepts || null);
  setters.setGeoData(ad?.geoOpportunity || null);
  setters.setRegulatoryData(ad?.regulatoryContext || null);
  setters.setUserScores(ad?.userScores ? (ad.userScores as Record<string, Record<string, number>>) : {});
  setters.setInsightPreferences(ad?.insightPreferences ? (ad.insightPreferences as Record<string, "liked" | "dismissed" | "neutral">) : {});
  setters.setSteeringText(ad?.steeringText ? (ad.steeringText as string) : "");
  // Reconstruct adaptive context: if adaptiveContext is null but biExtraction exists at top level,
  // rebuild a minimal adaptiveContext so all components/pipeline steps can access document intelligence
  let hydratedAdaptiveCtx: AdaptiveContextData | null = ad?.adaptiveContext
    ? (ad.adaptiveContext as AdaptiveContextData)
    : null;
  if (!hydratedAdaptiveCtx && ad?.biExtraction) {
    const bi = ad.biExtraction as Record<string, unknown>;
    const biz = bi?.business_overview as Record<string, string> | undefined;
    // Reconstruct flattened context string from raw extraction
    let contextStr = "";
    try {
      contextStr = extractionToContext(bi as unknown as BIExtraction);
    } catch { /* non-critical — components can work without it */ }
    hydratedAdaptiveCtx = {
      problemStatement: biz?.company_name
        ? `Analysis of ${biz.company_name}: ${biz.primary_offering || ""}`
        : "Business analysis",
      biExtraction: bi,
      extractedContext: contextStr,
    };
  }
  // Ensure biExtraction from top-level is injected into adaptiveContext if missing
  if (hydratedAdaptiveCtx && !hydratedAdaptiveCtx.biExtraction && ad?.biExtraction) {
    hydratedAdaptiveCtx = { ...hydratedAdaptiveCtx, biExtraction: ad.biExtraction as Record<string, unknown> };
  }
  setters.setAdaptiveContext(hydratedAdaptiveCtx);
  setters.setPitchDeckImages(ad?.pitchDeckImages ? (ad.pitchDeckImages as { url: string; ideaName: string }[]) : []);
  setters.setPitchDeckExclusions(
    ad?.pitchDeckExclusions && Array.isArray(ad.pitchDeckExclusions)
      ? new Set(ad.pitchDeckExclusions as string[])
      : new Set()
  );
  setters.setScoutedCompetitors(
    ad?.scoutedCompetitors && Array.isArray(ad.scoutedCompetitors)
      ? (ad.scoutedCompetitors as unknown[])
      : []
  );
  if (!ad?.activeLensId) setters.setActiveLensState(null);
  setters.setOutdatedSteps(
    ad?.outdatedSteps && Array.isArray(ad.outdatedSteps)
      ? new Set(ad.outdatedSteps as string[])
      : new Set()
  );
  // rejectedIdeas is hydrated directly by FlippedIdeasPanel from analysisData — no setter needed

  // Business model routing
  if (analysisRow.analysis_type === "business_model") {
    // Extract businessAnalysis from nested key; fall back to full blob for legacy records
    const internalKeys = new Set(["governed","activeLensId","outdatedSteps","governedHashes","previousSnapshot","adaptiveContext","disrupt","stressTest","pitchDeck","redesign","businessStressTest","businessPitchDeck","geoOpportunity","regulatoryContext","userScores","insightPreferences","steeringText","pitchDeckImages","pitchDeckExclusions","scoutedCompetitors","activeBranchId","strategicProfile","strategicEngine"]);
    const bizData = ad?.businessAnalysis
      ? (ad.businessAnalysis as BusinessModelAnalysisData)
      : (ad && Object.keys(ad).some(k => !internalKeys.has(k)))
        ? (analysisRow.analysis_data as BusinessModelAnalysisData)
        : null;
    // Always set something for business model analyses to prevent infinite spinner
    setters.setBusinessAnalysisData(bizData || ({ type: analysisRow.title || "Business Model", description: "Loaded from saved analysis" } as unknown as BusinessModelAnalysisData));
    if (ad?.businessPitchDeck) setters.setPitchDeckData(ad.businessPitchDeck);
    const titleParts = (analysisRow.title || "").split(" — ");
    if (titleParts.length > 0) {
      setters.setBusinessModelInput({ type: titleParts[0], description: "" } as BusinessModelInput);
    }
  }

  // Hydrate scenarios from DB (fire-and-forget)
  if (analysisRow.id) {
    import("@/lib/scenarioEngine").then(({ loadScenariosFromDb }) => {
      loadScenariosFromDb(analysisRow.id).catch(() => {});
    });
  }

  return { sanitizedProducts, analysisData: ad };
}
