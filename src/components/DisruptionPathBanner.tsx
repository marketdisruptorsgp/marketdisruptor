import { Crosshair, Target, Brain, Swords, Presentation, Sparkles } from "lucide-react";

type ModeKey = "product" | "service" | "business";

const STEPS = [
  { icon: Crosshair, label: "Select", value: "Your target" },
  { icon: Target, label: "Intel", value: "Market data & gaps" },
  { icon: Brain, label: "Disrupt", value: "Flip assumptions" },
  { icon: Sparkles, label: "Redesign", value: "New concepts" },
  { icon: Swords, label: "Stress Test", value: "Red vs Green" },
  { icon: Presentation, label: "Pitch", value: "Investor-ready" },
];

interface DisruptionPathBannerProps {
  activeStep?: number;
  onStartAnalysis?: () => void;
  accentColor?: string;
  activeMode?: ModeKey;
}

export function DisruptionPathBanner({ activeStep, accentColor, activeMode = "product" }: DisruptionPathBannerProps) {
  return (
    <section className="bg-card border-t border-border">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
        {/* Desktop: horizontal flow */}
        <div className="hidden sm:block">
          <div className="relative">
            <div className="absolute top-4 left-[8%] right-[8%] h-px bg-border z-0" />
            <div className="grid grid-cols-6 gap-0">
              {STEPS.map(({ icon: Icon, label, value }, i) => {
                const isActive = activeStep !== undefined && activeStep === i + 1;
                const isPast = activeStep !== undefined && activeStep > i + 1;
                const showColor = accentColor || isActive || isPast;

                return (
                  <div key={label} className="flex flex-col items-center text-center relative z-10">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center mb-1.5 transition-all"
                      style={{
                        background: showColor ? (accentColor || "hsl(var(--primary))") : "hsl(var(--muted))",
                        border: showColor ? "none" : "1.5px solid hsl(var(--border))",
                      }}
                    >
                      <Icon size={15} style={{ color: showColor ? "white" : "hsl(var(--muted-foreground))" }} />
                    </div>
                    <p className="text-xs font-bold text-foreground leading-tight">{label}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{value}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mobile: 2×3 compact grid */}
        <div className="sm:hidden grid grid-cols-3 gap-3">
          {STEPS.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex flex-col items-center text-center gap-1">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: accentColor || "hsl(var(--primary))" }}
              >
                <Icon size={14} style={{ color: "white" }} />
              </div>
              <p className="text-[11px] font-bold text-foreground leading-tight">{label}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
