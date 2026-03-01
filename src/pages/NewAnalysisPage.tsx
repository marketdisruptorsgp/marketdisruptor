import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { HeroSection } from "@/components/HeroSection";
import { useSubscription } from "@/hooks/useSubscription";
import { AnalysisStepIndicator } from "@/components/AnalysisStepIndicator";
import { useAnalysis } from "@/contexts/AnalysisContext";
import {
  Upload, Briefcase, Building2, ArrowRight, CheckCircle2, Camera,
  AlertCircle, Zap, Layers, Coffee, ShoppingBag, Headphones,
  Link as LinkIcon, Image, Loader2, Sparkles,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { LensToggle } from "@/components/LensToggle";
import { InfoExplainer } from "@/components/InfoExplainer";
import {
  routeInnovationMode, explainRouting, toCardId,
  type RoutingResult,
} from "@/lib/modeIntelligence";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MODES = [
  {
    id: "product" as const,
    label: "Product",
    subtitle: "Change the thing itself",
    icon: Upload,
    cssVar: "--mode-product",
    path: "/start/product",
    description: "When design, features, or tech are the problem.",
    capabilities: [
      "Visual & material teardown",
      "Feature gap analysis",
      "Redesign concepts",
    ],
  },
  {
    id: "service" as const,
    label: "Service",
    subtitle: "Change how it's delivered",
    icon: Briefcase,
    cssVar: "--mode-service",
    path: "/start/service",
    description: "When workflow, experience, or ops are the problem.",
    capabilities: [
      "Journey friction mapping",
      "Delivery model alternatives",
      "Packaging & bundling",
    ],
  },
  {
    id: "business" as const,
    label: "Business Model",
    subtitle: "Change how money flows",
    icon: Building2,
    cssVar: "--mode-business",
    path: "/start/business",
    description: "When pricing, revenue, or margins are the problem.",
    capabilities: [
      "Revenue decomposition",
      "Cost structure audit",
      "Value chain reconstruction",
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

const PHOTO_EXAMPLES = [
  { icon: Coffee, label: "Your morning coffee maker", detail: "Why does this design dominate? What's the disruption opportunity?" },
  { icon: ShoppingBag, label: "A competitor's packaging", detail: "Snap it at the store — get a full positioning teardown in seconds." },
  { icon: Headphones, label: "Your office headphones", detail: "Materials, ergonomics, pricing leverage — all from one photo." },
];

export default function NewAnalysisPage() {
  const navigate = useNavigate();
  const { tier } = useSubscription();
  const analysis = useAnalysis();
  const { setModeRouting } = analysis;
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [problemText, setProblemText] = useState(() => {
    return sessionStorage.getItem("deconstruct-problem-text") || "";
  });
  const [routing, setRouting] = useState<RoutingResult | null>(null);
  const [useDeconstruct, setUseDeconstruct] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Inline clarifier state
  const [clarifierName, setClarifierName] = useState("");
  const [clarifierUrl, setClarifierUrl] = useState("");
  const [clarifierImages, setClarifierImages] = useState<{ file: File; dataUrl: string }[]>([]);
  const [autofilling, setAutofilling] = useState(false);
  const [launching, setLaunching] = useState(false);
  const autofillTriggered = useRef<Set<string>>(new Set());
  const clarifierRef = useRef<HTMLDivElement>(null);

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
    sessionStorage.setItem("deconstruct-problem-text", value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runRouting(value), 500);
  }, [runRouting]);

  // Re-run routing on mount if text was restored from session
  useEffect(() => {
    if (problemText.trim().length >= 15) {
      runRouting(problemText);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  const handleDeconstruct = () => {
    if (problemText.trim().length < 15) return;
    if (!routing) runRouting(problemText);
    setUseDeconstruct(true);
    setSelectedMode(null);
    // Scroll to clarifier after render
    setTimeout(() => {
      clarifierRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  const handleCardClick = (id: string) => {
    setSelectedMode(id);
    setUseDeconstruct(false);
  };

  const handleContinue = () => {
    if (useDeconstruct && routing) {
      // Launch analysis directly from Deconstruct flow
      handleLaunchAnalysis();
    } else {
      const mode = MODES.find(m => m.id === selectedMode);
      if (mode) {
        setModeRouting(routing);
        navigate(mode.path);
      }
    }
  };

  // URL autofill
  const handleUrlBlur = async (url: string) => {
    const trimmed = url.trim();
    if (!trimmed || autofillTriggered.current.has(trimmed)) return;
    if (!trimmed.match(/^https?:\/\/.+\..+/) && !trimmed.match(/^[a-zA-Z0-9].*\..+/)) return;

    autofillTriggered.current.add(trimmed);
    setAutofilling(true);
    toast.info("Scanning URL to pre-fill fields...");

    try {
      const primaryCard = routing ? toCardId(routing.primaryMode) : "product";
      const mode = primaryCard === "business" ? "business" : primaryCard === "service" ? "service" : "custom";
      const { data, error } = await supabase.functions.invoke("scrape-url-autofill", {
        body: { url: trimmed, mode },
      });
      if (!error && data?.success && data.data) {
        if (!clarifierName && (data.data.name || data.data.type)) {
          setClarifierName(data.data.name || data.data.type || "");
        }
        toast.success("Details extracted from URL!");
      }
    } catch (err) {
      console.warn("Autofill failed:", err);
    } finally {
      setAutofilling(false);
    }
  };

  // Launch analysis directly
  const handleLaunchAnalysis = async () => {
    if (!routing) return;
    setLaunching(true);
    setModeRouting(routing);

    const primaryCard = toCardId(routing.primaryMode);
    const name = clarifierName.trim() || "Deconstruct Analysis";
    const notes = problemText;
    const url = clarifierUrl.trim();

    try {
      if (primaryCard === "business") {
        // Business model flow
        analysis.setMainTab("business");
        analysis.setActiveMode("business");

        const { data: result, error } = await supabase.functions.invoke("business-model-analysis", {
          body: {
            businessModel: {
              type: name,
              description: notes,
              revenueModel: "",
              size: "",
              geography: "",
              painPoints: notes,
              notes: url ? `Source: ${url}` : "",
            },
          },
        });

        if (error || !result?.success) {
          toast.error("Analysis failed: " + (result?.error || error?.message || "Unknown error"));
          setLaunching(false);
          return;
        }

        analysis.setBusinessAnalysisData(result.analysis);
        const id = crypto.randomUUID();
        analysis.setAnalysisId(id);
        toast.success("Business model analysis complete!");
        navigate(`/business/${id}`);
      } else {
        // Product or service flow
        const isService = primaryCard === "service";
        analysis.setMainTab(isService ? "service" : "custom");
        analysis.setActiveMode(isService ? "service" : "custom");

        const customProducts = [{
          productName: name,
          notes: isService ? `[SERVICE ANALYSIS] ${notes}` : notes,
          urls: url ? [url] : [],
          images: clarifierImages,
          productUrl: url || "",
          imageDataUrl: clarifierImages[0]?.dataUrl,
        }];

        await analysis.handleAnalyze({
          category: isService ? "Service" : "Custom",
          era: "All Eras / Current",
          batchSize: 1,
          customProducts,
        });
      }
    } catch (err) {
      toast.error("Unexpected error: " + String(err));
      setLaunching(false);
    }
  };

  const userExplanation = routing ? explainRouting(routing) : null;
  const detectedModes = routing
    ? [toCardId(routing.primaryMode), ...routing.secondaryModes.map(toCardId)]
    : [];
  const canContinue = useDeconstruct ? !!routing : !!selectedMode;
  const isLoading = analysis.step === "scraping" || analysis.step === "analyzing";

  return (
    <div className="min-h-screen bg-background">
      <HeroSection tier={tier} remainingAnalyses={null} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <AnalysisStepIndicator currentStep={1} />

        <h1 className="typo-page-title text-2xl sm:text-3xl tracking-tight mb-1">
          Select Analysis Mode
        </h1>
        <p className="typo-page-meta text-sm sm:text-base max-w-3xl leading-relaxed mb-6">
          Pick a mode if you already know your focus — or describe your challenge below for auto-detection.
        </p>

        {/* ── Mode Cards (top) ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
                    {isDetected && (
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

                  <h2 className="typo-section-title text-lg mb-0.5">{mode.label}</h2>
                  <p className="text-xs font-semibold mb-2" style={{ color: `hsl(var(${mode.cssVar}))` }}>{mode.subtitle}</p>
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

        {/* ── Divider ── */}
        <div className="flex items-center gap-3 mb-5">
          <div className="h-px flex-1" style={{ background: "hsl(var(--mode-multi) / 0.3)" }} />
          <span
            className="text-sm font-bold uppercase tracking-wider px-4 py-1.5 rounded-full border"
            style={{
              background: "hsl(var(--mode-multi) / 0.12)",
              color: "hsl(var(--mode-multi))",
              borderColor: "hsl(var(--mode-multi) / 0.25)",
            }}
          >
            ✦ Have a specific problem in mind?
          </span>
          <div className="h-px flex-1" style={{ background: "hsl(var(--mode-multi) / 0.3)" }} />
        </div>

        {/* ── Deconstruct My Problem ── */}
        <div
          className="mb-6 rounded-2xl border-2 overflow-hidden transition-all shadow-md"
          style={{
            borderColor: useDeconstruct
              ? "hsl(var(--mode-multi))"
              : routing
                ? "hsl(var(--mode-multi) / 0.6)"
                : "hsl(var(--mode-multi) / 0.35)",
            borderTopWidth: "4px",
            borderTopColor: "hsl(var(--mode-multi))",
            background: useDeconstruct
              ? "hsl(var(--mode-multi) / 0.04)"
              : "hsl(var(--mode-multi) / 0.02)",
          }}
        >
          <div className="p-5 sm:p-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-1">
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "hsl(var(--mode-multi) / 0.12)" }}
                >
                  <Layers size={20} style={{ color: "hsl(var(--mode-multi))" }} />
                </div>
                <div>
                  <h2 className="typo-section-title text-lg">Deconstruct My Problem</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mt-1 max-w-xl">
                    Describe your specific challenge in plain language. We'll automatically apply <strong className="text-foreground">every relevant mode</strong> and
                    skip straight to analysis — no extra configuration needed.
                  </p>
                </div>
              </div>
              {/* Lens selector */}
              <div className="flex items-center gap-1.5 flex-shrink-0 mt-1">
                <span className="text-[10px] font-medium uppercase tracking-wider hidden sm:inline" style={{ color: "hsl(var(--mode-multi))" }}>Lens</span>
                <LensToggle />
                <InfoExplainer explainerKey="lens-selector" accentColor="hsl(var(--mode-multi))" />
              </div>
            </div>

            {/* Textarea */}
            <div className="mt-4">
              <Textarea
                value={problemText}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder='e.g. "Our product costs too much to manufacture and enterprise clients say our onboarding takes too long…"'
                className="input-executive min-h-[100px] text-sm leading-relaxed resize-none"
                rows={4}
              />
            </div>

            {/* Routing result */}
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
                      <span className="text-xs font-medium text-muted-foreground">Modes we'll apply:</span>
                      {detectedModes.map((modeId) => (
                        <span
                          key={modeId}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
                          style={{
                            background: `hsl(var(${MODE_CSS_VAR[modeId]}) / 0.15)`,
                            color: `hsl(var(${MODE_CSS_VAR[modeId]}))`,
                          }}
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ background: `hsl(var(${MODE_CSS_VAR[modeId]}))` }}
                          />
                          {MODE_LABELS[modeId]}
                          {modeId === toCardId(routing!.primaryMode) && (
                            <span className="opacity-60">· {userExplanation.confidence}%</span>
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

            {/* CTA */}
            {!useDeconstruct && (
              <div className="mt-4 flex items-center justify-between gap-4">
                <p className="text-xs text-muted-foreground">
                  {routing
                    ? "Click below to lock in detected modes."
                    : "Type at least 15 characters to auto-detect."}
                </p>
                <button
                  onClick={handleDeconstruct}
                  disabled={problemText.trim().length < 15}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                  style={{
                    background: "hsl(var(--mode-multi))",
                    color: "white",
                  }}
                >
                  <Zap size={14} />
                  Save
                </button>
              </div>
            )}
          </div>

          {/* ── Inline Clarifier (appears after Deconstruct) ── */}
          {useDeconstruct && routing && (
            <div
              ref={clarifierRef}
              className="border-t px-5 sm:px-6 py-5 space-y-4"
              style={{
                borderColor: "hsl(var(--mode-multi) / 0.15)",
                background: "hsl(var(--mode-multi) / 0.03)",
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={14} style={{ color: "hsl(var(--mode-multi))" }} />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--mode-multi))" }}>
                  Almost there — help us dial it in
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed -mt-2">
                These are optional. The more you share, the sharper the analysis. Leave blank to proceed with what you've described.
              </p>

              {/* Name */}
              <div className="space-y-1.5">
                <label className="typo-card-eyebrow text-xs">
                  What are we analyzing?
                </label>
                <input
                  value={clarifierName}
                  onChange={(e) => setClarifierName(e.target.value)}
                  placeholder="e.g. Acme CRM, My coffee shop, Nike Air Max…"
                  className="input-executive"
                />
              </div>

              {/* URL */}
              <div className="space-y-1.5">
                <label className="typo-card-eyebrow text-xs flex items-center gap-2">
                  <LinkIcon size={12} />
                  Got a link? (optional)
                  {autofilling && <Loader2 size={13} className="animate-spin text-primary" />}
                </label>
                <input
                  value={clarifierUrl}
                  onChange={(e) => setClarifierUrl(e.target.value)}
                  onBlur={(e) => handleUrlBlur(e.target.value)}
                  placeholder="https://example.com — we'll extract details automatically"
                  className="input-executive"
                />
              </div>

              {/* Images */}
              <div className="space-y-1.5">
                <label className="typo-card-eyebrow text-xs flex items-center gap-2">
                  <Image size={12} />
                  Images (optional, up to 5)
                </label>
                <div className="flex flex-wrap gap-2">
                  {clarifierImages.map((img, i) => (
                    <div key={i} className="relative w-14 h-14 rounded-lg overflow-hidden" style={{ border: "1px solid hsl(var(--border))" }}>
                      <img src={img.dataUrl} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setClarifierImages(clarifierImages.filter((_, j) => j !== i))}
                        className="absolute top-0 right-0 w-4 h-4 flex items-center justify-center text-[9px] text-white rounded-bl"
                        style={{ background: "hsl(var(--destructive))" }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {clarifierImages.length < 5 && (
                    <label
                      className="w-14 h-14 rounded-lg flex items-center justify-center cursor-pointer transition-colors hover:bg-muted/80"
                      style={{ border: "1.5px dashed hsl(var(--border))", background: "hsl(var(--muted) / 0.5)" }}
                    >
                      <Upload size={14} className="text-muted-foreground" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = () => {
                            setClarifierImages([...clarifierImages, { file, dataUrl: reader.result as string }]);
                          };
                          reader.readAsDataURL(file);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Launch button */}
              <button
                onClick={handleLaunchAnalysis}
                disabled={launching || isLoading}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: "hsl(var(--mode-multi))" }}
              >
                {launching || isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Analyzing…
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    Start Analysis
                  </>
                )}
              </button>

              <p className="text-[11px] text-center text-muted-foreground">
                {detectedModes.length} mode{detectedModes.length > 1 ? "s" : ""} will be applied: {detectedModes.map(m => MODE_LABELS[m]).join(", ")}
              </p>
            </div>
          )}
        </div>

        {/* ── Photo / Instant Analysis ── */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-px flex-1" style={{ background: "hsl(var(--primary) / 0.3)" }} />
            <span
              className="text-sm font-bold uppercase tracking-wider px-4 py-1.5 rounded-full border"
              style={{
                background: "hsl(var(--primary) / 0.12)",
                color: "hsl(var(--primary))",
                borderColor: "hsl(var(--primary) / 0.25)",
              }}
            >
              📸 Or Instant Analysis
            </span>
            <div className="h-px flex-1" style={{ background: "hsl(var(--primary) / 0.3)" }} />
          </div>

          <div
            onClick={() => navigate("/instant-analysis")}
            className="rounded-2xl border-2 bg-card p-5 sm:p-6 cursor-pointer transition-all hover:shadow-lg group shadow-md"
            style={{
              borderColor: "hsl(var(--primary) / 0.3)",
              borderTopWidth: "4px",
              borderTopColor: "hsl(var(--primary))",
            }}
          >
            <div className="flex items-start gap-4 mb-5">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10 group-hover:bg-primary/15 transition-colors flex-shrink-0">
                <Camera size={22} className="text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="typo-section-title text-lg">Photo Analysis</h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                    Instant
                  </span>
                </div>
                <p className="typo-card-body text-muted-foreground leading-relaxed max-w-xl">
                  See something interesting? Snap a photo. We'll identify it, run a full competitive teardown,
                  and surface redesign opportunities — all from a single image. No typing, no URLs, no setup.
                </p>
              </div>
              <ArrowRight size={18} className="text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1 hidden sm:block" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PHOTO_EXAMPLES.map((ex) => {
                const ExIcon = ex.icon;
                return (
                  <div key={ex.label} className="flex items-start gap-3 rounded-xl bg-muted/50 p-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/8 flex-shrink-0 mt-0.5">
                      <ExIcon size={15} className="text-primary/70" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{ex.label}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{ex.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Continue button (only for manual mode selection) */}
        {!useDeconstruct && (
          <div className="flex justify-end">
            <button
              onClick={handleContinue}
              disabled={!canContinue}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-full typo-nav-primary bg-primary text-primary-foreground hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue to Configuration <ArrowRight size={15} />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
