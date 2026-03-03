import { Package, Briefcase, Building2 } from "lucide-react";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { useModeTheme } from "@/hooks/useModeTheme";

const MODE_CONFIG = {
  custom: { label: "Product Mode", icon: Package },
  service: { label: "Service Mode", icon: Briefcase },
  business: { label: "Business Mode", icon: Building2 },
} as const;

export function ModeBadge() {
  const { mainTab, analysisParams } = useAnalysis();
  const theme = useModeTheme();
  const mode = mainTab as keyof typeof MODE_CONFIG;
  const config = MODE_CONFIG[mode] || MODE_CONFIG.custom;
  const Icon = config.icon;
  const category = analysisParams?.category || "";

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold"
      style={{
        background: theme.tint,
        color: theme.primary,
        border: `1px solid ${theme.outline}`,
      }}
    >
      <Icon size={13} />
      <span>{config.label}</span>
      {category && (
        <>
          <span className="text-muted-foreground font-normal">·</span>
          <span className="font-semibold opacity-80">{category}</span>
        </>
      )}
    </div>
  );
}
