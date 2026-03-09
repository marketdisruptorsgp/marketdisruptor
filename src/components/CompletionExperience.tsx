import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Download, Award, CheckCircle2, ArrowRight, Clock, Rocket, Mail } from "lucide-react";
import { ReferralCTA } from "@/components/ReferralCTA";
import { AnalysisTimeline } from "@/components/analysis/AnalysisTimeline";
import { EvolutionView } from "@/components/analysis/EvolutionView";
import { buildPublicUrl } from "@/lib/publicUrl";

const SUCCESS_MESSAGES = [
  { type: "opportunity", prefix: "Opportunity Identified" },
  { type: "disruption", prefix: "Disruption Potential Unlocked" },
  { type: "reframe", prefix: "Creative Reframe Complete" },
  { type: "breakthrough", prefix: "Breakthrough Insight Captured" },
];

const SUCCESS_GREEN = "142 70% 40%";

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
      ? buildPublicUrl(`/analysis/${analysisId}/pitch`)
      : buildPublicUrl("/");
    const lines = [
      `Hi SGP Capital team,`, ``,
      `I've been working through a disruption analysis on ${product.name} in the ${product.category || "this"} space and I think there's real potential here.`, ``,
    ];
    if (product.revivalScore) { lines.push(`The analysis identified strong revival potential with clear strategic opportunity.`); lines.push(``); }
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
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="p-8 rounded-xl text-center space-y-6"
        style={{
          background: `linear-gradient(135deg, hsl(${SUCCESS_GREEN} / 0.06), hsl(${SUCCESS_GREEN} / 0.02))`,
          border: `1.5px solid hsl(${SUCCESS_GREEN} / 0.25)`,
        }}
      >
        {/* Celebratory icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
          className="w-20 h-20 rounded-full mx-auto flex items-center justify-center"
          style={{ background: `hsl(${SUCCESS_GREEN})`, boxShadow: `0 8px 32px -8px hsl(${SUCCESS_GREEN} / 0.45)` }}
        >
          <Sparkles size={34} style={{ color: "white" }} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="space-y-2"
        >
          <p
            className="typo-card-eyebrow tracking-widest uppercase"
            style={{ color: `hsl(${SUCCESS_GREEN})` }}
          >
            {chosen.prefix}
          </p>
          <h3 className="text-2xl md:text-3xl font-bold text-foreground">
            Analysis Complete
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            Congratulations — your full investor-grade analysis for{" "}
            <strong className="text-foreground">{productName}</strong> is ready.
            Time to disrupt.
          </p>
        </motion.div>

        <div
          className="p-4 rounded-xl max-w-lg mx-auto"
          style={{
            background: "hsl(var(--card))",
            border: `1px solid hsl(${SUCCESS_GREEN} / 0.2)`,
          }}
        >
          <p className="typo-card-eyebrow text-muted-foreground mb-2">
            Strategic Insight
          </p>
          <p className="text-sm text-foreground/85 leading-relaxed italic">"{completionMessage}"</p>
        </div>

        <div className="flex items-center justify-center gap-3 flex-wrap pt-2">
          <button
            onClick={onExportPDF}
            className="flex items-center gap-1.5 px-6 py-3 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]"
            style={{
              background: `hsl(${SUCCESS_GREEN})`,
              color: "white",
              boxShadow: `0 4px 16px -4px hsl(${SUCCESS_GREEN} / 0.4)`,
            }}
          >
            <Download size={14} /> Export PDF
          </button>
          <button
            onClick={() => navigate("/portfolio")}
            className="flex items-center gap-1.5 px-6 py-3 rounded-xl text-sm font-bold transition-colors"
            style={{
              background: "hsl(var(--muted))",
              color: "hsl(var(--foreground))",
              border: "1px solid hsl(var(--border))",
            }}
          >
            <Award size={14} /> View Portfolio <ArrowRight size={12} />
          </button>
        </div>

        <p className="typo-card-meta text-muted-foreground">
          <CheckCircle2
            size={12}
            className="inline mr-1"
            style={{ color: `hsl(${SUCCESS_GREEN})` }}
          />
          Project saved to your portfolio
        </p>
      </motion.div>

      {/* SGP Capital Partnership CTA */}
      {sgpCapitalContext && (
        <div className="rounded-md overflow-hidden" style={{ border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}>
          <div className="px-5 py-5 space-y-4">
            <div>
              <p className="typo-card-eyebrow text-muted-foreground mb-1">Partnership</p>
              <h4 className="text-sm font-bold text-foreground">How SGP Capital Can Help</h4>
              <p className="typo-card-meta text-muted-foreground mt-0.5">Tailored support for bringing {productName} to market</p>
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
