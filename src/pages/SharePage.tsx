import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Brain,
  TrendingUp,
  Sparkles,
  Eye,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  Gift,
} from "lucide-react";
import { PlatformNav } from "@/components/PlatformNav";
import { useSubscription } from "@/hooks/useSubscription";

const FEATURES = [
  {
    icon: Brain,
    title: "Product Intelligence",
    desc: "Deep-dive any product with live market data from a variety of sources.",
  },
  {
    icon: TrendingUp,
    title: "Revival Score Engine",
    desc: "Quantify untapped demand with a proprietary scoring model.",
  },
  {
    icon: Sparkles,
    title: "Flip Ideas Generator",
    desc: "Data-driven concepts with feasibility scores and go-to-market paths.",
  },
  {
    icon: Eye,
    title: "First Principles Analysis",
    desc: "Challenge assumptions and rebuild products for current market realities.",
  },
  {
    icon: BarChart3,
    title: "Supply Chain Intel",
    desc: "Suppliers, pricing margins, and vendor mapping from idea to inventory.",
  },
];

const PROOF_POINTS = [
  "Analyzes multiple market sources per product",
  "Generates actionable flip ideas with revenue projections",
  "Maps supply chains from manufacturer to customer",
  "Builds investor-ready pitch decks in seconds",
  "Surfaces patent landscape and moat opportunities",
];

export default function SharePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { tier } = useSubscription();
  const ref = params.get("ref");

  useEffect(() => {
    if (ref) {
      localStorage.setItem("referral_code", ref);
    }
  }, [ref]);

  return (
    <div className="min-h-screen bg-background">
      <PlatformNav tier={tier} />

      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          {ref && (
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-5"
              style={{
                background: "hsl(var(--success) / 0.12)",
                border: "1px solid hsl(var(--success) / 0.25)",
                color: "hsl(var(--success))",
              }}
            >
              <Gift size={13} />
              <span className="typo-card-meta font-bold text-[13px]">Invited: +5 bonus analyses</span>
            </div>
          )}

          <div className="max-w-3xl space-y-4 sm:space-y-5">
            <p className="typo-card-eyebrow">Deep Product Intelligence</p>
            <h1 className="typo-page-title text-4xl sm:text-5xl lg:text-6xl leading-[1.08]">
              Analyze. Deconstruct. <span className="text-primary">Capitalize.</span>
            </h1>
            <p className="typo-page-meta text-base sm:text-lg leading-relaxed">
              Market Disruptor transforms live market signals into actionable business intelligence — complete with
              opportunity mapping, supply chain visibility, and investor-ready outputs.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <button
                onClick={() => navigate("/")}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl typo-nav-primary bg-primary text-primary-foreground transition-colors hover:bg-primary-dark"
              >
                Start Analyzing Free <ArrowRight size={18} />
              </button>
              {ref && (
                <div
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-xl"
                  style={{
                    background: "hsl(var(--success) / 0.08)",
                    border: "1px solid hsl(var(--success) / 0.2)",
                    color: "hsl(var(--success))",
                  }}
                >
                  <Gift size={16} />
                  <span className="typo-card-body font-semibold">You were invited — 5 extra analyses unlocked.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="text-center mb-10 sm:mb-12">
          <p className="typo-card-eyebrow mb-2">How it works</p>
          <h2 className="typo-page-title text-3xl sm:text-4xl mb-3">
            From raw market data to <span className="text-primary">actionable intelligence</span>
          </h2>
          <p className="typo-page-meta max-w-2xl mx-auto">
            Built for operators and investors who need decisive signal, not dashboard noise.
          </p>
        </div>

        <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-12 sm:mb-14">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <article key={title} className="rounded-2xl border border-border bg-card p-6 space-y-3 shadow-sm">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10 border border-primary/20">
                <Icon size={18} className="text-primary" />
              </div>
              <h3 className="typo-section-title text-lg">{title}</h3>
              <p className="typo-card-body text-muted-foreground">{desc}</p>
            </article>
          ))}
        </section>

        <section className="rounded-2xl border border-border bg-muted/40 p-7 sm:p-9">
          <h3 className="typo-section-title text-2xl mb-5">What makes this different</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {PROOF_POINTS.map((point) => (
              <div key={point} className="flex items-start gap-3">
                <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0 text-primary" />
                <p className="typo-card-body font-medium">{point}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-16 sm:pb-20">
        <div className="rounded-2xl border border-border bg-card py-10 px-6 text-center space-y-4">
          <h2 className="typo-page-title text-3xl">Ready to find your next big opportunity?</h2>
          <p className="typo-page-meta text-base">Start with 10 free analyses. No credit card required.</p>
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl typo-nav-primary bg-primary text-primary-foreground transition-colors hover:bg-primary-dark"
          >
            Get Started Free <ArrowRight size={18} />
          </button>
        </div>
        <p className="typo-card-meta text-center mt-6">Developed by SGP Capital · Privacy by design · TLS encrypted</p>
      </section>
    </div>
  );
}

