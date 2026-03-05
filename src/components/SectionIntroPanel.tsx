import React from "react";
import type { LucideIcon } from "lucide-react";

interface SectionIntroPanelProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  children?: React.ReactNode;
}

export function SectionIntroPanel({ title, description, icon: Icon, children }: SectionIntroPanelProps) {
  return (
    <div
      className="rounded-xl p-6 flex items-start gap-4 bg-card border border-border"
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: "hsl(var(--primary) / 0.15)" }}
      >
        <Icon size={18} className="text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{description}</p>
        )}
        {children}
      </div>
    </div>
  );
}
