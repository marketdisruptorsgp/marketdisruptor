import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Clock, Trash2, ChevronRight, Database, RotateCcw, Search, ShoppingBag, Building2, Microscope } from "lucide-react";
import type { Product } from "@/data/mockProducts";

interface SavedAnalysis {
  id: string;
  title: string;
  category: string;
  era: string;
  audience: string;
  batch_size: number;
  products: Product[];
  product_count: number;
  avg_revival_score: number;
  created_at: string;
  analysis_type?: string;
  analysis_data?: unknown;
}

interface SavedAnalysesProps {
  onLoad: (analysis: SavedAnalysis) => void;
  refreshTrigger?: number;
}

const TYPE_CONFIG = {
  product: {
    label: "Products",
    icon: ShoppingBag,
    color: "hsl(var(--primary))",
    bgColor: "hsl(var(--primary) / 0.1)",
  },
  business_model: {
    label: "Business Model",
    icon: Building2,
    color: "hsl(217 91% 45%)",
    bgColor: "hsl(217 91% 45% / 0.1)",
  },
  first_principles: {
    label: "First Principles",
    icon: Microscope,
    color: "hsl(271 81% 55%)",
    bgColor: "hsl(271 81% 55% / 0.1)",
  },
} as const;

export function SavedAnalyses({ onLoad, refreshTrigger }: SavedAnalysesProps) {
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchAnalyses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("saved_analyses")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Failed to load saved analyses:", error);
      toast.error("Could not load saved analyses");
    } else {
      setAnalyses(((data as unknown) as SavedAnalysis[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAnalyses();
  }, [refreshTrigger]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const { error } = await supabase.from("saved_analyses").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete analysis");
    } else {
      setAnalyses((prev) => prev.filter((a) => a.id !== id));
      toast.success("Analysis deleted");
    }
  };

  const filtered = analyses.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase()) ||
      a.era.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const getTypeConfig = (type?: string) =>
    TYPE_CONFIG[(type as keyof typeof TYPE_CONFIG) ?? "product"] ?? TYPE_CONFIG.product;

  return (
    <div className="space-y-4">
      {/* Search + count bar */}
      <div className="flex items-center gap-3">
        {analyses.length > 3 && (
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, category, or era..."
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              style={{
                border: "1.5px solid hsl(var(--border))",
                background: "hsl(var(--background))",
                color: "hsl(var(--foreground))",
              }}
            />
          </div>
        )}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className="px-2.5 py-1 rounded-lg text-xs font-bold"
            style={{ background: "hsl(var(--primary))", color: "white" }}
          >
            {analyses.length} saved
          </span>
          <button
            onClick={fetchAnalyses}
            className="p-2 rounded-lg transition-colors hover:bg-muted"
            title="Refresh"
          >
            <RotateCcw size={14} style={{ color: "hsl(var(--muted-foreground))" }} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "hsl(var(--primary))" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-10 text-center">
          <Database size={28} className="mx-auto mb-3 opacity-20" />
          <p className="text-sm text-muted-foreground">
            {analyses.length === 0
              ? "No saved analyses yet. Run your first analysis to get started!"
              : "No results match your search."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((analysis) => {
            const cfg = getTypeConfig(analysis.analysis_type);
            const TypeIcon = cfg.icon;
            return (
              <button
                key={analysis.id}
                onClick={() => onLoad(analysis)}
                className="w-full text-left p-4 rounded-xl transition-all group hover:scale-[1.01] hover:shadow-md"
                style={{
                  background: "hsl(var(--card))",
                  border: "2px solid hsl(var(--border))",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = cfg.color;
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 16px -4px ${cfg.color}30`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--border))";
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Type badge */}
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: cfg.bgColor, color: cfg.color }}
                      >
                        <TypeIcon size={10} />
                        {cfg.label}
                      </span>
                      {analysis.avg_revival_score && (
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: "hsl(var(--primary) / 0.12)", color: "hsl(var(--primary))" }}
                        >
                          {analysis.avg_revival_score}/10
                        </span>
                      )}
                    </div>
                    {/* Title */}
                    <p className="text-sm font-bold text-foreground leading-snug mb-1.5 line-clamp-2">{analysis.title}</p>
                    {/* Meta row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground))" }}
                      >
                        {analysis.category}
                      </span>
                      <span className="text-[11px] text-muted-foreground">{analysis.era}</span>
                      {analysis.product_count > 0 && (
                        <span className="text-[11px] text-muted-foreground">{analysis.product_count} products</span>
                      )}
                    </div>
                    {/* Date */}
                    <div className="flex items-center gap-1 mt-2">
                      <Clock size={10} className="text-muted-foreground" />
                      <span className="text-[11px] text-muted-foreground">{formatDate(analysis.created_at)}</span>
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex flex-col items-center gap-2 flex-shrink-0">
                    <ChevronRight size={16} style={{ color: cfg.color }} className="opacity-40 group-hover:opacity-100 transition-opacity" />
                    <button
                      onClick={(e) => handleDelete(analysis.id, e)}
                      className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: "hsl(var(--destructive))" }}
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

