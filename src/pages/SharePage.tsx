import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Zap, Brain, TrendingUp, Sparkles, Eye, BarChart3, ArrowRight, CheckCircle2, Gift } from "lucide-react";

const FEATURES = [
  {
    icon: Brain,
    title: "AI Product Intelligence",
    desc: "Deep-dive any product with live market data from a variety of sources — powered by AI.",
  },
  {
    icon: TrendingUp,
    title: "Revival Score Engine",
    desc: "Quantify untapped demand with a proprietary scoring model. Know exactly which products are ready for a comeback.",
  },
  {
    icon: Sparkles,
    title: "Flip Ideas Generator",
    desc: "AI-generated product concepts with feasibility scores, cost estimates, and go-to-market strategies ready to execute.",
  },
  {
    icon: Eye,
    title: "First Principles Analysis",
    desc: "Challenge every assumption. Deconstruct products to their core and rebuild them for today's market.",
  },
  {
    icon: BarChart3,
    title: "Supply Chain Intel",
    desc: "Suppliers, manufacturers, pricing margins, and vendor directories — everything you need to move from idea to inventory.",
  },
];

const PROOF_POINTS = [
  "Analyzes 6+ data sources per product in real-time",
  "Generates actionable flip ideas with revenue projections",
  "Maps full supply chains from manufacturer to customer",
  "Investor-ready pitch decks generated in seconds",
  "Patent landscape analysis for competitive moats",
];

export default function SharePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const ref = params.get("ref");

  useEffect(() => {
    if (ref) {
      localStorage.setItem("referral_code", ref);
    }
  }, [ref]);

  return (
    <div className="min-h-screen" style={{ background: "hsl(220 25% 6%)" }}>
      {/* Hero */}
      <div className="relative overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-[-200px] left-[-100px] w-[500px] h-[500px] rounded-full opacity-20" style={{ background: "radial-gradient(circle, hsl(217 91% 50%) 0%, transparent 70%)" }} />
        <div className="absolute bottom-[-150px] right-[-80px] w-[400px] h-[400px] rounded-full opacity-15" style={{ background: "radial-gradient(circle, hsl(210 100% 70%) 0%, transparent 70%)" }} />

        <div className="relative z-10 max-w-5xl mx-auto px-6 pt-12 pb-16">
          {/* Nav */}
          <div className="flex items-center justify-between mb-16">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "hsl(var(--primary))" }}>
                <Zap size={18} className="text-white" />
              </div>
              <span className="text-white font-bold text-lg tracking-tight">Market Disruptor</span>
            </div>
            {ref && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: "hsl(142 71% 45% / 0.15)", border: "1px solid hsl(142 71% 45% / 0.3)" }}>
                <Gift size={13} style={{ color: "hsl(142 71% 45%)" }} />
                <span className="text-xs font-bold" style={{ color: "hsl(142 71% 45%)" }}>+5 Bonus Analyses</span>
              </div>
            )}
          </div>

          {/* Headline */}
          <div className="max-w-3xl space-y-6 mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "hsl(var(--primary) / 0.12)", border: "1px solid hsl(var(--primary) / 0.25)" }}>
              <Sparkles size={12} style={{ color: "hsl(var(--primary-light))" }} />
              <span className="text-xs font-bold" style={{ color: "hsl(var(--primary-light))" }}>AI-Powered Product Intelligence</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] tracking-tight">
              Analyze. Deconstruct.{" "}
              <span className="relative">
                <span style={{ color: "hsl(var(--primary-light))" }}>Capitalize.</span>
                <span className="absolute -bottom-1 left-0 w-full h-1 rounded-full" style={{ background: "linear-gradient(90deg, hsl(217 91% 50%), hsl(210 100% 70%))" }} />
              </span>
            </h1>

            <p className="text-lg sm:text-xl leading-relaxed" style={{ color: "hsl(0 0% 100% / 0.65)" }}>
              Market Disruptor is a first-of-its-kind AI platform that scrapes live market data, deconstructs any product to its first principles, and generates actionable business opportunities — complete with supply chains, pricing intel, and investor-ready pitch decks.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => navigate("/")}
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-base transition-all hover:translate-y-[-2px]"
                style={{
                  background: "hsl(var(--primary))",
                  color: "white",
                  boxShadow: "0 4px 24px -4px hsl(217 91% 50% / 0.5)",
                }}
              >
                Start Analyzing Free <ArrowRight size={18} />
              </button>
              {ref && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{ background: "hsl(142 71% 45% / 0.08)", border: "1px solid hsl(142 71% 45% / 0.2)" }}>
                  <Gift size={16} style={{ color: "hsl(142 71% 45%)" }} />
                  <span className="text-sm font-semibold" style={{ color: "hsl(142 71% 45%)" }}>You've been invited — 5 extra analyses on us!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "hsl(var(--primary-light))" }}>Revolutionary Data Model</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            From raw market data to <span style={{ color: "hsl(var(--primary-light))" }}>actionable intelligence</span>
          </h2>
          <p className="text-base max-w-2xl mx-auto" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
            Most tools give you spreadsheets. We give you a complete business intelligence report powered by real-time web scraping and advanced AI reasoning.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-16">
          {FEATURES.map(({ icon: Icon, title, desc }, i) => (
            <div
              key={title}
              className="rounded-2xl p-6 space-y-4 transition-all hover:translate-y-[-2px]"
              style={{
                background: "hsl(220 25% 9%)",
                border: "1px solid hsl(220 20% 15%)",
              }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "hsl(var(--primary) / 0.15)", border: "1px solid hsl(var(--primary) / 0.25)" }}>
                <Icon size={18} style={{ color: "hsl(var(--primary-light))" }} />
              </div>
              <h3 className="text-white font-bold text-lg">{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "hsl(0 0% 100% / 0.5)" }}>{desc}</p>
            </div>
          ))}
        </div>

        {/* Proof points */}
        <div className="rounded-2xl p-8 sm:p-10" style={{ background: "linear-gradient(135deg, hsl(217 91% 50% / 0.08) 0%, hsl(220 25% 9%) 100%)", border: "1px solid hsl(var(--primary) / 0.15)" }}>
          <h3 className="text-2xl font-extrabold text-white mb-6">What makes this different</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {PROOF_POINTS.map((point) => (
              <div key={point} className="flex items-start gap-3">
                <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" style={{ color: "hsl(142 71% 45%)" }} />
                <p className="text-sm font-medium" style={{ color: "hsl(0 0% 100% / 0.75)" }}>{point}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="max-w-5xl mx-auto px-6 pb-20">
        <div className="text-center space-y-6 rounded-2xl py-12 px-6" style={{ background: "linear-gradient(180deg, hsl(217 91% 50% / 0.1) 0%, transparent 100%)", border: "1px solid hsl(var(--primary) / 0.15)" }}>
          <h2 className="text-3xl font-extrabold text-white">Ready to find your next big opportunity?</h2>
          <p className="text-base max-w-lg mx-auto" style={{ color: "hsl(0 0% 100% / 0.5)" }}>
            Start with 10 free analyses. No credit card required.
          </p>
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base transition-all hover:translate-y-[-2px]"
            style={{
              background: "hsl(var(--primary))",
              color: "white",
              boxShadow: "0 4px 24px -4px hsl(217 91% 50% / 0.5)",
            }}
          >
            Get Started Free <ArrowRight size={18} />
          </button>
        </div>
        <p className="text-center text-xs mt-8" style={{ color: "hsl(0 0% 100% / 0.3)" }}>
          Developed by SGP Capital · Privacy by design · TLS encrypted
        </p>
      </div>
    </div>
  );
}
