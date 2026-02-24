import { Target, Brain, Swords, Presentation, ChevronRight } from "lucide-react";

const PIPELINE_STEPS = [
  { icon: Target, label: "Intelligence Report", shortLabel: "Report", desc: "Market data & competitor mapping" },
  { icon: Brain, label: "Disrupt", shortLabel: "Disrupt", desc: "First principles deconstruction" },
  { icon: Swords, label: "Stress Test", shortLabel: "Test", desc: "Adversarial validation" },
  { icon: Presentation, label: "Pitch Deck", shortLabel: "Pitch", desc: "Investor-ready output" },
];

interface DisruptionPathBannerProps {
  activeStep?: number;
}

export function DisruptionPathBanner({ activeStep }: DisruptionPathBannerProps) {
  return (
    <div className="border-t border-border bg-card">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-1 sm:gap-2 min-w-max">
          {PIPELINE_STEPS.map(({ icon: Icon, label, shortLabel }, i) => {
            const isActive = activeStep !== undefined && activeStep === i + 1;
            const isPast = activeStep !== undefined && activeStep > i + 1;
            return (
              <div key={label} className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
                <div
                  className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0 rounded-lg px-2 sm:px-3 py-2 sm:py-2.5 border transition-all"
                  style={{
                    background: isActive ? "hsl(var(--primary))" : isPast ? "hsl(var(--primary) / 0.08)" : "hsl(var(--background))",
                    borderColor: isActive ? "hsl(var(--primary))" : isPast ? "hsl(var(--primary) / 0.2)" : "hsl(var(--border))",
                    boxShadow: isActive ? "0 2px 8px hsl(var(--primary) / 0.2)" : "none",
                  }}
                >
                  <Icon
                    size={12}
                    className="flex-shrink-0"
                    style={{ color: isActive ? "hsl(var(--primary-foreground))" : isPast ? "hsl(var(--primary))" : "hsl(var(--primary))" }}
                  />
                  <p
                    className="text-[10px] sm:text-xs font-semibold truncate"
                    style={{
                      color: isActive ? "hsl(var(--primary-foreground))" : isPast ? "hsl(var(--primary))" : "hsl(var(--foreground))",
                      fontWeight: isActive || isPast ? 700 : 600,
                    }}
                  >
                    <span className="hidden sm:inline">{label}</span>
                    <span className="sm:hidden">{shortLabel}</span>
                  </p>
                </div>
                {i < PIPELINE_STEPS.length - 1 && (
                  <ChevronRight size={14} className="text-muted-foreground flex-shrink-0" strokeWidth={2.5} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
