import { useState, useEffect, useRef } from "react";
import { Search, ExternalLink, Shield, AlertTriangle, Crosshair, ChevronDown, ChevronUp, Sparkles, Loader2, MapPin, Globe, BarChart3, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

export interface Competitor {
  name: string;
  url: string;
  description: string;
  executive_summary: string;
  hq_city: string;
  founded_year?: string;
  employee_range?: string;
  funding_stage?: string;
  direct_competition_score: number;
  overlap_areas: string[];
  strengths: string[];
  weaknesses: string[];
  differentiator_gap: string;
  pricing_model?: string;
  target_audience?: string;
  sources: string[];
}

interface CompetitorScoutPanelProps {
  ideaName: string;
  ideaDescription: string;
  category?: string;
  autoScout?: boolean;
  onCompetitorsScouted?: (competitors: Competitor[]) => void;
}

export const CompetitorScoutPanel = ({ ideaName, ideaDescription, category, autoScout = false, onCompetitorsScouted }: CompetitorScoutPanelProps) => {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasScouted, setHasScouted] = useState(false);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [refinement, setRefinement] = useState<string | null>(null);
  const [isRefining, setIsRefining] = useState(false);
  const autoScoutTriggered = useRef(false);

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
      onCompetitorsScouted?.(data.competitors || []);

      if (data.competitors?.length === 0) {
        toast.info("No direct competitors found — you might be onto something new!");
      } else {
        toast.success(`Found ${data.competitors.length} competitors`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to scout competitors");
      setHasScouted(true); // Still mark as scouted to show empty state
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-scout on mount when enabled
  useEffect(() => {
    if (autoScout && !autoScoutTriggered.current && !hasScouted && !isLoading) {
      autoScoutTriggered.current = true;
      handleScout();
    }
  }, [autoScout]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefine = async () => {
    setIsRefining(true);
    try {
      const competitorContext = competitors
        .map((c) => `- ${c.name} (${c.hq_city || "Unknown HQ"}): ${c.executive_summary || c.description}\n  Competition Score: ${c.direct_competition_score}/10\n  Strengths: ${c.strengths.join(", ")}\n  Weaknesses: ${c.weaknesses.join(", ")}\n  Gap: ${c.differentiator_gap}`)
        .join("\n");

      const { data, error } = await supabase.functions.invoke("help-assistant", {
        body: {
          stream: false,
          messages: [
            {
              role: "user",
              content: `I'm building: "${ideaName}" — ${ideaDescription}

Here is my competitive landscape:
${competitorContext}

Give me a sharp, actionable 90-day differentiation strategy. Structure it as:

**🎯 Core Differentiator**
The single strongest angle I should own, referencing specific competitor gaps.

**🛡️ Positioning Strategy**
How to position to avoid head-to-head competition with the strongest players. Be specific about which competitors to avoid and which to challenge.

**💰 Business Model Angles**
Pricing or revenue model opportunities that competitors are missing or doing poorly.

**⚡ Quick Wins (First 90 Days)**
3-4 specific, actionable tactics I can execute immediately to gain traction.

**🚫 Anti-Patterns**
What to explicitly NOT do — reference specific competitor mistakes by name.

Be specific, bold, and reference the actual competitors by name. No generic advice.`,
            },
          ],
        },
      });

      if (error) throw error;
      const reply = data?.reply;
      if (!reply) throw new Error("No response from AI");
      setRefinement(reply);
    } catch (err: any) {
      toast.error(err.message || "Refinement failed");
    } finally {
      setIsRefining(false);
    }
  };

  // Loading state (shown during auto-scout or manual scout before results)
  if (isLoading && !hasScouted) {
    return (
      <div className="space-y-3 pt-2 border-t border-border">
        <div className="flex items-center gap-2 p-4 rounded-lg bg-muted/50 border border-border">
          <Loader2 size={14} className="animate-spin text-primary" />
          <span className="text-xs font-semibold text-muted-foreground">Scouting competitors…</span>
        </div>
      </div>
    );
  }

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
        <Search size={12} />
        Scout Competitors
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

  const getCompetitionColor = (score: number) => {
    if (score >= 8) return "hsl(0 72% 48%)";
    if (score >= 5) return "hsl(38 92% 50%)";
    return "hsl(142 70% 40%)";
  };

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
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: `${getCompetitionColor(comp.direct_competition_score || 5)}20` }}>
                <span className="text-[10px] font-bold" style={{ color: getCompetitionColor(comp.direct_competition_score || 5) }}>{i + 1}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-foreground truncate">{comp.name}</span>
                  {comp.direct_competition_score && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{
                        background: `${getCompetitionColor(comp.direct_competition_score)}15`,
                        color: getCompetitionColor(comp.direct_competition_score),
                      }}>
                      {comp.direct_competition_score}/10 threat
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {comp.hq_city && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <MapPin size={8} /> {comp.hq_city}
                    </span>
                  )}
                  <span className="text-[11px] text-muted-foreground truncate">{(comp.executive_summary || comp.description)?.slice(0, 60)}…</span>
                </div>
              </div>
            </div>
            {expanded[i] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {expanded[i] && (
            <div className="px-3 pb-3 space-y-2.5 border-t border-border pt-2.5">
              {/* Executive Summary */}
              {comp.executive_summary && (
                <div className="p-2.5 rounded bg-muted/50 border border-border">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/60 mb-1">Executive Summary</p>
                  <p className="text-xs text-foreground/85 leading-relaxed">{comp.executive_summary}</p>
                </div>
              )}

              {/* Quick facts row */}
              <div className="flex items-center gap-3 flex-wrap">
                <a href={comp.url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                  <Globe size={10} /> {comp.url}
                </a>
                {comp.hq_city && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin size={10} /> {comp.hq_city}
                  </span>
                )}
                {comp.founded_year && (
                  <span className="text-xs text-muted-foreground">Est. {comp.founded_year}</span>
                )}
                {comp.employee_range && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users size={9} /> {comp.employee_range}
                  </span>
                )}
                {comp.funding_stage && (
                  <span className="text-xs text-muted-foreground">{comp.funding_stage}</span>
                )}
              </div>

              {/* Overlap areas */}
              {comp.overlap_areas && comp.overlap_areas.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-semibold text-muted-foreground">Overlaps:</span>
                  {comp.overlap_areas.map((area, j) => (
                    <span key={j} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{area}</span>
                  ))}
                </div>
              )}

              {/* Competition score bar */}
              {comp.direct_competition_score && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/60 flex items-center gap-1">
                      <BarChart3 size={9} /> Direct Competition Score
                    </span>
                    <span className="text-xs font-bold" style={{ color: getCompetitionColor(comp.direct_competition_score) }}>
                      {comp.direct_competition_score}/10
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden bg-muted">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${(comp.direct_competition_score / 10) * 100}%`,
                        background: getCompetitionColor(comp.direct_competition_score),
                      }} />
                  </div>
                </div>
              )}

              {/* Pricing & target */}
              {(comp.pricing_model || comp.target_audience) && (
                <div className="grid grid-cols-2 gap-2">
                  {comp.pricing_model && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/60 mb-0.5">Pricing</p>
                      <p className="text-[11px] text-foreground/80">{comp.pricing_model}</p>
                    </div>
                  )}
                  {comp.target_audience && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/60 mb-0.5">Target</p>
                      <p className="text-[11px] text-foreground/80">{comp.target_audience}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Strengths / Weaknesses */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-success flex items-center gap-1 mb-1">
                    <Shield size={9} /> Strengths
                  </p>
                  <ul className="space-y-0.5">
                    {(comp.strengths || []).map((s, j) => (
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
                    {(comp.weaknesses || []).map((w, j) => (
                      <li key={j} className="text-[11px] text-foreground/70 flex items-start gap-1">
                        <span className="text-warning mt-0.5">•</span> {w}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Your Opening */}
              <div className="p-2 rounded bg-primary/5 border border-primary/10">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-primary flex items-center gap-1 mb-1">
                  <Crosshair size={9} /> Your Opening
                </p>
                <p className="text-xs text-foreground/80 leading-relaxed">{comp.differentiator_gap}</p>
              </div>

              {/* Sources */}
              {comp.sources && comp.sources.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/50">Sources</p>
                  <div className="flex flex-col gap-0.5">
                    {comp.sources.map((src, j) => (
                      <a key={j} href={src} target="_blank" rel="noopener noreferrer"
                        className="text-[10px] text-primary/70 hover:text-primary hover:underline truncate flex items-center gap-1">
                        <ExternalLink size={8} /> {src}
                      </a>
                    ))}
                  </div>
                </div>
              )}
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
        <div className="p-4 rounded-lg bg-accent/30 border border-accent space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 text-primary">
            <Sparkles size={11} /> 90-Day Differentiation Strategy
          </p>
          <div className="text-xs text-foreground/85 leading-relaxed prose prose-sm prose-headings:text-sm prose-headings:font-bold prose-headings:mt-3 prose-headings:mb-1 prose-p:my-1 prose-li:my-0.5 max-w-none">
            <ReactMarkdown>{refinement}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};
