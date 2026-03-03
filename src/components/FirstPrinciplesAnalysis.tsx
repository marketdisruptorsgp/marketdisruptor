import { useState, useEffect, useRef } from "react";
import { PitchDeckToggle } from "@/components/PitchDeckToggle";
import { AnalysisVisualLayer } from "./AnalysisVisualLayer";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { Product, FlippedIdea } from "@/data/mockProducts";
import { FlippedIdeaCard } from "@/components/FlippedIdeaCard";
import { RedesignVisualGenerator } from "@/components/RedesignVisualGenerator";

import { LeverageScore } from "@/components/LeverageScore";
import { RiskBadge } from "@/components/RiskBadge";
import { PatentIntelligence } from "@/components/PatentIntelligence";
import { downloadPatentPDF } from "@/lib/pdfExport";
import { StepLoadingTracker, DISRUPT_TASKS } from "@/components/StepLoadingTracker";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import {
  Brain, Flame, Zap, ChevronRight, ChevronDown, RefreshCw, AlertTriangle, CheckCircle2,
  Wrench, Lightbulb, Package, DollarSign, Users, Factory, FlipHorizontal,
  Eye, ArrowRight, Sparkles, ShieldAlert, Cpu, Ruler, Move, Navigation, Shield, Route,
  Maximize2, Wifi, ScrollText, FileDown, Swords,
  Car, ShoppingCart, Search, Phone, CreditCard, MapPin, Clock, Truck,
  Home, Star, Settings, Send, Download, Upload, Camera, Mic,
  Globe, Heart, Bookmark, Share2, MessageSquare, Mail, Lock, Key,
  Bike, Plane,
  type LucideIcon,
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

interface FrictionDimensions {
  primaryFriction?: string;
  physicalForm?: string;
  skillBarrier?: string;
  costStructure?: string;
  ecosystemLockIn?: string;
  maintenanceBurden?: string;
  // Legacy fields (backward compat)
  sizeAnalysis?: string;
  weightAnalysis?: string;
  formFactorAnalysis?: string;
  staticVsDynamic?: string;
  ergonomicGaps?: string[];
  dimensionOpportunities?: string[];
  // New fields
  gaps?: string[];
  opportunities?: string[];
  // Service mode
  deliveryModel?: string;
}

interface WorkflowFriction {
  step?: string;
  stepIndex?: number;
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
  physicalDimensions?: FrictionDimensions;
  frictionDimensions?: FrictionDimensions;
  userWorkflow: UserWorkflow;
  smartTechAnalysis: SmartTechAnalysis;
  hiddenAssumptions: HiddenAssumption[];
  flippedLogic: FlippedLogicItem[];
  redesignedConcept: RedesignedConcept;
  visualSpecs?: import("@/lib/visualContract").VisualSpec[];
  actionPlans?: import("@/lib/visualContract").ActionPlan[];
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
  autoTrigger?: boolean;
}

const REASON_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  tradition: { bg: "hsl(38 92% 50% / 0.1)", text: "hsl(38 92% 35%)", label: "Tradition" },
  manufacturing: { bg: "hsl(217 91% 60% / 0.1)", text: "hsl(217 91% 40%)", label: "Mfg Limits" },
  cost: { bg: "hsl(142 70% 45% / 0.1)", text: "hsl(142 70% 30%)", label: "Cost" },
  physics: { bg: "hsl(271 81% 56% / 0.1)", text: "hsl(271 81% 40%)", label: "Physics" },
  habit: { bg: "hsl(330 80% 55% / 0.1)", text: "hsl(330 80% 40%)", label: "Habit" },
};

/* ── Map step text to a contextual Lucide icon ──────────────────────── */
/* Priority: action verbs & touchpoints first, then domain-specific fallbacks */
const STEP_ICON_KEYWORDS: [string[], LucideIcon][] = [
  /* ── Discovery & awareness ── */
  [["discover", "aware", "hear about", "learn about", "first encounter", "introduction"], Search],
  [["search", "browse", "look for", "find", "explore", "research", "compare"], Search],
  [["recommend", "referral", "word of mouth", "told about"], Users],

  /* ── Evaluation & decision ── */
  [["evaluate", "assess", "consider", "weigh", "decide", "choose", "select", "pick"], Lightbulb],
  [["review", "rate", "feedback", "testimonial", "star", "reputation"], Star],
  [["compare", "alternative", "option", "versus", "vs"], Eye],

  /* ── Acquisition & onboarding ── */
  [["sign up", "register", "create account", "onboard", "enroll", "join", "apply"], Lock],
  [["buy", "purchase", "order", "checkout", "add to cart", "subscribe"], ShoppingCart],
  [["pay", "payment", "price", "cost", "charge", "bill", "credit", "invoice", "fee"], CreditCard],
  [["download", "install", "get", "retrieve", "grab"], Download],

  /* ── Setup & configuration ── */
  [["setup", "configure", "install", "customize", "personalize", "adjust", "setting", "preference"], Settings],
  [["connect", "integrate", "link", "pair", "sync"], Globe],

  /* ── Core usage & engagement ── */
  [["use", "engage", "interact", "experience", "start using", "begin", "launch", "open"], ArrowRight],
  [["book", "reserve", "schedule", "appointment", "session"], Clock],
  [["call", "phone", "contact", "reach out", "speak", "consult"], Phone],
  [["message", "chat", "communicate", "ask", "support", "help"], MessageSquare],
  [["email", "inbox", "notification", "alert", "notify"], Mail],
  [["upload", "submit", "attach", "send", "provide", "fill", "form"], Upload],
  [["watch", "observe", "view", "see", "inspect", "check", "monitor"], Eye],
  [["build", "create", "make", "prepare", "craft", "design", "produce"], Wrench],
  [["learn", "understand", "study", "train", "educate", "teach", "course"], Lightbulb],

  /* ── Fulfillment & delivery ── */
  [["deliver", "ship", "receive", "package", "arrive", "pickup", "collect", "pick up"], Truck],
  [["wait", "pending", "processing", "loading", "queue"], Clock],

  /* ── Retention & loyalty ── */
  [["return", "come back", "repeat", "renew", "reorder", "continue"], Home],
  [["share", "post", "social", "tell", "spread", "refer"], Share2],
  [["save", "favorite", "bookmark", "keep", "store", "remember"], Bookmark],
  [["track", "follow", "progress", "status", "update"], Eye],

  /* ── Travel/location (secondary — only for explicitly physical journeys) ── */
  [["drive", "car", "vehicle", "commute", "transport", "ride"], Car],
  [["navigate", "direction", "route", "location", "destination", "go to", "arrive at", "visit"], MapPin],
  [["fly", "flight", "airplane", "airport", "plane", "travel"], Plane],
  [["bike", "cycle", "pedal"], Bike],
  [["pack", "carry", "load", "bring", "luggage"], Package],
  [["photo", "picture", "image", "capture", "snap", "scan"], Camera],
  [["record", "voice", "audio", "listen", "speak", "mic"], Mic],
  [["protect", "safe", "secure", "guard", "verify", "authenticate"], Shield],
  [["move", "transfer", "migrate", "switch", "transition"], Move],
  [["launch", "deploy", "release", "go live", "publish"], Send],
];

function getStepIcon(stepText: string): LucideIcon {
  const lower = stepText.toLowerCase();
  for (const [keywords, icon] of STEP_ICON_KEYWORDS) {
    if (keywords.some(kw => lower.includes(kw))) return icon;
  }
  return ArrowRight; // default fallback
}


/* ── Interactive Workflow Timeline — polished, themed, contextual icons ──────────────────────── */
export function WorkflowTimeline({ steps, frictionPoints }: { steps: string[]; frictionPoints: WorkflowFriction[] }) {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const getFriction = (stepIndex: number, stepName: string): WorkflowFriction | undefined => {
    // First try matching by stepIndex (new format)
    const byIndex = frictionPoints?.find(fp => fp.stepIndex === stepIndex);
    if (byIndex) return byIndex;
    // Fallback: match by step name (legacy data)
    return frictionPoints?.find(fp =>
      fp.step && (
        stepName.toLowerCase().includes(fp.step.toLowerCase()) ||
        fp.step.toLowerCase().includes(stepName.toLowerCase().slice(0, 12))
      )
    );
  };

  return (
    <div className="space-y-1">
      {/* Section label */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--foreground))" }}>
          <Route size={13} style={{ color: "hsl(var(--background))" }} />
        </div>
        <p className="text-xs font-extrabold uppercase tracking-widest text-foreground">Current Journey</p>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>
          {steps.length} steps
        </span>
      </div>

      {/* Timeline cards — vertical on all sizes for clarity */}
      <div className="relative">
      {steps.slice(0, 8).map((step, i) => {
          const friction = getFriction(i, step);
          const isExpanded = expandedStep === i;
          const isLast = i === Math.min(steps.length, 8) - 1;
          const StepIcon = getStepIcon(step);

          return (
            <div key={i} className="flex items-start gap-3.5 relative">
              {/* Left rail: illustrated icon + connector */}
              <div className="flex flex-col items-center flex-shrink-0 pt-0.5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center z-10 transition-all duration-300 shadow-sm"
                  style={{
                    background: isExpanded
                      ? "hsl(var(--foreground))"
                      : "hsl(var(--primary) / 0.08)",
                    color: isExpanded
                      ? "hsl(var(--background))"
                      : "hsl(var(--primary))",
                    border: isExpanded ? "none" : "1.5px solid hsl(var(--primary) / 0.15)",
                    transform: isExpanded ? "scale(1.12)" : "scale(1)",
                    boxShadow: isExpanded
                      ? "0 4px 12px -2px hsl(var(--foreground) / 0.2)"
                      : "0 2px 8px -2px hsl(var(--primary) / 0.12)",
                  }}
                >
                  <StepIcon size={18} strokeWidth={1.8} />
                </div>
                {!isLast && (
                  <div className="w-[1.5px] flex-1 min-h-[16px]" style={{ background: "hsl(var(--border))" }} />
                )}
              </div>

              {/* Right: step card */}
              <button
                onClick={() => setExpandedStep(isExpanded ? null : i)}
                className="flex-1 text-left rounded-xl p-3.5 mb-2 transition-all duration-200 cursor-pointer group"
                style={{
                  background: isExpanded
                    ? "hsl(var(--foreground) / 0.03)"
                    : "hsl(var(--card))",
                  border: isExpanded
                    ? "1.5px solid hsl(var(--foreground) / 0.15)"
                    : "1px solid hsl(var(--border))",
                }}
              >
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-bold text-foreground leading-snug">{step}</p>
                  <ChevronRight size={13} className="text-muted-foreground transition-transform duration-200 flex-shrink-0 ml-2" style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }} />
                </div>

                {isExpanded && friction && (
                  <div className="mt-2.5 space-y-2 pt-2.5" style={{ borderTop: "1px solid hsl(var(--border))" }}>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">What happens</p>
                      <p className="text-[13px] text-foreground/80 leading-relaxed">{friction.friction}</p>
                    </div>
                    {friction.rootCause && (
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Root cause</p>
                        <p className="text-[13px] text-foreground/80 leading-relaxed">{friction.rootCause}</p>
                      </div>
                    )}
                  </div>
                )}

                {isExpanded && !friction && (
                  <div className="mt-2.5 pt-2.5" style={{ borderTop: "1px solid hsl(var(--border))" }}>
                    <p className="text-[11px] text-muted-foreground italic">No friction points identified at this step.</p>
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Friction summary bar */}
      {frictionPoints?.length > 0 && (
        <div className="flex items-center gap-2 pt-2 mt-1" style={{ borderTop: "1px solid hsl(var(--border))" }}>
          <AlertTriangle size={12} style={{ color: "hsl(var(--muted-foreground))" }} />
          <span className="text-[11px] font-semibold text-muted-foreground">
            {frictionPoints.length} friction point{frictionPoints.length !== 1 ? "s" : ""} identified in current journey
          </span>
        </div>
      )}
    </div>
  );
}

/* ── Collapsible detail panel — Presentation style ──────────────────────── */
function DetailPanel({ title, icon: Icon, children, defaultOpen = false }: { title: string; icon: React.ElementType; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        className="w-full flex items-center justify-between gap-3 px-5 py-3.5 rounded-2xl text-left transition-all group cursor-pointer"
        style={{
          background: "hsl(var(--card))",
          border: "1.5px solid hsl(var(--border))",
        }}
      >
        <span className="flex items-center gap-3 text-sm font-bold text-foreground">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "hsl(var(--primary) / 0.08)" }}>
            <Icon size={14} style={{ color: "hsl(var(--primary))" }} />
          </div>
          {title}
        </span>
        <span className="flex items-center gap-1.5 flex-shrink-0">
          <span className="typo-card-meta font-bold uppercase tracking-widest text-muted-foreground hidden sm:inline">Details</span>
          <ChevronDown size={14} className="transition-transform text-muted-foreground" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }} />
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-5 pt-3 pb-2">
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
          <p className="typo-card-meta text-muted-foreground font-medium">Section {current} of {total}</p>
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

export const FirstPrinciplesAnalysis = ({ product, onSaved, flippedIdeas, onRegenerateIdeas, generatingIdeas, onPatentSave, externalData, onDataLoaded, renderMode, autoTrigger, userScores, onScoreChange }: FirstPrinciplesAnalysisProps & { onSaved?: () => void; userScores?: Record<string, Record<string, number>>; onScoreChange?: (ideaId: string, scoreKey: string, value: number) => void }) => {
  const scrollToSteps = () => setTimeout(() => document.querySelector('[data-fp-steps]')?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  const { user } = useAuth();
  const analysisCtx = useAnalysis();
  const [data, setData] = useState<FirstPrinciplesData | null>((externalData as FirstPrinciplesData) || null);
  const [loading, setLoading] = useState(false);
  const isService = product.category === "Service";
  const [activeStep, setActiveStep] = useState<"assumptions" | "flip" | "ideas">("assumptions");
  const [visitedFPSteps, setVisitedFPSteps] = useState<Set<string>>(new Set(["assumptions"]));
  const [userContext, setUserContext] = useState("");
  const [rerunSuggestions, setRerunSuggestions] = useState("");
  const autoTriggered = useRef(false);
  

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
      // Build request body — enrich with user curation context for redesign mode
      const requestBody: Record<string, unknown> = { product, userSuggestions: rerunSuggestions || undefined };
      if (renderMode === "redesign") {
        requestBody.insightPreferences = analysisCtx.insightPreferences;
        requestBody.userScores = analysisCtx.userScores;
        requestBody.steeringText = analysisCtx.steeringText;
        requestBody.disruptContext = analysisCtx.disruptData;
        requestBody.selectedImages = analysisCtx.pitchDeckImages;
        // Pass governed reasoning data (causal chains, reasoning revisions, constraint maps)
        if (analysisCtx.governedData) {
          requestBody.governedContext = {
            reasoning_synopsis: analysisCtx.governedData.reasoning_synopsis,
            constraint_map: analysisCtx.governedData.constraint_map,
            root_hypotheses: analysisCtx.governedData.root_hypotheses,
          };
        }
      }
      // Wire active branch for isolated downstream reasoning
      if (analysisCtx.activeBranchId && analysisCtx.governedData) {
        const { getBranchPayload } = await import("@/lib/branchContext");
        const branchPayload = getBranchPayload(analysisCtx.governedData, analysisCtx.activeBranchId, analysisCtx.strategicProfile);
        if (branchPayload) {
          requestBody.activeBranch = branchPayload;
        }
      }
      const { data: result, error } = await supabase.functions.invoke("first-principles-analysis", {
        body: requestBody,
      });

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
      setActiveStep("assumptions");
      toast.success("Disrupt analysis complete!");
      await saveToWorkspace(result.analysis);
    } catch (err) {
      toast.error("Unexpected error: " + String(err));
    } finally {
      setLoading(false);
    }
  };


  // Auto-trigger redesign when arriving with outdated or missing data
  useEffect(() => {
    if (autoTrigger && renderMode === "redesign" && !loading && !autoTriggered.current) {
      autoTriggered.current = true;
      runAnalysis();
    }
  }, [autoTrigger, renderMode, loading]); // eslint-disable-line react-hooks/exhaustive-deps

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
        title={renderMode === "redesign" ? "Generating Redesign Concept" : "Building Disrupt Analysis"}
        tasks={DISRUPT_TASKS}
        estimatedSeconds={50}
        accentColor={renderMode === "redesign" ? "hsl(38 92% 50%)" : "hsl(271 81% 55%)"}
      />
    );
  }

  if (!data) {
    // Redesign mode empty state
    if (renderMode === "redesign") {
      return (
        <div className="flex flex-col items-center justify-center py-16 space-y-6 text-center">
          <div className="w-20 h-20 rounded flex items-center justify-center" style={{ background: "hsl(38 92% 50% / 0.12)" }}>
            <Sparkles size={36} style={{ color: "hsl(38 92% 50%)" }} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground mb-2">Redesign Concept</h3>
            <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
              Generate a radical reinvention of <strong>{product.name}</strong> — combining all flipped ideas into a cohesive redesigned concept.
            </p>
          </div>
          <button
            onClick={runAnalysis}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 rounded font-bold text-sm transition-colors"
            style={{ background: "hsl(38 92% 50%)", color: "white", opacity: loading ? 0.7 : 1 }}
          >
            <Sparkles size={15} /> Generate Redesign
          </button>
          <p className="typo-card-meta text-muted-foreground">
            Uses Gemini 2.5 Pro · Deep analysis · ~30–60s
          </p>
        </div>
      );
    }

    // Disrupt mode empty state
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-sm">
          {[
            { icon: Brain, label: "Assumptions" },
            { icon: FlipHorizontal, label: "Flip Logic" },
            { icon: Zap, label: "Flipped Ideas" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="p-3 rounded text-center" style={{ background: "hsl(var(--muted))" }}>
              <Icon size={18} className="mx-auto mb-1" style={{ color: "hsl(var(--primary))" }} />
              <p className="typo-card-meta font-semibold text-muted-foreground">{label}</p>
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
        <p className="typo-card-meta text-muted-foreground">
          Uses Gemini 2.5 Pro · Deep analysis · ~30–60s
        </p>
      </div>
    );
  }

  // ── REDESIGN MODE ──
  if (renderMode === "redesign") {
    const concept = data.redesignedConcept;

    if (!concept) {
      if (loading) {
        return (
          <StepLoadingTracker
            title="Generating Redesign Concept"
            tasks={DISRUPT_TASKS}
            estimatedSeconds={50}
            accentColor="hsl(38 92% 50%)"
          />
        );
      }
      return (
        <div className="flex flex-col items-center justify-center py-16 space-y-6 text-center">
          <div className="w-20 h-20 rounded flex items-center justify-center" style={{ background: "hsl(38 92% 50% / 0.12)" }}>
            <Sparkles size={36} style={{ color: "hsl(38 92% 50%)" }} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground mb-2">Redesign Concept</h3>
            <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
              Generate a radical reinvention of <strong>{product.name}</strong> — combining all flipped ideas into a cohesive redesigned concept.
            </p>
          </div>
          <button
            onClick={runAnalysis}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 rounded font-bold text-sm transition-colors"
            style={{ background: "hsl(38 92% 50%)", color: "white", opacity: loading ? 0.7 : 1 }}
          >
            <Sparkles size={15} /> Generate Redesign
          </button>
          <p className="typo-card-meta text-muted-foreground">
            Uses Gemini 2.5 Pro · Deep analysis · ~30–60s
          </p>
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
              <p className="typo-card-meta text-muted-foreground">{concept.tagline}</p>
            </div>
          </div>
          <button
            onClick={runAnalysis}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{ background: "hsl(var(--secondary))", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))" }}
          >
            {loading ? <RefreshCw size={11} className="animate-spin" /> : <RefreshCw size={11} />}
            Regenerate
          </button>
        </div>

        {/* Core insight */}
        <div className="p-4 rounded-lg" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
          <p className="typo-card-eyebrow mb-1 text-muted-foreground">Core Insight</p>
          <p className="text-sm leading-relaxed text-foreground/85">{concept.coreInsight}</p>
        </div>

        {/* Radical Differences */}
        <div>
          <p className="typo-card-eyebrow text-muted-foreground mb-2">Radical Differences</p>
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
            <p className="typo-card-eyebrow text-muted-foreground mb-1">Physical Form</p>
            <p className="typo-card-body text-foreground/80">{concept.physicalDescription}</p>
            {concept.sizeAndWeight && <p className="typo-card-meta text-muted-foreground mt-1">Size: {concept.sizeAndWeight}</p>}
          </div>
          <div className="p-3 rounded-lg" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
            <p className="typo-card-eyebrow text-muted-foreground mb-1">Materials</p>
            <div className="flex flex-wrap gap-1">
              {concept.materials.map((m, i) => (
                <span key={i} className="px-2 py-0.5 rounded-full typo-card-meta font-medium" style={{ background: "hsl(var(--card))", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))" }}>{m}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Smart Features */}
        {concept.smartFeatures?.length > 0 && (
          <div>
            <p className="typo-card-eyebrow text-muted-foreground mb-2">Smart Features</p>
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
          <p className="typo-card-eyebrow text-muted-foreground mb-1">User Experience Transformation</p>
          <p className="text-xs text-foreground/80 leading-relaxed">{concept.userExperienceTransformation}</p>
        </div>
        {concept.frictionEliminated?.length > 0 && (
          <div>
            <p className="typo-card-eyebrow text-muted-foreground mb-2">Friction Eliminated</p>
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
              <p className="typo-status-label text-muted-foreground">{item.label}</p>
              <p className="text-xs font-bold text-foreground mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>

        <DetailPanel title="Why it hasn't been done & biggest risk" icon={ShieldAlert} defaultOpen>
          <div className="space-y-2 mb-2">
            <div>
              <p className="typo-card-eyebrow text-muted-foreground mb-0.5">Why Not Already Done</p>
              <p className="text-xs text-foreground/80">{concept.whyItHasntBeenDone}</p>
            </div>
            <div>
              <p className="typo-card-eyebrow text-muted-foreground mb-0.5">Biggest Risk</p>
              <p className="text-xs text-foreground/80">{concept.biggestRisk}</p>
            </div>
            <div>
              <p className="typo-card-eyebrow text-muted-foreground mb-0.5">Manufacturing Path</p>
              <p className="text-xs text-foreground/80">{concept.manufacturingPath}</p>
            </div>
          </div>
        </DetailPanel>

        {/* AI-Generated Redesign Visuals */}
        <RedesignVisualGenerator
          productName={product.name}
          concept={concept}
          accentColor="hsl(38 92% 50%)"
        />
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
            <p className="typo-card-meta text-muted-foreground">{totalSections} sections · Click any to jump</p>
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
      <DetailPanel title="Refine your analysis — add direction, then Re-run" icon={Lightbulb}>
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
        journeyLabel="Disrupt Sections"
      />

      {/* ═══════ SECTION CONTENT ═══════ */}

      {/* Section 1: Hidden Assumptions */}
      {activeStep === "assumptions" && (
        <div className="space-y-4">
          <SectionHeader current={currentSectionNum} total={totalSections} label="Hidden Assumptions" icon={Brain} />

          <AnalysisVisualLayer analysis={data as unknown as Record<string, unknown>} step="firstPrinciples" governedOverride={analysisCtx.governedData}>
          {/* Individual pitch deck toggles on each card below */}
          <div className="p-3.5 rounded-xl" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
            <p className="text-xs text-foreground/80 leading-relaxed">
              <strong>Why this matters:</strong> Every product is built on assumptions — about who uses it, how they use it, and why it's designed the way it is. Most go unchallenged. The best innovations come from questioning what everyone else takes for granted.
            </p>
          </div>

          <DetailPanel title="How to read each assumption card" icon={Lightbulb}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <div className="p-2.5 rounded-lg" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Root Cause Tag</p>
                <p className="text-xs text-foreground/70 leading-relaxed">Why this assumption exists — tradition, manufacturing limits, cost pressure, physics, or user habit. Helps you understand what's holding the status quo in place.</p>
              </div>
              <div className="p-2.5 rounded-lg" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Leverage Score (1–10)</p>
                <p className="text-xs text-foreground/70 leading-relaxed">How much potential value you could unlock by successfully challenging this assumption. Higher scores = bigger opportunity if you can crack it.</p>
              </div>
              <div className="p-2.5 rounded-lg" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Challengeable</p>
                <p className="text-xs text-foreground/70 leading-relaxed">Our analysis indicates this assumption can realistically be disrupted with current technology, market conditions, or business model innovation.</p>
              </div>
            </div>
          </DetailPanel>

           <div className="space-y-3">
            {data.hiddenAssumptions.map((a, i) => {
              const reasonStyle = REASON_COLORS[a.reason] || REASON_COLORS.habit;
              return (
                <div key={i} className="p-3.5 rounded-lg" style={{ background: "hsl(var(--card))", border: `1.5px solid ${a.isChallengeable ? "hsl(var(--primary) / 0.25)" : "hsl(var(--border))"}` }}>
                  <p className="text-xs font-bold text-foreground flex items-center gap-2 mb-1">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center typo-status-label font-bold flex-shrink-0" style={{ background: "hsl(var(--primary))", color: "white" }}>{i + 1}</span>
                    {a.assumption}
                  </p>
                  <p className="typo-card-body text-muted-foreground leading-relaxed ml-7">{a.currentAnswer}</p>
                  {a.challengeIdea && (
                    <div className="ml-7 mt-1.5 p-2 rounded typo-card-body" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                      <span className="font-bold text-foreground">Challenge: </span>
                      <span className="text-foreground/80">{a.challengeIdea}</span>
                    </div>
                  )}
                  {/* Metadata row — muted, secondary to content */}
                  <div className="ml-7 mt-2 flex items-center gap-1.5 flex-wrap">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-medium text-muted-foreground" style={{ background: "hsl(var(--muted))" }}>{reasonStyle.label}</span>
                    {a.isChallengeable && <span className="px-1.5 py-0.5 rounded text-[9px] font-medium text-muted-foreground" style={{ background: "hsl(var(--muted))" }}>Challengeable</span>}
                    {a.leverageScore != null && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-medium tabular-nums text-muted-foreground" style={{ background: "hsl(var(--muted))" }}>
                        Leverage {a.leverageScore}/10
                      </span>
                    )}
                    <span className="ml-auto" />
                    <PitchDeckToggle contentKey={`assumptions-${i}`} label="Include in Pitch" />
                  </div>
                </div>
              );
            })}
          </div>

          {nextStep && <NextSectionButton label={nextStep.label} onClick={goNext} />}
          </AnalysisVisualLayer>
        </div>
      )}

      {/* Section 2: Flip the Logic */}
      {activeStep === "flip" && (
        <div className="space-y-4">
          <SectionHeader current={currentSectionNum} total={totalSections} label="Flip the Logic" icon={FlipHorizontal} />
          {/* Individual pitch deck toggles on each card below */}
          <div className="p-3 rounded-lg" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
            <p className="text-xs text-foreground/80 leading-relaxed">
              <strong>Methodology:</strong> Each assumption above is deliberately inverted to explore what happens when conventional wisdom is violated. This isn't contrarianism for its own sake — it's a structured technique to surface non-obvious opportunities that competitors overlook because they never question the status quo.
            </p>
          </div>

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
              <DetailPanel title="Why it creates value & mechanism" icon={Lightbulb} defaultOpen>
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
                <div className="flex items-center justify-between mt-2">
                  <InsightRating sectionId={`flip-${i}`} compact />
                  <PitchDeckToggle contentKey={`flippedLogic-${i}`} label="Include in Pitch" />
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
              {/* Explanatory banner */}
              <div className="p-4 rounded-xl space-y-2" style={{ background: "hsl(var(--primary) / 0.06)", border: "1.5px solid hsl(var(--primary) / 0.2)" }}>
                <p className="text-sm font-bold text-foreground">
                  We generated <span style={{ color: "hsl(var(--primary))" }}>{flippedIdeas.length} bold reinvention ideas</span> based on the assumptions and flipped logic above.
                </p>
                <ul className="text-xs text-foreground/70 space-y-1 ml-4 list-disc">
                  <li><strong>Love an idea?</strong> Save it or add its visual to your pitch deck.</li>
                  <li><strong>Want to change just one?</strong> Click <strong>Regenerate This Idea</strong> on the specific card — the other stays.</li>
                  <li><strong>Want all new ideas?</strong> Use the <strong>Regenerate All</strong> button below.</li>
                </ul>
              </div>

              <div className="flex items-center justify-end">
                {onRegenerateIdeas && (
                  <button
                    onClick={() => onRegenerateIdeas(userContext || undefined)}
                    disabled={generatingIdeas}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{ background: "hsl(var(--primary-muted))", color: "hsl(var(--primary))", border: "1px solid hsl(var(--primary) / 0.3)" }}
                  >
                    {generatingIdeas ? <><RefreshCw size={11} className="animate-spin" /> Generating…</> : <><Sparkles size={11} /> Regenerate All</>}
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
                      pitchDeckImages={analysisCtx.pitchDeckImages}
                      onSelectForPitch={analysisCtx.setPitchDeckImage}
                      onRemoveFromPitch={analysisCtx.removePitchDeckImage}
                      onRegenerateSingle={onRegenerateIdeas ? () => onRegenerateIdeas(`REGENERATE_SINGLE:${i}:${userContext || ""}`) : undefined}
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
