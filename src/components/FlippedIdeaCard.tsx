import { useState } from "react";
import { TrendingUp, RefreshCw, Sparkles, ImageIcon, Rocket, DollarSign, Clock } from "lucide-react";
import type { FlippedIdea } from "@/data/mockProducts";
import { ScoreBar } from "./ScoreBar";
import { RiskBadge } from "./RiskBadge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FlippedIdeaCardProps {
  idea: FlippedIdea;
  rank: number;
  productName?: string;
}

export const FlippedIdeaCard = ({ idea, rank, productName }: FlippedIdeaCardProps) => {
  const [mockupImage, setMockupImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const avgScore =
    (idea.scores.feasibility +
      idea.scores.desirability +
      idea.scores.profitability +
      idea.scores.novelty) /
    4;

  const handleGenerateVisual = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-product-visual", {
        body: {
          ideaName: idea.name,
          description: idea.description,
          visualNotes: idea.visualNotes,
          productName: productName || "vintage product",
        },
      });

      if (error || !data?.success) {
        const msg = data?.error || error?.message || "Image generation failed";
        toast.error(msg);
        return;
      }

      setMockupImage(data.imageUrl);
      toast.success("Product visual generated!");
    } catch (err) {
      toast.error("Visual generation failed.");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="card-intelligence p-5 space-y-4 relative overflow-hidden">
      {/* Rank accent */}
      <div
        className="absolute -top-3 -right-3 w-16 h-16 rounded-full opacity-5 bg-primary"
      />

      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="step-badge flex-shrink-0">#{rank}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-bold text-foreground text-base">{idea.name}</h4>
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold"
              style={{
                background: avgScore >= 8 ? "hsl(var(--score-high) / 0.15)" : "hsl(var(--primary) / 0.12)",
                color: avgScore >= 8 ? "hsl(var(--score-high))" : "hsl(var(--primary))",
              }}
            >
              <TrendingUp size={10} />
              Avg {avgScore.toFixed(1)}/10
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{idea.description}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <RiskBadge type="Risk" level={(idea as unknown as Record<string, unknown>).riskLevel as string} />
            <RiskBadge type="Capital" level={(idea as unknown as Record<string, unknown>).capitalRequired as string} />
          </div>
        </div>
      </div>

      {/* AI Visual Mockup */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="section-label text-[10px] flex items-center gap-1">
            <ImageIcon size={10} /> AI Product Visual
          </p>
          <button
            type="button"
            onClick={handleGenerateVisual}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all"
            style={{
              background: isGenerating ? "hsl(var(--muted))" : "hsl(var(--primary))",
              color: isGenerating ? "hsl(var(--muted-foreground))" : "white",
              opacity: isGenerating ? 0.8 : 1,
            }}
          >
            {isGenerating ? (
              <>
                <RefreshCw size={11} className="animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles size={11} />
                {mockupImage ? "Regenerate Visual" : "Generate Visual"}
              </>
            )}
          </button>
        </div>

        {mockupImage ? (
          <div className="relative rounded overflow-hidden bg-muted">
            <img
              src={mockupImage}
              alt={`AI mockup of ${idea.name}`}
              className="w-full object-cover rounded"
              style={{ maxHeight: "320px", objectPosition: "center" }}
            />
            <div
              className="absolute bottom-0 left-0 right-0 px-3 py-2 text-[10px] font-semibold bg-black/60 text-white"
            >
              ✦ AI-generated concept mockup · {idea.name}
            </div>
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center gap-2 rounded py-8 text-center cursor-pointer border border-dashed transition-all hover:border-primary/50 bg-muted/30 border-border"
            onClick={handleGenerateVisual}
          >
            <div
              className="w-10 h-10 rounded flex items-center justify-center bg-primary/10"
            >
              <Sparkles size={18} className="text-primary" />
            </div>
            <p className="text-sm font-semibold text-primary">
              Generate AI Product Visual
            </p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Click to generate a concept mockup image
            </p>
          </div>
        )}
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div className="space-y-1">
          <p className="section-label text-[10px]">Visual / Mockup Notes</p>
          <p className="text-foreground/80 text-xs leading-relaxed">{idea.visualNotes}</p>
        </div>
        <div className="space-y-1">
          <p className="section-label text-[10px]">Feasibility & Unit Economics</p>
          <p className="text-foreground/80 text-xs leading-relaxed">{idea.feasibilityNotes}</p>
        </div>
      </div>

      {/* Scores */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        <ScoreBar label="Feasibility" score={idea.scores.feasibility} />
        <ScoreBar label="Desirability" score={idea.scores.desirability} />
        <ScoreBar label="Profitability" score={idea.scores.profitability} />
        <ScoreBar label="Novelty" score={idea.scores.novelty} />
      </div>

      {/* Action Plan */}
      {idea.actionPlan && (
        <div className="space-y-3 pt-2 border-t border-border">
          <p className="section-label text-[10px] flex items-center gap-1">
            <Rocket size={11} /> Action Plan
          </p>
          <div className="grid grid-cols-1 gap-2">
            {[
              { label: "Phase 1 (0–60 days)", text: idea.actionPlan.phase1 },
              { label: "Phase 2 (3–6 months)", text: idea.actionPlan.phase2 },
              { label: "Phase 3 (7–18 months)", text: idea.actionPlan.phase3 },
            ].map((phase, i) => (
              <div
                key={i}
                className="p-2.5 rounded text-xs bg-muted border border-border"
              >
                <p className="font-semibold mb-0.5 text-primary">
                  {phase.label}
                </p>
                <p className="text-foreground/75 leading-relaxed">{phase.text}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2 text-[10px]">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock size={10} />
              <span>{idea.actionPlan.timeline}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <DollarSign size={10} />
              <span>{idea.actionPlan.estimatedInvestment}</span>
            </div>
            <div className="flex items-center gap-1 text-success">
              <TrendingUp size={10} />
              <span className="font-semibold">{idea.actionPlan.revenueProjection}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};