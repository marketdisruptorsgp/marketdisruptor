import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { Product, FlippedIdea } from "@/data/mockProducts";
import { FlippedIdeaCard } from "@/components/FlippedIdeaCard";
import { PatentIntelligence } from "@/components/PatentIntelligence";
import { downloadPatentPDF } from "@/lib/pdfExport";
import {
  Brain, Flame, Zap, ChevronRight, RefreshCw, AlertTriangle, CheckCircle2,
  Wrench, Lightbulb, Package, DollarSign, Users, Factory, FlipHorizontal,
  Eye, ArrowRight, Sparkles, ShieldAlert, Cpu, Ruler, Move, Navigation,
  Maximize2, Wifi, ScrollText, FileDown,
} from "lucide-react";

interface CoreReality {
  trueProblem: string;
  actualUsage: string;
  normalizedFrustrations: string[];
  userHacks: string[];
}

interface PhysicalDimensions {
  sizeAnalysis: string;
  weightAnalysis: string;
  formFactorAnalysis: string;
  staticVsDynamic: string;
  ergonomicGaps: string[];
  dimensionOpportunities: string[];
}

interface WorkflowFriction {
  step: string;
  friction: string;
  severity: "high" | "medium" | "low";
  rootCause: string;
}

interface UserWorkflow {
  stepByStep: string[];
  frictionPoints: WorkflowFriction[];
  cognitiveLoad: string;
  contextOfUse: string;
  workflowOptimizations: string[];
}

interface MissedTechOpportunity {
  tech: string;
  application: string;
  valueCreated: string;
}

interface SmartTechAnalysis {
  currentTechLevel: string;
  missedOpportunities: MissedTechOpportunity[];
  whyNotAlreadyDone: string;
  recommendedIntegration: string;
}

interface HiddenAssumption {
  assumption: string;
  currentAnswer: string;
  reason: "tradition" | "manufacturing" | "cost" | "physics" | "habit";
  isChallengeable: boolean;
  challengeIdea?: string;
}

interface FlippedLogicItem {
  originalAssumption: string;
  boldAlternative: string;
  rationale: string;
  physicalMechanism: string;
}

interface RedesignedConcept {
  conceptName: string;
  tagline: string;
  coreInsight: string;
  radicalDifferences: string[];
  physicalDescription: string;
  sizeAndWeight: string;
  materials: string[];
  smartFeatures: string[];
  userExperienceTransformation: string;
  frictionEliminated: string[];
  whyItHasntBeenDone: string;
  biggestRisk: string;
  manufacturingPath: string;
  pricePoint: string;
  targetUser: string;
}

interface FirstPrinciplesData {
  coreReality: CoreReality;
  physicalDimensions: PhysicalDimensions;
  userWorkflow: UserWorkflow;
  smartTechAnalysis: SmartTechAnalysis;
  hiddenAssumptions: HiddenAssumption[];
  flippedLogic: FlippedLogicItem[];
  redesignedConcept: RedesignedConcept;
}

interface FirstPrinciplesAnalysisProps {
  product: Product;
  flippedIdeas?: FlippedIdea[];
  onRegenerateIdeas?: (userContext?: string) => void;
  generatingIdeas?: boolean;
  onPatentSave?: (patentData: unknown) => void;
}

const REASON_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  tradition: { bg: "hsl(38 92% 50% / 0.1)", text: "hsl(38 92% 35%)", label: "Tradition" },
  manufacturing: { bg: "hsl(217 91% 60% / 0.1)", text: "hsl(217 91% 40%)", label: "Mfg Limits" },
  cost: { bg: "hsl(142 70% 45% / 0.1)", text: "hsl(142 70% 30%)", label: "Cost" },
  physics: { bg: "hsl(271 81% 56% / 0.1)", text: "hsl(271 81% 40%)", label: "Physics" },
  habit: { bg: "hsl(330 80% 55% / 0.1)", text: "hsl(330 80% 40%)", label: "Habit" },
};

const SEVERITY_COLORS = {
  high: { bg: "hsl(var(--destructive) / 0.08)", border: "hsl(var(--destructive) / 0.3)", text: "hsl(var(--destructive))" },
  medium: { bg: "hsl(38 92% 50% / 0.08)", border: "hsl(38 92% 50% / 0.3)", text: "hsl(38 92% 35%)" },
  low: { bg: "hsl(142 70% 45% / 0.07)", border: "hsl(142 70% 45% / 0.25)", text: "hsl(142 70% 30%)" },
};

export const FirstPrinciplesAnalysis = ({ product, onSaved, flippedIdeas, onRegenerateIdeas, generatingIdeas, onPatentSave }: FirstPrinciplesAnalysisProps & { onSaved?: () => void }) => {
  const { user } = useAuth();
  const [data, setData] = useState<FirstPrinciplesData | null>(null);
  const [loading, setLoading] = useState(false);
  const [patentLoading, setPatentLoading] = useState(false);
  const [activeStep, setActiveStep] = useState<"reality" | "physical" | "workflow" | "smarttech" | "assumptions" | "flip" | "concept" | "ideas" | "patents">("reality");
  const [userContext, setUserContext] = useState("");

  const saveToWorkspace = async (analysisData: FirstPrinciplesData) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        analysis_type: "first_principles",
        analysis_data: JSON.parse(JSON.stringify(analysisData)),
      });
      onSaved?.();
      toast.success("First principles analysis saved to workspace!");
    } catch (err) {
      console.error("Save failed:", err);
    }
  };

  const runAnalysis = async () => {
    setLoading(true);
    setPatentLoading(true);
    try {
      // Run both analyses in parallel
      const [fpResult, patentResult] = await Promise.allSettled([
        supabase.functions.invoke("first-principles-analysis", {
          body: { product },
        }),
        supabase.functions.invoke("patent-analysis", {
          body: {
            productName: product.name,
            category: product.category,
            era: product.era,
          },
        }),
      ]);

      // Handle first principles result
      if (fpResult.status === "fulfilled") {
        const { data: result, error } = fpResult.value;
        if (error || !result?.success) {
          const msg = result?.error || error?.message || "Analysis failed";
          if (msg.includes("Rate limit") || msg.includes("429")) {
            toast.error("Rate limit hit — please wait a moment and try again.");
          } else if (msg.includes("credits") || msg.includes("402")) {
            toast.error("AI credits exhausted — add credits in Settings → Workspace → Usage.");
          } else {
            toast.error("First principles analysis failed: " + msg);
          }
        } else {
          setData(result.analysis);
          setActiveStep("reality");
          toast.success("Disrupt analysis complete!");
          await saveToWorkspace(result.analysis);
        }
      } else {
        toast.error("Disrupt analysis failed: " + String(fpResult.reason));
      }

      // Handle patent result
      if (patentResult.status === "fulfilled") {
        const { data: patData, error: patError } = patentResult.value;
        if (!patError && patData?.success) {
          onPatentSave?.(patData.patentData);
          toast.success("Patent intelligence loaded!");
        }
      }
    } catch (err) {
      toast.error("Unexpected error: " + String(err));
    } finally {
      setLoading(false);
      setPatentLoading(false);
    }
  };

  const steps = [
    { id: "reality" as const, label: "Core Reality", icon: Eye, number: "01" },
    { id: "physical" as const, label: "Physical Form", icon: Ruler, number: "02" },
    { id: "workflow" as const, label: "User Workflow", icon: Navigation, number: "03" },
    { id: "smarttech" as const, label: "Smart Tech", icon: Cpu, number: "04" },
    { id: "assumptions" as const, label: "Assumptions", icon: Brain, number: "05" },
    { id: "flip" as const, label: "Flip the Logic", icon: FlipHorizontal, number: "06" },
    { id: "concept" as const, label: "Redesign", icon: Sparkles, number: "07" },
    { id: "ideas" as const, label: "Flipped Ideas", icon: Zap, number: "08" },
    { id: "patents" as const, label: "Patent Intel", icon: ScrollText, number: "09" },
  ];

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-6 text-center">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: "hsl(var(--primary-muted))" }}>
          <Brain size={36} style={{ color: "hsl(var(--primary))" }} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground mb-2">Disrupt Analysis</h3>
          <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
            Radical deep analysis of <strong>{product.name}</strong> — questioning physical form, user workflow friction, smart tech gaps, hidden assumptions, generating bold redesigns, flipped product ideas, and <strong>patent intelligence</strong>.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 max-w-xl">
          {[
            { icon: Ruler, label: "Physical Form" },
            { icon: Navigation, label: "User Workflow" },
            { icon: Cpu, label: "Smart Tech" },
            { icon: Sparkles, label: "Redesign" },
            { icon: ScrollText, label: "Patent Intel" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="p-3 rounded-xl text-center" style={{ background: "hsl(var(--muted))" }}>
              <Icon size={18} className="mx-auto mb-1" style={{ color: "hsl(var(--primary))" }} />
              <p className="text-[10px] font-semibold text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
        <button
          onClick={runAnalysis}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all"
          style={{ background: "hsl(var(--primary))", color: "white", opacity: loading ? 0.7 : 1 }}
        >
           {loading ? (
            <><RefreshCw size={15} className="animate-spin" /> Deconstructing {product.name}…</>
          ) : (
            <><Brain size={15} /> Run Disrupt Analysis</>
          )}
        </button>
        <p className="text-[11px] text-muted-foreground">Uses Gemini 2.5 Pro + Patent APIs · Deep analysis + patent intelligence · ~30–60s</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header + re-run */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--primary))" }}>
            <Brain size={15} style={{ color: "white" }} />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-sm">Disrupt Analysis</h3>
            <p className="text-[11px] text-muted-foreground">{product.name}</p>
          </div>
        </div>
        <button
          onClick={runAnalysis}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
          style={{ background: "hsl(var(--secondary))", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))" }}
        >
          {loading ? <RefreshCw size={11} className="animate-spin" /> : <RefreshCw size={11} />}
          Re-run
        </button>
      </div>

      {/* Step nav */}
      {(() => {
        const STEP_COLORS: Record<string, string> = {
          reality: "hsl(var(--primary))",
          physical: "hsl(200 80% 50%)",
          workflow: "hsl(142 70% 40%)",
          smarttech: "hsl(35 90% 50%)",
          assumptions: "hsl(271 81% 55%)",
          flip: "hsl(350 80% 55%)",
          concept: "hsl(180 70% 40%)",
          ideas: "hsl(38 92% 50%)",
          patents: "hsl(271 81% 55%)",
        };
        return (
        <div className="grid grid-cols-3 sm:grid-cols-9 gap-2">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const isActive = activeStep === s.id;
            const color = STEP_COLORS[s.id] || "hsl(var(--primary))";
            return (
              <button
                key={s.id}
                onClick={() => setActiveStep(s.id)}
                className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl text-xs font-bold transition-all relative"
                style={{
                  background: isActive ? color : "hsl(var(--muted))",
                  color: isActive ? "white" : "hsl(var(--foreground) / 0.7)",
                  border: isActive ? `2px solid ${color}` : "2px solid hsl(var(--border))",
                  boxShadow: isActive ? `0 4px 12px -2px ${color}50` : "none",
                  transform: isActive ? "scale(1.03)" : "scale(1)",
                }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: isActive ? "hsl(0 0% 100% / 0.25)" : `${color}20` }}>
                  <Icon size={16} style={{ color: isActive ? "white" : color }} />
                </div>
                <span className="text-center leading-tight text-[10px]">{s.label}</span>
                {!isActive && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full animate-pulse" style={{ background: color }} />
                )}
              </button>
            );
          })}
        </div>
        );
      })()}

      {/* STEP 1: Core Reality */}
      {activeStep === "reality" && (
        <div className="space-y-5">
          <div className="p-5 rounded-xl" style={{ background: "hsl(var(--primary-muted))", borderLeft: "4px solid hsl(var(--primary))" }}>
            <p className="section-label text-[10px] mb-2 flex items-center gap-1" style={{ color: "hsl(var(--primary))" }}>
              <Lightbulb size={11} /> The Real Problem Being Solved
            </p>
            <p className="text-sm text-foreground leading-relaxed font-medium">{data.coreReality.trueProblem}</p>
          </div>
          <div className="p-5 rounded-xl" style={{ background: "hsl(var(--muted))" }}>
            <p className="section-label text-[10px] mb-2 flex items-center gap-1"><Eye size={11} /> How People Actually Use It</p>
            <p className="text-sm text-foreground/80 leading-relaxed">{data.coreReality.actualUsage}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="section-label text-[10px] mb-3 flex items-center gap-1">
                <ShieldAlert size={11} style={{ color: "hsl(var(--destructive))" }} /> Normalized Frustrations
              </p>
              <div className="space-y-2">
                {data.coreReality.normalizedFrustrations.map((f, i) => (
                  <div key={i} className="flex gap-2 items-start p-3 rounded-lg text-xs leading-relaxed"
                    style={{ background: "hsl(var(--destructive) / 0.06)", border: "1px solid hsl(var(--destructive) / 0.2)" }}>
                    <AlertTriangle size={11} style={{ color: "hsl(var(--destructive))", flexShrink: 0, marginTop: 1 }} />
                    <span className="text-foreground/80">{f}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="section-label text-[10px] mb-3 flex items-center gap-1">
                <Wrench size={11} style={{ color: "hsl(38 92% 50%)" }} /> Workarounds & Hacks People Create
              </p>
              <div className="space-y-2">
                {data.coreReality.userHacks.map((h, i) => (
                  <div key={i} className="flex gap-2 items-start p-3 rounded-lg text-xs leading-relaxed"
                    style={{ background: "hsl(38 92% 50% / 0.07)", border: "1px solid hsl(38 92% 50% / 0.25)" }}>
                    <ChevronRight size={11} style={{ color: "hsl(38 92% 45%)", flexShrink: 0, marginTop: 1 }} />
                    <span className="text-foreground/80">{h}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <button onClick={() => setActiveStep("physical")} className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg"
            style={{ background: "hsl(var(--primary))", color: "white" }}>
            Next: Physical Form Analysis <ArrowRight size={12} />
          </button>
        </div>
      )}

      {/* STEP 2: Physical Dimensions */}
      {activeStep === "physical" && data.physicalDimensions && (
        <div className="space-y-5">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Questioning every physical property — size, weight, shape, rigidity. Nothing is sacred.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: Ruler, label: "Why This Size?", text: data.physicalDimensions.sizeAnalysis },
              { icon: Move, label: "Why This Weight?", text: data.physicalDimensions.weightAnalysis },
              { icon: Maximize2, label: "Why This Form Factor?", text: data.physicalDimensions.formFactorAnalysis },
              { icon: Zap, label: "Static vs Dynamic", text: data.physicalDimensions.staticVsDynamic },
            ].map(({ icon: Icon, label, text }) => (
              <div key={label} className="p-4 rounded-xl space-y-2" style={{ background: "hsl(var(--muted))" }}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Icon size={11} style={{ color: "hsl(var(--primary))" }} /> {label}
                </p>
                <p className="text-xs text-foreground/80 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>

          {data.physicalDimensions.ergonomicGaps?.length > 0 && (
            <div>
              <p className="section-label text-[10px] mb-3 flex items-center gap-1">
                <AlertTriangle size={11} style={{ color: "hsl(var(--destructive))" }} /> Ergonomic Gaps — Where It Fights the Body
              </p>
              <div className="space-y-2">
                {data.physicalDimensions.ergonomicGaps.map((gap, i) => (
                  <div key={i} className="flex gap-2 items-start p-3 rounded-lg text-xs"
                    style={{ background: "hsl(var(--destructive) / 0.06)", border: "1px solid hsl(var(--destructive) / 0.2)" }}>
                    <AlertTriangle size={11} style={{ color: "hsl(var(--destructive))", flexShrink: 0, marginTop: 1 }} />
                    <span className="text-foreground/80 leading-relaxed">{gap}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.physicalDimensions.dimensionOpportunities?.length > 0 && (
            <div>
              <p className="section-label text-[10px] mb-3 flex items-center gap-1">
                <Lightbulb size={11} style={{ color: "hsl(142 70% 40%)" }} /> Bold Opportunities from Rethinking Dimensions
              </p>
              <div className="space-y-2">
                {data.physicalDimensions.dimensionOpportunities.map((opp, i) => (
                  <div key={i} className="flex gap-2 items-start p-3 rounded-lg text-xs"
                    style={{ background: "hsl(142 70% 45% / 0.07)", border: "1px solid hsl(142 70% 45% / 0.25)" }}>
                    <CheckCircle2 size={11} style={{ color: "hsl(142 70% 40%)", flexShrink: 0, marginTop: 1 }} />
                    <span className="text-foreground/80 leading-relaxed font-medium">{opp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={() => setActiveStep("workflow")} className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg"
            style={{ background: "hsl(var(--primary))", color: "white" }}>
            Next: User Workflow <ArrowRight size={12} />
          </button>
        </div>
      )}

      {/* STEP 3: User Workflow */}
      {activeStep === "workflow" && data.userWorkflow && (
        <div className="space-y-5">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Mapping every step the user takes — before, during, after. Every friction point is a design opportunity.
          </p>

          {/* Step-by-step flow */}
          <div>
            <p className="section-label text-[10px] mb-3 flex items-center gap-1">
              <Navigation size={11} style={{ color: "hsl(var(--primary))" }} /> Step-by-Step User Journey
            </p>
            <div className="flex flex-col gap-0">
              {data.userWorkflow.stepByStep.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0"
                      style={{ background: "hsl(var(--primary))", color: "white" }}>{i + 1}</span>
                    {i < data.userWorkflow.stepByStep.length - 1 && (
                      <div className="w-0.5 h-4 mt-1" style={{ background: "hsl(var(--primary) / 0.25)" }} />
                    )}
                  </div>
                  <p className="text-xs text-foreground/80 leading-relaxed pb-3">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Friction Points */}
          {data.userWorkflow.frictionPoints?.length > 0 && (
            <div>
              <p className="section-label text-[10px] mb-3 flex items-center gap-1">
                <AlertTriangle size={11} style={{ color: "hsl(var(--destructive))" }} /> Friction Points — Where Users Struggle
              </p>
              <div className="space-y-3">
                {data.userWorkflow.frictionPoints.map((fp, i) => {
                  const col = SEVERITY_COLORS[fp.severity] || SEVERITY_COLORS.medium;
                  return (
                    <div key={i} className="p-4 rounded-xl" style={{ background: col.bg, border: `1px solid ${col.border}` }}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: col.text }}>{fp.step}</p>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: col.bg, color: col.text, border: `1px solid ${col.border}` }}>
                          {fp.severity}
                        </span>
                      </div>
                      <p className="text-xs text-foreground/80 leading-relaxed mb-1">{fp.friction}</p>
                      <p className="text-[10px] text-muted-foreground italic">Root cause: {fp.rootCause}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl space-y-2" style={{ background: "hsl(var(--muted))" }}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Brain size={11} /> Cognitive Load
              </p>
              <p className="text-xs text-foreground/80 leading-relaxed">{data.userWorkflow.cognitiveLoad}</p>
            </div>
            <div className="p-4 rounded-xl space-y-2" style={{ background: "hsl(var(--muted))" }}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Eye size={11} /> Context of Use
              </p>
              <p className="text-xs text-foreground/80 leading-relaxed">{data.userWorkflow.contextOfUse}</p>
            </div>
          </div>

          {data.userWorkflow.workflowOptimizations?.length > 0 && (
            <div>
              <p className="section-label text-[10px] mb-3 flex items-center gap-1">
                <Zap size={11} style={{ color: "hsl(142 70% 40%)" }} /> Concrete Workflow Optimizations
              </p>
              <div className="space-y-2">
                {data.userWorkflow.workflowOptimizations.map((opt, i) => (
                  <div key={i} className="flex gap-2 items-start p-3 rounded-lg text-xs"
                    style={{ background: "hsl(142 70% 45% / 0.07)", border: "1px solid hsl(142 70% 45% / 0.25)" }}>
                    <CheckCircle2 size={11} style={{ color: "hsl(142 70% 40%)", flexShrink: 0, marginTop: 1 }} />
                    <span className="text-foreground/80 leading-relaxed">{opt}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button onClick={() => setActiveStep("smarttech")} className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg"
            style={{ background: "hsl(var(--primary))", color: "white" }}>
            Next: Smart Tech Analysis <ArrowRight size={12} />
          </button>
        </div>
      )}

      {/* STEP 4: Smart Tech */}
      {activeStep === "smarttech" && data.smartTechAnalysis && (
        <div className="space-y-5">
          <div className="p-4 rounded-xl" style={{ background: "hsl(var(--muted))" }}>
            <p className="section-label text-[10px] mb-2 flex items-center gap-1">
              <Cpu size={11} style={{ color: "hsl(271 81% 50%)" }} /> Current Technology Level
            </p>
            <p className="text-xs text-foreground/80 leading-relaxed">{data.smartTechAnalysis.currentTechLevel}</p>
          </div>

          {data.smartTechAnalysis.missedOpportunities?.length > 0 && (
            <div>
              <p className="section-label text-[10px] mb-3 flex items-center gap-1">
                <Wifi size={11} style={{ color: "hsl(var(--primary))" }} /> Missed Smart Tech Opportunities
              </p>
              <div className="space-y-3">
                {data.smartTechAnalysis.missedOpportunities.map((opp, i) => (
                  <div key={i} className="p-4 rounded-xl" style={{ background: "hsl(271 81% 56% / 0.07)", border: "1px solid hsl(271 81% 56% / 0.2)" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold"
                        style={{ background: "hsl(271 81% 56% / 0.15)", color: "hsl(271 81% 40%)" }}>{opp.tech}</span>
                    </div>
                    <p className="text-xs font-semibold text-foreground/90 mb-1">{opp.application}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{opp.valueCreated}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl space-y-2" style={{ background: "hsl(var(--muted))" }}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <AlertTriangle size={11} /> Why It Hasn't Happened Yet
              </p>
              <p className="text-xs text-foreground/80 leading-relaxed">{data.smartTechAnalysis.whyNotAlreadyDone}</p>
            </div>
            <div className="p-4 rounded-xl space-y-2" style={{ background: "hsl(var(--primary-muted))", borderLeft: "3px solid hsl(var(--primary))" }}>
              <p className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1" style={{ color: "hsl(var(--primary))" }}>
                <Zap size={11} /> Highest-Leverage Integration
              </p>
              <p className="text-xs text-foreground/80 leading-relaxed">{data.smartTechAnalysis.recommendedIntegration}</p>
            </div>
          </div>

          <button onClick={() => setActiveStep("assumptions")} className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg"
            style={{ background: "hsl(var(--primary))", color: "white" }}>
            Next: Hidden Assumptions <ArrowRight size={12} />
          </button>
        </div>
      )}

      {/* STEP 5: Hidden Assumptions */}
      {activeStep === "assumptions" && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Every design choice is built on assumptions. Most are never questioned. Here's what's holding this product back.
          </p>
          <div className="space-y-3">
            {data.hiddenAssumptions.map((a, i) => {
              const reasonStyle = REASON_COLORS[a.reason] || REASON_COLORS.habit;
              return (
                <div key={i} className="p-4 rounded-xl"
                  style={{ background: a.isChallengeable ? "hsl(var(--card))" : "hsl(var(--muted))", border: `1px solid ${a.isChallengeable ? "hsl(var(--primary) / 0.2)" : "hsl(var(--border))"}` }}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0"
                        style={{ background: "hsl(var(--primary))", color: "white" }}>{i + 1}</span>
                      <p className="text-xs font-bold text-foreground">{a.assumption}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                        style={{ background: reasonStyle.bg, color: reasonStyle.text }}>{reasonStyle.label}</span>
                      {a.isChallengeable ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "hsl(142 70% 45% / 0.12)", color: "hsl(142 70% 30%)" }}>
                          ✦ Challengeable
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>
                          Physics-constrained
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed ml-8 mb-2">{a.currentAnswer}</p>
                  {a.challengeIdea && (
                    <div className="ml-8 p-2 rounded-lg text-xs" style={{ background: "hsl(var(--primary-muted))", borderLeft: "3px solid hsl(var(--primary))" }}>
                      <span className="font-bold" style={{ color: "hsl(var(--primary))" }}>Challenge: </span>
                      <span className="text-foreground/80">{a.challengeIdea}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <button onClick={() => setActiveStep("flip")} className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg"
            style={{ background: "hsl(var(--primary))", color: "white" }}>
            Next: Flip the Logic <ArrowRight size={12} />
          </button>
        </div>
      )}

      {/* STEP 6: Flip the Logic */}
      {activeStep === "flip" && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Taking the most limiting assumptions and inverting them. These aren't tweaks — they're structural breaks.
          </p>
          {data.flippedLogic.map((item, i) => (
            <div key={i} className="rounded-xl overflow-hidden" style={{ border: "1px solid hsl(var(--primary) / 0.2)" }}>
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr]">
                <div className="p-4" style={{ background: "hsl(var(--muted))" }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Current Assumption</p>
                  <p className="text-xs text-foreground/80 leading-relaxed">{item.originalAssumption}</p>
                </div>
                <div className="flex items-center justify-center px-3 py-4" style={{ background: "hsl(var(--primary))" }}>
                  <FlipHorizontal size={16} style={{ color: "white" }} />
                </div>
                <div className="p-4" style={{ background: "hsl(var(--primary-muted))" }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "hsl(var(--primary))" }}>Bold Alternative</p>
                  <p className="text-xs font-semibold leading-relaxed" style={{ color: "hsl(var(--primary-dark))" }}>{item.boldAlternative}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-t" style={{ borderColor: "hsl(var(--border))" }}>
                <div className="p-4 border-r" style={{ borderColor: "hsl(var(--border))" }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Why It Creates Value</p>
                  <p className="text-xs text-foreground/70 leading-relaxed">{item.rationale}</p>
                </div>
                <div className="p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Physical Mechanism</p>
                  <p className="text-xs text-foreground/70 leading-relaxed">{item.physicalMechanism}</p>
                </div>
              </div>
            </div>
          ))}
          <button onClick={() => setActiveStep("concept")} className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg"
            style={{ background: "hsl(var(--primary))", color: "white" }}>
            Next: Redesigned Concept <ArrowRight size={12} />
          </button>
        </div>
      )}

      {/* STEP 7: Redesigned Concept */}
      {activeStep === "concept" && (
        <div className="space-y-5">
          <div className="p-6 rounded-2xl relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-dark)) 100%)", color: "white" }}>
            <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full opacity-10" style={{ background: "white" }} />
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} />
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Redesigned Concept</span>
              </div>
              <h2 className="text-2xl font-black mb-1">{data.redesignedConcept.conceptName}</h2>
              <p className="text-sm opacity-85 font-medium mb-4">{data.redesignedConcept.tagline}</p>
              <p className="text-xs leading-relaxed opacity-80 max-w-2xl">{data.redesignedConcept.coreInsight}</p>
            </div>
          </div>

          {/* Radical differences */}
          <div>
            <p className="section-label text-[10px] mb-3 flex items-center gap-1">
              <Flame size={11} style={{ color: "hsl(var(--primary))" }} /> What Makes It Radically Different
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {data.redesignedConcept.radicalDifferences.map((d, i) => (
                <div key={i} className="flex gap-2 items-start p-3 rounded-lg text-xs"
                  style={{ background: "hsl(var(--primary-muted))", border: "1px solid hsl(var(--primary) / 0.2)" }}>
                  <CheckCircle2 size={12} style={{ color: "hsl(var(--primary))", flexShrink: 0, marginTop: 1 }} />
                  <span className="text-foreground/85 leading-relaxed font-medium">{d}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Physical + Size + Materials + Smart Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-4 rounded-xl space-y-2" style={{ background: "hsl(var(--muted))" }}>
              <p className="section-label text-[10px] flex items-center gap-1"><Package size={11} /> Physical Form</p>
              <p className="text-xs text-foreground/80 leading-relaxed">{data.redesignedConcept.physicalDescription}</p>
              {data.redesignedConcept.sizeAndWeight && (
                <div className="mt-2 p-2 rounded-lg" style={{ background: "hsl(var(--primary-muted))" }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1" style={{ color: "hsl(var(--primary))" }}>
                    <Ruler size={9} /> Size & Weight
                  </p>
                  <p className="text-xs text-foreground/80">{data.redesignedConcept.sizeAndWeight}</p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-xl space-y-2" style={{ background: "hsl(var(--muted))" }}>
                <p className="section-label text-[10px] flex items-center gap-1"><Zap size={11} /> Materials & Why</p>
                <div className="space-y-1.5">
                  {data.redesignedConcept.materials.map((m, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                      <span className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-bold mt-0.5"
                        style={{ background: "hsl(var(--primary))", color: "white" }}>{i + 1}</span>
                      {m}
                    </div>
                  ))}
                </div>
              </div>

              {data.redesignedConcept.smartFeatures?.length > 0 && (
                <div className="p-4 rounded-xl space-y-2" style={{ background: "hsl(271 81% 56% / 0.07)", border: "1px solid hsl(271 81% 56% / 0.2)" }}>
                  <p className="section-label text-[10px] flex items-center gap-1" style={{ color: "hsl(271 81% 40%)" }}>
                    <Cpu size={11} /> Smart Features
                  </p>
                  <div className="space-y-1.5">
                    {data.redesignedConcept.smartFeatures.map((f, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                        <Wifi size={10} style={{ color: "hsl(271 81% 45%)", flexShrink: 0, marginTop: 1 }} />
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Friction Eliminated */}
          {data.redesignedConcept.frictionEliminated?.length > 0 && (
            <div>
              <p className="section-label text-[10px] mb-3 flex items-center gap-1">
                <CheckCircle2 size={11} style={{ color: "hsl(142 70% 40%)" }} /> Friction Points Eliminated
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {data.redesignedConcept.frictionEliminated.map((f, i) => (
                  <div key={i} className="flex gap-2 items-start p-3 rounded-lg text-xs"
                    style={{ background: "hsl(142 70% 45% / 0.07)", border: "1px solid hsl(142 70% 45% / 0.25)" }}>
                    <CheckCircle2 size={11} style={{ color: "hsl(142 70% 40%)", flexShrink: 0, marginTop: 1 }} />
                    <span className="text-foreground/80 leading-relaxed">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* UX Transformation */}
          <div className="p-5 rounded-xl" style={{ background: "hsl(142 70% 45% / 0.07)", borderLeft: "4px solid hsl(142 70% 45%)" }}>
            <p className="section-label text-[10px] mb-2 flex items-center gap-1" style={{ color: "hsl(142 70% 30%)" }}>
              <Users size={11} /> User Experience Transformation
            </p>
            <p className="text-sm text-foreground/85 leading-relaxed">{data.redesignedConcept.userExperienceTransformation}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl" style={{ background: "hsl(271 81% 56% / 0.07)", border: "1px solid hsl(271 81% 56% / 0.2)" }}>
              <p className="section-label text-[10px] mb-2 flex items-center gap-1" style={{ color: "hsl(271 81% 40%)" }}>
                <Brain size={11} /> Why It Hasn't Been Done
              </p>
              <p className="text-xs text-foreground/80 leading-relaxed">{data.redesignedConcept.whyItHasntBeenDone}</p>
            </div>
            <div className="p-4 rounded-xl" style={{ background: "hsl(var(--destructive) / 0.06)", border: "1px solid hsl(var(--destructive) / 0.2)" }}>
              <p className="section-label text-[10px] mb-2 flex items-center gap-1" style={{ color: "hsl(var(--destructive))" }}>
                <AlertTriangle size={11} /> Biggest Risk
              </p>
              <p className="text-xs text-foreground/80 leading-relaxed">{data.redesignedConcept.biggestRisk}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl space-y-1" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
              <p className="section-label text-[10px] flex items-center gap-1"><Factory size={11} /> Manufacturing Path</p>
              <p className="text-xs text-foreground/80 leading-relaxed">{data.redesignedConcept.manufacturingPath}</p>
            </div>
            <div className="p-4 rounded-xl space-y-1" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
              <p className="section-label text-[10px] flex items-center gap-1"><DollarSign size={11} /> Price Point</p>
              <p className="text-xs text-foreground/80 leading-relaxed">{data.redesignedConcept.pricePoint}</p>
            </div>
            <div className="p-4 rounded-xl space-y-1" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
              <p className="section-label text-[10px] flex items-center gap-1"><Users size={11} /> Target Buyer</p>
              <p className="text-xs text-foreground/80 leading-relaxed">{data.redesignedConcept.targetUser}</p>
            </div>
          </div>
        </div>
      )}

      {/* STEP 8: Flipped Ideas */}
      {activeStep === "ideas" && (
        <div className="space-y-5">
          <p className="text-xs text-muted-foreground leading-relaxed">
            AI-generated product reinvention ideas ranked by viability — add your own context below to steer the AI, then regenerate.
          </p>

          {/* User context input */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Lightbulb size={11} style={{ color: "hsl(var(--primary))" }} /> Guide the AI (optional)
            </label>
            <textarea
              value={userContext}
              onChange={(e) => setUserContext(e.target.value)}
              placeholder="e.g. Focus on eco-friendly materials, target Gen Z audience, keep price under $30, emphasize subscription model…"
              className="w-full rounded-xl px-4 py-3 text-sm leading-relaxed resize-none transition-all focus:outline-none"
              style={{
                background: "hsl(var(--muted))",
                border: "2px dashed hsl(var(--border))",
                color: "hsl(var(--foreground))",
                minHeight: "80px",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "hsl(var(--primary))"; e.currentTarget.style.borderStyle = "solid"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "hsl(var(--border))"; e.currentTarget.style.borderStyle = "dashed"; }}
            />
            <p className="text-[10px] text-muted-foreground">Share your goals, target audience, price range, materials preference, or any feedback on existing ideas.</p>
          </div>

          {flippedIdeas && flippedIdeas.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <p className="section-label text-[10px] flex items-center gap-1">
                  <Zap size={12} /> Flipped Product Ideas (Ranked)
                </p>
                {onRegenerateIdeas && (
                  <button
                    onClick={() => onRegenerateIdeas(userContext || undefined)}
                    disabled={generatingIdeas}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: "hsl(var(--primary-muted))",
                      color: "hsl(var(--primary))",
                      border: "1px solid hsl(var(--primary) / 0.3)",
                    }}
                  >
                    {generatingIdeas ? (
                      <><RefreshCw size={11} className="animate-spin" /> Generating…</>
                    ) : (
                      <><Sparkles size={11} /> Regenerate with AI</>
                    )}
                  </button>
                )}
              </div>
              <div className="space-y-4">
                {flippedIdeas.map((idea, i) => (
                  <FlippedIdeaCard key={`${idea.name}-${i}`} idea={idea} rank={i + 1} productName={product.name} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-sm text-muted-foreground">
              No flipped ideas available yet. Run the intelligence report first to generate ideas.
            </div>
          )}
        </div>
      )}

      {/* STEP 9: Patent Intelligence */}
      {activeStep === "patents" && (
        <div className="space-y-4">
          {product.patentData && (
            <div className="flex justify-end">
              <button
                onClick={() => downloadPatentPDF(product, product.patentData)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                style={{ background: "hsl(271 81% 55%)", color: "white" }}
              >
                <FileDown size={14} />
                Download Patent PDF
              </button>
            </div>
          )}
          <PatentIntelligence
            product={product}
            onSave={(patentData) => {
              onPatentSave?.(patentData);
            }}
          />
        </div>
      )}
    </div>
  );
};
