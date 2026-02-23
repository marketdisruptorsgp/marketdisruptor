import { Target, Brain, Swords, Presentation, ArrowRight, Cpu, ShieldCheck, Tag } from "lucide-react";

const PIPELINE_STEPS = [
  { icon: Target, label: "Intelligence Report", desc: "Market data, competitor mapping, pricing signals" },
  { icon: Brain, label: "Disrupt", desc: "First principles deconstruction & reinvention" },
  { icon: Swords, label: "Stress Test", desc: "Red Team vs Blue Team adversarial validation" },
  { icon: Presentation, label: "Pitch Deck", desc: "Auto-generated investor-ready output" },
];

const METHODOLOGY = [
  { icon: Cpu, label: "Multi-Model AI", desc: "GPT-5 + Gemini cross-validated" },
  { icon: Target, label: "Deep Web Crawling", desc: "eBay, Etsy, Reddit, TikTok, Google" },
  { icon: ShieldCheck, label: "Adversarial Red Team", desc: "Every assumption attacked before you ship" },
  { icon: Tag, label: "Claim Tagging", desc: "All outputs tagged: Verified · Modeled · Assumption" },
];

export function DisruptionPathBanner() {
  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground tracking-tight">New Analysis</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Select a disruption path below, then provide your input.</p>
        </div>
      </div>

      {/* Pipeline preview */}
      <div className="rounded border border-border p-4" style={{ background: "hsl(var(--background))" }}>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">Every analysis runs through</p>
        <div className="flex items-center gap-1">
          {PIPELINE_STEPS.map(({ icon: Icon, label, desc }, i) => (
            <div key={label} className="flex items-center gap-1 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-1 min-w-0 rounded px-2.5 py-2 border border-border" style={{ background: "hsl(var(--card))" }}>
                <Icon size={13} className="text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-foreground truncate">{label}</p>
                  <p className="text-[9px] text-muted-foreground truncate hidden lg:block">{desc}</p>
                </div>
              </div>
              {i < PIPELINE_STEPS.length - 1 && (
                <ArrowRight size={10} className="text-muted-foreground/40 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Methodology strip */}
      <div className="rounded border border-border p-3" style={{ background: "hsl(var(--card))" }}>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2.5">Methodology</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {METHODOLOGY.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-start gap-2 px-2.5 py-2 rounded border border-border" style={{ background: "hsl(var(--background))" }}>
              <Icon size={12} className="text-primary flex-shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-foreground leading-tight">{label}</p>
                <p className="text-[9px] text-muted-foreground leading-snug">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
