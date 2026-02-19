import { useState } from "react";
import { Search, Sparkles, ChevronDown } from "lucide-react";

interface AnalysisFormProps {
  onAnalyze: (params: {
    category: string;
    era: string;
    audience: string;
    batchSize: number;
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAnalyze({ category, era, audience, batchSize });
  };

  return (
    <form onSubmit={handleSubmit} className="card-intelligence p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground mb-1">Configure Analysis</h2>
        <p className="text-sm text-muted-foreground">
          Set your parameters to discover and flip high-potential products.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Category */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
            Product Category
          </label>
          <div className="relative">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full appearance-none rounded-lg px-3 py-2.5 text-sm font-medium pr-8 focus:outline-none focus:ring-2 transition-all"
              style={{
                border: "1.5px solid hsl(var(--border))",
                background: "hsl(var(--background))",
                color: "hsl(var(--foreground))",
                "--tw-ring-color": "hsl(var(--primary))",
              } as React.CSSProperties}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
          </div>
        </div>

        {/* Era */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
            Era / Nostalgia Focus
          </label>
          <div className="relative">
            <select
              value={era}
              onChange={(e) => setEra(e.target.value)}
              className="w-full appearance-none rounded-lg px-3 py-2.5 text-sm font-medium pr-8 focus:outline-none focus:ring-2 transition-all"
              style={{
                border: "1.5px solid hsl(var(--border))",
                background: "hsl(var(--background))",
                color: "hsl(var(--foreground))",
              } as React.CSSProperties}
            >
              {ERAS.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
          </div>
        </div>

        {/* Audience */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
            Audience / Market
          </label>
          <input
            type="text"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            placeholder="e.g. Millennials (25–40)"
            className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all"
            style={{
              border: "1.5px solid hsl(var(--border))",
              background: "hsl(var(--background))",
              color: "hsl(var(--foreground))",
            }}
          />
        </div>

        {/* Batch size */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-foreground/80 uppercase tracking-wider">
            Batch Size ({batchSize})
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={5}
              max={50}
              step={5}
              value={batchSize}
              onChange={(e) => setBatchSize(Number(e.target.value))}
              className="flex-1 accent-blue-600"
            />
            <span
              className="w-10 text-center text-sm font-bold rounded-md px-1 py-0.5"
              style={{
                background: "hsl(var(--primary))",
                color: "hsl(var(--primary-foreground))",
              }}
            >
              {batchSize}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary flex items-center gap-2"
        >
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
