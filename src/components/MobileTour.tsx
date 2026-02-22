import { useState, useEffect, useCallback } from "react";
import { ChevronRight, X, Telescope, Upload, Building2, Database, User } from "lucide-react";

const TOUR_STEPS = [
  {
    target: "[data-tour='tabs']",
    icon: Telescope,
    title: "Choose Your Analysis Mode",
    body: "Tap these tabs to switch between Product Discovery, Custom Analysis, Business Models, or your Saved Projects.",
    position: "below" as const,
  },
  {
    target: "[data-tour='analysis-form']",
    icon: Upload,
    title: "Start Your Analysis Here",
    body: "Pick a category and era, then hit Analyze. The AI will scrape live data from 6+ sources and build a full report.",
    position: "below" as const,
  },
  {
    target: "[data-tour='user-menu']",
    icon: User,
    title: "Your Account & Settings",
    body: "Tap your name to access plan info, share referral links, change password, or sign out.",
    position: "below" as const,
  },
];

export default function MobileTour({ userId }: { userId: string }) {
  const storageKey = `mobile_tour_done_${userId}`;
  const [step, setStep] = useState(-1);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  // Only show on mobile
  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

  useEffect(() => {
    if (!isMobile) return;
    if (localStorage.getItem(storageKey)) return;
    // Small delay to let page render
    const t = setTimeout(() => setStep(0), 1500);
    return () => clearTimeout(t);
  }, [isMobile, storageKey]);

  const measureTarget = useCallback(() => {
    if (step < 0 || step >= TOUR_STEPS.length) return;
    const el = document.querySelector(TOUR_STEPS[step].target);
    if (el) {
      setTargetRect(el.getBoundingClientRect());
      // Scroll element into view if needed
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [step]);

  useEffect(() => {
    measureTarget();
    const onResize = () => measureTarget();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [measureTarget]);

  const dismiss = () => {
    localStorage.setItem(storageKey, "1");
    setStep(-1);
  };

  const next = () => {
    if (step >= TOUR_STEPS.length - 1) {
      dismiss();
    } else {
      setStep(step + 1);
    }
  };

  if (step < 0 || !targetRect) return null;

  const current = TOUR_STEPS[step];
  const Icon = current.icon;
  const isLast = step === TOUR_STEPS.length - 1;

  // Position tooltip below the target
  const tooltipTop = targetRect.bottom + 12;
  const tooltipLeft = Math.max(16, Math.min(targetRect.left, window.innerWidth - 300));

  return (
    <div className="fixed inset-0" style={{ zIndex: 200000 }}>
      {/* Overlay with cutout */}
      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: "none" }}>
        <defs>
          <mask id="tour-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={targetRect.left - 6}
              y={targetRect.top - 6}
              width={targetRect.width + 12}
              height={targetRect.height + 12}
              rx="12"
              fill="black"
            />
          </mask>
        </defs>
        <rect
          width="100%" height="100%"
          fill="hsla(220, 20%, 5%, 0.7)"
          mask="url(#tour-mask)"
          style={{ pointerEvents: "auto" }}
          onClick={dismiss}
        />
      </svg>

      {/* Highlight ring */}
      <div
        className="absolute rounded-xl pointer-events-none"
        style={{
          left: targetRect.left - 6,
          top: targetRect.top - 6,
          width: targetRect.width + 12,
          height: targetRect.height + 12,
          border: "2px solid hsl(var(--primary))",
          boxShadow: "0 0 20px 4px hsl(var(--primary) / 0.3)",
        }}
      />

      {/* Tooltip card */}
      <div
        className="absolute rounded-2xl p-5 space-y-3"
        style={{
          top: tooltipTop,
          left: 16,
          right: 16,
          maxWidth: "calc(100vw - 32px)",
          background: "hsl(var(--background))",
          border: "1px solid hsl(var(--border))",
          boxShadow: "0 20px 60px -10px rgba(0,0,0,0.5)",
        }}
      >
        {/* Arrow pointing up */}
        <div
          className="absolute -top-2 w-4 h-4 rotate-45"
          style={{
            left: Math.min(Math.max(targetRect.left + targetRect.width / 2 - 16, 24), window.innerWidth - 56),
            background: "hsl(var(--background))",
            borderLeft: "1px solid hsl(var(--border))",
            borderTop: "1px solid hsl(var(--border))",
          }}
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "hsl(var(--primary) / 0.15)" }}>
              <Icon size={16} style={{ color: "hsl(var(--primary))" }} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "hsl(var(--primary))" }}>
                Step {step + 1} of {TOUR_STEPS.length}
              </p>
              <h3 className="text-sm font-extrabold" style={{ color: "hsl(var(--foreground))" }}>{current.title}</h3>
            </div>
          </div>
          <button onClick={dismiss} className="p-1 rounded-lg hover:bg-muted transition-colors">
            <X size={14} style={{ color: "hsl(var(--muted-foreground))" }} />
          </button>
        </div>

        <p className="text-xs leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
          {current.body}
        </p>

        <div className="flex items-center justify-between pt-1">
          <div className="flex gap-1.5">
            {TOUR_STEPS.map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all"
                style={{
                  width: i === step ? 16 : 6,
                  height: 6,
                  background: i === step ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.3)",
                }}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={dismiss}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ color: "hsl(var(--muted-foreground))" }}
            >
              Skip
            </button>
            <button
              onClick={next}
              className="flex items-center gap-1 px-4 py-1.5 rounded-lg text-xs font-bold text-white transition-all"
              style={{ background: "hsl(var(--primary))" }}
            >
              {isLast ? "Got it!" : <>Next <ChevronRight size={12} /></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
