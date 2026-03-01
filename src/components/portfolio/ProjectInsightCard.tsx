import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Lightbulb, Rocket, Target, ChevronRight, Presentation, StickyNote, Heart, FileDown, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ProjectNotesEditor } from "./ProjectNotesEditor";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { downloadFullAnalysisPDF } from "@/lib/pdfExport";
import { toast } from "sonner";

interface SavedAnalysis {
  id: string;
  title: string;
  category: string;
  avg_revival_score: number;
  created_at: string;
  analysis_type?: string;
  products?: any[];
  analysis_data?: any;
  is_favorite?: boolean;
}

const CATEGORY_MAP: Record<string, { label: string; color: string }> = {
  custom: { label: "Product", color: "#1249a3" },
  product: { label: "Product", color: "#1249a3" },
  service: { label: "Service", color: "#df2060" },
  business: { label: "Business", color: "#8b3fd9" },
  first_principles: { label: "First Principles", color: "#0d9488" },
};

function getInsights(a: SavedAnalysis) {
  const data = a.analysis_data as any;
  if (!data) return null;
  const products = (a.products || []) as any[];
  const firstProduct = products[0];
  return {
    keyInsight: firstProduct?.keyInsight || data?.pitchDeck?.elevatorPitch || null,
    strongestProjection: data?.pitchDeck?.financialModel?.scenarios?.base?.revenue || data?.pitchDeck?.investmentAsk?.scenarios?.base?.revenue || null,
    easiestGtm: data?.pitchDeck?.gtmStrategy?.keyChannels?.[0] || null,
  };
}

export function ProjectInsightCard({ analysis, onOpen, onToggleFavorite }: { analysis: SavedAnalysis; onOpen: () => void; onToggleFavorite?: (id: string) => void }) {
  const insights = getInsights(analysis);
  const score = analysis.avg_revival_score || 0;
  const scoreColor = score >= 7.5 ? "hsl(var(--score-high))" : score >= 5 ? "hsl(38 92% 50%)" : "hsl(var(--muted-foreground))";
  const cat = CATEGORY_MAP[analysis.analysis_type || analysis.category] || CATEGORY_MAP.custom;
  const hasPitch = !!(analysis.analysis_data as any)?.pitchDeck;
  const projectNotes = (analysis.analysis_data as any)?.projectNotes || "";
  const [notesOpen, setNotesOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExportPDF = (e: React.MouseEvent) => {
    e.stopPropagation();
    const products = (analysis.products || []) as any[];
    const syntheticProduct = products[0] || { name: analysis.title, category: analysis.category };
    setExporting(true);
    try {
      downloadFullAnalysisPDF(syntheticProduct, analysis.analysis_data || null);
      toast.success("Full report exported!");
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  const handleSaveNotes = async (notes: string) => {
    try {
      const { data: existing } = await (supabase.from("saved_analyses") as any)
        .select("analysis_data")
        .eq("id", analysis.id)
        .single();
      const prev = (existing?.analysis_data as Record<string, unknown>) || {};
      await (supabase.from("saved_analyses") as any)
        .update({ analysis_data: { ...prev, projectNotes: notes } })
        .eq("id", analysis.id);
    } catch (err) {
      console.error("Failed to save notes:", err);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all space-y-0 group relative">
      {/* Favorite toggle */}
      {onToggleFavorite && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(analysis.id); }}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
          title={analysis.is_favorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart size={14} className={analysis.is_favorite ? "text-primary fill-primary" : "text-muted-foreground"} />
        </button>
      )}
      <button
        onClick={onOpen}
        className="text-left w-full p-4 space-y-3"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">{analysis.title}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="typo-status-label px-1.5 py-0.5 rounded font-bold" style={{ background: `${cat.color}15`, color: cat.color }}>
                {cat.label}
              </span>
              {hasPitch && (
                <span className="typo-status-label px-1.5 py-0.5 rounded font-bold" style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}>
                  <Presentation size={8} className="inline mr-0.5" />Pitch Deck
                </span>
              )}
              <span className="typo-card-meta text-foreground/60">{format(parseISO(analysis.created_at), "MMM d")}</span>
            </div>
          </div>
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center typo-card-title flex-shrink-0"
            style={{ background: `${scoreColor}15`, color: scoreColor }}
          >
            {score || "—"}
          </div>
        </div>

        {insights?.keyInsight && (
          <div className="flex gap-2 items-start">
            <Lightbulb size={11} className="text-primary flex-shrink-0 mt-0.5" />
            <p className="typo-card-meta text-foreground/70 leading-relaxed line-clamp-2">{insights.keyInsight}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5">
          {insights?.strongestProjection && (
            <span className="typo-card-meta px-2 py-0.5 rounded-full font-semibold" style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}>
              <Rocket size={8} className="inline mr-0.5" /> {insights.strongestProjection}
            </span>
          )}
          {insights?.easiestGtm && (
            <span className="typo-card-meta px-2 py-0.5 rounded-full font-semibold" style={{ background: "hsl(142 70% 45% / 0.1)", color: "hsl(142 70% 35%)" }}>
              <Target size={8} className="inline mr-0.5" /> {insights.easiestGtm}
            </span>
          )}
        </div>

        {/* Notes preview */}
        {projectNotes && !notesOpen && (
          <div className="flex gap-1.5 items-start">
            <StickyNote size={10} className="text-muted-foreground flex-shrink-0 mt-0.5" />
            <p className="typo-card-meta text-foreground/60 line-clamp-1 italic">{projectNotes}</p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="flex items-center gap-1 typo-card-meta font-semibold px-2 py-1 rounded-md transition-colors hover:bg-primary/10 text-primary"
            title="Download Full Report PDF"
          >
            {exporting ? <Loader2 size={11} className="animate-spin" /> : <FileDown size={11} />}
            PDF Report
          </button>
          <ChevronRight size={14} className="text-muted-foreground/40 group-hover:text-foreground transition-colors" />
        </div>
      </button>

      {/* Inline notes section */}
      <Collapsible open={notesOpen} onOpenChange={setNotesOpen}>
        <div className="px-4 pb-1">
          <CollapsibleTrigger asChild>
            <button
              onClick={e => { e.stopPropagation(); setNotesOpen(!notesOpen); }}
              className="flex items-center gap-1 typo-card-meta font-medium text-foreground/60 hover:text-primary transition-colors py-1"
            >
              <StickyNote size={10} />
              {notesOpen ? "Hide Notes" : "Notes"}
            </button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <div className="px-4 pb-3" onClick={e => e.stopPropagation()}>
            <ProjectNotesEditor
              value={projectNotes}
              onSave={handleSaveNotes}
              compact
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
