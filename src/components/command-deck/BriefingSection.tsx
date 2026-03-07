/**
 * BriefingSection — Collapsible progressive disclosure section
 * for the Command Deck strategic briefing interface.
 */

import { memo, useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp, type LucideIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BriefingSectionProps {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  defaultOpen?: boolean;
  /** Compact one-liner preview shown when collapsed */
  preview?: string | null;
  /** Number badge (e.g. item count) */
  badge?: number | null;
}

export const BriefingSection = memo(function BriefingSection({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
  preview,
  badge,
}: BriefingSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "hsl(var(--primary) / 0.08)" }}
          >
            <Icon size={14} className="text-primary" />
          </div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-foreground">
            {title}
          </span>
          {badge != null && badge > 0 && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}
            >
              {badge}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!open && preview && (
            <span className="text-[11px] text-muted-foreground max-w-[280px] truncate hidden sm:inline">
              {preview}
            </span>
          )}
          {open ? (
            <ChevronUp size={16} className="text-muted-foreground" />
          ) : (
            <ChevronDown size={16} className="text-muted-foreground" />
          )}
        </div>
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
            <div className="px-5 pb-4 space-y-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
