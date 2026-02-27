import { Presentation, Check, X } from "lucide-react";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { useState, useEffect } from "react";

interface PitchDeckToggleProps {
  contentKey: string;
  label?: string;
  sublabel?: string;
}

export function PitchDeckToggle({ contentKey, label, sublabel }: PitchDeckToggleProps) {
  const { pitchDeckExclusions, togglePitchDeckExclusion } = useAnalysis();
  const isExcluded = pitchDeckExclusions.has(contentKey);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (showConfirm) {
      const t = setTimeout(() => setShowConfirm(false), 3000);
      return () => clearTimeout(t);
    }
  }, [showConfirm]);

  const handleToggle = () => {
    togglePitchDeckExclusion(contentKey);
    setShowConfirm(true);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleToggle}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
        style={{
          background: isExcluded ? "hsl(var(--muted))" : "hsl(var(--primary) / 0.12)",
          color: isExcluded ? "hsl(var(--muted-foreground))" : "hsl(var(--primary))",
          border: `1px solid ${isExcluded ? "hsl(var(--border))" : "hsl(var(--primary) / 0.25)"}`,
        }}
      >
        {isExcluded ? (
          <>
            <X size={11} />
            Excluded from Pitch Deck
          </>
        ) : (
          <>
            <Presentation size={11} />
            {label || "Included in Pitch Deck"}
          </>
        )}
      </button>
      {sublabel && (
        <span className="text-[10px] text-muted-foreground font-medium">{sublabel}</span>
      )}
      {showConfirm && (
        <span
          className="flex items-center gap-1 text-xs font-medium animate-in fade-in slide-in-from-left-2 duration-300"
          style={{ color: isExcluded ? "hsl(var(--muted-foreground))" : "hsl(var(--success))" }}
        >
          <Check size={11} />
          {isExcluded ? "Removed — won't appear in pitch deck" : "Exec summary will be added to pitch deck"}
        </span>
      )}
    </div>
  );
}
