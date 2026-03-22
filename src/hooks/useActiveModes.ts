/**
 * useActiveModes — Derive active analysis modes from adaptive context.
 * Returns the user-selected modes or falls back to the current mainTab.
 */
import { useAnalysis } from "@/contexts/AnalysisContext";

export type StrictMode = "product" | "service" | "business";

const TAB_TO_MODE: Record<string, StrictMode> = {
  custom: "product",
  service: "service",
  business: "business",
};

export function useActiveModes(): StrictMode[] {
  const { adaptiveContext, mainTab, activeMode } = useAnalysis();

  if (adaptiveContext?.activeModes && adaptiveContext.activeModes.length > 0) {
    // Warn if activeMode maps to a mode not in activeModes (indicates desync)
    const mapped = TAB_TO_MODE[activeMode] || "product";
    if (adaptiveContext.activeModes.length === 1 && adaptiveContext.activeModes[0] !== mapped) {
      console.warn("[useActiveModes] activeMode out of sync with adaptiveContext.activeModes:", {
        activeMode,
        mappedMode: mapped,
        activeModes: adaptiveContext.activeModes,
      });
    }
    return adaptiveContext.activeModes as StrictMode[];
  }

  // Fallback: derive from mainTab
  return [TAB_TO_MODE[mainTab] || "product"];
}

/** Get the CSS variable name for a given mode */
export function getModeCssVar(mode: StrictMode): string {
  const map: Record<StrictMode, string> = {
    product: "--mode-product",
    service: "--mode-service",
    business: "--mode-business",
  };
  return map[mode] || "--mode-product";
}

/** Get the label for a given mode */
export function getModeLabel(mode: StrictMode): string {
  const map: Record<StrictMode, string> = {
    product: "Product",
    service: "Service",
    business: "Business",
  };
  return map[mode] || "Product";
}

/** Determine which mode a section primarily belongs to */
export function getSectionMode(sectionKey: string): StrictMode {
  const map: Record<string, StrictMode> = {
    // Product sections
    overview: "product",
    userJourney: "product",
    supplyChain: "product",
    patentIntel: "product",
    // Service sections
    communityIntel: "service",
    workflowBottlenecks: "service",
    operationalIntel: "service",
    // Business sections
    pricingIntel: "business",
    competitivePosition: "business",
    revenueModel: "business",
    marketExpansion: "business",
    // Mixed/default
    signalOverview: "product",
    deepInsight: "product",
  };
  return map[sectionKey] || "product";
}
