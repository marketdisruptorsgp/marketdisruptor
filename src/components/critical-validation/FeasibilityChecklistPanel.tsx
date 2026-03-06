import { ClipboardCheck } from "lucide-react";
import {
  SignalCard, VisualGrid, ExpandableDetail, AnalysisPanel,
} from "@/components/analysis/AnalysisComponents";
import type { FeasibilityItem } from "./types";
import { STATUS_MAP } from "./types";

interface FeasibilityChecklistPanelProps {
  items: FeasibilityItem[];
}

export function FeasibilityChecklistPanel({ items }: FeasibilityChecklistPanelProps) {
  if (!items?.length) return null;

  return (
    <AnalysisPanel title="Feasibility Checklist" icon={ClipboardCheck} eyebrow="Validation">
      <VisualGrid columns={1}>
        {items.slice(0, 3).map((item, i) => (
          <SignalCard
            key={i}
            label={item.item}
            type={STATUS_MAP[item.status] || "neutral"}
            explanation={item.detail}
            detail={
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold" style={{ color: "hsl(var(--primary))" }}>Est. cost: {item.estimatedCost}</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-muted text-muted-foreground">{item.category}</span>
              </div>
            }
          />
        ))}
      </VisualGrid>
      {items.length > 3 && (
        <ExpandableDetail label={`${items.length - 3} more checklist items`} icon={ClipboardCheck}>
          <VisualGrid columns={1}>
            {items.slice(3).map((item, i) => (
              <SignalCard
                key={i}
                label={item.item}
                type={STATUS_MAP[item.status] || "neutral"}
                explanation={item.detail}
                detail={
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold" style={{ color: "hsl(var(--primary))" }}>Est. cost: {item.estimatedCost}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-muted text-muted-foreground">{item.category}</span>
                  </div>
                }
              />
            ))}
          </VisualGrid>
        </ExpandableDetail>
      )}
    </AnalysisPanel>
  );
}
