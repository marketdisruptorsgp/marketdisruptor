/**
 * ExecutiveSummary — One-paragraph CEO brief
 * 
 * Synthesizes verdict, constraint, opportunity, and kill question
 * into a single scannable paragraph. 30-second read max.
 */

import { memo } from "react";
import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import type { StrategicNarrative } from "@/lib/strategicEngine";

interface ExecutiveSummaryProps {
  narrative: StrategicNarrative | null;
  modeAccent: string;
}

export const ExecutiveSummary = memo(function ExecutiveSummary({
  narrative,
  modeAccent,
}: ExecutiveSummaryProps) {
  const summary = narrative?.executiveSummary;
  if (!summary) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 }}
      className="rounded-xl px-4 sm:px-5 py-3.5"
      style={{
        background: "hsl(var(--card))",
        border: "1px solid hsl(var(--border))",
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <FileText size={12} style={{ color: modeAccent }} />
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
          Executive Summary
        </span>
      </div>
      <p className="text-sm leading-relaxed text-foreground/90">
        {summary}
      </p>
    </motion.div>
  );
});
