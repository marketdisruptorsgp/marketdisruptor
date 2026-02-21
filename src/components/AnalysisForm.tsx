import { useState, useRef } from "react";
import { Sparkles, Upload, Link, X, Image as ImageIcon, Plus, Telescope, Building2, Brain, RefreshCw } from "lucide-react";
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

type Mode = "discover" | "custom" | "business";

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

export { type Mode as AnalysisMode };

export const AnalysisForm = ({ onAnalyze, onBusinessAnalysis, isLoading, mode: externalMode, onModeChange }: AnalysisFormProps) => {
  const [internalMode, setInternalMode] = useState<Mode>("discover");
  const mode = externalMode ?? internalMode;
  const setMode = (m: Mode) => { onModeChange ? onModeChange(m) : setInternalMode(m); };
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "custom") {
      // Build a single custom product with all URLs and images
      const filled: CustomProductInput[] = [{
        productName: customName,
        notes: customNotes,
        urls: customUrls.filter(u => u.trim()),
        images: customImages,
        // Keep legacy fields for backwards compat with edge function
        productUrl: customUrls.find(u => u.trim()) || "",
        imageDataUrl: customImages[0]?.dataUrl,
        imageFile: customImages[0]?.file,
      }];
      onAnalyze({ category: "Custom", era: "All Eras / Current", batchSize: 1, customProducts: filled });
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
      id: "discover",
      label: "Reinvent Nostalgic Products",
      tagline: "Market Intelligence",
      description: "AI crawls the live web — eBay sold listings, Etsy trends, Reddit communities, and TikTok viral signals — to find undervalued products with comeback potential.",
      behindTheScenes: "Firecrawl scrapes 8+ data sources simultaneously, then Gemini AI scores each product across feasibility, desirability & profitability.",
      bullets: ["Live web scraping across marketplaces", "Revival scoring + flip ideas with BOM estimates", "Up to 50 products analyzed per batch"],
      icon: Telescope,
      accent: "hsl(var(--primary))",
      accentLight: "hsl(var(--primary-muted))",
    },
    {
      id: "custom",
      label: "Analyze A Product",
      tagline: "Deep Product Audit",
      description: "Drop in URLs or photos of any product — AI scrapes the pages, reads the images, and builds a full commercial intelligence dossier.",
      behindTheScenes: "Each URL is scraped for pricing, reviews & specs. Images are analyzed with vision AI. All data feeds into a unified market report.",
      bullets: ["Scrapes up to 3 URLs + analyzes 5 images", "Pricing intel, supply chain & action plan", "Competitive landscape + revival scoring"],
      icon: Upload,
      accent: "hsl(217 91% 38%)",
      accentLight: "hsl(214 95% 93%)",
    },
    {
      id: "business",
      label: "Business Model Analysis",
      tagline: "Strategic Reinvention",
      description: "Deconstruct any business from first principles — AI maps customer journeys, cost structures, and automation opportunities to find hidden leverage.",
      behindTheScenes: "Gemini Pro analyzes your business across 7 strategic dimensions: customer journey, cost structure, tech leverage, competition, and reinvention paths.",
      bullets: ["7-dimension strategic deconstruction", "Hidden leverage & automation gaps identified", "Full reinvention blueprint with financials"],
      icon: Building2,
      accent: "hsl(271 81% 55%)",
      accentLight: "hsl(271 81% 95%)",
    },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
        {/* Heading */}
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

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {MODE_OPTIONS.map(({ id, label, tagline, description, behindTheScenes, bullets, icon: Icon, accent, accentLight }) => {
            const isActive = mode === id;
            return (
              <div key={id} className="relative flex flex-col">
                <button
                  type="button"
                  onClick={() => setMode(id)}
                  className="relative text-left rounded-2xl transition-all duration-200 focus:outline-none overflow-hidden flex-1"
                  style={{
                    border: `2.5px solid ${isActive ? accent : "hsl(var(--border))"}`,
                    boxShadow: isActive
                      ? `0 12px 32px -6px ${accent}50, 0 0 0 1px ${accent}20`
                      : "0 2px 8px 0 hsl(220 20% 5% / 0.07)",
                    transform: isActive ? "translateY(-3px) scale(1.01)" : "translateY(0) scale(1)",
                    background: isActive ? accent : "hsl(var(--card))",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.borderColor = accent;
                      (e.currentTarget as HTMLElement).style.background = accentLight;
                      (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--border))";
                      (e.currentTarget as HTMLElement).style.background = "hsl(var(--card))";
                      (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                    }
                  }}
                >
                  {/* Top accent strip */}
                  <div
                    className="h-1 w-full"
                    style={{ background: isActive ? "hsl(0 0% 100% / 0.25)" : accent }}
                  />

                  <div className="p-5">
                    {/* Icon + check row */}
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center"
                        style={{
                          background: isActive ? "hsl(0 0% 100% / 0.18)" : accentLight,
                        }}
                      >
                        <Icon size={24} style={{ color: isActive ? "white" : accent }} />
                      </div>

                      {/* Selection circle */}
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{
                          border: `2px solid ${isActive ? "hsl(0 0% 100% / 0.6)" : "hsl(var(--border))"}`,
                          background: isActive ? "hsl(0 0% 100% / 0.2)" : "transparent",
                        }}
                      >
                        {isActive && (
                          <div className="w-2.5 h-2.5 rounded-full bg-white" />
                        )}
                      </div>
                    </div>

                    {/* Tagline */}
                    <p
                      className="text-[10px] font-bold uppercase tracking-widest mb-1"
                      style={{ color: isActive ? "hsl(0 0% 100% / 0.65)" : accent }}
                    >
                      {tagline}
                    </p>

                    {/* Title */}
                    <p
                      className="text-base font-extrabold leading-tight mb-2"
                      style={{ color: isActive ? "white" : "hsl(var(--foreground))" }}
                    >
                      {label}
                    </p>

                    {/* Description */}
                    <p
                      className="text-xs leading-relaxed mb-3"
                      style={{ color: isActive ? "hsl(0 0% 100% / 0.8)" : "hsl(var(--muted-foreground))" }}
                    >
                      {description}
                    </p>

                    {/* Bullets */}
                    <ul className="space-y-1.5 mb-3">
                      {bullets.map((b) => (
                        <li key={b} className="flex items-start gap-1.5">
                          <div
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1"
                            style={{ background: isActive ? "hsl(0 0% 100% / 0.5)" : accent }}
                          />
                          <span
                            className="text-[11px] leading-snug"
                            style={{ color: isActive ? "hsl(0 0% 100% / 0.7)" : "hsl(var(--muted-foreground))" }}
                          >
                            {b}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* Behind the scenes */}
                    <div
                      className="rounded-lg px-3 py-2"
                      style={{
                        background: isActive ? "hsl(0 0% 100% / 0.1)" : "hsl(var(--muted) / 0.5)",
                        border: `1px solid ${isActive ? "hsl(0 0% 100% / 0.15)" : "hsl(var(--border))"}`,
                      }}
                    >
                      <p
                        className="text-[9px] font-bold uppercase tracking-wider mb-0.5"
                        style={{ color: isActive ? "hsl(0 0% 100% / 0.5)" : "hsl(var(--muted-foreground))" }}
                      >
                        ⚙️ How it works
                      </p>
                      <p
                        className="text-[10px] leading-relaxed"
                        style={{ color: isActive ? "hsl(0 0% 100% / 0.65)" : "hsl(var(--muted-foreground))" }}
                      >
                        {behindTheScenes}
                      </p>
                    </div>
                  </div>
                </button>

                {/* Visual connector arrow from active card to form */}
                {isActive && (
                  <div className="flex justify-center -mb-3 relative z-10">
                    <div
                      className="w-4 h-4 rotate-45 rounded-sm"
                      style={{
                        background: accent,
                        marginTop: "-8px",
                        boxShadow: `0 4px 12px -2px ${accent}40`,
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Active mode form area — visually connected */}
      {(() => {
        const activeMode = MODE_OPTIONS.find(m => m.id === mode)!;
        return (
          <div
            className="rounded-2xl p-5 space-y-5 relative"
            style={{
              border: `2px solid ${activeMode.accent}`,
              borderTop: `3px solid ${activeMode.accent}`,
              marginTop: "-8px",
              background: `linear-gradient(180deg, ${activeMode.accentLight} 0%, hsl(var(--card)) 40%)`,
              boxShadow: `0 4px 20px -4px ${activeMode.accent}20`,
            }}
          >

      {/* MODE A — Discover by Category */}
      {mode === "discover" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Category */}
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
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px]">✏️</span>
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

          {/* Era */}
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
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px]">✏️</span>
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

          {/* Batch size */}
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

          {/* Product Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Product / Topic Name</label>
            <input type="text" value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="e.g. Nintendo Game Boy (1989)"
              className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
              style={inputStyle} />
          </div>

          {/* URLs Section */}
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

          {/* Images Section */}
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

          {/* Notes */}
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

      {/* MODE C — Analyze Business Model */}
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
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px]">✏️</span>
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
                    { label: "Mapping customer journey & friction points", icon: "🔍" },
                    { label: "Deconstructing cost structure & revenue leaks", icon: "💰" },
                    { label: "Identifying automation & tech leverage", icon: "⚡" },
                    { label: "Building reinvented business model", icon: "🚀" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{item.icon}</span>
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
                  : `Run Product Intelligence Analysis`}
              </>
            )}
          </button>
          <p className="text-xs text-muted-foreground">
            {mode === "discover"
              ? `Processes ${batchSize} products · Assigns Revival Scores · Generates Flipped Ideas`
              : `Analyzes ${customProducts.filter(cp => cp.imageDataUrl || cp.productUrl || cp.productName).length || 1} product(s) · Deep custom intelligence report`}
          </p>
        </div>
      )}
      </div>
        );
      })()}
    </form>
  );
};
