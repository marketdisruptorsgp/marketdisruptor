import { useState, useEffect, useRef } from "react";
import { PitchDeckToggle } from "@/components/PitchDeckToggle";
import { AnalysisVisualLayer } from "./AnalysisVisualLayer";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { supabase } from "@/integrations/supabase/client";
import { invokeWithTimeout } from "@/lib/invokeWithTimeout";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { Product, FlippedIdea } from "@/data/mockProducts";
import { FlippedIdeaCard } from "@/components/FlippedIdeaCard";
import { RedesignVisualGenerator } from "@/components/RedesignVisualGenerator";

import { LeverageScore } from "@/components/LeverageScore";
import { RiskBadge } from "@/components/RiskBadge";
import { PatentIntelligence } from "@/components/PatentIntelligence";
import { downloadPatentPDF } from "@/lib/pdfExport";
import { StepLoadingTracker, DISRUPT_TASKS, REDESIGN_TASKS } from "@/components/StepLoadingTracker";
import {
  Brain, Flame, Zap, ChevronDown, RefreshCw, AlertTriangle, CheckCircle2,
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
import { StructuralDiagnosisPanel } from "@/components/StructuralDiagnosisPanel";

// ── Standardized analysis components ──
import {
  StepCanvas,
  InsightCard,
  FrameworkPanel,
  SignalCard,
  VisualGrid,
  ExpandableDetail,
  MetricCard,
  AnalysisPanel,
} from "@/components/analysis/AnalysisComponents";

// Section description exports
export const INTEL_SECTION_DESCRIPTIONS: Record<string, string> = {
  reality: "True problem, actual usage & user hacks",
  physical: "Size, weight, form factor & ergonomic gaps",
  workflow: "Step-by-step journey & friction points",
};

export const REDESIGN_SECTION_DESCRIPTIONS: Record<string, string> = {
  flip: "Inverted logic & bold alternatives",
  ideas: "Flipped product ideas & innovations",
  concept: "Redesigned concept & radical differences",
};

// Interfaces
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
  sizeAnalysis?: string;
  weightAnalysis?: string;
  formFactorAnalysis?: string;
  staticVsDynamic?: string;
  ergonomicGaps?: string[];
  dimensionOpportunities?: string[];
  gaps?: string[];
  opportunities?: string[];
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
  impactScenario?: string;
  competitiveBlindSpot?: string;
  urgencySignal?: "eroding" | "stable" | "emerging";
  urgencyReason?: string;
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
  runTrigger?: number;
  onLoadingChange?: (loading: boolean) => void;
  onDataLoaded?: (data: unknown) => void;
  onAnalysisStarted?: () => void;
  renderMode?: "disrupt" | "redesign";
  autoTrigger?: boolean;
  activeSection?: "flip" | "ideas" | "concept";
}

const REASON_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  tradition: { bg: "hsl(38 92% 50% / 0.1)", text: "hsl(38 92% 35%)", label: "Tradition" },
  manufacturing: { bg: "hsl(217 91% 60% / 0.1)", text: "hsl(217 91% 40%)", label: "Mfg Limits" },
  cost: { bg: "hsl(142 70% 45% / 0.1)", text: "hsl(142 70% 30%)", label: "Cost" },
  physics: { bg: "hsl(271 81% 56% / 0.1)", text: "hsl(271 81% 40%)", label: "Physics" },
  habit: { bg: "hsl(330 80% 55% / 0.1)", text: "hsl(330 80% 40%)", label: "Habit" },
};

const REASON_BORDER: Record<string, string> = {
  tradition: "hsl(38 92% 50%)",
  manufacturing: "hsl(217 91% 55%)",
  cost: "hsl(142 70% 40%)",
  physics: "hsl(271 81% 50%)",
  habit: "hsl(330 80% 50%)",
};

/* ── Map step text to a contextual Lucide icon ── */
const STEP_ICON_KEYWORDS: [string[], LucideIcon][] = [
  [["discover", "aware", "hear about", "learn about", "first encounter", "introduction"], Search],
  [["search", "browse", "look for", "find", "explore", "research", "compare"], Search],
  [["recommend", "referral", "word of mouth", "told about"], Users],
  [["evaluate", "assess", "consider", "weigh", "decide", "choose", "select", "pick"], Lightbulb],
  [["review", "rate", "feedback", "testimonial", "star", "reputation"], Star],
  [["compare", "alternative", "option", "versus", "vs"], Eye],
  [["sign up", "register", "create account", "onboard", "enroll", "join", "apply"], Lock],
  [["buy", "purchase", "order", "checkout", "add to cart", "subscribe"], ShoppingCart],
  [["pay", "payment", "price", "cost", "charge", "bill", "credit", "invoice", "fee"], CreditCard],
  [["download", "install", "get", "retrieve", "grab"], Download],
  [["setup", "configure", "install", "customize", "personalize", "adjust", "setting", "preference"], Settings],
  [["connect", "integrate", "link", "pair", "sync"], Globe],
  [["use", "engage", "interact", "experience", "start using", "begin", "launch", "open"], ArrowRight],
  [["book", "reserve", "schedule", "appointment", "session"], Clock],
  [["call", "phone", "contact", "reach out", "speak", "consult"], Phone],
  [["message", "chat", "communicate", "ask", "support", "help"], MessageSquare],
  [["email", "inbox", "notification", "alert", "notify"], Mail],
  [["upload", "submit", "attach", "send", "provide", "fill", "form"], Upload],
  [["watch", "observe", "view", "see", "inspect", "check", "monitor"], Eye],
  [["build", "create", "make", "prepare", "craft", "design", "produce"], Wrench],
  [["learn", "understand", "study", "train", "educate", "teach", "course"], Lightbulb],
  [["deliver", "ship", "receive", "package", "arrive", "pickup", "collect", "pick up"], Truck],
  [["wait", "pending", "processing", "loading", "queue"], Clock],
  [["return", "come back", "repeat", "renew", "reorder", "continue"], Home],
  [["share", "post", "social", "tell", "spread", "refer"], Share2],
  [["save", "favorite", "bookmark", "keep", "store", "remember"], Bookmark],
  [["track", "follow", "progress", "status", "update"], Eye],
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
  return ArrowRight;
}

/* ── Interactive Workflow Timeline (kept intact — unique visual) ── */
export function WorkflowTimeline({ steps, frictionPoints }: { steps: string[]; frictionPoints: WorkflowFriction[] }) {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const getFriction = (stepIndex: number, stepName: string): WorkflowFriction | undefined => {
    const byIndex = frictionPoints?.find(fp => fp.stepIndex === stepIndex);
    if (byIndex) return byIndex;
    return frictionPoints?.find(fp =>
      fp.step && (
        stepName.toLowerCase().includes(fp.step.toLowerCase()) ||
        fp.step.toLowerCase().includes(stepName.toLowerCase().slice(0, 12))
      )
    );
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--foreground))" }}>
          <Route size={13} style={{ color: "hsl(var(--background))" }} />
        </div>
        <p className="text-xs font-extrabold uppercase tracking-widest text-foreground">Current Journey</p>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>
          {steps.length} steps
        </span>
      </div>

      <div className="relative">
        {steps.slice(0, 8).map((step, i) => {
          const friction = getFriction(i, step);
          const isExpanded = expandedStep === i;
          const isLast = i === Math.min(steps.length, 8) - 1;
          const StepIcon = getStepIcon(step);

          return (
            <div key={i} className="flex items-start gap-3.5 relative">
              <div className="flex flex-col items-center flex-shrink-0 pt-0.5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center z-10 transition-all duration-300 shadow-sm"
                  style={{
                    background: isExpanded ? "hsl(var(--foreground))" : "hsl(var(--primary) / 0.08)",
                    color: isExpanded ? "hsl(var(--background))" : "hsl(var(--primary))",
                    border: isExpanded ? "none" : "1.5px solid hsl(var(--primary) / 0.15)",
                    transform: isExpanded ? "scale(1.12)" : "scale(1)",
                  }}
                >
                  <StepIcon size={18} strokeWidth={1.8} />
                </div>
                {!isLast && <div className="w-[1.5px] flex-1 min-h-[16px]" style={{ background: "hsl(var(--border))" }} />}
              </div>

              <button
                onClick={() => setExpandedStep(isExpanded ? null : i)}
                className="flex-1 text-left rounded-xl p-3.5 mb-2 transition-all duration-200 cursor-pointer group"
                style={{
                  background: isExpanded ? "hsl(var(--foreground) / 0.03)" : "hsl(var(--card))",
                  border: isExpanded ? "1.5px solid hsl(var(--foreground) / 0.15)" : "1px solid hsl(var(--border))",
                }}
              >
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-bold text-foreground leading-snug">{step}</p>
                  <ChevronDown size={13} className="text-muted-foreground flex-shrink-0 ml-2" style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
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

      {frictionPoints?.length > 0 && (
        <div className="flex items-center gap-2 pt-2 mt-1" style={{ borderTop: "1px solid hsl(var(--border))" }}>
          <AlertTriangle size={12} style={{ color: "hsl(var(--muted-foreground))" }} />
          <span className="text-[11px] font-semibold text-muted-foreground">
            {frictionPoints.length} friction point{frictionPoints.length !== 1 ? "s" : ""} identified
          </span>
        </div>
      )}
    </div>
  );
}

/* ── Assumption Card List — using standardized InsightCard ── */
function AssumptionCardList({ assumptions, showLimit }: { assumptions: HiddenAssumption[]; showLimit: number }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? assumptions : assumptions.slice(0, showLimit);

  return (
    <>
      <VisualGrid columns={1}>
        {visible.map((a, i) => {
          const reasonStyle = REASON_COLORS[a.reason] || REASON_COLORS.habit;
          const leverageColor = a.leverageScore != null
            ? a.leverageScore >= 8 ? "hsl(var(--destructive))" : a.leverageScore >= 5 ? "hsl(38 92% 42%)" : "hsl(142 70% 35%)"
            : "hsl(var(--muted-foreground))";

          return (
            <InsightCard
              key={i}
              headline={a.assumption}
              subtext={a.currentAnswer}
              accentColor={REASON_BORDER[a.reason] || "hsl(var(--border))"}
              badge={reasonStyle.label}
              badgeColor={reasonStyle.text}
              action={
                <div className="flex items-center gap-2">
                  {a.urgencySignal === "eroding" && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ background: "hsl(0 70% 50% / 0.1)", color: "hsl(0 70% 50%)" }}>↓ Eroding</span>
                  )}
                  {a.urgencySignal === "emerging" && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ background: "hsl(142 70% 40% / 0.1)", color: "hsl(142 70% 35%)" }}>↑ Emerging</span>
                  )}
                  {a.leverageScore != null && (
                    <span className="text-[11px] font-bold tabular-nums" style={{ color: leverageColor }}>{a.leverageScore}/10</span>
                  )}
                  {a.isChallengeable && (
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "hsl(var(--primary))" }} title="Challengeable" />
                  )}
                  <PitchDeckToggle contentKey={`assumptions-${i}`} label="Pitch" />
                </div>
              }
              detail={
                <div className="space-y-3">
                  {a.urgencySignal && a.urgencyReason && (
                    <SignalCard
                      label={a.urgencySignal === "eroding" ? "Eroding Now" : a.urgencySignal === "emerging" ? "Emerging Opportunity" : "Stable"}
                      type={a.urgencySignal === "eroding" ? "threat" : a.urgencySignal === "emerging" ? "opportunity" : "neutral"}
                      explanation={a.urgencyReason}
                    />
                  )}
                  {a.leverageScore != null && (
                    <MetricCard label="Leverage Score" value={`${a.leverageScore}/10`} accentColor={leverageColor} />
                  )}
                  {a.impactScenario && (
                    <InsightCard headline="If challenged successfully" subtext={a.impactScenario} accentColor="hsl(142 70% 40%)" />
                  )}
                  {a.competitiveBlindSpot && (
                    <InsightCard headline="Who's vulnerable" subtext={a.competitiveBlindSpot} accentColor="hsl(38 92% 35%)" />
                  )}
                  {a.challengeIdea && (
                    <InsightCard headline="How to challenge this" subtext={a.challengeIdea} accentColor="hsl(var(--primary))" />
                  )}
                </div>
              }
            />
          );
        })}
      </VisualGrid>
      {assumptions.length > showLimit && (
        <button onClick={() => setShowAll(!showAll)} className="w-full py-2.5 rounded-xl text-xs font-bold transition-all"
          style={{ background: "hsl(var(--muted))", color: "hsl(var(--primary))", border: "1.5px solid hsl(var(--primary) / 0.2)" }}>
          {showAll ? "Show fewer" : `Show ${assumptions.length - showLimit} more assumptions`}
        </button>
      )}
    </>
  );
}

/* ── Flip Card List — using standardized InsightCard ── */
function FlipCardList({ flips, assumptions, showLimit }: { flips: FlippedLogicItem[]; assumptions: HiddenAssumption[]; showLimit: number }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? flips : flips.slice(0, showLimit);

  return (
    <>
      <div className="space-y-4">
        {visible.map((item, i) => {
          const matchedAssumption = assumptions.find(a =>
            item.originalAssumption.toLowerCase().includes(a.assumption.toLowerCase().slice(0, 20))
          );
          const leverageScore = matchedAssumption?.leverageScore;

          return (
            <InsightCard
              key={i}
              headline={item.boldAlternative}
              subtext={item.rationale}
              accentColor="hsl(var(--primary))"
              badge={`was: ${item.originalAssumption.slice(0, 30)}${item.originalAssumption.length > 30 ? "…" : ""}`}
              badgeColor="hsl(var(--muted-foreground))"
              action={
                <div className="flex items-center gap-2">
                  {leverageScore != null && (
                    <span className="text-[11px] font-bold tabular-nums" style={{
                      color: leverageScore >= 8 ? "hsl(var(--primary))" : leverageScore >= 6 ? "hsl(38 92% 50%)" : "hsl(var(--muted-foreground))",
                    }}>
                      {leverageScore}/10
                    </span>
                  )}
                  <InsightRating sectionId={`flip-${i}`} compact />
                  <PitchDeckToggle contentKey={`flippedLogic-${i}`} label="Pitch" />
                </div>
              }
              detail={
                <div className="space-y-3">
                  <VisualGrid columns={2}>
                    <div className="p-3.5 rounded-xl" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-2">Why This Creates Value</p>
                      <p className="text-xs text-foreground/80 leading-relaxed">{item.rationale}</p>
                    </div>
                    <div className="p-3.5 rounded-xl" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-2">How It Works</p>
                      <p className="text-xs text-foreground/80 leading-relaxed">{item.physicalMechanism}</p>
                    </div>
                  </VisualGrid>
                  {matchedAssumption?.impactScenario && (
                    <InsightCard headline="Impact Scenario" subtext={matchedAssumption.impactScenario} accentColor="hsl(var(--primary))" />
                  )}
                </div>
              }
            />
          );
        })}
      </div>
      {flips.length > showLimit && (
        <button onClick={() => setShowAll(!showAll)} className="w-full py-3 rounded-xl text-xs font-bold transition-all"
          style={{ background: "hsl(var(--muted))", color: "hsl(var(--primary))", border: "1.5px solid hsl(var(--primary) / 0.2)" }}>
          {showAll ? "Show fewer" : `Show ${flips.length - showLimit} more inversions`}
        </button>
      )}
    </>
  );
}

export const FirstPrinciplesAnalysis = ({ product, onSaved, flippedIdeas, onRegenerateIdeas, generatingIdeas, onPatentSave, externalData, onDataLoaded, onAnalysisStarted, renderMode, autoTrigger, userScores, onScoreChange, runTrigger, onLoadingChange, activeSection }: FirstPrinciplesAnalysisProps & { onSaved?: () => void; userScores?: Record<string, Record<string, number>>; onScoreChange?: (ideaId: string, scoreKey: string, value: number) => void }) => {

  const scrollToSteps = () => setTimeout(() => document.querySelector('[data-fp-steps]')?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  const { user } = useAuth();
  const analysisCtx = useAnalysis();
  const [data, setData] = useState<FirstPrinciplesData | null>((externalData as FirstPrinciplesData) || null);
  const [loading, setLoading] = useState(false);
  const isService = product.category === "Service";
  const [activeStep, setActiveStep] = useState<"assumptions" | "flip" | "ideas" | "concept">(renderMode === "redesign" ? (activeSection || "flip") : "assumptions");
  const [visitedFPSteps, setVisitedFPSteps] = useState<Set<string>>(new Set([renderMode === "redesign" ? (activeSection || "flip") : "assumptions"]));

  useEffect(() => {
    if (activeSection && renderMode === "redesign") {
      setActiveStep(activeSection);
      setVisitedFPSteps(prev => new Set([...prev, activeSection]));
    }
  }, [activeSection, renderMode]);
  const [userContext, setUserContext] = useState("");
  const [rerunSuggestions, setRerunSuggestions] = useState("");
  const autoTriggered = useRef(false);

  useEffect(() => {
    if (externalData && !data) {
      setData(externalData as FirstPrinciplesData);
    }
  }, [externalData]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save to workspace function
  const saveToWorkspace = async (analysisData: FirstPrinciplesData) => {
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

  // Run analysis function
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
      const requestBody: Record<string, unknown> = { product, userSuggestions: rerunSuggestions || undefined, adaptiveContext: analysisCtx.adaptiveContext || undefined, upstreamIntel: Object.keys(upstreamIntel).length > 0 ? upstreamIntel : undefined };
      if (renderMode === "redesign") {
        requestBody.insightPreferences = analysisCtx.insightPreferences;
        requestBody.userScores = analysisCtx.userScores;
        requestBody.steeringText = analysisCtx.steeringText;
        if (analysisCtx.disruptData) {
          const dd = analysisCtx.disruptData as Record<string, unknown>;
          requestBody.disruptContext = {
            hiddenAssumptions: dd.hiddenAssumptions || null,
            flippedLogic: dd.flippedLogic || null,
          };
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
        if (branchPayload) {
          requestBody.activeBranch = branchPayload;
        }
      }
      const { data: result, error } = await invokeWithTimeout("first-principles-analysis", {
        body: requestBody,
      }, 180_000);

      if (error || !result?.success) {
        const msg = result?.error || error?.message || "Analysis failed";
        console.error("[Redesign/Disrupt] Analysis failed:", { error, result, renderMode });
        if (msg.includes("Rate limit") || msg.includes("429")) {
          toast.error("Rate limit hit — please wait a moment and try again.");
        } else if (msg.includes("credits") || msg.includes("402")) {
          toast.error("Analysis credits exhausted — add credits in Settings → Workspace → Usage.");
        } else {
          toast.error("First principles analysis failed: " + msg);
        }
        return;
      }

      console.log("[FirstPrinciples] Edge function result keys:", Object.keys(result.analysis || {}));
      console.log("[FirstPrinciples] hiddenAssumptions count:", (result.analysis?.hiddenAssumptions || []).length);
      console.log("[FirstPrinciples] flippedLogic count:", (result.analysis?.flippedLogic || []).length);
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
              Generate a radical reinvention of <strong>{product.name}</strong> — combining all flipped ideas into a cohesive redesigned concept.
            </p>
          </div>
          <button onClick={runAnalysis} disabled={loading}
            className="flex items-center gap-2 px-6 py-3 rounded font-bold text-sm transition-colors"
            style={{ background: "hsl(38 92% 50%)", color: "white", opacity: loading ? 0.7 : 1 }}>
            <Sparkles size={15} /> Generate Redesign
          </button>
          <p className="text-[11px] font-bold text-muted-foreground">Uses Gemini 2.5 Pro · Deep analysis · ~30–60s</p>
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
            Deep analysis of <strong>{product.name}</strong> — questioning every assumption holding the current product together.
          </p>
        </div>
        <button onClick={runAnalysis} disabled={loading}
          className="flex items-center gap-2 px-6 py-3 rounded font-bold text-sm transition-colors"
          style={{ background: "hsl(var(--primary))", color: "white", opacity: loading ? 0.7 : 1 }}>
          <Brain size={15} /> Run Disrupt Analysis
        </button>
        <p className="text-[11px] font-bold text-muted-foreground">Uses Gemini 2.5 Pro · Deep analysis · ~30–60s</p>
      </div>
    );
  }

  // REDESIGN MODE
  if (renderMode === "redesign") {
    const concept = data.redesignedConcept;
    const flips = data.flippedLogic || [];
    const assumptions = data.hiddenAssumptions || [];

    return (
      <div className="space-y-4" data-fp-steps>
        {/* Section: Flip the Logic */}
        {activeStep === "flip" && (() => {
          const highLeverageCount = assumptions.filter(a => (a.leverageScore || 0) >= 7).length;
          const SHOW_LIMIT = 10;

          if (flips.length === 0) {
            return (
              <StepCanvas>
                <div className="text-center py-10 space-y-3">
                  <FlipHorizontal size={32} className="mx-auto" style={{ color: "hsl(var(--muted-foreground))" }} />
                  <p className="text-sm font-bold text-foreground">No inversion data available</p>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">Run the Disrupt step first to generate assumption inversions.</p>
                </div>
              </StepCanvas>
            );
          }

          return (
            <StepCanvas>
              <VisualGrid columns={2}>
                <MetricCard label="Inversions" value={String(flips.length)} accentColor="hsl(var(--primary))" />
                {highLeverageCount > 0 && (
                  <MetricCard label="High Leverage" value={String(highLeverageCount)} accentColor="hsl(var(--destructive))" />
                )}
              </VisualGrid>
              <FlipCardList flips={flips} assumptions={assumptions} showLimit={SHOW_LIMIT} />
            </StepCanvas>
          );
        })()}

        {/* Section: Flipped Ideas */}
        {activeStep === "ideas" && (
          <StepCanvas>
            <ExpandableDetail label="Steer ideas — add your goals, then regenerate" icon={Lightbulb}>
              <textarea
                value={userContext}
                onChange={(e) => setUserContext(e.target.value)}
                placeholder="e.g. Focus on eco-friendly materials, target Gen Z, keep under $30…"
                className="w-full rounded px-3 py-2 text-sm leading-relaxed resize-none transition-colors focus:outline-none mb-2"
                rows={2}
                style={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))" }}
              />
            </ExpandableDetail>

            {flippedIdeas && flippedIdeas.length > 0 ? (
              <>
                <InsightCard
                  icon={Sparkles}
                  headline={`${flippedIdeas.length} bold reinvention ideas generated`}
                  subtext="Based on assumptions and flipped logic from Disrupt."
                  accentColor="hsl(var(--primary))"
                />

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
                      onCompetitorsScouted={(comps) => {
                        const prev = analysisCtx.scoutedCompetitors || [];
                        const merged = [...prev, ...comps];
                        analysisCtx.setScoutedCompetitors(merged);
                        analysisCtx.saveStepData("scoutedCompetitors", merged);
                      }}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No flipped ideas yet. Run the Disrupt analysis first.
              </div>
            )}
          </StepCanvas>
        )}

        {/* Section: Redesigned Concept */}
        {activeStep === "concept" && (() => {
          const conceptIsEmpty = !concept || (!concept.conceptName && !concept.coreInsight && !concept.physicalDescription);
          if (conceptIsEmpty) {
            return (
              <StepCanvas>
                <div className="text-center py-10 space-y-4">
                  <Sparkles size={36} className="mx-auto" style={{ color: "hsl(38 92% 50%)" }} />
                  <p className="text-lg font-extrabold text-foreground">No redesign concept generated yet</p>
                  <p className="text-sm text-foreground/70 max-w-md mx-auto leading-relaxed">
                    Click <strong>Re-run Analysis</strong> above to generate a full redesigned concept.
                  </p>
                </div>
              </StepCanvas>
            );
          }

          return (
            <StepCanvas>
              {/* Concept hero */}
              <AnalysisPanel
                title={concept.conceptName}
                subtitle={concept.tagline}
                icon={Sparkles}
                eyebrow="Redesigned Concept"
                eyebrowColor="hsl(217 91% 45%)"
                accentColor="hsl(217 91% 45%)"
              >
                <InsightCard
                  headline={concept.coreInsight}
                  badge="Core Insight"
                  badgeColor="hsl(217 91% 45%)"
                  accentColor="hsl(217 91% 45%)"
                />
              </AnalysisPanel>

              {/* Radical Differences */}
              <FrameworkPanel title="Radical Differences" icon={Zap} subtitle={`${(concept.radicalDifferences || []).length} innovations`}>
                <VisualGrid columns={1}>
                  {(concept.radicalDifferences || []).map((diff: string, i: number) => (
                    <SignalCard key={i} label={diff} type="strength" />
                  ))}
                </VisualGrid>
              </FrameworkPanel>

              {/* Physical Form + Materials */}
              <VisualGrid columns={2}>
                <InsightCard
                  headline={concept.physicalDescription}
                  badge="Physical Form"
                  badgeColor="hsl(271 70% 45%)"
                  accentColor="hsl(271 70% 45%)"
                >
                  {concept.sizeAndWeight && <MetricCard label="Size & Weight" value={concept.sizeAndWeight} />}
                </InsightCard>
                <FrameworkPanel title="Materials" icon={Package}>
                  <div className="flex flex-wrap gap-2">
                    {(concept.materials || []).map((m: string, i: number) => (
                      <span key={i} className="px-3 py-1.5 rounded-lg text-sm" style={{ background: "hsl(271 70% 45% / 0.08)", color: "hsl(271 70% 40%)", border: "1px solid hsl(271 70% 45% / 0.15)" }}>{m}</span>
                    ))}
                  </div>
                </FrameworkPanel>
              </VisualGrid>

              {/* Smart Features */}
              {concept.smartFeatures?.length > 0 && (
                <FrameworkPanel title="Smart Features" icon={Cpu} subtitle={`${concept.smartFeatures.length} features`}>
                  <VisualGrid columns={2}>
                    {concept.smartFeatures.map((f: string, i: number) => (
                      <SignalCard key={i} label={f} type="opportunity" />
                    ))}
                  </VisualGrid>
                </FrameworkPanel>
              )}

              {/* UX Transformation */}
              <InsightCard
                icon={Users}
                headline={concept.userExperienceTransformation}
                badge="UX Transformation"
                badgeColor="hsl(152 60% 35%)"
                accentColor="hsl(152 60% 44%)"
              />

              {/* Friction Eliminated */}
              {concept.frictionEliminated?.length > 0 && (
                <FrameworkPanel title="Friction Eliminated" icon={CheckCircle2}>
                  <VisualGrid columns={1}>
                    {concept.frictionEliminated.map((f: string, i: number) => (
                      <SignalCard key={i} label={f} type="strength" />
                    ))}
                  </VisualGrid>
                </FrameworkPanel>
              )}

              {/* Business details — MetricCard grid */}
              <VisualGrid columns={4}>
                <MetricCard label="Price Point" value={concept.pricePoint} accentColor="hsl(217 91% 45%)" />
                <MetricCard label="Target User" value={concept.targetUser} accentColor="hsl(271 70% 45%)" />
                <MetricCard label="Capital Required" value={concept.capitalRequired || "—"} accentColor="hsl(152 60% 38%)" />
                <MetricCard label="Risk Level" value={concept.riskLevel || "—"} accentColor="hsl(200 80% 42%)" />
              </VisualGrid>

              {/* Why not done + Risk — expandable */}
              <ExpandableDetail label="Why it hasn't been done & biggest risk" icon={ShieldAlert} defaultExpanded>
                <div className="space-y-3">
                  <InsightCard headline={concept.whyItHasntBeenDone} badge="Why Not Yet" badgeColor="hsl(217 91% 38%)" accentColor="hsl(217 91% 45%)" />
                  <InsightCard headline={concept.biggestRisk} badge="Biggest Risk" badgeColor="hsl(271 70% 38%)" accentColor="hsl(271 70% 45%)" />
                  <InsightCard headline={concept.manufacturingPath} badge="Mfg Path" badgeColor="hsl(var(--foreground))" />
                </div>
              </ExpandableDetail>

              <div className="text-center py-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold" style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))" }}>
                  <CheckCircle2 size={14} style={{ color: "hsl(142 70% 40%)" }} /> All sections explored
                </div>
              </div>
            </StepCanvas>
          );
        })()}
      </div>
    );
  }

  // DISRUPT MODE (assumptions)
  return (
    <div className="space-y-4" data-fp-steps>
      {/* Header + re-run */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-foreground uppercase tracking-widest">Hidden Assumptions & Leverage Analysis</p>
        <button onClick={runAnalysis} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
          style={{ background: "hsl(var(--secondary))", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))" }}>
          {loading ? <RefreshCw size={11} className="animate-spin" /> : <RefreshCw size={11} />}
          Re-run
        </button>
      </div>

      {/* Steer AI */}
      <ExpandableDetail label="Refine your analysis — add direction, then Re-run" icon={Lightbulb}>
        <textarea
          value={rerunSuggestions}
          onChange={(e) => setRerunSuggestions(e.target.value)}
          placeholder="e.g. Focus on sustainability, explore modular design, target commercial users…"
          className="w-full rounded px-3 py-2.5 text-sm leading-relaxed resize-none transition-colors focus:outline-none mb-2"
          rows={2}
          style={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))" }}
        />
      </ExpandableDetail>

      {/* Structural Diagnosis */}
      <StructuralDiagnosisPanel constraintMap={analysisCtx.governedData?.constraint_map as any} />

      {/* Assumptions section */}
      {activeStep === "assumptions" && (() => {
        const assumptions = data.hiddenAssumptions || [];
        const challengeableCount = assumptions.filter(a => a.isChallengeable).length;
        const avgLeverage = assumptions.length > 0
          ? (assumptions.reduce((s, a) => s + (a.leverageScore || 0), 0) / assumptions.length).toFixed(1)
          : "0";
        const SHOW_LIMIT = 10;

        if (assumptions.length === 0) {
          return (
            <StepCanvas>
              <div className="text-center py-10 space-y-3">
                <Brain size={32} className="mx-auto" style={{ color: "hsl(var(--muted-foreground))" }} />
                <p className="text-sm font-bold text-foreground">No assumption data available</p>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">Click <strong>Re-run</strong> above to regenerate.</p>
              </div>
            </StepCanvas>
          );
        }

        return (
          <StepCanvas>
            <AnalysisVisualLayer analysis={data as unknown as Record<string, unknown>} step="firstPrinciples" governedOverride={analysisCtx.governedData}>

              {/* Highest-Leverage Move Banner */}
              {(() => {
                const topMove = assumptions
                  .filter(a => a.isChallengeable && (a.leverageScore || 0) >= 7)
                  .sort((a, b) => (b.leverageScore || 0) - (a.leverageScore || 0))[0];
                if (!topMove) return null;
                const erodingCount = assumptions.filter(a => a.urgencySignal === "eroding").length;
                return (
                  <div className="rounded-xl p-4 space-y-2" style={{ background: "hsl(var(--foreground))", border: "none" }}>
                    <div className="flex items-center gap-2">
                      <Flame size={14} style={{ color: "hsl(var(--background))" }} />
                      <p className="text-xs font-extrabold uppercase tracking-widest" style={{ color: "hsl(var(--background) / 0.7)" }}>Highest-Leverage Move</p>
                      {erodingCount > 0 && (
                        <span className="ml-auto px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ background: "hsl(0 70% 50% / 0.2)", color: "hsl(0 70% 65%)" }}>
                          {erodingCount} eroding now
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold leading-snug" style={{ color: "hsl(var(--background))" }}>
                      Challenge: "{topMove.assumption}"
                    </p>
                    {topMove.impactScenario && (
                      <p className="text-xs leading-relaxed" style={{ color: "hsl(var(--background) / 0.65)" }}>
                        {topMove.impactScenario}
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* Metric strip */}
              <VisualGrid columns={3}>
                <MetricCard label="Total Assumptions" value={String(assumptions.length)} />
                <MetricCard label="Challengeable" value={String(challengeableCount)} accentColor="hsl(var(--primary))" />
                <MetricCard label="Avg Leverage" value={`${avgLeverage}/10`} accentColor="hsl(38 92% 42%)" />
              </VisualGrid>

              <AssumptionCardList assumptions={assumptions} showLimit={SHOW_LIMIT} />

            </AnalysisVisualLayer>
          </StepCanvas>
        );
      })()}
    </div>
  );
};
