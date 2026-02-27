import { PlatformNav } from "@/components/PlatformNav";
import { ShowcaseGallery } from "@/components/ShowcaseGallery";
import { useSubscription } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";
import {
  Rocket, Users, TrendingUp, FileText, ArrowRight,
  Search, Zap, ShieldAlert, Presentation, Layers,
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
  { icon: Rocket, title: "Founders & Entrepreneurs", outcome: "Validate before you build", desc: "Replace gut-feel with data-driven conviction across market, pricing, and positioning." },
  { icon: TrendingUp, title: "Investors & Analysts", outcome: "Diligence in minutes", desc: "Adversarial stress-testing and market intelligence that surfaces hidden risks." },
  { icon: Users, title: "Product & Strategy Teams", outcome: "Ship with confidence", desc: "Deconstruct competitors, map supply chains, and pressure-test go-to-market plans." },
  { icon: FileText, title: "Consultants & Agencies", outcome: "Elevate client work", desc: "Generate investor-grade analysis and pitch decks backed by real market data." },
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

        {/* First Principles */}
        <section className="mb-20">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">The Foundation</p>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mb-6">
            Built on First Principles Thinking
          </h2>

          <div
            className="rounded-xl overflow-hidden"
            style={{ border: "1.5px solid hsl(var(--primary) / 0.2)", background: "hsl(var(--primary) / 0.03)" }}
          >
            <div className="p-6 sm:p-8 space-y-5">
              <div className="flex items-start gap-4">
                <div
                  className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: "hsl(var(--primary) / 0.1)" }}
                >
                  <Layers size={24} className="text-primary" />
                </div>
                <div>
                  <p className="text-base font-bold text-foreground mb-2">What are First Principles?</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    First principles thinking is the practice of breaking something down to its most fundamental truths — the
                    irreducible facts that remain when you strip away every assumption, convention, and "that's just how it's done."
                    Instead of reasoning by analogy (copying what already exists), you rebuild understanding from the ground up.
                  </p>
                </div>
              </div>

              <div className="h-px" style={{ background: "hsl(var(--primary) / 0.1)" }} />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  {
                    num: "01",
                    title: "Decompose",
                    desc: "Break the product, service, or model into its raw components — materials, costs, workflows, incentives, constraints.",
                  },
                  {
                    num: "02",
                    title: "Question Everything",
                    desc: "Challenge why each component exists in its current form. Is the pricing model inherited? Is the supply chain designed or defaulted?",
                  },
                  {
                    num: "03",
                    title: "Reconstruct",
                    desc: "Rebuild from the ground up using only what's proven true — revealing configurations, pricing, and strategies the market hasn't considered.",
                  },
                ].map((item) => (
                  <div key={item.num} className="rounded-lg p-4 bg-card border border-border">
                    <p className="text-primary text-xs font-bold mb-1">{item.num}</p>
                    <p className="text-sm font-bold text-foreground mb-1">{item.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>

              <div className="h-px" style={{ background: "hsl(var(--primary) / 0.1)" }} />

              <div>
                <p className="text-base font-bold text-foreground mb-2">Why it's at the core of everything we do</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Most market analysis starts with what competitors are doing and works backward. That approach
                  inherits their blind spots. Market Disruptor starts from the opposite direction — deconstructing
                  a market down to its structural foundations, then stress-testing whether the current way of doing
                  things is actually the <em>best</em> way. Every step of the pipeline — from the Intelligence Report
                  to the adversarial Stress Test to the Pitch Deck — is designed to surface the assumptions nobody
                  questioned and the opportunities nobody mapped. That's the difference between incremental improvement
                  and genuine disruption.
                </p>
              </div>
            </div>
          </div>
        </section>
        {/* Showcase Gallery */}
        <ShowcaseGallery />

        {/* Built For */}
        <section className="mb-20">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 text-center">Who it's for</p>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mb-8 text-center">
            Decision-makers who need depth, not dashboards
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {BUILT_FOR.map(({ icon: Icon, title, outcome, desc }) => (
              <div key={title} className="rounded-xl border border-border bg-card p-4 flex flex-col transition-shadow hover:shadow-md">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "hsl(var(--primary) / 0.1)" }}>
                    <Icon size={15} className="text-primary" />
                  </div>
                  <p className="text-sm font-bold text-foreground leading-tight">{title}</p>
                </div>
                <p className="text-xs font-semibold text-primary mb-1">{outcome}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
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
