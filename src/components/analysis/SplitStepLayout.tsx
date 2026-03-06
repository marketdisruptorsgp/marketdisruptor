/**
 * SPLIT STEP LAYOUT
 * 
 * Full-width by default. Includes a "Visual Intelligence" toggle
 * that opens a right-side panel.
 * 
 * On mobile, panel stacks below content.
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, X } from "lucide-react";

interface SplitStepLayoutProps {
  children: React.ReactNode;
  visualOutput: React.ReactNode;
  showVisual?: boolean;
}

export function SplitStepLayout({ children, visualOutput, showVisual = true }: SplitStepLayoutProps) {
  const [panelOpen, setPanelOpen] = useState(false);

  if (!showVisual) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Toggle button — pinned top-right */}
      <div className="flex justify-end mb-3">
        <button
          onClick={() => setPanelOpen(o => !o)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors min-h-[36px] border border-border bg-card hover:bg-muted/60"
        >
          <Activity size={13} className="text-muted-foreground" />
          {panelOpen ? "Hide" : "Visual Intelligence"}
        </button>
      </div>

      <div className={`grid items-start gap-4 ${panelOpen ? "grid-cols-1 lg:grid-cols-[1fr_320px]" : "grid-cols-1"}`}>
        {/* Main content — always full-width when panel closed */}
        <div className="min-w-0 space-y-6">
          {children}
        </div>

        {/* Visual panel — animated */}
        <AnimatePresence>
          {panelOpen && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
              className="lg:sticky lg:top-4"
            >
              <div className="relative">
                <button
                  onClick={() => setPanelOpen(false)}
                  className="absolute top-2 right-2 w-6 h-6 rounded-md flex items-center justify-center hover:bg-muted/60 transition-colors z-10"
                >
                  <X size={12} className="text-muted-foreground" />
                </button>
                {visualOutput}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
