/**
 * User preference state management — extracted from AnalysisContext.
 * Handles scores, insight preferences, steering text, pitch deck images/exclusions.
 */

import { useState, useCallback, useRef } from "react";

export function useUserPreferences(
  markStepOutdated: (step: string) => void,
) {
  // ── User Score Overrides ──
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
    markStepOutdated("redesign");
    markStepOutdated("stressTest");
    markStepOutdated("pitchDeck");
  }, [markStepOutdated]);

  // ── Insight Preferences ──
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

  // ── Pitch Deck Images ──
  const [pitchDeckImages, setPitchDeckImages] = useState<{ url: string; ideaName: string }[]>([]);
  const pendingPitchImagesSaveRef = useRef<{ url: string; ideaName: string }[] | null>(null);
  const setPitchDeckImage = useCallback((url: string, ideaName: string) => {
    setPitchDeckImages(prev => {
      if (prev.some(img => img.url === url)) return prev;
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

  // ── Pitch Deck Exclusions ──
  const [pitchDeckExclusions, setPitchDeckExclusions] = useState<Set<string>>(new Set());
  const pendingExclusionsSaveRef = useRef<string[] | null>(null);
  const togglePitchDeckExclusion = useCallback((key: string) => {
    setPitchDeckExclusions(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      pendingExclusionsSaveRef.current = Array.from(next);
      return next;
    });
  }, []);

  return {
    userScores, setUserScores, setUserScore, pendingScoreSaveRef,
    insightPreferences, setInsightPreferences, setInsightPreference, getLikedInsights, getDismissedInsights, pendingPrefSaveRef,
    steeringText, setSteeringText,
    pitchDeckImages, setPitchDeckImages, setPitchDeckImage, removePitchDeckImage, pendingPitchImagesSaveRef,
    pitchDeckExclusions, setPitchDeckExclusions, togglePitchDeckExclusion, pendingExclusionsSaveRef,
  };
}
