import React, { useState, useEffect } from "react";
import { Focus, ChevronDown, Plus, Pencil, Trash2, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { LensEditor } from "@/components/LensEditor";
import { ETA_LENS, getLensType } from "@/lib/etaLens";
import { toast } from "sonner";

export interface UserLens {
  id: string;
  name: string;
  lensType?: "default" | "eta" | "custom";
  primary_objective?: string;
  target_outcome?: string;
  risk_tolerance?: string;
  time_horizon?: string;
  available_resources?: string;
  constraints?: string;
  evaluation_priorities?: Record<string, number>;
  is_default?: boolean;
}

export function LensToggle() {
  const { user } = useAuth();
  const analysis = useAnalysis();
  const [lenses, setLenses] = useState<UserLens[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editingLens, setEditingLens] = useState<UserLens | null>(null);

  const activeLens = analysis.activeLens;
  const activeLensType = getLensType(activeLens);

  // Fetch user lenses
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
    setShowDropdown(false);
    toast.success("Switched to Default lens");
  };

  const handleSelectEta = () => {
    analysis.setActiveLens(ETA_LENS as UserLens);
    setShowDropdown(false);
    toast.success("ETA Acquisition Lens activated");
  };

  const handleSelectCustom = (lens: UserLens) => {
    analysis.setActiveLens({ ...lens, lensType: "custom" });
    setShowDropdown(false);
    toast.success(`Custom lens "${lens.name}" activated`);
  };

  const handleDeleteLens = async (lens: UserLens) => {
    await (supabase.from("user_lenses") as any).delete().eq("id", lens.id);
    setLenses((prev) => prev.filter((l) => l.id !== lens.id));
    if (activeLens?.id === lens.id) analysis.setActiveLens(null);
    toast.success("Lens deleted");
  };

  const getActiveLabel = () => {
    if (activeLensType === "eta") return "ETA Acquisition";
    if (activeLensType === "custom") return activeLens?.name || "Custom";
    return "Default";
  };

  return (
    <div className="relative">
      {/* Active lens pill */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
          activeLensType === "default"
            ? "bg-muted text-muted-foreground border-border hover:bg-accent"
            : activeLensType === "eta"
            ? "bg-primary/10 text-primary border-primary/30"
            : "bg-primary/10 text-primary border-primary/30"
        }`}
      >
        <Focus size={12} />
        {getActiveLabel()}
        <ChevronDown size={10} />
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 top-full mt-1 z-30 w-72 rounded-lg border border-border bg-popover shadow-lg p-1.5 space-y-0.5">
          {/* Default */}
          <p className="px-2 py-1 text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Perspective</p>
          <button
            onClick={handleSelectDefault}
            className={`flex items-center gap-2 w-full px-2 py-2 rounded-md text-xs transition-colors text-left ${
              activeLensType === "default" ? "bg-primary/10 text-primary" : "hover:bg-accent text-foreground"
            }`}
          >
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${activeLensType === "default" ? "bg-primary" : "bg-muted-foreground/40"}`} />
            <div>
              <span className="font-semibold block">Default</span>
              <span className="text-[10px] text-muted-foreground">Explore possibilities &amp; disruption potential</span>
            </div>
          </button>

          {/* ETA */}
          <button
            onClick={handleSelectEta}
            className={`flex items-center gap-2 w-full px-2 py-2 rounded-md text-xs transition-colors text-left ${
              activeLensType === "eta" ? "bg-primary/10 text-primary" : "hover:bg-accent text-foreground"
            }`}
          >
            <Building2 size={10} className={`flex-shrink-0 ${activeLensType === "eta" ? "text-primary" : "text-muted-foreground"}`} />
            <div>
              <span className="font-semibold block">ETA Acquisition</span>
              <span className="text-[10px] text-muted-foreground">Ownership &amp; value-creation lens</span>
            </div>
          </button>

          {/* Custom lenses */}
          {lenses.length > 0 && (
            <>
              <div className="border-t border-border my-1" />
              <p className="px-2 py-1 text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Your Lenses</p>
              {lenses.map((lens) => (
                <div
                  key={lens.id}
                  className={`flex items-center justify-between px-2 py-1.5 rounded-md text-xs transition-colors ${
                    activeLens?.id === lens.id ? "bg-primary/10 text-primary" : "hover:bg-accent text-foreground"
                  }`}
                >
                  <button className="flex-1 text-left font-medium truncate" onClick={() => handleSelectCustom(lens)}>
                    {lens.name}
                  </button>
                  <div className="flex items-center gap-1 ml-1 flex-shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingLens(lens); setShowEditor(true); setShowDropdown(false); }}
                      className="p-0.5 rounded hover:bg-muted"
                    >
                      <Pencil size={10} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteLens(lens); }}
                      className="p-0.5 rounded hover:bg-destructive/10 text-destructive"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Create new */}
          <div className="border-t border-border my-1" />
          <button
            onClick={() => { setEditingLens(null); setShowEditor(true); setShowDropdown(false); }}
            className="flex items-center gap-1.5 w-full px-2 py-1.5 rounded-md text-xs font-medium text-primary hover:bg-primary/5 transition-colors"
          >
            <Plus size={12} /> Create custom lens
          </button>
        </div>
      )}

      {/* Close dropdown on outside click */}
      {showDropdown && (
        <div className="fixed inset-0 z-20" onClick={() => setShowDropdown(false)} />
      )}

      {/* Editor modal */}
      {showEditor && (
        <LensEditor
          lens={editingLens}
          onClose={() => { setShowEditor(false); setEditingLens(null); }}
          onSaved={(saved) => {
            setShowEditor(false);
            setEditingLens(null);
            analysis.setActiveLens({ ...saved, lensType: "custom" });
            toast.success(editingLens ? "Lens updated" : "Lens created & activated");
          }}
        />
      )}
    </div>
  );
}
