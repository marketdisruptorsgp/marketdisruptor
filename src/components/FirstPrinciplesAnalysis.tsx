import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { Product, FlippedIdea } from "@/data/mockProducts";
import { FlippedIdeaCard } from "@/components/FlippedIdeaCard";
import { DataLabel } from "@/components/DataLabel";
import { LeverageScore } from "@/components/LeverageScore";
import { RiskBadge } from "@/components/RiskBadge";
import { PatentIntelligence } from "@/components/PatentIntelligence";
import { downloadPatentPDF } from "@/lib/pdfExport";
import { StepLoadingTracker, DISRUPT_TASKS } from "@/components/StepLoadingTracker";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import {
  Brain, Flame, Zap, ChevronRight, ChevronDown, RefreshCw, AlertTriangle, CheckCircle2,
  Wrench, Lightbulb, Package, DollarSign, Users, Factory, FlipHorizontal,
  Eye, ArrowRight, Sparkles, ShieldAlert, Cpu, Ruler, Move, Navigation, Shield,
  Maximize2, Wifi, ScrollText, FileDown, Swords,
} from "lucide-react";
import { InsightRating } from "./InsightRating";
import { SectionWorkflowNav } from "@/components/SectionNav";

const DISRUPT_SECTION_DESCRIPTIONS: Record<string, string> = {
  assumptions: "Hidden assumptions & challenge ideas",
  flip: "Inverted logic & bold alternatives",
  ideas: "Flipped product ideas & innovations",
};

// ── Exported section descriptions for Intel Report tabs ──
export const INTEL_SECTION_DESCRIPTIONS: Record<string, string> = {
  reality: "True problem, actual usage & user hacks",
  physical: "Size, weight, form factor & ergonomic gaps",
  workflow: "Step-by-step journey & friction points",
};

// ── Exported section descriptions for Redesign step ──
export const REDESIGN_SECTION_DESCRIPTIONS: Record<string, string> = {
  concept: "Redesigned concept & radical differences",
};

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
  leverageScore?: number;
  dataLabel?: string;
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
  riskLevel?: string;
  capitalRequired?: string;
}

interface CurrentStrengths {
  whatWorks: string[];
  competitiveAdvantages: string[];
  keepVsAdapt: string;
}

export interface FirstPrinciplesData {
  currentStrengths?: CurrentStrengths;
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
  externalData?: unknown;
  onDataLoaded?: (data: unknown) => void;
  renderMode?: "disrupt" | "redesign";
}

const REASON_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  tradition: { bg: "hsl(38 92% 50% / 0.1)", text: "hsl(38 92% 35%)", label: "Tradition" },
  manufacturing: { bg: "hsl(217 91% 60% / 0.1)", text: "hsl(217 91% 40%)", label: "Mfg Limits" },
  cost: { bg: "hsl(142 70% 45% / 0.1)", text: "hsl(142 70% 30%)", label: "Cost" },
  physics: { bg: "hsl(271 81% 56% / 0.1)", text: "hsl(271 81% 40%)", label: "Physics" },
  habit: { bg: "hsl(330 80% 55% / 0.1)", text: "hsl(330 80% 40%)", label: "Habit" },
};

/* ── Interactive Workflow Timeline — neutral, no severity colors ──────────────────────── */
export function WorkflowTimeline({ steps, frictionPoints }: { steps: string[]; frictionPoints: WorkflowFriction[] }) {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const getFriction = (stepName: string): WorkflowFriction | undefined => {
    return frictionPoints?.find(fp =>
      stepName.toLowerCase().includes(fp.step.toLowerCase()) ||
      fp.step.toLowerCase().includes(stepName.toLowerCase().slice(0, 12))
    );
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:overflow-x-auto sm:pb-2 gap-0">
        {steps.slice(0, 8).map((step, i) => {
          const friction = getFriction(step);
          const isExpanded = expandedStep === i;
          const isLast = i === Math.min(steps.length, 8) - 1;

          return (
            <div key={i} className="flex sm:flex-col sm:items-center relative sm:min-w-[140px]">
              {/* Mobile: vertical timeline */}
              <div className="flex sm:hidden items-start gap-3 w-full">
                <div className="flex flex-col items-center flex-shrink-0 pt-0.5">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-extrabold z-10 transition-all"
                    style={{
                      background: isExpanded ? "hsl(var(--primary))" : "hsl(var(--foreground))",
                      color: isExpanded ? "white" : "hsl(var(--background))",
                    }}
                  >
                    {i + 1}
                  </div>
                  {!isLast && (
                    <div className="w-[2px] flex-1 min-h-[24px]" style={{ background: "hsl(var(--border))" }} />
                  )}
                </div>
                <button
                  onClick={() => setExpandedStep(isExpanded ? null : i)}
                  className="flex-1 text-left rounded-lg p-2.5 mb-2 transition-all"
                  style={{
                    background: isExpanded ? "hsl(var(--primary) / 0.04)" : "hsl(var(--muted))",
                    border: isExpanded ? "1.5px solid hsl(var(--primary))" : "1px solid hsl(var(--border))",
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-foreground leading-tight">{step}</p>
                    {friction && <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: "hsl(var(--muted-foreground))" }} />}
                  </div>
                  {isExpanded && friction && (
                    <div className="mt-2 space-y-1.5">
                      <p className="text-[11px] text-foreground/80 leading-relaxed">{friction.friction}</p>
                      {friction.rootCause && (
                        <p className="text-[10px] text-muted-foreground"><span className="font-bold">Root cause:</span> {friction.rootCause}</p>
                      )}
                    </div>
                  )}
                </button>
              </div>

              {/* Desktop: horizontal pipeline */}
              <div className="hidden sm:flex sm:flex-col sm:items-center sm:w-full">
                <div className="flex items-center w-full">
                  {i > 0 ? <div className="h-[2px] flex-1" style={{ background: "hsl(var(--border))" }} /> : <div className="flex-1" />}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-extrabold z-10 flex-shrink-0 transition-all"
                    style={{
                      background: isExpanded ? "hsl(var(--primary))" : "hsl(var(--foreground))",
                      color: isExpanded ? "white" : "hsl(var(--background))",
                      transform: isExpanded ? "scale(1.15)" : "scale(1)",
                    }}
                  >
                    {i + 1}
                  </div>
                  {!isLast ? <div className="h-[2px] flex-1" style={{ background: "hsl(var(--border))" }} /> : <div className="flex-1" />}
                </div>
                <button
                  onClick={() => setExpandedStep(isExpanded ? null : i)}
                  className="mt-2 w-full text-left rounded-lg p-2.5 transition-all cursor-pointer"
                  style={{
                    background: isExpanded ? "hsl(var(--primary) / 0.04)" : "hsl(var(--muted))",
                    border: isExpanded ? "1.5px solid hsl(var(--primary))" : "1px solid hsl(var(--border))",
                    transform: isExpanded ? "scale(1.03)" : "scale(1)",
                  }}
                >
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-[10px] font-bold text-foreground leading-tight">{step}</p>
                    {friction && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "hsl(var(--muted-foreground))" }} />}
                  </div>
                  {isExpanded && friction && (
                    <div className="mt-2 space-y-1">
                      <p className="text-[11px] text-foreground/80 leading-relaxed">{friction.friction}</p>
                      {friction.rootCause && (
                        <p className="text-[10px] text-muted-foreground"><span className="font-bold">Root cause:</span> {friction.rootCause}</p>
                      )}
                    </div>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Collapsible detail panel — CLEAN ──────────────────────── */
function DetailPanel({ title, icon: Icon, children, defaultOpen = false }: { title: string; icon: React.ElementType; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-lg text-left transition-all group"
        style={{
          background: open ? "hsl(var(--muted))" : "hsl(var(--card))",
          border: "1px solid hsl(var(--border))",
        }}
      >
        <span className="flex items-center gap-2 text-xs font-bold text-foreground">
          <Icon size={14} className="text-muted-foreground" />
          {title}
        </span>
        <ChevronDown size={16} className="transition-transform text-muted-foreground" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }} />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pt-3 pb-1">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

/* ── Section progress + Next button ────────────────── */
function SectionHeader({ current, total, label, icon: Icon }: { current: number; total: number; label: string; icon: React.ElementType }) {
  return (
    <div className="flex items-center justify-between pb-3 mb-4" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--primary))" }}>
          <Icon size={14} style={{ color: "white" }} />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground leading-tight">{label}</p>
          <p className="text-[10px] text-muted-foreground font-medium">Section {current} of {total}</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {Array.from({ length: total }, (_, i) => (
          <div key={i} className="rounded-full transition-all" style={{
            width: i + 1 === current ? 16 : 6,
            height: 6,
            background: i + 1 <= current ? "hsl(var(--primary))" : "hsl(var(--border))",
            borderRadius: 999,
          }} />
        ))}
      </div>
    </div>
  );
}

function NextSectionButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-center gap-2 text-sm font-bold px-5 py-3.5 rounded-lg transition-colors mt-6"
      style={{ background: "hsl(var(--primary))", color: "white" }}
    >
      Next: {label} <ArrowRight size={14} />
    </button>
  );
}

export const FirstPrinciplesAnalysis = ({ product, onSaved, flippedIdeas, onRegenerateIdeas, generatingIdeas, onPatentSave, externalData, onDataLoaded, renderMode, userScores, onScoreChange }: FirstPrinciplesAnalysisProps & { onSaved?: () => void; userScores?: Record<string, Record<string, number>>; onScoreChange?: (ideaId: string, scoreKey: string, value: number) => void }) => {
  const scrollToSteps = () => setTimeout(() => document.querySelector('[data-fp-steps]')?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  const { user } = useAuth();
  const [data, setData] = useState<FirstPrinciplesData | null>((externalData as FirstPrinciplesData) || null);
  const [loading, setLoading] = useState(false);
  const isService = product.category === "Service";
  const [activeStep, setActiveStep] = useState<"assumptions" | "flip" | "ideas">("assumptions");
  const [visitedFPSteps, setVisitedFPSteps] = useState<Set<string>>(new Set(["assumptions"]));
  const [userContext, setUserContext] = useState("");
  const [rerunSuggestions, setRerunSuggestions] = useState("");

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
    try {
      const { data: result, error } = await supabase.functions.invoke("first-principles-analysis", {
        body: { product, userSuggestions: rerunSuggestions || undefined },
      });

      if (error || !result?.success) {
        const msg = result?.error || error?.message || "Analysis failed";
        if (msg.includes("Rate limit") || msg.includes("429")) {
          toast.error("Rate limit hit — please wait a moment and try again.");
        } else if (msg.includes("credits") || msg.includes("402")) {
          toast.error("AI credits exhausted — add credits in Settings → Workspace → Usage.");
        } else {
          toast.error("First principles analysis failed: " + msg);
        }
        return;
      }

      setData(result.analysis);
      onDataLoaded?.(result.analysis);
      setActiveStep("assumptions");
      toast.success("Disrupt analysis complete!");
      await saveToWorkspace(result.analysis);
    } catch (err) {
      toast.error("Unexpected error: " + String(err));
    } finally {
      setLoading(false);
    }
  };

  const allSteps = [
    { id: "assumptions" as const, label: "Assumptions", icon: Brain },
    { id: "flip" as const, label: "Flip the Logic", icon: FlipHorizontal },
    { id: "ideas" as const, label: "Flipped Ideas", icon: Zap },
  ];
  const totalSections = allSteps.length;
  const currentSectionIdx = allSteps.findIndex(s => s.id === activeStep);
  const currentSectionNum = currentSectionIdx + 1;
  const nextStep = currentSectionIdx < allSteps.length - 1 ? allSteps[currentSectionIdx + 1] : null;

  const goNext = () => {
    if (!nextStep) return;
    setActiveStep(nextStep.id);
    setVisitedFPSteps(prev => new Set([...prev, nextStep.id]));
    scrollToSteps();
  };

  if (!data && loading) {
    return (
      <StepLoadingTracker
        title="Building Disrupt Analysis"
        tasks={DISRUPT_TASKS}
        estimatedSeconds={50}
        accentColor="hsl(271 81% 55%)"
      />
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-6 text-center">
        <div className="w-20 h-20 rounded flex items-center justify-center" style={{ background: "hsl(var(--primary-muted))" }}>
          <Brain size={36} style={{ color: "hsl(var(--primary))" }} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground mb-2">Disrupt Analysis</h3>
          <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
            Deep analysis of <strong>{product.name}</strong> — questioning every assumption and generating radical reinvention ideas.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 max-w-sm">
          {[
            { icon: Brain, label: "Assumptions" },
            { icon: FlipHorizontal, label: "Flip Logic" },
            { icon: Zap, label: "Flipped Ideas" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="p-3 rounded text-center" style={{ background: "hsl(var(--muted))" }}>
              <Icon size={18} className="mx-auto mb-1" style={{ color: "hsl(var(--primary))" }} />
              <p className="text-[10px] font-semibold text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
        <button
          onClick={runAnalysis}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 rounded font-bold text-sm transition-colors"
          style={{ background: "hsl(var(--primary))", color: "white", opacity: loading ? 0.7 : 1 }}
        >
          <Brain size={15} /> Run Disrupt Analysis
        </button>
        <p className="text-[11px] text-muted-foreground">
          Uses Gemini 2.5 Pro · Deep analysis · ~30–60s
        </p>
      </div>
    );
  }

  // ── REDESIGN MODE ──
  if (renderMode === "redesign") {
    const concept = data.redesignedConcept;
    if (!concept) {
      return (
        <div className="py-12 text-center">
          <Sparkles size={32} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm text-muted-foreground">Run the Disrupt analysis first to generate redesign concepts.</p>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "hsl(38 92% 50%)" }}>
              <Sparkles size={14} style={{ color: "white" }} />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-sm leading-tight">{concept.conceptName}</h3>
              <p className="text-[10px] text-muted-foreground">{concept.tagline}</p>
            </div>
          </div>
        </div>

        {/* Core insight */}
        <div className="p-4 rounded-lg" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1 text-muted-foreground">Core Insight</p>
          <p className="text-sm leading-relaxed text-foreground/85">{concept.coreInsight}</p>
        </div>

        {/* Radical Differences */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Radical Differences</p>
          <div className="space-y-1.5">
            {concept.radicalDifferences.map((diff, i) => (
              <div key={i} className="flex items-start gap-2 p-2 rounded-lg text-xs" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                <Zap size={12} style={{ color: "hsl(var(--primary))", flexShrink: 0, marginTop: 1 }} />
                <span className="text-foreground/80">{diff}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Physical Description */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 rounded-lg" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Physical Form</p>
            <p className="text-xs text-foreground/80">{concept.physicalDescription}</p>
            {concept.sizeAndWeight && <p className="text-[10px] text-muted-foreground mt-1">Size: {concept.sizeAndWeight}</p>}
          </div>
          <div className="p-3 rounded-lg" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Materials</p>
            <div className="flex flex-wrap gap-1">
              {concept.materials.map((m, i) => (
                <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-medium" style={{ background: "hsl(var(--card))", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))" }}>{m}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Smart Features */}
        {concept.smartFeatures?.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Smart Features</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {concept.smartFeatures.map((f, i) => (
                <div key={i} className="flex items-start gap-2 p-2 rounded-lg text-xs" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                  <Cpu size={11} style={{ color: "hsl(var(--primary))", flexShrink: 0, marginTop: 1 }} />
                  <span className="text-foreground/80">{f}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* UX Transformation & Friction Eliminated */}
        <div className="p-3 rounded-lg" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">User Experience Transformation</p>
          <p className="text-xs text-foreground/80 leading-relaxed">{concept.userExperienceTransformation}</p>
        </div>
        {concept.frictionEliminated?.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Friction Eliminated</p>
            <div className="space-y-1">
              {concept.frictionEliminated.map((f, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <CheckCircle2 size={11} style={{ color: "hsl(142 70% 40%)", flexShrink: 0, marginTop: 1 }} />
                  <span className="text-foreground/80">{f}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Business details */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: "Price Point", value: concept.pricePoint },
            { label: "Target User", value: concept.targetUser },
            { label: "Capital Required", value: concept.capitalRequired || "—" },
            { label: "Risk Level", value: concept.riskLevel || "—" },
          ].map((item) => (
            <div key={item.label} className="p-2 rounded-lg text-center" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{item.label}</p>
              <p className="text-xs font-bold text-foreground mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>

        <DetailPanel title="Why it hasn't been done & biggest risk" icon={ShieldAlert}>
          <div className="space-y-2 mb-2">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase mb-0.5">Why Not Already Done</p>
              <p className="text-xs text-foreground/80">{concept.whyItHasntBeenDone}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase mb-0.5">Biggest Risk</p>
              <p className="text-xs text-foreground/80">{concept.biggestRisk}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase mb-0.5">Manufacturing Path</p>
              <p className="text-xs text-foreground/80">{concept.manufacturingPath}</p>
            </div>
          </div>
        </DetailPanel>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-fp-steps>
      {/* Header + re-run (compact) */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--primary))" }}>
            <Brain size={14} style={{ color: "white" }} />
          </div>
          <div>
            <h3 className="font-bold text-foreground text-sm leading-tight">Disrupt: {product.name}</h3>
            <p className="text-[10px] text-muted-foreground">{totalSections} sections · Click any to jump</p>
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

      {/* Steer AI (collapsible) */}
      <DetailPanel title="Steer the AI — add direction, then Re-run" icon={Lightbulb}>
        <textarea
          value={rerunSuggestions}
          onChange={(e) => setRerunSuggestions(e.target.value)}
          placeholder="e.g. Focus on sustainability, explore modular design, target commercial users…"
          className="w-full rounded px-3 py-2.5 text-sm leading-relaxed resize-none transition-colors focus:outline-none mb-2"
          rows={2}
          style={{
            background: "hsl(var(--background))",
            border: "1px solid hsl(var(--border))",
            color: "hsl(var(--foreground))",
          }}
        />
      </DetailPanel>

      {/* ── Section Workflow Navigator (grid) ── */}
      <SectionWorkflowNav
        tabs={allSteps}
        activeId={activeStep}
        visitedIds={visitedFPSteps}
        onSelect={(id) => { setActiveStep(id as typeof activeStep); setVisitedFPSteps(prev => new Set([...prev, id])); scrollToSteps(); }}
        descriptions={DISRUPT_SECTION_DESCRIPTIONS}
        journeyLabel="Disrupt Analysis Journey"
      />

      {/* ═══════ SECTION CONTENT ═══════ */}

      {/* Section 1: Hidden Assumptions */}
      {activeStep === "assumptions" && (
        <div className="space-y-4">
          <SectionHeader current={currentSectionNum} total={totalSections} label="Hidden Assumptions" icon={Brain} />
          <p className="text-xs text-muted-foreground">Every design choice rests on assumptions. Here are the ones worth challenging.</p>

          <div className="space-y-2.5">
            {data.hiddenAssumptions.slice(0, 4).map((a, i) => {
              const reasonStyle = REASON_COLORS[a.reason] || REASON_COLORS.habit;
              return (
                <div key={i} className="p-3 rounded-lg" style={{ background: "hsl(var(--card))", border: `1px solid ${a.isChallengeable ? "hsl(var(--primary) / 0.2)" : "hsl(var(--border))"}` }}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-xs font-bold text-foreground flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0" style={{ background: "hsl(var(--primary))", color: "white" }}>{i + 1}</span>
                      {a.assumption}
                    </p>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold" style={{ background: reasonStyle.bg, color: reasonStyle.text }}>{reasonStyle.label}</span>
                      {a.isChallengeable && <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold" style={{ background: "hsl(142 70% 45% / 0.12)", color: "hsl(142 70% 30%)" }}>Challengeable</span>}
                      <LeverageScore score={a.leverageScore} />
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed ml-7">{a.currentAnswer}</p>
                  {a.challengeIdea && (
                    <div className="ml-7 mt-1.5 p-2 rounded text-[11px]" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                      <span className="font-bold text-foreground">Challenge: </span>
                      <span className="text-foreground/80">{a.challengeIdea}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {data.hiddenAssumptions.length > 4 && (
            <DetailPanel title={`${data.hiddenAssumptions.length - 4} more assumptions`} icon={Brain}>
              <div className="space-y-2.5 mb-2">
                {data.hiddenAssumptions.slice(4).map((a, i) => {
                  const reasonStyle = REASON_COLORS[a.reason] || REASON_COLORS.habit;
                  return (
                    <div key={i} className="p-3 rounded-lg" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
                      <p className="text-xs font-bold text-foreground mb-0.5">{a.assumption}</p>
                      <p className="text-[11px] text-muted-foreground">{a.currentAnswer}</p>
                      {a.challengeIdea && (
                        <p className="text-[11px] mt-1" style={{ color: "hsl(var(--primary))" }}>→ {a.challengeIdea}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </DetailPanel>
          )}

          {nextStep && <NextSectionButton label={nextStep.label} onClick={goNext} />}
        </div>
      )}

      {/* Section 2: Flip the Logic */}
      {activeStep === "flip" && (
        <div className="space-y-4">
          <SectionHeader current={currentSectionNum} total={totalSections} label="Flip the Logic" icon={FlipHorizontal} />

          {data.flippedLogic.map((item, i) => (
            <div key={i} className="rounded-lg overflow-hidden" style={{ border: "1px solid hsl(var(--border))" }}>
              <div className="grid grid-cols-[1fr_auto_1fr]">
                <div className="p-3" style={{ background: "hsl(var(--muted))" }}>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Assumption</p>
                  <p className="text-xs text-foreground/80 leading-relaxed">{item.originalAssumption}</p>
                </div>
                <div className="flex items-center justify-center px-2" style={{ background: "hsl(var(--primary))" }}>
                  <FlipHorizontal size={14} style={{ color: "white" }} />
                </div>
                <div className="p-3" style={{ background: "hsl(var(--primary-muted))" }}>
                  <p className="text-[9px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "hsl(var(--primary))" }}>Flip</p>
                  <p className="text-xs font-semibold leading-relaxed" style={{ color: "hsl(var(--primary-dark))" }}>{item.boldAlternative}</p>
                </div>
              </div>
              <DetailPanel title="Why it creates value & mechanism" icon={Lightbulb}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                  <div>
                    <p className="text-[9px] font-bold uppercase text-muted-foreground mb-0.5">Value Created</p>
                    <p className="text-xs text-foreground/70">{item.rationale}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase text-muted-foreground mb-0.5">Mechanism</p>
                    <p className="text-xs text-foreground/70">{item.physicalMechanism}</p>
                  </div>
                </div>
              </DetailPanel>
            </div>
          ))}

          {nextStep && <NextSectionButton label={nextStep.label} onClick={goNext} />}
        </div>
      )}

      {/* Section 3: Flipped Ideas */}
      {activeStep === "ideas" && (
        <div className="space-y-4">
          <SectionHeader current={currentSectionNum} total={totalSections} label="Flipped Ideas" icon={Zap} />

          <DetailPanel title="Steer ideas — add your goals, then regenerate" icon={Lightbulb}>
            <textarea
              value={userContext}
              onChange={(e) => setUserContext(e.target.value)}
              placeholder="e.g. Focus on eco-friendly materials, target Gen Z, keep under $30…"
              className="w-full rounded px-3 py-2 text-sm leading-relaxed resize-none transition-colors focus:outline-none mb-2"
              rows={2}
              style={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))" }}
            />
          </DetailPanel>

          {flippedIdeas && flippedIdeas.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{flippedIdeas.length} ideas ranked by viability</p>
                {onRegenerateIdeas && (
                  <button
                    onClick={() => onRegenerateIdeas(userContext || undefined)}
                    disabled={generatingIdeas}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{ background: "hsl(var(--primary-muted))", color: "hsl(var(--primary))", border: "1px solid hsl(var(--primary) / 0.3)" }}
                  >
                    {generatingIdeas ? <><RefreshCw size={11} className="animate-spin" /> Generating…</> : <><Sparkles size={11} /> Regenerate</>}
                  </button>
                )}
              </div>
              <div className="space-y-4">
                {flippedIdeas.map((idea, i) => (
                  <FlippedIdeaCard
                    key={`${idea.name}-${i}`}
                    idea={idea}
                    rank={i + 1}
                    productName={product.name}
                    userScores={userScores?.[idea.name || `idea-${i}`]}
                    onScoreChange={onScoreChange ? (scoreKey, value) => onScoreChange(idea.name || `idea-${i}`, scoreKey, value) : undefined}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No flipped ideas yet. Run the intelligence report first.
            </div>
          )}
          {!nextStep && (
            <div className="text-center py-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold" style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))" }}>
                <CheckCircle2 size={14} style={{ color: "hsl(142 70% 40%)" }} /> All sections explored
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
