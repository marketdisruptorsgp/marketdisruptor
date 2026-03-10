/**
 * useCompetitiveResearch hook
 * Auto-triggers competitive positioning research when BI extraction
 * contains named competitors. Now includes industry benchmarks.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { invokeWithTimeout } from "@/lib/invokeWithTimeout";
import { extractCompetitorNames, applyUserOverrides, type CompetitiveIntelligence, type CompetitorProfile, type IndustryBenchmark } from "@/lib/competitiveIntelligence";
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
  const [benchmarks, setBenchmarks] = useState<IndustryBenchmark | null>(null);
  const [benchmarksLoading, setBenchmarksLoading] = useState(false);
  const [userOverrides, setUserOverrides] = useState<Record<string, Partial<CompetitorProfile>>>({});
  const triggeredRef = useRef<string | null>(null);
  const benchTriggeredRef = useRef<string | null>(null);

  const { competitors, businessName, businessDescription, industry, revenue, services, naicsCode } =
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
          body: { businessName, businessDescription, competitors, industry, revenue, services, naicsCode },
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
        allSources: result.allSources || [],
      };

      setData(intel);
      const corrobLabel = result.hasPerplexityCorroboration ? " (multi-source)" : "";
      toast.success(`Competitive intel${corrobLabel}: ${intel.competitorProfiles.length} profiles, ${intel.strategicGaps.length} gaps identified`);
    } catch (err: any) {
      const msg = err?.message || "Competitive research failed";
      setError(msg);
      console.error("Competitive research error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [competitors.join(","), businessName, businessDescription, industry, revenue, services, naicsCode]);

  const fetchBenchmarks = useCallback(async () => {
    if (!industry && !naicsCode) return;
    if (benchmarksLoading) return;

    setBenchmarksLoading(true);
    try {
      const { data: result, error: fnError } = await invokeWithTimeout(
        "industry-benchmarks",
        { body: { naicsCode, industry, businessName } },
        30_000,
      );

      if (fnError) throw fnError;
      if (!result?.success) throw fnError;

      const bench: IndustryBenchmark = {
        source: "Census/BLS/SBA",
        naicsCode: result.naicsCode,
        naicsTitle: result.census?.naicsTitle || "",
        establishments: result.census?.establishments,
        totalEmployment: result.census?.totalEmployment,
        averageWage: result.bls?.avgAnnualPay || result.census?.avgPayrollPerEmployee,
        avgEmployeesPerEstablishment: result.census?.avgEmployeesPerEstablishment,
        year: result.census?.year || result.bls?.year,
        sbaData: result.sba ? {
          avgLoanAmount: result.sba.avgLoanAmountHigh ? `$${(result.sba.avgLoanAmountLow/1000).toFixed(0)}K-$${(result.sba.avgLoanAmountHigh/1000).toFixed(0)}K` as any : undefined,
          defaultRate: result.sba.defaultRate,
          topLenders: result.sba.topLenders,
        } : undefined,
      };
      setBenchmarks(bench);
    } catch (err: any) {
      console.error("Industry benchmarks error:", err);
    } finally {
      setBenchmarksLoading(false);
    }
  }, [naicsCode, industry, businessName]);

  // User override handler
  const updateCompetitorOverride = useCallback((competitorName: string, field: string, value: any) => {
    setUserOverrides(prev => ({
      ...prev,
      [competitorName]: { ...prev[competitorName], [field]: value },
    }));
  }, []);

  // Auto-trigger competitive research
  useEffect(() => {
    if (!autoTrigger) return;
    if (competitors.length === 0) return;
    const key = `${analysisId}:${competitors.join(",")}`;
    if (triggeredRef.current === key) return;
    triggeredRef.current = key;
    runResearch();
  }, [autoTrigger, competitors.join(","), analysisId]);

  // Auto-trigger benchmarks
  useEffect(() => {
    if (!autoTrigger) return;
    if (!industry && !naicsCode) return;
    const key = `${analysisId}:${naicsCode || industry}`;
    if (benchTriggeredRef.current === key) return;
    benchTriggeredRef.current = key;
    fetchBenchmarks();
  }, [autoTrigger, naicsCode, industry, analysisId]);

  // Apply user overrides to data
  const effectiveData = data && Object.keys(userOverrides).length > 0
    ? applyUserOverrides(data, userOverrides)
    : data;

  return {
    data: effectiveData,
    isLoading,
    error,
    runResearch,
    hasCompetitors: competitors.length > 0,
    competitorNames: competitors,
    benchmarks,
    benchmarksLoading,
    fetchBenchmarks,
    userOverrides,
    updateCompetitorOverride,
  };
}
