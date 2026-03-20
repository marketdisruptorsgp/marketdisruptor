import { AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SyntheticBadgeProps {
  className?: string;
}

/** Amber badge indicating this item is AI-generated filler, not evidence-grounded. */
export function SyntheticBadge({ className = "" }: SyntheticBadgeProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex-shrink-0 ${className}`}
            style={{
              background: "hsl(38 92% 50% / 0.12)",
              color: "hsl(38 92% 50%)",
              border: "1px solid hsl(38 92% 50% / 0.25)",
            }}
          >
            <AlertTriangle size={9} />
            Placeholder
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[240px]">
          <p className="text-xs leading-relaxed">
            This item was generated as a structural placeholder — not derived from your specific data. Treat as a starting point, not a finding.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/** Section-level banner for thin/early data */
export function ThinDataBanner() {
  return (
    <div
      className="flex items-center gap-2.5 px-4 py-3 rounded-xl"
      style={{
        background: "hsl(38 92% 50% / 0.08)",
        border: "1.5px solid hsl(38 92% 50% / 0.2)",
      }}
    >
      <AlertTriangle size={14} style={{ color: "hsl(38 92% 50%)" }} />
      <p className="text-xs font-semibold text-foreground">
        Preliminary analysis — full results loading.
        <span className="font-normal text-muted-foreground ml-1">
          Some items are structural placeholders that will be replaced with evidence-grounded insights.
        </span>
      </p>
    </div>
  );
}
