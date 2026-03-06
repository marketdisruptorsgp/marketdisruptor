import { PlatformNav } from "@/components/PlatformNav";
import { ShowcaseGallery } from "@/components/ShowcaseGallery";

import { useSubscription } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Search, Zap, ShieldAlert, Presentation, Layers,
  Crosshair, Eye, Flame, Target,
} from "lucide-react";

const WHAT_IT_DOES = [
  {
    icon: Search,
    title: "Challenges Assumptions",
    desc: "Deliberately questions pricing logic, supply chain design, patent positioning, and the operational constraints incumbents accept as inevitable.",
    accent: "230 90% 63%",
  },
  {
    icon: Zap,
    title: "Isolates Structural Weaknesses",
    desc: "Identifies friction points and tests alternative configurations most teams would never consider.",
    accent: "271 81% 55%",
  },
  {
    icon: ShieldAlert,
    title: "Stress-Tests Every Angle",
    desc: "Adversarial Red Team / Green Team analysis applies data-driven scrutiny to surface overlooked leverage points and market segments.",
    accent: "350 80% 55%",
  },
  {
    icon: Presentation,
    title: "Delivers Actionable Output",
    desc: "Investor-ready pitch decks, strategic teardowns, and clearly mapped pathways for experimentation or disruption.",
    accent: "160 60% 44%",
  },
];

const PRINCIPLES = [
  {
    num: "01",
    title: "Decompose",
    icon: Crosshair,
    desc: "Break the product, service, or model into its raw components — materials, costs, workflows, incentives, constraints.",
  },
  {
    num: "02",
    title: "Question Everything",
    icon: Eye,
    desc: "Challenge why each component exists in its current form. Is the pricing model inherited? Is the supply chain designed or defaulted?",
  },
  {
    num: "03",
    title: "Reconstruct",
    icon: Flame,
    desc: "Rebuild from the ground up using only what's proven true — revealing configurations, pricing, and strategies the market hasn't considered.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

export default function AboutPage() {
  const { tier } = useSubscription();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <PlatformNav tier={tier} />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse 80% 50% at 50% 0%, hsl(var(--primary) / 0.06) 0%, transparent 70%)",
        }} />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 md:pt-20 pb-8 sm:pb-12 relative">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-sm font-bold uppercase tracking-[0.2em] text-primary mb-4"
          >
            About Market Disruptor
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-7xl sm:text-6xl md:text-8xl font-extrabold tracking-tight text-foreground leading-[1.05] mb-6"
          >
            Rethink The
            <br />
            <span className="text-primary">Possible</span>
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-4 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-3xl"
          >
            <p>
              <strong className="text-foreground">Market Disruptor</strong> is a proprietary deep analytics platform built for entrepreneurs, investors, and product teams who want to see opportunities others overlook.
            </p>
            <p>
              It combines advanced analytical models, real-time data analysis, computer vision, and structured strategic modeling to deconstruct any product, service, or business model — and reconstruct it from entirely new angles.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Philosophy pull-quote ── */}
      <section className="border-y border-border" style={{ background: "hsl(var(--muted) / 0.4)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="flex gap-4 items-start">
            <div className="flex-shrink-0 w-1 rounded-full self-stretch" style={{ background: "hsl(var(--primary))" }} />
            <div className="space-y-3">
              <p className="text-base sm:text-lg text-foreground leading-relaxed font-medium">
                It doesn't assume the current model is right. It deliberately flips it on its head — questioning pricing logic, supply chain design, competitive assumptions, and the friction incumbents accept as inevitable.
              </p>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                The goal isn't to promise a "better" answer every time. It's to apply a level of data-driven scrutiny and critical analysis that exceeds normal human bandwidth — revealing hidden leverage points, unlocking overlooked market segments, or optimizing specific components in ways that can materially change outcomes.
              </p>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        {/* ── What It Does ── */}
        <section className="mb-20">
          <div className="text-center mb-10">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">What It Does</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Four layers of strategic intelligence
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {WHAT_IT_DOES.map(({ icon: Icon, title, desc, accent }, i) => (
              <motion.div
                key={title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                variants={fadeUp}
                className="group relative rounded-xl border border-border p-6 bg-card shadow-sm hover:shadow-lg transition-all duration-300"
                style={{ borderTop: `3px solid hsl(${accent})` }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300"
                    style={{ background: `hsl(${accent} / 0.1)` }}
                  >
                    <Icon size={20} style={{ color: `hsl(${accent})` }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground mb-1.5">
                      <span style={{ color: `hsl(${accent})` }} className="mr-1.5 font-extrabold">{String(i + 1).padStart(2, "0")}</span>
                      {title}
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── First Principles ── */}
        <section className="mb-20">
          <div className="text-center mb-10">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">The Foundation</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Built on First Principles Thinking
            </h2>
          </div>

          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: "1.5px solid hsl(var(--primary) / 0.15)", background: "hsl(var(--primary) / 0.02)" }}
          >
            {/* Intro */}
            <div className="p-6 sm:p-8">
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
                    Instead of reasoning by analogy, you rebuild understanding from the ground up.
                  </p>
                </div>
              </div>
            </div>

            {/* 3-step process */}
            <div className="px-6 sm:px-8 pb-6 sm:pb-8">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {PRINCIPLES.map((item, i) => (
                  <motion.div
                    key={item.num}
                    custom={i}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={fadeUp}
                    className="rounded-xl p-5 bg-card border border-border hover:border-primary/30 transition-colors duration-300 group"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <item.icon size={14} className="text-primary" />
                      </div>
                      <span className="text-primary text-xs font-extrabold">{item.num}</span>
                    </div>
                    <p className="text-sm font-bold text-foreground mb-1.5">{item.title}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Why section */}
            <div className="border-t" style={{ borderColor: "hsl(var(--primary) / 0.1)" }}>
              <div className="p-6 sm:p-8">
                <p className="text-base font-bold text-foreground mb-2">Why it's at the core of everything we do</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Most market analysis starts with what competitors are doing and works backward. That approach
                  inherits their blind spots. Market Disruptor starts from the opposite direction — deconstructing
                  a market down to its structural foundations, then stress-testing whether the current way of doing
                  things is actually the <em>best</em> way. Every step of the pipeline is designed to surface the
                  assumptions nobody questioned and the opportunities nobody mapped.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Showcase */}
        <ShowcaseGallery />


        {/* ── CTA ── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative rounded-2xl border border-border p-10 sm:p-14 text-center bg-card shadow-sm overflow-hidden"
        >
          <div className="absolute inset-0 pointer-events-none" style={{
            background: "radial-gradient(ellipse 60% 80% at 50% 100%, hsl(var(--primary) / 0.04) 0%, transparent 70%)",
          }} />
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: "hsl(var(--primary) / 0.1)" }}>
              <Target size={26} className="text-primary" />
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-foreground mb-2">
              Apply a level of scrutiny that exceeds normal bandwidth.
            </p>
            <p className="text-sm text-muted-foreground mb-7 max-w-lg mx-auto">
              See what a deep deconstruction reveals about your market.
            </p>
            <button onClick={() => navigate("/analysis/new")} className="btn-primary inline-flex items-center gap-2 px-8 py-3 text-sm">
              Start Discovery <ArrowRight size={14} />
            </button>
          </div>
        </motion.section>

        <footer className="mt-20 pt-6 border-t border-border text-center">
          <p className="text-xs">
          </p>
        </footer>
      </main>
    </div>
  );
}
