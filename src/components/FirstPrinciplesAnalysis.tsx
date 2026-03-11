import { useState, useEffect, useRef } from "react";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { invokeWithTimeout } from "@/lib/invokeWithTimeout";
import { toast } from "sonner";
import type { Product, FlippedIdea } from "@/data/mockProducts";
import { Brain, Sparkles, AlertTriangle, RefreshCw } from "lucide-react";
import { StepLoadingTracker, DISRUPT_TASKS, REDESIGN_TASKS } from "@/components/StepLoadingTracker";

// Sub-panels
import { HiddenAssumptionsPanel } from "./first-principles/HiddenAssumptionsPanel";
import { FlippedLogicPanel } from "./first-principles/FlippedLogicPanel";
import { FlippedIdeasPanel } from "./first-principles/FlippedIdeasPanel";
import { RedesignedConceptPanel } from "./first-principles/RedesignedConceptPanel";
import { ConceptExplorer } from "./first-principles/ConceptExplorer";
import { InnovationPaths } from "./first-principles/InnovationPaths";
import { EngineeringDeepDive } from "./first-principles/EngineeringDeepDive";
import type { InventionConcept, ConceptSynthesisResult } from "./first-principles/types";

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
  
  const analysisCtx = useAnalysis();
  const [data, setData] = useState<any>((externalData as any) || null);
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState<"assumptions" | "flip" | "ideas" | "concept">(
    renderMode === "redesign" ? (activeSection || "flip") : "assumptions"
  );
  const [rerunSuggestions, setRerunSuggestions] = useState("");
  const [deepDiveConcept, setDeepDiveConcept] = useState<InventionConcept | null>(null);
  const autoTriggered = useRef(false);

  useEffect(() => {
    if (activeSection && renderMode === "redesign") {
      setActiveStep(activeSection);
    }
  }, [activeSection, renderMode]);

  useEffect(() => {
    if (externalData && !data) setData(externalData);
  }, [externalData]); // eslint-disable-line react-hooks/exhaustive-deps

  // saveToWorkspace removed — data is saved via onDataLoaded → saveStepData("disrupt")
  // which atomically merges into the parent analysis record via merge_analysis_step RPC

  const [lastError, setLastError] = useState<string | null>(null);

  const runAnalysis = async () => {
    setLoading(true);
    setLastError(null);
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

      // ── USE SPLIT PIPELINE: transformation-engine for disrupt, concept-architecture for redesign ──
      if (renderMode === "redesign") {
        // Redesign mode: call concept-architecture with existing disrupt data
        const requestBody: Record<string, unknown> = {
          product,
          viableTransformations: [],
          allClusters: [],
          hiddenAssumptions: null,
          flippedLogic: null,
        };
        if (analysisCtx.disruptData) {
          const dd = analysisCtx.disruptData as Record<string, unknown>;
          requestBody.hiddenAssumptions = dd.hiddenAssumptions || null;
          requestBody.flippedLogic = dd.flippedLogic || null;
          // Filter viable transformations
          if (Array.isArray(dd.structuralTransformations)) {
            requestBody.viableTransformations = (dd.structuralTransformations as any[]).filter(
              (t: any) => !t.filtered && (t.viabilityGate?.compositeScore ?? 5) >= 2.5
            );
          }
          if (Array.isArray(dd.transformationClusters)) {
            requestBody.allClusters = dd.transformationClusters;
          }
        }
        if (analysisCtx.governedData) {
          requestBody.governedContext = {
            reasoning_synopsis: analysisCtx.governedData.reasoning_synopsis,
            constraint_map: analysisCtx.governedData.constraint_map,
            root_hypotheses: analysisCtx.governedData.root_hypotheses,
          };
        }
        requestBody.decomposition = analysisCtx.decompositionData || undefined;
        requestBody.insightPreferences = analysisCtx.insightPreferences;
        requestBody.userScores = analysisCtx.userScores;
        requestBody.steeringText = analysisCtx.steeringText;

        const { data: result, error } = await invokeWithTimeout("concept-architecture", { body: requestBody }, 180_000, 1);
        if (error || !result?.success) {
          const msg = result?.error || error?.message || "Redesign failed";
          setLastError(msg);
          toast.error("Redesign failed: " + msg);
          return;
        }
        setData(result.analysis);
        onDataLoaded?.(result.analysis);
        setActiveStep("flip");
        toast.success("Redesign concept generated!");
      } else {
        // Disrupt mode: call transformation-engine
        const requestBody: Record<string, unknown> = {
          product,
          upstreamIntel: Object.keys(upstreamIntel).length > 0 ? upstreamIntel : undefined,
          adaptiveContext: analysisCtx.adaptiveContext || undefined,
          structuralDecomposition: analysisCtx.decompositionData || undefined,
        };
        if (analysisCtx.activeBranchId && analysisCtx.governedData) {
          const { getBranchPayload } = await import("@/lib/branchContext");
          const branchPayload = getBranchPayload(analysisCtx.governedData, analysisCtx.activeBranchId, analysisCtx.strategicProfile);
          if (branchPayload) requestBody.activeBranch = branchPayload;
        }

        const { data: result, error } = await invokeWithTimeout("transformation-engine", { body: requestBody }, 180_000, 1);
        if (error || !result?.success) {
          const msg = result?.error || error?.message || "Analysis failed";
          setLastError(msg);
          if (msg.includes("Rate limit") || msg.includes("429")) {
            toast.error("Rate limit hit — please wait a moment and try again.");
          } else if (msg.includes("credits") || msg.includes("402")) {
            toast.error("Analysis credits exhausted — add credits in Settings → Workspace → Usage.");
          } else {
            toast.error("Structural analysis failed: " + msg);
          }
          return;
        }
        setData(result.analysis);
        onDataLoaded?.(result.analysis);
        // Extract governed data
        if (result.analysis?.governed) {
          analysisCtx.setGovernedData(result.analysis.governed);
        }
        setActiveStep("assumptions");
        toast.success("Structural analysis complete!");
      }
    } catch (err) {
      const msg = String(err);
      setLastError(msg);
      toast.error("Unexpected error: " + msg);
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

  // Error state with retry
  if (!data && lastError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-6 text-center">
        <div className="w-20 h-20 rounded flex items-center justify-center bg-destructive/10">
          <AlertTriangle size={36} className="text-destructive" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground mb-2">
            {renderMode === "redesign" ? "Redesign Failed" : "Analysis Failed"}
          </h3>
          <p className="text-sm text-muted-foreground max-w-md leading-relaxed">{lastError}</p>
        </div>
        <button onClick={runAnalysis} disabled={loading}
          className="flex items-center gap-2 px-6 py-3 rounded font-bold text-sm bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
          <RefreshCw size={15} /> Retry
        </button>
      </div>
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
    // Check if we have concept synthesis data (Invention Engine)
    const conceptsSynthesis = analysisCtx.conceptsData as ConceptSynthesisResult | null;

    if (deepDiveConcept) {
      return (
        <div className="space-y-4" data-fp-steps>
          <EngineeringDeepDive
            concept={deepDiveConcept}
            onBack={() => setDeepDiveConcept(null)}
          />
        </div>
      );
    }

    // If concepts data exists, show Invention Engine UI
    if (conceptsSynthesis && conceptsSynthesis.concepts?.length > 0) {
      return (
        <div className="space-y-6" data-fp-steps>
          {activeStep === "flip" && (
            <>
              <FlippedLogicPanel flips={data.flippedLogic || (analysisCtx.disruptData as any)?.flippedLogic || []} assumptions={data.hiddenAssumptions || (analysisCtx.disruptData as any)?.hiddenAssumptions || []} />
              {conceptsSynthesis.innovation_paths?.length > 0 && (
                <InnovationPaths paths={conceptsSynthesis.innovation_paths} />
              )}
            </>
          )}
          {activeStep === "ideas" && (
            <ConceptExplorer
              data={conceptsSynthesis}
              onSelectForDeepDive={(c) => setDeepDiveConcept(c)}
            />
          )}
          {activeStep === "concept" && (
            <EngineeringDeepDive
              concept={conceptsSynthesis.concepts[0]}
              onBack={() => setActiveStep("ideas")}
            />
          )}
        </div>
      );
    }

    // Fallback: original redesign mode
    return (
      <div className="space-y-4" data-fp-steps>
        {activeStep === "flip" && (
          <FlippedLogicPanel flips={data.flippedLogic || (analysisCtx.disruptData as any)?.flippedLogic || []} assumptions={data.hiddenAssumptions || (analysisCtx.disruptData as any)?.hiddenAssumptions || []} />
        )}
        {activeStep === "ideas" && (() => {
          const effectiveIdeas = (flippedIdeas && flippedIdeas.length > 0)
            ? flippedIdeas
            : (data.flippedLogic || []).map((fl: any, i: number) => ({
                id: `derived-${i}`,
                name: fl.boldAlternative || fl.alternative || `Idea ${i + 1}`,
                description: fl.rationale || fl.description || "",
                targetPrice: null,
                feasibility: fl.leverageScore ? fl.leverageScore / 10 : 0.7,
                marketPotential: "medium" as const,
                constraints: fl.originalAssumption ? [fl.originalAssumption] : [],
              }));
          return (
            <FlippedIdeasPanel
              flippedIdeas={effectiveIdeas}
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
          );
        })()}
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
