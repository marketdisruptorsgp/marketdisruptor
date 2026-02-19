import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Product } from "@/data/mockProducts";
import {
  Brain,
  Flame,
  Zap,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Wrench,
  Lightbulb,
  Package,
  DollarSign,
  Users,
  Factory,
  FlipHorizontal,
  Eye,
  ArrowRight,
  Sparkles,
  ShieldAlert,
} from "lucide-react";

interface CoreReality {
  trueProblem: string;
  actualUsage: string;
  normalizedFrustrations: string[];
  userHacks: string[];
}

interface HiddenAssumption {
  assumption: string;
  currentAnswer: string;
  reason: "tradition" | "manufacturing" | "cost" | "physics" | "habit";
  isChallengeable: boolean;
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
  materials: string[];
  userExperienceTransformation: string;
  whyItHasntBeenDone: string;
  biggestRisk: string;
  manufacturingPath: string;
  pricePoint: string;
  targetUser: string;
}

interface FirstPrinciplesData {
  coreReality: CoreReality;
  hiddenAssumptions: HiddenAssumption[];
  flippedLogic: FlippedLogicItem[];
  redesignedConcept: RedesignedConcept;
}

interface FirstPrinciplesAnalysisProps {
  product: Product;
}

const REASON_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  tradition: { bg: "hsl(38 92% 50% / 0.1)", text: "hsl(38 92% 35%)", label: "Tradition" },
  manufacturing: { bg: "hsl(217 91% 60% / 0.1)", text: "hsl(217 91% 40%)", label: "Mfg Limits" },
  cost: { bg: "hsl(142 70% 45% / 0.1)", text: "hsl(142 70% 30%)", label: "Cost" },
  physics: { bg: "hsl(271 81% 56% / 0.1)", text: "hsl(271 81% 40%)", label: "Physics" },
  habit: { bg: "hsl(330 80% 55% / 0.1)", text: "hsl(330 80% 40%)", label: "Habit" },
};

export const FirstPrinciplesAnalysis = ({ product }: FirstPrinciplesAnalysisProps) => {
  const [data, setData] = useState<FirstPrinciplesData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState<"reality" | "assumptions" | "flip" | "concept">("reality");

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("first-principles-analysis", {
        body: { product },
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
      setActiveStep("reality");
      toast.success("First principles analysis complete!");
    } catch (err) {
      toast.error("Unexpected error: " + String(err));
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: "reality" as const, label: "Core Reality", icon: Eye, number: "01" },
    { id: "assumptions" as const, label: "Hidden Assumptions", icon: Brain, number: "02" },
    { id: "flip" as const, label: "Flip the Logic", icon: FlipHorizontal, number: "03" },
    { id: "concept" as const, label: "Redesigned Concept", icon: Sparkles, number: "04" },
  ];

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-6 text-center">
        <div
          className="w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{ background: "hsl(var(--primary-muted))" }}
        >
          <Brain size={36} style={{ color: "hsl(var(--primary))" }} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground mb-2">First Principles Deconstruction</h3>
          <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
            Challenge every design assumption of <strong>{product.name}</strong>. Uncover the real problem it solves, expose hidden assumptions, and generate a bold redesigned concept from scratch.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg">
          {steps.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.id} className="p-3 rounded-xl text-center" style={{ background: "hsl(var(--muted))" }}>
                <Icon size={18} className="mx-auto mb-1" style={{ color: "hsl(var(--primary))" }} />
                <p className="text-[10px] font-semibold text-muted-foreground">{s.label}</p>
              </div>
            );
          })}
        </div>
        <button
          onClick={runAnalysis}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all"
          style={{
            background: "hsl(var(--primary))",
            color: "white",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? (
            <>
              <RefreshCw size={15} className="animate-spin" />
              Deconstructing {product.name}…
            </>
          ) : (
            <>
              <Brain size={15} />
              Run First Principles Analysis
            </>
          )}
        </button>
        <p className="text-[11px] text-muted-foreground">
          Uses Gemini 2.5 Pro · ~15–30 seconds
        </p>
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
            <h3 className="font-bold text-foreground text-sm">First Principles Analysis</h3>
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
      <div className="flex flex-wrap gap-2">
        {steps.map((s, i) => {
          const Icon = s.icon;
          const isActive = activeStep === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setActiveStep(s.id)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: isActive ? "hsl(var(--primary))" : "hsl(var(--muted))",
                color: isActive ? "white" : "hsl(var(--muted-foreground))",
                border: `1px solid ${isActive ? "hsl(var(--primary))" : "hsl(var(--border))"}`,
              }}
            >
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black"
                style={{ background: isActive ? "rgba(255,255,255,0.25)" : "hsl(var(--primary) / 0.1)", color: isActive ? "white" : "hsl(var(--primary))" }}
              >
                {i + 1}
              </span>
              <Icon size={11} />
              {s.label}
            </button>
          );
        })}
      </div>

      {/* STEP 1: Core Reality */}
      {activeStep === "reality" && (
        <div className="space-y-5">
          {/* True Problem */}
          <div
            className="p-5 rounded-xl"
            style={{ background: "hsl(var(--primary-muted))", borderLeft: "4px solid hsl(var(--primary))" }}
          >
            <p className="section-label text-[10px] mb-2 flex items-center gap-1" style={{ color: "hsl(var(--primary))" }}>
              <Lightbulb size={11} /> The Real Problem Being Solved
            </p>
            <p className="text-sm text-foreground leading-relaxed font-medium">{data.coreReality.trueProblem}</p>
          </div>

          {/* Actual Usage */}
          <div className="p-5 rounded-xl" style={{ background: "hsl(var(--muted))" }}>
            <p className="section-label text-[10px] mb-2 flex items-center gap-1">
              <Eye size={11} /> How People Actually Use It
            </p>
            <p className="text-sm text-foreground/80 leading-relaxed">{data.coreReality.actualUsage}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Normalized Frustrations */}
            <div>
              <p className="section-label text-[10px] mb-3 flex items-center gap-1">
                <ShieldAlert size={11} style={{ color: "hsl(var(--destructive))" }} /> Normalized Frustrations
              </p>
              <div className="space-y-2">
                {data.coreReality.normalizedFrustrations.map((f, i) => (
                  <div
                    key={i}
                    className="flex gap-2 items-start p-3 rounded-lg text-xs leading-relaxed"
                    style={{ background: "hsl(var(--destructive) / 0.06)", border: "1px solid hsl(var(--destructive) / 0.2)" }}
                  >
                    <AlertTriangle size={11} style={{ color: "hsl(var(--destructive))", flexShrink: 0, marginTop: 1 }} />
                    <span className="text-foreground/80">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* User Hacks */}
            <div>
              <p className="section-label text-[10px] mb-3 flex items-center gap-1">
                <Wrench size={11} style={{ color: "hsl(38 92% 50%)" }} /> Workarounds & Hacks People Create
              </p>
              <div className="space-y-2">
                {data.coreReality.userHacks.map((h, i) => (
                  <div
                    key={i}
                    className="flex gap-2 items-start p-3 rounded-lg text-xs leading-relaxed"
                    style={{ background: "hsl(38 92% 50% / 0.07)", border: "1px solid hsl(38 92% 50% / 0.25)" }}
                  >
                    <ChevronRight size={11} style={{ color: "hsl(38 92% 45%)", flexShrink: 0, marginTop: 1 }} />
                    <span className="text-foreground/80">{h}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={() => setActiveStep("assumptions")}
            className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg transition-all"
            style={{ background: "hsl(var(--primary))", color: "white" }}
          >
            Next: Hidden Assumptions <ArrowRight size={12} />
          </button>
        </div>
      )}

      {/* STEP 2: Hidden Assumptions */}
      {activeStep === "assumptions" && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Every design choice is built on assumptions. Most are never questioned. Here's what's holding this product back.
          </p>
          <div className="space-y-3">
            {data.hiddenAssumptions.map((a, i) => {
              const reasonStyle = REASON_COLORS[a.reason] || REASON_COLORS.habit;
              return (
                <div
                  key={i}
                  className="p-4 rounded-xl"
                  style={{
                    background: a.isChallengeable ? "hsl(var(--card))" : "hsl(var(--muted))",
                    border: `1px solid ${a.isChallengeable ? "hsl(var(--primary) / 0.2)" : "hsl(var(--border))"}`,
                  }}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0"
                        style={{ background: "hsl(var(--primary))", color: "white" }}
                      >
                        {i + 1}
                      </span>
                      <p className="text-xs font-bold text-foreground">{a.assumption}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                        style={{ background: reasonStyle.bg, color: reasonStyle.text }}
                      >
                        {reasonStyle.label}
                      </span>
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
                  <p className="text-xs text-muted-foreground leading-relaxed ml-8">{a.currentAnswer}</p>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => setActiveStep("flip")}
            className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg transition-all"
            style={{ background: "hsl(var(--primary))", color: "white" }}
          >
            Next: Flip the Logic <ArrowRight size={12} />
          </button>
        </div>
      )}

      {/* STEP 3: Flip the Logic */}
      {activeStep === "flip" && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Taking the most limiting assumptions and inverting them. These aren't tweaks — they're structural breaks.
          </p>
          {data.flippedLogic.map((item, i) => (
            <div
              key={i}
              className="rounded-xl overflow-hidden"
              style={{ border: "1px solid hsl(var(--primary) / 0.2)" }}
            >
              {/* Assumption → Flip header */}
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr]">
                <div className="p-4" style={{ background: "hsl(var(--muted))" }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Current Assumption</p>
                  <p className="text-xs text-foreground/80 leading-relaxed">{item.originalAssumption}</p>
                </div>
                <div
                  className="flex items-center justify-center px-3 py-4"
                  style={{ background: "hsl(var(--primary))" }}
                >
                  <FlipHorizontal size={16} style={{ color: "white" }} />
                </div>
                <div className="p-4" style={{ background: "hsl(var(--primary-muted))" }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "hsl(var(--primary))" }}>
                    Bold Alternative
                  </p>
                  <p className="text-xs font-semibold leading-relaxed" style={{ color: "hsl(var(--primary-dark))" }}>
                    {item.boldAlternative}
                  </p>
                </div>
              </div>
              {/* Details */}
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

          <button
            onClick={() => setActiveStep("concept")}
            className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg transition-all"
            style={{ background: "hsl(var(--primary))", color: "white" }}
          >
            Next: Redesigned Concept <ArrowRight size={12} />
          </button>
        </div>
      )}

      {/* STEP 4: Redesigned Concept */}
      {activeStep === "concept" && (
        <div className="space-y-5">
          {/* Hero concept card */}
          <div
            className="p-6 rounded-2xl relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-dark)) 100%)",
              color: "white",
            }}
          >
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
                <div
                  key={i}
                  className="flex gap-2 items-start p-3 rounded-lg text-xs"
                  style={{ background: "hsl(var(--primary-muted))", border: "1px solid hsl(var(--primary) / 0.2)" }}
                >
                  <CheckCircle2 size={12} style={{ color: "hsl(var(--primary))", flexShrink: 0, marginTop: 1 }} />
                  <span className="text-foreground/85 leading-relaxed font-medium">{d}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Physical Description */}
            <div className="p-4 rounded-xl space-y-2" style={{ background: "hsl(var(--muted))" }}>
              <p className="section-label text-[10px] flex items-center gap-1">
                <Package size={11} /> Physical Form
              </p>
              <p className="text-xs text-foreground/80 leading-relaxed">{data.redesignedConcept.physicalDescription}</p>
            </div>

            {/* Materials */}
            <div className="p-4 rounded-xl space-y-2" style={{ background: "hsl(var(--muted))" }}>
              <p className="section-label text-[10px] flex items-center gap-1">
                <Zap size={11} /> Materials & Why
              </p>
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
          </div>

          {/* UX Transformation */}
          <div
            className="p-5 rounded-xl"
            style={{ background: "hsl(142 70% 45% / 0.07)", borderLeft: "4px solid hsl(142 70% 45%)" }}
          >
            <p className="section-label text-[10px] mb-2 flex items-center gap-1" style={{ color: "hsl(142 70% 30%)" }}>
              <Users size={11} /> User Experience Transformation
            </p>
            <p className="text-sm text-foreground/85 leading-relaxed">{data.redesignedConcept.userExperienceTransformation}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Why it hasn't been done */}
            <div className="p-4 rounded-xl" style={{ background: "hsl(271 81% 56% / 0.07)", border: "1px solid hsl(271 81% 56% / 0.2)" }}>
              <p className="section-label text-[10px] mb-2 flex items-center gap-1" style={{ color: "hsl(271 81% 40%)" }}>
                <Brain size={11} /> Why It Hasn't Been Done
              </p>
              <p className="text-xs text-foreground/80 leading-relaxed">{data.redesignedConcept.whyItHasntBeenDone}</p>
            </div>

            {/* Biggest Risk */}
            <div className="p-4 rounded-xl" style={{ background: "hsl(var(--destructive) / 0.06)", border: "1px solid hsl(var(--destructive) / 0.2)" }}>
              <p className="section-label text-[10px] mb-2 flex items-center gap-1" style={{ color: "hsl(var(--destructive))" }}>
                <AlertTriangle size={11} /> Biggest Risk
              </p>
              <p className="text-xs text-foreground/80 leading-relaxed">{data.redesignedConcept.biggestRisk}</p>
            </div>
          </div>

          {/* Commercial details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl space-y-1" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
              <p className="section-label text-[10px] flex items-center gap-1">
                <Factory size={11} /> Manufacturing Path
              </p>
              <p className="text-xs text-foreground/80 leading-relaxed">{data.redesignedConcept.manufacturingPath}</p>
            </div>
            <div className="p-4 rounded-xl space-y-1" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
              <p className="section-label text-[10px] flex items-center gap-1">
                <DollarSign size={11} /> Price Point
              </p>
              <p className="text-xs text-foreground/80 leading-relaxed">{data.redesignedConcept.pricePoint}</p>
            </div>
            <div className="p-4 rounded-xl space-y-1" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
              <p className="section-label text-[10px] flex items-center gap-1">
                <Users size={11} /> Target Buyer
              </p>
              <p className="text-xs text-foreground/80 leading-relaxed">{data.redesignedConcept.targetUser}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
