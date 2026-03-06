/**
 * Scan Mode Toggle
 * 
 * Switches between visual-first "Scan" view and full "Deep Analysis" view.
 * Used in the analysis page toolbar.
 */

import { Eye, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

interface ScanModeToggleProps {
  mode: "scan" | "deep";
  onChange: (mode: "scan" | "deep") => void;
}

export function ScanModeToggle({ mode, onChange }: ScanModeToggleProps) {
  return (
    <div
      className="flex items-center rounded-lg p-0.5 gap-0.5"
      style={{
        background: "hsl(var(--muted))",
        border: "1px solid hsl(var(--border))",
      }}
    >
      <button
        onClick={() => onChange("scan")}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all relative"
        style={{
          background: mode === "scan" ? "hsl(var(--primary))" : "transparent",
          color: mode === "scan" ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
        }}
      >
        <Eye size={12} />
        Scan
        {mode === "scan" && (
          <motion.div
            layoutId="scan-indicator"
            className="absolute inset-0 rounded-md"
            style={{ background: "hsl(var(--primary))", zIndex: -1 }}
          />
        )}
      </button>
      <button
        onClick={() => onChange("deep")}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all relative"
        style={{
          background: mode === "deep" ? "hsl(var(--primary))" : "transparent",
          color: mode === "deep" ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
        }}
      >
        <BookOpen size={12} />
        Deep Analysis
      </button>
    </div>
  );
}
