import React, { useState } from "react";
import { Focus, X } from "lucide-react";
import { LensEditor } from "@/components/LensEditor";

const STORAGE_KEY = "lens-onboarding-dismissed";

export function LensOnboarding() {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(STORAGE_KEY) === "true");
  const [showEditor, setShowEditor] = useState(false);

  if (dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setDismissed(true);
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
            <p className="typo-card-title text-sm">Want results ranked for YOU?</p>
            <p className="typo-section-description text-xs mt-0.5">
              Add a custom lens to prioritize based on your goals, risk tolerance, and available resources.
            </p>
            <button
              onClick={() => setShowEditor(true)}
              className="mt-2 px-3 py-1.5 rounded-md text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-colors"
            >
              Create Lens
            </button>
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
