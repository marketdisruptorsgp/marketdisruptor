import { useState } from "react";
import { X, Lightbulb } from "lucide-react";

interface ContextualTipProps {
  id: string;
  message: string;
  color?: string;
}

const DISMISSED_KEY = "dismissed_tips";

function getDismissed(): string[] {
  try { return JSON.parse(localStorage.getItem(DISMISSED_KEY) || "[]"); } catch { return []; }
}

function dismiss(id: string) {
  const prev = getDismissed();
  localStorage.setItem(DISMISSED_KEY, JSON.stringify([...prev, id]));
}

export function ContextualTip({ id, message, color = "hsl(var(--primary))" }: ContextualTipProps) {
  const [dismissed, setDismissed] = useState(() => getDismissed().includes(id));

  if (dismissed) return null;

  return (
    <div
      className="flex items-start gap-3 px-4 py-3 rounded-xl text-xs"
      style={{
        background: `${color}0D`,
        border: `1px solid ${color}25`,
      }}
    >
      <Lightbulb size={13} className="flex-shrink-0 mt-0.5" style={{ color }} />
      <p className="flex-1 leading-relaxed" style={{ color: "hsl(var(--foreground))" }}>{message}</p>
      <button
        onClick={() => { dismiss(id); setDismissed(true); }}
        className="flex-shrink-0 p-0.5 rounded hover:opacity-70 transition-opacity"
      >
        <X size={11} style={{ color: "hsl(var(--muted-foreground))" }} />
      </button>
    </div>
  );
}
