import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { HeroSection } from "@/components/HeroSection";
import { useSubscription } from "@/hooks/useSubscription";
import { AnalysisStepIndicator } from "@/components/AnalysisStepIndicator";
import { useAnalysis } from "@/contexts/AnalysisContext";
import {
  Upload, Briefcase, Building2, ArrowRight, CheckCircle2, Camera,
  AlertCircle, Zap, Layers,
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

const MODE_LABELS: Record<string, string> = {
  product: "Product",
  service: "Service",
  business: "Business Model",
};

export default function NewAnalysisPage() {
  const navigate = useNavigate();
  const { tier } = useSubscription();
  const { setModeRouting } = useAnalysis();
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [problemText, setProblemText] = useState("");
  const [routing, setRouting] = useState<RoutingResult | null>(null);
  const [isOverride, setIsOverride] = useState(false);
  const [useDeconstruct, setUseDeconstruct] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runRouting = useCallback((text: string) => {
    if (text.trim().length < 15) {
      setRouting(null);
      return;
    }
    const result = routeInnovationMode(text);
    setRouting(result);
  }, []);

  const handleTextChange = useCallback((value: string) => {
    setProblemText(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runRouting(value), 500);
  }, [runRouting]);

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  const handleDeconstruct = () => {
    if (problemText.trim().length < 15) return;
    if (!routing) runRouting(problemText);
    setUseDeconstruct(true);
    // Auto-select primary mode
    if (routing) {
      setSelectedMode(toCardId(routing.primaryMode));
      setIsOverride(false);
    }
  };

  const handleCardClick = (id: string) => {
    setSelectedMode(id);
    setUseDeconstruct(false);
    if (routing) setIsOverride(toCardId(routing.primaryMode) !== id);
  };

  const handleContinue = () => {
    if (useDeconstruct && routing) {
      setModeRouting(routing);
      const cardId = toCardId(routing.primaryMode);
      const mode = MODES.find(m => m.id === cardId);
      if (mode) navigate(mode.path);
    } else {
      const mode = MODES.find(m => m.id === selectedMode);
      if (mode) {
        setModeRouting(routing);
        navigate(mode.path);
      }
    }
  };

  const userExplanation = routing ? explainRouting(routing) : null;

  // Detected modes for the multi-mode indicator
  const detectedModes = routing
    ? [toCardId(routing.primaryMode), ...routing.secondaryModes.map(toCardId)]
    : [];

  const canContinue = useDeconstruct ? !!routing : !!selectedMode;

  return (
    <div className="min-h-screen bg-background">
      <HeroSection tier={tier} remainingAnalyses={null} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-14">
        <AnalysisStepIndicator currentStep={1} />

        <h1 className="typo-page-title text-2xl sm:text-3xl tracking-tight mb-2">
          Select Analysis Mode
        </h1>
        <p className="typo-page-meta text-sm sm:text-base max-w-2xl leading-relaxed mb-8">
          Describe your challenge below and we'll auto-detect the right modes — or select one directly.
        </p>

        {/* ── Deconstruct My Problem ── */}
        <div
          className="mb-8 rounded-2xl border-2 overflow-hidden transition-all"
          style={{
            borderColor: useDeconstruct
              ? "hsl(var(--mode-multi))"
              : routing
                ? "hsl(var(--mode-multi) / 0.5)"
                : "hsl(var(--border))",
            borderTopWidth: "3px",
            borderTopColor: "hsl(var(--mode-multi))",
          }}
        >
          <div className="p-5 sm:p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "hsl(var(--mode-multi) / 0.12)" }}
              >
                <Layers size={20} style={{ color: "hsl(var(--mode-multi))" }} />
              </div>
              <div>
                <h2 className="typo-section-title text-lg">Deconstruct My Problem</h2>
                <p className="text-xs text-muted-foreground">
                  Explain your challenge — we'll determine which analysis modes apply.
                </p>
              </div>
            </div>

            {/* Textarea */}
            <Textarea
              value={problemText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="e.g. Our product manufacturing costs are too high and our delivery process takes too long for enterprise clients…"
              className="input-executive min-h-[100px] text-sm leading-relaxed resize-none border-border/60 focus:border-[hsl(var(--mode-multi))]"
              rows={4}
            />

            {/* Routing explanation banner */}
            {userExplanation && (
              <div
                className="mt-4 rounded-xl border px-4 py-3 text-sm"
                style={{
                  borderColor: "hsl(var(--mode-multi) / 0.3)",
                  background: "hsl(var(--mode-multi) / 0.04)",
                }}
              >
                <div className="flex items-start gap-3">
                  <Zap size={16} className="flex-shrink-0 mt-0.5" style={{ color: "hsl(var(--mode-multi))" }} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="text-xs font-medium text-muted-foreground">Detected modes:</span>
                      {detectedModes.map((modeId) => (
                        <span
                          key={modeId}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold"
                          style={{
                            background: `hsl(var(${MODE_CSS_VAR[modeId]}) / 0.15)`,
                            color: `hsl(var(${MODE_CSS_VAR[modeId]}))`,
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: `hsl(var(${MODE_CSS_VAR[modeId]}))` }}
                          />
                          {MODE_LABELS[modeId]}
                          {modeId === toCardId(routing!.primaryMode) && (
                            <span className="opacity-60 ml-0.5">({userExplanation.confidence}%)</span>
                          )}
                        </span>
                      ))}
                    </div>
                    <p
                      className="text-foreground/70 text-xs leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: userExplanation.explanation.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>'),
                      }}
                    />

                    {userExplanation.confidence < 45 && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <AlertCircle size={12} />
                        Low confidence — add more detail for a stronger match.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* CTA button */}
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-muted-foreground max-w-sm">
                {routing
                  ? "Click below to lock in detected modes and continue."
                  : "Type at least 15 characters to auto-detect analysis modes."}
              </p>
              <button
                onClick={handleDeconstruct}
                disabled={problemText.trim().length < 15}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: "hsl(var(--mode-multi))",
                  color: "white",
                }}
              >
                <Zap size={14} />
                Deconstruct My Problem
              </button>
            </div>
          </div>

          {/* Active state indicator */}
          {useDeconstruct && routing && (
            <div
              className="px-5 py-3 flex items-center gap-2 text-xs font-medium border-t"
              style={{
                background: "hsl(var(--mode-multi) / 0.06)",
                borderColor: "hsl(var(--mode-multi) / 0.15)",
                color: "hsl(var(--mode-multi))",
              }}
            >
              <CheckCircle2 size={14} />
              Problem deconstructed — {detectedModes.length} mode{detectedModes.length > 1 ? "s" : ""} selected.
              <span className="text-muted-foreground font-normal ml-1">
                Or select a specific mode below to override.
              </span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">or select a mode directly</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Mode cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {MODES.map((mode) => {
            const Icon = mode.icon;
            const isSelected = !useDeconstruct && selectedMode === mode.id;
            const isDetected = useDeconstruct && detectedModes.includes(mode.id);
            return (
              <button
                key={mode.id}
                onClick={() => handleCardClick(mode.id)}
                className="rounded-2xl border bg-card flex flex-col overflow-hidden transition-all hover:shadow-lg text-left"
                style={{
                  borderWidth: isSelected ? "2px" : "1px",
                  borderColor: isSelected
                    ? `hsl(var(${mode.cssVar}))`
                    : isDetected
                      ? `hsl(var(${mode.cssVar}) / 0.4)`
                      : "hsl(var(--border))",
                  borderTopWidth: "3px",
                  borderTopColor: `hsl(var(${mode.cssVar}))`,
                  opacity: useDeconstruct && !isDetected ? 0.5 : 1,
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
                    {isDetected && !isSelected && (
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                        style={{
                          background: `hsl(var(${mode.cssVar}) / 0.12)`,
                          color: `hsl(var(${mode.cssVar}))`,
                        }}
                      >
                        Detected
                      </span>
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
            disabled={!canContinue}
            className="inline-flex items-center gap-2 px-7 py-3 rounded-full typo-nav-primary bg-primary text-primary-foreground hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continue to Configuration <ArrowRight size={15} />
          </button>
        </div>
      </main>
    </div>
  );
}
