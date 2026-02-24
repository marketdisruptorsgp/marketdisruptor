export interface ModeThemeColors {
  primary: string;
  outline: string;
  background: string;
}

export const modeTheme: Record<"custom" | "service" | "business", ModeThemeColors> = {
  custom: {
    primary: "hsl(217 91% 38%)",
    outline: "hsl(217 91% 60%)",
    background: "hsl(217 91% 96%)",
  },
  service: {
    primary: "hsl(340 75% 50%)",
    outline: "hsl(340 75% 65%)",
    background: "hsl(340 75% 96%)",
  },
  business: {
    primary: "hsl(271 81% 55%)",
    outline: "hsl(271 81% 70%)",
    background: "hsl(271 81% 96%)",
  },
};
