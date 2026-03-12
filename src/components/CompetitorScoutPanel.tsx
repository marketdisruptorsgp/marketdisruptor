import { useState, useEffect, useRef } from "react";
import { Search, ExternalLink, Crosshair, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { invokeWithTimeout } from "@/lib/invokeWithTimeout";
import { toast } from "sonner";

export interface Competitor {
  name: string;
  url: string;
  description: string;
  competition_score: number;
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
  const [expanded, setExpanded] = useState(false);
  const autoScoutTriggered = useRef(false);

  const handleScout = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await invokeWithTimeout("scout-competitors", {
        body: { ideaName, ideaDescription, category },
      }, 30_000);

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Scouting failed");

      setCompetitors(data.competitors || []);
      setHasScouted(true);
      onCompetitorsScouted?.(data.competitors || []);

      if (data.competitors?.length === 0) {
        toast.info("No direct competitors found — possible blue ocean!");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to scout competitors");
      setHasScouted(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (autoScout && !autoScoutTriggered.current && !hasScouted && !isLoading) {
      autoScoutTriggered.current = true;
      handleScout();
    }
  }, [autoScout]); // eslint-disable-line react-hooks/exhaustive-deps

  const getScoreColor = (score: number) => {
    if (score >= 8) return "hsl(0 72% 48%)";
    if (score >= 5) return "hsl(38 92% 50%)";
    return "hsl(142 70% 40%)";
  };

  if (isLoading && !hasScouted) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
        <Loader2 size={14} className="animate-spin text-primary" />
        <span className="text-xs font-semibold text-muted-foreground">Scouting competitors…</span>
      </div>
    );
  }

  if (!hasScouted) {
    return (
      <button
        type="button"
        onClick={handleScout}
        disabled={isLoading}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all w-full justify-center bg-accent text-accent-foreground border border-border"
      >
        <Search size={12} />
        Scout Competitors
      </button>
    );
  }

  if (competitors.length === 0) {
    return (
      <div className="p-3 rounded-lg bg-muted/50 border border-border text-center">
        <p className="text-xs text-muted-foreground">No direct competitors found — possible blue ocean!</p>
        <button onClick={handleScout} className="text-xs text-primary underline mt-1">Try again</button>
      </div>
    );
  }

  return (
    <div className="space-y-2 pt-2 border-t border-border">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full"
      >
        <p className="typo-card-eyebrow flex items-center gap-1">
          <Crosshair size={11} /> Competitors ({competitors.length})
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); handleScout(); }}
            disabled={isLoading}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            {isLoading ? <Loader2 size={10} className="animate-spin" /> : <Search size={10} />}
            Re-scout
          </button>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {/* Compact summary — always visible */}
      <div className="flex flex-wrap gap-1.5">
        {competitors.map((comp, i) => (
          <a
            key={i}
            href={comp.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-border bg-card hover:bg-muted transition-colors"
            title={comp.description}
          >
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: getScoreColor(comp.competition_score) }}
            />
            {comp.name}
            <span className="text-muted-foreground text-[10px]">{comp.competition_score}/10</span>
          </a>
        ))}
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="space-y-2">
          {competitors.map((comp, i) => (
            <div key={i} className="p-2.5 rounded-lg border border-border bg-card space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">{comp.name}</span>
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{
                    background: `${getScoreColor(comp.competition_score)}15`,
                    color: getScoreColor(comp.competition_score),
                  }}
                >
                  {comp.competition_score}/10
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{comp.description}</p>
              <a
                href={comp.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <ExternalLink size={10} /> {comp.url}
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
