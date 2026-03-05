import React, { useState } from "react";
import { motion } from "framer-motion";
import { Brain, RefreshCw, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Shown when governed reasoning data is missing or incomplete.
 * Offers a one-click "Regenerate Reasoning" action.
 */

interface GovernedMissingBannerProps {
  businessAnalysisData: Record<string, unknown> | null;
  businessModelInput: { type?: string; description?: string } | null;
  onGovernedReady: (governed: Record<string, unknown>) => void;
}

export function GovernedMissingBanner({ businessAnalysisData, businessModelInput, onGovernedReady }: GovernedMissingBannerProps) {
  const [loading, setLoading] = useState(false);

  const governed = businessAnalysisData?.governed as Record<string, unknown> | undefined;
  const isIncomplete = !governed || businessAnalysisData?._governedIncomplete === true;

  if (!isIncomplete) return null;

  const handleRegenerate = async () => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("business-model-analysis", {
        body: {
          businessModel: businessModelInput || { type: "Business", description: "Regenerate reasoning" },
          userSuggestions: "Focus on generating complete governed reasoning artifacts (domain_confirmation, first_principles, friction_tiers, constraint_map, decision_synthesis, reasoning_synopsis). The primary business analysis tabs are already complete.",
        },
      });

      if (error || !result?.success) {
        toast.error("Reasoning regeneration failed — try again");
        return;
      }

      const newGoverned = result.analysis?.governed as Record<string, unknown> | undefined;
      if (newGoverned && !result.analysis?._governedIncomplete) {
        onGovernedReady(newGoverned);
        toast.success("Reasoning data regenerated successfully");
      } else {
        toast.error("Reasoning still incomplete — AI may need a simpler prompt");
      }
    } catch (err) {
      toast.error("Unexpected error: " + String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl p-4 flex items-start gap-3"
      style={{
        background: "hsl(38 92% 50% / 0.08)",
        border: "1px solid hsl(38 92% 50% / 0.2)",
      }}
    >
      <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" style={{ color: "hsl(38 92% 50%)" }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground">Reasoning data unavailable</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
          The AI generated your analysis tabs but couldn't produce the full reasoning framework. 
          Causal maps, decision synthesis, and confidence scoring are disabled. You can regenerate to try again.
        </p>
      </div>
      <button
        onClick={handleRegenerate}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold flex-shrink-0 transition-colors disabled:opacity-50"
        style={{
          background: "hsl(38 92% 50% / 0.15)",
          color: "hsl(38 92% 50%)",
        }}
      >
        {loading ? <RefreshCw size={12} className="animate-spin" /> : <Brain size={12} />}
        {loading ? "Regenerating…" : "Regenerate"}
      </button>
    </motion.div>
  );
}
