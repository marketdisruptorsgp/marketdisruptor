import { Target, Brain, Swords, Presentation, ArrowRight } from "lucide-react";

const PIPELINE_STEPS = [
  { icon: Target, label: "Intelligence Report", shortLabel: "Report", desc: "Market data & competitor mapping" },
  { icon: Brain, label: "Disrupt", shortLabel: "Disrupt", desc: "First principles deconstruction" },
  { icon: Swords, label: "Stress Test", shortLabel: "Test", desc: "Adversarial validation" },
  { icon: Presentation, label: "Pitch Deck", shortLabel: "Pitch", desc: "Investor-ready output" },
];

export function DisruptionPathBanner() {
  return (
    <div className="border-t border-border bg-card">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center gap-1 sm:gap-2">
          {PIPELINE_STEPS.map(({ icon: Icon, label, shortLabel }, i) => (
            <div key={label} className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
              <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0 rounded-lg px-2 sm:px-3 py-2 sm:py-2.5 border border-border bg-background">
                <Icon size={12} className="text-primary flex-shrink-0" />
                <p className="text-[10px] sm:text-xs font-semibold text-foreground truncate">
                  <span className="hidden sm:inline">{label}</span>
                  <span className="sm:hidden">{shortLabel}</span>
                </p>
              </div>
              {i < PIPELINE_STEPS.length - 1 && (
                <ArrowRight size={8} className="text-muted-foreground/40 flex-shrink-0 sm:w-[10px]" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}