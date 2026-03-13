import { PlatformNav } from "@/components/PlatformNav";
import { useSubscription } from "@/hooks/useSubscription";
import {
  Brain, Layers, Shield, Zap, Target, Sparkles, ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";

const PILLARS = [
  {
    icon: Brain,
    title: "First-Principles Reasoning",
    desc: "Every analysis begins by stripping away assumptions and rebuilding from fundamental truths. No templates, no generic frameworks — just structured logic applied to your specific market.",
  },
  {
    icon: Layers,
    title: "Multi-Layer Deconstruction",
    desc: "We analyze across supply, demand, and positioning simultaneously — mapping the forces that shape your market from multiple angles to find what others miss.",
  },
  {
    icon: Shield,
    title: "Adversarial Stress Testing",
    desc: "Every conclusion is challenged by a simulated adversary before you see it. Red Team vs. Green Team debate ensures your strategy survives scrutiny — not just sounds good.",
  },
  {
    icon: Target,
    title: "Constraint-Driven Innovation",
    desc: "Instead of brainstorming in a vacuum, we identify the real constraints holding a market back — then engineer solutions that specifically remove them.",
  },
  {
    icon: Zap,
    title: "Adaptive Intelligence",
    desc: "The engine adjusts its analysis depth based on your market's complexity, regulatory environment, and competitive landscape. No two analyses run the same way.",
  },
  {
    icon: Sparkles,
    title: "Decision-Grade Output",
    desc: "Every insight is tagged by confidence level and evidence quality. You always know what's verified, what's modeled, and what still needs validation.",
  },
];

const DIFFERENTIATORS = [
  {
    question: "Why not just use ChatGPT?",
    answer: "ChatGPT gives you plausible-sounding answers. We give you structurally grounded strategy — with evidence attribution, confidence scoring, and adversarial validation built into every output.",
  },
  {
    question: "How is this different from consulting?",
    answer: "Traditional consulting takes weeks and costs tens of thousands. Our engine runs the same analytical rigor in minutes — and you can iterate, challenge, and stress-test the results yourself.",
  },
  {
    question: "Can I trust AI-generated strategy?",
    answer: "You shouldn't trust any strategy blindly. That's why every claim is tagged with its evidence basis, every conclusion is adversarially challenged, and the platform highlights exactly what needs human validation.",
  },
];

export default function MethodologyPage() {
  const { tier } = useSubscription();

  return (
    <div className="min-h-screen bg-background">
      <PlatformNav tier={tier} />

      {/* Hero */}
      <div className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-primary mb-3">Methodology</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground leading-tight mb-3">
            Strategy engineered from structure,<br className="hidden sm:block" /> not scraped from the internet
          </h1>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Market Disruptor uses a proprietary multi-stage reasoning engine that decomposes markets to their structural foundations, 
            then rebuilds strategy from constraints upward. The result is analysis that's grounded, testable, and actionable.
          </p>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-12">

        {/* Core Pillars */}
        <section>
          <h2 className="text-xl font-bold text-foreground mb-1">What Powers the Engine</h2>
          <p className="text-sm text-muted-foreground mb-5">Six foundational principles that make every analysis structurally sound.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PILLARS.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.title} className="border border-border rounded-lg p-4 bg-card hover:border-primary/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary/10">
                      <Icon size={16} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground mb-1">{p.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* How It Works — High Level */}
        <section>
          <h2 className="text-xl font-bold text-foreground mb-1">How It Works</h2>
          <p className="text-sm text-muted-foreground mb-5">A proprietary pipeline that moves from raw input to battle-tested strategy.</p>
          <div className="border border-border rounded-lg bg-card overflow-hidden">
            {[
              { step: "1", title: "Structural Intelligence", desc: "Deep data collection and market decomposition across multiple dimensions." },
              { step: "2", title: "Assumption Extraction", desc: "Every hidden assumption is surfaced, scored, and prepared for inversion." },
              { step: "3", title: "Constraint-Driven Reinvention", desc: "Assumptions are flipped, constraints are mapped, and non-obvious alternatives are engineered." },
              { step: "4", title: "Adversarial Validation", desc: "Every output is stress-tested through simulated debate and scenario analysis." },
              { step: "5", title: "Decision-Ready Output", desc: "Confidence-scored strategy with clear next steps and validation experiments." },
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3.5 border-b border-border last:border-b-0">
                <span className="flex-shrink-0 w-7 h-7 rounded-md bg-primary/10 text-primary flex items-center justify-center text-sm font-extrabold">
                  {s.step}
                </span>
                <div>
                  <p className="text-sm font-bold text-foreground">{s.title}</p>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Three Modes */}
        <section>
          <h2 className="text-xl font-bold text-foreground mb-1">Three Analysis Modes</h2>
          <p className="text-sm text-muted-foreground mb-5">The same engine, adapted for different leverage domains.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { title: "Product", cssVar: "--mode-product", desc: "Physical & digital product teardown — materials, form factor, supply chain, patent landscape." },
              { title: "Service", cssVar: "--mode-service", desc: "Service delivery deconstruction — workflow friction, automation readiness, operational leverage." },
              { title: "Business Model", cssVar: "--mode-business", desc: "Revenue engine analysis — cost structure, value chain, adjacency opportunities." },
            ].map((m) => (
              <div
                key={m.title}
                className="border border-border rounded-lg p-4 bg-card"
                style={{ borderTopWidth: "3px", borderTopColor: `hsl(var(${m.cssVar}))` }}
              >
                <h3 className="text-sm font-bold text-foreground mb-1">{m.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ-style differentiators */}
        <section>
          <h2 className="text-xl font-bold text-foreground mb-1">Why This Approach</h2>
          <p className="text-sm text-muted-foreground mb-5">Common questions about the methodology.</p>
          <div className="space-y-2">
            {DIFFERENTIATORS.map((d, i) => (
              <div key={i} className="border border-border rounded-lg p-4 bg-card">
                <p className="text-sm font-bold text-foreground mb-1">{d.question}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{d.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center py-6">
          <p className="text-lg font-bold text-foreground mb-2">See it in action</p>
          <p className="text-sm text-muted-foreground mb-4">The best way to understand the methodology is to run an analysis.</p>
          <Link
            to="/analysis/new"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-opacity"
          >
            Start Analysis <ArrowRight size={14} />
          </Link>
        </section>
      </main>
    </div>
  );
}
