import { useState } from "react";
import { Crosshair, Target, Brain, Swords, Presentation, ArrowRight, Sparkles, ChevronDown } from "lucide-react";

type ModeKey = "product" | "service" | "business";

interface StepDef {
  icon: typeof Crosshair;
  label: string;
  shortLabel: string;
  color: string;
  desc: Record<ModeKey, string>;
  detail: Record<ModeKey, string>;
}

const PIPELINE_STEPS: StepDef[] = [
  {
    icon: Crosshair,
    label: "Choose What to Disrupt",
    shortLabel: "Choose",
    color: "230 90% 63%",
    desc: {
      product: "Select your target — a product to deconstruct",
      service: "Select your target — a service to deconstruct",
      business: "Select your target — a business model to deconstruct",
    },
    detail: {
      product: "Enter the product you want to analyze. Add URLs, photos, or competitor links. This sets the context for the entire pipeline.",
      service: "Describe the service you want to analyze. Add landing pages, competitor URLs, or operational notes to set the pipeline context.",
      business: "Define the business model to analyze. Include revenue model, geography, pain points, and operational context for deeper analysis.",
    },
  },
  {
    icon: Target,
    label: "Intelligence Report",
    shortLabel: "Intel",
    color: "230 90% 63%",
    desc: {
      product: "Deep market data, pricing intel, supply chain mapping & competitor analysis",
      service: "Customer journey mapping, operational workflows & competitive positioning",
      business: "Revenue structure analysis, market dynamics & operational audit",
    },
    detail: {
      product: "We scrape live market sources, analyze pricing patterns, and map supplier networks to give you a complete intelligence picture.",
      service: "We analyze customer touchpoints, service delivery models, pricing tiers, and competitive positioning to map the full operational landscape.",
      business: "We deconstruct revenue streams, cost structures, market dynamics, and operational efficiency to surface structural opportunities.",
    },
  },
  {
    icon: Brain,
    label: "Disrupt & Reinvent",
    shortLabel: "Disrupt",
    color: "271 81% 55%",
    desc: {
      product: "Challenge assumptions & generate radical flip ideas for products",
      service: "Challenge delivery models & generate reinvented service concepts",
      business: "Challenge structural economics & generate model innovations",
    },
    detail: {
      product: "Every assumption gets challenged. The platform breaks down the product to fundamentals and generates novel concepts from community pain points.",
      service: "Every delivery assumption gets challenged. The platform questions workflows, pricing models, and generates service concepts that remove friction.",
      business: "Every structural assumption gets challenged. The platform tests revenue models, cost structures, and generates model pivots with higher leverage.",
    },
  },
  {
    icon: Sparkles,
    label: "Redesign",
    shortLabel: "Redesign",
    color: "38 92% 50%",
    desc: {
      product: "Interactive redesigned concept with detailed illustrations",
      service: "Reimagined service blueprint with delivery innovations",
      business: "Restructured model with new revenue and delivery mechanics",
    },
    detail: {
      product: "A fully reimagined product concept with physical specs, materials, smart features, and go-to-market strategy — brought to life visually.",
      service: "A reimagined service blueprint with optimized delivery workflows, technology integration points, and scalability mechanics.",
      business: "Business model analysis focuses on structural innovations — this step is adapted for model-level redesign rather than visual concepts.",
    },
  },
  {
    icon: Swords,
    label: "Stress Test",
    shortLabel: "Test",
    color: "350 80% 55%",
    desc: {
      product: "Red vs Green team adversarial validation & critical debate",
      service: "Adversarial review of service viability & operational risks",
      business: "Adversarial stress test of model economics & competitive moat",
    },
    detail: {
      product: "Your best ideas face adversarial scrutiny — a Red Team attacks while a Green Team defends, revealing blind spots before they cost you.",
      service: "Your service concepts face operational scrutiny — Red Team challenges scalability and retention while Green Team defends the model.",
      business: "Your model innovations face structural scrutiny — Red Team attacks unit economics and defensibility while Green Team validates the thesis.",
    },
  },
  {
    icon: Presentation,
    label: "Pitch Deck",
    shortLabel: "Pitch",
    color: "160 60% 44%",
    desc: {
      product: "Investor-ready presentation with data-backed slides",
      service: "Investor-ready deck with scalability & implementation plan",
      business: "Investor-ready deck with model economics & growth thesis",
    },
    detail: {
      product: "Auto-generated pitch deck with market sizing, competitive moats, revenue projections, and go-to-market strategy — ready for investors.",
      service: "Auto-generated pitch deck focused on service scalability, partnership strategy, retention metrics, and implementation roadmap.",
      business: "Auto-generated pitch deck with model economics, revenue durability, competitive moat analysis, and growth thesis — ready for investors.",
    },
  },
];

interface DisruptionPathBannerProps {
  activeStep?: number;
  onStartAnalysis?: () => void;
  accentColor?: string;
  activeMode?: ModeKey;
}

export function DisruptionPathBanner({ activeStep, onStartAnalysis, accentColor, activeMode = "product" }: DisruptionPathBannerProps) {
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

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
            From raw data to investor-ready output
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
              {PIPELINE_STEPS.map(({ icon: Icon, label, shortLabel, desc, detail, color }, i) => {
                const stepColor = accentColor || `hsl(${color})`;
                const isActive = activeStep !== undefined && activeStep === i + 1;
                const isPast = activeStep !== undefined && activeStep > i + 1;
                const isHovered = hoveredStep === i;
                const showColor = accentColor || isActive || isHovered || isPast;
                const isExpanded = expandedStep === i;
                const modeDesc = desc[activeMode];
                const modeDetail = detail[activeMode];

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
                        background: showColor ? stepColor : "hsl(var(--muted))",
                        border: showColor ? "none" : "2px solid hsl(var(--border))",
                        boxShadow: isHovered ? `0 4px 16px hsl(${stepColor} / 0.25)` : "none",
                        transform: isHovered ? "scale(1.15)" : "scale(1)",
                      }}
                    >
                      <Icon size={18} style={{ color: showColor ? "white" : "hsl(var(--muted-foreground))" }} />
                    </div>
                    {/* Step number */}
                    <span className="typo-status-label text-muted-foreground mb-0.5" style={{ fontSize: 10 }}>Step {i + 1}</span>
                    {/* Label */}
                    <p className="typo-card-title text-xs leading-tight mb-0.5">{shortLabel}</p>
                    {/* Short desc — full text, no truncation */}
                    <p className="text-[11px] text-muted-foreground leading-snug max-w-[160px] transition-all duration-300">
                      {modeDesc}
                    </p>
                    {/* Expand button for detail */}
                    <button
                      onClick={() => setExpandedStep(isExpanded ? null : i)}
                      className="mt-1 text-[10px] text-primary hover:underline inline-flex items-center gap-0.5 transition-colors"
                    >
                      {isExpanded ? "Less" : "More"}
                      <ChevronDown size={8} className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                    </button>
                    {/* Expanded detail */}
                    {isExpanded && (
                      <p className="text-[10px] text-muted-foreground leading-snug mt-1 max-w-[170px] animate-in fade-in duration-200">
                        {modeDetail}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile/Tablet: compact numbered list */}
          <div className="lg:hidden space-y-1">
            {PIPELINE_STEPS.map(({ icon: Icon, label, desc, detail, color }, i) => {
              const stepColor = accentColor || `hsl(${color})`;
              const isLast = i === PIPELINE_STEPS.length - 1;
              const isExpanded = expandedStep === i;
              const modeDesc = desc[activeMode];
              const modeDetail = detail[activeMode];

              return (
                <div key={label} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300"
                      style={{ background: stepColor }}
                    >
                      <Icon size={14} style={{ color: "white" }} />
                    </div>
                    {!isLast && <div className="w-0.5 flex-1 min-h-[12px] transition-all duration-300" style={{ background: accentColor ? `${accentColor.replace(')', ' / 0.2)')}` : `hsl(${color} / 0.2)` }} />}
                  </div>
                  <div className="pb-2 min-w-0">
                    <p className="typo-card-title text-sm leading-tight">{label}</p>
                    <p className="text-xs text-muted-foreground leading-snug mt-0.5">{modeDesc}</p>
                    <button
                      onClick={() => setExpandedStep(isExpanded ? null : i)}
                      className="mt-0.5 text-[11px] text-primary hover:underline inline-flex items-center gap-0.5"
                    >
                      {isExpanded ? "Less" : "More"}
                      <ChevronDown size={9} className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                    </button>
                    {isExpanded && (
                      <p className="text-[11px] text-muted-foreground leading-snug mt-1 animate-in fade-in duration-200">
                        {modeDetail}
                      </p>
                    )}
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
