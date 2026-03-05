import { useState } from "react";
import {
  ChevronDown, AlertTriangle, ArrowRight, Search, Users, Lightbulb,
  Star, Eye, ShoppingCart, CreditCard, Download, Settings, Globe,
  Clock, Phone, MessageSquare, Mail, Upload, Wrench, Truck, Home,
  Share2, Bookmark, Car, MapPin, Plane, Bike, Package, Camera, Mic,
  Shield, Move, Send, Lock, Route,
  type LucideIcon,
} from "lucide-react";
import type { WorkflowFriction } from "./types";

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
