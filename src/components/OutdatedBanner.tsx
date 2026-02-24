import { AlertCircle, RefreshCw } from "lucide-react";

interface OutdatedBannerProps {
  stepName: string;
  onRegenerate?: () => void;
  accentColor?: string;
}

export function OutdatedBanner({ stepName, onRegenerate, accentColor }: OutdatedBannerProps) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-lg"
      style={{
        background: "hsl(38 92% 50% / 0.08)",
        border: "1px solid hsl(38 92% 50% / 0.3)",
      }}
    >
      <AlertCircle size={16} style={{ color: "hsl(38 92% 50%)", flexShrink: 0 }} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-foreground">
          Upstream data has changed
        </p>
        <p className="text-[11px] text-muted-foreground">
          Regenerate {stepName} to reflect your latest inputs and score adjustments.
        </p>
      </div>
      {onRegenerate && (
        <button
          onClick={onRegenerate}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex-shrink-0"
          style={{
            background: accentColor || "hsl(38 92% 50%)",
            color: "white",
          }}
        >
          <RefreshCw size={11} /> Regenerate
        </button>
      )}
    </div>
  );
}
