import { useState, useRef, useEffect, useCallback } from "react";
import { Upload, Link, Briefcase, Building2, Telescope, ArrowLeft, ChevronRight, FileText, Image, X, Loader2, Sparkles, Brain, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useBIExtraction, fileToDocumentText, extractionToContext, type BIExtraction } from "@/hooks/useBIExtraction";

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
    territory?: string;
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
    accent: "hsl(var(--mode-product))",
  },
  {
    id: "service",
    label: "Disrupt This Service",
    tagline: "Service Intelligence",
    description: "URLs, screenshots, or a description. AI maps the full competitive landscape and identifies growth opportunities.",
    bullets: ["Scrapes up to 3 URLs + analyzes 5 screenshots", "Questions every assumption about customer value & operations", "Growth strategies built on operational gaps competitors overlook"],
    icon: Briefcase,
    accent: "hsl(var(--mode-service))",
  },
  {
    id: "business",
    label: "Disrupt This Business Model",
    tagline: "Strategic Reinvention",
    description: "Describe any business. AI deconstructs it across 7 strategic dimensions and rebuilds a reinvented model.",
    bullets: ["7-dimension first-principles deconstruction", "Every assumption challenged and stress-tested", "Reinvention blueprint with phased financials"],
    icon: Building2,
    accent: "hsl(var(--mode-business))",
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
  const [customTerritory, setCustomTerritory] = useState("");
  const [businessInput, setBusinessInput] = useState<BusinessInput>({
    type: "", description: "", revenueModel: "", size: "", geography: "", painPoints: "", notes: "",
  });
  const [businessLoading, setBusinessLoading] = useState(false);
  const [bizUrls, setBizUrls] = useState<string[]>([""]);
  const [bizImages, setBizImages] = useState<{ file: File; dataUrl: string }[]>([]);
  const [bizDocs, setBizDocs] = useState<{ file: File; name: string }[]>([]);
  const [autofilling, setAutofilling] = useState(false);
  const autofillTriggered = useRef<Set<string>>(new Set());

  const runAutofill = useCallback(async (url: string, currentMode: Mode) => {
    const trimmed = url.trim();
    if (!trimmed || autofillTriggered.current.has(trimmed)) return;
    // Basic URL validation
    if (!trimmed.match(/^https?:\/\/.+\..+/) && !trimmed.match(/^[a-zA-Z0-9].*\..+/)) return;
    
    autofillTriggered.current.add(trimmed);
    setAutofilling(true);
    toast.info("Scanning URL to pre-fill fields...");

    try {
      const { data, error } = await supabase.functions.invoke("scrape-url-autofill", {
        body: { url: trimmed, mode: currentMode },
      });

      if (error || !data?.success) {
        console.warn("Autofill failed:", error || data?.error);
        toast.error("Couldn't extract info from that URL. Fill manually.");
        return;
      }

      const d = data.data;

      // Auto-detect entity type and suggest mode switch if different from current
      const detectedType = d.detectedEntityType;
      if (detectedType && detectedType !== "unknown") {
        const detectedMode: Mode = detectedType === "business" ? "business" : detectedType === "service" ? "service" : "custom";
        if (detectedMode !== currentMode) {
          console.log("[AutoDetect] URL entity type:", detectedType, "current mode:", currentMode, "→ switching to", detectedMode);
          setMode(detectedMode);
          // Re-populate for the new mode
          if (detectedMode === "business") {
            setBusinessInput(prev => ({
              type: prev.type || d.type || d.name || "",
              description: prev.description || d.description || "",
              revenueModel: prev.revenueModel || d.revenueModel || "",
              size: prev.size || d.size || "",
              geography: prev.geography || d.geography || "",
              painPoints: prev.painPoints || d.painPoints || "",
              notes: prev.notes || d.notes || "",
            }));
            toast.success(`Detected a business entity — switched to Business Model mode`);
            return;
          }
        }
      }

      if (currentMode === "business" || detectedType === "business") {
        setBusinessInput(prev => ({
          type: prev.type || d.type || "",
          description: prev.description || d.description || "",
          revenueModel: prev.revenueModel || d.revenueModel || "",
          size: prev.size || d.size || "",
          geography: prev.geography || d.geography || "",
          painPoints: prev.painPoints || d.painPoints || "",
          notes: prev.notes || d.notes || "",
        }));
      } else {
        if (!customName && d.name) setCustomName(d.name);
        if (!customNotes && (d.notes || d.description)) {
          setCustomNotes(d.notes || d.description || "");
        }
      }

      toast.success("Fields pre-filled from URL!");
    } catch (err) {
      console.error("Autofill error:", err);
    } finally {
      setAutofilling(false);
    }
  }, [customName, customNotes]);

  const handleUrlBlur = (url: string) => {
    if (url.trim()) runAutofill(url, mode);
  };

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
      const territoryNote = customTerritory.trim() ? `\n\n--- TARGET TERRITORY: ${customTerritory.trim()} ---` : "";
      const filled: CustomProductInput[] = [{
        productName: customName,
        notes: mode === "service" ? `[SERVICE ANALYSIS] ${customNotes}${territoryNote}` : `${customNotes}${territoryNote}`,
        urls: customUrls.filter(u => u.trim()),
        images: customImages,
        productUrl: customUrls.find(u => u.trim()) || "",
        imageDataUrl: customImages[0]?.dataUrl,
        imageFile: customImages[0]?.file,
      }];
      onAnalyze({ category: mode === "service" ? "Service" : "Custom", era: "All Eras / Current", batchSize: 1, customProducts: filled, territory: customTerritory.trim() || undefined });
    }
  };

  const { extract, extracting, extraction: biExtraction, reset: resetExtraction } = useBIExtraction();

  const runBusinessAnalysis = async () => {
    if (!businessInput.type.trim() || !businessInput.description.trim()) {
      toast.error("Please enter the business type and a description.");
      return;
    }
    setBusinessLoading(true);
    try {
      // Step 1: Extract intelligence from uploaded documents/images if present
      let extractedContext: string | undefined;
      if (bizDocs.length > 0 || bizImages.length > 0) {
        toast.info("Extracting business intelligence from your documents…");
        const documentTexts = await Promise.all(
          bizDocs.map(doc => fileToDocumentText(doc.file))
        );
        const imageUrls = bizImages.map(img => img.dataUrl);
        const result = await extract({
          documentTexts,
          imageUrls,
          context: `${businessInput.type} — ${businessInput.description}`,
          lensType: undefined, // TODO: pass active lens type when lens context is available
        });
        if (result) {
          extractedContext = extractionToContext(result);
          toast.success("Document intelligence extracted — running full analysis…");
        }
      }

      // Step 2: Run full analysis with extracted context
      const { data: result, error } = await supabase.functions.invoke("business-model-analysis", {
        body: {
          businessModel: businessInput,
          extractedContext,
        },
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

  const inputClassName = "input-executive";

  if (phase === "confirm" && pendingMode) {
    const modeOption = MODE_OPTIONS.find(m => m.id === pendingMode)!;
    const Icon = modeOption.icon;

    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-2 typo-card-body font-medium transition-colors hover:text-foreground text-muted-foreground"
        >
          <ArrowLeft size={14} /> Back
        </button>

        <div className="rounded border border-border bg-card">
          <div className="px-6 py-5 border-b border-border bg-muted/30">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded bg-background border border-border">
                <Icon size={20} style={{ color: modeOption.accent }} />
              </div>
              <h2 className="typo-section-title" style={{ fontSize: "1.25rem" }}>{modeOption.label}</h2>
            </div>
            <p className="typo-card-body text-muted-foreground">{modeOption.description}</p>
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-3">
              <h3 className="typo-card-title">What you'll get:</h3>
              <ul className="space-y-2">
                {modeOption.bullets.map((bullet, i) => (
                  <li key={i} className="flex items-start gap-2 typo-card-body text-muted-foreground">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: modeOption.accent }} />
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={handleConfirm}
              className={`w-full py-3 rounded-lg typo-button-primary text-white transition-colors ${
                pendingMode === "service" ? "btn-mode-service" : pendingMode === "business" ? "btn-mode-business" : "btn-mode-product"
              }`}
            >
              Start Strategic Discovery
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
            {/* URLs — FIRST */}
            <div className="space-y-1.5">
              <label className="typo-card-eyebrow flex items-center gap-2">
                URL {autofilling && <Loader2 size={13} className="animate-spin text-primary" />}
                {autofilling && <span className="typo-card-meta text-primary">Scanning...</span>}
              </label>
              <p className="typo-card-meta text-muted-foreground">Paste a URL and we'll extract details automatically</p>
              {customUrls.map((url, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={url}
                    onChange={(e) => {
                      const next = [...customUrls];
                      next[i] = e.target.value;
                      setCustomUrls(next);
                    }}
                    onBlur={(e) => handleUrlBlur(e.target.value)}
                    placeholder={i === 0 ? "https://example.com — we'll fill in the rest" : `URL ${i + 1}`}
                    className={inputClassName}
                  />
                  {customUrls.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setCustomUrls(customUrls.filter((_, j) => j !== i))}
                      className="px-2 typo-card-meta text-muted-foreground hover:text-foreground transition-colors"
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
                  className="typo-card-meta font-medium transition-colors text-primary-light"
                >
                  + Add URL
                </button>
              )}
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <label className="typo-card-eyebrow">
                {mode === "service" ? "Service Name" : "Product Name"}
              </label>
               <input
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder={mode === "service" ? "e.g. Acme Consulting" : "e.g. Vintage Camera"}
                className={inputClassName}
              />
            </div>

            {/* Territory */}
            <div className="space-y-1.5">
              <label className="typo-card-eyebrow">
                Target market / territory
              </label>
              <input
                value={customTerritory}
                onChange={(e) => setCustomTerritory(e.target.value)}
                placeholder="e.g. Missouri, California, UK, Southeast Asia"
                className={inputClassName}
              />
              <p className="typo-card-meta text-muted-foreground">We'll pull census data and regulatory requirements specific to your market</p>
            </div>

            {/* Image uploads — up to 5 */}
            <div className="space-y-1.5">
              <label className="typo-card-eyebrow">
                {mode === "service" ? "Screenshots (up to 5)" : "Product Images (up to 5)"}
              </label>
              <div className="flex flex-wrap gap-2">
                {customImages.map((img, i) => (
                  <div key={i} className="relative w-16 h-16 rounded overflow-hidden" style={{ border: "1px solid hsl(var(--border))" }}>
                    <img src={img.dataUrl} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setCustomImages(customImages.filter((_, j) => j !== i))}
                      className="absolute top-0 right-0 w-5 h-5 flex items-center justify-center typo-status-label text-white rounded-bl"
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
              <p className="typo-card-meta text-muted-foreground">{customImages.length}/5 images uploaded</p>
            </div>

            {/* Context / notes */}
            <div className="space-y-1.5">
              <label className="typo-card-eyebrow">
                Context & Notes
              </label>
              <textarea
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder={mode === "service" ? "Describe the service, target market, pain points..." : "Add context: target audience, pricing goals, competitive landscape..."}
                rows={4}
                className={`${inputClassName} resize-none`}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !customName}
              className={`w-full py-3 rounded-lg typo-button-primary text-white transition-colors disabled:opacity-50 ${mode === "service" ? "btn-mode-service" : "btn-mode-product"}`}
            >
              {isLoading ? "Discovering..." : "Start Strategic Discovery"}
            </button>
          </form>
        )}

        {mode === "business" && (
          <div className="space-y-5">
            {/* URLs — FIRST for business too */}
            <div className="space-y-1.5">
              <label className="typo-card-eyebrow flex items-center gap-2">
                URL {autofilling && <Loader2 size={13} className="animate-spin text-primary" />}
                {autofilling && <span className="typo-card-meta text-primary">Scanning...</span>}
              </label>
              <p className="typo-card-meta text-muted-foreground">Paste a business URL and we'll extract details automatically</p>
              {bizUrls.map((url, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={url}
                    onChange={(e) => {
                      const next = [...bizUrls];
                      next[i] = e.target.value;
                      setBizUrls(next);
                    }}
                    onBlur={(e) => handleUrlBlur(e.target.value)}
                    placeholder={i === 0 ? "https://example.com — we'll fill in the rest" : `URL ${i + 1}`}
                    className={inputClassName}
                  />
                  {bizUrls.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setBizUrls(bizUrls.filter((_, j) => j !== i))}
                      className="px-2 typo-card-meta text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              {bizUrls.length < 3 && (
                <button
                  type="button"
                  onClick={() => setBizUrls([...bizUrls, ""])}
                  className="typo-card-meta font-medium transition-colors text-primary-light"
                >
                  + Add URL
                </button>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="typo-card-eyebrow">Business Type</label>
              <input
                value={businessInput.type}
                onChange={(e) => setBusinessInput(prev => ({ ...prev, type: e.target.value }))}
                placeholder="e.g. Laundromat, SaaS, Agency..."
                className={inputClassName}
              />
            </div>
            <div className="space-y-1.5">
              <label className="typo-card-eyebrow">Description</label>
              <textarea
                value={businessInput.description}
                onChange={(e) => setBusinessInput(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the business model, revenue streams, and key operations..."
                rows={3}
                className={`${inputClassName} resize-none`}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="typo-card-eyebrow">Revenue Model</label>
                <input
                  value={businessInput.revenueModel}
                  onChange={(e) => setBusinessInput(prev => ({ ...prev, revenueModel: e.target.value }))}
                  placeholder="e.g. Subscription, Per-unit, Commission, Freemium..."
                  className={inputClassName}
                />
              </div>
              <div className="space-y-1.5">
                <label className="typo-card-eyebrow">Business Size</label>
                <input
                  value={businessInput.size}
                  onChange={(e) => setBusinessInput(prev => ({ ...prev, size: e.target.value }))}
                  placeholder="e.g. Solo operator, 10 employees, $2M ARR..."
                  className={inputClassName}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="typo-card-eyebrow">Geography</label>
              <input
                value={businessInput.geography}
                onChange={(e) => setBusinessInput(prev => ({ ...prev, geography: e.target.value }))}
                placeholder="e.g. Local (Austin, TX), National, Global..."
                className={inputClassName}
              />
            </div>
            <div className="space-y-1.5">
              <label className="typo-card-eyebrow">Pain Points</label>
              <textarea
                value={businessInput.painPoints}
                onChange={(e) => setBusinessInput(prev => ({ ...prev, painPoints: e.target.value }))}
                placeholder="What are the biggest operational or customer pain points?"
                rows={3}
                className={`${inputClassName} resize-none`}
              />
            </div>
            <div className="space-y-1.5">
              <label className="typo-card-eyebrow">Additional Notes</label>
              <textarea
                value={businessInput.notes}
                onChange={(e) => setBusinessInput(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Competitive landscape, unique constraints, strategic goals..."
                rows={3}
                className={`${inputClassName} resize-none`}
              />
            </div>

            {/* Document uploads — up to 5 */}
            <div className="space-y-1.5">
              <label className="typo-card-eyebrow">Documents (up to 5)</label>
              <p className="typo-card-meta text-muted-foreground mb-1">PDF, Excel, CSV, PowerPoint, Word</p>
              <div className="space-y-2">
                {bizDocs.map((doc, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg px-3 py-2 bg-muted border border-border">
                    <FileText size={14} className="text-muted-foreground flex-shrink-0" />
                    <span className="typo-card-body text-foreground truncate flex-1">{doc.name}</span>
                    <span className="typo-card-meta text-muted-foreground flex-shrink-0">
                      {(doc.file.size / 1024).toFixed(0)} KB
                    </span>
                    <button
                      type="button"
                      onClick={() => setBizDocs(bizDocs.filter((_, j) => j !== i))}
                      className="p-0.5 rounded hover:bg-destructive/10 transition-colors"
                    >
                      <X size={14} className="text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                ))}
                {bizDocs.length < 5 && (
                  <label
                    className="flex items-center justify-center gap-2 rounded-lg px-4 py-3 cursor-pointer transition-colors hover:bg-muted/80"
                    style={{ border: "1.5px dashed hsl(var(--border))", background: "hsl(var(--muted) / 0.3)" }}
                  >
                    <Upload size={14} className="text-muted-foreground" />
                    <span className="typo-card-body text-muted-foreground">Upload document</span>
                    <input
                      type="file"
                      accept=".pdf,.xlsx,.xls,.csv,.pptx,.ppt,.docx,.doc"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 20 * 1024 * 1024) {
                          toast.error("File too large. Maximum 20MB per file.");
                          return;
                        }
                        setBizDocs([...bizDocs, { file, name: file.name }]);
                        e.target.value = "";
                      }}
                    />
                  </label>
                )}
              </div>
              <p className="typo-card-meta text-muted-foreground">{bizDocs.length}/5 documents uploaded</p>
            </div>

            {/* Image uploads — up to 5 */}
            <div className="space-y-1.5">
              <label className="typo-card-eyebrow">Images (up to 5)</label>
              <div className="flex flex-wrap gap-2">
                {bizImages.map((img, i) => (
                  <div key={i} className="relative w-16 h-16 rounded overflow-hidden" style={{ border: "1px solid hsl(var(--border))" }}>
                    <img src={img.dataUrl} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setBizImages(bizImages.filter((_, j) => j !== i))}
                      className="absolute top-0 right-0 w-5 h-5 flex items-center justify-center typo-status-label text-white rounded-bl"
                      style={{ background: "hsl(var(--destructive))" }}
                    >
                      X
                    </button>
                  </div>
                ))}
                {bizImages.length < 5 && (
                  <label
                    className="w-16 h-16 rounded flex items-center justify-center cursor-pointer transition-colors"
                    style={{ border: "1.5px dashed hsl(var(--border))", background: "hsl(var(--muted))" }}
                  >
                    <Image size={16} className="text-muted-foreground" />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => {
                          setBizImages([...bizImages, { file, dataUrl: reader.result as string }]);
                        };
                        reader.readAsDataURL(file);
                        e.target.value = "";
                      }}
                    />
                  </label>
                )}
              </div>
              <p className="typo-card-meta text-muted-foreground">{bizImages.length}/5 images uploaded</p>
            </div>

            {/* Extraction status */}
            {(extracting || biExtraction) && (
              <div className={`rounded-xl border p-4 space-y-2 ${biExtraction ? "border-green-500/30 bg-green-500/[0.04]" : "border-primary/20 bg-primary/[0.03]"}`}>
                <div className="flex items-center gap-2">
                  {extracting ? (
                    <>
                      <Loader2 size={14} className="animate-spin text-primary" />
                      <span className="text-sm font-semibold text-foreground">Extracting business intelligence from documents…</span>
                    </>
                  ) : biExtraction ? (
                    <>
                      <CheckCircle2 size={14} className="text-green-600" />
                      <span className="text-sm font-semibold text-foreground">Intelligence extracted</span>
                    </>
                  ) : null}
                </div>
                {biExtraction && (
                  <div className="space-y-1">
                    {biExtraction.business_overview?.primary_offering && (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">Offering:</span> {biExtraction.business_overview.primary_offering}
                      </p>
                    )}
                    {biExtraction.constraints?.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{biExtraction.constraints.length} constraints</span> identified
                      </p>
                    )}
                    {biExtraction.signals_for_visualization?.candidate_leverage_points?.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{biExtraction.signals_for_visualization.candidate_leverage_points.length} leverage points</span> found
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={runBusinessAnalysis}
              disabled={businessLoading || extracting || !businessInput.type || !businessInput.description}
              className="w-full py-3 rounded-lg typo-button-primary text-white transition-colors btn-mode-business disabled:opacity-50"
            >
              {extracting ? "Extracting intelligence…" : businessLoading ? "Deconstructing..." : bizDocs.length > 0 ? "Extract & Deconstruct" : "Deconstruct Business Model"}
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
          <h3 className="typo-card-title mb-1">{option.label}</h3>
          <p className="typo-card-body text-muted-foreground">{option.tagline}</p>
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
