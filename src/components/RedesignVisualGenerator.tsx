/**
 * REDESIGN VISUAL GENERATOR
 * Auto-generates up to 3 concept visuals after redesign data loads.
 * Allows user to select which visuals go to pitch deck.
 * Users can also swap in Disrupt-step (flipped idea) visuals.
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAnalysis } from "@/contexts/AnalysisContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Image, RefreshCw, CheckCircle2, Sparkles, ArrowRight, X, Layers, Maximize2 } from "lucide-react";

interface RedesignVisual {
  url: string;
  label: string;
  description: string;
  source: "redesign" | "disrupt";
}

interface RedesignVisualGeneratorProps {
  productName: string;
  concept: {
    conceptName: string;
    tagline: string;
    physicalDescription?: string;
    coreInsight?: string;
    radicalDifferences?: string[];
    materials?: string[];
  };
  accentColor?: string;
}

export function RedesignVisualGenerator({ productName, concept, accentColor = "hsl(38 92% 50%)" }: RedesignVisualGeneratorProps) {
  const analysis = useAnalysis();
  const [visuals, setVisuals] = useState<RedesignVisual[]>([]);
  const [generating, setGenerating] = useState(false);
  const [generatingIdx, setGeneratingIdx] = useState<number | null>(null);
  const [showDisruptPicker, setShowDisruptPicker] = useState(false);
  const [fullscreenUrl, setFullscreenUrl] = useState<string | null>(null);

  // Restore from persisted data
  useEffect(() => {
    const existing = (analysis.redesignData as any)?.redesignVisuals as RedesignVisual[] | undefined;
    if (existing && existing.length > 0) {
      setVisuals(existing);
    }
  }, [analysis.redesignData]);

  // Disrupt-step visuals (flipped idea mockups)
  const disruptVisuals = Array.isArray(analysis.pitchDeckImages) ? analysis.pitchDeckImages : [];

  const VISUAL_PROMPTS = [
    {
      label: "Hero Product Shot",
      prompt: `Create a premium product concept render of "${concept.conceptName}" — a redesigned version of "${productName}". ${concept.physicalDescription || concept.tagline}. Studio lighting, white background, commercial product photography, hero shot, photorealistic.`,
    },
    {
      label: "Lifestyle Context",
      prompt: `Show "${concept.conceptName}" being used in a real-world lifestyle setting. ${concept.coreInsight || concept.tagline}. Natural lighting, authentic context, modern editorial photography style.`,
    },
    {
      label: "Technical Detail",
      prompt: `Close-up detail view of "${concept.conceptName}" showing innovative features and materials: ${concept.materials?.join(", ") || concept.radicalDifferences?.slice(0, 2).join("; ") || concept.physicalDescription || "premium materials"}. Macro photography, technical detail, clean background.`,
    },
  ];

  const generateSingleVisual = useCallback(async (index: number): Promise<RedesignVisual | null> => {
    const config = VISUAL_PROMPTS[index];
    if (!config) return null;

    try {
      const { data: result, error } = await supabase.functions.invoke("generate-product-visual", {
        body: {
          ideaName: concept.conceptName,
          description: config.prompt,
          visualNotes: config.prompt,
          productName,
        },
      });

      if (error || !result?.success) {
        const msg = result?.error || error?.message || "Failed";
        if (msg.includes("429") || msg.includes("Rate limit")) {
          toast.error("Rate limit hit — waiting before retrying...");
          return null;
        }
        if (msg.includes("402") || msg.includes("credits")) {
          toast.error("AI credits exhausted — add credits in Settings → Workspace → Usage.");
          return null;
        }
        console.error("Visual generation failed:", msg);
        return null;
      }

      return {
        url: result.imageUrl,
        label: config.label,
        description: config.prompt,
        source: "redesign" as const,
      };
    } catch (err) {
      console.error("Visual generation error:", err);
      return null;
    }
  }, [concept, productName]);

  const generateAllVisuals = useCallback(async () => {
    setGenerating(true);
    const results: RedesignVisual[] = [];

    for (let i = 0; i < 3; i++) {
      setGeneratingIdx(i);
      const visual = await generateSingleVisual(i);
      if (visual) {
        results.push(visual);
        setVisuals([...results]);
      }
      // Small delay between requests to avoid rate limiting
      if (i < 2) await new Promise(r => setTimeout(r, 2000));
    }

    setGeneratingIdx(null);
    setGenerating(false);

    if (results.length > 0) {
      // Persist visuals with redesign data
      const updated = { ...(analysis.redesignData as any), redesignVisuals: results };
      analysis.setRedesignData(updated);
      analysis.saveStepData("redesign", updated);

      // Auto-select first visual for pitch deck if none selected
      if ((Array.isArray(analysis.pitchDeckImages) ? analysis.pitchDeckImages : []).length === 0 && results[0]) {
        analysis.setPitchDeckImage(results[0].url, `${concept.conceptName} — ${results[0].label}`);
      }

      toast.success(`${results.length} concept visual${results.length > 1 ? "s" : ""} generated!`);
    } else {
      toast.error("Could not generate visuals — try again later.");
    }
  }, [generateSingleVisual, analysis, concept]);

  const regenerateVisual = useCallback(async (index: number) => {
    setGeneratingIdx(index);
    const visual = await generateSingleVisual(index);
    if (visual) {
      const updated = [...visuals];
      updated[index] = visual;
      setVisuals(updated);

      // Persist
      const updatedData = { ...(analysis.redesignData as any), redesignVisuals: updated };
      analysis.setRedesignData(updatedData);
      analysis.saveStepData("redesign", updatedData);

      toast.success("Visual regenerated!");
    }
    setGeneratingIdx(null);
  }, [visuals, generateSingleVisual, analysis]);

  const selectForPitch = useCallback((visual: RedesignVisual) => {
    const label = visual.source === "redesign"
      ? `${concept.conceptName} — ${visual.label}`
      : visual.label;
    analysis.setPitchDeckImage(visual.url, label);
    toast.success("Visual selected for pitch deck");
  }, [analysis, concept]);

  const removeFromPitch = useCallback((url: string) => {
    analysis.removePitchDeckImage(url);
  }, [analysis]);

  const addDisruptVisual = useCallback((img: { url: string; ideaName: string }) => {
    const newVisual: RedesignVisual = {
      url: img.url,
      label: img.ideaName,
      description: "From Disrupt step flipped ideas",
      source: "disrupt",
    };
    const updated = [...visuals, newVisual];
    setVisuals(updated);

    // Persist
    const updatedData = { ...(analysis.redesignData as any), redesignVisuals: updated };
    analysis.setRedesignData(updatedData);
    analysis.saveStepData("redesign", updatedData);

    setShowDisruptPicker(false);
    toast.success("Disrupt visual added to redesign gallery");
  }, [visuals, analysis]);

  const removeVisual = useCallback((index: number) => {
    const removed = visuals[index];
    const updated = visuals.filter((_, i) => i !== index);
    setVisuals(updated);

    // Remove from pitch deck if selected
    if (removed) {
      analysis.removePitchDeckImage(removed.url);
    }

    // Persist
    const updatedData = { ...(analysis.redesignData as any), redesignVisuals: updated };
    analysis.setRedesignData(updatedData);
    analysis.saveStepData("redesign", updatedData);
  }, [visuals, analysis]);

  // Auto-generate on first mount if no visuals exist and concept data is available
  useEffect(() => {
    const existing = (analysis.redesignData as any)?.redesignVisuals;
    if ((!existing || existing.length === 0) && concept.conceptName && !generating) {
      generateAllVisuals();
    }
  }, [concept.conceptName]); // eslint-disable-line react-hooks/exhaustive-deps

  // Empty state — no visuals yet
  if (visuals.length === 0 && !generating) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Image className="h-4 w-4" style={{ color: accentColor }} />
          <h4 className="text-sm font-bold text-foreground">Concept Visuals</h4>
        </div>

        <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center rounded-lg" style={{ background: "hsl(var(--muted))", border: "1px dashed hsl(var(--border))" }}>
          <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: `${accentColor}15` }}>
            <Sparkles size={24} style={{ color: accentColor }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Generate concept visuals</p>
            <p className="text-xs text-muted-foreground max-w-sm">
              Create up to 3 AI-generated visuals of your redesigned concept — hero shot, lifestyle, and technical detail.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={generateAllVisuals}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors"
              style={{ background: accentColor, color: "white" }}
            >
              <Sparkles size={13} /> Generate 3 Visuals
            </button>
            {disruptVisuals.length > 0 && (
              <button
                onClick={() => setShowDisruptPicker(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors bg-secondary text-foreground border border-border"
              >
                <Layers size={13} /> Use Disrupt Visuals
              </button>
            )}
          </div>
        </div>

        {/* Disrupt visual picker */}
        {showDisruptPicker && <DisruptVisualPicker images={disruptVisuals} onSelect={addDisruptVisual} onClose={() => setShowDisruptPicker(false)} />}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image className="h-4 w-4" style={{ color: accentColor }} />
          <h4 className="text-sm font-bold text-foreground">Concept Visuals</h4>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>
            {visuals.length} generated · {analysis.pitchDeckImages.length}/2 selected for pitch
          </span>
        </div>
        <div className="flex gap-1.5">
          {disruptVisuals.length > 0 && (
            <button
              onClick={() => setShowDisruptPicker(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-secondary text-foreground border border-border"
            >
              <Layers size={10} /> Swap Disrupt Visual
            </button>
          )}
          <button
            onClick={generateAllVisuals}
            disabled={generating}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors"
            style={{ background: "hsl(var(--secondary))", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))" }}
          >
            {generating ? <RefreshCw size={10} className="animate-spin" /> : <RefreshCw size={10} />}
            Regenerate All
          </button>
        </div>
      </div>

      {/* Visual grid — larger cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {visuals.map((visual, i) => {
            const images = Array.isArray(analysis.pitchDeckImages) ? analysis.pitchDeckImages : [];
            const isSelected = images.some(img => img.url === visual.url);
            const pitchFull = images.length >= 2 && !isSelected;

            return (
              <motion.div
                key={visual.url}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="rounded-xl overflow-hidden relative group"
                style={{
                  border: isSelected ? `2.5px solid ${accentColor}` : "1px solid hsl(var(--border))",
                  boxShadow: isSelected ? `0 0 20px ${accentColor}25` : "0 2px 8px -2px hsl(var(--foreground) / 0.08)",
                }}
              >
                {/* Action buttons overlay */}
                <div className="absolute top-3 right-3 z-10 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setFullscreenUrl(visual.url)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center backdrop-blur-sm"
                    style={{ background: "hsl(var(--background) / 0.85)", border: "1px solid hsl(var(--border))" }}
                    title="View fullscreen"
                  >
                    <Maximize2 size={14} className="text-foreground" />
                  </button>
                  <button
                    onClick={() => regenerateVisual(i)}
                    disabled={generating}
                    className="w-8 h-8 rounded-lg flex items-center justify-center backdrop-blur-sm"
                    style={{ background: "hsl(var(--background) / 0.85)", border: "1px solid hsl(var(--border))" }}
                    title="Regenerate"
                  >
                    <RefreshCw size={13} className={`text-foreground ${generatingIdx === i ? "animate-spin" : ""}`} />
                  </button>
                  <button
                    onClick={() => removeVisual(i)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center backdrop-blur-sm"
                    style={{ background: "hsl(var(--background) / 0.85)", border: "1px solid hsl(var(--border))" }}
                    title="Remove"
                  >
                    <X size={13} className="text-foreground" />
                  </button>
                </div>

                {generatingIdx === i ? (
                  <div className="w-full h-64 sm:h-72 flex flex-col items-center justify-center gap-2" style={{ background: "hsl(var(--muted))" }}>
                    <RefreshCw size={22} className="animate-spin text-foreground/40" />
                    <p className="text-sm text-foreground/60 font-semibold">Generating {visual.label}...</p>
                  </div>
                ) : (
                  <img
                    src={visual.url}
                    alt={visual.label}
                    className="w-full h-64 sm:h-72 object-cover cursor-pointer"
                    onClick={() => setFullscreenUrl(visual.url)}
                  />
                )}

                <div className="p-3.5 space-y-2" style={{ background: "hsl(var(--card))" }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-foreground">{visual.label}</p>
                      <p className="text-xs text-foreground/60 font-medium">
                        {visual.source === "disrupt" ? "From Disrupt" : "AI Generated"}
                      </p>
                    </div>
                  </div>

                  {/* Pitch deck selection */}
                  <button
                    onClick={() => isSelected ? removeFromPitch(visual.url) : selectForPitch(visual)}
                    disabled={pitchFull}
                    className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                      isSelected
                        ? "text-white"
                        : pitchFull
                          ? "text-foreground/40 cursor-not-allowed"
                          : "text-foreground border hover:border-primary/40"
                    }`}
                    style={
                      isSelected
                        ? { background: accentColor }
                        : pitchFull
                          ? { background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }
                          : { background: "hsl(var(--secondary))", border: "1px solid hsl(var(--border))" }
                    }
                  >
                    {isSelected ? (
                      <><CheckCircle2 size={13} /> Selected for Pitch Deck</>
                    ) : pitchFull ? (
                      "Max 2 selected"
                    ) : (
                      <><ArrowRight size={13} /> Use in Pitch Deck</>
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}

          {/* Generating placeholders */}
          {generating && visuals.length < 3 && Array.from({ length: Math.min(2, 3 - visuals.length) }).map((_, i) => (
            <motion.div
              key={`placeholder-${i}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-xl overflow-hidden"
              style={{ border: "1px dashed hsl(var(--border))" }}
            >
              <div className="w-full h-64 sm:h-72 flex flex-col items-center justify-center gap-3" style={{ background: "hsl(var(--muted))" }}>
                <RefreshCw size={22} className="animate-spin text-foreground/30" />
                <p className="text-sm text-foreground/50 font-semibold">
                  {VISUAL_PROMPTS[visuals.length + i]?.label || "Generating..."}
                </p>
              </div>
              <div className="p-3.5" style={{ background: "hsl(var(--card))" }}>
                <div className="h-5 w-28 rounded bg-muted animate-pulse" />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Disrupt visual picker overlay */}
      {showDisruptPicker && <DisruptVisualPicker images={disruptVisuals} onSelect={addDisruptVisual} onClose={() => setShowDisruptPicker(false)} />}

      {/* Fullscreen lightbox */}
      <AnimatePresence>
        {fullscreenUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-8"
            style={{ background: "hsl(var(--foreground) / 0.85)" }}
            onClick={() => setFullscreenUrl(null)}
          >
            <button
              onClick={() => setFullscreenUrl(null)}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 rounded-full flex items-center justify-center z-10"
              style={{ background: "hsl(var(--background) / 0.9)", border: "1px solid hsl(var(--border))" }}
            >
              <X size={18} className="text-foreground" />
            </button>
            <motion.img
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              src={fullscreenUrl}
              alt="Concept visual"
              className="max-w-full max-h-full rounded-xl object-contain"
              style={{ boxShadow: "0 20px 60px -10px hsl(var(--foreground) / 0.5)" }}
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Picker for swapping in Disrupt-step flipped idea visuals */
function DisruptVisualPicker({
  images,
  onSelect,
  onClose,
}: {
  images: { url: string; ideaName: string }[];
  onSelect: (img: { url: string; ideaName: string }) => void;
  onClose: () => void;
}) {
  if (images.length === 0) {
    return (
      <div className="p-4 rounded-lg text-center" style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}>
        <p className="text-xs text-muted-foreground">No visuals generated in the Disrupt step yet. Generate mockups from your Flipped Ideas first.</p>
        <button onClick={onClose} className="mt-2 text-xs text-primary font-semibold">Close</button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-lg space-y-3"
      style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-foreground">Select a Disrupt visual to add</p>
        <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => onSelect(img)}
            className="rounded-lg overflow-hidden text-left transition-all hover:ring-2 hover:ring-primary/40"
            style={{ border: "1px solid hsl(var(--border))" }}
          >
            <img src={img.url} alt={img.ideaName} className="w-full h-28 object-cover" />
            <div className="p-2" style={{ background: "hsl(var(--card))" }}>
              <p className="text-[10px] font-semibold text-foreground truncate">{img.ideaName}</p>
              <p className="text-[9px] text-muted-foreground">From Flipped Ideas</p>
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
