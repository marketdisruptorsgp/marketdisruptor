import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Download, Award, CheckCircle2, ArrowRight, Clock, Rocket, Mail } from "lucide-react";
import { ReferralCTA } from "@/components/ReferralCTA";
import { AnalysisTimeline } from "@/components/analysis/AnalysisTimeline";
import { EvolutionView } from "@/components/analysis/EvolutionView";

const SUCCESS_MESSAGES = [
  { type: "opportunity", prefix: "Opportunity Identified", emoji: "🎯" },
  { type: "disruption", prefix: "Disruption Potential Unlocked", emoji: "⚡" },
  { type: "reframe", prefix: "Creative Reframe Complete", emoji: "🔄" },
  { type: "breakthrough", prefix: "Breakthrough Insight Captured", emoji: "💡" },
];

interface SGPCapitalContext {
  product: { name: string; category?: string; revivalScore?: number; supplyChain?: { manufacturers?: { region?: string }[] } };
  profile?: { first_name?: string } | null;
  user?: { email?: string } | null;
  userScore?: number;
  analysisId?: string;
}

interface CompletionExperienceProps {
  productName: string;
  completionMessage: string;
  onExportPDF: () => void;
  onBackToSections: () => void;
  accentColor: string;
  analysisData?: Record<string, unknown> | null;
  createdAt?: string;
  sgpCapitalContext?: SGPCapitalContext;
}

export function CompletionExperience({
  productName,
  completionMessage,
  onExportPDF,
  onBackToSections,
  accentColor,
  analysisData,
  createdAt,
  sgpCapitalContext,
}: CompletionExperienceProps) {
  const navigate = useNavigate();
  const [msgIndex] = useState(() => Math.floor(Math.random() * SUCCESS_MESSAGES.length));
  const chosen = SUCCESS_MESSAGES[msgIndex];

  const buildSGPMailto = () => {
    if (!sgpCapitalContext) return "";
    const { product, profile, user, userScore, analysisId } = sgpCapitalContext;
    const name = profile?.first_name || "there";
    const email = user?.email || "";
    const projectUrl = analysisId
      ? `http://marketdisruptor.sgpcapital.com/analysis/${analysisId}/pitch`
      : "http://marketdisruptor.sgpcapital.com";
    const lines = [
      `Hi SGP Capital team,`, ``,
      `I've been working through a disruption analysis on ${product.name} in the ${product.category || "this"} space and I think there's real potential here.`, ``,
    ];
    if (product.revivalScore) { lines.push(`The AI scored it ${product.revivalScore}/10 for revival potential and I rated it ${userScore}/10.`); lines.push(``); }
    lines.push(`You can view my full analysis here:`);
    lines.push(projectUrl);
    lines.push(``);
    lines.push(`Best,`);
    lines.push(name);
    if (email) lines.push(email);
    return `mailto:steven@sgpcapital.com?subject=${encodeURIComponent(`Help Disrupt: ${product.name}`)}&body=${encodeURIComponent(lines.join("\n"))}`;
  };

  return (
    <div className="space-y-6">
      <div
        className="p-8 rounded-md text-center space-y-5"
        style={{
          background: "hsl(var(--muted))",
          border: "1px solid hsl(var(--border))",
        }}
      >
        <div
          className="w-16 h-16 rounded-md mx-auto flex items-center justify-center"
          style={{ background: "hsl(var(--foreground))" }}
        >
          <Sparkles size={28} style={{ color: "hsl(var(--background))" }} />
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
            {chosen.emoji} {chosen.prefix}
          </p>
          <h3 className="text-xl font-bold text-foreground mb-2">Analysis Complete</h3>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Your full investor-grade analysis for <strong className="text-foreground">{productName}</strong> is ready for review.
          </p>
        </div>

        <div
          className="p-4 rounded-md max-w-lg mx-auto"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
            Strategic Insight
          </p>
          <p className="text-sm text-foreground/85 leading-relaxed italic">"{completionMessage}"</p>
        </div>

        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button
            onClick={onExportPDF}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-md text-sm font-bold transition-colors"
            style={{ background: "hsl(var(--foreground))", color: "hsl(var(--background))" }}
          >
            <Download size={14} /> Export PDF
          </button>
          <button
            onClick={() => navigate("/portfolio")}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-md text-sm font-bold transition-colors"
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

      {/* SGP Capital Partnership CTA */}
      {sgpCapitalContext && (
        <div className="rounded-md overflow-hidden" style={{ border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}>
          <div className="px-5 py-5 space-y-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Partnership</p>
              <h4 className="text-sm font-bold text-foreground">How SGP Capital Can Help</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">Tailored support for bringing {productName} to market</p>
            </div>
            <div className="space-y-2">
              {(() => {
                const p = sgpCapitalContext.product;
                const bullets: string[] = [];
                if (p.supplyChain?.manufacturers?.length) bullets.push(`Connect with manufacturers & suppliers in ${p.supplyChain.manufacturers[0]?.region || "key regions"}`);
                bullets.push("Investor introductions & fundraising strategy");
                bullets.push("Sales, marketing & go-to-market execution");
                if (p.category) bullets.push(`Strategic positioning in the ${p.category} space`);
                return bullets.slice(0, 4).map((b, i) => (
                  <div key={i} className="flex gap-2.5 items-start">
                    <span className="text-muted-foreground font-bold flex-shrink-0 mt-px text-sm">—</span>
                    <p className="text-[13px] text-foreground/85 leading-relaxed">{b}</p>
                  </div>
                ));
              })()}
            </div>
            <a
              href={buildSGPMailto()}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-md text-sm font-bold transition-opacity hover:opacity-90"
              style={{ background: "hsl(var(--foreground))", color: "hsl(var(--background))" }}>
              <Mail size={14} /> Contact SGP Capital
            </a>
          </div>
        </div>
      )}

      {/* Evolution View */}
      {analysisData && (
        <div className="rounded-md p-4" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <div className="flex items-center gap-2 mb-3">
            <Clock size={13} className="text-muted-foreground" />
            <p className="text-xs font-bold text-foreground">Analysis Journey</p>
          </div>
          <EvolutionView analysisData={analysisData} productName={productName} accentColor={accentColor} />
        </div>
      )}

      {/* Timeline */}
      {analysisData && createdAt && (
        <div className="rounded-md p-4" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
          <div className="flex items-center gap-2 mb-3">
            <Clock size={13} className="text-muted-foreground" />
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
