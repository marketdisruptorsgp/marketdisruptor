import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Clock, Trash2, ChevronRight, Database, RotateCcw, Search } from "lucide-react";
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
}

interface SavedAnalysesProps {
  onLoad: (analysis: SavedAnalysis) => void;
  refreshTrigger?: number;
}

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

  return (
    <div className="card-intelligence p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database size={15} style={{ color: "hsl(var(--primary))" }} />
          <h3 className="font-bold text-sm text-foreground">Saved Analyses</h3>
          <span
            className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
            style={{ background: "hsl(var(--primary))", color: "white" }}
          >
            {analyses.length}
          </span>
        </div>
        <button
          onClick={fetchAnalyses}
          className="p-1.5 rounded-lg transition-colors hover:bg-muted"
          title="Refresh"
        >
          <RotateCcw size={12} style={{ color: "hsl(var(--muted-foreground))" }} />
        </button>
      </div>

      {analyses.length > 3 && (
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search analyses..."
            className="w-full pl-7 pr-3 py-1.5 text-xs rounded-lg focus:outline-none"
            style={{
              border: "1px solid hsl(var(--border))",
              background: "hsl(var(--muted))",
              color: "hsl(var(--foreground))",
            }}
          />
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "hsl(var(--primary))" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-6 text-center">
          <Database size={24} className="mx-auto mb-2 opacity-20" />
          <p className="text-xs text-muted-foreground">
            {analyses.length === 0
              ? "No saved analyses yet. Run your first analysis above!"
              : "No results match your search."}
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {filtered.map((analysis) => (
            <button
              key={analysis.id}
              onClick={() => onLoad(analysis)}
              className="w-full text-left p-3 rounded-xl transition-all group hover:scale-[1.01]"
              style={{
                background: "hsl(var(--muted))",
                border: "1px solid hsl(var(--border))",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--primary) / 0.5)";
                (e.currentTarget as HTMLElement).style.background = "hsl(var(--primary-muted))";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "hsl(var(--border))";
                (e.currentTarget as HTMLElement).style.background = "hsl(var(--muted))";
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">{analysis.title}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                      style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary-dark))" }}
                    >
                      {analysis.category}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{analysis.era}</span>
                    <span className="text-[10px] text-muted-foreground">·</span>
                    <span className="text-[10px] text-muted-foreground">{analysis.product_count} products</span>
                    {analysis.avg_revival_score && (
                      <>
                        <span className="text-[10px] text-muted-foreground">·</span>
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ background: "hsl(var(--primary) / 0.15)", color: "hsl(var(--primary-dark))" }}
                        >
                          ⚡ {analysis.avg_revival_score}/10
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <Clock size={9} className="text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">{formatDate(analysis.created_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={(e) => handleDelete(analysis.id, e)}
                    className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100"
                    title="Delete"
                  >
                    <Trash2 size={11} className="text-red-500" />
                  </button>
                  <ChevronRight size={13} style={{ color: "hsl(var(--primary))" }} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
