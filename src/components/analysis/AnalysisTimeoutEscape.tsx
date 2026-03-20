/**
 * Shared timeout escape UI — shows retry + back buttons when analysis hangs.
 * Used by DisruptPage, RedesignPage, StressTestPage, PitchPage.
 */
import { memo } from "react";
import { useNavigate } from "react-router-dom";

interface AnalysisTimeoutEscapeProps {
  analysisId?: string | null;
  onRetry: () => void;
  backPath?: string;
  backLabel?: string;
  message?: string;
}

export const AnalysisTimeoutEscape = memo(function AnalysisTimeoutEscape({
  analysisId,
  onRetry,
  backPath,
  backLabel = "Back to Report",
  message = "Analysis is taking longer than expected.",
}: AnalysisTimeoutEscapeProps) {
  const navigate = useNavigate();

  return (
    <div className="text-center space-y-3 py-6">
      <p className="text-sm font-semibold text-foreground">{message}</p>
      <p className="text-xs text-muted-foreground">
        The pipeline may have encountered an issue. You can retry or continue exploring other sections.
      </p>
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={onRetry}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity active:scale-[0.97]"
        >
          Retry Analysis
        </button>
        <button
          onClick={() => navigate(backPath || `/analysis/${analysisId}/report`)}
          className="px-4 py-2 rounded-lg bg-muted text-foreground text-xs font-semibold hover:bg-muted/80 transition-colors border border-border active:scale-[0.97]"
        >
          {backLabel}
        </button>
      </div>
    </div>
  );
});
