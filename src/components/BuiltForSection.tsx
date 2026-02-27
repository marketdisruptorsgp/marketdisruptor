import { Rocket, TrendingUp, Users, FileText } from "lucide-react";
import { useState } from "react";

const BUILT_FOR = [
  { icon: Rocket, title: "Entrepreneurs", outcome: "Validate before you build", desc: "Replace gut-feel with data-driven conviction across market, pricing, and positioning." },
  { icon: TrendingUp, title: "Investors", outcome: "Diligence in minutes", desc: "Adversarial stress-testing and market intelligence that surfaces hidden risks." },
  { icon: Users, title: "Product Teams", outcome: "Ship with confidence", desc: "Deconstruct competitors, map supply chains, and pressure-test go-to-market plans." },
  { icon: FileText, title: "Agencies", outcome: "Elevate client work", desc: "Generate investor-grade analysis and pitch decks backed by real market data." },
];

export function BuiltForSection() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 text-center">Built For</p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 max-w-4xl mx-auto">
        {BUILT_FOR.map(({ icon: Icon, title, outcome, desc }) => {
          const isOpen = expanded === title;
          return (
            <div
              key={title}
              className="rounded-xl border border-border bg-card p-3 sm:p-4 flex flex-col cursor-pointer transition-all hover:shadow-md group"
              onClick={() => setExpanded(isOpen ? null : title)}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon size={14} className="text-primary" />
                </div>
                <p className="text-sm font-bold text-foreground leading-tight">{title}</p>
              </div>
              <p className="text-xs font-semibold text-primary">{outcome}</p>
              <div
                className="overflow-hidden transition-all duration-300"
                style={{ maxHeight: isOpen ? 80 : 0, opacity: isOpen ? 1 : 0 }}
              >
                <p className="text-xs text-muted-foreground leading-relaxed mt-1.5">{desc}</p>
              </div>
              {!isOpen && (
                <p className="text-[10px] text-muted-foreground/50 mt-1 group-hover:text-muted-foreground transition-colors">
                  Tap for details
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
