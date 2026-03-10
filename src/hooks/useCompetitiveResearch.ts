/**
 * useCompetitiveResearch hook
 * Auto-triggers competitive positioning research when BI extraction
 * contains named competitors.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { invokeWithTimeout } from "@/lib/invokeWithTimeout";
import { extractCompetitorNames, type CompetitiveIntelligence } from "@/lib/competitiveIntelligence";
import { toast } from "sonner";

interface UseCompetitiveResearchProps {
  biExtraction: Record<string, any> | null;
  governedData: Record<string, any> | null;
  analysisId: string;
  autoTrigger?: boolean;
}

export function useCompetitiveResearch({
  biExtraction,
  governedData,
  analysisId,
  autoTrigger = true,
}: UseCompetitiveResearchProps) {
  const [data, setData] = useState<CompetitiveIntelligence | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const triggeredRef = useRef<string | null>(null);

  const { competitors, businessName, businessDescription, industry, revenue, services } =
    extractCompetitorNames(biExtraction, governedData);

  const runResearch = useCallback(async () => {
    if (competitors.length === 0 || !businessName) return;
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data: result, error: fnError } = await invokeWithTimeout(
        "research-competitive-positioning",
        {
          body: { businessName, businessDescription, competitors, industry, revenue, services },
        },
        120_000,
      );

      if (fnError) throw fnError;
      if (!result?.success) throw new Error(result?.error || "Research failed");

      const intel: CompetitiveIntelligence = {
        competitorProfiles: result.competitorProfiles || [],
        positioningMap: result.positioningMap || null,
        strategicGaps: result.strategicGaps || [],
        competitiveAdvantages: result.competitiveAdvantages || [],
        marketDynamics: result.marketDynamics || null,
      };

      setData(intel);
      toast.success(`Competitive intel: ${intel.competitorProfiles.length} profiles, ${intel.strategicGaps.length} gaps identified`);
    } catch (err: any) {
      const msg = err?.message || "Competitive research failed";
      setError(msg);
      console.error("Competitive research error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [competitors.join(","), businessName, businessDescription, industry, revenue, services]);

  // Auto-trigger once when competitors are detected
  useEffect(() => {
    if (!autoTrigger) return;
    if (competitors.length === 0) return;
    const key = `${analysisId}:${competitors.join(",")}`;
    if (triggeredRef.current === key) return;
    triggeredRef.current = key;
    runResearch();
  }, [autoTrigger, competitors.join(","), analysisId]);

  return { data, isLoading, error, runResearch, hasCompetitors: competitors.length > 0, competitorNames: competitors };
}
