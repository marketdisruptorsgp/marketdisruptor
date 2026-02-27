import React from "react";
import { HelpCircle } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { EXPLAINERS } from "@/lib/explainers";

interface InfoExplainerProps {
  explainerKey?: string;
  text?: string;
}

export function InfoExplainer({ explainerKey, text }: InfoExplainerProps) {
  const content = text || (explainerKey ? EXPLAINERS[explainerKey] : null);
  if (!content) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center w-7 h-7 rounded-full transition-colors flex-shrink-0"
          style={{
            background: "hsl(var(--foreground))",
            color: "hsl(var(--background))",
          }}
          aria-label="More info"
        >
          <HelpCircle size={15} strokeWidth={2.5} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[280px] p-4 typo-card-body leading-relaxed"
        style={{
          background: "hsl(var(--popover))",
          color: "hsl(var(--popover-foreground))",
          border: "1.5px solid hsl(var(--border))",
          boxShadow: "0 8px 30px -8px hsl(var(--foreground) / 0.15)",
        }}
        side="top"
        sideOffset={6}
      >
        {content}
      </PopoverContent>
    </Popover>
  );
}
