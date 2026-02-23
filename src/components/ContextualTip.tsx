import { useState } from "react";
import { X, Lightbulb } from "lucide-react";

interface ContextualTipProps {
  id: string;
  message: string;
  color?: string;
  accentColor?: string;
}

const DISMISSED_KEY = "dismissed_tips";

function getDismissed(): string[] {
  try { return JSON.parse(localStorage.getItem(DISMISSED_KEY) || "[]"); } catch { return []; }
}

function dismiss(id: string) {
  const prev = getDismissed();
  localStorage.setItem(DISMISSED_KEY, JSON.stringify([...prev, id]));
}

export function ContextualTip({ id, message, color = "hsl(var(--primary))", accentColor }: ContextualTipProps) {
  const [dismissed, setDismissed] = useState(() => getDismissed().includes(id));

  if (dismissed) return null;

  const accent = accentColor || color;

  return (
    <div
      className="flex items-start gap-3 px-5 py-4 rounded-md text-sm"
      style={{
        background: `linear-gradient(135deg, ${accent}0D, ${accent}06)`,
        border: `1px solid ${accent}20`,
        borderLeft: `3px solid ${accent}`,
      }}
    >
      <Lightbulb size={15} className="flex-shrink-0 mt-0.5" style={{ color: accent }} />
      <p className="flex-1 leading-relaxed" style={{ color: "hsl(var(--foreground))" }}>
        <span className="font-bold" style={{ color: accent }}>Pro tip: </span>
        {message}
      </p>
      <button
        onClick={() => { dismiss(id); setDismissed(true); }}
        className="flex-shrink-0 p-0.5 rounded hover:opacity-70 transition-opacity"
      >
        <X size={12} style={{ color: "hsl(var(--muted-foreground))" }} />
      </button>
    </div>
  );
}
