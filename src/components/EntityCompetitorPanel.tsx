/**
 * EntityCompetitorPanel — Entity-level competitor discovery for BA mode.
 * Unlike CompetitorScoutPanel (which scouts per flipped idea), this discovers
 * actual competitors for the business entity itself using name + industry.
 */
import { useState, memo } from "react";
import { Search, ExternalLink, Crosshair, ChevronDown, ChevronUp, Loader2, Building2 } from "lucide-react";
import { invokeWithTimeout } from "@/lib/invokeWithTimeout";
import { toast } from "sonner";

export interface EntityCompetitor {
  name: string;
  url: string;
  description: string;
  competition_score: number;
  competitive_angle?: string;
}

interface EntityCompetitorPanelProps {
  businessName: string;
  industry?: string;
  geography?: string;
  services?: string[];
  onCompetitorsFound?: (competitors: EntityCompetitor[]) => void;
}

export const EntityCompetitorPanel = memo(function EntityCompetitorPanel({
  businessName,
  industry,
  geography,
  services,
  onCompetitorsFound,
}: EntityCompetitorPanelProps) {
  const [competitors, setCompetitors] = useState<EntityCompetitor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasScouted, setHasScouted] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const handleScout = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await invokeWithTimeout("scout-competitors", {
        body: {
          ideaName: businessName,
          ideaDescription: [
            industry ? `Industry: ${industry}` : "",
            geography ? `Location: ${geography}` : "",
            services?.length ? `Services: ${services.join(", ")}` : "",
            "Find direct business competitors — companies offering the same services in the same market.",
          ].filter(Boolean).join(". "),
          category: industry || "Business Services",
          steeringContext: `Find actual business competitors for "${businessName}", not similar concepts. Focus on companies in the same geographic market (${geography || "US"}) offering overlapping services.`,
        },
      }, 30_000);

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Scouting failed");

      const mapped: EntityCompetitor[] = (data.competitors || []).map((c: any) => ({
        name: c.name,
        url: c.url,
        description: c.description,
        competition_score: c.competition_score,
        competitive_angle: c.structural_overlap,
      }));

      setCompetitors(mapped);
      setHasScouted(true);
      onCompetitorsFound?.(mapped);

      if (mapped.length === 0) {
        toast.info("No direct competitors found — may indicate a local monopoly");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to scout competitors");
      setHasScouted(true);
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "hsl(var(--destructive))";
    if (score >= 5) return "hsl(var(--warning))";
    return "hsl(var(--score-high))";
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-primary/10">
            <Building2 size={14} className="text-primary" />
          </div>
          <div className="text-left">
            <span className="text-xs font-extrabold uppercase tracking-widest text-foreground">
              Competitive Landscape
            </span>
            {hasScouted && (
              <span className="text-[10px] font-bold text-muted-foreground ml-2">
                {competitors.length} competitor{competitors.length !== 1 ? "s" : ""} found
              </span>
            )}
          </div>
        </div>
        {expanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {!hasScouted && !isLoading && (
            <div className="text-center py-4">
              <p className="text-xs text-muted-foreground mb-3">
                Discover actual competitors for <strong className="text-foreground">{businessName}</strong> using web intelligence
              </p>
              <button
                onClick={handleScout}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              >
                <Search size={12} /> Scout Competitors
              </button>
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-4">
              <Loader2 size={14} className="animate-spin text-primary" />
              <span className="text-xs font-semibold text-muted-foreground">Searching competitive landscape…</span>
            </div>
          )}

          {hasScouted && competitors.length === 0 && !isLoading && (
            <div className="text-center py-4">
              <p className="text-xs text-muted-foreground mb-2">No direct competitors found — possible local monopoly or niche market</p>
              <button onClick={handleScout} className="text-xs text-primary hover:underline">Try again</button>
            </div>
          )}

          {competitors.length > 0 && (
            <div className="space-y-2">
              {competitors.map((comp, i) => (
                <div key={i} className="p-3 rounded-lg border border-border bg-background space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">{comp.name}</span>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: `${getScoreColor(comp.competition_score)}15`, color: getScoreColor(comp.competition_score) }}
                    >
                      Threat: {comp.competition_score}/10
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{comp.description}</p>
                  {comp.competitive_angle && (
                    <p className="text-[10px] font-medium text-primary/80 italic">⚙ {comp.competitive_angle}</p>
                  )}
                  <a
                    href={comp.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <ExternalLink size={10} /> Visit
                  </a>
                </div>
              ))}
              <button
                onClick={handleScout}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-primary hover:underline"
              >
                {isLoading ? <Loader2 size={10} className="animate-spin" /> : <Search size={10} />}
                Re-scout
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
});
