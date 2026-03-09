import React, { useState, useEffect } from "react";
import { Focus, ChevronDown, Plus, Pencil, Trash2, Building2, Star, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { LensEditor } from "@/components/LensEditor";
import { ETA_LENS, getEtaLensWithContext, getLensType } from "@/lib/etaLens";
import { OperatorContextEditor } from "@/components/OperatorContextEditor";
import { toast } from "sonner";

const PRIMARY_LENS_KEY = "primary-lens-type";
const PRIMARY_LENS_ID_KEY = "primary-lens-id";

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
  const [showOperatorEditor, setShowOperatorEditor] = useState(false);
  const [editingLens, setEditingLens] = useState<UserLens | null>(null);
  const [primaryType, setPrimaryType] = useState<string>(() => localStorage.getItem(PRIMARY_LENS_KEY) || "default");
  const [primaryId, setPrimaryId] = useState<string | null>(() => localStorage.getItem(PRIMARY_LENS_ID_KEY));

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

  // Auto-activate primary lens on first load
  const hasAutoLoaded = React.useRef(false);
  useEffect(() => {
    if (hasAutoLoaded.current) return;
    if (primaryType === "default") { hasAutoLoaded.current = true; return; }
    if (primaryType === "eta") {
      analysis.setActiveLens(getEtaLensWithContext() as UserLens);
      hasAutoLoaded.current = true;
      return;
      return;
    }
    if (primaryType === "custom" && primaryId && lenses.length > 0) {
      const match = lenses.find(l => l.id === primaryId);
      if (match) {
        analysis.setActiveLens({ ...match, lensType: "custom" });
      }
      hasAutoLoaded.current = true;
    }
  }, [primaryType, primaryId, lenses]);

  const savePrimary = (type: string, id?: string) => {
    localStorage.setItem(PRIMARY_LENS_KEY, type);
    setPrimaryType(type);
    if (id) {
      localStorage.setItem(PRIMARY_LENS_ID_KEY, id);
      setPrimaryId(id);
    } else {
      localStorage.removeItem(PRIMARY_LENS_ID_KEY);
      setPrimaryId(null);
    }
    // Update is_default in DB for custom lenses
    if (user?.id) {
      (supabase.from("user_lenses") as any).update({ is_default: false }).eq("user_id", user.id).then(() => {
        if (type === "custom" && id) {
          (supabase.from("user_lenses") as any).update({ is_default: true }).eq("id", id);
        }
      });
    }
    toast.success("Primary lens saved");
  };

  const isPrimary = (type: string, id?: string) => {
    if (type === "custom") return primaryType === "custom" && primaryId === id;
    return primaryType === type;
  };

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
    if (primaryId === lens.id) savePrimary("default");
    toast.success("Lens deleted");
  };

  const getActiveLabel = () => {
    if (activeLensType === "eta") return "ETA Acquisition";
    if (activeLensType === "custom") return activeLens?.name || "Custom";
    return "Default";
  };

  const PrimaryButton = ({ type, id }: { type: string; id?: string }) => {
    const active = isPrimary(type, id);
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          savePrimary(type, id);
        }}
        title={active ? "Primary lens" : "Set as primary"}
        className={`p-0.5 rounded transition-colors ${active ? "text-amber-500" : "text-muted-foreground/40 hover:text-amber-400"}`}
      >
        <Star size={10} fill={active ? "currentColor" : "none"} />
      </button>
    );
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
        {isPrimary(activeLensType, activeLens?.id) && activeLensType !== "default" && (
          <Star size={9} className="text-amber-500" fill="currentColor" />
        )}
        <ChevronDown size={10} />
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 top-full mt-1 z-30 w-72 rounded-lg border border-border bg-popover shadow-lg p-1.5 space-y-0.5">
          {/* Default */}
          <p className="px-2 py-1 text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Perspective</p>
          <div className={`flex items-center gap-2 w-full px-2 py-2 rounded-md text-xs transition-colors ${
            activeLensType === "default" ? "bg-primary/10 text-primary" : "hover:bg-accent text-foreground"
          }`}>
            <button onClick={handleSelectDefault} className="flex items-center gap-2 flex-1 text-left">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${activeLensType === "default" ? "bg-primary" : "bg-muted-foreground/40"}`} />
              <div>
                <span className="font-semibold block">Default</span>
                <span className="text-[10px] text-muted-foreground">Explore possibilities &amp; disruption potential</span>
              </div>
            </button>
            <PrimaryButton type="default" />
          </div>

          {/* ETA */}
          <div className={`flex items-center gap-2 w-full px-2 py-2 rounded-md text-xs transition-colors ${
            activeLensType === "eta" ? "bg-primary/10 text-primary" : "hover:bg-accent text-foreground"
          }`}>
            <button onClick={handleSelectEta} className="flex items-center gap-2 flex-1 text-left">
              <Building2 size={10} className={`flex-shrink-0 ${activeLensType === "eta" ? "text-primary" : "text-muted-foreground"}`} />
              <div>
                <span className="font-semibold block">ETA Acquisition</span>
                <span className="text-[10px] text-muted-foreground">Ownership &amp; value-creation lens</span>
              </div>
            </button>
            <PrimaryButton type="eta" />
          </div>

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
                    <PrimaryButton type="custom" id={lens.id} />
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
