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
    detail: "Every assumption gets challenged. The AI breaks down the product to fundamentals and generates novel concepts from community pain points.",
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        {/* Section heading */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest mb-4"
            style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))" }}>
            <Sparkles size={12} />
            How It Works
          </div>
          <h2 className="text-xl sm:text-3xl font-bold text-foreground tracking-tight">
            From raw data to investor-ready output
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-2 max-w-xl mx-auto">
            Six stages of AI-powered analysis, each building on the last
          </p>
        </div>

        {/* Pipeline steps — vertical on mobile, horizontal on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6 sm:gap-4">
          {PIPELINE_STEPS.map(({ icon: Icon, label, desc, detail, color }, i) => {
            const isActive = activeStep !== undefined && activeStep === i + 1;
            const isPast = activeStep !== undefined && activeStep > i + 1;
            const isHovered = hoveredStep === i;

            return (
              <div
                key={label}
                className="relative group"
                onMouseEnter={() => setHoveredStep(i)}
                onMouseLeave={() => setHoveredStep(null)}
              >
                {/* Connector arrow — desktop only, between cards */}
                {i < PIPELINE_STEPS.length - 1 && (
                  <div className="hidden lg:flex absolute -right-[18px] top-1/2 -translate-y-1/2 z-10">
                    <ArrowRight size={20} className="text-muted-foreground/60" strokeWidth={2.5} />
                  </div>
                )}

                <div
                  className="relative rounded-xl p-4 transition-all duration-300 cursor-default h-full flex flex-col"
                  style={{
                    background: isActive
                      ? "hsl(var(--muted))"
                      : isPast
                        ? "hsl(var(--muted))"
                        : isHovered
                          ? "hsl(var(--foreground) / 0.02)"
                          : "hsl(var(--background))",
                    border: isActive
                      ? `2px solid hsl(${color} / 0.35)`
                      : isPast
                        ? "2px solid hsl(var(--border))"
                        : isHovered
                          ? "2px solid hsl(var(--border))"
                          : "2px solid hsl(var(--border) / 0.6)",
                    boxShadow: isActive
                      ? `0 8px 32px hsl(${color} / 0.12)`
                      : isHovered
                        ? "0 4px 16px hsl(var(--foreground) / 0.06)"
                        : "none",
                    transform: isHovered ? "translateY(-2px)" : "translateY(0)",
                  }}
                >
                  {/* Step number + icon */}
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-300"
                      style={{
                        background: isActive || isHovered ? `hsl(${color})` : "hsl(var(--foreground))",
                      }}
                    >
                      <Icon size={18} style={{ color: "hsl(var(--background))" }} />
                    </div>
                    <span
                      className="text-[11px] font-bold uppercase tracking-widest"
                      style={{ color: isActive ? `hsl(${color})` : "hsl(var(--muted-foreground))" }}
                    >
                      Step {i + 1}
                    </span>
                  </div>

                  {/* Label */}
                  <h3 className="text-sm sm:text-base font-bold text-foreground mb-1 leading-tight">
                    {label}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-muted-foreground leading-relaxed mb-2 flex-1">
                    {desc}
                  </p>

                  {/* Expanded detail on hover/active */}
                  <div
                    className="overflow-hidden transition-all duration-300"
                    style={{
                      maxHeight: isHovered || isActive ? "80px" : "0px",
                      opacity: isHovered || isActive ? 1 : 0,
                    }}
                  >
                    <p className="text-[11px] text-muted-foreground/80 leading-relaxed pt-3"
                      style={{ borderTop: "1px solid hsl(var(--border))" }}>
                      {detail}
                    </p>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        {onStartAnalysis && (
          <div className="text-center mt-8 sm:mt-10">
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
