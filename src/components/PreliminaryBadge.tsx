import { Zap } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PreliminaryBadgeProps {
  className?: string;
}

export function PreliminaryBadge({ className = "" }: PreliminaryBadgeProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${className}`}
            style={{
              background: "hsl(38 92% 50% / 0.12)",
              color: "hsl(38 92% 50%)",
              border: "1px solid hsl(38 92% 50% / 0.25)",
            }}
          >
            <Zap size={9} />
            Preliminary
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[240px]">
          <p className="text-xs leading-relaxed">
            Early results from fast analysis. Full deep analysis is still running — these will be replaced with higher-fidelity insights automatically.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
