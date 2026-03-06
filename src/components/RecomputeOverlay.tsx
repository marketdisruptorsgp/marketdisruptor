/**
 * RECOMPUTE OVERLAY — Inline progress indicator for in-place recomputation.
 * Shows as a subtle banner at the top of the current workspace.
 */

import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface RecomputeOverlayProps {
  isActive: boolean;
  message?: string;
}

export const RecomputeOverlay = memo(function RecomputeOverlay({
  isActive, message = "Updating strategic intelligence…",
}: RecomputeOverlayProps) {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="rounded-xl px-4 py-3 flex items-center gap-3 border border-primary/20 bg-primary/[0.04]"
        >
          <RefreshCw size={14} className="text-primary animate-spin flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-foreground">{message}</p>
            <div className="mt-1.5">
              <Progress value={60} className="h-1" />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
