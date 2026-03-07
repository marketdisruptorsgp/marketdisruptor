import { useState, useCallback, useRef, useEffect } from "react";
import { useWorkspaceTheme } from "@/hooks/useWorkspaceTheme";
import { WorkspaceThemeToggle } from "@/components/WorkspaceThemeToggle";
import { useNavigate } from "react-router-dom";
import { HeroSection } from "@/components/HeroSection";
import { useSubscription } from "@/hooks/useSubscription";

import { AnalysisStepIndicator } from "@/components/AnalysisStepIndicator";
import { useAnalysis } from "@/contexts/AnalysisContext";
import {
  Upload, Briefcase, Building2, ArrowRight, CheckCircle2, Camera,
  AlertCircle, Zap, Layers, Coffee, ShoppingBag, Headphones, Target,
  Link as LinkIcon, Image, Loader2, Sparkles, FileText, Plus, X, Globe,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { LensToggle } from "@/components/LensToggle";
import { LensBar } from "@/components/LensBar";
import { InfoExplainer } from "@/components/InfoExplainer";
import {
  routeInnovationMode, explainRouting, toCardId,
  type RoutingResult,
} from "@/lib/modeIntelligence";
import { supabase } from "@/integrations/supabase/client";
import { invokeWithTimeout } from "@/lib/invokeWithTimeout";
import { toast } from "sonner";
import { useBIExtraction, fileToDocumentText, extractionToContext, type BIExtraction } from "@/hooks/useBIExtraction";
import { StepLoadingTracker, type StepTask } from "@/components/StepLoadingTracker";

const BIZ_LOADING_TASKS: StepTask[] = [
  { label: "Revenue Decomposition", detail: "Breaking down revenue streams" },
  { label: "Cost Structure Audit", detail: "Analyzing cost layers & margins" },
  { label: "Value Chain Mapping", detail: "Tracing value creation flow" },
  { label: "Disruption Scanning", detail: "Identifying vulnerability vectors" },
  { label: "Reinvention Engine", detail: "Generating alternative models" },
];

const DOC_ACCEPT = ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt";
const DOC_EXTENSIONS = ["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "csv", "txt"];
const MAX_DOCS = 5;
const MAX_URLS = 3;

const MODES = [
  {
    id: "product" as const,
    label: "Product",
    subtitle: "Change the thing itself",
    icon: Upload,
    cssVar: "--mode-product",
    path: "/analysis/new",
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
    path: "/analysis/new",
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
    path: "/analysis/new",
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
  const { theme, toggle: toggleTheme } = useWorkspaceTheme();
  
  const analysis = useAnalysis();
  const { setModeRouting } = analysis;
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [showManualClarifier, setShowManualClarifier] = useState(false);
  const [enabledModes, setEnabledModes] = useState<Set<string>>(new Set());
  const [problemText, setProblemText] = useState(() => {
    return sessionStorage.getItem("deconstruct-problem-text") || "";
  });
  const [routing, setRouting] = useState<RoutingResult | null>(null);
  const [useDeconstruct, setUseDeconstruct] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aiDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Inline clarifier state
  const [clarifierName, setClarifierName] = useState("");
  const [clarifierUrls, setClarifierUrls] = useState<string[]>([""]);
  const [clarifierImages, setClarifierImages] = useState<{ file: File; dataUrl: string }[]>([]);
  const [clarifierDocs, setClarifierDocs] = useState<{ file: File; name: string }[]>([]);
  const [autofilling, setAutofilling] = useState(false);
  const [launching, setLaunching] = useState(false);
  const autofillTriggered = useRef<Set<string>>(new Set());
  const clarifierRef = useRef<HTMLDivElement>(null);

  // BI Extraction
  const { extract, extracting, extraction } = useBIExtraction();
  const extractionTriggered = useRef(false);

  // AI Problem Analysis
  type AIChallenge = { id: string; question: string; context: string; priority: string; related_mode: string };
  type AIProblemAnalysis = {
    modes: { mode: string; confidence: number; reason: string }[];
    entity: { name: string; type: string };
    challenges: AIChallenge[];
    summary: string;
  };
  const [aiAnalysis, setAiAnalysis] = useState<AIProblemAnalysis | null>(null);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [selectedChallenges, setSelectedChallenges] = useState<Set<string>>(new Set());

  const runRouting = useCallback((text: string) => {
    if (text.trim().length < 15) {
      setRouting(null);
      return;
    }
    const result = routeInnovationMode(text);
    setRouting(result);
  }, []);

  const runAIAnalysisRef = useRef<(text: string) => void>(() => {});

  const handleTextChange = useCallback((value: string) => {
    setProblemText(value);
    sessionStorage.setItem("deconstruct-problem-text", value);
    // Reset AI analysis when text changes significantly
    setAiAnalysis(null);
    setSelectedChallenges(new Set());
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runRouting(value), 500);
    // Auto-trigger AI analysis after longer debounce (1.5s of no typing)
    if (aiDebounceRef.current) clearTimeout(aiDebounceRef.current);
    if (value.trim().length >= 20) {
      aiDebounceRef.current = setTimeout(() => {
        runAIAnalysisRef.current(value);
      }, 1500);
    }
  }, [runRouting]);

  // Re-run routing + AI analysis on mount if text was restored from session
  useEffect(() => {
    if (problemText.trim().length >= 15) {
      runRouting(problemText);
    }
    if (problemText.trim().length >= 20) {
      // Delay AI analysis slightly to let UI render first
      const t = setTimeout(() => runAIAnalysisRef.current(problemText), 800);
      return () => clearTimeout(t);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (aiDebounceRef.current) clearTimeout(aiDebounceRef.current);
    };
  }, []);

  // AI-powered deep problem analysis
  const runAIAnalysis = useCallback(async (text: string) => {
    if (text.trim().length < 15) return;
    setAiAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-problem", {
        body: { problemText: text },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setAiAnalysis(data as AIProblemAnalysis);

      // Auto-select high-priority challenges
      const highPriority = (data as AIProblemAnalysis).challenges
        .filter((c: AIChallenge) => c.priority === "high")
        .map((c: AIChallenge) => c.id);
      setSelectedChallenges(new Set(highPriority));

      // Auto-enable all detected modes with ≥20% confidence
      const detectedIds = (data as AIProblemAnalysis).modes
        .filter((m: any) => m.confidence >= 20)
        .map((m: any) => m.mode);
      setEnabledModes(new Set(detectedIds));

      // Auto-populate entity name
      if (!clarifierName && data.entity?.name) {
        setClarifierName(data.entity.name);
      }

      // Upgrade routing with AI-detected modes
      if (data.modes?.length > 0) {
        const sorted = [...data.modes].sort((a: any, b: any) => b.confidence - a.confidence);
        const primaryEngine = sorted[0].mode === "business" ? "business_model" as const
          : sorted[0].mode === "service" ? "service" as const : "product" as const;
        const secondaryEngines = sorted.slice(1)
          .filter((m: any) => m.confidence >= 20)
          .map((m: any) => m.mode === "business" ? "business_model" as const
            : m.mode === "service" ? "service" as const : "product" as const);

        const aiRouting: RoutingResult = {
          primaryMode: primaryEngine,
          secondaryModes: secondaryEngines,
          scores: {
            product: (sorted.find((m: any) => m.mode === "product")?.confidence || 0) / 100,
            service: (sorted.find((m: any) => m.mode === "service")?.confidence || 0) / 100,
            business_model: (sorted.find((m: any) => m.mode === "business")?.confidence || 0) / 100,
          },
          confidence: sorted[0].confidence / 100,
          reasoning: data.summary || "",
        };
        setRouting(aiRouting);
      }
    } catch (err) {
      console.error("AI problem analysis failed:", err);
      toast.error("Could not analyze problem — using keyword detection instead.");
    } finally {
      setAiAnalyzing(false);
    }
  }, [clarifierName]);

  // Keep ref in sync for debounced calls
  useEffect(() => { runAIAnalysisRef.current = runAIAnalysis; }, [runAIAnalysis]);

  const handleDeconstruct = () => {
    if (problemText.trim().length < 15) return;
    if (!routing) runRouting(problemText);
    setUseDeconstruct(true);
    setSelectedMode(null);
    // Fire AI analysis
    if (!aiAnalysis && !aiAnalyzing) {
      runAIAnalysis(problemText);
    }
    // Scroll to clarifier after render
    setTimeout(() => {
      clarifierRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  const handleCardClick = (id: string) => {
    setSelectedMode(id);
    setUseDeconstruct(false);
    setShowManualClarifier(false);
  };

  const handleContinue = () => {
    if (useDeconstruct && routing) {
      // Launch analysis directly from Deconstruct flow
      handleLaunchAnalysis();
    } else if (selectedMode) {
      // Create synthetic routing for the manually selected mode
      const engineMode = selectedMode === "business" ? "business_model" as const
        : selectedMode === "service" ? "service" as const
        : "product" as const;
      const syntheticRouting: RoutingResult = {
        primaryMode: engineMode,
        secondaryModes: [],
        scores: {
          product: engineMode === "product" ? 1 : 0,
          service: engineMode === "service" ? 1 : 0,
          business_model: engineMode === "business_model" ? 1 : 0,
        },
        confidence: 1,
        reasoning: `Manual selection: **${selectedMode}** mode.`,
      };
      setRouting(syntheticRouting);
      setModeRouting(syntheticRouting);
      setShowManualClarifier(true);
      // Scroll to clarifier
      setTimeout(() => {
        clarifierRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
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

  // Run BI extraction when docs/images are added
  const runExtraction = useCallback(async () => {
    if (extractionTriggered.current) return;
    const hasDocs = clarifierDocs.length > 0;
    const hasImages = clarifierImages.length > 0;
    if (!hasDocs && !hasImages) return;

    extractionTriggered.current = true;
    toast.info("Extracting business intelligence from your uploads…");

    try {
      const documentTexts = await Promise.all(
        clarifierDocs.map(d => fileToDocumentText(d.file))
      );

      // Upload images to get URLs for the extraction engine
      const imageUrls: string[] = [];
      for (const img of clarifierImages) {
        const ext = img.file.name.split(".").pop() || "png";
        const path = `bi-extract/${crypto.randomUUID()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("explorer-uploads")
          .upload(path, img.file);
        if (!uploadErr) {
          const { data: urlData } = supabase.storage
            .from("explorer-uploads")
            .getPublicUrl(path);
          if (urlData?.publicUrl) imageUrls.push(urlData.publicUrl);
        }
      }

      const result = await extract({
        documentTexts: documentTexts.length > 0 ? documentTexts : undefined,
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
        context: problemText || undefined,
      });

      if (result) {
        // Auto-populate name from extraction
        if (!clarifierName && result.business_overview?.company_name) {
          setClarifierName(result.business_overview.company_name);
        } else if (!clarifierName && result.business_overview?.primary_offering) {
          setClarifierName(result.business_overview.primary_offering);
        }
        toast.success("Intelligence extracted — fields auto-populated!");
      }
    } catch (err) {
      console.warn("BI extraction failed:", err);
    }
  }, [clarifierDocs, clarifierImages, clarifierName, problemText, extract]);

  // Launch analysis directly
  const handleLaunchAnalysis = async () => {
    if (!routing) return;
    setLaunching(true);
    setModeRouting(routing);

    const primaryCard = toCardId(routing.primaryMode);
    const name = clarifierName.trim() || (aiAnalysis?.entity?.name || "Deconstruct Analysis");
    const notes = problemText;
    const urls = clarifierUrls.map(u => u.trim()).filter(Boolean);
    const primaryUrl = urls[0] || "";

    // Build challenge focus context
    const challengeContext = aiAnalysis?.challenges
      ? aiAnalysis.challenges
          .filter(c => selectedChallenges.has(c.id))
          .map(c => `• ${c.question} (${c.context})`)
          .join("\n")
      : "";

    // Build extracted context if available
    const extractedContext = extraction ? extractionToContext(extraction) : "";

    // Build and persist adaptive context for the entire pipeline
    // Include activeModes from detected+toggled modes
    const activeModes = detectedModes.length > 0 ? detectedModes : [primaryCard];
    const adaptiveCtx = aiAnalysis ? {
      problemStatement: problemText,
      entity: aiAnalysis.entity,
      detectedModes: aiAnalysis.modes,
      activeModes,
      selectedChallenges: aiAnalysis.challenges.filter(c => selectedChallenges.has(c.id)),
      summary: aiAnalysis.summary,
    } : problemText.trim().length > 15 ? {
      problemStatement: problemText,
      activeModes,
    } : { activeModes };
    analysis.setAdaptiveContext(adaptiveCtx);

    try {
      if (primaryCard === "business") {
        analysis.setMainTab("business");
        analysis.setActiveMode("business");

        // 1. Create DB row via centralized context method
        let analysisId: string;
        try {
          analysisId = await analysis.createAnalysis(
            name || "Business Model Analysis",
            "business_model",
            { category: "Business Model" }
          );
        } catch (createErr) {
          toast.error("Failed to create analysis record");
          setLaunching(false);
          return;
        }

        // 2. Call edge function
        const { data: result, error } = await invokeWithTimeout("business-model-analysis", {
          body: {
            businessModel: {
              type: name,
              description: challengeContext ? `${notes}\n\n--- FOCUS AREAS ---\n${challengeContext}` : notes,
              revenueModel: extraction?.revenue_engine?.revenue_sources?.join(", ") || "",
              size: "",
              geography: "",
              painPoints: notes,
              notes: urls.length ? `Sources: ${urls.join(", ")}` : "",
            },
            extractedContext,
            adaptiveContext: adaptiveCtx,
          },
        }, 180_000);

        if (error || !result?.success) {
          toast.error("Analysis failed: " + (result?.error || error?.message || "Unknown error"));
          setLaunching(false);
          return;
        }

        // 3. Persist results via context saveStepData
        analysis.setBusinessAnalysisData(result.analysis);
        analysis.setBusinessModelInput({
          type: name,
          description: notes,
          revenueModel: extraction?.revenue_engine?.revenue_sources?.join(", ") || "",
          painPoints: notes,
        });
        analysis.setStep("done");

        // Save business analysis data — use direct update as primary path
        // to avoid governed extraction complexity that was silently dropping the key
        try {
          const { data: existingRow } = await supabase
            .from("saved_analyses")
            .select("analysis_data")
            .eq("id", analysisId)
            .single() as any;
          const prev = (existingRow?.analysis_data as Record<string, unknown>) || {};
          const merged = { ...prev, businessAnalysis: result.analysis };
          const { error: updateErr } = await (supabase.from("saved_analyses") as any)
            .update({ analysis_data: merged, updated_at: new Date().toISOString() })
            .eq("id", analysisId);
          if (updateErr) {
            console.error("[BusinessSave] Direct update failed:", updateErr);
            // Fallback to RPC
            await analysis.saveStepData("businessAnalysis", result.analysis, analysisId);
          } else {
            console.log("[BusinessSave] Successfully saved businessAnalysis via direct update");
          }
        } catch (saveErr) {
          console.error("[BusinessSave] Save error:", saveErr);
          await analysis.saveStepData("businessAnalysis", result.analysis, analysisId);
        }

        toast.success("Business model analysis complete!");
        navigate(`/analysis/${analysisId}/command-deck`);
      } else {
        const isService = primaryCard === "service";
        analysis.setMainTab(isService ? "service" : "custom");
        analysis.setActiveMode(isService ? "service" : "custom");

        let enrichedNotes = `${isService ? "[SERVICE ANALYSIS] " : ""}${notes}`;
        if (challengeContext) enrichedNotes += `\n\n--- FOCUS AREAS ---\n${challengeContext}`;
        if (extractedContext) enrichedNotes += `\n\n--- EXTRACTED INTELLIGENCE ---\n${extractedContext}`;

        const customProducts = [{
          productName: name,
          notes: enrichedNotes,
          urls,
          images: clarifierImages,
          productUrl: primaryUrl,
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
  const rawDetectedModes = routing
    ? [toCardId(routing.primaryMode), ...routing.secondaryModes.map(toCardId)]
    : [];
  // Use enabledModes (user-toggled) if populated, otherwise all detected modes
  const detectedModes = enabledModes.size > 0
    ? rawDetectedModes.filter(m => enabledModes.has(m))
    : rawDetectedModes;
  const canContinue = useDeconstruct ? !!routing : !!selectedMode;
  const isLoading = analysis.step === "scraping" || analysis.step === "analyzing";

  return (
    <div className="min-h-screen bg-background">
      <HeroSection tier={tier} />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <AnalysisStepIndicator currentStep={showManualClarifier || useDeconstruct ? 2 : 1} />

        <div className="flex items-center justify-between mb-1">
          <h1 className="typo-page-title text-2xl sm:text-3xl tracking-tight">
            Select Analysis Mode
          </h1>
          <WorkspaceThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>
        <p className="typo-page-meta text-sm sm:text-base max-w-3xl leading-relaxed mb-5">
          Pick a mode if you already know your focus — or describe your challenge below for auto-detection.
        </p>

        {/* ── Lens Bar (top-level) ── */}
        <LensBar />

        {/* ── Mode Cards (top) ── */}
        <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-4 pb-2 md:pb-0 md:grid md:grid-cols-3 mb-6">
          {MODES.map((mode) => {
            const Icon = mode.icon;
            const isSelected = !useDeconstruct && selectedMode === mode.id;
            const isDetected = useDeconstruct && detectedModes.includes(mode.id);
            return (
              <button
                key={mode.id}
                onClick={() => handleCardClick(mode.id)}
                className="rounded-2xl border bg-card flex flex-col overflow-hidden transition-all hover:shadow-lg text-left min-w-[280px] md:min-w-0 snap-center flex-shrink-0"
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
                <div className="p-4 sm:p-5 md:p-6 flex-1 flex flex-col">
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
                      <span className="text-xs font-medium text-muted-foreground">Modes — click to toggle:</span>
                      {rawDetectedModes.map((modeId) => {
                        const aiMode = aiAnalysis?.modes?.find(m => m.mode === modeId);
                        const isEnabled = enabledModes.size === 0 || enabledModes.has(modeId);
                        const isPrimary = modeId === toCardId(routing!.primaryMode);
                        return (
                          <button
                            key={modeId}
                            type="button"
                            onClick={() => {
                              setEnabledModes(prev => {
                                const next = new Set(prev.size === 0 ? rawDetectedModes : prev);
                                if (next.has(modeId) && next.size > 1) {
                                  next.delete(modeId);
                                } else {
                                  next.add(modeId);
                                }
                                return next;
                              });
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                            style={{
                              background: isEnabled ? `hsl(var(${MODE_CSS_VAR[modeId]}) / 0.15)` : "hsl(var(--muted) / 0.5)",
                              color: isEnabled ? `hsl(var(${MODE_CSS_VAR[modeId]}))` : "hsl(var(--muted-foreground))",
                              opacity: isEnabled ? 1 : 0.5,
                              border: isEnabled ? `1px solid hsl(var(${MODE_CSS_VAR[modeId]}) / 0.3)` : "1px solid transparent",
                            }}
                            title={aiMode?.reason || (isPrimary ? "Primary mode" : "Secondary mode")}
                          >
                            <span
                              className="w-2 h-2 rounded-full transition-colors"
                              style={{ background: isEnabled ? `hsl(var(${MODE_CSS_VAR[modeId]}))` : "hsl(var(--muted-foreground) / 0.4)" }}
                            />
                            {MODE_LABELS[modeId]}
                            {aiMode && (
                              <span className="opacity-60">· {aiMode.confidence}%</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {/* AI mode reasons */}
                    {aiAnalysis?.modes && aiAnalysis.modes.length > 0 ? (
                      <div className="space-y-1">
                        {aiAnalysis.modes.filter(m => m.confidence >= 20).map(m => (
                          <p key={m.mode} className="text-xs text-foreground/70 leading-relaxed">
                            <span className="font-semibold" style={{ color: `hsl(var(${MODE_CSS_VAR[m.mode]}))` }}>
                              {MODE_LABELS[m.mode]}:
                            </span>{" "}
                            {m.reason}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p
                        className="text-foreground/70 text-xs leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html: userExplanation.explanation.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground">$1</strong>'),
                        }}
                      />
                    )}
                    {!aiAnalysis && userExplanation.confidence < 45 && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <AlertCircle size={12} />
                        Low confidence — add more detail for a stronger match.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* AI analyzing indicator */}
            {aiAnalyzing && (
              <div
                className="mt-3 flex items-center gap-2 px-4 py-2.5 rounded-lg border text-xs"
                style={{
                  borderColor: "hsl(var(--mode-multi) / 0.2)",
                  background: "hsl(var(--mode-multi) / 0.04)",
                  color: "hsl(var(--mode-multi))",
                }}
              >
                <Loader2 size={14} className="animate-spin" />
                Analyzing your problem to extract specific challenges…
              </div>
            )}

            {/* AI-extracted challenges */}
            {aiAnalysis?.challenges && aiAnalysis.challenges.length > 0 && !useDeconstruct && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles size={13} style={{ color: "hsl(var(--mode-multi))" }} />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(var(--mode-multi))" }}>
                    We identified these challenges
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Select which ones to focus on. High-priority items are pre-selected.
                </p>
                <div className="space-y-1.5">
                  {aiAnalysis.challenges.map((c) => {
                    const isSelected = selectedChallenges.has(c.id);
                    const modeVar = MODE_CSS_VAR[c.related_mode] || "--mode-product";
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          const next = new Set(selectedChallenges);
                          if (isSelected) next.delete(c.id);
                          else next.add(c.id);
                          setSelectedChallenges(next);
                        }}
                        className="w-full text-left rounded-lg border px-3.5 py-2.5 transition-all"
                        style={{
                          borderColor: isSelected ? `hsl(var(${modeVar}) / 0.5)` : "hsl(var(--border))",
                          background: isSelected ? `hsl(var(${modeVar}) / 0.06)` : "transparent",
                        }}
                      >
                        <div className="flex items-start gap-2.5">
                          <div
                            className="w-4 h-4 rounded border flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors"
                            style={{
                              borderColor: isSelected ? `hsl(var(${modeVar}))` : "hsl(var(--border))",
                              background: isSelected ? `hsl(var(${modeVar}))` : "transparent",
                            }}
                          >
                            {isSelected && <CheckCircle2 size={10} className="text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground leading-snug">{c.question}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{c.context}</p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                              style={{
                                background: c.priority === "high" ? "hsl(var(--destructive) / 0.1)" : c.priority === "medium" ? "hsl(var(--warning) / 0.1)" : "hsl(var(--muted))",
                                color: c.priority === "high" ? "hsl(var(--destructive))" : c.priority === "medium" ? "hsl(var(--warning))" : "hsl(var(--muted-foreground))",
                              }}
                            >
                              {c.priority}
                            </span>
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ background: `hsl(var(${modeVar}))` }}
                              title={MODE_LABELS[c.related_mode]}
                            />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CTA */}
            {!useDeconstruct && (
              <div className="mt-4 flex items-center justify-between gap-4">
                <p className="text-xs text-muted-foreground">
                  {aiAnalyzing
                    ? "Analyzing your problem…"
                    : routing
                      ? "Click below to lock in detected modes."
                      : "Type at least 15 characters to auto-detect."}
                </p>
                <button
                  onClick={handleDeconstruct}
                  disabled={problemText.trim().length < 15 || aiAnalyzing}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                  style={{
                    background: "hsl(var(--mode-multi))",
                    color: "white",
                  }}
                >
                  {aiAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                  {aiAnalysis ? "Continue" : "Analyze"}
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
              <p
                className="text-sm leading-relaxed -mt-1 px-3 py-2 rounded-md border"
                style={{
                  background: "hsl(var(--mode-multi) / 0.06)",
                  borderColor: "hsl(var(--mode-multi) / 0.18)",
                  color: "hsl(var(--mode-multi) / 0.85)",
                }}
              >
                💡 <strong>These are optional.</strong> The more you share, the sharper the analysis. Leave blank to proceed with what you've described.
              </p>

              {/* AI Summary */}
              {aiAnalysis?.summary && (
                <div
                  className="rounded-lg border px-3.5 py-2.5 text-sm"
                  style={{
                    borderColor: "hsl(142 70% 40% / 0.3)",
                    background: "hsl(142 70% 40% / 0.04)",
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <CheckCircle2 size={12} style={{ color: "hsl(142 70% 40%)" }} />
                    <span className="text-xs font-semibold" style={{ color: "hsl(142 70% 40%)" }}>Here's what we understand</span>
                  </div>
                  <p className="text-foreground text-sm leading-relaxed">{aiAnalysis.summary}</p>
                  {aiAnalysis.entity?.type && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Identified as: <strong className="text-foreground">{aiAnalysis.entity.type}</strong>
                    </p>
                  )}
                </div>
              )}

              {/* AI Challenges in clarifier */}
              {aiAnalysis?.challenges && aiAnalysis.challenges.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Target size={12} style={{ color: "hsl(var(--mode-multi))" }} />
                    <span className="typo-card-eyebrow text-xs">Focus areas</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground -mt-1">
                    Select which challenges the analysis should prioritize.
                  </p>
                  <div className="space-y-1.5">
                    {aiAnalysis.challenges.map((c) => {
                      const isSelected = selectedChallenges.has(c.id);
                      const modeVar = MODE_CSS_VAR[c.related_mode] || "--mode-product";
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            const next = new Set(selectedChallenges);
                            if (isSelected) next.delete(c.id);
                            else next.add(c.id);
                            setSelectedChallenges(next);
                          }}
                          className="w-full text-left rounded-lg border px-3 py-2 transition-all"
                          style={{
                            borderColor: isSelected ? `hsl(var(${modeVar}) / 0.5)` : "hsl(var(--border))",
                            background: isSelected ? `hsl(var(${modeVar}) / 0.06)` : "transparent",
                          }}
                        >
                          <div className="flex items-start gap-2.5">
                            <div
                              className="w-4 h-4 rounded border flex-shrink-0 mt-0.5 flex items-center justify-center"
                              style={{
                                borderColor: isSelected ? `hsl(var(${modeVar}))` : "hsl(var(--border))",
                                background: isSelected ? `hsl(var(${modeVar}))` : "transparent",
                              }}
                            >
                              {isSelected && <CheckCircle2 size={10} className="text-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-foreground">{c.question}</p>
                              <p className="text-[11px] text-muted-foreground mt-0.5">{c.context}</p>
                            </div>
                            <span
                              className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                              style={{ background: `hsl(var(${modeVar}))` }}
                              title={MODE_LABELS[c.related_mode]}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* AI loading in clarifier */}
              {aiAnalyzing && (
                <div
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs"
                  style={{
                    borderColor: "hsl(var(--mode-multi) / 0.2)",
                    background: "hsl(var(--mode-multi) / 0.04)",
                    color: "hsl(var(--mode-multi))",
                  }}
                >
                  <Loader2 size={14} className="animate-spin" />
                  Analyzing your problem…
                </div>
              )}

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

              {/* URLs — multiple */}
              <div className="space-y-1.5">
                <label className="typo-card-eyebrow text-xs flex items-center gap-2">
                  <Globe size={12} />
                  Links (optional, up to {MAX_URLS})
                  {autofilling && <Loader2 size={13} className="animate-spin text-primary" />}
                </label>
                <div className="space-y-2">
                  {clarifierUrls.map((url, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        value={url}
                        onChange={(e) => {
                          const next = [...clarifierUrls];
                          next[i] = e.target.value;
                          setClarifierUrls(next);
                        }}
                        onBlur={(e) => handleUrlBlur(e.target.value)}
                        placeholder="https://example.com — we'll extract details automatically"
                        className="input-executive flex-1"
                      />
                      {clarifierUrls.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setClarifierUrls(clarifierUrls.filter((_, j) => j !== i))}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                  {clarifierUrls.length < MAX_URLS && (
                    <button
                      type="button"
                      onClick={() => setClarifierUrls([...clarifierUrls, ""])}
                      className="text-xs font-medium flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-muted/80 transition-colors"
                      style={{ color: "hsl(var(--mode-multi))" }}
                    >
                      <Plus size={12} /> Add another link
                    </button>
                  )}
                </div>
              </div>

              {/* Documents */}
              <div className="space-y-1.5">
                <label className="typo-card-eyebrow text-xs flex items-center gap-2">
                  <FileText size={12} />
                  Documents (optional, up to {MAX_DOCS})
                </label>
                <p className="text-[11px] text-muted-foreground -mt-0.5">
                  PDF, Word, PowerPoint, Excel, CSV — we'll extract business intelligence to power your analysis.
                </p>
                <div className="space-y-1.5">
                  {clarifierDocs.map((doc, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-muted/30"
                      style={{ borderColor: "hsl(var(--border))" }}
                    >
                      <FileText size={14} className="text-muted-foreground flex-shrink-0" />
                      <span className="text-sm text-foreground truncate flex-1">{doc.name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {(doc.file.size / 1024).toFixed(0)}KB
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setClarifierDocs(clarifierDocs.filter((_, j) => j !== i));
                          extractionTriggered.current = false;
                        }}
                        className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  {clarifierDocs.length < MAX_DOCS && (
                    <label
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors hover:bg-muted/60"
                      style={{ border: "1.5px dashed hsl(var(--border))", background: "hsl(var(--muted) / 0.3)" }}
                    >
                      <Upload size={14} className="text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Upload document</span>
                      <input
                        type="file"
                        accept={DOC_ACCEPT}
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const ext = file.name.split(".").pop()?.toLowerCase() || "";
                          if (!DOC_EXTENSIONS.includes(ext)) {
                            toast.error("Unsupported file type. Use PDF, Word, PowerPoint, Excel, or CSV.");
                            return;
                          }
                          const { validateFileUpload } = await import("@/utils/fileValidation");
                          if (!validateFileUpload(file).allowed) { e.target.value = ""; return; }
                          setClarifierDocs(prev => [...prev, { file, name: file.name }]);
                          extractionTriggered.current = false;
                          e.target.value = "";
                        }}
                      />
                    </label>
                  )}
                </div>
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
                        onClick={() => {
                          setClarifierImages(clarifierImages.filter((_, j) => j !== i));
                          extractionTriggered.current = false;
                        }}
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
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const { validateFileUpload } = await import("@/utils/fileValidation");
                          if (!validateFileUpload(file).allowed) { e.target.value = ""; return; }
                          const reader = new FileReader();
                          reader.onload = () => {
                            setClarifierImages(prev => [...prev, { file, dataUrl: reader.result as string }]);
                            extractionTriggered.current = false;
                          };
                          reader.readAsDataURL(file);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Extraction status */}
              {(clarifierDocs.length > 0 || clarifierImages.length > 0) && (
                <div className="space-y-2">
                  {!extracting && !extraction && (
                    <button
                      type="button"
                      onClick={runExtraction}
                      className="w-full py-2.5 rounded-lg text-xs font-semibold border transition-all flex items-center justify-center gap-2 hover:shadow-sm"
                      style={{
                        borderColor: "hsl(var(--mode-multi) / 0.3)",
                        color: "hsl(var(--mode-multi))",
                        background: "hsl(var(--mode-multi) / 0.06)",
                      }}
                    >
                      <Sparkles size={13} />
                      Extract Intelligence from Uploads
                    </button>
                  )}
                  {extracting && (
                    <div
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs"
                      style={{
                        borderColor: "hsl(var(--mode-multi) / 0.2)",
                        background: "hsl(var(--mode-multi) / 0.04)",
                        color: "hsl(var(--mode-multi))",
                      }}
                    >
                      <Loader2 size={14} className="animate-spin" />
                      Analyzing documents… extracting business structure, constraints, and leverage points
                    </div>
                  )}
                  {extraction && (
                    <div
                      className="px-3 py-2.5 rounded-lg border text-xs space-y-1"
                      style={{
                        borderColor: "hsl(142 70% 40% / 0.3)",
                        background: "hsl(142 70% 40% / 0.04)",
                      }}
                    >
                      <div className="flex items-center gap-1.5 font-semibold" style={{ color: "hsl(142 70% 40%)" }}>
                        <CheckCircle2 size={13} />
                        Intelligence extracted
                      </div>
                      <p className="text-muted-foreground leading-relaxed">
                        {extraction.business_overview?.primary_offering && (
                          <span><strong className="text-foreground">Offering:</strong> {extraction.business_overview.primary_offering}. </span>
                        )}
                        {extraction.constraints?.length > 0 && (
                          <span><strong className="text-foreground">{extraction.constraints.length} constraints</strong> identified. </span>
                        )}
                        {extraction.signals_for_visualization?.candidate_leverage_points?.length > 0 && (
                          <span><strong className="text-foreground">{extraction.signals_for_visualization.candidate_leverage_points.length} leverage points</strong> found. </span>
                        )}
                        This data will power your analysis.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Loading tracker */}
              {launching && (
                <StepLoadingTracker
                  title="Building Business Model Intelligence"
                  tasks={BIZ_LOADING_TASKS}
                  estimatedSeconds={50}
                  accentColor="hsl(var(--mode-business))"
                />
              )}

              {/* Launch button */}
              <button
                onClick={handleLaunchAnalysis}
                disabled={launching || isLoading || extracting}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: "hsl(var(--mode-multi))" }}
              >
              {launching || isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Running deep analysis…
                  </>
                ) : extracting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Extracting…
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    Start Strategic Discovery
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

        {/* Continue button (only for manual mode selection, before clarifier shown) */}
        {!useDeconstruct && !showManualClarifier && (
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

        {/* ── Manual Mode Clarifier ── */}
        {showManualClarifier && routing && selectedMode && (() => {
          const modeConfig = MODES.find(m => m.id === selectedMode);
          const cssVar = modeConfig ? modeConfig.cssVar : "--mode-product";
          const modeLabel = modeConfig?.label || "Product";
          return (
            <div
              ref={clarifierRef}
              className="rounded-2xl border-2 overflow-hidden shadow-md mb-6"
              style={{
                borderColor: `hsl(var(${cssVar}))`,
                borderTopWidth: "4px",
                borderTopColor: `hsl(var(${cssVar}))`,
                background: `hsl(var(${cssVar}) / 0.03)`,
              }}
            >
              <div className="px-5 sm:px-6 pt-5 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `hsl(var(${cssVar}) / 0.12)` }}>
                    {modeConfig && <modeConfig.icon size={20} style={{ color: `hsl(var(${cssVar}))` }} />}
                  </div>
                  <div>
                    <h2 className="typo-section-title text-lg">Configure {modeLabel} Analysis</h2>
                    <p className="text-sm text-muted-foreground mt-0.5">Add details to sharpen your analysis — or skip straight to results.</p>
                  </div>
                </div>
              </div>

              <div className="border-t px-5 sm:px-6 py-5 space-y-4" style={{ borderColor: `hsl(var(${cssVar}) / 0.15)` }}>
                <p
                  className="text-sm leading-relaxed px-3 py-2 rounded-md border"
                  style={{
                    background: `hsl(var(${cssVar}) / 0.06)`,
                    borderColor: `hsl(var(${cssVar}) / 0.18)`,
                    color: `hsl(var(${cssVar}) / 0.85)`,
                  }}
                >
                  💡 <strong>These are optional.</strong> The more you share, the sharper the analysis. Leave blank to proceed with defaults.
                </p>

                {/* Name */}
                <div className="space-y-1.5">
                  <label className="typo-card-eyebrow text-xs">What are we analyzing?</label>
                  <input
                    value={clarifierName}
                    onChange={(e) => setClarifierName(e.target.value)}
                    placeholder="e.g. Acme CRM, My coffee shop, Nike Air Max…"
                    className="input-executive"
                  />
                </div>

                {/* URLs */}
                <div className="space-y-1.5">
                  <label className="typo-card-eyebrow text-xs flex items-center gap-2">
                    <Globe size={12} />
                    Links (optional, up to {MAX_URLS})
                    {autofilling && <Loader2 size={13} className="animate-spin text-primary" />}
                  </label>
                  <div className="space-y-2">
                    {clarifierUrls.map((url, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          value={url}
                          onChange={(e) => { const next = [...clarifierUrls]; next[i] = e.target.value; setClarifierUrls(next); }}
                          onBlur={(e) => handleUrlBlur(e.target.value)}
                          placeholder="https://example.com — we'll extract details automatically"
                          className="input-executive flex-1"
                        />
                        {clarifierUrls.length > 1 && (
                          <button type="button" onClick={() => setClarifierUrls(clarifierUrls.filter((_, j) => j !== i))} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                    {clarifierUrls.length < MAX_URLS && (
                      <button type="button" onClick={() => setClarifierUrls([...clarifierUrls, ""])} className="text-xs font-medium flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-muted/80 transition-colors" style={{ color: `hsl(var(${cssVar}))` }}>
                        <Plus size={12} /> Add another link
                      </button>
                    )}
                  </div>
                </div>

                {/* Documents */}
                <div className="space-y-1.5">
                  <label className="typo-card-eyebrow text-xs flex items-center gap-2">
                    <FileText size={12} />
                    Documents (optional, up to {MAX_DOCS})
                  </label>
                  <p className="text-[11px] text-muted-foreground -mt-0.5">PDF, Word, PowerPoint, Excel, CSV — we'll extract business intelligence.</p>
                  <div className="space-y-1.5">
                    {clarifierDocs.map((doc, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-muted/30" style={{ borderColor: "hsl(var(--border))" }}>
                        <FileText size={14} className="text-muted-foreground flex-shrink-0" />
                        <span className="text-sm text-foreground truncate flex-1">{doc.name}</span>
                        <span className="text-[10px] text-muted-foreground">{(doc.file.size / 1024).toFixed(0)}KB</span>
                        <button type="button" onClick={() => { setClarifierDocs(clarifierDocs.filter((_, j) => j !== i)); extractionTriggered.current = false; }} className="w-5 h-5 rounded flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    {clarifierDocs.length < MAX_DOCS && (
                      <label className="flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors hover:bg-muted/60" style={{ border: "1.5px dashed hsl(var(--border))", background: "hsl(var(--muted) / 0.3)" }}>
                        <Upload size={14} className="text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Upload document</span>
                        <input type="file" accept={DOC_ACCEPT} className="hidden" onChange={async (e) => {
                          const file = e.target.files?.[0]; if (!file) return;
                          const ext = file.name.split(".").pop()?.toLowerCase() || "";
                          if (!DOC_EXTENSIONS.includes(ext)) { toast.error("Unsupported file type."); return; }
                          const { validateFileUpload } = await import("@/utils/fileValidation");
                          if (!validateFileUpload(file).allowed) { e.target.value = ""; return; }
                          setClarifierDocs(prev => [...prev, { file, name: file.name }]); extractionTriggered.current = false; e.target.value = "";
                        }} />
                      </label>
                    )}
                  </div>
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
                        <button type="button" onClick={() => { setClarifierImages(clarifierImages.filter((_, j) => j !== i)); extractionTriggered.current = false; }} className="absolute top-0 right-0 w-4 h-4 flex items-center justify-center text-[9px] text-white rounded-bl" style={{ background: "hsl(var(--destructive))" }}>✕</button>
                      </div>
                    ))}
                    {clarifierImages.length < 5 && (
                      <label className="w-14 h-14 rounded-lg flex items-center justify-center cursor-pointer transition-colors hover:bg-muted/80" style={{ border: "1.5px dashed hsl(var(--border))", background: "hsl(var(--muted) / 0.5)" }}>
                        <Upload size={14} className="text-muted-foreground" />
                        <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                          const file = e.target.files?.[0]; if (!file) return;
                          const { validateFileUpload } = await import("@/utils/fileValidation");
                          if (!validateFileUpload(file).allowed) { e.target.value = ""; return; }
                          const reader = new FileReader();
                          reader.onload = () => { setClarifierImages(prev => [...prev, { file, dataUrl: reader.result as string }]); extractionTriggered.current = false; };
                          reader.readAsDataURL(file); e.target.value = "";
                        }} />
                      </label>
                    )}
                  </div>
                </div>

                {/* Extraction status */}
                {(clarifierDocs.length > 0 || clarifierImages.length > 0) && (
                  <div className="space-y-2">
                    {!extracting && !extraction && (
                      <button type="button" onClick={runExtraction} className="w-full py-2.5 rounded-lg text-xs font-semibold border transition-all flex items-center justify-center gap-2 hover:shadow-sm" style={{ borderColor: `hsl(var(${cssVar}) / 0.3)`, color: `hsl(var(${cssVar}))`, background: `hsl(var(${cssVar}) / 0.06)` }}>
                        <Sparkles size={13} /> Extract Intelligence from Uploads
                      </button>
                    )}
                    {extracting && (
                      <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs" style={{ borderColor: `hsl(var(${cssVar}) / 0.2)`, background: `hsl(var(${cssVar}) / 0.04)`, color: `hsl(var(${cssVar}))` }}>
                        <Loader2 size={14} className="animate-spin" /> Analyzing documents…
                      </div>
                    )}
                    {extraction && (
                      <div className="px-3 py-2.5 rounded-lg border text-xs space-y-1" style={{ borderColor: "hsl(142 70% 40% / 0.3)", background: "hsl(142 70% 40% / 0.04)" }}>
                        <div className="flex items-center gap-1.5 font-semibold" style={{ color: "hsl(142 70% 40%)" }}>
                          <CheckCircle2 size={13} /> Intelligence extracted
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                          {extraction.business_overview?.primary_offering && <span><strong className="text-foreground">Offering:</strong> {extraction.business_overview.primary_offering}. </span>}
                          {extraction.constraints?.length > 0 && <span><strong className="text-foreground">{extraction.constraints.length} constraints</strong> identified. </span>}
                          This data will power your analysis.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Loading tracker */}
                {launching && (
                  <StepLoadingTracker
                    title={`Building ${selectedMode === "business" ? "Business Model" : selectedMode === "service" ? "Service" : "Product"} Intelligence`}
                    tasks={selectedMode === "business" ? BIZ_LOADING_TASKS : [
                      { label: "Market Research", detail: "Scanning data sources" },
                      { label: "Competitive Analysis", detail: "Positioning & gaps" },
                      { label: "Friction Discovery", detail: "Pain points & bottlenecks" },
                      { label: "Opportunity Scoring", detail: "Ranking interventions" },
                    ]}
                    estimatedSeconds={selectedMode === "business" ? 50 : 60}
                    accentColor={`hsl(var(${cssVar}))`}
                  />
                )}

                {/* Launch button */}
                <button
                  onClick={handleLaunchAnalysis}
                  disabled={launching || isLoading || extracting}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: `hsl(var(${cssVar}))` }}
                >
              {launching || isLoading ? (
                    <><Loader2 size={16} className="animate-spin" /> Running deep analysis…</>
                  ) : extracting ? (
                    <><Loader2 size={16} className="animate-spin" /> Extracting…</>
                  ) : (
                    <><Zap size={16} /> Start {modeLabel} Analysis</>
                  )}
                </button>
              </div>
            </div>
          );
        })()}
      </main>
    </div>
  );
}
