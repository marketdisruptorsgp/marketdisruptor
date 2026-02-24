import { PlatformNav } from "@/components/PlatformNav";
import { useSubscription } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";
import { Rocket, Users, TrendingUp, FileText, ArrowRight } from "lucide-react";

export default function AboutPage() {
  const { tier } = useSubscription();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <PlatformNav tier={tier} />

      <main className="max-w-5xl mx-auto px-6 sm:px-10 py-20">
        <section className="mb-20">
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">About</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight mb-5">
            Rethink The Possible
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed max-w-xl mb-4">
            <em>Market Disruptor</em> is a proprietary deep analytics platform built for entrepreneurs, investors, and product teams who want to see opportunities others overlook. Not a surface-level tool or a simple AI wrapper.
          </p>
          <p className="text-base text-muted-foreground leading-relaxed max-w-xl mb-4">
            It combines advanced multi-model AI, real-time data analysis, computer vision, and structured strategic modeling to deconstruct any product, service, or business model and reconstruct it from entirely new angles.
          </p>
          <p className="text-base text-muted-foreground leading-relaxed max-w-xl mb-4">
            It doesn't assume the current model is right. It deliberately flips it on its head. It questions pricing logic, supply chain design, patent positioning, competitive assumptions, operational constraints, and the friction incumbents accept as inevitable. It examines what is taken for granted, isolates structural weaknesses, and tests alternative configurations that most teams would never consider.
          </p>
          <p className="text-base text-muted-foreground leading-relaxed max-w-xl">
            The goal isn't to promise a "better" answer every time. The goal is to apply a level of data-driven scrutiny and critical analysis that exceeds normal human bandwidth, revealing hidden leverage points, unlocking overlooked market segments, or optimizing specific components in ways that can materially change outcomes.
          </p>
        </section>

        <section className="mb-20">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-8">What It Does</p>
          <div className="space-y-8">
            {[
              { step: 1, title: "Challenges Assumptions", desc: "Deliberately questions pricing logic, supply chain design, patent positioning, competitive assumptions, and the operational constraints incumbents accept as inevitable." },
              { step: 2, title: "Isolates Structural Weaknesses", desc: "Examines what is taken for granted, identifies friction points, and tests alternative configurations most teams would never consider." },
              { step: 3, title: "Reveals Hidden Leverage", desc: "Applies data-driven scrutiny exceeding normal human bandwidth to surface overlooked market segments and optimization opportunities that can materially change outcomes." },
              { step: 4, title: "Delivers Actionable Output", desc: "Rigorously constructed strategic perspectives, investor-ready pitch decks, and clearly mapped pathways for experimentation, disruption, or targeted optimization." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex items-start gap-4">
                <div className="step-badge flex-shrink-0 mt-0.5">{step}</div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed mt-1">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-20">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-8">Built For</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: Rocket, title: "Entrepreneurs", desc: "Seeing opportunities others overlook with data-driven conviction, not guesswork." },
              { icon: TrendingUp, title: "Investors", desc: "Applying adversarial rigor to evaluate opportunities before committing capital." },
              { icon: Users, title: "Product Teams", desc: "Stress-testing strategy, positioning, and assumptions before launch." },
              { icon: FileText, title: "Agencies", desc: "Delivering data-backed strategic perspectives that go beyond surface-level analysis." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-lg border border-border p-5 bg-card shadow-sm">
                <Icon size={18} className="text-primary mb-3" />
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-border p-8 text-center bg-card shadow-sm">
          <p className="text-base font-semibold text-foreground mb-2">Apply a level of scrutiny that exceeds normal bandwidth.</p>
          <p className="text-sm text-muted-foreground mb-5">See what a deep deconstruction reveals about your market.</p>
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
