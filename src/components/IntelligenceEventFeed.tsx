/**
 * INTELLIGENCE EVENT FEED — Small floating activity log
 * Shows recent intelligence updates as ephemeral notifications.
 */

import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, X } from "lucide-react";

interface IntelligenceEventFeedProps {
  events: string[];
  onDismiss?: (index: number) => void;
  maxVisible?: number;
}

export const IntelligenceEventFeed = memo(function IntelligenceEventFeed({
  events, onDismiss, maxVisible = 3,
}: IntelligenceEventFeedProps) {
  if (events.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col gap-2 max-w-xs">
      <AnimatePresence>
        {events.slice(0, maxVisible).map((evt, i) => (
          <motion.div
            key={`${evt}-${i}`}
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.95 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-card border border-border shadow-lg backdrop-blur-sm"
          >
            <Activity size={13} className="text-primary flex-shrink-0 mt-0.5" />
            <p className="text-xs font-semibold text-foreground leading-snug flex-1">{evt}</p>
            {onDismiss && (
              <button onClick={() => onDismiss(i)} className="p-0.5 rounded hover:bg-muted transition-colors flex-shrink-0">
                <X size={10} className="text-muted-foreground" />
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
});
