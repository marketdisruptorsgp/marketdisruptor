import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Download, Award, CheckCircle2, ArrowRight, Clock } from "lucide-react";
import { ReferralCTA } from "@/components/ReferralCTA";
import { AnalysisTimeline } from "@/components/analysis/AnalysisTimeline";
import { EvolutionView } from "@/components/analysis/EvolutionView";

const SUCCESS_MESSAGES = [
  { type: "opportunity", prefix: "Opportunity Identified", emoji: "🎯" },
  { type: "disruption", prefix: "Disruption Potential Unlocked", emoji: "⚡" },
  { type: "reframe", prefix: "Creative Reframe Complete", emoji: "🔄" },
  { type: "breakthrough", prefix: "Breakthrough Insight Captured", emoji: "💡" },
];

interface CompletionExperienceProps {
  productName: string;
  completionMessage: string;
  onExportPDF: () => void;
  onBackToSections: () => void;
  accentColor: string;
  analysisData?: Record<string, unknown> | null;
  createdAt?: string;
}

export function CompletionExperience({
  productName,
  completionMessage,
  onExportPDF,
  onBackToSections,
  accentColor,
  analysisData,
  createdAt,
}: CompletionExperienceProps) {
  const navigate = useNavigate();
  const [msgIndex] = useState(() => Math.floor(Math.random() * SUCCESS_MESSAGES.length));
  const chosen = SUCCESS_MESSAGES[msgIndex];

  return (
    <div className="space-y-6">
      <div
        className="p-8 rounded-2xl text-center space-y-5"
        style={{
          background: `linear-gradient(135deg, ${accentColor}14, ${accentColor}08)`,
          border: `2px solid ${accentColor}33`,
        }}
      >
        <div
          className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
          style={{ background: accentColor }}
        >
          <Sparkles size={28} className="text-white" />
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: accentColor }}>
            {chosen.emoji} {chosen.prefix}
          </p>
          <h3 className="text-xl font-bold text-foreground mb-2">Analysis Complete</h3>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Your full investor-grade analysis for <strong className="text-foreground">{productName}</strong> is ready for review.
          </p>
        </div>

        <div
          className="p-4 rounded-xl max-w-lg mx-auto"
          style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: accentColor }}>
            Strategic Insight
          </p>
          <p className="text-sm text-foreground/80 leading-relaxed italic">"{completionMessage}"</p>
        </div>

        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button
            onClick={onExportPDF}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-bold transition-colors"
            style={{ background: accentColor, color: "white" }}
          >
            <Download size={14} /> Export PDF
          </button>
          <button
            onClick={() => navigate("/portfolio")}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-bold transition-colors"
            style={{
              background: "hsl(var(--muted))",
              color: "hsl(var(--foreground))",
              border: "1px solid hsl(var(--border))",
            }}
          >
            <Award size={14} /> View Portfolio <ArrowRight size={12} />
          </button>
        </div>

        <p className="text-[11px] text-muted-foreground">
          <CheckCircle2
            size={10}
            className="inline mr-1"
            style={{ color: "hsl(142 70% 40%)" }}
          />
          Project saved to your portfolio
        </p>
      </div>

      {/* Evolution View */}
      {analysisData && (
        <div className="rounded-xl p-4" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <div className="flex items-center gap-2 mb-3">
            <Clock size={13} style={{ color: accentColor }} />
            <p className="text-xs font-bold text-foreground">Analysis Journey</p>
          </div>
          <EvolutionView analysisData={analysisData} productName={productName} accentColor={accentColor} />
        </div>
      )}

      {/* Timeline */}
      {analysisData && createdAt && (
        <div className="rounded-xl p-4" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <div className="flex items-center gap-2 mb-3">
            <Clock size={13} style={{ color: accentColor }} />
            <p className="text-xs font-bold text-foreground">Analysis Timeline</p>
          </div>
          <AnalysisTimeline analysisData={analysisData} createdAt={createdAt} accentColor={accentColor} />
        </div>
      )}

      <button
        onClick={onBackToSections}
        className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Back to deck sections
      </button>

      <ReferralCTA />
    </div>
  );
}
