import { PlatformNav } from "@/components/PlatformNav";
import { useSubscription } from "@/hooks/useSubscription";
import {
  Layers, Search, Tag, Swords, Brain, Lightbulb, Target,
  Shuffle, Users, BarChart3, ArrowRight, Upload, Briefcase, Building2,
} from "lucide-react";

/* ── Reasoning Engine ── */
const ENGINE_STEPS = [
  "Domain Confirmation",
  "Objective Definition",
  "First-Principles Decomposition",
  "Friction Discovery",
  "Friction Relevance Qualification (Tier 1/2/3)",
  "Constraint Mapping → cost, time, adoption, scale, reliability, risk",
  "Mode-Specific Structural Analysis",
  "Leverage Identification",
  "Constraint-Driven Solution Generation",
];

/* ── Frameworks ── */
const FRAMEWORKS = [
  {
    name: "First Principles Thinking",
    icon: Brain,
    status: "core" as const,
    where: "Disrupt step, reasoning engine",
    how: "Decomposes every product, service, or model to fundamental truths. Strips assumptions. Rebuilds from constraints upward. Powers the entire 9-step reasoning protocol.",
  },
  {
    name: "SCAMPER",
    icon: Shuffle,
    status: "embedded" as const,
    where: "Flip the Logic, Flipped Ideas",
    how: "Each assumption is reversed, substituted, combined, or eliminated to generate non-obvious alternatives. The method is structural — every flip must causally connect to a mapped constraint.",
  },
  {
    name: "Jobs-to-Be-Done",
    icon: Users,
    status: "embedded" as const,
    where: "Intel report, friction discovery",
    how: "Maps the functional, emotional, and social jobs customers hire a product or service to do. Friction discovery asks where value is lost in that job — exposing non-obvious competitors.",
  },
  {
    name: "Value Proposition Canvas",
    icon: Target,
    status: "partial" as const,
    where: "Stress Test, constraint mapping",
    how: "Red vs. Green Team debate stress-tests whether proposed value maps to real customer pains and gains. Constraint mapping (cost, time, adoption, scale, reliability, risk) replaces the visual canvas with structured logic.",
  },
  {
    name: "Design Thinking",
    icon: Lightbulb,
    status: "parallel" as const,
    where: "Overall pipeline structure",
    how: "The 6-step pipeline (Intel → Disrupt → Redesign → Stress Test → Pitch) mirrors Empathize → Define → Ideate → Prototype → Test. Diverges from IDEO by using data-driven decomposition instead of ethnographic observation.",
  },
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  core: { label: "Core", color: "hsl(var(--primary))" },
  embedded: { label: "Embedded", color: "hsl(142 70% 40%)" },
  partial: { label: "Partial", color: "hsl(38 92% 50%)" },
  parallel: { label: "Parallel", color: "hsl(var(--muted-foreground))" },
};

/* ── Analysis Pipeline ── */
const PIPELINE_STEPS = [
  {
    title: "Data Collection",
    icon: Search,
    desc: "Deep analysis across real-world sources — pricing databases, wholesale directories, forums, search trends, patent filings, and virality signals.",
    details: [
      "Historical & current market pricing",
      "Wholesale and supplier directories",
      "Community forums and discussion threads",
      "Google Trends and search volume data",
      "Social media virality signals",
      "Patent filing databases",
    ],
  },
  {
    title: "3-Layer Deconstruction",
    icon: Layers,
    desc: "Every market analyzed across Supply (sourcing, manufacturing, logistics), Demand (audience segments, willingness to pay, growth), and Positioning (competitive landscape, differentiation).",
    details: [
      "Supply: sourcing costs, lead times, MOQs, quality",
      "Demand: audience sizing, price sensitivity, growth trajectory",
      "Positioning: competitive density, white-space, brand opportunity",
    ],
  },
  {
    title: "Claim Tagging & Leverage Scoring",
    icon: Tag,
    desc: "All insights tagged as Verified, Modeled, or Assumption. High-leverage assumptions scored 1–10 — these are worth validating first.",
    details: [
      "Verified: traceable data (pricing records, patents, listings)",
      "Modeled: AI pattern analysis — directionally reliable",
      "Assumption: strategic hypotheses requiring validation",
    ],
  },
  {
    title: "Adversarial Red Teaming",
    icon: Swords,
    desc: "Simulated adversary attacks key assumptions, identifies blind spots, and pressure-tests positioning.",
    details: [
      "Red Team challenges every strategic claim",
      "Green Team defends with data-backed rebuttals",
      "Result: battle-tested strategy with known vulnerabilities",
    ],
  },
];

/* ── Mode-Specific ── */
const MODES = [
  {
    id: "product",
    label: "Product",
    icon: Upload,
    cssVar: "--mode-product",
    leverage: "Artifact / architecture change",
    uniqueIntel: "Supply chain, patent landscape, material & form-factor teardown",
    disruptLens: "\"What if the product's core assumption is wrong?\" — flips physical constraints",
    redesign: "Concept illustrations for reimagined products",
  },
  {
    id: "service",
    label: "Service",
    icon: Briefcase,
    cssVar: "--mode-service",
    leverage: "Delivery flow change",
    uniqueIntel: "Operational workflows, bottleneck mapping, automation readiness (replaces supply chain & patents)",
    disruptLens: "\"What if the delivery model itself is the friction?\" — flips service assumptions",
    redesign: "Reimagined service journey, not a physical artifact",
  },
  {
    id: "business",
    label: "Business Model",
    icon: Building2,
    cssVar: "--mode-business",
    leverage: "Value engine change",
    uniqueIntel: "Revenue model decomposition, cost structure analysis, value chain mapping",
    disruptLens: "\"What if the revenue model is the constraint?\" — flips structural/financial assumptions",
    redesign: "No Redesign step — model innovations are structural abstractions (5-step pipeline)",
  },
];

export default function MethodologyPage() {
  const { tier } = useSubscription();

  return (
    <div className="min-h-screen bg-background">
      <PlatformNav tier={tier} />

      {/* Hero */}
      <div className="border-b border-border bg-card">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-4">Methodology</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight mb-3">
            How the Engine Works
          </h1>
          <p className="text-base text-muted-foreground max-w-2xl leading-relaxed">
            A 9-step reasoning protocol powered by established strategic frameworks — adapted for decision-grade output.
          </p>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-14">

        {/* ── Section 1: Reasoning Engine ── */}
        <section>
          <h2 className="text-xl font-bold text-foreground mb-1">Decision-Grade Output Engine</h2>
          <p className="text-sm text-muted-foreground mb-5">Every analysis runs through this sequential protocol. No step is skipped.</p>
          <div className="border border-border rounded-lg bg-card p-4 sm:p-5">
            <ol className="space-y-2">
              {ENGINE_STEPS.map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span
                    className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold mt-0.5"
                    style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}
                  >
                    {i + 1}
                  </span>
                  <span className="text-foreground">{step}</span>
                </li>
              ))}
            </ol>
            <div className="mt-4 pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">Anti-Default Safeguard:</strong> Technology is only introduced when non-technical solutions (process → pricing → structural → operational) fail to remove a Tier 1 constraint.
              </p>
            </div>
          </div>
        </section>

        {/* ── Section 2: Frameworks ── */}
        <section>
          <h2 className="text-xl font-bold text-foreground mb-1">Embedded Frameworks</h2>
          <p className="text-sm text-muted-foreground mb-5">Established methodologies integrated into the reasoning engine.</p>
          <div className="space-y-3">
            {FRAMEWORKS.map((fw) => {
              const Icon = fw.icon;
              const status = STATUS_LABELS[fw.status];
              return (
                <div key={fw.name} className="border border-border rounded-lg p-4 sm:p-5 bg-card">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center bg-primary/10">
                      <Icon size={16} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="text-sm font-bold text-foreground">{fw.name}</p>
                        <span
                          className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                          style={{ background: `${status.color}15`, color: status.color }}
                        >
                          {status.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        <strong className="text-foreground">Where:</strong> {fw.where}
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{fw.how}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Section 3: Mode-Specific Application ── */}
        <section>
          <h2 className="text-xl font-bold text-foreground mb-1">Mode-Specific Application</h2>
          <p className="text-sm text-muted-foreground mb-5">Each mode applies frameworks through a different leverage domain.</p>
          <div className="grid grid-cols-1 gap-3">
            {MODES.map((mode) => {
              const Icon = mode.icon;
              return (
                <div
                  key={mode.id}
                  className="border border-border rounded-lg p-4 sm:p-5 bg-card"
                  style={{ borderTopWidth: "3px", borderTopColor: `hsl(var(${mode.cssVar}))` }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: `hsl(var(${mode.cssVar}) / 0.12)` }}
                    >
                      <Icon size={15} style={{ color: `hsl(var(${mode.cssVar}))` }} />
                    </div>
                    <h3 className="text-sm font-bold text-foreground">{mode.label} Mode</h3>
                  </div>
                  <dl className="space-y-2 text-xs">
                    {[
                      ["Leverage Domain", mode.leverage],
                      ["Unique Intel", mode.uniqueIntel],
                      ["Disrupt Lens", mode.disruptLens],
                      ["Redesign", mode.redesign],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-start gap-2">
                        <dt className="font-semibold text-foreground flex-shrink-0 w-24">{label}</dt>
                        <dd className="text-muted-foreground">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Section 4: Analysis Pipeline ── */}
        <section>
          <h2 className="text-xl font-bold text-foreground mb-1">Analysis Pipeline</h2>
          <p className="text-sm text-muted-foreground mb-5">The 4-stage execution layer that operationalizes the reasoning engine.</p>
          <div className="space-y-3">
            {PIPELINE_STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className="border border-border rounded-lg p-4 sm:p-5 bg-card">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 flex flex-col items-center gap-1">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary/10 border border-primary/20">
                        <Icon size={16} className="text-primary" />
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground">Stage {i + 1}</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground mb-1">{step.title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-3">{step.desc}</p>
                      <ul className="space-y-1">
                        {step.details.map((d, j) => (
                          <li key={j} className="text-xs text-muted-foreground flex items-start gap-2">
                            <span className="w-1 h-1 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                            {d}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Section 5: Adaptive Market Intelligence ── */}
        <section>
          <h2 className="text-xl font-bold text-foreground mb-1">Adaptive Market Intelligence</h2>
          <p className="text-sm text-muted-foreground mb-5">Context-aware data enrichment layers that activate based on the category and geography of each analysis.</p>
          <div className="space-y-3">
            {/* Geographic & Demographic */}
            <div className="border border-border rounded-lg p-4 sm:p-5 bg-card">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center bg-primary/10 border border-primary/20">
                  <BarChart3 size={16} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground mb-1">Geographic &amp; Demographic Enrichment</p>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                    Real-world population, income, business density, and regional growth data are pulled automatically to ground market sizing and go-to-market recommendations in actual numbers — not top-down estimates.
                  </p>
                  <ul className="space-y-1">
                    {[
                      "Population and median household income by region",
                      "Business density and establishment counts",
                      "Year-over-year growth rates for market sizing",
                      "Applied in Stress Tests (TAM/SAM/SOM validation) and Pitch Decks (GTM strategy)",
                    ].map((d, j) => (
                      <li key={j} className="text-xs text-muted-foreground flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Regulatory & Legal */}
            <div className="border border-border rounded-lg p-4 sm:p-5 bg-card">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center bg-primary/10 border border-primary/20">
                  <Swords size={16} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground mb-1">Regulatory &amp; Legal Context</p>
                  <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                    Category-aware detection identifies industries with legal complexity — cannabis, healthcare, fintech, food &amp; beverage, alcohol, firearms, and more — then fetches real-world regulatory data automatically. Non-regulated categories skip this entirely with zero overhead.
                  </p>
                  <ul className="space-y-1">
                    {[
                      "State-by-state legal variance and licensing requirements",
                      "Active federal rulemaking and proposed regulations",
                      "Adaptive: only triggered when the category has meaningful regulatory complexity",
                      "Applied in Red Team arguments (citing real legal barriers) and GTM feasibility assessments",
                    ].map((d, j) => (
                      <li key={j} className="text-xs text-muted-foreground flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-border/50">
            <p className="text-xs text-foreground/70 leading-relaxed">
              <strong className="text-foreground">Key principle:</strong> These layers are <em>adaptive, not blanket</em>. A SaaS analysis skips regulatory fetches entirely. A cannabis analysis in Missouri vs. Florida surfaces state-specific legal differences, active federal bills, and licensing requirements — all automatically.
            </p>
          </div>
        </section>

        {/* ── Section 6: Analysis Lenses ── */}
        <section>
          <h2 className="text-xl font-bold text-foreground mb-1">Analysis Lenses</h2>
          <p className="text-sm text-muted-foreground mb-5">Lenses control <em>how</em> results are interpreted — the same data, scored through different strategic perspectives.</p>
          <div className="space-y-3">
            {[
              {
                name: "Default",
                color: "hsl(var(--primary))",
                desc: "Explores disruption potential and innovation opportunities. Best for brainstorming and discovering what's possible.",
                details: "Scores favor novelty, market white-space, and radical re-imagination. Ideal for early-stage exploration."
              },
              {
                name: "ETA Acquisition",
                color: "hsl(142 70% 40%)",
                desc: "Evaluates from an ownership & acquisition perspective — value durability, operational leverage, defensibility.",
                details: "Recommendations prioritize process improvements over technology. Scores favor cash-flow stability, operational simplicity, and realistic improvement pathways. Built for search fund operators and acquirers."
              },
              {
                name: "Custom",
                color: "hsl(38 92% 50%)",
                desc: "You define the priorities, risk tolerance, time horizon, and constraints. The AI reweights all scoring to match.",
                details: "Set a primary objective (e.g. 'maximize margin'), time horizon, budget constraints, and evaluation weights. Every pipeline step adapts. Claims unsupported by your constraints are labeled as limitations."
              },
            ].map((lens) => (
              <div key={lens.name} className="border border-border rounded-lg p-4 sm:p-5 bg-card" style={{ borderLeftWidth: "3px", borderLeftColor: lens.color }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full" style={{ background: `${lens.color}15`, color: lens.color }}>{lens.name}</span>
                </div>
                <p className="text-sm font-semibold text-foreground mb-1">{lens.desc}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{lens.details}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-border/50">
            <p className="text-xs text-foreground/70 leading-relaxed">
              <strong className="text-foreground">Key principle:</strong> Lenses change <em>interpretation</em>, not data. The underlying intelligence remains identical — only the scoring, ranking, and strategic recommendations shift. Switch lenses anytime from your Workspace.
            </p>
          </div>
        </section>

        {/* ── Section 7: Strategic Operating System ── */}
        <section>
          <h2 className="text-xl font-bold text-foreground mb-1">Strategic Operating System</h2>
          <p className="text-sm text-muted-foreground mb-5">Profile-aware dominance modeling that re-ranks structural hypotheses based on your strategic archetype.</p>
          <div className="space-y-3">
            {[
              { name: "Operator", color: "hsl(var(--primary))", desc: "Cost discipline, reliability focus, medium time horizons. Weights cost and reliability constraints highest.", details: "Capital tolerance: 5/10. Evidence threshold: 40% verified. Time horizon: 24 months." },
              { name: "ETA Acquirer", color: "hsl(142 70% 40%)", desc: "Acquisition lens — capital discipline, risk assessment, value creation pathways.", details: "Penalizes solutions exceeding 36-month horizon. Requires higher evidence thresholds (50% verified). Weights cost and reliability at 1.3-1.4x." },
              { name: "Venture Growth", color: "hsl(280 70% 55%)", desc: "Speed & scale priority, higher risk tolerance. Deprioritizes cost and reliability.", details: "Fastest time horizon (18 months). Lowest evidence threshold (30%). Scale weighted at 1.4x, speed at 1.3x." },
              { name: "Bootstrapped Founder", color: "hsl(38 92% 50%)", desc: "Capital-constrained, speed-to-revenue focus. Lowest capital tolerance.", details: "Capital tolerance: 3/10. Highest capital discipline bias (0.8). Cost weighted at 1.4x." },
              { name: "Enterprise Strategist", color: "hsl(var(--muted-foreground))", desc: "Defensibility & reliability, long time horizons. Highest evidence threshold.", details: "48-month time horizon. Evidence threshold: 60% verified. Defensibility weighted at 1.4x, reliability at 1.3x." },
            ].map((arch) => (
              <div key={arch.name} className="border border-border rounded-lg p-4 sm:p-5 bg-card" style={{ borderLeftWidth: "3px", borderLeftColor: arch.color }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full" style={{ background: `${arch.color}15`, color: arch.color }}>{arch.name}</span>
                </div>
                <p className="text-sm font-semibold text-foreground mb-1">{arch.desc}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{arch.details}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-border/50">
            <p className="text-xs text-foreground/70 leading-relaxed">
              <strong className="text-foreground">Key principle:</strong> Archetypes change <em>ranking</em>, not data. The underlying analysis remains identical — only the dominance scores, penalties, and hypothesis ordering shift. Switch archetypes instantly without re-running. The Lens shapes what the AI reasons about; the Archetype shapes how you interpret the results.
            </p>
          </div>
        </section>

        {/* ── Section 8: Reasoning Interrogation ── */}
        <section>
          <h2 className="text-xl font-bold text-foreground mb-1">Reasoning Interrogation</h2>
          <p className="text-sm text-muted-foreground mb-5">Every analysis includes an interactive panel to question, challenge, and stress-test the reasoning.</p>
          <div className="border border-border rounded-lg bg-card p-4 sm:p-5">
            <dl className="space-y-3 text-xs">
              {[
                ["Context-Aware", "The interrogation AI receives the full analysis context — governed data, root hypotheses, causal chains, evidence mixes, and scores. Every response references specific data from YOUR analysis."],
                ["Challenge Patterns", "Quick-action buttons pre-load the most relevant questions: why did a constraint rank highest, what if a key assumption is wrong, what's missing, challenge the confidence score."],
                ["Structural Revisions", "When the AI suggests a re-ranking or revised hypothesis, it produces structured output that can be applied back to the analysis — not just text."],
                ["Not a Chatbot", "This is a reasoning auditor, not a generic assistant. It can disagree with its own conclusions, identify blind spots in the evidence base, and trace causal chain disruptions."],
              ].map(([label, value]) => (
                <div key={label as string} className="flex items-start gap-3">
                  <ArrowRight size={12} className="text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <dt className="font-bold text-foreground inline">{label as string}: </dt>
                    <dd className="text-muted-foreground inline">{value as string}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ── Output Philosophy ── */}
        <section>
          <h2 className="text-xl font-bold text-foreground mb-1">Output Philosophy</h2>
          <div className="border border-border rounded-lg bg-card p-4 sm:p-5">
            <dl className="space-y-3 text-xs">
              {[
                ["Progressive Disclosure", "Executive signal → structural explanation → evidence deep-dive. Information density scales with user intent."],
                ["Visual-First", "Structural diagrams before narrative. When visuals are present, text collapses into expandable panels."],
                ["Decision-First", "Every output answers \"what do I do?\" — not just \"here's what we found.\""],
              ].map(([label, value]) => (
                <div key={label as string} className="flex items-start gap-3">
                  <ArrowRight size={12} className="text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <dt className="font-bold text-foreground inline">{label as string}: </dt>
                    <dd className="text-muted-foreground inline">{value as string}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </main>

      <footer className="max-w-3xl mx-auto px-4 sm:px-6 py-6 border-t border-border text-center">
        <p className="text-xs">
          <a href="https://sgpcapital.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:opacity-80 transition-opacity">
            Built by SGP Capital
          </a>
        </p>
      </footer>
    </div>
  );
}
