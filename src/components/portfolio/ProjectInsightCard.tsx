import { format, parseISO } from "date-fns";
import { Lightbulb, Rocket, Target, ChevronRight } from "lucide-react";

interface SavedAnalysis {
  id: string;
  title: string;
  category: string;
  avg_revival_score: number;
  created_at: string;
  analysis_type?: string;
  products?: any[];
  analysis_data?: any;
}

const CATEGORY_MAP: Record<string, { label: string; color: string }> = {
  custom: { label: "Product", color: "#1249a3" },
  product: { label: "Product", color: "#1249a3" },
  service: { label: "Service", color: "#df2060" },
  business: { label: "Business", color: "#8b3fd9" },
  first_principles: { label: "First Principles", color: "#0d9488" },
};

function getInsights(a: SavedAnalysis) {
  const data = a.analysis_data as any;
  if (!data) return null;
  const products = (a.products || []) as any[];
  const firstProduct = products[0];
  return {
    keyInsight: firstProduct?.keyInsight || data?.pitchDeck?.elevatorPitch || null,
    strongestProjection: data?.pitchDeck?.financialModel?.scenarios?.base?.revenue || data?.pitchDeck?.investmentAsk?.scenarios?.base?.revenue || null,
    easiestGtm: data?.pitchDeck?.gtmStrategy?.keyChannels?.[0] || null,
  };
}

export function ProjectInsightCard({ analysis, onOpen }: { analysis: SavedAnalysis; onOpen: () => void }) {
  const insights = getInsights(analysis);
  const score = analysis.avg_revival_score || 0;
  const scoreColor = score >= 7.5 ? "hsl(var(--score-high))" : score >= 5 ? "hsl(38 92% 50%)" : "hsl(var(--muted-foreground))";
  const cat = CATEGORY_MAP[analysis.analysis_type || analysis.category] || CATEGORY_MAP.custom;

  return (
    <button
      onClick={onOpen}
      className="text-left rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all p-4 space-y-3 group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">{analysis.title}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ background: `${cat.color}15`, color: cat.color }}>
              {cat.label}
            </span>
            <span className="text-[10px] text-muted-foreground">{format(parseISO(analysis.created_at), "MMM d")}</span>
          </div>
        </div>
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-extrabold flex-shrink-0"
          style={{ background: `${scoreColor}15`, color: scoreColor }}
        >
          {score || "—"}
        </div>
      </div>

      {insights?.keyInsight && (
        <div className="flex gap-2 items-start">
          <Lightbulb size={11} className="text-primary flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-foreground/70 leading-relaxed line-clamp-2">{insights.keyInsight}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {insights?.strongestProjection && (
          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}>
            <Rocket size={8} className="inline mr-0.5" /> {insights.strongestProjection}
          </span>
        )}
        {insights?.easiestGtm && (
          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: "hsl(142 70% 45% / 0.1)", color: "hsl(142 70% 35%)" }}>
            <Target size={8} className="inline mr-0.5" /> {insights.easiestGtm}
          </span>
        )}
      </div>

      <div className="flex items-center justify-end">
        <ChevronRight size={14} className="text-muted-foreground/40 group-hover:text-foreground transition-colors" />
      </div>
    </button>
  );
}
