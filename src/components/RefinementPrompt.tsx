import React, { useState } from "react";
import { RefreshCw, Sparkles, ChevronDown, ChevronUp } from "lucide-react";

interface RefinementPromptProps {
  stepLabel: string;
  accentColor: string;
  onRefine: (userPrompt: string) => void;
  isLoading?: boolean;
}

export function RefinementPrompt({ stepLabel, accentColor, onRefine, isLoading }: RefinementPromptProps) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");

  const handleSubmit = () => {
    if (!prompt.trim()) return;
    onRefine(prompt.trim());
  };

  return (
    <div
      className="rounded-lg overflow-hidden transition-all"
      style={{
        border: `1px solid ${accentColor}30`,
        borderLeft: `3px solid ${accentColor}`,
        background: `${accentColor}08`,
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <Sparkles size={14} style={{ color: accentColor }} />
          <span className="text-xs font-bold" style={{ color: accentColor }}>
            Refine This {stepLabel}
          </span>
          <span className="text-[10px] text-muted-foreground">
            — Tell the AI what to focus on and regenerate
          </span>
        </div>
        {open ? (
          <ChevronUp size={14} className="text-muted-foreground" />
        ) : (
          <ChevronDown size={14} className="text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={`e.g. "Focus more on pricing strategy" or "Include sustainability angle" or "Make the disruption ideas more actionable"`}
            className="w-full text-sm rounded-lg px-3 py-2.5 min-h-[80px] resize-none focus:outline-none focus:ring-2"
            style={{
              background: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
              color: "hsl(var(--foreground))",
            }}
          />
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-muted-foreground">
              Your guidance shapes the AI's next pass — be specific for best results.
            </p>
            <button
              onClick={handleSubmit}
              disabled={isLoading || !prompt.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
              style={{
                background: accentColor,
                color: "white",
              }}
            >
              {isLoading ? (
                <RefreshCw size={12} className="animate-spin" />
              ) : (
                <RefreshCw size={12} />
              )}
              Regenerate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
