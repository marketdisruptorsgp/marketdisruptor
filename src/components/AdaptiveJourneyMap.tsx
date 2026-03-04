import React, { useMemo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Search, Lock, ShoppingCart, CreditCard, Download, Settings, Globe,
  ArrowRight, Clock, Phone, MessageSquare, Mail, Upload, Eye, Wrench,
  Lightbulb, Truck, Home, Share2, Bookmark, Star, Users, Car, MapPin,
  Plane, Bike, Package, Camera, Mic, Shield, Move, Send,
  AlertTriangle, Brain, MapPinned, ShoppingBag, Monitor, ChevronDown,
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
  digital: Monitor, physical: MapPinned, ecommerce: ShoppingBag, default: ArrowRight,
};

const JOURNEY_TYPE_LABELS: Record<JourneyType, string> = {
  digital: "Digital Journey", physical: "Physical Journey", ecommerce: "Commerce Journey", default: "User Journey",
};

/* ── Icon matching ── */
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
  if (!severity || severity <= 2) return "152 60% 44%";
  if (severity <= 4) return "36 80% 52%";
  return "0 72% 52%";
}

function getSeverityLabel(severity?: number): string {
  if (!severity || severity <= 2) return "low";
  if (severity <= 4) return "medium";
  return "high";
}

interface StepNode {
  text: string;
  index: number;
  friction?: FrictionPoint;
  icon: LucideIcon;
  phase: Phase;
}

function buildNodes(steps: string[], frictionPoints: FrictionPoint[]): StepNode[] {
  return steps.slice(0, 10).map((step, i) => ({
    text: step,
    index: i,
    friction: getFriction(i, step, frictionPoints),
    icon: getStepIcon(step),
    phase: detectPhase(step),
  }));
}

/* ── Phase ribbon ── */
function PhaseRibbon({ nodes }: { nodes: StepNode[] }) {
  const phases = useMemo(() => {
    const seen = new Map<Phase, number>();
    nodes.forEach(n => { if (!seen.has(n.phase)) seen.set(n.phase, seen.size); });
    return Array.from(seen.keys());
  }, [nodes]);

  return (
    <div className="flex items-center gap-1.5 flex-wrap mb-1">
      {phases.map((phase) => {
        const color = PHASE_COLORS[phase];
        return (
          <div
            key={phase}
            className="px-3 py-1.5 rounded-md text-[10px] font-extrabold uppercase tracking-[0.08em]"
            style={{
              background: `hsl(${color} / 0.08)`,
              color: `hsl(${color})`,
              border: `1px solid hsl(${color} / 0.15)`,
            }}
          >
            {phase}
          </div>
        );
      })}
    </div>
  );
}

/* ── Main component ── */
export function AdaptiveJourneyMap({
  steps, frictionPoints, cognitiveLoad, contextOfUse, category,
}: AdaptiveJourneyMapProps) {
  const isMobile = useIsMobile();
  const journeyType = useMemo(() => detectJourneyType(steps, contextOfUse, category), [steps, contextOfUse, category]);
  const nodes = useMemo(() => buildNodes(steps, frictionPoints), [steps, frictionPoints]);
  const highFrictionCount = frictionPoints.filter(fp => (fp.severity || 0) >= 4).length;
  const JourneyIcon = JOURNEY_TYPE_ICONS[journeyType];

  return (
    <div className="space-y-3">
      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold"
          style={{ background: "hsl(var(--foreground) / 0.06)", color: "hsl(var(--foreground))" }}>
          <JourneyIcon size={12} />
          {JOURNEY_TYPE_LABELS[journeyType]}
        </div>
        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>
          {steps.length} steps
        </span>
        {highFrictionCount > 0 && (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: "hsl(0 72% 52% / 0.08)", color: "hsl(0 72% 42%)" }}>
            <AlertTriangle size={10} />
            {highFrictionCount} high friction
          </span>
        )}
        {cognitiveLoad && (
          <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>
            <Brain size={10} />
            {cognitiveLoad}
          </span>
        )}
      </div>
      {contextOfUse && (
        <p className="text-sm text-foreground/80 px-1 leading-relaxed">
          <span className="font-bold text-foreground">Context:</span> {contextOfUse}
        </p>
      )}

      <PhaseRibbon nodes={nodes} />

      {isMobile ? <MobileTimeline nodes={nodes} /> : <DesktopSerpentine nodes={nodes} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DESKTOP: Refined serpentine — 3 per row with connecting arrows
   ═══════════════════════════════════════════════════════════════ */
const COLS = 3;

/* Horizontal connector arrow between cards */
function HorizontalConnector({ reversed }: { reversed?: boolean }) {
  return (
    <div className="flex items-center justify-center" style={{ width: 32, flexShrink: 0 }}>
      <svg width="32" height="20" viewBox="0 0 32 20" fill="none">
        <line
          x1={reversed ? 28 : 4} y1="10"
          x2={reversed ? 4 : 28} y2="10"
          stroke="hsl(var(--foreground) / 0.12)"
          strokeWidth="2"
          strokeDasharray="4 3"
          strokeLinecap="round"
        />
        <polygon
          points={reversed ? "7,6 2,10 7,14" : "25,6 30,10 25,14"}
          fill="hsl(var(--foreground) / 0.18)"
        />
      </svg>
    </div>
  );
}

/* U-turn connector between rows */
function UTurnConnector({ side }: { side: "right" | "left" }) {
  const isRight = side === "right";
  return (
    <div className="flex w-full py-1" style={{ justifyContent: isRight ? "flex-end" : "flex-start" }}>
      <div className="flex flex-col items-center" style={{ paddingRight: isRight ? 40 : 0, paddingLeft: isRight ? 0 : 40 }}>
        <svg width="40" height="48" viewBox="0 0 40 48" fill="none">
          <path
            d={isRight
              ? "M20 2 C38 2 38 24 38 24 C38 24 38 46 20 46"
              : "M20 2 C2 2 2 24 2 24 C2 24 2 46 20 46"
            }
            stroke="hsl(var(--foreground) / 0.12)"
            strokeWidth="2"
            strokeDasharray="4 3"
            strokeLinecap="round"
            fill="none"
          />
          <polygon
            points={isRight ? "16,42 20,48 24,42" : "16,42 20,48 24,42"}
            fill="hsl(var(--foreground) / 0.18)"
          />
        </svg>
      </div>
    </div>
  );
}

function DesktopSerpentine({ nodes }: { nodes: StepNode[] }) {
  const rows: StepNode[][] = [];
  for (let i = 0; i < nodes.length; i += COLS) {
    const row = nodes.slice(i, i + COLS);
    rows.push(rows.length % 2 === 1 ? [...row].reverse() : row);
  }

  return (
    <ScrollArea className="w-full">
      <div className="space-y-0 pb-2 min-w-[640px]">
        {rows.map((row, ri) => {
          const isReversed = ri % 2 === 1;
          const isLastRow = ri === rows.length - 1;

          return (
            <React.Fragment key={ri}>
              <div className="flex items-stretch">
                {row.map((node, ci) => (
                  <React.Fragment key={node.index}>
                    <div className="flex-1 min-w-0">
                      <StepCard node={node} stepNumber={node.index + 1} />
                    </div>
                    {ci < row.length - 1 && (
                      <div className="flex items-center">
                        <HorizontalConnector reversed={isReversed} />
                      </div>
                    )}
                  </React.Fragment>
                ))}
                {row.length < COLS && Array.from({ length: COLS - row.length }).map((_, fi) => (
                  <React.Fragment key={`empty-${fi}`}>
                    <div className="flex items-center"><div style={{ width: 32 }} /></div>
                    <div className="flex-1 min-w-0" />
                  </React.Fragment>
                ))}
              </div>

              {!isLastRow && (
                <UTurnConnector side={isReversed ? "left" : "right"} />
              )}
            </React.Fragment>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

/* ── Refined step card ── */
function StepCard({ node, stepNumber }: { node: StepNode; stepNumber: number }) {
  const StepIcon = node.icon;
  const phaseColor = PHASE_COLORS[node.phase];
  const hasFriction = !!node.friction;
  const severity = node.friction?.severity || 0;
  const sevColor = getSeverityColor(severity);
  const sevLabel = getSeverityLabel(severity);
  const isHigh = severity >= 4;

  return (
    <div
      className="relative rounded-xl p-4 h-full flex flex-col transition-shadow"
      style={{
        background: "hsl(var(--card))",
        border: isHigh
          ? `1.5px solid hsl(${sevColor} / 0.35)`
          : "1px solid hsl(var(--border))",
        boxShadow: isHigh
          ? `0 2px 16px -4px hsl(${sevColor} / 0.15)`
          : "0 1px 4px -1px hsl(var(--foreground) / 0.04)",
      }}
    >
      {/* Header row: icon + step number */}
      <div className="flex items-start gap-3 mb-2.5">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 relative"
          style={{
            background: `hsl(${phaseColor} / 0.08)`,
            color: `hsl(${phaseColor})`,
            border: `1.5px solid hsl(${phaseColor} / 0.2)`,
          }}
        >
          <StepIcon size={18} strokeWidth={1.8} />
          {hasFriction && (
            <div
              className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 rounded-full flex items-center justify-center"
              style={{
                background: `hsl(${sevColor})`,
                color: "white",
                width: 18, height: 18,
                boxShadow: `0 0 8px -1px hsl(${sevColor} / 0.5)`,
              }}
            >
              <AlertTriangle size={9} />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground leading-snug">
            Step {stepNumber}: {node.text}
          </p>
        </div>
      </div>

      {/* Friction detail */}
      {hasFriction && (
        <div
          className="rounded-lg px-3 py-2.5 mt-auto"
          style={{
            background: `hsl(${sevColor} / 0.05)`,
            border: `1px solid hsl(${sevColor} / 0.12)`,
          }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangle size={11} style={{ color: `hsl(${sevColor})` }} />
            <span className="text-[11px] font-bold" style={{ color: `hsl(${sevColor})` }}>
              Friction ({sevLabel}/{severity}/5)
            </span>
          </div>
          <p className="text-[12px] text-foreground/75 leading-relaxed">{node.friction!.friction}</p>
          {node.friction!.rootCause && (
            <p className="text-[11px] text-muted-foreground italic mt-1">
              Root: {node.friction!.rootCause}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MOBILE: Vertical timeline with connecting line + step cards
   ═══════════════════════════════════════════════════════════════ */
function MobileTimeline({ nodes }: { nodes: StepNode[] }) {
  let currentPhase: Phase | null = null;

  return (
    <div className="relative pl-10">
      {/* Continuous vertical line */}
      <div
        className="absolute left-[19px] top-4 bottom-4 w-[2px]"
        style={{
          background: "linear-gradient(to bottom, hsl(var(--foreground) / 0.06), hsl(var(--foreground) / 0.12), hsl(var(--foreground) / 0.06))",
        }}
      />

      {nodes.map((node, i) => {
        const StepIcon = node.icon;
        const phaseColor = PHASE_COLORS[node.phase];
        const hasFriction = !!node.friction;
        const severity = node.friction?.severity || 0;
        const sevColor = getSeverityColor(severity);
        const sevLabel = getSeverityLabel(severity);
        const isHigh = severity >= 4;
        const showPhase = node.phase !== currentPhase;
        if (showPhase) currentPhase = node.phase;
        const isLast = i === nodes.length - 1;

        return (
          <React.Fragment key={i}>
            {/* Phase marker */}
            {showPhase && (
              <div className="relative flex items-center gap-2 mb-2 mt-3 first:mt-0 -ml-10 pl-12">
                <div
                  className="absolute left-[16px] w-[8px] h-[8px] rounded-full z-10"
                  style={{ background: `hsl(${phaseColor})`, boxShadow: `0 0 6px hsl(${phaseColor} / 0.3)` }}
                />
                <span
                  className="text-[10px] font-extrabold uppercase tracking-[0.1em]"
                  style={{ color: `hsl(${phaseColor})` }}
                >
                  {node.phase}
                </span>
              </div>
            )}

            {/* Step node */}
            <div className="relative flex items-start gap-3 mb-4">
              {/* Timeline dot */}
              <div
                className="absolute -left-10 w-[40px] h-[40px] rounded-xl flex items-center justify-center z-10"
                style={{
                  background: "hsl(var(--card))",
                  color: `hsl(${phaseColor})`,
                  border: isHigh
                    ? `2px solid hsl(${sevColor})`
                    : `1.5px solid hsl(${phaseColor} / 0.25)`,
                  boxShadow: isHigh
                    ? `0 0 12px -2px hsl(${sevColor} / 0.3)`
                    : `0 1px 6px -1px hsl(var(--foreground) / 0.06)`,
                }}
              >
                <StepIcon size={16} strokeWidth={1.8} />
                {hasFriction && (
                  <div
                    className="absolute -top-1 -right-1 rounded-full flex items-center justify-center"
                    style={{
                      width: 16, height: 16,
                      background: `hsl(${sevColor})`,
                      color: "white",
                      boxShadow: `0 0 6px -1px hsl(${sevColor} / 0.4)`,
                    }}
                  >
                    <AlertTriangle size={8} />
                  </div>
                )}
              </div>

              {/* Card */}
              <div
                className="flex-1 min-w-0 ml-3 rounded-xl p-3.5"
                style={{
                  background: "hsl(var(--card))",
                  border: isHigh
                    ? `1.5px solid hsl(${sevColor} / 0.3)`
                    : "1px solid hsl(var(--border))",
                  boxShadow: isHigh
                    ? `0 2px 12px -3px hsl(${sevColor} / 0.12)`
                    : "0 1px 3px -1px hsl(var(--foreground) / 0.04)",
                }}
              >
                <p className="text-sm font-bold text-foreground leading-snug mb-1">
                  Step {node.index + 1}: {node.text}
                </p>
                {hasFriction && (
                  <div
                    className="rounded-lg px-2.5 py-2 mt-1.5"
                    style={{
                      background: `hsl(${sevColor} / 0.05)`,
                      border: `1px solid hsl(${sevColor} / 0.1)`,
                    }}
                  >
                    <div className="flex items-center gap-1 mb-0.5">
                      <AlertTriangle size={10} style={{ color: `hsl(${sevColor})` }} />
                      <span className="text-[10px] font-bold" style={{ color: `hsl(${sevColor})` }}>
                        Friction ({sevLabel}/{severity}/5)
                      </span>
                    </div>
                    <p className="text-[12px] text-foreground/75 leading-relaxed">{node.friction!.friction}</p>
                    {node.friction!.rootCause && (
                      <p className="text-[11px] text-muted-foreground italic mt-0.5">Root: {node.friction!.rootCause}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Arrow between steps */}
            {!isLast && !nodes[i + 1] ? null : null}
          </React.Fragment>
        );
      })}
    </div>
  );
}
