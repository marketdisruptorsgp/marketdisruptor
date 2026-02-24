import React from "react";
import { Sparkles } from "lucide-react";

interface SteeringPanelProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
}

export function SteeringPanel({ title = "Guide the AI", description, children }: SteeringPanelProps) {
  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        background: "hsl(var(--muted))",
        border: "1.5px solid hsl(var(--border))",
      }}
    >
      <div className="px-4 py-2.5 flex items-center gap-2" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
        <Sparkles size={13} className="text-primary flex-shrink-0" />
        <div>
          <p className="text-xs font-bold text-foreground">{title}</p>
          {description && <p className="text-[10px] text-muted-foreground">{description}</p>}
        </div>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}
