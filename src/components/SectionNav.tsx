import React, { useState } from "react";
import { ArrowRight, ChevronDown, Home, CheckCircle2 } from "lucide-react";
import { scrollToTop } from "@/utils/scrollToTop";
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
      onClick={() => { onClick(); scrollToTop(); }}
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
          <span className="text-xs font-extrabold px-4 py-2 rounded-lg inline-flex items-center gap-1.5" style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))", border: "1px solid hsl(var(--border))" }}>
            Visit all sections above to unlock next step
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
        <span className="text-xs font-extrabold px-4 py-2 rounded-lg inline-flex items-center gap-1.5" style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))" }}>
          <CheckCircle2 size={14} style={{ color: "hsl(142 70% 40%)" }} /> Ready for next step
        </span>
      </div>
      <button
        onClick={() => { onClick(); scrollToTop(); }}
        className="w-full flex items-center justify-center gap-2 text-sm font-bold py-3 rounded-full text-white transition-colors hover:opacity-90"
        style={{ background: bg }}
      >
        Go to Step {stepNumber}: {label}
        <ArrowRight size={15} />
      </button>
    </div>
  );
}

/* ── Collapsible detail panel — Presentation style ──────────────────────── */
export function DetailPanel({ title, icon: Icon, children, defaultOpen = false }: { title: string; icon: React.ElementType; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        className="w-full flex items-center justify-between gap-3 px-5 py-3.5 rounded-2xl text-left transition-all group cursor-pointer"
        style={{
          background: "hsl(var(--card))",
          border: "1.5px solid hsl(var(--border))",
        }}
      >
        <span className="flex items-center gap-3 text-sm font-bold text-foreground">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "hsl(var(--primary) / 0.08)" }}>
            <Icon size={14} style={{ color: "hsl(var(--primary))" }} />
          </div>
          {title}
        </span>
        <span className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hidden sm:inline">Details</span>
          <ChevronDown size={14} className="transition-transform text-muted-foreground" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }} />
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="px-5 pt-3 pb-2">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}


/* ── "All sections explored" badge ────────────────── */
export function AllExploredBadge() {
  return (
    <div className="text-center py-4">
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-extrabold" style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))" }}>
        <CheckCircle2 size={14} style={{ color: "hsl(142 70% 40%)" }} /> All sections explored
      </div>
    </div>
  );
}

/* ── Reusable Section Workflow Navigator (grid cards) ────────────── */
export function SectionWorkflowNav<T extends string>({
  tabs,
  activeId,
  visitedIds,
  onSelect,
  descriptions,
  journeyLabel = "Your Analysis Journey",
}: {
  tabs: { id: T; label: string; icon: React.ElementType }[];
  activeId: T;
  visitedIds: Set<string>;
  onSelect: (id: T) => void;
  descriptions?: Record<string, string>;
  journeyLabel?: string;
}) {
  const allVisited = tabs.every(t => visitedIds.has(t.id) || t.id === activeId);
  const visitedCount = tabs.filter(t => visitedIds.has(t.id) || t.id === activeId).length;

  // Determine grid columns based on tab count
  const gridCols = tabs.length <= 3
    ? `grid-cols-${tabs.length}`
    : tabs.length <= 4
      ? "grid-cols-2 sm:grid-cols-4"
      : tabs.length <= 6
        ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6"
        : "grid-cols-2 sm:grid-cols-4 lg:grid-cols-8";

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1.5px solid hsl(var(--border))", background: "hsl(var(--card))" }}>
      {/* Progress header */}
      <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderBottom: "1px solid hsl(var(--border))" }}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {journeyLabel}
        </p>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold" style={{ color: allVisited ? "hsl(142 70% 35%)" : "hsl(var(--primary))" }}>
            {visitedCount}/{tabs.length}
          </span>
          <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--border))" }}>
            <div className="h-full rounded-full transition-all duration-500" style={{
              width: `${(visitedCount / tabs.length) * 100}%`,
              background: allVisited ? "hsl(142 70% 45%)" : "hsl(var(--primary))",
            }} />
          </div>
        </div>
      </div>

      {/* Grid cards */}
      <div className={`grid ${gridCols} gap-0`}>
        {tabs.map((tab, i) => {
          const isActive = activeId === tab.id;
          const isVisited = visitedIds.has(tab.id) && !isActive;
          const isUnvisited = !isActive && !isVisited;
          const TabIcon = tab.icon;
          const desc = descriptions?.[tab.id] || "";
          return (
            <button
              key={tab.id}
              onClick={() => onSelect(tab.id)}
              className="relative flex flex-col items-center text-center px-2 py-4 sm:py-5 transition-all duration-200 group"
              style={{
                background: isActive
                  ? "hsl(var(--foreground))"
                  : isVisited
                    ? "hsl(var(--primary) / 0.04)"
                    : "transparent",
                borderRight: i < tabs.length - 1 ? "1px solid hsl(var(--border) / 0.5)" : "none",
              }}
            >
              {isUnvisited && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ background: "hsl(var(--primary))" }} />
              )}
              <div
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mb-2 transition-all duration-200 group-hover:scale-110"
                style={{
                  background: isActive
                    ? "hsl(var(--background))"
                    : isVisited
                      ? "hsl(var(--primary) / 0.1)"
                      : "hsl(var(--muted))",
                }}
              >
                {isVisited ? (
                  <CheckCircle2 size={16} style={{ color: "hsl(142 70% 45%)" }} />
                ) : (
                  <TabIcon size={16} style={{ color: isActive ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }} />
                )}
              </div>
              <span className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{
                color: isActive ? "hsl(var(--background) / 0.5)" : "hsl(var(--muted-foreground) / 0.6)",
              }}>
                {i + 1}/{tabs.length}
              </span>
              <p className="text-[11px] sm:text-xs font-bold leading-tight" style={{
                color: isActive ? "hsl(var(--background))" : isVisited ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
              }}>
                {tab.label}
              </p>
              {desc && (
                <p className="hidden lg:block text-[9px] leading-snug mt-1 max-w-[120px]" style={{
                  color: isActive ? "hsl(var(--background) / 0.6)" : "hsl(var(--muted-foreground) / 0.7)",
                }}>
                  {desc}
                </p>
              )}
              {isActive && (
                <div className="absolute bottom-0 left-2 right-2 h-[3px] rounded-t-full" style={{ background: "hsl(var(--primary))" }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
