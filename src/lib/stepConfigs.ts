import { Target, Brain, Swords, Presentation, Sparkles } from "lucide-react";
import type { StepConfig } from "@/components/StepNavigator";

/** Shared step configs — ALL steps inherit mode accent color (no hardcoded colors) */
export function getStepConfigs(modeAccent: string): StepConfig[] {
  return [
    { step: 2, label: "Intelligence Report", description: "Deep market data, pricing & supply chain intel", icon: Target, color: modeAccent },
    { step: 3, label: "Deconstruct", description: "Hidden assumptions & leverage analysis", icon: Brain, color: modeAccent },
    { step: 4, label: "Redesign", description: "Flipped logic, reinvention ideas & redesigned concept", icon: Sparkles, color: modeAccent },
    { step: 5, label: "Stress Test", description: "Red vs Green team critical validation", icon: Swords, color: modeAccent },
    { step: 6, label: "Pitch Deck", description: "Investor-ready presentation builder", icon: Presentation, color: modeAccent },
  ];
}

export function getBusinessStepConfigs(modeAccent: string): StepConfig[] {
  return [
    { step: 2, label: "Intelligence Report", description: "Business model deep analysis", icon: Target, color: modeAccent },
    { step: 3, label: "Deconstruct", description: "Challenge assumptions & reinvent", icon: Brain, color: modeAccent },
    { step: 4, label: "Stress Test", description: "Red vs Green team debate", icon: Swords, color: modeAccent },
    { step: 5, label: "Pitch Deck", description: "Investor-ready pitch builder", icon: Presentation, color: modeAccent },
  ];
}

/** Section tab descriptions for ReportPage */
export const SECTION_DESCRIPTIONS: Record<string, string> = {
  overview: "Key insights, scores & market sizing at a glance",
  reality: "True problem, actual usage & user hacks",
  physical: "Size, weight, form factor & ergonomic gaps",
  workflow: "Step-by-step journey & friction points",
  community: "Community sentiment, complaints & improvement signals",
  pricing: "Market prices, margins & resale intelligence",
  supply: "Suppliers, manufacturers & distribution channels",
  patents: "Expired patents, IP gaps & innovation opportunities",
};

/** Section tab descriptions for Pitch Deck (10 slides) */
export const PITCH_SLIDE_DESCRIPTIONS: Record<string, string> = {
  problem: "The pain point your product solves",
  solution: "Your unique approach & elevator pitch",
  whynow: "Market timing & trend tailwinds",
  market: "TAM, SAM, SOM & growth drivers",
  product: "Innovation edge & competitive moat",
  businessmodel: "Revenue streams & unit economics",
  traction: "Early signals, KPIs & milestone targets",
  risks: "Key threats & mitigation strategies",
  gtm: "Go-to-market, positioning & channels",
  invest: "Funding ask, use of funds & exit",
};
