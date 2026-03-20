/**
 * Auto-persist effects — extracted from AnalysisContext.
 * Watches pending save refs and persists to DB when values change.
 */

import { useEffect, type MutableRefObject } from "react";
import type { UserLens } from "@/components/LensToggle";
import type { StrategicProfile } from "@/lib/strategicOS";
import type { AdaptiveContextData } from "@/contexts/AnalysisContext";

interface AutoPersistDeps {
  analysisId: string | null;
  saveStepData: (key: string, data: unknown, targetId?: string) => Promise<void>;

  // User scores
  userScores: Record<string, Record<string, number>>;
  pendingScoreSaveRef: MutableRefObject<Record<string, Record<string, number>> | null>;

  // Outdated steps
  outdatedSteps: Set<string>;

  // Insight preferences
  insightPreferences: Record<string, "liked" | "dismissed" | "neutral">;
  pendingPrefSaveRef: MutableRefObject<Record<string, "liked" | "dismissed" | "neutral"> | null>;

  // Pitch deck images
  pitchDeckImages: { url: string; ideaName: string }[];
  pendingPitchImagesSaveRef: MutableRefObject<{ url: string; ideaName: string }[] | null>;

  // Pitch deck exclusions
  pitchDeckExclusions: Set<string>;
  pendingExclusionsSaveRef: MutableRefObject<string[] | null>;

  // Lens
  activeLens: UserLens | null;
  pendingLensSaveRef: MutableRefObject<string | null | undefined>;

  // Branch
  activeBranchId: string | null;
  pendingBranchSaveRef: MutableRefObject<string | null | undefined>;

  // Strategic profile
  strategicProfile: StrategicProfile;
  pendingProfileSaveRef: MutableRefObject<StrategicProfile | undefined>;

  // Adaptive context
  adaptiveContext: AdaptiveContextData | null;
  pendingAdaptiveCtxSaveRef: MutableRefObject<AdaptiveContextData | null | undefined>;
}

export function useAutoPersistEffects(deps: AutoPersistDeps) {
  const {
    analysisId, saveStepData,
    userScores, pendingScoreSaveRef,
    outdatedSteps,
    insightPreferences, pendingPrefSaveRef,
    pitchDeckImages, pendingPitchImagesSaveRef,
    pitchDeckExclusions, pendingExclusionsSaveRef,
    activeLens, pendingLensSaveRef,
    activeBranchId, pendingBranchSaveRef,
    strategicProfile, pendingProfileSaveRef,
    adaptiveContext, pendingAdaptiveCtxSaveRef,
  } = deps;

  // Auto-persist userScores
  useEffect(() => {
    if (pendingScoreSaveRef.current && analysisId) {
      const scores = pendingScoreSaveRef.current;
      pendingScoreSaveRef.current = null;
      saveStepData("userScores", scores);
    }
  }, [userScores, analysisId, saveStepData]);

  // Auto-persist outdated steps
  useEffect(() => {
    if (analysisId) {
      saveStepData("outdatedSteps", Array.from(outdatedSteps));
    }
  }, [outdatedSteps, analysisId, saveStepData]);

  // Auto-persist insight preferences
  useEffect(() => {
    if (pendingPrefSaveRef.current && analysisId) {
      const prefs = pendingPrefSaveRef.current;
      pendingPrefSaveRef.current = null;
      saveStepData("insightPreferences", prefs);
    }
  }, [insightPreferences, analysisId, saveStepData]);

  // Auto-persist pitch deck images
  useEffect(() => {
    if (pendingPitchImagesSaveRef.current && analysisId) {
      const imgs = pendingPitchImagesSaveRef.current;
      pendingPitchImagesSaveRef.current = null;
      saveStepData("pitchDeckImages", imgs);
    }
  }, [pitchDeckImages, analysisId, saveStepData]);

  // Auto-persist pitch deck exclusions
  useEffect(() => {
    if (pendingExclusionsSaveRef.current && analysisId) {
      const excl = pendingExclusionsSaveRef.current;
      pendingExclusionsSaveRef.current = null;
      saveStepData("pitchDeckExclusions", excl);
    }
  }, [pitchDeckExclusions, analysisId, saveStepData]);

  // Auto-persist active lens ID
  useEffect(() => {
    if (pendingLensSaveRef.current !== undefined && analysisId) {
      const lensId = pendingLensSaveRef.current;
      pendingLensSaveRef.current = undefined;
      saveStepData("activeLensId", lensId);
    }
  }, [activeLens, analysisId, saveStepData]);

  // Auto-persist active branch ID
  useEffect(() => {
    if (pendingBranchSaveRef.current !== undefined && analysisId) {
      const branchId = pendingBranchSaveRef.current;
      pendingBranchSaveRef.current = undefined;
      saveStepData("activeBranchId", branchId);
    }
  }, [activeBranchId, analysisId, saveStepData]);

  // Auto-persist strategic profile
  useEffect(() => {
    if (pendingProfileSaveRef.current !== undefined && analysisId) {
      const prof = pendingProfileSaveRef.current;
      pendingProfileSaveRef.current = undefined;
      saveStepData("strategicProfile", prof);
    }
  }, [strategicProfile, analysisId, saveStepData]);

  // Auto-persist adaptive context
  useEffect(() => {
    if (pendingAdaptiveCtxSaveRef.current !== undefined && analysisId) {
      const ctx = pendingAdaptiveCtxSaveRef.current;
      pendingAdaptiveCtxSaveRef.current = undefined;
      if (ctx) saveStepData("adaptiveContext", ctx);
    }
  }, [adaptiveContext, analysisId, saveStepData]);
}
