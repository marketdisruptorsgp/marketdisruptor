import { useState, useRef, useEffect } from "react";
import { Sparkles, Upload, Link, X, Image as ImageIcon, Plus, Telescope, Building2, Brain, RefreshCw, Briefcase, ArrowLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CustomProductInput {
  imageFile?: File;
  imageDataUrl?: string;
  productUrl?: string;
  productName?: string;
  notes?: string;
  urls?: string[];
  images?: { file: File; dataUrl: string }[];
}

interface AnalysisFormProps {
  onAnalyze: (params: {
    category: string;
    era: string;
    batchSize: number;
    customProducts?: CustomProductInput[];
  }) => void;
  onBusinessAnalysis?: (data: unknown) => void;
  isLoading: boolean;
  mode?: Mode;
  onModeChange?: (mode: Mode) => void;
}

const CATEGORIES = [
  "Toys & Games", "Kitchen Gadgets", "Electronics", "Fashion", "Photography",
  "Fitness & Health", "Music & Audio", "Office Supplies", "Multi-category",
];

const ERAS = [
  "70s", "80s", "80s–90s", "90s", "2000s", "All Eras / Current",
];

type Mode = "discover" | "custom" | "service" | "business";

interface BusinessInput {
  type: string;
  description: string;
  revenueModel: string;
  size: string;
  geography: string;
  painPoints: string;
  notes: string;
}

const BUSINESS_EXAMPLES = [
  "Laundromat", "Car wash", "Dry cleaner", "Storage facility", "Food truck",
  "Restaurant", "Gym / Fitness studio", "Cleaning service", "Landscaping company",
  "Distributor / Wholesaler", "Staffing agency", "Freight broker", "Import/Export business",
  "Accounting firm", "Law firm", "Real estate agency", "HVAC company", "Auto repair shop",
];

// Steps config per mode
const MODE_STEPS: Record<Mode, { label: string; detail: string }[]> = {
  discover: [
    { label: "Configure Search", detail: "Choose category, era, and batch size to target your market segment" },
    { label: "Broad Internet Crawl", detail: "Scrapes eBay, Etsy, Reddit, TikTok, Google Shopping, Alibaba, patent registries, forums, and collector communities simultaneously" },
    { label: "Critical AI Analysis", detail: "Cross-references all intelligence, challenges every assumption about why products failed, and identifies friction points conventional wisdom ignores" },
    { label: "Results & Action Plans", detail: "Revival scores across 6 dimensions, reinvented product concepts with BOM estimates, patent landscape analysis, and a 3-phase execution roadmap" },
  ],
  custom: [
    { label: "Provide Product Info", detail: "URLs and images seed a broader crawl across competitors, communities, patent filings, and related markets" },
    { label: "Deep Crawl & Vision Analysis", detail: "Scrapes competitor pages, Reddit threads, patent databases, and forum complaints. Vision AI extracts design patterns and manufacturing clues from images" },
    { label: "Assumption-Challenging Report", detail: "Questions pricing logic, supply chain assumptions, ignored friction points, and patent white space. Nothing is taken at face value" },
    { label: "Strategic Action Plan", detail: "Revival score, flipped product concepts, cost breakdowns, patent opportunities, and a go-to-market roadmap with financial projections" },
  ],
  service: [
    { label: "Describe the Service", detail: "URLs and screenshots seed a sweep across competitor sites, review platforms, forums, and regulatory filings" },
    { label: "Market Intelligence Crawl", detail: "Pulls competitor pricing, reviews from Yelp/Google/Trustpilot, social sentiment, and workflow engagement patterns. Vision AI analyzes UX friction" },
    { label: "Critical Competitive Analysis", detail: "Maps pricing across the landscape, identifies user journey drop-offs, and challenges assumptions about what customers actually value" },
    { label: "Growth Blueprint", detail: "Pain points reframed as opportunities, pricing optimization, engagement strategies, and a scaling roadmap with projections" },
  ],
  business: [
    { label: "Describe Your Business", detail: "Revenue model, scale, geography, pain points, the more detail you provide, the deeper the deconstruction" },
    { label: "7-Dimension Deconstruction", detail: "Strips the business to fundamental truths, analyzing customer friction, cost inefficiencies, tech leverage gaps, moats, automation, and pricing power" },
    { label: "Reinvention Blueprint", detail: "Hidden revenue paths, automation priorities, competitive repositioning, IP considerations, and a phased timeline with financial projections" },
  ],
};

// Capability stats per mode  
const MODE_CAPABILITIES: Record<Mode, { stat: string; label: string }[]> = {
  discover: [
    { stat: "8+", label: "Live data sources crawled across the open web" },
    { stat: "3 AI Models", label: "Scraping, reasoning, and scoring in parallel" },
    { stat: "50+", label: "Data points per product including patent filings" },
    { stat: "10K+", label: "Market signals cross-referenced per batch" },
    { stat: "6 Dimensions", label: "Feasibility, desirability, profitability, IP, demand, assumption validity" },
  ],
  custom: [
    { stat: "Vision AI", label: "Extracts design, quality, and manufacturing signals from images" },
    { stat: "Broad Crawl", label: "Scrapes competitors, forums, patents, and communities beyond your URLs" },
    { stat: "50+", label: "Data points per product from live transaction data" },
    { stat: "Patent Scan", label: "USPTO, Google Patents, Lens.org for IP opportunities and risks" },
    { stat: "3-Phase Plan", label: "Assumption-tested roadmap with financials" },
  ],
  service: [
    { stat: "Multi-Source", label: "Competitor sites, Yelp, Google, forums, and social media" },
    { stat: "Vision AI", label: "UX patterns, positioning, and friction from screenshots" },
    { stat: "Friction Map", label: "Workflow bottlenecks and engagement drop-offs" },
    { stat: "Pricing Intel", label: "Real competitor pricing scraped from live data" },
    { stat: "Critical Lens", label: "Surfaces what competitors are missing" },
  ],
  business: [
    { stat: "7 Dimensions", label: "First-principles strategic deconstruction" },
    { stat: "Gemini Pro", label: "Multi-step reasoning for complex business logic" },
    { stat: "Friction Analysis", label: "Every engagement and workflow pain point mapped" },
    { stat: "Assumption Audit", label: "Questions every belief about how the business works" },
    { stat: "Full Blueprint", label: "Reinvention plan with IP and financial modeling" },
  ],
};

const MODE_WHAT_YOU_GET: Record<Mode, string[]> = {
  discover: [
    "Revival Potential Score (1-10) across 6 dimensions per product",
    "Reinvented product concepts with bill-of-materials estimates",
    "Live pricing from eBay, Etsy, and collector marketplaces",
    "Community sentiment from Reddit, TikTok, and Google trends",
    "Supply chain mapping with verified suppliers and MOQs",
    "Patent landscape, expired IP goldmines, active risks, and innovation gaps",
    "Friction analysis, why the product lost traction and what was never fixed",
    "3-phase execution roadmap with budget and ROI projections",
  ],
  custom: [
    "Commercial intelligence dossier from broad internet crawling",
    "Real pricing data, market averages, premiums, and trend trajectories",
    "Supply chain mapping with OEMs, cost breakdowns, and alt sourcing",
    "Competitive landscape with pricing gaps and positioning blind spots",
    "Patent intel, expired IP to leverage, active patents to avoid, white space",
    "Unfiltered community complaints and feature requests from forums",
    "Flipped product ideas challenging original design assumptions",
    "3-phase go-to-market plan with stress-tested projections",
  ],
  service: [
    "Market positioning against the full competitive landscape",
    "Pricing breakdown, how competitors charge and where gaps exist",
    "User journey friction map with drop-off points and causes",
    "Underserved segments the competition has overlooked",
    "Competitive moat analysis, what differentiates winners from losers",
    "Growth strategy with acquisition channels, costs, and retention mechanics",
    "Scaling projections grounded in real market data",
  ],
  business: [
    "Customer journey friction map ranked by impact",
    "Cost structure deconstruction, where money leaks and why",
    "Technology leverage audit with automation difficulty ratings",
    "User workflow analysis, actual behavior vs. assumptions",
    "Competitive repositioning with a defensible moat plan",
    "Revenue paths surfaced by challenging pricing assumptions",
    "Reinvention blueprint with IP considerations and phased timeline",
  ],
};

export { type Mode as AnalysisMode };

export const AnalysisForm = ({ onAnalyze, onBusinessAnalysis, isLoading, mode: externalMode, onModeChange }: AnalysisFormProps) => {
  const [internalMode, setInternalMode] = useState<Mode>("discover");
  const mode = externalMode ?? internalMode;
  const setMode = (m: Mode) => { onModeChange ? onModeChange(m) : setInternalMode(m); };
  
  // Two-phase flow: "select" (cards) → "confirm" (dialog) → "form" (dedicated screen)
  const [phase, setPhase] = useState<"select" | "confirm" | "form">("select");
  const [pendingMode, setPendingMode] = useState<Mode | null>(null);
  const prevExternalMode = useRef(externalMode);

  // When external mode changes (tab clicked), jump to confirm phase
  useEffect(() => {
    if (externalMode && externalMode !== prevExternalMode.current) {
      prevExternalMode.current = externalMode;
      setPendingMode(externalMode);
      setPhase("confirm");
    }
  }, [externalMode]);

  const [category, setCategory] = useState("Toys & Games");
  const [era, setEra] = useState("80s–90s");
  const [batchSize, setBatchSize] = useState(10);
  const [customProducts, setCustomProducts] = useState<CustomProductInput[]>([{}]);
  const [activeInputTab, setActiveInputTab] = useState<"url" | "image">("url");
  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [customUrls, setCustomUrls] = useState<string[]>([""]);
  const [customImages, setCustomImages] = useState<{ file: File; dataUrl: string }[]>([]);
  const [customName, setCustomName] = useState("");
  const [customNotes, setCustomNotes] = useState("");
  const multiImageRef = useRef<HTMLInputElement | null>(null);
  const [businessInput, setBusinessInput] = useState<BusinessInput>({
    type: "", description: "", revenueModel: "", size: "", geography: "", painPoints: "", notes: "",
  });
  const [businessLoading, setBusinessLoading] = useState(false);

  const hasCustomProducts = customUrls.some(u => u.trim()) || customImages.length > 0 || customName.trim();

  const handleModeClick = (id: Mode) => {
    setPendingMode(id);
    setPhase("confirm");
  };

  const handleConfirm = () => {
    if (pendingMode) {
      setMode(pendingMode);
      setPhase("form");
      setPendingMode(null);
    }
  };

  const handleBack = () => {
    setPhase("select");
    setPendingMode(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "custom" || mode === "service") {
      const filled: CustomProductInput[] = [{
        productName: customName,
        notes: mode === "service" ? `[SERVICE ANALYSIS] ${customNotes}` : customNotes,
        urls: customUrls.filter(u => u.trim()),
        images: customImages,
        productUrl: customUrls.find(u => u.trim()) || "",
        imageDataUrl: customImages[0]?.dataUrl,
        imageFile: customImages[0]?.file,
      }];
      onAnalyze({ category: mode === "service" ? "Service" : "Custom", era: "All Eras / Current", batchSize: 1, customProducts: filled });
    } else {
      onAnalyze({ category, era, batchSize });
    }
  };

  const handleImageFile = (index: number, file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCustomProducts((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], imageFile: file, imageDataUrl: ev.target?.result as string };
        return next;
      });
    };
    reader.readAsDataURL(file);
  };

  const updateCustomProduct = (index: number, field: keyof CustomProductInput, value: string) => {
    setCustomProducts((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const removeCustomProduct = (index: number) => {
    setCustomProducts((prev) => prev.filter((_, i) => i !== index));
  };

  const addCustomProduct = () => {
    setCustomProducts((prev) => [...prev, {}]);
  };

  const runBusinessAnalysis = async () => {
    if (!businessInput.type.trim() || !businessInput.description.trim()) {
      toast.error("Please enter the business type and a description.");
      return;
    }
    setBusinessLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("business-model-analysis", {
        body: { businessModel: businessInput },
      });
      if (error || !result?.success) {
        const msg = result?.error || error?.message || "Analysis failed";
        toast.error("Business model analysis failed: " + msg);
        return;
      }
      onBusinessAnalysis?.(result.analysis);
      toast.success("Business model analysis complete!");
    } catch (err) {
      toast.error("Unexpected error: " + String(err));
    } finally {
      setBusinessLoading(false);
    }
  };

  const inputStyle = {
    border: "1.5px solid hsl(var(--border))",
    background: "hsl(var(--background))",
    color: "hsl(var(--foreground))",
  } as React.CSSProperties;

  const MODE_OPTIONS: {
    id: Mode;
    label: string;
    tagline: string;
    description: string;
    behindTheScenes: string;
    bullets: string[];
    icon: React.ElementType;
    accent: string;
    accentLight: string;
  }[] = [
    {
      id: "custom",
      label: "Analyze A Product",
      tagline: "Deep Product Audit",
      description: "Drop in URLs or photos — AI scrapes pages, reads images, and builds a full commercial intelligence dossier.",
      behindTheScenes: "Each URL is scraped for pricing, reviews & specs. Images analyzed with vision AI. All data feeds into a unified market report.",
      bullets: ["Scrapes up to 3 URLs + analyzes 5 images", "Pricing intel, supply chain & action plan", "Competitive landscape + revival scoring"],
      icon: Upload,
      accent: "hsl(217 91% 38%)",
      accentLight: "hsl(214 95% 93%)",
    },
    {
      id: "service" as Mode,
      label: "Analyze A Service",
      tagline: "Service Intelligence",
      description: "URLs, screenshots, or a description — AI analyzes pricing models, competition, pain points, and growth paths.",
      behindTheScenes: "URLs scraped for service details, reviews & pricing. All data feeds into a unified service intelligence report.",
      bullets: ["Scrapes up to 3 URLs + analyzes 5 images", "Pricing models, competitor mapping & gaps", "Customer pain points + growth strategies"],
      icon: Briefcase,
      accent: "hsl(340 75% 50%)",
      accentLight: "hsl(340 75% 95%)",
    },
    {
      id: "business",
      label: "Business Model Analysis",
      tagline: "Strategic Reinvention",
      description: "Deconstruct any business from first principles — maps customer journeys, cost structures, and automation opportunities.",
      behindTheScenes: "Gemini Pro analyzes across 7 strategic dimensions: customer journey, cost structure, tech leverage, competition, and reinvention paths.",
      bullets: ["7-dimension strategic deconstruction", "Hidden leverage & automation gaps", "Reinvention blueprint with financials"],
      icon: Building2,
      accent: "hsl(271 81% 55%)",
      accentLight: "hsl(271 81% 95%)",
    },
    {
      id: "discover",
      label: "Reinvent Nostalgic Products",
      tagline: "Market Intelligence",
      description: "Crawls eBay, Etsy, Reddit, TikTok, and patent registries to find undervalued products with comeback potential.",
      behindTheScenes: "Firecrawl scrapes 8+ data sources simultaneously, then Gemini AI scores each product across feasibility, desirability & profitability.",
      bullets: ["Live web scraping across marketplaces", "Revival scoring + flip ideas with BOM estimates", "Up to 50 products analyzed per batch"],
      icon: Telescope,
      accent: "hsl(var(--primary))",
      accentLight: "hsl(var(--primary-muted))",
    },
  ];

  // ─── CONFIRMATION DIALOG ───
  if (phase === "confirm" && pendingMode) {
    const modeOption = MODE_OPTIONS.find(m => m.id === pendingMode)!;
    const steps = MODE_STEPS[pendingMode];
    const capabilities = MODE_CAPABILITIES[pendingMode];
    const whatYouGet = MODE_WHAT_YOU_GET[pendingMode];
    const Icon = modeOption.icon;

    return (
      <div className="space-y-6">
        {/* Back link */}
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-2 text-sm font-semibold transition-colors hover:opacity-80"
          style={{ color: "hsl(var(--muted-foreground))" }}
        >
          <ArrowLeft size={16} /> Back to analysis modes
        </button>

        <div
          className="rounded-2xl overflow-hidden"
          style={{
            border: `2px solid ${modeOption.accent}`,
            background: "hsl(var(--card))",
            boxShadow: `0 12px 40px -8px ${modeOption.accent}30`,
          }}
        >
          {/* Header */}
          <div className="p-8 text-center relative overflow-hidden" style={{ background: modeOption.accent }}>
            {/* Decorative orbs */}
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-10" style={{ background: "white" }} />
            <div className="absolute -bottom-12 -left-12 w-36 h-36 rounded-full opacity-10" style={{ background: "white" }} />
            
            <div
              className="w-18 h-18 rounded-2xl flex items-center justify-center mx-auto mb-4 relative"
              style={{ background: "hsl(0 0% 100% / 0.18)", width: "72px", height: "72px" }}
            >
              <Icon size={36} style={{ color: "white" }} />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">{modeOption.label}</h2>
            <p className="text-sm text-white/80 font-medium mb-3">{modeOption.tagline}</p>
            <p className="text-xs text-white/60 max-w-md mx-auto leading-relaxed">
              Powered by SGP Capital's proprietary AI research models — challenging every assumption and rebuilding from the ground up.
            </p>
          </div>

          {/* Content */}
          <div className="p-6 space-y-7">
            {/* Description */}
            <p className="text-sm text-muted-foreground text-center leading-relaxed max-w-lg mx-auto">
              {modeOption.description}
            </p>

            {/* Capability Stats Grid */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-center" style={{ color: modeOption.accent }}>
                What Powers This Analysis
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                {capabilities.map((cap, i) => (
                  <div
                    key={i}
                    className="rounded-xl p-3 text-center"
                    style={{
                      background: modeOption.accentLight,
                      border: `1px solid ${modeOption.accent}15`,
                    }}
                  >
                    <p className="text-sm font-extrabold text-foreground">{cap.stat}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{cap.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Steps overview */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-center" style={{ color: modeOption.accent }}>
                {steps.length}-Step Analysis Pipeline
              </h3>
              <div className="space-y-2 max-w-xl mx-auto">
                {steps.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-xl p-3.5"
                    style={{
                      background: modeOption.accentLight,
                      border: `1px solid ${modeOption.accent}15`,
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                      style={{ background: modeOption.accent, color: "white" }}
                    >
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-foreground">{s.label}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{s.detail}</p>
                    </div>
                    {i < steps.length - 1 && (
                      <ChevronRight size={14} className="mt-1.5 flex-shrink-0" style={{ color: modeOption.accent, opacity: 0.4 }} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* What You'll Get */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-center" style={{ color: modeOption.accent }}>
                What You'll Receive
              </h3>
              <div className="max-w-xl mx-auto rounded-xl p-4 space-y-2" style={{ background: "hsl(var(--muted) / 0.3)", border: "1px solid hsl(var(--border))" }}>
                {whatYouGet.map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 size={13} className="flex-shrink-0 mt-0.5" style={{ color: modeOption.accent }} />
                    <p className="text-xs text-foreground leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Behind the scenes */}
            <div
              className="rounded-xl p-4 text-center max-w-xl mx-auto"
              style={{ background: "hsl(var(--muted) / 0.5)", border: "1px solid hsl(var(--border))" }}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Behind the Scenes</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{modeOption.behindTheScenes}</p>
            </div>

            {/* Trust signals */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">TLS encrypted</span>
              <span className="flex items-center gap-1">No data retained by AI</span>
              <span className="flex items-center gap-1">Row-level security</span>
              <span className="flex items-center gap-1">Serverless isolation</span>
            </div>

            {/* CTA */}
            <div className="flex flex-col items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleConfirm}
                className="flex items-center gap-2.5 px-10 py-3.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: `linear-gradient(135deg, ${modeOption.accent}, ${modeOption.accent})`,
                  boxShadow: `0 8px 24px -6px ${modeOption.accent}50`,
                }}
              >
                <Sparkles size={16} /> Yes, Begin {modeOption.label} <ChevronRight size={16} />
              </button>
              <button
                type="button"
                onClick={handleBack}
                className="text-xs font-medium transition-colors hover:underline"
                style={{ color: "hsl(var(--muted-foreground))" }}
              >
                ← Choose a different analysis mode
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── FORM SCREEN (with back button + step progress) ───
  if (phase === "form") {
    const activeOption = MODE_OPTIONS.find(m => m.id === mode)!;
    const steps = MODE_STEPS[mode];
    const Icon = activeOption.icon;

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Back button + mode header */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02]"
            style={{
              background: "hsl(var(--muted))",
              color: "hsl(var(--foreground))",
              border: "1px solid hsl(var(--border))",
            }}
          >
            <ArrowLeft size={15} /> Back
          </button>
          <div className="flex items-center gap-3 flex-1">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: activeOption.accent }}
            >
              <Icon size={18} style={{ color: "white" }} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-foreground leading-tight">{activeOption.label}</h2>
              <p className="text-xs text-muted-foreground">{activeOption.tagline} · Step 1 of {steps.length}</p>
            </div>
          </div>
        </div>

        {/* Step progress bar */}
        <div className="flex items-center gap-1">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-1 flex-1">
              <div className="flex items-center gap-1.5 flex-1">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
                  style={{
                    background: i === 0 ? activeOption.accent : "hsl(var(--muted))",
                    color: i === 0 ? "white" : "hsl(var(--muted-foreground))",
                  }}
                >
                  {i === 0 ? <CheckCircle2 size={12} /> : i + 1}
                </div>
                <span className="text-[10px] font-medium text-muted-foreground hidden sm:inline truncate">{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className="h-px flex-1 min-w-4" style={{ background: "hsl(var(--border))" }} />
              )}
            </div>
          ))}
        </div>

        {/* Form content area */}
        <div
          className="rounded-2xl p-5 space-y-5"
          style={{
            border: `2px solid ${activeOption.accent}`,
            background: `linear-gradient(180deg, ${activeOption.accentLight} 0%, hsl(var(--card)) 40%)`,
            boxShadow: `0 4px 20px -4px ${activeOption.accent}20`,
          }}
        >
          {/* MODE A — Discover by Category */}
          {mode === "discover" && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">Product Category</label>
                <select
                  value={CATEGORIES.includes(category) ? category : "__custom__"}
                  onChange={(e) => {
                    if (e.target.value === "__custom__") return;
                    setCategory(e.target.value);
                  }}
                  className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none relative z-50"
                  style={{ ...inputStyle, WebkitAppearance: "menulist" }}
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  {!CATEGORIES.includes(category) && category && (
                    <option value={category}>{category}</option>
                  )}
                </select>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-bold">or</span>
                  <input
                    type="text"
                    value={!CATEGORIES.includes(category) ? category : ""}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Type any category — e.g. 'Vintage Watches', 'Arcade Machines'…"
                    className="w-full rounded-lg pl-7 pr-3 py-2 text-xs focus:outline-none"
                    style={{ ...inputStyle, borderStyle: "dashed", background: "hsl(var(--primary) / 0.04)" }}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">Era / Nostalgia Focus</label>
                <select
                  value={ERAS.includes(era) ? era : "__custom__"}
                  onChange={(e) => {
                    if (e.target.value === "__custom__") return;
                    setEra(e.target.value);
                  }}
                  className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none relative z-50"
                  style={{ ...inputStyle, WebkitAppearance: "menulist" }}
                >
                  {ERAS.map((e) => <option key={e} value={e}>{e}</option>)}
                  {!ERAS.includes(era) && era && (
                    <option value={era}>{era}</option>
                  )}
                </select>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-bold">or</span>
                  <input
                    type="text"
                    value={!ERAS.includes(era) ? era : ""}
                    onChange={(e) => setEra(e.target.value)}
                    placeholder="Type any era — e.g. '1950s', 'Y2K', 'Pre-digital'…"
                    className="w-full rounded-lg pl-7 pr-3 py-2 text-xs focus:outline-none"
                    style={{ ...inputStyle, borderStyle: "dashed", background: "hsl(var(--primary) / 0.04)" }}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">Batch Size ({batchSize})</label>
                <div className="flex items-center gap-3">
                  <input type="range" min={5} max={50} step={5} value={batchSize}
                    onChange={(e) => setBatchSize(Number(e.target.value))}
                    className="flex-1 accent-blue-600" />
                  <span className="w-10 text-center text-sm font-bold rounded-md px-1 py-0.5"
                    style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
                    {batchSize}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* MODE B — Analyze My Products */}
          {mode === "custom" && (
            <div className="space-y-5">
              <p className="text-xs text-muted-foreground">
                Provide up to <strong>3 product URLs</strong> and <strong>5 images</strong> — AI uses all of them for a comprehensive intelligence report.
              </p>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Product / Topic Name</label>
                <input type="text" value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Nintendo Game Boy (1989)"
                  className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                  style={inputStyle} />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Link size={11} /> Product URLs ({customUrls.filter(u => u.trim()).length}/3)
                  </label>
                </div>
                {customUrls.map((url, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <div className="relative flex-1">
                      <Link size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input type="url" value={url}
                        onChange={(e) => {
                          setCustomUrls(prev => {
                            const next = [...prev];
                            next[i] = e.target.value;
                            return next;
                          });
                        }}
                        placeholder={`URL ${i + 1} — Amazon, eBay, any site…`}
                        className="w-full rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none"
                        style={inputStyle} />
                    </div>
                    {customUrls.length > 1 && (
                      <button type="button" onClick={() => setCustomUrls(prev => prev.filter((_, j) => j !== i))}
                        className="p-1.5 rounded-lg transition-colors hover:bg-destructive/10">
                        <X size={12} className="text-destructive" />
                      </button>
                    )}
                  </div>
                ))}
                {customUrls.length < 3 && (
                  <button type="button" onClick={() => setCustomUrls(prev => [...prev, ""])}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                    style={{ border: "1.5px dashed hsl(var(--border))", color: "hsl(var(--primary))" }}>
                    <Plus size={10} /> Add URL
                  </button>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <ImageIcon size={11} /> Product Images ({customImages.length}/5)
                </label>
                <div className="flex flex-wrap gap-3">
                  {customImages.map((img, i) => (
                    <div key={i} className="relative">
                      <img src={img.dataUrl} alt={`upload ${i + 1}`}
                        className="h-20 w-28 object-cover rounded-xl"
                        style={{ border: "1.5px solid hsl(var(--border))" }} />
                      <button type="button"
                        onClick={() => setCustomImages(prev => prev.filter((_, j) => j !== i))}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: "hsl(var(--destructive))" }}>
                        <X size={10} style={{ color: "white" }} />
                      </button>
                    </div>
                  ))}
                  {customImages.length < 5 && (
                    <div
                      className="flex flex-col items-center justify-center h-20 w-28 rounded-xl cursor-pointer border-2 border-dashed transition-colors"
                      style={{ borderColor: "hsl(var(--primary) / 0.3)", background: "hsl(var(--primary-muted))" }}
                      onClick={() => multiImageRef.current?.click()}
                    >
                      <ImageIcon size={16} style={{ color: "hsl(var(--primary))" }} />
                      <span className="text-[10px] font-medium mt-1" style={{ color: "hsl(var(--primary))" }}>
                        + Add
                      </span>
                      <input
                        ref={multiImageRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          const remaining = 5 - customImages.length;
                          files.slice(0, remaining).forEach(file => {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              setCustomImages(prev => {
                                if (prev.length >= 5) return prev;
                                return [...prev, { file, dataUrl: ev.target?.result as string }];
                              });
                            };
                            reader.readAsDataURL(file);
                          });
                          if (e.target) e.target.value = "";
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Context / Notes (optional)
                </label>
                <input type="text" value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="e.g. Found at a garage sale — want to know revival potential…"
                  className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                  style={inputStyle} />
              </div>
            </div>
          )}

          {/* MODE C — Analyze A Service */}
          {mode === "service" && (
            <div className="space-y-5">
              <p className="text-xs text-muted-foreground">
                Provide up to <strong>3 URLs</strong> (website, Yelp, LinkedIn) and <strong>5 screenshots</strong> — AI analyzes the service's market position, pricing, and growth opportunities.
              </p>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Service / Company Name</label>
                <input type="text" value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Joe's Mobile Car Detailing, CloudKitchen NYC…"
                  className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                  style={inputStyle} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Link size={11} /> Service URLs ({customUrls.filter(u => u.trim()).length}/3)
                </label>
                {customUrls.map((url, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <div className="relative flex-1">
                      <Link size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input type="url" value={url}
                        onChange={(e) => {
                          setCustomUrls(prev => {
                            const next = [...prev];
                            next[i] = e.target.value;
                            return next;
                          });
                        }}
                        placeholder={`URL ${i + 1} — Website, Yelp, Google Maps, LinkedIn…`}
                        className="w-full rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none"
                        style={inputStyle} />
                    </div>
                    {customUrls.length > 1 && (
                      <button type="button" onClick={() => setCustomUrls(prev => prev.filter((_, j) => j !== i))}
                        className="p-1.5 rounded-lg transition-colors hover:bg-destructive/10">
                        <X size={12} className="text-destructive" />
                      </button>
                    )}
                  </div>
                ))}
                {customUrls.length < 3 && (
                  <button type="button" onClick={() => setCustomUrls(prev => [...prev, ""])}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
                    style={{ border: "1.5px dashed hsl(var(--border))", color: "hsl(340 75% 50%)" }}>
                    <Plus size={10} /> Add URL
                  </button>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <ImageIcon size={11} /> Screenshots / Images ({customImages.length}/5)
                </label>
                <div className="flex flex-wrap gap-3">
                  {customImages.map((img, i) => (
                    <div key={i} className="relative">
                      <img src={img.dataUrl} alt={`upload ${i + 1}`}
                        className="h-20 w-28 object-cover rounded-xl"
                        style={{ border: "1.5px solid hsl(var(--border))" }} />
                      <button type="button"
                        onClick={() => setCustomImages(prev => prev.filter((_, j) => j !== i))}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: "hsl(var(--destructive))" }}>
                        <X size={10} style={{ color: "white" }} />
                      </button>
                    </div>
                  ))}
                  {customImages.length < 5 && (
                    <div
                      className="flex flex-col items-center justify-center h-20 w-28 rounded-xl cursor-pointer border-2 border-dashed transition-colors"
                      style={{ borderColor: "hsl(340 75% 50% / 0.3)", background: "hsl(340 75% 95%)" }}
                      onClick={() => multiImageRef.current?.click()}
                    >
                      <ImageIcon size={16} style={{ color: "hsl(340 75% 50%)" }} />
                      <span className="text-[10px] font-medium mt-1" style={{ color: "hsl(340 75% 50%)" }}>
                        + Add
                      </span>
                      <input
                        ref={multiImageRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          const remaining = 5 - customImages.length;
                          files.slice(0, remaining).forEach(file => {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              setCustomImages(prev => {
                                if (prev.length >= 5) return prev;
                                return [...prev, { file, dataUrl: ev.target?.result as string }];
                              });
                            };
                            reader.readAsDataURL(file);
                          });
                          if (e.target) e.target.value = "";
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Context / Notes (optional)
                </label>
                <input type="text" value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="e.g. Interested in scaling this service, want to understand pricing gaps…"
                  className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                  style={inputStyle} />
              </div>
            </div>
          )}

          {/* MODE D — Analyze Business Model */}
          {mode === "business" && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">
                Deconstruct any business model with first-principles reasoning — uncover hidden friction, automation opportunities, and reinvention paths.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">Business Type *</label>
                  <select
                    value={BUSINESS_EXAMPLES.includes(businessInput.type) ? businessInput.type : "__custom__"}
                    onChange={(e) => {
                      if (e.target.value === "__custom__") return;
                      setBusinessInput((p) => ({ ...p, type: e.target.value }));
                    }}
                    className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none relative z-50"
                    style={{ ...inputStyle, WebkitAppearance: "menulist" }}
                  >
                    <option value="">Select a business type…</option>
                    {BUSINESS_EXAMPLES.map((ex) => <option key={ex} value={ex}>{ex}</option>)}
                    {businessInput.type && !BUSINESS_EXAMPLES.includes(businessInput.type) && (
                      <option value={businessInput.type}>{businessInput.type}</option>
                    )}
                  </select>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-bold">or</span>
                    <input
                      type="text"
                      value={!BUSINESS_EXAMPLES.includes(businessInput.type) ? businessInput.type : ""}
                      onChange={(e) => setBusinessInput((p) => ({ ...p, type: e.target.value }))}
                      placeholder="Type any business — e.g. 'SaaS startup', 'Pet grooming'…"
                      className="w-full rounded-lg pl-7 pr-3 py-2 text-xs focus:outline-none"
                      style={{ ...inputStyle, borderStyle: "dashed", background: "hsl(271 81% 55% / 0.04)" }}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">Revenue Model</label>
                  <input
                    type="text"
                    value={businessInput.revenueModel}
                    onChange={(e) => setBusinessInput((p) => ({ ...p, revenueModel: e.target.value }))}
                    placeholder="e.g. Per-use, monthly contract, hourly…"
                    className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                    style={inputStyle}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">Business Description *</label>
                <textarea
                  value={businessInput.description}
                  onChange={(e) => setBusinessInput((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Describe how the business works today — how customers find you, how transactions happen, what the service/product is, how it's delivered…"
                  rows={3}
                  className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none resize-none"
                  style={inputStyle}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">Size / Scale</label>
                  <input type="text" value={businessInput.size}
                    onChange={(e) => setBusinessInput((p) => ({ ...p, size: e.target.value }))}
                    placeholder="e.g. $500k/yr, 10 employees"
                    className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={inputStyle} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">Geography</label>
                  <input type="text" value={businessInput.geography}
                    onChange={(e) => setBusinessInput((p) => ({ ...p, geography: e.target.value }))}
                    placeholder="e.g. Suburban US, regional…"
                    className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={inputStyle} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">Known Pain Points</label>
                  <input type="text" value={businessInput.painPoints}
                    onChange={(e) => setBusinessInput((p) => ({ ...p, painPoints: e.target.value }))}
                    placeholder="e.g. High labor costs, low margins…"
                    className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={inputStyle} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider flex items-center gap-1.5">
                  <Link size={11} /> Website / URLs (optional)
                </label>
                <input type="url" value={businessInput.notes}
                  onChange={(e) => setBusinessInput((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Paste a company website, Yelp listing, LinkedIn page, or any URL for extra context…"
                  className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={inputStyle} />
                <p className="text-[10px] text-muted-foreground">AI will scrape the page for additional business context</p>
              </div>
              <div className="flex items-center gap-3">
                {businessLoading && (
                  <div className="rounded-xl p-4 space-y-3" style={{ background: "hsl(var(--primary) / 0.06)", border: "1px solid hsl(var(--primary) / 0.2)" }}>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {[0,1,2].map(i => (
                          <div key={i} className="w-2 h-2 rounded-full animate-bounce" style={{ background: "hsl(var(--primary))", animationDelay: `${i * 0.15}s` }} />
                        ))}
                      </div>
                      <span className="text-xs font-bold" style={{ color: "hsl(var(--primary))" }}>Gemini AI — Business Model Analysis</span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full animate-pulse" style={{ background: "hsl(var(--primary) / 0.15)", color: "hsl(var(--primary))" }}>Running</span>
                    </div>
                    <div className="space-y-2">
                      {[
                        { label: "Mapping customer journey and friction points", marker: "1" },
                        { label: "Deconstructing cost structure and revenue leaks", marker: "2" },
                        { label: "Identifying automation and tech leverage", marker: "3" },
                        { label: "Building reinvented business model", marker: "4" },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ background: "hsl(var(--primary) / 0.15)", color: "hsl(var(--primary))" }}>{item.marker}</span>
                          <span>{item.label}</span>
                        </div>
                      ))}
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
                      <div className="h-full rounded-full" style={{ background: "hsl(var(--primary))", animation: "progress-indeterminate 1.8s ease-in-out infinite", width: "40%" }} />
                    </div>
                    <p className="text-[10px] text-muted-foreground">⏱ Typically takes 20–45 seconds</p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={runBusinessAnalysis}
                  disabled={businessLoading || !businessInput.type.trim() || !businessInput.description.trim()}
                  className="btn-primary flex items-center gap-2"
                  style={{ opacity: (businessLoading || !businessInput.type.trim() || !businessInput.description.trim()) ? 0.6 : 1 }}
                >
                  {businessLoading ? (
                    <><RefreshCw size={15} className="animate-spin" /> Deconstructing…</>
                  ) : (
                    <><Brain size={15} /> Run Business Model Analysis</>
                  )}
                </button>
                <p className="text-xs text-muted-foreground">7 strategic dimensions · ~20–40 seconds</p>
              </div>
            </div>
          )}

          {mode !== "business" && (
            <div className="flex items-center gap-3">
              <button type="submit" disabled={isLoading} className="btn-primary flex items-center gap-2">
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    {mode === "custom" && hasCustomProducts
                      ? "Analyze A Product"
                      : mode === "service"
                      ? "Analyze A Service"
                      : `Run Product Intelligence Analysis`}
                  </>
                )}
              </button>
              <p className="text-xs text-muted-foreground">
                {mode === "discover"
                  ? `Processes ${batchSize} products · Assigns Revival Scores · Generates Flipped Ideas`
                  : mode === "service"
                  ? "Analyzes service · Pricing, competition & growth opportunities"
                  : `Analyzes ${customProducts.filter(cp => cp.imageDataUrl || cp.productUrl || cp.productName).length || 1} product(s) · Deep custom intelligence report`}
              </p>
            </div>
          )}
        </div>
      </form>
    );
  }

  // ─── MODE SELECTION (default phase) ───
  return (
    <div className="space-y-6">
      {/* Explainer Banner */}
      <div className="rounded-2xl border border-primary/20 px-6 py-8 text-center space-y-4" style={{ background: "linear-gradient(135deg, hsl(var(--primary-muted)) 0%, hsl(var(--secondary)) 100%)" }}>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground font-display tracking-tight">
          Choose Your Analysis Path
        </h2>
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Each mode runs a different AI pipeline. Pick the one that matches what you have and what you want to learn.
        </p>
        <p className="text-xs sm:text-sm text-muted-foreground/70 max-w-2xl mx-auto leading-relaxed">
          Powered by deep web crawling, vision AI, and multi-model strategic analysis that challenges every assumption and helps you uncover new routes to market.
        </p>
        <div className="flex items-start justify-center gap-2.5 pt-2 max-w-2xl mx-auto text-left">
          <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5" style={{ background: "hsl(var(--success) / 0.15)" }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="hsl(var(--success))" className="w-3 h-3"><path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" /></svg>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">Privacy by design:</span> All connections use TLS encryption in transit. Analysis runs in isolated serverless functions that process your data and discard it after responding — nothing is logged or retained by AI providers. When you choose to save an analysis, it's encrypted at rest and scoped exclusively to your account via row-level security policies. We never sell, share, or train on your data.
          </p>
        </div>
      </div>

      {/* Mode Selection */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: "hsl(var(--border))" }} />
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: "hsl(var(--primary))" }}>
              Step 1
            </p>
            <h2 className="text-2xl font-extrabold text-foreground leading-tight">
              What do you want to analyze?
            </h2>
          </div>
          <div className="flex-1 h-px" style={{ background: "hsl(var(--border))" }} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {MODE_OPTIONS.map(({ id, label, tagline, description, behindTheScenes, bullets, icon: Icon, accent, accentLight }) => {
            const steps = MODE_STEPS[id];
            return (
              <button
                key={id}
                type="button"
                onClick={() => handleModeClick(id)}
                className="relative text-left rounded-2xl transition-all duration-200 focus:outline-none overflow-hidden group"
                style={{
                  border: `2.5px solid hsl(var(--border))`,
                  boxShadow: "0 2px 8px 0 hsl(220 20% 5% / 0.07)",
                  background: "hsl(var(--card))",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = accent;
                  (e.currentTarget as HTMLElement).style.background = accentLight;
                  (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--border))";
                  (e.currentTarget as HTMLElement).style.background = "hsl(var(--card))";
                  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                }}
              >
                {/* Top accent strip */}
                <div className="h-1 w-full" style={{ background: accent }} />
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center"
                      style={{ background: accentLight }}
                    >
                      <Icon size={24} style={{ color: accent }} />
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: accent }}>
                      {steps.length} steps <ChevronRight size={14} />
                    </div>
                  </div>

                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: accent }}>
                    {tagline}
                  </p>
                  <p className="text-base font-extrabold leading-tight mb-2 text-foreground">
                    {label}
                  </p>
                  <p className="text-xs leading-relaxed text-muted-foreground mb-3">
                    {description}
                  </p>

                  <ul className="space-y-1.5 mb-3">
                    {bullets.map((b) => (
                      <li key={b} className="flex items-start gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1" style={{ background: accent }} />
                        <span className="text-[11px] leading-snug text-muted-foreground">{b}</span>
                      </li>
                    ))}
                  </ul>

                  <div
                    className="rounded-lg px-3 py-2"
                    style={{
                      background: "hsl(var(--muted) / 0.5)",
                      border: "1px solid hsl(var(--border))",
                    }}
                  >
                    <p className="text-[9px] font-bold uppercase tracking-wider mb-0.5 text-muted-foreground">How it works</p>
                    <p className="text-[10px] leading-relaxed text-muted-foreground">{behindTheScenes}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
