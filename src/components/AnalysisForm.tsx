import { useState, useRef, useEffect } from "react";
import { Upload, Link, Briefcase, Building2, Telescope, ArrowLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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

type Mode = "custom" | "service" | "business";

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

const MODE_OPTIONS: {
  id: Mode;
  label: string;
  tagline: string;
  description: string;
  bullets: string[];
  icon: React.ElementType;
  accent: string;
}[] = [
  {
    id: "custom",
    label: "Disrupt This Product",
    tagline: "Deep Product Audit",
    description: "Drop in URLs or photos. AI scrapes pages, reads images, and builds a full commercial intelligence dossier.",
    bullets: ["Scrapes up to 3 URLs + analyzes 5 images", "Challenges every design and pricing assumption", "Reinvented concepts with go-to-market roadmaps"],
    icon: Upload,
    accent: "hsl(217 91% 38%)",
  },
  {
    id: "service",
    label: "Disrupt This Service",
    tagline: "Service Intelligence",
    description: "URLs, screenshots, or a description. AI maps the full competitive landscape and identifies growth opportunities.",
    bullets: ["Scrapes up to 3 URLs + analyzes 5 screenshots", "Questions every assumption about customer value & operations", "Growth strategies built on operational gaps competitors overlook"],
    icon: Briefcase,
    accent: "hsl(340 65% 45%)",
  },
  {
    id: "business",
    label: "Disrupt This Business Model",
    tagline: "Strategic Reinvention",
    description: "Describe any business. AI deconstructs it across 7 strategic dimensions and rebuilds a reinvented model.",
    bullets: ["7-dimension first-principles deconstruction", "Every assumption challenged and stress-tested", "Reinvention blueprint with phased financials"],
    icon: Building2,
    accent: "hsl(271 70% 50%)",
  },
];

export { type Mode as AnalysisMode };

export const AnalysisForm = ({ onAnalyze, onBusinessAnalysis, isLoading, mode: externalMode, onModeChange }: AnalysisFormProps) => {
  const [internalMode, setInternalMode] = useState<Mode>("custom");
  const mode = externalMode ?? internalMode;
  const setMode = (m: Mode) => { onModeChange ? onModeChange(m) : setInternalMode(m); };
  
  const [phase, setPhase] = useState<"select" | "confirm" | "form">(externalMode ? "confirm" : "select");
  const [pendingMode, setPendingMode] = useState<Mode | null>(externalMode || null);
  const prevExternalMode = useRef(externalMode);

  useEffect(() => {
    if (externalMode && externalMode !== prevExternalMode.current) {
      prevExternalMode.current = externalMode;
      setPendingMode(externalMode);
      setPhase("confirm");
    }
  }, [externalMode]);

  const [category, setCategory] = useState("Toys & Games");
  const [batchSize, setBatchSize] = useState(10);
  const [customProducts, setCustomProducts] = useState<CustomProductInput[]>([{}]);
  const [customUrls, setCustomUrls] = useState<string[]>([""]);
  const [customImages, setCustomImages] = useState<{ file: File; dataUrl: string }[]>([]);
  const [customName, setCustomName] = useState("");
  const [customNotes, setCustomNotes] = useState("");
  const [businessInput, setBusinessInput] = useState<BusinessInput>({
    type: "", description: "", revenueModel: "", size: "", geography: "", painPoints: "", notes: "",
  });
  const [businessLoading, setBusinessLoading] = useState(false);

  const handleBack = () => {
    setPhase("select");
    setPendingMode(null);
  };

  const handleConfirm = () => {
    if (pendingMode) {
      setMode(pendingMode);
      setPhase("form");
      setPendingMode(null);
    }
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
    }
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
    border: "1px solid hsl(var(--border))",
    background: "hsl(var(--background))",
    color: "hsl(var(--foreground))",
    borderRadius: "0.25rem",
    padding: "0.5rem 0.75rem",
    fontSize: "0.875rem",
    width: "100%",
    outline: "none",
  } as React.CSSProperties;

  if (phase === "confirm" && pendingMode) {
    const modeOption = MODE_OPTIONS.find(m => m.id === pendingMode)!;
    const Icon = modeOption.icon;

    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-2 text-sm font-medium transition-colors hover:text-foreground text-muted-foreground"
        >
          <ArrowLeft size={14} /> Back
        </button>

        <div className="rounded border border-border bg-card">
          <div className="px-6 py-5 border-b border-border bg-muted/30">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded bg-background border border-border">
                <Icon size={20} style={{ color: modeOption.accent }} />
              </div>
              <h2 className="text-xl font-bold text-foreground">{modeOption.label}</h2>
            </div>
            <p className="text-sm text-muted-foreground">{modeOption.description}</p>
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-foreground">What you'll get:</h3>
              <ul className="space-y-2">
                {modeOption.bullets.map((bullet, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: modeOption.accent }} />
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={handleConfirm}
              className="w-full py-3 rounded font-bold text-sm text-white transition-colors hover:opacity-90"
              style={{ background: modeOption.accent }}
            >
              Start Analysis
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "form") {
    return (
      <div className="space-y-6">
        {(mode === "custom" || mode === "service") && (
          <form onSubmit={handleSubmit} className="space-y-5">
             <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {mode === "service" ? "Service Name" : "Product Name"}
              </label>
              <input
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder={mode === "service" ? "e.g. Acme Consulting" : "e.g. Vintage Camera"}
                className="w-full rounded px-3 py-2.5 text-sm focus:outline-none"
                style={inputStyle}
              />
            </div>

            {/* URLs — up to 3 */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                URLs (up to 3)
              </label>
              {customUrls.map((url, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={url}
                    onChange={(e) => {
                      const next = [...customUrls];
                      next[i] = e.target.value;
                      setCustomUrls(next);
                    }}
                    placeholder={`URL ${i + 1} — paste a product or service page`}
                    className="w-full rounded px-3 py-2.5 text-sm focus:outline-none"
                    style={inputStyle}
                  />
                  {customUrls.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setCustomUrls(customUrls.filter((_, j) => j !== i))}
                      className="px-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              {customUrls.length < 3 && (
                <button
                  type="button"
                  onClick={() => setCustomUrls([...customUrls, ""])}
                  className="text-xs font-medium transition-colors"
                  style={{ color: "hsl(var(--primary-light))" }}
                >
                  + Add URL
                </button>
              )}
            </div>

            {/* Image uploads — up to 5 */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {mode === "service" ? "Screenshots (up to 5)" : "Product Images (up to 5)"}
              </label>
              <div className="flex flex-wrap gap-2">
                {customImages.map((img, i) => (
                  <div key={i} className="relative w-16 h-16 rounded overflow-hidden" style={{ border: "1px solid hsl(var(--border))" }}>
                    <img src={img.dataUrl} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setCustomImages(customImages.filter((_, j) => j !== i))}
                      className="absolute top-0 right-0 w-5 h-5 flex items-center justify-center text-[10px] font-bold text-white rounded-bl"
                      style={{ background: "hsl(var(--destructive))" }}
                    >
                      X
                    </button>
                  </div>
                ))}
                {customImages.length < 5 && (
                  <label
                    className="w-16 h-16 rounded flex items-center justify-center cursor-pointer transition-colors"
                    style={{ border: "1.5px dashed hsl(var(--border))", background: "hsl(var(--muted))" }}
                  >
                    <Upload size={16} className="text-muted-foreground" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => {
                          setCustomImages([...customImages, { file, dataUrl: reader.result as string }]);
                        };
                        reader.readAsDataURL(file);
                        e.target.value = "";
                      }}
                    />
                  </label>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">{customImages.length}/5 images uploaded</p>
            </div>

            {/* Context / notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Context & Notes
              </label>
              <textarea
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder={mode === "service" ? "Describe the service, target market, pain points..." : "Add context: target audience, pricing goals, competitive landscape..."}
                rows={4}
                className="w-full rounded px-3 py-2.5 text-sm focus:outline-none resize-none"
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !customName}
              className="w-full py-3 rounded font-bold text-sm text-white transition-colors hover:opacity-90 disabled:opacity-50"
              style={{ background: mode === "service" ? "hsl(340 65% 45%)" : "hsl(217 91% 38%)" }}
            >
              {isLoading ? "Analyzing..." : "Start Analysis"}
            </button>
          </form>
        )}

        {mode === "business" && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Business Type</label>
              <input
                value={businessInput.type}
                onChange={(e) => setBusinessInput(prev => ({ ...prev, type: e.target.value }))}
                placeholder="e.g. Laundromat, SaaS, Agency..."
                className="w-full rounded px-3 py-2.5 text-sm focus:outline-none"
                style={inputStyle}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</label>
              <textarea
                value={businessInput.description}
                onChange={(e) => setBusinessInput(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the business model, revenue streams, and key operations..."
                rows={3}
                className="w-full rounded px-3 py-2.5 text-sm focus:outline-none resize-none"
                style={inputStyle}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Revenue Model</label>
                <input
                  value={businessInput.revenueModel}
                  onChange={(e) => setBusinessInput(prev => ({ ...prev, revenueModel: e.target.value }))}
                  placeholder="e.g. Subscription, Per-unit, Commission, Freemium..."
                  className="w-full rounded px-3 py-2.5 text-sm focus:outline-none"
                  style={inputStyle}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Business Size</label>
                <input
                  value={businessInput.size}
                  onChange={(e) => setBusinessInput(prev => ({ ...prev, size: e.target.value }))}
                  placeholder="e.g. Solo operator, 10 employees, $2M ARR..."
                  className="w-full rounded px-3 py-2.5 text-sm focus:outline-none"
                  style={inputStyle}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Geography</label>
              <input
                value={businessInput.geography}
                onChange={(e) => setBusinessInput(prev => ({ ...prev, geography: e.target.value }))}
                placeholder="e.g. Local (Austin, TX), National, Global..."
                className="w-full rounded px-3 py-2.5 text-sm focus:outline-none"
                style={inputStyle}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pain Points</label>
              <textarea
                value={businessInput.painPoints}
                onChange={(e) => setBusinessInput(prev => ({ ...prev, painPoints: e.target.value }))}
                placeholder="What are the biggest operational or customer pain points?"
                rows={3}
                className="w-full rounded px-3 py-2.5 text-sm focus:outline-none resize-none"
                style={inputStyle}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Additional Notes</label>
              <textarea
                value={businessInput.notes}
                onChange={(e) => setBusinessInput(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Competitive landscape, unique constraints, strategic goals..."
                rows={3}
                className="w-full rounded px-3 py-2.5 text-sm focus:outline-none resize-none"
                style={inputStyle}
              />
            </div>
            <button
              onClick={runBusinessAnalysis}
              disabled={businessLoading || !businessInput.type || !businessInput.description}
              className="w-full py-3 rounded font-bold text-sm text-white transition-colors hover:opacity-90 disabled:opacity-50"
              style={{ background: "hsl(271 70% 50%)" }}
            >
              {businessLoading ? "Deconstructing..." : "Deconstruct Business Model"}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {MODE_OPTIONS.map((option) => (
        <button
          key={option.id}
          onClick={() => handleModeClick(option.id)}
          className="flex flex-col items-start p-5 rounded border border-border bg-card hover:border-primary/50 transition-all text-left group"
        >
          <div className="flex items-center justify-between w-full mb-3">
            <div className="p-2 rounded bg-muted group-hover:bg-primary/10 transition-colors">
              <option.icon size={20} style={{ color: option.accent }} />
            </div>
            <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <h3 className="font-bold text-foreground mb-1">{option.label}</h3>
          <p className="text-sm text-muted-foreground">{option.tagline}</p>
        </button>
      ))}
    </div>
  );

  function handleModeClick(id: Mode) {
    setMode(id);
    setPhase("confirm");
    setPendingMode(id);
  }
};
