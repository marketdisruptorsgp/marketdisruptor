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

export const AnalysisForm = ({ onAnalyze, onBusinessAnalysis, isLoading }: AnalysisFormProps) => {
  const [mode, setMode] = useState<Mode>("discover");
  const [category, setCategory] = useState("Toys & Games");
  const [era, setEra] = useState("80s–90s");
  const [batchSize, setBatchSize] = useState(10);
  const [customProducts, setCustomProducts] = useState<CustomProductInput[]>([{}]);
  const [activeInputTab, setActiveInputTab] = useState<"url" | "image">("url");
  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [businessInput, setBusinessInput] = useState<BusinessInput>({
    type: "", description: "", revenueModel: "", size: "", geography: "", painPoints: "", notes: "",
  });
  const [businessLoading, setBusinessLoading] = useState(false);

  const hasCustomProducts = customProducts.some(
    (cp) => cp.imageDataUrl || cp.productUrl || cp.productName
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "custom") {
      const filled = customProducts.filter(
        (cp) => cp.imageDataUrl || cp.productUrl || cp.productName
      );
      onAnalyze({ category: "Custom", era: "All Eras / Current", batchSize: filled.length || 1, customProducts: filled });
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
    icon: React.ElementType;
    accent: string;
    accentLight: string;
    badge: string;
  }[] = [
    {
      id: "discover",
      label: "Discover by Category",
      tagline: "Market Intelligence",
      description: "Find hidden gems across any product category & era. AI scrapes eBay, Etsy, Reddit & more.",
      icon: Telescope,
      accent: "hsl(var(--primary))",
      accentLight: "hsl(var(--primary-muted))",
      badge: "Most Popular",
    },
    {
      id: "custom",
      label: "Analyze My Products",
      tagline: "Deep Product Audit",
      description: "Upload images or paste URLs. Get a full revival potential & pricing intelligence report.",
      icon: Upload,
      accent: "hsl(217 91% 38%)",
      accentLight: "hsl(214 95% 93%)",
      badge: "Custom",
    },
    {
      id: "business",
      label: "Business Model Analysis",
      tagline: "Strategic Reinvention",
      description: "Deconstruct any business with first-principles reasoning. Uncover hidden leverage & reinvention paths.",
      icon: Building2,
      accent: "hsl(271 81% 55%)",
      accentLight: "hsl(271 81% 95%)",
      badge: "Advanced",
    },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Mode Selection Cards */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "hsl(var(--muted-foreground))" }}>
          Choose your analysis mode
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {MODE_OPTIONS.map(({ id, label, tagline, description, icon: Icon, accent, accentLight, badge }) => {
            const isActive = mode === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setMode(id)}
                className="relative text-left p-4 rounded-2xl transition-all duration-200 group focus:outline-none"
                style={{
                  background: isActive ? accent : "hsl(var(--card))",
                  border: `2px solid ${isActive ? accent : "hsl(var(--border))"}`,
                  boxShadow: isActive ? `0 8px 24px -4px ${accent}40` : "0 1px 4px 0 hsl(220 20% 5% / 0.06)",
                  transform: isActive ? "translateY(-2px)" : "translateY(0)",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.borderColor = accent;
                    (e.currentTarget as HTMLElement).style.background = accentLight;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--border))";
                    (e.currentTarget as HTMLElement).style.background = "hsl(var(--card))";
                  }
                }}
              >
                {/* Badge */}
                <span
                  className="absolute top-3 right-3 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider"
                  style={{
                    background: isActive ? "hsl(0 0% 100% / 0.2)" : accentLight,
                    color: isActive ? "white" : accent,
                  }}
                >
                  {badge}
                </span>

                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                  style={{
                    background: isActive ? "hsl(0 0% 100% / 0.15)" : accentLight,
                  }}
                >
                  <Icon size={20} style={{ color: isActive ? "white" : accent }} />
                </div>

                {/* Tagline */}
                <p
                  className="text-[10px] font-bold uppercase tracking-widest mb-0.5"
                  style={{ color: isActive ? "hsl(0 0% 100% / 0.7)" : accent }}
                >
                  {tagline}
                </p>

                {/* Title */}
                <p
                  className="text-sm font-extrabold leading-tight mb-1.5"
                  style={{ color: isActive ? "white" : "hsl(var(--foreground))" }}
                >
                  {label}
                </p>

                {/* Description */}
                <p
                  className="text-[11px] leading-relaxed"
                  style={{ color: isActive ? "hsl(0 0% 100% / 0.75)" : "hsl(var(--muted-foreground))" }}
                >
                  {description}
                </p>

                {/* Active indicator */}
                {isActive && (
                  <div className="mt-3 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                    <span className="text-[10px] font-bold text-white/70">Selected</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active mode form area */}
      <div className="card-intelligence p-5 space-y-5">

      {/* MODE A — Discover by Category */}
      {mode === "discover" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">Product Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Toys & Games, Kitchen Gadgets…"
              className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
              style={inputStyle}
              list="category-suggestions"
            />
            <datalist id="category-suggestions">
              {CATEGORIES.map((c) => <option key={c} value={c} />)}
            </datalist>
          </div>

          {/* Era */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">Era / Nostalgia Focus</label>
            <input
              type="text"
              value={era}
              onChange={(e) => setEra(e.target.value)}
              placeholder="e.g. 80s, 90s, 2000s, Current…"
              className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
              style={inputStyle}
              list="era-suggestions"
            />
            <datalist id="era-suggestions">
              {ERAS.map((e) => <option key={e} value={e} />)}
            </datalist>
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
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Add product images or URLs — AI will run deep intelligence reports exclusively on these products.
          </p>

          {/* Input type tabs */}
          <div className="flex gap-2">
            {([
              { id: "url" as const, label: "Product URLs", icon: Link },
              { id: "image" as const, label: "Upload Images", icon: ImageIcon },
            ]).map(({ id, label, icon: Icon }) => (
              <button key={id} type="button"
                onClick={() => setActiveInputTab(id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: activeInputTab === id ? "hsl(var(--primary))" : "hsl(var(--secondary))",
                  color: activeInputTab === id ? "white" : "hsl(var(--foreground))",
                  border: `1px solid ${activeInputTab === id ? "hsl(var(--primary))" : "hsl(var(--border))"}`,
                }}>
                <Icon size={11} />{label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {customProducts.map((cp, index) => (
              <div key={index} className="p-4 rounded-xl space-y-3 relative"
                style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>

                {customProducts.length > 1 && (
                  <button type="button" onClick={() => removeCustomProduct(index)}
                    className="absolute top-2 right-2 p-1 rounded-full hover:bg-red-100 transition-colors">
                    <X size={12} className="text-red-500" />
                  </button>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Product Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Product Name</label>
                    <input type="text" value={cp.productName || ""}
                      onChange={(e) => updateCustomProduct(index, "productName", e.target.value)}
                      placeholder="e.g. Nintendo Game Boy (1989)"
                      className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                      style={inputStyle} />
                  </div>

                  {/* URL or Image based on active tab */}
                  {activeInputTab === "url" ? (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Product URL (Amazon, eBay, any site)
                      </label>
                      <div className="relative">
                        <Link size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input type="url" value={cp.productUrl || ""}
                          onChange={(e) => updateCustomProduct(index, "productUrl", e.target.value)}
                          placeholder="https://amazon.com/dp/..."
                          className="w-full rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none"
                          style={inputStyle} />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Product Image
                      </label>
                      {cp.imageDataUrl ? (
                        <div className="relative inline-block">
                          <img src={cp.imageDataUrl} alt="uploaded"
                            className="h-16 w-24 object-cover rounded-lg" />
                          <button type="button"
                            onClick={() => {
                              setCustomProducts(prev => {
                                const next = [...prev];
                                next[index] = { ...next[index], imageFile: undefined, imageDataUrl: undefined };
                                return next;
                              });
                            }}
                            className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ background: "hsl(var(--destructive))" }}>
                            <X size={10} style={{ color: "white" }} />
                          </button>
                        </div>
                      ) : (
                        <div
                          className="flex items-center justify-center h-16 rounded-lg cursor-pointer border-2 border-dashed transition-colors"
                          style={{ borderColor: "hsl(var(--primary) / 0.3)", background: "hsl(var(--primary-muted))" }}
                          onClick={() => fileRefs.current[index]?.click()}
                        >
                          <div className="flex items-center gap-2">
                            <ImageIcon size={14} style={{ color: "hsl(var(--primary))" }} />
                            <span className="text-xs font-medium" style={{ color: "hsl(var(--primary))" }}>
                              Click to upload
                            </span>
                          </div>
                          <input
                            ref={(el) => { fileRefs.current[index] = el; }}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageFile(index, file);
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Context / Notes (optional)
                  </label>
                  <input type="text" value={cp.notes || ""}
                    onChange={(e) => updateCustomProduct(index, "notes", e.target.value)}
                    placeholder="e.g. Found at a garage sale — want to know revival potential…"
                    className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={inputStyle} />
                </div>
              </div>
            ))}
          </div>

          <button type="button" onClick={addCustomProduct}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all w-full justify-center"
            style={{ border: "1.5px dashed hsl(var(--primary) / 0.4)", color: "hsl(var(--primary))", background: "hsl(var(--primary-muted))" }}>
            <Plus size={12} /> Add Another Product
          </button>
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
              <input
                type="text"
                value={businessInput.type}
                onChange={(e) => setBusinessInput((p) => ({ ...p, type: e.target.value }))}
                placeholder="e.g. Laundromat, Freight broker, Law firm…"
                className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none"
                style={inputStyle}
                list="business-examples"
              />
              <datalist id="business-examples">
                {BUSINESS_EXAMPLES.map((ex) => <option key={ex} value={ex} />)}
              </datalist>
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
            <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">Additional Context (optional)</label>
            <input type="text" value={businessInput.notes}
              onChange={(e) => setBusinessInput((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Competitive dynamics, owner goals, history…"
              className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none" style={inputStyle} />
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
                  ? "Analyze My Products"
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
      </div>{/* end active mode form area */}
    </form>
  );
};
