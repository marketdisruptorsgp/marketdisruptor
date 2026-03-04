import React, { useMemo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
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

/* ── Phase ribbon (horizontal chevron bar) ── */
function PhaseRibbon({ nodes }: { nodes: StepNode[] }) {
  const phases = useMemo(() => {
    const seen = new Map<Phase, number>();
    nodes.forEach(n => { if (!seen.has(n.phase)) seen.set(n.phase, seen.size); });
    return Array.from(seen.keys());
  }, [nodes]);

  return (
    <div className="flex items-stretch overflow-x-auto gap-0 mb-1">
      {phases.map((phase, i) => {
        const color = PHASE_COLORS[phase];
        return (
          <div key={phase} className="flex items-center flex-shrink-0">
            <div
              className="px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.1em] whitespace-nowrap"
              style={{
                background: `hsl(${color} / 0.1)`,
                color: `hsl(${color})`,
                borderRadius: i === 0 ? "6px 0 0 6px" : i === phases.length - 1 ? "0 6px 6px 0" : "0",
              }}
            >
              {phase}
            </div>
            {i < phases.length - 1 && (
              <svg width="12" height="24" viewBox="0 0 12 24" className="flex-shrink-0 -mx-px">
                <path d="M0 0 L10 12 L0 24" fill={`hsl(${color} / 0.1)`} />
              </svg>
            )}
          </div>
        );
      })}
    </div>
  );
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
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>
          {steps.length} steps
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

      {/* Phase ribbon */}
      <PhaseRibbon nodes={nodes} />

      {/* Journey flow */}
      {isMobile ? (
        <MobileSerpentine nodes={nodes} />
      ) : (
        <DesktopSerpentine nodes={nodes} />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DESKTOP: Serpentine / S-curve road with positioned nodes
   Steps flow left→right on odd rows, right→left on even rows
   ═══════════════════════════════════════════════════════════════ */

const COLS = 4; // nodes per row
const NODE_W = 180;
const NODE_GAP = 24;
const ROW_H = 160;
const PATH_PADDING = 40;

function DesktopSerpentine({ nodes }: { nodes: StepNode[] }) {
  const rows = useMemo(() => {
    const result: StepNode[][] = [];
    for (let i = 0; i < nodes.length; i += COLS) {
      const row = nodes.slice(i, i + COLS);
      result.push(result.length % 2 === 1 ? [...row].reverse() : row);
    }
    return result;
  }, [nodes]);

  const totalRows = rows.length;
  const svgW = COLS * (NODE_W + NODE_GAP) + PATH_PADDING * 2;
  const svgH = totalRows * ROW_H + PATH_PADDING;

  // Build the serpentine SVG path
  const pathD = useMemo(() => {
    const parts: string[] = [];
    const xStart = PATH_PADDING + NODE_W / 2;
    const xEnd = PATH_PADDING + (Math.min(COLS, nodes.length) - 1) * (NODE_W + NODE_GAP) + NODE_W / 2;
    const yBase = PATH_PADDING + 20;

    for (let r = 0; r < totalRows; r++) {
      const y = yBase + r * ROW_H;
      const colCount = rows[r].length;
      const rowXEnd = PATH_PADDING + (colCount - 1) * (NODE_W + NODE_GAP) + NODE_W / 2;

      if (r % 2 === 0) {
        // Left to right
        if (r === 0) {
          parts.push(`M ${xStart} ${y}`);
        }
        parts.push(`L ${rowXEnd} ${y}`);
      } else {
        // Right to left
        parts.push(`L ${rowXEnd} ${y}`);
        parts.push(`L ${xStart} ${y}`);
      }

      // U-turn connector to next row
      if (r < totalRows - 1) {
        const nextY = yBase + (r + 1) * ROW_H;
        const turnX = r % 2 === 0 ? rowXEnd + 30 : xStart - 30;
        parts.push(`Q ${turnX} ${y} ${turnX} ${y + (nextY - y) / 2}`);
        parts.push(`Q ${turnX} ${nextY} ${r % 2 === 0 ? rowXEnd : xStart} ${nextY}`);
      }
    }
    return parts.join(" ");
  }, [totalRows, rows, nodes.length]);

  // Compute node positions
  const nodePositions = useMemo(() => {
    const yBase = PATH_PADDING + 20;
    return nodes.map((_, i) => {
      const row = Math.floor(i / COLS);
      const colInRow = i % COLS;
      const col = row % 2 === 0 ? colInRow : Math.min(COLS, rows[row]?.length || COLS) - 1 - colInRow;
      const x = PATH_PADDING + col * (NODE_W + NODE_GAP);
      const y = yBase + row * ROW_H;
      return { x, y };
    });
  }, [nodes, rows]);

  return (
    <ScrollArea className="w-full">
      <div className="relative" style={{ width: svgW, height: svgH, minWidth: svgW }}>
        {/* SVG road path */}
        <svg className="absolute inset-0" width={svgW} height={svgH} style={{ pointerEvents: "none" }}>
          <defs>
            <filter id="roadGlow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Road shadow */}
          <path d={pathD} fill="none" stroke="hsl(var(--border))" strokeWidth="28"
            strokeLinecap="round" strokeLinejoin="round" opacity="0.3" />
          {/* Road surface */}
          <path d={pathD} fill="none" stroke="hsl(var(--foreground) / 0.08)" strokeWidth="20"
            strokeLinecap="round" strokeLinejoin="round" />
          {/* Road dashes (center line) */}
          <path d={pathD} fill="none" stroke="hsl(var(--foreground) / 0.15)" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" strokeDasharray="8 8" />
        </svg>

        {/* Step nodes positioned on the road */}
        {nodes.map((node, i) => {
          const pos = nodePositions[i];
          if (!pos) return null;
          return (
            <SerpentineNode
              key={i}
              node={node}
              x={pos.x}
              y={pos.y}
              nodeWidth={NODE_W}
              isFirst={i === 0}
              isLast={i === nodes.length - 1}
            />
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

/* ── Single node on the serpentine road ── */
function SerpentineNode({
  node, x, y, nodeWidth, isFirst, isLast,
}: {
  node: StepNode; x: number; y: number; nodeWidth: number;
  isFirst: boolean; isLast: boolean;
}) {
  const StepIcon = node.icon;
  const phaseColor = PHASE_COLORS[node.phase];
  const hasFriction = !!node.friction;
  const severity = node.friction?.severity || 0;
  const sevColor = getSeverityColor(severity);
  const isHighSeverity = severity >= 4;

  return (
    <div
      className="absolute flex flex-col items-center"
      style={{
        left: x,
        top: y - 56,
        width: nodeWidth,
      }}
    >
      {/* Icon circle on the road */}
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center z-10 relative"
        style={{
          background: isFirst || isLast
            ? `hsl(${phaseColor})`
            : `hsl(var(--card))`,
          color: isFirst || isLast
            ? "hsl(var(--card))"
            : `hsl(${phaseColor})`,
          border: isHighSeverity
            ? `2px solid hsl(${sevColor})`
            : `2px solid hsl(${phaseColor} / 0.3)`,
          boxShadow: isHighSeverity
            ? `0 0 14px -2px hsl(${sevColor} / 0.4)`
            : `0 2px 8px -2px hsl(${phaseColor} / 0.2)`,
        }}
      >
        <StepIcon size={18} strokeWidth={1.8} />

        {/* Friction warning pip */}
        {hasFriction && (
          <div
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
            style={{ background: `hsl(${sevColor})`, color: "white" }}
          >
            <AlertTriangle size={8} />
          </div>
        )}
      </div>

      {/* Label card below the icon */}
      <div
        className="mt-2 w-full rounded-lg px-2.5 py-2 text-center"
        style={{
          background: "hsl(var(--card))",
          border: isHighSeverity
            ? `1px solid hsl(${sevColor} / 0.4)`
            : "1px solid hsl(var(--border))",
          boxShadow: "0 1px 4px 0 hsl(var(--border) / 0.2)",
        }}
      >
        <p className="text-[11px] font-bold text-foreground leading-snug line-clamp-2">{node.text}</p>

        {/* Friction detail */}
        {hasFriction && (
          <div className="mt-1.5 pt-1.5" style={{ borderTop: "1px solid hsl(var(--border))" }}>
            <div className="flex items-center justify-center gap-1">
              <AlertTriangle size={8} style={{ color: `hsl(${sevColor})` }} />
              <span className="text-[9px] font-bold" style={{ color: `hsl(${sevColor})` }}>
                Severity {severity}/5
              </span>
            </div>
            <p className="text-[9px] text-muted-foreground leading-snug mt-0.5 line-clamp-2">
              {node.friction!.friction}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MOBILE: Vertical winding path
   ═══════════════════════════════════════════════════════════════ */
function MobileSerpentine({ nodes }: { nodes: StepNode[] }) {
  let currentPhase: Phase | null = null;

  return (
    <div className="relative pl-6">
      {/* Vertical road line */}
      <div
        className="absolute left-[18px] top-0 bottom-0 w-[3px] rounded-full"
        style={{ background: "hsl(var(--foreground) / 0.08)" }}
      />
      {/* Dashed center line */}
      <div
        className="absolute left-[19px] top-0 bottom-0 w-[1px]"
        style={{
          backgroundImage: "repeating-linear-gradient(to bottom, hsl(var(--foreground) / 0.15) 0px, hsl(var(--foreground) / 0.15) 6px, transparent 6px, transparent 12px)",
        }}
      />

      {nodes.map((node, i) => {
        const StepIcon = node.icon;
        const phaseColor = PHASE_COLORS[node.phase];
        const hasFriction = !!node.friction;
        const severity = node.friction?.severity || 0;
        const sevColor = getSeverityColor(severity);
        const isHighSeverity = severity >= 4;
        const showPhaseHeader = node.phase !== currentPhase;
        if (showPhaseHeader) currentPhase = node.phase;

        return (
          <React.Fragment key={i}>
            {/* Phase header */}
            {showPhaseHeader && (
              <div className="relative flex items-center gap-2 mb-2 mt-3 first:mt-0 -ml-6 pl-10">
                <div className="absolute left-[15px] w-2 h-2 rounded-full z-10"
                  style={{ background: `hsl(${phaseColor})` }} />
                <span className="text-[9px] font-extrabold uppercase tracking-[0.12em]"
                  style={{ color: `hsl(${phaseColor})` }}>
                  {node.phase}
                </span>
              </div>
            )}

            {/* Step node */}
            <div className="relative flex items-start gap-3 mb-3">
              {/* Node circle on the road */}
              <div
                className="absolute -left-6 w-9 h-9 rounded-full flex items-center justify-center z-10"
                style={{
                  background: "hsl(var(--card))",
                  color: `hsl(${phaseColor})`,
                  border: isHighSeverity
                    ? `2px solid hsl(${sevColor})`
                    : `2px solid hsl(${phaseColor} / 0.3)`,
                  boxShadow: isHighSeverity
                    ? `0 0 10px -2px hsl(${sevColor} / 0.35)`
                    : "0 1px 4px -1px hsl(var(--border) / 0.3)",
                }}
              >
                <StepIcon size={14} strokeWidth={1.8} />
                {hasFriction && (
                  <div
                    className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                    style={{ background: `hsl(${sevColor})`, color: "white" }}
                  >
                    <AlertTriangle size={7} />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 ml-5">
                <p className="text-[12px] font-bold text-foreground leading-snug">{node.text}</p>
                {hasFriction && (
                  <div className="mt-1 space-y-0.5">
                    <span className="text-[9px] font-bold" style={{ color: `hsl(${sevColor})` }}>
                      Friction ({severity}/5)
                    </span>
                    <p className="text-[10px] text-muted-foreground leading-snug">{node.friction!.friction}</p>
                  </div>
                )}
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}
