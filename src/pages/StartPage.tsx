import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { ShowcaseGallery } from "@/components/ShowcaseGallery";
import { PlatformNav } from "@/components/PlatformNav";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { AppFooter } from "@/components/AppFooter";
import {
  Upload, Briefcase, Building2, ArrowRight,
  ShieldCheck, BookOpen, Camera, Target,
  Search, Radar, Sparkles, Crosshair, Swords, Presentation,
} from "lucide-react";

const ROTATING_WORDS = [
  { word: "product", color: "hsl(var(--mode-product))" },
  { word: "service", color: "hsl(var(--mode-service))" },
  { word: "business", color: "hsl(var(--mode-business))" },
];

const PIPELINE_STEPS = [
  {
    icon: Search, label: "Analyze", step: 1,
    desc: "Define your target and run a deep competitive teardown",
    color: "#2563eb",
  },
  {
    icon: Radar, label: "Deconstruct", step: 2,
    desc: "Map pricing, supply chains, workflows, and positioning",
    color: "#7c3aed",
  },
  {
    icon: Sparkles, label: "Flip", step: 3,
    desc: "Challenge every assumption and generate radical alternatives",
    color: "#db2777",
  },
  {
    icon: Crosshair, label: "Redesign", step: 4,
    desc: "Interactive redesigned concept with detailed illustrations",
    color: "#059669",
  },
  {
    icon: Swords, label: "Stress Test", step: 5,
    desc: "Red vs Green team adversarial validation and critical debate",
    color: "#dc2626",
  },
  {
    icon: Presentation, label: "Pitch Deck", step: 6,
    desc: "Investor-ready presentation with data-backed slides",
    color: "#d97706",
  },
];

const MODES = [
  { id: "product", label: "Product", icon: Upload, cssVar: "--mode-product", path: "/analysis/new" },
  { id: "service", label: "Service", icon: Briefcase, cssVar: "--mode-service", path: "/analysis/new" },
  { id: "business", label: "Business Model", icon: Building2, cssVar: "--mode-business", path: "/analysis/new" },
];

export default function StartPage() {
  const navigate = useNavigate();
  const { tier } = useSubscription();
  const { profile } = useAuth();
  const [wordIndex, setWordIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      setWordIndex((i) => (i + 1) % ROTATING_WORDS.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [paused]);

  return (
    <div className="min-h-screen bg-background">
      <PlatformNav tier={tier} />

      {/* Hero */}
      <section className="pt-8 sm:pt-12 pb-4 sm:pb-6 px-4">
        <div className="max-w-5xl mx-auto text-left">
          <h1 className="text-7xl sm:text-7xl md:text-8xl lg:text-9xl font-extrabold tracking-tight text-foreground leading-[1.0]">
            Rethink any
          </h1>
          <motion.span
            key={wordIndex}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="block text-7xl sm:text-7xl md:text-8xl lg:text-9xl font-extrabold tracking-tight leading-[1.0] cursor-pointer select-none min-h-[80px] sm:min-h-[80px]"
            style={{ color: ROTATING_WORDS[wordIndex].color }}
            onClick={() => setPaused((p) => !p)}
          >
            {ROTATING_WORDS[wordIndex].word}
            {paused && <span className="inline-block ml-3 text-lg align-middle opacity-50">⏸</span>}
          </motion.span>
          <p className="text-base sm:text-lg text-foreground/70 mt-3 max-w-xl">
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
      <section className="border-t border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] mb-2 text-primary flex items-center justify-center gap-1.5">
              <Sparkles size={12} /> How It Works
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Six stages of structured analysis
            </h2>
            <p className="text-sm text-foreground/60 mt-1.5">
              Each step builds on the last — from raw data to investor-ready output
            </p>
          </div>

          {/* Desktop: 3x2 grid */}
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {PIPELINE_STEPS.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.4, delay: i * 0.07 }}
                  className="rounded-xl border border-border bg-background p-5 hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${item.color}14` }}
                    >
                      <Icon size={20} style={{ color: item.color }} />
                    </div>
                    <div>
                      <span
                        className="text-[10px] font-bold uppercase tracking-widest block"
                        style={{ color: item.color }}
                      >
                        Step {item.step}
                      </span>
                      <span className="text-base font-extrabold text-foreground">{item.label}</span>
                    </div>
                  </div>
                  <p className="text-sm text-foreground/65 leading-relaxed">
                    {item.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Mobile: vertical timeline */}
          <div className="sm:hidden relative pl-8">
            <div className="absolute left-[13px] top-2 bottom-2 w-px bg-border" />
            <div className="space-y-4">
              {PIPELINE_STEPS.map((item, i) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.step}
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.35, delay: i * 0.06 }}
                    className="relative"
                  >
                    <div
                      className="absolute -left-8 top-4 w-[10px] h-[10px] rounded-full border-2 border-card z-10"
                      style={{ background: item.color }}
                    />
                    <div className="rounded-xl border border-border bg-background p-4">
                      <div className="flex items-center gap-3 mb-1.5">
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: `${item.color}14` }}
                        >
                          <Icon size={17} style={{ color: item.color }} />
                        </div>
                        <div>
                          <span
                            className="text-[9px] font-bold uppercase tracking-widest block"
                            style={{ color: item.color }}
                          >
                            Step {item.step}
                          </span>
                          <span className="text-[15px] font-extrabold text-foreground">{item.label}</span>
                        </div>
                      </div>
                      <p className="text-[12px] text-foreground/60 leading-relaxed pl-12">
                        {item.desc}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
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


      <AppFooter />
    </div>
  );
}
