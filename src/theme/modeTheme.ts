/**
 * Mode Theme — Single Source of Truth: CSS custom properties in index.css
 *
 * All mode colors reference CSS variables. No hardcoded HSL values.
 * For non-CSS contexts (PPTX export), use modeHex.
 */

export interface ModeThemeColors {
  primary: string;
  hover: string;
  active: string;
  tint: string;
  outline: string;
  background: string;
}

export const modeTheme: Record<"custom" | "service" | "business", ModeThemeColors> = {
  custom: {
    primary: "hsl(var(--mode-product))",
    hover: "hsl(var(--mode-product-hover))",
    active: "hsl(var(--mode-product-active))",
    tint: "hsl(var(--mode-product-tint))",
    outline: "hsl(var(--mode-product-outline))",
    background: "hsl(var(--mode-product-tint))",
  },
  service: {
    primary: "hsl(var(--mode-service))",
    hover: "hsl(var(--mode-service-hover))",
    active: "hsl(var(--mode-service-active))",
    tint: "hsl(var(--mode-service-tint))",
    outline: "hsl(var(--mode-service-outline))",
    background: "hsl(var(--mode-service-tint))",
  },
  business: {
    primary: "hsl(var(--mode-business))",
    hover: "hsl(var(--mode-business-hover))",
    active: "hsl(var(--mode-business-active))",
    tint: "hsl(var(--mode-business-tint))",
    outline: "hsl(var(--mode-business-outline))",
    background: "hsl(var(--mode-business-tint))",
  },
};

/**
 * Hex values for non-CSS contexts (PPTX export, canvas rendering).
 * These are the hex equivalents of the canonical CSS variable values.
 * Product: #4b68f5 | Service: #d64174 | Business: #9030ea
 */
export const modeHex: Record<"custom" | "service" | "business", string> = {
  custom: "4b68f5",
  service: "d64174",
  business: "9030ea",
};
