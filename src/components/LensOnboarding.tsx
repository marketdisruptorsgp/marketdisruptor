import React, { useState } from "react";
import { Focus, X, Building2 } from "lucide-react";
import { LensEditor } from "@/components/LensEditor";
import { ETA_LENS } from "@/lib/etaLens";
import { useAnalysis } from "@/contexts/AnalysisContext";
import type { UserLens } from "@/components/LensToggle";

const STORAGE_KEY = "lens-onboarding-dismissed";

export function LensOnboarding() {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(STORAGE_KEY) === "true");
  const [showEditor, setShowEditor] = useState(false);
  const analysis = useAnalysis();

  if (dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setDismissed(true);
  };

  const handleActivateEta = () => {
    analysis.setActiveLens(ETA_LENS as UserLens);
    handleDismiss();
  };

  return (
    <>
      <div className="relative rounded-lg border border-primary/20 bg-primary/5 p-3 sm:p-4">
        <button onClick={handleDismiss} className="absolute top-2 right-2 p-1 rounded hover:bg-muted">
          <X size={14} className="text-muted-foreground" />
        </button>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Focus size={16} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="typo-card-title text-sm">Control how results are evaluated</p>
            <p className="typo-section-description text-xs mt-0.5">
              Choose a lens to reframe analysis. <strong>ETA Acquisition</strong> evaluates from an ownership perspective. Or create a <strong>Custom Lens</strong> to prioritize your own goals.
            </p>
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={handleActivateEta}
                className="px-3 py-1.5 rounded-md text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-colors inline-flex items-center gap-1.5"
              >
                <Building2 size={11} /> Try ETA Lens
              </button>
              <button
                onClick={() => setShowEditor(true)}
                className="px-3 py-1.5 rounded-md text-xs font-semibold bg-muted text-muted-foreground border border-border hover:bg-accent transition-colors"
              >
                Create Custom
              </button>
            </div>
          </div>
        </div>
      </div>

      {showEditor && (
        <LensEditor
          lens={null}
          onClose={() => setShowEditor(false)}
          onSaved={() => {
            setShowEditor(false);
            handleDismiss();
          }}
        />
      )}
    </>
  );
}
