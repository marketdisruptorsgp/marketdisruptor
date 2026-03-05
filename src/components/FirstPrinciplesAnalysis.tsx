import { useState, useEffect, useRef } from "react";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { supabase } from "@/integrations/supabase/client";
import { invokeWithTimeout } from "@/lib/invokeWithTimeout";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { Product, FlippedIdea } from "@/data/mockProducts";
import { Brain, Sparkles } from "lucide-react";
import { StepLoadingTracker, DISRUPT_TASKS, REDESIGN_TASKS } from "@/components/StepLoadingTracker";

// Sub-panels
import { HiddenAssumptionsPanel } from "./first-principles/HiddenAssumptionsPanel";
import { FlippedLogicPanel } from "./first-principles/FlippedLogicPanel";
import { FlippedIdeasPanel } from "./first-principles/FlippedIdeasPanel";
import { RedesignedConceptPanel } from "./first-principles/RedesignedConceptPanel";

// Re-export types and constants for backward compatibility
export type { FirstPrinciplesData } from "./first-principles/types";
export { WorkflowTimeline } from "./first-principles/WorkflowTimeline";
export { INTEL_SECTION_DESCRIPTIONS, REDESIGN_SECTION_DESCRIPTIONS } from "./first-principles/constants";

interface FirstPrinciplesAnalysisProps {
  product: Product;
  flippedIdeas?: FlippedIdea[];
  onRegenerateIdeas?: (userContext?: string) => void;
  generatingIdeas?: boolean;
  onPatentSave?: (patentData: unknown) => void;
  externalData?: unknown;
  runTrigger?: number;
  onLoadingChange?: (loading: boolean) => void;
  onDataLoaded?: (data: unknown) => void;
  onAnalysisStarted?: () => void;
  renderMode?: "disrupt" | "redesign";
  autoTrigger?: boolean;
  activeSection?: "flip" | "ideas" | "concept";
  onSaved?: () => void;
  userScores?: Record<string, Record<string, number>>;
  onScoreChange?: (ideaId: string, scoreKey: string, value: number) => void;
}

export const FirstPrinciplesAnalysis = ({
  product, flippedIdeas, onRegenerateIdeas, generatingIdeas, onPatentSave,
  externalData, onDataLoaded, onAnalysisStarted, renderMode, autoTrigger,
  userScores, onScoreChange, runTrigger, onLoadingChange, activeSection, onSaved,
}: FirstPrinciplesAnalysisProps) => {
  const { user } = useAuth();
  const analysisCtx = useAnalysis();
  const [data, setData] = useState<any>((externalData as any) || null);
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState<"assumptions" | "flip" | "ideas" | "concept">(
    renderMode === "redesign" ? (activeSection || "flip") : "assumptions"
  );
  const [rerunSuggestions, setRerunSuggestions] = useState("");
  const autoTriggered = useRef(false);

  useEffect(() => {
    if (activeSection && renderMode === "redesign") {
      setActiveStep(activeSection);
    }
  }, [activeSection, renderMode]);

  useEffect(() => {
    if (externalData && !data) setData(externalData);
  }, [externalData]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveToWorkspace = async (analysisData: any) => {
    try {
      await (supabase.from("saved_analyses") as any).insert({
        user_id: user?.id,
        title: `${product.name} — Disrupt`,
        category: product.category || "Product",
        era: product.era || "Unknown",
        audience: "",
        batch_size: 1,
        products: [],
        product_count: 0,
        avg_revival_score: null,
        analysis_type: "product",
        analysis_data: JSON.parse(JSON.stringify(analysisData)),
      });
      onSaved?.();
      toast.success("Structural analysis saved to workspace!");
    } catch (err) {
      console.error("Save failed:", err);
    }
  };

  const runAnalysis = async () => {
    setLoading(true);
    onAnalysisStarted?.();
    try {
      const upstreamIntel: Record<string, unknown> = {};
      if (product.pricingIntel) upstreamIntel.pricingIntel = product.pricingIntel;
      if (product.supplyChain) upstreamIntel.supplyChain = {
        suppliers: (product.supplyChain.suppliers || []).slice(0, 5).map((s: any) => ({ name: s.name, region: s.region, role: s.role })),
        manufacturers: (product.supplyChain.manufacturers || []).slice(0, 5).map((m: any) => ({ name: m.name, region: m.region, moq: m.moq })),
        distributors: (product.supplyChain.distributors || []).slice(0, 3).map((d: any) => ({ name: d.name, region: d.region })),
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
      const requestBody: Record<string, unknown> = {
        product, userSuggestions: rerunSuggestions || undefined,
        adaptiveContext: analysisCtx.adaptiveContext || undefined,
        upstreamIntel: Object.keys(upstreamIntel).length > 0 ? upstreamIntel : undefined,
      };
      if (renderMode === "redesign") {
        requestBody.insightPreferences = analysisCtx.insightPreferences;
        requestBody.userScores = analysisCtx.userScores;
        requestBody.steeringText = analysisCtx.steeringText;
        if (analysisCtx.disruptData) {
          const dd = analysisCtx.disruptData as Record<string, unknown>;
          requestBody.disruptContext = { hiddenAssumptions: dd.hiddenAssumptions || null, flippedLogic: dd.flippedLogic || null };
        }
        if (analysisCtx.governedData) {
          requestBody.governedContext = {
            reasoning_synopsis: analysisCtx.governedData.reasoning_synopsis,
            constraint_map: analysisCtx.governedData.constraint_map,
            root_hypotheses: analysisCtx.governedData.root_hypotheses,
          };
        }
      }
      if (analysisCtx.activeBranchId && analysisCtx.governedData) {
        const { getBranchPayload } = await import("@/lib/branchContext");
        const branchPayload = getBranchPayload(analysisCtx.governedData, analysisCtx.activeBranchId, analysisCtx.strategicProfile);
        if (branchPayload) requestBody.activeBranch = branchPayload;
      }
      const { data: result, error } = await invokeWithTimeout("first-principles-analysis", { body: requestBody }, 180_000);

      if (error || !result?.success) {
        const msg = result?.error || error?.message || "Analysis failed";
        if (msg.includes("Rate limit") || msg.includes("429")) {
          toast.error("Rate limit hit — please wait a moment and try again.");
        } else if (msg.includes("credits") || msg.includes("402")) {
          toast.error("Analysis credits exhausted — add credits in Settings → Workspace → Usage.");
        } else {
          toast.error("First principles analysis failed: " + msg);
        }
        return;
      }

      setData(result.analysis);
      onDataLoaded?.(result.analysis);
      setActiveStep(renderMode === "redesign" ? "flip" : "assumptions");
      toast.success("Disrupt analysis complete!");
      await saveToWorkspace(result.analysis);
    } catch (err) {
      toast.error("Unexpected error: " + String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { onLoadingChange?.(loading); }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps

  const runTriggerRef = useRef(runTrigger ?? 0);
  useEffect(() => {
    if (runTrigger !== undefined && runTrigger > runTriggerRef.current && !loading) {
      runTriggerRef.current = runTrigger;
      runAnalysis();
    }
  }, [runTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (autoTrigger && renderMode === "redesign" && !loading && !autoTriggered.current) {
      autoTriggered.current = true;
      runAnalysis();
    }
  }, [autoTrigger, renderMode, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Loading state
  if (!data && loading) {
    return (
      <StepLoadingTracker
        title={renderMode === "redesign" ? "Generating Redesign Concept" : "Building Structural Analysis"}
        tasks={renderMode === "redesign" ? REDESIGN_TASKS : DISRUPT_TASKS}
        estimatedSeconds={35}
        accentColor={renderMode === "redesign" ? "hsl(38 92% 50%)" : "hsl(271 81% 55%)"}
      />
    );
  }

  // Empty state
  if (!data) {
    if (renderMode === "redesign") {
      return (
        <div className="flex flex-col items-center justify-center py-16 space-y-6 text-center">
          <div className="w-20 h-20 rounded flex items-center justify-center" style={{ background: "hsl(38 92% 50% / 0.12)" }}>
            <Sparkles size={36} style={{ color: "hsl(38 92% 50%)" }} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground mb-2">Redesign Concept</h3>
            <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
              Generate a radical reinvention of <strong>{product.name}</strong>.
            </p>
          </div>
          <button onClick={runAnalysis} disabled={loading}
            className="flex items-center gap-2 px-6 py-3 rounded font-bold text-sm transition-colors"
            style={{ background: "hsl(38 92% 50%)", color: "white", opacity: loading ? 0.7 : 1 }}>
            <Sparkles size={15} /> Generate Redesign
          </button>
          <p className="text-[11px] font-bold text-muted-foreground">Uses Gemini 2.5 Pro · ~30–60s</p>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-6 text-center">
        <div className="w-20 h-20 rounded flex items-center justify-center" style={{ background: "hsl(var(--primary-muted))" }}>
          <Brain size={36} style={{ color: "hsl(var(--primary))" }} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground mb-2">Disrupt Analysis</h3>
          <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
            Deep analysis of <strong>{product.name}</strong> — questioning every assumption.
          </p>
        </div>
        <button onClick={runAnalysis} disabled={loading}
          className="flex items-center gap-2 px-6 py-3 rounded font-bold text-sm transition-colors"
          style={{ background: "hsl(var(--primary))", color: "white", opacity: loading ? 0.7 : 1 }}>
          <Brain size={15} /> Run Disrupt Analysis
        </button>
        <p className="text-[11px] font-bold text-muted-foreground">Uses Gemini 2.5 Pro · ~30–60s</p>
      </div>
    );
  }

  // ── REDESIGN MODE ──
  if (renderMode === "redesign") {
    return (
      <div className="space-y-4" data-fp-steps>
        {activeStep === "flip" && (
          <FlippedLogicPanel flips={data.flippedLogic || []} assumptions={data.hiddenAssumptions || []} />
        )}
        {activeStep === "ideas" && (
          <FlippedIdeasPanel
            flippedIdeas={flippedIdeas}
            onRegenerateIdeas={onRegenerateIdeas}
            generatingIdeas={generatingIdeas}
            userScores={userScores}
            onScoreChange={onScoreChange}
            onCompetitorsScouted={(comps) => {
              const prev = analysisCtx.scoutedCompetitors || [];
              const merged = [...prev, ...(comps as any[])];
              analysisCtx.setScoutedCompetitors(merged);
              analysisCtx.saveStepData("scoutedCompetitors", merged);
            }}
          />
        )}
        {activeStep === "concept" && (
          <RedesignedConceptPanel concept={data.redesignedConcept} />
        )}
      </div>
    );
  }

  // ── DISRUPT MODE ──
  return (
    <HiddenAssumptionsPanel
      data={data}
      governedData={analysisCtx.governedData}
      onRerun={runAnalysis}
      loading={loading}
      rerunSuggestions={rerunSuggestions}
      onRerunSuggestionsChange={setRerunSuggestions}
    />
  );
};
