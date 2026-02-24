import { Target, Brain, Swords, Presentation } from "lucide-react";
import type { StepConfig } from "@/components/StepNavigator";

/** Shared step configs with descriptions — use everywhere */
export function getStepConfigs(modeAccent: string): StepConfig[] {
  return [
    { step: 2, label: "Intelligence Report", description: "Deep market data, pricing & supply chain intel", icon: Target, color: modeAccent },
    { step: 3, label: "Disrupt", description: "First principles deconstruction & flip ideas", icon: Brain, color: "hsl(271 81% 55%)" },
    { step: 4, label: "Stress Test", description: "Red vs Green team critical validation", icon: Swords, color: "hsl(350 80% 55%)" },
    { step: 5, label: "Pitch Deck", description: "Investor-ready presentation builder", icon: Presentation, color: "hsl(var(--primary))" },
  ];
}

export function getBusinessStepConfigs(modeAccent: string): StepConfig[] {
  return [
    { step: 2, label: "Intelligence Report", description: "Business model deep analysis", icon: Target, color: modeAccent },
    { step: 3, label: "Disrupt", description: "Challenge assumptions & reinvent", icon: Brain, color: "hsl(350 80% 55%)" },
    { step: 4, label: "Stress Test", description: "Red vs Green team debate", icon: Swords, color: "hsl(38 92% 50%)" },
    { step: 5, label: "Pitch Deck", description: "Investor-ready pitch builder", icon: Presentation, color: "hsl(var(--primary))" },
  ];
}

/** Section tab descriptions for ReportPage */
export const SECTION_DESCRIPTIONS: Record<string, string> = {
  overview: "Key insights, scores & market sizing at a glance",
  community: "Reddit sentiment, complaints & improvement signals",
  pricing: "Market prices, margins & resale intelligence",
  supply: "Suppliers, manufacturers & distribution channels",
  action: "Strategy, quick wins & phased execution roadmap",
  patents: "Expired patents, IP gaps & innovation opportunities",
};
