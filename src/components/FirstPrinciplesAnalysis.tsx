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

/* ── Assumption Card List — distilled, scannable, expand-for-detail ── */
function AssumptionCardList({ assumptions, showLimit, reasonBorder }: { assumptions: HiddenAssumption[]; showLimit: number; reasonBorder: Record<string, string> }) {
  const [showAll, setShowAll] = useState(false);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const visible = showAll ? assumptions : assumptions.slice(0, showLimit);

  return (
    <>
      <div className="space-y-2">
        {visible.map((a, i) => {
          const reasonStyle = REASON_COLORS[a.reason] || REASON_COLORS.habit;
          const borderColor = reasonBorder[a.reason] || "hsl(var(--border))";
          const leverageColor = a.leverageScore != null
            ? a.leverageScore >= 8 ? "hsl(var(--destructive))" : a.leverageScore >= 5 ? "hsl(38 92% 42%)" : "hsl(142 70% 35%)"
            : "hsl(var(--muted-foreground))";
          const isExpanded = expandedIdx === i;

          return (
            <div key={i} className="rounded-xl overflow-hidden transition-all" style={{ background: "hsl(var(--card))", borderLeft: `4px solid ${borderColor}`, border: `1.5px solid ${isExpanded ? "hsl(var(--primary) / 0.3)" : "hsl(var(--border))"}`, borderLeftWidth: "4px", borderLeftColor: borderColor }}>
              {/* ── Collapsed: one-line distilled view ── */}
              <button
                onClick={() => setExpandedIdx(isExpanded ? null : i)}
                className="w-full text-left px-4 py-3 flex items-center gap-3"
              >
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0" style={{ background: "hsl(var(--foreground))", color: "hsl(var(--background))" }}>{i + 1}</span>
                <span className="text-sm font-bold text-foreground flex-1 leading-snug">{a.assumption}</span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {a.urgencySignal === "eroding" && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ background: "hsl(0 70% 50% / 0.1)", color: "hsl(0 70% 50%)" }}>↓ Eroding</span>
                  )}
                  {a.urgencySignal === "emerging" && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ background: "hsl(142 70% 40% / 0.1)", color: "hsl(142 70% 35%)" }}>↑ Emerging</span>
                  )}
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ background: reasonStyle.bg, color: reasonStyle.text }}>
                    {reasonStyle.label}
                  </span>
                  {a.leverageScore != null && (
                    <span className="text-[11px] font-bold tabular-nums" style={{ color: leverageColor }}>{a.leverageScore}/10</span>
                  )}
                  {a.isChallengeable && (
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "hsl(var(--primary))" }} title="Challengeable" />
                  )}
                  <ChevronDown size={14} className="text-muted-foreground transition-transform" style={{ transform: isExpanded ? "rotate(180deg)" : "none" }} />
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 pt-0 space-y-3" style={{ borderTop: "1px solid hsl(var(--border))" }}>
                  {/* Urgency signal badge */}
                  {a.urgencySignal && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold" style={{
                        background: a.urgencySignal === "eroding" ? "hsl(0 70% 50% / 0.1)" : a.urgencySignal === "emerging" ? "hsl(142 70% 40% / 0.1)" : "hsl(var(--muted))",
                        color: a.urgencySignal === "eroding" ? "hsl(0 70% 50%)" : a.urgencySignal === "emerging" ? "hsl(142 70% 35%)" : "hsl(var(--muted-foreground))",
                        border: `1px solid ${a.urgencySignal === "eroding" ? "hsl(0 70% 50% / 0.2)" : a.urgencySignal === "emerging" ? "hsl(142 70% 40% / 0.2)" : "hsl(var(--border))"}`,
                      }}>
                        {a.urgencySignal === "eroding" ? "↓ Eroding Now" : a.urgencySignal === "emerging" ? "↑ Emerging Opportunity" : "→ Stable"}
                      </span>
                      {a.urgencyReason && <span className="text-xs text-foreground/80">{a.urgencyReason}</span>}
                    </div>
                  )}

                  {/* Leverage bar */}
                  {a.leverageScore != null && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-foreground/70 w-20">Leverage</span>
                      <div className="h-2 rounded-full overflow-hidden flex-1" style={{ background: "hsl(var(--muted))" }}>
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(a.leverageScore / 10) * 100}%`, background: leverageColor }} />
                      </div>
                      <span className="text-[11px] font-bold tabular-nums w-8 text-right" style={{ color: leverageColor }}>{a.leverageScore}/10</span>
                    </div>
                  )}

                  {/* Why it exists */}
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-foreground/70 mb-1">Why this exists</p>
                    <p className="text-sm text-foreground leading-relaxed">{a.currentAnswer}</p>
                  </div>

                  {/* Impact scenario */}
                  {a.impactScenario && (
                    <div className="p-3 rounded-lg" style={{ background: "hsl(142 70% 45% / 0.06)", border: "1px solid hsl(142 70% 40% / 0.15)" }}>
                      <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "hsl(142 70% 35%)" }}>If challenged successfully</p>
                      <p className="text-sm text-foreground leading-relaxed">{a.impactScenario}</p>
                    </div>
                  )}

                  {/* Competitive blind spot */}
                  {a.competitiveBlindSpot && (
                    <div className="p-3 rounded-lg" style={{ background: "hsl(38 92% 50% / 0.06)", border: "1px solid hsl(38 92% 50% / 0.15)" }}>
                      <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "hsl(38 92% 35%)" }}>Who's vulnerable</p>
                      <p className="text-sm text-foreground leading-relaxed">{a.competitiveBlindSpot}</p>
                    </div>
                  )}

                  {/* Challenge approach */}
                  {a.challengeIdea && (
                    <div className="p-3 rounded-lg" style={{ background: "hsl(var(--primary) / 0.05)", border: "1px solid hsl(var(--primary) / 0.15)" }}>
                      <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "hsl(var(--primary))" }}>How to challenge this</p>
                      <p className="text-sm text-foreground leading-relaxed">{a.challengeIdea}</p>
                    </div>
                  )}

                  {/* Tags row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {a.isChallengeable && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold" style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}>
                        Challengeable
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold" style={{ background: reasonStyle.bg, color: reasonStyle.text }}>
                      Root: {reasonStyle.label}
                    </span>
                    <div className="flex-1" />
                    <PitchDeckToggle contentKey={`assumptions-${i}`} label="Include in Pitch" />
                  </div>
                </div>
              )}
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
  const [expandedFlip, setExpandedFlip] = useState<number | null>(0);
  const visible = showAll ? flips : flips.slice(0, showLimit);

  return (
    <>
      <div className="space-y-4">
        {visible.map((item, i) => {
          const isExpanded = expandedFlip === i;
          const matchedAssumption = assumptions.find(a =>
            item.originalAssumption.toLowerCase().includes(a.assumption.toLowerCase().slice(0, 20))
          );
          const leverageScore = matchedAssumption?.leverageScore;

          return (
            <div
              key={i}
              className="rounded-2xl overflow-hidden transition-all duration-300"
              style={{
                background: "hsl(var(--card))",
                border: isExpanded ? "1.5px solid hsl(var(--primary) / 0.35)" : "1.5px solid hsl(var(--border))",
                boxShadow: isExpanded ? "0 8px 24px -8px hsl(var(--primary) / 0.12)" : "0 2px 8px -4px hsl(var(--foreground) / 0.06)",
              }}
            >
              {/* Assumption → Bold Alternative header */}
              <button
                onClick={() => setExpandedFlip(isExpanded ? null : i)}
                className="w-full text-left cursor-pointer"
              >
                <div className="grid grid-cols-[1fr_auto_1fr] min-h-[72px]">
                  <div className="p-4 flex flex-col justify-center" style={{ background: "hsl(var(--muted))" }}>
                    <p className="text-[9px] font-extrabold uppercase tracking-widest text-muted-foreground mb-1.5">Assumption</p>
                    <p className="text-[13px] font-bold text-foreground leading-snug">{item.originalAssumption}</p>
                  </div>
                  <div className="flex items-center justify-center px-3" style={{ background: "hsl(var(--primary))" }}>
                    <FlipHorizontal size={15} style={{ color: "hsl(var(--background))" }} />
                  </div>
                  <div className="p-4 flex flex-col justify-center" style={{ background: "hsl(var(--primary) / 0.06)" }}>
                    <p className="text-[9px] font-extrabold uppercase tracking-widest mb-1.5" style={{ color: "hsl(var(--primary))" }}>Bold Alternative</p>
                    <p className="text-[13px] font-bold leading-snug text-foreground">{item.boldAlternative}</p>
                  </div>
                </div>
              </button>

              {/* Body */}
              <div className="px-5 py-4 space-y-3" style={{ borderTop: "1px solid hsl(var(--border))" }}>
                {/* Rationale — always visible as the "why it matters" hook */}
                <p className="text-sm text-foreground/85 leading-relaxed">{item.rationale}</p>

                {/* Leverage + expand hint row */}
                <div className="flex items-center justify-between">
                  {leverageScore != null && (
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 10 }).map((_, dot) => (
                          <div
                            key={dot}
                            className="w-2 h-2 rounded-full transition-all"
                            style={{
                              background: dot < leverageScore
                                ? leverageScore >= 8
                                  ? "hsl(var(--primary))"
                                  : leverageScore >= 6
                                    ? "hsl(38 92% 50%)"
                                    : "hsl(var(--muted-foreground))"
                                : "hsl(var(--muted))",
                            }}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] font-bold tabular-nums" style={{
                        color: leverageScore >= 8 ? "hsl(var(--primary))" : leverageScore >= 6 ? "hsl(38 92% 50%)" : "hsl(var(--muted-foreground))",
                      }}>
                        {leverageScore}/10 leverage
                      </span>
                    </div>
                  )}
                  <button
                    onClick={() => setExpandedFlip(isExpanded ? null : i)}
                    className="text-[11px] font-bold flex items-center gap-1 transition-colors"
                    style={{ color: "hsl(var(--primary))" }}
                  >
                    {isExpanded ? "Less" : "Deep dive"}
                    <ChevronDown size={12} style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
                  </button>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="space-y-3 pt-2" style={{ borderTop: "1px dashed hsl(var(--border))" }}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-xl" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                        <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-2">💡 Why This Creates Value</p>
                        <p className="text-xs text-foreground/80 leading-relaxed">{item.rationale}</p>
                      </div>
                      <div className="p-3.5 rounded-xl" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                        <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground mb-2">⚙️ How It Works</p>
                        <p className="text-xs text-foreground/80 leading-relaxed">{item.physicalMechanism}</p>
                      </div>
                    </div>
                    {matchedAssumption?.impactScenario && (
                      <div className="p-3.5 rounded-xl" style={{ background: "hsl(var(--primary) / 0.04)", border: "1px solid hsl(var(--primary) / 0.15)" }}>
                        <p className="text-[10px] font-extrabold uppercase tracking-widest mb-2" style={{ color: "hsl(var(--primary))" }}>🎯 Impact Scenario</p>
                        <p className="text-xs text-foreground/80 leading-relaxed">{matchedAssumption.impactScenario}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions row */}
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

  // Sync activeSection from parent when it changes
  useEffect(() => {
    if (activeSection && renderMode === "redesign") {
      setActiveStep(activeSection);
      setVisitedFPSteps(prev => new Set([...prev, activeSection]));
    }
  }, [activeSection, renderMode]);
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
      // Always pass upstream Report intel so the Disrupt AI has full market context
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


  // Expose loading state to parent
  useEffect(() => { onLoadingChange?.(loading); }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Parent-triggered re-run via runTrigger counter
  const runTriggerRef = useRef(runTrigger ?? 0);
  useEffect(() => {
    if (runTrigger !== undefined && runTrigger > runTriggerRef.current && !loading) {
      runTriggerRef.current = runTrigger;
      runAnalysis();
    }
  }, [runTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

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
        title={renderMode === "redesign" ? "Generating Redesign Concept" : "Building First Principles Analysis"}
        tasks={renderMode === "redesign" ? REDESIGN_TASKS : DISRUPT_TASKS}
        estimatedSeconds={35}
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
        {/* Header + re-run — hidden when page provides its own tabs */}
        {!activeSection && (
          <>
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
          </>
        )}

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
          const conceptIsEmpty = !concept || (!concept.conceptName && !concept.coreInsight && !concept.physicalDescription);
          if (conceptIsEmpty) {
            return (
              <div className="space-y-4">
                <SectionHeader current={currentSectionNum} total={totalSections} label="Redesigned Concept" icon={Sparkles} />
                <div className="text-center py-10 space-y-4">
                  <Sparkles size={36} className="mx-auto" style={{ color: "hsl(38 92% 50%)" }} />
                  <p className="text-lg font-extrabold text-foreground">No redesign concept generated yet</p>
                  <p className="text-sm text-foreground/70 max-w-md mx-auto leading-relaxed">
                    Click <strong>Re-run Analysis</strong> above to generate a full redesigned concept with radical differences, materials, pricing, and more.
                  </p>
                </div>
              </div>
            );
          }

          return (
            <div className="space-y-4">
              <SectionHeader current={currentSectionNum} total={totalSections} label="Redesigned Concept" icon={Sparkles} />

              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-extrabold text-foreground text-lg">{concept.conceptName}</h4>
                <span className="text-sm font-semibold text-foreground/70">— {concept.tagline}</span>
              </div>

              {/* Core insight */}
              <div className="p-4 rounded-lg" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                <p className="text-sm font-bold uppercase tracking-wider text-foreground mb-1">Core Insight</p>
                <p className="text-sm leading-relaxed text-foreground">{concept.coreInsight}</p>
              </div>

              {/* Radical Differences */}
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-foreground mb-2">Radical Differences</p>
                <div className="space-y-1.5">
                  {(concept.radicalDifferences || []).map((diff: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 p-3 rounded-lg text-sm" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                      <Zap size={14} style={{ color: "hsl(var(--primary))", flexShrink: 0, marginTop: 2 }} />
                      <span className="text-foreground">{diff}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Physical Description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-4 rounded-lg" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                  <p className="text-sm font-bold uppercase tracking-wider text-foreground mb-1">Physical Form</p>
                  <p className="text-sm text-foreground">{concept.physicalDescription}</p>
                  {concept.sizeAndWeight && <p className="text-sm font-semibold text-foreground mt-1">Size: {concept.sizeAndWeight}</p>}
                </div>
                <div className="p-4 rounded-lg" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                  <p className="text-sm font-bold uppercase tracking-wider text-foreground mb-1">Materials</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(concept.materials || []).map((m: string, i: number) => (
                      <span key={i} className="px-2.5 py-1 rounded-full text-sm font-semibold" style={{ background: "hsl(var(--card))", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))" }}>{m}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Smart Features */}
              {concept.smartFeatures?.length > 0 && (
                <div>
                  <p className="text-sm font-bold uppercase tracking-wider text-foreground mb-2">Smart Features</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {concept.smartFeatures.map((f: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 p-3 rounded-lg text-sm" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                        <Cpu size={14} style={{ color: "hsl(var(--primary))", flexShrink: 0, marginTop: 2 }} />
                        <span className="text-foreground">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* UX Transformation & Friction Eliminated */}
              <div className="p-4 rounded-lg" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                <p className="text-sm font-bold uppercase tracking-wider text-foreground mb-1">User Experience Transformation</p>
                <p className="text-sm text-foreground leading-relaxed">{concept.userExperienceTransformation}</p>
              </div>
              {concept.frictionEliminated?.length > 0 && (
                <div>
                  <p className="text-sm font-bold uppercase tracking-wider text-foreground mb-2">Friction Eliminated</p>
                  <div className="space-y-1.5">
                    {concept.frictionEliminated.map((f: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 size={14} style={{ color: "hsl(142 70% 40%)", flexShrink: 0, marginTop: 2 }} />
                        <span className="text-foreground">{f}</span>
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
                  <div key={item.label} className="p-3 rounded-lg text-center" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                    <p className="text-xs font-bold uppercase tracking-wider text-foreground">{item.label}</p>
                    <p className="text-sm font-extrabold text-foreground mt-1">{item.value}</p>
                  </div>
                ))}
              </div>

              <DetailPanel title="Why it hasn't been done & biggest risk" icon={ShieldAlert} defaultOpen>
                <div className="space-y-3 mb-2">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wider text-foreground mb-1">Why Not Already Done</p>
                    <p className="text-sm text-foreground">{concept.whyItHasntBeenDone}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wider text-foreground mb-1">Biggest Risk</p>
                    <p className="text-sm text-foreground">{concept.biggestRisk}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wider text-foreground mb-1">Manufacturing Path</p>
                    <p className="text-sm text-foreground">{concept.manufacturingPath}</p>
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
          <p className="text-sm font-bold text-foreground uppercase tracking-widest">Hidden Assumptions & Leverage Analysis</p>
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

          {/* ── Highest-Leverage Move Banner ── */}
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
                  <p className="text-xs leading-relaxed" style={{ color: "hsl(var(--background) / 0.7)" }}>
                    {topMove.impactScenario}
                  </p>
                )}
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-[10px] font-bold tabular-nums" style={{ color: "hsl(var(--background) / 0.5)" }}>
                    Leverage: {topMove.leverageScore}/10
                  </span>
                  {topMove.urgencySignal === "eroding" && (
                    <span className="text-[10px] font-bold" style={{ color: "hsl(0 70% 65%)" }}>↓ Eroding</span>
                  )}
                  {topMove.competitiveBlindSpot && (
                    <span className="text-[10px]" style={{ color: "hsl(var(--background) / 0.5)" }}>
                       Vulnerable: {topMove.competitiveBlindSpot}
                     </span>
                  )}
                </div>
              </div>
            );
          })()}

          {/* ── Summary line ── */}
          <p className="text-sm font-semibold text-foreground leading-relaxed">
            {assumptions.length} assumptions deconstructed · {challengeableCount} challengeable ({assumptions.length > 0 ? Math.round(challengeableCount / assumptions.length * 100) : 0}%) · avg leverage {avgLeverage}/10{topReason ? ` · top root cause: ${REASON_COLORS[topReason[0]]?.label || topReason[0]}` : ""}
            {(() => { const eroding = assumptions.filter(a => a.urgencySignal === "eroding").length; return eroding > 0 ? ` · ${eroding} eroding now` : ""; })()}
          </p>

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
