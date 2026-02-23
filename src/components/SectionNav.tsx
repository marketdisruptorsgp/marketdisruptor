import React, { useState } from "react";
import { ArrowRight, ChevronDown, Home } from "lucide-react";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { useNavigate } from "react-router-dom";

/* ── Consistent Back + Home bar ──────────────────── */
export function StepNavBar({ backLabel, backPath, accentColor }: { backLabel: string; backPath: string; accentColor?: string }) {
  const navigate = useNavigate();
  const color = accentColor || "hsl(var(--primary))";
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
        style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))" }}
      >
        <Home size={13} /> Home
      </button>
      <button
        onClick={() => navigate(backPath)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
        style={{ background: `${color}10`, color, border: `1px solid ${color}30` }}
      >
        ← {backLabel}
      </button>
    </div>
  );
}

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

/* ── Prominent "Go to Next Step" button — GATED ── */
export function NextStepButton({ stepNumber, label, onClick, color, allSectionsVisited = true }: { stepNumber: number; label: string; onClick: () => void; color?: string; allSectionsVisited?: boolean }) {
  const bg = color || "hsl(var(--primary))";
  if (!allSectionsVisited) {
    return (
      <div className="pt-6 pb-2">
        <div className="text-center mb-3">
          <span className="text-xs font-bold px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5" style={{ background: "hsl(38 92% 50% / 0.12)", color: "hsl(38 92% 35%)" }}>
            ⚠ Visit all sections above to unlock next step
          </span>
        </div>
        <button
          disabled
          className="w-full flex items-center justify-center gap-3 text-base font-extrabold px-6 py-4 rounded-xl opacity-40 cursor-not-allowed"
          style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))", border: "1px solid hsl(var(--border))" }}
        >
          <span className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-black" style={{ background: "hsl(var(--border))" }}>{stepNumber}</span>
          Go to Step {stepNumber}: {label}
          <ArrowRight size={18} />
        </button>
      </div>
    );
  }
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

/* ── Collapsible detail panel — VERY PROMINENT ──────────────────────── */
export function DetailPanel({ title, icon: Icon, children, defaultOpen = false }: { title: string; icon: React.ElementType; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        className="w-full flex items-center justify-between gap-2 px-4 py-3.5 rounded-xl text-left transition-all group"
        style={{
          background: open ? "hsl(var(--primary) / 0.08)" : "hsl(var(--primary) / 0.04)",
          border: open ? "2px solid hsl(var(--primary) / 0.4)" : "2px dashed hsl(var(--primary) / 0.3)",
        }}
      >
        <span className="flex items-center gap-2.5 text-xs font-extrabold" style={{ color: "hsl(var(--primary))" }}>
          <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "hsl(var(--primary) / 0.15)" }}>
            <Icon size={13} />
          </div>
          {title}
        </span>
        <span className="flex items-center gap-2">
          {!open && (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full animate-pulse" style={{ background: "hsl(var(--primary) / 0.15)", color: "hsl(var(--primary))" }}>
              ▸ Tap to expand
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
