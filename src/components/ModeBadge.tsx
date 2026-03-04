import { Package, Briefcase, Building2 } from "lucide-react";
import { useActiveModes, getModeCssVar, getModeLabel, type StrictMode } from "@/hooks/useActiveModes";
import { useAnalysis } from "@/contexts/AnalysisContext";

const MODE_ICONS: Record<StrictMode, typeof Package> = {
  product: Package,
  service: Briefcase,
  business: Building2,
};

export function ModeBadge() {
  const activeModes = useActiveModes();
  const { analysisParams } = useAnalysis();
  const category = analysisParams?.category || "";
  const isMulti = activeModes.length > 1;

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {activeModes.map((mode) => {
        const Icon = MODE_ICONS[mode] || Package;
        const cssVar = getModeCssVar(mode);
        const label = getModeLabel(mode);
        return (
          <div
            key={mode}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold"
            style={{
              background: `hsl(var(${cssVar}) / 0.1)`,
              color: `hsl(var(${cssVar}))`,
              border: `1px solid hsl(var(${cssVar}) / 0.25)`,
            }}
          >
            <Icon size={12} />
            <span>{label}</span>
          </div>
        );
      })}
      {category && !isMulti && (
        <span className="text-xs text-muted-foreground font-medium">· {category}</span>
      )}
    </div>
  );
}

/** Inline mode pill for section headers — shows which mode a section belongs to */
export function SectionModePill({ mode }: { mode: StrictMode }) {
  const cssVar = getModeCssVar(mode);
  const label = getModeLabel(mode);
  const Icon = MODE_ICONS[mode] || Package;

  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider"
      style={{
        background: `hsl(var(${cssVar}) / 0.08)`,
        color: `hsl(var(${cssVar}))`,
      }}
    >
      <Icon size={9} />
      {label}
    </span>
  );
}
