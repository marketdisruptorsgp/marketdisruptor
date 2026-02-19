import { useState } from "react";
import { TrendingUp, ExternalLink, Rocket, Clock, DollarSign, CheckCircle2, Zap, Sparkles, ImageIcon, RefreshCw } from "lucide-react";
import type { FlippedIdea } from "@/data/mockProducts";
import { ScoreBar } from "./ScoreBar";
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
        if (msg.includes("429") || msg.toLowerCase().includes("rate limit")) {
          toast.error("Rate limit hit — try again in a moment.");
        } else if (msg.includes("402") || msg.toLowerCase().includes("credit")) {
          toast.error("AI credits exhausted. Add credits in Settings → Workspace → Usage.");
        } else {
          toast.error("Could not generate visual: " + msg);
        }
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
        className="absolute -top-3 -right-3 w-16 h-16 rounded-full opacity-10"
        style={{ background: "hsl(var(--primary))" }}
      />

      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="step-badge flex-shrink-0">#{rank}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-bold text-foreground text-base">{idea.name}</h4>
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
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
          <div className="relative rounded-xl overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
            <img
              src={mockupImage}
              alt={`AI mockup of ${idea.name}`}
              className="w-full object-cover rounded-xl"
              style={{ maxHeight: "320px", objectPosition: "center" }}
            />
            <div
              className="absolute bottom-0 left-0 right-0 px-3 py-2 text-[10px] font-semibold"
              style={{ background: "hsl(220 20% 5% / 0.6)", color: "white" }}
            >
              ✦ AI-generated concept mockup · {idea.name}
            </div>
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center gap-2 rounded-xl py-8 text-center cursor-pointer border-2 border-dashed transition-all hover:border-primary/50"
            style={{ borderColor: "hsl(var(--primary) / 0.2)", background: "hsl(var(--primary-muted))" }}
            onClick={handleGenerateVisual}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "hsl(var(--primary) / 0.15)" }}
            >
              <Sparkles size={18} style={{ color: "hsl(var(--primary))" }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: "hsl(var(--primary))" }}>
              Generate AI Product Visual
            </p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Click to generate a concept mockup image of this redesigned product using AI
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

      {/* Reasoning */}
      <div
        className="p-3 rounded-lg text-xs leading-relaxed"
        style={{
          background: "hsl(var(--primary-muted))",
          color: "hsl(var(--primary-dark))",
          borderLeft: "3px solid hsl(var(--primary))",
        }}
      >
        <span className="font-semibold">Market Reasoning: </span>
        {idea.reasoning}
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
        <div className="space-y-3 pt-2 border-t" style={{ borderColor: "hsl(var(--border))" }}>
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
                className="p-2.5 rounded-lg text-xs"
                style={{
                  background: i === 0 ? "hsl(142 70% 45% / 0.08)" : i === 1 ? "hsl(var(--primary) / 0.06)" : "hsl(var(--muted))",
                  borderLeft: `3px solid ${i === 0 ? "hsl(142 70% 45%)" : i === 1 ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.4)"}`,
                }}
              >
                <p className="font-semibold mb-0.5" style={{ color: i === 0 ? "hsl(142 70% 35%)" : "hsl(var(--primary-dark))" }}>
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
            <div className="flex items-center gap-1" style={{ color: "hsl(var(--score-high))" }}>
              <TrendingUp size={10} />
              <span className="font-semibold">{idea.actionPlan.revenueProjection}</span>
            </div>
          </div>

          {idea.actionPlan.channels && (
            <div className="flex flex-wrap gap-1">
              {idea.actionPlan.channels.map((ch) => (
                <span
                  key={ch}
                  className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                  style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}
                >
                  {ch}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Risks */}
      <div
        className="flex items-start gap-2 p-3 rounded-lg text-xs"
        style={{
          background: "hsl(var(--destructive) / 0.06)",
          color: "hsl(var(--destructive))",
        }}
      >
        <span className="font-semibold flex-shrink-0">⚠ Risks:</span>
        <span>{idea.risks}</span>
      </div>
    </div>
  );
};
