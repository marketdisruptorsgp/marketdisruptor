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
    primary: "hsl(229 89% 63%)",
    hover: "hsl(229 85% 55%)",
    active: "hsl(229 85% 48%)",
    tint: "hsl(229 89% 96%)",
    outline: "hsl(229 89% 72%)",
    background: "hsl(229 89% 96%)",
  },
  service: {
    primary: "hsl(343 65% 55%)",
    hover: "hsl(343 60% 47%)",
    active: "hsl(343 60% 40%)",
    tint: "hsl(343 65% 96%)",
    outline: "hsl(343 65% 68%)",
    background: "hsl(343 65% 96%)",
  },
  business: {
    primary: "hsl(271 82% 55%)",
    hover: "hsl(271 78% 47%)",
    active: "hsl(271 78% 40%)",
    tint: "hsl(271 82% 96%)",
    outline: "hsl(271 82% 70%)",
    background: "hsl(271 82% 96%)",
  },
};
