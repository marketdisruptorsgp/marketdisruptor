import React, { useState, useEffect } from "react";
import { Focus, ChevronDown, Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { LensEditor } from "@/components/LensEditor";
import { toast } from "sonner";

export interface UserLens {
  id: string;
  name: string;
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
  const [loading, setLoading] = useState(false);

  const activeLens = analysis.activeLens;

  // Fetch user lenses
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { data } = await (supabase.from("user_lenses") as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setLenses(data);
    })();
  }, [user?.id, showEditor]);

  const handleSelectLens = (lens: UserLens) => {
    analysis.setActiveLens(lens);
    setShowDropdown(false);
    toast.success(`Custom lens "${lens.name}" activated`);
  };

  const handleClearLens = () => {
    analysis.setActiveLens(null);
    setShowDropdown(false);
    toast.success("Switched to default perspective");
  };

  const handleDeleteLens = async (lens: UserLens) => {
    await (supabase.from("user_lenses") as any).delete().eq("id", lens.id);
    setLenses((prev) => prev.filter((l) => l.id !== lens.id));
    if (activeLens?.id === lens.id) analysis.setActiveLens(null);
    toast.success("Lens deleted");
  };

  const handleCustomClick = () => {
    if (lenses.length === 0) {
      setShowEditor(true);
    } else {
      setShowDropdown(!showDropdown);
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-1.5">
        {/* Default button */}
        <button
          onClick={handleClearLens}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
            !activeLens
              ? "bg-primary/10 text-primary border border-primary/30"
              : "bg-muted text-muted-foreground border border-border hover:bg-accent"
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${!activeLens ? "bg-primary" : "bg-muted-foreground/40"}`} />
          Default
        </button>

        {/* Custom lens button */}
        <button
          onClick={handleCustomClick}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
            activeLens
              ? "bg-primary/10 text-primary border border-primary/30"
              : "bg-muted text-muted-foreground border border-border hover:bg-accent"
          }`}
        >
          <Focus size={12} />
          {activeLens ? activeLens.name : "Custom Lens"}
          <ChevronDown size={10} />
        </button>
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 top-full mt-1 z-30 w-64 rounded-lg border border-border bg-popover shadow-lg p-1.5 space-y-0.5">
          <p className="px-2 py-1 text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Your Lenses</p>
          {lenses.map((lens) => (
            <div
              key={lens.id}
              className={`flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer text-xs transition-colors ${
                activeLens?.id === lens.id ? "bg-primary/10 text-primary" : "hover:bg-accent text-foreground"
              }`}
            >
              <button className="flex-1 text-left font-medium truncate" onClick={() => handleSelectLens(lens)}>
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
          <button
            onClick={() => { setEditingLens(null); setShowEditor(true); setShowDropdown(false); }}
            className="flex items-center gap-1.5 w-full px-2 py-1.5 rounded-md text-xs font-medium text-primary hover:bg-primary/5 transition-colors"
          >
            <Plus size={12} /> Create new lens
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
            analysis.setActiveLens(saved);
            toast.success(editingLens ? "Lens updated" : "Lens created & activated");
          }}
        />
      )}
    </div>
  );
}
