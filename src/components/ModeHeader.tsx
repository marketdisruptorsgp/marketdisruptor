import React from "react";
import { InfoExplainer } from "@/components/InfoExplainer";

interface ModeHeaderProps {
  stepNumber: number;
  stepTitle: string;
  subtitle?: string;
  accentColor: string;
  actions?: React.ReactNode;
  explainerKey?: string;
}

export function ModeHeader({ stepNumber, stepTitle, subtitle, accentColor, actions, explainerKey }: ModeHeaderProps) {
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
            <div className="flex items-center gap-2">
              <h2 className="typo-section-title">{stepTitle}</h2>
              {explainerKey && <InfoExplainer explainerKey={explainerKey} />}
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
