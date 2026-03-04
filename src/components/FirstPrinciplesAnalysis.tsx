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
import { StepLoadingTracker, DISRUPT_TASKS, REDESIGN_TASKS } from "@/components/StepLoadingTracker";
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
};

const REDESIGN_SECTION_DESCRIPTIONS_NAV: Record<string, string> = {
  flip: "Inverted logic & bold alternatives",
  ideas: "Flipped product ideas & innovations",
  concept: "Redesigned concept & radical differences",
};

// ── Exported section descriptions for Intel Report tabs ──
export const INTEL_SECTION_DESCRIPTIONS: Record<string, string> = {
  reality: "True problem, actual usage & user hacks",
  physical: "Size, weight, form factor & ergonomic gaps",
  workflow: "Step-by-step journey & friction points",
};

// ── Exported section descriptions for Redesign step ──
export const REDESIGN_SECTION_DESCRIPTIONS: Record<string, string> = {
  flip: "Inverted logic & bold alternatives",
  ideas: "Flipped product ideas & innovations",
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
  onAnalysisStarted?: () => void;
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

/* ── Assumption Card List with show-more gate ── */
function AssumptionCardList({ assumptions, showLimit, reasonBorder }: { assumptions: HiddenAssumption[]; showLimit: number; reasonBorder: Record<string, string> }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? assumptions : assumptions.slice(0, showLimit);

  return (
    <>
      <div className="space-y-3">
        {visible.map((a, i) => {
          const reasonStyle = REASON_COLORS[a.reason] || REASON_COLORS.habit;
          const borderColor = reasonBorder[a.reason] || "hsl(var(--border))";
          const leveragePercent = a.leverageScore != null ? (a.leverageScore / 10) * 100 : 0;
          const leverageColor = a.leverageScore != null
            ? a.leverageScore >= 8 ? "hsl(var(--destructive))" : a.leverageScore >= 5 ? "hsl(38 92% 42%)" : "hsl(142 70% 35%)"
            : "hsl(var(--muted-foreground))";

          return (
            <div key={i} className="rounded-xl overflow-hidden" style={{ background: "hsl(var(--card))", borderLeft: `4px solid ${borderColor}`, border: `1.5px solid ${a.isChallengeable ? "hsl(var(--primary) / 0.25)" : "hsl(var(--border))"}`, borderLeftWidth: "4px", borderLeftColor: borderColor }}>
              <div className="p-4 space-y-3">
                <p className="text-[13px] font-bold text-foreground flex items-start gap-2.5">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5" style={{ background: "hsl(var(--foreground))", color: "hsl(var(--background))" }}>{i + 1}</span>
                  <span className="leading-snug">{a.assumption}</span>
                </p>
                <div className="ml-8 flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold" style={{ background: reasonStyle.bg, color: reasonStyle.text, border: `1px solid ${borderColor}40` }}>
                    {reasonStyle.label}
                  </span>
                  {a.isChallengeable && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold" style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))", border: "1px solid hsl(var(--primary) / 0.25)" }}>
                      ✓ Challengeable
                    </span>
                  )}
                  {a.leverageScore != null && (
                    <div className="flex items-center gap-1.5 flex-1 min-w-[120px] max-w-[200px]">
                      <div className="h-1.5 rounded-full overflow-hidden flex-1" style={{ background: "hsl(var(--muted))" }}>
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${leveragePercent}%`, background: leverageColor }} />
                      </div>
                      <span className="text-[10px] font-bold tabular-nums" style={{ color: leverageColor }}>{a.leverageScore}/10</span>
                    </div>
                  )}
                </div>
                <div className="ml-8 pl-3 py-1.5" style={{ borderLeft: "2px solid hsl(var(--border))" }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Current State</p>
                  <p className="text-xs text-foreground/70 leading-relaxed italic">"{a.currentAnswer}"</p>
                </div>
                {a.challengeIdea && (
                  <div className="ml-8 p-3 rounded-lg" style={{ background: "hsl(var(--primary) / 0.05)", border: "1.5px solid hsl(var(--primary) / 0.2)" }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "hsl(var(--primary))" }}>Challenge Approach</p>
                    <p className="text-xs text-foreground/80 leading-relaxed">{a.challengeIdea}</p>
                  </div>
                )}
                <div className="ml-8 flex items-center justify-end">
                  <PitchDeckToggle contentKey={`assumptions-${i}`} label="Include in Pitch" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {assumptions.length > showLimit && (
        <button onClick={() => setShowAll(!showAll)} className="w-full py-2.5 rounded-xl text-xs font-bold transition-all"
          style={{ background: "hsl(var(--muted))", color: "hsl(var(--primary))", border: "1.5px solid hsl(var(--primary) / 0.2)" }}>
          {showAll ? "Show fewer" : `Show ${assumptions.length - showLimit} more assumptions`}
        </button>
      )}
    </>
  );
}

/* ── Flip Card List with show-more gate ── */
function FlipCardList({ flips, assumptions, showLimit }: { flips: FlippedLogicItem[]; assumptions: HiddenAssumption[]; showLimit: number }) {
  const [showAll, setShowAll] = useState(false);
  const [expandedFlip, setExpandedFlip] = useState<number | null>(null);
  const visible = showAll ? flips : flips.slice(0, showLimit);

  return (
    <>
      <div className="space-y-3">
        {visible.map((item, i) => {
          const isExpanded = expandedFlip === i;
          const matchedAssumption = assumptions.find(a =>
            item.originalAssumption.toLowerCase().includes(a.assumption.toLowerCase().slice(0, 20))
          );
          const leverageScore = matchedAssumption?.leverageScore;
          const rationalePreview = item.rationale?.length > 120 ? item.rationale.slice(0, 120) + "…" : item.rationale;

          return (
            <div key={i} className="rounded-xl overflow-hidden" style={{ background: "hsl(var(--card))", border: "1.5px solid hsl(var(--border))" }}>
              <div className="grid grid-cols-[1fr_auto_1fr]">
                <div className="p-3.5" style={{ background: "hsl(var(--muted))" }}>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Assumption</p>
                  <p className="text-xs text-foreground/70 leading-relaxed">{item.originalAssumption}</p>
                </div>
                <div className="flex items-center justify-center px-2.5" style={{ background: "hsl(var(--primary))" }}>
                  <FlipHorizontal size={14} style={{ color: "hsl(var(--background))" }} />
                </div>
                <div className="p-3.5" style={{ background: "hsl(var(--primary) / 0.06)" }}>
                  <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: "hsl(var(--primary))" }}>Bold Alternative</p>
                  <p className="text-xs font-semibold leading-relaxed text-foreground">{item.boldAlternative}</p>
                </div>
              </div>
              <div className="px-4 py-3 space-y-2" style={{ borderTop: "1px solid hsl(var(--border))" }}>
                <div className="flex items-start justify-between gap-3">
                  {!isExpanded && <p className="text-xs text-foreground/70 leading-relaxed flex-1">{rationalePreview}</p>}
                  {isExpanded && <div className="flex-1" />}
                  {leverageScore != null && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold flex-shrink-0 tabular-nums" style={{
                      background: leverageScore >= 7 ? "hsl(var(--primary) / 0.1)" : "hsl(var(--muted))",
                      color: leverageScore >= 7 ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))",
                      border: `1px solid ${leverageScore >= 7 ? "hsl(var(--primary) / 0.25)" : "hsl(var(--border))"}`
                    }}>
                      Leverage: {leverageScore}/10
                    </span>
                  )}
                </div>
                {!isExpanded && item.rationale?.length > 120 && (
                  <button onClick={() => setExpandedFlip(i)} className="text-[11px] font-bold" style={{ color: "hsl(var(--primary))" }}>
                    Read full analysis →
                  </button>
                )}
                {isExpanded && (
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Why This Creates Value</p>
                        <p className="text-xs text-foreground/80 leading-relaxed">{item.rationale}</p>
                      </div>
                      <div className="p-3 rounded-lg" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">How It Works</p>
                        <p className="text-xs text-foreground/80 leading-relaxed">{item.physicalMechanism}</p>
                      </div>
                    </div>
                    <button onClick={() => setExpandedFlip(null)} className="text-[11px] font-bold" style={{ color: "hsl(var(--muted-foreground))" }}>
                      Collapse ↑
                    </button>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1">
                  <InsightRating sectionId={`flip-${i}`} compact />
                  <PitchDeckToggle contentKey={`flippedLogic-${i}`} label="Include in Pitch" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {flips.length > showLimit && (
        <button onClick={() => setShowAll(!showAll)} className="w-full py-2.5 rounded-xl text-xs font-bold transition-all"
          style={{ background: "hsl(var(--muted))", color: "hsl(var(--primary))", border: "1.5px solid hsl(var(--primary) / 0.2)" }}>
          {showAll ? "Show fewer" : `Show ${flips.length - showLimit} more inversions`}
        </button>
      )}
    </>
  );
}

export const FirstPrinciplesAnalysis = ({ product, onSaved, flippedIdeas, onRegenerateIdeas, generatingIdeas, onPatentSave, externalData, onDataLoaded, onAnalysisStarted, renderMode, autoTrigger, userScores, onScoreChange }: FirstPrinciplesAnalysisProps & { onSaved?: () => void; userScores?: Record<string, Record<string, number>>; onScoreChange?: (ideaId: string, scoreKey: string, value: number) => void }) => {

  const scrollToSteps = () => setTimeout(() => document.querySelector('[data-fp-steps]')?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  const { user } = useAuth();
  const analysisCtx = useAnalysis();
  const [data, setData] = useState<FirstPrinciplesData | null>((externalData as FirstPrinciplesData) || null);
  const [loading, setLoading] = useState(false);
  const isService = product.category === "Service";
  const [activeStep, setActiveStep] = useState<"assumptions" | "flip" | "ideas" | "concept">(renderMode === "redesign" ? "flip" : "assumptions");
  const [visitedFPSteps, setVisitedFPSteps] = useState<Set<string>>(new Set([renderMode === "redesign" ? "flip" : "assumptions"]));
  const [userContext, setUserContext] = useState("");
  const [rerunSuggestions, setRerunSuggestions] = useState("");
  const autoTriggered = useRef(false);

  // Sync externalData → internal data when it changes (e.g. navigating back to a completed step)
  useEffect(() => {
    if (externalData && !data) {
      setData(externalData as FirstPrinciplesData);
    }
  }, [externalData]); // eslint-disable-line react-hooks/exhaustive-deps
  

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
    onAnalysisStarted?.();
    try {
      // Build request body — enrich with user curation context for redesign mode
      const requestBody: Record<string, unknown> = { product, userSuggestions: rerunSuggestions || undefined, adaptiveContext: analysisCtx.adaptiveContext || undefined };
      if (renderMode === "redesign") {
        requestBody.insightPreferences = analysisCtx.insightPreferences;
        requestBody.userScores = analysisCtx.userScores;
        requestBody.steeringText = analysisCtx.steeringText;
        // Only send the fields the edge function actually uses (hiddenAssumptions, flippedLogic)
        // to avoid oversized payloads from sending the full disrupt analysis blob
        if (analysisCtx.disruptData) {
          const dd = analysisCtx.disruptData as Record<string, unknown>;
          requestBody.disruptContext = {
            hiddenAssumptions: dd.hiddenAssumptions || null,
            flippedLogic: dd.flippedLogic || null,
          };
        }
        // Note: selectedImages is not used by the edge function — omitted to reduce payload size
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


  // Auto-trigger redesign when arriving with outdated or missing data
  useEffect(() => {
    if (autoTrigger && renderMode === "redesign" && !loading && !autoTriggered.current) {
      autoTriggered.current = true;
      runAnalysis();
    }
  }, [autoTrigger, renderMode, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  const allSteps = renderMode === "redesign"
    ? [
        { id: "flip" as const, label: "Flip the Logic", icon: FlipHorizontal },
        { id: "ideas" as const, label: "Flipped Ideas", icon: Zap },
        { id: "concept" as const, label: "Redesigned Concept", icon: Sparkles },
      ]
    : [
        { id: "assumptions" as const, label: "Assumptions", icon: Brain },
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
        tasks={renderMode === "redesign" ? REDESIGN_TASKS : DISRUPT_TASKS}
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
            Deep analysis of <strong>{product.name}</strong> — questioning every assumption holding the current product together.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 max-w-[160px]">
          {[
            { icon: Brain, label: "Assumptions" },
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
    const flips = data.flippedLogic || [];
    const assumptions = data.hiddenAssumptions || [];

    return (
      <div className="space-y-4" data-fp-steps>
        {/* Header + re-run */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "hsl(38 92% 50%)" }}>
              <Sparkles size={14} style={{ color: "white" }} />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-sm leading-tight">Redesign: {product.name}</h3>
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

        {/* Section Navigator */}
        <SectionWorkflowNav
          tabs={allSteps}
          activeId={activeStep}
          visitedIds={visitedFPSteps}
          onSelect={(id) => { setActiveStep(id as typeof activeStep); setVisitedFPSteps(prev => new Set([...prev, id])); scrollToSteps(); }}
          descriptions={REDESIGN_SECTION_DESCRIPTIONS_NAV}
          journeyLabel="Redesign Sections"
        />

        {/* ── Section: Flip the Logic ── */}
        {activeStep === "flip" && (() => {
          const reasonCounts: Record<string, number> = {};
          assumptions.forEach(a => { reasonCounts[a.reason] = (reasonCounts[a.reason] || 0) + 1; });
          const highLeverageCount = assumptions.filter(a => (a.leverageScore || 0) >= 7).length;
          const SHOW_LIMIT = 10;

          if (flips.length === 0) {
            return (
              <div className="space-y-4">
                <SectionHeader current={currentSectionNum} total={totalSections} label="Flip the Logic" icon={FlipHorizontal} />
                <div className="text-center py-10 space-y-3">
                  <FlipHorizontal size={32} className="mx-auto" style={{ color: "hsl(var(--muted-foreground))" }} />
                  <p className="text-sm font-bold text-foreground">No inversion data available</p>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">Run the Disrupt step first to generate assumption inversions.</p>
                </div>
                {nextStep && <NextSectionButton label={nextStep.label} onClick={goNext} />}
              </div>
            );
          }

          return (
            <div className="space-y-4">
              <SectionHeader current={currentSectionNum} total={totalSections} label="Flip the Logic" icon={FlipHorizontal} />
              <div className="flex flex-wrap gap-2 mb-2">
                <span className="px-2 py-1 rounded-md text-xs font-bold" style={{ background: "hsl(var(--primary-muted))", color: "hsl(var(--primary))" }}>
                  {flips.length} inversions
                </span>
                {highLeverageCount > 0 && (
                  <span className="px-2 py-1 rounded-md text-xs font-bold" style={{ background: "hsl(0 70% 50% / 0.12)", color: "hsl(0 70% 50%)" }}>
                    {highLeverageCount} high leverage
                  </span>
                )}
              </div>
              <FlipCardList flips={flips} assumptions={assumptions} showLimit={SHOW_LIMIT} />
              {nextStep && <NextSectionButton label={nextStep.label} onClick={goNext} />}
            </div>
          );
        })()}

        {/* ── Section: Flipped Ideas ── */}
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
                <div className="p-4 rounded-xl space-y-2" style={{ background: "hsl(var(--primary) / 0.06)", border: "1.5px solid hsl(var(--primary) / 0.2)" }}>
                  <p className="text-sm font-bold text-foreground">
                    We generated <span style={{ color: "hsl(var(--primary))" }}>{flippedIdeas.length} bold reinvention ideas</span> based on the assumptions and flipped logic from Disrupt.
                  </p>
                  <ul className="text-xs text-foreground/70 space-y-1 ml-4 list-disc">
                    <li><strong>Love an idea?</strong> Save it or add its visual to your pitch deck.</li>
                    <li><strong>Want to change just one?</strong> Click <strong>Regenerate This Idea</strong> on the specific card.</li>
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
                No flipped ideas yet. Run the Disrupt analysis first.
              </div>
            )}
            {nextStep && <NextSectionButton label={nextStep.label} onClick={goNext} />}
          </div>
        )}

        {/* ── Section: Redesigned Concept ── */}
        {activeStep === "concept" && (() => {
          if (!concept) {
            return (
              <div className="space-y-4">
                <SectionHeader current={currentSectionNum} total={totalSections} label="Redesigned Concept" icon={Sparkles} />
                <div className="text-center py-10 space-y-3">
                  <Sparkles size={32} className="mx-auto" style={{ color: "hsl(var(--muted-foreground))" }} />
                  <p className="text-sm font-bold text-foreground">No redesign concept yet</p>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">Click <strong>Re-run</strong> above to generate a redesigned concept.</p>
                </div>
              </div>
            );
          }

          return (
            <div className="space-y-4">
              <SectionHeader current={currentSectionNum} total={totalSections} label="Redesigned Concept" icon={Sparkles} />

              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-bold text-foreground text-sm">{concept.conceptName}</h4>
                <span className="text-xs text-muted-foreground">— {concept.tagline}</span>
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
                  {(concept.radicalDifferences || []).map((diff: string, i: number) => (
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
                    {(concept.materials || []).map((m: string, i: number) => (
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
                    {concept.smartFeatures.map((f: string, i: number) => (
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
                    {concept.frictionEliminated.map((f: string, i: number) => (
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

              {/* All sections done */}
              <div className="text-center py-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold" style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))" }}>
                  <CheckCircle2 size={14} style={{ color: "hsl(142 70% 40%)" }} /> All sections explored
                </div>
              </div>
            </div>
          );
        })()}
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
            <p className="typo-card-meta text-muted-foreground">Hidden assumptions & leverage analysis</p>
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

      {/* Single section — no nav needed */}

      {/* ═══════ SECTION CONTENT ═══════ */}

      {/* Section 1: Hidden Assumptions */}
      {activeStep === "assumptions" && (() => {
        const assumptions = data.hiddenAssumptions || [];
        const challengeableCount = assumptions.filter(a => a.isChallengeable).length;
        const avgLeverage = assumptions.length > 0
          ? (assumptions.reduce((s, a) => s + (a.leverageScore || 0), 0) / assumptions.length).toFixed(1)
          : "0";
        const reasonCounts: Record<string, number> = {};
        assumptions.forEach(a => { reasonCounts[a.reason] = (reasonCounts[a.reason] || 0) + 1; });
        const topReason = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0];
        const SHOW_LIMIT = 10;

        const REASON_BORDER: Record<string, string> = {
          tradition: "hsl(38 92% 50%)",
          manufacturing: "hsl(217 91% 55%)",
          cost: "hsl(142 70% 40%)",
          physics: "hsl(271 81% 50%)",
          habit: "hsl(330 80% 50%)",
        };

        if (assumptions.length === 0) {
          return (
            <div className="space-y-4">
              <SectionHeader current={currentSectionNum} total={totalSections} label="Hidden Assumptions" icon={Brain} />
              <div className="text-center py-10 space-y-3">
                <Brain size={32} className="mx-auto" style={{ color: "hsl(var(--muted-foreground))" }} />
                <p className="text-sm font-bold text-foreground">No assumption data available</p>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">This analysis was saved before assumption data was captured. Click <strong>Re-run</strong> above to regenerate the full Disrupt analysis with enriched assumptions and flipped logic.</p>
              </div>
              {nextStep && <NextSectionButton label={nextStep.label} onClick={goNext} />}
            </div>
          );
        }

        return (
        <div className="space-y-4">
          <SectionHeader current={currentSectionNum} total={totalSections} label="Hidden Assumptions" icon={Brain} />

          <AnalysisVisualLayer analysis={data as unknown as Record<string, unknown>} step="firstPrinciples" governedOverride={analysisCtx.governedData}>

          {/* ── Stats Strip ── */}
          <div className="flex items-center gap-2 flex-wrap">
            {[
              `${assumptions.length} Assumptions`,
              `${challengeableCount} Challengeable`,
              `Avg Leverage: ${avgLeverage}/10`,
              ...(topReason ? [`Top reason: ${REASON_COLORS[topReason[0]]?.label || topReason[0]}`] : []),
            ].map((label, ci) => (
              <span key={ci} className="px-2.5 py-1 rounded-lg text-[11px] font-bold tabular-nums"
                style={{ background: "hsl(var(--primary) / 0.08)", color: "hsl(var(--primary))", border: "1px solid hsl(var(--primary) / 0.2)" }}>
                {label}
              </span>
            ))}
          </div>

          {/* ── Approach Banner ── */}
          <div className="rounded-xl p-4 space-y-2" style={{ background: "hsl(var(--card))", borderLeft: "4px solid hsl(var(--primary))", border: "1.5px solid hsl(var(--border))", borderLeftWidth: "4px", borderLeftColor: "hsl(var(--primary))" }}>
            <p className="text-[13px] font-bold text-foreground">Analytical Approach</p>
            <ul className="text-xs text-foreground/80 leading-relaxed space-y-1.5 ml-4 list-disc">
              <li>We deconstructed <strong>{assumptions.length} hidden assumptions</strong> governing how this product is designed, priced, and used.</li>
              <li>Each assumption was classified by root cause: {Object.entries(reasonCounts).map(([r, c]) => `${c} from ${REASON_COLORS[r]?.label || r}`).join(", ")}.</li>
              <li><strong>{challengeableCount} assumptions</strong> ({assumptions.length > 0 ? Math.round(challengeableCount / assumptions.length * 100) : 0}%) are realistically challengeable with current technology or business model innovation.</li>
              <li>Average leverage score across all assumptions: <strong>{avgLeverage}/10</strong> — indicating the potential value unlocked by challenging the status quo.</li>
              <li>Assumptions scored by their disruption potential: higher leverage = bigger opportunity if successfully challenged.</li>
            </ul>
          </div>

          {/* ── Assumption Cards ── */}
          <AssumptionCardList assumptions={assumptions} showLimit={SHOW_LIMIT} reasonBorder={REASON_BORDER} />

          {nextStep && <NextSectionButton label={nextStep.label} onClick={goNext} />}
          </AnalysisVisualLayer>
        </div>
        );
      })()}

      {/* "All sections explored" for single-section Disrupt mode */}
      {activeStep === "assumptions" && !nextStep && (
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold" style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))" }}>
            <CheckCircle2 size={14} style={{ color: "hsl(142 70% 40%)" }} /> Assumptions mapped — continue to Redesign for inversions &amp; ideas
          </div>
        </div>
      )}

    </div>
  );
};
