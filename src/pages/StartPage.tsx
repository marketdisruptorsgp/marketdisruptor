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
  FileText, BarChart3,
} from "lucide-react";

const ROTATING_WORDS = [
  { word: "product", color: "hsl(var(--mode-product))" },
  { word: "service", color: "hsl(var(--mode-service))" },
  { word: "business", color: "hsl(var(--mode-business))" },
];

const PIPELINE_STEPS = [
  {
    icon: Search, label: "Analyze", step: 1,
    desc: "Define your target and begin mapping the competitive landscape",
    color: "#2563eb",
  },
  {
    icon: BarChart3, label: "Intel Report", step: 2,
    desc: "Deep-dive into pricing, supply chains, patents, and community sentiment",
    color: "#0891b2",
  },
  {
    icon: Radar, label: "Deconstruct", step: 3,
    desc: "Challenge assumptions and uncover structural constraints hiding in plain sight",
    color: "#7c3aed",
  },
  {
    icon: Sparkles, label: "Reimagine", step: 4,
    desc: "Flip constraints into opportunities — generate redesigned concepts with evidence",
    color: "#db2777",
  },
  {
    icon: Swords, label: "Stress Test", step: 5,
    desc: "Validate with adversarial testing — red team vs green team debate",
    color: "#dc2626",
  },
  {
    icon: Presentation, label: "Pitch", step: 6,
    desc: "Synthesize into an investor-ready narrative with evidence-backed slides",
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
      <section className="pt-4 sm:pt-8 pb-8 sm:pb-12 px-6 sm:px-10">
        <div className="max-w-6xl mx-auto text-left">
          <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-[6.5rem] font-extrabold tracking-tight text-foreground leading-[1.08]">
            Rethink any.
          </h1>
          <motion.p
            key={wordIndex}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-6xl sm:text-7xl md:text-8xl lg:text-[6.5rem] font-extrabold tracking-tight leading-[1.08] cursor-pointer select-none"
            style={{ color: ROTATING_WORDS[wordIndex].color }}
            onClick={() => setPaused((p) => !p)}
          >
            {ROTATING_WORDS[wordIndex].word}.
            {paused && <span className="inline-block ml-3 text-lg align-middle opacity-50">⏸</span>}
          </motion.p>
          <p className="text-lg sm:text-xl text-muted-foreground mt-5 max-w-2xl leading-relaxed">
            Deconstruct markets, stress-test strategies, and build what's next.
          </p>
          <div className="flex items-center gap-3 mt-8">
            <button
              onClick={() => navigate("/analysis/new")}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Start Analysis <ArrowRight size={15} />
            </button>
            <button
              onClick={() => navigate("/methodology")}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-full border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              How It Works
            </button>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 sm:px-10">
        <ShowcaseGallery />
      </section>

      {/* How It Works Pipeline */}
      <section className="border-t border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] mb-2 text-primary flex items-center justify-center gap-1.5">
              <Sparkles size={12} /> How Discovery Works
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Six stages of strategic discovery
            </h2>
            <p className="text-sm text-foreground/60 mt-1.5">
              Each step builds on the last — from mapping the system to redesigning it
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

      {/* CTA Banner — bold dark section */}
      <section className="bg-foreground">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 py-16 sm:py-20 text-center">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-background leading-tight tracking-tight mb-3"
          >
            Uncover opportunities your competitors can't see.
          </motion.p>
          <p className="text-sm sm:text-base text-background/60 mb-8 max-w-lg mx-auto">
            Map the hidden structure of any market and discover where leverage exists.
          </p>
          <button
            onClick={() => navigate("/analysis/new")}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-background text-foreground text-sm font-bold hover:bg-background/90 transition-colors shadow-lg"
          >
            Start Discovery <ArrowRight size={15} />
          </button>
        </div>
      </section>

      {/* Bottom cards row */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="grid sm:grid-cols-2 gap-5">
          {/* What to expect */}
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-7 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary rounded-l-2xl" />
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Target size={18} className="text-primary" />
              </div>
              <p className="text-base font-extrabold text-foreground">What to expect</p>
            </div>
            <p className="text-[13px] text-foreground/70 leading-relaxed">
              The platform systematically maps assumptions, constraints, and friction signals — then converts them into credible redesign opportunities backed by evidence and competitor analogs.
            </p>
          </div>

          {/* Photo Analysis */}
          <div
            onClick={() => navigate("/instant-analysis")}
            className="rounded-2xl border border-border bg-card p-6 sm:p-7 relative overflow-hidden cursor-pointer group hover:shadow-lg transition-all duration-300"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 rounded-l-2xl" />
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Camera size={18} className="text-amber-600" />
              </div>
              <p className="text-base font-extrabold text-foreground">Instant Photo Analysis</p>
            </div>
            <p className="text-[13px] text-foreground/70 leading-relaxed mb-4">
              Snap a photo of any product and get an instant structural teardown in seconds.
            </p>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 group-hover:gap-2.5 transition-all">
              Try It <ArrowRight size={13} />
            </span>
          </div>
        </div>
      </section>


      <AppFooter />
    </div>
  );
}
