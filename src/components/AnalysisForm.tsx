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
    id: "service" as Mode,
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
  {
    id: "discover",
    label: "Disrupt This Nostalgia",
    tagline: "Market Intelligence",
    description: "AI crawls the live web to find undervalued products with real comeback potential, then reinvents them.",
    bullets: ["Live web scraping across marketplaces", "Every product assumption challenged and flipped", "Reinvented concepts with BOM and execution plans"],
    icon: Telescope,
    accent: "hsl(var(--primary))",
  },
];

export { type Mode as AnalysisMode };

export const AnalysisForm = ({ onAnalyze, onBusinessAnalysis, isLoading, mode: externalMode, onModeChange }: AnalysisFormProps) => {
  const [internalMode, setInternalMode] = useState<Mode>("discover");
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
  const [era, setEra] = useState("80s–90s");
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
    } else {
      onAnalyze({ category, era, batchSize });
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
        {mode === "discover" && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded px-3 py-2.5 text-sm focus:outline-none"
                  style={inputStyle}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Era</label>
                <select
                  value={era}
                  onChange={(e) => setEra(e.target.value)}
                  className="w-full rounded px-3 py-2.5 text-sm focus:outline-none"
                  style={inputStyle}
                >
                  {ERAS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded font-bold text-sm text-white transition-colors hover:opacity-90 disabled:opacity-50"
              style={{ background: "hsl(var(--primary))" }}
            >
              {isLoading ? "Running Analysis..." : "Start Discovery"}
            </button>
          </form>
        )}

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
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {mode === "service" ? "Service Description / URLs" : "Product Details / URLs"}
              </label>
              <textarea
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="Paste URLs or describe what you want to analyze..."
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
                rows={4}
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
