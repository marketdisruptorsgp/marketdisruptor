import React from "react";
import { InfoExplainer } from "@/components/InfoExplainer";
import { Focus, Building2, Star } from "lucide-react";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { getLensType } from "@/lib/etaLens";

interface ModeHeaderProps {
  stepNumber: number;
  stepTitle: string;
  subtitle?: string;
  accentColor: string;
  actions?: React.ReactNode;
  explainerKey?: string;
}

export function ModeHeader({ stepNumber, stepTitle, subtitle, accentColor, actions, explainerKey }: ModeHeaderProps) {
  const analysis = useAnalysis();
  const lensType = getLensType(analysis.activeLens);
  const lensName = lensType === "eta" ? "ETA Acquisition" : lensType === "custom" ? (analysis.activeLens?.name || "Custom") : "Default";
  const LensIcon = lensType === "eta" ? Building2 : lensType === "custom" ? Star : Focus;
  const badgeColor = lensType === "eta" ? "hsl(142 70% 40%)" : lensType === "custom" ? "hsl(38 92% 50%)" : "hsl(var(--muted-foreground))";

  return (
    <div className="rounded" style={{ border: "1px solid hsl(var(--border))", borderLeft: `3px solid ${accentColor}` }}>
      <div className="px-3 sm:px-5 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4" style={{ background: "hsl(var(--card))" }}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span
            className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded flex items-center justify-center typo-button-secondary"
            style={{ background: accentColor, color: "white" }}
          >
            {stepNumber}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="typo-section-title">{stepTitle}</h2>
              {explainerKey && <InfoExplainer explainerKey={explainerKey} />}
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{ background: `${badgeColor}12`, color: badgeColor, border: `1px solid ${badgeColor}25` }}
              >
                <LensIcon size={9} />
                {lensName}
              </span>
            </div>
            {subtitle && (
              <p className="typo-section-description mt-0.5 truncate" dangerouslySetInnerHTML={{ __html: subtitle }} />
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
