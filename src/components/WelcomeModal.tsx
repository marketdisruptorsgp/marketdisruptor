import { useState } from "react";
import {
  Rocket, Search, Brain, Building2, Target, X, Lightbulb, ArrowRight,
} from "lucide-react";

interface WelcomeModalProps {
  firstName: string;
  onClose: () => void;
}

const SLIDES = [
  {
    icon: Rocket,
    title: (name: string) => `Let's go, ${name}!`,
    subtitle: "You've just unlocked a serious product intelligence engine.",
    body: "This isn't just a research tool — it's a competitive advantage. You're about to see markets, products, and opportunities the way analysts at top firms do.",
    tips: [
      "Proprietary multi-source data pipelines",
      "Deep web crawling, visual analysis, and strategic modeling",
      "Everything auto-saves so you never lose a discovery",
    ],
    color: "hsl(var(--primary))",
  },
  {
    icon: Search,
    title: () => "Analysis Type: Product Deep Dive",
    subtitle: "Drop in a product and let the platform tear it apart.",
    body: "Enter a product name, paste URLs, or upload images — the platform runs proprietary crawling pipelines to surface pricing intelligence, supply chain data, and competitive gaps.",
    tips: [
      "Paste up to 3 URLs + upload 5 images",
      "Every assumption about the product gets challenged",
      "Custom mode lets you analyze any product or service",
    ],
    color: "hsl(217 91% 45%)",
  },
  {
    icon: Brain,
    title: () => "Analysis Type: Service Intelligence",
    subtitle: "Every service is a rabbit hole. Go deep.",
    body: "Analyze any service business — the platform maps competitive landscapes, identifies operational friction, and builds growth strategies from gaps competitors overlook.",
    tips: [
      "Flip Ideas = 3 bold commercial pivots",
      "First Principles = strip it down and redesign",
      "Pitch Deck = investor-ready slides",
    ],
    color: "hsl(271 81% 55%)",
  },
  {
    icon: Building2,
    title: () => "Analysis Type: Business Model",
    subtitle: "Deconstruct any real-world business.",
    body: "Use this when you're analyzing a service or B2B model. Laundromats, agencies, distributors — the platform breaks down cost structures and inefficiencies.",
    tips: [
      "Try 'car wash', 'staffing agency', or 'franchise'",
      "Revenue Reinvention surfaces new opportunities",
      "Export as PDF to share with partners",
    ],
    color: "hsl(38 92% 40%)",
  },
  {
    icon: Target,
    title: () => "Your workspace, your edge",
    subtitle: "Everything persists. Nothing is lost.",
    body: "Every analysis you run auto-saves to your personal workspace. Come back tomorrow, run 20 analyses in a session, share access with no overlap.",
    tips: [
      "Click any saved analysis to instantly reload it",
      "Multiple people can use this simultaneously",
      "Your data never expires",
    ],
    color: "hsl(142 70% 38%)",
  },
];

export default function WelcomeModal({ firstName, onClose }: WelcomeModalProps) {
  const [slide, setSlide] = useState(0);
  const current = SLIDES[slide];
  const Icon = current.icon;
  const isLast = slide === SLIDES.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
    >
      <div
        className="w-full max-w-xl rounded border border-border shadow-lg bg-card overflow-hidden"
      >
        {/* Top color strip */}
        <div className="h-1 transition-all duration-500" style={{ background: current.color }} />

        <div className="p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded flex items-center justify-center border"
                style={{ borderColor: `${current.color}40`, color: current.color, background: `${current.color}10` }}
              >
                <Icon size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: current.color }}>
                  {slide + 1} of {SLIDES.length}
                </p>
                <h2 className="text-xl font-bold text-foreground">
                  {current.title(firstName)}
                </h2>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground">
              <X size={16} />
            </button>
          </div>

          {/* Subtitle */}
          <p className="text-sm font-semibold mb-3" style={{ color: current.color }}>
            {current.subtitle}
          </p>

          {/* Body */}
          <p className="text-sm leading-relaxed mb-6 text-muted-foreground">
            {current.body}
          </p>

          {/* Tips */}
          <div className="space-y-2.5 mb-8">
            {current.tips.map((tip) => (
              <div key={tip} className="flex items-start gap-2.5">
                <Lightbulb size={13} className="flex-shrink-0 mt-0.5" style={{ color: current.color }} />
                <p className="text-xs leading-relaxed text-foreground">{tip}</p>
              </div>
            ))}
          </div>

          {/* Slide dots + nav */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSlide(i)}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i === slide ? "20px" : "6px",
                    height: "6px",
                    background: i === slide ? current.color : "hsl(var(--muted-foreground) / 0.3)",
                  }}
                />
              ))}
            </div>
            <div className="flex gap-2">
              {slide > 0 && (
                <button
                  onClick={() => setSlide(slide - 1)}
                  className="px-4 py-2 rounded text-sm font-semibold transition-all bg-muted text-foreground hover:bg-muted/80"
                >
                  Back
                </button>
              )}
              <button
                onClick={isLast ? onClose : () => setSlide(slide + 1)}
                className="flex items-center gap-1.5 px-5 py-2 rounded text-sm font-bold transition-all text-white hover:opacity-90"
                style={{ background: current.color }}
              >
                {isLast ? (
                  <><Rocket size={13} /> Let's Go</>
                ) : (
                  <>Next <ArrowRight size={13} /></>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
