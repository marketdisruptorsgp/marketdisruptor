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
      <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
        <Sparkles size={14} className="text-primary flex-shrink-0" />
        <div>
          <p className="typo-card-title">{title}</p>
          {description && <p className="typo-card-meta">{description}</p>}
        </div>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}
