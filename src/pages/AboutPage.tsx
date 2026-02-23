import { PlatformNav } from "@/components/PlatformNav";
import { useSubscription } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";
import { Rocket, Users, TrendingUp, FileText, ArrowRight } from "lucide-react";

export default function AboutPage() {
  const { tier } = useSubscription();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--background))" }}>
      <PlatformNav tier={tier} />

      <main className="max-w-3xl mx-auto px-6 py-16">
        {/* Hero */}
        <section className="mb-16">
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3">About</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight mb-4">
            Strategic Reinvention
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
            Market Disruptor OS is an AI-powered intelligence platform that deconstructs markets, stress-tests strategies, and generates actionable disruption playbooks. We believe every market has hidden leverage points — you just need the right tools to find them.
          </p>
        </section>

        {/* How It Works */}
        <section className="mb-16">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-6">How It Works</p>
          <div className="space-y-6">
            {[
              { step: 1, title: "Input", desc: "Upload a product, describe a service, or define a business model. Add images, URLs, and context notes." },
              { step: 2, title: "Deconstruction", desc: "Our AI scrapes real market data from eBay, Etsy, Reddit, TikTok, and Google — then analyzes supply, demand, and positioning across three layers." },
              { step: 3, title: "Validation", desc: "Every claim is tagged as Verified, Modeled, or Assumption. An adversarial Red Team attacks your strategy before competitors do." },
              { step: 4, title: "Output", desc: "Full intelligence reports, disruption playbooks, stress tests, and investor-ready pitch decks — all exportable as PDF." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex items-start gap-4">
                <div className="step-badge flex-shrink-0 mt-0.5">{step}</div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Who It's For */}
        <section className="mb-16">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-6">Built For</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: Rocket, title: "Entrepreneurs", desc: "Scouting new markets & niches with data-driven conviction." },
              { icon: TrendingUp, title: "Investors", desc: "Evaluating opportunities with adversarial rigor before committing capital." },
              { icon: Users, title: "Product Teams", desc: "Validating strategy and positioning before launch." },
              { icon: FileText, title: "Agencies", desc: "Building data-driven client pitches backed by real market intelligence." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded border border-border p-4" style={{ background: "hsl(var(--card))" }}>
                <Icon size={16} className="text-primary mb-2" />
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground leading-relaxed mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded border border-border p-6 text-center" style={{ background: "hsl(var(--card))" }}>
          <p className="text-sm font-semibold text-foreground mb-2">Ready to deconstruct your market?</p>
          <p className="text-xs text-muted-foreground mb-4">Start your first analysis in under 60 seconds.</p>
          <button
            onClick={() => navigate("/")}
            className="btn-primary inline-flex items-center gap-2"
          >
            Get Started <ArrowRight size={14} />
          </button>
        </section>

        {/* Footer */}
        <footer className="mt-16 pt-6 border-t border-border text-center">
          <p className="text-xs">
            <a href="https://sgpcapital.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:opacity-80 transition-opacity">
              Built by SGP Capital
            </a>
            <span className="text-muted-foreground"> · </span>
            <a href="mailto:steven@sgpcapital.com" className="text-muted-foreground hover:underline">steven@sgpcapital.com</a>
          </p>
        </footer>
      </main>
    </div>
  );
}
