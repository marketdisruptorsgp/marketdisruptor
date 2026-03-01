import React, { useState, useEffect } from "react";
import { Focus, ChevronRight, Building2, Plus, Sparkles, Star, Check, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { supabase } from "@/integrations/supabase/client";
import { LensEditor } from "@/components/LensEditor";
import { ETA_LENS, getLensType } from "@/lib/etaLens";
import type { UserLens } from "@/components/LensToggle";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * Prominent lens configuration banner for the workspace.
 * Shows active lens, quick-switch options, and an inline explainer.
 */
export function LensBanner() {
  const { user } = useAuth();
  const analysis = useAnalysis();
  const [lenses, setLenses] = useState<UserLens[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [deletingLens, setDeletingLens] = useState<UserLens | null>(null);

  const activeLens = analysis.activeLens;
  const activeLensType = getLensType(activeLens);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { data } = await (supabase.from("user_lenses") as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setLenses(data.map((l: any) => ({ ...l, lensType: "custom" })));
    })();
  }, [user?.id, showEditor]);

  const handleSelectDefault = () => {
    analysis.setActiveLens(null);
    toast.success("Switched to Default lens");
  };

  const handleSelectEta = () => {
    analysis.setActiveLens(ETA_LENS as UserLens);
    toast.success("ETA Acquisition Lens activated");
  };

  const handleSelectCustom = (lens: UserLens) => {
    analysis.setActiveLens({ ...lens, lensType: "custom" });
    toast.success(`"${lens.name}" lens activated`);
  };

  const handleDeleteLens = async () => {
    if (!deletingLens?.id) return;
    try {
      await (supabase.from("user_lenses") as any).delete().eq("id", deletingLens.id);
      setLenses((prev) => prev.filter((l) => l.id !== deletingLens.id));
      if (activeLens?.id === deletingLens.id) {
        analysis.setActiveLens(null);
      }
      toast.success(`"${deletingLens.name}" lens deleted`);
    } catch (err) {
      console.error("Delete lens error:", err);
      toast.error("Failed to delete lens");
    } finally {
      setDeletingLens(null);
    }
  };

  const getActiveLabel = () => {
    if (activeLensType === "eta") return "ETA Acquisition";
    if (activeLensType === "custom") return activeLens?.name || "Custom";
    return "Default";
  };

  const getActiveDesc = () => {
    if (activeLensType === "eta") return "Evaluating from an ownership & acquisition perspective";
    if (activeLensType === "custom") return activeLens?.primary_objective || "Custom evaluation priorities active";
    return "Exploring possibilities & disruption potential";
  };

  return (
    <>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {/* Main row */}
        <div className="p-4 sm:p-5">
          <div className="flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Focus size={18} className="text-primary" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-foreground">Analysis Lens</h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20">
                    {getActiveLabel()}
                  </span>
                </div>
                <p className="text-xs text-foreground/60 mt-0.5">{getActiveDesc()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setExpanded(!expanded)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border border-border bg-background hover:bg-accent transition-colors"
              >
                <Sparkles size={12} className="text-primary" />
                {expanded ? "Close" : "Change Lens"}
                <ChevronRight size={12} className={`transition-transform duration-200 ${expanded ? "rotate-90" : ""}`} />
              </button>
              <button
                onClick={() => setShowEditor(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              >
                <Plus size={12} />
                Create Lens
              </button>
            </div>
          </div>

          {/* Inline explainer */}
          <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-border/50">
            <p className="text-xs text-foreground/70 leading-relaxed">
              <strong className="text-foreground">What is a lens?</strong> A lens controls <em>how</em> your analyses are evaluated and scored — without changing the underlying data. 
              The <strong>Default</strong> lens explores disruption potential. The <strong>ETA Acquisition</strong> lens evaluates from a buyer's perspective. 
              Or <strong>create your own</strong> to prioritize what matters to you — growth targets, risk tolerance, budget constraints, and more.
            </p>
          </div>
        </div>

        {/* Expandable lens picker */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="border-t border-border px-4 sm:px-5 py-4 space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-foreground/50">Quick Switch</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {/* Default */}
                  <button
                    onClick={handleSelectDefault}
                    className={`relative flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                      activeLensType === "default"
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-primary/30 hover:bg-primary/[0.02]"
                    }`}
                  >
                    {activeLensType === "default" && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check size={10} className="text-primary-foreground" />
                      </div>
                    )}
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Focus size={14} className="text-foreground/60" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">Default</p>
                      <p className="text-[11px] text-foreground/60 mt-0.5">Explore possibilities & disruption potential</p>
                    </div>
                  </button>

                  {/* ETA */}
                  <button
                    onClick={handleSelectEta}
                    className={`relative flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${
                      activeLensType === "eta"
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-primary/30 hover:bg-primary/[0.02]"
                    }`}
                  >
                    {activeLensType === "eta" && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check size={10} className="text-primary-foreground" />
                      </div>
                    )}
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Building2 size={14} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">ETA Acquisition</p>
                      <p className="text-[11px] text-foreground/60 mt-0.5">Ownership, value-creation & buy-side analysis</p>
                    </div>
                  </button>

                  {/* Custom lenses */}
                  {lenses.map((lens) => (
                    <div
                      key={lens.id}
                      className={`relative flex items-start gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        activeLens?.id === lens.id
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/30 hover:bg-primary/[0.02]"
                      }`}
                      onClick={() => handleSelectCustom(lens)}
                    >
                      {activeLens?.id === lens.id ? (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <Check size={10} className="text-primary-foreground" />
                        </div>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeletingLens(lens); }}
                          className="absolute top-2 right-2 w-6 h-6 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:!opacity-100 hover:bg-destructive/10 transition-all"
                          style={{ opacity: undefined }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0"; }}
                          aria-label={`Delete ${lens.name}`}
                        >
                          <Trash2 size={12} className="text-destructive" />
                        </button>
                      )}
                      <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                        <Star size={14} className="text-foreground/60" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-foreground truncate">{lens.name}</p>
                        <p className="text-[11px] text-foreground/60 mt-0.5 truncate">
                          {lens.primary_objective || "Custom evaluation priorities"}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Create new card */}
                  <button
                    onClick={() => { setShowEditor(true); setExpanded(false); }}
                    className="flex items-start gap-3 p-3 rounded-xl border border-dashed border-primary/30 text-left hover:bg-primary/[0.03] transition-all"
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Plus size={14} className="text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-primary">Create Custom Lens</p>
                      <p className="text-[11px] text-foreground/60 mt-0.5">Set your own goals, constraints & priorities</p>
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {showEditor && (
        <LensEditor
          lens={null}
          onClose={() => setShowEditor(false)}
          onSaved={(saved) => {
            setShowEditor(false);
            analysis.setActiveLens({ ...saved, lensType: "custom" });
            toast.success("Lens created & activated");
          }}
        />
      )}

      <AlertDialog open={!!deletingLens} onOpenChange={(open) => !open && setDeletingLens(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deletingLens?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This lens will be permanently removed. Any future analyses will need a different lens selected. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLens}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Lens
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
