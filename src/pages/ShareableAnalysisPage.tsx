import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Zap, AlertTriangle, Shield, Target, TrendingUp, Lightbulb } from "lucide-react";

interface SharedData {
  title: string;
  category: string;
  avg_revival_score: number;
  products: any[];
  analysis_data: Record<string, unknown> | null;
}

export default function ShareableAnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<SharedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const { data: result, error: fnError } = await supabase.functions.invoke("fetch-shared-analysis", {
          body: { analysisId: id },
        });
        if (fnError || !result?.success) throw new Error(result?.error || "Not found");
        setData(result.analysis);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load analysis");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(var(--background))" }}>
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "hsl(var(--primary))" }} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(var(--background))" }}>
        <div className="text-center space-y-2">
          <AlertTriangle size={32} className="mx-auto text-muted-foreground opacity-40" />
          <p className="text-sm text-muted-foreground">{error || "Analysis not found"}</p>
        </div>
      </div>
    );
  }

  const ad = data.analysis_data;
  const product = data.products?.[0];
  const pitchDeck = ad?.pitchDeck as Record<string, unknown> | undefined;
  const stressTest = ad?.stressTest as Record<string, unknown> | undefined;
  const disrupt = ad?.disrupt as Record<string, unknown> | undefined;

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--background))" }}>
      {/* Header */}
      <div className="py-8" style={{ background: "hsl(var(--primary))" }}>
        <div className="max-w-3xl mx-auto px-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-1">Market Disruptor · Shared Analysis</p>
          <h1 className="text-2xl font-bold text-white">{data.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-white/70">{data.category}</span>
            <span className="text-xs font-bold text-white bg-white/20 px-2 py-0.5 rounded">{data.avg_revival_score}/10</span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Intelligence Summary */}
        {product && (
          <Section title="Intelligence Summary" icon={Zap}>
            {product.keyInsight && (
              <p className="text-sm text-foreground/80 italic mb-3">"{product.keyInsight}"</p>
            )}
            <p className="text-sm text-foreground/70 leading-relaxed">{product.description}</p>
          </Section>
        )}

        {/* Disruption Thesis */}
        {disrupt && (
          <Section title="Disruption Thesis" icon={Lightbulb}>
            {(() => {
              const ideas = (disrupt as any)?.flippedIdeas || (disrupt as any)?.ideas;
              if (!Array.isArray(ideas)) return <p className="text-sm text-muted-foreground">No disruption data</p>;
              return (
                <div className="space-y-3">
                  {ideas.slice(0, 3).map((idea: any, i: number) => (
                    <div key={i} className="p-3 rounded-lg" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
                      <p className="text-xs font-bold text-foreground">{idea.name || idea.title}</p>
                      {idea.description && <p className="text-[11px] text-muted-foreground mt-1">{idea.description}</p>}
                    </div>
                  ))}
                </div>
              );
            })()}
          </Section>
        )}

        {/* Stress Test Results */}
        {stressTest && (
          <Section title="Stress Test Results" icon={Shield}>
            {(() => {
              const risks = (stressTest as any)?.risks;
              if (!Array.isArray(risks)) return null;
              return (
                <div className="space-y-2">
                  {risks.slice(0, 5).map((r: any, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5"
                        style={{
                          background: r.severity === "high" ? "hsl(var(--destructive) / 0.1)" : r.severity === "medium" ? "hsl(38 92% 50% / 0.1)" : "hsl(142 70% 40% / 0.1)",
                          color: r.severity === "high" ? "hsl(var(--destructive))" : r.severity === "medium" ? "hsl(38 92% 40%)" : "hsl(142 70% 40%)",
                        }}
                      >
                        {(r.severity || "medium").toUpperCase()}
                      </span>
                      <div>
                        <p className="text-foreground font-medium">{r.risk}</p>
                        <p className="text-muted-foreground mt-0.5">{r.mitigation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </Section>
        )}

        {/* Decision Recommendation */}
        <Section title="Decision Recommendation" icon={Target}>
          <div className="p-4 rounded-lg" style={{ background: "hsl(var(--primary) / 0.06)", border: "1px solid hsl(var(--primary) / 0.2)" }}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={14} style={{ color: "hsl(var(--primary))" }} />
              <span className="text-xs font-bold" style={{ color: "hsl(var(--primary))" }}>
                Revival Score: {data.avg_revival_score}/10
              </span>
            </div>
            <p className="text-sm text-foreground/80">
              {data.avg_revival_score >= 7
                ? "Strong structural indicators suggest high market potential. Recommended for further validation and investment consideration."
                : data.avg_revival_score >= 5
                  ? "Moderate indicators present. Core thesis requires further validation before significant resource commitment."
                  : "Lower confidence levels identified. Significant de-risking needed before proceeding."}
            </p>
          </div>
        </Section>

        {/* Footer */}
        <div className="pt-4 border-t border-border text-center">
          <p className="text-[10px] text-muted-foreground">
            Generated by Market Disruptor · Analysis is for informational purposes only
          </p>
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: typeof Zap; children: React.ReactNode }) {
  return (
    <div className="rounded-xl p-5" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={14} style={{ color: "hsl(var(--primary))" }} />
        <h2 className="text-sm font-bold text-foreground">{title}</h2>
      </div>
      {children}
    </div>
  );
}
