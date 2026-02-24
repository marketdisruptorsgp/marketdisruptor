import { PlatformNav } from "@/components/PlatformNav";
import { useSubscription } from "@/hooks/useSubscription";
import { Layers, Search, Tag, Swords } from "lucide-react";

const METHODOLOGY_STEPS = [
  {
    title: "Data Collection",
    icon: Search,
    desc: "We run deep analysis across a large subset of real-world data sources — pricing databases, wholesale directories, community forums, search trends, and viral content signals — to build comprehensive market intelligence.",
    details: ["Historical & current market pricing databases", "Wholesale and supplier directories", "Community forums and discussion threads", "Google Trends and search volume data", "Social media virality signals", "Patent filing databases"],
  },
  {
    title: "3-Layer Deconstruction",
    icon: Layers,
    desc: "Every market is analyzed across three layers: Supply (sourcing, manufacturing, logistics), Demand (audience segments, willingness to pay, growth signals), and Positioning (competitive landscape, differentiation opportunities).",
    details: ["Supply layer: sourcing costs, lead times, MOQs, manufacturer quality", "Demand layer: audience sizing, price sensitivity, growth trajectory", "Positioning layer: competitive density, white-space analysis, brand opportunity"],
  },
  {
    title: "Claim Tagging & Leverage Scoring",
    icon: Tag,
    desc: "All AI-generated insights are tagged as Verified, Modeled, or Assumption. Each assumption is scored 1–10 for strategic leverage — high-leverage assumptions are the ones most worth validating.",
    details: ["Verified: backed by traceable data (pricing records, patents, supplier listings)", "Modeled: derived from AI pattern analysis — directionally reliable", "Assumption: strategic hypotheses requiring validation before acting"],
  },
  {
    title: "Adversarial Red Teaming",
    icon: Swords,
    desc: "A simulated adversary stress-tests your strategy by attacking key assumptions, identifying blind spots, and pressure-testing market positioning. This is how you find weaknesses before competitors do.",
    details: ["Red Team challenges every strategic claim", "Green Team defends with data-backed rebuttals", "Result: battle-tested strategy with known vulnerabilities addressed"],
  },
];

export default function MethodologyPage() {
  const { tier } = useSubscription();

  return (
    <div className="min-h-screen bg-background">
      <PlatformNav tier={tier} />

      <div className="border-b border-border bg-card">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-4">How It Works</p>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground leading-tight mb-3">
            Our 4-Step Analysis Pipeline
          </h1>
          <p className="text-base text-muted-foreground max-w-2xl leading-relaxed">
            Every analysis runs through a rigorous, multi-layered pipeline designed to produce insights you can actually act on — not generic summaries.
          </p>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="space-y-8">
          {METHODOLOGY_STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="border border-border rounded-lg p-5 sm:p-6 bg-card shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 flex flex-col items-center gap-1">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary/10 border border-primary/20">
                      <Icon size={18} className="text-primary" />
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground">Step {i + 1}</span>
                  </div>
                  <div>
                    <p className="text-base font-bold text-foreground mb-1">{step.title}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">{step.desc}</p>
                    <ul className="space-y-1.5">
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
