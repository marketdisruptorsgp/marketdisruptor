import { useState } from "react";
import {
  Zap, Search, Brain, Sparkles, TrendingUp, Building2, Layers,
  BarChart3, ChevronRight, X, Target, Lightbulb, Rocket, ArrowRight,
} from "lucide-react";

interface WelcomeModalProps {
  firstName: string;
  onClose: () => void;
}

const SLIDES = [
  {
    icon: Rocket,
    emoji: "🚀",
    title: (name: string) => `Let's go, ${name}!`,
    subtitle: "You've just unlocked a serious product intelligence engine.",
    body: "This isn't just a research tool — it's a competitive advantage. You're about to see markets, products, and opportunities the way analysts at top firms do. Except now, it's all yours.",
    tips: [
      "Live data from eBay, Etsy, Reddit & TikTok — updated every run",
      "AI analysis powered by Gemini 2.5 Flash",
      "Everything auto-saves so you never lose a discovery",
    ],
    color: "hsl(var(--primary))",
  },
  {
    icon: Search,
    emoji: "🔍",
    title: () => "Step 1: Discover Products",
    subtitle: "Start with a category + era. The AI does the heavy lifting.",
    body: "Pick something nostalgic, something niche, something you've been curious about. Enter a category like '90s Gaming' or 'Vintage Kitchen' and watch the system pull live pricing, seller data, and demand signals from across the web.",
    tips: [
      "Try surprising combos: '80s Fitness' or 'Y2K Tech'",
      "The weirder the niche, the bigger the gap — that's where opportunity hides",
      "Custom products let you paste a URL or image for instant analysis",
    ],
    color: "hsl(217 91% 45%)",
  },
  {
    icon: Brain,
    emoji: "🧠",
    title: () => "Step 2: Deconstruct Deeply",
    subtitle: "Each product tab is a different lens.",
    body: "Once products are discovered, click any card and explore the tabs: pricing intelligence, supply chain, community sentiment, flip ideas, first principles deconstruction, and pitch deck. Don't skip First Principles — that's where the real insights live.",
    tips: [
      "Flip Ideas = 3 bold commercial pivots per product",
      "First Principles = radical redesign from scratch",
      "Pitch Deck = investor-ready slides generated automatically",
    ],
    color: "hsl(271 81% 55%)",
  },
  {
    icon: Building2,
    emoji: "🏢",
    title: () => "Step 3: Analyze Any Business",
    subtitle: "Not just products — full business models too.",
    body: "The Business Model Deconstruction tab lets you analyze any real-world business — laundromats, agencies, distributors, you name it. It uncovers hidden cost structures, untapped revenue streams, and a complete reinvented model.",
    tips: [
      "Try 'car wash' or 'staffing agency' for instant ROI insights",
      "Revenue Reinvention tab often surfaces $50K+ annual opportunities",
      "Download as PDF to share with partners or clients",
    ],
    color: "hsl(38 92% 40%)",
  },
  {
    icon: Target,
    emoji: "🎯",
    title: () => "Your workspace, your edge",
    subtitle: "Everything persists. Nothing is lost.",
    body: "Every analysis you run auto-saves to your personal workspace. Come back tomorrow, run 20 analyses in a session, share access with no overlap. Each person's workspace is isolated and private.",
    tips: [
      "Click any saved analysis to instantly reload it",
      "Multiple people can use this simultaneously — zero conflict",
      "Your data never expires — it's yours",
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "hsl(220 20% 5% / 0.75)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
      >
        {/* Top color strip */}
        <div className="h-1.5 transition-all duration-500" style={{ background: current.color }} />

        <div className="p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                style={{ background: `${current.color}18`, border: `1px solid ${current.color}30` }}
              >
                {current.emoji}
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: current.color }}>
                  {slide + 1} of {SLIDES.length}
                </p>
                <h2 className="text-xl font-extrabold" style={{ color: "hsl(var(--foreground))" }}>
                  {current.title(firstName)}
                </h2>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <X size={16} style={{ color: "hsl(var(--muted-foreground))" }} />
            </button>
          </div>

          {/* Subtitle */}
          <p className="text-sm font-semibold mb-3" style={{ color: current.color }}>
            {current.subtitle}
          </p>

          {/* Body */}
          <p className="text-sm leading-relaxed mb-6" style={{ color: "hsl(var(--muted-foreground))" }}>
            {current.body}
          </p>

          {/* Tips */}
          <div className="space-y-2.5 mb-8">
            {current.tips.map((tip) => (
              <div key={tip} className="flex items-start gap-2.5">
                <Lightbulb size={13} className="flex-shrink-0 mt-0.5" style={{ color: current.color }} />
                <p className="text-xs leading-relaxed" style={{ color: "hsl(var(--foreground))" }}>{tip}</p>
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
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))" }}
                >
                  Back
                </button>
              )}
              <button
                onClick={isLast ? onClose : () => setSlide(slide + 1)}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-bold transition-all"
                style={{ background: current.color, color: "white" }}
              >
                {isLast ? (
                  <><Rocket size={13} /> Let's Discover</>
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
