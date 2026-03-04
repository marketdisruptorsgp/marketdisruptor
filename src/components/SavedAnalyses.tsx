import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import {
  Clock, Trash2, ChevronRight, Database, RotateCcw, Search,
  ShoppingBag, Building2, Microscope, Star, TrendingUp, Zap, Award,
  AlertTriangle,
} from "lucide-react";
import { StepProgressDots } from "@/components/StepProgressDots";
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
  onCountChange?: (count: number) => void;
  compact?: boolean;
}

const TYPE_CONFIG = {
  product: {
    label: "Products",
    icon: ShoppingBag,
    color: "hsl(var(--primary))",
    bgColor: "hsl(var(--primary) / 0.1)",
  },
  service: {
    label: "Service",
    icon: Building2,
    color: "hsl(340 75% 50%)",
    bgColor: "hsl(340 75% 50% / 0.1)",
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

function getTypeConfig(type?: string) {
  return TYPE_CONFIG[(type as keyof typeof TYPE_CONFIG) ?? "product"] ?? TYPE_CONFIG.product;
}

function formatDate(iso: string) {
  return formatDistanceToNow(new Date(iso), { addSuffix: true });
}

function isStale(iso: string) {
  const daysOld = (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24);
  return daysOld > 30;
}

// Deduplication removed — was hiding legitimate projects with same category/type/batch_size

function getScoreColor(score: number) {
  if (score >= 8) return "hsl(var(--score-high))";
  if (score >= 6) return "hsl(var(--primary))";
  return "hsl(var(--warning))";
}

function getScoreLabel(score: number) {
  if (score >= 8) return "High Potential";
  if (score >= 6) return "Moderate";
  return "Needs Work";
}

/* ──────── Stat Card ──────── */
function StatCard({ icon: Icon, label, value, accent }: { icon: typeof Star; label: string; value: string | number; accent?: string }) {
  return (
    <div
      className="rounded-lg border border-border bg-card p-2.5 sm:p-3 flex items-center gap-2 sm:gap-3"
      style={{ borderLeft: accent ? `3px solid ${accent}` : undefined }}
    >
      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: accent ? `${accent}14` : "hsl(var(--muted))" }}>
        <Icon size={13} style={{ color: accent || "hsl(var(--muted-foreground))" }} />
      </div>
      <div className="min-w-0">
        <p className="text-base sm:text-lg font-bold text-foreground leading-tight">{value}</p>
        <p className="text-[9px] sm:text-[10px] font-medium text-muted-foreground uppercase tracking-wider truncate">{label}</p>
      </div>
    </div>
  );
}

/* ──────── Spotlight Card (high-score projects) ──────── */
function SpotlightCard({ analysis, onLoad, onDelete }: { analysis: SavedAnalysis; onLoad: () => void; onDelete: (e: React.MouseEvent) => void }) {
  const cfg = getTypeConfig(analysis.analysis_type);
  const TypeIcon = cfg.icon;
  const score = analysis.avg_revival_score;

  // Extract a snippet from analysis_data if available
  const snippet = useMemo(() => {
    const data = analysis.analysis_data as Record<string, unknown> | null;
    if (!data) return null;
    // Try disrupt data for a compelling snippet
    const disrupt = data.disrupt as Record<string, unknown> | undefined;
    if (disrupt) {
      const ideas = (disrupt as any)?.flippedIdeas || (disrupt as any)?.ideas;
      if (Array.isArray(ideas) && ideas.length > 0) {
        const idea = ideas[0];
        return idea?.name || idea?.title || idea?.concept || null;
      }
    }
    return null;
  }, [analysis.analysis_data]);

  return (
    <button
      onClick={onLoad}
      className="w-full text-left rounded-xl border-2 transition-all group hover:shadow-md relative overflow-hidden"
      style={{
        background: "hsl(var(--card))",
        borderColor: `${getScoreColor(score)}30`,
      }}
    >
      {/* Top accent bar */}
      <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${getScoreColor(score)}, ${cfg.color})` }} />

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: cfg.bgColor }}>
              <TypeIcon size={13} style={{ color: cfg.color }} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: cfg.color }}>{cfg.label}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Award size={13} style={{ color: getScoreColor(score) }} />
            <span className="text-sm font-bold" style={{ color: getScoreColor(score) }}>{score}/10</span>
          </div>
        </div>

        {/* Title */}
        <p className="text-sm font-bold text-foreground leading-snug mb-2 line-clamp-2">{analysis.title}</p>

        {/* Score bar */}
        <div className="h-1.5 rounded-full overflow-hidden bg-muted mb-2.5">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${(score / 10) * 100}%`, background: getScoreColor(score) }}
          />
        </div>

        {/* Snippet / opportunity callout */}
        {snippet && (
          <div className="rounded-md p-2 mb-2.5" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
            <div className="flex items-center gap-1 mb-0.5">
              <Zap size={10} style={{ color: "hsl(var(--primary))" }} />
              <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "hsl(var(--primary))" }}>Top Idea</span>
            </div>
            <p className="text-[11px] text-foreground leading-snug line-clamp-2">{snippet}</p>
          </div>
        )}

        {/* Step progress */}
        <div className="mb-2.5">
          <StepProgressDots analysisData={analysis.analysis_data as Record<string, unknown> | null} analysisType={analysis.analysis_type} />
        </div>

        {/* Meta */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="tag-pill text-[10px]">{analysis.category}</span>
          {isStale(analysis.created_at) && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "hsl(38 92% 50% / 0.15)", color: "hsl(38 92% 40%)" }}>
              <AlertTriangle size={9} className="inline mr-0.5" /> Stale
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border">
          <div className="flex items-center gap-1">
            <Clock size={10} className="text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">{formatDate(analysis.created_at)}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onDelete}
              className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: "hsl(var(--destructive))" }}
              title="Delete"
            >
              <Trash2 size={12} />
            </button>
            <ChevronRight size={14} className="text-muted-foreground/40 group-hover:text-foreground transition-colors" />
          </div>
        </div>
      </div>
    </button>
  );
}

/* ──────── Standard Card ──────── */
function ProjectCard({ analysis, onLoad, onDelete }: { analysis: SavedAnalysis; onLoad: () => void; onDelete: (e: React.MouseEvent) => void }) {
  const cfg = getTypeConfig(analysis.analysis_type);
  const TypeIcon = cfg.icon;
  const score = analysis.avg_revival_score;

  return (
    <button
      onClick={onLoad}
      className="w-full text-left p-3.5 rounded-lg transition-all group hover:bg-muted/50 hover:shadow-sm"
      style={{
        background: "hsl(var(--card))",
        border: "1.5px solid hsl(var(--border))",
        borderLeft: `3px solid ${cfg.color}`,
      }}
    >
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0" style={{ background: cfg.bgColor }}>
          <TypeIcon size={11} style={{ color: cfg.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-foreground truncate leading-tight">{analysis.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-muted-foreground">{analysis.category}</span>
            <span className="text-[10px] text-muted-foreground">·</span>
            <span className="text-[10px] text-muted-foreground">{formatDate(analysis.created_at)}</span>
            {isStale(analysis.created_at) && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "hsl(38 92% 50% / 0.15)", color: "hsl(38 92% 40%)" }}>
                Stale
              </span>
            )}
          </div>
          <StepProgressDots analysisData={analysis.analysis_data as Record<string, unknown> | null} analysisType={analysis.analysis_type} />
          {(() => {
            const ad = analysis.analysis_data as Record<string, unknown> | null;
            if (!ad) return null;
            const steps = [
              { key: "pitchDeck", label: "Pitch" },
              { key: "stressTest", label: "Stress Test" },
              { key: "redesign", label: "Redesign" },
              { key: "disrupt", label: "Deconstruct" },
            ];
            for (const s of steps) {
              if (ad[s.key]) {
                const idx = steps.indexOf(s);
                const next = idx > 0 ? steps[idx - 1].label : s.label;
                return (
                  <span className="text-[9px] font-medium" style={{ color: "hsl(var(--primary))" }}>
                    Resume at {next}
                  </span>
                );
              }
            }
            return null;
          })()}
        </div>
        {score > 0 && (
          <span
            className="text-[11px] font-bold px-2 py-0.5 rounded flex-shrink-0"
            style={{ background: `${getScoreColor(score)}14`, color: getScoreColor(score) }}
          >
            {score}/10
          </span>
        )}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onDelete}
            className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: "hsl(var(--destructive))" }}
            title="Delete"
          >
            <Trash2 size={12} />
          </button>
          <ChevronRight size={14} className="text-muted-foreground/40 group-hover:text-foreground transition-colors" />
        </div>
      </div>
    </button>
  );
}

/* ──────── Main Component ──────── */
export function SavedAnalyses({ onLoad, refreshTrigger, onCountChange, compact }: SavedAnalysesProps) {
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
      const all = ((data as unknown) as SavedAnalysis[]) || [];
      const withoutFirstPrinciples = all.filter((a) => a.analysis_type !== "first_principles");
      setAnalyses(withoutFirstPrinciples);
      onCountChange?.(withoutFirstPrinciples.length);
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

  // Dashboard metrics
  const spotlightProjects = filtered.filter((a) => a.avg_revival_score >= 7.5);
  const regularProjects = filtered.filter((a) => a.avg_revival_score < 7.5);
  const avgScore = analyses.length > 0
    ? Math.round((analyses.reduce((s, a) => s + (a.avg_revival_score || 0), 0) / analyses.length) * 10) / 10
    : 0;
  const topScore = analyses.length > 0
    ? Math.max(...analyses.map((a) => a.avg_revival_score || 0))
    : 0;

  /* ── Compact mode (sidebar) ── */
  if (compact) {
    const recentItems = filtered.slice(0, 5);
    if (loading) {
      return (
        <div className="flex items-center justify-center py-6">
          <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "hsl(var(--primary))" }} />
        </div>
      );
    }
    if (recentItems.length === 0) {
      return <p className="text-xs text-muted-foreground py-4 text-center">No projects yet. Run your first analysis!</p>;
    }
    return (
      <div className="space-y-1.5">
        {recentItems.map((analysis) => {
          const cfg = getTypeConfig(analysis.analysis_type);
          const TypeIcon = cfg.icon;
          return (
            <button
              key={analysis.id}
              onClick={() => onLoad(analysis)}
              className="w-full text-left px-3 py-2.5 rounded transition-colors hover:bg-muted/50 flex items-center gap-2.5 group"
              style={{ border: "1px solid hsl(var(--border))", background: "hsl(var(--background))" }}
            >
              <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0" style={{ background: cfg.bgColor }}>
                <TypeIcon size={10} style={{ color: cfg.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-foreground truncate leading-tight">{analysis.title}</p>
                <p className="text-[9px] text-muted-foreground">{formatDate(analysis.created_at)}</p>
              </div>
              {analysis.avg_revival_score >= 7.5 && (
                <Star size={10} className="flex-shrink-0" style={{ color: getScoreColor(analysis.avg_revival_score), fill: getScoreColor(analysis.avg_revival_score) }} />
              )}
              <ChevronRight size={12} className="text-muted-foreground/40 group-hover:text-foreground flex-shrink-0 transition-colors" />
            </button>
          );
        })}
      </div>
    );
  }

  /* ── Full dashboard mode ── */
  return (
    <div className="space-y-5">
      {/* Stats row */}
      {analyses.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <StatCard icon={Database} label="Projects" value={analyses.length} accent="hsl(var(--primary))" />
          <StatCard icon={TrendingUp} label="Avg Score" value={avgScore} accent="hsl(var(--warning))" />
          <StatCard icon={Award} label="Top Score" value={topScore} accent="hsl(var(--score-high))" />
        </div>
      )}

      {/* Search + refresh */}
      <div className="flex items-center gap-2.5">
        {analyses.length > 3 && (
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              style={{
                border: "1.5px solid hsl(var(--border))",
                background: "hsl(var(--background))",
                color: "hsl(var(--foreground))",
              }}
            />
          </div>
        )}
        <button
          onClick={fetchAnalyses}
          className="p-2 rounded-lg transition-colors hover:bg-muted border border-border"
          title="Refresh"
        >
          <RotateCcw size={14} style={{ color: "hsl(var(--muted-foreground))" }} />
        </button>
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
        <>
          {/* Spotlight: high-scoring projects */}
          {spotlightProjects.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Star size={13} style={{ color: "hsl(var(--score-high))", fill: "hsl(var(--score-high))" }} />
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "hsl(var(--score-high))" }}>
                  Top Opportunities
                </p>
                <span className="text-[10px] text-muted-foreground">Score ≥ 7.5</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {spotlightProjects.map((a) => (
                  <SpotlightCard
                    key={a.id}
                    analysis={a}
                    onLoad={() => onLoad(a)}
                    onDelete={(e) => handleDelete(a.id, e)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Regular projects */}
          {regularProjects.length > 0 && (
            <div>
              {spotlightProjects.length > 0 && (
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
                  All Projects
                </p>
              )}
              <div className="space-y-2">
                {regularProjects.map((a) => (
                  <ProjectCard
                    key={a.id}
                    analysis={a}
                    onLoad={() => onLoad(a)}
                    onDelete={(e) => handleDelete(a.id, e)}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
