import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { ShowcaseGallery } from "@/components/ShowcaseGallery";
import { PlatformNav } from "@/components/PlatformNav";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  Upload, Briefcase, Building2, ArrowRight,
  ShieldCheck, BookOpen, Camera, Target,
  Search, Radar, Sparkles, Crosshair, Swords, Presentation,
  ChevronRight,
} from "lucide-react";

const ROTATING_WORDS = [
  { word: "product", color: "hsl(var(--mode-product))" },
  { word: "service", color: "hsl(var(--mode-service))" },
  { word: "business", color: "hsl(var(--mode-business))" },
];

const PIPELINE_STEPS = [
  {
    icon: Search, label: "Analyze", step: 1,
    desc: {
      product: "Select a product and run a deep competitive teardown",
      service: "Define your service and map the competitive landscape",
      business: "Specify your business model for a structural audit",
    },
  },
  {
    icon: Radar, label: "Deconstruct", step: 2,
    desc: {
      product: "Map pricing, supply chains, and comparative positioning",
      service: "Analyze delivery workflows, pricing tiers, and friction points",
      business: "Audit revenue streams, cost structures, and value chains",
    },
  },
  {
    icon: Sparkles, label: "Flip", step: 3,
    desc: {
      product: "Challenge every assumption and generate radical alternatives",
      service: "Invert delivery models and reimagine the customer journey",
      business: "Question the value engine and explore adjacent opportunities",
    },
  },
  {
    icon: Crosshair, label: "Redesign", step: 4,
    desc: {
      product: "Interactive redesigned concept with detailed illustrations",
      service: "Redesigned service blueprint with implementation roadmap",
      business: "Restructured model with new revenue and growth levers",
    },
  },
  {
    icon: Swords, label: "Stress Test", step: 5,
    desc: {
      product: "Red vs Green team adversarial validation & critical debate",
      service: "Adversarial review of scalability, churn risk, and operations",
      business: "Stress-test unit economics, moat durability, and market fit",
    },
  },
  {
    icon: Presentation, label: "Pitch Deck", step: 6,
    desc: {
      product: "Investor-ready presentation with data-backed slides",
      service: "Scalability-focused pitch with implementation partnerships",
      business: "Capital-ready deck with financial projections and strategy",
    },
  },
];

const MODES = [
  { id: "product", label: "Product", icon: Upload, cssVar: "--mode-product", path: "/start/product" },
  { id: "service", label: "Service", icon: Briefcase, cssVar: "--mode-service", path: "/start/service" },
  { id: "business", label: "Business Model", icon: Building2, cssVar: "--mode-business", path: "/start/business" },
];

export default function StartPage() {
  const navigate = useNavigate();
  const { tier } = useSubscription();
  const { profile } = useAuth();
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((i) => (i + 1) % ROTATING_WORDS.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <PlatformNav tier={tier} />

      {/* Hero */}
      <section className="pt-16 sm:pt-24 pb-10 sm:pb-14 px-4">
        <div className="max-w-5xl mx-auto text-left">
          <h1 className="text-7xl sm:text-8xl md:text-9xl font-extrabold tracking-tight text-foreground leading-[1.05]">
            Rethink any
          </h1>
          <motion.span
            key={wordIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="block text-7xl sm:text-8xl md:text-9xl font-extrabold tracking-tight leading-[1.05] mt-1"
            style={{ color: ROTATING_WORDS[wordIndex].color }}
          >
            {ROTATING_WORDS[wordIndex].word}
          </motion.span>
          <p className="text-base sm:text-lg text-muted-foreground mt-4 max-w-xl">
            Deconstruct markets, stress-test strategies, and build what's next.
          </p>
          <button
            onClick={() => navigate("/methodology")}
            className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Learn More
          </button>
        </div>
      </section>

      {/* Showcase Gallery */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <ShowcaseGallery />
      </section>

      {/* How It Works Pipeline */}
      <section className="border-t border-border overflow-hidden" style={{ background: "hsl(var(--muted) / 0.3)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.2em] mb-2 flex items-center justify-center gap-1.5 transition-colors duration-500" style={{ color: ROTATING_WORDS[wordIndex].color }}>
              <Sparkles size={12} /> How It Works
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              From raw data to investor-ready output
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Six stages of structured analysis, each building on the last
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5 sm:gap-6 relative">
            {PIPELINE_STEPS.map((item, i) => {
              const Icon = item.icon;
              const activeColor = ROTATING_WORDS[wordIndex].color;
              const modeKey = ROTATING_WORDS[wordIndex].word as "product" | "service" | "business";
              return (
                <div key={item.step} className="relative">
                  {i > 0 && (
                    <div className="hidden lg:flex absolute -left-3 top-7 z-10 items-center justify-center">
                      <ChevronRight
                        size={14}
                        className="transition-colors duration-500 opacity-40"
                        style={{ color: activeColor }}
                      />
                    </div>
                  )}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                    className="text-center group"
                  >
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 transition-colors duration-500"
                      style={{ background: `color-mix(in srgb, ${activeColor} 12%, transparent)` }}
                    >
                      <Icon size={22} className="transition-colors duration-500" style={{ color: activeColor }} />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                      Step {item.step}
                    </p>
                    <p className="text-sm font-bold text-foreground mb-1">{item.label}</p>
                    <motion.p
                      key={modeKey}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="text-xs text-muted-foreground leading-relaxed"
                    >
                      {item.desc[modeKey]}
                    </motion.p>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="rounded-2xl bg-card border border-border p-8 sm:p-10 text-center shadow-sm">
          <p className="text-lg sm:text-xl font-extrabold text-foreground mb-2">
            Apply a level of scrutiny that exceeds normal bandwidth.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            See what a deep deconstruction reveals about your market.
          </p>
          <button
            onClick={() => navigate("/analysis/new")}
            className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Start Analysis <ArrowRight size={14} />
          </button>
        </div>
      </section>

      {/* What to expect */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-4">
        <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 flex items-start gap-4">
          <Target size={20} className="flex-shrink-0 mt-0.5 text-primary" />
          <div>
            <p className="text-sm font-bold text-foreground mb-1">What to expect</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The goal isn't to promise a "better" answer every time. The goal is to apply a level of data-driven scrutiny and critical analysis that exceeds normal human bandwidth — revealing hidden leverage points, unlocking overlooked market segments, or optimizing specific components in ways that can materially change outcomes.
            </p>
          </div>
        </div>
      </section>

      {/* Photo Analysis */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-6">
        <div
          onClick={() => navigate("/instant-analysis")}
          className="rounded-2xl border border-border bg-card p-5 sm:p-6 flex items-center gap-4 cursor-pointer transition-all hover:shadow-md group"
        >
          <Camera size={22} className="text-primary flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground mb-0.5">Instant Photo Analysis</p>
            <p className="text-xs text-muted-foreground">
              Snap a photo of any product and get an AI-powered competitive teardown in seconds.
            </p>
          </div>
          <button className="flex-shrink-0 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors">
            Try It <ArrowRight size={12} className="inline ml-1" />
          </button>
        </div>
      </section>

      {/* Quick Launch Buttons */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-10 flex flex-wrap items-center justify-center gap-3">
        {MODES.map((mode) => {
          const Icon = mode.icon;
          return (
            <button
              key={mode.id}
              onClick={() => navigate(mode.path)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border bg-card text-sm font-semibold text-foreground hover:shadow-md transition-all"
              style={{ borderColor: `hsl(var(${mode.cssVar}) / 0.3)` }}
            >
              <Icon size={14} style={{ color: `hsl(var(${mode.cssVar}))` }} />
              {mode.label} <ArrowRight size={12} className="text-muted-foreground" />
            </button>
          );
        })}
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-center">
            <span className="flex items-center gap-1"><ShieldCheck size={11} /> Your data is encrypted & never shared</span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:flex items-center gap-1"><BookOpen size={11} /> Analyses scoped to your account via RLS</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/pricing" className="font-semibold text-primary hover:underline py-1">Enterprise & Teams</a>
          </div>
        </div>
        <div className="border-t border-border py-5 text-center px-4">
          <p className="text-xs">
            <a href="https://sgpcapital.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:opacity-80 transition-opacity">
              Built by SGP Capital
            </a>
            {profile && <span className="text-muted-foreground"> · Signed in as <strong className="text-foreground">{profile.first_name}</strong></span>}
          </p>
        </div>
      </footer>
    </div>
  );
}
