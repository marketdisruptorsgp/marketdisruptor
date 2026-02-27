import { useState } from "react";
import { Crosshair, Target, Brain, Swords, Presentation, ArrowRight, Sparkles } from "lucide-react";

const PIPELINE_STEPS = [
  {
    icon: Crosshair,
    label: "Choose What to Disrupt",
    shortLabel: "Choose",
    desc: "Select your target — a product, service, or business model to deconstruct",
    detail: "Pick your disruptor mode and enter the product, service, or business model you want to analyze. This sets the context for the entire pipeline.",
    color: "230 90% 63%",
  },
  {
    icon: Target,
    label: "Intelligence Report",
    shortLabel: "Intel",
    desc: "Deep market data, pricing intel, supply chain mapping & competitor analysis",
    detail: "We scrape live market sources, analyze pricing patterns, and map supplier networks to give you a complete intelligence picture.",
    color: "230 90% 63%",
  },
  {
    icon: Brain,
    label: "Disrupt & Reinvent",
    shortLabel: "Disrupt",
    desc: "Challenge assumptions & generate radical flip ideas",
    detail: "Every assumption gets challenged. The platform breaks down the product to fundamentals and generates novel concepts from community pain points.",
    color: "271 81% 55%",
  },
  {
    icon: Sparkles,
    label: "Redesign",
    shortLabel: "Redesign",
    desc: "Interactive redesigned concept with detailed illustrations",
    detail: "A fully reimagined product concept with physical specs, materials, smart features, and go-to-market strategy — brought to life visually.",
    color: "38 92% 50%",
  },
  {
    icon: Swords,
    label: "Stress Test",
    shortLabel: "Test",
    desc: "Red vs Green team adversarial validation & critical debate",
    detail: "Your best ideas face adversarial scrutiny — a Red Team attacks while a Green Team defends, revealing blind spots before they cost you.",
    color: "350 80% 55%",
  },
  {
    icon: Presentation,
    label: "Pitch Deck",
    shortLabel: "Pitch",
    desc: "Investor-ready presentation with data-backed slides",
    detail: "Auto-generated pitch deck with market sizing, competitive moats, revenue projections, and go-to-market strategy — ready for investors.",
    color: "160 60% 44%",
  },
];

interface DisruptionPathBannerProps {
  activeStep?: number;
  onStartAnalysis?: () => void;
}

export function DisruptionPathBanner({ activeStep, onStartAnalysis }: DisruptionPathBannerProps) {
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  return (
    <section className="bg-card border-t border-border">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Section heading */}
        <div className="text-center mb-5 sm:mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full typo-status-label mb-3"
            style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))" }}>
            <Sparkles size={12} />
            How It Works
          </div>
          <h2 className="typo-page-title text-xl sm:text-2xl tracking-tight">
            How the Analysis Works
          </h2>
          <p className="typo-page-meta mt-1 max-w-xl mx-auto text-sm">
            Six stages of structured analysis, each building on the last
          </p>
        </div>

        {/* Pipeline — connected horizontal flow on desktop, compact vertical on mobile */}
        <div className="relative">
          {/* Desktop: horizontal connected timeline */}
          <div className="hidden lg:block">
            {/* Connection line */}
            <div className="absolute top-5 left-[7%] right-[7%] h-0.5 bg-border z-0" />
            <div className="grid grid-cols-6 gap-0">
              {PIPELINE_STEPS.map(({ icon: Icon, label, shortLabel, desc, color }, i) => {
                const isActive = activeStep !== undefined && activeStep === i + 1;
                const isPast = activeStep !== undefined && activeStep > i + 1;
                const isHovered = hoveredStep === i;

                return (
                  <div
                    key={label}
                    className="flex flex-col items-center text-center px-2 relative z-10"
                    onMouseEnter={() => setHoveredStep(i)}
                    onMouseLeave={() => setHoveredStep(null)}
                  >
                    {/* Step circle */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 mb-2"
                      style={{
                        background: isActive || isHovered || isPast ? `hsl(${color})` : "hsl(var(--muted))",
                        border: isActive || isHovered || isPast ? "none" : "2px solid hsl(var(--border))",
                        boxShadow: isHovered ? `0 4px 16px hsl(${color} / 0.25)` : "none",
                        transform: isHovered ? "scale(1.15)" : "scale(1)",
                      }}
                    >
                      <Icon size={18} style={{ color: isActive || isHovered || isPast ? "white" : "hsl(var(--muted-foreground))" }} />
                    </div>
                    {/* Step number */}
                    <span className="typo-status-label text-muted-foreground mb-0.5" style={{ fontSize: 10 }}>Step {i + 1}</span>
                    {/* Label */}
                    <p className="typo-card-title text-xs leading-tight mb-0.5">{shortLabel}</p>
                    {/* Short desc */}
                    <p className="text-[11px] text-muted-foreground leading-snug max-w-[140px]">{desc.split(",")[0]}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile/Tablet: compact numbered list */}
          <div className="lg:hidden space-y-1">
            {PIPELINE_STEPS.map(({ icon: Icon, label, desc, color }, i) => {
              const isLast = i === PIPELINE_STEPS.length - 1;
              return (
                <div key={label} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: `hsl(${color})` }}
                    >
                      <Icon size={14} style={{ color: "white" }} />
                    </div>
                    {!isLast && <div className="w-0.5 flex-1 min-h-[12px]" style={{ background: `hsl(${color} / 0.2)` }} />}
                  </div>
                  <div className="pb-2 min-w-0">
                    <p className="typo-card-title text-sm leading-tight">{label}</p>
                    <p className="text-xs text-muted-foreground leading-snug mt-0.5">{desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        {onStartAnalysis && (
          <div className="text-center mt-6 sm:mt-8">
            <button
              onClick={onStartAnalysis}
              className="btn-primary text-sm px-6 sm:px-8"
            >
              Start Your Analysis <ArrowRight size={15} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
