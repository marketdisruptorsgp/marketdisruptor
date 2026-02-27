import React from "react";
import { Check, X } from "lucide-react";

export interface InsightPreference {
  id: string;
  text: string;
  section: string;
  status: "liked" | "dismissed" | "neutral";
}

interface InsightSelectorProps {
  /** Unique ID for this insight */
  insightId: string;
  /** Current status */
  status: "liked" | "dismissed" | "neutral";
  /** Callback when user changes preference */
  onToggle: (id: string, status: "liked" | "dismissed" | "neutral") => void;
  /** Optional compact mode */
  compact?: boolean;
}

/**
 * Highlight + Dismiss control for individual insights.
 * Liked = green border highlight, Dismissed = faded with strikethrough.
 */
export function InsightSelector({ insightId, status, onToggle, compact }: InsightSelectorProps) {
  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle(insightId, status === "liked" ? "neutral" : "liked");
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggle(insightId, status === "dismissed" ? "neutral" : "dismissed");
  };

  return (
    <div className={`inline-flex items-center gap-1 ${compact ? "" : "ml-2"}`}>
      <button
        onClick={handleLike}
        title={status === "liked" ? "Remove highlight" : "Highlight — include in downstream analysis"}
        className="p-1 rounded-md transition-all"
        style={{
          background: status === "liked" ? "hsl(142 70% 45% / 0.15)" : "transparent",
          color: status === "liked" ? "hsl(142 70% 35%)" : "hsl(var(--muted-foreground))",
          border: status === "liked" ? "1px solid hsl(142 70% 45% / 0.3)" : "1px solid transparent",
        }}
      >
        <Check size={compact ? 12 : 14} strokeWidth={2.5} />
      </button>
      <button
        onClick={handleDismiss}
        title={status === "dismissed" ? "Restore" : "Dismiss — exclude from downstream analysis"}
        className="p-1 rounded-md transition-all"
        style={{
          background: status === "dismissed" ? "hsl(var(--destructive) / 0.1)" : "transparent",
          color: status === "dismissed" ? "hsl(var(--destructive))" : "hsl(var(--muted-foreground))",
          border: status === "dismissed" ? "1px solid hsl(var(--destructive) / 0.25)" : "1px solid transparent",
        }}
      >
        <X size={compact ? 12 : 14} strokeWidth={2.5} />
      </button>
    </div>
  );
}

/**
 * Wrapper that applies visual treatment to a child based on preference status.
 * Wrap any insight row/card with this to get highlight or dismiss styling.
 */
export function InsightSelectableRow({
  insightId,
  status,
  onToggle,
  children,
}: {
  insightId: string;
  status: "liked" | "dismissed" | "neutral";
  onToggle: (id: string, status: "liked" | "dismissed" | "neutral") => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative group flex items-start gap-2 rounded-lg px-3 py-2 transition-all"
      style={{
        background:
          status === "liked"
            ? "hsl(142 70% 45% / 0.06)"
            : status === "dismissed"
            ? "hsl(var(--muted) / 0.5)"
            : "transparent",
        borderLeft:
          status === "liked"
            ? "3px solid hsl(142 70% 45%)"
            : status === "dismissed"
            ? "3px solid hsl(var(--destructive) / 0.3)"
            : "3px solid transparent",
        opacity: status === "dismissed" ? 0.5 : 1,
        textDecoration: status === "dismissed" ? "line-through" : "none",
      }}
    >
      <div className="flex-1 min-w-0">{children}</div>
      <div className="flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
        <InsightSelector insightId={insightId} status={status} onToggle={onToggle} compact />
      </div>
    </div>
  );
}
