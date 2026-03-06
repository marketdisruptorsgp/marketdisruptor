import { TrendingUp, TrendingDown, Minus, GitCompare } from "lucide-react";

interface VersionComparisonProps {
  analysisData: Record<string, unknown> | null;
  accentColor?: string;
}

interface ScoreDelta {
  label: string;
  previous: number;
  current: number;
}

function extractScoreDeltas(data: Record<string, unknown> | null): ScoreDelta[] {
  if (!data) return [];
  const prev = data.previousSnapshot as Record<string, unknown> | undefined;
  if (!prev) return [];

  const deltas: ScoreDelta[] = [];

  // Compare user scores
  const prevScores = prev.userScores as Record<string, Record<string, number>> | undefined;
  const currScores = data.userScores as Record<string, Record<string, number>> | undefined;
  if (prevScores && currScores) {
    for (const ideaId of Object.keys(currScores)) {
      const prevIdea = prevScores[ideaId];
      const currIdea = currScores[ideaId];
      if (prevIdea && currIdea) {
        for (const key of Object.keys(currIdea)) {
          if (prevIdea[key] !== undefined && prevIdea[key] !== currIdea[key]) {
            deltas.push({
              label: `${key}`,
              previous: prevIdea[key],
              current: currIdea[key],
            });
          }
        }
      }
    }
  }

  return deltas.slice(0, 8);
}

function extractTextChanges(data: Record<string, unknown> | null): { step: string; hasChanged: boolean }[] {
  if (!data) return [];
  const prev = data.previousSnapshot as Record<string, unknown> | undefined;
  if (!prev) return [];

  const steps = ["disrupt", "redesign", "stressTest", "pitchDeck"];
  return steps.map(step => ({
    step: step === "stressTest" ? "Stress Test" : step === "pitchDeck" ? "Pitch Deck" : step.charAt(0).toUpperCase() + step.slice(1),
    hasChanged: !!prev[step] && !!data[step] && JSON.stringify(prev[step]) !== JSON.stringify(data[step]),
  })).filter(s => s.hasChanged);
}

export function VersionComparison({ analysisData, accentColor = "hsl(var(--primary))" }: VersionComparisonProps) {
  const deltas = extractScoreDeltas(analysisData);
  const textChanges = extractTextChanges(analysisData);

  if (deltas.length === 0 && textChanges.length === 0) {
    return (
      <div className="p-4 rounded-lg text-center" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
        <GitCompare size={20} className="mx-auto mb-2 text-muted-foreground opacity-40" />
        <p className="text-xs text-muted-foreground">No version history yet. Re-run a step to start tracking changes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Score deltas */}
      {deltas.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Score Changes</p>
          <div className="grid grid-cols-2 gap-2">
            {deltas.map((d, i) => {
              const diff = d.current - d.previous;
              const isUp = diff > 0;
              const isDown = diff < 0;
              return (
                <div
                  key={i}
                  className="p-2.5 rounded-lg flex items-center gap-2"
                  style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}
                >
                  {isUp ? (
                    <TrendingUp size={12} style={{ color: "hsl(142 70% 40%)" }} />
                  ) : isDown ? (
                    <TrendingDown size={12} style={{ color: "hsl(var(--destructive))" }} />
                  ) : (
                    <Minus size={12} className="text-muted-foreground" />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{d.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {d.previous} → {d.current}
                      <span
                        className="ml-1 font-bold"
                        style={{ color: isUp ? "hsl(142 70% 40%)" : isDown ? "hsl(var(--destructive))" : "hsl(var(--muted-foreground))" }}
                      >
                        ({isUp ? "+" : ""}{diff})
                      </span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Step changes */}
      {textChanges.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Updated Steps</p>
          <div className="flex flex-wrap gap-1.5">
            {textChanges.map((c, i) => (
              <span
                key={i}
                className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: `${accentColor}14`, color: accentColor }}
              >
                {c.step} Updated
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
