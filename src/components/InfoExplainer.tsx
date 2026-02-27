import React from "react";
import { Info } from "lucide-react";
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
          className="inline-flex items-center justify-center w-5 h-5 rounded-full transition-all duration-200 opacity-40 hover:opacity-100 focus:opacity-100 flex-shrink-0"
          style={{
            color: "hsl(var(--muted-foreground))",
          }}
          aria-label="More info"
        >
          <Info size={14} strokeWidth={2} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[280px] p-4 typo-card-body leading-relaxed rounded-xl"
        style={{
          background: "hsl(var(--popover))",
          color: "hsl(var(--popover-foreground))",
          border: "1.5px solid hsl(var(--border))",
          boxShadow: "0 8px 30px -8px hsl(var(--foreground) / 0.12)",
        }}
        side="top"
        sideOffset={6}
      >
        {typeof content === "string" && /<[a-z][\s\S]*>/i.test(content) ? (
          <span dangerouslySetInnerHTML={{ __html: content }} />
        ) : (
          content
        )}
      </PopoverContent>
    </Popover>
  );
}
