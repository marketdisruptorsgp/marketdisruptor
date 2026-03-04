import { PlatformNav } from "@/components/PlatformNav";
import { useSubscription } from "@/hooks/useSubscription";
import {
  Layers, Search, Tag, Swords, Brain, Lightbulb, Target,
  Shuffle, Users, BarChart3, ArrowRight, Upload, Briefcase, Building2,
} from "lucide-react";

/* ── Reasoning Engine ── */
const ENGINE_STEPS = [
  { step: "Domain Confirmation", color: "bg-blue-500" },
  { step: "Objective Definition", color: "bg-blue-500" },
  { step: "First-Principles Decomposition", color: "bg-indigo-500" },
  { step: "Friction Discovery", color: "bg-violet-500" },
  { step: "Friction Relevance Qualification (Tier 1/2/3)", color: "bg-violet-500" },
  { step: "Constraint Mapping — cost, time, adoption, scale, reliability, risk", color: "bg-amber-500" },
  { step: "Mode-Specific Structural Analysis", color: "bg-emerald-500" },
  { step: "Leverage Identification", color: "bg-rose-500" },
  { step: "Constraint-Driven Solution Generation", color: "bg-rose-500" },
];

/* ── Frameworks ── */
const FRAMEWORKS = [
  {
    name: "First Principles Thinking",
    icon: Brain,
    status: "core" as const,
    where: "Disrupt step, reasoning engine",
    how: "Decomposes every product, service, or model to fundamental truths. Strips assumptions. Rebuilds from constraints upward. Powers the entire 9-step reasoning protocol.",
    accent: "border-l-indigo-500",
    bg: "bg-indigo-500/8",
    iconColor: "text-indigo-600",
  },
  {
    name: "SCAMPER",
    icon: Shuffle,
    status: "embedded" as const,
    where: "Flip the Logic, Flipped Ideas",
    how: "Each assumption is reversed, substituted, combined, or eliminated to generate non-obvious alternatives. The method is structural — every flip must causally connect to a mapped constraint.",
    accent: "border-l-emerald-500",
    bg: "bg-emerald-500/8",
    iconColor: "text-emerald-600",
  },
  {
    name: "Jobs-to-Be-Done",
    icon: Users,
    status: "embedded" as const,
    where: "Intel report, friction discovery",
    how: "Maps the functional, emotional, and social jobs customers hire a product or service to do. Friction discovery asks where value is lost in that job — exposing non-obvious competitors.",
    accent: "border-l-cyan-500",
    bg: "bg-cyan-500/8",
    iconColor: "text-cyan-600",
  },
  {
    name: "Value Proposition Canvas",
    icon: Target,
    status: "partial" as const,
    where: "Stress Test, constraint mapping",
    how: "Red vs. Green Team debate stress-tests whether proposed value maps to real customer pains and gains. Constraint mapping (cost, time, adoption, scale, reliability, risk) replaces the visual canvas with structured logic.",
    accent: "border-l-amber-500",
    bg: "bg-amber-500/8",
    iconColor: "text-amber-600",
  },
  {
    name: "Design Thinking",
    icon: Lightbulb,
    status: "parallel" as const,
    where: "Overall pipeline structure",
    how: "The 6-step pipeline (Intel → Disrupt → Redesign → Stress Test → Pitch) mirrors Empathize → Define → Ideate → Prototype → Test. Diverges from IDEO by using data-driven decomposition instead of ethnographic observation.",
    accent: "border-l-gray-400",
    bg: "bg-gray-500/8",
    iconColor: "text-gray-500",
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
    accent: "border-l-blue-500",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-600",
    dotColor: "bg-blue-500",
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
    accent: "border-l-violet-500",
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-600",
    dotColor: "bg-violet-500",
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
    accent: "border-l-amber-500",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-600",
    dotColor: "bg-amber-500",
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
    accent: "border-l-rose-500",
    iconBg: "bg-rose-500/10",
    iconColor: "text-rose-600",
    dotColor: "bg-rose-500",
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
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-7 sm:py-9">
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Methodology</p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-tight mb-1.5">
            How the Engine Works
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            A 9-step reasoning protocol powered by established strategic frameworks — adapted for decision-grade output.
          </p>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-10">

        {/* ── Section 1: Reasoning Engine ── */}
        <section>
          <h2 className="text-lg font-bold text-foreground mb-0.5">Decision-Grade Output Engine</h2>
          <p className="text-[13px] text-muted-foreground mb-3">Every analysis runs through this sequential protocol. No step is skipped.</p>
          <div className="border border-border rounded-md bg-card p-3 sm:p-4">
            <ol className="space-y-0">
              {ENGINE_STEPS.map((s, i) => (
                <li key={i} className="flex items-center gap-3 py-1.5 text-[13px] border-b border-border/50 last:border-b-0">
                  <span className={`flex-shrink-0 w-5 h-5 rounded ${s.color} text-white flex items-center justify-center text-[10px] font-bold`}>
                    {i + 1}
                  </span>
                  <span className="text-foreground">{s.step}</span>
                </li>
              ))}
            </ol>
            <div className="mt-3 pt-2.5 border-t border-border">
              <p className="text-[11px] text-muted-foreground">
                <strong className="text-foreground">Anti-Default Safeguard:</strong> Technology is only introduced when non-technical solutions (process, pricing, structural, operational) fail to remove a Tier 1 constraint.
              </p>
            </div>
          </div>
        </section>

        {/* ── Section 2: Frameworks ── */}
        <section>
          <h2 className="text-lg font-bold text-foreground mb-0.5">Embedded Frameworks</h2>
          <p className="text-[13px] text-muted-foreground mb-3">Established methodologies integrated into the reasoning engine.</p>
          <div className="space-y-1.5">
            {FRAMEWORKS.map((fw) => {
              const Icon = fw.icon;
              const status = STATUS_LABELS[fw.status];
              return (
                <div key={fw.name} className={`border border-border border-l-[3px] ${fw.accent} rounded-md p-3 sm:p-3.5 bg-card`}>
                  <div className="flex items-start gap-2.5">
                    <div className={`flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center ${fw.bg}`}>
                      <Icon size={14} className={fw.iconColor} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <p className="text-[13px] font-bold text-foreground">{fw.name}</p>
                        <span
                          className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                          style={{ background: `${status.color}15`, color: status.color }}
                        >
                          {status.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mb-1">
                        <strong className="text-foreground">Where:</strong> {fw.where}
                      </p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{fw.how}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Section 3: Mode-Specific ── */}
        <section>
          <h2 className="text-lg font-bold text-foreground mb-0.5">Mode-Specific Application</h2>
          <p className="text-[13px] text-muted-foreground mb-3">Each mode applies frameworks through a different leverage domain.</p>
          <div className="grid grid-cols-1 gap-1.5">
            {MODES.map((mode) => {
              const Icon = mode.icon;
              return (
                <div
                  key={mode.id}
                  className="border border-border rounded-md p-3 sm:p-3.5 bg-card"
                  style={{ borderTopWidth: "3px", borderTopColor: `hsl(var(${mode.cssVar}))` }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center"
                      style={{ background: `hsl(var(${mode.cssVar}) / 0.12)` }}
                    >
                      <Icon size={13} style={{ color: `hsl(var(${mode.cssVar}))` }} />
                    </div>
                    <h3 className="text-[13px] font-bold text-foreground">{mode.label} Mode</h3>
                  </div>
                  <dl className="space-y-1 text-[11px]">
                    {[
                      ["Leverage Domain", mode.leverage],
                      ["Unique Intel", mode.uniqueIntel],
                      ["Disrupt Lens", mode.disruptLens],
                      ["Redesign", mode.redesign],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-start gap-2">
                        <dt className="font-semibold text-foreground flex-shrink-0 w-20">{label}</dt>
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
          <h2 className="text-lg font-bold text-foreground mb-0.5">Analysis Pipeline</h2>
          <p className="text-[13px] text-muted-foreground mb-3">The 4-stage execution layer that operationalizes the reasoning engine.</p>
          <div className="space-y-1.5">
            {PIPELINE_STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} className={`border border-border border-l-[3px] ${step.accent} rounded-md p-3 sm:p-3.5 bg-card`}>
                  <div className="flex items-start gap-2.5">
                    <div className="flex-shrink-0 flex flex-col items-center gap-0.5">
                      <div className={`w-7 h-7 rounded-md flex items-center justify-center ${step.iconBg}`}>
                        <Icon size={14} className={step.iconColor} />
                      </div>
                      <span className="text-[9px] font-bold text-muted-foreground">S{i + 1}</span>
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-foreground mb-0.5">{step.title}</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">{step.desc}</p>
                      <ul className="space-y-0.5">
                        {step.details.map((d, j) => (
                          <li key={j} className="text-[11px] text-muted-foreground flex items-start gap-2">
                            <span className={`w-1 h-1 rounded-full ${step.dotColor} flex-shrink-0 mt-1.5`} />
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
          <h2 className="text-lg font-bold text-foreground mb-0.5">Adaptive Market Intelligence</h2>
          <p className="text-[13px] text-muted-foreground mb-3">Context-aware data enrichment layers that activate based on category and geography.</p>
          <div className="space-y-1.5">
            <div className="border border-border border-l-[3px] border-l-cyan-500 rounded-md p-3 sm:p-3.5 bg-card">
              <div className="flex items-start gap-2.5">
                <div className="flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center bg-cyan-500/10">
                  <BarChart3 size={14} className="text-cyan-600" />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-foreground mb-0.5">Geographic & Demographic Enrichment</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">
                    Real-world population, income, business density, and regional growth data ground market sizing in actual numbers.
                  </p>
                  <ul className="space-y-0.5">
                    {[
                      "Population and median household income by region",
                      "Business density and establishment counts",
                      "Year-over-year growth rates for market sizing",
                      "Applied in Stress Tests (TAM/SAM/SOM) and Pitch Decks (GTM strategy)",
                    ].map((d, j) => (
                      <li key={j} className="text-[11px] text-muted-foreground flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full bg-cyan-500 flex-shrink-0 mt-1.5" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="border border-border border-l-[3px] border-l-rose-500 rounded-md p-3 sm:p-3.5 bg-card">
              <div className="flex items-start gap-2.5">
                <div className="flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center bg-rose-500/10">
                  <Swords size={14} className="text-rose-600" />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-foreground mb-0.5">Regulatory & Legal Context</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">
                    Category-aware detection identifies industries with legal complexity — cannabis, healthcare, fintech, and more — then fetches real-world regulatory data automatically.
                  </p>
                  <ul className="space-y-0.5">
                    {[
                      "State-by-state legal variance and licensing requirements",
                      "Active federal rulemaking and proposed regulations",
                      "Adaptive: only triggered when meaningful regulatory complexity exists",
                      "Applied in Red Team arguments and GTM feasibility assessments",
                    ].map((d, j) => (
                      <li key={j} className="text-[11px] text-muted-foreground flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full bg-rose-500 flex-shrink-0 mt-1.5" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-2 p-2.5 rounded-md bg-muted/50 border border-border/50">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Key principle:</strong> These layers are <em>adaptive, not blanket</em>. A SaaS analysis skips regulatory fetches entirely. A cannabis analysis surfaces state-specific legal differences automatically.
            </p>
          </div>
        </section>

        {/* ── Section 6: Lenses ── */}
        <section>
          <h2 className="text-lg font-bold text-foreground mb-0.5">Analysis Lenses</h2>
          <p className="text-[13px] text-muted-foreground mb-3">Lenses control <em>how</em> results are interpreted — same data, different strategic perspective.</p>
          <div className="space-y-1.5">
            {[
              {
                name: "Default",
                color: "hsl(var(--primary))",
                accent: "border-l-primary",
                desc: "Explores disruption potential and innovation opportunities. Best for brainstorming.",
                details: "Scores favor novelty, market white-space, and radical re-imagination."
              },
              {
                name: "ETA Acquisition",
                color: "hsl(142 70% 40%)",
                accent: "border-l-emerald-600",
                desc: "Evaluates from an ownership & acquisition perspective — value durability, operational leverage.",
                details: "Prioritizes process improvements over technology. Scores favor cash-flow stability and realistic improvement pathways."
              },
              {
                name: "Custom",
                color: "hsl(38 92% 50%)",
                accent: "border-l-amber-500",
                desc: "You define the priorities, risk tolerance, time horizon, and constraints.",
                details: "Set a primary objective, time horizon, budget constraints, and evaluation weights. Every pipeline step adapts."
              },
            ].map((lens) => (
              <div key={lens.name} className={`border border-border border-l-[3px] ${lens.accent} rounded-md p-3 sm:p-3.5 bg-card`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full" style={{ background: `${lens.color}15`, color: lens.color }}>{lens.name}</span>
                </div>
                <p className="text-[13px] font-semibold text-foreground mb-0.5">{lens.desc}</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{lens.details}</p>
              </div>
            ))}
          </div>
          <div className="mt-2 p-2.5 rounded-md bg-muted/50 border border-border/50">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Key principle:</strong> Lenses change <em>interpretation</em>, not data. Switch lenses anytime from your Workspace.
            </p>
          </div>
        </section>

        {/* ── Section 6b: ETA Deep Dive ── */}
        <section>
          <h2 className="text-lg font-bold text-foreground mb-0.5">ETA Acquisition Methodology</h2>
          <p className="text-[13px] text-muted-foreground mb-3">Purpose-built for Entrepreneurs Through Acquisition — evaluating, buying, and growing small businesses ($500K–$5M).</p>

          {/* Buyer Journey */}
          <div className="border border-border border-l-[3px] border-l-emerald-500 rounded-md bg-card p-3 sm:p-3.5 mb-2" >
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 mb-2">The ETA Buyer Journey</p>
            <div className="grid grid-cols-5 gap-1 text-center">
              {[
                { phase: "Search", desc: "Upload CIMs, viability checks" },
                { phase: "Due Diligence", desc: "Operations, owner risk, addbacks" },
                { phase: "Deal Structure", desc: "SBA math, DSCR, LOI prep" },
                { phase: "Day 1–90", desc: "100-day playbook, quick wins" },
                { phase: "Ongoing", desc: "Re-analysis, quarterly pulse" },
              ].map((p, i) => (
                <div key={i} className="p-1.5 rounded bg-emerald-50 border border-emerald-200/50">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-700">{p.phase}</p>
                  <p className="text-[9px] text-muted-foreground mt-0.5 leading-tight">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ETA Modules */}
          <div className="space-y-1.5">
            {[
              {
                title: "CIM Intelligence Extraction",
                accent: "border-l-emerald-500", dotColor: "bg-emerald-500",
                points: [
                  "Automatically extracts SDE, revenue, addbacks, and margin data from uploaded CIM documents",
                  "Identifies owner involvement patterns, staffing structure, and customer concentration",
                  "Flags missing information and generates follow-up questions for the broker",
                  "Cross-references CIM claims against AI's independent operational assessment",
                ],
              },
              {
                title: "Deal Economics Calculator",
                accent: "border-l-blue-500", dotColor: "bg-blue-500",
                points: [
                  "SBA 7(a) loan modeling — adjustable down payment, interest rate, and term",
                  "DSCR computation — flags when deals are tight (SBA requires ≥1.25x)",
                  "Valuation sanity check — asking price vs. SDE multiple against industry norms",
                  "Downside sensitivity at -30%, -20%, -10% revenue scenarios",
                  "Owner take-home after debt service — monthly and annual",
                ],
              },
              {
                title: "Owner Dependency Assessment",
                accent: "border-l-rose-500", dotColor: "bg-rose-500",
                points: [
                  "Transition Risk Score (1–10) — quantifies value destruction risk on ownership change",
                  "Dependency mapping: Customer, Vendor, Operational, Pricing, Sales, Strategic",
                  "Key-person risk identification — who could leave with the owner?",
                  "Mitigation playbook — specific de-risking actions for each dependency",
                ],
              },
              {
                title: "Addback Scrutiny",
                accent: "border-l-amber-500", dotColor: "bg-amber-500",
                points: [
                  "Confidence rating per addback: Legitimate, Questionable, or Suspicious",
                  "Identifies common broker inflation patterns — family payroll, 'one-time' costs that recur",
                  "Computes Adjusted SDE — a more conservative valuation basis",
                  "Estimates real multiple based on scrutinized financials",
                ],
              },
              {
                title: "Stagnation Diagnostic",
                accent: "border-l-violet-500", dotColor: "bg-violet-500",
                points: [
                  "Root causes: owner fatigue, competitive erosion, structural decay, market shift, pricing compression",
                  "Reversibility Score per factor — can a new owner fix this?",
                  "Directly informs the 100-Day Playbook priorities",
                ],
              },
              {
                title: "100-Day Ownership Playbook",
                accent: "border-l-indigo-500", dotColor: "bg-indigo-500",
                points: [
                  "5-phase plan: Listen & Learn → Quick Wins → Process Optimization → Structural Changes → Scale",
                  "Derived from analysis findings — not a generic template",
                  "Success milestones and risk warnings per phase",
                  "Quick Wins section highlights low-effort, high-impact first-30-day actions",
                ],
              },
            ].map((mod) => (
              <div key={mod.title} className={`border border-border border-l-[3px] ${mod.accent} rounded-md p-3 sm:p-3.5 bg-card`}>
                <p className="text-[13px] font-bold text-foreground mb-1.5">{mod.title}</p>
                <ul className="space-y-0.5">
                  {mod.points.map((p, j) => (
                    <li key={j} className="text-[11px] text-muted-foreground flex items-start gap-2 leading-relaxed">
                      <span className={`w-1 h-1 rounded-full flex-shrink-0 mt-1.5 ${mod.dotColor}`} />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-2 p-2.5 rounded-md bg-muted/50 border border-border/50">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Key principle:</strong> ETA modules only appear when the ETA Acquisition Lens is active. The underlying first-principles engine is identical — the ETA lens reshapes interpretation and adds acquisition-specific output layers.
            </p>
          </div>
        </section>

        {/* ── Section 7: Strategic Operating System ── */}
        <section>
          <h2 className="text-lg font-bold text-foreground mb-0.5">Strategic Operating System</h2>
          <p className="text-[13px] text-muted-foreground mb-3">Profile-aware dominance modeling that re-ranks hypotheses based on your strategic archetype.</p>
          <div className="space-y-1.5">
            {[
              { name: "Operator", accent: "border-l-blue-500", color: "hsl(var(--primary))", desc: "Cost discipline, reliability focus, medium time horizons.", details: "Capital tolerance: 5/10. Evidence: 40% verified. Horizon: 24 months." },
              { name: "ETA Acquirer", accent: "border-l-emerald-600", color: "hsl(142 70% 40%)", desc: "Capital discipline, risk assessment, value creation pathways.", details: "Penalizes >36-month horizons. Evidence: 50% verified. Cost & reliability at 1.3-1.4x." },
              { name: "Venture Growth", accent: "border-l-violet-500", color: "hsl(280 70% 55%)", desc: "Speed & scale priority, higher risk tolerance.", details: "18-month horizon. Evidence: 30%. Scale at 1.4x, speed at 1.3x." },
              { name: "Bootstrapped Founder", accent: "border-l-amber-500", color: "hsl(38 92% 50%)", desc: "Capital-constrained, speed-to-revenue focus.", details: "Capital: 3/10. Highest capital discipline bias (0.8). Cost at 1.4x." },
              { name: "Enterprise Strategist", accent: "border-l-gray-400", color: "hsl(var(--muted-foreground))", desc: "Defensibility & reliability, long time horizons.", details: "48-month horizon. Evidence: 60%. Defensibility at 1.4x, reliability at 1.3x." },
            ].map((arch) => (
              <div key={arch.name} className={`border border-border border-l-[3px] ${arch.accent} rounded-md p-3 sm:p-3.5 bg-card`}>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full" style={{ background: `${arch.color}15`, color: arch.color }}>{arch.name}</span>
                </div>
                <p className="text-[13px] font-semibold text-foreground mb-0.5">{arch.desc}</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{arch.details}</p>
              </div>
            ))}
          </div>
          <div className="mt-2 p-2.5 rounded-md bg-muted/50 border border-border/50">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Key principle:</strong> Archetypes change <em>ranking</em>, not data. Switch archetypes instantly without re-running. The Lens shapes what the AI reasons about; the Archetype shapes how you interpret results.
            </p>
          </div>
        </section>

        {/* ── Section 8: Reasoning Interrogation ── */}
        <section>
          <h2 className="text-lg font-bold text-foreground mb-0.5">Reasoning Interrogation</h2>
          <p className="text-[13px] text-muted-foreground mb-3">Every analysis includes an interactive panel to question, challenge, and stress-test the reasoning.</p>
          <div className="border border-border border-l-[3px] border-l-indigo-500 rounded-md bg-card p-3 sm:p-3.5">
            <dl className="space-y-2 text-[11px]">
              {[
                ["Context-Aware", "Receives the full analysis context — governed data, root hypotheses, causal chains, evidence mixes. Every response references YOUR analysis."],
                ["Challenge Patterns", "Quick-action buttons pre-load relevant questions: why did a constraint rank highest, what if a key assumption is wrong, what's missing."],
                ["Structural Revisions", "Produces structured output that can be applied back to the analysis — not just text."],
                ["Not a Chatbot", "A reasoning auditor that can disagree with its own conclusions, identify blind spots, and trace causal chain disruptions."],
              ].map(([label, value]) => (
                <div key={label as string} className="flex items-start gap-2.5">
                  <ArrowRight size={11} className="text-indigo-500 flex-shrink-0 mt-0.5" />
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
          <h2 className="text-lg font-bold text-foreground mb-0.5">Output Philosophy</h2>
          <div className="border border-border border-l-[3px] border-l-primary rounded-md bg-card p-3 sm:p-3.5">
            <dl className="space-y-2 text-[11px]">
              {[
                ["Progressive Disclosure", "Executive signal → structural explanation → evidence deep-dive. Information density scales with user intent."],
                ["Visual-First", "Structural diagrams before narrative. When visuals are present, text collapses into expandable panels."],
                ["Decision-First", "Every output answers \"what do I do?\" — not just \"here's what we found.\""],
              ].map(([label, value]) => (
                <div key={label as string} className="flex items-start gap-2.5">
                  <ArrowRight size={11} className="text-primary flex-shrink-0 mt-0.5" />
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

      <footer className="max-w-3xl mx-auto px-4 sm:px-6 py-4 border-t border-border text-center" />
    </div>
  );
}
