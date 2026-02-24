import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { X, ArrowRight } from "lucide-react";
import { getCompletedSteps } from "@/components/StepProgressDots";

interface ContinueBannerProps {
  onContinue: (analysis: unknown) => void;
}

const MODE_COLORS: Record<string, string> = {
  product: "hsl(var(--primary))",
  service: "hsl(340 75% 50%)",
  business_model: "hsl(271 81% 55%)",
};

export function ContinueBanner({ onContinue }: ContinueBannerProps) {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [recentAnalysis, setRecentAnalysis] = useState<{
    id: string;
    title: string;
    analysis_type?: string;
    analysis_data: Record<string, unknown> | null;
    products: unknown;
    category: string;
    era: string;
    batch_size: number;
  } | null>(null);
  const [stepsCompleted, setStepsCompleted] = useState(0);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { data } = await supabase
        .from("saved_analyses")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        const a = data[0] as typeof recentAnalysis;
        const completed = getCompletedSteps(
          a?.analysis_data as Record<string, unknown> | null,
          a?.analysis_type
        );
        if (completed.size < 5) {
          setRecentAnalysis(a);
          setStepsCompleted(completed.size);
        }
      }
    })();
  }, [user?.id]);

  if (dismissed || !recentAnalysis || stepsCompleted >= 5) return null;

  const accent = MODE_COLORS[recentAnalysis.analysis_type || "product"] || MODE_COLORS.product;

  return (
    <div
      className="rounded-lg p-4 flex items-center gap-4 group"
      style={{
        background: "hsl(var(--card))",
        border: "1px solid hsl(var(--border))",
        borderLeft: `4px solid ${accent}`,
      }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground truncate">{recentAnalysis.title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          You've explored {stepsCompleted} of 5 steps
        </p>
      </div>
      <button
        onClick={() => onContinue(recentAnalysis)}
        className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white flex-shrink-0 transition-opacity hover:opacity-90"
        style={{ background: accent }}
      >
        Continue <ArrowRight size={12} />
      </button>
      <button
        onClick={() => setDismissed(true)}
        className="p-1 rounded flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X size={14} className="text-muted-foreground" />
      </button>
    </div>
  );
}
