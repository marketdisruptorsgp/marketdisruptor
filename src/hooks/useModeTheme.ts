import { useAnalysis } from "@/contexts/AnalysisContext";
import { modeTheme, type ModeThemeColors } from "@/theme/modeTheme";

export function useModeTheme(overrideMode?: "custom" | "service" | "business"): ModeThemeColors {
  const analysis = useAnalysis();
  const mode = overrideMode || analysis.mainTab;
  return modeTheme[mode] || modeTheme.custom;
}
