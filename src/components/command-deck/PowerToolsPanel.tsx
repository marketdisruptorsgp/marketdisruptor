/**
 * PowerToolsPanel — Tier 3: Advanced tools collapsed by default
 * Scenario Lab, Challenge Mode, Opportunity Map — behind an expander.
 */

import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wrench, ChevronDown, ChevronUp } from "lucide-react";

interface PowerToolsPanelProps {
  children: React.ReactNode;
  /** Count of tools available */
  toolCount?: number;
}

export const PowerToolsPanel = memo(function PowerToolsPanel({
  children,
  toolCount = 3,
}: PowerToolsPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-muted">
            <Wrench size={13} className="text-muted-foreground" />
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-foreground">Power Tools</p>
            <p className="text-[10px] text-muted-foreground">
              Scenario Lab, Challenge Mode, and {toolCount - 2} more
            </p>
          </div>
        </div>
        {open ? (
          <ChevronUp size={14} className="text-muted-foreground" />
        ) : (
          <ChevronDown size={14} className="text-muted-foreground" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 border-t border-border space-y-3">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
