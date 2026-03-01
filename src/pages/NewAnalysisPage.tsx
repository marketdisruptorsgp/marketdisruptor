import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HeroSection } from "@/components/HeroSection";
import { useSubscription } from "@/hooks/useSubscription";
import { AnalysisStepIndicator } from "@/components/AnalysisStepIndicator";
import {
  Upload, Briefcase, Building2, ArrowRight, CheckCircle2, Camera,
} from "lucide-react";

const MODES = [
  {
    id: "product" as const,
    label: "Product Analysis",
    icon: Upload,
    cssVar: "--mode-product",
    path: "/start/product",
    description:
      "Upload any physical or digital product and get a full competitive teardown — positioning gaps, overlooked segments, and data-driven redesign paths.",
    capabilities: [
      "Competitive landscape mapping",
      "Assumption stress-testing",
      "Redesign and disruption paths",
      "Investor-ready pitch deck",
    ],
  },
  {
    id: "service" as const,
    label: "Service Analysis",
    icon: Briefcase,
    cssVar: "--mode-service",
    path: "/start/service",
    description:
      "Deconstruct any service business — from SaaS to consulting — to expose friction, pricing leverage, and differentiation opportunities.",
    capabilities: [
      "User journey deconstruction",
      "Service model stress-test",
      "Pricing and packaging analysis",
      "Competitive moat assessment",
    ],
  },
  {
    id: "business" as const,
    label: "Business Model Analysis",
    icon: Building2,
    cssVar: "--mode-business",
    path: "/start/business",
    description:
      "Full business model teardown across revenue, cost structure, and value chain — revealing hidden leverage and structural vulnerabilities.",
    capabilities: [
      "Revenue model decomposition",
      "Cost structure analysis",
      "Value chain mapping",
      "First-principles reconstruction",
    ],
  },
];

export default function NewAnalysisPage() {
  const navigate = useNavigate();
  const { tier } = useSubscription();
  const [selectedMode, setSelectedMode] = useState<string | null>(null);

  const handleContinue = () => {
    const mode = MODES.find(m => m.id === selectedMode);
    if (mode) navigate(mode.path);
  };

  return (
    <div className="min-h-screen bg-background">
      <HeroSection tier={tier} remainingAnalyses={null} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-14">
        <AnalysisStepIndicator currentStep={1} />

        <h1 className="typo-page-title text-2xl sm:text-3xl tracking-tight mb-2">
          Select Analysis Mode
        </h1>
        <p className="typo-page-meta text-sm sm:text-base max-w-2xl leading-relaxed mb-8">
          Choose the type of analysis that matches your target. Each mode applies tailored scrutiny for the specific opportunity type.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {MODES.map((mode) => {
            const Icon = mode.icon;
            const isSelected = selectedMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setSelectedMode(mode.id)}
                className="rounded-2xl border bg-card flex flex-col overflow-hidden transition-all hover:shadow-lg text-left"
                style={{
                  borderWidth: isSelected ? "2px" : "1px",
                  borderColor: isSelected ? `hsl(var(${mode.cssVar}))` : "hsl(var(--border))",
                  borderTopWidth: "3px",
                  borderTopColor: `hsl(var(${mode.cssVar}))`,
                }}
              >
                <div className="p-5 sm:p-6 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: `hsl(var(${mode.cssVar}) / 0.12)` }}
                    >
                      <Icon size={20} style={{ color: `hsl(var(${mode.cssVar}))` }} />
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: `hsl(var(${mode.cssVar}))` }}>
                        <CheckCircle2 size={14} className="text-white" />
                      </div>
                    )}
                  </div>

                  <h2 className="typo-section-title text-lg mb-2">{mode.label}</h2>
                  <p className="typo-card-body text-muted-foreground leading-relaxed mb-5">
                    {mode.description}
                  </p>

                  <ul className="space-y-2 flex-1">
                    {mode.capabilities.map((cap) => (
                      <li key={cap} className="flex items-start gap-2">
                        <CheckCircle2
                          size={14}
                          className="flex-shrink-0 mt-0.5"
                          style={{ color: `hsl(var(${mode.cssVar}))` }}
                        />
                        <span className="typo-card-body text-foreground/80 text-sm">{cap}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </button>
            );
          })}
        </div>

        {/* Photo Analysis quick-access */}
        <div
          onClick={() => navigate("/instant-analysis")}
          className="mt-5 rounded-2xl border-2 border-dashed border-border bg-muted/30 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 cursor-pointer transition-all hover:border-primary/40 hover:shadow-md group"
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10 group-hover:bg-primary/15 transition-colors">
            <Camera size={22} className="text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="typo-section-title text-base mb-1">Photo Analysis</h3>
            <p className="typo-card-body text-muted-foreground text-sm leading-relaxed">
              Snap a photo or upload an image for instant competitive teardown.
            </p>
          </div>
          <ArrowRight size={18} className="text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 hidden sm:block" />
        </div>

        {/* Continue button */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleContinue}
            disabled={!selectedMode}
            className="inline-flex items-center gap-2 px-7 py-3 rounded-full typo-nav-primary bg-primary text-primary-foreground hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continue to Configuration <ArrowRight size={15} />
          </button>
        </div>
      </main>
    </div>
  );
}
