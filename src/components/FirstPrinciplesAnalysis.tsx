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
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import {
  Brain, Flame, Zap, ChevronRight, ChevronDown, RefreshCw, AlertTriangle, CheckCircle2,
  Wrench, Lightbulb, Package, DollarSign, Users, Factory, FlipHorizontal,
  Eye, ArrowRight, Sparkles, ShieldAlert, Cpu, Ruler, Move, Navigation, Shield,
  Maximize2, Wifi, ScrollText, FileDown, Swords,
} from "lucide-react";
import { InsightRating } from "./InsightRating";


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

interface FirstPrinciplesData {
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

/* ── Collapsible detail panel — PROMINENT ──────────────────────── */
function DetailPanel({ title, icon: Icon, children, defaultOpen = false }: { title: string; icon: React.ElementType; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-lg text-left transition-all group"
        style={{
          background: open ? "hsl(var(--primary) / 0.06)" : "hsl(var(--primary) / 0.03)",
          border: open ? "1.5px solid hsl(var(--primary) / 0.3)" : "1.5px dashed hsl(var(--primary) / 0.25)",
        }}
      >
        <span className="flex items-center gap-2 text-xs font-bold" style={{ color: "hsl(var(--primary))" }}>
          <Icon size={14} />
          {title}
        </span>
        <span className="flex items-center gap-1.5">
          {!open && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}>
              Tap to expand
            </span>
          )}
          <ChevronDown size={16} className="transition-transform" style={{ color: "hsl(var(--primary))", transform: open ? "rotate(180deg)" : "rotate(0deg)" }} />
        </span>
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
      {/* Progress dots */}
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

export const FirstPrinciplesAnalysis = ({ product, onSaved, flippedIdeas, onRegenerateIdeas, generatingIdeas, onPatentSave, externalData, onDataLoaded }: FirstPrinciplesAnalysisProps & { onSaved?: () => void }) => {
  const scrollToSteps = () => setTimeout(() => document.querySelector('[data-fp-steps]')?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  const { user } = useAuth();
  const [data, setData] = useState<FirstPrinciplesData | null>((externalData as FirstPrinciplesData) || null);
  const [loading, setLoading] = useState(false);
  const [patentLoading, setPatentLoading] = useState(false);
  const isService = product.category === "Service";
  const [activeStep, setActiveStep] = useState<"reality" | "physical" | "workflow" | "smarttech" | "assumptions" | "flip" | "concept" | "ideas" | "patents">("reality");
  const [visitedFPSteps, setVisitedFPSteps] = useState<Set<string>>(new Set(["reality"]));
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
    if (!isService) setPatentLoading(true);
    try {
      const promises: Promise<unknown>[] = [
        supabase.functions.invoke("first-principles-analysis", {
          body: { product, userSuggestions: rerunSuggestions || undefined },
        }),
      ];
      if (!isService) {
        promises.push(
          supabase.functions.invoke("patent-analysis", {
            body: { productName: product.name, category: product.category, era: product.era },
          })
        );
      }
      const results = await Promise.allSettled(promises);

      const fpResult = results[0];
      if (fpResult.status === "fulfilled") {
        const { data: result, error } = fpResult.value as { data: { success: boolean; analysis: FirstPrinciplesData; error?: string }; error: { message: string } | null };
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
          onDataLoaded?.(result.analysis);
          setActiveStep("reality");
          toast.success("Disrupt analysis complete!");
          await saveToWorkspace(result.analysis);
        }
      } else {
        toast.error("Disrupt analysis failed: " + String(fpResult.reason));
      }

      if (!isService && results[1]) {
        const patentResult = results[1];
        if (patentResult.status === "fulfilled") {
          const { data: patData, error: patError } = patentResult.value as { data: { success: boolean; patentData: unknown }; error: { message: string } | null };
          if (!patError && patData?.success) {
            onPatentSave?.(patData.patentData);
            toast.success("Patent intelligence loaded!");
          }
        }
      }
    } catch (err) {
      toast.error("Unexpected error: " + String(err));
    } finally {
      setLoading(false);
      setPatentLoading(false);
    }
  };

  const allSteps = [
    { id: "reality" as const, label: "Core Reality", icon: Eye },
    ...(!isService ? [{ id: "physical" as const, label: "Physical Form", icon: Ruler }] : []),
    { id: "workflow" as const, label: isService ? "Customer Journey" : "User Workflow", icon: Navigation },
    { id: "smarttech" as const, label: "Smart Tech", icon: Cpu },
    { id: "assumptions" as const, label: "Assumptions", icon: Brain },
    { id: "flip" as const, label: "Flip the Logic", icon: FlipHorizontal },
    { id: "concept" as const, label: "Redesign", icon: Sparkles },
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
        <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl`}>
          {[
            { icon: isService ? Navigation : Ruler, label: isService ? "Customer Journey" : "Physical Form" },
            { icon: Cpu, label: "Smart Tech" },
            { icon: Sparkles, label: "Redesign" },
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
          {loading ? (
            <><RefreshCw size={15} className="animate-spin" /> Deconstructing {product.name}…</>
          ) : (
            <><Brain size={15} /> Run Disrupt Analysis</>
          )}
        </button>
        <p className="text-[11px] text-muted-foreground">
          Uses Gemini 2.5 Pro · Deep analysis · ~30–60s
        </p>
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

      {/* ── Section selector (linear list, not grid) ── */}
      <div className="flex flex-wrap gap-1.5">
        {allSteps.map((s, i) => {
          const Icon = s.icon;
          const isActive = activeStep === s.id;
          const isVisited = visitedFPSteps.has(s.id);
          return (
            <button
              key={s.id}
              onClick={() => { setActiveStep(s.id); setVisitedFPSteps(prev => new Set([...prev, s.id])); }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
              style={{
                background: isActive ? "hsl(var(--primary))" : "transparent",
                color: isActive ? "white" : isVisited ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                border: isActive ? "1px solid hsl(var(--primary))" : "1px solid hsl(var(--border))",
              }}
            >
              <Icon size={12} />
              <span className="hidden sm:inline">{s.label}</span>
              <span className="sm:hidden">{i + 1}</span>
            </button>
          );
        })}
      </div>

      {/* ═══════ SECTION CONTENT ═══════ */}

      {/* Section 1: Core Reality */}
      {activeStep === "reality" && (
        <div className="space-y-4">
          <SectionHeader current={currentSectionNum} total={totalSections} label="Core Reality" icon={Eye} />

          <div className="p-4 rounded-lg" style={{ background: "hsl(var(--primary-muted))", borderLeft: "3px solid hsl(var(--primary))" }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "hsl(var(--primary))" }}>The Real Problem</p>
            <p className="text-sm text-foreground leading-relaxed">{data.coreReality.trueProblem}</p>
          </div>

          <div className="p-4 rounded-lg" style={{ background: "hsl(var(--muted))" }}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">How People Actually Use It</p>
            <p className="text-xs text-foreground/80 leading-relaxed">{data.coreReality.actualUsage}</p>
          </div>

          {/* Collapsible details */}
          {data.currentStrengths && (
            <DetailPanel title={`What's Working (${data.currentStrengths.whatWorks.length} strengths)`} icon={Shield} defaultOpen={false}>
              <div className="space-y-1.5 mb-2">
                {data.currentStrengths.whatWorks.slice(0, 3).map((item, i) => (
                  <div key={i} className="flex gap-2 items-start text-xs leading-relaxed">
                    <CheckCircle2 size={11} style={{ color: "hsl(142 70% 40%)", flexShrink: 0, marginTop: 2 }} />
                    <span className="text-foreground/80">{item}</span>
                  </div>
                ))}
                {data.currentStrengths.whatWorks.length > 3 && (
                  <p className="text-[10px] text-muted-foreground ml-5">+{data.currentStrengths.whatWorks.length - 3} more</p>
                )}
              </div>
              {data.currentStrengths.competitiveAdvantages?.length > 0 && (
                <div className="pt-2 mb-2" style={{ borderTop: "1px solid hsl(var(--border))" }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Competitive Advantages</p>
                  {data.currentStrengths.competitiveAdvantages.map((adv, i) => (
                    <div key={i} className="flex gap-2 items-start text-xs leading-relaxed mb-1">
                      <Shield size={10} style={{ color: "hsl(142 70% 40%)", flexShrink: 0, marginTop: 2 }} />
                      <span className="text-foreground/80">{adv}</span>
                    </div>
                  ))}
                </div>
              )}
            </DetailPanel>
          )}

          <DetailPanel title={`Frustrations & Workarounds (${data.coreReality.normalizedFrustrations.length + data.coreReality.userHacks.length})`} icon={ShieldAlert}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Frustrations</p>
                {data.coreReality.normalizedFrustrations.slice(0, 3).map((f, i) => (
                  <div key={i} className="flex gap-2 items-start text-xs leading-relaxed">
                    <AlertTriangle size={10} style={{ color: "hsl(var(--destructive))", flexShrink: 0, marginTop: 2 }} />
                    <span className="text-foreground/80">{f}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">User Hacks</p>
                {data.coreReality.userHacks.slice(0, 3).map((h, i) => (
                  <div key={i} className="flex gap-2 items-start text-xs leading-relaxed">
                    <Wrench size={10} style={{ color: "hsl(38 92% 45%)", flexShrink: 0, marginTop: 2 }} />
                    <span className="text-foreground/80">{h}</span>
                  </div>
                ))}
              </div>
            </div>
          </DetailPanel>

          <InsightRating sectionId="core-reality" />
          {nextStep && <NextSectionButton label={nextStep.label} onClick={goNext} />}
        </div>
      )}

      {/* Section 2: Physical Dimensions */}
      {activeStep === "physical" && data.physicalDimensions && (
        <div className="space-y-4">
          <SectionHeader current={currentSectionNum} total={totalSections} label="Physical Form" icon={Ruler} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: "Size", text: data.physicalDimensions.sizeAnalysis },
              { label: "Weight", text: data.physicalDimensions.weightAnalysis },
              { label: "Shape", text: data.physicalDimensions.formFactorAnalysis },
              { label: "Rigidity", text: data.physicalDimensions.staticVsDynamic },
            ].map(({ label, text }) => (
              <div key={label} className="p-3 rounded-lg" style={{ background: "hsl(var(--muted))" }}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
                <p className="text-xs text-foreground/80 leading-relaxed line-clamp-3">{text}</p>
              </div>
            ))}
          </div>

          <DetailPanel title={`Ergonomic Gaps & Opportunities (${(data.physicalDimensions.ergonomicGaps?.length || 0) + (data.physicalDimensions.dimensionOpportunities?.length || 0)})`} icon={Maximize2}>
            {data.physicalDimensions.ergonomicGaps?.length > 0 && (
              <div className="space-y-1.5 mb-3">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Gaps</p>
                {data.physicalDimensions.ergonomicGaps.map((gap, i) => (
                  <div key={i} className="flex gap-2 items-start text-xs">
                    <AlertTriangle size={10} style={{ color: "hsl(var(--destructive))", flexShrink: 0, marginTop: 2 }} />
                    <span className="text-foreground/80">{gap}</span>
                  </div>
                ))}
              </div>
            )}
            {data.physicalDimensions.dimensionOpportunities?.length > 0 && (
              <div className="space-y-1.5 mb-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Opportunities</p>
                {data.physicalDimensions.dimensionOpportunities.map((opp, i) => (
                  <div key={i} className="flex gap-2 items-start text-xs">
                    <CheckCircle2 size={10} style={{ color: "hsl(142 70% 40%)", flexShrink: 0, marginTop: 2 }} />
                    <span className="text-foreground/80">{opp}</span>
                  </div>
                ))}
              </div>
            )}
          </DetailPanel>

          <InsightRating sectionId="physical-form" compact />
          {nextStep && <NextSectionButton label={nextStep.label} onClick={goNext} />}
        </div>
      )}

      {/* Section 3: User Workflow */}
      {activeStep === "workflow" && data.userWorkflow && (
        <div className="space-y-4">
          <SectionHeader current={currentSectionNum} total={totalSections} label={isService ? "Customer Journey" : "User Workflow"} icon={Navigation} />

          {/* Compact journey */}
          <div className="flex flex-wrap gap-1.5 items-center">
            {data.userWorkflow.stepByStep.slice(0, 6).map((step, i) => (
              <div key={i} className="flex items-center gap-1">
                <span className="px-2 py-1 rounded text-[10px] font-semibold" style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))" }}>
                  {i + 1}. {step.length > 40 ? step.slice(0, 40) + "…" : step}
                </span>
                {i < Math.min(data.userWorkflow.stepByStep.length, 6) - 1 && (
                  <ChevronRight size={10} className="text-muted-foreground" />
                )}
              </div>
            ))}
          </div>

          {/* Friction highlights — top 3 only */}
          {data.userWorkflow.frictionPoints?.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Top Friction Points</p>
              {data.userWorkflow.frictionPoints.slice(0, 3).map((fp, i) => {
                const col = SEVERITY_COLORS[fp.severity] || SEVERITY_COLORS.medium;
                return (
                  <div key={i} className="p-3 rounded-lg" style={{ background: col.bg, border: `1px solid ${col.border}` }}>
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-[10px] font-bold" style={{ color: col.text }}>{fp.step}</p>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: col.bg, color: col.text }}>{fp.severity}</span>
                    </div>
                    <p className="text-xs text-foreground/80 leading-relaxed">{fp.friction}</p>
                  </div>
                );
              })}
              {data.userWorkflow.frictionPoints.length > 3 && (
                <p className="text-[10px] text-muted-foreground">+{data.userWorkflow.frictionPoints.length - 3} more friction points in full details</p>
              )}
            </div>
          )}

          <DetailPanel title="Cognitive Load, Context & Optimizations" icon={Brain}>
            <div className="space-y-3 mb-2">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-0.5">Cognitive Load</p>
                <p className="text-xs text-foreground/80 leading-relaxed">{data.userWorkflow.cognitiveLoad}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-0.5">Context of Use</p>
                <p className="text-xs text-foreground/80 leading-relaxed">{data.userWorkflow.contextOfUse}</p>
              </div>
              {data.userWorkflow.workflowOptimizations?.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Optimizations</p>
                  {data.userWorkflow.workflowOptimizations.map((opt, i) => (
                    <div key={i} className="flex gap-2 items-start text-xs mb-1">
                      <CheckCircle2 size={10} style={{ color: "hsl(142 70% 40%)", flexShrink: 0, marginTop: 2 }} />
                      <span className="text-foreground/80">{opt}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DetailPanel>

          <InsightRating sectionId="workflow" compact />
          {nextStep && <NextSectionButton label={nextStep.label} onClick={goNext} />}
        </div>
      )}

      {/* Section 4: Smart Tech */}
      {activeStep === "smarttech" && data.smartTechAnalysis && (
        <div className="space-y-4">
          <SectionHeader current={currentSectionNum} total={totalSections} label="Smart Tech" icon={Cpu} />

          <div className="p-4 rounded-lg" style={{ background: "hsl(var(--muted))" }}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Current Tech Level</p>
            <p className="text-xs text-foreground/80 leading-relaxed">{data.smartTechAnalysis.currentTechLevel}</p>
          </div>

          <div className="p-4 rounded-lg" style={{ background: "hsl(var(--primary-muted))", borderLeft: "3px solid hsl(var(--primary))" }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "hsl(var(--primary))" }}>Highest-Leverage Integration</p>
            <p className="text-xs text-foreground/80 leading-relaxed">{data.smartTechAnalysis.recommendedIntegration}</p>
          </div>

          <DetailPanel title={`Missed Opportunities (${data.smartTechAnalysis.missedOpportunities?.length || 0}) & Barriers`} icon={Wifi}>
            {data.smartTechAnalysis.missedOpportunities?.map((opp, i) => (
              <div key={i} className="mb-2 p-3 rounded-lg" style={{ background: "hsl(271 81% 56% / 0.05)", border: "1px solid hsl(271 81% 56% / 0.15)" }}>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full mr-2" style={{ background: "hsl(271 81% 56% / 0.12)", color: "hsl(271 81% 40%)" }}>{opp.tech}</span>
                <p className="text-xs font-semibold text-foreground/90 mt-1">{opp.application}</p>
                <p className="text-[11px] text-muted-foreground">{opp.valueCreated}</p>
              </div>
            ))}
            <div className="mt-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase mb-0.5">Why Not Done Yet</p>
              <p className="text-xs text-foreground/80">{data.smartTechAnalysis.whyNotAlreadyDone}</p>
            </div>
          </DetailPanel>

          <InsightRating sectionId="smarttech" compact />
          {nextStep && <NextSectionButton label={nextStep.label} onClick={goNext} />}
        </div>
      )}

      {/* Section 5: Hidden Assumptions */}
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
                    <div className="ml-7 mt-1.5 p-2 rounded text-[11px]" style={{ background: "hsl(var(--primary-muted))", borderLeft: "2px solid hsl(var(--primary))" }}>
                      <span className="font-bold" style={{ color: "hsl(var(--primary))" }}>Challenge: </span>
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

      {/* Section 6: Flip the Logic */}
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

      {/* Section 7: Redesigned Concept */}
      {activeStep === "concept" && (
        <div className="space-y-4">
          <SectionHeader current={currentSectionNum} total={totalSections} label="Redesigned Concept" icon={Sparkles} />

          <div className="p-5 rounded-lg relative overflow-hidden" style={{ background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-dark)) 100%)", color: "white" }}>
            <div className="relative">
              <h2 className="text-xl font-black mb-0.5">{data.redesignedConcept.conceptName}</h2>
              <p className="text-sm opacity-85 font-medium mb-2">{data.redesignedConcept.tagline}</p>
              <p className="text-xs leading-relaxed opacity-80">{data.redesignedConcept.coreInsight}</p>
              <div className="flex items-center gap-2 mt-2">
                <RiskBadge type="Risk" level={data.redesignedConcept.riskLevel} />
                <RiskBadge type="Capital" level={data.redesignedConcept.capitalRequired} />
              </div>
            </div>
          </div>

          {/* Key differences — compact chips */}
          <div className="flex flex-wrap gap-1.5">
            {data.redesignedConcept.radicalDifferences.map((d, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium" style={{ background: "hsl(var(--primary-muted))", color: "hsl(var(--primary-dark))", border: "1px solid hsl(var(--primary) / 0.15)" }}>
                <CheckCircle2 size={10} /> {d}
              </span>
            ))}
          </div>

          <DetailPanel title="Physical specs, materials & smart features" icon={Package}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-0.5">Physical Form</p>
                <p className="text-xs text-foreground/80">{data.redesignedConcept.physicalDescription}</p>
                {data.redesignedConcept.sizeAndWeight && <p className="text-[11px] text-muted-foreground mt-1">Size: {data.redesignedConcept.sizeAndWeight}</p>}
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-0.5">Materials</p>
                {data.redesignedConcept.materials.map((m, i) => (
                  <p key={i} className="text-xs text-foreground/80">{i + 1}. {m}</p>
                ))}
              </div>
            </div>
            {data.redesignedConcept.smartFeatures?.length > 0 && (
              <div className="mb-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-0.5">Smart Features</p>
                {data.redesignedConcept.smartFeatures.map((f, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-xs text-foreground/80 mb-0.5">
                    <Wifi size={10} style={{ color: "hsl(271 81% 45%)", flexShrink: 0, marginTop: 2 }} /> {f}
                  </div>
                ))}
              </div>
            )}
          </DetailPanel>

          <DetailPanel title="UX transformation, risks & go-to-market" icon={Users}>
            <div className="space-y-3 mb-2">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-0.5">UX Transformation</p>
                <p className="text-xs text-foreground/80">{data.redesignedConcept.userExperienceTransformation}</p>
              </div>
              {data.redesignedConcept.frictionEliminated?.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mb-0.5">Friction Eliminated</p>
                  {data.redesignedConcept.frictionEliminated.map((f, i) => (
                    <div key={i} className="flex gap-1.5 items-start text-xs mb-0.5"><CheckCircle2 size={10} style={{ color: "hsl(142 70% 40%)", flexShrink: 0, marginTop: 2 }} />{f}</div>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div><p className="text-[10px] font-bold text-muted-foreground uppercase">Manufacturing</p><p className="text-xs text-foreground/80">{data.redesignedConcept.manufacturingPath}</p></div>
                <div><p className="text-[10px] font-bold text-muted-foreground uppercase">Price Point</p><p className="text-xs text-foreground/80">{data.redesignedConcept.pricePoint}</p></div>
                <div><p className="text-[10px] font-bold text-muted-foreground uppercase">Target Buyer</p><p className="text-xs text-foreground/80">{data.redesignedConcept.targetUser}</p></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="p-2 rounded" style={{ background: "hsl(271 81% 56% / 0.05)" }}>
                  <p className="text-[10px] font-bold" style={{ color: "hsl(271 81% 40%)" }}>Why Not Done</p>
                  <p className="text-xs text-foreground/80">{data.redesignedConcept.whyItHasntBeenDone}</p>
                </div>
                <div className="p-2 rounded" style={{ background: "hsl(var(--destructive) / 0.05)" }}>
                  <p className="text-[10px] font-bold" style={{ color: "hsl(var(--destructive))" }}>Biggest Risk</p>
                  <p className="text-xs text-foreground/80">{data.redesignedConcept.biggestRisk}</p>
                </div>
              </div>
            </div>
          </DetailPanel>

          <InsightRating sectionId="concept" compact />
          {nextStep && <NextSectionButton label={nextStep.label} onClick={goNext} />}
        </div>
      )}

      {/* Section 8: Flipped Ideas */}
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
                  <FlippedIdeaCard key={`${idea.name}-${i}`} idea={idea} rank={i + 1} productName={product.name} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No flipped ideas yet. Run the intelligence report first.
            </div>
          )}
          {nextStep ? (
            <NextSectionButton label={nextStep.label} onClick={goNext} />
          ) : (
            <div className="text-center py-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold" style={{ background: "hsl(142 70% 45% / 0.1)", color: "hsl(142 70% 30%)", border: "1px solid hsl(142 70% 45% / 0.25)" }}>
                <CheckCircle2 size={14} /> All sections explored!
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
