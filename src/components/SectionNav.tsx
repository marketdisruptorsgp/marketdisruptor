import React, { useState } from "react";
import { ArrowRight, ChevronDown, ChevronRight as ChevronRightIcon, Plus } from "lucide-react";
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

/* ── Consistent Next Section button ──────────────────────── */
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

/* ── Prominent "Go to Next Step" button (step-level nav) ── */
export function NextStepButton({ stepNumber, label, onClick, color }: { stepNumber: number; label: string; onClick: () => void; color?: string }) {
  const bg = color || "hsl(var(--primary))";
  return (
    <div className="pt-6 pb-2">
      <div className="text-center mb-3">
        <span className="text-xs font-bold px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5" style={{ background: "hsl(142 70% 45% / 0.12)", color: "hsl(142 70% 35%)" }}>
          ✓ All sections in this step explored
        </span>
      </div>
      <button
        onClick={onClick}
        className="w-full flex items-center justify-center gap-3 text-base font-extrabold px-6 py-4 rounded-xl transition-all hover:opacity-90"
        style={{ background: bg, color: "white", boxShadow: `0 4px 20px ${bg.replace(")", " / 0.35)")}` }}
      >
        <span className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-black" style={{ background: "rgba(255,255,255,0.25)" }}>{stepNumber}</span>
        Go to Step {stepNumber}: {label}
        <ArrowRight size={18} />
      </button>
    </div>
  );
}

/* ── Collapsible detail panel — PROMINENT ──────────────────────── */
export function DetailPanel({ title, icon: Icon, children, defaultOpen = false }: { title: string; icon: React.ElementType; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-lg text-left transition-all group"
        style={{
          background: open ? "hsl(var(--primary) / 0.06)" : "hsl(var(--primary) / 0.03)",
          border: open ? "1.5px solid hsl(var(--primary) / 0.3)" : "1.5px dashed hsl(var(--primary) / 0.25)",
        }}
      >
        <span className="flex items-center gap-2 text-xs font-bold" style={{ color: "hsl(var(--primary))" }}>
          <Icon size={14} />
          {title}
        </span>
        <span className="flex items-center gap-1.5">
          {!open && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}>
              Tap to expand
            </span>
          )}
          <ChevronDown size={16} className="transition-transform" style={{ color: "hsl(var(--primary))", transform: open ? "rotate(180deg)" : "rotate(0deg)" }} />
        </span>
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
