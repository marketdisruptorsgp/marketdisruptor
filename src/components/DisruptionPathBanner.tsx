import { Target, Brain, Swords, Presentation, ArrowRight } from "lucide-react";

const PIPELINE_STEPS = [
  { icon: Target, label: "Intelligence Report", desc: "Market data & competitor mapping" },
  { icon: Brain, label: "Disrupt", desc: "First principles deconstruction" },
  { icon: Swords, label: "Stress Test", desc: "Adversarial validation" },
  { icon: Presentation, label: "Pitch Deck", desc: "Investor-ready output" },
];

export function DisruptionPathBanner() {
  return (
    <div className="border-t border-border bg-card">
      <div className="max-w-5xl mx-auto px-6 py-4">
        <div className="flex items-center gap-2">
          {PIPELINE_STEPS.map(({ icon: Icon, label }, i) => (
            <div key={label} className="flex items-center gap-2 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-1 min-w-0 rounded-lg px-3 py-2.5 border border-border bg-background">
                <Icon size={13} className="text-primary flex-shrink-0" />
                <p className="text-xs font-semibold text-foreground truncate">{label}</p>
              </div>
              {i < PIPELINE_STEPS.length - 1 && (
                <ArrowRight size={10} className="text-muted-foreground/40 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
