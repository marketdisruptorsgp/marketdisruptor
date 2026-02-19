import { useState, useRef } from "react";
import { Search, Sparkles, ChevronDown, Upload, Link, X, Image as ImageIcon, Plus } from "lucide-react";

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
    audience: string;
    batchSize: number;
    customProducts?: CustomProductInput[];
  }) => void;
  isLoading: boolean;
}

const CATEGORIES = [
  "Toys & Games", "Kitchen Gadgets", "Electronics", "Fashion", "Photography",
  "Fitness & Health", "Music & Audio", "Office Supplies", "Multi-category",
];

const ERAS = [
  "70s", "80s", "80s–90s", "90s", "2000s", "All Eras / Current",
];

export const AnalysisForm = ({ onAnalyze, isLoading }: AnalysisFormProps) => {
  const [category, setCategory] = useState("Toys & Games");
  const [era, setEra] = useState("80s–90s");
  const [audience, setAudience] = useState("Millennials (25–40)");
  const [batchSize, setBatchSize] = useState(10);
  const [showCustom, setShowCustom] = useState(false);
  const [customProducts, setCustomProducts] = useState<CustomProductInput[]>([{}]);
  const [activeInputTab, setActiveInputTab] = useState<"url" | "image">("url");
  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const filled = customProducts.filter(
      (cp) => cp.imageDataUrl || cp.productUrl || cp.productName
    );
    onAnalyze({ category, era, audience, batchSize, customProducts: filled.length > 0 ? filled : undefined });
  };

  const handleImageFile = (index: number, file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCustomProducts((prev) => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          imageFile: file,
          imageDataUrl: ev.target?.result as string,
        };
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

  const inputStyle = {
    border: "1.5px solid hsl(var(--border))",
    background: "hsl(var(--background))",
    color: "hsl(var(--foreground))",
  } as React.CSSProperties;

  return (
    <form onSubmit={handleSubmit} className="card-intelligence p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">Configure Analysis</h2>
        <p className="text-sm text-muted-foreground">
          Set your parameters — or upload your own products for deep custom intelligence.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Category */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">Product Category</label>
          <div className="relative">
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              className="w-full appearance-none rounded-lg px-3 py-2.5 text-sm font-medium pr-8 focus:outline-none focus:ring-2 transition-all"
              style={inputStyle}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
          </div>
        </div>

        {/* Era */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">Era / Nostalgia Focus</label>
          <div className="relative">
            <select value={era} onChange={(e) => setEra(e.target.value)}
              className="w-full appearance-none rounded-lg px-3 py-2.5 text-sm font-medium pr-8 focus:outline-none focus:ring-2 transition-all"
              style={inputStyle}>
              {ERAS.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
          </div>
        </div>

        {/* Audience */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">Audience / Market</label>
          <input type="text" value={audience} onChange={(e) => setAudience(e.target.value)}
            placeholder="e.g. Millennials (25–40)"
            className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all"
            style={inputStyle} />
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

      {/* Custom Product Upload Section */}
      <div className="border rounded-xl overflow-hidden" style={{ borderColor: "hsl(var(--border))" }}>
        <button
          type="button"
          onClick={() => setShowCustom(!showCustom)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold transition-colors"
          style={{ background: showCustom ? "hsl(var(--primary-muted))" : "hsl(var(--muted))" }}
        >
          <div className="flex items-center gap-2">
            <Upload size={14} style={{ color: "hsl(var(--primary))" }} />
            <span style={{ color: "hsl(var(--foreground))" }}>
              Upload Your Own Products to Analyze
            </span>
            {customProducts.some(cp => cp.imageDataUrl || cp.productUrl || cp.productName) && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{ background: "hsl(var(--primary))", color: "white" }}>
                {customProducts.filter(cp => cp.imageDataUrl || cp.productUrl || cp.productName).length} added
              </span>
            )}
          </div>
          <ChevronDown size={14} className={`transition-transform text-muted-foreground ${showCustom ? "rotate-180" : ""}`} />
        </button>

        {showCustom && (
          <div className="p-4 space-y-4" style={{ background: "hsl(var(--background))" }}>
            <p className="text-xs text-muted-foreground">
              Add product images or URLs — AI will analyze them alongside the web-scraped data for fully custom intelligence reports.
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
                          <div className="relative">
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
                      placeholder="e.g. I found this at a garage sale, want to know if it's worth reviving..."
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
      </div>

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
              Run Product Intelligence Analysis
            </>
          )}
        </button>
        <p className="text-xs text-muted-foreground">
          Processes {batchSize} products · Assigns Revival Potential Scores · Generates Flipped Ideas
        </p>
      </div>
    </form>
  );
};
