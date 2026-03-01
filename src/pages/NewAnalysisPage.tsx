import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { HeroSection } from "@/components/HeroSection";
import { useSubscription } from "@/hooks/useSubscription";
import { AnalysisStepIndicator } from "@/components/AnalysisStepIndicator";
import { useAnalysis } from "@/contexts/AnalysisContext";
import {
  Upload, Briefcase, Building2, ArrowRight, CheckCircle2, Camera, AlertCircle,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  routeInnovationMode, explainRouting, toCardId,
  type RoutingResult,
} from "@/lib/modeIntelligence";

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

const MODE_CSS_VAR: Record<string, string> = {
  product: "--mode-product",
  service: "--mode-service",
  business: "--mode-business",
};

export default function NewAnalysisPage() {
  const navigate = useNavigate();
  const { tier } = useSubscription();
  const { setModeRouting } = useAnalysis();
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [problemText, setProblemText] = useState("");
  const [routing, setRouting] = useState<RoutingResult | null>(null);
  const [isOverride, setIsOverride] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runRouting = useCallback((text: string) => {
    if (text.trim().length < 15) {
      setRouting(null);
      return;
    }
    const result = routeInnovationMode(text);
    setRouting(result);
    const cardId = toCardId(result.primaryMode);
    setSelectedMode(cardId);
    setIsOverride(false);
  }, []);

  const handleTextChange = useCallback((value: string) => {
    setProblemText(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runRouting(value), 500);
  }, [runRouting]);

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  const handleCardClick = (id: string) => {
    setSelectedMode(id);
    if (routing) setIsOverride(toCardId(routing.primaryMode) !== id);
  };

  const handleContinue = () => {
    const mode = MODES.find(m => m.id === selectedMode);
    if (mode) {
      setModeRouting(routing);
      navigate(mode.path);
    }
  };

  const userExplanation = routing ? explainRouting(routing) : null;

  return (
    <div className="min-h-screen bg-background">
      <HeroSection tier={tier} remainingAnalyses={null} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-14">
        <AnalysisStepIndicator currentStep={1} />

        <h1 className="typo-page-title text-2xl sm:text-3xl tracking-tight mb-2">
          Select Analysis Mode
        </h1>
        <p className="typo-page-meta text-sm sm:text-base max-w-2xl leading-relaxed mb-6">
          Describe your problem or select a mode directly.
        </p>

        {/* Problem description textarea */}
        <div className="mb-6">
          <Textarea
            value={problemText}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="Describe your problem or opportunity — we'll auto-detect the best analysis mode…"
            className="input-executive min-h-[90px] text-sm leading-relaxed resize-none"
            rows={3}
          />

          {/* Routing explanation banner */}
          {userExplanation && (
            <div
              className="mt-3 rounded-xl border px-4 py-3 text-sm transition-all"
              style={{
                borderColor: `hsl(var(${MODE_CSS_VAR[toCardId(routing!.primaryMode)]}) / 0.4)`,
                background: `hsl(var(${MODE_CSS_VAR[toCardId(routing!.primaryMode)]}) / 0.06)`,
              }}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold"
                  style={{
                    background: `hsl(var(${MODE_CSS_VAR[toCardId(routing!.primaryMode)]}) / 0.15)`,
                    color: `hsl(var(${MODE_CSS_VAR[toCardId(routing!.primaryMode)]}))`,
                  }}
                >
                  {userExplanation.confidence}% confidence
                </span>
                <span
                  className="text-foreground/80"
                  dangerouslySetInnerHTML={{ __html: userExplanation.explanation.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
                />
              </div>

              {isOverride && (
                <p className="mt-1.5 text-xs text-muted-foreground italic">
                  You overrode the suggested mode — your selection will be used.
                </p>
              )}

              {userExplanation.confidence < 45 && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <AlertCircle size={12} />
                  Low confidence — add more detail for a stronger match.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {MODES.map((mode) => {
            const Icon = mode.icon;
            const isSelected = selectedMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => handleCardClick(mode.id)}
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
