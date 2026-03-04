import React, { useMemo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Search, Lock, ShoppingCart, CreditCard, Download, Settings, Globe,
  ArrowRight, Clock, Phone, MessageSquare, Mail, Upload, Eye, Wrench,
  Lightbulb, Truck, Home, Share2, Bookmark, Star, Users, Car, MapPin,
  Plane, Bike, Package, Camera, Mic, Shield, Move, Send,
  AlertTriangle, Brain, MapPinned, ShoppingBag, Monitor,
  type LucideIcon,
} from "lucide-react";

/* ── Types ── */
interface FrictionPoint {
  stepIndex?: number;
  step?: string;
  friction: string;
  severity?: number;
  rootCause?: string;
}

interface AdaptiveJourneyMapProps {
  steps: string[];
  frictionPoints: FrictionPoint[];
  cognitiveLoad?: string;
  contextOfUse?: string;
  category?: string;
  productName?: string;
}

/* ── Phase definitions ── */
type Phase = "DISCOVERY" | "EVALUATION" | "ACQUISITION" | "SETUP" | "CORE USAGE" | "FULFILLMENT" | "RETENTION";

const PHASE_KEYWORDS: Record<Phase, string[]> = {
  "DISCOVERY": ["discover", "aware", "hear", "learn about", "first encounter", "search", "browse", "find", "explore", "research", "recommend", "referral"],
  "EVALUATION": ["evaluate", "assess", "consider", "weigh", "decide", "choose", "select", "review", "compare", "alternative", "option"],
  "ACQUISITION": ["sign up", "register", "create account", "join", "apply", "buy", "purchase", "order", "checkout", "add to cart", "subscribe", "pay", "payment", "download", "install"],
  "SETUP": ["setup", "configure", "customize", "personalize", "adjust", "setting", "connect", "integrate", "link", "onboard", "pair", "sync"],
  "CORE USAGE": ["use", "engage", "interact", "experience", "start using", "begin", "launch", "open", "book", "reserve", "schedule", "call", "contact", "message", "chat", "upload", "submit", "build", "create", "watch", "learn"],
  "FULFILLMENT": ["deliver", "ship", "receive", "arrive", "pickup", "collect", "wait", "pending", "processing", "drive", "navigate", "visit", "fly", "travel"],
  "RETENTION": ["return", "come back", "repeat", "renew", "reorder", "continue", "share", "post", "refer", "save", "favorite", "track", "follow"],
};

const PHASE_COLORS: Record<Phase, string> = {
  "DISCOVERY": "217 91% 45%",
  "EVALUATION": "271 70% 45%",
  "ACQUISITION": "152 60% 44%",
  "SETUP": "36 80% 52%",
  "CORE USAGE": "217 91% 45%",
  "FULFILLMENT": "200 80% 45%",
  "RETENTION": "152 60% 44%",
};

/* ── Journey type detection ── */
type JourneyType = "digital" | "physical" | "ecommerce" | "default";

const JOURNEY_TYPE_KEYWORDS: Record<JourneyType, string[]> = {
  digital: ["sign up", "download", "configure", "dashboard", "app", "software", "saas", "login", "api", "cloud", "platform"],
  physical: ["visit", "drive", "arrive", "wait", "appointment", "store", "shop", "office", "location", "walk", "queue"],
  ecommerce: ["browse", "cart", "checkout", "deliver", "shipping", "order", "purchase", "product page", "add to bag"],
  default: [],
};

const JOURNEY_TYPE_ICONS: Record<JourneyType, LucideIcon> = {
  digital: Monitor,
  physical: MapPinned,
  ecommerce: ShoppingBag,
  default: ArrowRight,
};

const JOURNEY_TYPE_LABELS: Record<JourneyType, string> = {
  digital: "Digital Journey",
  physical: "Physical Journey",
  ecommerce: "Commerce Journey",
  default: "User Journey",
};

/* ── Icon matching (reused from WorkflowTimeline) ── */
const STEP_ICON_KEYWORDS: [string[], LucideIcon][] = [
  [["discover", "aware", "hear about", "learn about", "first encounter", "introduction"], Search],
  [["search", "browse", "look for", "find", "explore", "research", "compare"], Search],
  [["recommend", "referral", "word of mouth", "told about"], Users],
  [["evaluate", "assess", "consider", "weigh", "decide", "choose", "select", "pick"], Lightbulb],
  [["review", "rate", "feedback", "testimonial", "star", "reputation"], Star],
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

/* ── Helpers ── */
function detectJourneyType(steps: string[], contextOfUse?: string, category?: string): JourneyType {
  const allText = [...steps, contextOfUse || "", category || ""].join(" ").toLowerCase();
  const scores: Record<JourneyType, number> = { digital: 0, physical: 0, ecommerce: 0, default: 0 };
  for (const [type, keywords] of Object.entries(JOURNEY_TYPE_KEYWORDS) as [JourneyType, string[]][]) {
    if (type === "default") continue;
    scores[type] = keywords.filter(kw => allText.includes(kw)).length;
  }
  const best = (Object.entries(scores) as [JourneyType, number][]).sort((a, b) => b[1] - a[1])[0];
  return best[1] >= 2 ? best[0] : "default";
}

function detectPhase(stepText: string): Phase {
  const lower = stepText.toLowerCase();
  for (const [phase, keywords] of Object.entries(PHASE_KEYWORDS) as [Phase, string[]][]) {
    if (keywords.some(kw => lower.includes(kw))) return phase;
  }
  return "CORE USAGE";
}

function getFriction(stepIndex: number, stepName: string, frictionPoints: FrictionPoint[]): FrictionPoint | undefined {
  const byIndex = frictionPoints?.find(fp => fp.stepIndex === stepIndex);
  if (byIndex) return byIndex;
  return frictionPoints?.find(fp =>
    fp.step && (
      stepName.toLowerCase().includes(fp.step.toLowerCase()) ||
      fp.step.toLowerCase().includes(stepName.toLowerCase().slice(0, 12))
    )
  );
}

function getSeverityColor(severity?: number): string {
  if (!severity || severity <= 2) return "152 60% 44%"; // green
  if (severity <= 4) return "36 80% 52%"; // amber
  return "0 72% 52%"; // red
}

interface PhaseGroup {
  phase: Phase;
  steps: { text: string; index: number; friction?: FrictionPoint; icon: LucideIcon }[];
}

function groupByPhase(steps: string[], frictionPoints: FrictionPoint[]): PhaseGroup[] {
  const groups: PhaseGroup[] = [];
  let currentPhase: Phase | null = null;
  let currentGroup: PhaseGroup | null = null;

  steps.slice(0, 10).forEach((step, i) => {
    const phase = detectPhase(step);
    const friction = getFriction(i, step, frictionPoints);
    const icon = getStepIcon(step);

    if (phase !== currentPhase) {
      currentPhase = phase;
      currentGroup = { phase, steps: [] };
      groups.push(currentGroup);
    }
    currentGroup!.steps.push({ text: step, index: i, friction, icon });
  });

  return groups;
}

/* ── Main component ── */
export function AdaptiveJourneyMap({
  steps,
  frictionPoints,
  cognitiveLoad,
  contextOfUse,
  category,
}: AdaptiveJourneyMapProps) {
  const isMobile = useIsMobile();

  const journeyType = useMemo(() => detectJourneyType(steps, contextOfUse, category), [steps, contextOfUse, category]);
  const phaseGroups = useMemo(() => groupByPhase(steps, frictionPoints), [steps, frictionPoints]);
  const highFrictionCount = frictionPoints.filter(fp => (fp.severity || 0) >= 4).length;

  const JourneyIcon = JOURNEY_TYPE_ICONS[journeyType];

  return (
    <div className="space-y-4">
      {/* ── Summary bar: journey type + cognitive load + context ── */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold"
          style={{ background: "hsl(var(--foreground) / 0.06)", color: "hsl(var(--foreground))" }}>
          <JourneyIcon size={12} />
          {JOURNEY_TYPE_LABELS[journeyType]}
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>
          {steps.length} steps · {phaseGroups.length} phases
        </span>
        {highFrictionCount > 0 && (
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: "hsl(0 72% 52% / 0.1)", color: "hsl(0 72% 42%)" }}>
            <AlertTriangle size={10} />
            {highFrictionCount} high friction
          </span>
        )}
        {cognitiveLoad && (
          <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>
            <Brain size={10} />
            {cognitiveLoad}
          </span>
        )}
      </div>

      {contextOfUse && (
        <p className="text-[11px] text-muted-foreground px-1">
          <span className="font-bold">Context:</span> {contextOfUse}
        </p>
      )}

      {/* ── Journey flow ── */}
      {isMobile ? (
        <MobileFlow phaseGroups={phaseGroups} />
      ) : (
        <DesktopFlow phaseGroups={phaseGroups} journeyType={journeyType} />
      )}
    </div>
  );
}

/* ── Desktop: horizontal scrollable phase flow ── */
function DesktopFlow({ phaseGroups, journeyType }: { phaseGroups: PhaseGroup[]; journeyType: JourneyType }) {
  return (
    <ScrollArea className="w-full">
      <div className="flex gap-3 pb-3 min-w-max pr-4">
        {phaseGroups.map((group, gi) => (
          <React.Fragment key={gi}>
            <PhaseColumn group={group} />
            {gi < phaseGroups.length - 1 && (
              <div className="flex items-center self-center">
                <svg width="32" height="24" viewBox="0 0 32 24" className="flex-shrink-0">
                  <path d="M0 12 H24 M20 6 L28 12 L20 18" fill="none"
                    stroke="hsl(var(--border))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

/* ── Phase column (desktop) ── */
function PhaseColumn({ group }: { group: PhaseGroup }) {
  const phaseColor = PHASE_COLORS[group.phase];
  return (
    <div className="flex flex-col gap-0 min-w-[200px] max-w-[240px]">
      {/* Phase header */}
      <div className="flex items-center gap-1.5 mb-2 px-1">
        <div className="w-1.5 h-1.5 rounded-full" style={{ background: `hsl(${phaseColor})` }} />
        <span className="text-[9px] font-extrabold uppercase tracking-[0.12em]"
          style={{ color: `hsl(${phaseColor})` }}>
          {group.phase}
        </span>
      </div>

      {/* Step nodes */}
      {group.steps.map((step, si) => {
        const severity = step.friction?.severity || 0;
        const sevColor = getSeverityColor(severity);
        const hasFriction = !!step.friction;
        const isHighSeverity = severity >= 4;
        const StepIcon = step.icon;

        return (
          <div key={si} className="flex flex-col items-stretch">
            {/* Connector line between steps within same phase */}
            {si > 0 && (
              <div className="flex justify-center">
                <div className="w-[1.5px] h-3" style={{
                  background: hasFriction ? `hsl(${sevColor})` : "hsl(var(--border))"
                }} />
              </div>
            )}

            {/* Step node */}
            <div
              className="relative rounded-xl p-3 transition-all duration-200 group"
              style={{
                background: "hsl(var(--card))",
                border: isHighSeverity
                  ? `1.5px solid hsl(${sevColor} / 0.5)`
                  : "1px solid hsl(var(--border))",
                boxShadow: isHighSeverity
                  ? `0 0 12px -3px hsl(${sevColor} / 0.25)`
                  : "0 1px 3px 0 hsl(var(--border) / 0.3)",
              }}
            >
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: `hsl(${phaseColor} / 0.1)`,
                    color: `hsl(${phaseColor})`,
                  }}>
                  <StepIcon size={14} strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold text-foreground leading-snug">{step.text}</p>

                  {/* Inline friction badge */}
                  {hasFriction && (
                    <div className="mt-1.5 space-y-1">
                      <div className="flex items-center gap-1">
                        <AlertTriangle size={9} style={{ color: `hsl(${sevColor})` }} />
                        <span className="text-[10px] font-bold" style={{ color: `hsl(${sevColor})` }}>
                          Friction{severity ? ` (${severity}/5)` : ""}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-snug">{step.friction!.friction}</p>
                      {step.friction!.rootCause && (
                        <p className="text-[9px] text-muted-foreground/70 italic leading-snug">
                          Root: {step.friction!.rootCause}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Mobile: vertical flow with phase headers ── */
function MobileFlow({ phaseGroups }: { phaseGroups: PhaseGroup[] }) {
  return (
    <div className="space-y-4">
      {phaseGroups.map((group, gi) => {
        const phaseColor = PHASE_COLORS[group.phase];
        return (
          <div key={gi}>
            {/* Phase header */}
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: `hsl(${phaseColor})` }} />
              <span className="text-[9px] font-extrabold uppercase tracking-[0.12em]"
                style={{ color: `hsl(${phaseColor})` }}>
                {group.phase}
              </span>
            </div>

            {/* Steps */}
            <div className="relative">
              {group.steps.map((step, si) => {
                const severity = step.friction?.severity || 0;
                const sevColor = getSeverityColor(severity);
                const hasFriction = !!step.friction;
                const isHighSeverity = severity >= 4;
                const isLast = si === group.steps.length - 1;
                const StepIcon = step.icon;

                return (
                  <div key={si} className="flex items-start gap-3 relative">
                    {/* Left rail */}
                    <div className="flex flex-col items-center flex-shrink-0 pt-0.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center z-10"
                        style={{
                          background: `hsl(${phaseColor} / 0.1)`,
                          color: `hsl(${phaseColor})`,
                          border: isHighSeverity ? `1.5px solid hsl(${sevColor} / 0.4)` : "none",
                        }}>
                        <StepIcon size={14} strokeWidth={1.8} />
                      </div>
                      {!isLast && (
                        <div className="w-[1.5px] flex-1 min-h-[12px]"
                          style={{ background: hasFriction ? `hsl(${sevColor} / 0.4)` : "hsl(var(--border))" }} />
                      )}
                    </div>

                    {/* Step content */}
                    <div className="flex-1 pb-3 min-w-0">
                      <p className="text-[12px] font-bold text-foreground leading-snug">{step.text}</p>
                      {hasFriction && (
                        <div className="mt-1 space-y-0.5">
                          <div className="flex items-center gap-1">
                            <AlertTriangle size={9} style={{ color: `hsl(${sevColor})` }} />
                            <span className="text-[10px] font-bold" style={{ color: `hsl(${sevColor})` }}>
                              Friction{severity ? ` (${severity}/5)` : ""}
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground leading-snug">{step.friction!.friction}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
