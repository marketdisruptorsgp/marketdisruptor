/**
 * SPLIT STEP LAYOUT
 * 
 * Wraps step content in a two-column layout:
 * LEFT: User input / thinking fields (main content)
 * RIGHT: Visual intelligence output (auto-generated)
 * 
 * On mobile, stacks vertically with visual output on top.
 */

import React from "react";

interface SplitStepLayoutProps {
  /** Main step content (inputs, prompts, etc.) */
  children: React.ReactNode;
  /** Visual output panel (right side) */
  visualOutput: React.ReactNode;
  /** Whether to show the visual panel (hides when no data) */
  showVisual?: boolean;
}

export function SplitStepLayout({ children, visualOutput, showVisual = true }: SplitStepLayoutProps) {
  if (!showVisual) {
    return <>{children}</>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 items-start">
      {/* LEFT: Main content */}
      <div className="min-w-0 space-y-6 order-2 lg:order-1">
        {children}
      </div>

      {/* RIGHT: Visual output (sticky on desktop) */}
      <div className="order-1 lg:order-2 lg:sticky lg:top-4">
        {visualOutput}
      </div>
    </div>
  );
}
