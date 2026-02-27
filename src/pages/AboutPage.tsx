import { PlatformNav } from "@/components/PlatformNav";
import { ShowcaseGallery } from "@/components/ShowcaseGallery";
import { useSubscription } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";
import {
  Rocket, Users, TrendingUp, FileText, ArrowRight,
  Search, Zap, ShieldAlert, Presentation,
} from "lucide-react";

const WHAT_IT_DOES = [
  {
    icon: Search,
    title: "Challenges Assumptions",
    desc: "Deliberately questions pricing logic, supply chain design, patent positioning, and the operational constraints incumbents accept as inevitable.",
  },
  {
    icon: Zap,
    title: "Isolates Structural Weaknesses",
    desc: "Identifies friction points and tests alternative configurations most teams would never consider.",
  },
  {
    icon: ShieldAlert,
    title: "Stress-Tests Every Angle",
    desc: "Adversarial Red Team / Green Team analysis applies data-driven scrutiny to surface overlooked leverage points and market segments.",
  },
  {
    icon: Presentation,
    title: "Delivers Actionable Output",
    desc: "Investor-ready pitch decks, strategic teardowns, and clearly mapped pathways for experimentation or disruption.",
  },
];

const BUILT_FOR = [
  { icon: Rocket, title: "Entrepreneurs", desc: "Seeing opportunities others overlook with data-driven conviction, not guesswork." },
  { icon: TrendingUp, title: "Investors", desc: "Applying adversarial rigor to evaluate opportunities before committing capital." },
  { icon: Users, title: "Product Teams", desc: "Stress-testing strategy, positioning, and assumptions before launch." },
  { icon: FileText, title: "Agencies", desc: "Delivering data-backed strategic perspectives that go beyond surface-level analysis." },
];

export default function AboutPage() {
  const { tier } = useSubscription();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <PlatformNav tier={tier} />

      <main className="max-w-5xl mx-auto px-6 sm:px-10 py-20">
        {/* Hero */}
        <section className="mb-20">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">About</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight mb-5">
            Rethink The Possible
          </h1>
          <div className="space-y-4 text-base text-muted-foreground leading-relaxed max-w-3xl">
            <p>
              <em className="text-foreground font-medium not-italic">Market Disruptor</em> is a proprietary deep analytics platform built for entrepreneurs, investors, and product teams who want to see opportunities others overlook.
            </p>
            <p>
              It combines advanced analytical models, real-time data analysis, computer vision, and structured strategic modeling to deconstruct any product, service, or business model — and reconstruct it from entirely new angles.
            </p>
            <p>
              It doesn't assume the current model is right. It deliberately flips it on its head — questioning pricing logic, supply chain design, patent positioning, competitive assumptions, and the friction incumbents accept as inevitable.
            </p>
            <p>
              The goal isn't to promise a "better" answer every time. Instead, it's to apply a level of data-driven scrutiny and critical analysis that exceeds normal human bandwidth — revealing hidden leverage points, unlocking overlooked market segments, or optimizing specific components in ways that can materially change outcomes.
            </p>
          </div>
        </section>

        {/* What It Does — card grid */}
        <section className="mb-20">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">What It Does</p>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mb-8">
            Four layers of strategic intelligence
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {WHAT_IT_DOES.map(({ icon: Icon, title, desc }, i) => (
              <div
                key={title}
                className="group relative rounded-xl border border-border p-6 bg-card shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ background: "hsl(var(--primary) / 0.1)" }}
                  >
                    <Icon size={20} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground mb-1">
                      <span className="text-primary mr-1.5">{String(i + 1).padStart(2, "0")}</span>
                      {title}
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Showcase Gallery */}
        <ShowcaseGallery />

        {/* Built For */}
        <section className="mb-20">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Built For</p>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mb-8">
            Decision-makers who need depth, not dashboards
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {BUILT_FOR.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-xl border border-border p-5 bg-card shadow-sm transition-shadow hover:shadow-md">
                <Icon size={18} className="text-primary mb-3" />
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-xl border border-border p-8 sm:p-10 text-center bg-card shadow-sm">
          <p className="text-lg font-bold text-foreground mb-2">Apply a level of scrutiny that exceeds normal bandwidth.</p>
          <p className="text-sm text-muted-foreground mb-6">See what a deep deconstruction reveals about your market.</p>
          <button onClick={() => navigate("/")} className="btn-primary inline-flex items-center gap-2">
            Start Analysis <ArrowRight size={14} />
          </button>
        </section>

        <footer className="mt-20 pt-6 border-t border-border text-center">
          <p className="text-xs">
            <a href="https://sgpcapital.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:opacity-80 transition-opacity">
              Built by SGP Capital
            </a>
            <span className="text-muted-foreground"> · </span>
          </p>
        </footer>
      </main>
    </div>
  );
}
