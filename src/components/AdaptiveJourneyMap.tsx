import React, { useMemo, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search, Lock, ShoppingCart, CreditCard, Download, Settings, Globe,
  ArrowRight, Clock, Phone, MessageSquare, Mail, Upload, Eye, Wrench,
  Lightbulb, Truck, Home, Share2, Bookmark, Star, Users, Car, MapPin,
  Plane, Bike, Package, Camera, Mic, Shield, Move, Send,
  AlertTriangle, ChevronDown,
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
  "DISCOVERY": ["discover", "aware", "hear", "learn about", "first encounter", "search", "browse", "find", "explore", "research", "recommend", "referral", "realize", "notice", "see a", "need", "remember"],
  "EVALUATION": ["evaluate", "assess", "consider", "weigh", "decide", "choose", "select", "review", "compare", "alternative", "option", "recommend additional", "quotes a price", "upsell", "suggests"],
  "ACQUISITION": ["sign up", "register", "create account", "join", "apply", "buy", "purchase", "order", "checkout", "add to cart", "subscribe", "pay", "payment", "download", "install", "approve", "accept", "agree", "consent", "authorize"],
  "SETUP": ["setup", "configure", "customize", "personalize", "adjust", "setting", "connect", "integrate", "link", "onboard", "pair", "sync", "check in", "greet"],
  "CORE USAGE": ["service", "repair", "fix", "maintain", "work on", "perform", "inspect", "diagnose", "use", "engage", "interact", "experience", "start using", "begin", "launch", "open", "book", "reserve", "schedule", "call", "contact", "message", "chat", "upload", "submit", "build", "create", "watch", "learn"],
  "FULFILLMENT": ["deliver", "ship", "receive", "arrive", "pickup", "collect", "wait", "pending", "processing", "navigate", "visit", "fly", "travel", "drive to", "drives to", "pull into", "pulls into", "go to", "sticker", "drives away", "leave"],
  "RETENTION": ["return", "come back", "repeat", "renew", "reorder", "continue", "share", "post", "refer", "save", "favorite", "track", "follow", "next service", "loyalty"],
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
function detectPhase(stepText: string, stepIndex: number, totalSteps: number): Phase {
  const lower = stepText.toLowerCase();
  const scores: Partial<Record<Phase, number>> = {};
  for (const [phase, keywords] of Object.entries(PHASE_KEYWORDS) as [Phase, string[]][]) {
    const matches = keywords.filter(kw => lower.includes(kw)).length;
    if (matches > 0) scores[phase] = matches;
  }
  const sorted = Object.entries(scores).sort((a, b) => (b[1] as number) - (a[1] as number));
  if (sorted.length > 0 && (sorted[0][1] as number) > 0) return sorted[0][0] as Phase;
  const ratio = stepIndex / Math.max(totalSteps - 1, 1);
  if (ratio <= 0.15) return "DISCOVERY";
  if (ratio <= 0.3) return "EVALUATION";
  if (ratio <= 0.5) return "CORE USAGE";
  if (ratio <= 0.8) return "FULFILLMENT";
  return "RETENTION";
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

function stripStepPrefix(text: string): string {
  return text.replace(/^step\s*\d+\s*[:\-–—]\s*/i, "").trim();
}

interface StepNode {
  text: string;
  index: number;
  friction?: FrictionPoint;
  icon: LucideIcon;
  phase: Phase;
}

function buildNodes(steps: string[], frictionPoints: FrictionPoint[]): StepNode[] {
  const total = Math.min(steps.length, 10);
  return steps.slice(0, 10).map((step, i) => {
    const cleanText = stripStepPrefix(step);
    return {
      text: cleanText,
      index: i,
      friction: getFriction(i, step, frictionPoints),
      icon: getStepIcon(cleanText),
      phase: detectPhase(cleanText, i, total),
    };
  });
}

/* ── Main component ── */
export function AdaptiveJourneyMap({
  steps, frictionPoints,
}: AdaptiveJourneyMapProps) {
  const isMobile = useIsMobile();
  const nodes = useMemo(() => buildNodes(steps, frictionPoints), [steps, frictionPoints]);
  const highFrictionCount = frictionPoints.filter(fp => (fp.severity || 0) >= 4).length;

  return (
    <div className="space-y-3">
      {/* Compact summary */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-muted-foreground">
          {steps.length} steps
        </span>
        {highFrictionCount > 0 && (
          <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: "hsl(0 72% 52% / 0.08)", color: "hsl(0 72% 42%)" }}>
            <AlertTriangle size={10} />
            {highFrictionCount} high friction
          </span>
        )}
      </div>

      {isMobile
        ? <MobileTimeline nodes={nodes} />
        : <DesktopTimeline nodes={nodes} />
      }
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DESKTOP: Clean horizontal timeline with grouped phases
   ═══════════════════════════════════════════════════════════════ */
function DesktopTimeline({ nodes }: { nodes: StepNode[] }) {
  // Group nodes by phase
  const groups = useMemo(() => {
    const result: { phase: Phase; nodes: StepNode[] }[] = [];
    nodes.forEach(node => {
      const last = result[result.length - 1];
      if (last && last.phase === node.phase) {
        last.nodes.push(node);
      } else {
        result.push({ phase: node.phase, nodes: [node] });
      }
    });
    return result;
  }, [nodes]);

  return (
    <ScrollArea className="w-full">
      <div className="flex items-start gap-0 pb-2 min-w-[600px]">
        {groups.map((group, gi) => {
          const color = PHASE_COLORS[group.phase];
          return (
            <React.Fragment key={gi}>
              <div className="flex flex-col flex-1 min-w-0">
                {/* Phase label */}
                <div className="mb-2 px-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.1em]"
                    style={{ color: `hsl(${color})` }}>
                    {group.phase}
                  </span>
                </div>
                {/* Steps */}
                <div className="flex gap-2">
                  {group.nodes.map((node, ni) => (
                    <React.Fragment key={node.index}>
                      <StepCard node={node} />
                      {/* Connector within group */}
                      {ni < group.nodes.length - 1 && (
                        <div className="flex items-center flex-shrink-0 pt-5">
                          <div className="w-4 h-[1.5px] rounded-full" style={{ background: `hsl(${color} / 0.2)` }} />
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
              {/* Connector between groups */}
              {gi < groups.length - 1 && (
                <div className="flex items-center flex-shrink-0 pt-8 px-1">
                  <ArrowRight size={14} className="text-muted-foreground/30" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

/* ── Step card ── */
function StepCard({ node }: { node: StepNode }) {
  const [expanded, setExpanded] = useState(false);
  const hasFriction = !!node.friction;
  const severity = node.friction?.severity || 0;
  const sevColor = getSeverityColor(severity);
  const isHigh = severity >= 4;
  const phaseColor = PHASE_COLORS[node.phase];
  const StepIcon = node.icon;

  return (
    <div
      className="flex flex-col rounded-lg min-w-[140px] max-w-[240px] flex-1 cursor-default"
      style={{
        background: "hsl(var(--card))",
        border: isHigh
          ? `1.5px solid hsl(${sevColor} / 0.3)`
          : "1px solid hsl(var(--border))",
      }}
    >
      {/* Icon + text */}
      <div className="p-3 pb-2">
        <div className="flex items-center gap-2 mb-1.5">
          <div
            className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
            style={{
              background: `hsl(${phaseColor} / 0.08)`,
              color: `hsl(${phaseColor})`,
            }}
          >
            <StepIcon size={14} strokeWidth={2} />
          </div>
          <span className="text-[10px] font-bold text-muted-foreground">{node.index + 1}</span>
        </div>
        <p className="text-[12px] font-semibold text-foreground leading-snug">
          {node.text}
        </p>
      </div>

      {/* Friction indicator */}
      {hasFriction && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 px-3 py-1.5 mt-auto transition-colors"
          style={{
            borderTop: `1px solid hsl(${sevColor} / 0.1)`,
            background: `hsl(${sevColor} / 0.03)`,
          }}
        >
          <AlertTriangle size={10} style={{ color: `hsl(${sevColor})` }} />
          <span className="text-[10px] font-bold flex-1 text-left" style={{ color: `hsl(${sevColor})` }}>
            {isHigh ? "High friction" : severity >= 3 ? "Friction" : "Minor friction"}
          </span>
          <ChevronDown size={10}
            className="transition-transform"
            style={{
              color: `hsl(${sevColor} / 0.5)`,
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            }}
          />
        </button>
      )}

      <AnimatePresence>
        {expanded && node.friction && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-1.5">
              <p className="text-[11px] text-foreground/70 leading-relaxed">{node.friction.friction}</p>
              {node.friction.rootCause && (
                <p className="text-[10px] text-muted-foreground leading-relaxed italic">{node.friction.rootCause}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MOBILE: Clean vertical timeline
   ═══════════════════════════════════════════════════════════════ */
function MobileTimeline({ nodes }: { nodes: StepNode[] }) {
  let currentPhase: Phase | null = null;

  return (
    <div className="relative pl-8">
      {/* Vertical line */}
      <div
        className="absolute left-[11px] top-2 bottom-2 w-[1.5px]"
        style={{ background: "hsl(var(--border))" }}
      />

      {nodes.map((node, i) => {
        const StepIcon = node.icon;
        const phaseColor = PHASE_COLORS[node.phase];
        const hasFriction = !!node.friction;
        const severity = node.friction?.severity || 0;
        const sevColor = getSeverityColor(severity);
        const isHigh = severity >= 4;
        const showPhase = node.phase !== currentPhase;
        if (showPhase) currentPhase = node.phase;

        return (
          <React.Fragment key={i}>
            {showPhase && (
              <div className="relative flex items-center gap-2 mb-1.5 mt-3 first:mt-0 -ml-8 pl-8">
                <div
                  className="absolute left-[8px] w-[7px] h-[7px] rounded-full z-10"
                  style={{ background: `hsl(${phaseColor})` }}
                />
                <span className="text-[10px] font-extrabold uppercase tracking-[0.1em]"
                  style={{ color: `hsl(${phaseColor})` }}>
                  {node.phase}
                </span>
              </div>
            )}

            <MobileStepNode
              node={node}
              StepIcon={StepIcon}
              phaseColor={phaseColor}
              hasFriction={hasFriction}
              sevColor={sevColor}
              isHigh={isHigh}
              severity={severity}
            />
          </React.Fragment>
        );
      })}
    </div>
  );
}

function MobileStepNode({ node, StepIcon, phaseColor, hasFriction, sevColor, isHigh, severity }: {
  node: StepNode; StepIcon: LucideIcon; phaseColor: string;
  hasFriction: boolean; sevColor: string; isHigh: boolean; severity: number;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="relative flex items-start gap-2.5 mb-3">
      {/* Node dot */}
      <div
        className="absolute -left-8 w-[24px] h-[24px] rounded-md flex items-center justify-center z-10"
        style={{
          background: "hsl(var(--card))",
          color: `hsl(${phaseColor})`,
          border: isHigh ? `1.5px solid hsl(${sevColor})` : `1px solid hsl(${phaseColor} / 0.25)`,
        }}
      >
        <StepIcon size={12} strokeWidth={2} />
      </div>

      {/* Card */}
      <div
        className="flex-1 min-w-0 rounded-lg overflow-hidden"
        style={{
          background: "hsl(var(--card))",
          border: isHigh ? `1.5px solid hsl(${sevColor} / 0.25)` : "1px solid hsl(var(--border))",
        }}
      >
        <div className="px-3 py-2.5">
          <p className="text-[12px] font-semibold text-foreground leading-snug">
            {node.text}
          </p>
        </div>

        {hasFriction && node.friction && (
          <>
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1.5 w-full px-3 py-1.5 transition-colors"
              style={{
                borderTop: `1px solid hsl(${sevColor} / 0.1)`,
                background: `hsl(${sevColor} / 0.03)`,
              }}
            >
              <AlertTriangle size={10} style={{ color: `hsl(${sevColor})` }} />
              <span className="text-[10px] font-bold flex-1 text-left" style={{ color: `hsl(${sevColor})` }}>
                {isHigh ? "High friction" : severity >= 3 ? "Friction" : "Minor"}
              </span>
              <ChevronDown size={10}
                className="transition-transform"
                style={{
                  color: `hsl(${sevColor} / 0.5)`,
                  transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                }}
              />
            </button>
            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden"
                >
                  <div className="px-3 pb-2.5 space-y-1">
                    <p className="text-[11px] text-foreground/70 leading-relaxed">{node.friction.friction}</p>
                    {node.friction.rootCause && (
                      <p className="text-[10px] text-muted-foreground italic">{node.friction.rootCause}</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}
