import { useNavigate } from "react-router-dom";
import { PlatformNav } from "@/components/PlatformNav";
import { useSubscription } from "@/hooks/useSubscription";
import {
  TrendingUp, TrendingDown, Zap, AlertTriangle, BookOpen, Flame, Eye, ShieldCheck, ArrowRight, Radar, Target,
} from "lucide-react";

const TREND_SPOTLIGHTS = [
  { name: "Portable Espresso Machines", momentum: "+340%", period: "12mo search growth", score: 8.7, insight: "3 dominant brands control 70% of market. DTC gap in premium segment ($150–$300). Supply chain is mature — 12+ OEMs in Shenzhen with MOQ under 500 units.", category: "Consumer Electronics" },
  { name: "AI-Powered Tutoring Services", momentum: "+280%", period: "12mo search growth", score: 9.1, insight: "Massive fragmentation — no clear market leader. Parents willing to pay 2–3x traditional tutoring rates. Key differentiator: adaptive curriculum vs. static question banks.", category: "EdTech Services" },
  { name: "Modular Tiny Homes", momentum: "+190%", period: "12mo search growth", score: 7.4, insight: "Zoning regulation changes in 14 US states creating new demand. Average build cost $45K–$85K. Community sentiment strongly positive but financing remains a friction point.", category: "Real Estate" },
  { name: "Traditional Film Photography", momentum: "+160%", period: "12mo search growth", score: 7.9, insight: "Gen Z nostalgia driving revival. Film stock supply constrained — only 3 major manufacturers globally. Used camera prices up 40% YoY. Opportunity in film development services.", category: "Nostalgia / Hobby" },
];

const DISRUPTION_SIGNALS = [
  { icon: ShieldCheck, label: "Patent Filing Surge", desc: "47 new patents filed in solid-state battery tech in Q4 2025 — up 3x from previous quarter. Major implications for portable electronics and EV accessories.", time: "2 days ago", severity: "high" as const },
  { icon: AlertTriangle, label: "Supply Chain Shift", desc: "Three major Vietnamese textile manufacturers now offering DTC fulfillment. Average lead times dropped from 45 to 18 days. Opens new possibilities for fashion and home goods startups.", time: "5 days ago", severity: "medium" as const },
  { icon: Flame, label: "Viral Market Signal", desc: "\"Anti-productivity\" planners trending across TikTok (28M views). Community demanding intentional slowdown tools. No dominant brand has emerged yet — white space for a positioned entrant.", time: "1 week ago", severity: "high" as const },
  { icon: TrendingDown, label: "Price Collapse Detected", desc: "Smart home sensor kits dropped 62% in average retail price over 6 months. Margin compression forcing incumbents to bundle. Opportunity for value-added service layer on top of commoditized hardware.", time: "1 week ago", severity: "medium" as const },
  { icon: Eye, label: "Community Demand Spike", desc: "Reddit and forum threads requesting 'repairable' versions of popular kitchen appliances up 400% YoY. Right-to-repair sentiment creating product differentiation opportunity.", time: "2 weeks ago", severity: "low" as const },
];

const CATEGORY_PLAYBOOKS = [
  { title: "DTC Skincare", subtitle: "Product Disruption", stats: "~$18B US market · 12% CAGR · High fragmentation", summary: "The DTC skincare market is saturated at the low end but underserved in clinical-grade, dermatologist-validated products priced $30–$80. Community analysis reveals 'ingredient transparency' as the #1 purchase driver — yet most brands still use vague labeling. Supply chain: 8+ US-based contract manufacturers with MOQ under 200 units. Key risk: FDA regulatory tightening on 'active ingredient' marketing claims.", metrics: { competitors: "200+", avgMargin: "68%", entryBarrier: "Low" } },
  { title: "Micro-SaaS for Freelancers", subtitle: "Service Disruption", stats: "~60M US freelancers · $1.3T economy · Tool fatigue rising", summary: "Freelancers use an average of 7+ tools for invoicing, contracts, scheduling, and client management. Community sentiment shows strong demand for a single, opinionated platform that handles 80% of workflows. Pricing sweet spot: $15–$29/mo. Competitive moat comes from workflow automation, not features. Key insight: the winners won't have the most features — they'll have the fewest clicks to get paid.", metrics: { competitors: "50+", avgMargin: "82%", entryBarrier: "Medium" } },
  { title: "Premium Pet Supplements", subtitle: "Product Disruption", stats: "~$2.4B US market · 9% CAGR · Trust deficit", summary: "Pet supplement market is growing fast but plagued by skepticism — 68% of pet owners in community surveys don't trust supplement efficacy claims. Opportunity: clinically-tested, vet-endorsed formulations with transparent sourcing. Supply chain mature — 15+ contract manufacturers with FDA-registered facilities. Pricing power exists: owners who buy supplements spend 3.2x more on pet care overall.", metrics: { competitors: "80+", avgMargin: "72%", entryBarrier: "Medium" } },
];

const SEVERITY_STYLES = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-primary/10 text-primary border-primary/20",
  low: "bg-muted text-muted-foreground border-border",
};

export default function IntelPage() {
  const { tier } = useSubscription();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <PlatformNav tier={tier} />

      {/* Hero */}
      <div className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary text-primary-foreground">
              <Radar size={18} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Market Intelligence</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight mb-3">
            Intel Dashboard
          </h1>
          <p className="text-base text-muted-foreground max-w-2xl leading-relaxed">
            Live market signals, category deep-dives, and disruption alerts — surfaced from our analysis engine across thousands of data points. Your strategic radar.
          </p>
          <div className="flex flex-wrap gap-4 mt-6">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="font-semibold">{TREND_SPOTLIGHTS.length} Active Spotlights</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-destructive" />
              <span className="font-semibold">{DISRUPTION_SIGNALS.length} Disruption Signals</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Target size={10} className="text-primary" />
              <span className="font-semibold">{CATEGORY_PLAYBOOKS.length} Category Playbooks</span>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-14">
        {/* Trend Spotlights */}
        <section>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-primary" />
            <h2 className="text-lg font-bold text-foreground">Trend Spotlights</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed max-w-2xl">
            Categories showing accelerating demand, supply chain readiness, and disruption potential.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {TREND_SPOTLIGHTS.map((t, i) => (
              <div key={i} className="border border-border rounded-lg p-5 bg-card shadow-sm hover:border-primary/30 transition-colors">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="text-sm font-bold text-foreground">{t.name}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{t.category}</span>
                </div>
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-primary">
                    <TrendingUp size={12} /> {t.momentum}
                  </span>
                  <span className="text-xs text-muted-foreground">{t.period}</span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${t.score * 10}%` }} />
                  </div>
                  <span className="text-xs font-bold text-foreground">{t.score}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{t.insight}</p>
                <button
                  onClick={() => navigate("/")}
                  className="mt-4 text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                >
                  Analyze this category <ArrowRight size={12} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Disruption Signals */}
        <section>
          <div className="flex items-center gap-2 mb-2">
            <Zap size={16} className="text-primary" />
            <h2 className="text-lg font-bold text-foreground">Disruption Signals</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed max-w-2xl">
            Real-time market shifts, patent activity, supply chain changes, and viral signals that create windows of opportunity.
          </p>
          <div className="space-y-3">
            {DISRUPTION_SIGNALS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="flex items-start gap-3 border border-border rounded-lg p-4 bg-card shadow-sm hover:border-primary/30 transition-colors">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 border ${SEVERITY_STYLES[s.severity]}`}>
                    <Icon size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-foreground">{s.label}</span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border" style={{
                        ...(s.severity === "high" ? { color: "hsl(var(--destructive))", borderColor: "hsl(var(--destructive) / 0.3)", background: "hsl(var(--destructive) / 0.08)" } :
                          s.severity === "medium" ? { color: "hsl(var(--primary))", borderColor: "hsl(var(--primary) / 0.3)", background: "hsl(var(--primary) / 0.08)" } :
                          {})
                      }}>
                        {s.severity}
                      </span>
                      <span className="text-[10px] text-muted-foreground ml-auto">{s.time}</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Category Playbooks */}
        <section>
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={16} className="text-primary" />
            <h2 className="text-lg font-bold text-foreground">Category Playbooks</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed max-w-2xl">
            Deep-dive strategic breakdowns of high-potential verticals — competitive maps, pricing benchmarks, and entry strategies.
          </p>
          <div className="space-y-4">
            {CATEGORY_PLAYBOOKS.map((p, i) => (
              <div key={i} className="border border-border rounded-lg p-5 sm:p-6 bg-card shadow-sm hover:border-primary/30 transition-colors">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-base font-bold text-foreground">{p.title}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">{p.subtitle}</span>
                </div>
                <p className="text-xs font-medium text-muted-foreground mb-4">{p.stats}</p>

                <div className="flex gap-4 mb-4">
                  {Object.entries(p.metrics).map(([key, val]) => (
                    <div key={key} className="text-center">
                      <p className="text-sm font-bold text-foreground">{val}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        {key === "avgMargin" ? "Avg Margin" : key === "entryBarrier" ? "Entry Barrier" : "Competitors"}
                      </p>
                    </div>
                  ))}
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed">{p.summary}</p>
                <button
                  onClick={() => navigate("/")}
                  className="mt-4 text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                >
                  Run your own analysis in this category <ArrowRight size={12} />
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="max-w-5xl mx-auto px-4 sm:px-6 py-6 border-t border-border text-center">
        <p className="text-xs">
          <a href="https://sgpcapital.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:opacity-80 transition-opacity">
            Built by SGP Capital
          </a>
          <span className="text-muted-foreground"> · </span>
          <a href="mailto:steven@sgpcapital.com" className="text-muted-foreground hover:underline">steven@sgpcapital.com</a>
        </p>
      </footer>
    </div>
  );
}
