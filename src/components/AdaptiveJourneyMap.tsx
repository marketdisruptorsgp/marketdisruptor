import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Lock, ShoppingCart, CreditCard, Download, Settings, Globe,
  ArrowRight, Clock, Phone, MessageSquare, Mail, Upload, Eye, Wrench,
  Lightbulb, Truck, Home, Share2, Bookmark, Star, Users, Car, MapPin,
  Plane, Bike, Package, Camera, Mic, Shield, Move, Send,
  AlertTriangle, Brain, MapPinned, ShoppingBag, Monitor, ChevronDown,
  ChevronUp, Play, Pause, SkipForward, Zap,
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

/* ── Scene context — maps keywords to descriptive micro-labels ── */
const SCENE_LABELS: [string[], string][] = [
  [["realize", "notice", "need", "remember", "dashboard light"], "Moment of Need"],
  [["discover", "aware", "hear about", "learn about", "first encounter"], "First Awareness"],
  [["search", "browse", "look for", "find", "explore", "research"], "Searching"],
  [["recommend", "referral", "word of mouth"], "Peer Referral"],
  [["evaluate", "assess", "consider", "weigh", "decide"], "Weighing Options"],
  [["review", "rate", "feedback", "testimonial"], "Reading Reviews"],
  [["sign up", "register", "create account", "onboard", "enroll"], "Account Setup"],
  [["buy", "purchase", "order", "checkout", "add to cart"], "Making Purchase"],
  [["pay", "payment", "price", "cost", "charge", "bill"], "Payment"],
  [["download", "install"], "Installing"],
  [["setup", "configure", "customize", "personalize"], "Configuration"],
  [["drives to", "drive to", "go to", "heads to", "travels to"], "Traveling There"],
  [["pull into", "pulls into", "arrive", "park"], "Arriving"],
  [["greet", "check in", "welcome", "asks about"], "Check-In"],
  [["wait", "pending", "queue", "line", "lounge"], "Waiting"],
  [["inspect", "check", "diagnose", "assess", "look at", "initial inspection"], "Inspection"],
  [["recommend additional", "suggest", "upsell", "offer", "present", "quotes a price"], "Service Pitch"],
  [["approve", "accept", "agree", "consent", "authorize", "decides on"], "Customer Decision"],
  [["service", "repair", "fix", "maintain", "work on", "perform", "oil change", "tire"], "Service Work"],
  [["sticker", "receipt", "complete", "finish", "done"], "Completion"],
  [["drives away", "leave", "depart", "exit"], "Departing"],
  [["deliver", "ship", "receive", "pickup", "collect"], "Receiving"],
  [["return", "come back", "repeat", "renew"], "Coming Back"],
  [["share", "post", "social", "refer", "tell"], "Sharing Experience"],
  [["call", "phone", "contact", "reach out"], "Making Contact"],
  [["book", "reserve", "schedule", "appointment"], "Booking"],
];

function getSceneLabel(stepText: string): string {
  const lower = stepText.toLowerCase();
  for (const [keywords, label] of SCENE_LABELS) {
    if (keywords.some(kw => lower.includes(kw))) return label;
  }
  return "In Progress";
}

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

function detectPhase(stepText: string, stepIndex: number, totalSteps: number): Phase {
  const lower = stepText.toLowerCase();
  // Score each phase by keyword matches
  const scores: Partial<Record<Phase, number>> = {};
  for (const [phase, keywords] of Object.entries(PHASE_KEYWORDS) as [Phase, string[]][]) {
    const matches = keywords.filter(kw => lower.includes(kw)).length;
    if (matches > 0) scores[phase] = matches;
  }
  // Pick best match
  const sorted = Object.entries(scores).sort((a, b) => (b[1] as number) - (a[1] as number));
  if (sorted.length > 0 && (sorted[0][1] as number) > 0) return sorted[0][0] as Phase;
  // Position-aware fallback
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
  sceneLabel: string;
}

function stripStepPrefix(text: string): string {
  return text.replace(/^step\s*\d+\s*[:\-–—]\s*/i, "").trim();
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
      sceneLabel: getSceneLabel(cleanText),
    };
  });
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

/* ── Simulation controls ── */
function SimulationControls({ 
  isPlaying, activeStep, totalSteps, onToggle, onSkip, onReset 
}: { 
  isPlaying: boolean; activeStep: number; totalSteps: number;
  onToggle: () => void; onSkip: () => void; onReset: () => void;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
      style={{ background: "hsl(var(--foreground) / 0.04)", border: "1px solid hsl(var(--border))" }}>
      <button onClick={onToggle}
        className="w-7 h-7 rounded-md flex items-center justify-center transition-colors"
        style={{
          background: isPlaying ? "hsl(0 72% 52% / 0.1)" : "hsl(var(--primary) / 0.1)",
          color: isPlaying ? "hsl(0 72% 42%)" : "hsl(var(--primary))",
        }}>
        {isPlaying ? <Pause size={13} /> : <Play size={13} />}
      </button>
      <button onClick={onSkip} disabled={activeStep >= totalSteps - 1}
        className="w-7 h-7 rounded-md flex items-center justify-center transition-colors disabled:opacity-30"
        style={{ background: "hsl(var(--foreground) / 0.05)", color: "hsl(var(--foreground) / 0.6)" }}>
        <SkipForward size={13} />
      </button>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden mx-1"
        style={{ background: "hsl(var(--foreground) / 0.08)" }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: "hsl(var(--primary))" }}
          animate={{ width: `${((activeStep + 1) / totalSteps) * 100}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </div>
      <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap">
        {activeStep + 1}/{totalSteps}
      </span>
      {activeStep >= totalSteps - 1 && (
        <button onClick={onReset}
          className="text-[10px] font-bold px-2 py-1 rounded-md"
          style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}>
          Replay
        </button>
      )}
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

  // Simulation state
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  }, []);

  useEffect(() => {
    if (!isPlaying) { clearTimer(); return; }
    if (activeStep >= nodes.length - 1) { setIsPlaying(false); return; }
    timerRef.current = setTimeout(() => {
      setActiveStep(prev => prev + 1);
    }, 1800);
    return clearTimer;
  }, [isPlaying, activeStep, nodes.length, clearTimer]);

  const handleToggle = () => {
    if (activeStep >= nodes.length - 1) { setActiveStep(0); setIsPlaying(true); return; }
    if (activeStep < 0) setActiveStep(0);
    setIsPlaying(!isPlaying);
  };
  const handleSkip = () => { if (activeStep < nodes.length - 1) setActiveStep(prev => prev + 1); };
  const handleReset = () => { setActiveStep(0); setIsPlaying(true); };

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

      {/* Simulation controls */}
      <SimulationControls
        isPlaying={isPlaying}
        activeStep={Math.max(activeStep, 0)}
        totalSteps={nodes.length}
        onToggle={handleToggle}
        onSkip={handleSkip}
        onReset={handleReset}
      />

      <PhaseRibbon nodes={nodes} />

      {isMobile
        ? <MobileTimeline nodes={nodes} activeStep={activeStep} />
        : <DesktopSerpentine nodes={nodes} activeStep={activeStep} />
      }
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DESKTOP: Refined serpentine — 3 per row with connecting arrows
   ═══════════════════════════════════════════════════════════════ */
const COLS = 3;

function HorizontalConnector({ reversed, active }: { reversed?: boolean; active?: boolean }) {
  return (
    <div className="flex items-center justify-center" style={{ width: 32, flexShrink: 0 }}>
      <svg width="32" height="20" viewBox="0 0 32 20" fill="none">
        <line
          x1={reversed ? 28 : 4} y1="10"
          x2={reversed ? 4 : 28} y2="10"
          stroke={active ? "hsl(var(--primary) / 0.5)" : "hsl(var(--foreground) / 0.12)"}
          strokeWidth="2"
          strokeDasharray="4 3"
          strokeLinecap="round"
        />
        <polygon
          points={reversed ? "7,6 2,10 7,14" : "25,6 30,10 25,14"}
          fill={active ? "hsl(var(--primary) / 0.6)" : "hsl(var(--foreground) / 0.18)"}
        />
      </svg>
    </div>
  );
}

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

function DesktopSerpentine({ nodes, activeStep }: { nodes: StepNode[]; activeStep: number }) {
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
                      <StepCard node={node} stepNumber={node.index + 1} isActive={node.index === activeStep} isPast={node.index < activeStep} />
                    </div>
                    {ci < row.length - 1 && (
                      <div className="flex items-center">
                        <HorizontalConnector reversed={isReversed} active={node.index < activeStep} />
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

/* ── Illustrated scene icon ── */
function SceneIcon({ node, size = 44 }: { node: StepNode; size?: number }) {
  const StepIcon = node.icon;
  const phaseColor = PHASE_COLORS[node.phase];
  const hasFriction = !!node.friction;
  const severity = node.friction?.severity || 0;
  const sevColor = getSeverityColor(severity);

  return (
    <div className="relative flex flex-col items-center gap-1" style={{ width: size + 8 }}>
      <div
        className="rounded-xl flex items-center justify-center flex-shrink-0 relative"
        style={{
          width: size, height: size,
          background: `linear-gradient(135deg, hsl(${phaseColor} / 0.1), hsl(${phaseColor} / 0.04))`,
          color: `hsl(${phaseColor})`,
          border: `1.5px solid hsl(${phaseColor} / 0.2)`,
        }}
      >
        <StepIcon size={size * 0.4} strokeWidth={1.8} />
        {hasFriction && (
          <div
            className="absolute -top-1.5 -right-1.5 rounded-full flex items-center justify-center"
            style={{
              width: 18, height: 18,
              background: `hsl(${sevColor})`,
              color: "white",
              boxShadow: `0 0 8px -1px hsl(${sevColor} / 0.5)`,
            }}
          >
            <AlertTriangle size={9} />
          </div>
        )}
      </div>
      <span className="text-[9px] font-bold uppercase tracking-[0.06em] text-center leading-tight"
        style={{ color: `hsl(${phaseColor} / 0.7)` }}>
        {node.sceneLabel}
      </span>
    </div>
  );
}

/* ── Expandable friction hotspot ── */
function FrictionHotspot({ friction }: { friction: FrictionPoint }) {
  const [expanded, setExpanded] = useState(false);
  const severity = friction.severity || 0;
  const sevColor = getSeverityColor(severity);
  const sevLabel = getSeverityLabel(severity);

  return (
    <div
      className="rounded-lg cursor-pointer transition-all"
      onClick={() => setExpanded(!expanded)}
      style={{
        background: `hsl(${sevColor} / 0.05)`,
        border: `1px solid hsl(${sevColor} / 0.12)`,
      }}
    >
      <div className="flex items-center gap-1.5 px-3 py-2">
        <AlertTriangle size={11} style={{ color: `hsl(${sevColor})` }} />
        <span className="text-[11px] font-bold flex-1" style={{ color: `hsl(${sevColor})` }}>
          Friction ({sevLabel}/{severity}/5)
        </span>
        <Zap size={10} className="animate-pulse" style={{ color: `hsl(${sevColor})` }} />
        {expanded ? <ChevronUp size={11} style={{ color: `hsl(${sevColor} / 0.6)` }} /> : <ChevronDown size={11} style={{ color: `hsl(${sevColor} / 0.6)` }} />}
      </div>

      <div className="px-3 pb-2">
        <p className="text-[12px] text-foreground/75 leading-relaxed">{friction.friction}</p>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2">
              {friction.rootCause && (
                <div className="rounded-md px-2.5 py-2"
                  style={{ background: `hsl(${sevColor} / 0.04)`, border: `1px dashed hsl(${sevColor} / 0.15)` }}>
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5"
                    style={{ color: `hsl(${sevColor} / 0.7)` }}>Root Cause</p>
                  <p className="text-[12px] text-foreground/70 leading-relaxed">{friction.rootCause}</p>
                </div>
              )}
              <div className="rounded-md px-2.5 py-2"
                style={{ background: "hsl(var(--primary) / 0.04)", border: "1px dashed hsl(var(--primary) / 0.15)" }}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5"
                  style={{ color: "hsl(var(--primary) / 0.7)" }}>What This Means</p>
                <p className="text-[12px] text-foreground/70 leading-relaxed">
                  {severity >= 4
                    ? "This is a critical drop-off point. Customers actively consider abandoning the experience here."
                    : severity >= 3
                    ? "This creates noticeable hesitation. Some customers will tolerate it; others won't return."
                    : "Minor annoyance — not a dealbreaker, but fixing it improves the overall flow."
                  }
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Refined step card with scene icon & interactive friction ── */
function StepCard({ node, stepNumber, isActive, isPast }: { node: StepNode; stepNumber: number; isActive: boolean; isPast: boolean }) {
  const hasFriction = !!node.friction;
  const severity = node.friction?.severity || 0;
  const sevColor = getSeverityColor(severity);
  const isHigh = severity >= 4;
  const phaseColor = PHASE_COLORS[node.phase];

  return (
    <motion.div
      className="relative rounded-xl p-4 h-full flex flex-col transition-shadow"
      animate={{
        scale: isActive ? 1.02 : 1,
        boxShadow: isActive
          ? `0 4px 24px -4px hsl(var(--primary) / 0.2)`
          : isHigh
          ? `0 2px 16px -4px hsl(${sevColor} / 0.15)`
          : "0 1px 4px -1px hsl(var(--foreground) / 0.04)",
      }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      style={{
        background: "hsl(var(--card))",
        border: isActive
          ? "2px solid hsl(var(--primary) / 0.4)"
          : isHigh
          ? `1.5px solid hsl(${sevColor} / 0.35)`
          : "1px solid hsl(var(--border))",
        opacity: isPast ? 0.55 : 1,
      }}
    >
      {/* Active pulse indicator */}
      {isActive && (
        <motion.div
          className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
          style={{ background: "hsl(var(--primary))" }}
          animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}

      {/* Header row: illustrated scene icon + step text */}
      <div className="flex items-start gap-3 mb-2.5">
        <SceneIcon node={node} size={44} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.08em] px-1.5 py-0.5 rounded"
              style={{ background: `hsl(${phaseColor} / 0.08)`, color: `hsl(${phaseColor})` }}>
              {node.phase}
            </span>
          </div>
          <p className="text-sm font-bold text-foreground leading-snug">
            Step {stepNumber}: {node.text}
          </p>
        </div>
      </div>

      {/* Interactive friction hotspot */}
      {hasFriction && (
        <div className="mt-auto">
          <FrictionHotspot friction={node.friction!} />
        </div>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MOBILE: Vertical timeline with connecting line + step cards
   ═══════════════════════════════════════════════════════════════ */
function MobileTimeline({ nodes, activeStep }: { nodes: StepNode[]; activeStep: number }) {
  let currentPhase: Phase | null = null;

  return (
    <div className="relative pl-10">
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
        const isHigh = severity >= 4;
        const showPhase = node.phase !== currentPhase;
        if (showPhase) currentPhase = node.phase;
        const isActive = node.index === activeStep;
        const isPast = node.index < activeStep;

        return (
          <React.Fragment key={i}>
            {showPhase && (
              <div className="relative flex items-center gap-2 mb-2 mt-3 first:mt-0 -ml-10 pl-12">
                <div
                  className="absolute left-[16px] w-[8px] h-[8px] rounded-full z-10"
                  style={{ background: `hsl(${phaseColor})`, boxShadow: `0 0 6px hsl(${phaseColor} / 0.3)` }}
                />
                <span className="text-[10px] font-extrabold uppercase tracking-[0.1em]"
                  style={{ color: `hsl(${phaseColor})` }}>
                  {node.phase}
                </span>
              </div>
            )}

            <motion.div
              className="relative flex items-start gap-3 mb-4"
              animate={{ opacity: isPast ? 0.55 : 1 }}
              transition={{ duration: 0.3 }}
            >
              <div
                className="absolute -left-10 w-[40px] h-[40px] rounded-xl flex items-center justify-center z-10"
                style={{
                  background: "hsl(var(--card))",
                  color: `hsl(${phaseColor})`,
                  border: isActive
                    ? "2px solid hsl(var(--primary) / 0.5)"
                    : isHigh
                    ? `2px solid hsl(${sevColor})`
                    : `1.5px solid hsl(${phaseColor} / 0.25)`,
                  boxShadow: isActive
                    ? "0 0 16px -2px hsl(var(--primary) / 0.3)"
                    : isHigh
                    ? `0 0 12px -2px hsl(${sevColor} / 0.3)`
                    : "0 1px 6px -1px hsl(var(--foreground) / 0.06)",
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

              <div
                className="flex-1 min-w-0 ml-3 rounded-xl p-3.5"
                style={{
                  background: "hsl(var(--card))",
                  border: isActive
                    ? "2px solid hsl(var(--primary) / 0.3)"
                    : isHigh
                    ? `1.5px solid hsl(${sevColor} / 0.3)`
                    : "1px solid hsl(var(--border))",
                  boxShadow: isActive
                    ? "0 2px 16px -3px hsl(var(--primary) / 0.15)"
                    : isHigh
                    ? `0 2px 12px -3px hsl(${sevColor} / 0.12)`
                    : "0 1px 3px -1px hsl(var(--foreground) / 0.04)",
                }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider"
                    style={{ color: `hsl(${phaseColor} / 0.6)` }}>
                    {node.sceneLabel}
                  </span>
                </div>
                <p className="text-sm font-bold text-foreground leading-snug mb-1">
                  Step {node.index + 1}: {node.text}
                </p>
                {hasFriction && (
                  <FrictionHotspot friction={node.friction!} />
                )}
              </div>
            </motion.div>
          </React.Fragment>
        );
      })}
    </div>
  );
}
