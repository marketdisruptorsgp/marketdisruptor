import React, { useState } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";

/* ── Section progress header ──────────────────────── */
export function SectionHeader({ current, total, label, icon: Icon }: { current: number; total: number; label: string; icon: React.ElementType }) {
  return (
    <div className="flex items-center justify-between pb-3 mb-3" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--primary))" }}>
          <Icon size={14} style={{ color: "white" }} />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground leading-tight">{label}</p>
          <p className="text-[10px] text-muted-foreground font-medium">Section {current} of {total}</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {Array.from({ length: total }, (_, i) => (
          <div key={i} className="rounded-full transition-all" style={{
            width: i + 1 === current ? 16 : 6,
            height: 6,
            background: i + 1 <= current ? "hsl(var(--primary))" : "hsl(var(--border))",
            borderRadius: 999,
          }} />
        ))}
      </div>
    </div>
  );
}

/* ── Consistent Next button ──────────────────────── */
export function NextSectionButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-center gap-2 text-sm font-bold px-5 py-3.5 rounded-lg transition-colors mt-5"
      style={{ background: "hsl(var(--primary))", color: "white" }}
    >
      Next: {label} <ArrowRight size={14} />
    </button>
  );
}

/* ── Collapsible detail panel ──────────────────────── */
export function DetailPanel({ title, icon: Icon, children, defaultOpen = false }: { title: string; icon: React.ElementType; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-lg text-left transition-colors hover:bg-muted/50" style={{ background: open ? "hsl(var(--muted))" : "transparent", border: "1px solid hsl(var(--border))" }}>
        <span className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <Icon size={13} style={{ color: "hsl(var(--primary))" }} />
          {title}
        </span>
        <ChevronDown size={14} className="text-muted-foreground transition-transform" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }} />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pt-3 pb-1">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

/* ── Pill-style section selector ──────────────────── */
export function SectionPills<T extends string>({ 
  steps, 
  activeId, 
  visitedIds, 
  onSelect 
}: { 
  steps: { id: T; label: string; icon: React.ElementType }[]; 
  activeId: T; 
  visitedIds: Set<string>; 
  onSelect: (id: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {steps.map((s, i) => {
        const Icon = s.icon;
        const isActive = activeId === s.id;
        const isVisited = visitedIds.has(s.id);
        return (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
            style={{
              background: isActive ? "hsl(var(--primary))" : "transparent",
              color: isActive ? "white" : isVisited ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
              border: isActive ? "1px solid hsl(var(--primary))" : "1px solid hsl(var(--border))",
            }}
          >
            <Icon size={12} />
            <span className="hidden sm:inline">{s.label}</span>
            <span className="sm:hidden">{i + 1}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ── "All sections explored" badge ────────────────── */
export function AllExploredBadge() {
  return (
    <div className="text-center py-4">
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold" style={{ background: "hsl(142 70% 45% / 0.1)", color: "hsl(142 70% 30%)", border: "1px solid hsl(142 70% 45% / 0.25)" }}>
        ✓ All sections explored!
      </div>
    </div>
  );
}
