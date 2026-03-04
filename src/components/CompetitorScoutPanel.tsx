import { useState } from "react";
import { Search, ExternalLink, Shield, AlertTriangle, Crosshair, ChevronDown, ChevronUp, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Competitor {
  name: string;
  url: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  differentiator_gap: string;
}

interface CompetitorScoutPanelProps {
  ideaName: string;
  ideaDescription: string;
  category?: string;
}

export const CompetitorScoutPanel = ({ ideaName, ideaDescription, category }: CompetitorScoutPanelProps) => {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasScouted, setHasScouted] = useState(false);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [refinement, setRefinement] = useState<string | null>(null);
  const [isRefining, setIsRefining] = useState(false);

  const handleScout = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("scout-competitors", {
        body: { ideaName, ideaDescription, category },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Scouting failed");

      setCompetitors(data.competitors || []);
      setHasScouted(true);

      if (data.competitors?.length === 0) {
        toast.info("No direct competitors found — you might be onto something new!");
      } else {
        toast.success(`Found ${data.competitors.length} competitors`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to scout competitors");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefine = async () => {
    setIsRefining(true);
    try {
      const competitorContext = competitors
        .map((c) => `- ${c.name}: ${c.description}\n  Strengths: ${c.strengths.join(", ")}\n  Weaknesses: ${c.weaknesses.join(", ")}\n  Gap: ${c.differentiator_gap}`)
        .join("\n");

      const { data, error } = await supabase.functions.invoke("help-assistant", {
        body: {
          messages: [
            {
              role: "user",
              content: `I'm developing: "${ideaName}" — ${ideaDescription}

Here are the competitors I found:
${competitorContext}

Based on this competitive landscape, give me a sharp, actionable refinement strategy in 5-7 bullet points. Focus on:
1. The strongest differentiator I should lean into
2. Specific positioning to avoid head-to-head competition
3. Pricing or business model angles competitors are missing
4. Quick-win tactics for the first 90 days
5. What to explicitly NOT do (avoid their mistakes)

Be specific, not generic. Reference the actual competitors by name.`,
            },
          ],
        },
      });

      if (error) throw error;
      setRefinement(data?.reply || data?.choices?.[0]?.message?.content || "No refinement generated.");
    } catch (err: any) {
      toast.error(err.message || "Refinement failed");
    } finally {
      setIsRefining(false);
    }
  };

  if (!hasScouted) {
    return (
      <button
        type="button"
        onClick={handleScout}
        disabled={isLoading}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all w-full justify-center"
        style={{
          background: isLoading ? "hsl(var(--muted))" : "hsl(var(--accent))",
          color: isLoading ? "hsl(var(--muted-foreground))" : "hsl(var(--accent-foreground))",
          border: "1px solid hsl(var(--border))",
        }}
      >
        {isLoading ? (
          <>
            <Loader2 size={12} className="animate-spin" />
            Scouting competitors…
          </>
        ) : (
          <>
            <Search size={12} />
            Scout Competitors
          </>
        )}
      </button>
    );
  }

  if (competitors.length === 0) {
    return (
      <div className="p-3 rounded-lg bg-muted/50 border border-border text-center">
        <p className="text-xs text-muted-foreground">No direct competitors found. This could be a blue ocean opportunity!</p>
        <button onClick={handleScout} className="text-xs text-primary underline mt-1">Try again</button>
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-2 border-t border-border">
      <div className="flex items-center justify-between">
        <p className="typo-card-eyebrow flex items-center gap-1">
          <Crosshair size={11} /> Competitor Intel ({competitors.length})
        </p>
        <button onClick={handleScout} disabled={isLoading} className="text-xs text-primary hover:underline flex items-center gap-1">
          {isLoading ? <Loader2 size={10} className="animate-spin" /> : <Search size={10} />}
          Re-scout
        </button>
      </div>

      {competitors.map((comp, i) => (
        <div key={i} className="rounded-lg border border-border bg-card overflow-hidden">
          <button
            onClick={() => setExpanded((prev) => ({ ...prev, [i]: !prev[i] }))}
            className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-bold text-primary">{i + 1}</span>
              </div>
              <div className="min-w-0">
                <span className="text-sm font-semibold text-foreground block truncate">{comp.name}</span>
                <span className="text-[11px] text-muted-foreground truncate block">{comp.description?.slice(0, 60)}…</span>
              </div>
            </div>
            {expanded[i] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {expanded[i] && (
            <div className="px-3 pb-3 space-y-2.5 border-t border-border pt-2.5">
              <p className="text-xs text-foreground/80 leading-relaxed">{comp.description}</p>

              <a
                href={comp.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <ExternalLink size={10} />
                {comp.url}
              </a>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-success flex items-center gap-1 mb-1">
                    <Shield size={9} /> Strengths
                  </p>
                  <ul className="space-y-0.5">
                    {comp.strengths?.map((s, j) => (
                      <li key={j} className="text-[11px] text-foreground/70 flex items-start gap-1">
                        <span className="text-success mt-0.5">•</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-warning flex items-center gap-1 mb-1">
                    <AlertTriangle size={9} /> Weaknesses
                  </p>
                  <ul className="space-y-0.5">
                    {comp.weaknesses?.map((w, j) => (
                      <li key={j} className="text-[11px] text-foreground/70 flex items-start gap-1">
                        <span className="text-warning mt-0.5">•</span> {w}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-2 rounded bg-primary/5 border border-primary/10">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-primary flex items-center gap-1 mb-1">
                  <Crosshair size={9} /> Your Opening
                </p>
                <p className="text-xs text-foreground/80 leading-relaxed">{comp.differentiator_gap}</p>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Sharpen Approach button */}
      <button
        type="button"
        onClick={handleRefine}
        disabled={isRefining}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all w-full justify-center"
        style={{
          background: isRefining ? "hsl(var(--muted))" : "hsl(var(--primary))",
          color: isRefining ? "hsl(var(--muted-foreground))" : "white",
        }}
      >
        {isRefining ? (
          <>
            <Loader2 size={12} className="animate-spin" />
            Sharpening your approach…
          </>
        ) : (
          <>
            <Sparkles size={12} />
            Sharpen My Approach
          </>
        )}
      </button>

      {/* Refinement output */}
      {refinement && (
        <div className="p-3 rounded-lg bg-accent/30 border border-accent space-y-2">
          <p className="typo-card-eyebrow flex items-center gap-1">
            <Sparkles size={11} /> Competitive Refinement Strategy
          </p>
          <div className="text-xs text-foreground/85 leading-relaxed whitespace-pre-line">{refinement}</div>
        </div>
      )}
    </div>
  );
};
