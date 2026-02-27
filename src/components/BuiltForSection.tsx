import { Lightbulb, Search, Presentation } from "lucide-react";

const SCENARIOS = [
  {
    icon: Lightbulb,
    trigger: "I have an idea",
    outcome: "Validate it with real market data, stress-test assumptions, and know if it's worth pursuing — before spending a dollar.",
    path: "Validation → Stress Test → Go/No-Go",
  },
  {
    icon: Search,
    trigger: "I found a competitor",
    outcome: "Deconstruct their model, map their supply chain, and surface the gaps they're missing — so you can exploit them.",
    path: "Teardown → Gap Analysis → Disruption Paths",
  },
  {
    icon: Presentation,
    trigger: "I need to pitch",
    outcome: "Generate an investor-grade deck backed by live market intel, patent landscapes, and financial projections — in minutes.",
    path: "Intel → Pitch Deck → Export",
  },
];

export function BuiltForSection() {
  return (
    <div className="max-w-4xl mx-auto">
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-5 text-center">
        What brings you here?
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SCENARIOS.map(({ icon: Icon, trigger, outcome, path }) => (
          <div
            key={trigger}
            className="rounded-xl border border-border bg-card p-5 flex flex-col"
          >
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon size={16} className="text-primary" />
              </div>
              <p className="text-base font-bold text-foreground leading-tight">
                "{trigger}"
              </p>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-4">
              {outcome}
            </p>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary/70">
              {path.split(" → ").map((step, i, arr) => (
                <span key={step} className="flex items-center gap-1.5">
                  {step}
                  {i < arr.length - 1 && <span className="text-border">→</span>}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
