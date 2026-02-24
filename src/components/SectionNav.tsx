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
        className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all hover:opacity-80"
        style={{ background: "hsl(var(--foreground))", color: "hsl(var(--background))", border: "none" }}
      >
        <Home size={14} /> Home
      </button>
      <button
        onClick={() => navigate(backPath)}
        className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all hover:opacity-80"
        style={{ background: `${color}`, color: "white", border: "none" }}
      >
        ← {backLabel}
      </button>
    </div>
  );
}

/* ── Section progress header with description ──────────────────────── */
export function SectionHeader({ current, total, label, description, icon: Icon }: { current: number; total: number; label: string; description?: string; icon: React.ElementType }) {
  return (
    <div className="flex items-center justify-between pb-3 mb-3" style={{ borderBottom: "2px solid hsl(var(--border))" }}>
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--foreground))" }}>
          <Icon size={15} style={{ color: "hsl(var(--background))" }} />
        </div>
        <div>
          <p className="text-sm font-extrabold text-foreground leading-tight">{label}</p>
          {description && (
            <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{description}</p>
          )}
          <p className="text-[10px] text-muted-foreground font-bold mt-0.5">Section {current} of {total}</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {Array.from({ length: total }, (_, i) => (
          <div key={i} className="rounded-full transition-all" style={{
            width: i + 1 === current ? 18 : 6,
            height: 6,
            background: i + 1 <= current ? "hsl(var(--foreground))" : "hsl(var(--border))",
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
      className="w-full flex items-center justify-center gap-2 text-sm font-bold py-3 rounded-full text-white transition-colors hover:opacity-90 mt-5"
      style={{ background: "hsl(var(--primary))" }}
    >
      Next: {label} <ArrowRight size={15} />
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
          <span className="text-xs font-extrabold px-4 py-2 rounded-lg inline-flex items-center gap-1.5" style={{ background: "hsl(38 92% 50% / 0.15)", color: "hsl(38 92% 30%)", border: "1px solid hsl(38 92% 50% / 0.3)" }}>
            ⚠ Visit all sections above to unlock next step
          </span>
        </div>
        <button
          disabled
          className="w-full flex items-center justify-center gap-2 text-sm font-bold py-3 rounded-full opacity-40 cursor-not-allowed"
          style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}
        >
          Go to Step {stepNumber}: {label}
          <ArrowRight size={15} />
        </button>
      </div>
    );
  }
  return (
    <div className="pt-6 pb-2">
      <div className="text-center mb-3">
        <span className="text-xs font-extrabold px-4 py-2 rounded-lg inline-flex items-center gap-1.5" style={{ background: "hsl(142 70% 45% / 0.12)", color: "hsl(142 70% 30%)", border: "1px solid hsl(142 70% 45% / 0.3)" }}>
          ✓ All sections explored — ready for next step
        </span>
      </div>
      <button
        onClick={onClick}
        className="w-full flex items-center justify-center gap-2 text-sm font-bold py-3 rounded-full text-white transition-colors hover:opacity-90"
        style={{ background: bg }}
      >
        Go to Step {stepNumber}: {label}
        <ArrowRight size={15} />
      </button>
    </div>
  );
}

/* ── Collapsible detail panel — HIGH CONTRAST ──────────────────────── */
export function DetailPanel({ title, icon: Icon, children, defaultOpen = false }: { title: string; icon: React.ElementType; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        className="w-full flex items-center justify-between gap-2 px-4 py-4 rounded-xl text-left transition-all group cursor-pointer"
        style={{
          background: open ? "hsl(var(--foreground) / 0.04)" : "hsl(var(--foreground) / 0.02)",
          border: open ? "2px solid hsl(var(--foreground) / 0.2)" : "2px dashed hsl(var(--foreground) / 0.25)",
        }}
      >
        <span className="flex items-center gap-2.5 text-xs font-extrabold" style={{ color: "hsl(var(--foreground))" }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--foreground) / 0.1)" }}>
            <Icon size={13} style={{ color: "hsl(var(--foreground))" }} />
          </div>
          {title}
        </span>
        <span className="flex items-center gap-2">
          {!open && (
            <span className="text-[10px] font-extrabold px-3 py-1.5 rounded-full animate-pulse" style={{ background: "hsl(var(--foreground))", color: "hsl(var(--background))" }}>
              ▸ Tap to expand
            </span>
          )}
          <ChevronDown size={16} className="transition-transform" style={{ color: "hsl(var(--foreground))", transform: open ? "rotate(180deg)" : "rotate(0deg)" }} />
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pt-3 pb-1">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

/* ── Pill-style section selector — HIGH CONTRAST ──────────────────── */
export function SectionPills<T extends string>({ 
  steps, 
  activeId, 
  visitedIds, 
  onSelect 
}: { 
  steps: { id: T; label: string; description?: string; icon: React.ElementType }[]; 
  activeId: T; 
  visitedIds: Set<string>; 
  onSelect: (id: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {steps.map((s) => {
        const Icon = s.icon;
        const isActive = activeId === s.id;
        const isVisited = visitedIds.has(s.id);
        return (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold transition-all relative"
            style={{
              background: isActive ? "hsl(var(--foreground))" : isVisited ? "hsl(var(--foreground) / 0.05)" : "transparent",
              color: isActive ? "hsl(var(--background))" : isVisited ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
              border: isActive ? "1.5px solid hsl(var(--foreground))" : isVisited ? "1.5px solid hsl(var(--foreground) / 0.15)" : "1.5px dashed hsl(var(--border))",
            }}
          >
            {!isActive && !isVisited && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: "hsl(var(--primary))" }} />
            )}
            <Icon size={12} />
            {s.label}
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
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-extrabold" style={{ background: "hsl(142 70% 45% / 0.1)", color: "hsl(142 70% 25%)", border: "1.5px solid hsl(142 70% 45% / 0.3)" }}>
        ✓ All sections explored!
      </div>
    </div>
  );
}
