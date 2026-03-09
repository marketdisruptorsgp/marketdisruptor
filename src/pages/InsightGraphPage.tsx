/**
 * Insight Graph Page — Minimal chrome, graph fills viewport
 */

import React, { useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { useModeTheme } from "@/hooks/useModeTheme";
import { useHydrationGuard } from "@/hooks/useHydrationGuard";
import { useAutoAnalysis } from "@/hooks/useAutoAnalysis";
import { buildInsightGraph } from "@/lib/insightGraph";
import { extractAllEvidence } from "@/lib/evidenceEngine";
import { buildSystemIntelligence, type SystemIntelligenceInput } from "@/lib/systemIntelligence";
import { InsightGraphView } from "@/components/insight-graph/InsightGraphView";
import { RefreshCw, FileDown, LayoutDashboard, Home, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useWorkspaceTheme } from "@/hooks/useWorkspaceTheme";
import { downloadReportAsPDF } from "@/lib/downloadReportPDF";
import { gatherAllAnalysisData } from "@/lib/gatherAnalysisData";

export default function InsightGraphPage() {
  const analysis = useAnalysis();
  const navigate = useNavigate();
  const theme = useModeTheme();
  const { shouldRedirectHome } = useHydrationGuard();
  const autoAnalysis = useAutoAnalysis();
  useWorkspaceTheme();

  const {
    selectedProduct,
    analysisId: ctxAnalysisId,
    products,
    disruptData,
    redesignData,
    stressTestData,
    businessAnalysisData,
    businessModelInput,
  } = analysis;
  const modeAccent = theme.primary;

  const urlAnalysisId = useMemo(() => {
    const match = window.location.pathname.match(/\/analysis\/([0-9a-f-]{36})/);
    return match?.[1] || null;
  }, []);
  const analysisId = ctxAnalysisId || urlAnalysisId;
  const hasBusinessContext = !!businessAnalysisData;

  const intelligence = useMemo(() => {
    if (!analysisId) return null;
    try {
      const input: SystemIntelligenceInput = {
        analysisId,
        governedData: analysis.governedData,
        disruptData: disruptData as Record<string, unknown> | null,
        businessAnalysisData: analysis.businessAnalysisData as Record<string, unknown> | null,
        intelData: null,
        flipIdeas: null,
        activeLenses: [],
      };
      return buildSystemIntelligence(input);
    } catch {
      return null;
    }
  }, [analysisId, disruptData, analysis.governedData, analysis.businessAnalysisData]);

  const graph = useMemo(() => {
    const evidenceData = extractAllEvidence({
      products,
      selectedProduct,
      disruptData,
      redesignData,
      stressTestData,
      pitchDeckData: analysis.pitchDeckData,
      governedData: analysis.governedData as Record<string, unknown> | null,
      businessAnalysisData,
      intelligence,
      analysisType: (analysis as any).activeMode === "service" ? "service" : (analysis as any).activeMode === "business" ? "business_model" : "product",
    });
    const insightsData = autoAnalysis.insights?.map(i => ({
      id: i.id, label: i.label, description: i.description,
      insightType: i.insightType, impact: i.impact,
      confidenceScore: i.confidence ?? i.confidenceScore ?? 0.5, evidenceIds: i.evidenceIds,
      recommendedTools: i.recommendedTools ?? [],
    }));
    const scenariosData = autoAnalysis.scenarioComparison?.scenarios;
    return buildInsightGraph(evidenceData, undefined, undefined, undefined, undefined, insightsData, scenariosData);
  }, [products, selectedProduct, intelligence, disruptData, redesignData, stressTestData, analysis.pitchDeckData, analysis.governedData, businessAnalysisData, (analysis as any).activeMode, autoAnalysis.insights, autoAnalysis.scenarioComparison]);

  const { completedSteps } = autoAnalysis;

  const handleRecomputeAll = useCallback(() => {
    if (!analysisId) return;
    if (completedSteps.size === 0) {
      navigate(`/analysis/${analysisId}/command-deck`);
      return;
    }
    toast.success("Strategic intelligence updated");
  }, [analysisId, completedSteps, navigate]);

  if (!analysisId || analysis.step !== "done" || (!selectedProduct && !hasBusinessContext)) {
    if (shouldRedirectHome) return null;
    if (analysis.step === "done" && !analysis.isHydrating) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
          <div className="text-center space-y-3 max-w-md">
            <p className="text-sm font-bold text-foreground">Analysis data incomplete</p>
            <p className="text-xs text-muted-foreground">This analysis may need to be re-run.</p>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "hsl(var(--primary))" }} />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-background flex flex-col overflow-hidden" style={{ height: "calc(100vh - 44px)" }}>
      {/* Navigation toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-background flex-shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <SidebarTrigger className="mr-1 flex-shrink-0" />
          <button
            onClick={() => navigate("/")}
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          >
            <Home size={14} />
          </button>
          <ChevronRight size={12} className="text-muted-foreground/50 flex-shrink-0" />
          <button
            onClick={() => navigate(`/analysis/${analysisId}/command-deck`)}
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          >
            <LayoutDashboard size={14} />
          </button>
          <ChevronRight size={12} className="text-muted-foreground/50 flex-shrink-0" />
          <h2 className="text-sm font-bold text-foreground truncate">Insight Graph</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/analysis/${analysisId}/command-deck`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[36px] bg-muted text-foreground border border-border"
          >
            <LayoutDashboard size={13} />
            Command Deck
          </button>
          <button
            onClick={() => {
              if (!selectedProduct) return;
              const data = gatherAllAnalysisData(analysis);
              toast.loading("Generating PDF…", { id: "pdf-progress" });
              downloadReportAsPDF(selectedProduct, data, {
                title: selectedProduct.name,
                mode: (analysis as any).activeMode,
                onProgress: (msg: string) => toast.loading(msg, { id: "pdf-progress" }),
              }).then(() => { toast.dismiss("pdf-progress"); toast.success("PDF downloaded!"); })
                .catch(() => { toast.dismiss("pdf-progress"); toast.error("Failed to download PDF"); });
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] min-h-[36px] bg-muted text-foreground border border-border"
          >
            <FileDown size={13} />
            PDF
          </button>
          <button
            onClick={handleRecomputeAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: `${modeAccent}15`, color: modeAccent, border: `1px solid ${modeAccent}30` }}
          >
            <RefreshCw size={13} />
            Refresh
          </button>
        </div>
      </div>

      {/* Graph fills remaining viewport */}
      <div className="flex-1 min-h-0">
        <InsightGraphView graph={graph} analysisId={analysisId || ""} />
      </div>
    </div>
  );
}
